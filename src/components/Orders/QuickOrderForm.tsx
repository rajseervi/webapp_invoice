"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Grid,
  Box,
  Typography,
  IconButton,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  InputAdornment,
  Card,
  CardContent,
  Divider,
  useTheme,
  alpha
} from '@mui/material';

import {
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as ShoppingCartIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';

import { Party } from '@/types/party';
import { Product } from '@/types/inventory';
import { Order, OrderItem } from '@/types/order';
import { partyService } from '@/services/partyService';
import { productService } from '@/services/productService';
import { OrderService } from '@/services/orderService';

interface QuickOrderItem {
  product: Product;
  quantity: number;
}

interface QuickOrderFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (order: Order) => void;
}

export const QuickOrderForm: React.FC<QuickOrderFormProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const theme = useTheme();
  
  // State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [quickItems, setQuickItems] = useState<QuickOrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  // Data sources
  const [parties, setParties] = useState<Party[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);

  // Load data
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [partiesData, productsData] = await Promise.all([
        partyService.getAllParties(),
        productService.getProducts()
      ]);

      setParties(partiesData || []);
      setProducts(productsData.products || []);
      setPopularProducts((productsData.products || []).filter(p => p.isPopular).slice(0, 6));
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Add product to quick items
  const addQuickItem = useCallback(() => {
    if (!selectedProduct || quantity <= 0) return;

    const existingIndex = quickItems.findIndex(item => item.product.id === selectedProduct.id);
    
    if (existingIndex >= 0) {
      // Update existing item
      const updated = [...quickItems];
      updated[existingIndex].quantity += quantity;
      setQuickItems(updated);
    } else {
      // Add new item
      setQuickItems(prev => [...prev, { product: selectedProduct, quantity }]);
    }

    // Reset form
    setSelectedProduct(null);
    setQuantity(1);
  }, [selectedProduct, quantity, quickItems]);

  // Add popular product
  const addPopularProduct = useCallback((product: Product) => {
    const existingIndex = quickItems.findIndex(item => item.product.id === product.id);
    
    if (existingIndex >= 0) {
      const updated = [...quickItems];
      updated[existingIndex].quantity += 1;
      setQuickItems(updated);
    } else {
      setQuickItems(prev => [...prev, { product, quantity: 1 }]);
    }
  }, [quickItems]);

  // Update item quantity
  const updateItemQuantity = useCallback((index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setQuickItems(prev => prev.filter((_, i) => i !== index));
    } else {
      const updated = [...quickItems];
      updated[index].quantity = newQuantity;
      setQuickItems(updated);
    }
  }, []);

  // Remove item
  const removeItem = useCallback((index: number) => {
    setQuickItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Calculate totals
  const totals = React.useMemo(() => {
    const subtotal = quickItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    return {
      subtotal,
      itemCount: quickItems.length,
      totalQuantity: quickItems.reduce((sum, item) => sum + item.quantity, 0)
    };
  }, [quickItems]);

  // Submit order
  const handleSubmit = async () => {
    if (!selectedParty || quickItems.length === 0) {
      setError('Please select a customer and add at least one product');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const orderNumber = await OrderService.getLatestOrderNumber();
      
      const orderData: Order = {
        orderNumber,
        orderDate: new Date().toISOString().split('T')[0],
        partyName: selectedParty.name,
        partyId: selectedParty.id,
        partyGstin: selectedParty.gstin,
        partyAddress: selectedParty.address,
        partyPhone: selectedParty.phone,
        partyEmail: selectedParty.email,
        items: quickItems.map(item => ({
          productId: item.product.id || '',
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          discount: 0,
          finalPrice: item.product.price * item.quantity,
          category: item.product.category,
          gstRate: item.product.gstRate,
          hsnCode: item.product.hsnCode,
          discountType: 'none'
        })),
        subtotal: totals.subtotal,
        total: totals.subtotal,
        status: 'pending',
        createdAt: new Date().toISOString(),
        type: 'regular'
      };

      const newOrder = await OrderService.createOrder(orderData);
      onSuccess(newOrder!);
      handleClose();
    } catch (err: any) {
      console.error('Error creating quick order:', err);
      setError(err.message || 'Failed to create order');
    } finally {
      setSaving(false);
    }
  };

  // Close and reset
  const handleClose = () => {
    setSelectedParty(null);
    setQuickItems([]);
    setSelectedProduct(null);
    setQuantity(1);
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '70vh'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SpeedIcon />
            <Typography variant="h6" fontWeight={700}>
              Quick Order
            </Typography>
            <Chip label="Fast Entry" size="small" color="primary" />
          </Box>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Customer Selection */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="primary" />
                Select Customer
              </Typography>
              <Autocomplete
                options={parties}
                getOptionLabel={(option) => `${option.name} ${option.gstin ? `(${option.gstin})` : ''}`}
                value={selectedParty}
                onChange={(_, newValue) => setSelectedParty(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search customer..."
                    fullWidth
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {option.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.gstin && `GSTIN: ${option.gstin} • `}
                        {option.phone}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Box>

            {/* Popular Products */}
            {popularProducts.length > 0 && (
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Popular Products
                </Typography>
                <Grid container spacing={1}>
                  {popularProducts.map((product) => (
                    <Grid item xs={6} sm={4} key={product.id}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'scale(1.02)',
                            boxShadow: theme.shadows[4]
                          }
                        }}
                        onClick={() => addPopularProduct(product)}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {product.name}
                          </Typography>
                          <Typography variant="body2" color="primary" fontWeight={600}>
                            ₹{product.price}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Stock: {product.stock || 0}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Product Selection */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InventoryIcon color="primary" />
                Add Products
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={products}
                    getOptionLabel={(option) => option.name}
                    value={selectedProduct}
                    onChange={(_, newValue) => setSelectedProduct(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Search products..."
                        fullWidth
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {option.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ₹{option.price} • Stock: {option.stock || 0}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    type="number"
                    label="Quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    inputProps={{ min: 1 }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Button
                    variant="contained"
                    onClick={addQuickItem}
                    disabled={!selectedProduct || quantity <= 0}
                    startIcon={<AddIcon />}
                    fullWidth
                  >
                    Add
                  </Button>
                </Grid>
              </Grid>
            </Box>

            {/* Order Items */}
            {quickItems.length > 0 && (
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Order Items ({quickItems.length})
                </Typography>
                <Stack spacing={1}>
                  {quickItems.map((item, index) => (
                    <Card key={index} variant="outlined">
                      <CardContent sx={{ py: 2 }}>
                        <Grid container alignItems="center" spacing={2}>
                          <Grid item xs={12} sm={5}>
                            <Typography variant="body2" fontWeight={600}>
                              {item.product.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ₹{item.product.price} each
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <IconButton
                                size="small"
                                onClick={() => updateItemQuantity(index, item.quantity - 1)}
                              >
                                <RemoveIcon />
                              </IconButton>
                              <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>
                                {item.quantity}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => updateItemQuantity(index, item.quantity + 1)}
                              >
                                <AddIcon />
                              </IconButton>
                            </Stack>
                          </Grid>
                          <Grid item xs={4} sm={3}>
                            <Typography variant="body2" fontWeight={600} color="success.main">
                              ₹{(item.product.price * item.quantity).toFixed(2)}
                            </Typography>
                          </Grid>
                          <Grid item xs={2} sm={1}>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeItem(index)}
                            >
                              <CloseIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Order Summary */}
            {quickItems.length > 0 && (
              <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom color="success.main">
                    Order Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h6" color="primary" fontWeight={700}>
                          {totals.itemCount}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Items
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h6" color="primary" fontWeight={700}>
                          {totals.totalQuantity}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Quantity
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h5" color="success.main" fontWeight={700}>
                          ₹{totals.subtotal.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!selectedParty || quickItems.length === 0 || saving}
          startIcon={saving ? <CircularProgress size={20} /> : <CheckCircleIcon />}
        >
          {saving ? 'Creating...' : 'Create Order'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickOrderForm;