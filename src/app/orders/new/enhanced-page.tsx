"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Grid,
  TextField,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Divider,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Avatar,
  Badge,
  Tooltip,
  Fab,
  Zoom,
  Slide,
  Fade,
  useTheme,
  alpha,
  LinearProgress,
  Skeleton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Snackbar,
  SnackbarContent
} from '@mui/material';

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ShoppingCart as ShoppingCartIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Calculate as CalculateIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
  LocalShipping as LocalShippingIcon,
  Schedule as ScheduleIcon,
  AttachMoney as AttachMoneyIcon,
  Percent as PercentIcon,
  Speed as SpeedIcon,
  AutoAwesome as AutoAwesomeIcon,
  SmartToy as SmartToyIcon,
  Psychology as PsychologyIcon,
  Lightbulb as LightbulbIcon,
  Star as StarIcon,
  History as HistoryIcon,
  Favorite as FavoriteIcon,
  ThumbUp as ThumbUpIcon,
  Analytics as AnalyticsIcon,
  Timeline as TimelineIcon,
  Insights as InsightsIcon
} from '@mui/icons-material';

import { Party } from '@/types/party';
import { Product } from '@/types/inventory';
import { Order, OrderItem, OrderStatus } from '@/types/order';
import { partyService } from '@/services/partyService';
import { productService } from '@/services/productService';
import { OrderService } from '@/services/orderService';

// Enhanced interfaces
interface EnhancedOrderItem extends OrderItem {
  id?: string;
  availableStock?: number;
  suggestedPrice?: number;
  lastOrderPrice?: number;
  margin?: number;
  isPopular?: boolean;
  reorderLevel?: number;
  category?: string;
  brand?: string;
  unit?: string;
  taxRate?: number;
  discountPercent?: number;
  notes?: string;
}

interface OrderSuggestion {
  type: 'frequent' | 'seasonal' | 'bundle' | 'upsell';
  title: string;
  description: string;
  products: Product[];
  confidence: number;
  potentialValue: number;
}

interface SmartInsight {
  type: 'warning' | 'info' | 'success' | 'tip';
  title: string;
  message: string;
  action?: string;
  actionCallback?: () => void;
}

const steps = [
  'Customer Selection',
  'Product Selection', 
  'Order Details',
  'Review & Confirm'
];

