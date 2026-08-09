import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, writeBatch, increment } from 'firebase/firestore';
import { Invoice, InvoiceItem } from '@/types/invoice';
import StockValidationEnforcementService, { StockValidationResult } from './stockValidationEnforcementService';
import { Product } from '@/types/inventory';
import { cleanInvoiceData } from '@/utils/firestoreUtils';

export interface CentralizedInvoiceResult {
  success: boolean;
  invoiceId?: string;
  errors?: string[];
  warnings?: string[];
  stockValidation?: StockValidationResult;
  blockingErrors?: string[];
}

export interface InvoiceCreationOptions {
  validateStock?: boolean;
  updateStock?: boolean;
  allowZeroStock?: boolean;
  allowNegativeStock?: boolean;
  strictMode?: boolean;
  bypassValidation?: boolean; // Emergency bypass (should be used carefully)
  fastMode?: boolean; // Skip all stock operations for maximum speed
}

/**
 * CENTRALIZED INVOICE SERVICE WITH MANDATORY STOCK VALIDATION
 * 
 * This service ensures that ALL invoice creation goes through proper stock validation.
 * It prevents zero stock sales and maintains inventory integrity.
 */
export class CentralizedInvoiceService {
  private static readonly INVOICES_COLLECTION = 'invoices';
  private static readonly PRODUCTS_COLLECTION = 'products';

  /**
   * MAIN INVOICE CREATION METHOD - ALL INVOICES MUST GO THROUGH THIS
   * 
   * This method enforces stock validation for all sales invoices and prevents
   * creation of invoices with zero or insufficient stock.
   */
  static async createInvoice(
    invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> & { type?: 'sales' | 'purchase' },
    options: InvoiceCreationOptions = {}
  ): Promise<CentralizedInvoiceResult> {
    const startTime = Date.now();

    const {
      validateStock = true,
      updateStock = true,
      allowZeroStock = false,
      allowNegativeStock = false,
      strictMode = false,
      bypassValidation = false
    } = options;

    console.log(`🏭 CENTRALIZED INVOICE CREATION: Starting invoice creation for type: ${invoiceData.type}`);
    console.log(`🔒 STOCK VALIDATION SETTINGS:`, {
      validateStock,
      updateStock,
      allowZeroStock,
      allowNegativeStock,
      strictMode,
      bypassValidation
    });

    const result: CentralizedInvoiceResult = {
      success: false,
      errors: [],
      warnings: [],
      blockingErrors: []
    };

    try {
      // STEP 1: MANDATORY STOCK VALIDATION FOR SALES INVOICES
      if (invoiceData.type === 'sales' && validateStock && !bypassValidation) {
        console.log('🔍 PERFORMING MANDATORY STOCK VALIDATION...');
        
        const stockItems = (invoiceData.items || [])
          .filter(item => item.productId && item.quantity > 0)
          .map(item => ({
            productId: item.productId!,
            productName: item.name || item.productName || '',
            quantity: item.quantity
          }));

        if (stockItems.length > 0) {
          const stockValidation = await StockValidationEnforcementService.enforceStockValidation(
            stockItems,
            {
              allowZeroStock,
              allowNegativeStock,
              strictMode,
              enforcementLevel: strictMode ? 'strict' : 'standard'
            }
          );

          result.stockValidation = stockValidation;

          // CRITICAL: Block invoice creation if validation fails
          if (!stockValidation.canProceed) {
            const blockingErrors = stockValidation.errors
              .filter(error => error.blockingError)
              .map(error => error.message);

            result.blockingErrors = blockingErrors;
            result.errors = [
              '🚫 INVOICE CREATION BLOCKED BY STOCK VALIDATION',
              ...blockingErrors
            ];

            // Add specific error messages for different types of stock issues
            if (stockValidation.summary.zeroStockItems > 0) {
              result.errors.push(
                `❌ ZERO STOCK VIOLATION: ${stockValidation.summary.zeroStockItems} items have zero stock and cannot be sold`
              );
            }

            if (stockValidation.summary.insufficientStockItems > 0) {
              result.errors.push(
                `❌ INSUFFICIENT STOCK VIOLATION: ${stockValidation.summary.insufficientStockItems} items have insufficient stock`
              );
            }

            console.log('🚫 INVOICE CREATION BLOCKED:', result.errors);
            return result;
          }

          // Collect warnings
          if (stockValidation.warnings.length > 0) {
            result.warnings = stockValidation.warnings.map(warning => warning.message);
            console.warn('⚠️ STOCK WARNINGS:', result.warnings);
          }
        }
      }

      // STEP 2: CREATE INVOICE DOCUMENT
      console.log('📄 Creating invoice document...');
      
      const invoiceDocData = {
        ...invoiceData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        stockValidated: validateStock && invoiceData.type === 'sales',
        stockValidationTimestamp: validateStock && invoiceData.type === 'sales' ? new Date().toISOString() : null,
        validationBypass: bypassValidation
      };

      // Clean invoice data to remove undefined values
      const cleanedData = cleanInvoiceData(invoiceDocData);

      const docRef = await addDoc(collection(db, this.INVOICES_COLLECTION), cleanedData);
      result.invoiceId = docRef.id;

      console.log(`✅ Invoice created with ID: ${result.invoiceId}`);

      // STEP 3: UPDATE STOCK FOR SALES INVOICES
      if (invoiceData.type === 'sales' && updateStock && invoiceData.items) {
        console.log('📦 Updating stock levels...');
        
        const stockUpdateResult = await this.updateStockLevels(
          invoiceData.items,
          result.invoiceId,
          'sales'
        );

        if (!stockUpdateResult.success) {
          result.warnings = result.warnings || [];
          result.warnings.push(`⚠️ Stock update warnings: ${stockUpdateResult.errors?.join(', ')}`);
        }

        if (stockUpdateResult.warnings) {
          result.warnings = result.warnings || [];
          result.warnings.push(...stockUpdateResult.warnings);
        }
      }

      result.success = true;
      const executionTime = Date.now() - startTime;
      console.log(`🎉 INVOICE CREATION COMPLETED SUCCESSFULLY: ${result.invoiceId} (Execution time: ${executionTime}ms)`);

      return result;

    } catch (error) {
      console.error('❌ CENTRALIZED INVOICE CREATION FAILED:', error);

      result.errors = [
        'Failed to create invoice',
        error instanceof Error ? error.message : 'Unknown error'
      ];

      return result;
    }
  }

