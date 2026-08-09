"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CardActions,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Badge,
  Stack,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  WhatsApp as WhatsAppIcon,
  FilterList as FilterListIcon,
  Today as TodayIcon,
  DateRange as DateRangeIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  AttachMoney as AttachMoneyIcon,
  CalendarToday as CalendarTodayIcon,
  Clear as ClearIcon,
  AccountBalance as GstIcon,
  Description as RegularIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { collection, getDocs, orderBy, query, deleteDoc, doc, limit, startAfter, getCountFromServer, where, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import InvoicePrintButton from '@/app/invoices/components/InvoicePrintButton';

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  partyName: string;
  total: number;
  createdAt: any;
  status?: 'draft' | 'sent' | 'paid' | 'overdue';
  partyId?: string;
  items?: any[];
  subtotal?: number;
  discount?: number;
  type?: 'gst' | 'regular';
  gstAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  partyGstin?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, index, value, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`invoice-tabpanel-${index}`}
      aria-labelledby={`invoice-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `invoice-tab-${index}`,
    'aria-controls': `invoice-tabpanel-${index}`,
  };
}

interface InvoiceTabPanelProps {
  onCreateInvoice?: () => void;
  onCreateGstInvoice?: () => void;
  onCreateInclusiveGstInvoice?: () => void;
}

export default function InvoiceTabPanel({ onCreateInvoice, onCreateGstInvoice, onCreateInclusiveGstInvoice }: InvoiceTabPanelProps) {
  const router = useRouter();
  const { userId, canViewAllData } = useCurrentUser();
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Data state
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [gstCount, setGstCount] = useState(0);
  const [regularCount, setRegularCount] = useState(0);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [partyFilter, setPartyFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Separate invoices by type
  const gstInvoices = useMemo(() => {
    return allInvoices.filter(invoice => {
      // Consider an invoice as GST if it has GST-related fields or party has GSTIN
      return invoice.type === 'gst' || 
             invoice.gstAmount || 
             invoice.cgst || 
             invoice.sgst || 
             invoice.igst ||
             invoice.partyGstin;
    });
  }, [allInvoices]);

  const regularInvoices = useMemo(() => {
    return allInvoices.filter(invoice => {
      // Regular invoices are those without GST components
      return invoice.type === 'regular' || 
             (!invoice.gstAmount && !invoice.cgst && !invoice.sgst && !invoice.igst && !invoice.partyGstin);
    });
  }, [allInvoices]);

  // Get current tab's invoices
  const currentInvoices = useMemo(() => {
    switch (activeTab) {
      case 0: return allInvoices;
      case 1: return gstInvoices;
      case 2: return regularInvoices;
      default: return allInvoices;
    }
  }, [activeTab, allInvoices, gstInvoices, regularInvoices]);

  // Fetch invoices with filters
  const fetchInvoices = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const invoicesRef = collection(db, 'invoices');
      let invoicesQuery = query(invoicesRef, orderBy('createdAt', 'desc'));
      
      // Apply user-based filtering
      if (!canViewAllData() && userId) {
        invoicesQuery = query(invoicesQuery, where('userId', '==', userId));
      }
      
      // Apply date filters
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        invoicesQuery = query(
          invoicesQuery,
          where('createdAt', '>=', Timestamp.fromDate(start)),
          where('createdAt', '<=', Timestamp.fromDate(end))
        );
      }
      
      // Apply pagination
      if (!reset && page > 0) {
        invoicesQuery = query(invoicesQuery, limit(rowsPerPage * (page + 1)));
      } else {
        invoicesQuery = query(invoicesQuery, limit(rowsPerPage * 5)); // Load more initially
      }
      
      const snapshot = await getDocs(invoicesQuery);
      const invoicesList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          invoiceNumber: data.invoiceNumber || `INV-${doc.id.substring(0, 6)}`,
          date: data.date || new Date().toISOString().split('T')[0],
          partyName: data.partyName || 'Unknown Party',
          total: typeof data.total === 'number' ? data.total : 0,
          createdAt: data.createdAt,
          status: data.status || 'draft',
          partyId: data.partyId,
          items: data.items || [],
          subtotal: data.subtotal || 0,
          discount: data.discount || 0,
          type: data.type,
          gstAmount: data.gstAmount,
          cgst: data.cgst,
          sgst: data.sgst,
          igst: data.igst,
          partyGstin: data.partyGstin
        } as Invoice;
      });
      
      setAllInvoices(invoicesList);
      
      // Update counts
      setTotalCount(invoicesList.length);
      setGstCount(invoicesList.filter(inv => 
        inv.type === 'gst' || inv.gstAmount || inv.cgst || inv.sgst || inv.igst || inv.partyGstin
      ).length);
      setRegularCount(invoicesList.filter(inv => 
        inv.type === 'regular' || (!inv.gstAmount && !inv.cgst && !inv.sgst && !inv.igst && !inv.partyGstin)
      ).length);
      
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter invoices based on search and filter criteria
  const filteredInvoices = useMemo(() => {
    return currentInvoices.filter(invoice => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
          invoice.partyName.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      // Status filter
      if (statusFilter !== 'all' && invoice.status !== statusFilter) {
        return false;
      }
      
      // Party filter
      if (partyFilter && !invoice.partyName.toLowerCase().includes(partyFilter.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [currentInvoices, searchTerm, statusFilter, partyFilter]);

  // Calculate summary statistics for current tab
  const summaryStats = useMemo(() => {
    const stats = {
      totalInvoices: filteredInvoices.length,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      gstAmount: 0
    };
    
    filteredInvoices.forEach(invoice => {
      stats.totalAmount += invoice.total;
      
      if (invoice.gstAmount) {
        stats.gstAmount += invoice.gstAmount;
      }
      
      switch (invoice.status) {
        case 'paid':
          stats.paidAmount += invoice.total;
          break;
        case 'overdue':
          stats.overdueAmount += invoice.total;
          break;
        default:
          stats.pendingAmount += invoice.total;
      }
    });
    
    return stats;
  }, [filteredInvoices]);

  // Initial data fetch
  useEffect(() => {
    fetchInvoices(true);
  }, [userId, startDate, endDate]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setPage(0); // Reset pagination when changing tabs
  };

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle invoice actions
  const handleViewInvoice = (invoice: Invoice) => {
    router.push(`/invoices/${invoice.id}`);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    // Check if it's a GST invoice
    const isGstInvoice = invoice.type === 'gst' || 
                         invoice.gstAmount || 
                         invoice.cgst || 
                         invoice.sgst || 
                         invoice.igst ||
                         invoice.partyGstin;
    
    if (isGstInvoice) {
      router.push(`/invoices/gst/${invoice.id}/edit`);
    } else {
      router.push(`/invoices/${invoice.id}/edit`);
    }
  };

  const handleDeleteClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedInvoice) return;

    try {
      setLoading(true);
      const invoiceRef = doc(db, 'invoices', selectedInvoice.id);
      await deleteDoc(invoiceRef);
      
      // Refresh data
      fetchInvoices(true);
      setSuccessMessage('Invoice deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedInvoice(null);
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError('Failed to delete invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsApp = (invoice: Invoice) => {
    const invoiceLink = `${window.location.origin}/invoices/${invoice.id}`;
    const message = `Hello! Here is your invoice copy:\nInvoice Number: ${invoice.invoiceNumber}\nDate: ${invoice.date}\nTotal: ₹${invoice.total.toFixed(2)}\nView/Download: ${invoiceLink}`;
    const encodedMessage = encodeURIComponent(message);
    const phoneNumber = '91XXXXXXXXXX'; // Replace with actual party phone number
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('all');
    setPartyFilter('');
    setStartDate('');
    setEndDate('');
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'sent': return 'info';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  // Render invoice table
  const renderInvoiceTable = () => (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Invoice Number</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Party</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Amount</TableCell>
            {activeTab === 1 && <TableCell align="right">GST Amount</TableCell>}
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={activeTab === 1 ? 8 : 7} align="center">
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : filteredInvoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={activeTab === 1 ? 8 : 7} align="center">
                No invoices found
              </TableCell>
            </TableRow>
          ) : (
            filteredInvoices
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {invoice.invoiceNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.partyName}</TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.type === 'gst' || invoice.gstAmount ? 'GST' : 'Regular'}
                      color={invoice.type === 'gst' || invoice.gstAmount ? 'primary' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.status || 'draft'}
                      color={getStatusColor(invoice.status || 'draft') as any}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      ₹{invoice.total.toFixed(2)}
                    </Typography>
                  </TableCell>
                  {activeTab === 1 && (
                    <TableCell align="right">
                      <Typography variant="body2" color="primary">
                        ₹{(invoice.gstAmount || 0).toFixed(2)}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="View Invoice">
                        <IconButton size="small" onClick={() => handleViewInvoice(invoice)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <InvoicePrintButton 
                        invoiceId={invoice.id} 
                        invoiceNumber={invoice.invoiceNumber} 
                      />
                      <Tooltip title="Send via WhatsApp">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleSendWhatsApp(invoice)}
                        >
                          <WhatsAppIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Invoice">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditInvoice(invoice)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Invoice">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(invoice)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
          )}
        </TableBody>
      </Table>
      
      <TablePagination
        component="div"
        count={filteredInvoices.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </TableContainer>
  );

  // Render summary cards
  const renderSummaryCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <ReceiptIcon color="primary" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h4" component="div">
                  {summaryStats.totalInvoices}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Invoices
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <TrendingUpIcon color="success" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h4" component="div">
                  ₹{summaryStats.totalAmount.toFixed(0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Amount
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <AttachMoneyIcon color="success" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h4" component="div">
                  ₹{summaryStats.paidAmount.toFixed(0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Paid Amount
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <TodayIcon color="warning" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h4" component="div">
                  ₹{summaryStats.pendingAmount.toFixed(0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Amount
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      {activeTab === 1 && (
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <GstIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    ₹{summaryStats.gstAmount.toFixed(0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total GST
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header with Create Buttons */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Invoices Management
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RegularIcon />}
            onClick={onCreateInvoice || (() => router.push('/invoices/new'))}
          >
            New Regular Invoice
          </Button>
          <Button
            variant="contained"
            startIcon={<GstIcon />}
            onClick={onCreateGstInvoice || (() => router.push('/invoices/gst/new'))}
          >
            New GST Invoice
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AttachMoneyIcon />}
            onClick={onCreateInclusiveGstInvoice || (() => router.push('/invoices/gst/inclusive'))}
          >
            GST Invoice (Inclusive)
          </Button>
        </Stack>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
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
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="sent">Sent</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              placeholder="Filter by party..."
              value={partyFilter}
              onChange={(e) => setPartyFilter(e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={1}>
            <Button
              fullWidth
              variant="outlined"
              onClick={clearFilters}
              startIcon={<ClearIcon />}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="invoice tabs">
            <Tab
              label={
                <Badge badgeContent={totalCount} color="primary" showZero>
                  All Invoices
                </Badge>
              }
              icon={<ReceiptIcon />}
              iconPosition="start"
              {...a11yProps(0)}
            />
            <Tab
              label={
                <Badge badgeContent={gstCount} color="primary" showZero>
                  GST Invoices
                </Badge>
              }
              icon={<GstIcon />}
              iconPosition="start"
              {...a11yProps(1)}
            />
            <Tab
              label={
                <Badge badgeContent={regularCount} color="primary" showZero>
                  Regular Invoices
                </Badge>
              }
              icon={<RegularIcon />}
              iconPosition="start"
              {...a11yProps(2)}
            />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          {renderSummaryCards()}
          {renderInvoiceTable()}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {renderSummaryCards()}
          {renderInvoiceTable()}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {renderSummaryCards()}
          {renderInvoiceTable()}
        </TabPanel>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Invoice</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete invoice {selectedInvoice?.invoiceNumber}? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Message */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error Message */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}