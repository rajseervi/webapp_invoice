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

export interface PurchaseInvoiceItem {
  id?: string;
  productId: string;
  productName: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  discountType?: 'percentage' | 'amount';
  discountValue?: number;
  discountAmount?: number;
  gstRate: number;
  unitOfMeasurement: string;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  totalAmount: number;
}

export interface PurchaseInvoice {
  id?: string;
  invoiceNumber: string;
  supplierInvoiceNumber: string;
  supplierId?: string;
  supplierName: string;
  supplierGstin?: string;
  supplierAddress?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  supplierStateCode?: string;
  purchaseDate: string;
  dueDate?: string;
  items: PurchaseInvoiceItem[];
  subtotal: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTaxAmount: number;
  totalAmount: number;
  roundOffAmount: number;
  finalAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  paidAmount: number;
  balanceAmount: number;
  paymentMethod?: string;
  notes?: string;
  companyStateCode: string;
  isInterState: boolean;
  stockUpdated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PurchasePayment {
  id?: string;
  purchaseInvoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'bank' | 'cheque' | 'upi' | 'card';
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface PurchaseInvoiceFilters {
  supplierId?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  amountFrom?: number;
  amountTo?: number;
  searchTerm?: string;
}

export interface PurchaseInvoiceStatistics {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  thisMonthInvoices: number;
  thisMonthAmount: number;
  averageInvoiceValue: number;
  topSuppliers: Array<{
    supplierId: string;
    supplierName: string;
    totalAmount: number;
    invoiceCount: number;
  }>;
  gstSummary: {
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalTax: number;
  };
  paymentStatusBreakdown: {
    pending: number;
    partial: number;
    paid: number;
    overdue: number;
  };
  pendingInvoices?: number;
}

export class PurchaseInvoiceService {
  private static readonly COLLECTION_NAME = 'purchase_invoices';
  private static readonly PAYMENTS_COLLECTION = 'purchase_payments';

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
   * Calculate GST for invoice item with discount support
   */
  static calculateItemGst(
    item: Omit<PurchaseInvoiceItem, 'taxableAmount' | 'cgstAmount' | 'sgstAmount' | 'igstAmount' | 'totalTaxAmount' | 'totalAmount' | 'discountAmount'>,
    isInterState: boolean,
    priceIncludesGst: boolean = false
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
    
    // Amount after discount
    const amountAfterDiscount = baseAmount - discountAmount;
    
    let taxableAmount: number;
    
    if (priceIncludesGst) {
      // If price includes GST, calculate taxable amount from discounted amount
      taxableAmount = amountAfterDiscount / (1 + item.gstRate / 100);
    } else {
      // If price excludes GST, taxable amount is the discounted amount
      taxableAmount = amountAfterDiscount;
    }
    
    const gstAmount = (taxableAmount * item.gstRate) / 100;
    
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    
    if (isInterState) {
      igstAmount = gstAmount;
    } else {
      cgstAmount = gstAmount / 2;
      sgstAmount = gstAmount / 2;
    }
    
    const totalTaxAmount = cgstAmount + sgstAmount + igstAmount;
    const totalAmount = taxableAmount + totalTaxAmount;
    
    return {
      ...item,
      discountAmount: Math.round(discountAmount * 100) / 100,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      cgstAmount: Math.round(cgstAmount * 100) / 100,
      sgstAmount: Math.round(sgstAmount * 100) / 100,
      igstAmount: Math.round(igstAmount * 100) / 100,
      totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100
    };
  }

  /**
   * Calculate invoice totals
   */
  static calculateInvoiceTotals(items: PurchaseInvoiceItem[]): {
    subtotal: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalTaxAmount: number;
    totalAmount: number;
    roundOffAmount: number;
    finalAmount: number;
  } {
    const subtotal = items.reduce((sum, item) => sum + item.taxableAmount, 0);
    const totalCgst = items.reduce((sum, item) => sum + item.cgstAmount, 0);
    const totalSgst = items.reduce((sum, item) => sum + item.sgstAmount, 0);
    const totalIgst = items.reduce((sum, item) => sum + item.igstAmount, 0);
    const totalTaxAmount = totalCgst + totalSgst + totalIgst;
    const totalAmount = subtotal + totalTaxAmount;
    
    // Round off to nearest rupee
    const finalAmount = Math.round(totalAmount);
    const roundOffAmount = finalAmount - totalAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalCgst: Math.round(totalCgst * 100) / 100,
      totalSgst: Math.round(totalSgst * 100) / 100,
      totalIgst: Math.round(totalIgst * 100) / 100,
      totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
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

      // Prepare invoice document
      const invoice: Omit<PurchaseInvoice, 'id'> = {
        ...invoiceData,
        stockUpdated: false,
        createdAt: now,
        updatedAt: now
      };

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

      await updateDoc(invoiceRef, {
        ...updates,
        updatedAt: now
      });
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

      await batch.commit();
    } catch (error) {
      console.error('Error deleting purchase invoice:', error);
      throw error;
    }
  }

  /**
   * Add payment to purchase invoice
   */
  static async addPayment(paymentData: Omit<PurchasePayment, 'id' | 'createdAt'>): Promise<string> {
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      // Create payment record
      const payment: Omit<PurchasePayment, 'id'> = {
        ...paymentData,
        createdAt: now
      };

      const paymentRef = doc(collection(db, this.PAYMENTS_COLLECTION));
      batch.set(paymentRef, payment);

      // Update invoice payment status
      const invoice = await this.getPurchaseInvoiceById(paymentData.purchaseInvoiceId);
      if (invoice) {
        const newPaidAmount = invoice.paidAmount + paymentData.amount;
        const newBalanceAmount = invoice.finalAmount - newPaidAmount;
        
        let paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue' = 'pending';
        if (newBalanceAmount <= 0) {
          paymentStatus = 'paid';
        } else if (newPaidAmount > 0) {
          paymentStatus = 'partial';
        }

        const invoiceRef = doc(db, this.COLLECTION_NAME, paymentData.purchaseInvoiceId);
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
   * Get payments for an invoice
   */
  static async getPaymentsByInvoiceId(invoiceId: string): Promise<PurchasePayment[]> {
    try {
      const q = query(
        collection(db, this.PAYMENTS_COLLECTION),
        where('purchaseInvoiceId', '==', invoiceId),
        orderBy('createdAt', 'desc')
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
  static async getPurchaseInvoiceStatistics(): Promise<PurchaseInvoiceStatistics> {
    try {
      const q = query(collection(db, this.COLLECTION_NAME));
      const querySnapshot = await getDocs(q);
      const invoices = querySnapshot.docs.map(doc => doc.data()) as PurchaseInvoice[];

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalInvoices = invoices.length;
      const totalAmount = invoices.reduce((sum, inv) => sum + inv.finalAmount, 0);
      const paidAmount = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
      const pendingAmount = totalAmount - paidAmount;

      const thisMonthInvoices = invoices.filter(inv => 
        new Date(inv.purchaseDate) >= thisMonth
      );
      const thisMonthAmount = thisMonthInvoices.reduce((sum, inv) => sum + inv.finalAmount, 0);

      const averageInvoiceValue = totalInvoices > 0 ? totalAmount / totalInvoices : 0;

      // Top suppliers
      const supplierMap = new Map();
      invoices.forEach(inv => {
        const supplierId = inv.supplierId || inv.supplierName;
        const existing = supplierMap.get(supplierId) || {
          supplierId,
          supplierName: inv.supplierName,
          totalAmount: 0,
          invoiceCount: 0
        };
        existing.totalAmount += inv.finalAmount;
        existing.invoiceCount += 1;
        supplierMap.set(supplierId, existing);
      });

      const topSuppliers = Array.from(supplierMap.values())
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 5);

      // GST summary
      const gstSummary = {
        totalCgst: invoices.reduce((sum, inv) => sum + inv.totalCgst, 0),
        totalSgst: invoices.reduce((sum, inv) => sum + inv.totalSgst, 0),
        totalIgst: invoices.reduce((sum, inv) => sum + inv.totalIgst, 0),
        totalTax: invoices.reduce((sum, inv) => sum + inv.totalTaxAmount, 0)
      };

      // Payment status breakdown
      const paymentStatusBreakdown = {
        pending: invoices.filter(inv => inv.paymentStatus === 'pending').length,
        partial: invoices.filter(inv => inv.paymentStatus === 'partial').length,
        paid: invoices.filter(inv => inv.paymentStatus === 'paid').length,
        overdue: invoices.filter(inv => inv.paymentStatus === 'overdue').length
      };

      return {
        totalInvoices,
        totalAmount,
        paidAmount,
        pendingAmount,
        thisMonthInvoices: thisMonthInvoices.length,
        thisMonthAmount,
        averageInvoiceValue,
        topSuppliers,
        gstSummary,
        paymentStatusBreakdown,
        pendingInvoices: paymentStatusBreakdown.pending + paymentStatusBreakdown.partial
      };

    } catch (error) {
      console.error('Error getting purchase invoice statistics:', error);
      return {
        totalInvoices: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        thisMonthInvoices: 0,
        thisMonthAmount: 0,
        averageInvoiceValue: 0,
        topSuppliers: [],
        gstSummary: {
          totalCgst: 0,
          totalSgst: 0,
          totalIgst: 0,
          totalTax: 0
        },
        paymentStatusBreakdown: {
          pending: 0,
          partial: 0,
          paid: 0,
          overdue: 0
        },
        pendingInvoices: 0
      };
    }
  }
}