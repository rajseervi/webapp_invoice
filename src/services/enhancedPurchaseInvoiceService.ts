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
  QueryConstraint,
  Timestamp
} from 'firebase/firestore';
import { productService } from './productService';
import {
  PurchaseInvoiceItem,
  PurchaseInvoice,
  PurchasePayment,
  PurchaseInvoiceFilters,
  PurchaseInvoiceStatistics
} from '@/types/purchase_no_gst';

export interface StockMovement {
  id?: string;
  productId: string;
  productName: string;
  type: 'purchase' | 'sale' | 'adjustment' | 'return';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  unitPrice: number;
  totalValue: number;
  referenceType: 'purchase_invoice' | 'sales_invoice' | 'stock_adjustment';
  referenceId: string;
  referenceNumber: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface EnhancedPurchaseInvoice extends PurchaseInvoice {
  priority?: 'low' | 'medium' | 'high';
  expectedDeliveryDate?: string;
  purchaseOrderNumber?: string;
  terms?: string;
  shippingCharges?: number;
  otherCharges?: number;
  roundOffAmount?: number;
  status?: 'active' | 'cancelled' | 'returned';
  stockMovements?: StockMovement[];
}

export class EnhancedPurchaseInvoiceService {
  private static readonly COLLECTION_NAME = 'purchase_invoices_no_gst';
  private static readonly PAYMENTS_COLLECTION = 'purchase_payments_no_gst';
  private static readonly STOCK_MOVEMENTS_COLLECTION = 'stock_movements';

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
   * Generate unique invoice number with better formatting
   */
  static generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getTime()).slice(-6);
    
