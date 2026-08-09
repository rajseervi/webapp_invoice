"use client";
import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  CircularProgress,
  Stack,
  useTheme,
  alpha,
  Avatar,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  DateRange as DateRangeIcon,
  MonetizationOn as MoneyIcon
} from '@mui/icons-material';
import { invoiceService, Invoice } from '@/services/invoiceService';
import { ClassicInvoicePdfService } from '@/services/classicInvoicePdfService';
import { useRouter } from 'next/navigation';

interface InvoiceManagerProps {
  onCreateInvoice?: () => void;
}

export default function EnhancedInvoiceManager({ onCreateInvoice }: InvoiceManagerProps) {
  const theme = useTheme();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuInvoice, setMenuInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const invoiceData = await invoiceService.getInvoices();
      setInvoices(invoiceData);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadInvoices();
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewDialogOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    // Navigate to edit page
    router.push(`/invoices/edit/${invoice.id}`);
  };

  const handleDeleteInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedInvoice?.id) {
      try {
        await invoiceService.deleteInvoice(selectedInvoice.id);
        await loadInvoices();
        setDeleteDialogOpen(false);
        setSelectedInvoice(null);
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, invoice: Invoice) => {
    setAnchorEl(event.currentTarget);
    setMenuInvoice(invoice);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuInvoice(null);
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      await ClassicInvoicePdfService.generateClassicInvoicePDF(invoice, {
        action: 'download',
        filename: `invoice-${invoice.invoiceNumber}.pdf`
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      // You might want to show a toast notification here
    }
  };

  const getStatusChip = (status?: string) => {
    const statusValue = status || 'pending';
    const statusConfig = {
      paid: { color: 'success' as const, label: 'Paid' },
      pending: { color: 'warning' as const, label: 'Pending' },
      overdue: { color: 'error' as const, label: 'Overdue' },
      draft: { color: 'default' as const, label: 'Draft' }
    };
    
    const config = statusConfig[statusValue as keyof typeof statusConfig] || statusConfig.pending;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const formatCurrency = (amount?: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-IN');
    } catch {
      return dateString;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !searchTerm || 
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesType = typeFilter === 'all' || invoice.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading invoices...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 0, px: 0 }}>
      {/* Header Section */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              📋 Invoice Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage and track all your invoices in one place
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              sx={{ borderRadius: 2 }}
            >
              Refresh
            </Button>
            {onCreateInvoice && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onCreateInvoice}
                sx={{ borderRadius: 2 }}
              >
                Create Invoice
              </Button>
            )}
          </Stack>
        </Box>

        {/* Filters */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
              }}
              sx={{ borderRadius: 2 }}
            />
          </Grid>
          <Grid item xs={12} sm={3} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3} md={2}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="sales">Sales</MenuItem>
                <MenuItem value="purchase">Purchase</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main, mx: 'auto', mb: 1, width: 40, height: 40 }}>
                <ReceiptIcon />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {filteredInvoices.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Invoices
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Avatar sx={{ bgcolor: theme.palette.success.main, mx: 'auto', mb: 1, width: 40, height: 40 }}>
                <MoneyIcon />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {formatCurrency(filteredInvoices.reduce((sum, inv) => sum + (inv.total || inv.totalAmount || 0), 0))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Value
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Avatar sx={{ bgcolor: theme.palette.warning.main, mx: 'auto', mb: 1, width: 40, height: 40 }}>
                <PersonIcon />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {new Set(filteredInvoices.map(inv => inv.partyId || inv.customer?.name)).size}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unique Customers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Avatar sx={{ bgcolor: theme.palette.info.main, mx: 'auto', mb: 1, width: 40, height: 40 }}>
                <DateRangeIcon />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {filteredInvoices.filter(inv => inv.status === 'pending').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Invoices Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {filteredInvoices.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No invoices found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'Try adjusting your filters to see more results.'
                  : 'Create your first invoice to get started.'
                }
              </Typography>
              {onCreateInvoice && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={onCreateInvoice}
                >
                  Create First Invoice
                </Button>
              )}
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Customer/Party</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {invoice.invoiceNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {invoice.partyName || invoice.customer?.name || 'Unknown'}
                          </Typography>
                          {(invoice.customer?.phone || invoice.partyPhone) && (
                            <Typography variant="caption" color="text.secondary">
                              {invoice.customer?.phone || invoice.partyPhone}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(invoice.createdAt || invoice.saleDate || invoice.date)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(invoice.total || invoice.totalAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(invoice.status)}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={invoice.type === 'sales' ? 'Sales' : invoice.type === 'purchase' ? 'Purchase' : 'Invoice'}
                          variant="outlined"
                          size="small"
                          color={invoice.type === 'sales' ? 'primary' : 'secondary'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          onClick={(e) => handleMenuOpen(e, invoice)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleViewInvoice(menuInvoice!); handleMenuClose(); }}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleEditInvoice(menuInvoice!); handleMenuClose(); }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Invoice</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { console.log('Print:', menuInvoice); handleMenuClose(); }}>
          <ListItemIcon>
            <PrintIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Print</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { 
          if (menuInvoice) {
            handleDownloadPDF(menuInvoice);
          }
          handleMenuClose(); 
        }}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download PDF</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => { handleDeleteInvoice(menuInvoice!); handleMenuClose(); }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* View Invoice Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Invoice Details - {selectedInvoice?.invoiceNumber}
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>Customer/Party</Typography>
                <Typography variant="body2">
                  {selectedInvoice.partyName || selectedInvoice.customer?.name || 'Unknown'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>Amount</Typography>
                <Typography variant="body2">
                  {formatCurrency(selectedInvoice.total || selectedInvoice.totalAmount)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>Date</Typography>
                <Typography variant="body2">
                  {formatDate(selectedInvoice.createdAt || selectedInvoice.saleDate || selectedInvoice.date)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>Status</Typography>
                {getStatusChip(selectedInvoice.status)}
              </Grid>
              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Items</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell align="right">Qty</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedInvoice.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.name || `Item ${index + 1}`}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                            <TableCell align="right">{formatCurrency(item.finalPrice || item.subtotal || (item.quantity * item.price))}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<PrintIcon />}>
            Print
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Invoice</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete invoice {selectedInvoice?.invoiceNumber}? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}