"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Stack,
  Divider,
  Avatar,
  LinearProgress,
  Badge,
  TablePagination,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Payment as PaymentIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
  Timeline as TimelineIcon,
  AccountBalance as BankIcon
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';

import PurchaseInvoiceServiceNoGST from '@/services/purchaseInvoiceServiceNoGST';
import SupplierService from '@/services/supplierService';
import { Supplier } from '@/types/purchase_no_gst';
import { PurchaseInvoice, PurchaseInvoiceFilters, PurchaseInvoiceStatistics } from '@/types/purchase_no_gst';

export default function PurchaseInvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [statistics, setStatistics] = useState<PurchaseInvoiceStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');

  // Filters and pagination
  const [filters, setFilters] = useState<PurchaseInvoiceFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadData();
  }, [page, filters]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm !== (filters.searchTerm || '')) {
        setFilters(prev => ({ ...prev, searchTerm: searchTerm || undefined }));
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, filters.searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [invoicesData, suppliersData, statsData] = await Promise.all([
        PurchaseInvoiceServiceNoGST.getPurchaseInvoices(
          filters,
          { field: 'purchaseDate', direction: 'desc' },
          { page: page - 1, limit: 20 }
        ),
        SupplierService.getActiveSuppliers(),
        PurchaseInvoiceServiceNoGST.getStatistics()
      ]);

      setInvoices(invoicesData.invoices);
      setSuppliers(suppliersData);
      setStatistics(statsData);
      setHasMore(invoicesData.hasMore);
      setTotalPages(Math.ceil(invoicesData.totalCount / 20));
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load purchase invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, invoice: PurchaseInvoice) => {
    setAnchorEl(event.currentTarget);
    setSelectedInvoice(invoice);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInvoice(null);
  };

  const handleView = () => {
    if (selectedInvoice) {
      router.push(`/inventory/purchase-invoices/${selectedInvoice.id}`);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedInvoice) {
      router.push(`/inventory/purchase-invoices/${selectedInvoice.id}/edit`);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedInvoice) return;

    try {
      setLoading(true);
      await PurchaseInvoiceServiceNoGST.deletePurchaseInvoice(selectedInvoice.id!, true);
      await loadData();
      setDeleteDialog(false);
      handleMenuClose();
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError('Failed to delete invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedInvoice || !paymentAmount || !paymentMethod) return;

    try {
      setLoading(true);
      await PurchaseInvoiceServiceNoGST.addPayment({
        purchaseInvoiceId: selectedInvoice.id!,
        amount: paymentAmount,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: paymentMethod as any,
        notes: `Payment for invoice ${selectedInvoice.invoiceNumber}`
      });
      
      await loadData();
      setPaymentDialog(false);
      setPaymentAmount(0);
      setPaymentMethod('');
      handleMenuClose();
    } catch (err) {
      console.error('Error adding payment:', err);
      setError('Failed to add payment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'partial': return 'warning';
      case 'pending': return 'default';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setPage(1);
  };

  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Purchase Invoices"
        pageType="Inventory management for purchase invoices and supplier payments"
        enableVisualEffects={true}
        enableParticles={false}
        customQuickActions={[
          { icon: <AddIcon />, label: 'New Invoice', onClick: () => router.push('/inventory/purchase-invoices/new') },
          { icon: <ExportIcon />, label: 'Export', onClick: () => {} },
          { icon: <RefreshIcon />, label: 'Refresh', onClick: loadData },
        ]}
      >
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        {statistics && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                      <ReceiptIcon sx={{ fontSize: 28 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {statistics.totalInvoices}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Total Invoices
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                      <MoneyIcon sx={{ fontSize: 28 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {formatCurrency(statistics.totalAmount)}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Total Amount
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                      <BankIcon sx={{ fontSize: 28 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {formatCurrency(statistics.pendingAmount)}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Pending Amount
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                      <TimelineIcon sx={{ fontSize: 28 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {statistics.thisMonthInvoices}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        This Month
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterIcon />
                Filters
              </Typography>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                size="small"
              >
                Clear Filters
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Supplier</InputLabel>
                  <Select
                    value={filters.supplierId || ''}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, supplierId: e.target.value || undefined }));
                      setPage(1);
                    }}
                    label="Supplier"
                  >
                    <MenuItem value="">All Suppliers</MenuItem>
                    {suppliers.map((supplier) => (
                      <MenuItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Payment Status</InputLabel>
                  <Select
                    value={filters.paymentStatus || ''}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, paymentStatus: e.target.value || undefined }));
                      setPage(1);
                    }}
                    label="Payment Status"
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="partial">Partial</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                    <MenuItem value="overdue">Overdue</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="From Date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, dateFrom: e.target.value || undefined }));
                    setPage(1);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="To Date"
                  value={filters.dateTo || ''}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, dateTo: e.target.value || undefined }));
                    setPage(1);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={1}>
                <Tooltip title="Refresh data">
                  <IconButton onClick={loadData} color="primary">
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice Number</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Paid</TableCell>
                  <TableCell>Balance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No purchase invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {invoice.invoiceNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Supplier: {invoice.supplierInvoiceNumber}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {invoice.supplierName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {formatDate(invoice.purchaseDate)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(invoice.finalAmount)}
                      </TableCell>
                      <TableCell>
                        <Typography color="success.main">
                          {formatCurrency(invoice.paidAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography color={invoice.balanceAmount > 0 ? "error.main" : "success.main"}>
                          {formatCurrency(invoice.balanceAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={invoice.paymentStatus.toUpperCase()}
                          color={getStatusColor(invoice.paymentStatus) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, invoice)}
                          size="small"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </Paper>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleView}>
            <ViewIcon sx={{ mr: 1 }} />
            View
          </MenuItem>
          <MenuItem onClick={handleEdit}>
            <EditIcon sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          {selectedInvoice && selectedInvoice.balanceAmount > 0 && (
            <MenuItem onClick={() => setPaymentDialog(true)}>
              <PaymentIcon sx={{ mr: 1 }} />
              Add Payment
            </MenuItem>
          )}
          <MenuItem onClick={() => setDeleteDialog(true)} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
          <DialogTitle>Delete Purchase Invoice</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete invoice {selectedInvoice?.invoiceNumber}?
              This action will also revert the stock changes.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <LoadingButton
              onClick={handleDelete}
              loading={loading}
              color="error"
              variant="contained"
            >
              Delete
            </LoadingButton>
          </DialogActions>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Payment</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Invoice: {selectedInvoice?.invoiceNumber}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Balance Amount: {selectedInvoice ? formatCurrency(selectedInvoice.balanceAmount) : ''}
              </Typography>
              
              <TextField
                fullWidth
                type="number"
                label="Payment Amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                InputProps={{ inputProps: { min: 0, max: selectedInvoice?.balanceAmount } }}
                sx={{ mt: 2, mb: 2 }}
              />

              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  label="Payment Method"
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="bank">Bank Transfer</MenuItem>
                  <MenuItem value="cheque">Cheque</MenuItem>
                  <MenuItem value="upi">UPI</MenuItem>
                  <MenuItem value="card">Card</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPaymentDialog(false)}>Cancel</Button>
            <LoadingButton
              onClick={handlePayment}
              loading={loading}
              variant="contained"
              disabled={!paymentAmount || !paymentMethod}
            >
              Add Payment
            </LoadingButton>
          </DialogActions>
        </Dialog>
        </Container>
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}