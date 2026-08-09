import { db } from '@/lib/firebase';
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
  QueryConstraint
} from 'firebase/firestore';
import { productService } from './productService';
import {
  PurchaseInvoiceItem,
  PurchaseInvoice,
  PurchasePayment,
  PurchaseInvoiceFilters,
  PurchaseInvoiceStatistics
} from '@/types/purchase_no_gst';

export class PurchaseInvoiceServiceNoGST {
  private static readonly COLLECTION_NAME = 'purchase_invoices_no_gst';
  private static readonly PAYMENTS_COLLECTION = 'purchase_payments_no_gst';

  /**
   * Helper function to remove undefined values from objects
   */
  private static removeUndefined(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefined(item));
    }
    
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = this.removeUndefined(value);
        }
      }
      return cleaned;
    }
    
    return obj;
  }

  /**
   * Generate unique invoice number
   */
  static generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getTime()).slice(-6);
    
    return `PI${year}${month}${day}${time}`;
  }

  /**
   * Calculate item totals with discount support (no GST)
   */
  static calculateItemTotal(
    item: Omit<PurchaseInvoiceItem, 'totalAmount' | 'discountAmount'>
  ): PurchaseInvoiceItem {
    let baseAmount = item.unitPrice * item.quantity;
    let discountAmount = 0;
    
    // Calculate discount amount
    if (item.discountType && item.discountValue && item.discountValue > 0) {
      if (item.discountType === 'percentage') {
        discountAmount = (baseAmount * item.discountValue) / 100;
      } else if (item.discountType === 'amount') {
        discountAmount = item.discountValue;
      }
    }
    
    // Total amount after discount
    const totalAmount = baseAmount - discountAmount;
    
    return {
      ...item,
      discountAmount: Math.round(discountAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100
    };
  }

  /**
   * Calculate invoice totals (no GST)
   */
  static calculateInvoiceTotals(items: PurchaseInvoiceItem[]): {
    subtotal: number;
    totalDiscountAmount: number;
    totalAmount: number;
    roundOffAmount: number;
    finalAmount: number;
  } {
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const totalDiscountAmount = items.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);
    
    // Round off to nearest rupee
    const finalAmount = Math.round(totalAmount);
    const roundOffAmount = finalAmount - totalAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscountAmount: Math.round(totalDiscountAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      roundOffAmount: Math.round(roundOffAmount * 100) / 100,
      finalAmount
    };
  }

  /**
   * Create purchase invoice with stock update
   */
  static async createPurchaseInvoice(
    invoiceData: Omit<PurchaseInvoice, 'id' | 'createdAt' | 'updatedAt' | 'stockUpdated'>,
    updateStock: boolean = true
  ): Promise<string> {
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      // Prepare invoice document and remove undefined values
      const invoice: Omit<PurchaseInvoice, 'id'> = this.removeUndefined({
        ...invoiceData,
        stockUpdated: false,
        createdAt: now,
        updatedAt: now
      });

      // Create invoice document
      const invoiceRef = doc(collection(db, this.COLLECTION_NAME));
      batch.set(invoiceRef, invoice);

      // Update stock for each item
      if (updateStock) {
        for (const item of invoiceData.items) {
          try {
            const product = await productService.getProductById(item.productId);
            if (product) {
              const newQuantity = product.quantity + item.quantity;
              const productRef = doc(db, 'products', item.productId);
              batch.update(productRef, {
                quantity: newQuantity,
                updatedAt: now
              });
            }
          } catch (error) {
            console.error(`Error updating stock for product ${item.productId}:`, error);
          }
        }
        
        // Mark stock as updated
        batch.update(invoiceRef, { stockUpdated: true });
      }

      await batch.commit();
      return invoiceRef.id;

    } catch (error) {
      console.error('Error creating purchase invoice:', error);
      throw new Error('Failed to create purchase invoice.');
    }
  }

  /**
   * Get purchase invoices with filtering and pagination
   */
  static async getPurchaseInvoices(
    filters: PurchaseInvoiceFilters = {},
    sortOptions: { field: string; direction: 'asc' | 'desc' } = { field: 'purchaseDate', direction: 'desc' },
    pagination: { page: number; limit: number } = { page: 0, limit: 50 }
  ): Promise<{ invoices: PurchaseInvoice[]; totalCount: number; hasMore: boolean }> {
    try {
      let q = query(collection(db, this.COLLECTION_NAME));

      // Apply filters
      if (filters.supplierId) {
        q = query(q, where('supplierId', '==', filters.supplierId));
      }
      
      if (filters.paymentStatus) {
        q = query(q, where('paymentStatus', '==', filters.paymentStatus));
      }

      // Add ordering and pagination
      q = query(q, orderBy(sortOptions.field, sortOptions.direction));
      
      if (pagination.page > 0) {
        q = query(q, startAfter(pagination.page * pagination.limit));
      }
      
      q = query(q, limit(pagination.limit + 1)); // Get one extra to check if there are more

      const querySnapshot = await getDocs(q);
      const invoices = querySnapshot.docs.slice(0, pagination.limit).map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PurchaseInvoice[];

      // Apply client-side filters for complex conditions
      let filteredInvoices = invoices;

      if (filters.dateFrom || filters.dateTo) {
        filteredInvoices = filteredInvoices.filter(invoice => {
          const invoiceDate = new Date(invoice.purchaseDate);
          if (filters.dateFrom && invoiceDate < new Date(filters.dateFrom)) return false;
          if (filters.dateTo && invoiceDate > new Date(filters.dateTo)) return false;
          return true;
        });
      }

      if (filters.amountFrom !== undefined || filters.amountTo !== undefined) {
        filteredInvoices = filteredInvoices.filter(invoice => {
          if (filters.amountFrom !== undefined && invoice.finalAmount < filters.amountFrom) return false;
          if (filters.amountTo !== undefined && invoice.finalAmount > filters.amountTo) return false;
          return true;
        });
      }

      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        filteredInvoices = filteredInvoices.filter(invoice => 
          invoice.invoiceNumber.toLowerCase().includes(searchTerm) ||
          invoice.supplierInvoiceNumber.toLowerCase().includes(searchTerm) ||
          invoice.supplierName.toLowerCase().includes(searchTerm) ||
          invoice.notes?.toLowerCase().includes(searchTerm)
        );
      }

      const hasMore = querySnapshot.docs.length > pagination.limit;

      return {
        invoices: filteredInvoices,
        totalCount: filteredInvoices.length,
        hasMore
      };

    } catch (error) {
      console.error('Error fetching purchase invoices:', error);
      return { invoices: [], totalCount: 0, hasMore: false };
    }
  }

  /**
   * Get purchase invoice by ID
   */
  static async getPurchaseInvoiceById(invoiceId: string): Promise<PurchaseInvoice | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, invoiceId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as PurchaseInvoice;
    } catch (error) {
      console.error('Error fetching purchase invoice:', error);
      return null;
    }
  }

  /**
   * Update purchase invoice
   */
  static async updatePurchaseInvoice(
    invoiceId: string,
    updates: Partial<PurchaseInvoice>
  ): Promise<void> {
    try {
      const now = new Date().toISOString();
      const invoiceRef = doc(db, this.COLLECTION_NAME, invoiceId);

      // Remove undefined values from updates
      const cleanUpdates = this.removeUndefined({
        ...updates,
        updatedAt: now
      });

      await updateDoc(invoiceRef, cleanUpdates);
    } catch (error) {
      console.error('Error updating purchase invoice:', error);
      throw error;
    }
  }

  /**
   * Delete purchase invoice
   */
  static async deletePurchaseInvoice(invoiceId: string, revertStock: boolean = true): Promise<void> {
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      // Get invoice to revert stock
      if (revertStock) {
        const invoice = await this.getPurchaseInvoiceById(invoiceId);
        if (invoice && invoice.stockUpdated) {
          for (const item of invoice.items) {
            try {
              const product = await productService.getProductById(item.productId);
              if (product) {
                const newQuantity = Math.max(0, product.quantity - item.quantity);
                const productRef = doc(db, 'products', item.productId);
                batch.update(productRef, {
                  quantity: newQuantity,
                  updatedAt: now
                });
              }
            } catch (error) {
              console.error(`Error reverting stock for product ${item.productId}:`, error);
            }
          }
        }
      }

      // Delete invoice
      const invoiceRef = doc(db, this.COLLECTION_NAME, invoiceId);
      batch.delete(invoiceRef);

      // Delete related payments
      const paymentsQuery = query(
        collection(db, this.PAYMENTS_COLLECTION),
        where('purchaseInvoiceId', '==', invoiceId)
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      paymentsSnapshot.docs.forEach(paymentDoc => {
        batch.delete(paymentDoc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deleting purchase invoice:', error);
      throw error;
    }
  }

  /**
   * Add payment to purchase invoice
   */
  static async addPayment(payment: Omit<PurchasePayment, 'id' | 'createdAt'>): Promise<string> {
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      // Create payment document and remove undefined values
      const paymentData: Omit<PurchasePayment, 'id'> = this.removeUndefined({
        ...payment,
        createdAt: now
      });

      const paymentRef = doc(collection(db, this.PAYMENTS_COLLECTION));
      batch.set(paymentRef, paymentData);

      // Update invoice payment status
      const invoice = await this.getPurchaseInvoiceById(payment.purchaseInvoiceId);
      if (invoice) {
        const newPaidAmount = invoice.paidAmount + payment.amount;
        const newBalanceAmount = invoice.finalAmount - newPaidAmount;
        
        let paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue' = 'pending';
        if (newPaidAmount >= invoice.finalAmount) {
          paymentStatus = 'paid';
        } else if (newPaidAmount > 0) {
          paymentStatus = 'partial';
        }

        const invoiceRef = doc(db, this.COLLECTION_NAME, payment.purchaseInvoiceId);
        batch.update(invoiceRef, {
          paidAmount: newPaidAmount,
          balanceAmount: newBalanceAmount,
          paymentStatus,
          updatedAt: now
        });
      }

      await batch.commit();
      return paymentRef.id;
    } catch (error) {
      console.error('Error adding payment:', error);
      throw error;
    }
  }

  /**
   * Get payments for a purchase invoice
   */
  static async getPaymentsByInvoiceId(invoiceId: string): Promise<PurchasePayment[]> {
    try {
      const q = query(
        collection(db, this.PAYMENTS_COLLECTION),
        where('purchaseInvoiceId', '==', invoiceId),
        orderBy('paymentDate', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PurchasePayment[];
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  }

  /**
   * Get purchase invoice statistics
   */
  static async getStatistics(
    dateFrom?: string,
    dateTo?: string
  ): Promise<PurchaseInvoiceStatistics> {
    try {
      let q = query(collection(db, this.COLLECTION_NAME));
      
      if (dateFrom) {
        q = query(q, where('purchaseDate', '>=', dateFrom));
      }
      if (dateTo) {
        q = query(q, where('purchaseDate', '<=', dateTo));
      }

      const querySnapshot = await getDocs(q);
      const invoices = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PurchaseInvoice[];

      const totalInvoices = invoices.length;
      const totalAmount = invoices.reduce((sum, inv) => sum + inv.finalAmount, 0);
      const paidAmount = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
      const pendingAmount = totalAmount - paidAmount;

      // This month statistics
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const thisMonthInvoices = invoices.filter(inv => 
        new Date(inv.purchaseDate) >= thisMonth
      );
      const thisMonthAmount = thisMonthInvoices.reduce((sum, inv) => sum + inv.finalAmount, 0);

      // Payment status breakdown
      const paymentStatusBreakdown = {
        pending: invoices.filter(inv => inv.paymentStatus === 'pending').length,
        partial: invoices.filter(inv => inv.paymentStatus === 'partial').length,
        paid: invoices.filter(inv => inv.paymentStatus === 'paid').length,
        overdue: invoices.filter(inv => inv.paymentStatus === 'overdue').length
      };

      // Top suppliers
      const supplierMap = new Map<string, { name: string; totalAmount: number; count: number }>();
      invoices.forEach(inv => {
        const key = inv.supplierId || inv.supplierName;
        if (supplierMap.has(key)) {
          const existing = supplierMap.get(key)!;
          existing.totalAmount += inv.finalAmount;
          existing.count += 1;
        } else {
          supplierMap.set(key, {
            name: inv.supplierName,
            totalAmount: inv.finalAmount,
            count: 1
          });
        }
      });

      const topSuppliers = Array.from(supplierMap.entries())
        .map(([id, data]) => ({
          supplierId: id,
          supplierName: data.name,
          totalAmount: data.totalAmount,
          invoiceCount: data.count
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 10);

      return {
        totalInvoices,
        totalAmount,
        paidAmount,
        pendingAmount,
        thisMonthInvoices: thisMonthInvoices.length,
        thisMonthAmount,
        averageInvoiceValue: totalInvoices > 0 ? totalAmount / totalInvoices : 0,
        topSuppliers,
        paymentStatusBreakdown,
        pendingInvoices: paymentStatusBreakdown.pending + paymentStatusBreakdown.partial
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return {
        totalInvoices: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        thisMonthInvoices: 0,
        thisMonthAmount: 0,
        averageInvoiceValue: 0,
        topSuppliers: [],
        paymentStatusBreakdown: { pending: 0, partial: 0, paid: 0, overdue: 0 },
        pendingInvoices: 0
      };
    }
  }
}

export default PurchaseInvoiceServiceNoGST;