    return `PI-${year}${month}${day}-${time}`;
  }

  /**
   * Calculate item totals with enhanced discount support
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
        discountAmount = Math.min(item.discountValue, baseAmount); // Discount cannot exceed base amount
      }
    }
    
    // Total amount after discount
    const totalAmount = Math.max(0, baseAmount - discountAmount);
    
    return {
      ...item,
      discountAmount: Math.round(discountAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100
    };
  }

  /**
   * Calculate enhanced invoice totals with additional charges
   */
  static calculateInvoiceTotals(
    items: PurchaseInvoiceItem[],
    shippingCharges: number = 0,
    otherCharges: number = 0,
    roundOff: boolean = true
  ): {
    subtotal: number;
    totalDiscountAmount: number;
    totalAmount: number;
    shippingCharges: number;
    otherCharges: number;
    grandTotal: number;
    roundOffAmount: number;
    finalAmount: number;
  } {
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const totalDiscountAmount = items.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);
    
    const grandTotal = totalAmount + shippingCharges + otherCharges;
    
    // Round off to nearest rupee if enabled
    const finalAmount = roundOff ? Math.round(grandTotal) : grandTotal;
    const roundOffAmount = roundOff ? finalAmount - grandTotal : 0;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscountAmount: Math.round(totalDiscountAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      shippingCharges: Math.round(shippingCharges * 100) / 100,
      otherCharges: Math.round(otherCharges * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      roundOffAmount: Math.round(roundOffAmount * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100
    };
  }

  /**
   * Validate invoice data before creation
   */
  private static async validateInvoiceData(
    invoiceData: Omit<EnhancedPurchaseInvoice, 'id' | 'createdAt' | 'updatedAt' | 'stockUpdated'>
  ): Promise<void> {
    // Basic validation
    if (!invoiceData.items || invoiceData.items.length === 0) {
      throw new Error('Invoice must contain at least one item');
    }

    if (!invoiceData.supplierName || !invoiceData.supplierInvoiceNumber) {
      throw new Error('Supplier name and invoice number are required');
    }

    // Check for duplicate supplier invoice number
    const existingInvoiceQuery = query(
      collection(db, this.COLLECTION_NAME),
      where('supplierInvoiceNumber', '==', invoiceData.supplierInvoiceNumber),
      where('supplierId', '==', invoiceData.supplierId || '')
    );
    const existingInvoices = await getDocs(existingInvoiceQuery);
    
    if (!existingInvoices.empty) {
      throw new Error('An invoice with this supplier invoice number already exists for this supplier');
    }

    // Validate items
    for (const item of invoiceData.items) {
      if (!item.productId || !item.productName) {
        throw new Error('All items must have valid product information');
      }
      
      if (item.quantity <= 0) {
        throw new Error(`Invalid quantity for item: ${item.productName}`);
      }
      
      if (item.unitPrice < 0) {
        throw new Error(`Invalid unit price for item: ${item.productName}`);
      }
    }

    // Validate amounts
    if (invoiceData.finalAmount < 0) {
      throw new Error('Final amount cannot be negative');
    }

    if (invoiceData.paidAmount < 0) {
      throw new Error('Paid amount cannot be negative');
    }

    if (invoiceData.paidAmount > invoiceData.finalAmount) {
      throw new Error('Paid amount cannot exceed final amount');
    }
  }

  /**
   * Create stock movement records
   */
  private static async createStockMovements(
    batch: any,
    invoiceId: string,
    invoiceNumber: string,
    supplierName: string,
    items: PurchaseInvoiceItem[],
    purchaseDate: string
  ): Promise<StockMovement[]> {
    const stockMovements: StockMovement[] = [];

    for (const item of items) {
      try {
        const product = await productService.getProductById(item.productId);
        if (product) {
          const oldQuantity = product.quantity;
          const newQuantity = product.quantity + item.quantity;
          
          const stockMovement: StockMovement = {
            productId: item.productId,
            productName: item.productName,
            type: 'purchase',
            quantity: item.quantity,
            previousQuantity: oldQuantity,
            newQuantity: newQuantity,
            unitPrice: item.unitPrice,
            totalValue: item.totalAmount,
            referenceType: 'purchase_invoice',
            referenceId: invoiceId,
            referenceNumber: invoiceNumber,
            notes: `Purchase from ${supplierName}`,
            createdAt: new Date().toISOString(),
            createdBy: 'system'
          };

          const stockMovementRef = doc(collection(db, this.STOCK_MOVEMENTS_COLLECTION));
          batch.set(stockMovementRef, this.removeUndefined(stockMovement));
          
          stockMovements.push({ ...stockMovement, id: stockMovementRef.id });
        }
      } catch (error) {
        console.error(`Error creating stock movement for product ${item.productId}:`, error);
      }
    }

    return stockMovements;
  }

  /**
   * Update product stock and metadata
   */
  private static async updateProductStock(
    batch: any,
    items: PurchaseInvoiceItem[],
    purchaseDate: string
  ): Promise<void> {
    const now = new Date().toISOString();

    for (const item of items) {
      try {
        const product = await productService.getProductById(item.productId);
        if (product) {
          const newQuantity = product.quantity + item.quantity;
          
          const productRef = doc(db, 'products', item.productId);
          batch.update(productRef, {
            quantity: newQuantity,
            updatedAt: now,
            lastPurchaseDate: purchaseDate,
            lastPurchasePrice: item.unitPrice,
            lastPurchaseQuantity: item.quantity
          });
        } else {
          console.warn(`Product ${item.productId} not found, skipping stock update`);
        }
      } catch (error) {
        console.error(`Error updating stock for product ${item.productId}:`, error);
        throw new Error(`Failed to update stock for product: ${item.productName}`);
      }
    }
  }

  /**
   * Create enhanced purchase invoice with comprehensive stock management
   */
  static async createPurchaseInvoice(
    invoiceData: Omit<EnhancedPurchaseInvoice, 'id' | 'createdAt' | 'updatedAt' | 'stockUpdated'>,
    updateStock: boolean = true
  ): Promise<string> {
    try {
      // Validate invoice data
      await this.validateInvoiceData(invoiceData);

      const batch = writeBatch(db);
      const now = new Date().toISOString();

      // Prepare invoice document
      const invoice: Omit<EnhancedPurchaseInvoice, 'id'> = this.removeUndefined({
        ...invoiceData,
        stockUpdated: false,
        status: 'active',
        createdAt: now,
        updatedAt: now
      });

      // Create invoice document
      const invoiceRef = doc(collection(db, this.COLLECTION_NAME));
      batch.set(invoiceRef, invoice);

      let stockMovements: StockMovement[] = [];

      // Update stock and create movements
      if (updateStock) {
        // Update product stock
        await this.updateProductStock(batch, invoiceData.items, invoiceData.purchaseDate);

        // Create stock movement records
        stockMovements = await this.createStockMovements(
          batch,
          invoiceRef.id,
          invoiceData.invoiceNumber,
          invoiceData.supplierName,
          invoiceData.items,
          invoiceData.purchaseDate
        );
        
        // Mark stock as updated
        batch.update(invoiceRef, { 
          stockUpdated: true,
          stockMovements: stockMovements.map(sm => sm.id)
        });
      }

      await batch.commit();

      // Log successful creation
      console.log(`Enhanced purchase invoice ${invoiceData.invoiceNumber} created successfully with ${stockMovements.length} stock movements`);

      return invoiceRef.id;

    } catch (error) {
      console.error('Error creating enhanced purchase invoice:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create purchase invoice.');
    }
  }

  /**
   * Get stock movements for an invoice
   */
  static async getStockMovementsByInvoiceId(invoiceId: string): Promise<StockMovement[]> {
    try {
      const q = query(
        collection(db, this.STOCK_MOVEMENTS_COLLECTION),
        where('referenceId', '==', invoiceId),
        where('referenceType', '==', 'purchase_invoice'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StockMovement[];
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      return [];
    }
  }

  /**
   * Get enhanced purchase invoice by ID with stock movements
   */
  static async getEnhancedPurchaseInvoiceById(invoiceId: string): Promise<EnhancedPurchaseInvoice | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, invoiceId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const invoice = {
        id: docSnap.id,
        ...docSnap.data()
      } as EnhancedPurchaseInvoice;

      // Get stock movements
      invoice.stockMovements = await this.getStockMovementsByInvoiceId(invoiceId);
      
      return invoice;
    } catch (error) {
      console.error('Error fetching enhanced purchase invoice:', error);
      return null;
    }
  }

  /**
   * Cancel purchase invoice and revert stock
   */
  static async cancelPurchaseInvoice(invoiceId: string, reason?: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      // Get invoice
      const invoice = await this.getEnhancedPurchaseInvoiceById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === 'cancelled') {
        throw new Error('Invoice is already cancelled');
      }

      // Revert stock for each item
      if (invoice.stockUpdated) {
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

              // Create reversal stock movement
              const stockMovementRef = doc(collection(db, this.STOCK_MOVEMENTS_COLLECTION));
              batch.set(stockMovementRef, {
                productId: item.productId,
                productName: item.productName,
                type: 'adjustment',
                quantity: -item.quantity,
                previousQuantity: product.quantity,
                newQuantity: newQuantity,
                unitPrice: item.unitPrice,
                totalValue: -item.totalAmount,
                referenceType: 'purchase_invoice',
                referenceId: invoiceId,
                referenceNumber: invoice.invoiceNumber,
                notes: `Stock reversal - Invoice cancelled: ${reason || 'No reason provided'}`,
                createdAt: now,
                createdBy: 'system'
              });
            }
          } catch (error) {
            console.error(`Error reverting stock for product ${item.productId}:`, error);
          }
        }
      }

      // Update invoice status
      const invoiceRef = doc(db, this.COLLECTION_NAME, invoiceId);
      batch.update(invoiceRef, {
        status: 'cancelled',
        cancelledAt: now,
        cancellationReason: reason,
        updatedAt: now
      });

      await batch.commit();
    } catch (error) {
      console.error('Error cancelling purchase invoice:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive purchase statistics
   */
  static async getEnhancedStatistics(
    dateFrom?: string,
    dateTo?: string
  ): Promise<PurchaseInvoiceStatistics & {
    averageItemsPerInvoice: number;
    topProducts: Array<{
      productId: string;
      productName: string;
      totalQuantity: number;
      totalValue: number;
      purchaseCount: number;
    }>;
    monthlyTrends: Array<{
      month: string;
      invoiceCount: number;
      totalAmount: number;
    }>;
  }> {
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
      })) as EnhancedPurchaseInvoice[];

      // Basic statistics
      const activeInvoices = invoices.filter(inv => inv.status !== 'cancelled');
      const totalInvoices = activeInvoices.length;
      const totalAmount = activeInvoices.reduce((sum, inv) => sum + inv.finalAmount, 0);
      const paidAmount = activeInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
      const pendingAmount = totalAmount - paidAmount;

      // This month statistics
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const thisMonthInvoices = activeInvoices.filter(inv => 
        new Date(inv.purchaseDate) >= thisMonth
      );
      const thisMonthAmount = thisMonthInvoices.reduce((sum, inv) => sum + inv.finalAmount, 0);

      // Payment status breakdown
      const paymentStatusBreakdown = {
        pending: activeInvoices.filter(inv => inv.paymentStatus === 'pending').length,
        partial: activeInvoices.filter(inv => inv.paymentStatus === 'partial').length,
        paid: activeInvoices.filter(inv => inv.paymentStatus === 'paid').length,
        overdue: activeInvoices.filter(inv => inv.paymentStatus === 'overdue').length
      };

      // Top suppliers
      const supplierMap = new Map<string, { name: string; totalAmount: number; count: number }>();
      activeInvoices.forEach(inv => {
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

      // Enhanced statistics
      const totalItems = activeInvoices.reduce((sum, inv) => sum + inv.items.length, 0);
      const averageItemsPerInvoice = totalInvoices > 0 ? totalItems / totalInvoices : 0;

      // Top products
      const productMap = new Map<string, {
        name: string;
        totalQuantity: number;
        totalValue: number;
        purchaseCount: number;
      }>();

      activeInvoices.forEach(inv => {
        inv.items.forEach(item => {
          if (productMap.has(item.productId)) {
            const existing = productMap.get(item.productId)!;
            existing.totalQuantity += item.quantity;
            existing.totalValue += item.totalAmount;
            existing.purchaseCount += 1;
          } else {
            productMap.set(item.productId, {
              name: item.productName,
              totalQuantity: item.quantity,
              totalValue: item.totalAmount,
              purchaseCount: 1
            });
          }
        });
      });

      const topProducts = Array.from(productMap.entries())
        .map(([id, data]) => ({
          productId: id,
          productName: data.name,
          totalQuantity: data.totalQuantity,
          totalValue: data.totalValue,
          purchaseCount: data.purchaseCount
        }))
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10);

      // Monthly trends (last 12 months)
      const monthlyTrends: Array<{
        month: string;
        invoiceCount: number;
        totalAmount: number;
      }> = [];

      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const monthInvoices = activeInvoices.filter(inv => {
          const invDate = new Date(inv.purchaseDate);
          return invDate >= monthStart && invDate <= monthEnd;
        });

        monthlyTrends.push({
          month: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          invoiceCount: monthInvoices.length,
          totalAmount: monthInvoices.reduce((sum, inv) => sum + inv.finalAmount, 0)
        });
      }

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
        pendingInvoices: paymentStatusBreakdown.pending + paymentStatusBreakdown.partial,
        averageItemsPerInvoice,
        topProducts,
        monthlyTrends
      };
    } catch (error) {
      console.error('Error fetching enhanced statistics:', error);
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
        pendingInvoices: 0,
        averageItemsPerInvoice: 0,
        topProducts: [],
        monthlyTrends: []
      };
    }
  }
}

export default EnhancedPurchaseInvoiceService;