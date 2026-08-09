"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Autocomplete,
  Alert,
  AlertTitle,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CheckCircle as ValidIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Calculate as CalculateIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import EnhancedInvoiceService, { EnhancedInvoice, EnhancedInvoiceItem } from '@/services/enhancedInvoiceService';
import EnhancedValidationService, { ValidationResult, ValidationError } from '@/services/enhancedValidationService';
import { productService } from '@/services/productService';
import { partyService } from '@/services/partyService';

interface Product {
  id: string;
  name: string;
  code?: string;
  hsnCode: string;
  gstRate: number;
  unitPrice: number;
  quantity: number;
  unitOfMeasurement: string;
  category?: string;
}

interface Party {
  id: string;
  name: string;
  gstin?: string;
  address?: string;
  phone?: string;
  email?: string;
  stateCode?: string;
  creditLimit?: number;
}

interface EnhancedInvoiceFormProps {
  invoice?: EnhancedInvoice;
  type: 'sales' | 'purchase';
  onSave: (invoice: EnhancedInvoice) => void;
  onCancel: () => void;
}

export default function EnhancedInvoiceForm({ 
  invoice, 
  type, 
  onSave, 
  onCancel 
}: EnhancedInvoiceFormProps) {
  // Form state
  const [formData, setFormData] = useState<Partial<EnhancedInvoice>>({
    type,
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    items: [],
    subtotal: 0,
    totalDiscount: 0,
    totalCgst: 0,
    totalSgst: 0,
    totalIgst: 0,
    totalCess: 0,
    totalTaxAmount: 0,
    roundOffAmount: 0,
    grandTotal: 0,
    paymentStatus: 'pending',
    paidAmount: 0,
    balanceAmount: 0,
    status: 'draft',
    isInterState: false,
    stockUpdated: false,
    validationStatus: 'pending',
    syncStatus: 'pending',
    createdBy: 'current-user' // This should come from auth context
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Map<string, ValidationError[]>>(new Map());

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);

  // Auto-calculation state
  const [autoCalculate, setAutoCalculate] = useState(true);

  // Load initial data
  useEffect(() => {
    loadInitialData();
    
    if (invoice) {
      setFormData(invoice);
      if (invoice.customerId || invoice.supplierId) {
        loadPartyDetails(invoice.customerId || invoice.supplierId!);
      }
    } else {
      // Generate invoice number for new invoices
      const invoiceNumber = EnhancedInvoiceService.generateInvoiceNumber(type);
      setFormData(prev => ({ ...prev, invoiceNumber }));
    }
  }, [invoice, type]);

  // Auto-calculate totals when items change
  useEffect(() => {
    if (autoCalculate && formData.items && formData.items.length > 0) {
      calculateTotals();
    }
  }, [formData.items, selectedParty, autoCalculate]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [productsData, partiesData] = await Promise.all([
        productService.getProducts(),
        partyService.getParties()
      ]);
      
      setProducts(productsData);
      setParties(partiesData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPartyDetails = async (partyId: string) => {
    try {
      const party = await partyService.getPartyById(partyId);
      if (party) {
        setSelectedParty(party);
        setFormData(prev => ({
          ...prev,
          [type === 'sales' ? 'customerId' : 'supplierId']: party.id,
          [type === 'sales' ? 'customerName' : 'supplierName']: party.name,
          [type === 'sales' ? 'customerGstin' : 'supplierGstin']: party.gstin
        }));
      }
    } catch (error) {
      console.error('Error loading party details:', error);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field-specific errors
    if (fieldErrors.has(field)) {
      const newFieldErrors = new Map(fieldErrors);
      newFieldErrors.delete(field);
      setFieldErrors(newFieldErrors);
    }

    // Real-time validation for critical fields
    if (['invoiceNumber', 'invoiceDate', 'totalAmount'].includes(field)) {
      validateField(field, value);
    }
  };

  const validateField = async (fieldName: string, value: any) => {
    try {
      const errors = EnhancedValidationService.validateField(fieldName, value, {
        invoiceNumber: formData.invoiceNumber || '',
        date: formData.invoiceDate || '',
        customerId: formData.customerId,
        supplierId: formData.supplierId,
        items: formData.items?.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          gstRate: item.gstRate,
          discountPercent: item.discountPercent || 0
        })) || [],
        totalAmount: formData.grandTotal || 0,
        gstAmount: formData.totalTaxAmount || 0,
        subtotal: formData.subtotal || 0,
        type
      });

      if (errors.length > 0) {
        setFieldErrors(prev => new Map(prev.set(fieldName, errors)));
      } else {
        setFieldErrors(prev => {
          const newMap = new Map(prev);
          newMap.delete(fieldName);
          return newMap;
        });
      }
    } catch (error) {
      console.error('Error validating field:', error);
    }
  };

  const handlePartyChange = (party: Party | null) => {
    setSelectedParty(party);
    
    if (party) {
      setFormData(prev => ({
        ...prev,
        [type === 'sales' ? 'customerId' : 'supplierId']: party.id,
        [type === 'sales' ? 'customerName' : 'supplierName']: party.name,
        [type === 'sales' ? 'customerGstin' : 'supplierGstin']: party.gstin
      }));

      // Determine if inter-state transaction
      if (party.stateCode) {
        const companyStateCode = '27'; // This should come from company settings
        const isInterState = party.stateCode !== companyStateCode;
        setFormData(prev => ({ ...prev, isInterState }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [type === 'sales' ? 'customerId' : 'supplierId']: undefined,
        [type === 'sales' ? 'customerName' : 'supplierName']: undefined,
        [type === 'sales' ? 'customerGstin' : 'supplierGstin']: undefined,
        isInterState: false
      }));
    }
  };

  const handleAddItem = () => {
    const newItem: Partial<EnhancedInvoiceItem> = {
      id: `temp-${Date.now()}`,
      productId: '',
      productName: '',
      hsnCode: '',
      quantity: 1,
      unitOfMeasurement: 'PCS',
      unitPrice: 0,
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 0,
      gstRate: 18,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      cessAmount: 0,
      totalTaxAmount: 0,
      totalAmount: 0,
      isService: false
    };

    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem as EnhancedInvoiceItem]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index) || []
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...(formData.items || [])];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // Auto-populate product details when product is selected
    if (field === 'productId' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItems[index] = {
          ...updatedItems[index],
          productName: product.name,
          hsnCode: product.hsnCode,
          unitPrice: product.unitPrice,
          gstRate: product.gstRate,
          unitOfMeasurement: product.unitOfMeasurement,
          isService: product.hsnCode.startsWith('99') // Services typically have HSN starting with 99
        };
      }
    }

    // Recalculate item totals
    if (['quantity', 'unitPrice', 'discountPercent', 'gstRate'].includes(field)) {
      const item = updatedItems[index];
      const calculatedItem = EnhancedInvoiceService.calculateItemGst(
        item as any,
        formData.isInterState || false
      );
      updatedItems[index] = calculatedItem;
    }

    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const calculateTotals = () => {
    if (!formData.items || formData.items.length === 0) {
      setFormData(prev => ({
        ...prev,
        subtotal: 0,
        totalDiscount: 0,
        totalCgst: 0,
        totalSgst: 0,
        totalIgst: 0,
        totalCess: 0,
        totalTaxAmount: 0,
        roundOffAmount: 0,
        grandTotal: 0,
        balanceAmount: 0
      }));
      return;
    }

    const totals = EnhancedInvoiceService.calculateInvoiceTotals(formData.items);
    
    setFormData(prev => ({
      ...prev,
      ...totals,
      balanceAmount: totals.grandTotal - (prev.paidAmount || 0)
    }));
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      const validationData = {
        id: formData.id,
        invoiceNumber: formData.invoiceNumber || '',
        date: formData.invoiceDate || '',
        customerId: formData.customerId,
        supplierId: formData.supplierId,
        items: formData.items?.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          gstRate: item.gstRate,
          discountPercent: item.discountPercent || 0
        })) || [],
        totalAmount: formData.grandTotal || 0,
        gstAmount: formData.totalTaxAmount || 0,
        subtotal: formData.subtotal || 0,
        type
      };

      const result = await EnhancedValidationService.validateInvoice(validationData);
      setValidation(result);

      // Group errors by field
      const errorsByField = new Map<string, ValidationError[]>();
      result.errors.forEach(error => {
        const fieldErrors = errorsByField.get(error.field) || [];
        fieldErrors.push(error);
        errorsByField.set(error.field, fieldErrors);
      });
      setFieldErrors(errorsByField);

    } catch (error) {
      console.error('Error validating invoice:', error);
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate before saving
      await handleValidate();
      
      if (validation && !validation.isValid) {
        setSaving(false);
        return;
      }

      const result = await EnhancedInvoiceService.createInvoice(
        formData as Omit<EnhancedInvoice, 'id' | 'createdAt' | 'updatedAt' | 'validationStatus' | 'syncStatus'>,
        true
      );

      if (result.success && result.invoiceId) {
        const savedInvoice = await EnhancedInvoiceService.getInvoiceById(result.invoiceId);
        if (savedInvoice) {
          onSave(savedInvoice);
        }
      } else {
        setValidation(result.validation || null);
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
    } finally {
      setSaving(false);
    }
  };

  const getFieldError = (fieldName: string): string | undefined => {
    const errors = fieldErrors.get(fieldName);
    return errors && errors.length > 0 ? errors[0].message : undefined;
  };

  const hasFieldError = (fieldName: string): boolean => {
    return fieldErrors.has(fieldName) && fieldErrors.get(fieldName)!.length > 0;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">
              {invoice ? 'Edit' : 'Create'} {type === 'sales' ? 'Sales' : 'Purchase'} Invoice
            </Typography>
            
            <Box display="flex" gap={1} alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={autoCalculate}
                    onChange={(e) => setAutoCalculate(e.target.checked)}
                  />
                }
                label="Auto Calculate"
              />
              
              <Button
                variant="outlined"
                startIcon={validating ? <CircularProgress size={20} /> : <CalculateIcon />}
                onClick={handleValidate}
                disabled={validating}
              >
                Validate
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={onCancel}
              >
                Cancel
              </Button>
              
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving || (validation && !validation.isValid)}
              >
                Save
              </Button>
            </Box>
          </Box>

          {/* Validation Summary */}
          {validation && (
            <Box mb={2}>
              {!validation.isValid ? (
                <Alert severity="error">
                  <AlertTitle>Validation Failed</AlertTitle>
                  <ul>
                    {validation.errors.map((error, index) => (
                      <li key={index}>{error.message}</li>
                    ))}
                  </ul>
                </Alert>
              ) : (
                <Alert severity="success">
                  <AlertTitle>Validation Passed</AlertTitle>
                  Invoice data is valid and ready to save.
                </Alert>
              )}
              
              {validation.warnings.length > 0 && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  <AlertTitle>Warnings</AlertTitle>
                  <ul>
                    {validation.warnings.map((warning, index) => (
                      <li key={index}>{warning.message}</li>
                    ))}
                  </ul>
                </Alert>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Invoice Details */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Invoice Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Invoice Number"
                value={formData.invoiceNumber || ''}
                onChange={(e) => handleFieldChange('invoiceNumber', e.target.value)}
                error={hasFieldError('invoiceNumber')}
                helperText={getFieldError('invoiceNumber')}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Invoice Date"
                  value={formData.invoiceDate ? new Date(formData.invoiceDate) : null}
                  onChange={(date) => handleFieldChange('invoiceDate', date?.toISOString().split('T')[0])}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true,
                      error: hasFieldError('invoiceDate'),
                      helperText: getFieldError('invoiceDate'),
                      required: true
                    } 
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Due Date"
                  value={formData.dueDate ? new Date(formData.dueDate) : null}
                  onChange={(date) => handleFieldChange('dueDate', date?.toISOString().split('T')[0])}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={parties}
                getOptionLabel={(option) => `${option.name} ${option.gstin ? `(${option.gstin})` : ''}`}
                value={selectedParty}
                onChange={(_, value) => handlePartyChange(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={type === 'sales' ? 'Customer' : 'Supplier'}
                    error={hasFieldError(type === 'sales' ? 'customerId' : 'supplierId')}
                    helperText={getFieldError(type === 'sales' ? 'customerId' : 'supplierId')}
                    required
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Place of Supply"
                value={formData.placeOfSupply || ''}
                onChange={(e) => handleFieldChange('placeOfSupply', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Notes"
                value={formData.notes || ''}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Invoice Items */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Invoice Items ({formData.items?.length || 0})
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddItem}
            >
              Add Item
            </Button>
          </Box>
          
          {formData.items && formData.items.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>HSN</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell>UOM</TableCell>
                    <TableCell align="right">Rate</TableCell>
                    <TableCell align="right">Disc%</TableCell>
                    <TableCell align="right">GST%</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.items.map((item, index) => (
                    <TableRow key={item.id || index}>
                      <TableCell>
                        <Autocomplete
                          options={products}
                          getOptionLabel={(option) => `${option.name} (${option.code || option.id})`}
                          value={products.find(p => p.id === item.productId) || null}
                          onChange={(_, value) => handleItemChange(index, 'productId', value?.id || '')}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              size="small"
                              placeholder="Select product"
                              sx={{ minWidth: 200 }}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={item.hsnCode}
                          onChange={(e) => handleItemChange(index, 'hsnCode', e.target.value)}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={item.unitOfMeasurement}
                          onChange={(e) => handleItemChange(index, 'unitOfMeasurement', e.target.value)}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={item.discountPercent}
                          onChange={(e) => handleItemChange(index, 'discountPercent', parseFloat(e.target.value) || 0)}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={item.gstRate}
                          onChange={(e) => handleItemChange(index, 'gstRate', parseFloat(e.target.value) || 0)}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          ₹{item.totalAmount?.toLocaleString() || '0.00'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              No items added. Click "Add Item" to start adding products to the invoice.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Invoice Summary */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Invoice Summary
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Subtotal
                  </Typography>
                  <Typography variant="h6">
                    ₹{formData.subtotal?.toLocaleString() || '0.00'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Total Discount
                  </Typography>
                  <Typography variant="h6">
                    ₹{formData.totalDiscount?.toLocaleString() || '0.00'}
                  </Typography>
                </Grid>
                
                {formData.isInterState ? (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      IGST
                    </Typography>
                    <Typography variant="h6">
                      ₹{formData.totalIgst?.toLocaleString() || '0.00'}
                    </Typography>
                  </Grid>
                ) : (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        CGST
                      </Typography>
                      <Typography variant="h6">
                        ₹{formData.totalCgst?.toLocaleString() || '0.00'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        SGST
                      </Typography>
                      <Typography variant="h6">
                        ₹{formData.totalSgst?.toLocaleString() || '0.00'}
                      </Typography>
                    </Grid>
                  </>
                )}
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Round Off
                  </Typography>
                  <Typography variant="h6">
                    ₹{formData.roundOffAmount?.toLocaleString() || '0.00'}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box textAlign="right">
                <Typography variant="h4" color="primary" gutterBottom>
                  ₹{formData.grandTotal?.toLocaleString() || '0.00'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Grand Total
                </Typography>
                
                {formData.isInterState && (
                  <Chip
                    label="Inter-State Transaction"
                    color="info"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}