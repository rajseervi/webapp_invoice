import { db } from '@/firebase/config';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { Product } from '@/types/inventory';

export interface StockValidationItem {
  productId: string;
  productName?: string;
  quantity: number;
}

export interface StockValidationError {
  productId: string;
  productName: string;
  availableStock: number;
  requestedQuantity: number;
  shortfall: number;
  message: string;
  severity: 'error' | 'warning';
  blockingError: boolean;
  errorCode: 'ZERO_STOCK' | 'INSUFFICIENT_STOCK' | 'PRODUCT_NOT_FOUND' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'VALIDATION_ERROR';
}

export interface StockValidationResult {
  isValid: boolean;
  canProceed: boolean;
  hasBlockingErrors: boolean;
  errors: StockValidationError[];
  warnings: StockValidationError[];
  summary: {
    totalItems: number;
    validItems: number;
    invalidItems: number;
    zeroStockItems: number;
    insufficientStockItems: number;
    totalShortfall: number;
    blockedItems: string[]; // Product IDs that are blocked
  };
  validationTimestamp: string;
  enforcementLevel: 'strict' | 'standard' | 'lenient';
}

export interface StockValidationOptions {
  allowZeroStock?: boolean;
  allowNegativeStock?: boolean;
  strictMode?: boolean;
  enforcementLevel?: 'strict' | 'standard' | 'lenient';
  checkMinStockLevels?: boolean;
  userId?: string; // For user-specific products
}

export class StockValidationEnforcementService {
  private static readonly PRODUCTS_COLLECTION = 'products';
  private static readonly DEFAULT_MIN_STOCK_LEVEL = 5;

