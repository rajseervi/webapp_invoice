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
import { Invoice, InvoiceItem } from '@/types/invoice';
import { Product } from '@/types/inventory';
import StockManagementService from './stockManagementService';
import { GstCalculator, InvoiceGstCalculator } from './gstService';
import { transactionService } from './transactionService';
import { cleanInvoiceData } from '@/utils/firestoreUtils';

export interface InvoiceWithStockResult {
  success: boolean;
  invoiceId?: string;
  stockUpdateResult?: {
    success: boolean;
    processedItems: number;
    errors: Array<{ productId: string; error: string }>;
  };
  errors?: string[];
  warnings?: string[];
}

export interface StockValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  itemValidations: Array<{
    productId: string;
    productName: string;
    isValid: boolean;
    availableStock: number;
    requestedQuantity: number;
    error?: string;
    warning?: string;
  }>;
}

export class EnhancedInvoiceWithStockService {
  private static readonly INVOICES_COLLECTION = 'invoices';

  /**
   * Create invoice with automatic stock management
   */
  static async createInvoiceWithStock(
    invoiceData: Omit<Invoice, 'id' | 'createdAt'> & { type?: 'sales' | 'purchase' },
    validateStock: boolean = true,
    updateStock: boolean = true
  ): Promise<InvoiceWithStockResult> {
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      // Validate stock for sales invoices
      if (validateStock && invoiceData.type === 'sales') {
        const stockValidation = await this.validateStockForInvoice(invoiceData.items || []);
        if (!stockValidation.isValid) {
          return {
            success: false,
            errors: stockValidation.errors,
            warnings: stockValidation.warnings
          };
        }
      }

      // Prepare invoice data
      const invoice: Omit<Invoice, 'id'> = {
        ...invoiceData,
        createdAt: now,
        stockUpdated: false
      };

      // Create invoice document
      const invoiceRef = doc(collection(db, this.INVOICES_COLLECTION));
      const cleanedInvoiceData = cleanInvoiceData(invoice);
      batch.set(invoiceRef, cleanedInvoiceData);

      // Process stock updates if enabled
      let stockUpdateResult;
      if (updateStock && invoiceData.items && invoiceData.items.length > 0) {
        const stockItems = invoiceData.items.map(item => ({
          productId: item.productId.toString(),
          quantity: item.quantity,
          productName: item.name || (item.productName as string) || ''
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
      if (invoiceData.partyId && (invoiceData.total || invoiceData.totalAmount)) {
        try {
          const amount = invoiceData.total || invoiceData.totalAmount || 0;
          const transactionType = invoiceData.type === 'sales' ? 'debit' : 'credit';
          
          const transactionId = await transactionService.createTransaction({
            partyId: invoiceData.partyId,
            userId: invoiceData.userId || 'system',
            amount: amount,
            type: transactionType,
            description: `${invoiceData.type === 'sales' ? 'Sales' : 'Purchase'} Invoice ${invoiceData.invoiceNumber}`,
            reference: invoiceData.invoiceNumber,
            date: invoiceData.date || now.split('T')[0]
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
          [`Some stock updates failed: ${stockUpdateResult.errors.map(e => e.error).join(', ')}`] : 
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
   * Update invoice with stock adjustments
   */
  static async updateInvoiceWithStock(
    invoiceId: string,
    updates: Partial<Invoice>,
    adjustStock: boolean = true
  ): Promise<InvoiceWithStockResult> {
    try {
      // Get current invoice
      const currentInvoice = await this.getInvoiceById(invoiceId);
      if (!currentInvoice) {
        return {
          success: false,
          errors: ['Invoice not found']
        };
      }

      // Handle stock adjustments if items changed
      let stockUpdateResult;
      if (adjustStock && updates.items && currentInvoice.stockUpdated) {
        // Revert original stock changes
        if (currentInvoice.items && currentInvoice.items.length > 0) {
          const originalStockItems = currentInvoice.items.map(item => ({
            productId: item.productId?.toString() || '',
            quantity: item.quantity || 0,
            productName: item.name || ''
          }));

          await StockManagementService.revertInvoiceStockUpdates(
            originalStockItems,
            currentInvoice.type === 'sales' ? 'sales' : 'purchase',
            currentInvoice.invoiceNumber,
            currentInvoice.userId || undefined
          );
        }

        // Apply new stock changes
        const newStockItems = updates.items.map(item => ({
          productId: item.productId?.toString() || '',
          quantity: item.quantity || 0,
          productName: item.name || ''
        }));

        const invoiceType = currentInvoice.type === 'sales' ? 'sales' : 'purchase';
        
        stockUpdateResult = await StockManagementService.processInvoiceStockUpdates(
          newStockItems,
          invoiceType,
          currentInvoice.invoiceNumber,
          currentInvoice.userId || undefined
        );
      }

      // Update invoice
      const invoiceRef = doc(db, this.INVOICES_COLLECTION, invoiceId);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
        stockUpdated: stockUpdateResult?.success || currentInvoice.stockUpdated
      };

      await updateDoc(invoiceRef, cleanInvoiceData(updateData));

      return {
        success: true,
        invoiceId,
        stockUpdateResult
      };

    } catch (error) {
      console.error('Error updating invoice with stock:', error);
      return {
        success: false,
        errors: ['Failed to update invoice']
      };
    }
  }

  /**
   * Delete invoice with stock reversion
   */
  static async deleteInvoiceWithStock(
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
          productId: item.productId?.toString() || '',
          quantity: item.quantity || 0,
          productName: item.name || ''
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
      console.error('Error deleting invoice with stock:', error);
      return {
        success: false,
        errors: ['Failed to delete invoice']
      };
    }
  }

  /**
   * Validate stock availability for invoice items
   */
  static async validateStockForInvoice(items: InvoiceItem[]): Promise<StockValidationResult> {
    const stockItems = items
      .filter(item => item.productId && item.quantity)
      .map(item => ({
        productId: item.productId?.toString() || '',
        quantity: item.quantity || 0
      }));

    if (stockItems.length === 0) {
      return {
        isValid: true,
        errors: [],
        warnings: [],
        itemValidations: []
      };
    }

    const validation = await StockManagementService.validateStockForSale(stockItems);
    
    // Enhance validation with product names
    const enhancedValidations = await Promise.all(
      validation.itemValidations.map(async (itemValidation) => {
        try {
          const productRef = doc(db, 'products', itemValidation.productId);
          const productSnap = await getDoc(productRef);
          const productName = productSnap.exists() ? 
            (productSnap.data() as Product).name : 
            `Product ${itemValidation.productId}`;

          return {
            ...itemValidation,
            productName
          };
        } catch (error) {
          return {
            ...itemValidation,
            productName: `Product ${itemValidation.productId}`
          };
        }
      })
    );

    return {
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings,
      itemValidations: enhancedValidations
    };
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
   * Get invoices with stock status
   */
  static async getInvoicesWithStockStatus(
    userId?: string,
    filters?: {
      type?: 'sales' | 'purchase';
      stockUpdated?: boolean;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<Array<Invoice & { stockStatus?: 'updated' | 'pending' | 'failed' }>> {
    try {
      let q = query(collection(db, this.INVOICES_COLLECTION));

      if (userId) {
        q = query(q, where('userId', '==', userId));
      }

      if (filters?.type) {
        q = query(q, where('type', '==', filters.type));
      }

      if (filters?.stockUpdated !== undefined) {
        q = query(q, where('stockUpdated', '==', filters.stockUpdated));
      }

      q = query(q, orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(q);
      const invoices = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invoice[];

      // Add stock status
      return invoices.map(invoice => ({
        ...invoice,
        stockStatus: invoice.stockUpdated ? 'updated' : 
                    (invoice.items && invoice.items.length > 0 ? 'pending' : 'updated')
      }));

    } catch (error) {
      console.error('Error fetching invoices with stock status:', error);
      return [];
    }
  }

  /**
   * Bulk update stock for multiple invoices
   */
  static async bulkUpdateStockForInvoices(
    invoiceIds: string[],
    userId?: string
  ): Promise<{
    success: boolean;
    processedInvoices: number;
    errors: Array<{ invoiceId: string; error: string }>;
  }> {
    const results = {
      success: true,
      processedInvoices: 0,
      errors: [] as Array<{ invoiceId: string; error: string }>
    };

    for (const invoiceId of invoiceIds) {
      try {
        const invoice = await this.getInvoiceById(invoiceId);
        if (!invoice) {
          results.errors.push({
            invoiceId,
            error: 'Invoice not found'
          });
          continue;
        }

        if (invoice.stockUpdated) {
          results.processedInvoices++;
          continue; // Already updated
        }

        if (!invoice.items || invoice.items.length === 0) {
          results.processedInvoices++;
          continue; // No items to update
        }

        const stockItems = invoice.items.map(item => ({
          productId: item.productId?.toString() || '',
          quantity: item.quantity || 0,
          productName: item.name || ''
        }));

        const invoiceType = invoice.type === 'sales' ? 'sales' : 'purchase';
        
        const stockUpdateResult = await StockManagementService.processInvoiceStockUpdates(
          stockItems,
          invoiceType,
          invoice.invoiceNumber,
          userId
        );

        if (stockUpdateResult.success) {
          // Mark stock as updated
          const invoiceRef = doc(db, this.INVOICES_COLLECTION, invoiceId);
          await updateDoc(invoiceRef, { 
            stockUpdated: true,
            updatedAt: new Date().toISOString()
          });
          results.processedInvoices++;
        } else {
          results.errors.push({
            invoiceId,
            error: stockUpdateResult.errors.map(e => e.error).join(', ')
          });
        }

      } catch (error) {
        results.errors.push({
          invoiceId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    results.success = results.errors.length === 0;
    return results;
  }

  /**
   * Get stock impact summary for an invoice
   */
  static async getStockImpactSummary(invoiceId: string): Promise<{
    invoice: Invoice | null;
    stockMovements: Array<{
      productId: string;
      productName: string;
      quantityChanged: number;
      movementType: 'increase' | 'decrease';
      previousStock: number;
      newStock: number;
    }>;
    alerts: Array<{
      productId: string;
      productName: string;
      alertType: string;
      message: string;
    }>;
  }> {
    try {
      const invoice = await this.getInvoiceById(invoiceId);
      if (!invoice) {
        return {
          invoice: null,
          stockMovements: [],
          alerts: []
        };
      }

      // Get stock movements for this invoice
      const stockMovements = await StockManagementService.getRecentStockMovements(100);
      const invoiceMovements = stockMovements
        .filter(movement => movement.referenceId === invoice.invoiceNumber)
        .map(movement => ({
          productId: movement.productId,
          productName: movement.productName,
          quantityChanged: movement.quantity,
          movementType: movement.movementType === 'adjustment' ? (movement.quantity > 0 ? 'in' : 'out') : movement.movementType as 'in' | 'out',
          previousStock: movement.previousQuantity,
          newStock: movement.newQuantity
        }));

      // Get related stock alerts
      const alerts = await StockManagementService.getStockAlerts(true);
      const relatedAlerts = alerts
        .filter(alert => 
          invoice.items?.some(item => item.productId === alert.productId)
        )
        .map(alert => ({
          productId: alert.productId,
          productName: alert.productName,
          alertType: alert.alertType,
          message: alert.message
        }));

      return {
        invoice,
        stockMovements: invoiceMovements,
        alerts: relatedAlerts
      };

    } catch (error) {
      console.error('Error getting stock impact summary:', error);
      return {
        invoice: null,
        stockMovements: [],
        alerts: []
      };
    }
  }
}

export default EnhancedInvoiceWithStockService;