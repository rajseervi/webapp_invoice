"use client";
import React, { useState, useCallback } from 'react';
import { Box, Alert, Button, Snackbar } from '@mui/material';
import { Block as BlockIcon, Warning as WarningIcon } from '@mui/icons-material';
import { useStockValidationEnforcement, StockValidationItem } from '@/hooks/useStockValidationEnforcement';
import StockValidationDialog from './StockValidationDialog';

interface StockValidatedInvoiceWrapperProps {
  children: React.ReactNode;
  onValidationRequired?: (items: StockValidationItem[]) => Promise<boolean>;
  strictMode?: boolean;
  allowZeroStock?: boolean;
  allowNegativeStock?: boolean;
  showValidationAlerts?: boolean;
}

const StockValidatedInvoiceWrapper: React.FC<StockValidatedInvoiceWrapperProps> = ({
  children,
  onValidationRequired,
  strictMode = false,
  allowZeroStock = false,
  allowNegativeStock = false,
  showValidationAlerts = true
}) => {
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [pendingValidationCallback, setPendingValidationCallback] = useState<(() => void) | null>(null);
  const [validationSnackbar, setValidationSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const {
    validateStock,
    validationResult,
    isValidating,
    validationError,
    clearValidation,
    hasZeroStockErrors,
    hasInsufficientStockErrors,
    canProceedWithInvoice,
    totalBlockingErrors
  } = useStockValidationEnforcement();

  // Function to be called by child components before invoice creation
  const performStockValidation = useCallback(async (
    items: StockValidationItem[],
    onSuccess?: () => void,
    onFailure?: (errors: string[]) => void
  ): Promise<boolean> => {
    try {
      // Clear previous validation
      clearValidation();

      // Validate stock
      const result = await validateStock(items, {
        allowZeroStock,
        allowNegativeStock,
        strictMode
      });

      // If validation passes completely, proceed immediately
      if (result.isValid && result.canProceed && result.errors.length === 0) {
        if (onSuccess) {
          onSuccess();
        }
        return true;
      }

      // If there are blocking errors, show dialog and prevent proceeding
      if (result.hasBlockingErrors) {
        setShowValidationDialog(true);
        setPendingValidationCallback(() => () => {
          if (onFailure) {
            const errorMessages = result.errors
              .filter(error => error.blockingError)
              .map(error => error.message);
            onFailure(errorMessages);
          }
        });

        // Show snackbar for immediate feedback
        if (showValidationAlerts) {
          const zeroStockCount = result.summary.zeroStockItems;
          const insufficientStockCount = result.summary.insufficientStockItems;
          
          let message = '🚫 Cannot create invoice: ';
          if (zeroStockCount > 0 && insufficientStockCount > 0) {
            message += `${zeroStockCount} items have zero stock, ${insufficientStockCount} have insufficient stock`;
          } else if (zeroStockCount > 0) {
            message += `${zeroStockCount} items have zero stock`;
          } else if (insufficientStockCount > 0) {
            message += `${insufficientStockCount} items have insufficient stock`;
          } else {
            message += 'Stock validation errors detected';
          }

          setValidationSnackbar({
            open: true,
            message,
            severity: 'error'
          });
        }

        return false;
      }

      // If there are only warnings, show dialog but allow proceeding
      if (result.warnings.length > 0) {
        setShowValidationDialog(true);
        setPendingValidationCallback(() => () => {
          if (onSuccess) {
            onSuccess();
          }
        });

        // Show snackbar for warnings
        if (showValidationAlerts) {
          setValidationSnackbar({
            open: true,
            message: `⚠️ Stock warnings detected for ${result.warnings.length} items`,
            severity: 'warning'
          });
        }

        return false; // Wait for user confirmation
      }

      // Should not reach here, but handle as success
      if (onSuccess) {
        onSuccess();
      }
      return true;

    } catch (error) {
      console.error('Stock validation failed:', error);
      
      if (onFailure) {
        onFailure([`Stock validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      }

      if (showValidationAlerts) {
        setValidationSnackbar({
          open: true,
          message: '🚫 Stock validation failed - please try again',
          severity: 'error'
        });
      }

      return false;
    }
  }, [
    validateStock,
    clearValidation,
    allowZeroStock,
    allowNegativeStock,
    strictMode,
    showValidationAlerts
  ]);

  const handleValidationDialogProceed = useCallback(() => {
    if (pendingValidationCallback) {
      pendingValidationCallback();
      setPendingValidationCallback(null);
    }
    setShowValidationDialog(false);
    clearValidation();
  }, [pendingValidationCallback, clearValidation]);

  const handleValidationDialogCancel = useCallback(() => {
    setPendingValidationCallback(null);
    setShowValidationDialog(false);
    clearValidation();
  }, [clearValidation]);

  const handleSnackbarClose = useCallback(() => {
    setValidationSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // Provide validation function to children through context or props
  const enhancedChildren = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        ...child.props,
        performStockValidation,
        stockValidationInProgress: isValidating
      } as any);
    }
    return child;
  });

  return (
    <Box>
      {/* Validation Status Alerts */}
      {showValidationAlerts && validationResult && !showValidationDialog && (
        <Box mb={2}>
          {totalBlockingErrors > 0 && (
            <Alert 
              severity="error" 
              icon={<BlockIcon />}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => setShowValidationDialog(true)}
                >
                  View Details
                </Button>
              }
            >
              🚫 Invoice creation blocked: {totalBlockingErrors} stock validation error(s)
            </Alert>
          )}

          {totalBlockingErrors === 0 && validationResult.warnings.length > 0 && (
            <Alert 
              severity="warning" 
              icon={<WarningIcon />}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => setShowValidationDialog(true)}
                >
                  View Details
                </Button>
              }
            >
              ⚠️ Stock warnings detected: {validationResult.warnings.length} item(s)
            </Alert>
          )}
        </Box>
      )}

      {/* Main Content */}
      {enhancedChildren}

      {/* Stock Validation Dialog */}
      <StockValidationDialog
        open={showValidationDialog}
        onClose={handleValidationDialogCancel}
        onProceed={handleValidationDialogProceed}
        onCancel={handleValidationDialogCancel}
        validationResult={validationResult}
        title="Stock Validation Required"
        allowProceedWithWarnings={!strictMode}
        showProceedButton={true}
        isValidating={isValidating}
      />

      {/* Validation Snackbar */}
      <Snackbar
        open={validationSnackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={validationSnackbar.severity}
          sx={{ width: '100%' }}
        >
          {validationSnackbar.message}
        </Alert>
      </Snackbar>

      {/* Validation Error Display */}
      {validationError && showValidationAlerts && (
        <Snackbar
          open={!!validationError}
          autoHideDuration={8000}
          onClose={() => {}}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error" sx={{ width: '100%' }}>
            Stock validation error: {validationError}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default StockValidatedInvoiceWrapper;