  /**
   * ZERO STOCK ENFORCEMENT: Main validation method that prevents invoice creation with zero stock
   * OPTIMIZED VERSION: Preloads all products in parallel for better performance
   */
  static async enforceStockValidation(
    items: StockValidationItem[],
    options: StockValidationOptions = {}
  ): Promise<StockValidationResult> {
    const {
      allowZeroStock = false,
      allowNegativeStock = false,
      strictMode = false,
      enforcementLevel = 'standard',
      checkMinStockLevels = true,
      userId
    } = options;

    const result: StockValidationResult = {
      isValid: true,
      canProceed: true,
      hasBlockingErrors: false,
      errors: [],
      warnings: [],
      summary: {
        totalItems: items.length,
        validItems: 0,
        invalidItems: 0,
        zeroStockItems: 0,
        insufficientStockItems: 0,
        totalShortfall: 0,
        blockedItems: []
      },
      validationTimestamp: new Date().toISOString(),
      enforcementLevel
    };

    console.log(`🔍 STOCK VALIDATION ENFORCEMENT: Validating ${items.length} items with enforcement level: ${enforcementLevel}`);

    try {
      // OPTIMIZATION: Get unique product IDs and preload all products in parallel
      const validItems = items.filter(item => item.productId && item.quantity > 0);
      const productIds = [...new Set(validItems.map(item => item.productId))];

      console.log(`📦 Preloading ${productIds.length} products for validation...`);

      // Preload all products in parallel for better performance
      const productPromises = productIds.map(async (productId) => {
        const productRef = doc(db, this.PRODUCTS_COLLECTION, productId);
        const productSnap = await getDoc(productRef);
        return { productId, productSnap };
      });

      const productResults = await Promise.all(productPromises);

      // Create products map for quick lookup
      const productsMap = new Map<string, Product>();
      productResults.forEach(({ productId, productSnap }) => {
        if (productSnap.exists()) {
          productsMap.set(productId, productSnap.data() as Product);
        }
      });

      // Validate each item with strict enforcement (now using preloaded data)
      for (const item of validItems) {
        try {
          const product = productsMap.get(item.productId);

          if (!product) {
            const error = this.createValidationError(
              item,
              'Unknown Product',
              0,
              item.quantity,
              item.quantity,
              'PRODUCT_NOT_FOUND',
              `🚫 PRODUCT NOT FOUND: "${item.productName || 'Unknown Product'}" does not exist in inventory`,
              'error',
              true
            );
            
            result.errors.push(error);
            result.summary.invalidItems++;
            result.summary.totalShortfall += item.quantity;
            result.summary.blockedItems.push(item.productId);
            continue;
          }

          const availableStock = product.quantity || 0;
          const requestedQuantity = item.quantity;
          const productName = product.name || item.productName || 'Unknown Product';

          console.log(`📦 Checking stock for "${productName}": Available=${availableStock}, Requested=${requestedQuantity}`);

          // CRITICAL ENFORCEMENT: Zero Stock Check
          if (availableStock === 0) {
            const error = this.createValidationError(
              item,
              productName,
              availableStock,
              requestedQuantity,
              requestedQuantity,
              'ZERO_STOCK',
              `🚫 ZERO STOCK BLOCKED: Cannot sell "${productName}" - No stock available (Current Stock: 0)`,
              'error',
              !allowZeroStock
            );

            if (allowZeroStock) {
              error.severity = 'warning';
              error.message = `⚠️ ZERO STOCK WARNING: Selling "${productName}" with zero stock (Current Stock: 0)`;
              result.warnings.push(error);
            } else {
              result.errors.push(error);
              result.summary.zeroStockItems++;
              result.summary.blockedItems.push(item.productId);
            }
            
            result.summary.invalidItems++;
            result.summary.totalShortfall += requestedQuantity;
            continue;
          }

          // CRITICAL ENFORCEMENT: Insufficient Stock Check
          if (availableStock < requestedQuantity) {
            const shortfall = requestedQuantity - availableStock;
            
            const error = this.createValidationError(
              item,
              productName,
              availableStock,
              requestedQuantity,
              shortfall,
              'INSUFFICIENT_STOCK',
              `🚫 INSUFFICIENT STOCK BLOCKED: "${productName}" - Available: ${availableStock}, Required: ${requestedQuantity}, Shortfall: ${shortfall}`,
              'error',
              !allowNegativeStock
            );

            if (allowNegativeStock) {
              error.severity = 'warning';
              error.message = `⚠️ NEGATIVE STOCK WARNING: "${productName}" will have negative stock after this sale (Available: ${availableStock}, Required: ${requestedQuantity})`;
              error.blockingError = false;
              result.warnings.push(error);
            } else {
              result.errors.push(error);
              result.summary.insufficientStockItems++;
              result.summary.blockedItems.push(item.productId);
            }
            
            result.summary.invalidItems++;
            result.summary.totalShortfall += shortfall;
            continue;
          }

          // Additional checks based on enforcement level
          if (checkMinStockLevels) {
            const minStockLevel = product.minStockLevel || product.reorderPoint || this.DEFAULT_MIN_STOCK_LEVEL;
            const remainingStock = availableStock - requestedQuantity;

            // Low Stock Warning
            if (remainingStock > 0 && remainingStock <= minStockLevel) {
              const warning = this.createValidationError(
                item,
                productName,
                availableStock,
                requestedQuantity,
                0,
                'LOW_STOCK',
                `⚠️ LOW STOCK WARNING: "${productName}" will be low after this sale (Remaining: ${remainingStock}, Min Level: ${minStockLevel})`,
                'warning',
                strictMode || enforcementLevel === 'strict'
              );

              if (strictMode || enforcementLevel === 'strict') {
                result.errors.push(warning);
                result.summary.blockedItems.push(item.productId);
              } else {
                result.warnings.push(warning);
              }
            }

            // Out of Stock Warning
            if (remainingStock === 0 && availableStock >= requestedQuantity) {
              const warning = this.createValidationError(
                item,
                productName,
                availableStock,
                requestedQuantity,
                0,
                'OUT_OF_STOCK',
                `⚠️ OUT OF STOCK WARNING: "${productName}" will be completely out of stock after this sale`,
                'warning',
                strictMode || enforcementLevel === 'strict'
              );

              if (strictMode || enforcementLevel === 'strict') {
                result.errors.push(warning);
                result.summary.blockedItems.push(item.productId);
              } else {
                result.warnings.push(warning);
              }
            }
          }

          result.summary.validItems++;
          console.log(`✅ Stock validation passed for "${productName}"`);

        } catch (error) {
          console.error(`❌ Error validating stock for product ${item.productId}:`, error);
          
          const validationError = this.createValidationError(
            item,
            item.productName || 'Unknown Product',
            0,
            item.quantity,
            item.quantity,
            'VALIDATION_ERROR',
            `🚫 VALIDATION ERROR: Unable to check stock for "${item.productName || 'Unknown Product'}" - ${error instanceof Error ? error.message : 'Unknown error'}`,
            'error',
            true
          );
          
          result.errors.push(validationError);
          result.summary.invalidItems++;
          result.summary.totalShortfall += item.quantity;
          result.summary.blockedItems.push(item.productId);
        }
      }

      // Set final validation status
      result.hasBlockingErrors = result.errors.some(error => error.blockingError);
      result.isValid = result.errors.length === 0;
      result.canProceed = !result.hasBlockingErrors;

      // Log validation results
      console.log(`📊 STOCK VALIDATION RESULTS:`, {
        isValid: result.isValid,
        canProceed: result.canProceed,
        hasBlockingErrors: result.hasBlockingErrors,
        totalErrors: result.errors.length,
        totalWarnings: result.warnings.length,
        zeroStockItems: result.summary.zeroStockItems,
        insufficientStockItems: result.summary.insufficientStockItems,
        blockedItems: result.summary.blockedItems
      });

      return result;

    } catch (error) {
      console.error('❌ STOCK VALIDATION ENFORCEMENT FAILED:', error);
      
      // Return a completely failed validation
      return {
        isValid: false,
        canProceed: false,
        hasBlockingErrors: true,
        errors: [{
          productId: 'system',
          productName: 'System Error',
          availableStock: 0,
          requestedQuantity: 0,
          shortfall: 0,
          message: `🚫 SYSTEM ERROR: Stock validation enforcement failed - ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error',
          blockingError: true,
          errorCode: 'VALIDATION_ERROR'
        }],
        warnings: [],
        summary: {
          totalItems: items.length,
          validItems: 0,
          invalidItems: items.length,
          zeroStockItems: 0,
          insufficientStockItems: 0,
          totalShortfall: 0,
          blockedItems: items.map(item => item.productId)
        },
        validationTimestamp: new Date().toISOString(),
        enforcementLevel
      };
    }
  }

  /**
   * Helper method to create validation errors
   */
  private static createValidationError(
    item: StockValidationItem,
    productName: string,
    availableStock: number,
    requestedQuantity: number,
    shortfall: number,
    errorCode: StockValidationError['errorCode'],
    message: string,
    severity: 'error' | 'warning',
    blockingError: boolean
  ): StockValidationError {
    return {
      productId: item.productId,
      productName,
      availableStock,
      requestedQuantity,
      shortfall,
      message,
      severity,
      blockingError,
      errorCode
    };
  }

  /**
   * Quick check for zero stock items
   */
  static async checkForZeroStockItems(productIds: string[]): Promise<string[]> {
    const zeroStockItems: string[] = [];

    try {
      for (const productId of productIds) {
        const productRef = doc(db, this.PRODUCTS_COLLECTION, productId);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          const product = productSnap.data() as Product;
          const stock = product.quantity || 0;
          
          if (stock === 0) {
            zeroStockItems.push(productId);
          }
        } else {
          zeroStockItems.push(productId); // Treat non-existent products as zero stock
        }
      }
    } catch (error) {
      console.error('Error checking for zero stock items:', error);
    }

    return zeroStockItems;
  }

  /**
   * Get all products with zero or negative stock
   */
  static async getZeroStockProducts(userId?: string): Promise<Product[]> {
    try {
      let productsQuery = query(collection(db, this.PRODUCTS_COLLECTION));
      
      if (userId) {
        productsQuery = query(
          collection(db, this.PRODUCTS_COLLECTION),
          where('userId', '==', userId)
        );
      }

      const snapshot = await getDocs(productsQuery);
      const zeroStockProducts: Product[] = [];

      snapshot.docs.forEach(doc => {
        const product = { id: doc.id, ...doc.data() } as Product;
        const stock = product.quantity || 0;

        if (stock <= 0) {
          zeroStockProducts.push(product);
        }
      });

      return zeroStockProducts;
    } catch (error) {
      console.error('Error getting zero stock products:', error);
      return [];
    }
  }

  /**
   * Validate a single product's stock
   */
  static async validateSingleProductStock(
    productId: string,
    requestedQuantity: number
  ): Promise<{
    isValid: boolean;
    canProceed: boolean;
    availableStock: number;
    message: string;
    errorCode?: StockValidationError['errorCode'];
  }> {
    try {
      const productRef = doc(db, this.PRODUCTS_COLLECTION, productId);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        return {
          isValid: false,
          canProceed: false,
          availableStock: 0,
          message: '🚫 Product not found in inventory',
          errorCode: 'PRODUCT_NOT_FOUND'
        };
      }

      const product = productSnap.data() as Product;
      const availableStock = product.quantity || 0;
      const productName = product.name || 'Unknown Product';

      if (availableStock === 0) {
        return {
          isValid: false,
          canProceed: false,
          availableStock: 0,
          message: `🚫 ZERO STOCK: Cannot sell "${productName}" - No stock available`,
          errorCode: 'ZERO_STOCK'
        };
      }

      if (availableStock < requestedQuantity) {
        return {
          isValid: false,
          canProceed: false,
          availableStock,
          message: `🚫 INSUFFICIENT STOCK: "${productName}" - Available: ${availableStock}, Required: ${requestedQuantity}`,
          errorCode: 'INSUFFICIENT_STOCK'
        };
      }

      return {
        isValid: true,
        canProceed: true,
        availableStock,
        message: `✅ Stock available: ${availableStock} units of "${productName}"`
      };

    } catch (error) {
      console.error(`Error validating stock for product ${productId}:`, error);
      return {
        isValid: false,
        canProceed: false,
        availableStock: 0,
        message: `🚫 Error checking stock: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errorCode: 'VALIDATION_ERROR'
      };
    }
  }
}

export default StockValidationEnforcementService;