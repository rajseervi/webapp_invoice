"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Autocomplete,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  CircularProgress,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Print as PrintIcon,
  Category as CategoryIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import CentralizedInvoiceService from '@/services/centralizedInvoiceService';
import { db } from '@/firebase/config';
import { Party } from '@/types/party';
import { Product, Category } from '@/types/inventory';
import { Invoice, InvoiceItem } from '@/types/invoice';
import { GstCalculator, InvoiceGstCalculator } from '@/services/gstService';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { GstSettingsService } from '@/services/gstService';
import { cleanInvoiceData } from '@/utils/firestoreUtils';
import { CategoryDiscountConfiguration } from '@/components/invoices/CategoryDiscountConfiguration';
import { EnhancedProductSelector } from '@/components/invoices/EnhancedProductSelector';

interface GstInvoiceItem extends InvoiceItem {
  gstRate: number;
  calculationMode: 'inclusive' | 'exclusive';
  categoryDiscount?: number;
  partyDiscount?: number;
  totalDiscount?: number;
  originalPrice?: number;
}

interface CategoryDiscountRule {
  categoryId: string;
  categoryName: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  minQuantity?: number;
  maxDiscount?: number;
  isActive: boolean;
}

interface GstInvoiceWithGstPartiesOnlyProps {
  onSuccess?: (invoiceId?: string) => void;
}

