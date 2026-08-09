"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Autocomplete,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  Divider,
  InputAdornment,
  Switch,
  FormControlLabel,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  Inventory as InventoryIcon,
  Person as PersonIcon,
  ShoppingCart as ShoppingCartIcon,
  Calculate as CalculateIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { EnhancedPurchaseOrder, EnhancedPurchaseItem, EnhancedSupplier } from '@/types/enhancedPurchase';
import EnhancedPurchaseEntryService from '@/services/enhancedPurchaseEntryService';
import EnhancedSupplierService from '@/services/enhancedSupplierService';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { useProducts, Product } from '@/app/hooks/useProducts';

interface PurchaseEntryFormProps {
  onSuccess?: (purchaseOrderId: string) => void;
  onCancel?: () => void;
  initialData?: Partial<EnhancedPurchaseOrder>;
}

interface FormState {
  // Basic info
  purchaseOrderNumber: string;
  date: string;
  expectedDeliveryDate: string;
  referenceNumber: string;
  
  // Supplier
  selectedSupplier: EnhancedSupplier | null;
  
  // Items
  items: EnhancedPurchaseItem[];
  
  // Additional details
  notes: string;
  terms: string;
  paymentTerms: string;
  
  // Charges
  discount: number;
  discountType: 'amount' | 'percentage';
  shippingCharges: number;
  otherCharges: number;
  otherChargesDescription: string;
  
