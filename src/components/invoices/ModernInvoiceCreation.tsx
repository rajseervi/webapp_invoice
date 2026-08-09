"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Fab,
  Tooltip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  Send as SendIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  Calculate as CalculateIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  Payment as PaymentIcon,
  Notes as NotesIcon,
  Settings as SettingsIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import EnhancedInvoiceService, { EnhancedInvoice, EnhancedInvoiceItem } from '@/services/enhancedInvoiceService';
import { productService } from '@/services/productService';
import { partyService } from '@/services/partyService';
import EnhancedValidationService from '@/services/enhancedValidationService';

interface ModernInvoiceCreationProps {
  type?: 'sales' | 'purchase';
  onSave?: (invoice: EnhancedInvoice) => void;
  onCancel?: () => void;
  duplicateId?: string;
  initialData?: Partial<EnhancedInvoice>;
}

const steps = [
  {
    label: 'Basic Information',
    description: 'Invoice details and party selection',
    icon: <BusinessIcon />
  },
  {
    label: 'Add Items',
    description: 'Select products and configure quantities',
    icon: <InventoryIcon />
  },
  {
    label: 'Review & Calculate',
    description: 'Review totals and apply discounts',
    icon: <CalculateIcon />
  },
  {
    label: 'Finalize',
    description: 'Add notes and save invoice',
    icon: <CheckCircleIcon />
  }
];

