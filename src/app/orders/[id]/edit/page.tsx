"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { productService } from '@/services/productService';
import { Product } from '@/types/inventory';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import {
  Container,
  Typography,
  Autocomplete ,IconButton ,
  Box,
  Paper,
  Button,TableContainer,Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
  Card,
  CardContent,
  InputAdornment
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { orderService } from '@/services/orderService';
import { partyService } from '@/services/partyService';
import { Order, OrderFormData, OrderStatus, PaymentStatus } from '@/types/order';
import { Party } from '@/types/party';
import { formatCurrency } from '@/utils/numberUtils';

type OrderEditPageProps = {
  params: {
    id: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
};

interface OrderItemWithProduct extends OrderItem {
  product?: Product;
}


export default function OrderEditPage({ params }: OrderEditPageProps) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  
  // Add these missing state declarations
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  
  const [productsError, setProductsError] = useState<string | null>(null);
  const [formData, setFormData] = useState<OrderFormData | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Party | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        setProductsError(null);
        
        // Add null check for productService
        if (!productService || typeof productService.getProducts !== 'function') {
          throw new Error('Product service is not properly initialized');
        }
        
        const productsData = await productService.getProducts();
        
        // Check if productsData is undefined or null before validation
        if (!productsData) {
          throw new Error('No products data received');
        }
        
        // Add validation to ensure productsData is an array
        if (!Array.isArray(productsData)) {
          console.error('Invalid products data format:', productsData);
          setProductsError('Invalid product data received. Please try again.');
          return;
        }
        
        setProducts(productsData);
      } catch (err) {
        console.error('Error fetching products:', err);
        setProductsError('Failed to load products. Please try again.');
      } finally {
        setProductsLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setInitialLoading(true);
        const orderData = await orderService.getOrder(id);
        
        if (orderData.status === OrderStatus.CANCELLED) {
          setError('Cancelled orders cannot be edited');
          router.push(`/orders/${id}`);
          return;
        }
        
        setFormData({
          partyId: orderData.partyId,
          partyName: orderData.partyName,
          items: orderData.items,
          subtotal: orderData.subtotal,
          total: orderData.total,
          notes: orderData.notes,
          status: orderData.status,
          paymentStatus: orderData.paymentStatus,
          paymentMethod: orderData.paymentMethod,
          trackingNumber: orderData.trackingNumber,
        });
        
        if (orderData.partyId) {
          try {
            const customerData = await partyService.getParty(orderData.partyId);
            setCustomer(customerData);
          } catch (err) {
            console.error('Error fetching customer:', err);
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order data. Please try again.');
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchOrderData();
  }, [id, router]);

   // Add these handler functions
   const handleAddItem = () => {
    if (!formData) return;
    
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          productId: '',
          productName: 'New Product',
          quantity: 1,
          price: 0,
          total: 0
        }
      ]
    });
  };

  const handleDeleteItem = (index: number) => {
    if (!formData) return;
    
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    
    setFormData({
      ...formData,
      items: newItems
    });
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
    if (!formData) return;
    
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate total if price or quantity changes
    if (field === 'price' || field === 'quantity') {
      newItems[index].total = newItems[index].price * newItems[index].quantity;
    }
    
    setFormData({
      ...formData,
      items: newItems,
      subtotal: newItems.reduce((sum, item) => sum + item.total, 0),
      total: newItems.reduce((sum, item) => sum + item.total, 0)
    });
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    if (!formData) return;
    
    const { name, value } = e.target;
    if (!name) return;
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const validateForm = (): boolean => {
    if (!formData) return false;
    const errors: Record<string, string> = {};
    if (formData.total <= 0) errors.total = 'Total amount must be greater than zero';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !validateForm()) return;
    
    try {
      setLoading(true);
      setError(null);
      await orderService.updateOrder(id, formData);
      setSuccess('Order updated successfully');
      setTimeout(() => router.push(`/orders/${id}`), 1500);
    } catch (err: any) {
      console.error('Error updating order:', err);
      setError(err.message || 'Failed to update order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <DashboardLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
          </Box>
        </Container>
      </DashboardLayout>
    );
  }

  if (!formData) {
    return (
      <DashboardLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Order not found'}
          </Alert>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>Edit Order</Typography>
            <Breadcrumbs aria-label="breadcrumb">
              <MuiLink underline="hover" color="inherit" href="/dashboard">Dashboard</MuiLink>
              <MuiLink underline="hover" color="inherit" href="/orders">Orders</MuiLink>
              <MuiLink underline="hover" color="inherit" href={`/orders/${id}`}>Order Details</MuiLink>
              <Typography color="text.primary">Edit</Typography>
            </Breadcrumbs>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push(`/orders/${id}`)}
          >
            Back to Order
          </Button>
        </Box>
        
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Order Status</Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Order Status</InputLabel>
                      <Select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        label="Order Status"
                      >
                        {Object.values(OrderStatus).map(status => (
                          <MenuItem key={status} value={status}>{status}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Payment Status</InputLabel>
                      <Select
                        name="paymentStatus"
                        value={formData.paymentStatus}
                        onChange={handleInputChange}
                        label="Payment Status"
                      >
                        {Object.values(PaymentStatus).map(status => (
                          <MenuItem key={status} value={status}>{status}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Payment Method</InputLabel>
                      <Select
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
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      name="trackingNumber"
                      label="Tracking Number"
                      value={formData.trackingNumber || ''}
                      onChange={handleInputChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ShippingIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Order Items
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddItem}
                    size="small"
                  >
                    Add Item
                  </Button>
                </Box>
                <Divider sx={{ mb: 3 }} />
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {productsError && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            {productsLoading && (
                              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                <CircularProgress />
                              </Box>
                            )}
                            <CircularProgress size={24} />
                            <Typography variant="body2" sx={{ ml: 2 }}>
                              Loading products...
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                      {formData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Autocomplete
                              options={products}
                              getOptionLabel={(option) => `${option.name} (${option.sku})`}
                              value={products.find(p => p.id === item.productId) || null}
                              onChange={(_, newValue) => {
                                if (newValue) {
                                  handleItemChange(index, 'productId', newValue.id);
                                  handleItemChange(index, 'productName', newValue.name);
                                  handleItemChange(index, 'price', newValue.price);
                                }
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Select Product"
                                  variant="standard"
                                  InputProps={{
                                    ...params.InputProps,
                                    startAdornment: (
                                      <>
                                        <SearchIcon fontSize="small" sx={{ mr: 1 }} />
                                        {params.InputProps.startAdornment}
                                      </>
                                    ),
                                  }}
                                />
                              )}
                              filterOptions={(options, { inputValue }) =>
                                options.filter(option =>
                                  option.name.toLowerCase().includes(inputValue.toLowerCase()) ||
                                  option.sku.toLowerCase().includes(inputValue.toLowerCase())
                                )
                              }
                              disabled={productsLoading}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const value = Math.max(1, Number(e.target.value));
                                handleItemChange(index, 'quantity', value);
                              }}
                              inputProps={{ 
                                min: 1,
                                step: 1
                              }}
                              variant="standard"
                              error={item.quantity <= 0}
                              helperText={item.quantity <= 0 ? 'Must be at least 1' : ''}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.price)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.total)}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              onClick={() => handleDeleteItem(index)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
              
              {/* Additional Information */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Additional Information</Typography>
                <Divider sx={{ mb: 3 }} />
                <TextField
                  fullWidth
                  name="notes"
                  label="Order Notes"
                  multiline
                  rows={3}
                  value={formData.notes || ''}
                  onChange={handleInputChange}
                />
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, mb: 3, position: 'sticky', top: '80px' }}>
                <Typography variant="h6" gutterBottom>Order Summary</Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Box sx={{ mb: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography>Subtotal:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography align="right">{formatCurrency(formData.subtotal)}</Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography>Total:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography align="right">{formatCurrency(formData.total)}</Typography>
                    </Grid>
                  </Grid>
                </Box>
                
                {formErrors.total && (
                  <Alert severity="error" sx={{ mb: 2 }}>{formErrors.total}</Alert>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => router.push(`/orders/${id}`)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Paper>
              
              {customer && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Customer Details</Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Typography variant="subtitle1" fontWeight={600}>
                      {customer.name}
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">Contact Information</Typography>
                      <Typography variant="body1">{customer.email}</Typography>
                      <Typography variant="body1">{customer.phone}</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                      <Button
                        variant="outlined"
                        onClick={() => router.push(`/parties/${customer.id}`)}
                        fullWidth
                      >
                        View Customer
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        </form>
      </Container>
    </DashboardLayout>
  );
}