import { useState, useEffect, useCallback } from 'react';
import { InvoiceItem } from '@/types/invoice';
import StockValidationService, { StockValidationResult } from '@/services/stockValidationService';

interface UseStockValidationProps {
  items: InvoiceItem[];
  invoiceType: 'sales' | 'purchase';
  autoValidate?: boolean;
  allowZeroStock?: boolean;
  allowNegativeStock?: boolean;
}

interface UseStockValidationReturn {
  validationResult: StockValidationResult | null;
  isValidating: boolean;
  isValid: boolean;
  canProceed: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  errorCount: number;
  warningCount: number;
  validate: () => Promise<void>;
  reset: () => void;
}

export function useStockValidation({
  items,
  invoiceType,
  autoValidate = true,
  allowZeroStock = false,
  allowNegativeStock = false
}: UseStockValidationProps): UseStockValidationReturn {
  const [validationResult, setValidationResult] = useState<StockValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(async () => {
    // Skip validation for purchase invoices
    if (invoiceType !== 'sales') {
      const result: StockValidationResult = {
        isValid: true,
        canProceed: true,
        errors: [],
        warnings: [],
        summary: {
          totalItems: items.length,
          validItems: items.length,
          invalidItems: 0,
          totalShortfall: 0
        }
      };
      setValidationResult(result);
      return;
    }

    // Skip validation if no items
    if (!items || items.length === 0) {
      setValidationResult(null);
      return;
    }

    setIsValidating(true);
    try {
      const stockItems = items
        .filter(item => item.productId && item.quantity > 0)
        .map(item => ({
          productId: item.productId!,
          productName: item.name || item.productName || '',
          quantity: item.quantity
        }));

      if (stockItems.length === 0) {
        setValidationResult(null);
        return;
      }

      const result = await StockValidationService.validateStockForInvoice(
        stockItems,
        invoiceType,
        allowZeroStock,
        allowNegativeStock
      );

      setValidationResult(result);
    } catch (error) {
      console.error('Stock validation error:', error);
      const errorResult: StockValidationResult = {
        isValid: false,
        canProceed: false,
        errors: [{
          productId: 'system',
          productName: 'System Error',
          availableStock: 0,
          requestedQuantity: 0,
          shortfall: 0,
          message: 'Failed to validate stock. Please try again.',
          severity: 'error'
        }],
        warnings: [],
        summary: {
          totalItems: items.length,
          validItems: 0,
          invalidItems: items.length,
          totalShortfall: 0
        }
      };
      setValidationResult(errorResult);
    } finally {
      setIsValidating(false);
    }
  }, [items, invoiceType, allowZeroStock, allowNegativeStock]);

  const reset = useCallback(() => {
    setValidationResult(null);
    setIsValidating(false);
  }, []);

  // Auto-validate when items change
  useEffect(() => {
    if (autoValidate) {
      validate();
    }
  }, [validate, autoValidate]);

  // Computed values
  const isValid = validationResult?.isValid ?? false;
  const canProceed = validationResult?.canProceed ?? false;
  const hasErrors = (validationResult?.errors.length ?? 0) > 0;
  const hasWarnings = (validationResult?.warnings.length ?? 0) > 0;
  const errorCount = validationResult?.errors.length ?? 0;
  const warningCount = validationResult?.warnings.length ?? 0;

  return {
    validationResult,
    isValidating,
    isValid,
    canProceed,
    hasErrors,
    hasWarnings,
    errorCount,
    warningCount,
    validate,
    reset
  };
}

export default useStockValidation;