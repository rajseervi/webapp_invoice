"use client";
import React, { useState, useEffect, useMemo } from 'react';
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
  Alert,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Party } from '@/types/party_no_gst';
import { Product } from '@/types/inventory_no_gst';
import { Invoice, InvoiceItem } from '@/types/invoice_no_gst';
import SimpleInvoiceService from '@/services/simpleInvoiceService';
import CentralizedInvoiceService from '@/services/centralizedInvoiceService';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';

interface SimpleInvoiceFormProps {
  onSuccess?: (invoiceId?: string) => void;
  initialData?: Partial<Invoice>;
  mode?: 'create' | 'edit';
}

const UNITS = ['PCS', 'KG', 'LITER', 'METER', 'BOX', 'DOZEN', 'GRAM', 'TON'];

export default function SimpleInvoiceForm({ 
  onSuccess, 
  initialData, 
  mode = 'create' 
}: SimpleInvoiceFormProps) {
  const router = useRouter();
  const { userId } = useCurrentUser();
  
  // State management
  const [parties, setParties] = useState<Party[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [invoiceType, setInvoiceType] = useState<'sales' | 'purchase'>('sales');
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate invoice number
  const generateInvoiceNumber = () => {
    return SimpleInvoiceService.generateInvoiceNumber(invoiceType);
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;
      
      try {
        setDataLoading(true);
        
        // Load parties
        const partiesQuery = query(
          collection(db, 'parties'),
          where('userId', '==', userId)
        );
        const partiesSnapshot = await getDocs(partiesQuery);
        const partiesData = partiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Party[];
        setParties(partiesData);

        // Load products
        const productsQuery = query(
          collection(db, 'products'),
          where('userId', '==', userId)
        );
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(productsData);

        // Generate invoice number if creating new
        if (mode === 'create') {
          setInvoiceNumber(generateInvoiceNumber());
        }

        // Load initial data if editing
        if (initialData) {
          setInvoiceNumber(initialData.invoiceNumber || '');
          setInvoiceDate(initialData.date || new Date().toISOString().split('T')[0]);
          setDueDate(initialData.dueDate || '');
          setInvoiceType(initialData.type || 'sales');
          setLineItems(initialData.items || []);
          setNotes(initialData.notes || '');
          
          if (initialData.partyId) {
            const party = partiesData.find(p => p.id === initialData.partyId);
            if (party) setSelectedParty(party);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [userId, mode, initialData]);

  // Update invoice number when type changes
  useEffect(() => {
    if (mode === 'create') {
      setInvoiceNumber(generateInvoiceNumber());
    }
  }, [invoiceType, mode]);

  // Calculate totals
  const totals = useMemo(() => {
    return SimpleInvoiceService.calculateInvoiceTotals(lineItems);
  }, [lineItems]);

  // Add new line item
  const addLineItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      productId: '',
      name: '',
      quantity: 1,
      price: 0,
      discount: 0,
      discountType: 'none',
      finalPrice: 0,
      totalAmount: 0,
      unitOfMeasurement: 'PCS',
    };
    setLineItems([...lineItems, newItem]);
  };

  // Update line item
  const updateLineItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate item totals
    updatedItems[index] = SimpleInvoiceService.calculateItemTotals(updatedItems[index]);
    
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
      updateLineItem(index, 'price', 0);
      return;
    }

    updateLineItem(index, 'productId', product.id || '');
    updateLineItem(index, 'name', product.name);
    updateLineItem(index, 'price', product.price || 0);
    updateLineItem(index, 'unitOfMeasurement', product.unitOfMeasurement || 'PCS');
  };

  // Save invoice
  const handleSave = async () => {
    if (!selectedParty || !userId) {
      setError('Please select a party.');
      return;
    }

    if (lineItems.length === 0) {
      setError('Please add at least one item to the invoice.');
      return;
    }

    if (!invoiceNumber.trim()) {
      setError('Please enter an invoice number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const invoiceData: Omit<Invoice, 'id' | 'createdAt'> = {
        invoiceNumber,
        date: invoiceDate,
        dueDate: dueDate || undefined,
        partyId: selectedParty.id || '',
        partyName: selectedParty.name,
        partyAddress: selectedParty.address,
        partyEmail: selectedParty.email,
        partyPhone: selectedParty.phone,
        items: lineItems,
        subtotal: totals.subtotal,
        totalDiscount: totals.totalDiscount,
        totalAmount: totals.totalAmount,
        type: invoiceType,
        status: 'draft',
        paymentStatus: 'pending',
        paidAmount: 0,
        balanceAmount: totals.totalAmount,
        userId,
        notes,
        updatedAt: new Date().toISOString()
      };

      let result;
      if (mode === 'edit' && initialData?.id) {
        result = await SimpleInvoiceService.updateInvoice(initialData.id, invoiceData);
        if (result.success) {
          if (onSuccess) {
            onSuccess(initialData.id);
          } else {
            router.push(`/invoices/${initialData.id}`);
          }
        } else {
          setError(result.errors?.join(', ') || 'Failed to update invoice');
        }
      } else {
        // Use centralized service with mandatory stock validation
        const centralizedResult = await CentralizedInvoiceService.createInvoice(invoiceData, {
          validateStock: true,
          updateStock: true,
          allowZeroStock: true,      // Allow zero stock sales
          allowNegativeStock: true,  // Allow negative stock
          strictMode: false
        });
        
        if (centralizedResult.success) {
          if (onSuccess) {
            onSuccess(centralizedResult.invoiceId);
          } else {
            router.push(`/invoices/${centralizedResult.invoiceId}`);
          }
          
          // Show warnings if any
          if (centralizedResult.warnings && centralizedResult.warnings.length > 0) {
            console.warn('Invoice creation warnings:', centralizedResult.warnings);
          }
        } else {
          // Handle stock validation errors with user-friendly messages
          if (centralizedResult.blockingErrors && centralizedResult.blockingErrors.length > 0) {
            const stockErrors = centralizedResult.blockingErrors.filter(error => 
              error.includes('ZERO STOCK') || error.includes('INSUFFICIENT STOCK')
            );
            
            if (stockErrors.length > 0) {
              setError('🚫 Cannot create invoice due to stock issues:\n\n' + stockErrors.join('\n\n'));
            } else {
              setError(centralizedResult.blockingErrors.join('\n'));
            }
          } else {
            setError(centralizedResult.errors?.join(', ') || 'Failed to create invoice');
          }
        }
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      setError('Failed to save invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {mode === 'edit' ? 'Edit Invoice' : 'Create New Invoice'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Invoice Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Invoice Details
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <Typography variant="body2" sx={{ mb: 1 }}>Invoice Type</Typography>
                <Select
                  value={invoiceType}
                  onChange={(e) => setInvoiceType(e.target.value as 'sales' | 'purchase')}
                  disabled={mode === 'edit'}
                >
                  <MenuItem value="sales">Sales Invoice</MenuItem>
                  <MenuItem value="purchase">Purchase Invoice</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Invoice Number"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={3}>
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
            
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                type="date"
                label="Due Date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete
                options={parties}
                getOptionLabel={(option) => `${option.name} ${option.phone ? `(${option.phone})` : ''}`}
                value={selectedParty}
                onChange={(_, newValue) => setSelectedParty(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`Select ${invoiceType === 'sales' ? 'Customer' : 'Supplier'}`}
                    placeholder="Choose a party"
                    required
                    error={!selectedParty}
                    helperText={!selectedParty ? 'Party is required' : ''}
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
                        {option.phone && (
                          <Typography variant="caption" color="text.secondary">
                            Phone: {option.phone}
                          </Typography>
                        )}
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

      {/* Invoice Items */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Invoice Items</Typography>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={addLineItem}
            >
              Add Item
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell align="right">Price (₹)</TableCell>
                  <TableCell align="right">Discount</TableCell>
                  <TableCell>Disc. Type</TableCell>
                  <TableCell align="right">Total (₹)</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lineItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No items added. Click "Add Item" to add products.
                    </TableCell>
                  </TableRow>
                ) : (
                  lineItems.map((item, index) => (
                    <TableRow key={item.id || index}>
                      <TableCell>
                        <Autocomplete
                          options={products}
                          getOptionLabel={(option) => option.name}
                          value={products.find(p => p.id === item.productId) || null}
                          onChange={(_, product) => selectProduct(index, product)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Select product"
                              size="small"
                              error={!item.productId}
                              sx={{ width: 200 }}
                            />
                          )}
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                        />
                      </TableCell>
                      
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          size="small"
                          inputProps={{ min: 1, step: 1 }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <FormControl size="small" sx={{ width: 80 }}>
                          <Select
                            value={item.unitOfMeasurement || 'PCS'}
                            onChange={(e) => updateLineItem(index, 'unitOfMeasurement', e.target.value)}
                          >
                            {UNITS.map(unit => (
                              <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
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
                          inputProps={{ min: 0, step: 0.01 }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <FormControl size="small" sx={{ width: 100 }}>
                          <Select
                            value={item.discountType || 'none'}
                            onChange={(e) => updateLineItem(index, 'discountType', e.target.value)}
                          >
                            <MenuItem value="none">None</MenuItem>
                            <MenuItem value="percentage">%</MenuItem>
                            <MenuItem value="fixed">Fixed</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      
                      <TableCell align="right">
                        <Typography fontWeight="medium">
                          ₹{item.totalAmount?.toFixed(2) || '0.00'}
                        </Typography>
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
        </CardContent>
      </Card>

      {/* Invoice Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Summary</Typography>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal:</Typography>
                <Typography>₹{totals.subtotal.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Total Discount:</Typography>
                <Typography>₹{totals.totalDiscount.toFixed(2)}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Total Amount:</Typography>
                <Typography variant="h6" color="primary">₹{totals.totalAmount.toFixed(2)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Additional Notes</Typography>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or terms..."
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={loading || !selectedParty || lineItems.length === 0}
        >
          {loading ? 'Saving...' : (mode === 'edit' ? 'Update Invoice' : 'Create Invoice')}
        </Button>
      </Box>
    </Box>
  );
}