  // Settings
  status: EnhancedPurchaseOrder['status'];
  autoUpdateStock: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export default function EnhancedPurchaseEntryForm({
  onSuccess,
  onCancel,
  initialData
}: PurchaseEntryFormProps) {
  const { userId } = useCurrentUser();
  
  // State
  const [formState, setFormState] = useState<FormState>({
    purchaseOrderNumber: '',
    date: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    referenceNumber: '',
    selectedSupplier: null,
    items: [],
    notes: '',
    terms: '',
    paymentTerms: '',
    discount: 0,
    discountType: 'amount',
    shippingCharges: 0,
    otherCharges: 0,
    otherChargesDescription: '',
    status: 'draft',
    autoUpdateStock: true,
    priority: 'medium'
  });

  // Data states
  const [suppliers, setSuppliers] = useState<EnhancedSupplier[]>([]);
  const { products, loading: loadingProducts } = useProducts();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  // UI states
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [productUnitPrice, setProductUnitPrice] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    initializeForm();
  }, [userId]);

  const initializeForm = async () => {
    try {
      setLoadingData(true);

      // Load suppliers
      const suppliersData = await EnhancedSupplierService.getActiveSuppliers(userId);
      setSuppliers(suppliersData);

      // Generate PO number
      const poNumber = await generatePurchaseOrderNumber();
      setFormState(prev => ({
        ...prev,
        purchaseOrderNumber: poNumber,
        ...initialData
      }));

    } catch (err) {
      setError('Failed to initialize form');
      console.error('Error initializing form:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // No need for fetchProducts anymore - using useProducts hook

  const generatePurchaseOrderNumber = async (): Promise<string> => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `PO-${year}${month}-${String(Date.now()).slice(-4)}`;
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = formState.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalGstAmount = formState.items.reduce((sum, item) => sum + (item.gstAmount || 0), 0);
    
    let discountAmount = 0;
    if (formState.discountType === 'percentage') {
      discountAmount = (subtotal * formState.discount) / 100;
    } else {
      discountAmount = formState.discount;
    }

    const totalAmount = subtotal + totalGstAmount + 
                       formState.shippingCharges + formState.otherCharges - discountAmount;

    return {
      subtotal,
      totalGstAmount,
      discountAmount,
      totalAmount: Math.max(0, totalAmount)
    };
  };

  // Add item to purchase order
  const handleAddItem = (product: Product, quantity: number, unitPrice: number) => {
    const gstRate = product.gstRate || 0;
    const totalPrice = quantity * unitPrice;
    const gstAmount = (totalPrice * gstRate) / 100;
    const finalAmount = totalPrice + gstAmount;

    const newItem: EnhancedPurchaseItem = {
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      description: product.description,
      category: product.category,
      currentStock: product.stock || 0,
      quantity,
      unitPrice,
      totalPrice,
      gstRate,
      gstAmount,
      finalAmount,
      receivedQuantity: 0,
      pendingQuantity: quantity,
      qualityStatus: 'pending'
    };

    setFormState(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    // Close dialog and reset
    setShowProductDialog(false);
    setSelectedProduct(null);
    setProductQuantity(1);
    setProductUnitPrice(0);
  };

  // Remove item
  const handleRemoveItem = (itemId: string) => {
    setFormState(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  // Update item quantity or price
  const handleUpdateItem = (itemId: string, field: string, value: number) => {
    setFormState(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          
          // Recalculate totals
          updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice;
          updatedItem.gstAmount = (updatedItem.totalPrice * (updatedItem.gstRate || 0)) / 100;
          updatedItem.finalAmount = updatedItem.totalPrice + updatedItem.gstAmount;
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  // Handle supplier selection
  const handleSupplierSelect = async (supplier: EnhancedSupplier | null) => {
    setFormState(prev => ({ ...prev, selectedSupplier: supplier }));
    
    if (supplier) {
      // Auto-fill payment terms if available
      if (supplier.paymentTerms) {
        setFormState(prev => ({ ...prev, paymentTerms: supplier.paymentTerms! }));
      }
      
      // Set expected delivery date based on lead time
      if (supplier.leadTime) {
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() + supplier.leadTime);
        setFormState(prev => ({ 
          ...prev, 
          expectedDeliveryDate: expectedDate.toISOString().split('T')[0] 
        }));
      }
    }
  };

  // Submit form
  const handleSubmit = async () => {
    if (!formState.selectedSupplier) {
      setError('Please select a supplier');
      return;
    }

    if (formState.items.length === 0) {
      setError('Please add at least one item');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const purchaseOrderData: Omit<EnhancedPurchaseOrder, 'id' | 'createdAt' | 'updatedAt'> = {
        purchaseOrderNumber: formState.purchaseOrderNumber,
        referenceNumber: formState.referenceNumber,
        date: formState.date,
        expectedDeliveryDate: formState.expectedDeliveryDate,
        supplierId: formState.selectedSupplier.id,
        supplierName: formState.selectedSupplier.name,
        supplierEmail: formState.selectedSupplier.email,
        supplierPhone: formState.selectedSupplier.phone,
        supplierAddress: formState.selectedSupplier.address,
        supplierGstin: formState.selectedSupplier.gstin,
        supplierContactPerson: formState.selectedSupplier.contactPerson,
        items: formState.items,
        ...calculateTotals(),
        discount: formState.discount,
        discountType: formState.discountType,
        shippingCharges: formState.shippingCharges,
        otherCharges: formState.otherCharges,
        otherChargesDescription: formState.otherChargesDescription,
        notes: formState.notes,
        terms: formState.terms,
        paymentTerms: formState.paymentTerms,
        status: formState.status,
        paymentStatus: 'pending',
        stockUpdated: false,
        autoUpdateStock: formState.autoUpdateStock,
        priority: formState.priority,
        createdBy: userId || 'system',
        userId: userId || 'system'
      };

      const result = await EnhancedPurchaseEntryService.createPurchaseEntry(
        purchaseOrderData,
        formState.autoUpdateStock
      );

      if (result.success) {
        setSuccess('Purchase order created successfully');
        if (onSuccess && result.purchaseOrderId) {
          onSuccess(result.purchaseOrderId);
        }
      } else {
        setError(result.errors?.join(', ') || 'Failed to create purchase order');
      }

    } catch (err) {
      setError('Failed to create purchase order');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData || loadingProducts) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading suppliers and products...
        </Typography>
      </Box>
    );
  }

  const totals = calculateTotals();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptIcon />
              Enhanced Purchase Entry
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {onCancel && (
                <Button variant="outlined" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Purchase Order'}
              </Button>
            </Box>
          </Box>

          {/* Basic Information */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="PO Number"
                value={formState.purchaseOrderNumber}
                onChange={(e) => setFormState(prev => ({ ...prev, purchaseOrderNumber: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={formState.date}
                onChange={(e) => setFormState(prev => ({ ...prev, date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Expected Delivery"
                type="date"
                value={formState.expectedDeliveryDate}
                onChange={(e) => setFormState(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formState.priority}
                  label="Priority"
                  onChange={(e) => setFormState(prev => ({ ...prev, priority: e.target.value as any }))}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Supplier Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon />
            Supplier Information
          </Typography>
          
          <Autocomplete
            fullWidth
            options={suppliers}
            getOptionLabel={(option) => option.name}
            value={formState.selectedSupplier}
            onChange={(_, newValue) => handleSupplierSelect(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Supplier"
                required
                error={!formState.selectedSupplier}
                helperText={!formState.selectedSupplier ? "Please select a supplier" : ""}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box>
                  <Typography variant="body1">{option.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {option.email} • {option.phone}
                  </Typography>
                </Box>
              </Box>
            )}
          />

          {/* Supplier Details */}
          {formState.selectedSupplier && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Contact Information</Typography>
                  <Typography variant="body2">
                    Contact: {formState.selectedSupplier.contactPerson || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Email: {formState.selectedSupplier.email || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Phone: {formState.selectedSupplier.phone || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Business Details</Typography>
                  <Typography variant="body2">
                    GSTIN: {formState.selectedSupplier.gstin || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Payment Terms: {formState.selectedSupplier.paymentTerms || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Lead Time: {formState.selectedSupplier.leadTime || 0} days
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Items Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShoppingCartIcon />
              Purchase Items
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setShowProductDialog(true)}
              disabled={!formState.selectedSupplier}
            >
              Add Item
            </Button>
          </Box>

          {formState.items.length === 0 ? (
            <Alert severity="info">
              No items added yet. Click "Add Item" to start adding products to your purchase order.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Stock</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">GST</TableCell>
                    <TableCell align="right">Final Amount</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formState.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {item.productName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.productCode} • {item.category}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={item.currentStock || 0}
                          size="small"
                          color={!item.currentStock || item.currentStock < (item.minStockLevel || 0) ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id!, 'quantity', parseFloat(e.target.value) || 0)}
                          inputProps={{ min: 0.01, step: 0.01 }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(item.id!, 'unitPrice', parseFloat(e.target.value) || 0)}
                          inputProps={{ min: 0.01, step: 0.01 }}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>
                          }}
                          sx={{ width: 120 }}
                        />
                      </TableCell>
                      <TableCell align="right">₹{item.totalPrice.toFixed(2)}</TableCell>
                      <TableCell align="right">₹{(item.gstAmount || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          ₹{item.finalAmount.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveItem(item.id!)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Summary and Additional Charges */}
      {formState.items.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalculateIcon />
              Order Summary & Additional Charges
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Discount"
                    type="number"
                    value={formState.discount}
                    onChange={(e) => setFormState(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">
                        {formState.discountType === 'percentage' ? '%' : '₹'}
                      </InputAdornment>,
                      endAdornment: (
                        <FormControl>
                          <Select
                            value={formState.discountType}
                            onChange={(e) => setFormState(prev => ({ ...prev, discountType: e.target.value as any }))}
                            variant="standard"
                            sx={{ minWidth: 80 }}
                          >
                            <MenuItem value="amount">Amount</MenuItem>
                            <MenuItem value="percentage">%</MenuItem>
                          </Select>
                        </FormControl>
                      )
                    }}
                  />
                  
                  <TextField
                    label="Shipping Charges"
                    type="number"
                    value={formState.shippingCharges}
                    onChange={(e) => setFormState(prev => ({ ...prev, shippingCharges: parseFloat(e.target.value) || 0 }))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>
                    }}
                  />
                  
                  <TextField
                    label="Other Charges"
                    type="number"
                    value={formState.otherCharges}
                    onChange={(e) => setFormState(prev => ({ ...prev, otherCharges: parseFloat(e.target.value) || 0 }))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>
                    }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Order Summary
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Subtotal:</Typography>
                    <Typography>₹{totals.subtotal.toFixed(2)}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>GST Amount:</Typography>
                    <Typography>₹{totals.totalGstAmount.toFixed(2)}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Shipping:</Typography>
                    <Typography>₹{formState.shippingCharges.toFixed(2)}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Other Charges:</Typography>
                    <Typography>₹{formState.otherCharges.toFixed(2)}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Discount:</Typography>
                    <Typography color="error">-₹{totals.discountAmount.toFixed(2)}</Typography>
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight="bold">Total Amount:</Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      ₹{totals.totalAmount.toFixed(2)}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Additional Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Additional Settings</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formState.status}
                  label="Status"
                  onChange={(e) => setFormState(prev => ({ ...prev, status: e.target.value as any }))}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="received">Received</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formState.autoUpdateStock}
                    onChange={(e) => setFormState(prev => ({ ...prev, autoUpdateStock: e.target.checked }))}
                  />
                }
                label="Auto Update Stock"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={formState.notes}
              onChange={(e) => setFormState(prev => ({ ...prev, notes: e.target.value }))}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Product Selection Dialog */}
      <Dialog
        open={showProductDialog}
        onClose={() => setShowProductDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Product to Purchase Order</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, mt: 1 }}>
            <Autocomplete
              fullWidth
              options={products}
              getOptionLabel={(option) => option.name}
              value={selectedProduct}
              onChange={(_, newValue) => {
                setSelectedProduct(newValue);
                if (newValue) {
                  setProductUnitPrice(newValue.price || 0);
                }
              }}
              renderInput={(params) => (
                <TextField {...params} label="Select Product" />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography variant="body1">{option.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.category} • Stock: {option.stock || 0} • ₹{option.price}
                    </Typography>
                  </Box>
                </Box>
              )}
            />
          </Box>

          {selectedProduct && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(parseFloat(e.target.value) || 1)}
                  inputProps={{ min: 0.01, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Unit Price"
                  type="number"
                  value={productUnitPrice}
                  onChange={(e) => setProductUnitPrice(parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0.01, step: 0.01 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>
                  }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowProductDialog(false)}>Cancel</Button>
          <Button
            onClick={() => selectedProduct && handleAddItem(selectedProduct, productQuantity, productUnitPrice)}
            variant="contained"
            disabled={!selectedProduct || productQuantity <= 0 || productUnitPrice <= 0}
          >
            Add Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for messages */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}