const EnhancedNewOrderPage: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();
  
  // Core state
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Order data
  const [orderNumber, setOrderNumber] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [orderItems, setOrderItems] = useState<EnhancedOrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('Standard payment terms apply');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<OrderStatus>('pending');

  // Data sources
  const [parties, setParties] = useState<Party[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  // Smart features
  const [suggestions, setSuggestions] = useState<OrderSuggestion[]>([]);
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  // UI state
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);
  const [quickAddMode, setQuickAddMode] = useState(false);

  // Calculations
  const totals = useMemo(() => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalDiscount = orderItems.reduce((sum, item) => 
      sum + (item.price * item.quantity * (item.discountPercent || 0) / 100), 0);
    const taxableAmount = subtotal - totalDiscount;
    const totalTax = orderItems.reduce((sum, item) => 
      sum + (item.price * item.quantity * (item.taxRate || 0) / 100), 0);
    const grandTotal = taxableAmount + totalTax;

    return {
      subtotal,
      totalDiscount,
      taxableAmount,
      totalTax,
      grandTotal,
      itemCount: orderItems.length,
      totalQuantity: orderItems.reduce((sum, item) => sum + item.quantity, 0)
    };
  }, [orderItems]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [partiesData, productsData, orderNumberData] = await Promise.all([
          partyService.getAllParties(),
          productService.getProducts(),
          OrderService.getLatestOrderNumber()
        ]);

        setParties(partiesData || []);
        setProducts(productsData.products || []);
        setFilteredProducts(productsData.products || []);
        setOrderNumber(orderNumberData);

        // Generate initial insights
        generateSmartInsights(partiesData || [], productsData.products || []);
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Smart insights generation
  const generateSmartInsights = useCallback((partiesData: Party[], productsData: Product[]) => {
    const newInsights: SmartInsight[] = [];

    // Low stock warnings
    const lowStockProducts = productsData.filter(p => (p.stock || 0) < (p.reorderLevel || 10));
    if (lowStockProducts.length > 0) {
      newInsights.push({
        type: 'warning',
        title: 'Low Stock Alert',
        message: `${lowStockProducts.length} products are running low on stock`,
        action: 'View Products'
      });
    }

    // Popular products tip
    const popularProducts = productsData.filter(p => p.isPopular).slice(0, 3);
    if (popularProducts.length > 0) {
      newInsights.push({
        type: 'tip',
        title: 'Popular Products',
        message: `Consider adding ${popularProducts.map(p => p.name).join(', ')} - they're trending!`
      });
    }

    // Customer insights
    if (partiesData.length > 0) {
      newInsights.push({
        type: 'info',
        title: 'Customer Base',
        message: `You have ${partiesData.length} active customers. ${partiesData.filter(p => p.isActive).length} are currently active.`
      });
    }

    setInsights(newInsights);
  }, []);

  // Product search and filtering
  useEffect(() => {
    if (!productSearchTerm.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.hsnCode?.includes(productSearchTerm)
    );
    setFilteredProducts(filtered);
  }, [productSearchTerm, products]);

  // Generate suggestions based on selected party
  useEffect(() => {
    if (selectedParty && products.length > 0) {
      generateOrderSuggestions();
    }
  }, [selectedParty, products]);

  const generateOrderSuggestions = useCallback(() => {
    if (!selectedParty) return;

    const newSuggestions: OrderSuggestion[] = [];

    // Frequent items suggestion
    const frequentProducts = products.filter(p => p.isPopular).slice(0, 3);
    if (frequentProducts.length > 0) {
      newSuggestions.push({
        type: 'frequent',
        title: 'Frequently Ordered',
        description: 'Based on popular products',
        products: frequentProducts,
        confidence: 85,
        potentialValue: frequentProducts.reduce((sum, p) => sum + p.price, 0)
      });
    }

    // Bundle suggestion
    const bundleProducts = products.filter(p => p.category === 'Electronics').slice(0, 2);
    if (bundleProducts.length >= 2) {
      newSuggestions.push({
        type: 'bundle',
        title: 'Bundle Deal',
        description: 'Save with this product combination',
        products: bundleProducts,
        confidence: 70,
        potentialValue: bundleProducts.reduce((sum, p) => sum + p.price, 0) * 0.9
      });
    }

    setSuggestions(newSuggestions);
  }, [selectedParty, products]);

  // Order item management
  const addOrderItem = useCallback((product?: Product) => {
    const newItem: EnhancedOrderItem = {
      id: `item-${Date.now()}`,
      productId: product?.id || '',
      name: product?.name || '',
      quantity: 1,
      price: product?.price || 0,
      discount: 0,
      discountType: 'none',
      finalPrice: product?.price || 0,
      category: product?.category || '',
      availableStock: product?.stock || 0,
      suggestedPrice: product?.price || 0,
      unit: product?.unit || 'pcs',
      taxRate: product?.gstRate || 0,
      discountPercent: 0,
      isPopular: product?.isPopular || false
    };

    setOrderItems(prev => [...prev, newItem]);
  }, []);

  const updateOrderItem = useCallback((index: number, field: keyof EnhancedOrderItem, value: any) => {
    setOrderItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Auto-calculate final price
      if (field === 'quantity' || field === 'price' || field === 'discountPercent') {
        const item = updated[index];
        const baseAmount = item.price * item.quantity;
        const discountAmount = baseAmount * (item.discountPercent || 0) / 100;
        updated[index].finalPrice = baseAmount - discountAmount;
      }
      
      return updated;
    });
  }, []);

  const removeOrderItem = useCallback((index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Step navigation
  const handleNext = () => {
    if (activeStep === 0 && !selectedParty) {
      setError('Please select a customer first');
      return;
    }
    if (activeStep === 1 && orderItems.length === 0) {
      setError('Please add at least one product');
      return;
    }
    setActiveStep(prev => prev + 1);
    setError(null);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Form submission
  const handleSubmit = async () => {
    if (!selectedParty || orderItems.length === 0) {
      setError('Please complete all required fields');
      return;
    }

    setSaving(true);
    try {
      const orderData: Order = {
        orderNumber,
        orderDate,
        dueDate: dueDate || undefined,
        partyName: selectedParty.name,
        partyId: selectedParty.id,
        partyGstin: selectedParty.gstin,
        partyAddress: selectedParty.address,
        partyPhone: selectedParty.phone,
        partyEmail: selectedParty.email,
        items: orderItems.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discountPercent || 0,
          finalPrice: item.finalPrice,
          category: item.category,
          gstRate: item.taxRate,
          hsnCode: item.hsnCode,
          discountType: 'percentage'
        })),
        subtotal: totals.subtotal,
        discount: totals.totalDiscount,
        total: totals.grandTotal,
        status,
        notes,
        terms,
        createdAt: new Date().toISOString(),
        type: 'regular'
      };

      const newOrder = await OrderService.createOrder(orderData);
      setSuccess(`Order ${newOrder?.orderNumber} created successfully!`);
      
      setTimeout(() => {
        router.push(`/orders/${newOrder?.id}`);
      }, 2000);
    } catch (err: any) {
      console.error('Error creating order:', err);
      setError(err.message || 'Failed to create order');
    } finally {
      setSaving(false);
    }
  };

  // Step content renderers
  const renderCustomerSelection = () => (
    <Fade in timeout={600}>
      <Box>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          Select Customer
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Autocomplete
              options={parties}
              getOptionLabel={(option) => `${option.name} ${option.gstin ? `(${option.gstin})` : ''}`}
              value={selectedParty}
              onChange={(_, newValue) => setSelectedParty(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search and select customer"
                  placeholder="Type customer name or GSTIN..."
                  fullWidth
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.main }}>
                    {option.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      {option.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.gstin && `GSTIN: ${option.gstin} • `}
                      {option.phone && `Phone: ${option.phone}`}
                    </Typography>
                  </Box>
                </Box>
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<AddIcon />}
              onClick={() => router.push('/parties/new')}
              sx={{ height: 56 }}
            >
              Add New Customer
            </Button>
          </Grid>
        </Grid>

        {selectedParty && (
          <Slide direction="up" in timeout={400}>
            <Card sx={{ mt: 3, border: `2px solid ${theme.palette.success.main}` }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: theme.palette.success.main, width: 56, height: 56 }}>
                    <CheckCircleIcon />
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="h6" color="success.main">
                      {selectedParty.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedParty.address}
                    </Typography>
                    {selectedParty.gstin && (
                      <Chip label={`GSTIN: ${selectedParty.gstin}`} size="small" sx={{ mt: 1 }} />
                    )}
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary">
                      Contact
                    </Typography>
                    <Typography variant="body2">
                      {selectedParty.phone}
                    </Typography>
                    <Typography variant="body2">
                      {selectedParty.email}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Slide>
        )}
      </Box>
    </Fade>
  );

  const renderProductSelection = () => (
    <Fade in timeout={600}>
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCartIcon color="primary" />
            Add Products
          </Typography>
          <Stack direction="row" spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={quickAddMode}
                  onChange={(e) => setQuickAddMode(e.target.checked)}
                />
              }
              label="Quick Add Mode"
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => addOrderItem()}
            >
              Add Item
            </Button>
          </Stack>
        </Stack>

        {/* Product Search */}
        <TextField
          fullWidth
          placeholder="Search products by name, category, or HSN code..."
          value={productSearchTerm}
          onChange={(e) => setProductSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: productSearchTerm && (
              <InputAdornment position="end">
                <IconButton onClick={() => setProductSearchTerm('')}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        {/* Smart Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmartToyIcon color="secondary" />
              Smart Suggestions
            </Typography>
            <Grid container spacing={2}>
              {suggestions.map((suggestion, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[8]
                      }
                    }}
                    onClick={() => {
                      suggestion.products.forEach(product => addOrderItem(product));
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" color="primary">
                          {suggestion.title}
                        </Typography>
                        <Chip 
                          label={`${suggestion.confidence}%`} 
                          size="small" 
                          color="success"
                          variant="outlined"
                        />
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {suggestion.description}
                      </Typography>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption">
                          {suggestion.products.length} products
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color="success.main">
                          ₹{suggestion.potentialValue.toFixed(2)}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Quick Add Products Grid */}
        {quickAddMode && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Quick Add Products
            </Typography>
            <Grid container spacing={2}>
              {filteredProducts.slice(0, 8).map((product) => (
                <Grid item xs={6} sm={4} md={3} key={product.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      height: '100%',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: theme.shadows[4]
                      }
                    }}
                    onClick={() => addOrderItem(product)}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Stack spacing={1}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {product.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Stock: {product.stock || 0}
                        </Typography>
                        <Typography variant="body2" color="primary" fontWeight={600}>
                          ₹{product.price}
                        </Typography>
                        {product.isPopular && (
                          <Chip label="Popular" size="small" color="warning" />
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Order Items Table */}
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell align="center">Stock</TableCell>
                <TableCell align="center">Qty</TableCell>
                <TableCell align="right">Rate</TableCell>
                <TableCell align="center">Discount %</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orderItems.map((item, index) => (
                <TableRow key={item.id || index}>
                  <TableCell>
                    <Box>
                      <Autocomplete
                        options={products}
                        getOptionLabel={(option) => option.name}
                        value={products.find(p => p.id === item.productId) || null}
                        onChange={(_, newValue) => {
                          if (newValue) {
                            updateOrderItem(index, 'productId', newValue.id);
                            updateOrderItem(index, 'name', newValue.name);
                            updateOrderItem(index, 'price', newValue.price);
                            updateOrderItem(index, 'availableStock', newValue.stock);
                            updateOrderItem(index, 'category', newValue.category);
                            updateOrderItem(index, 'taxRate', newValue.gstRate);
                          }
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            size="small"
                            placeholder="Select product"
                            sx={{ minWidth: 200 }}
                          />
                        )}
                      />
                      {item.isPopular && (
                        <Chip label="Popular" size="small" color="warning" sx={{ mt: 0.5 }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={item.availableStock || 0}
                      size="small"
                      color={
                        (item.availableStock || 0) > item.quantity ? 'success' :
                        (item.availableStock || 0) > 0 ? 'warning' : 'error'
                      }
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      size="small"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateOrderItem(index, 'quantity', Number(e.target.value))}
                      sx={{ width: 80 }}
                      inputProps={{ min: 1 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      value={item.price}
                      onChange={(e) => updateOrderItem(index, 'price', Number(e.target.value))}
                      sx={{ width: 100 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      size="small"
                      type="number"
                      value={item.discountPercent || 0}
                      onChange={(e) => updateOrderItem(index, 'discountPercent', Number(e.target.value))}
                      sx={{ width: 80 }}
                      inputProps={{ min: 0, max: 100 }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      ₹{item.finalPrice.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={() => removeOrderItem(index)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {orderItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No products added yet. Click "Add Item" or use Quick Add mode.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Order Summary */}
        {orderItems.length > 0 && (
          <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary" fontWeight={700}>
                      {totals.itemCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Items
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary" fontWeight={700}>
                      {totals.totalQuantity}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Quantity
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="warning.main" fontWeight={700}>
                      ₹{totals.totalDiscount.toFixed(0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Discount
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main" fontWeight={700}>
                      ₹{totals.grandTotal.toFixed(0)}
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
      </Box>
    </Fade>
  );

  const renderOrderDetails = () => (
    <Fade in timeout={600}>
      <Box>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon color="primary" />
          Order Details
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Order Number"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              disabled
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ReceiptIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Order Date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ScheduleIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Due Date (Optional)"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocalShippingIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={['low', 'medium', 'high']}
              value={priority}
              onChange={(_, newValue) => setPriority(newValue as any)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Priority"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SpeedIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Chip
                    label={option}
                    color={
                      option === 'high' ? 'error' :
                      option === 'medium' ? 'warning' : 'success'
                    }
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  {option.charAt(0).toUpperCase() + option.slice(1)} Priority
                </Box>
              )}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Order Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special instructions or notes for this order..."
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Terms & Conditions"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
            />
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );

  const renderReviewConfirm = () => (
    <Fade in timeout={600}>
      <Box>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon color="primary" />
          Review & Confirm Order
        </Typography>
        
        <Grid container spacing={3}>
          {/* Customer Info */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Customer Information
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Name:</strong> {selectedParty?.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>GSTIN:</strong> {selectedParty?.gstin || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Phone:</strong> {selectedParty?.phone}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Email:</strong> {selectedParty?.email}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Address:</strong> {selectedParty?.address}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Order Info */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Order Information
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Order Number:</strong> {orderNumber}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Order Date:</strong> {new Date(orderDate).toLocaleDateString()}
                  </Typography>
                  {dueDate && (
                    <Typography variant="body2">
                      <strong>Due Date:</strong> {new Date(dueDate).toLocaleDateString()}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    <strong>Priority:</strong> 
                    <Chip
                      label={priority}
                      color={
                        priority === 'high' ? 'error' :
                        priority === 'medium' ? 'warning' : 'success'
                      }
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Order Items */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Order Items ({orderItems.length})
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="center">Qty</TableCell>
                        <TableCell align="right">Rate</TableCell>
                        <TableCell align="center">Discount</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {item.name}
                              </Typography>
                              {item.category && (
                                <Typography variant="caption" color="text.secondary">
                                  {item.category}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="center">{item.quantity}</TableCell>
                          <TableCell align="right">₹{item.price.toFixed(2)}</TableCell>
                          <TableCell align="center">
                            {item.discountPercent ? `${item.discountPercent}%` : '-'}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>
                              ₹{item.finalPrice.toFixed(2)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Order Summary */}
          <Grid item xs={12}>
            <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom color="success.main">
                  Order Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h5" color="primary" fontWeight={700}>
                        {totals.itemCount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Items
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h5" color="primary" fontWeight={700}>
                        ₹{totals.subtotal.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Subtotal
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h5" color="warning.main" fontWeight={700}>
                        ₹{totals.totalDiscount.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Discount
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main" fontWeight={700}>
                        ₹{totals.grandTotal.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Grand Total
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderCustomerSelection();
      case 1:
        return renderProductSelection();
      case 2:
        return renderOrderDetails();
      case 3:
        return renderReviewConfirm();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={300} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Create New Order
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Follow the steps below to create a comprehensive sales order
        </Typography>
      </Box>

      {/* Smart Insights */}
      {insights.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2}>
            {insights.map((insight, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Alert 
                  severity={insight.type === 'tip' ? 'info' : insight.type}
                  action={
                    insight.action && (
                      <Button color="inherit" size="small">
                        {insight.action}
                      </Button>
                    )
                  }
                >
                  <Typography variant="subtitle2">{insight.title}</Typography>
                  {insight.message}
                </Alert>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel
                StepIconProps={{
                  style: {
                    color: index <= activeStep ? theme.palette.primary.main : theme.palette.grey[400]
                  }
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step Content */}
      <Paper sx={{ p: 4, mb: 4, minHeight: 400 }}>
        {getStepContent(activeStep)}
      </Paper>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          variant="outlined"
          size="large"
        >
          Back
        </Button>
        
        <Box sx={{ flex: 1, mx: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={(activeStep + 1) / steps.length * 100}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
        
        {activeStep === steps.length - 1 ? (
          <Button
            onClick={handleSubmit}
            variant="contained"
            size="large"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {saving ? 'Creating Order...' : 'Create Order'}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            variant="contained"
            size="large"
          >
            Next
          </Button>
        )}
      </Box>

      {/* Floating Action Button for Quick Actions */}
      <Zoom in timeout={600}>
        <Fab
          color="secondary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000
          }}
          onClick={() => setShowSuggestions(!showSuggestions)}
        >
          <AutoAwesomeIcon />
        </Fab>
      </Zoom>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EnhancedNewOrderPage;