export default function ModernInvoiceCreation({
  type = 'sales',
  onSave,
  onCancel,
  duplicateId,
  initialData
}: ModernInvoiceCreationProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);

  // Form data
  const [formData, setFormData] = useState<Partial<EnhancedInvoice>>({
    type,
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    customerId: '',
    customerName: '',
    supplierId: '',
    supplierName: '',
    items: [],
    subtotal: 0,
    totalDiscount: 0,
    roundOffAmount: 0,
    grandTotal: 0,
    paymentStatus: 'pending',
    paidAmount: 0,
    balanceAmount: 0,
    status: 'draft',
    notes: '',
    paymentTerms: '',
    stockUpdated: false,
    validationStatus: 'pending',
    syncStatus: 'pending',
    createdBy: 'current-user' // This should come from auth context
  });

  // Autocomplete options
  const [parties, setParties] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedParty, setSelectedParty] = useState<any>(null);

  // UI states
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.items && formData.items.length > 0) {
      calculateTotals();
    }
  }, [formData.items]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load parties and products
      const [partiesData, productsResult] = await Promise.all([
        partyService.getAllParties(),
        productService.getProducts()
      ]);

      setParties(partiesData);
      setProducts(productsResult.products);

      // Generate invoice number
      const invoiceNumber = EnhancedInvoiceService.generateInvoiceNumber(type);
      setFormData(prev => ({ ...prev, invoiceNumber }));

      // Load duplicate data if provided
      if (duplicateId) {
        const duplicateInvoice = await EnhancedInvoiceService.getInvoiceById(duplicateId);
        if (duplicateInvoice) {
          setFormData(prev => ({
            ...prev,
            ...duplicateInvoice,
            id: undefined,
            invoiceNumber,
            invoiceDate: new Date().toISOString().split('T')[0],
            status: 'draft',
            paymentStatus: 'pending',
            paidAmount: 0,
            balanceAmount: duplicateInvoice.grandTotal
          }));
        }
      }

      // Apply initial data if provided
      if (initialData) {
        setFormData(prev => ({ ...prev, ...initialData }));
      }

    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = useCallback(() => {
    if (!formData.items || formData.items.length === 0) return;

    const totals = EnhancedInvoiceService.calculateInvoiceTotals(formData.items as EnhancedInvoiceItem[]);
    
    setFormData(prev => ({
      ...prev,
      ...totals,
      balanceAmount: totals.grandTotal - (prev.paidAmount || 0)
    }));
  }, [formData.items]);

  const handlePartySelect = (party: any) => {
    setSelectedParty(party);
    
    if (type === 'sales') {
      setFormData(prev => ({
        ...prev,
        customerId: party.id,
        customerName: party.name,
        customerGstin: party.gstin || '',
        isInterState: party.stateCode !== '27' // Assuming company state is 27
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        supplierId: party.id,
        supplierName: party.name,
        supplierGstin: party.gstin || '',
        isInterState: party.stateCode !== '27'
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

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...(formData.items || [])];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Recalculate item totals when relevant fields change
    if (['quantity', 'unitPrice', 'discountPercent', 'gstRate'].includes(field)) {
      const item = updatedItems[index];
      const calculatedItem = EnhancedInvoiceService.calculateItemGst(
        item as any,
        formData.isInterState || false
      );
      updatedItems[index] = calculatedItem;
    }

    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleProductSelect = (index: number, product: any) => {
    if (product) {
      handleItemChange(index, 'productId', product.id);
      handleItemChange(index, 'productName', product.name);
      handleItemChange(index, 'hsnCode', product.hsnCode || '');
      handleItemChange(index, 'unitPrice', product.sellingPrice || 0);
      handleItemChange(index, 'gstRate', product.gstRate || 18);
      handleItemChange(index, 'unitOfMeasurement', product.unit || 'PCS');
      handleItemChange(index, 'isService', product.type === 'service');
    }
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...(formData.items || [])];
    updatedItems.splice(index, 1);
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      const validationData = {
        invoiceNumber: formData.invoiceNumber!,
        date: formData.invoiceDate!,
        customerId: formData.customerId,
        supplierId: formData.supplierId,
        items: (formData.items || []).map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          gstRate: item.gstRate,
          discountPercent: item.discountPercent
        })),
        totalAmount: formData.grandTotal || 0,
        gstAmount: formData.totalTaxAmount || 0,
        subtotal: formData.subtotal || 0,
        type: formData.type!
      };

      const result = await EnhancedValidationService.validateInvoice(validationData);
      setValidationResult(result);
      
      if (result.isValid) {
        setActiveStep(3); // Move to finalize step
      }
    } catch (err) {
      console.error('Error validating invoice:', err);
      setError('Failed to validate invoice');
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async (status: 'draft' | 'confirmed' = 'draft') => {
    setSaving(true);
    try {
      const invoiceData = {
        ...formData,
        status,
        validationStatus: validationResult?.isValid ? 'validated' : 'pending'
      } as Omit<EnhancedInvoice, 'id' | 'createdAt' | 'updatedAt' | 'validationStatus' | 'syncStatus'>;

      const result = await EnhancedInvoiceService.createInvoice(invoiceData, true);
      
      if (result.success && result.invoiceId) {
        const savedInvoice = await EnhancedInvoiceService.getInvoiceById(result.invoiceId);
        if (savedInvoice && onSave) {
          onSave(savedInvoice);
        }
      } else {
        setError('Failed to save invoice');
      }
    } catch (err) {
      console.error('Error saving invoice:', err);
      setError('Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <ReceiptIcon sx={{ mr: 1 }} />
                    Invoice Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Invoice Number"
                        value={formData.invoiceNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Invoice Date"
                          value={formData.invoiceDate ? new Date(formData.invoiceDate) : null}
                          onChange={(date) => setFormData(prev => ({ 
                            ...prev, 
                            invoiceDate: date?.toISOString().split('T')[0] || ''
                          }))}
                          slotProps={{ textField: { fullWidth: true } }}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Due Date"
                          value={formData.dueDate ? new Date(formData.dueDate) : null}
                          onChange={(date) => setFormData(prev => ({ 
                            ...prev, 
                            dueDate: date?.toISOString().split('T')[0] || ''
                          }))}
                          slotProps={{ textField: { fullWidth: true } }}
                        />
                      </LocalizationProvider>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ mr: 1 }} />
                    {type === 'sales' ? 'Customer' : 'Supplier'} Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Autocomplete
                        options={parties}
                        getOptionLabel={(option) => `${option.name} ${option.gstin ? `(${option.gstin})` : ''}`}
                        value={selectedParty}
                        onChange={(_, value) => handlePartySelect(value)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={`Select ${type === 'sales' ? 'Customer' : 'Supplier'}`}
                            fullWidth
                          />
                        )}
                      />
                    </Grid>
                    {selectedParty && (
                      <>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="GSTIN"
                            value={type === 'sales' ? formData.customerGstin : formData.supplierGstin}
                            disabled
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Chip
                            label={formData.isInterState ? 'Inter-State Transaction' : 'Intra-State Transaction'}
                            color={formData.isInterState ? 'warning' : 'success'}
                            variant="outlined"
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <InventoryIcon sx={{ mr: 1 }} />
                  Invoice Items
                </Typography>
                <Button
                  onClick={handleAddItem}
                  startIcon={<AddIcon />}
                  variant="contained"
                  size="small"
                >
                  Add Item
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell>Product</TableCell>
                      <TableCell>HSN/SAC</TableCell>
                      <TableCell width={100}>Qty</TableCell>
                      <TableCell width={120}>Rate</TableCell>
                      <TableCell width={100}>Discount %</TableCell>
                      <TableCell width={100}>GST %</TableCell>
                      <TableCell width={120}>Total</TableCell>
                      <TableCell width={50}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(formData.items || []).map((item, index) => (
                      <TableRow key={item.id || index}>
                        <TableCell>
                          <Autocomplete
                            options={products}
                            getOptionLabel={(option) => option.name}
                            value={products.find(p => p.id === item.productId) || null}
                            onChange={(_, value) => handleProductSelect(index, value)}
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
                            placeholder="HSN/SAC"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.discountPercent}
                            onChange={(e) => handleItemChange(index, 'discountPercent', parseFloat(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.gstRate}
                            onChange={(e) => handleItemChange(index, 'gstRate', parseFloat(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            ₹{item.totalAmount?.toLocaleString() || '0'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveItem(index)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!formData.items || formData.items.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography color="text.secondary">
                            No items added. Click "Add Item" to get started.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalculateIcon sx={{ mr: 1 }} />
                    Invoice Summary
                  </Typography>
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell><strong>Subtotal</strong></TableCell>
                          <TableCell align="right">₹{formData.subtotal?.toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Total Discount</strong></TableCell>
                          <TableCell align="right">₹{formData.totalDiscount?.toLocaleString()}</TableCell>
                        </TableRow>
                        {!formData.isInterState ? (
                          <>
                            <TableRow>
                              <TableCell><strong>CGST</strong></TableCell>
                              <TableCell align="right">₹{formData.totalCgst?.toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell><strong>SGST</strong></TableCell>
                              <TableCell align="right">₹{formData.totalSgst?.toLocaleString()}</TableCell>
                            </TableRow>
                          </>
                        ) : (
                          <TableRow>
                            <TableCell><strong>IGST</strong></TableCell>
                            <TableCell align="right">₹{formData.totalIgst?.toLocaleString()}</TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell><strong>Round Off</strong></TableCell>
                          <TableCell align="right">₹{formData.roundOffAmount?.toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow sx={{ bgcolor: 'primary.light' }}>
                          <TableCell><strong>Grand Total</strong></TableCell>
                          <TableCell align="right">
                            <Typography variant="h6" fontWeight="bold">
                              ₹{formData.grandTotal?.toLocaleString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ mt: 3 }}>
                    <Button
                      onClick={handleValidate}
                      disabled={validating || !formData.items?.length}
                      startIcon={validating ? <CircularProgress size={16} /> : <CheckCircleIcon />}
                      variant="contained"
                      fullWidth
                    >
                      {validating ? 'Validating...' : 'Validate Invoice'}
                    </Button>
                  </Box>

                  {validationResult && (
                    <Box sx={{ mt: 2 }}>
                      {validationResult.isValid ? (
                        <Alert severity="success">
                          Invoice validation passed successfully!
                        </Alert>
                      ) : (
                        <Alert severity="error">
                          <Typography variant="body2" gutterBottom>
                            Validation failed:
                          </Typography>
                          <ul style={{ margin: 0, paddingLeft: 20 }}>
                            {validationResult.errors.map((error: any, index: number) => (
                              <li key={index}>
                                <Typography variant="caption">{error.message}</Typography>
                              </li>
                            ))}
                          </ul>
                        </Alert>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <PaymentIcon sx={{ mr: 1 }} />
                    Payment Details
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Payment Status</InputLabel>
                        <Select
                          value={formData.paymentStatus}
                          label="Payment Status"
                          onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value as any }))}
                        >
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="partial">Partial</MenuItem>
                          <MenuItem value="paid">Paid</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Paid Amount"
                        type="number"
                        value={formData.paidAmount}
                        onChange={(e) => {
                          const paidAmount = parseFloat(e.target.value) || 0;
                          setFormData(prev => ({ 
                            ...prev, 
                            paidAmount,
                            balanceAmount: (prev.grandTotal || 0) - paidAmount
                          }));
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Balance Amount"
                        value={formData.balanceAmount}
                        disabled
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <NotesIcon sx={{ mr: 1 }} />
                    Additional Information
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Notes"
                        multiline
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Add any additional notes or comments..."
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Payment Terms"
                        value={formData.paymentTerms}
                        onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                        placeholder="e.g., Net 30 days"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Place of Supply"
                        value={formData.placeOfSupply}
                        onChange={(e) => setFormData(prev => ({ ...prev, placeOfSupply: e.target.value }))}
                        placeholder="State/UT where goods/services are supplied"
                      />
                    </Grid>
                  </Grid>

                  <Accordion sx={{ mt: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                        <SettingsIcon sx={{ mr: 1 }} />
                        Advanced Options
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.reverseCharge}
                                onChange={(e) => setFormData(prev => ({ ...prev, reverseCharge: e.target.checked }))}
                              />
                            }
                            label="Reverse Charge Applicable"
                          />
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Final Actions
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Button
                      onClick={() => setPreviewOpen(true)}
                      startIcon={<PreviewIcon />}
                      variant="outlined"
                      fullWidth
                    >
                      Preview Invoice
                    </Button>
                    
                    <Button
                      onClick={() => handleSave('draft')}
                      disabled={saving}
                      startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                      variant="contained"
                      fullWidth
                    >
                      {saving ? 'Saving...' : 'Save as Draft'}
                    </Button>
                    
                    <Button
                      onClick={() => handleSave('confirmed')}
                      disabled={saving || !validationResult?.isValid}
                      startIcon={<SendIcon />}
                      variant="contained"
                      color="success"
                      fullWidth
                    >
                      Save & Confirm
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <AutoAwesomeIcon sx={{ mr: 1, color: 'primary.main' }} />
          Create {type === 'sales' ? 'Sales' : 'Purchase'} Invoice
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Follow the steps below to create a comprehensive invoice with automatic calculations and validation.
        </Typography>
      </Box>

      {/* Progress Indicator */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <LinearProgress 
            variant="determinate" 
            value={(activeStep + 1) / steps.length * 100} 
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary" align="center">
            Step {activeStep + 1} of {steps.length}: {steps[activeStep].label}
          </Typography>
        </CardContent>
      </Card>

      {/* Stepper */}
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel
              icon={step.icon}
              optional={
                <Typography variant="caption">{step.description}</Typography>
              }
            >
              {step.label}
            </StepLabel>
            <StepContent>
              {renderStepContent(index)}
              
              <Box sx={{ mt: 3 }}>
                <Stack direction="row" spacing={2}>
                  <Button
                    disabled={index === 0}
                    onClick={() => setActiveStep(index - 1)}
                  >
                    Back
                  </Button>
                  
                  {index < steps.length - 1 && (
                    <Button
                      variant="contained"
                      onClick={() => setActiveStep(index + 1)}
                      disabled={
                        (index === 0 && !selectedParty) ||
                        (index === 1 && (!formData.items || formData.items.length === 0))
                      }
                    >
                      Continue
                    </Button>
                  )}
                </Stack>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Floating Action Buttons */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
        <Stack spacing={1}>
          {onCancel && (
            <Fab
              color="default"
              onClick={onCancel}
              size="small"
            >
              <DeleteIcon />
            </Fab>
          )}
          
          <Tooltip title="Quick Save">
            <Fab
              color="primary"
              onClick={() => handleSave('draft')}
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} /> : <SaveIcon />}
            </Fab>
          </Tooltip>
        </Stack>
      </Box>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Invoice Preview</DialogTitle>
        <DialogContent>
          {/* Add invoice preview component here */}
          <Typography>Invoice preview will be displayed here</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button onClick={() => handleSave('confirmed')} variant="contained">
            Confirm & Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}