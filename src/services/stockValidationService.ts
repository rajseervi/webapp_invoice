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
}

export interface StockValidationResult {
  isValid: boolean;
  canProceed: boolean;
  errors: StockValidationError[];
  warnings: StockValidationError[];
  summary: {
    totalItems: number;
    validItems: number;
    invalidItems: number;
    totalShortfall: number;
  };
}

export class StockValidationService {
  private static readonly PRODUCTS_COLLECTION = 'products';

  /**
   * Comprehensive stock validation for invoice creation
   * This method ensures no invoice can be created with insufficient stock
   */
  static async validateStockForInvoice(
    items: StockValidationItem[],
    invoiceType: 'sales' | 'purchase' = 'sales',
    allowZeroStock: boolean = false,
    allowNegativeStock: boolean = false
  ): Promise<StockValidationResult> {
    const result: StockValidationResult = {
      isValid: true,
      canProceed: true,
      errors: [],
      warnings: [],
      summary: {
        totalItems: items.length,
        validItems: 0,
        invalidItems: 0,
        totalShortfall: 0
      }
    };

    // Only validate stock for sales invoices
    if (invoiceType !== 'sales') {
      result.summary.validItems = items.length;
      return result;
    }

    // Validate each item
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        continue;
      }

      try {
        const productRef = doc(db, this.PRODUCTS_COLLECTION, item.productId);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
          const error: StockValidationError = {
            productId: item.productId,
            productName: item.productName || 'Unknown Product',
            availableStock: 0,
            requestedQuantity: item.quantity,
            shortfall: item.quantity,
            message: `Product not found in inventory`,
            severity: 'error'
          };
          
          result.errors.push(error);
          result.summary.invalidItems++;
          result.summary.totalShortfall += item.quantity;
          continue;
        }

        const product = productSnap.data() as Product;
        const availableStock = product.quantity || 0;
        const requestedQuantity = item.quantity;
        const productName = product.name || item.productName || 'Unknown Product';

        // Critical validation: Check for zero stock
        if (availableStock === 0 && !allowZeroStock) {
          const error: StockValidationError = {
            productId: item.productId,
            productName,
            availableStock,
            requestedQuantity,
            shortfall: requestedQuantity,
            message: `❌ ZERO STOCK: Cannot sell "${productName}" - No stock available`,
            severity: 'error'
          };
          
          result.errors.push(error);
          result.summary.invalidItems++;
          result.summary.totalShortfall += requestedQuantity;
          continue;
        }

        // Critical validation: Check for insufficient stock
        if (availableStock < requestedQuantity) {
          const shortfall = requestedQuantity - availableStock;
          
          // If negative stock is not allowed, this is an error
          if (!allowNegativeStock) {
            const error: StockValidationError = {
              productId: item.productId,
              productName,
              availableStock,
              requestedQuantity,
              shortfall,
              message: `❌ INSUFFICIENT STOCK: "${productName}" - Available: ${availableStock}, Required: ${requestedQuantity}, Shortfall: ${shortfall}`,
              severity: 'error'
            };
            
            result.errors.push(error);
            result.summary.invalidItems++;
            result.summary.totalShortfall += shortfall;
            continue;
          } else {
            // If negative stock is allowed, show as warning
            const warning: StockValidationError = {
              productId: item.productId,
              productName,
              availableStock,
              requestedQuantity,
              shortfall,
              message: `⚠️ NEGATIVE STOCK WARNING: "${productName}" will have negative stock after this sale`,
              severity: 'warning'
            };
            
            result.warnings.push(warning);
          }
        }

        // Low stock warning
        const minStockLevel = product.minStockLevel || product.reorderPoint || 5;
        const remainingStock = availableStock - requestedQuantity;
        
        if (remainingStock > 0 && remainingStock <= minStockLevel) {
          const warning: StockValidationError = {
            productId: item.productId,
            productName,
            availableStock,
            requestedQuantity,
            shortfall: 0,
            message: `⚠️ LOW STOCK WARNING: "${productName}" will be low after this sale (Remaining: ${remainingStock}, Min Level: ${minStockLevel})`,
            severity: 'warning'
          };
          
          result.warnings.push(warning);
        }

