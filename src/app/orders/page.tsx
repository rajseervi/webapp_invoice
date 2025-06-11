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
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  alpha,
  Tooltip,
  Badge,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Stack,
  Avatar,
  LinearProgress
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
  FilterList as FilterListIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Schedule as ScheduleIcon,
  AttachMoney as AttachMoneyIcon,
  ShoppingCart as ShoppingCartIcon,
  Person as PersonIcon,
  CalendarToday as CalendarTodayIcon,
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  Sort as SortIcon
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
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'customer'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Menu state
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  // Statistics state
  const [statistics, setStatistics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    recentOrders: 0,
    recentRevenue: 0
  });
  
  // Fetch orders and statistics
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordersData, statsData] = await Promise.all([
          orderService.getOrders(),
          orderService.getOrderStatistics()
        ]);
        
        setOrders(ordersData);
        setFilteredOrders(ordersData);
        setStatistics(statsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filter and sort orders when filters or sort options change
  useEffect(() => {
    let result = [...orders];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }
    
    // Apply payment filter
    if (paymentFilter !== 'all') {
      result = result.filter(order => order.paymentStatus === paymentFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.orderNumber.toLowerCase().includes(term) ||
        order.partyName.toLowerCase().includes(term) ||
        order.items.some(item => item.name.toLowerCase().includes(term))
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'amount':
          comparison = a.total - b.total;
          break;
        case 'customer':
          comparison = a.partyName.localeCompare(b.partyName);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredOrders(result);
    setPage(1); // Reset to first page when filters change
  }, [orders, searchTerm, statusFilter, paymentFilter, sortBy, sortOrder]);
  
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
  
  // Get paginated orders
  const getPaginatedOrders = () => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  };
  
  // Handle page change
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    try {
      setLoading(true);
      const [ordersData, statsData] = await Promise.all([
        orderService.getOrders(),
        orderService.getOrderStatistics()
      ]);
      
      setOrders(ordersData);
      setStatistics(statsData);
      setError(null);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 4 
        }}>
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
              Order Management
            </Typography>
            <Breadcrumbs aria-label="breadcrumb">
              <MuiLink 
                underline="hover" 
                color="inherit" 
                href="/dashboard"
                sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <ShoppingCartIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Dashboard
              </MuiLink>
              <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
                <ReceiptIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Orders
              </Typography>
            </Breadcrumbs>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Tooltip title="Refresh data">
              <IconButton 
                onClick={handleRefresh}
                disabled={loading}
                sx={{ 
                  bgcolor: theme => alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { bgcolor: theme => alpha(theme.palette.primary.main, 0.2) }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export orders">
              <IconButton 
                sx={{ 
                  bgcolor: theme => alpha(theme.palette.secondary.main, 0.1),
                  '&:hover': { bgcolor: theme => alpha(theme.palette.secondary.main, 0.2) }
                }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/orders/new')}
              sx={{ 
                borderRadius: 2,
                px: 3,
                boxShadow: theme => `0 4px 10px ${alpha(theme.palette.primary.main, 0.3)}`
              }}
            >
              New Order
            </Button>
          </Box>
        </Box>
        
        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                background: theme => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                color: 'white',
                borderRadius: 2,
                boxShadow: theme => `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {statistics.totalOrders}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Orders
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <ShoppingCartIcon fontSize="large" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                background: theme => `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                color: 'white',
                borderRadius: 2,
                boxShadow: theme => `0 4px 20px ${alpha(theme.palette.success.main, 0.3)}`
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {formatCurrency(statistics.totalRevenue)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Revenue
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <AttachMoneyIcon fontSize="large" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                background: theme => `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                color: 'white',
                borderRadius: 2,
                boxShadow: theme => `0 4px 20px ${alpha(theme.palette.warning.main, 0.3)}`
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {statistics.pendingOrders}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Pending Orders
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <ScheduleIcon fontSize="large" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                background: theme => `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                color: 'white',
                borderRadius: 2,
                boxShadow: theme => `0 4px 20px ${alpha(theme.palette.info.main, 0.3)}`
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {statistics.completedOrders}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Completed Orders
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <CheckCircleIcon fontSize="large" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

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
        
        {/* Filters and Controls */}
        <Paper 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 2,
            boxShadow: theme => `0 2px 10px ${alpha(theme.palette.primary.main, 0.08)}`
          }}
        >
          <Grid container spacing={3} alignItems="center">
            {/* Search */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search orders, customers, or products..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="primary" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 1.5 }
                }}
              />
            </Grid>
            
            {/* Status Filter */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                  label="Status"
                  sx={{ borderRadius: 1.5 }}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value={OrderStatus.PENDING}>Pending</MenuItem>
                  <MenuItem value={OrderStatus.PROCESSING}>Processing</MenuItem>
                  <MenuItem value={OrderStatus.SHIPPED}>Shipped</MenuItem>
                  <MenuItem value={OrderStatus.DELIVERED}>Delivered</MenuItem>
                  <MenuItem value={OrderStatus.COMPLETED}>Completed</MenuItem>
                  <MenuItem value={OrderStatus.CANCELLED}>Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Payment Filter */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment</InputLabel>
                <Select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as PaymentStatus | 'all')}
                  label="Payment"
                  sx={{ borderRadius: 1.5 }}
                >
                  <MenuItem value="all">All Payments</MenuItem>
                  <MenuItem value={PaymentStatus.PENDING}>Pending</MenuItem>
                  <MenuItem value={PaymentStatus.PARTIAL}>Partial</MenuItem>
                  <MenuItem value={PaymentStatus.PAID}>Paid</MenuItem>
                  <MenuItem value={PaymentStatus.REFUNDED}>Refunded</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Sort Options */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'customer')}
                  label="Sort By"
                  sx={{ borderRadius: 1.5 }}
                >
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="amount">Amount</MenuItem>
                  <MenuItem value="customer">Customer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* View Controls */}
            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Tooltip title="Sort Order">
                  <IconButton
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    sx={{ 
                      bgcolor: theme => alpha(theme.palette.primary.main, 0.1),
                      '&:hover': { bgcolor: theme => alpha(theme.palette.primary.main, 0.2) }
                    }}
                  >
                    {sortOrder === 'asc' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="View Mode">
                  <IconButton
                    onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
                    sx={{ 
                      bgcolor: theme => alpha(theme.palette.secondary.main, 0.1),
                      '&:hover': { bgcolor: theme => alpha(theme.palette.secondary.main, 0.2) }
                    }}
                  >
                    {viewMode === 'table' ? <ViewModuleIcon /> : <ViewListIcon />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
          
          {/* Quick Status Filters */}
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Quick Filters:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label="All Orders" 
                color={statusFilter === 'all' && paymentFilter === 'all' ? 'primary' : 'default'} 
                onClick={() => {
                  setStatusFilter('all');
                  setPaymentFilter('all');
                }}
                size="small"
                sx={{ fontWeight: statusFilter === 'all' && paymentFilter === 'all' ? 'bold' : 'normal' }}
              />
              <Chip 
                label="Pending Payment" 
                color={paymentFilter === PaymentStatus.PENDING ? 'warning' : 'default'} 
                onClick={() => setPaymentFilter(PaymentStatus.PENDING)}
                size="small"
                sx={{ fontWeight: paymentFilter === PaymentStatus.PENDING ? 'bold' : 'normal' }}
              />
              <Chip 
                label="Ready to Ship" 
                color={statusFilter === OrderStatus.PROCESSING ? 'info' : 'default'} 
                onClick={() => setStatusFilter(OrderStatus.PROCESSING)}
                size="small"
                sx={{ fontWeight: statusFilter === OrderStatus.PROCESSING ? 'bold' : 'normal' }}
              />
              <Chip 
                label="Completed" 
                color={statusFilter === OrderStatus.COMPLETED ? 'success' : 'default'} 
                onClick={() => setStatusFilter(OrderStatus.COMPLETED)}
                size="small"
                sx={{ fontWeight: statusFilter === OrderStatus.COMPLETED ? 'bold' : 'normal' }}
              />
            </Box>
          </Box>
        </Paper>
        
        {/* Orders Display */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : viewMode === 'cards' ? (
          /* Card View */
          <Grid container spacing={3}>
            {getPaginatedOrders().length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 2 }}>
                  <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No orders found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try adjusting your filters or create a new order
                  </Typography>
                </Paper>
              </Grid>
            ) : (
              getPaginatedOrders().map((order) => (
                <Grid item xs={12} sm={6} lg={4} key={order.id}>
                  <Card 
                    sx={{ 
                      borderRadius: 2,
                      boxShadow: theme => `0 2px 10px ${alpha(theme.palette.primary.main, 0.08)}`,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme => `0 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`
                      }
                    }}
                    onClick={() => handleViewOrder(order.id!)}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {/* Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" fontWeight="bold" gutterBottom>
                            #{order.orderNumber}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                            <CalendarTodayIcon sx={{ fontSize: 16, mr: 0.5 }} />
                            {formatDate(order.createdAt)}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenActionMenu(e, order.id!);
                          }}
                          sx={{ 
                            bgcolor: theme => alpha(theme.palette.primary.main, 0.1),
                            '&:hover': { bgcolor: theme => alpha(theme.palette.primary.main, 0.2) }
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                      
                      {/* Customer */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, mr: 1.5 }}>
                          <PersonIcon fontSize="small" />
                        </Avatar>
                        <Typography variant="body1" fontWeight="medium">
                          {order.partyName}
                        </Typography>
                      </Box>
                      
                      {/* Order Details */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Items: {order.items.length} • Total: {formatCurrency(order.total)}
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={
                            order.status === OrderStatus.COMPLETED ? 100 :
                            order.status === OrderStatus.SHIPPED ? 80 :
                            order.status === OrderStatus.PROCESSING ? 60 :
                            order.status === OrderStatus.PENDING ? 20 : 0
                          }
                          sx={{ 
                            height: 6, 
                            borderRadius: 3,
                            bgcolor: theme => alpha(theme.palette.primary.main, 0.1)
                          }}
                        />
                      </Box>
                      
                      {/* Status Chips */}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip 
                          label={order.status.charAt(0).toUpperCase() + order.status.slice(1)} 
                          color={getStatusChipColor(order.status) as any}
                          size="small"
                          sx={{ fontWeight: 'medium' }}
                        />
                        <Chip 
                          label={order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)} 
                          color={getPaymentStatusChipColor(order.paymentStatus) as any}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        ) : (
          /* Table View */
          <Paper sx={{ 
            width: '100%', 
            overflow: 'hidden',
            borderRadius: 2,
            boxShadow: theme => `0 2px 10px ${alpha(theme.palette.primary.main, 0.08)}`
          }}>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 400px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: theme => alpha(theme.palette.primary.main, 0.05) }}>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Order #</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Items</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Payment</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getPaginatedOrders().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            No orders found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Try adjusting your filters or create a new order
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    getPaginatedOrders().map((order) => (
                      <TableRow 
                        key={order.id}
                        hover
                        sx={{ 
                          '&:hover': { 
                            cursor: 'pointer',
                            backgroundColor: theme => alpha(theme.palette.primary.main, 0.04)
                          },
                          transition: 'background-color 0.2s ease'
                        }}
                        onClick={() => handleViewOrder(order.id!)}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium" color="primary.main">
                            #{order.orderNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(order.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 24, height: 24, mr: 1 }}>
                              <PersonIcon sx={{ fontSize: 14 }} />
                            </Avatar>
                            <Typography variant="body2" fontWeight="medium">
                              {order.partyName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${order.items.length} items`}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 'medium' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(order.total)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={order.status.charAt(0).toUpperCase() + order.status.slice(1)} 
                            color={getStatusChipColor(order.status) as any}
                            size="small"
                            sx={{ fontWeight: 'medium' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)} 
                            color={getPaymentStatusChipColor(order.paymentStatus) as any}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenActionMenu(e, order.id!);
                            }}
                            sx={{ 
                              '&:hover': { 
                                bgcolor: theme => alpha(theme.palette.primary.main, 0.1) 
                              } 
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
        )}
        
        {/* Pagination */}
        {filteredOrders.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Stack spacing={2}>
              <Pagination
                count={Math.ceil(filteredOrders.length / itemsPerPage)}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: 2
                  }
                }}
              />
              <Typography variant="body2" color="text.secondary" align="center">
                Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
              </Typography>
            </Stack>
          </Box>
        )}
        
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