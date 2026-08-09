import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  Alert,
  Autocomplete,
  InputAdornment,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Receipt as ReceiptIcon,
  Calculate as CalculateIcon,
  Person as PersonIcon,
  ShoppingCart as CartIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Order, OrderItem, OrderStatus } from '@/types/order';
import { Party } from '@/types/party';
import { Product } from '@/types/inventory';
import { OrderService } from '@/services/orderService';
import { partyService } from '@/services/partyService';
import { formatCurrency } from '@/utils/numberUtils';
import EnhancedPartySearch from '../parties/EnhancedPartySearch';

interface CreateOrderFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editOrder?: Order | null;
  userId: string;
}

interface OrderFormData {
  orderNumber: string;
  orderDate: Date;
  dueDate: Date | null;
  partyId: string;
  partyName: string;
  partyGstin: string;
  partyAddress: string;
  partyPhone: string;
  partyEmail: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  status: OrderStatus;
  notes: string;
  terms: string;
  type: 'gst' | 'regular';
  isInterState: boolean;
}

const CreateOrderForm: React.FC<CreateOrderFormProps> = ({
  open,
  onClose,
  onSuccess,
  editOrder,
  userId,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [formData, setFormData] = useState<OrderFormData>({
    orderNumber: '',
    orderDate: new Date(),
    dueDate: null,
    partyId: '',
    partyName: '',
    partyGstin: '',
    partyAddress: '',
    partyPhone: '',
    partyEmail: '',
    items: [],
    subtotal: 0,
    discount: 0,
    tax: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    total: 0,
    status: 'pending',
    notes: '',
    terms: '',
    type: 'regular',
    isInterState: false,
  });

  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [newItem, setNewItem] = useState<Partial<OrderItem>>({
    name: '',
    quantity: 1,
    rate: 0,
    unit: 'pcs',
    amount: 0,
    gstRate: 0,
  });

  // Initialize form data
  useEffect(() => {
    if (editOrder) {
      setFormData({
        orderNumber: editOrder.orderNumber,
        orderDate: new Date(editOrder.orderDate),
        dueDate: editOrder.dueDate ? new Date(editOrder.dueDate) : null,
        partyId: editOrder.partyId || '',
        partyName: editOrder.partyName,
        partyGstin: editOrder.partyGstin || '',
        partyAddress: editOrder.partyAddress || '',
        partyPhone: editOrder.partyPhone || '',
        partyEmail: editOrder.partyEmail || '',
        items: editOrder.items,
        subtotal: editOrder.subtotal,
        discount: editOrder.discount || 0,
        tax: editOrder.tax || 0,
        cgst: editOrder.cgst || 0,
        sgst: editOrder.sgst || 0,
        igst: editOrder.igst || 0,
        total: editOrder.total,
        status: editOrder.status,
        notes: editOrder.notes || '',
        terms: editOrder.terms || '',
        type: editOrder.type || 'regular',
        isInterState: editOrder.isInterState || false,
      });
    } else {
      // Generate order number for new orders
      const orderNumber = `ORD-${Date.now()}`;
      setFormData(prev => ({ ...prev, orderNumber }));
    }
  }, [editOrder, open]);

  // Calculate totals whenever items change
  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.discount, formData.isInterState]);

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const discountAmount = (subtotal * formData.discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    
    let cgst = 0, sgst = 0, igst = 0, totalTax = 0;
    
    if (formData.type === 'gst') {
      formData.items.forEach(item => {
        const itemTaxableAmount = (item.amount || 0) * (1 - formData.discount / 100);
        const itemTax = (itemTaxableAmount * (item.gstRate || 0)) / 100;
        
        if (formData.isInterState) {
          igst += itemTax;
        } else {
          cgst += itemTax / 2;
          sgst += itemTax / 2;
        }
        totalTax += itemTax;
      });
    }
    
    const total = taxableAmount + totalTax;
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      tax: totalTax,
      cgst,
      sgst,
      igst,
      total,
    }));
  };

  const handlePartySelect = (party: Party | null) => {
    setSelectedParty(party);
    if (party) {
      setFormData(prev => ({
        ...prev,
        partyId: party.id || '',
        partyName: party.name,
        partyGstin: party.gstin || '',
        partyAddress: party.address || '',
        partyPhone: party.phone || '',
        partyEmail: party.email || '',
        type: party.gstin ? 'gst' : 'regular',
      }));
    }
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.quantity || !newItem.rate) {
      setError('Please fill all item details');
      return;
    }

    const amount = (newItem.quantity || 0) * (newItem.rate || 0);
    const item: OrderItem = {
      id: Date.now().toString(),
      name: newItem.name,
      quantity: newItem.quantity || 0,
      rate: newItem.rate || 0,
      unit: newItem.unit || 'pcs',
      amount,
      gstRate: newItem.gstRate || 0,
      hsnCode: newItem.hsnCode || '',
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, item],
    }));

    // Reset new item form
    setNewItem({
      name: '',
      quantity: 1,
      rate: 0,
      unit: 'pcs',
      amount: 0,
      gstRate: 0,
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'rate') {
            updatedItem.amount = updatedItem.quantity * updatedItem.rate;
          }
          return updatedItem;
        }
        return item;
      }),
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validation
      if (!formData.partyName) {
        throw new Error('Please select a party');
      }
      if (formData.items.length === 0) {
        throw new Error('Please add at least one item');
      }

      const orderData: Order = {
        id: editOrder?.id,
        orderNumber: formData.orderNumber,
        orderDate: formData.orderDate.toISOString(),
        dueDate: formData.dueDate?.toISOString(),
        partyName: formData.partyName,
        partyId: formData.partyId,
        partyGstin: formData.partyGstin,
        partyAddress: formData.partyAddress,
        partyPhone: formData.partyPhone,
        partyEmail: formData.partyEmail,
        items: formData.items,
        subtotal: formData.subtotal,
        discount: formData.discount,
        tax: formData.tax,
        cgst: formData.cgst,
        sgst: formData.sgst,
        igst: formData.igst,
        totalTaxableAmount: formData.subtotal - (formData.subtotal * formData.discount) / 100,
        totalIgst: formData.igst,
        totalCgst: formData.cgst,
        totalSgst: formData.sgst,
        totalTaxAmount: formData.tax,
        isInterState: formData.isInterState,
        total: formData.total,
        status: formData.status,
        type: formData.type,
        notes: formData.notes,
        terms: formData.terms,
        createdAt: editOrder?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userId,
      };

      if (editOrder) {
        await OrderService.updateOrder(editOrder.id!, orderData);
      } else {
        await OrderService.createOrder(orderData);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving order:', error);
      setError(error.message || 'Failed to save order');
    } finally {
      setLoading(false);
    }
  };

  const handleNewItemChange = (field: keyof OrderItem, value: any) => {
    setNewItem(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'quantity' || field === 'rate') {
        updated.amount = (updated.quantity || 0) * (updated.rate || 0);
      }
      return updated;
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            maxHeight: '95vh',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              {editOrder ? 'Edit Order' : 'Create New Order'}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Order Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptIcon color="primary" />
                Order Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Order Number"
                    value={formData.orderNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, orderNumber: e.target.value }))}
                    disabled={!!editOrder}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="Order Date"
                    value={formData.orderDate}
                    onChange={(date) => setFormData(prev => ({ ...prev, orderDate: date || new Date() }))}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="Due Date"
                    value={formData.dueDate}
                    onChange={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as OrderStatus }))}
                      label="Status"
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="confirmed">Confirmed</MenuItem>
                      <MenuItem value="shipped">Shipped</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'gst' | 'regular' }))}
                      label="Type"
                    >
                      <MenuItem value="regular">Regular</MenuItem>
                      <MenuItem value="gst">GST</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Party Selection */}
          <EnhancedPartySearch
            userId={userId}
            onPartySelect={handlePartySelect}
            selectedParty={selectedParty}
            placeholder="Search and select a party for this order..."
            showCreateButton={false}
          />

          {/* Items Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CartIcon color="primary" />
                Order Items
              </Typography>

              {/* Add New Item Form */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Add New Item
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Item Name"
                      value={newItem.name}
                      onChange={(e) => handleNewItemChange('name', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Quantity"
                      value={newItem.quantity}
                      onChange={(e) => handleNewItemChange('quantity', parseFloat(e.target.value) || 0)}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Unit"
                      value={newItem.unit}
                      onChange={(e) => handleNewItemChange('unit', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Rate"
                      value={newItem.rate}
                      onChange={(e) => handleNewItemChange('rate', parseFloat(e.target.value) || 0)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="GST %"
                      value={newItem.gstRate}
                      onChange={(e) => handleNewItemChange('gstRate', parseFloat(e.target.value) || 0)}
                      disabled={formData.type === 'regular'}
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <Button
                      variant="contained"
                      onClick={handleAddItem}
                      startIcon={<AddIcon />}
                      fullWidth
                      size="small"
                    >
                      Add
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              {/* Items Table */}
              {formData.items.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item Name</TableCell>
                        <TableCell align="center">Qty</TableCell>
                        <TableCell align="center">Unit</TableCell>
                        <TableCell align="right">Rate</TableCell>
                        {formData.type === 'gst' && <TableCell align="center">GST%</TableCell>}
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="center">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow key={item.id || index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell align="center">{item.quantity}</TableCell>
                          <TableCell align="center">{item.unit}</TableCell>
                          <TableCell align="right">{formatCurrency(item.rate)}</TableCell>
                          {formData.type === 'gst' && (
                            <TableCell align="center">{item.gstRate}%</TableCell>
                          )}
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(item.amount || 0)}
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
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <CartIcon sx={{ fontSize: 48, mb: 1 }} />
                  <Typography>No items added yet</Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Calculations */}
          {formData.items.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalculateIcon color="primary" />
                  Calculations
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Discount %"
                      value={formData.discount}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        {formatCurrency(formData.subtotal)}
                      </Typography>
                    </Box>
                  </Grid>
                  {formData.type === 'gst' && (
                    <>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">CGST</Typography>
                          <Typography variant="h6">{formatCurrency(formData.cgst)}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">SGST</Typography>
                          <Typography variant="h6">{formatCurrency(formData.sgst)}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">IGST</Typography>
                          <Typography variant="h6">{formatCurrency(formData.igst)}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">Total Tax</Typography>
                          <Typography variant="h6">{formatCurrency(formData.tax)}</Typography>
                        </Box>
                      </Grid>
                    </>
                  )}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h5" fontWeight="bold">
                        Total Amount:
                      </Typography>
                      <Chip
                        label={formatCurrency(formData.total)}
                        color="primary"
                        sx={{ fontSize: '1.2rem', fontWeight: 'bold', py: 2, px: 1 }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Notes and Terms */}
          <Card>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Terms & Conditions"
                    value={formData.terms}
                    onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={onClose}
            startIcon={<CancelIcon />}
            disabled={loading}
            size="large"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading || formData.items.length === 0 || !formData.partyName}
            size="large"
          >
            {loading ? 'Saving...' : editOrder ? 'Update Order' : 'Create Order'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default CreateOrderForm;