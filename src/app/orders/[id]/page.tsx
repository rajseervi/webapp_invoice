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
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Print as PrintIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  CalendarToday as CalendarTodayIcon,
  Payment as PaymentIcon,
  Notes as NotesIcon
} from '@mui/icons-material';
import { orderService } from '@/services/orderService';
import { partyService } from '@/services/partyService';
import { Order, OrderStatus, PaymentStatus } from '@/types/order';
import { Party } from '@/types/party';
import { formatCurrency } from '@/utils/numberUtils';
import { formatDate, formatDateTime } from '@/utils/dateUtils';

type OrderDetailsPageProps = {
  params: {
    id: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  
  // State for order data
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Party | null>(null);
  
  // State for loading and error handling
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // State for status update dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>(OrderStatus.PENDING);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  
  // State for payment status update dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [newPaymentStatus, setNewPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PENDING);
  const [paymentUpdateLoading, setPaymentUpdateLoading] = useState(false);
  
  // State for cancel confirmation dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  
  // Fetch order data
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setLoading(true);
        
        // Fetch order
        const orderData = await orderService.getOrder(id);
        setOrder(orderData);
        
        // Fetch customer
        if (orderData.partyId) {
          try {
            const customerData = await partyService.getParty(orderData.partyId);
            setCustomer(customerData);
          } catch (err) {
            console.error('Error fetching customer:', err);
            // Continue even if customer fetch fails
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderData();
  }, [id]);
  
  // Handle status update
  const handleStatusUpdate = async () => {
    if (!order) return;
    
    try {
      setStatusUpdateLoading(true);
      
      await orderService.updateOrderStatus(id, newStatus);
      
      // Update local state
      setOrder(prev => prev ? {
        ...prev,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        ...(newStatus === OrderStatus.COMPLETED ? { completedAt: new Date().toISOString() } : {})
      } : null);
      
      setSuccess(`Order status updated to ${newStatus}`);
      setStatusDialogOpen(false);
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status. Please try again.');
    } finally {
      setStatusUpdateLoading(false);
    }
  };
  
  // Handle payment status update
  const handlePaymentStatusUpdate = async () => {
    if (!order) return;
    
    try {
      setPaymentUpdateLoading(true);
      
      await orderService.updateOrder(id, { paymentStatus: newPaymentStatus });
      
      // Update local state
      setOrder(prev => prev ? {
        ...prev,
        paymentStatus: newPaymentStatus,
        updatedAt: new Date().toISOString()
      } : null);
      
      setSuccess(`Payment status updated to ${newPaymentStatus}`);
      setPaymentDialogOpen(false);
    } catch (err) {
      console.error('Error updating payment status:', err);
      setError('Failed to update payment status. Please try again.');
    } finally {
      setPaymentUpdateLoading(false);
    }
  };
  
  // Handle order cancellation
  const handleCancelOrder = async () => {
    try {
      setCancelLoading(true);
      
      await orderService.cancelOrder(id);
      
      // Update local state
      setOrder(prev => prev ? {
        ...prev,
        status: OrderStatus.CANCELLED,
        updatedAt: new Date().toISOString()
      } : null);
      
      setSuccess('Order has been cancelled');
      setCancelDialogOpen(false);
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError('Failed to cancel order. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };
  
  // Get status chip color
  const getStatusChipColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'default';
      case OrderStatus.PROCESSING:
        return 'info';
      case OrderStatus.SHIPPED:
        return 'primary';
      case OrderStatus.DELIVERED:
        return 'success';
      case OrderStatus.CANCELLED:
        return 'error';
      case OrderStatus.RETURNED:
        return 'warning';
      case OrderStatus.COMPLETED:
        return 'success';
      default:
        return 'default';
    }
  };
  
  // Get payment status chip color
  const getPaymentStatusChipColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return 'warning';
      case PaymentStatus.PARTIAL:
        return 'info';
      case PaymentStatus.PAID:
        return 'success';
      case PaymentStatus.REFUNDED:
        return 'error';
      default:
        return 'default';
    }
  };
  
  if (loading) {
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
  
  if (error && !order) {
    return (
      <DashboardLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={() => router.push('/orders')}>
                Back to Orders
              </Button>
            }
          >
            {error}
          </Alert>
        </Container>
      </DashboardLayout>
    );
  }
  
  if (!order) {
    return (
      <DashboardLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={() => router.push('/orders')}>
                Back to Orders
              </Button>
            }
          >
            Order not found
          </Alert>
        </Container>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Order #{order.orderNumber}
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
              <Typography color="text.primary">Order #{order.orderNumber}</Typography>
            </Breadcrumbs>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/orders')}
            >
              Back to Orders
            </Button>
            {order.status !== OrderStatus.CANCELLED && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => router.push(`/orders/${id}/edit`)}
              >
                Edit Order
              </Button>
            )}
          </Box>
        </Box>
        
        {/* Error and Success Alerts */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert 
            severity="success" 
            sx={{ mb: 3 }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}
        
        {/* Order Status Bar */}
        <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1">Status:</Typography>
            <Chip 
              label={order.status.charAt(0).toUpperCase() + order.status.slice(1)} 
              color={getStatusChipColor(order.status) as any}
            />
            {order.status !== OrderStatus.CANCELLED && (
              <Button 
                size="small" 
                variant="outlined"
                onClick={() => {
                  setNewStatus(order.status);
                  setStatusDialogOpen(true);
                }}
              >
                Update Status
              </Button>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1">Payment:</Typography>
            <Chip 
              label={order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)} 
              color={getPaymentStatusChipColor(order.paymentStatus) as any}
            />
            {order.status !== OrderStatus.CANCELLED && (
              <Button 
                size="small" 
                variant="outlined"
                onClick={() => {
                  setNewPaymentStatus(order.paymentStatus);
                  setPaymentDialogOpen(true);
                }}
              >
                Update Payment
              </Button>
            )}
          </Box>
          
          <Box>
            {order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.COMPLETED && (
              <Button 
                color="error" 
                variant="outlined" 
                startIcon={<CancelIcon />}
                onClick={() => setCancelDialogOpen(true)}
              >
                Cancel Order
              </Button>
            )}
          </Box>
        </Paper>
        
        <Grid container spacing={3}>
          {/* Order Details */}
          <Grid item xs={12} md={8}>
            {/* Order Information */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Order Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CalendarTodayIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Order Date
                      </Typography>
                      <Typography variant="body1">
                        {formatDateTime(order.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Customer
                      </Typography>
                      <Typography variant="body1">
                        {order.partyName}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                {order.paymentMethod && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PaymentIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Payment Method
                        </Typography>
                        <Typography variant="body1">
                          {order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1).replace('_', ' ')}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                
                {order.trackingNumber && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <ShippingIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Tracking Number
                        </Typography>
                        <Typography variant="body1">
                          {order.trackingNumber}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                
                {order.completedAt && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CheckCircleIcon sx={{ mr: 1, color: 'success.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Completed Date
                        </Typography>
                        <Typography variant="body1">
                          {formatDateTime(order.completedAt)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                
                {order.notes && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <NotesIcon sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Notes
                        </Typography>
                        <Typography variant="body1">
                          {order.notes}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
            
            {/* Order Items */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Order Items
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
            
            
          </Grid>
          
          {/* Order Summary and Customer Information */}
          <Grid item xs={12} md={4}>
            {/* Order Summary */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body1">Subtotal:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body1" align="right">
                      {formatCurrency(order.subtotal)}
                    </Typography>
                  </Grid>
                  
                  {order.discount > 0 && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body1">Discount:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1" align="right" color="error">
                          -{formatCurrency(order.discount)}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  
                  {order.tax > 0 && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body1">Tax:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1" align="right">
                          {formatCurrency(order.tax)}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  
                  {order.shipping > 0 && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body1">Shipping:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1" align="right">
                          {formatCurrency(order.shipping)}
                        </Typography>
                      </Grid>
                    </>
                  )}
                </Grid>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="h6">Total:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h6" align="right">
                      {formatCurrency(order.total)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  fullWidth
                >
                  Print Order
                </Button>
              </Box>
            </Paper>
            
            {/* Customer Information */}
            {customer && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Customer Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography variant="subtitle1" fontWeight={600}>
                    {customer.name}
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Contact Information
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {customer.email}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {customer.phone}
                    </Typography>
                  </Box>
                  
                  {customer.address && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Address
                      </Typography>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                        {customer.address}
                      </Typography>
                    </Box>
                  )}
                  
                  {customer.outstandingBalance !== undefined && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Outstanding Balance
                      </Typography>
                      <Typography 
                        variant="body1" 
                        fontWeight={600}
                        color={
                          customer.outstandingBalance > 0 
                            ? 'error.main' 
                            : customer.outstandingBalance < 0 
                              ? 'success.main' 
                              : 'text.primary'
                        }
                      >
                        {formatCurrency(Math.abs(customer.outstandingBalance))}
                        {customer.outstandingBalance > 0 
                          ? ' (Receivable)' 
                          : customer.outstandingBalance < 0 
                            ? ' (Payable)' 
                            : ''}
                      </Typography>
                    </Box>
                  )}
                  
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
        
        {/* Status Update Dialog */}
        <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2, minWidth: 250 }}>
              <InputLabel id="status-select-label">Status</InputLabel>
              <Select
                labelId="status-select-label"
                id="status-select"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                label="Status"
              >
                <MenuItem value={OrderStatus.PENDING}>Pending</MenuItem>
                <MenuItem value={OrderStatus.PROCESSING}>Processing</MenuItem>
                <MenuItem value={OrderStatus.SHIPPED}>Shipped</MenuItem>
                <MenuItem value={OrderStatus.DELIVERED}>Delivered</MenuItem>
                <MenuItem value={OrderStatus.COMPLETED}>Completed</MenuItem>
                <MenuItem value={OrderStatus.RETURNED}>Returned</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleStatusUpdate} 
              variant="contained"
              disabled={statusUpdateLoading}
            >
              {statusUpdateLoading ? 'Updating...' : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Payment Status Update Dialog */}
        <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)}>
          <DialogTitle>Update Payment Status</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2, minWidth: 250 }}>
              <InputLabel id="payment-status-select-label">Payment Status</InputLabel>
              <Select
                labelId="payment-status-select-label"
                id="payment-status-select"
                value={newPaymentStatus}
                onChange={(e) => setNewPaymentStatus(e.target.value as PaymentStatus)}
                label="Payment Status"
              >
                <MenuItem value={PaymentStatus.PENDING}>Pending</MenuItem>
                <MenuItem value={PaymentStatus.PARTIAL}>Partial</MenuItem>
                <MenuItem value={PaymentStatus.PAID}>Paid</MenuItem>
                <MenuItem value={PaymentStatus.REFUNDED}>Refunded</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handlePaymentStatusUpdate} 
              variant="contained"
              disabled={paymentUpdateLoading}
            >
              {paymentUpdateLoading ? 'Updating...' : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Cancel Order Confirmation Dialog */}
        <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
          <DialogTitle>Cancel Order</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to cancel this order? This will restore the product quantities to inventory.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialogOpen(false)}>No, Keep Order</Button>
            <Button 
              onClick={handleCancelOrder} 
              color="error"
              variant="contained"
              disabled={cancelLoading}
            >
              {cancelLoading ? 'Cancelling...' : 'Yes, Cancel Order'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </DashboardLayout>
  );
}