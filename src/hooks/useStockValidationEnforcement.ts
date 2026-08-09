import { useState, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
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
  blockingError: boolean; // Whether this error should prevent invoice creation
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
  };
}

export const useStockValidationEnforcement = () => {
  const [validationResult, setValidationResult] = useState<StockValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateStock = useCallback(async (
    items: StockValidationItem[],
    options: {
      allowZeroStock?: boolean;
      allowNegativeStock?: boolean;
      strictMode?: boolean; // In strict mode, even warnings become blocking errors
    } = {}
  ): Promise<StockValidationResult> => {
    const {
      allowZeroStock = false,
      allowNegativeStock = false,
      strictMode = false
    } = options;

    setIsValidating(true);
    setValidationError(null);

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
        totalShortfall: 0
      }
    };

    try {
      // Validate each item
      for (const item of items) {
        if (!item.productId || !item.quantity || item.quantity <= 0) {
          continue;
        }

        try {
          const productRef = doc(db, 'products', item.productId);
          const productSnap = await getDoc(productRef);

          if (!productSnap.exists()) {
            const error: StockValidationError = {
              productId: item.productId,
              productName: item.productName || 'Unknown Product',
              availableStock: 0,
              requestedQuantity: item.quantity,
              shortfall: item.quantity,
              message: `🚫 PRODUCT NOT FOUND: "${item.productName || 'Unknown Product'}" does not exist in inventory`,
              severity: 'error',
              blockingError: true
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

          // CRITICAL CHECK: Zero Stock Validation
          if (availableStock === 0) {
            const error: StockValidationError = {
              productId: item.productId,
              productName,
              availableStock,
              requestedQuantity,
              shortfall: requestedQuantity,
              message: `🚫 ZERO STOCK ALERT: Cannot sell "${productName}" - No stock available (Current Stock: 0)`,
              severity: 'error',
              blockingError: !allowZeroStock
            };
            
            if (allowZeroStock) {
              result.warnings.push(error);
            } else {
              result.errors.push(error);
              result.summary.zeroStockItems++;
            }
            
            result.summary.invalidItems++;
            result.summary.totalShortfall += requestedQuantity;
            continue;
          }

          // CRITICAL CHECK: Insufficient Stock Validation
          if (availableStock < requestedQuantity) {
            const shortfall = requestedQuantity - availableStock;
            
            const error: StockValidationError = {
              productId: item.productId,
              productName,
              availableStock,
              requestedQuantity,
              shortfall,
              message: `🚫 INSUFFICIENT STOCK: "${productName}" - Available: ${availableStock}, Required: ${requestedQuantity}, Shortfall: ${shortfall}`,
              severity: 'error',
              blockingError: !allowNegativeStock
            };
            
            if (allowNegativeStock) {
              error.message = `⚠️ NEGATIVE STOCK WARNING: "${productName}" will have negative stock after this sale (Available: ${availableStock}, Required: ${requestedQuantity})`;
              error.severity = 'warning';
              result.warnings.push(error);
            } else {
              result.errors.push(error);
              result.summary.insufficientStockItems++;
            }
            
            result.summary.invalidItems++;
            result.summary.totalShortfall += shortfall;
            continue;
          }

          // Low Stock Warning
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
              severity: 'warning',
              blockingError: strictMode
            };
            
            if (strictMode) {
              result.errors.push(warning);
            } else {
              result.warnings.push(warning);
            }
          }

          // Out of Stock Warning
          if (remainingStock === 0 && availableStock >= requestedQuantity) {
            const warning: StockValidationError = {
              productId: item.productId,
              productName,
              availableStock,
              requestedQuantity,
              shortfall: 0,
              message: `⚠️ OUT OF STOCK WARNING: "${productName}" will be completely out of stock after this sale`,
              severity: 'warning',
              blockingError: strictMode
            };
            
            if (strictMode) {
              result.errors.push(warning);
            } else {
              result.warnings.push(warning);
            }
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
            message: `🚫 VALIDATION ERROR: Unable to check stock for "${item.productName || 'Unknown Product'}" - ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'error',
            blockingError: true
          };
          
          result.errors.push(validationError);
          result.summary.invalidItems++;
          result.summary.totalShortfall += item.quantity;
        }
      }

      // Set final validation status
      result.hasBlockingErrors = result.errors.some(error => error.blockingError);
      result.isValid = result.errors.length === 0;
      result.canProceed = !result.hasBlockingErrors;

      setValidationResult(result);
      return result;

    } catch (error) {
      console.error('Stock validation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      setValidationError(errorMessage);
      
      // Return a failed validation result
      const failedResult: StockValidationResult = {
        isValid: false,
        canProceed: false,
        hasBlockingErrors: true,
        errors: [{
          productId: 'system',
          productName: 'System Error',
          availableStock: 0,
          requestedQuantity: 0,
          shortfall: 0,
          message: `🚫 SYSTEM ERROR: Stock validation failed - ${errorMessage}`,
          severity: 'error',
          blockingError: true
        }],
        warnings: [],
        summary: {
          totalItems: items.length,
          validItems: 0,
          invalidItems: items.length,
          zeroStockItems: 0,
          insufficientStockItems: 0,
          totalShortfall: 0
        }
      };
      
      setValidationResult(failedResult);
      return failedResult;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearValidation = useCallback(() => {
    setValidationResult(null);
    setValidationError(null);
  }, []);

  const getBlockingErrorsCount = useCallback(() => {
    if (!validationResult) return 0;
    return validationResult.errors.filter(error => error.blockingError).length;
  }, [validationResult]);

  const getZeroStockItems = useCallback(() => {
    if (!validationResult) return [];
    return validationResult.errors.filter(error => 
      error.availableStock === 0 && error.blockingError
    );
  }, [validationResult]);

  const getInsufficientStockItems = useCallback(() => {
    if (!validationResult) return [];
    return validationResult.errors.filter(error => 
      error.availableStock > 0 && error.availableStock < error.requestedQuantity && error.blockingError
    );
  }, [validationResult]);

  return {
    validateStock,
    validationResult,
    isValidating,
    validationError,
    clearValidation,
    getBlockingErrorsCount,
    getZeroStockItems,
    getInsufficientStockItems,
    
    // Helper methods
    hasZeroStockErrors: validationResult?.summary.zeroStockItems > 0,
    hasInsufficientStockErrors: validationResult?.summary.insufficientStockItems > 0,
    canProceedWithInvoice: validationResult?.canProceed ?? false,
    totalBlockingErrors: getBlockingErrorsCount()
  };
};

export default useStockValidationEnforcement;