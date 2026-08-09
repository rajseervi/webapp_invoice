import { db } from '@/firebase/config';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { EnhancedSupplier } from '@/types/enhancedPurchase';

export interface SupplierFilters {
  isActive?: boolean;
  searchTerm?: string;
  hasOutstandingBalance?: boolean;
}

export interface SupplierPerformanceMetrics {
  totalOrders: number;
  totalOrderValue: number;
  averageOrderValue: number;
  onTimeDeliveryRate: number;
  qualityScore: number;
  averageLeadTime: number;
  lastOrderDate?: string;
  outstandingBalance: number;
}

export class EnhancedSupplierService {
  private static readonly SUPPLIERS_COLLECTION = 'enhanced_suppliers';
  private static readonly PURCHASE_ORDERS_COLLECTION = 'enhanced_purchase_orders';

  /**
   * Create a new enhanced supplier
   */
  static async createSupplier(
    supplierData: Omit<EnhancedSupplier, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const now = new Date().toISOString();
      
      // Validate GSTIN if provided
      if (supplierData.gstin && !this.validateGSTIN(supplierData.gstin)) {
        throw new Error('Invalid GSTIN format');
      }

      // Clean the supplier data by removing any undefined values
      const cleanedSupplierData = Object.fromEntries(
        Object.entries(supplierData).filter(([_, value]) => value !== undefined)
      );

      // Initialize default values
      const enhancedSupplierData: Omit<EnhancedSupplier, 'id'> = {
        name: cleanedSupplierData.name,
        userId: cleanedSupplierData.userId,
        currentBalance: 0,
        preferredProducts: [],
        leadTime: cleanedSupplierData.leadTime || 7, // Default 7 days
        minimumOrderValue: cleanedSupplierData.minimumOrderValue || 0,
        discountPercentage: cleanedSupplierData.discountPercentage || 0,
        isActive: cleanedSupplierData.isActive ?? true,
        createdAt: now,
        updatedAt: now,
        ...cleanedSupplierData
      };
      
      const supplierRef = await addDoc(collection(db, this.SUPPLIERS_COLLECTION), enhancedSupplierData);
      return supplierRef.id;

    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  }

