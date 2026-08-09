import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  limit,
  getCountFromServer,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { Category, CategoryDiscount, CategoryHierarchy, CategoryAnalytics, Product } from '@/types/inventory';
import { cleanCategoryData, validateFirestoreData } from '@/utils/firestoreUtils';

export const categoryService = {
  // Basic CRUD operations
  async createCategory(data: Omit<Category, 'id'>) {
    try {
      // Clean the data to remove undefined values
      const cleanedData: any = {
        name: data.name,
        description: data.description || '',
        parentId: data.parentId || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        defaultDiscount: data.defaultDiscount || 0,
        sortOrder: data.sortOrder || 0,
        color: data.color || '#1976d2',
        icon: data.icon || 'category',
        tags: data.tags || [],
        metadata: {
          totalProducts: 0,
          totalValue: 0,
          averagePrice: 0,
          lastUpdated: new Date().toISOString()
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'categories'), cleanedData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  /**
   * OPTIMIZED: Uses getCountFromServer for per-category product counts.
   * Before: N+1 queries (reads ALL products per category)
   * After:  N getCountFromServer calls (0 doc reads, only count metadata)
   * Cost savings: ~100x for categories with many products
   */
  async getCategories(options?: {
    includeInactive?: boolean;
    sortBy?: 'name' | 'createdAt' | 'sortOrder' | 'productCount';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
  }) {
    try {
      let q = collection(db, 'categories');
      
      // Apply filters
      if (!options?.includeInactive) {
        q = query(q, where('isActive', '==', true));
      }
      
      // Apply sorting
      const sortField = options?.sortBy || 'name';
      const sortDirection = options?.sortOrder || 'asc';
      q = query(q, orderBy(sortField, sortDirection));
      
      // Apply limit
      if (options?.limit) {
        q = query(q, limit(options.limit));
      }
      
      const querySnapshot = await getDocs(q);
      const categories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];

      // OPTIMIZED: Use getCountFromServer (free count — 0 doc reads)
      // instead of reading all products per category
      const countPromises = categories.map(async (category) => {
        try {
          const countSnap = await getCountFromServer(
            query(collection(db, 'products'), where('categoryId', '==', category.id!))
          );
          return {
            categoryId: category.id!,
            totalProducts: countSnap.data().count,
            totalValue: category.metadata?.totalValue || 0,
            averagePrice: category.metadata?.averagePrice || 0,
            lastUpdated: new Date().toISOString(),
          };
        } catch {
          return {
            categoryId: category.id!,
            totalProducts: 0,
            totalValue: 0,
            averagePrice: 0,
            lastUpdated: new Date().toISOString(),
          };
        }
      });

      const metadataResults = await Promise.all(countPromises);
      const metadataMap = new Map(metadataResults.map(m => [m.categoryId, m]));

      const enrichedCategories = categories.map(category => ({
        ...category,
        metadata: {
          ...category.metadata,
          ...metadataMap.get(category.id!),
        },
      }));

      return enrichedCategories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  async getCategoryById(id: string) {
    try {
      const categoryDoc = await getDocs(query(collection(db, 'categories'), where('__name__', '==', id)));
      if (categoryDoc.empty) {
        throw new Error('Category not found');
      }
      
      const category = {
        id: categoryDoc.docs[0].id,
        ...categoryDoc.docs[0].data()
      } as Category;

      // Enrich with metadata
      const metadata = await this.getCategoryMetadata(id);
      category.metadata = { ...category.metadata, ...metadata };

      return category;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  },

  async updateCategory(id: string, data: Partial<Category>) {
    try {
      // Clean the data to remove undefined values
      const cleanedData: any = {
        updatedAt: serverTimestamp()
      };

      // Only add fields that are not undefined
      if (data.name !== undefined) cleanedData.name = data.name;
      if (data.description !== undefined) cleanedData.description = data.description || '';
      if (data.parentId !== undefined) cleanedData.parentId = data.parentId || null;
      if (data.isActive !== undefined) cleanedData.isActive = data.isActive;
      if (data.defaultDiscount !== undefined) cleanedData.defaultDiscount = data.defaultDiscount;
      if (data.sortOrder !== undefined) cleanedData.sortOrder = data.sortOrder;
      if (data.color !== undefined) cleanedData.color = data.color;
      if (data.icon !== undefined) cleanedData.icon = data.icon;
      if (data.tags !== undefined) cleanedData.tags = data.tags || [];

      const docRef = doc(db, 'categories', id);
      await updateDoc(docRef, cleanedData);
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  async deleteCategory(id: string, options?: { moveProductsTo?: string }) {
    try {
      const batch = writeBatch(db);
      
      // Check if category has products
      const productsQuery = query(collection(db, 'products'), where('categoryId', '==', id));
      const productsSnapshot = await getDocs(productsQuery);
      
      if (!productsSnapshot.empty) {
        if (options?.moveProductsTo) {
          // Move products to another category
          productsSnapshot.docs.forEach(productDoc => {
            batch.update(productDoc.ref, {
              categoryId: options.moveProductsTo,
              updatedAt: serverTimestamp()
            });
          });
        } else {
          throw new Error('Cannot delete category with products. Move products first or specify moveProductsTo option.');
        }
      }
      
      // Delete the category
      const categoryRef = doc(db, 'categories', id);
      batch.delete(categoryRef);
      
      await batch.commit();
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },

  // Hierarchy operations
  async getCategoryHierarchy(): Promise<CategoryHierarchy[]> {
    try {
      const categories = await this.getCategories({ includeInactive: false });
      
      // Build hierarchy tree
      const categoryMap = new Map<string, CategoryHierarchy>();
      const rootCategories: CategoryHierarchy[] = [];
      
      // First pass: create all nodes
      categories.forEach(category => {
        const metadata = category.metadata || {};
        const hierarchyNode: CategoryHierarchy = {
          id: category.id!,
          name: category.name,
          level: 0,
          path: [category.name],
          children: [],
          productCount: metadata.totalProducts || 0,
          totalValue: metadata.totalValue || 0
        };
        categoryMap.set(category.id!, hierarchyNode);
      });
      
      // Second pass: build parent-child relationships
      categories.forEach(category => {
        const node = categoryMap.get(category.id!)!;
        
        if (category.parentId) {
          const parent = categoryMap.get(category.parentId);
          if (parent) {
            parent.children.push(node);
            node.level = parent.level + 1;
            node.path = [...parent.path, node.name];
          } else {
            rootCategories.push(node);
          }
        } else {
          rootCategories.push(node);
        }
      });
      
      return rootCategories;
    } catch (error) {
      console.error('Error building category hierarchy:', error);
      throw error;
    }
  },

  async moveCategory(categoryId: string, newParentId: string | null) {
    try {
      await this.updateCategory(categoryId, {
        parentId: newParentId || undefined
      });
    } catch (error) {
      console.error('Error moving category:', error);
      throw error;
    }
  },

  // Metadata and analytics
  async getCategoryMetadata(categoryId: string) {
    try {
      const productsQuery = query(collection(db, 'products'), where('categoryId', '==', categoryId));
      const productsSnapshot = await getDocs(productsQuery);
      
      let totalProducts = 0;
      let totalValue = 0;
      let totalPrice = 0;
      
      productsSnapshot.docs.forEach(doc => {
        const product = doc.data() as Product;
        totalProducts++;
        const productValue = (product.price || 0) * (product.quantity || 0);
        totalValue += productValue;
        totalPrice += product.price || 0;
      });
      
      const averagePrice = totalProducts > 0 ? totalPrice / totalProducts : 0;
      
      return {
        totalProducts,
        totalValue,
        averagePrice,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting category metadata:', error);
      return {
        totalProducts: 0,
        totalValue: 0,
        averagePrice: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  },

  async getCategoryAnalytics(categoryId: string): Promise<CategoryAnalytics> {
    try {
      const category = await this.getCategoryById(categoryId);
      const productsQuery = query(
        collection(db, 'products'), 
        where('categoryId', '==', categoryId),
        orderBy('createdAt', 'desc')
      );
      const productsSnapshot = await getDocs(productsQuery);
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      // Calculate analytics
      const totalProducts = products.length;
      const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      const averagePrice = totalProducts > 0 ? products.reduce((sum, p) => sum + p.price, 0) / totalProducts : 0;
      
      // Get top selling products (mock data for now - would need sales data)
      const topSellingProducts = products.slice(0, 5);
      
      // Mock sales trend data
      const salesTrend = [
        { period: 'Jan', sales: Math.random() * 10000, quantity: Math.floor(Math.random() * 100) },
        { period: 'Feb', sales: Math.random() * 10000, quantity: Math.floor(Math.random() * 100) },
        { period: 'Mar', sales: Math.random() * 10000, quantity: Math.floor(Math.random() * 100) },
      ];
      
      return {
        categoryId,
        categoryName: category.name,
        totalProducts,
        totalValue,
        averagePrice,
        topSellingProducts,
        salesTrend,
        profitMargin: Math.random() * 30, // Mock data
        turnoverRate: Math.random() * 5, // Mock data
      };
    } catch (error) {
      console.error('Error getting category analytics:', error);
      throw error;
    }
  },

  // Discount operations
  async setCategoryDiscount(data: CategoryDiscount) {
    try {
      await addDoc(collection(db, 'categoryDiscounts'), {
        ...data,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error setting category discount:', error);
      throw error;
    }
  },

  async getActiveCategoryDiscounts() {
    try {
      const q = query(
        collection(db, 'categoryDiscounts'),
        where('isActive', '==', true),
        where('endDate', '>=', new Date().toISOString())
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CategoryDiscount[];
    } catch (error) {
      console.error('Error fetching category discounts:', error);
      throw error;
    }
  },

  async updateCategoryDiscount(id: string, data: Partial<CategoryDiscount>) {
    try {
      const docRef = doc(db, 'categoryDiscounts', id);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error('Error updating category discount:', error);
      throw error;
    }
  },

  async deleteCategoryDiscount(id: string) {
    try {
      const docRef = doc(db, 'categoryDiscounts', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting category discount:', error);
      throw error;
    }
  },

  // Bulk operations
  async bulkUpdateCategories(updates: Array<{ id: string; data: Partial<Category> }>) {
    try {
      const batch = writeBatch(db);
      
      updates.forEach(({ id, data }) => {
        const docRef = doc(db, 'categories', id);
        batch.update(docRef, {
          ...data,
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error bulk updating categories:', error);
      throw error;
    }
  },

  async reorderCategories(categoryIds: string[]) {
    try {
      const batch = writeBatch(db);
      
      categoryIds.forEach((id, index) => {
        const docRef = doc(db, 'categories', id);
        batch.update(docRef, {
          sortOrder: index,
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error reordering categories:', error);
      throw error;
    }
  },

  // Search and filter
  async searchCategories(searchTerm: string, filters?: {
    isActive?: boolean;
    hasProducts?: boolean;
    parentId?: string;
  }) {
    try {
      let q = collection(db, 'categories');
      
      // Apply filters
      if (filters?.isActive !== undefined) {
        q = query(q, where('isActive', '==', filters.isActive));
      }
      
      if (filters?.parentId !== undefined) {
        q = query(q, where('parentId', '==', filters.parentId));
      }
      
      const querySnapshot = await getDocs(q);
      let categories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      
      // Client-side search (Firestore doesn't support full-text search)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        categories = categories.filter(category =>
          category.name.toLowerCase().includes(searchLower) ||
          category.description?.toLowerCase().includes(searchLower) ||
          category.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      
      // Filter by product count if needed
      if (filters?.hasProducts !== undefined) {
        const categoriesWithMetadata = await Promise.all(
          categories.map(async (category) => {
            const metadata = await this.getCategoryMetadata(category.id!);
            return {
              ...category,
              metadata: { ...category.metadata, ...metadata }
            };
          })
        );
        
        categories = categoriesWithMetadata.filter(category => {
          const hasProducts = (category.metadata?.totalProducts || 0) > 0;
          return filters.hasProducts ? hasProducts : !hasProducts;
        });
      }
      
      return categories;
    } catch (error) {
      console.error('Error searching categories:', error);
      throw error;
    }
  },

  // Import/Export
  async exportCategories() {
    try {
      const categories = await this.getCategories({ includeInactive: true });
      return categories.map(category => ({
        name: category.name,
        description: category.description,
        parentId: category.parentId,
        isActive: category.isActive,
        defaultDiscount: category.defaultDiscount,
        defaultGstRate: category.defaultGstRate,
        color: category.color,
        tags: category.tags?.join(', '),
        sortOrder: category.sortOrder
      }));
    } catch (error) {
      console.error('Error exporting categories:', error);
      throw error;
    }
  },

  async importCategories(categoriesData: Array<{
    name: string;
    description?: string;
    parentId?: string;
    isActive?: boolean;
    defaultDiscount?: number;
    defaultGstRate?: number;
    color?: string;
    tags?: string;
    sortOrder?: number;
  }>) {
    try {
      const batch = writeBatch(db);
      const results = { success: 0, failed: 0, errors: [] as string[] };
      
      for (const [index, categoryData] of categoriesData.entries()) {
        try {
          if (!categoryData.name?.trim()) {
            results.failed++;
            results.errors.push(`Row ${index + 1}: Category name is required`);
            continue;
          }
          
          const docRef = doc(collection(db, 'categories'));
          
          // Clean the data to remove undefined values
          const cleanedData: any = {
            name: categoryData.name.trim(),
            description: categoryData.description || '',
            parentId: categoryData.parentId || null,
            isActive: categoryData.isActive !== false,
            defaultDiscount: categoryData.defaultDiscount || 0,
            color: categoryData.color || '#1976d2',
            tags: categoryData.tags ? categoryData.tags.split(',').map(t => t.trim()) : [],
            sortOrder: categoryData.sortOrder || 0,
            metadata: {
              totalProducts: 0,
              totalValue: 0,
              averagePrice: 0,
              lastUpdated: new Date().toISOString()
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          // Only add defaultGstRate if it's not null/undefined
          if (categoryData.defaultGstRate !== null && categoryData.defaultGstRate !== undefined) {
            cleanedData.defaultGstRate = categoryData.defaultGstRate;
          }

          batch.set(docRef, cleanedData);
          
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      if (results.success > 0) {
        await batch.commit();
      }
      
      return results;
    } catch (error) {
      console.error('Error importing categories:', error);
      throw error;
    }
  }
};
