"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Card,
  CardContent,
  Grid,
  Tooltip,
  useTheme,
  useMediaQuery,
  Stack,
  Avatar,
  alpha,
  Breadcrumbs,
  Link as MuiLink,
  TablePagination,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CompletedIcon,
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  LocalShipping as ShippedIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import { OrderService } from '@/services/orderService';
import { Order } from '@/types/order';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/utils/numberUtils';
import { formatDate } from '@/utils/dateUtils';

function CompletedOrdersPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { currentUser } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'party'>('date');
  const [dateFilter, setDateFilter] = useState<'all' | 'thisMonth' | 'lastMonth' | 'thisYear'>('all');

  useEffect(() => {
    if (currentUser) {
      fetchCompletedOrders();
    }
  }, [currentUser]);

  const fetchCompletedOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const allOrders = await OrderService.getAllOrders();
      const completedOrders = allOrders.filter(order => order.status === 'completed');
      setOrders(completedOrders);
    } catch (err: any) {
      console.error("Error fetching completed orders:", err);
      setError(err.message || "Failed to fetch completed orders.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order: Order) => {
    router.push(`/orders/${order.id}`);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // Date filtering
    const orderDate = new Date(order.orderDate);
    const now = new Date();
    
    switch (dateFilter) {
      case 'thisMonth':
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return orderDate.getMonth() === lastMonth.getMonth() && orderDate.getFullYear() === lastMonth.getFullYear();
      case 'thisYear':
        return orderDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
      case 'amount':
        return b.total - a.total;
      case 'party':
        return a.partyName.localeCompare(b.partyName);
      default:
        return 0;
    }
  });

  const paginatedOrders = sortedOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculate statistics
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const thisMonthOrders = orders.filter(order => {
    const orderDate = new Date(order.orderDate);
    const now = new Date();
    return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
  });
  const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => sum + order.total, 0);

  if (!currentUser) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary">
              Please log in to access completed orders
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 0, px: 0 }}>
      {/* Enhanced Header Section */}
      <Paper 
        elevation={0}
        sx={{ 
          background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
          borderRadius: 0,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          mb: 0,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ py: { xs: 3, md: 4 } }}>
            {/* Breadcrumbs */}
            <Breadcrumbs 
              separator="›" 
              sx={{ 
                mb: 2,
                '& .MuiBreadcrumbs-separator': {
                  color: alpha(theme.palette.text.secondary, 0.6),
                  mx: 1
                }
              }}
            >
              <MuiLink 
                color="inherit" 
                href="/dashboard"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                <DashboardIcon sx={{ mr: 0.5, fontSize: 16 }} />
                Dashboard
              </MuiLink>
              <MuiLink 
                color="inherit" 
                href="/orders"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                <ReceiptIcon sx={{ mr: 0.5, fontSize: 16 }} />
                Orders
              </MuiLink>
              <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
                <CompletedIcon sx={{ mr: 0.5, fontSize: 16 }} />
                Completed Orders
              </Typography>
            </Breadcrumbs>

            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      mr: 2,
                      background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.primary.main} 100%)`,
                    }}
                  >
                    <CompletedIcon />
                  </Avatar>
                  <Box>
                    <Typography 
                      variant="h3" 
                      component="h1" 
                      sx={{ 
                        fontWeight: 800,
                        background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(theme.palette.text.primary, 0.8)} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 0.5
                      }}
                    >
                      Completed Orders
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Track and analyze your successfully completed orders
                    </Typography>
                  </Box>
                </Box>

                {/* Quick Stats */}
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6} sm={3}>
                    <Card 
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        background: alpha(theme.palette.success.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.success.main, mb: 0.5 }}>
                        {orders.length}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Total Completed
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card 
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        background: alpha(theme.palette.primary.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main, mb: 0.5 }}>
                        {formatCurrency(totalRevenue)}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Total Revenue
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card 
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        background: alpha(theme.palette.info.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.info.main, mb: 0.5 }}>
                        {thisMonthOrders.length}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        This Month
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card 
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        background: alpha(theme.palette.secondary.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.secondary.main, mb: 0.5 }}>
                        {formatCurrency(thisMonthRevenue)}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Month Revenue
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                  <Stack direction={{ xs: 'column', sm: 'row', md: 'column' }} spacing={2}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<AddIcon />}
                      onClick={() => router.push('/orders/new')}
                      sx={{
                        borderRadius: 3,
                        px: 3,
                        py: 1.5,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.4)}`,
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      Create Order
                    </Button>
                    
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Button
                        variant="text"
                        size="small"
                        startIcon={<RefreshIcon />}
                        onClick={fetchCompletedOrders}
                        sx={{ 
                          borderRadius: 2,
                          '&:hover': {
                            background: alpha(theme.palette.primary.main, 0.05),
                          }
                        }}
                      >
                        Refresh
                      </Button>
                      <Button
                        variant="text"
                        size="small"
                        startIcon={<DownloadIcon />}
                        sx={{ 
                          borderRadius: 2,
                          '&:hover': {
                            background: alpha(theme.palette.secondary.main, 0.05),
                          }
                        }}
                      >
                        Export
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Paper>

      {/* Filters and Search */}
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search orders by party name or order number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ borderRadius: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <MenuItem value="date">Order Date</MenuItem>
                    <MenuItem value="amount">Amount</MenuItem>
                    <MenuItem value="party">Party Name</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Date Filter</InputLabel>
                  <Select
                    value={dateFilter}
                    label="Date Filter"
                    onChange={(e) => setDateFilter(e.target.value as any)}
                  >
                    <MenuItem value="all">All Time</MenuItem>
                    <MenuItem value="thisMonth">This Month</MenuItem>
                    <MenuItem value="lastMonth">Last Month</MenuItem>
                    <MenuItem value="thisYear">This Year</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Orders Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : paginatedOrders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <CompletedIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Completed Orders Found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {searchTerm || dateFilter !== 'all' ? 'Try adjusting your search or filter criteria' : 'No orders have been completed yet'}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => router.push('/orders/new')}
                >
                  Create New Order
                </Button>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Order Details</TableCell>
                        <TableCell>Party</TableCell>
                        <TableCell>Completion Date</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedOrders.map((order) => (
                        <TableRow key={order.id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {order.orderNumber}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {order.partyName}
                                </Typography>
                                {order.partyPhone && (
                                  <Typography variant="caption" color="text.secondary">
                                    {order.partyPhone}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CalendarIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 16 }} />
                              <Typography variant="body2">
                                {formatDate(order.orderDate)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle2" fontWeight="bold" color="success.main">
                              {formatCurrency(order.total)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label="Completed"
                              color="success"
                              size="small"
                              icon={<CompletedIcon />}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="View Order">
                              <IconButton
                                size="small"
                                onClick={() => handleViewOrder(order)}
                                color="primary"
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={sortedOrders.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </Container>
  );
}

export default function ModernCompletedOrdersPage() {
  return (
    <VisuallyEnhancedDashboardLayout
      title="Completed Orders"
      pageType="orders"
      enableVisualEffects={true}
      enableParticles={false}
    >
      <CompletedOrdersPage />
    </VisuallyEnhancedDashboardLayout>
  );
}