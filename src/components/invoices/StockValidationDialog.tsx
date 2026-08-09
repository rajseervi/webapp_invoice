"use client";
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Paper,
  Grid,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Inventory as InventoryIcon,
  Close as CloseIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { StockValidationResult, StockValidationError } from '@/hooks/useStockValidationEnforcement';

interface StockValidationDialogProps {
  open: boolean;
  onClose: () => void;
  onProceed?: () => void;
  onCancel?: () => void;
  validationResult: StockValidationResult | null;
  title?: string;
  allowProceedWithWarnings?: boolean;
  showProceedButton?: boolean;
  isValidating?: boolean;
}

const StockValidationDialog: React.FC<StockValidationDialogProps> = ({
  open,
  onClose,
  onProceed,
  onCancel,
  validationResult,
  title = "Stock Validation Results",
  allowProceedWithWarnings = false,
  showProceedButton = true,
  isValidating = false
}) => {
  if (!validationResult && !isValidating) return null;

  const handleProceed = () => {
    if (onProceed) {
      onProceed();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const getSeverityIcon = (severity: 'error' | 'warning') => {
    switch (severity) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getSeverityColor = (severity: 'error' | 'warning') => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  const renderValidationItem = (item: StockValidationError, index: number) => (
    <ListItem key={`${item.productId}-${index}`} sx={{ py: 1 }}>
      <ListItemIcon>
        {getSeverityIcon(item.severity)}
      </ListItemIcon>
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" fontWeight="medium">
              {item.productName}
            </Typography>
            {item.blockingError && (
              <Chip 
                label="BLOCKING" 
                size="small" 
                color="error" 
                variant="outlined"
              />
            )}
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" color="textSecondary">
              {item.message}
            </Typography>
            {item.availableStock !== undefined && (
              <Typography variant="caption" color="textSecondary">
                Available: {item.availableStock} | Requested: {item.requestedQuantity}
                {item.shortfall > 0 && ` | Shortfall: ${item.shortfall}`}
              </Typography>
            )}
          </Box>
        }
      />
    </ListItem>
  );

  const canProceed = validationResult?.canProceed || false;
  const hasBlockingErrors = validationResult?.hasBlockingErrors || false;
  const hasWarnings = (validationResult?.warnings.length || 0) > 0;
  const hasErrors = (validationResult?.errors.length || 0) > 0;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '400px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <InventoryIcon color="primary" />
            <Typography variant="h6">{title}</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {isValidating && (
          <Box mb={3}>
            <Typography variant="body2" gutterBottom>
              Validating stock levels...
            </Typography>
            <LinearProgress />
          </Box>
        )}

        {validationResult && (
          <>
            {/* Summary Section */}
            <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Validation Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {validationResult.summary.totalItems}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Total Items
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main">
                      {validationResult.summary.validItems}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Valid Items
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="error.main">
                      {validationResult.summary.zeroStockItems}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Zero Stock
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="warning.main">
                      {validationResult.summary.insufficientStockItems}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Insufficient
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Overall Status */}
            {hasBlockingErrors && (
              <Alert 
                severity="error" 
                icon={<BlockIcon />}
                sx={{ mb: 2 }}
              >
                <Typography variant="body2" fontWeight="bold">
                  🚫 INVOICE CREATION BLOCKED
                </Typography>
                <Typography variant="body2">
                  Cannot proceed with invoice creation due to stock validation errors. 
                  Please resolve the issues below or adjust quantities.
                </Typography>
              </Alert>
            )}

            {!hasBlockingErrors && hasWarnings && (
              <Alert 
                severity="warning" 
                icon={<WarningIcon />}
                sx={{ mb: 2 }}
              >
                <Typography variant="body2" fontWeight="bold">
                  ⚠️ STOCK WARNINGS DETECTED
                </Typography>
                <Typography variant="body2">
                  There are stock warnings for this invoice. Review the items below.
                  {allowProceedWithWarnings && " You can proceed if you accept these warnings."}
                </Typography>
              </Alert>
            )}

            {!hasErrors && !hasWarnings && (
              <Alert 
                severity="success" 
                icon={<CheckCircleIcon />}
                sx={{ mb: 2 }}
              >
                <Typography variant="body2" fontWeight="bold">
                  ✅ STOCK VALIDATION PASSED
                </Typography>
                <Typography variant="body2">
                  All items have sufficient stock. You can proceed with invoice creation.
                </Typography>
              </Alert>
            )}

            {/* Errors Section */}
            {hasErrors && (
              <Box mb={3}>
                <Typography variant="subtitle1" color="error" gutterBottom fontWeight="bold">
                  🚫 Stock Errors ({validationResult.errors.length})
                </Typography>
                <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto' }}>
                  <List dense>
                    {validationResult.errors.map((error, index) => 
                      renderValidationItem(error, index)
                    )}
                  </List>
                </Paper>
              </Box>
            )}

            {/* Warnings Section */}
            {hasWarnings && (
              <Box mb={3}>
                <Typography variant="subtitle1" color="warning.main" gutterBottom fontWeight="bold">
                  ⚠️ Stock Warnings ({validationResult.warnings.length})
                </Typography>
                <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto' }}>
                  <List dense>
                    {validationResult.warnings.map((warning, index) => 
                      renderValidationItem(warning, index)
                    )}
                  </List>
                </Paper>
              </Box>
            )}

            {/* Recommendations */}
            {hasBlockingErrors && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  💡 Recommendations:
                </Typography>
                <Typography variant="body2" component="div">
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    <li>Reduce quantities for items with insufficient stock</li>
                    <li>Remove items with zero stock from the invoice</li>
                    <li>Check if stock levels are up to date</li>
                    <li>Consider creating a purchase order to restock items</li>
                  </ul>
                </Typography>
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={handleCancel}
          variant="outlined"
          color="inherit"
        >
          Cancel
        </Button>
        
        {showProceedButton && (
          <Tooltip 
            title={
              hasBlockingErrors 
                ? "Cannot proceed due to blocking stock errors" 
                : hasWarnings && !allowProceedWithWarnings
                ? "Cannot proceed due to stock warnings"
                : "Proceed with invoice creation"
            }
          >
            <span>
              <Button
                onClick={handleProceed}
                variant="contained"
                color={hasBlockingErrors ? "error" : hasWarnings ? "warning" : "primary"}
                disabled={hasBlockingErrors || (hasWarnings && !allowProceedWithWarnings)}
                startIcon={
                  hasBlockingErrors ? <BlockIcon /> : 
                  hasWarnings ? <WarningIcon /> : 
                  <CheckCircleIcon />
                }
              >
                {hasBlockingErrors 
                  ? "Cannot Proceed" 
                  : hasWarnings 
                  ? "Proceed with Warnings" 
                  : "Proceed"
                }
              </Button>
            </span>
          </Tooltip>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default StockValidationDialog;