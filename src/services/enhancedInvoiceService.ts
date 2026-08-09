import { db } from '@/lib/firebase';
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
  Timestamp,
  limit,
  startAfter
} from 'firebase/firestore';
import { transactionService } from './transactionService';
import { productService } from './productService';
import { partyService } from './partyService';
import EnhancedValidationService, { ValidationResult, InvoiceValidationData } from './enhancedValidationService';

export interface EnhancedInvoice {
  id?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  
  // Customer/Supplier Information
  customerId?: string;
  customerName?: string;
  customerGstin?: string;
  supplierId?: string;
  supplierName?: string;
  supplierGstin?: string;
  
  // Invoice Items
  items: EnhancedInvoiceItem[];
  
  // Financial Details
  subtotal: number;
  totalDiscount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalCess: number;
  totalTaxAmount: number;
  roundOffAmount: number;
  grandTotal: number;
  
  // Payment Information
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  paidAmount: number;
  balanceAmount: number;
  paymentTerms?: string;
  
  // Additional Information
  notes?: string;
  attachments?: string[];
  placeOfSupply?: string;
  reverseCharge?: boolean;
  
  // System Fields
  type: 'sales' | 'purchase';
  status: 'draft' | 'confirmed' | 'cancelled';
  isInterState: boolean;
  stockUpdated: boolean;
  
  // Audit Fields
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  
  // Validation Status
  validationStatus: 'pending' | 'validated' | 'failed';
  validationErrors?: string[];
  
  // Integration Fields
  transactionId?: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  
  // Analytics Fields
  customerCategory?: string;
  productCategories?: string[];
  salesChannel?: string;
  region?: string;
}

export interface EnhancedInvoiceItem {
  id?: string;
  productId: string;
  productName: string;
  productCode?: string;
  hsnCode: string;
  sacCode?: string;
  description?: string;
  
  // Quantity and Pricing
  quantity: number;
  unitOfMeasurement: string;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  
  // Tax Information
  taxableAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalTaxAmount: number;
  totalAmount: number;
  
  // Additional Fields
  isService: boolean;
  batchNumber?: string;
  expiryDate?: string;
  serialNumbers?: string[];
}

export interface InvoiceStatistics {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  thisMonthInvoices: number;
  thisMonthAmount: number;
  averageInvoiceValue: number;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalAmount: number;
    invoiceCount: number;
  }>;
  gstSummary: {
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalTax: number;
  };
  statusBreakdown: {
    draft: number;
    confirmed: number;
    cancelled: number;
  };
  paymentStatusBreakdown: {
    pending: number;
    partial: number;
    paid: number;
    overdue: number;
  };
}

export interface InvoiceFilters {
  type?: 'sales' | 'purchase';
  status?: string;
  paymentStatus?: string;
  customerId?: string;
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountFrom?: number;
  amountTo?: number;
  searchTerm?: string;
}

