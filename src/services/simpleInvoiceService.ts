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
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { Invoice, InvoiceItem, InvoiceStatistics, InvoiceFilters } from '@/types/invoice_no_gst';
import StockManagementService from './stockManagementService';
import { transactionService } from './transactionService';

export interface InvoiceWithStockResult {
  success: boolean;
  invoiceId?: string;
  stockUpdateResult?: any;
  errors?: string[];
  warnings?: string[];
}

export class SimpleInvoiceService {
  private static readonly INVOICES_COLLECTION = 'invoices';

  /**
   * Generate unique invoice number
   */
  static generateInvoiceNumber(type: 'sales' | 'purchase'): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getTime()).slice(-6);
    
    const prefix = type === 'sales' ? 'SI' : 'PI';
    return `${prefix}${year}${month}${day}${time}`;
  }

  /**
   * Calculate invoice totals
   */
  static calculateInvoiceTotals(items: InvoiceItem[]): {
    subtotal: number;
    totalDiscount: number;
    totalAmount: number;
  } {
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    const totalDiscount = items.reduce((sum, item) => {
      const itemSubtotal = item.price * item.quantity;
      if (item.discountType === 'percentage') {
        return sum + (itemSubtotal * item.discount / 100);
      } else if (item.discountType === 'fixed') {
        return sum + item.discount;
      }
      return sum;
    }, 0);
    
    const totalAmount = subtotal - totalDiscount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100
    };
  }

  /**
   * Calculate item totals
   */
  static calculateItemTotals(item: Omit<InvoiceItem, 'finalPrice' | 'totalAmount'>): InvoiceItem {
    const itemSubtotal = item.price * item.quantity;
    let discountAmount = 0;
    
    if (item.discountType === 'percentage') {
      discountAmount = (itemSubtotal * item.discount) / 100;
    } else if (item.discountType === 'fixed') {
      discountAmount = item.discount;
    }
    
    const finalPrice = item.price - (discountAmount / item.quantity);
    const totalAmount = itemSubtotal - discountAmount;
    
    return {
      ...item,
      finalPrice: Math.round(finalPrice * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100
    };
  }

  /**
   * Create invoice with automatic stock management
   */
  static async createInvoiceWithStock(
    invoiceData: Omit<Invoice, 'id' | 'createdAt'>,
    updateStock: boolean = true
  ): Promise<InvoiceWithStockResult> {
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      // Calculate totals
      const calculatedItems = invoiceData.items.map(item => this.calculateItemTotals(item));
      const totals = this.calculateInvoiceTotals(calculatedItems);

      // Enhanced stock validation for sales invoices
      if (updateStock && invoiceData.type === 'sales') {
        const stockItems = calculatedItems
          .filter(item => item.productId && item.quantity)
          .map(item => ({
            productId: item.productId.toString(),
            productName: item.name || item.productName || '',
            quantity: item.quantity
          }));

        if (stockItems.length > 0) {
          // Use enhanced stock validation service
          const { StockValidationService } = await import('./stockValidationService');
          const validation = await StockValidationService.validateStockForInvoice(
            stockItems,
            'sales',
            false, // Don't allow zero stock
            false  // Don't allow negative stock
          );
          
          if (!validation.isValid || !validation.canProceed) {
            const errorMessages = validation.errors.map(error => error.message);
            const warningMessages = validation.warnings.map(warning => warning.message);
            
            return {
              success: false,
              errors: errorMessages,
              warnings: warningMessages
            };
          }
        }
      }

      // Prepare invoice data
      const invoice: Omit<Invoice, 'id'> = {
        ...invoiceData,
        items: calculatedItems,
        subtotal: totals.subtotal,
        totalDiscount: totals.totalDiscount,
        totalAmount: totals.totalAmount,
        balanceAmount: totals.totalAmount - (invoiceData.paidAmount || 0),
        createdAt: now,
        stockUpdated: false
      };

      // Create invoice document
      const invoiceRef = doc(collection(db, this.INVOICES_COLLECTION));
      batch.set(invoiceRef, invoice);

      // Process stock updates if enabled
      let stockUpdateResult;
      if (updateStock && calculatedItems.length > 0) {
        const stockItems = calculatedItems.map(item => ({
          productId: item.productId.toString(),
          quantity: item.quantity,
          productName: item.name || item.productName || ''
        }));

        const invoiceType = invoiceData.type === 'sales' ? 'sales' : 'purchase';
        
        stockUpdateResult = await StockManagementService.processInvoiceStockUpdates(
          stockItems,
          invoiceType,
          invoiceData.invoiceNumber,
          invoiceData.userId || undefined
        );

        if (stockUpdateResult.success) {
          // Mark stock as updated
          batch.update(invoiceRef, { stockUpdated: true });
        }
      }

      // Create accounting transaction
      if (invoiceData.partyId && totals.totalAmount > 0) {
        try {
          const transactionType = invoiceData.type === 'sales' ? 'debit' : 'credit';
          
          const transactionId = await transactionService.createTransaction({
            partyId: invoiceData.partyId,
            userId: invoiceData.userId || 'system',
            amount: totals.totalAmount,
            type: transactionType,
            description: `${invoiceData.type === 'sales' ? 'Sales' : 'Purchase'} Invoice ${invoiceData.invoiceNumber}`,
            reference: invoiceData.invoiceNumber,
            date: invoiceData.date
          });
          
          batch.update(invoiceRef, { transactionId });
        } catch (transactionError) {
          console.error('Error creating transaction for invoice:', transactionError);
          // Don't fail invoice creation if transaction creation fails
        }
      }

      await batch.commit();

      return {
        success: true,
        invoiceId: invoiceRef.id,
        stockUpdateResult,
        warnings: stockUpdateResult?.errors.length ? 
          [`Some stock updates failed: ${stockUpdateResult.errors.map((e: any) => e.error).join(', ')}`] : 
          undefined
      };

    } catch (error) {
      console.error('Error creating invoice with stock:', error);
      return {
        success: false,
        errors: ['Failed to create invoice']
      };
    }
  }

  /**
   * Get invoices with filtering and pagination
   */
  static async getInvoices(
    filters: InvoiceFilters = {},
    userId?: string
  ): Promise<Invoice[]> {
    try {
      let q = query(collection(db, this.INVOICES_COLLECTION));

      // Apply filters
      if (userId) {
        q = query(q, where('userId', '==', userId));
      }
      
      if (filters.type) {
        q = query(q, where('type', '==', filters.type));
      }
      
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      if (filters.paymentStatus) {
        q = query(q, where('paymentStatus', '==', filters.paymentStatus));
      }
      
      if (filters.customerId) {
        q = query(q, where('partyId', '==', filters.customerId));
      }

      // Add ordering
      q = query(q, orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(q);
      let invoices = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invoice[];

      // Apply client-side filters for complex conditions
      if (filters.dateFrom || filters.dateTo) {
        invoices = invoices.filter(invoice => {
          const invoiceDate = new Date(invoice.date);
          if (filters.dateFrom && invoiceDate < new Date(filters.dateFrom)) return false;
          if (filters.dateTo && invoiceDate > new Date(filters.dateTo)) return false;
          return true;
        });
      }

      if (filters.amountFrom !== undefined || filters.amountTo !== undefined) {
        invoices = invoices.filter(invoice => {
          if (filters.amountFrom !== undefined && invoice.totalAmount < filters.amountFrom) return false;
          if (filters.amountTo !== undefined && invoice.totalAmount > filters.amountTo) return false;
          return true;
        });
      }

      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        invoices = invoices.filter(invoice => 
          invoice.invoiceNumber.toLowerCase().includes(searchTerm) ||
          invoice.partyName?.toLowerCase().includes(searchTerm) ||
          invoice.notes?.toLowerCase().includes(searchTerm)
        );
      }

      return invoices;

    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  /**
   * Get invoice by ID
   */
  static async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    try {
      const docRef = doc(db, this.INVOICES_COLLECTION, invoiceId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Invoice;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return null;
    }
  }

  /**
   * Update invoice
   */
  static async updateInvoice(
    invoiceId: string,
    updates: Partial<Invoice>
  ): Promise<{ success: boolean; errors?: string[] }> {
    try {
      const invoiceRef = doc(db, this.INVOICES_COLLECTION, invoiceId);

      // Recalculate totals if items changed
      if (updates.items) {
        const calculatedItems = updates.items.map(item => this.calculateItemTotals(item));
        const totals = this.calculateInvoiceTotals(calculatedItems);
        
        updates = {
          ...updates,
          items: calculatedItems,
          subtotal: totals.subtotal,
          totalDiscount: totals.totalDiscount,
          totalAmount: totals.totalAmount,
          balanceAmount: totals.totalAmount - (updates.paidAmount || 0)
        };
      }

      await updateDoc(invoiceRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });

      return { success: true };

    } catch (error) {
      console.error('Error updating invoice:', error);
      return {
        success: false,
        errors: ['Failed to update invoice']
      };
    }
  }

  /**
   * Delete invoice with stock reversion
   */
  static async deleteInvoice(
    invoiceId: string,
    revertStock: boolean = true
  ): Promise<{ success: boolean; errors?: string[] }> {
    try {
      // Get invoice to revert stock
      const invoice = await this.getInvoiceById(invoiceId);
      if (!invoice) {
        return {
          success: false,
          errors: ['Invoice not found']
        };
      }

      // Revert stock changes if needed
      if (revertStock && invoice.stockUpdated && invoice.items && invoice.items.length > 0) {
        const stockItems = invoice.items.map(item => ({
          productId: item.productId.toString(),
          quantity: item.quantity,
          productName: item.name || item.productName || ''
        }));

        await StockManagementService.revertInvoiceStockUpdates(
          stockItems,
          invoice.type === 'sales' ? 'sales' : 'purchase',
          invoice.invoiceNumber,
          invoice.userId || undefined
        );
      }

      // Delete invoice
      const invoiceRef = doc(db, this.INVOICES_COLLECTION, invoiceId);
      await deleteDoc(invoiceRef);

      return { success: true };

    } catch (error) {
      console.error('Error deleting invoice:', error);
      return {
        success: false,
        errors: ['Failed to delete invoice']
      };
    }
  }

  /**
   * Get invoice statistics
   */
  static async getInvoiceStatistics(
    type?: 'sales' | 'purchase',
    userId?: string
  ): Promise<InvoiceStatistics> {
    try {
      const invoices = await this.getInvoices({ type }, userId);

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalInvoices = invoices.length;
      const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const paidAmount = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
      const pendingAmount = totalAmount - paidAmount;

      // Calculate overdue amount
      const overdueInvoices = invoices.filter(inv => {
        if (inv.paymentStatus === 'paid') return false;
        if (!inv.dueDate) return false;
        return new Date(inv.dueDate) < now;
      });
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);

      const thisMonthInvoices = invoices.filter(inv => 
        new Date(inv.date) >= thisMonth
      );
      const thisMonthAmount = thisMonthInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

      const averageInvoiceValue = totalInvoices > 0 ? totalAmount / totalInvoices : 0;

      // Top customers/suppliers
      const entityMap = new Map();
      invoices.forEach(inv => {
        const entityId = inv.partyId;
        const entityName = inv.partyName;
        
        if (entityId) {
          const existing = entityMap.get(entityId) || {
            customerId: entityId,
            customerName: entityName,
            totalAmount: 0,
            invoiceCount: 0
          };
          existing.totalAmount += inv.totalAmount;
          existing.invoiceCount += 1;
          entityMap.set(entityId, existing);
        }
      });

      const topCustomers = Array.from(entityMap.values())
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 5);

      // Status breakdowns
      const statusBreakdown = {
        draft: invoices.filter(inv => inv.status === 'draft').length,
        confirmed: invoices.filter(inv => inv.status === 'confirmed').length,
        cancelled: invoices.filter(inv => inv.status === 'cancelled').length
      };

      const paymentStatusBreakdown = {
        pending: invoices.filter(inv => inv.paymentStatus === 'pending').length,
        partial: invoices.filter(inv => inv.paymentStatus === 'partial').length,
        paid: invoices.filter(inv => inv.paymentStatus === 'paid').length,
        overdue: overdueInvoices.length
      };

      return {
        totalInvoices,
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueAmount,
        thisMonthInvoices: thisMonthInvoices.length,
        thisMonthAmount,
        averageInvoiceValue,
        topCustomers,
        statusBreakdown,
        paymentStatusBreakdown
      };

    } catch (error) {
      console.error('Error getting invoice statistics:', error);
      return {
        totalInvoices: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        thisMonthInvoices: 0,
        thisMonthAmount: 0,
        averageInvoiceValue: 0,
        topCustomers: [],
        statusBreakdown: {
          draft: 0,
          confirmed: 0,
          cancelled: 0
        },
        paymentStatusBreakdown: {
          pending: 0,
          partial: 0,
          paid: 0,
          overdue: 0
        }
      };
    }
  }
}

export default SimpleInvoiceService;