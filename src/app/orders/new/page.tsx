"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon, 
  Person as PersonIcon, 
  Payment as PaymentIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import { orderService } from '@/services/orderService';
import { productService } from '@/services/productService';
import { partyService } from '@/services/partyService';
import { Order, OrderFormData, OrderItem, OrderStatus, PaymentStatus } from '@/types/order';
import { Product } from '@/types/inventory';
import { Party } from '@/types/party';
import { formatCurrency } from '@/utils/numberUtils';

export default function NewOrderPage() {
  const router = useRouter();

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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              New Order
            </Typography>
            <Breadcrumbs aria-label="breadcrumb">
              <MuiLink
                underline="hover"
                color="inherit"
                href="/dashboard"
                sx={{ cursor: 'pointer' }}
              >
                Dashboard
              </MuiLink>
              <MuiLink
                underline="hover"
                color="inherit"
                href="/orders"
                sx={{ cursor: 'pointer' }}
              >
                Orders
              </MuiLink>
              <Typography color="text.primary">New Order</Typography>
            </Breadcrumbs>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/orders')}
          >
            Back to Orders
          </Button>
        </Box>



        {
          error && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )
        }

        {
          success && (
            <Alert
              severity="success"
              sx={{ mb: 3 }}
              onClose={() => setSuccess(null)}
            >
              {success}
            </Alert>
          )
        }

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>

            <Grid item xs={12} md={8}>
              {/* Customer Selection */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Customer Information
                </Typography>
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
                      error={!!formErrors.partyId}
                      helperText={formErrors.partyId}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <PersonIcon />
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
                      }}
                    />
                  )}
                />
              </Paper>

              {/* Product Selection */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Order Items
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
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
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {productsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, option) => {
                      // Extract key from props
                      const { key, ...otherProps } = props;
                      return (
                        <li key={key} {...otherProps}>
                          <Box>
                            <Typography variant="body1">{option.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              SKU: {option.sku} | Available: {option.quantity} |
                              Price: {formatCurrency(option.discountedPrice || option.price)}
                              {option.discountedPrice && (
                                <span style={{ textDecoration: 'line-through', marginLeft: '5px' }}>
                                  {formatCurrency(option.price)}
                                </span>
                              )}
                            </Typography>
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
                    InputProps={{ inputProps: { min: 1 } }}
                    sx={{ width: '100px' }}
                  />

                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddProduct}
                    disabled={!currentProduct}
                  >
                    Add
                  </Button>
                </Box>

                {formErrors.items && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {formErrors.items}
                  </Alert>
                )}

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                              No items added to the order
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        formData.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell align="right">
                              {item.discountedPrice ? (
                                <>
                                  <Typography variant="body2" component="span">
                                    {formatCurrency(item.discountedPrice)}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    component="span"
                                    sx={{
                                      textDecoration: 'line-through',
                                      color: 'text.secondary',
                                      ml: 1
                                    }}
                                  >
                                    {formatCurrency(item.price)}
                                  </Typography>
                                </>
                              ) : (
                                formatCurrency(item.price)
                              )}
                            </TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveProduct(index)}
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
              </Paper>

              {/* Additional Information */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Additional Information
                </Typography>
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
                            <PaymentIcon fontSize="small" />
                          </InputAdornment>
                        }
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
                      >
                        <MenuItem value={PaymentStatus.PENDING}>Pending</MenuItem>
                        <MenuItem value={PaymentStatus.PARTIAL}>Partial</MenuItem>
                        <MenuItem value={PaymentStatus.PAID}>Paid</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="notes"
                      name="notes"
                      label="Order Notes"
                      multiline
                      rows={2}
                      value={formData.notes || ''}
                      onChange={handleInputChange}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
                <Typography variant="h6" gutterBottom>
                  Order Summary
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    Subtotal: <span>{formatCurrency(formData.subtotal)}</span>
                  </Typography>
                  <Typography variant="body1" sx={{ display: 'flex', justifyContent: 'space-between', color: 'success.main' }}>
                    Discount ({appliedDiscountPercentage}%): <span>-{formatCurrency(formData.discount)}</span>
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  Total: <span>{formatCurrency(formData.total)}</span>
                </Typography>
                
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  type="submit"
                  disabled={loading}
                  startIcon={<SaveIcon />}
                >
                  {loading ? 'Creating Order...' : 'Create Order'}
                </Button>
              </Paper>
            </Grid>

            {formErrors.total && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formErrors.total}
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => router.push('/orders')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Order'}
              </Button>
              
            </Box>
            
          </Grid>
        </form>

      </Container>
      
    </DashboardLayout>
  );
}