export class EnhancedInvoiceService {
  private static readonly COLLECTION_NAME = 'invoices_enhanced';
  private static readonly INVOICE_ITEMS_COLLECTION = 'invoice_items';
  private static readonly INVOICE_PAYMENTS_COLLECTION = 'invoice_payments';

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
   * Calculate GST for invoice item
   */
  static calculateItemGst(
    item: Omit<EnhancedInvoiceItem, 'taxableAmount' | 'cgstAmount' | 'sgstAmount' | 'igstAmount' | 'totalTaxAmount' | 'totalAmount'>,
    isInterState: boolean
  ): EnhancedInvoiceItem {
    const baseAmount = item.unitPrice * item.quantity;
    const discountAmount = (baseAmount * item.discountPercent) / 100;
    const taxableAmount = baseAmount - discountAmount;
    
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
    
    const totalTaxAmount = cgstAmount + sgstAmount + igstAmount + (item.cessAmount || 0);
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
  static calculateInvoiceTotals(items: EnhancedInvoiceItem[]): {
    subtotal: number;
    totalDiscount: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalCess: number;
    totalTaxAmount: number;
    roundOffAmount: number;
    grandTotal: number;
  } {
    const subtotal = items.reduce((sum, item) => sum + item.taxableAmount, 0);
    const totalDiscount = items.reduce((sum, item) => sum + item.discountAmount, 0);
    const totalCgst = items.reduce((sum, item) => sum + item.cgstAmount, 0);
    const totalSgst = items.reduce((sum, item) => sum + item.sgstAmount, 0);
    const totalIgst = items.reduce((sum, item) => sum + item.igstAmount, 0);
    const totalCess = items.reduce((sum, item) => sum + (item.cessAmount || 0), 0);
    const totalTaxAmount = totalCgst + totalSgst + totalIgst + totalCess;
    const totalAmount = subtotal + totalTaxAmount;
    
    // Round off to nearest rupee
    const grandTotal = Math.round(totalAmount);
    const roundOffAmount = grandTotal - totalAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      totalCgst: Math.round(totalCgst * 100) / 100,
      totalSgst: Math.round(totalSgst * 100) / 100,
      totalIgst: Math.round(totalIgst * 100) / 100,
      totalCess: Math.round(totalCess * 100) / 100,
      totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
      roundOffAmount: Math.round(roundOffAmount * 100) / 100,
      grandTotal
    };
  }