  /**
   * Update stock levels for invoice items (OPTIMIZED VERSION)
   * Uses batch operations and preloaded product data for better performance
   */
  private static async updateStockLevels(
    items: InvoiceItem[],
    invoiceId: string,
    invoiceType: 'sales' | 'purchase'
  ): Promise<{ success: boolean; errors?: string[]; warnings?: string[] }> {
    const result = {
      success: true,
      errors: [] as string[],
      warnings: [] as string[]
    };

    try {
      // Step 1: Get unique product IDs to preload
      const productIds = [...new Set(items
        .filter(item => item.productId && item.quantity > 0)
        .map(item => item.productId!)
      )];

      if (productIds.length === 0) {
        console.log('ℹ️ No products to update stock for');
        return result;
      }

      // Step 2: Preload all product data in parallel for better performance
      console.log(`📦 Preloading ${productIds.length} products for stock update...`);
      const productPromises = productIds.map(async (productId) => {
        const productRef = doc(db, this.PRODUCTS_COLLECTION, productId);
        const productSnap = await getDoc(productRef);
        return { productId, productSnap };
      });

      const productResults = await Promise.all(productPromises);

      // Step 3: Create products map for quick lookup
      const productsMap = new Map<string, Product>();
      productResults.forEach(({ productId, productSnap }) => {
        if (productSnap.exists()) {
          productsMap.set(productId, productSnap.data() as Product);
        } else {
          result.warnings?.push(`Product ${productId} not found for stock update`);
        }
      });

      // Step 4: Batch update all stock levels
      const batch = writeBatch(db);

      for (const item of items) {
        if (!item.productId || !item.quantity || item.quantity <= 0) {
          continue;
        }

        try {
          const product = productsMap.get(item.productId);
          if (!product) {
            // Already warned above
            continue;
          }

          const currentStock = product.quantity || 0;

          // Calculate stock change based on invoice type
          const stockChange = invoiceType === 'sales' ? -item.quantity : item.quantity;
          const newStock = currentStock + stockChange;

          // Update product stock
          const productRef = doc(db, this.PRODUCTS_COLLECTION, item.productId);
          batch.update(productRef, {
            quantity: newStock,
            lastUpdated: serverTimestamp(),
            lastStockUpdate: {
              invoiceId,
              invoiceType,
              quantityChanged: stockChange,
              previousStock: currentStock,
              newStock,
              timestamp: serverTimestamp()
            }
          });

          console.log(`📦 Stock update: ${item.name} - ${currentStock} → ${newStock} (${stockChange})`);

          // Warn about negative stock
          if (newStock < 0) {
            result.warnings?.push(`⚠️ Negative stock: ${item.name} now has ${newStock} units`);
          }

        } catch (error) {
          console.error(`Error updating stock for product ${item.productId}:`, error);
          result.errors?.push(`Failed to update stock for ${item.name || item.productId}`);
        }
      }

      await batch.commit();
      console.log('✅ Stock levels updated successfully');

    } catch (error) {
      console.error('❌ Stock update failed:', error);
      result.success = false;
      result.errors?.push('Failed to update stock levels');
    }

    return result;
  }

