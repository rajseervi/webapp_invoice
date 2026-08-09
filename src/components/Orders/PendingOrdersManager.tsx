import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Tooltip,
  Alert,
  Skeleton,
  useTheme,
  useMediaQuery,
  Fab,
  Zoom,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as ConfirmIcon,
  LocalShipping as ShipIcon,
  Cancel as CancelIcon,
  Schedule as PendingIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  Print as PrintIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { Order, OrderStatus } from '@/types/order';
import { OrderService } from '@/services/orderService';
import { formatCurrency } from '@/utils/numberUtils';
import { formatDate } from '@/utils/dateUtils';

interface PendingOrdersManagerProps {
  userId: string;
  onCreateOrder?: () => void;
  onEditOrder?: (order: Order) => void;
  onViewOrder?: (order: Order) => void;
}

interface OrderFilters {
  status: OrderStatus | 'all';
  partyName: string;
  dateFrom: string;
  dateTo: string;
}

const statusConfig = {
  pending: { label: 'Pending', color: 'warning' as const, icon: PendingIcon },
  confirmed: { label: 'Confirmed', color: 'info' as const, icon: ConfirmIcon },
  shipped: { label: 'Shipped', color: 'primary' as const, icon: ShipIcon },
  completed: { label: 'Completed', color: 'success' as const, icon: ConfirmIcon },
  cancelled: { label: 'Cancelled', color: 'error' as const, icon: CancelIcon },
};

