import { db } from '@/firebase/config';
import { 
  collection, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { Invoice, InvoiceItem } from '@/types/invoice';
import EnhancedStockService, { StockValidationResult, StockUpdateResult } from './enhancedStockService';
import { transactionService } from './transactionService';
import { cleanInvoiceData } from '@/utils/firestoreUtils';

export interface InvoiceWithStockResult {
  success: boolean;
  invoiceId?: string;
  stockValidation?: StockValidationResult;
  stockUpdateResult?: StockUpdateResult;
  errors?: string[];
  warnings?: string[];
}

export interface InvoiceUpdateResult {
  success: boolean;
  stockRevertResult?: StockUpdateResult;
  stockUpdateResult?: StockUpdateResult;
  errors?: string[];
  warnings?: string[];
}

export class InvoiceWithStockService {
  private static readonly INVOICES_COLLECTION = 'invoices';

  /**
   * Create invoice with automatic stock management
   */
  static async createInvoiceWithStock(
    invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> & { type?: 'sales' | 'purchase' },
    validateStock: boolean = true,
    updateStock: boolean = true
  ): Promise<InvoiceWithStockResult> {
    const result: InvoiceWithStockResult = {
      success: false,
      errors: [],
      warnings: []
    };

    try {
      const invoiceType = invoiceData.type === 'sales' ? 'sales' : 'purchase';
      
      // Step 1: Enhanced stock validation for sales invoices
      if (validateStock && invoiceType === 'sales' && invoiceData.items) {
        console.log('Validating stock for invoice items...');
        
        // Use enhanced stock validation service
        const { StockValidationService } = await import('./stockValidationService');
        const stockItems = invoiceData.items
          .filter(item => item.productId && item.quantity > 0)
          .map(item => ({
            productId: item.productId,
            productName: item.name || (item.productName as string) || '',
            quantity: item.quantity
          }));

        const stockValidation = await StockValidationService.validateStockForInvoice(
          stockItems,
          'sales',
          false, // Don't allow zero stock
          false  // Don't allow negative stock
        );
        
        // Convert to expected format for backward compatibility
        result.stockValidation = {
          isValid: stockValidation.isValid,
          errors: stockValidation.errors.map(error => ({
            productId: error.productId,
            productName: error.productName,
            availableStock: error.availableStock,
            requestedQuantity: error.requestedQuantity,
            shortfall: error.shortfall,
            message: error.message
          })),
          warnings: stockValidation.warnings.map(warning => ({
            productId: warning.productId,
            productName: warning.productName,
            message: warning.message
          }))
        };
        
        if (!stockValidation.isValid || !stockValidation.canProceed) {
          result.errors = stockValidation.errors.map(error => error.message);
          result.warnings = stockValidation.warnings.map(warning => warning.message);
          return result;
        }
        
        if (stockValidation.warnings.length > 0) {
          result.warnings = stockValidation.warnings.map(warning => warning.message);
        }
      }

      // Step 2: Create the invoice
      console.log('Creating invoice...');
      const invoiceData2 = {
        ...invoiceData,
        stockUpdated: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Clean invoice data to remove undefined values
      const cleanedData = cleanInvoiceData(invoiceData2);
      
      const invoiceRef = await addDoc(collection(db, this.INVOICES_COLLECTION), cleanedData);

      result.invoiceId = invoiceRef.id;

      // Step 3: Update stock if enabled
      if (updateStock && invoiceData.items && invoiceData.items.length > 0) {
        console.log('Updating stock for invoice items...');
        const stockUpdateResult = await EnhancedStockService.processInvoiceStockUpdates(
          { ...invoiceData, id: invoiceRef.id },
          invoiceType
        );

        result.stockUpdateResult = stockUpdateResult;

        if (stockUpdateResult.success) {
          // Mark invoice as stock updated
          await updateDoc(invoiceRef, {
            stockUpdated: true,
            updatedAt: serverTimestamp()
          });
          console.log('Stock updated successfully for invoice:', invoiceRef.id);
        } else {
          // Stock update failed, but invoice is created
          result.errors?.push(...stockUpdateResult.errors.map(error => error.error));
          result.warnings?.push('Invoice created but stock update failed');
        }
      }

      // Step 4: Create transaction record (for accounting)
      try {
        if (invoiceData.partyId && invoiceData.total) {
          const transactionId = await transactionService.createTransaction({
            partyId: invoiceData.partyId,
            userId: invoiceData.userId || 'system',
            amount: invoiceData.total,
            type: invoiceType === 'sales' ? 'debit' : 'credit',
            description: `Invoice ${invoiceData.invoiceNumber}`,
            reference: invoiceData.invoiceNumber,
            date: typeof invoiceData.date === 'string' ? invoiceData.date : new Date().toISOString().split('T')[0]
          });

          // Update invoice with transaction ID
          await updateDoc(invoiceRef, {
            transactionId: transactionId,
            updatedAt: serverTimestamp()
          });
          
          console.log('Transaction created for invoice:', transactionId);
        }
      } catch (transactionError) {
        console.error('Error creating transaction for invoice:', transactionError);
        result.warnings?.push('Invoice created but transaction recording failed');
      }

      result.success = true;
      return result;

    } catch (error) {
      console.error('Error creating invoice with stock:', error);
      result.errors?.push(error instanceof Error ? error.message : 'Unknown error occurred');
      return result;
    }
  }

  /**
   * Update invoice with stock adjustments
   */
  static async updateInvoiceWithStock(
    invoiceId: string,
    updates: Partial<Invoice>,
    adjustStock: boolean = true
  ): Promise<InvoiceUpdateResult> {
    const result: InvoiceUpdateResult = {
      success: false,
      errors: [],
      warnings: []
    };

    try {
      // Step 1: Get the current invoice
      const invoiceRef = doc(db, this.INVOICES_COLLECTION, invoiceId);
      const invoiceSnap = await getDoc(invoiceRef);

      if (!invoiceSnap.exists()) {
        result.errors?.push('Invoice not found');
        return result;
      }

      const currentInvoice = { id: invoiceId, ...invoiceSnap.data() } as Invoice;
      const invoiceType = currentInvoice.type === 'sales' ? 'sales' : 'purchase';

      // Step 2: Handle stock adjustments if items changed and stock was previously updated
      if (adjustStock && updates.items && currentInvoice.stockUpdated) {
        console.log('Reverting original stock changes...');
        
        // Revert original stock changes
        const revertResult = await EnhancedStockService.revertInvoiceStockUpdates(
          currentInvoice,
          invoiceType
        );
        
        result.stockRevertResult = revertResult;
        
        if (!revertResult.success) {
          result.warnings?.push('Failed to revert some original stock changes');
        }

        // Apply new stock changes
        console.log('Applying new stock changes...');
        const newInvoiceData = { ...currentInvoice, ...updates };
        const stockUpdateResult = await EnhancedStockService.processInvoiceStockUpdates(
          newInvoiceData,
          invoiceType
        );

        result.stockUpdateResult = stockUpdateResult;

        if (!stockUpdateResult.success) {
          result.errors?.push(...stockUpdateResult.errors.map(error => error.error));
          result.warnings?.push('Invoice updated but new stock changes failed');
        }
      }

      // Step 3: Update the invoice
      const sanitizedUpdates = cleanInvoiceData(updates);
      await updateDoc(invoiceRef, {
        ...sanitizedUpdates,
        updatedAt: serverTimestamp()
      });

      result.success = true;
      return result;

    } catch (error) {
      console.error('Error updating invoice with stock:', error);
      result.errors?.push(error instanceof Error ? error.message : 'Unknown error occurred');
      return result;
    }
  }

  /**
   * Delete invoice with stock reversion
   */
  static async deleteInvoiceWithStock(
    invoiceId: string,
    revertStock: boolean = true
  ): Promise<{ success: boolean; errors?: string[]; stockRevertResult?: StockUpdateResult }> {
    try {
      // Step 1: Get the invoice to be deleted
      const invoiceRef = doc(db, this.INVOICES_COLLECTION, invoiceId);
      const invoiceSnap = await getDoc(invoiceRef);

      if (!invoiceSnap.exists()) {
        return { success: false, errors: ['Invoice not found'] };
      }

      const invoice = { id: invoiceId, ...invoiceSnap.data() } as Invoice;
      const invoiceType = invoice.type === 'sales' ? 'sales' : 'purchase';

      let stockRevertResult: StockUpdateResult | undefined;

      // Step 2: Revert stock changes if needed
      if (revertStock && invoice.stockUpdated && invoice.items && invoice.items.length > 0) {
        console.log('Reverting stock changes for deleted invoice...');
        stockRevertResult = await EnhancedStockService.revertInvoiceStockUpdates(
          invoice,
          invoiceType
        );

        if (!stockRevertResult.success) {
          console.error('Failed to revert stock changes:', stockRevertResult.errors);
          return {
            success: false,
            errors: ['Failed to revert stock changes: ' + stockRevertResult.errors.map(e => e.error).join(', ')],
            stockRevertResult
          };
        }
      }

      // Step 3: Delete the invoice
      await deleteDoc(invoiceRef);

      console.log('Invoice deleted successfully:', invoiceId);
      return { success: true, stockRevertResult };

    } catch (error) {
      console.error('Error deleting invoice with stock:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  /**
   * Get invoice with stock impact summary
   */
  static async getInvoiceWithStockImpact(invoiceId: string): Promise<{
    invoice: Invoice | null;
    stockMovements: any[];
    stockImpact: {
      totalItemsAffected: number;
      totalStockChange: number;
      lowStockWarnings: string[];
    };
  }> {
    try {
      // Get invoice
      const invoiceRef = doc(db, this.INVOICES_COLLECTION, invoiceId);
      const invoiceSnap = await getDoc(invoiceRef);

      if (!invoiceSnap.exists()) {
        return {
          invoice: null,
          stockMovements: [],
          stockImpact: {
            totalItemsAffected: 0,
            totalStockChange: 0,
            lowStockWarnings: []
          }
        };
      }

      const invoice = { id: invoiceId, ...invoiceSnap.data() } as Invoice;

      // Get stock movements for this invoice
      const stockMovements = await EnhancedStockService.getInvoiceStockMovements(invoiceId);

      // Calculate stock impact
      const totalItemsAffected = stockMovements.length;
      const totalStockChange = stockMovements.reduce((sum, movement) => {
        return sum + (movement.movementType === 'in' ? movement.quantity : -movement.quantity);
      }, 0);

      // Check for low stock warnings
      const lowStockWarnings: string[] = [];
      if (invoice.items) {
        for (const item of invoice.items) {
          if (item.productId) {
            try {
              const productRef = doc(db, 'products', item.productId);
              const productSnap = await getDoc(productRef);
              
              if (productSnap.exists()) {
                const product = productSnap.data();
                const currentStock = product.quantity || product.stock || 0;
                const minLevel = product.minStockLevel || product.reorderPoint || 5;
                
                if (currentStock <= minLevel) {
                  lowStockWarnings.push(`${product.name} is low on stock (${currentStock} remaining)`);
                }
              }
            } catch (error) {
              console.error(`Error checking stock for product ${item.productId}:`, error);
            }
          }
        }
      }

      return {
        invoice,
        stockMovements,
        stockImpact: {
          totalItemsAffected,
          totalStockChange,
          lowStockWarnings
        }
      };

    } catch (error) {
      console.error('Error getting invoice with stock impact:', error);
      return {
        invoice: null,
        stockMovements: [],
        stockImpact: {
          totalItemsAffected: 0,
          totalStockChange: 0,
          lowStockWarnings: []
        }
      };
    }
  }

  /**
   * Validate multiple invoices for stock availability
   */
  static async validateMultipleInvoicesStock(
    invoices: Array<{ items: InvoiceItem[]; type?: string }>
  ): Promise<{
    isValid: boolean;
    conflicts: Array<{
      productId: string;
      productName: string;
      totalRequired: number;
      availableStock: number;
      shortfall: number;
    }>;
  }> {
    try {
      // Aggregate all items by product
      const productRequirements = new Map<string, { name: string; totalRequired: number }>();

      for (const invoice of invoices) {
        if (invoice.type === 'sales' || !invoice.type) { // Only check sales invoices
          for (const item of invoice.items) {
            if (item.productId && item.quantity > 0) {
              const existing = productRequirements.get(item.productId) || { 
                name: item.name || 'Unknown Product', 
                totalRequired: 0 
              };
              existing.totalRequired += item.quantity;
              productRequirements.set(item.productId, existing);
            }
          }
        }
      }

      // Check stock availability for each product
      const conflicts: Array<{
        productId: string;
        productName: string;
        totalRequired: number;
        availableStock: number;
        shortfall: number;
      }> = [];

      for (const [productId, requirement] of productRequirements) {
        try {
          const productRef = doc(db, 'products', productId);
          const productSnap = await getDoc(productRef);

          if (productSnap.exists()) {
            const product = productSnap.data();
            const availableStock = product.quantity || product.stock || 0;

            if (availableStock < requirement.totalRequired) {
              conflicts.push({
                productId,
                productName: requirement.name,
                totalRequired: requirement.totalRequired,
                availableStock,
                shortfall: requirement.totalRequired - availableStock
              });
            }
          } else {
            conflicts.push({
              productId,
              productName: requirement.name,
              totalRequired: requirement.totalRequired,
              availableStock: 0,
              shortfall: requirement.totalRequired
            });
          }
        } catch (error) {
          console.error(`Error checking stock for product ${productId}:`, error);
          conflicts.push({
            productId,
            productName: requirement.name,
            totalRequired: requirement.totalRequired,
            availableStock: 0,
            shortfall: requirement.totalRequired
          });
        }
      }

      return {
        isValid: conflicts.length === 0,
        conflicts
      };

    } catch (error) {
      console.error('Error validating multiple invoices stock:', error);
      return {
        isValid: false,
        conflicts: []
      };
    }
  }
}

export default InvoiceWithStockService;