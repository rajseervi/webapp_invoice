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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Print as PrintIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { orderService } from '@/services/orderService';
import { Order, OrderStatus, PaymentStatus } from '@/types/order';
import { formatCurrency } from '@/utils/numberUtils';
import { formatDate } from '@/utils/dateUtils';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  
  // Menu state
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await orderService.getOrders();
        setOrders(data);
        setFilteredOrders(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);
  
  // Filter orders when search term or status filter changes
  useEffect(() => {
    let result = orders;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.orderNumber.toLowerCase().includes(term) ||
        order.partyName.toLowerCase().includes(term)
      );
    }
    
    setFilteredOrders(result);
  }, [orders, searchTerm, statusFilter]);
  
  // Handle opening action menu
  const handleOpenActionMenu = (event: React.MouseEvent<HTMLElement>, orderId: string) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedOrderId(orderId);
  };
  
  // Handle closing action menu
  const handleCloseActionMenu = () => {
    setActionMenuAnchor(null);
    setSelectedOrderId(null);
  };
  
  // Handle view order
  const handleViewOrder = (orderId: string) => {
    router.push(`/orders/${orderId}`);
    handleCloseActionMenu();
  };
  
  // Handle edit order
  const handleEditOrder = (orderId: string) => {
    router.push(`/orders/${orderId}/edit`);
    handleCloseActionMenu();
  };
  
  // Handle update order status
  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, status);
      
      // Update the orders list
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status, updatedAt: new Date().toISOString() } 
            : order
        )
      );
      
      handleCloseActionMenu();
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status. Please try again.');
    }
  };
  
  // Handle cancel order
  const handleCancelOrder = async (orderId: string) => {
    try {
      await orderService.cancelOrder(orderId);
      
      // Update the orders list
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: OrderStatus.CANCELLED, updatedAt: new Date().toISOString() } 
            : order
        )
      );
      
      handleCloseActionMenu();
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError('Failed to cancel order. Please try again.');
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
  
  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Orders
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
              <Typography color="text.primary">Orders</Typography>
            </Breadcrumbs>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/orders/new')}
          >
            New Order
          </Button>
        </Box>
        
        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        
        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              placeholder="Search orders..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, maxWidth: { xs: '100%', sm: '300px' } }}
            />
            
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label="All" 
                color={statusFilter === 'all' ? 'primary' : 'default'} 
                onClick={() => setStatusFilter('all')}
                sx={{ fontWeight: statusFilter === 'all' ? 'bold' : 'normal' }}
              />
              <Chip 
                label="Pending" 
                color={statusFilter === OrderStatus.PENDING ? 'primary' : 'default'} 
                onClick={() => setStatusFilter(OrderStatus.PENDING)}
                sx={{ fontWeight: statusFilter === OrderStatus.PENDING ? 'bold' : 'normal' }}
              />
              <Chip 
                label="Processing" 
                color={statusFilter === OrderStatus.PROCESSING ? 'primary' : 'default'} 
                onClick={() => setStatusFilter(OrderStatus.PROCESSING)}
                sx={{ fontWeight: statusFilter === OrderStatus.PROCESSING ? 'bold' : 'normal' }}
              />
              <Chip 
                label="Shipped" 
                color={statusFilter === OrderStatus.SHIPPED ? 'primary' : 'default'} 
                onClick={() => setStatusFilter(OrderStatus.SHIPPED)}
                sx={{ fontWeight: statusFilter === OrderStatus.SHIPPED ? 'bold' : 'normal' }}
              />
              <Chip 
                label="Completed" 
                color={statusFilter === OrderStatus.COMPLETED ? 'primary' : 'default'} 
                onClick={() => setStatusFilter(OrderStatus.COMPLETED)}
                sx={{ fontWeight: statusFilter === OrderStatus.COMPLETED ? 'bold' : 'normal' }}
              />
            </Box>
          </Box>
        </Paper>
        
        {/* Orders Table */}
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <CircularProgress size={40} />
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        No orders found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow 
                      key={order.id}
                      hover
                      sx={{ 
                        '&:hover': { 
                          cursor: 'pointer',
                          backgroundColor: 'action.hover'
                        }
                      }}
                      onClick={() => handleViewOrder(order.id!)}
                    >
                      <TableCell>{order.orderNumber}</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>{order.partyName}</TableCell>
                      <TableCell>{formatCurrency(order.total)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={order.status.charAt(0).toUpperCase() + order.status.slice(1)} 
                          color={getStatusChipColor(order.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)} 
                          color={getPaymentStatusChipColor(order.paymentStatus) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenActionMenu(e, order.id!);
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        
        {/* Action Menu */}
        <Menu
          anchorEl={actionMenuAnchor}
          open={Boolean(actionMenuAnchor)}
          onClose={handleCloseActionMenu}
        >
          <MenuItem onClick={() => selectedOrderId && handleViewOrder(selectedOrderId)}>
            <ListItemIcon>
              <VisibilityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => selectedOrderId && handleEditOrder(selectedOrderId)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Order</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => selectedOrderId && handleUpdateStatus(selectedOrderId, OrderStatus.PROCESSING)}>
            <ListItemIcon>
              <FilterListIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Mark as Processing</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => selectedOrderId && handleUpdateStatus(selectedOrderId, OrderStatus.SHIPPED)}>
            <ListItemIcon>
              <ShippingIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Mark as Shipped</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => selectedOrderId && handleUpdateStatus(selectedOrderId, OrderStatus.COMPLETED)}>
            <ListItemIcon>
              <CheckCircleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Mark as Completed</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => selectedOrderId && handleCancelOrder(selectedOrderId)}>
            <ListItemIcon>
              <CancelIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText sx={{ color: 'error.main' }}>Cancel Order</ListItemText>
          </MenuItem>
        </Menu>
      </Container>
    </DashboardLayout>
  );
}