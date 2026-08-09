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
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Schedule as PendingIcon,
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CheckCircle as ConfirmIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';

import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import { OrderService } from '@/services/orderService';
import { Order } from '@/types/order';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/utils/numberUtils';
import { formatDate } from '@/utils/dateUtils';

function PendingOrdersPage() {
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

  useEffect(() => {
    if (currentUser) {
      fetchPendingOrders();
    }
  }, [currentUser]);

  const fetchPendingOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const allOrders = await OrderService.getAllOrders();
      const pendingOrders = allOrders.filter(order => order.status === 'pending');
      setOrders(pendingOrders);
    } catch (err: any) {
      console.error("Error fetching pending orders:", err);
      setError(err.message || "Failed to fetch pending orders.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order: Order) => {
    router.push(`/orders/${order.id}`);
  };

  const handleEditOrder = (order: Order) => {
    router.push(`/orders/${order.id}/edit`);
  };

  const handleConfirmOrder = async (orderId: string) => {
    try {
      await OrderService.updateOrderStatus(orderId, 'confirmed');
      fetchPendingOrders(); // Refresh the list
    } catch (err: any) {
      console.error("Error confirming order:", err);
      setError(err.message || "Failed to confirm order.");
    }
  };

  const filteredOrders = orders.filter(order =>
    order.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (!currentUser) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary">
              Please log in to access pending orders
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
          background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
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
                <PendingIcon sx={{ mr: 0.5, fontSize: 16 }} />
                Pending Orders
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
                      background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.primary.main} 100%)`,
                    }}
                  >
                    <PendingIcon />
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
                      Pending Orders
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Manage and track orders awaiting confirmation
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
                        background: alpha(theme.palette.warning.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.warning.main, mb: 0.5 }}>
                        {orders.length}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Pending Orders
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
                        {formatCurrency(orders.reduce((sum, order) => sum + order.total, 0))}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Total Value
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
                        onClick={fetchPendingOrders}
                        sx={{ 
                          borderRadius: 2,
                          '&:hover': {
                            background: alpha(theme.palette.primary.main, 0.05),
                          }
                        }}
                      >
                        Refresh
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
              <Grid item xs={12} md={6}>
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
                <PendingIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Pending Orders Found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {searchTerm ? 'Try adjusting your search criteria' : 'All orders have been processed or no orders exist yet'}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => router.push('/orders/new')}
                >
                  Create First Order
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
                        <TableCell>Date</TableCell>
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
                            <Typography variant="subtitle2" fontWeight="bold">
                              {formatCurrency(order.total)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label="Pending"
                              color="warning"
                              size="small"
                              icon={<PendingIcon />}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <Tooltip title="View Order">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewOrder(order)}
                                  color="primary"
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Order">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditOrder(order)}
                                  color="secondary"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Confirm Order">
                                <IconButton
                                  size="small"
                                  onClick={() => handleConfirmOrder(order.id!)}
                                  color="success"
                                >
                                  <ConfirmIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
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

export default function ModernPendingOrdersPage() {
  return (
    <VisuallyEnhancedDashboardLayout
      title="Pending Orders"
      pageType="orders"
      enableVisualEffects={true}
      enableParticles={false}
    >
      <PendingOrdersPage />
    </VisuallyEnhancedDashboardLayout>
  );
}