"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  Alert,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  LinearProgress,
  Snackbar,
  InputAdornment,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Receipt as ReceiptIcon,
  Inventory as InventoryIcon,
  Payment as PaymentIcon,
  Preview as PreviewIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ShoppingCart as CartIcon,
  LocalShipping as ShippingIcon,
  AttachMoney as MoneyIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  QrCodeScanner as ScanIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import SupplierService from '@/services/supplierService';
import EnhancedPurchaseInvoiceService from '@/services/enhancedPurchaseInvoiceService';
import { productService } from '@/services/productService';
import { Supplier } from '@/types/purchase_no_gst';
import { Product } from '@/types/inventory';
import { PurchaseInvoiceItem } from '@/types/purchase_no_gst';
import EnhancedInvoiceItemsManager from '@/components/invoices/EnhancedInvoiceItemsManager';

interface FormData {
  supplierInvoiceNumber: string;
  supplierId?: string;
  supplierName: string;
  supplierAddress?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  purchaseDate: Date;
  dueDate?: Date;
  notes?: string;
  paidAmount: number;
  paymentMethod?: string;
  shippingCharges: number;
  otherCharges: number;
  roundOff: boolean;
  updateStock: boolean;
  priority: 'low' | 'medium' | 'high';
  expectedDeliveryDate?: Date;
  purchaseOrderNumber?: string;
  terms?: string;
}

interface ValidationErrors {
  [key: string]: string;
}

const steps = [
  {
    label: 'Supplier Information',
    description: 'Select or add supplier details',
    icon: <PersonIcon />
  },
  {
    label: 'Invoice Details',
    description: 'Set invoice dates and reference numbers',
    icon: <ReceiptIcon />
  },
  {
    label: 'Add Items',
    description: 'Add products and quantities',
    icon: <InventoryIcon />
  },
  {
    label: 'Payment & Review',
    description: 'Set payment details and review',
    icon: <PaymentIcon />
  }
];

