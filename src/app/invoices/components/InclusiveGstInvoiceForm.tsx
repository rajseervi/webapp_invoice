"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Snackbar,
  Autocomplete,
  MenuItem,
  Divider,
  Chip,
  FormControlLabel,
  Switch,
  Tooltip,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Receipt as ReceiptIcon,
  Calculate as CalculateIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { GstSettingsService } from '@/services/gstService';
import { EnhancedGstCalculator, EnhancedInvoiceGstCalculator, INDIAN_STATES, GST_RATES } from '@/services/enhancedGstService';
import { GstSettings, Invoice, InvoiceItem } from '@/types/invoice';
import { Product } from '@/types/inventory';
import { Party } from '@/types/party';
import { collection, getDocs, addDoc, query, orderBy, limit } from 'firebase/firestore';
import CentralizedInvoiceService from '@/services/centralizedInvoiceService';
import { db } from '@/firebase/config';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { cleanInvoiceData } from '@/utils/firestoreUtils';

interface GstInvoiceItem extends InvoiceItem {
  gstRate: number;
  hsnCode: string;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxableAmount: number;
  totalTaxAmount: number;
  calculationMode: 'inclusive' | 'exclusive';
}

interface InclusiveGstInvoiceFormProps {
  onSuccess?: () => void;
}