        // Out of stock warning
        if (remainingStock === 0 && availableStock >= requestedQuantity) {
          const warning: StockValidationError = {
            productId: item.productId,
            productName,
            availableStock,
            requestedQuantity,
            shortfall: 0,
            message: `⚠️ OUT OF STOCK WARNING: "${productName}" will be completely out of stock after this sale`,
            severity: 'warning'
          };
          
          result.warnings.push(warning);
        }

        result.summary.validItems++;

      } catch (error) {
        console.error(`Error validating stock for product ${item.productId}:`, error);
        
        const validationError: StockValidationError = {
          productId: item.productId,
          productName: item.productName || 'Unknown Product',
          availableStock: 0,
          requestedQuantity: item.quantity,
          shortfall: item.quantity,
          message: `❌ VALIDATION ERROR: Unable to check stock for "${item.productName || 'Unknown Product'}"`,
          severity: 'error'
        };
        
        result.errors.push(validationError);
        result.summary.invalidItems++;
        result.summary.totalShortfall += item.quantity;
      }
    }

    // Set final validation status
    result.isValid = result.errors.length === 0;
    result.canProceed = result.isValid;

    return result;
  }

  /**
   * Get current stock levels for multiple products
   */
  static async getStockLevels(productIds: string[]): Promise<Map<string, number>> {
    const stockLevels = new Map<string, number>();

    for (const productId of productIds) {
      try {
        const productRef = doc(db, this.PRODUCTS_COLLECTION, productId);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          const product = productSnap.data() as Product;
          stockLevels.set(productId, product.quantity || 0);
        } else {
          stockLevels.set(productId, 0);
        }
      } catch (error) {
        console.error(`Error getting stock for product ${productId}:`, error);
        stockLevels.set(productId, 0);
      }
    }

    return stockLevels;
  }

  /**
   * Check if a single product has sufficient stock
   */
  static async checkProductStock(
    productId: string, 
    requiredQuantity: number
  ): Promise<{
    hasStock: boolean;
    availableStock: number;
    canFulfill: boolean;
    message: string;
  }> {
    try {
      const productRef = doc(db, this.PRODUCTS_COLLECTION, productId);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        return {
          hasStock: false,
          availableStock: 0,
          canFulfill: false,
          message: 'Product not found'
        };
      }

      const product = productSnap.data() as Product;
      const availableStock = product.quantity || 0;
      const canFulfill = availableStock >= requiredQuantity;

      return {
        hasStock: availableStock > 0,
        availableStock,
        canFulfill,
        message: canFulfill 
          ? `✅ Stock available: ${availableStock}` 
          : `❌ Insufficient stock: ${availableStock} available, ${requiredQuantity} required`
      };
    } catch (error) {
      console.error(`Error checking stock for product ${productId}:`, error);
      return {
        hasStock: false,
        availableStock: 0,
        canFulfill: false,
        message: 'Error checking stock'
      };
    }
  }

  /**
   * Get products with zero or low stock
   */
  static async getStockAlerts(): Promise<{
    zeroStock: Product[];
    lowStock: Product[];
    negativeStock: Product[];
  }> {
    try {
      const productsRef = collection(db, this.PRODUCTS_COLLECTION);
      const snapshot = await getDocs(productsRef);
      
      const zeroStock: Product[] = [];
      const lowStock: Product[] = [];
      const negativeStock: Product[] = [];

      snapshot.docs.forEach(doc => {
        const product = { id: doc.id, ...doc.data() } as Product;
        const stock = product.quantity || 0;
        const minLevel = product.minStockLevel || product.reorderPoint || 5;

        if (stock < 0) {
          negativeStock.push(product);
        } else if (stock === 0) {
          zeroStock.push(product);
        } else if (stock <= minLevel) {
          lowStock.push(product);
        }
      });

      return { zeroStock, lowStock, negativeStock };
    } catch (error) {
      console.error('Error getting stock alerts:', error);
      return { zeroStock: [], lowStock: [], negativeStock: [] };
    }
  }
}

export default StockValidationService;