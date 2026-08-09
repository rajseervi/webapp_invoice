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
import { Supplier } from '@/types/purchase';

export interface SupplierFilters {
  isActive?: boolean;
  searchTerm?: string;
}

export class SupplierService {
  private static readonly SUPPLIERS_COLLECTION = 'suppliers';

  /**
   * Create a new supplier
   */
  static async createSupplier(
    supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const now = new Date().toISOString();
      
      const supplierRef = await addDoc(collection(db, this.SUPPLIERS_COLLECTION), {
        ...supplierData,
        createdAt: now,
        updatedAt: now
      });

      return supplierRef.id;

    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  }

  /**
   * Update supplier
   */
  static async updateSupplier(
    supplierId: string,
    updates: Partial<Supplier>
  ): Promise<void> {
    try {
      const supplierRef = doc(db, this.SUPPLIERS_COLLECTION, supplierId);
      await updateDoc(supplierRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  }

  /**
   * Delete supplier
   */
  static async deleteSupplier(supplierId: string): Promise<void> {
    try {
      const supplierRef = doc(db, this.SUPPLIERS_COLLECTION, supplierId);
      await deleteDoc(supplierRef);

    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  }

  /**
   * Get supplier by ID
   */
  static async getSupplierById(supplierId: string): Promise<Supplier | null> {
    try {
      const supplierRef = doc(db, this.SUPPLIERS_COLLECTION, supplierId);
      const supplierSnap = await getDoc(supplierRef);

      if (!supplierSnap.exists()) {
        return null;
      }

      return { id: supplierSnap.id, ...supplierSnap.data() } as Supplier;

    } catch (error) {
      console.error('Error fetching supplier:', error);
      return null;
    }
  }

  /**
   * Get all suppliers with filters
   */
  static async getSuppliers(
    filters: SupplierFilters = {},
    userId?: string
  ): Promise<Supplier[]> {
    try {
      let q = query(collection(db, this.SUPPLIERS_COLLECTION));

      // Filter by user if provided
      if (userId) {
        q = query(q, where('userId', '==', userId));
      }

      // Filter by active status
      if (filters.isActive !== undefined) {
        q = query(q, where('isActive', '==', filters.isActive));
      }

      // Add ordering
      q = query(q, orderBy('name', 'asc'));

      const querySnapshot = await getDocs(q);
      let suppliers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Supplier[];

      // Apply search filter (client-side)
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        suppliers = suppliers.filter(supplier =>
          supplier.name.toLowerCase().includes(searchTerm) ||
          (supplier.email && supplier.email.toLowerCase().includes(searchTerm)) ||
          (supplier.phone && supplier.phone.includes(searchTerm)) ||
          (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(searchTerm))
        );
      }

      return suppliers;

    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return [];
    }
  }

  /**
   * Get active suppliers
   */
  static async getActiveSuppliers(userId?: string): Promise<Supplier[]> {
    return this.getSuppliers({ isActive: true }, userId);
  }

  /**
   * Search suppliers by name
   */
  static async searchSuppliers(
    searchTerm: string,
    userId?: string,
    limitCount: number = 10
  ): Promise<Supplier[]> {
    try {
      let q = query(collection(db, this.SUPPLIERS_COLLECTION));

      if (userId) {
        q = query(q, where('userId', '==', userId));
      }

      q = query(q, where('isActive', '==', true), orderBy('name', 'asc'), limit(limitCount));

      const querySnapshot = await getDocs(q);
      const suppliers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Supplier[];

      // Filter by search term
      const searchTermLower = searchTerm.toLowerCase();
      return suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTermLower) ||
        (supplier.email && supplier.email.toLowerCase().includes(searchTermLower)) ||
        (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(searchTermLower))
      );

    } catch (error) {
      console.error('Error searching suppliers:', error);
      return [];
    }
  }

  /**
   * Get supplier statistics
   */
  static async getSupplierStatistics(userId?: string): Promise<{
    totalSuppliers: number;
    activeSuppliers: number;
    inactiveSuppliers: number;
  }> {
    try {
      const suppliers = await this.getSuppliers({}, userId);
      
      const totalSuppliers = suppliers.length;
      const activeSuppliers = suppliers.filter(s => s.isActive).length;
      const inactiveSuppliers = totalSuppliers - activeSuppliers;

      return {
        totalSuppliers,
        activeSuppliers,
        inactiveSuppliers
      };

    } catch (error) {
      console.error('Error getting supplier statistics:', error);
      return {
        totalSuppliers: 0,
        activeSuppliers: 0,
        inactiveSuppliers: 0
      };
    }
  }

  /**
   * Validate supplier data
   */
  static validateSupplierData(supplierData: Partial<Supplier>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!supplierData.name || supplierData.name.trim().length === 0) {
      errors.push('Supplier name is required');
    }

    if (supplierData.email && !this.isValidEmail(supplierData.email)) {
      errors.push('Invalid email format');
    }

    if (supplierData.phone && !this.isValidPhone(supplierData.phone)) {
      errors.push('Invalid phone number format');
    }

    if (supplierData.gstin && !this.isValidGSTIN(supplierData.gstin)) {
      errors.push('Invalid GSTIN format');
    }

    if (supplierData.creditLimit && supplierData.creditLimit < 0) {
      errors.push('Credit limit cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  private static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  /**
   * Validate GSTIN format
   */
  private static isValidGSTIN(gstin: string): boolean {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  }
}

export default SupplierService;