  /**
   * Update existing supplier
   */
  static async updateSupplier(
    supplierId: string,
    supplierData: Partial<EnhancedSupplier>
  ): Promise<boolean> {
    try {
      // Validate GSTIN if being updated
      if (supplierData.gstin && !this.validateGSTIN(supplierData.gstin)) {
        throw new Error('Invalid GSTIN format');
      }

      const supplierRef = doc(db, this.SUPPLIERS_COLLECTION, supplierId);
      await updateDoc(supplierRef, {
        ...supplierData,
        updatedAt: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  }

  /**
   * Get all active suppliers
   */
  static async getActiveSuppliers(userId?: string): Promise<EnhancedSupplier[]> {
    try {
      let q = query(
        collection(db, this.SUPPLIERS_COLLECTION),
        where('isActive', '==', true),
        orderBy('name', 'asc')
      );

      if (userId) {
        q = query(q, where('userId', '==', userId));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as EnhancedSupplier));

    } catch (error) {
      console.error('Error fetching active suppliers:', error);
      throw error;
    }
  }

  /**
   * Get suppliers with advanced filtering
   */
  static async getSuppliersWithFilters(
    userId: string,
    filters: SupplierFilters = {}
  ): Promise<EnhancedSupplier[]> {
    try {
      let suppliers = await this.getAllSuppliers(userId);

      // Apply filters
      if (filters.isActive !== undefined) {
        suppliers = suppliers.filter(s => s.isActive === filters.isActive);
      }

      if (filters.hasOutstandingBalance) {
        suppliers = suppliers.filter(s => (s.currentBalance || 0) > 0);
      }

      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        suppliers = suppliers.filter(s => 
          s.name.toLowerCase().includes(searchTerm) ||
          s.email?.toLowerCase().includes(searchTerm) ||
          s.phone?.includes(searchTerm) ||
          s.contactPerson?.toLowerCase().includes(searchTerm)
        );
      }

      return suppliers;
    } catch (error) {
      console.error('Error fetching suppliers with filters:', error);
      throw error;
    }
  }

  /**
   * Get all suppliers for a user
   */
  static async getAllSuppliers(userId: string): Promise<EnhancedSupplier[]> {
    try {
      const q = query(
        collection(db, this.SUPPLIERS_COLLECTION),
        where('userId', '==', userId),
        orderBy('name', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as EnhancedSupplier));

    } catch (error) {
      console.error('Error fetching all suppliers:', error);
      throw error;
    }
  }

  /**
   * Get supplier by ID with performance metrics
   */
  static async getSupplierById(supplierId: string): Promise<{
    supplier: EnhancedSupplier | null;
    metrics: SupplierPerformanceMetrics;
  }> {
    try {
      const supplierDoc = await getDoc(doc(db, this.SUPPLIERS_COLLECTION, supplierId));
      
      if (!supplierDoc.exists()) {
        return { supplier: null, metrics: this.getDefaultMetrics() };
      }

      const supplier = { id: supplierDoc.id, ...supplierDoc.data() } as EnhancedSupplier;
      const metrics = await this.calculateSupplierMetrics(supplierId);

      return { supplier, metrics };
    } catch (error) {
      console.error('Error fetching supplier:', error);
      throw error;
    }
  }

  /**
   * Calculate supplier performance metrics
   */
  private static async calculateSupplierMetrics(supplierId: string): Promise<SupplierPerformanceMetrics> {
    try {
      // Get all purchase orders for this supplier
      const q = query(
        collection(db, this.PURCHASE_ORDERS_COLLECTION),
        where('supplierId', '==', supplierId)
      );

      const snapshot = await getDocs(q);
      const purchaseOrders = snapshot.docs.map(doc => doc.data());

      if (purchaseOrders.length === 0) {
        return this.getDefaultMetrics();
      }

      const totalOrders = purchaseOrders.length;
      const totalOrderValue = purchaseOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const averageOrderValue = totalOrderValue / totalOrders;

      // Calculate on-time delivery rate
      const deliveredOrders = purchaseOrders.filter(order => 
        order.status === 'received' && order.receivedDate && order.expectedDeliveryDate
      );
      
      const onTimeOrders = deliveredOrders.filter(order => 
        new Date(order.receivedDate!) <= new Date(order.expectedDeliveryDate!)
      );
      
      const onTimeDeliveryRate = deliveredOrders.length > 0 
        ? (onTimeOrders.length / deliveredOrders.length) * 100 
        : 0;

      // Calculate average lead time
      const avgLeadTime = deliveredOrders.length > 0
        ? deliveredOrders.reduce((sum, order) => {
            const orderDate = new Date(order.date);
            const receivedDate = new Date(order.receivedDate!);
            return sum + Math.ceil((receivedDate.getTime() - orderDate.getTime()) / (1000 * 3600 * 24));
          }, 0) / deliveredOrders.length
        : 0;

      // Find last order date
      const lastOrderDate = purchaseOrders
        .map(order => order.date)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

      return {
        totalOrders,
        totalOrderValue,
        averageOrderValue,
        onTimeDeliveryRate,
        qualityScore: 95, // Default quality score - can be enhanced with quality tracking
        averageLeadTime: avgLeadTime,
        lastOrderDate,
        outstandingBalance: 0 // This would be calculated from payment records
      };

    } catch (error) {
      console.error('Error calculating supplier metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * Get default metrics structure
   */
  private static getDefaultMetrics(): SupplierPerformanceMetrics {
    return {
      totalOrders: 0,
      totalOrderValue: 0,
      averageOrderValue: 0,
      onTimeDeliveryRate: 0,
      qualityScore: 0,
      averageLeadTime: 0,
      outstandingBalance: 0
    };
  }

  /**
   * Add product to supplier's preferred products
   */
  static async addPreferredProduct(supplierId: string, productId: string): Promise<boolean> {
    try {
      const supplierRef = doc(db, this.SUPPLIERS_COLLECTION, supplierId);
      const supplierDoc = await getDoc(supplierRef);
      
      if (!supplierDoc.exists()) {
        throw new Error('Supplier not found');
      }

      const supplier = supplierDoc.data() as EnhancedSupplier;
      const preferredProducts = supplier.preferredProducts || [];
      
      if (!preferredProducts.includes(productId)) {
        preferredProducts.push(productId);
        
        await updateDoc(supplierRef, {
          preferredProducts,
          updatedAt: new Date().toISOString()
        });
      }

      return true;
    } catch (error) {
      console.error('Error adding preferred product:', error);
      return false;
    }
  }

  /**
   * Remove product from supplier's preferred products
   */
  static async removePreferredProduct(supplierId: string, productId: string): Promise<boolean> {
    try {
      const supplierRef = doc(db, this.SUPPLIERS_COLLECTION, supplierId);
      const supplierDoc = await getDoc(supplierRef);
      
      if (!supplierDoc.exists()) {
        throw new Error('Supplier not found');
      }

      const supplier = supplierDoc.data() as EnhancedSupplier;
      const preferredProducts = (supplier.preferredProducts || []).filter(id => id !== productId);
      
      await updateDoc(supplierRef, {
        preferredProducts,
        updatedAt: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error removing preferred product:', error);
      return false;
    }
  }

  /**
   * Get suppliers for a specific product
   */
  static async getSuppliersForProduct(productId: string, userId: string): Promise<EnhancedSupplier[]> {
    try {
      const suppliers = await this.getActiveSuppliers(userId);
      return suppliers.filter(supplier => 
        supplier.preferredProducts?.includes(productId)
      );
    } catch (error) {
      console.error('Error fetching suppliers for product:', error);
      return [];
    }
  }

  /**
   * Update supplier balance
   */
  static async updateSupplierBalance(
    supplierId: string, 
    amount: number, 
    operation: 'add' | 'subtract'
  ): Promise<boolean> {
    try {
      const supplierRef = doc(db, this.SUPPLIERS_COLLECTION, supplierId);
      const supplierDoc = await getDoc(supplierRef);
      
      if (!supplierDoc.exists()) {
        throw new Error('Supplier not found');
      }

      const supplier = supplierDoc.data() as EnhancedSupplier;
      const currentBalance = supplier.currentBalance || 0;
      const newBalance = operation === 'add' ? currentBalance + amount : currentBalance - amount;
      
      await updateDoc(supplierRef, {
        currentBalance: Math.max(0, newBalance), // Ensure non-negative balance
        updatedAt: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error updating supplier balance:', error);
      return false;
    }
  }

  /**
   * Validate GSTIN format
   */
  private static validateGSTIN(gstin: string): boolean {
    // Basic GSTIN validation - 15 characters alphanumeric
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  }

  /**
   * Deactivate supplier (soft delete)
   */
  static async deactivateSupplier(supplierId: string): Promise<boolean> {
    try {
      const supplierRef = doc(db, this.SUPPLIERS_COLLECTION, supplierId);
      await updateDoc(supplierRef, {
        isActive: false,
        updatedAt: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error deactivating supplier:', error);
      return false;
    }
  }

  /**
   * Reactivate supplier
   */
  static async reactivateSupplier(supplierId: string): Promise<boolean> {
    try {
      const supplierRef = doc(db, this.SUPPLIERS_COLLECTION, supplierId);
      await updateDoc(supplierRef, {
        isActive: true,
        updatedAt: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error reactivating supplier:', error);
      return false;
    }
  }

  /**
   * Get supplier suggestions based on product category or name
   */
  static async getSupplierSuggestions(
    userId: string,
    productId?: string,
    category?: string,
    limit: number = 5
  ): Promise<EnhancedSupplier[]> {
    try {
      const suppliers = await this.getActiveSuppliers(userId);
      
      if (productId) {
        // Return suppliers who have this product in preferred list
        const preferredSuppliers = suppliers.filter(s => 
          s.preferredProducts?.includes(productId)
        );
        
        if (preferredSuppliers.length > 0) {
          return preferredSuppliers.slice(0, limit);
        }
      }

      // Fallback to most active suppliers
      return suppliers
        .sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0))
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting supplier suggestions:', error);
      return [];
    }
  }

  /**
   * Get single supplier by ID
   */
  static async getSupplier(supplierId: string): Promise<EnhancedSupplier> {
    try {
      const supplierDoc = await getDoc(doc(db, this.SUPPLIERS_COLLECTION, supplierId));
      
      if (!supplierDoc.exists()) {
        throw new Error('Supplier not found');
      }

      return { id: supplierDoc.id, ...supplierDoc.data() } as EnhancedSupplier;
    } catch (error) {
      console.error('Error fetching supplier:', error);
      throw error;
    }
  }

  /**
   * Get all suppliers (alias for getAllSuppliers)
   */
  static async getSuppliers(userId: string): Promise<EnhancedSupplier[]> {
    return this.getAllSuppliers(userId);
  }

  /**
   * Delete supplier
   */
  static async deleteSupplier(supplierId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, this.SUPPLIERS_COLLECTION, supplierId));
      return true;
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  }
}

export default EnhancedSupplierService;