export default function EnhancedNewPurchaseInvoice() {
  const router = useRouter();
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<PurchaseInvoiceItem[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  
  // Dialog states
  const [supplierDialog, setSupplierDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [supplierDetailsExpanded, setSupplierDetailsExpanded] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<FormData>({
    supplierInvoiceNumber: '',
    supplierName: '',
    supplierAddress: '',
    supplierPhone: '',
    supplierEmail: '',
    purchaseDate: new Date(),
    dueDate: undefined,
    notes: '',
    paidAmount: 0,
    paymentMethod: '',
    shippingCharges: 0,
    otherCharges: 0,
    roundOff: true,
    updateStock: true,
    priority: 'medium',
    expectedDeliveryDate: undefined,
    purchaseOrderNumber: '',
    terms: ''
  });

  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    name: '',
    address: '',
    phone: '',
    email: '',
    gstin: '',
    contactPerson: ''
  });

  // Calculate totals using enhanced service
  const totals = useMemo(() => {
    const enhancedTotals = EnhancedPurchaseInvoiceService.calculateInvoiceTotals(
      items,
      formData.shippingCharges,
      formData.otherCharges,
      formData.roundOff
    );
    
    const balanceAmount = enhancedTotals.finalAmount - formData.paidAmount;

    return {
      ...enhancedTotals,
      balanceAmount,
      itemCount: items.length
    };
  }, [items, formData.shippingCharges, formData.otherCharges, formData.roundOff, formData.paidAmount]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [productData, supplierData, lowStockData] = await Promise.all([
        productService.getProducts({ status: 'active' }),
        SupplierService.getActiveSuppliers(),
        productService.getLowStockProducts(20)
      ]);
      
      setProducts(productData.products || []);
      setSuppliers(supplierData);
      setLowStockProducts(lowStockData);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  // Validation
  const validateStep = useCallback((step: number): boolean => {
    const errors: ValidationErrors = {};

    switch (step) {
      case 0: // Supplier Information
        if (!formData.supplierName.trim()) {
          errors.supplierName = 'Supplier name is required';
        }
        if (!formData.supplierInvoiceNumber.trim()) {
          errors.supplierInvoiceNumber = 'Supplier invoice number is required';
        }
        break;

      case 1: // Invoice Details
        if (!formData.purchaseDate) {
          errors.purchaseDate = 'Purchase date is required';
        }
        break;

      case 2: // Items
        if (items.length === 0) {
          errors.items = 'At least one item is required';
        }
        break;

      case 3: // Payment & Review
        if (formData.paidAmount < 0) {
          errors.paidAmount = 'Paid amount cannot be negative';
        }
        if (formData.paidAmount > totals.finalAmount) {
          errors.paidAmount = 'Paid amount cannot exceed total amount';
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, items, totals.finalAmount]);

  // Handle form changes
  const handleFormChange = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [validationErrors]);

  // Handle supplier selection
  const handleSupplierSelect = useCallback((supplier: Supplier | null) => {
    if (supplier) {
      setFormData(prev => ({
        ...prev,
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierAddress: supplier.address || '',
        supplierPhone: supplier.phone || '',
        supplierEmail: supplier.email || ''
      }));
    }
  }, []);

  // Create new supplier
  const createNewSupplier = async () => {
    try {
      if (!newSupplier.name || !newSupplier.phone) {
        setError('Please fill in supplier name and phone number');
        return;
      }

      setLoading(true);
      const supplierId = await SupplierService.createSupplier({
        name: newSupplier.name,
        phone: newSupplier.phone || '',
        address: newSupplier.address,
        email: newSupplier.email,
        gstin: newSupplier.gstin,
        contactPerson: newSupplier.contactPerson,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      const newSupplierData: Supplier = {
        id: supplierId,
        name: newSupplier.name,
        phone: newSupplier.phone || '',
        address: newSupplier.address,
        email: newSupplier.email,
        gstin: newSupplier.gstin,
        contactPerson: newSupplier.contactPerson,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setSuppliers(prev => [...prev, newSupplierData]);
      handleSupplierSelect(newSupplierData);
      setSupplierDialog(false);
      setNewSupplier({
        name: '',
        address: '',
        phone: '',
        email: '',
        gstin: '',
        contactPerson: ''
      });
      setSuccess('Supplier created successfully');
    } catch (err) {
      console.error('Error creating supplier:', err);
      setError('Failed to create supplier');
    } finally {
      setLoading(false);
    }
  };

  // Navigation
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleStepClick = (step: number) => {
    if (step < activeStep || validateStep(activeStep)) {
      setActiveStep(step);
    }
  };

  // Submit invoice using enhanced service
  const handleSubmit = async () => {
    try {
      if (!validateStep(3)) return;

      setSaving(true);
      setError(null);

      const invoiceData = {
        invoiceNumber: EnhancedPurchaseInvoiceService.generateInvoiceNumber(),
        supplierInvoiceNumber: formData.supplierInvoiceNumber,
        supplierId: formData.supplierId,
        supplierName: formData.supplierName,
        supplierAddress: formData.supplierAddress,
        supplierPhone: formData.supplierPhone,
        supplierEmail: formData.supplierEmail,
        purchaseDate: formData.purchaseDate.toISOString().split('T')[0],
        dueDate: formData.dueDate?.toISOString().split('T')[0],
        expectedDeliveryDate: formData.expectedDeliveryDate?.toISOString().split('T')[0],
        purchaseOrderNumber: formData.purchaseOrderNumber,
        items: items,
        subtotal: totals.subtotal,
        totalDiscountAmount: totals.totalDiscountAmount,
        shippingCharges: formData.shippingCharges,
        otherCharges: formData.otherCharges,
        totalAmount: totals.totalAmount,
        roundOffAmount: totals.roundOffAmount,
        finalAmount: totals.finalAmount,
        paymentStatus: formData.paidAmount >= totals.finalAmount ? 'paid' : 
                      formData.paidAmount > 0 ? 'partial' : 'pending',
        paidAmount: formData.paidAmount,
        balanceAmount: totals.balanceAmount,
        paymentMethod: formData.paymentMethod,
        priority: formData.priority,
        notes: formData.notes,
        terms: formData.terms
      };

      const invoiceId = await EnhancedPurchaseInvoiceService.createPurchaseInvoice(invoiceData, formData.updateStock);
      
      setSuccess('Purchase invoice created successfully!');
      setTimeout(() => {
        router.push(`/inventory/purchase-invoices/${invoiceId}`);
      }, 1500);
    } catch (err) {
      console.error('Error creating purchase invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to create purchase invoice');
    } finally {
      setSaving(false);
    }
  };

  // Render step content
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon />
                      <Typography variant="h6">Supplier Information</Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => setSupplierDialog(true)}
                        sx={{ ml: 'auto' }}
                      >
                        New Supplier
                      </Button>
                    </Box>
                  }
                />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Autocomplete
                        options={suppliers}
                        getOptionLabel={(option) => option.name}
                        value={suppliers.find(s => s.id === formData.supplierId) || null}
                        onChange={(_, value) => handleSupplierSelect(value)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Select Supplier *"
                            placeholder="Search suppliers..."
                            error={!!validationErrors.supplierName}
                            helperText={validationErrors.supplierName}
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <InputAdornment position="start">
                                  <SearchIcon />
                                </InputAdornment>
                              )
                            }}
                          />
                        )}
                        renderOption={(props, option) => {
                          const { key, ...otherProps } = props;
                          return (
                            <Box component="li" key={key} {...otherProps}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                <Typography variant="body1">{option.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {option.phone} • {option.email}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Supplier Invoice Number *"
                        value={formData.supplierInvoiceNumber}
                        onChange={(e) => handleFormChange('supplierInvoiceNumber', e.target.value)}
                        error={!!validationErrors.supplierInvoiceNumber}
                        helperText={validationErrors.supplierInvoiceNumber}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <ReceiptIcon />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Purchase Order Number"
                        value={formData.purchaseOrderNumber}
                        onChange={(e) => handleFormChange('purchaseOrderNumber', e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CartIcon />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>

                    {/* Expandable supplier details */}
                    <Grid item xs={12}>
                      <Button
                        onClick={() => setSupplierDetailsExpanded(!supplierDetailsExpanded)}
                        startIcon={supplierDetailsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        sx={{ mb: 1 }}
                      >
                        Supplier Details
                      </Button>
                      <Collapse in={supplierDetailsExpanded}>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              multiline
                              rows={3}
                              label="Address"
                              value={formData.supplierAddress}
                              onChange={(e) => handleFormChange('supplierAddress', e.target.value)}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <LocationIcon />
                                  </InputAdornment>
                                )
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Phone"
                              value={formData.supplierPhone}
                              onChange={(e) => handleFormChange('supplierPhone', e.target.value)}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <PhoneIcon />
                                  </InputAdornment>
                                )
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Email"
                              type="email"
                              value={formData.supplierEmail}
                              onChange={(e) => handleFormChange('supplierEmail', e.target.value)}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <EmailIcon />
                                  </InputAdornment>
                                )
                              }}
                            />
                          </Grid>
                        </Grid>
                      </Collapse>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon />
                      <Typography variant="h6">Invoice Details</Typography>
                    </Box>
                  }
                />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Purchase Date *"
                          value={formData.purchaseDate}
                          onChange={(date) => handleFormChange('purchaseDate', date)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: !!validationErrors.purchaseDate,
                              helperText: validationErrors.purchaseDate
                            }
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Due Date"
                          value={formData.dueDate}
                          onChange={(date) => handleFormChange('dueDate', date)}
                          slotProps={{
                            textField: {
                              fullWidth: true
                            }
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Expected Delivery Date"
                          value={formData.expectedDeliveryDate}
                          onChange={(date) => handleFormChange('expectedDeliveryDate', date)}
                          slotProps={{
                            textField: {
                              fullWidth: true
                            }
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Priority</InputLabel>
                        <Select
                          value={formData.priority}
                          onChange={(e) => handleFormChange('priority', e.target.value)}
                          label="Priority"
                        >
                          <MenuItem value="low">
                            <Chip label="Low" color="success" size="small" sx={{ mr: 1 }} />
                            Low Priority
                          </MenuItem>
                          <MenuItem value="medium">
                            <Chip label="Medium" color="warning" size="small" sx={{ mr: 1 }} />
                            Medium Priority
                          </MenuItem>
                          <MenuItem value="high">
                            <Chip label="High" color="error" size="small" sx={{ mr: 1 }} />
                            High Priority
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Notes"
                        value={formData.notes}
                        onChange={(e) => handleFormChange('notes', e.target.value)}
                        placeholder="Add any additional notes or comments..."
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Terms & Conditions"
                        value={formData.terms}
                        onChange={(e) => handleFormChange('terms', e.target.value)}
                        placeholder="Payment terms, delivery conditions, etc..."
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <InventoryIcon />
                      <Typography variant="h6">Stock Settings</Typography>
                    </Box>
                  }
                />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.updateStock}
                            onChange={(e) => handleFormChange('updateStock', e.target.checked)}
                          />
                        }
                        label="Update Stock Automatically"
                      />
                      <Typography variant="caption" color="text.secondary" display="block">
                        When enabled, product quantities will be automatically increased when the invoice is saved.
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.roundOff}
                            onChange={(e) => handleFormChange('roundOff', e.target.checked)}
                          />
                        }
                        label="Round Off Amount"
                      />
                      <Typography variant="caption" color="text.secondary" display="block">
                        Round the final amount to the nearest rupee.
                      </Typography>
                    </Grid>

                    {lowStockProducts.length > 0 && (
                      <Grid item xs={12}>
                        <Alert severity="warning" sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Low Stock Alert ({lowStockProducts.length} products)
                          </Typography>
                          <List dense>
                            {lowStockProducts.slice(0, 3).map((product) => (
                              <ListItem key={product.id} sx={{ py: 0 }}>
                                <ListItemIcon>
                                  <WarningIcon color="warning" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={product.name}
                                  secondary={`Stock: ${product.quantity} ${product.unitOfMeasurement}`}
                                />
                              </ListItem>
                            ))}
                            {lowStockProducts.length > 3 && (
                              <Typography variant="caption" color="text.secondary">
                                ...and {lowStockProducts.length - 3} more
                              </Typography>
                            )}
                          </List>
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Box>
            {validationErrors.items && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {validationErrors.items}
              </Alert>
            )}
            <EnhancedInvoiceItemsManager
              items={items}
              onItemsChange={setItems}
              products={products}
              loading={loading}
              readOnly={false}
            />
          </Box>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PaymentIcon />
                      <Typography variant="h6">Payment Details</Typography>
                    </Box>
                  }
                />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Shipping Charges"
                        value={formData.shippingCharges}
                        onChange={(e) => handleFormChange('shippingCharges', Number(e.target.value))}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <ShippingIcon />
                            </InputAdornment>
                          ),
                          inputProps: { min: 0, step: 0.01 }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Other Charges"
                        value={formData.otherCharges}
                        onChange={(e) => handleFormChange('otherCharges', Number(e.target.value))}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <MoneyIcon />
                            </InputAdornment>
                          ),
                          inputProps: { min: 0, step: 0.01 }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Paid Amount"
                        value={formData.paidAmount}
                        onChange={(e) => handleFormChange('paidAmount', Number(e.target.value))}
                        error={!!validationErrors.paidAmount}
                        helperText={validationErrors.paidAmount}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">₹</InputAdornment>
                          ),
                          inputProps: { min: 0, step: 0.01 }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Payment Method</InputLabel>
                        <Select
                          value={formData.paymentMethod}
                          onChange={(e) => handleFormChange('paymentMethod', e.target.value)}
                          label="Payment Method"
                        >
                          <MenuItem value="cash">Cash</MenuItem>
                          <MenuItem value="bank">Bank Transfer</MenuItem>
                          <MenuItem value="cheque">Cheque</MenuItem>
                          <MenuItem value="upi">UPI</MenuItem>
                          <MenuItem value="card">Card</MenuItem>
                          <MenuItem value="credit">Credit</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ReceiptIcon />
                      <Typography variant="h6">Invoice Summary</Typography>
                    </Box>
                  }
                  sx={{ pb: 1.5 }}
                />
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CartIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">Items:</Typography>
                      </Box>
                      <Box>
                        <Chip label={`${totals.itemCount}`} size="small" variant="outlined" />
                        <Typography variant="body2" sx={{ ml: 1, display: 'inline' }}>₹{totals.subtotal.toFixed(2)}</Typography>
                      </Box>
                    </Box>
                    
                    {totals.totalDiscountAmount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="error">Discount:</Typography>
                        <Typography variant="body2" color="error">-₹{totals.totalDiscountAmount.toFixed(2)}</Typography>
                      </Box>
                    )}
                    
                    {formData.shippingCharges > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ShippingIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">Shipping:</Typography>
                        </Box>
                        <Typography variant="body2">₹{formData.shippingCharges.toFixed(2)}</Typography>
                      </Box>
                    )}
                    
                    {formData.otherCharges > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Other:</Typography>
                        <Typography variant="body2">₹{formData.otherCharges.toFixed(2)}</Typography>
                      </Box>
                    )}
                    
                    {formData.roundOff && totals.roundOffAmount !== 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Round Off:</Typography>
                        <Typography variant="body2">
                          {totals.roundOffAmount > 0 ? '+' : ''}₹{totals.roundOffAmount.toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Box sx={{ p: 1.5, backgroundColor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1, mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Total Amount:</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                          ₹{totals.finalAmount.toFixed(2)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Paid:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                          ₹{formData.paidAmount.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ 
                      p: 1.5, 
                      backgroundColor: totals.balanceAmount > 0 ? alpha(theme.palette.warning.main, 0.08) : alpha(theme.palette.success.main, 0.08), 
                      borderRadius: 1,
                      border: `1px solid ${totals.balanceAmount > 0 ? alpha(theme.palette.warning.main, 0.2) : alpha(theme.palette.success.main, 0.2)}`
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Balance Due:</Typography>
                      <Typography 
                        variant="h5" 
                        sx={{ fontWeight: 'bold', color: totals.balanceAmount > 0 ? theme.palette.warning.main : theme.palette.success.main }}
                      >
                        ₹{totals.balanceAmount.toFixed(2)}
                      </Typography>
                    </Box>

                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Chip
                        label={
                          formData.paidAmount >= totals.finalAmount ? 'Paid' :
                          formData.paidAmount > 0 ? 'Partial' : 'Pending'
                        }
                        color={
                          formData.paidAmount >= totals.finalAmount ? 'success' :
                          formData.paidAmount > 0 ? 'warning' : 'error'
                        }
                        icon={
                          formData.paidAmount >= totals.finalAmount ? <CheckIcon /> :
                          formData.paidAmount > 0 ? <InfoIcon /> : <WarningIcon />
                        }
                        sx={{ flex: 1 }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Create Purchase Invoice"
        pageType="Add a new purchase invoice with automatic stock management"
        enableVisualEffects={true}
        enableParticles={false}
        customQuickActions={[
          { icon: <PreviewIcon />, label: 'Preview', onClick: () => setPreviewDialog(true), disabled: items.length === 0 },
          { icon: <SaveIcon />, label: 'Save Draft', onClick: () => {}, disabled: loading },
          { icon: <CancelIcon />, label: 'Cancel', onClick: () => router.back() },
        ]}
      >
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>

        {/* Progress */}
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Status Summary */}
        <Paper elevation={0} sx={{ 
          p: 2.5, 
          mb: 3, 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
        }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ p: 1, backgroundColor: alpha(theme.palette.primary.main, 0.1), borderRadius: 1 }}>
                  <BusinessIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Supplier</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {formData.supplierName || 'Not Selected'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ p: 1, backgroundColor: alpha(theme.palette.success.main, 0.1), borderRadius: 1 }}>
                  <CartIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Items</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{items.length} items</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ p: 1, backgroundColor: alpha(theme.palette.info.main, 0.1), borderRadius: 1 }}>
                  <MoneyIcon sx={{ color: theme.palette.info.main, fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Total Amount</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>₹{totals.finalAmount.toFixed(2)}</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ p: 1, backgroundColor: totals.balanceAmount > 0 ? alpha(theme.palette.warning.main, 0.1) : alpha(theme.palette.success.main, 0.1), borderRadius: 1 }}>
                  <PaymentIcon sx={{ color: totals.balanceAmount > 0 ? theme.palette.warning.main : theme.palette.success.main, fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Balance Due</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: totals.balanceAmount > 0 ? theme.palette.warning.main : theme.palette.success.main }}>
                    ₹{totals.balanceAmount.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Stepper */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Stepper activeStep={activeStep} orientation="horizontal">
            {steps.map((step, index) => (
              <Step key={step.label} completed={index < activeStep}>
                <StepLabel
                  onClick={() => handleStepClick(index)}
                  sx={{ cursor: index <= activeStep ? 'pointer' : 'default' }}
                  icon={
                    <Badge
                      badgeContent={
                        index === 0 && !formData.supplierName ? '!' :
                        index === 2 && items.length === 0 ? '!' : null
                      }
                      color="error"
                    >
                      {step.icon}
                    </Badge>
                  }
                >
                  <Box>
                    <Typography variant="subtitle2">{step.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {step.description}
                    </Typography>
                  </Box>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Step Content */}
        <Box sx={{ mb: 3 }}>
          {renderStepContent(activeStep)}
        </Box>

        {/* Navigation */}
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<CancelIcon />}
            >
              Back
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
              {activeStep < steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<CheckIcon />}
                >
                  Next
                </Button>
              ) : (
                <LoadingButton
                  variant="contained"
                  onClick={handleSubmit}
                  loading={saving}
                  startIcon={<SaveIcon />}
                  size="large"
                >
                  Create Invoice
                </LoadingButton>
              )}
            </Box>
          </Box>
        </Paper>

        {/* New Supplier Dialog */}
        <Dialog open={supplierDialog} onClose={() => setSupplierDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
            <BusinessIcon sx={{ color: theme.palette.primary.main }} />
            <Typography variant="h6">Create New Supplier</Typography>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Supplier Name *"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone *"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="GSTIN"
                  value={newSupplier.gstin}
                  onChange={(e) => setNewSupplier({ ...newSupplier, gstin: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Person"
                  value={newSupplier.contactPerson}
                  onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Address"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSupplierDialog(false)}>Cancel</Button>
            <LoadingButton
              variant="contained"
              onClick={createNewSupplier}
              loading={loading}
            >
              Create Supplier
            </LoadingButton>
          </DialogActions>
        </Dialog>

        {/* Success Snackbar */}
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
        >
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        </Snackbar>
        </Container>
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}