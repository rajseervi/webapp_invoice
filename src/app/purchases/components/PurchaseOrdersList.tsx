"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
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
  Typography,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  LocalShipping as ReceiveIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { PurchaseOrder, PurchaseFilters } from '@/types/purchase';
import PurchaseService from '@/services/purchaseService';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';

interface PurchaseOrdersListProps {
  onStatsUpdate?: (stats: any) => void;
}

export default function PurchaseOrdersList({ onStatsUpdate }: PurchaseOrdersListProps) {
  const router = useRouter();
  const { userId } = useCurrentUser();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState<PurchaseFilters>({
    status: 'all',
    paymentStatus: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  // Fetch purchase orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const result = await PurchaseService.getPurchaseOrders(filters, rowsPerPage);
      setOrders(result.orders);
      setTotalCount(result.orders.length); // For now, using orders length
      
      // Update stats
      if (onStatsUpdate) {
        const stats = await PurchaseService.getPurchaseStatistics(userId);
        onStatsUpdate(stats);
      }
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters, page, rowsPerPage, userId]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field: keyof PurchaseFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const handleViewOrder = (order: PurchaseOrder) => {
    router.push(`/purchases/${order.id}`);
  };

  const handleEditOrder = (order: PurchaseOrder) => {
    router.push(`/purchases/${order.id}/edit`);
  };

  const handleDeleteClick = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedOrder) return;

    try {
      setLoading(true);
      const result = await PurchaseService.deletePurchaseOrder(selectedOrder.id, true);
      
      if (result.success) {
        setSuccessMessage('Purchase order deleted successfully');
        fetchOrders();
      } else {
        setError(result.errors?.join(', ') || 'Failed to delete purchase order');
      }
    } catch (err) {
      console.error('Error deleting purchase order:', err);
      setError('Failed to delete purchase order');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setSelectedOrder(null);
    }
  };

  const handleReceiveOrder = (order: PurchaseOrder) => {
    router.push(`/purchases/${order.id}/receive`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'pending': return 'warning';
      case 'approved': return 'info';
      case 'received': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'partial': return 'info';
      case 'paid': return 'success';
      default: return 'default';
    }
  };

  if (loading && orders.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={() => setShowFilters(!showFilters)}
        >
          Filters
        </Button>
        
        {showFilters && (
          <>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status || 'all'}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="received">Received</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Payment Status</InputLabel>
              <Select
                value={filters.paymentStatus || 'all'}
                label="Payment Status"
                onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
              >
                <MenuItem value="all">All Payment</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="partial">Partial</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Search"
              value={filters.searchTerm || ''}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              placeholder="Search orders..."
            />
          </>
        )}
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>PO Number</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment Status</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No purchase orders found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {order.purchaseOrderNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {order.date}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {order.supplierName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      size="small"
                      color={getStatusColor(order.status) as any}
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.paymentStatus}
                      size="small"
                      color={getPaymentStatusColor(order.paymentStatus) as any}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      ₹{order.totalAmount.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewOrder(order)}
                        title="View Order"
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      
                      {order.status !== 'received' && order.status !== 'cancelled' && (
                        <>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditOrder(order)}
                            title="Edit Order"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          
                          {order.status === 'approved' && (
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleReceiveOrder(order)}
                              title="Receive Order"
                            >
                              <ReceiveIcon fontSize="small" />
                            </IconButton>
                          )}
                        </>
                      )}
                      
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(order)}
                        title="Delete Order"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Purchase Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete purchase order "{selectedOrder?.purchaseOrderNumber}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Message */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
    </Box>
  );
}