import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Typography,
  Autocomplete,
  MenuItem,
  IconButton,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Calculate as CalculateIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { Party } from '@/types/party';
import { Product } from '@/types/inventory';
import { Order, OrderItem } from '@/types/order';
import { partyService } from '@/services/partyService';
import { productService } from '@/services/productService';
import { OrderService } from '@/services/orderService';

interface OrderFormProps {
  initialOrder?: Order | null;
  onSubmit: (order: Order) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: string | null;
  onCloseSnackbar: () => void;
}



export const OrderForm: React.FC<OrderFormProps> = ({
  initialOrder,
  onSubmit,
  loading,
  error,
  success,
  onCloseSnackbar,
}) => {
  const [orderNumber, setOrderNumber] = useState(initialOrder?.orderNumber || '');
  const [orderDate, setOrderDate] = useState(initialOrder?.orderDate || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(initialOrder?.dueDate || '');
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [parties, setParties] = useState<Party[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lineItems, setLineItems] = useState<OrderItem[]>(initialOrder?.items || []);
  const [notes, setNotes] = useState(initialOrder?.notes || '');
  const [terms, setTerms] = useState(initialOrder?.terms || '');

  const [totals, setTotals] = useState<{
    subtotal: number;
    grandTotal: number;
    totalTaxableAmount?: number;
    totalIgst?: number;
    totalCgst?: number;
    totalSgst?: number;
    totalTaxAmount?: number;
    isInterState?: boolean;
  }>({
    subtotal: 0,
    grandTotal: 0,
    totalTaxableAmount: 0,
    totalIgst: 0,
    totalCgst: 0,
    totalSgst: 0,
    totalTaxAmount: 0,
    isInterState: false,
  });
  
  const calculateTotals = useCallback(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotals({
        subtotal: subtotal || 0,
        grandTotal: subtotal || 0,
        totalTaxableAmount: 0,
        totalIgst: 0,
        totalCgst: 0,
        totalSgst: 0,
        totalTaxAmount: 0,
        isInterState: false,
    });
  }, [lineItems]);

  useEffect(() => {
    calculateTotals();
  }, [lineItems, calculateTotals]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [partiesData, productsData] = await Promise.all([
          partyService.getAllParties(),
          productService.getProducts()
         ]);
         setParties(partiesData || []);
         setProducts(productsData.products || []);
        
        // Set initial party if editing
        if (initialOrder?.partyId) {
          const party = partiesData?.find(p => p.id === initialOrder.partyId);
          if (party) {
            setSelectedParty(party);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [initialOrder]);

  const addLineItem = () => {
    const newItem: OrderItem = {
      name: '', 
      price: 0, 
      quantity: 1, 
      discount: 0, 
      discountType: 'none', 
      finalPrice: 0, 
      productId: '', 
      category: ''
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (index: number) => setLineItems(lineItems.filter((_, i) => i !== index));

  const recalculateLineItem = (items: OrderItem[], index: number) => {
    const item = items[index];
    item.finalPrice = item.price * item.quantity;
  };

  const updateLineItem = (index: number, field: keyof OrderItem, value: any) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    recalculateLineItem(updatedItems, index);
    setLineItems(updatedItems);
  };

  const selectProduct = (index: number, product: Product | null) => {
    const updatedItems = [...lineItems];
    if (!product) {
      updatedItems[index] = { ...updatedItems[index], name: '', price: 0, productId: '', finalPrice: 0 };
    } else {
      updatedItems[index] = { ...updatedItems[index], name: product.name, price: product.price, productId: product.id || '', finalPrice: product.price * updatedItems[index].quantity };
    }
    recalculateLineItem(updatedItems, index);
    setLineItems(updatedItems);
  };

  const validateForm = (): string | null => {
    if (!orderNumber.trim()) return 'Order number is required';
    if (!orderDate) return 'Order date is required';
    if (!selectedParty) return 'Please select a party';
    if (lineItems.length === 0) return 'Please add at least one item';
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      if (!item.productId || !item.name) return `Please select a product for item ${i + 1}`;
      if (item.quantity <= 0) return `Quantity must be > 0 for item ${i + 1}`;
      if (item.price <= 0) return `Price must be > 0 for item ${i + 1}`;
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
        onCloseSnackbar(); // Close any existing success message
        return;
    }

    if (!selectedParty) return; // Should be caught by validation

    const orderData: Order = {
      ...(initialOrder && { id: initialOrder.id }),
      orderNumber,
      orderDate,
      dueDate: dueDate || undefined,
      partyName: selectedParty.name,
      partyId: selectedParty.id,
      partyGstin: selectedParty.gstin,
      partyAddress: selectedParty.address,
      partyPhone: selectedParty.phone,
      partyEmail: selectedParty.email,
      items: lineItems.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
        finalPrice: item.finalPrice,
        category: item.category,
        gstRate: item.gstRate,
        hsnCode: item.hsnCode,
        cgstAmount: item.cgstAmount,
        sgstAmount: item.sgstAmount,
        igstAmount: item.igstAmount,
        taxableAmount: item.taxableAmount,
        totalTaxAmount: item.totalTaxAmount,
      })),
      subtotal: totals.subtotal || 0, // Ensure default value
      discount: lineItems.reduce((sum, item) => sum + (item.price * item.quantity * item.discount / 100), 0), // Recalculate total discount
      total: totals.grandTotal || 0, // Ensure default value
      status: initialOrder?.status || 'pending', // Default status for new orders
      notes,
      terms,
      createdAt: initialOrder?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: initialOrder?.createdBy, // Preserve original creator
    };
    onSubmit(orderData);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>{initialOrder ? 'Edit Order' : 'Create New Order'}</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} component="div">
            <TextField
              fullWidth
              label="Order Number"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
              disabled={!!initialOrder} // Disable editing for existing orders
            />
          </Grid>
          <Grid item xs={12} sm={6} component="div">
            <TextField
              fullWidth
              type="date"
              label="Order Date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6} component="div">
            <TextField
              fullWidth
              type="date"
              label="Due Date (Optional)"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} component="div">
            <Autocomplete
              options={parties}
              getOptionLabel={(option) => `${option.name} ${option.gstin ? `(${option.gstin})` : ''}`}
              value={selectedParty}
              onChange={(_, newValue) => setSelectedParty(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Party"
                  placeholder="Choose a party"
                  required
                  error={!selectedParty}
                  helperText={!selectedParty ? 'Party selection is required' : ''}
                />
              )}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Order Items</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={addLineItem}>Add Item</Button>
        </Box>

        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Rate</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lineItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Box>
                      <Autocomplete
                        options={Array.isArray(products) ? products.filter(p => p.isActive !== false) : []}
                        getOptionLabel={(option) => option.name}
                        value={products.find(p => p.id === item.productId) || null}
                        onChange={(_, newValue) => selectProduct(index, newValue)}
                        renderInput={(params) => <TextField {...params} size="small" placeholder="Select product" sx={{ minWidth: 200 }} />}
                      />
                      {item.name && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          {item.name}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                      sx={{ width: 60 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={item.price}
                      onChange={(e) => updateLineItem(index, 'price', Number(e.target.value))}
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ bgcolor: '#e8f5e9', p: 0.5, borderRadius: 1, display: 'inline-block' }}>
                      <Typography variant="body2" fontWeight="bold" color="success.dark">₹{(item.price * item.quantity).toFixed(2)}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => removeLineItem(index)} color="error" size="small">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Grid container spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
          <Grid item xs={12} sm={6} md={4} component="div">
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Order Summary</Typography>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body1">Subtotal:</Typography>
                  <Typography variant="body1">₹{(totals.subtotal || 0).toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body1">Taxable Amount:</Typography>
                  <Typography variant="body1">₹{(totals.totalTaxableAmount ?? 0).toFixed(2)}</Typography>
                </Box>
                {totals.isInterState ? (
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body1">IGST:</Typography>
                    <Typography variant="body1">₹{(totals.totalIgst ?? 0).toFixed(2)}</Typography>
                  </Box>
                ) : (
                  <>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body1">CGST:</Typography>
                      <Typography variant="body1">₹{(totals.totalCgst ?? 0).toFixed(2)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body1">SGST:</Typography>
                      <Typography variant="body1">₹{(totals.totalSgst ?? 0).toFixed(2)}</Typography>
                    </Box>
                  </>
                )}
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="body1" fontWeight="bold">Total Tax:</Typography>
                  <Typography variant="body1" fontWeight="bold">₹{(totals.totalTaxAmount ?? 0).toFixed(2)}</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6">Grand Total:</Typography>
                  <Typography variant="h6">₹{(totals.grandTotal || 0).toFixed(2)}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Terms and Conditions (Optional)"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
          />
        </Box>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Order'}
          </Button>
        </Box>
      </CardContent>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={onCloseSnackbar}>
        <Alert onClose={onCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={onCloseSnackbar}>
        <Alert onClose={onCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Card>
  );
};