const GST_RATES = [0, 5, 12, 18, 28];
const steps = ['Party Selection', 'Discount Configuration', 'Invoice Items', 'Review & Save'];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function GstInvoiceWithGstPartiesOnly({ onSuccess }: GstInvoiceWithGstPartiesOnlyProps) {
  const router = useRouter();
  const { userId } = useCurrentUser();
  
  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [configTabValue, setConfigTabValue] = useState(0);
  const [parties, setParties] = useState<Party[]>([]);
  const [gstParties, setGstParties] = useState<Party[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [lineItems, setLineItems] = useState<GstInvoiceItem[]>([]);
  const [notes, setNotes] = useState('');
  const [transportCharges, setTransportCharges] = useState(0);
  const [roundOff, setRoundOff] = useState(0);
  const [loading, setLoading] = useState(false);
  const [gstLoading, setGstLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [defaultCalculationMode, setDefaultCalculationMode] = useState<'inclusive' | 'exclusive'>('exclusive');
  const [gstSettings, setGstSettings] = useState<any>(null);
  const [categoryDiscountRules, setCategoryDiscountRules] = useState<CategoryDiscountRule[]>([]);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  const handleNext = () => setActiveStep((prevActiveStep) => prevActiveStep + 1);
  const handleBack = () => setActiveStep((prevActiveStep) => prevActiveStep - 1);

  // Generate invoice number
  const generateInvoiceNumber = async () => {
    try {
      const invoicesRef = collection(db, 'invoices');
      const q = query(invoicesRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      let nextNumber = 1;
      if (!snapshot.empty) {
        const numbers = snapshot.docs
          .map(doc => doc.data().invoiceNumber)
          .filter(num => num && num.startsWith('GST-INV-'))
          .map(num => parseInt(num.replace('GST-INV-', '')))
          .filter(num => !isNaN(num));
        
        if (numbers.length > 0) {
          nextNumber = Math.max(...numbers) + 1;
        }
      }
      
      return `GST-INV-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      return `GST-INV-${Date.now()}`;
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;
      
      try {
        setGstLoading(true);
        
        // Load GST settings
        const settings = await GstSettingsService.getGstSettings();
        if (!settings || !settings.enableGst) {
          setError('GST is not enabled. Please configure GST settings first.');
          return;
        }
        setGstSettings(settings);
        
        // Load all parties
        const partiesQuery = query(
          collection(db, 'parties'),
          where('userId', '==', userId)
        );
        const partiesSnapshot = await getDocs(partiesQuery);
        const allParties = partiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Party[];
        
        setParties(allParties);
        
        // Filter parties that have GST numbers
        const partiesWithGst = allParties.filter(party => 
          party.gstin && 
          party.gstin.trim() !== '' && 
          party.isGstRegistered !== false
        );
        setGstParties(partiesWithGst);

        // Load products
        const productsQuery = query(
          collection(db, 'products')
        );
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(productsData);

        // Load categories
        const categoriesQuery = query(
          collection(db, 'categories'),
          where('userId', '==', userId)
        );
        const categoriesSnapshot = await getDocs(categoriesQuery);
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[];
        setCategories(categoriesData);

        console.log('Loaded products:', productsData.length);
        console.log('Loaded GST parties:', partiesWithGst.length);
        console.log('Loaded categories:', categoriesData.length);

        // Generate invoice number
        const newInvoiceNumber = await generateInvoiceNumber();
        setInvoiceNumber(newInvoiceNumber);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setGstLoading(false);
      }
    };

    loadData();
  }, [userId]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!selectedParty || !gstSettings || lineItems.length === 0) {
      return {
        subtotal: 0,
        totalTaxableAmount: 0,
        totalCgst: 0,
        totalSgst: 0,
        totalIgst: 0,
        totalTaxAmount: 0,
        grandTotal: 0,
        isInterState: false
      };
    }

    const partyStateCode = selectedParty.gstin ? 
      GstCalculator.extractStateCodeFromGstin(selectedParty.gstin) : 
      gstSettings.companyStateCode;
    
    const isInterState = GstCalculator.isInterState(gstSettings.companyStateCode, partyStateCode);
    
    // Calculate subtotal and prepare items for GST calculation
    let subtotal = 0;
    const itemsForGstCalculation = lineItems.map(item => {
      const baseAmount = item.price * item.quantity;
      const discountAmount = (baseAmount * item.discount) / 100;
      const taxableAmount = baseAmount - discountAmount;
      subtotal += baseAmount;
      
      return {
        taxableAmount,
        gstRate: item.gstRate
      };
    });

    // Use InvoiceGstCalculator to calculate GST
    const gstCalculation = InvoiceGstCalculator.calculateInvoiceGst(
      itemsForGstCalculation,
      gstSettings.companyStateCode,
      partyStateCode
    );

    const grandTotal = gstCalculation.totals.totalTaxableAmount + gstCalculation.totals.totalTaxAmount + transportCharges + roundOff;

    return {
      subtotal,
      totalTaxableAmount: gstCalculation.totals.totalTaxableAmount,
      totalCgst: gstCalculation.totals.totalCgst,
      totalSgst: gstCalculation.totals.totalSgst,
      totalIgst: gstCalculation.totals.totalIgst,
      totalTaxAmount: gstCalculation.totals.totalTaxAmount,
      grandTotal,
      isInterState: gstCalculation.totals.isInterState
    };
  }, [lineItems, selectedParty, gstSettings, transportCharges, roundOff]);

  // Add new line item
  const addLineItem = () => {
    const newItem: GstInvoiceItem = {
      name: '',
      price: 0,
      quantity: 1,
      discount: 0,
      discountType: 'none',
      finalPrice: 0,
      productId: '',
      category: '',
      gstRate: gstSettings?.defaultGstRate || 18,
      hsnCode: '',
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      taxableAmount: 0,
      totalTaxAmount: 0,
      calculationMode: defaultCalculationMode,
      categoryDiscount: 0,
      partyDiscount: 0,
      totalDiscount: 0,
      originalPrice: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  // Update line item
  const updateLineItem = (index: number, field: keyof GstInvoiceItem, value: any) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setLineItems(updatedItems);
  };

  // Remove line item
  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Select product for line item
  const selectProduct = (index: number, product: Product | null) => {
    if (!product) {
      updateLineItem(index, 'productId', '');
      updateLineItem(index, 'name', '');
      updateLineItem(index, 'hsnCode', '');
      updateLineItem(index, 'gstRate', gstSettings?.defaultGstRate || 18);
      return;
    }

    updateLineItem(index, 'productId', product.id || '');
    updateLineItem(index, 'name', product.name);
    updateLineItem(index, 'price', product.price || 0);
    updateLineItem(index, 'hsnCode', product.hsnCode || product.sacCode || '');
    updateLineItem(index, 'gstRate', product.gstRate || gstSettings?.defaultGstRate || 18);
    updateLineItem(index, 'category', product.categoryId || '');
  };

  // Handle product added
  const handleProductAdded = (newProduct: Product) => {
    setProducts(prev => [...prev, newProduct]);
  };

  // Handle snackbar
  const handleShowSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    // You can add a snackbar component here if needed
    console.log(`${severity.toUpperCase()}: ${message}`);
  };

  // Save invoice
  const handleSave = async () => {
    if (!selectedParty || !gstSettings || !userId) {
      setError('Please select a party and ensure GST settings are configured.');
      return;
    }

    if (lineItems.length === 0) {
      setError('Please add at least one item to the invoice.');
      return;
    }

    if (!selectedParty.gstin) {
      setError('Selected party must have a valid GST number for GST invoice.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const partyStateCode = selectedParty.gstin ? 
        GstCalculator.extractStateCodeFromGstin(selectedParty.gstin) : 
        gstSettings.companyStateCode;

      const invoiceData: Partial<Invoice> = {
        invoiceNumber,
        date: invoiceDate,
        partyId: selectedParty.id || '',
        partyName: selectedParty.name,
        partyAddress: selectedParty.address,
        partyEmail: selectedParty.email,
        partyPhone: selectedParty.phone,
        partyGstin: selectedParty.gstin,
        partyStateCode,
        items: lineItems,
        subtotal: totals.subtotal,
        discount: 0,
        total: totals.grandTotal,
        totalCgst: totals.totalCgst,
        totalSgst: totals.totalSgst,
        totalIgst: totals.totalIgst,
        totalTaxableAmount: totals.totalTaxableAmount,
        totalTaxAmount: totals.totalTaxAmount,
        isGstInvoice: true,
        placeOfSupply: GstCalculator.getStateName(partyStateCode),
        companyName: gstSettings.companyName,
        companyAddress: gstSettings.companyAddress,
        companyGstin: gstSettings.companyGstin,
        companyStateCode: gstSettings.companyStateCode,
        createdAt: serverTimestamp(),
        userId,
        notes,
        transportCharges,
        roundOff,
        categoryDiscountRules, // Save discount rules with invoice
      };

      const cleanedData = cleanInvoiceData(invoiceData);
      
      // Use centralized service with mandatory stock validation
      const createResult = await CentralizedInvoiceService.createInvoice(cleanedData, {
        validateStock: true,
        updateStock: true,
        allowZeroStock: true,      // Allow zero stock sales
        allowNegativeStock: true,  // Allow negative stock
        strictMode: false
      });
      
      if (!createResult.success) {
        throw new Error(createResult.blockingErrors?.join('\n') || createResult.errors?.join(', ') || 'Failed to create GST invoice');
      }
      
      console.log('GST Invoice created with ID:', createResult.invoiceId);
      
      if (onSuccess) {
        onSuccess(createResult.invoiceId!);
      } else {
        router.push(`/invoices/${createResult.invoiceId}`);
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      setError('Failed to create invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (gstLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!gstSettings) {
    return (
      <Alert severity="error">
        GST settings not configured. Please configure GST settings first.
      </Alert>
    );
  }

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select GST Registered Party
              </Typography>

              {gstParties.length === 0 && (
                <Box sx={{ mb: 3 }}>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    No parties with GST registration found. Please add parties with valid GST numbers first.
                  </Alert>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={() => router.push('/parties/new?from=invoice&returnTo=/invoices/gst-only')}
                    sx={{ mb: 1 }}
                  >
                    Add New GST Party
                  </Button>
                </Box>
              )}

              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Invoice Number"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Invoice Date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Autocomplete
                    options={gstParties}
                    getOptionLabel={(option) => `${option.name} (${option.gstin})`}
                    value={selectedParty}
                    onChange={(_, newValue) => setSelectedParty(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select GST Registered Party"
                        placeholder="Choose a party with GST number"
                        required
                        error={!selectedParty}
                        helperText={!selectedParty ? 'Party with GST number is required' : ''}
                      />
                    )}
                    renderOption={(props, option) => {
                      const { key, ...otherProps } = props;
                      return (
                        <Box component="li" key={key} {...otherProps}>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {option.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              GSTIN: {option.gstin}
                            </Typography>
                            {option.address && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {option.address}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    }}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
      case 1:
        return (
          <Card>
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={configTabValue} onChange={(_, newValue) => setConfigTabValue(newValue)}>
                  <Tab 
                    label="Category Discounts" 
                    icon={<CategoryIcon />} 
                    iconPosition="start"
                  />
                  <Tab 
                    label="General Settings" 
                    icon={<SettingsIcon />} 
                    iconPosition="start"
                  />
                </Tabs>
              </Box>
              
              <TabPanel value={configTabValue} index={0}>
                <CategoryDiscountConfiguration
                  categories={categories}
                  selectedParty={selectedParty}
                  onDiscountRulesChange={setCategoryDiscountRules}
                  initialRules={categoryDiscountRules}
                />
              </TabPanel>
              
              <TabPanel value={configTabValue} index={1}>
                <Alert severity="info">
                  <Typography variant="body2">
                    General invoice settings and preferences will be available here in future updates.
                    Currently, category discount configuration is the main feature.
                  </Typography>
                </Alert>
              </TabPanel>
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Invoice Items</Typography>
                <Button
                  startIcon={<AddIcon />}
                  variant="contained"
                  onClick={addLineItem}
                  disabled={!selectedParty}
                >
                  Add Item
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>HSN/SAC</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Price (₹)</TableCell>
                      <TableCell align="right">Discount (%)</TableCell>
                      <TableCell align="right">GST Rate (%)</TableCell>
                      <TableCell align="right">Taxable Value (₹)</TableCell>
                      <TableCell align="right">Tax Amount (₹)</TableCell>
                      <TableCell align="right">Total (₹)</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lineItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} align="center">
                          No items added. Click "Add Item" to add products.
                        </TableCell>
                      </TableRow>
                    ) : (
                      lineItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <EnhancedProductSelector
                              products={products}
                              categories={categories}
                              selectedProduct={products.find(p => p.id === item.productId) || null}
                              onProductSelect={(product) => selectProduct(index, product)}
                              onProductAdded={handleProductAdded}
                              onShowSnackbar={handleShowSnackbar}
                              placeholder="Select GST-eligible product"
                              error={!item.productId}
                              helperText={!item.productId ? "Product is required" : ""}
                              showGstEligibleOnly={true}
                              showActiveOnly={true}
                              allowQuickAdd={true}
                              size="small"
                              sx={{ width: 250 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              value={item.hsnCode}
                              onChange={(e) => updateLineItem(index, 'hsnCode', e.target.value)}
                              size="small"
                              placeholder="HSN/SAC Code"
                              error={!item.hsnCode}
                              sx={{ width: 100 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              size="small"
                              inputProps={{ min: 1, step: 1 }}
                              sx={{ width: 70 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              value={item.price}
                              onChange={(e) => updateLineItem(index, 'price', parseFloat(e.target.value) || 0)}
                              size="small"
                              inputProps={{ min: 0, step: 0.01 }}
                              sx={{ width: 100 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              value={item.discount}
                              onChange={(e) => updateLineItem(index, 'discount', parseFloat(e.target.value) || 0)}
                              size="small"
                              inputProps={{ min: 0, max: 100, step: 0.1 }}
                              sx={{ width: 70 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <FormControl size="small" sx={{ width: 90 }}>
                              <Select
                                value={item.gstRate}
                                onChange={(e) => updateLineItem(index, 'gstRate', parseFloat(e.target.value as string))}
                                size="small"
                              >
                                {GST_RATES.map(rate => (
                                  <MenuItem key={rate} value={rate}>{rate}%</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell align="right">₹{item.taxableAmount?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell align="right">₹{item.totalTaxAmount?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell align="right">₹{item.finalPrice?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeLineItem(index)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        );
      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Tax Summary</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Subtotal:</Typography>
                    <Typography>₹{totals.subtotal.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Taxable Amount:</Typography>
                    <Typography>₹{totals.totalTaxableAmount.toFixed(2)}</Typography>
                  </Box>
                  {totals.isInterState ? (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>IGST:</Typography>
                      <Typography>₹{totals.totalIgst.toFixed(2)}</Typography>
                    </Box>
                  ) : (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>CGST:</Typography>
                        <Typography>₹{totals.totalCgst.toFixed(2)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>SGST:</Typography>
                        <Typography>₹{totals.totalSgst.toFixed(2)}</Typography>
                      </Box>
                    </>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Grand Total:</Typography>
                    <Typography variant="h6" color="primary">₹{totals.grandTotal.toFixed(2)}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Additional Details</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Transport Charges"
                        type="number"
                        value={transportCharges}
                        onChange={(e) => setTransportCharges(parseFloat(e.target.value) || 0)}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Round Off"
                        type="number"
                        value={roundOff}
                        onChange={(e) => setRoundOff(parseFloat(e.target.value) || 0)}
                        inputProps={{ step: 0.01 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Notes"
                        multiline
                        rows={4}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Additional notes or terms..."
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Create GST Invoice (GST Registered Parties Only)
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {steps.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mb: 3 }}>
        {getStepContent(activeStep)}
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={activeStep === 0}
        >
          Back
        </Button>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : (activeStep === steps.length - 1 ? <SaveIcon /> : undefined)}
          onClick={activeStep === steps.length - 1 ? handleSave : handleNext}
          disabled={loading || !selectedParty || (activeStep === steps.length - 1 && lineItems.length === 0)}
        >
          {loading ? 'Creating...' : (activeStep === steps.length - 1 ? 'Create GST Invoice' : 'Next')}
        </Button>
      </Box>
    </Box>
  );
}