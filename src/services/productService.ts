import { db } from '../lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  DocumentSnapshot,
  QueryConstraint,
  getCountFromServer
} from 'firebase/firestore';
import { Product } from '../types/inventory';
import { categoryService } from './categoryService';

export interface ProductFilters {
  category?: string;
  status?: 'all' | 'active' | 'inactive' | 'low-stock';
  priceRange?: [number, number];
  stockRange?: [number, number];
  searchTerm?: string;
}

export interface ProductSortOptions {
  field: 'name' | 'price' | 'quantity' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
  lastVisible?: DocumentSnapshot;
}

export interface ProductsResponse {
  products: Product[];
  totalCount: number;
  hasMore: boolean;
  lastVisible?: DocumentSnapshot;
}

export interface BulkUpdateData {
  price?: number;
  quantity?: number;
  categoryId?: string;
  isActive?: boolean;
  reorderPoint?: number;
}

export const productService = {
  // Helper function to clean data for Firestore (remove undefined values)
  cleanDataForFirestore(data: any): any {
    if (data === null || data === undefined) {
      return null;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.cleanDataForFirestore(item));
    }

    if (typeof data === 'object') {
      const cleaned: any = {};
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (value !== undefined) {
          cleaned[key] = this.cleanDataForFirestore(value);
        }
      });
      return cleaned;
    }

    return data;
  },

  // Get all products with optional filtering, sorting, and pagination
  async getProducts(
    filters?: ProductFilters,
    sortOptions?: ProductSortOptions,
    pagination?: PaginationOptions
  ): Promise<ProductsResponse> {
    try {
      const productsRef = collection(db, 'products');
      const constraints: QueryConstraint[] = [];

      // Determine if we have client-side filters
      const hasClientSideFilters = filters && (filters.searchTerm || filters.priceRange || filters.stockRange);

      // Apply server-side filters
      if (filters) {
        if (filters.category) {
          constraints.push(where('categoryId', '==', filters.category));
        }

        if (filters.status && filters.status !== 'all') {
          switch (filters.status) {
            case 'active':
              constraints.push(where('isActive', '==', true));
              break;
            case 'inactive':
              constraints.push(where('isActive', '==', false));
              break;
            case 'low-stock':
              constraints.push(where('isActive', '==', true));
              constraints.push(where('quantity', '<', 10));
              break;
          }
        }
      }

      // Apply sorting
      if (sortOptions) {
        constraints.push(orderBy(sortOptions.field, sortOptions.direction));
      } else {
        constraints.push(orderBy('name', 'asc'));
      }

      // Apply pagination only if no client-side filters
      if (pagination && !hasClientSideFilters) {
        if (pagination.lastVisible) {
          constraints.push(startAfter(pagination.lastVisible));
        }
        constraints.push(limit(pagination.limit));
      }

      const q = query(productsRef, ...constraints);
      const snapshot = await getDocs(q);

      let products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      // Calculate total count
      let totalCount: number;
      if (hasClientSideFilters) {
        // For client-side filters, we fetch all, so count after filtering
        // But first apply client-side filters
        if (filters) {
          if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            products = products.filter(product =>
              product.name.toLowerCase().includes(searchLower) ||
              (product.description && product.description.toLowerCase().includes(searchLower))
            );
          }

          if (filters.priceRange) {
            products = products.filter(product =>
              product.price >= filters.priceRange![0] &&
              product.price <= filters.priceRange![1]
            );
          }

          if (filters.stockRange) {
            products = products.filter(product =>
              product.quantity >= filters.stockRange![0] &&
              product.quantity <= filters.stockRange![1]
            );
          }
        }
        totalCount = products.length;
      } else {
        // No client-side filters, use server-side count
        const whereConstraints = constraints.filter(c => c.type === 'where');
        const countQuery = query(productsRef, ...whereConstraints);
        const countSnapshot = await getCountFromServer(countQuery);
        totalCount = countSnapshot.data().count;
      }

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const hasMore = hasClientSideFilters ? false : snapshot.docs.length === (pagination?.limit || 50);

      return {
        products,
        totalCount,
        hasMore,
        lastVisible
      };
    } catch (error) {
      console.error('Error getting products:', error);
      return {
        products: [],
        totalCount: 0,
        hasMore: false
      };
    }
  },

  // Get a single product by ID
  async getProductById(productId: string): Promise<Product | null> {
    try {
      const docRef = doc(db, 'products', productId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Product;
    } catch (error) {
      console.error('Error getting product:', error);
      return null;
    }
  },

  // Create a new product
  async createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Validate product name (no spaces, allowed chars)
      const { validateProductName } = await import('@/utils/validation');
      const nameError = validateProductName((data as any).name || '');
      if (nameError) throw new Error(nameError);

      const now = new Date().toISOString();
      const productData = {
        ...data,
        isActive: data.isActive ?? true,
        createdAt: now,
        updatedAt: now,
        unitOfMeasurement: data.unitOfMeasurement ?? 'PCS'
      };

      // Clean data before sending to Firestore
      const cleanedData = this.cleanDataForFirestore(productData);

      const docRef = await addDoc(collection(db, 'products'), cleanedData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating product:', error);
      throw new Error('Failed to create product.');
    }
  },

  async getProductsByIds(productIds: string[]): Promise<Product[]> {
    if (productIds.length === 0) {
      return [];
    }
    try {
      const productsRef = collection(db, 'products');
      const q = query(productsRef, where('__name__', 'in', productIds));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
    } catch (error) {
      console.error('Error getting products by IDs:', error);
      return [];
    }
  },

  // Update an existing product
  async updateProduct(productId: string, data: Partial<Product>): Promise<void> {
    try {
      // If name is being updated, validate it
      if (data.name !== undefined) {
        const trimmed = (data.name || '').trim();
        if (!trimmed) throw new Error('Product name is required');
        if (trimmed.length < 2 || trimmed.length > 100) throw new Error('Product name must be 2-100 characters');
      }

      const now = new Date().toISOString();
      const updateData = {
        ...data,
        updatedAt: now
      };

      // Clean data before sending to Firestore
      const cleanedData = this.cleanDataForFirestore(updateData);

      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, cleanedData);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  // Delete a product
  async deleteProduct(productId: string): Promise<void> {
    try {
      const productRef = doc(db, 'products', productId);
      await deleteDoc(productRef);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  // Bulk update products
  async bulkUpdateProducts(productIds: string[], updateData: BulkUpdateData): Promise<void> {
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      const cleanedUpdateData = this.cleanDataForFirestore({
        ...updateData,
        updatedAt: now
      });

      productIds.forEach(productId => {
        const productRef = doc(db, 'products', productId);
        batch.update(productRef, cleanedUpdateData);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error bulk updating products:', error);
      throw error;
    }
  },

  // Bulk delete products
  async bulkDeleteProducts(productIds: string[]): Promise<void> {
    try {
      const batch = writeBatch(db);

      productIds.forEach(productId => {
        const productRef = doc(db, 'products', productId);
        batch.delete(productRef);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      throw error;
    }
  },

  // Get products with category discounts applied
  async getProductsWithDiscounts(): Promise<Product[]> {
    try {
      const products = await this.getProducts();
      const categoryDiscounts = await categoryService.getActiveCategoryDiscounts();

      return products.products.map(product => {
        const categoryDiscount = categoryDiscounts.find(d => d.categoryId === product.categoryId);
        if (categoryDiscount) {
          return {
            ...product,
            discountedPrice: product.price * (1 - categoryDiscount.discount / 100)
          };
        }
        return product;
      });
    } catch (error) {
      console.error('Error fetching products with discounts:', error);
      throw error;
    }
  },

  // Get product with discount applied
  async getProductWithDiscount(productId: string): Promise<Product | null> {
    try {
      const product = await this.getProductById(productId);
      if (!product) return null;

      const categoryDiscounts = await categoryService.getActiveCategoryDiscounts();
      const categoryDiscount = categoryDiscounts.find(d => d.categoryId === product.categoryId);

      if (categoryDiscount) {
        return {
          ...product,
          discountedPrice: product.price * (1 - categoryDiscount.discount / 100)
        };
      }

      return product;
    } catch (error) {
      console.error('Error fetching product with discount:', error);
      throw error;
    }
  },

  // Get low stock products
  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    try {
      const filters: ProductFilters = {
        stockRange: [0, threshold - 1],
        status: 'active'
      };

      const result = await this.getProducts(filters);
      return result.products;
    } catch (error) {
      console.error('Error getting low stock products:', error);
      return [];
    }
  },

  // Get products by category
  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    try {
      const filters: ProductFilters = {
        category: categoryId,
        status: 'active'
      };

      const result = await this.getProducts(filters);
      return result.products;
    } catch (error) {
      console.error('Error getting products by category:', error);
      return [];
    }
  },

  // Search products
  async searchProducts(searchTerm: string, limit: number = 50): Promise<Product[]> {
    try {
      const filters: ProductFilters = {
        searchTerm,
        status: 'active'
      };

      const pagination: PaginationOptions = {
        page: 0,
        limit
      };

      const result = await this.getProducts(filters, undefined, pagination);
      return result.products;
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  },

  // Update stock quantity
  async updateStock(productId: string, newQuantity: number): Promise<void> {
    try {
      await this.updateProduct(productId, { quantity: newQuantity });
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  },

  // Adjust stock (add/subtract)
  async adjustStock(productId: string, adjustment: number): Promise<void> {
    try {
      const product = await this.getProductById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const newQuantity = Math.max(0, product.quantity + adjustment);
      await this.updateStock(productId, newQuantity);
    } catch (error) {
      console.error('Error adjusting stock:', error);
      throw error;
    }
  },

  // Get product statistics
  async getProductStatistics(): Promise<{
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    lowStockProducts: number;
    totalValue: number;
    averagePrice: number;
  }> {
    try {
      const allProducts = await this.getProducts();
      const products = allProducts.products;

      const totalProducts = products.length;
      const activeProducts = products.filter(p => p.isActive).length;
      const inactiveProducts = totalProducts - activeProducts;
      const lowStockProducts = products.filter(p => p.quantity < (p.reorderPoint || 10)).length;

      const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      const averagePrice = totalProducts > 0 ? totalValue / totalProducts : 0;

      return {
        totalProducts,
        activeProducts,
        inactiveProducts,
        lowStockProducts,
        totalValue,
        averagePrice
      };
    } catch (error) {
      console.error('Error getting product statistics:', error);
      return {
        totalProducts: 0,
        activeProducts: 0,
        inactiveProducts: 0,
        lowStockProducts: 0,
        totalValue: 0,
        averagePrice: 0
      };
    }
  },

  // Import products from array
  async importProducts(products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();
      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (let i = 0; i < products.length; i++) {
        try {
          const product = products[i];

          // Validate required fields
          if (!product.name) {
            errors.push(`Row ${i + 1}: Missing required field 'name'`);
            failed++;
            continue;
          }

          let categoryId = product.categoryId;
          let categoryName = product.categoryName;

          // If categoryName is provided but categoryId is not, try to find or create the category
          if (categoryName && !categoryId) {
            const existingCategories = await categoryService.getCategories();
            const existingCategory = existingCategories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());

            if (existingCategory) {
              categoryId = existingCategory.id;
            } else {
              try {
                // Create new category if it doesn't exist
                categoryId = await categoryService.createCategory({
                  name: categoryName,
                  isActive: true,
                  description: '',
                  defaultDiscount: 0
                });
                console.log(`Created new category: ${categoryName} with ID: ${categoryId}`);
              } catch (catError) {
                errors.push(`Row ${i + 1}: Failed to create category '${categoryName}': ${catError instanceof Error ? catError.message : 'Unknown error'}`);
                failed++;
                continue;
              }
            }
          }

          // If after all attempts, categoryId is still missing, skip this product
          if (!categoryId) {
            errors.push(`Row ${i + 1}: Missing or invalid category information (categoryId or categoryName)`);
            failed++;
            continue;
          }

          // Prepare product data with proper defaults and clean undefined values
          const productData: any = {
            name: product.name,
            categoryId: categoryId,
            price: product.price,
            quantity: product.quantity,
            description: product.description || '',
            reorderPoint: product.reorderPoint ?? 10,
            isActive: product.isActive ?? true,
            unitOfMeasurement: product.unitOfMeasurement || 'PCS',
            createdAt: now,
            updatedAt: now
          };

          // Only add categoryName if it exists and is not empty
          if (categoryName && categoryName.trim() !== '') {
            productData.categoryName = categoryName.trim();
          }

          // Clean the data to remove any undefined values
          const cleanedProductData = this.cleanDataForFirestore(productData);

          const docRef = doc(collection(db, 'products'));
          batch.set(docRef, cleanedProductData);
          success++;

          // Commit in batches of 500 (Firestore limit)
          if (success % 500 === 0) {
            await batch.commit();
          }
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          failed++;
        }
      }

      // Commit remaining items
      if (success % 500 !== 0) {
        await batch.commit();
      }

      return { success, failed, errors };
    } catch (error) {
      console.error('Error importing products:', error);
      throw error;
    }
  },

  // Export products to array
  async exportProducts(filters?: ProductFilters): Promise<Product[]> {
    try {
      const result = await this.getProducts(filters);
      return result.products;
    } catch (error) {
      console.error('Error exporting products:', error);
      return [];
    }
  },

  // Find product by name
  async findProductByName(name: string): Promise<Product | null> {
    try {
      const q = query(
        collection(db, 'products'),
        where('name', '==', name.trim()),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Product;
    } catch (error) {
      console.error('Error finding product by name:', error);
      return null;
    }
  },

  // Enhanced import products with advanced options
  async importProductsAdvanced(
    products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[],
    options: {
      updateExisting?: boolean;
      skipDuplicates?: boolean;
      validateOnly?: boolean;
      batchSize?: number;
      createCategories?: boolean;
    } = {}
  ): Promise<{
    success: number;
    failed: number;
    updated: number;
    duplicates: number;
    skipped: number;
    errors: string[];
    warnings: string[];
    processingTime: number;
  }> {
    const startTime = Date.now();
    const {
      updateExisting = false,
      skipDuplicates = true,
      validateOnly = false,
      batchSize = 100,
      createCategories = false
    } = options;

    try {
      let success = 0;
      let failed = 0;
      let updated = 0;
      let duplicates = 0;
      let skipped = 0;
      const errors: string[] = [];
      const warnings: string[] = [];

      // Process in batches
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        
        if (validateOnly) {
          // Just validate, don't import
          success += batch.length;
          continue;
        }

        const firestoreBatch = writeBatch(db);
        const now = new Date().toISOString();

        for (const product of batch) {
          try {
            // Validate required fields
            if (!product.name || !product.categoryId || product.price === undefined) {
              errors.push(`Product missing required fields: ${product.name || 'Unknown'}`);
              failed++;
              continue;
            }

            // Check for existing product
            const existingProduct = await this.findProductByName(product.name);
            
            if (existingProduct) {
              if (updateExisting) {
                const productRef = doc(db, 'products', existingProduct.id!);
                firestoreBatch.update(productRef, {
                  ...product,
                  updatedAt: now
                });
                updated++;
              } else if (skipDuplicates) {
                duplicates++;
              } else {
                errors.push(`Product already exists: ${product.name}`);
                failed++;
              }
            } else {
              // Create new product
              const productRef = doc(collection(db, 'products'));
              firestoreBatch.set(productRef, {
                ...product,
                createdAt: now,
                updatedAt: now
              });
              success++;
            }
          } catch (error) {
            errors.push(`Error processing product ${product.name}: ${error}`);
            failed++;
          }
        }

        // Commit batch
        if (!validateOnly) {
          await firestoreBatch.commit();
        }
      }

      const processingTime = Date.now() - startTime;

      return {
        success,
        failed,
        updated,
        duplicates,
        skipped,
        errors,
        warnings,
        processingTime
      };
    } catch (error) {
      console.error('Error in advanced import:', error);
      throw error;
    }
  },

  // Duplicate a product
  async duplicateProduct(productId: string, newName?: string): Promise<string> {
    try {
      const product = await this.getProductById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const { id, createdAt, updatedAt, ...productData } = product;
      const duplicatedProduct = {
        ...productData,
        name: newName || `${product.name} (Copy)`,
        quantity: 0 // Reset stock for duplicated product
      };

      return await this.createProduct(duplicatedProduct);
    } catch (error) {
      console.error('Error duplicating product:', error);
      throw error;
    }
  },

  // Get a single product by ID (alias for getProductById for compatibility)
  async getProduct(productId: string): Promise<Product | null> {
    return await this.getProductById(productId);
  },

  // Bulk update prices
  async bulkUpdatePrices(updates: { productId: string; price: number }[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      updates.forEach(update => {
        const productRef = doc(db, 'products', update.productId);
        batch.update(productRef, {
          price: update.price,
          updatedAt: now
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error bulk updating prices:', error);
      throw error;
    }
  },

  // Bulk update stock
  async bulkUpdateStock(updates: { productId: string; quantity: number }[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      updates.forEach(update => {
        const productRef = doc(db, 'products', update.productId);
        batch.update(productRef, {
          quantity: update.quantity,
          updatedAt: now
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error bulk updating stock:', error);
      throw error;
    }
  },

  // Bulk add tags
  async bulkAddTags(productIds: string[], tags: string[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      for (const productId of productIds) {
        const product = await this.getProductById(productId);
        if (product) {
          const existingTags = product.tags || [];
          const newTags = [...new Set([...existingTags, ...tags])];
          
          const productRef = doc(db, 'products', productId);
          batch.update(productRef, {
            tags: newTags,
            updatedAt: now
          });
        }
      }

      await batch.commit();
    } catch (error) {
      console.error('Error bulk adding tags:', error);
      throw error;
    }
  },

  // Bulk remove tags
  async bulkRemoveTags(productIds: string[], tags: string[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      for (const productId of productIds) {
        const product = await this.getProductById(productId);
        if (product) {
          const existingTags = product.tags || [];
          const newTags = existingTags.filter(tag => !tags.includes(tag));
          
          const productRef = doc(db, 'products', productId);
          batch.update(productRef, {
            tags: newTags,
            updatedAt: now
          });
        }
      }

      await batch.commit();
    } catch (error) {
      console.error('Error bulk removing tags:', error);
      throw error;
    }
  },

  // Bulk duplicate products
  async bulkDuplicateProducts(productIds: string[]): Promise<void> {
    try {
      for (const productId of productIds) {
        await this.duplicateProduct(productId);
      }
    } catch (error) {
      console.error('Error bulk duplicating products:', error);
      throw error;
    }
  },

  // Bulk generate barcodes
  async bulkGenerateBarcodes(productIds: string[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      productIds.forEach(productId => {
        const barcode = `${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
        const productRef = doc(db, 'products', productId);
        batch.update(productRef, {
          barcode,
          updatedAt: now
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error bulk generating barcodes:', error);
      throw error;
    }
  },

  // Bulk apply discount
  async bulkApplyDiscount(updates: { productId: string; discountPercentage: number }[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      for (const update of updates) {
        const product = await this.getProductById(update.productId);
        if (product) {
          const discountedPrice = product.price * (1 - update.discountPercentage / 100);
          const productRef = doc(db, 'products', update.productId);
          batch.update(productRef, {
            discountedPrice,
            discountPercentage: update.discountPercentage,
            updatedAt: now
          });
        }
      }

      await batch.commit();
    } catch (error) {
      console.error('Error bulk applying discount:', error);
      throw error;
    }
  }
};

// Legacy function for backward compatibility
export const getProducts = async (): Promise<Product[]> => {
  try {
    const result = await productService.getProducts();
    return result.products;
  } catch (error) {
    console.error('Error in getProducts:', error);
    return [];
  }
};

// Add getAllProducts method for compatibility
const getAllProducts = async (): Promise<Product[]> => {
  try {
    const result = await productService.getProducts();
    return result.products;
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    return [];
  }
};

// Export as ProductService for compatibility
export const ProductService = {
  ...productService,
  getAllProducts
};