"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Autocomplete,
  InputAdornment,
  Divider,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
  Card,
  CardContent,
  alpha,
  Stepper,
  Step,
  StepLabel,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon, 
  Person as PersonIcon, 
  Payment as PaymentIcon,
  AttachMoney as AttachMoneyIcon,
  Home as HomeIcon,
  ShoppingCart as ShoppingCartIcon,
  ShoppingBasket as ShoppingBasketIcon,
  Inventory as InventoryIcon,
  Info as InfoIcon,
  Receipt as ReceiptIcon,
  Discount as DiscountIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { orderService } from '@/services/orderService';
import { productService } from '@/services/productService';
import { partyService } from '@/services/partyService';
import type { Order, OrderFormData, OrderItem } from '@/types/order';
import { OrderStatus, PaymentStatus } from '@/types/order';
import type { Product } from '@/types/inventory';
import type { Party } from '@/types/party';
import { formatCurrency } from '@/utils/numberUtils';

export default function NewOrderPage() {
  const router = useRouter();

  // Define step states
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Select Customer', 'Add Products', 'Review & Complete'];
  
  // Function to handle step navigation
  const handleNextStep = () => {
    if (activeStep === 0 && !formData.partyId) {
      setFormErrors({ ...formErrors, partyId: 'Customer is required' });
      return;
    }
    
    if (activeStep === 1 && formData.items.length === 0) {
      setFormErrors({ ...formErrors, items: 'At least one product is required' });
      return;
    }
    
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  const handleBackStep = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // State for form data
  const [formData, setFormData] = useState<Omit<OrderFormData, 'orderNumber'>>({
    partyId: '',
    partyName: '',
    items: [],
    subtotal: 0,
    discount: 0,
    tax: 0,
    shipping: 0,
    total: 0,
    status: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING
  });

  // State for form validation
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // State for loading and error handling
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [partiesLoading, setPartiesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // State for products and parties
  const [products, setProducts] = useState<Product[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);

  // State for the current product being added
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [currentQuantity, setCurrentQuantity] = useState(1);

  // Add this line to define the missing state variable
  const [appliedDiscountPercentage, setAppliedDiscountPercentage] = useState(0);

  // Fetch products and parties
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        setProductsLoading(true);
        const productsData = await productService.getProductsWithDiscounts();


        setProducts(productsData);
        setProductsLoading(false);

        // Fetch parties
        setPartiesLoading(true);
        const partiesData = await partyService.getParties();
        setParties(partiesData);
        setPartiesLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
        setProductsLoading(false);
        setPartiesLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate totals whenever items, discount, tax, or shipping changes
  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);

    // Calculate party discount if applicable
    let discountPercentage = 0;
    let discount = 0;

    if (selectedParty) {
      // Check if this is the party's first order
      const isFirstOrder = selectedParty.orderCount === 0;

      // Apply first order discount if applicable (assuming you have a config for this)
      if (isFirstOrder && selectedParty.firstOrderDiscountPercentage) {
        discountPercentage = selectedParty.firstOrderDiscountPercentage;
      }
      // Otherwise apply regular party discount
      else if (selectedParty.discountPercentage) {
        discountPercentage = selectedParty.discountPercentage;
      }

      // Calculate the actual discount amount
      discount = subtotal * discountPercentage / 100;
    }

    setAppliedDiscountPercentage(discountPercentage);
    const total = subtotal - discount + formData.tax + formData.shipping;

    setFormData(prev => ({
      ...prev,
      subtotal,
      discount,
      total
    }));
  }, [formData.items, formData.tax, formData.shipping, selectedParty]);

  // Handle party selection
  const handlePartyChange = (event: any, newValue: Party | null) => {
    if (newValue) {
      setSelectedParty(newValue);

      // Calculate discount percentage based on party
      let discountPercentage = 0;

      // Check if this is the party's first order
      const isFirstOrder = newValue.orderCount === 0;

      // Apply first order discount if applicable
      if (isFirstOrder && newValue.firstOrderDiscountPercentage) {
        discountPercentage = newValue.firstOrderDiscountPercentage;
      }
      // Otherwise apply regular party discount
      else if (newValue.discountPercentage) {
        discountPercentage = newValue.discountPercentage;
      }

      // Calculate the actual discount amount
      const discount = formData.subtotal * discountPercentage / 100;

      setAppliedDiscountPercentage(discountPercentage);
      setFormData(prev => ({
        ...prev,
        partyId: newValue.id || '',
        partyName: newValue.name,
        discount
      }));

      // Clear error if exists
      if (formErrors.partyId) {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.partyId;
          return newErrors;
        });
      }
    } else {
      setSelectedParty(null);
      setAppliedDiscountPercentage(0);
      setFormData(prev => ({
        ...prev,
        partyId: '',
        partyName: '',
        discount: 0 // Reset discount when party is cleared
      }));
    }
  };

  // Handle product selection
  const handleProductChange = (event: any, newValue: Product | null) => {
    setCurrentProduct(newValue);
  };

  // Handle quantity change
  const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    setCurrentQuantity(isNaN(value) || value < 1 ? 1 : value);
  };

  // Add product to order
  const handleAddProduct = () => {
    if (!currentProduct) return;

    // Check if product already exists in the order
    const existingItemIndex = formData.items.findIndex(item => item.productId === currentProduct.id);

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...formData.items];
      const existingItem = updatedItems[existingItemIndex];
      const newQuantity = existingItem.quantity + currentQuantity;

      // Check if we have enough stock
      if (currentProduct.quantity < newQuantity) {
        setError(`Only ${currentProduct.quantity} units available for ${currentProduct.name}`);
        return;
      }

      const price = currentProduct.discountedPrice || currentProduct.price || 0; // Use 0 if price is undefined
      const total = price * newQuantity;

      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        price: currentProduct.price || 0, // Ensure price has a default value
        discountedPrice: currentProduct.discountedPrice === undefined ? null : currentProduct.discountedPrice, // Prefer null over undefined
        total: total
      };

      setFormData(prev => ({
        ...prev,
        items: updatedItems
      }));
    } else {
      // Check if we have enough stock
      if (currentProduct.quantity < currentQuantity) {
        setError(`Only ${currentProduct.quantity} units available for ${currentProduct.name}`);
        return;
      }

      // Add new item
      const price = currentProduct.discountedPrice || currentProduct.price || 0; // Use 0 if price is undefined
      const total = price * currentQuantity;

      const newItem: OrderItem = {
        productId: currentProduct.id || '', // Default for productId
        name: currentProduct.name || '', // Default for name
        sku: currentProduct.sku || '', // Default for sku
        quantity: currentQuantity,
        price: currentProduct.price || 0, // Default for price
        discountedPrice: currentProduct.discountedPrice === undefined ? null : currentProduct.discountedPrice, // Prefer null over undefined
        total: total
      };

      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
    }

    // Reset current product and quantity
    setCurrentProduct(null);
    setCurrentQuantity(1);
  };

  // Remove product from order
  const handleRemoveProduct = (index: number) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);

    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  // Handle input change for form fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;

    if (!name) return;

    // Clear error if exists
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Handle numeric fields
    if (name === 'discount' || name === 'tax' || name === 'shipping') {
      const numValue = parseFloat(value as string);
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? 0 : numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.partyId) {
      errors.partyId = 'Customer is required';
    }

    if (formData.items.length === 0) {
      errors.items = 'At least one product is required';
    }

    if (formData.total <= 0) {
      errors.total = 'Total amount must be greater than zero';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle shipping cost change
  const handleShippingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    setFormData(prev => ({
      ...prev,
      shipping: isNaN(value) ? 0 : value
    }));
  };

  // Handle tax amount change
  const handleTaxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    setFormData(prev => ({
      ...prev,
      tax: isNaN(value) ? 0 : value
    }));
  };

  // Handle notes change
  const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      notes: event.target.value
    }));
  };

  // Handle updating an item in the order
  const handleUpdateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate total if price or quantity changes
    if (field === 'price' || field === 'quantity') {
      const quantity = field === 'quantity' ? value : updatedItems[index].quantity;
      const price = field === 'price' ? value : updatedItems[index].price;
      updatedItems[index].total = quantity * price;
    }
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Construct the order object with default values for all fields
      const orderToCreate: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'orderNumber'> = {
        partyId: selectedParty?.id || '',
        partyName: selectedParty?.name || '',
        items: formData.items,
        subtotal: formData.subtotal || 0,
        discount: formData.discount || 0,  
        total: formData.total || 0,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        date: new Date().toISOString(),
        notes: formData.notes || '',
        paymentMethod: formData.paymentMethod || '', 
      };

      // Ensure all object properties have non-undefined values
      Object.keys(orderToCreate).forEach(key => {
        if (orderToCreate[key as keyof typeof orderToCreate] === undefined) {
          orderToCreate[key as keyof typeof orderToCreate] = '';
        }
      });

      const orderId = await orderService.createOrder(orderToCreate);
      
      setSuccess('Order created successfully');
      
      // Redirect to the order details page after a short delay
      setTimeout(() => {
        router.push(`/orders/${orderId}`);
      }, 1500);
    } catch (err: any) {
      console.error('Error creating order:', err);
      setError(err.message || 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        {/* Header with improved styling */}
        <Box 
          sx={{ 
            mb: 4, 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2
          }}
        >
          <Box>
            <Typography 
              variant="h4" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                background: theme => `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Create New Order
            </Typography>
            <Breadcrumbs aria-label="breadcrumb">
              <MuiLink
                underline="hover"
                color="inherit"
                component={Link}
                href="/dashboard"
                sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Dashboard
              </MuiLink>
              <MuiLink
                underline="hover"
                color="inherit"
                component={Link}
                href="/orders"
                sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <ShoppingCartIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Orders
              </MuiLink>
              <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
                <AddIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                New Order
              </Typography>
            </Breadcrumbs>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/orders')}
            sx={{ 
              borderRadius: 2,
              px: 2
            }}
          >
            Back to Orders
          </Button>
        </Box>

        {/* Stepper for order creation process */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            background: theme => alpha(theme.palette.background.paper, 0.8)
          }}
        >
          <Stepper 
            activeStep={activeStep} 
            alternativeLabel
            sx={{ 
              '& .MuiStepLabel-root': {
                color: 'text.secondary'
              },
              '& .MuiStepLabel-active': {
                color: 'primary.main'
              },
              '& .MuiStepIcon-root': {
                fontSize: 28
              }
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>



        {/* Alerts with improved styling */}
        {error && (
          <Alert
            severity="error"
            variant="filled"
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              boxShadow: 2
            }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            variant="filled"
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              boxShadow: 2
            }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>

            <Grid item xs={12} md={8}>
              {/* Customer Selection Section */}
              <Paper 
                sx={{ 
                  p: 3, 
                  mb: 3, 
                  borderRadius: 2,
                  boxShadow: theme => `0 2px 10px ${alpha(theme.palette.primary.main, 0.08)}`,
                  display: activeStep === 0 ? 'block' : (activeStep > 0 ? 'block' : 'none'),
                  opacity: activeStep === 0 ? 1 : 0.7,
                  transition: 'opacity 0.3s ease'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon 
                    sx={{ 
                      mr: 1.5, 
                      color: 'primary.main',
                      fontSize: 28
                    }} 
                  />
                  <Typography variant="h6" fontWeight="bold">
                    Customer Information
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                
                <Autocomplete
                  id="party-select"
                  options={parties}
                  loading={partiesLoading}
                  getOptionLabel={(option) => option.name}
                  value={selectedParty}
                  onChange={handlePartyChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Customer"
                      placeholder="Search for a customer..."
                      error={!!formErrors.partyId}
                      helperText={formErrors.partyId}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <PersonIcon color="primary" />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                        endAdornment: (
                          <>
                            {partiesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                        sx: { borderRadius: 1.5 }
                      }}
                    />
                  )}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    return (
                      <li key={key} {...otherProps}>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body1" fontWeight="medium">
                            {option.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {option.email || 'No email'} • {option.phone || 'No phone'}
                          </Typography>
                          {(option.discountPercentage > 0 || option.firstOrderDiscountPercentage > 0) && (
                            <Chip 
                              label={option.orderCount === 0 && option.firstOrderDiscountPercentage > 0 
                                ? `First Order: ${option.firstOrderDiscountPercentage}% off` 
                                : `Discount: ${option.discountPercentage}% off`}
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ mt: 1, alignSelf: 'flex-start' }}
                            />
                          )}
                        </Box>
                      </li>
                    );
                  }}
                />
                
                {selectedParty && (
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      mt: 3, 
                      borderRadius: 2,
                      borderColor: 'primary.light',
                      bgcolor: theme => alpha(theme.palette.primary.light, 0.05)
                    }}
                  >
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Selected Customer
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Name: <Typography component="span" fontWeight="medium">{selectedParty.name}</Typography>
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Email: <Typography component="span" fontWeight="medium">{selectedParty.email || 'N/A'}</Typography>
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Phone: <Typography component="span" fontWeight="medium">{selectedParty.phone || 'N/A'}</Typography>
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Previous Orders: <Typography component="span" fontWeight="medium">{selectedParty.orderCount || 0}</Typography>
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Discount: 
                            <Typography 
                              component="span" 
                              fontWeight="medium"
                              color="success.main"
                            >
                              {' '}{appliedDiscountPercentage}%
                            </Typography>
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                )}
                
                {activeStep === 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleNextStep}
                      endIcon={<ArrowForwardIcon />}
                      disabled={!selectedParty}
                      sx={{ borderRadius: 2 }}
                    >
                      Continue to Products
                    </Button>
                  </Box>
                )}
              </Paper>

              {/* Product Selection Section */}
              <Paper 
                sx={{ 
                  p: 3, 
                  mb: 3, 
                  borderRadius: 2,
                  boxShadow: theme => `0 2px 10px ${alpha(theme.palette.primary.main, 0.08)}`,
                  display: activeStep >= 1 ? 'block' : 'none',
                  opacity: activeStep === 1 ? 1 : (activeStep > 1 ? 0.7 : 1),
                  transition: 'opacity 0.3s ease'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ShoppingBasketIcon 
                    sx={{ 
                      mr: 1.5, 
                      color: 'primary.main',
                      fontSize: 28
                    }} 
                  />
                  <Typography variant="h6" fontWeight="bold">
                    Order Items
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />

                <Box 
                  sx={{ 
                    mb: 3, 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' }, 
                    alignItems: 'flex-start', 
                    gap: 2 
                  }}
                >
                  <Autocomplete
                    id="product-select"
                    options={products}
                    loading={productsLoading}
                    getOptionLabel={(option) => `${option.name} (${option.sku})`}
                    value={currentProduct}
                    onChange={handleProductChange}
                    sx={{ flexGrow: 1 }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Product"
                        placeholder="Search by name or SKU..."
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <InventoryIcon color="primary" />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                          endAdornment: (
                            <>
                              {productsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                          sx: { borderRadius: 1.5 }
                        }}
                      />
                    )}
                    renderOption={(props, option) => {
                      // Extract key from props
                      const { key, ...otherProps } = props;
                      return (
                        <li key={key} {...otherProps}>
                          <Box sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body1" fontWeight="medium">{option.name}</Typography>
                              <Chip 
                                label={option.quantity > 10 ? 'In Stock' : (option.quantity > 0 ? 'Low Stock' : 'Out of Stock')}
                                size="small"
                                color={option.quantity > 10 ? 'success' : (option.quantity > 0 ? 'warning' : 'error')}
                                sx={{ ml: 1 }}
                              />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                SKU: {option.sku} | Available: {option.quantity}
                              </Typography>
                              <Box>
                                {option.discountedPrice ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                                      {formatCurrency(option.discountedPrice)}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        textDecoration: 'line-through',
                                        color: 'text.secondary',
                                        ml: 1
                                      }}
                                    >
                                      {formatCurrency(option.price)}
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Typography variant="body2" fontWeight="bold">
                                    {formatCurrency(option.price)}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        </li>
                      );
                    }}
                  />

                  <TextField
                    label="Quantity"
                    type="number"
                    value={currentQuantity}
                    onChange={handleQuantityChange}
                    InputProps={{ 
                      inputProps: { min: 1 },
                      sx: { borderRadius: 1.5 }
                    }}
                    sx={{ width: { xs: '100%', sm: '120px' } }}
                  />

                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddProduct}
                    disabled={!currentProduct}
                    sx={{ 
                      borderRadius: 2,
                      px: 3,
                      height: { xs: 40, sm: 56 },
                      width: { xs: '100%', sm: 'auto' }
                    }}
                  >
                    Add
                  </Button>
                </Box>

                {formErrors.items && (
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 2,
                      borderRadius: 1.5
                    }}
                  >
                    {formErrors.items}
                  </Alert>
                )}

                <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Table>
                    <TableHead sx={{ bgcolor: theme => alpha(theme.palette.primary.main, 0.05) }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Price</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                              <ShoppingCartIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3 }} />
                              <Typography variant="body1" color="text.secondary">
                                No items added to the order yet
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Search and add products above
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : (
                        formData.items.map((item, index) => (
                          <TableRow key={index} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {item.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                SKU: {item.sku}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              {item.discountedPrice ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                  <Typography variant="body2" fontWeight="medium" color="primary.main">
                                    {formatCurrency(item.discountedPrice)}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      textDecoration: 'line-through',
                                      color: 'text.secondary'
                                    }}
                                  >
                                    {formatCurrency(item.price)}
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography variant="body2">
                                  {formatCurrency(item.price)}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Chip 
                                label={item.quantity} 
                                size="small" 
                                sx={{ 
                                  fontWeight: 'bold',
                                  minWidth: 40
                                }} 
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="bold">
                                {formatCurrency(item.total)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveProduct(index)}
                                sx={{ 
                                  '&:hover': { 
                                    bgcolor: theme => alpha(theme.palette.error.main, 0.1) 
                                  } 
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {activeStep === 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={handleBackStep}
                      startIcon={<ArrowBackIcon />}
                      sx={{ borderRadius: 2 }}
                    >
                      Back to Customer
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleNextStep}
                      endIcon={<ArrowForwardIcon />}
                      disabled={formData.items.length === 0}
                      sx={{ borderRadius: 2 }}
                    >
                      Continue to Review
                    </Button>
                  </Box>
                )}
              </Paper>

              {/* Additional Information Section */}
              <Paper 
                sx={{ 
                  p: 3, 
                  mb: 3, 
                  borderRadius: 2,
                  boxShadow: theme => `0 2px 10px ${alpha(theme.palette.primary.main, 0.08)}`,
                  display: activeStep >= 2 ? 'block' : 'none'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <InfoIcon 
                    sx={{ 
                      mr: 1.5, 
                      color: 'primary.main',
                      fontSize: 28
                    }} 
                  />
                  <Typography variant="h6" fontWeight="bold">
                    Additional Information
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel id="payment-method-label">Payment Method</InputLabel>
                      <Select
                        labelId="payment-method-label"
                        id="payment-method"
                        name="paymentMethod"
                        value={formData.paymentMethod || ''}
                        onChange={handleInputChange}
                        label="Payment Method"
                        startAdornment={
                          <InputAdornment position="start">
                            <PaymentIcon fontSize="small" color="primary" />
                          </InputAdornment>
                        }
                        sx={{ borderRadius: 1.5 }}
                      >
                        <MenuItem value="cash">Cash</MenuItem>
                        <MenuItem value="credit_card">Credit Card</MenuItem>
                        <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                        <MenuItem value="upi">UPI</MenuItem>
                        <MenuItem value="check">Check</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel id="payment-status-label">Payment Status</InputLabel>
                      <Select
                        labelId="payment-status-label"
                        id="payment-status"
                        name="paymentStatus"
                        value={formData.paymentStatus}
                        onChange={handleInputChange}
                        label="Payment Status"
                        sx={{ borderRadius: 1.5 }}
                      >
                        <MenuItem value={PaymentStatus.PENDING}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip size="small" label="Pending" color="warning" sx={{ mr: 1 }} />
                            Pending Payment
                          </Box>
                        </MenuItem>
                        <MenuItem value={PaymentStatus.PARTIAL}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip size="small" label="Partial" color="info" sx={{ mr: 1 }} />
                            Partially Paid
                          </Box>
                        </MenuItem>
                        <MenuItem value={PaymentStatus.PAID}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip size="small" label="Paid" color="success" sx={{ mr: 1 }} />
                            Fully Paid
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="notes"
                      name="notes"
                      label="Order Notes"
                      placeholder="Add any special instructions or notes for this order..."
                      multiline
                      rows={3}
                      value={formData.notes || ''}
                      onChange={handleInputChange}
                      InputProps={{ sx: { borderRadius: 1.5 } }}
                    />
                  </Grid>
                </Grid>
                
                {activeStep === 2 && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={handleBackStep}
                      startIcon={<ArrowBackIcon />}
                      sx={{ borderRadius: 2 }}
                    >
                      Back to Products
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper 
                sx={{ 
                  p: 3, 
                  position: 'sticky', 
                  top: 20,
                  borderRadius: 2,
                  boxShadow: theme => `0 2px 10px ${alpha(theme.palette.primary.main, 0.08)}`,
                  border: '1px solid',
                  borderColor: theme => activeStep === 2 ? theme.palette.primary.main : 'divider',
                  transition: 'border-color 0.3s ease'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ReceiptIcon 
                    sx={{ 
                      mr: 1.5, 
                      color: 'primary.main',
                      fontSize: 28
                    }} 
                  />
                  <Typography variant="h6" fontWeight="bold">
                    Order Summary
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                
                {formData.items.length > 0 ? (
                  <>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Items ({formData.items.length})
                      </Typography>
                      <Box sx={{ maxHeight: 150, overflowY: 'auto', mb: 2, pr: 1 }}>
                        {formData.items.map((item, index) => (
                          <Box 
                            key={index} 
                            sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              mb: 1,
                              pb: 1,
                              borderBottom: index < formData.items.length - 1 ? '1px dashed' : 'none',
                              borderColor: 'divider'
                            }}
                          >
                            <Typography variant="body2" noWrap sx={{ maxWidth: '70%' }}>
                              {item.quantity} × {item.name}
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {formatCurrency(item.total)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                    
                    <Box 
                      sx={{ 
                        mb: 3, 
                        p: 2, 
                        bgcolor: theme => alpha(theme.palette.background.default, 0.5),
                        borderRadius: 1.5
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Subtotal:
                        </Typography>
                        <Typography variant="body2">
                          {formatCurrency(formData.subtotal)}
                        </Typography>
                      </Box>
                      
                      {formData.discount > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                            <DiscountIcon fontSize="small" sx={{ mr: 0.5 }} />
                            Discount ({appliedDiscountPercentage}%):
                          </Typography>
                          <Typography variant="body2" color="success.main" fontWeight="medium">
                            -{formatCurrency(formData.discount)}
                          </Typography>
                        </Box>
                      )}
                      
                      <Divider sx={{ my: 1.5 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Total:
                        </Typography>
                        <Typography variant="h6" color="primary.main" fontWeight="bold">
                          {formatCurrency(formData.total)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {activeStep === 2 && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          size="large"
                          type="submit"
                          disabled={loading}
                          startIcon={<SaveIcon />}
                          sx={{ 
                            borderRadius: 2,
                            py: 1.5,
                            boxShadow: theme => `0 4px 10px ${alpha(theme.palette.primary.main, 0.3)}`
                          }}
                        >
                          {loading ? (
                            <>
                              <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                              Creating Order...
                            </>
                          ) : (
                            'Complete Order'
                          )}
                        </Button>
                        
                        {formErrors.total && (
                          <Alert severity="error" sx={{ mt: 2, borderRadius: 1.5 }}>
                            {formErrors.total}
                          </Alert>
                        )}
                      </Box>
                    )}
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <ShoppingCartIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      Your cart is empty
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add products to see the order summary
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
            
          </Grid>
        </form>

      </Container>
      
    </DashboardLayout>
  );
}