  /**
   * Create enhanced invoice with validation
   */
  static async createInvoice(
    invoiceData: Omit<EnhancedInvoice, 'id' | 'createdAt' | 'updatedAt' | 'validationStatus' | 'syncStatus'>,
    validateBeforeSave: boolean = true
  ): Promise<{ success: boolean; invoiceId?: string; validation?: ValidationResult }> {
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      // Validate invoice data if requested
      let validationResult: ValidationResult | undefined;
      if (validateBeforeSave) {
        // First, validate stock for sales invoices
        if (invoiceData.type === 'sales') {
          const { StockValidationService } = await import('./stockValidationService');
          const stockItems = invoiceData.items
            .filter(item => item.productId && item.quantity > 0)
            .map(item => ({
              productId: item.productId!,
              productName: item.productName || '',
              quantity: item.quantity
            }));

          if (stockItems.length > 0) {
            const stockValidation = await StockValidationService.validateStockForInvoice(
              stockItems,
              'sales',
              false, // Don't allow zero stock
              false  // Don't allow negative stock
            );

            if (!stockValidation.isValid || !stockValidation.canProceed) {
              return {
                success: false,
                validation: {
                  isValid: false,
                  errors: stockValidation.errors.map(error => error.message),
                  warnings: stockValidation.warnings.map(warning => warning.message),
                  details: stockValidation
                }
              };
            }
          }
        }

        // Then validate other invoice data
        const validationData: InvoiceValidationData = {
          invoiceNumber: invoiceData.invoiceNumber,
          date: invoiceData.invoiceDate,
          customerId: invoiceData.customerId,
          supplierId: invoiceData.supplierId,
          items: invoiceData.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            gstRate: item.gstRate,
            discountPercent: item.discountPercent
          })),
          totalAmount: invoiceData.grandTotal,
          gstAmount: invoiceData.totalTaxAmount,
          subtotal: invoiceData.subtotal,
          type: invoiceData.type
        };

        validationResult = await EnhancedValidationService.validateInvoice(validationData);
        
        if (!validationResult.isValid) {
          return {
            success: false,
            validation: validationResult
          };
        }
      }

      // Determine if inter-state transaction
      let isInterState = false;
      if (invoiceData.type === 'sales' && invoiceData.customerId) {
        const customer = await partyService.getPartyById(invoiceData.customerId);
        if (customer && customer.stateCode) {
          // Assuming company state code is stored in settings or config
          const companyStateCode = '27'; // This should come from company settings
          isInterState = customer.stateCode !== companyStateCode;
        }
      }

      // Calculate GST for each item
      const itemsWithGst = invoiceData.items.map(item => 
        this.calculateItemGst(item, isInterState)
      );

      // Calculate totals
      const totals = this.calculateInvoiceTotals(itemsWithGst);

      // Prepare invoice document
      const invoice: Omit<EnhancedInvoice, 'id'> = {
        ...invoiceData,
        items: itemsWithGst,
        ...totals,
        balanceAmount: totals.grandTotal - (invoiceData.paidAmount || 0),
        isInterState,
        stockUpdated: false,
        validationStatus: validationResult ? 'validated' : 'pending',
        validationErrors: validationResult?.errors.map(e => e.message),
        syncStatus: 'pending',
        createdAt: now,
        updatedAt: now
      };

      // Create invoice document
      const invoiceRef = doc(collection(db, this.COLLECTION_NAME));
      batch.set(invoiceRef, invoice);

      // Update stock for regular invoices
      if (invoiceData.type === 'sales') {
        for (const item of itemsWithGst) {
          const product = await productService.getProductById(item.productId);
          if (product) {
            const newQuantity = Math.max(0, product.quantity - item.quantity);
            const productRef = doc(db, 'products', item.productId);
            batch.update(productRef, {
              quantity: newQuantity,
              updatedAt: now
            });
          }
        }
        
        // Mark stock as updated
        batch.update(invoiceRef, { stockUpdated: true });
      }

      // Create transaction for accounting
      if (invoiceData.customerId || invoiceData.supplierId) {
        try {
          const partyId = invoiceData.customerId || invoiceData.supplierId!;
          const transactionType = invoiceData.type === 'sales' ? 'debit' : 'credit';
          
          const transactionId = await transactionService.createTransaction({
            partyId,
            userId: invoiceData.createdBy,
            amount: totals.grandTotal,
            type: transactionType,
            description: `${invoiceData.type === 'sales' ? 'Sales' : 'Purchase'} Invoice ${invoiceData.invoiceNumber}`,
            reference: invoiceData.invoiceNumber,
            date: invoiceData.invoiceDate
          });

          batch.update(invoiceRef, { 
            transactionId,
            syncStatus: 'synced'
          });
        } catch (error) {
          console.error('Error creating transaction:', error);
          // Don't fail invoice creation if transaction creation fails
        }
      }

      await batch.commit();

      return {
        success: true,
        invoiceId: invoiceRef.id,
        validation: validationResult
      };

    } catch (error) {
      console.error('Error creating invoice:', error);
      return {
        success: false,
        validation: {
          isValid: false,
          errors: [{
            field: 'general',
            message: 'Failed to create invoice',
            type: 'business_rule',
            severity: 'error'
          }],
          warnings: []
        }
      };
    }
  }

  /**
   * Get invoices with filtering and pagination
   */
  static async getInvoices(
    filters: InvoiceFilters = {},
    pageSize: number = 50,
    lastDoc?: any
  ): Promise<{ invoices: EnhancedInvoice[]; hasMore: boolean; lastDoc?: any }> {
    try {
      let q = query(collection(db, this.COLLECTION_NAME));

      // Apply filters
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
        q = query(q, where('customerId', '==', filters.customerId));
      }
      
      if (filters.supplierId) {
        q = query(q, where('supplierId', '==', filters.supplierId));
      }

      // Add ordering and pagination
      q = query(q, orderBy('createdAt', 'desc'));
      
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      
      q = query(q, limit(pageSize + 1)); // Get one extra to check if there are more

      const querySnapshot = await getDocs(q);
      const invoices = querySnapshot.docs.slice(0, pageSize).map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EnhancedInvoice[];

      // Apply client-side filters for complex conditions
      let filteredInvoices = invoices;

      if (filters.dateFrom || filters.dateTo) {
        filteredInvoices = filteredInvoices.filter(invoice => {
          const invoiceDate = new Date(invoice.invoiceDate);
          if (filters.dateFrom && invoiceDate < new Date(filters.dateFrom)) return false;
          if (filters.dateTo && invoiceDate > new Date(filters.dateTo)) return false;
          return true;
        });
      }

      if (filters.amountFrom !== undefined || filters.amountTo !== undefined) {
        filteredInvoices = filteredInvoices.filter(invoice => {
          if (filters.amountFrom !== undefined && invoice.grandTotal < filters.amountFrom) return false;
          if (filters.amountTo !== undefined && invoice.grandTotal > filters.amountTo) return false;
          return true;
        });
      }

      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        filteredInvoices = filteredInvoices.filter(invoice => 
          invoice.invoiceNumber.toLowerCase().includes(searchTerm) ||
          invoice.customerName?.toLowerCase().includes(searchTerm) ||
          invoice.supplierName?.toLowerCase().includes(searchTerm) ||
          invoice.notes?.toLowerCase().includes(searchTerm)
        );
      }

      const hasMore = querySnapshot.docs.length > pageSize;
      const newLastDoc = hasMore ? querySnapshot.docs[pageSize - 1] : undefined;

      return {
        invoices: filteredInvoices,
        hasMore,
        lastDoc: newLastDoc
      };

    } catch (error) {
      console.error('Error fetching invoices:', error);
      return { invoices: [], hasMore: false };
    }
  }

  /**
   * Get invoice by ID
   */
  static async getInvoiceById(invoiceId: string): Promise<EnhancedInvoice | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, invoiceId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as EnhancedInvoice;
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
    updates: Partial<EnhancedInvoice>,
    validateBeforeUpdate: boolean = true
  ): Promise<{ success: boolean; validation?: ValidationResult }> {
    try {
      const now = new Date().toISOString();
      const invoiceRef = doc(db, this.COLLECTION_NAME, invoiceId);

      // Get current invoice for validation
      const currentInvoice = await this.getInvoiceById(invoiceId);
      if (!currentInvoice) {
        return {
          success: false,
          validation: {
            isValid: false,
            errors: [{
              field: 'general',
              message: 'Invoice not found',
              type: 'business_rule',
              severity: 'error'
            }],
            warnings: []
          }
        };
      }

      // Merge updates with current data
      const updatedInvoice = { ...currentInvoice, ...updates };

      // Validate if requested
      let validationResult: ValidationResult | undefined;
      if (validateBeforeUpdate) {
        const validationData: InvoiceValidationData = {
          id: invoiceId,
          invoiceNumber: updatedInvoice.invoiceNumber,
          date: updatedInvoice.invoiceDate,
          customerId: updatedInvoice.customerId,
          supplierId: updatedInvoice.supplierId,
          items: updatedInvoice.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            gstRate: item.gstRate,
            discountPercent: item.discountPercent
          })),
          totalAmount: updatedInvoice.grandTotal,
          gstAmount: updatedInvoice.totalTaxAmount,
          subtotal: updatedInvoice.subtotal,
          type: updatedInvoice.type
        };

        validationResult = await EnhancedValidationService.validateInvoice(validationData);
        
        if (!validationResult.isValid) {
          return {
            success: false,
            validation: validationResult
          };
        }
      }

      // Recalculate if items changed
      if (updates.items) {
        const itemsWithGst = updates.items.map(item => 
          this.calculateItemGst(item, updatedInvoice.isInterState)
        );
        const totals = this.calculateInvoiceTotals(itemsWithGst);
        
        updates = {
          ...updates,
          items: itemsWithGst,
          ...totals,
          balanceAmount: totals.grandTotal - (updatedInvoice.paidAmount || 0)
        };
      }

      await updateDoc(invoiceRef, {
        ...updates,
        updatedAt: now,
        validationStatus: validationResult ? 'validated' : 'pending',
        validationErrors: validationResult?.errors.map(e => e.message)
      });

      return {
        success: true,
        validation: validationResult
      };

    } catch (error) {
      console.error('Error updating invoice:', error);
      return {
        success: false,
        validation: {
          isValid: false,
          errors: [{
            field: 'general',
            message: 'Failed to update invoice',
            type: 'business_rule',
            severity: 'error'
          }],
          warnings: []
        }
      };
    }
  }

  /**
   * Delete invoice
   */
  static async deleteInvoice(invoiceId: string, revertStock: boolean = true): Promise<boolean> {
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      // Get invoice to revert stock
      if (revertStock) {
        const invoice = await this.getInvoiceById(invoiceId);
        if (invoice && invoice.type === 'sales' && invoice.stockUpdated) {
          for (const item of invoice.items) {
            const product = await productService.getProductById(item.productId);
            if (product) {
              const newQuantity = product.quantity + item.quantity;
              const productRef = doc(db, 'products', item.productId);
              batch.update(productRef, {
                quantity: newQuantity,
                updatedAt: now
              });
            }
          }
        }
      }

      // Delete invoice
      const invoiceRef = doc(db, this.COLLECTION_NAME, invoiceId);
      batch.delete(invoiceRef);

      await batch.commit();
      return true;

    } catch (error) {
      console.error('Error deleting invoice:', error);
      return false;
    }
  }

  /**
   * Get invoice statistics
   */
  static async getInvoiceStatistics(type?: 'sales' | 'purchase'): Promise<InvoiceStatistics> {
    try {
      let q = query(collection(db, this.COLLECTION_NAME));
      
      if (type) {
        q = query(q, where('type', '==', type));
      }

      const querySnapshot = await getDocs(q);
      const invoices = querySnapshot.docs.map(doc => doc.data()) as EnhancedInvoice[];

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalInvoices = invoices.length;
      const totalAmount = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
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
        new Date(inv.invoiceDate) >= thisMonth
      );
      const thisMonthAmount = thisMonthInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

      const averageInvoiceValue = totalInvoices > 0 ? totalAmount / totalInvoices : 0;

      // Top customers/suppliers
      const entityMap = new Map();
      invoices.forEach(inv => {
        const entityId = inv.customerId || inv.supplierId;
        const entityName = inv.customerName || inv.supplierName;
        
        if (entityId) {
          const existing = entityMap.get(entityId) || {
            customerId: entityId,
            customerName: entityName,
            totalAmount: 0,
            invoiceCount: 0
          };
          existing.totalAmount += inv.grandTotal;
          existing.invoiceCount += 1;
          entityMap.set(entityId, existing);
        }
      });

      const topCustomers = Array.from(entityMap.values())
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 5);

      // GST summary
      const gstSummary = {
        totalCgst: invoices.reduce((sum, inv) => sum + inv.totalCgst, 0),
        totalSgst: invoices.reduce((sum, inv) => sum + inv.totalSgst, 0),
        totalIgst: invoices.reduce((sum, inv) => sum + inv.totalIgst, 0),
        totalTax: invoices.reduce((sum, inv) => sum + inv.totalTaxAmount, 0)
      };

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
        gstSummary,
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
        gstSummary: {
          totalCgst: 0,
          totalSgst: 0,
          totalIgst: 0,
          totalTax: 0
        },
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

  /**
   * Bulk operations
   */
  static async bulkUpdateStatus(invoiceIds: string[], status: string): Promise<boolean> {
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      invoiceIds.forEach(id => {
        const invoiceRef = doc(db, this.COLLECTION_NAME, id);
        batch.update(invoiceRef, {
          status,
          updatedAt: now
        });
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error bulk updating status:', error);
      return false;
    }
  }

  /**
   * Export invoices to CSV
   */
  static async exportToCSV(filters: InvoiceFilters = {}): Promise<string> {
    try {
      const { invoices } = await this.getInvoices(filters, 1000); // Get up to 1000 invoices
      
      const headers = [
        'Invoice Number',
        'Date',
        'Type',
        'Customer/Supplier',
        'Subtotal',
        'GST Amount',
        'Total Amount',
        'Payment Status',
        'Status'
      ];

      const rows = invoices.map(invoice => [
        invoice.invoiceNumber,
        invoice.invoiceDate,
        invoice.type,
        invoice.customerName || invoice.supplierName || '',
        invoice.subtotal.toFixed(2),
        invoice.totalTaxAmount.toFixed(2),
        invoice.grandTotal.toFixed(2),
        invoice.paymentStatus,
        invoice.status
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw error;
    }
  }
}

export default EnhancedInvoiceService;