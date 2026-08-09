"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  SelectChangeEvent,
  Autocomplete,
  Snackbar,
  Chip,
  Divider,
  Tooltip,
  Badge,
  Checkbox,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  LinearProgress,
  AlertTitle,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Add as AddIcon, 
  Save as SaveIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Inventory as InventoryIcon,
  Timer as TimerIcon,
  Bolt as BoltIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import OptimizedInvoiceService, { 
  OptimizedInvoiceOptions, 
  InvoiceCreationResult,
  StockWarning 
} from '@/services/optimizedInvoiceService';
import { Invoice, InvoiceItem } from '@/types/invoice';

interface OptimizedInvoiceFormProps {
  onInvoiceCreated?: (invoiceId: string) => void;
  initialData?: Partial<Invoice>;
  mode?: 'quick' | 'safe' | 'custom';
}

const OptimizedInvoiceForm: React.FC<OptimizedInvoiceFormProps> = ({
  onInvoiceCreated,
  initialData,
  mode = 'safe'
}) => {
  const router = useRouter();
  
  // Form state
  const [invoice, setInvoice] = useState<Partial<Invoice>>({
    invoiceNumber: '',
    partyName: '',
    partyId: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
    totalAmount: 0,
    ...initialData
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [creationResult, setCreationResult] = useState<InvoiceCreationResult | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  // Options state
  const [options, setOptions] = useState<OptimizedInvoiceOptions>({
    allowInsufficientStock: true,
    validateStock: true,
    updateStock: true,
    batchOperations: true,
    skipDuplicateChecks: false,
    preloadProducts: true,
    autoGenerateInvoiceNumber: true,
    createTransaction: true,
    showStockWarnings: true,
    warnOnLowStock: true
  });

  // Initialize options based on mode
  useEffect(() => {
    switch (mode) {
      case 'quick':
        setOptions({
          allowInsufficientStock: true,
          validateStock: false,
          updateStock: true,
          batchOperations: true,
          skipDuplicateChecks: true,
          preloadProducts: false,
          autoGenerateInvoiceNumber: true,
          createTransaction: false,
          showStockWarnings: false,
          warnOnLowStock: false
        });
        break;
      case 'safe':
        setOptions({
          allowInsufficientStock: true,
          validateStock: true,
          updateStock: true,
          batchOperations: true,
          skipDuplicateChecks: false,
          preloadProducts: true,
          autoGenerateInvoiceNumber: true,
          createTransaction: true,
          showStockWarnings: true,
          warnOnLowStock: true
        });
        break;
      // 'custom' uses current options state
    }
  }, [mode]);

  // Add item
  const addItem = useCallback(() => {
    const newItem: InvoiceItem = {
      productId: '',
      name: '',
      quantity: 1,
      price: 0,
      discount: 0,
      subtotal: 0
    };
    
    setInvoice(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));
  }, []);

  // Remove item
  const removeItem = useCallback((index: number) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index) || []
    }));
  }, []);

  // Update item
  const updateItem = useCallback((index: number, field: keyof InvoiceItem, value: any) => {
    setInvoice(prev => {
      const newItems = [...(prev.items || [])];
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };
      
      // Recalculate subtotal
      if (field === 'quantity' || field === 'price' || field === 'discount') {
        const item = newItems[index];
        const subtotal = (item.quantity || 0) * (item.price || 0);
        const discountAmount = (item.discount || 0);
        newItems[index].subtotal = subtotal - discountAmount;
      }
      
      return {
        ...prev,
        items: newItems
      };
    });
  }, []);

  // Calculate total
  const total = useMemo(() => {
    return (invoice.items || []).reduce((sum, item) => sum + (item.subtotal || 0), 0);
  }, [invoice.items]);

  // Update total when items change
  useEffect(() => {
    setInvoice(prev => ({
      ...prev,
      totalAmount: total
    }));
  }, [total]);

  // Handle option change
  const handleOptionChange = (option: keyof OptimizedInvoiceOptions, value: boolean) => {
    setOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  // Create invoice
  const handleCreateInvoice = async () => {
    if (!invoice.items || invoice.items.length === 0) {
      setCreationResult({
        success: false,
        errors: ['Please add at least one item to the invoice']
      });
      return;
    }

    setLoading(true);
    setCreationResult(null);

    try {
      const startTime = Date.now();
      
      let result: InvoiceCreationResult;
      
      if (mode === 'quick') {
        result = await OptimizedInvoiceService.createQuickInvoice(invoice as any);
      } else if (mode === 'safe') {
        result = await OptimizedInvoiceService.createSafeInvoice(invoice as any);
      } else {
        result = await OptimizedInvoiceService.createOptimizedInvoice(invoice as any, options);
      }
      
      const endTime = Date.now();
      setExecutionTime(endTime - startTime);
      
      setCreationResult(result);

      if (result.success && result.invoiceId) {
        onInvoiceCreated?.(result.invoiceId);
        
        // Reset form for next invoice
        setTimeout(() => {
          setInvoice({
            invoiceNumber: '',
            partyName: '',
            partyId: '',
            date: new Date().toISOString().split('T')[0],
            items: [],
            totalAmount: 0
          });
          setCreationResult(null);
        }, 3000);
      }

    } catch (error) {
      setCreationResult({
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      });
    } finally {
      setLoading(false);
    }
  };

  // Mode display configuration
  const modeConfig = {
    quick: {
      icon: <SpeedIcon />,
      color: 'warning',
      title: 'Quick Mode',
      description: 'Fast invoice creation with minimal validation'
    },
    safe: {
      icon: <SecurityIcon />,
      color: 'success',
      title: 'Safe Mode', 
      description: 'Full validation with stock warnings'
    },
    custom: {
      icon: <BoltIcon />,
      color: 'primary',
      title: 'Custom Mode',
      description: 'Customizable options for specific needs'
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {modeConfig[mode].icon}
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Optimized Invoice Creation
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  {modeConfig[mode].title} - {modeConfig[mode].description}
                </Typography>
              </Box>
            </Box>
            
            {executionTime && (
              <Chip 
                icon={<TimerIcon />}
                label={`${executionTime}ms`}
                color="secondary"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'white' }}
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Creation Result */}
      {creationResult && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            {creationResult.success ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                <AlertTitle>Invoice Created Successfully!</AlertTitle>
                Invoice ID: {creationResult.invoiceId}
                {creationResult.invoiceNumber && ` | Number: ${creationResult.invoiceNumber}`}
                {creationResult.executionTime && ` | Time: ${creationResult.executionTime}ms`}
              </Alert>
            ) : (
              <Alert severity="error" sx={{ mb: 2 }}>
                <AlertTitle>Invoice Creation Failed</AlertTitle>
                {creationResult.errors?.map((error, index) => (
                  <Typography key={index} variant="body2">{error}</Typography>
                ))}
              </Alert>
            )}

            {/* Stock Warnings */}
            {creationResult.stockWarnings && creationResult.stockWarnings.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <AlertTitle>Stock Warnings</AlertTitle>
                <List dense>
                  {creationResult.stockWarnings.map((warning, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <InventoryIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={warning.productName}
                        secondary={warning.message}
                      />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}

            {/* Other Warnings */}
            {creationResult.warnings && creationResult.warnings.length > 0 && (
              <Alert severity="info">
                <AlertTitle>Additional Information</AlertTitle>
                {creationResult.warnings.map((warning, index) => (
                  <Typography key={index} variant="body2">{warning}</Typography>
                ))}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Basic Invoice Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Invoice Details</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
            <TextField
              label="Invoice Number"
              value={invoice.invoiceNumber || ''}
              onChange={(e) => setInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))}
              disabled={options.autoGenerateInvoiceNumber}
              helperText={options.autoGenerateInvoiceNumber ? "Auto-generated" : ""}
            />
            <TextField
              label="Party Name"
              value={invoice.partyName || ''}
              onChange={(e) => setInvoice(prev => ({ ...prev, partyName: e.target.value }))}
              required
            />
            <TextField
              label="Date"
              type="date"
              value={invoice.date || ''}
              onChange={(e) => setInvoice(prev => ({ ...prev, date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Advanced Options (for custom mode) */}
      {mode === 'custom' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Advanced Options</Typography>
              <Button 
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                size="small"
              >
                {showAdvancedOptions ? 'Hide' : 'Show'} Options
              </Button>
            </Box>
            
            <Collapse in={showAdvancedOptions}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={options.allowInsufficientStock}
                      onChange={(e) => handleOptionChange('allowInsufficientStock', e.target.checked)}
                    />
                  }
                  label="Allow Insufficient Stock"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={options.validateStock}
                      onChange={(e) => handleOptionChange('validateStock', e.target.checked)}
                    />
                  }
                  label="Validate Stock"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={options.updateStock}
                      onChange={(e) => handleOptionChange('updateStock', e.target.checked)}
                    />
                  }
                  label="Update Stock"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={options.batchOperations}
                      onChange={(e) => handleOptionChange('batchOperations', e.target.checked)}
                    />
                  }
                  label="Batch Operations"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={options.preloadProducts}
                      onChange={(e) => handleOptionChange('preloadProducts', e.target.checked)}
                    />
                  }
                  label="Preload Products"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={options.autoGenerateInvoiceNumber}
                      onChange={(e) => handleOptionChange('autoGenerateInvoiceNumber', e.target.checked)}
                    />
                  }
                  label="Auto Generate Number"
                />
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Invoice Items</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addItem}
              size="small"
            >
              Add Item
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Discount</TableCell>
                  <TableCell align="right">Subtotal</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(invoice.items || []).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <TextField
                        size="small"
                        value={item.name || ''}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        placeholder="Product name"
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={item.price || ''}
                        onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={item.discount || ''}
                        onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        ₹{(item.subtotal || 0).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        onClick={() => removeItem(index)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {(!invoice.items || invoice.items.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No items added. Click "Add Item" to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Total */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Typography variant="h6">
              Total: ₹{total.toFixed(2)}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleCreateInvoice}
          disabled={loading || !invoice.partyName || !invoice.items?.length}
          color={mode === 'quick' ? 'warning' : mode === 'safe' ? 'success' : 'primary'}
        >
          {loading ? 'Creating...' : `Create Invoice (${modeConfig[mode].title})`}
        </Button>
      </Box>

      {loading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
          <Typography variant="body2" align="center" sx={{ mt: 1 }}>
            Creating invoice with {modeConfig[mode].title.toLowerCase()}...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default OptimizedInvoiceForm;