  /**
   * EMERGENCY BYPASS METHOD - USE WITH EXTREME CAUTION
   * 
   * This method allows creating invoices without stock validation.
   * Should only be used in emergency situations and with proper authorization.
   */
  static async createInvoiceWithBypass(
    invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>,
    bypassReason: string,
    authorizedBy: string
  ): Promise<CentralizedInvoiceResult> {
    console.warn('🚨 EMERGENCY BYPASS: Creating invoice without stock validation');
    console.warn('🚨 BYPASS REASON:', bypassReason);
    console.warn('🚨 AUTHORIZED BY:', authorizedBy);

    const result = await this.createInvoice(invoiceData, {
      validateStock: false,
      updateStock: true,
      bypassValidation: true
    });

    if (result.success && result.invoiceId) {
      // Log the bypass for audit purposes
      try {
        await addDoc(collection(db, 'audit_logs'), {
          type: 'stock_validation_bypass',
          invoiceId: result.invoiceId,
          reason: bypassReason,
          authorizedBy,
          timestamp: serverTimestamp(),
          invoiceData: {
            type: invoiceData.type,
            invoiceNumber: invoiceData.invoiceNumber,
            totalAmount: invoiceData.totalAmount,
            itemCount: invoiceData.items?.length || 0
          }
        });
      } catch (auditError) {
        console.error('Failed to log bypass audit:', auditError);
      }
    }

    return result;
  }

  /**
   * Validate stock without creating invoice (for preview/validation purposes)
   */
  static async validateStockOnly(
    items: InvoiceItem[],
    options: Omit<InvoiceCreationOptions, 'updateStock'> = {}
  ): Promise<StockValidationResult> {
    const {
      allowZeroStock = false,
      allowNegativeStock = false,
      strictMode = false
    } = options;

    const stockItems = items
      .filter(item => item.productId && item.quantity > 0)
      .map(item => ({
        productId: item.productId!,
        productName: item.name || item.productName || '',
        quantity: item.quantity
      }));

    return await StockValidationEnforcementService.enforceStockValidation(
      stockItems,
      {
        allowZeroStock,
        allowNegativeStock,
        strictMode,
        enforcementLevel: strictMode ? 'strict' : 'standard'
      }
    );
  }

  /**
   * Get current stock levels for products
   */
  static async getStockLevels(productIds: string[]): Promise<Map<string, number>> {
    const stockLevels = new Map<string, number>();

    try {
      for (const productId of productIds) {
        const productRef = doc(db, this.PRODUCTS_COLLECTION, productId);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          const product = productSnap.data() as Product;
          stockLevels.set(productId, product.quantity || 0);
        } else {
          stockLevels.set(productId, 0);
        }
      }
    } catch (error) {
      console.error('Error getting stock levels:', error);
    }

    return stockLevels;
  }
}

export default CentralizedInvoiceService;