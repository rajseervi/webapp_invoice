"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Grid,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
  Badge,
  Stack,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Inventory as StockIcon,
  Block as BlockIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  ShoppingCart as CartIcon
} from '@mui/icons-material';
import { InvoiceItem } from '@/types/invoice';
import StockValidationService, { StockValidationResult, StockValidationError } from '@/services/stockValidationService';

interface StockValidatedInvoiceFormProps {
  invoiceItems: InvoiceItem[];
  invoiceType: 'sales' | 'purchase';
  onValidationComplete: (result: StockValidationResult) => void;
  onProceed: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function StockValidatedInvoiceForm({
  invoiceItems,
  invoiceType,
  onValidationComplete,
  onProceed,
  onCancel,
  loading = false
}: StockValidatedInvoiceFormProps) {
  const [validationResult, setValidationResult] = useState<StockValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [allowZeroStock, setAllowZeroStock] = useState(false);

  useEffect(() => {
    if (invoiceItems.length > 0) {
      validateStock();
    }
  }, [invoiceItems, allowNegativeStock, allowZeroStock]);

  const validateStock = async () => {
    if (invoiceType !== 'sales') {
      const result: StockValidationResult = {
        isValid: true,
        canProceed: true,
        errors: [],
        warnings: [],
        summary: {
          totalItems: invoiceItems.length,
          validItems: invoiceItems.length,
          invalidItems: 0,
          totalShortfall: 0
        }
      };
      setValidationResult(result);
      onValidationComplete(result);
      return;
    }

    setValidating(true);
    try {
      const stockItems = invoiceItems
        .filter(item => item.productId && item.quantity > 0)
        .map(item => ({
          productId: item.productId!,
          productName: item.name || item.productName,
          quantity: item.quantity
        }));

      const result = await StockValidationService.validateStockForInvoice(
        stockItems,
        invoiceType,
        allowZeroStock,
        allowNegativeStock
      );

      setValidationResult(result);
      onValidationComplete(result);

      // Show validation dialog if there are errors or warnings
      if (result.errors.length > 0 || result.warnings.length > 0) {
        setShowValidationDialog(true);
      }
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
          totalItems: invoiceItems.length,
          validItems: 0,
          invalidItems: invoiceItems.length,
          totalShortfall: 0
        }
      };
      setValidationResult(errorResult);
      onValidationComplete(errorResult);
    } finally {
      setValidating(false);
    }
  };

  const handleProceed = () => {
    if (validationResult?.canProceed) {
      onProceed();
    }
  };

  const getValidationStatusColor = () => {
    if (!validationResult) return 'default';
    if (validationResult.errors.length > 0) return 'error';
    if (validationResult.warnings.length > 0) return 'warning';
    return 'success';
  };

  const getValidationStatusIcon = () => {
    if (validating) return <RefreshIcon className="animate-spin" />;
    if (!validationResult) return <InfoIcon />;
    if (validationResult.errors.length > 0) return <ErrorIcon />;
    if (validationResult.warnings.length > 0) return <WarningIcon />;
    return <SuccessIcon />;
  };

  const renderValidationSummary = () => {
    if (!validationResult) return null;

    const { summary, errors, warnings } = validationResult;

    return (
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <StockIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Stock Validation Summary</Typography>
            {validating && <LinearProgress sx={{ ml: 2, flexGrow: 1 }} />}
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {summary.totalItems}
                </Typography>
                <Typography variant="caption">Total Items</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {summary.validItems}
                </Typography>
                <Typography variant="caption">Valid Items</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  {summary.invalidItems}
                </Typography>
                <Typography variant="caption">Invalid Items</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {summary.totalShortfall}
                </Typography>
                <Typography variant="caption">Total Shortfall</Typography>
              </Paper>
            </Grid>
          </Grid>

          {errors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                ❌ Stock Validation Errors ({errors.length})
              </Typography>
              <Typography variant="body2">
                Cannot proceed with invoice creation due to stock issues.
              </Typography>
            </Alert>
          )}

          {warnings.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                ⚠️ Stock Warnings ({warnings.length})
              </Typography>
              <Typography variant="body2">
                Please review stock warnings before proceeding.
              </Typography>
            </Alert>
          )}

          {validationResult.isValid && (
            <Alert severity="success">
              <Typography variant="subtitle2" gutterBottom>
                ✅ Stock Validation Passed
              </Typography>
              <Typography variant="body2">
                All items have sufficient stock. Ready to create invoice.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderValidationDialog = () => (
    <Dialog
      open={showValidationDialog}
      onClose={() => setShowValidationDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {getValidationStatusIcon()}
          <Typography variant="h6" sx={{ ml: 1 }}>
            Stock Validation Results
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {validationResult?.errors.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" color="error" gutterBottom>
              ❌ Critical Stock Issues
            </Typography>
            <List>
              {validationResult.errors.map((error, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <ErrorIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={error.productName}
                    secondary={error.message}
                  />
                  <Chip
                    label={`${error.availableStock}/${error.requestedQuantity}`}
                    color="error"
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {validationResult?.warnings.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" color="warning.main" gutterBottom>
              ⚠️ Stock Warnings
            </Typography>
            <List>
              {validationResult.warnings.map((warning, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <WarningIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={warning.productName}
                    secondary={warning.message}
                  />
                  <Chip
                    label={`${warning.availableStock}/${warning.requestedQuantity}`}
                    color="warning"
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Advanced Options
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={allowZeroStock}
                onChange={(e) => setAllowZeroStock(e.target.checked)}
                color="warning"
              />
            }
            label="Allow zero stock sales (Not recommended)"
          />
          <FormControlLabel
            control={
              <Switch
                checked={allowNegativeStock}
                onChange={(e) => setAllowNegativeStock(e.target.checked)}
                color="error"
              />
            }
            label="Allow negative stock (Not recommended)"
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={() => setShowValidationDialog(false)}>
          Close
        </Button>
        <Button onClick={validateStock} startIcon={<RefreshIcon />}>
          Re-validate
        </Button>
        {validationResult?.canProceed && (
          <Button
            variant="contained"
            onClick={() => {
              setShowValidationDialog(false);
              handleProceed();
            }}
            startIcon={<CartIcon />}
          >
            Proceed with Invoice
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      {renderValidationSummary()}

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={loading || validating}
        >
          Cancel
        </Button>
        
        <Button
          variant="outlined"
          onClick={validateStock}
          disabled={loading || validating}
          startIcon={<RefreshIcon />}
        >
          Re-validate Stock
        </Button>

        <Button
          variant="contained"
          onClick={handleProceed}
          disabled={loading || validating || !validationResult?.canProceed}
          startIcon={validationResult?.canProceed ? <CartIcon /> : <BlockIcon />}
          color={validationResult?.canProceed ? 'primary' : 'error'}
        >
          {loading ? 'Creating Invoice...' : 
           validating ? 'Validating...' :
           validationResult?.canProceed ? 'Create Invoice' : 'Cannot Proceed'}
        </Button>
      </Box>

      {renderValidationDialog()}
    </Box>
  );
}