export default function InclusiveGstInvoiceForm({ onSuccess }: InclusiveGstInvoiceFormProps) {
  const router = useRouter();
  const { userId } = useCurrentUser();
  const [gstSettings, setGstSettings] = useState<GstSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Invoice data
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [parties, setParties] = useState<Party[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lineItems, setLineItems] = useState<GstInvoiceItem[]>([]);
  const [defaultCalculationMode, setDefaultCalculationMode] = useState<'inclusive' | 'exclusive'>('inclusive');

  // Calculated totals
  const [totals, setTotals] = useState({
    subtotal: 0,
    totalTaxableAmount: 0,
    totalCgst: 0,
    totalSgst: 0,
    totalIgst: 0,
    totalTaxAmount: 0,
    grandTotal: 0,
    isInterState: false
  });

  useEffect(() => {
    initializePage();
  }, []);

  const calculateTotals = React.useCallback(() => {
    if (!gstSettings || !selectedParty) {
      return;
    }

    const partyStateCode = selectedParty.gstin ? 
      EnhancedGstCalculator.extractStateCodeFromGstin(selectedParty.gstin) : 
      gstSettings.companyStateCode;

    const itemsForCalculation = lineItems.map(item => ({
      rate: item.price,
      quantity: item.quantity,
      discount: item.discount,
      discountType: 'percentage' as const,
      gstRate: item.gstRate,
      calculationMode: item.calculationMode
    }));

    const calculation = EnhancedInvoiceGstCalculator.calculateInvoiceGst(
      itemsForCalculation,
      gstSettings.companyStateCode,
      partyStateCode
    );

    setTotals({
      subtotal: calculation.totals.totalBaseAmount,
      totalTaxableAmount: calculation.totals.totalTaxableAmount,
      totalCgst: calculation.totals.totalCgst,
      totalSgst: calculation.totals.totalSgst,
      totalIgst: calculation.totals.totalIgst,
      totalTaxAmount: calculation.totals.totalTaxAmount,
      grandTotal: calculation.totals.totalFinalAmount,
      isInterState: calculation.totals.isInterState
    });
  }, [lineItems, selectedParty, gstSettings]);

  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  const initializePage = async () => {
    try {
      setLoading(true);
      
      // Load GST settings
      const settings = await GstSettingsService.getGstSettings();
      if (!settings || !settings.enableGst) {
        setError('GST is not enabled. Please configure GST settings first.');
        return;
      }
      setGstSettings(settings);

      // Generate invoice number
      await generateInvoiceNumber();

      // Load parties and products
      await Promise.all([loadParties(), loadProducts()]);
    } catch (err) {
      console.error('Error initializing page:', err);
      setError('Failed to initialize GST invoice page');
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceNumber = async () => {
    try {
      const invoicesRef = collection(db, 'invoices');
      const q = query(invoicesRef, orderBy('createdAt', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      
      let nextNumber = 1;
      if (!snapshot.empty) {
        const lastInvoice = snapshot.docs[0].data();
        const lastNumber = lastInvoice.invoiceNumber?.match(/\d+$/);
        if (lastNumber) {
          nextNumber = parseInt(lastNumber[0]) + 1;
        }
      }
      
      setInvoiceNumber(`GST-INV-${nextNumber.toString().padStart(4, '0')}`);
    } catch (err) {
      console.error('Error generating invoice number:', err);
      setInvoiceNumber(`GST-INV-${Date.now()}`);
    }
  };

  const loadParties = async () => {
    try {
      const partiesRef = collection(db, 'parties');
      const snapshot = await getDocs(partiesRef);
      const partiesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Party[];
      setParties(partiesList);
    } catch (err) {
      console.error('Error loading parties:', err);
    }
  };

  const loadProducts = async () => {
    try {
      const productsRef = collection(db, 'products');
      const snapshot = await getDocs(productsRef);
      const productsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsList);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

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
      calculationMode: defaultCalculationMode
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (index: number) => {
    const updatedItems = lineItems.filter((_, i) => i !== index);
    setLineItems(updatedItems);
  };

  const updateLineItem = (index: number, field: keyof GstInvoiceItem, value: any) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Recalculate line item totals using the centralized function
    recalculateLineItem(updatedItems, index);
    setLineItems(updatedItems);
  };

  const selectProduct = (index: number, product: Product | null) => {
    if (!product) {
      // Clear the product if null is selected
      const updatedItems = [...lineItems];
      updatedItems[index] = {
        ...updatedItems[index],
        name: '',
        price: 0,
        productId: '',
        gstRate: gstSettings?.defaultGstRate || 18,
        hsnCode: '',
        category: ''
      };
      
      // Recalculate after clearing
      recalculateLineItem(updatedItems, index);
      setLineItems(updatedItems);
      return;
    }

    const updatedItems = [...lineItems];
    updatedItems[index] = {
      ...updatedItems[index],
      name: product.name,
      price: product.price,
      productId: product.id || '',
      gstRate: product.gstRate || gstSettings?.defaultGstRate || 18,
      hsnCode: product.hsnCode || '',
      category: product.categoryId || '',
      calculationMode: defaultCalculationMode
    };

    // Recalculate line item totals after product selection
    recalculateLineItem(updatedItems, index);
    setLineItems(updatedItems);
  };

  const recalculateLineItem = (items: GstInvoiceItem[], index: number) => {
    const item = items[index];
    
    if (!gstSettings || !selectedParty) {
      return;
    }

    const partyStateCode = selectedParty.gstin ? 
      EnhancedGstCalculator.extractStateCodeFromGstin(selectedParty.gstin) : 
      gstSettings.companyStateCode;
    
    const isInterState = EnhancedGstCalculator.isInterState(gstSettings.companyStateCode, partyStateCode);
    
    // Calculate with discount
    const calculation = EnhancedGstCalculator.calculateLineItemWithDiscount(
      item.price,
      item.quantity,
      item.discount,
      'percentage',
      item.gstRate,
      isInterState,
      item.calculationMode
    );
    
    // Update the item with calculated values
    item.taxableAmount = calculation.taxableAmount;
    item.cgstAmount = calculation.cgstAmount;
    item.sgstAmount = calculation.sgstAmount;
    item.igstAmount = calculation.igstAmount;
    item.totalTaxAmount = calculation.totalTaxAmount;
    item.finalPrice = calculation.finalAmount;
  };

  const toggleAllCalculationModes = () => {
    const newMode = defaultCalculationMode === 'inclusive' ? 'exclusive' : 'inclusive';
    setDefaultCalculationMode(newMode);
    
    // Update all line items
    const updatedItems = lineItems.map(item => ({
      ...item,
      calculationMode: newMode
    }));
    
    // Recalculate all items
    updatedItems.forEach((_, index) => {
      recalculateLineItem(updatedItems, index);
    });
    
    setLineItems(updatedItems);
  };

  const toggleItemCalculationMode = (index: number) => {
    const updatedItems = [...lineItems];
    const currentMode = updatedItems[index].calculationMode;
    updatedItems[index].calculationMode = currentMode === 'inclusive' ? 'exclusive' : 'inclusive';
    
    // Recalculate the item
    recalculateLineItem(updatedItems, index);
    setLineItems(updatedItems);
  };

  const validateInvoice = (): string | null => {
    if (!selectedParty) {
      return 'Please select a party';
    }
    if (lineItems.length === 0) {
      return 'Please add at least one item';
    }
    if (!gstSettings) {
      return 'GST settings not loaded';
    }
    if (!invoiceNumber.trim()) {
      return 'Invoice number is required';
    }

    // Validate line items
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      if (!item.productId || !item.name) {
        return `Please select a product for item ${i + 1}`;
      }
      if (!item.hsnCode) {
        return `HSN code is required for item ${i + 1}`;
      }
      if (item.quantity <= 0) {
        return `Quantity must be greater than 0 for item ${i + 1}`;
      }
      if (item.price <= 0) {
        return `Price must be greater than 0 for item ${i + 1}`;
      }
      if (item.gstRate < 0 || item.gstRate > 100) {
        return `Invalid GST rate for item ${i + 1}`;
      }
    }

    return null;
  };

  const saveInvoice = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validation
      const validationError = validateInvoice();
      if (validationError) {
        setError(validationError);
        return;
      }

      const partyStateCode = selectedParty!.gstin ? 
        EnhancedGstCalculator.extractStateCodeFromGstin(selectedParty!.gstin) : 
        gstSettings!.companyStateCode;

      const invoiceData: Partial<Invoice> = {
        invoiceNumber,
        date: invoiceDate,
        partyId: selectedParty!.id || '',
        partyName: selectedParty!.name,
        partyAddress: selectedParty!.address,
        partyEmail: selectedParty!.email,
        partyPhone: selectedParty!.phone,
        partyGstin: selectedParty!.gstin,
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
        placeOfSupply: EnhancedGstCalculator.getStateName(partyStateCode),
        companyGstin: gstSettings!.companyGstin,
        companyStateCode: gstSettings!.companyStateCode,
        createdAt: new Date(),
        userId
      };

      const cleanedInvoiceData = cleanInvoiceData(invoiceData);
      console.log('Cleaned invoice data:', cleanedInvoiceData);
      
      // Use centralized service with mandatory stock validation
      const createResult = await CentralizedInvoiceService.createInvoice(cleanedInvoiceData, {
        validateStock: true,
        updateStock: true,
        allowZeroStock: true,      // Allow zero stock sales
        allowNegativeStock: true,  // Allow negative stock
        strictMode: false
      });
      
      if (!createResult.success) {
        throw new Error(createResult.blockingErrors?.join('\n') || createResult.errors?.join(', ') || 'Failed to create GST invoice');
      }
      
      setSuccess('GST Invoice created successfully');
      
      // Call onSuccess if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Redirect to view the invoice
      setTimeout(() => {
        router.push(`/invoices/${docRef.id}`);
      }, 2000);
    } catch (err) {
      console.error('Error saving invoice:', err);
      setError('Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Create GST Invoice (Inclusive Pricing)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create a GST invoice with prices that include GST (for retail scenarios)
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
          message={success}
        />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Invoice Number"
              fullWidth
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              margin="normal"
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Invoice Date"
              type="date"
              fullWidth
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              margin="normal"
              required
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              options={parties}
              getOptionLabel={(option) => option.name}
              value={selectedParty}
              onChange={(_, newValue) => setSelectedParty(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Party"
                  required
                  margin="normal"
                />
              )}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Invoice Items</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              border: '1px solid',
              borderColor: defaultCalculationMode === 'inclusive' ? 'primary.main' : 'divider',
              borderRadius: 1,
              p: 1,
              bgcolor: defaultCalculationMode === 'inclusive' ? 'primary.light' : 'background.paper',
              color: defaultCalculationMode === 'inclusive' ? 'primary.contrastText' : 'text.primary'
            }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={defaultCalculationMode === 'inclusive'}
                    onChange={toggleAllCalculationModes}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ mr: 1, fontWeight: 'bold' }}>
                      {defaultCalculationMode === 'inclusive' ? 'GST Inclusive Pricing' : 'GST Exclusive Pricing'}
                    </Typography>
                    <Tooltip title="When enabled, the price entered includes GST. The system will calculate the taxable value by reverse calculation. This is useful for retail scenarios where prices are displayed with GST included.">
                      <InfoIcon fontSize="small" color={defaultCalculationMode === 'inclusive' ? 'inherit' : 'action'} />
                    </Tooltip>
                  </Box>
                }
              />
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addLineItem}
            >
              Add Item
            </Button>
          </Box>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell align="center">HSN Code</TableCell>
                <TableCell align="center">Qty</TableCell>
                <TableCell align="right">
                  <Tooltip title={defaultCalculationMode === 'inclusive' ? "Final price including GST" : "Base price excluding GST"}>
                    <Box>
                      {defaultCalculationMode === 'inclusive' ? 'Final Rate (₹)' : 'Base Rate (₹)'}
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">GST %</TableCell>
                <TableCell align="center">Discount %</TableCell>
                <TableCell align="center">Mode</TableCell>
                <TableCell align="right">
                  <Tooltip title={defaultCalculationMode === 'inclusive' ? "Calculated from final price by reverse calculation" : "Base amount after discount"}>
                    <Box sx={{ fontWeight: 'bold', color: defaultCalculationMode === 'inclusive' ? 'success.main' : 'inherit' }}>
                      Taxable (₹)
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">GST (₹)</TableCell>
                <TableCell align="right">Total (₹)</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lineItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No items added. Click "Add Item" to add products.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                lineItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Autocomplete
                        options={products}
                        getOptionLabel={(option) => option.name}
                        value={products.find(p => p.id === item.productId) || null}
                        onChange={(_, newValue) => selectProduct(index, newValue)}
                        renderInput={(params) => (
                          <TextField {...params} size="small" placeholder="Select product" />
                        )}
                        sx={{ width: 200 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        size="small"
                        value={item.hsnCode}
                        onChange={(e) => updateLineItem(index, 'hsnCode', e.target.value)}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        type="number"
                        size="small"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        InputProps={{ inputProps: { min: 1 } }}
                        sx={{ width: 60 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={item.calculationMode === 'inclusive' ? "This is the final price including GST" : "This is the base price excluding GST"}>
                        <TextField
                          type="number"
                          size="small"
                          value={item.price}
                          onChange={(e) => updateLineItem(index, 'price', parseFloat(e.target.value) || 0)}
                          InputProps={{ 
                            inputProps: { min: 0, step: 0.01 },
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>
                          }}
                          sx={{ width: 120 }}
                          label={item.calculationMode === 'inclusive' ? "Final Rate" : "Base Rate"}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        select
                        size="small"
                        value={item.gstRate}
                        onChange={(e) => updateLineItem(index, 'gstRate', parseFloat(e.target.value))}
                        sx={{ width: 80 }}
                      >
                        {GST_RATES.map((rate) => (
                          <MenuItem key={rate} value={rate}>
                            {rate}%
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        type="number"
                        size="small"
                        value={item.discount}
                        onChange={(e) => updateLineItem(index, 'discount', parseFloat(e.target.value) || 0)}
                        InputProps={{ inputProps: { min: 0, max: 100, step: 0.1 } }}
                        sx={{ width: 70 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={item.calculationMode === 'inclusive' ? 'Incl.' : 'Excl.'}
                        color={item.calculationMode === 'inclusive' ? 'primary' : 'default'}
                        size="small"
                        onClick={() => toggleItemCalculationMode(index)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={item.calculationMode === 'inclusive' ? "Calculated from final price by reverse calculation" : "Base amount after discount"}>
                        <Box sx={{ 
                          display: 'inline-flex', 
                          bgcolor: item.calculationMode === 'inclusive' ? 'success.light' : 'transparent',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1
                        }}>
                          ₹{item.taxableAmount.toFixed(2)}
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      ₹{item.totalTaxAmount.toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      ₹{item.finalPrice.toFixed(2)}
                    </TableCell>
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
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Invoice Summary
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  GST Breakdown
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2">Taxable Amount:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" align="right">
                        ₹{totals.totalTaxableAmount.toFixed(2)}
                      </Typography>
                    </Grid>
                    
                    {totals.isInterState ? (
                      <>
                        <Grid item xs={6}>
                          <Typography variant="body2">IGST:</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" align="right">
                            ₹{totals.totalIgst.toFixed(2)}
                          </Typography>
                        </Grid>
                      </>
                    ) : (
                      <>
                        <Grid item xs={6}>
                          <Typography variant="body2">CGST:</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" align="right">
                            ₹{totals.totalCgst.toFixed(2)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">SGST:</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" align="right">
                            ₹{totals.totalSgst.toFixed(2)}
                          </Typography>
                        </Grid>
                      </>
                    )}
                    
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Total GST:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" align="right">
                        ₹{totals.totalTaxAmount.toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Invoice Totals
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2">Subtotal:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" align="right">
                        ₹{totals.subtotal.toFixed(2)}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2">Total Taxable:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" align="right">
                        ₹{totals.totalTaxableAmount.toFixed(2)}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2">Total Tax:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" align="right">
                        ₹{totals.totalTaxAmount.toFixed(2)}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="subtitle1">Grand Total:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle1" align="right" fontWeight="bold">
                        ₹{totals.grandTotal.toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, mb: 5 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={saveInvoice}
          disabled={saving || loading}
          sx={{ minWidth: 150 }}
        >
          {saving ? 'Saving...' : 'Save Invoice'}
        </Button>
      </Box>
    </Container>
  );
}