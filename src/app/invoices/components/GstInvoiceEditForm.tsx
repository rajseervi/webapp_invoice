"use client";
import React, { useState, useEffect, useCallback } from 'react';
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
  InputAdornment,
  CircularProgress,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Receipt as ReceiptIcon,
  Calculate as CalculateIcon,
  Info as InfoIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { GstSettingsService } from '@/services/gstService';
import { EnhancedGstCalculator, EnhancedInvoiceGstCalculator, INDIAN_STATES, GST_RATES } from '@/services/enhancedGstService';
import { GstSettings, Invoice, InvoiceItem } from '@/types/invoice';
import { Product } from '@/types/inventory';
import { Party } from '@/types/party';
import { collection, getDocs, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { cleanInvoiceData, validateUpdateDocData } from '@/utils/firestoreUtils';
import Link from 'next/link';

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

interface GstInvoiceEditFormProps {
  invoiceId: string;
  onSuccess?: () => void;
}

export default function GstInvoiceEditForm({ invoiceId, onSuccess }: GstInvoiceEditFormProps) {
  const router = useRouter();
  const { userId } = useCurrentUser();
  const [gstSettings, setGstSettings] = useState<GstSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [parties, setParties] = useState<Party[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lineItems, setLineItems] = useState<GstInvoiceItem[]>([]);
  const [defaultCalculationMode, setDefaultCalculationMode] = useState<'inclusive' | 'exclusive'>('inclusive');
  const [notes, setNotes] = useState('');
  const [transportCharges, setTransportCharges] = useState(0);
  const [roundOff, setRoundOff] = useState(0);

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

  const recalculateLineItem = useCallback((items: GstInvoiceItem[], index: number) => {
    const item = items[index];
    if (!gstSettings || !selectedParty) return;

    const partyStateCode = selectedParty.gstin ? EnhancedGstCalculator.extractStateCodeFromGstin(selectedParty.gstin) : gstSettings.companyStateCode;
    const isInterState = EnhancedGstCalculator.isInterState(gstSettings.companyStateCode, partyStateCode);
    const calculation = EnhancedGstCalculator.calculateLineItemWithDiscount(item.price, item.quantity, item.discount, 'percentage', item.gstRate, isInterState, item.calculationMode);
    
    item.taxableAmount = calculation.taxableAmount;
    item.cgstAmount = calculation.cgstAmount;
    item.sgstAmount = calculation.sgstAmount;
    item.igstAmount = calculation.igstAmount;
    item.totalTaxAmount = calculation.totalTaxAmount;
    item.finalPrice = calculation.finalAmount;
  }, [gstSettings, selectedParty]);

  const calculateTotals = useCallback(() => {
    if (!gstSettings || !selectedParty) return;

    const partyStateCode = selectedParty.gstin ? EnhancedGstCalculator.extractStateCodeFromGstin(selectedParty.gstin) : gstSettings.companyStateCode;
    const itemsForCalculation = lineItems.map(item => ({ 
      rate: item.price, 
      quantity: item.quantity, 
      discount: item.discount, 
      discountType: 'percentage' as const, 
      gstRate: item.gstRate, 
      calculationMode: item.calculationMode 
    }));
    const calculation = EnhancedInvoiceGstCalculator.calculateInvoiceGst(itemsForCalculation, gstSettings.companyStateCode, partyStateCode);
    const grandTotalWithExtras = calculation.totals.totalFinalAmount + transportCharges + roundOff;

    setTotals({
      subtotal: calculation.totals.totalBaseAmount,
      totalTaxableAmount: calculation.totals.totalTaxableAmount,
      totalCgst: calculation.totals.totalCgst,
      totalSgst: calculation.totals.totalSgst,
      totalIgst: calculation.totals.totalIgst,
      totalTaxAmount: calculation.totals.totalTaxAmount,
      grandTotal: grandTotalWithExtras,
      isInterState: calculation.totals.isInterState
    });
  }, [lineItems, selectedParty, gstSettings, transportCharges, roundOff]);

  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  const initializePage = useCallback(async () => {
    try {
      setLoading(true);
      const settings = await GstSettingsService.getGstSettings();
      if (!settings || !settings.enableGst) {
        setError('GST is not enabled. Please configure GST settings first.');
        return;
      }
      setGstSettings(settings);

      const partiesRef = collection(db, 'parties');
      const partiesSnapshot = await getDocs(partiesRef);
      const partiesList = partiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Party[];
      setParties(partiesList);

      const productsRef = collection(db, 'products');
      const productsSnapshot = await getDocs(productsRef);
      const productsList = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      setProducts(productsList);

      if (!invoiceId) {
        setError('Invoice ID is missing');
        return;
      }
      const invoiceRef = doc(db, 'invoices', invoiceId);
      const invoiceSnap = await getDoc(invoiceRef);
      if (!invoiceSnap.exists()) {
        setError('Invoice not found');
        return;
      }
      const invoiceData = invoiceSnap.data() as Invoice;
      setInvoiceNumber(invoiceData.invoiceNumber);
      setInvoiceDate(invoiceData.date);
      setNotes(invoiceData.notes || '');
      setTransportCharges(invoiceData.transportCharges || 0);
      setRoundOff(invoiceData.roundOff || 0);
      if (invoiceData.partyId) {
        const party = partiesList.find(p => p.id === invoiceData.partyId);
        if (party) setSelectedParty(party);
      }
      if (invoiceData.items && Array.isArray(invoiceData.items)) {
        const gstItems = invoiceData.items.map(item => ({ 
          ...item, 
          calculationMode: 'inclusive' as const 
        }));
        setLineItems(gstItems);
      }
    } catch (err) {
      console.error('Error initializing page:', err);
      setError('Failed to initialize GST invoice edit page');
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    initializePage();
  }, [initializePage]);

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

  const removeLineItem = (index: number) => setLineItems(lineItems.filter((_, i) => i !== index));

  const updateLineItem = (index: number, field: keyof GstInvoiceItem, value: any) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    recalculateLineItem(updatedItems, index);
    setLineItems(updatedItems);
  };

  const selectProduct = (index: number, product: Product | null) => {
    const updatedItems = [...lineItems];
    if (!product) {
      updatedItems[index] = { 
        ...updatedItems[index], 
        name: '', 
        price: 0, 
        productId: '', 
        gstRate: gstSettings?.defaultGstRate || 18, 
        hsnCode: '', 
        category: '' 
      };
    } else {
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
    }
    recalculateLineItem(updatedItems, index);
    setLineItems(updatedItems);
  };

  const toggleAllCalculationModes = () => {
    const newMode = defaultCalculationMode === 'inclusive' ? 'exclusive' : 'inclusive';
    setDefaultCalculationMode(newMode);
    const updatedItems = lineItems.map(item => ({ ...item, calculationMode: newMode }));
    updatedItems.forEach((_, index) => recalculateLineItem(updatedItems, index));
    setLineItems(updatedItems);
  };

  const toggleItemCalculationMode = (index: number) => {
    const updatedItems = [...lineItems];
    updatedItems[index].calculationMode = updatedItems[index].calculationMode === 'inclusive' ? 'exclusive' : 'inclusive';
    recalculateLineItem(updatedItems, index);
    setLineItems(updatedItems);
  };

  const validateInvoice = (): string | null => {
    if (!selectedParty) return 'Please select a party';
    if (lineItems.length === 0) return 'Please add at least one item';
    if (!gstSettings) return 'GST settings not loaded';
    if (!invoiceNumber.trim()) return 'Invoice number is required';
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      if (!item.productId || !item.name) return `Select a product for item ${i + 1}`;
      if (!item.hsnCode) return `HSN code is required for item ${i + 1}`;
      if (item.quantity <= 0) return `Quantity must be > 0 for item ${i + 1}`;
      if (item.price <= 0) return `Price must be > 0 for item ${i + 1}`;
      if (item.gstRate < 0 || item.gstRate > 100) return `Invalid GST rate for item ${i + 1}`;
    }
    return null;
  };

  const updateInvoice = async () => {
    setSaving(true);
    setError(null);
    const validationError = validateInvoice();
    if (validationError) {
      setError(validationError);
      setSaving(false);
      return;
    }

    try {
      const partyStateCode = selectedParty!.gstin ? EnhancedGstCalculator.extractStateCodeFromGstin(selectedParty!.gstin) : gstSettings!.companyStateCode;
      const invoiceData = { 
        invoiceNumber, 
        date: invoiceDate, 
        partyId: selectedParty!.id, 
        partyName: selectedParty!.name, 
        partyAddress: selectedParty!.address || '', 
        partyEmail: selectedParty!.email || '', 
        partyPhone: selectedParty!.phone || '', 
        partyGstin: selectedParty!.gstin || '', 
        partyStateCode: partyStateCode || '', 
        items: lineItems || [], 
        subtotal: totals.subtotal || 0, 
        discount: lineItems.reduce((sum, item) => sum + (item.price * item.quantity * item.discount / 100), 0) || 0, 
        total: totals.grandTotal || 0, 
        updatedAt: serverTimestamp(), 
        updatedBy: userId || '', 
        notes: notes || '', 
        transportCharges: transportCharges || 0, 
        roundOff: roundOff || 0, 
        isGstInvoice: true, 
        totalTaxableAmount: totals.totalTaxableAmount || 0, 
        totalCgst: totals.totalCgst || 0, 
        totalSgst: totals.totalSgst || 0, 
        totalIgst: totals.totalIgst || 0, 
        totalTaxAmount: totals.totalTaxAmount || 0, 
        companyName: gstSettings!.companyName || '', 
        companyAddress: gstSettings!.companyAddress || '', 
        companyGstin: gstSettings!.companyGstin || '', 
        companyStateCode: gstSettings!.companyStateCode || '', 
        placeOfSupply: INDIAN_STATES[partyStateCode as keyof typeof INDIAN_STATES] || '' 
      };

      // Validate the data before sending to Firestore
      const validation = validateUpdateDocData(invoiceData, 'invoice');
      
      if (!validation.isValid) {
        console.error('Invoice data validation failed:', validation.errors);
        setError(`Invalid invoice data: ${validation.errors.join(', ')}`);
        return;
      }

      console.log('Updating invoice with data:', validation.cleanedData);
      
      const invoiceRef = doc(db, 'invoices', invoiceId);
      await updateDoc(invoiceRef, validation.cleanedData);
      setSuccess('Invoice updated successfully');
      if (onSuccess) onSuccess();
      else setTimeout(() => router.push(`/invoices/${invoiceId}`), 1500);
    } catch (err: any) {
      console.error('Error updating invoice:', err);
      
      // Provide more detailed error information
      let errorMessage = 'Failed to update invoice';
      if (err.code === 'invalid-argument') {
        errorMessage += ': Invalid data provided. Please check all fields for correct values.';
      } else if (err.message) {
        errorMessage += `: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box>
      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess(null)} 
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1">
            Edit GST Invoice
          </Typography>
          <Button 
            component={Link} 
            href={`/invoices/${invoiceId}`} 
            startIcon={<ArrowBackIcon />} 
            variant="outlined"
          >
            Back to Invoice
          </Button>
        </Box>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <TextField 
              label="Invoice Number" 
              value={invoiceNumber} 
              onChange={(e) => setInvoiceNumber(e.target.value)} 
              fullWidth 
              required 
              disabled 
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField 
              label="Invoice Date" 
              type="date" 
              value={invoiceDate} 
              onChange={(e) => setInvoiceDate(e.target.value)} 
              fullWidth 
              required 
              InputLabelProps={{ shrink: true }} 
            />
          </Grid>
          <Grid item xs={12} sm={4}>
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
                  error={!selectedParty} 
                  helperText={!selectedParty ? "Party is required" : ""} 
                />
              )} 
              isOptionEqualToValue={(option, value) => option.id === value.id} 
            />
          </Grid>
        </Grid>

        {selectedParty && (
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Party Details
                </Typography>
                <Typography variant="body2">
                  <strong>Name:</strong> {selectedParty.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Address:</strong> {selectedParty.address}
                </Typography>
                <Typography variant="body2">
                  <strong>Email:</strong> {selectedParty.email}
                </Typography>
                <Typography variant="body2">
                  <strong>Phone:</strong> {selectedParty.phone}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" gutterBottom>
                  GST Details
                </Typography>
                <Typography variant="body2">
                  <strong>GSTIN:</strong> {selectedParty.gstin || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>State:</strong> {selectedParty.state || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>State Code:</strong> {selectedParty.gstin ? EnhancedGstCalculator.extractStateCodeFromGstin(selectedParty.gstin) : 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Supply Type:</strong> {gstSettings && selectedParty.gstin && EnhancedGstCalculator.isInterState(gstSettings.companyStateCode, EnhancedGstCalculator.extractStateCodeFromGstin(selectedParty.gstin)) ? 'Inter-State' : 'Intra-State'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Invoice Items</Typography>
            <Box>
              <FormControlLabel 
                control={
                  <Switch 
                    checked={defaultCalculationMode === 'inclusive'} 
                    onChange={toggleAllCalculationModes} 
                  />
                } 
                label={`GST ${defaultCalculationMode === 'inclusive' ? 'Inclusive' : 'Exclusive'}`} 
              />
              <Button 
                startIcon={<AddIcon />} 
                variant="contained" 
                onClick={addLineItem} 
                sx={{ ml: 2 }}
              >
                Add Item
              </Button>
            </Box>
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
                  <TableCell align="right">GST Type</TableCell>
                  <TableCell align="right">Taxable Value (₹)</TableCell>
                  <TableCell align="right">Tax Amount (₹)</TableCell>
                  <TableCell align="right">Total (₹)</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lineItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center">
                      No items added. Click "Add Item" to add products.
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
                            <TextField 
                              {...params} 
                              size="small" 
                              placeholder="Select product" 
                              error={!item.productId} 
                            />
                          )} 
                          isOptionEqualToValue={(option, value) => option.id === value.id} 
                          size="small" 
                          sx={{ width: 200 }} 
                        />
                      </TableCell>
                      <TableCell>
                        <TextField 
                          value={item.hsnCode} 
                          onChange={(e) => updateLineItem(index, 'hsnCode', e.target.value)} 
                          size="small" 
                          placeholder="HSN Code" 
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
                              <MenuItem key={rate} value={rate}>
                                {rate}%
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={item.calculationMode === 'inclusive' ? 'Incl.' : 'Excl.'} 
                          size="small" 
                          color={item.calculationMode === 'inclusive' ? 'primary' : 'default'} 
                          onClick={() => toggleItemCalculationMode(index)} 
                          clickable 
                        />
                      </TableCell>
                      <TableCell align="right">
                        ₹{(item.taxableAmount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        ₹{(item.totalTaxAmount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        ₹{(item.finalPrice || 0).toFixed(2)}
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
        </Box>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField 
              label="Notes" 
              multiline 
              rows={4} 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              fullWidth 
              placeholder="Add any additional notes or terms here..." 
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Invoice Summary
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal:</Typography>
                <Typography>₹{totals.subtotal.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Total Taxable Value:</Typography>
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Total Tax:</Typography>
                <Typography>₹{totals.totalTaxAmount.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <TextField 
                  label="Transport Charges" 
                  type="number" 
                  value={transportCharges} 
                  onChange={(e) => setTransportCharges(parseFloat(e.target.value) || 0)} 
                  size="small" 
                  InputProps={{ 
                    startAdornment: <InputAdornment position="start">₹</InputAdornment> 
                  }} 
                  sx={{ width: 200 }} 
                />
                <Typography sx={{ alignSelf: 'center' }}>
                  ₹{transportCharges.toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <TextField 
                  label="Round Off" 
                  type="number" 
                  value={roundOff} 
                  onChange={(e) => setRoundOff(parseFloat(e.target.value) || 0)} 
                  size="small" 
                  InputProps={{ 
                    startAdornment: <InputAdornment position="start">₹</InputAdornment> 
                  }} 
                  sx={{ width: 200 }} 
                />
                <Typography sx={{ alignSelf: 'center' }}>
                  ₹{roundOff.toFixed(2)}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">Grand Total:</Typography>
                <Typography variant="h6">₹{totals.grandTotal.toFixed(2)}</Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button 
            variant="outlined" 
            component={Link} 
            href={`/invoices/${invoiceId}`}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            startIcon={<SaveIcon />} 
            onClick={updateInvoice} 
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Update Invoice'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}