const PendingOrdersManager: React.FC<PendingOrdersManagerProps> = ({
  userId,
  onCreateOrder,
  onEditOrder,
  onViewOrder,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  // State management
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filters
  const [filters, setFilters] = useState<OrderFilters>({
    status: 'all',
    partyName: '',
    dateFrom: '',
    dateTo: '',
  });

  // Action menu
  const [actionAnchorEl, setActionAnchorEl] = useState<null | HTMLElement>(null);
  const [actionOrder, setActionOrder] = useState<Order | null>(null);

  // Dialogs
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [filterDialog, setFilterDialog] = useState(false);

  // Status update
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending');

  // Load orders on component mount
  useEffect(() => {
    if (userId) {
      loadOrders();
    }
  }, [userId]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedOrders = await OrderService.getAllOrders();
      // Filter by userId if needed (assuming orders have userId field)
      const userOrders = fetchedOrders.filter(order => order.createdBy === userId);
      setOrders(userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Filter orders based on filters
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const statusMatch = filters.status === 'all' || order.status === filters.status;
      const partyMatch = !filters.partyName || 
        order.partyName.toLowerCase().includes(filters.partyName.toLowerCase());
      const dateFromMatch = !filters.dateFrom || 
        new Date(order.orderDate) >= new Date(filters.dateFrom);
      const dateToMatch = !filters.dateTo || 
        new Date(order.orderDate) <= new Date(filters.dateTo);

      return statusMatch && partyMatch && dateFromMatch && dateToMatch;
    });
  }, [orders, filters]);

  // Paginated orders
  const paginatedOrders = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredOrders.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredOrders, page, rowsPerPage]);

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field: keyof OrderFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(0); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      partyName: '',
      dateFrom: '',
      dateTo: '',
    });
    setPage(0);
  };

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, order: Order) => {
    setActionAnchorEl(event.currentTarget);
    setActionOrder(order);
  };

  const handleActionClose = () => {
    setActionAnchorEl(null);
    setActionOrder(null);
  };

  const handleStatusUpdate = async () => {
    if (!actionOrder) return;

    try {
      await OrderService.updateOrder(actionOrder.id!, { status: newStatus, updatedAt: new Date().toISOString() });
      await loadOrders();
      setStatusUpdateDialog(false);
      handleActionClose();
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status');
    }
  };

  const handleDeleteOrder = async () => {
    if (!actionOrder) return;

    try {
      await OrderService.deleteOrder(actionOrder.id!);
      await loadOrders();
      setDeleteDialog(false);
      handleActionClose();
    } catch (error) {
      console.error('Error deleting order:', error);
      setError('Failed to delete order');
    }
  };

  const getOrderStats = () => {
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      completed: orders.filter(o => o.status === 'completed').length,
      totalValue: orders.reduce((sum, order) => sum + order.total, 0),
    };
    return stats;
  };

  const stats = getOrderStats();

  const renderOrderRow = (order: Order) => (
    <TableRow
      key={order.id}
      hover
      sx={{
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        }
      }}
    >
      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {order.orderNumber}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatDate(order.orderDate)}
          </Typography>
        </Box>
      </TableCell>
      
      <TableCell>
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
      </TableCell>
      
      <TableCell align="center">
        <Chip
          icon={React.createElement(statusConfig[order.status].icon, { fontSize: 'small' })}
          label={statusConfig[order.status].label}
          color={statusConfig[order.status].color}
          size="small"
          variant="outlined"
        />
      </TableCell>
      
      <TableCell align="right">
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {formatCurrency(order.total)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {order.items.length} items
          </Typography>
        </Box>
      </TableCell>
      
      {order.dueDate && (
        <TableCell>
          <Typography 
            variant="body2" 
            color={new Date(order.dueDate) < new Date() ? 'error' : 'text.primary'}
          >
            {formatDate(order.dueDate)}
          </Typography>
        </TableCell>
      )}
      
      <TableCell align="center">
        <IconButton
          size="small"
          onClick={(e) => handleActionClick(e, order)}
          sx={{ borderRadius: 1 }}
        >
          <MoreVertIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );

  const renderMobileOrderCard = (order: Order) => (
    <Card
      key={order.id}
      sx={{
        mb: 2,
        '&:hover': {
          boxShadow: theme.shadows[4],
        }
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {order.orderNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDate(order.orderDate)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={React.createElement(statusConfig[order.status].icon, { fontSize: 'small' })}
              label={statusConfig[order.status].label}
              color={statusConfig[order.status].color}
              size="small"
            />
            <IconButton
              size="small"
              onClick={(e) => handleActionClick(e, order)}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" fontWeight="medium">
            {order.partyName}
          </Typography>
          {order.partyPhone && (
            <Typography variant="body2" color="text.secondary">
              📞 {order.partyPhone}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" color="primary" fontWeight="bold">
              {formatCurrency(order.total)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {order.items.length} items
            </Typography>
          </Box>
          {order.dueDate && (
            <Typography 
              variant="body2" 
              color={new Date(order.dueDate) < new Date() ? 'error' : 'text.primary'}
            >
              Due: {formatDate(order.dueDate)}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header with Stats */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptIcon color="primary" />
              <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
                Order Management
              </Typography>
            </Box>
          }
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              {!isMobile && (
                <>
                  <Tooltip title="Refresh">
                    <IconButton onClick={loadOrders} disabled={loading}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Filter">
                    <IconButton onClick={() => setFilterDialog(true)}>
                      <FilterIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              {onCreateOrder && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={onCreateOrder}
                  size={isMobile ? "small" : "medium"}
                >
                  {isMobile ? "Add" : "Create Order"}
                </Button>
              )}
            </Box>
          }
        />
        <CardContent sx={{ pt: 0 }}>
          {/* Quick Stats */}
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'warning.50', borderRadius: 1 }}>
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {stats.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'info.50', borderRadius: 1 }}>
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  {stats.confirmed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Confirmed
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'success.50', borderRadius: 1 }}>
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {stats.completed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'primary.50', borderRadius: 1 }}>
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  {formatCurrency(stats.totalValue)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Value
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Quick Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e: SelectChangeEvent<string>) => 
                    handleFilterChange('status', e.target.value as OrderStatus | 'all')
                  }
                  label="Status"
                >
                  <MenuItem value="all">All Orders</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="shipped">Shipped</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Party Name"
                value={filters.partyName}
                onChange={(e) => handleFilterChange('partyName', e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="From Date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="To Date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={clearFilters}
                size="small"
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Orders Table/Cards */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ p: 3 }}>
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} height={60} sx={{ mb: 1 }} />
              ))}
            </Box>
          ) : filteredOrders.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No orders found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {orders.length === 0 
                  ? "Create your first order to get started" 
                  : "Try adjusting your filters"
                }
              </Typography>
              {onCreateOrder && orders.length === 0 && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={onCreateOrder}
                >
                  Create First Order
                </Button>
              )}
            </Box>
          ) : isMobile ? (
            <Box sx={{ p: 2 }}>
              {paginatedOrders.map(renderMobileOrderCard)}
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order Details</TableCell>
                    <TableCell>Party</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedOrders.map(renderOrderRow)}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          {filteredOrders.length > 0 && (
            <TablePagination
              component="div"
              count={filteredOrders.length}
              page={page}
              onPageChange={handlePageChange}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 25, 50]}
              showFirstButton
              showLastButton
            />
          )}
        </CardContent>
      </Card>

      {/* Floating Action Button for Mobile */}
      {isMobile && onCreateOrder && (
        <Zoom in={!loading}>
          <Fab
            color="primary"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1000,
            }}
            onClick={onCreateOrder}
          >
            <AddIcon />
          </Fab>
        </Zoom>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(actionAnchorEl)}
        onClose={handleActionClose}
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 180 }
        }}
      >
        {onViewOrder && (
          <MenuItem onClick={() => { onViewOrder(actionOrder!); handleActionClose(); }}>
            <ListItemIcon><ViewIcon /></ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
        )}
        {onEditOrder && (
          <MenuItem onClick={() => { onEditOrder(actionOrder!); handleActionClose(); }}>
            <ListItemIcon><EditIcon /></ListItemIcon>
            <ListItemText>Edit Order</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => { setStatusUpdateDialog(true); }}>
          <ListItemIcon><ConfirmIcon /></ListItemIcon>
          <ListItemText>Update Status</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setDeleteDialog(true)} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon color="error" /></ListItemIcon>
          <ListItemText>Delete Order</ListItemText>
        </MenuItem>
      </Menu>

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateDialog} onClose={() => setStatusUpdateDialog(false)}>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
              label="New Status"
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="shipped">Shipped</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusUpdateDialog(false)}>Cancel</Button>
          <Button onClick={handleStatusUpdate} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Order</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete order "{actionOrder?.orderNumber}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteOrder} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PendingOrdersManager;