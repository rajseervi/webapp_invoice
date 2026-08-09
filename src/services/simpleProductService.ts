import { db } from '@/firebase/config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch
} from 'firebase/firestore';
import { Product } from '@/types/inventory';

export interface ProductFilters {
  categoryId?: string;
  isService?: boolean;
  isActive?: boolean;
  priceRange?: [number, number];
  stockRange?: [number, number];
  searchTerm?: string;
}

export interface ProductSortOptions {
  field: 'name' | 'price' | 'quantity' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

export interface ProductUpdateData {
  name?: string;
  description?: string;
  categoryId?: string;
  price?: number;
  quantity?: number;
  unitOfMeasurement?: string;
  isService?: boolean;
  isActive?: boolean;
  reorderPoint?: number;
  maxStockLevel?: number;
  minStockLevel?: number;
  barcode?: string;
  sku?: string;
  brand?: string;
  model?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  images?: string[];
  tags?: string[];
  discountedPrice?: number;
}

export interface ProductStatistics {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  lowStockProducts: number;
  totalValue: number;
  averagePrice: number;
  categoryDistribution: Record<string, number>;
  serviceVsGoods: {
    services: number;
    goods: number;
  };
}

export class SimpleProductService {
  private static readonly PRODUCTS_COLLECTION = 'products';

  /**
   * Create a new product
   */
  static async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date().toISOString();
      
      const product: Omit<Product, 'id'> = {
        ...productData,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, this.PRODUCTS_COLLECTION), product);
      return docRef.id;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  /**
   * Get products with filtering and sorting
   */
  static async getProducts(
    filters: ProductFilters = {},
    sortOptions: ProductSortOptions = { field: 'name', direction: 'asc' },
    userId?: string
  ): Promise<Product[]> {
    try {
      let q = query(collection(db, this.PRODUCTS_COLLECTION));

      // Apply basic filters
      if (userId) {
        q = query(q, where('userId', '==', userId));
      }

      if (filters.categoryId) {
        q = query(q, where('categoryId', '==', filters.categoryId));
      }

      if (filters.isService !== undefined) {
        q = query(q, where('isService', '==', filters.isService));
      }

      if (filters.isActive !== undefined) {
        q = query(q, where('isActive', '==', filters.isActive));
      }

      // Add sorting
      q = query(q, orderBy(sortOptions.field, sortOptions.direction));

      const querySnapshot = await getDocs(q);
      let products = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      // Apply client-side filters for complex conditions
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

      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        products = products.filter(product =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description?.toLowerCase().includes(searchTerm) ||
          product.brand?.toLowerCase().includes(searchTerm) ||
          product.model?.toLowerCase().includes(searchTerm) ||
          product.sku?.toLowerCase().includes(searchTerm)
        );
      }

      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  /**
   * Get product by ID
   */
  static async getProductById(productId: string): Promise<Product | null> {
    try {
      const docRef = doc(db, this.PRODUCTS_COLLECTION, productId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Product;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }

  /**
   * Update product
   */
  static async updateProduct(
    productId: string,
    updates: ProductUpdateData
  ): Promise<void> {
    try {
      const productRef = doc(db, this.PRODUCTS_COLLECTION, productId);
      
      await updateDoc(productRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  /**
   * Delete product
   */
  static async deleteProduct(productId: string): Promise<void> {
    try {
      const productRef = doc(db, this.PRODUCTS_COLLECTION, productId);
      await deleteDoc(productRef);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  /**
   * Get low stock products
   */
  static async getLowStockProducts(threshold: number = 10, userId?: string): Promise<Product[]> {
    try {
      const filters: ProductFilters = {
        stockRange: [0, threshold - 1],
        isActive: true
      };
      
      return await this.getProducts(filters, { field: 'quantity', direction: 'asc' }, userId);
    } catch (error) {
      console.error('Error getting low stock products:', error);
      return [];
    }
  }

  /**
   * Update stock quantity
   */
  static async updateStock(productId: string, newQuantity: number): Promise<void> {
    try {
      await this.updateProduct(productId, { quantity: newQuantity });
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  /**
   * Adjust stock (add/subtract)
   */
  static async adjustStock(productId: string, adjustment: number): Promise<void> {
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
  }

  /**
   * Get product statistics
   */
  static async getProductStatistics(userId?: string): Promise<ProductStatistics> {
    try {
      const products = await this.getProducts({}, { field: 'name', direction: 'asc' }, userId);

      const totalProducts = products.length;
      const activeProducts = products.filter(p => p.isActive).length;
      const inactiveProducts = totalProducts - activeProducts;
      const lowStockProducts = products.filter(p => p.quantity < (p.reorderPoint || 10)).length;

      const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      const averagePrice = totalProducts > 0 ? totalValue / totalProducts : 0;

      // Category distribution
      const categoryDistribution: Record<string, number> = {};
      products.forEach(product => {
        const category = product.categoryName || product.categoryId || 'Uncategorized';
        categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
      });

      // Service vs Goods
      const serviceVsGoods = {
        services: products.filter(p => p.isService).length,
        goods: products.filter(p => !p.isService).length
      };

      return {
        totalProducts,
        activeProducts,
        inactiveProducts,
        lowStockProducts,
        totalValue,
        averagePrice,
        categoryDistribution,
        serviceVsGoods
      };
    } catch (error) {
      console.error('Error getting product statistics:', error);
      return {
        totalProducts: 0,
        activeProducts: 0,
        inactiveProducts: 0,
        lowStockProducts: 0,
        totalValue: 0,
        averagePrice: 0,
        categoryDistribution: {},
        serviceVsGoods: { services: 0, goods: 0 }
      };
    }
  }

  /**
   * Bulk update products
   */
  static async bulkUpdateProducts(
    updates: Array<{ productId: string; data: ProductUpdateData }>
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const batch = writeBatch(db);
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    try {
      const now = new Date().toISOString();

      for (const update of updates) {
        try {
          const productRef = doc(db, this.PRODUCTS_COLLECTION, update.productId);
          batch.update(productRef, {
            ...update.data,
            updatedAt: now
          });
          success++;
        } catch (error) {
          failed++;
          errors.push(`Product ${update.productId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      await batch.commit();

      return { success, failed, errors };
    } catch (error) {
      console.error('Error in bulk update:', error);
      return { 
        success: 0, 
        failed: updates.length, 
        errors: [error instanceof Error ? error.message : 'Bulk update failed'] 
      };
    }
  }

  /**
   * Duplicate product
   */
  static async duplicateProduct(
    productId: string,
    newName?: string
  ): Promise<string> {
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
  }

  /**
   * Search products by name or SKU
   */
  static async searchProducts(
    searchTerm: string,
    limitResults: number = 20,
    userId?: string
  ): Promise<Product[]> {
    try {
      const filters: ProductFilters = {
        searchTerm,
        isActive: true
      };
      
      const products = await this.getProducts(filters, { field: 'name', direction: 'asc' }, userId);
      return products.slice(0, limitResults);
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }
}

export default SimpleProductService;