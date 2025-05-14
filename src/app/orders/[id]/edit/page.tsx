"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { productService } from '@/services/productService';
import { Product } from '@/types/inventory';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import {
  Container,
  Typography,
  Autocomplete,
  IconButton,
  Box,
  Paper,
  Button,
  TableContainer,
  Table,
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
  InputAdornment,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  alpha,
  Snackbar
} from '@mui/material';

import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot'; 

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
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  History as HistoryIcon,
  Undo as UndoIcon
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
  const theme = useTheme();
  
  // State declarations
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
  
  // New state for enhanced functionality
  const [originalFormData, setOriginalFormData] = useState<OrderFormData | null>(null);
  const [changesMade, setChangesMade] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [dialogAction, setDialogAction] = useState<'cancel' | 'save' | null>(null);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  
  // Track which fields have been modified
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());

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
        
        // If no data is received, set an empty array instead of throwing an error
        if (!productsData) {
          console.warn('No products data received, using empty array instead');
          setProducts([]);
          return;
        }
        
        // Add validation to ensure productsData is an array
        if (!Array.isArray(productsData)) {
          console.error('Invalid products data format:', productsData);
          setProductsError('Invalid product data received. Please try again.');
          setProducts([]);
          return;
        }
        
        setProducts(productsData);
      } catch (err) {
        console.error('Error fetching products:', err);
        setProductsError(err instanceof Error ? err.message : 'Failed to load products. Please try again.');
        // Set empty products array to prevent UI issues
        setProducts([]);
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
        
        // Create form data object
        const formDataObj = {
          partyId: orderData.partyId,
          partyName: orderData.partyName,
          items: orderData.items,
          subtotal: orderData.subtotal,
          total: orderData.total,
          notes: orderData.notes || '',
          status: orderData.status,
          paymentStatus: orderData.paymentStatus,
          paymentMethod: orderData.paymentMethod || '',
          trackingNumber: orderData.trackingNumber || '',
        };
        
        // Set both current and original form data
        setFormData(formDataObj);
        setOriginalFormData(JSON.parse(JSON.stringify(formDataObj))); // Deep copy
        
        // Fetch order history if available
        try {
          if (orderData.history && Array.isArray(orderData.history)) {
            setOrderHistory(orderData.history);
          } else {
            // Create a basic history entry if none exists
            setOrderHistory([{
              date: orderData.createdAt || new Date().toISOString(),
              action: 'Order Created',
              user: 'System',
              details: 'Initial order creation'
            }]);
          }
        } catch (historyErr) {
          console.error('Error processing order history:', historyErr);
        }
        
        // Fetch customer data
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
    
    // Track items as modified
    setModifiedFields(prev => {
      const newSet = new Set(prev);
      newSet.add('items');
      return newSet;
    });
    
    // Update form data with recalculated totals
    setFormData({
      ...formData,
      items: newItems,
      subtotal: newItems.reduce((sum, item) => sum + item.total, 0),
      total: newItems.reduce((sum, item) => sum + item.total, 0)
    });
    
    // Show feedback
    setSnackbarMessage(`Updated item: ${newItems[index].productName || 'Product'}`);
    setSnackbarOpen(true);
  };


  // Check if changes have been made to the form
  useEffect(() => {
    if (formData && originalFormData) {
      // Compare current form data with original
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalFormData);
      setChangesMade(hasChanges);
    }
  }, [formData, originalFormData]);

  // Enhanced input change handler that tracks which fields have been modified
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    if (!formData) return;
    
    const { name, value } = e.target;
    if (!name) return;
    
    // Clear any errors for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Track this field as modified
    setModifiedFields(prev => {
      const newSet = new Set(prev);
      newSet.add(name);
      return newSet;
    });
    
    // Update form data
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
    
    // Show visual feedback
    setSnackbarMessage(`Updated ${name.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
    setSnackbarOpen(true);
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const validateForm = (): boolean => {
    if (!formData) return false;
    const errors: Record<string, string> = {};
    if (formData.total <= 0) errors.total = 'Total amount must be greater than zero';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add handlers for dialog actions
  const handleOpenConfirmDialog = (action: 'cancel' | 'save') => {
    setDialogAction(action);
    setShowConfirmDialog(true);
  };
  
  const handleCloseConfirmDialog = () => {
    setShowConfirmDialog(false);
    setDialogAction(null);
  };
  
  // Handle discarding changes
  const handleDiscardChanges = () => {
    if (originalFormData) {
      setFormData(JSON.parse(JSON.stringify(originalFormData))); // Reset to original
      setModifiedFields(new Set()); // Clear modified fields
      setChangesMade(false);
      setSnackbarMessage('Changes discarded');
      setSnackbarOpen(true);
    }
    handleCloseConfirmDialog();
  };
  
  // Enhanced submit handler with history tracking
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !validateForm()) return;
    
    // Close dialog if open
    if (showConfirmDialog) {
      handleCloseConfirmDialog();
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Create history entry for this update
      const historyEntry = {
        date: new Date().toISOString(),
        action: 'Order Updated',
        user: 'Current User', // Ideally this would come from auth context
        details: Array.from(modifiedFields).join(', '),
        changes: Array.from(modifiedFields).reduce((acc, field) => {
          if (field === 'items') {
            acc[field] = 'Items updated';
          } else if (originalFormData && formData) {
            acc[field] = {
              from: originalFormData[field as keyof typeof originalFormData],
              to: formData[field as keyof typeof formData]
            };
          }
          return acc;
        }, {} as Record<string, any>)
      };
      
      // Add history to the update
      const updatedFormData = {
        ...formData,
        history: [...(orderHistory || []), historyEntry]
      };
      
      // Update the order
      await orderService.updateOrder(id, updatedFormData);
      
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
        {/* Enhanced header with status indicators */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', md: 'center' }, 
            mb: 3,
            gap: 2
          }}
        >
          <Box>
            <Typography 
              variant="h4" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <EditIcon color="primary" />
              Edit Order
              {changesMade && (
                <Chip 
                  label="Unsaved Changes" 
                  color="warning" 
                  size="small" 
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>
            <Breadcrumbs aria-label="breadcrumb">
              <MuiLink underline="hover" color="inherit" href="/dashboard">Dashboard</MuiLink>
              <MuiLink underline="hover" color="inherit" href="/orders">Orders</MuiLink>
              <MuiLink underline="hover" color="inherit" href={`/orders/${id}`}>Order Details</MuiLink>
              <Typography color="text.primary">Edit</Typography>
            </Breadcrumbs>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            {changesMade && (
              <Tooltip title="Discard Changes">
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<UndoIcon />}
                  onClick={() => handleOpenConfirmDialog('cancel')}
                >
                  Discard
                </Button>
              </Tooltip>
            )}
            <Tooltip title="View Order History">
              <Button
                variant="outlined"
                color="info"
                startIcon={<HistoryIcon />}
                onClick={() => setShowHistory(true)}
              >
                History
              </Button>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => changesMade ? handleOpenConfirmDialog('cancel') : router.push(`/orders/${id}`)}
            >
              Back to Order
            </Button>
          </Box>
        </Box>
        
        {/* Status indicators */}
        {formData && (
          <Paper 
            elevation={0}
            sx={{ 
              p: 2, 
              mb: 3, 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            <Chip 
              label={`Status: ${formData.status}`}
              color={
                formData.status === OrderStatus.COMPLETED ? 'success' :
                formData.status === OrderStatus.PROCESSING ? 'info' :
                formData.status === OrderStatus.CANCELLED ? 'error' : 'warning'
              }
              icon={
                formData.status === OrderStatus.COMPLETED ? <CheckCircleIcon /> :
                formData.status === OrderStatus.CANCELLED ? <CancelIcon /> : undefined
              }
            />
            
            <Chip 
              label={`Payment: ${formData.paymentStatus}`}
              color={
                formData.paymentStatus === PaymentStatus.PAID ? 'success' :
                formData.paymentStatus === PaymentStatus.PARTIAL ? 'info' : 'warning'
              }
            />
            
            <Chip 
              label={`Items: ${formData.items.length}`}
              color="default"
            />
            
            <Chip 
              label={`Total: ${formatCurrency(formData.total)}`}
              color="primary"
            />
          </Paper>
        )}
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert 
            severity="success" 
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper 
                sx={{ 
                  p: 3, 
                  mb: 3, 
                  borderRadius: 2,
                  boxShadow: theme => `0 2px 10px ${alpha(theme.palette.primary.main, 0.08)}`,
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
                  <Typography variant="h6" fontWeight="bold">Order Status</Typography>
                </Box>
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
                        sx={{ 
                          borderRadius: 1.5,
                          '& .MuiSelect-select': {
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }
                        }}
                      >
                        {Object.values(OrderStatus).map(status => (
                          <MenuItem key={status} value={status} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={status} 
                              size="small"
                              color={
                                status === OrderStatus.COMPLETED ? 'success' :
                                status === OrderStatus.PROCESSING ? 'info' :
                                status === OrderStatus.CANCELLED ? 'error' : 'warning'
                              }
                            />
                            {status}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {modifiedFields.has('status') && (
                      <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block' }}>
                        * Status changed
                      </Typography>
                    )}
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Payment Status</InputLabel>
                      <Select
                        name="paymentStatus"
                        value={formData.paymentStatus}
                        onChange={handleInputChange}
                        label="Payment Status"
                        sx={{ 
                          borderRadius: 1.5,
                          '& .MuiSelect-select': {
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }
                        }}
                      >
                        {Object.values(PaymentStatus).map(status => (
                          <MenuItem key={status} value={status} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={status} 
                              size="small"
                              color={
                                status === PaymentStatus.PAID ? 'success' :
                                status === PaymentStatus.PARTIAL ? 'info' : 'warning'
                              }
                            />
                            {status}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {modifiedFields.has('paymentStatus') && (
                      <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block' }}>
                        * Payment status changed
                      </Typography>
                    )}
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Payment Method</InputLabel>
                      <Select
                        name="paymentMethod"
                        value={formData.paymentMethod || ''}
                        onChange={handleInputChange}
                        label="Payment Method"
                        sx={{ borderRadius: 1.5 }}
                        startAdornment={
                          <InputAdornment position="start">
                            <PaymentIcon fontSize="small" color="primary" />
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
                    {modifiedFields.has('paymentMethod') && (
                      <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block' }}>
                        * Payment method changed
                      </Typography>
                    )}
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
                            <ShippingIcon fontSize="small" color="primary" />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: 1.5 }
                      }}
                    />
                    {modifiedFields.has('trackingNumber') && (
                      <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block' }}>
                        * Tracking number updated
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </Paper>
              <Paper 
                sx={{ 
                  p: 3, 
                  mb: 3, 
                  borderRadius: 2,
                  boxShadow: theme => `0 2px 10px ${alpha(theme.palette.primary.main, 0.08)}`,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <InventoryIcon 
                      sx={{ 
                        mr: 1.5, 
                        color: 'primary.main',
                        fontSize: 28
                      }} 
                    />
                    <Typography variant="h6" fontWeight="bold">
                      Order Items
                    </Typography>
                    {modifiedFields.has('items') && (
                      <Chip 
                        label="Modified" 
                        color="primary" 
                        size="small" 
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddItem}
                    size="small"
                    sx={{ borderRadius: 2 }}
                  >
                    Add Item
                  </Button>
                </Box>
                <Divider sx={{ mb: 3 }} />
                
                <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Table>
                    <TableHead sx={{ bgcolor: theme => alpha(theme.palette.primary.main, 0.05) }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Price</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {productsError && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Alert severity="error" sx={{ m: 2 }}>
                              {productsError}
                            </Alert>
                          </TableCell>
                        </TableRow>
                      )}
                      
                      {productsLoading && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
                              <CircularProgress size={24} sx={{ mr: 2 }} />
                              <Typography variant="body2">
                                Loading products...
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                      
                      {formData.items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                              <InventoryIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3 }} />
                              <Typography variant="body1" color="text.secondary">
                                No items in this order
                              </Typography>
                              <Button 
                                variant="outlined" 
                                size="small" 
                                startIcon={<AddIcon />}
                                onClick={handleAddItem}
                                sx={{ mt: 1 }}
                              >
                                Add First Item
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : (
                        formData.items.map((item, index) => (
                          <TableRow key={index} hover>
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
                                    variant="outlined"
                                    size="small"
                                    InputProps={{
                                      ...params.InputProps,
                                      startAdornment: (
                                        <>
                                          <SearchIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                                          {params.InputProps.startAdornment}
                                        </>
                                      ),
                                      sx: { borderRadius: 1.5 }
                                    }}
                                  />
                                )}
                                renderOption={(props, option) => (
                                  <li {...props}>
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
                                      <Typography variant="body2" color="text.secondary">
                                        SKU: {option.sku} | Price: {formatCurrency(option.price)}
                                      </Typography>
                                    </Box>
                                  </li>
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
                                variant="outlined"
                                size="small"
                                error={item.quantity <= 0}
                                helperText={item.quantity <= 0 ? 'Min: 1' : ''}
                                sx={{ width: '80px' }}
                                InputProps={{ sx: { borderRadius: 1.5 } }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                value={item.price}
                                onChange={(e) => {
                                  const value = Math.max(0, Number(e.target.value));
                                  handleItemChange(index, 'price', value);
                                }}
                                inputProps={{ 
                                  min: 0,
                                  step: 0.01
                                }}
                                variant="outlined"
                                size="small"
                                sx={{ width: '100px' }}
                                InputProps={{
                                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                  sx: { borderRadius: 1.5 }
                                }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body1" fontWeight="medium">
                                {formatCurrency(item.total)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Remove Item">
                                <IconButton
                                  onClick={() => handleDeleteItem(index)}
                                  color="error"
                                  size="small"
                                  sx={{ 
                                    '&:hover': { 
                                      bgcolor: theme => alpha(theme.palette.error.main, 0.1) 
                                    } 
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
              
              {/* Additional Information */}
              <Paper 
                sx={{ 
                  p: 3, 
                  mb: 3, 
                  borderRadius: 2,
                  boxShadow: theme => `0 2px 10px ${alpha(theme.palette.primary.main, 0.08)}`,
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
                  <Typography variant="h6" fontWeight="bold">Additional Information</Typography>
                  {modifiedFields.has('notes') && (
                    <Chip 
                      label="Modified" 
                      color="primary" 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
                <Divider sx={{ mb: 3 }} />
                <TextField
                  fullWidth
                  name="notes"
                  label="Order Notes"
                  placeholder="Add any special instructions or notes for this order..."
                  multiline
                  rows={3}
                  value={formData.notes || ''}
                  onChange={handleInputChange}
                  InputProps={{ sx: { borderRadius: 1.5 } }}
                />
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper 
                sx={{ 
                  p: 3, 
                  mb: 3, 
                  position: 'sticky', 
                  top: '80px',
                  borderRadius: 2,
                  boxShadow: theme => `0 2px 10px ${alpha(theme.palette.primary.main, 0.08)}`,
                  border: '1px solid',
                  borderColor: changesMade ? 'primary.main' : 'divider',
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
                  <Typography variant="h6" fontWeight="bold">Order Summary</Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                
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
                
                {formErrors.total && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>{formErrors.total}</Alert>
                )}
                
                <Box sx={{ mt: 3 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<SaveIcon />}
                    disabled={loading || !changesMade}
                    sx={{ 
                      borderRadius: 2,
                      py: 1.5,
                      mb: 2,
                      boxShadow: theme => `0 4px 10px ${alpha(theme.palette.primary.main, 0.3)}`
                    }}
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => changesMade ? handleOpenConfirmDialog('cancel') : router.push(`/orders/${id}`)}
                    sx={{ borderRadius: 2 }}
                  >
                    Cancel
                  </Button>
                </Box>
                
                {changesMade && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="primary">
                      You have unsaved changes
                    </Typography>
                  </Box>
                )}
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
        
        {/* Confirmation Dialog */}
        <Dialog
          open={showConfirmDialog}
          onClose={handleCloseConfirmDialog}
          aria-labelledby="confirm-dialog-title"
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          <DialogTitle id="confirm-dialog-title">
            {dialogAction === 'cancel' ? 'Discard Changes?' : 'Save Changes?'}
          </DialogTitle>
          <DialogContent>
            <Typography>
              {dialogAction === 'cancel' 
                ? 'You have unsaved changes. Are you sure you want to discard them?' 
                : 'Save your changes to this order?'}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConfirmDialog} color="primary">
              Cancel
            </Button>
            <Button 
              onClick={dialogAction === 'cancel' ? handleDiscardChanges : handleSubmit}
              color={dialogAction === 'cancel' ? 'error' : 'primary'}
              variant="contained"
              autoFocus
            >
              {dialogAction === 'cancel' ? 'Discard' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Order History Dialog */}
        <Dialog
          open={showHistory}
          onClose={() => setShowHistory(false)}
          aria-labelledby="history-dialog-title"
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          <DialogTitle id="history-dialog-title" sx={{ display: 'flex', alignItems: 'center' }}>
            <HistoryIcon sx={{ mr: 1 }} />
            Order History
          </DialogTitle>
          <DialogContent>
            {orderHistory.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                No history available for this order
              </Typography>
            ) : (
              <Box sx={{ mt: 1 }}>
                <Timeline position="alternate">
                  {orderHistory.map((entry, index) => (
                    <TimelineItem key={index}>
                      <TimelineSeparator>
                        <TimelineDot color={
                          entry.action.includes('Created') ? 'success' :
                          entry.action.includes('Updated') ? 'primary' :
                          entry.action.includes('Cancelled') ? 'error' : 'grey'
                        } />
                        {index < orderHistory.length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Paper
                          elevation={1}
                          sx={{ 
                            p: 2, 
                            borderRadius: 2,
                            bgcolor: theme => alpha(theme.palette.background.paper, 0.7)
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight="bold">
                            {entry.action}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(entry.date).toLocaleString()}
                          </Typography>
                          {entry.user && (
                            <Typography variant="body2">
                              By: {entry.user}
                            </Typography>
                          )}
                          {entry.details && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {entry.details}
                            </Typography>
                          )}
                        </Paper>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowHistory(false)} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Feedback Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          message={snackbarMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        />
      </Container>
    </DashboardLayout>
  );
}