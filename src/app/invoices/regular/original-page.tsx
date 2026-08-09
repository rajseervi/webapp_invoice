import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';
import {
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Box, 
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Snackbar,
  Divider,
  Chip,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  TableSortLabel,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Stack,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  WhatsApp as WhatsAppIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  GetApp as ExportIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { collection, getDocs, orderBy, query, deleteDoc, doc, limit, startAfter, getCountFromServer, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import InvoicePrintButton from '../components/InvoicePrintButton';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import PageHeader from '@/components/PageHeader/PageHeader';
import EnhancedPdfActions from '@/components/invoices/EnhancedPdfActions';
import ImprovedPdfDownloadButton from '@/components/invoices/ImprovedPdfDownloadButton';
import BulkPdfDownloadButton from '@/components/invoices/BulkPdfDownloadButton';
import InvoiceWithStockService from '@/services/invoiceWithStockService';
import { Invoice } from '@/types/invoice_no_gst';

interface RegularInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  partyName: string;
  partyGstin?: string;
  partyAddress?: string;
  partyPhone?: string;
  partyEmail?: string;
  total: number;
  createdAt: any;
  isGstInvoice?: boolean;
  totalTaxAmount?: number;
  totalTaxableAmount?: number;
  subtotal?: number;
  discount?: number;
  items?: any[];
  notes?: string;
  terms?: string;
  companyName?: string;
  companyAddress?: string;
  companyGstin?: string;
  companyPhone?: string;
  companyEmail?: string;
  paymentDetails?: any;
  status?: string;
  paymentStatus?: string;
  type?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`sales-tabpanel-${index}`}
      aria-labelledby={`sales-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function OriginalPageComponent() {
  const router = useRouter();
  const { userId, canViewAllData } = useCurrentUser();
  const [invoices, setInvoices] = useState<RegularInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<RegularInvoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [isFirstPage, setIsFirstPage] = useState(true);

  // Enhanced table features
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof RegularInvoice>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Statistics
  const [stats, setStats] = useState({
    totalSales: 0,
    gstSales: 0,
    regularSales: 0,
    totalTax: 0,
    totalRevenue: 0
  });

  const handleSendWhatsApp = (invoice: RegularInvoice) => {
    const invoiceLink = `${window.location.origin}/invoices/${invoice.id}`;
    const message = `Hello! Here is your invoice copy:\nInvoice Number: ${invoice.invoiceNumber}\nDate: ${invoice.date}\nTotal: ₹${invoice.total.toFixed(2)}\nView/Download: ${invoiceLink}`;
    
    const encodedMessage = encodeURIComponent(message);
    const phoneNumber = '91XXXXXXXXXX'; // Replace with actual party phone number
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  // Calculate statistics
  const calculateStats = (invoicesList: RegularInvoice[]) => {
    const gstInvoices = invoicesList.filter(inv => inv.isGstInvoice);
    const regularInvoices = invoicesList.filter(inv => !inv.isGstInvoice);
    
    const totalRevenue = invoicesList.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalTax = invoicesList.reduce((sum, inv) => sum + (inv.totalTaxAmount || 0), 0);
    
    setStats({
      totalSales: invoicesList.length,
      gstSales: gstInvoices.length,
      regularSales: regularInvoices.length,
      totalTax,
      totalRevenue
    });
  };

  // Fetch total count of invoices
  const fetchTotalCount = async () => {
    try {
      const coll = collection(db, 'invoices');
      let countQuery;
      
      if (canViewAllData()) {
        countQuery = coll;
      } else if (userId) {
        countQuery = query(coll, where('userId', '==', userId));
      } else {
        countQuery = coll;
      }
      
      const snapshot = await getCountFromServer(countQuery);
      setTotalCount(snapshot.data().count);
    } catch (error) {
      console.error('Error fetching total count:', error);
      setTotalCount(0);
    }
  };

  // Fetch invoices with pagination
  const fetchInvoices = async (reset = false) => {
    try {
      setLoading(true);
      
      let invoicesQuery;
      const invoicesRef = collection(db, 'invoices');
      
      if (reset || isFirstPage) {
        if (canViewAllData()) {
          invoicesQuery = query(
            invoicesRef,
            orderBy('createdAt', 'desc'),
            limit(rowsPerPage)
          );
        } else if (userId) {
          invoicesQuery = query(
            invoicesRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(rowsPerPage)
          );
        } else {
          invoicesQuery = query(
            invoicesRef,
            orderBy('createdAt', 'desc'),
            limit(rowsPerPage)
          );
        }
        setIsFirstPage(true);
      } else {
        if (canViewAllData()) {
          invoicesQuery = query(
            invoicesRef,
            orderBy('createdAt', 'desc'),
            startAfter(lastVisible),
            limit(rowsPerPage)
          );
        } else if (userId) {
          invoicesQuery = query(
            invoicesRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            startAfter(lastVisible),
            limit(rowsPerPage)
          );
        } else {
          invoicesQuery = query(
            invoicesRef,
            orderBy('createdAt', 'desc'),
            startAfter(lastVisible),
            limit(rowsPerPage)
          );
        }
      }
      
      const snapshot = await getDocs(invoicesQuery);
      const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
      setLastVisible(lastVisibleDoc);
      
      const invoicesList = snapshot.docs.map(doc => {
        const data = doc.data();
        
        let formattedDate;
        if (data.date) {
          formattedDate = data.date;
        } else if (data.createdAt) {
          if (data.createdAt.toDate) {
            formattedDate = data.createdAt.toDate().toISOString().split('T')[0];
          } else {
            formattedDate = new Date().toISOString().split('T')[0];
          }
        } else {
          formattedDate = new Date().toISOString().split('T')[0];
        }
        
        return {
          id: doc.id,
          invoiceNumber: data.invoiceNumber || `INV-${doc.id.substring(0, 6)}`,
          date: formattedDate,
          partyName: data.partyName || 'Unknown Party',
          partyGstin: data.partyGstin || '',
          partyAddress: data.partyAddress || '',
          partyPhone: data.partyPhone || '',
          partyEmail: data.partyEmail || '',
          total: typeof data.total === 'number' ? data.total : 0,
          createdAt: data.createdAt,
          isGstInvoice: data.isGstInvoice || false,
          totalTaxAmount: data.totalTaxAmount || 0,
          totalTaxableAmount: data.totalTaxableAmount || 0,
          subtotal: data.subtotal || 0,
          discount: data.discount || 0,
          items: data.items || [],
          notes: data.notes || '',
          terms: data.terms || '',
          companyName: data.companyName || '',
          companyAddress: data.companyAddress || '',
          companyGstin: data.companyGstin || '',
          companyPhone: data.companyPhone || '',
          companyEmail: data.companyEmail || '',
          paymentDetails: data.paymentDetails || {},
          status: data.status || 'Active',
          paymentStatus: data.paymentStatus || 'Pending',
          type: data.type || 'Sales Invoice'
        } as RegularInvoice;
      });
      
      setInvoices(invoicesList);
      calculateStats(invoicesList);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError('Failed to load regular invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotalCount();
    fetchInvoices(true);
  }, [userId]);

  useEffect(() => {
    if (page === 0) {
      fetchInvoices(true);
    } else {
      fetchInvoices(false);
    }
  }, [page, rowsPerPage]);

  const handleEditInvoice = (invoice: RegularInvoice) => {
    router.push(`/invoices/${invoice.id}/edit`);
  };

  const handleDeleteClick = (invoice: RegularInvoice) => {
    setSelectedInvoice(invoice);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedInvoice) return;

    try {
      setLoading(true);
      
      // Use enhanced stock service for deletion with stock reversion
      const deleteResult = await InvoiceWithStockService.deleteInvoiceWithStock(
        selectedInvoice.id,
        true // revertStock
      );

      if (!deleteResult.success) {
        setError(deleteResult.errors?.join(', ') || 'Failed to delete invoice');
        return;
      }

      // Refresh the invoice list
      fetchTotalCount();
      fetchInvoices(true);
      setPage(0);
      
      let successMsg = 'Invoice deleted successfully';
      if (deleteResult.stockRevertResult && deleteResult.stockRevertResult.processedItems > 0) {
        successMsg += ` and stock reverted for ${deleteResult.stockRevertResult.processedItems} items`;
      }
      
      setSuccessMessage(successMsg);
      setDeleteDialogOpen(false);
      setSelectedInvoice(null);
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError('Failed to delete invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const exportData = filteredInvoices.map(invoice => ({
        'Invoice Number': invoice.invoiceNumber,
        'Date': invoice.date,
        'Party Name': invoice.partyName,
        'Total Amount': invoice.total,
        'Status': invoice.status || 'Active',
        'Payment Status': invoice.paymentStatus || 'Pending',
        'GSTIN': invoice.partyGstin || '',
        'Phone': invoice.partyPhone || '',
        'Email': invoice.partyEmail || '',
      }));

      const csvContent = [
        Object.keys(exportData[0]).join(','),
        ...exportData.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `regular-invoices-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSuccessMessage('Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export data. Please try again.');
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
    setIsFirstPage(newPage === 0);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setIsFirstPage(true);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Enhanced table handlers
  const handleSort = (property: keyof RegularInvoice) => {
    const isAsc = sortBy === property && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortBy(property);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setPage(0);
    handleFilterMenuClose();
  };

  const handleTypeFilterChange = (type: string) => {
    setTypeFilter(type);
    setPage(0);
    handleFilterMenuClose();
  };

  // Transform invoice data for PDF generation
  const transformInvoiceForPdf = (invoice: RegularInvoice) => {
    // Transform items to match the new interface
    const transformedItems = (invoice.items || []).map((item: any, index: number) => ({
      id: item.id || `item-${index}`,
      productId: item.productId || item.id || `product-${index}`,
      productName: item.productName || item.name || '',
      name: item.name || item.productName || 'Unnamed Item',
      description: item.description || '',
      quantity: typeof item.quantity === 'number' ? item.quantity : 1,
      unitOfMeasurement: item.unitOfMeasurement || item.unit || 'PCS',
      price: typeof item.price === 'number' ? item.price : 0,
      discount: typeof item.discount === 'number' ? item.discount : 0,
      discountType: item.discountType || 'percentage' as const,
      finalPrice: typeof item.finalPrice === 'number' ? item.finalPrice : (item.price || 0),
      totalAmount: typeof item.totalAmount === 'number' ? item.totalAmount : (item.finalPrice || item.price || 0) * (item.quantity || 1),
      category: item.category || '',
      isService: item.isService || false,
      batchNumber: item.batchNumber || '',
      expiryDate: item.expiryDate || '',
      serialNumbers: item.serialNumbers || []
    }));

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      date: typeof invoice.date === 'string' ? invoice.date : new Date().toISOString().split('T')[0],
      dueDate: invoice.dueDate || undefined,
      partyName: invoice.partyName || 'Unknown Customer',
      partyAddress: invoice.partyAddress || '',
      partyPhone: invoice.partyPhone || '',
      partyEmail: invoice.partyEmail || '',
      items: transformedItems,
      subtotal: typeof invoice.subtotal === 'number' ? invoice.subtotal : invoice.total,
      totalDiscount: typeof invoice.discount === 'number' ? invoice.discount : 0,
      totalAmount: invoice.total,
      transportCharges: 0,
      paymentStatus: (invoice.paymentStatus?.toLowerCase() as any) || 'pending' as const,
      paidAmount: 0,
      balanceAmount: invoice.total,
      paymentTerms: invoice.terms || '',
      notes: invoice.notes || '',
      attachments: [],
      type: 'sales' as const,
      status: 'confirmed' as const,
      stockUpdated: false,
      createdAt: invoice.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: invoice.userId || userId || '',
      transactionId: invoice.id
    };
  };

  // Enhanced filtering and sorting logic
  const filteredInvoices = useMemo(() => {
    let filtered = tabValue === 0 ? invoices : invoices.filter(inv => !inv.isGstInvoice);
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.partyGstin?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status?.toLowerCase() === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      if (typeFilter === 'gst') {
        filtered = filtered.filter(invoice => invoice.isGstInvoice);
      } else if (typeFilter === 'regular') {
        filtered = filtered.filter(invoice => !invoice.isGstInvoice);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Handle different data types
      if (sortBy === 'date') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [invoices, tabValue, searchTerm, statusFilter, typeFilter, sortBy, sortDirection]);

  return (
    <ImprovedDashboardLayout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <PageHeader
          title="Regular Invoices"
          subtitle="Manage and track all your regular invoices"
          actions={
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <BulkPdfDownloadButton
                invoices={filteredInvoices}
                label="PDF Export"
              />
              <Button 
                variant="outlined"
                startIcon={<ExportIcon />}
                onClick={() => handleExportData()}
                sx={{ textTransform: 'none' }}
              >
                Export Data
              </Button>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => router.push('/invoices/new')}
                sx={{ textTransform: 'none' }}
              >
                New Invoice
              </Button>
            </Box>
          }
        />

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Sales
                    </Typography>
                    <Typography variant="h4">
                      {stats.totalSales}
                    </Typography>
                  </Box>
                  <ReceiptIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Revenue
                    </Typography>
                    <Typography variant="h4">
                      ₹{stats.totalRevenue.toFixed(2)}
                    </Typography>
                  </Box>
                  <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Regular Sales
                    </Typography>
                    <Typography variant="h4">
                      {stats.regularSales}
                    </Typography>
                  </Box>
                  <AssessmentIcon color="info" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Tax
                    </Typography>
                    <Typography variant="h4">
                      ₹{stats.totalTax.toFixed(2)}
                    </Typography>
                  </Box>
                  <AssessmentIcon color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper sx={{ p: 2 }}>
          {/* Tabs for filtering */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="regular invoice tabs">
              <Tab label={`All Invoices (${stats.totalSales})`} />
              <Tab label={`Regular Invoices (${stats.regularSales})`} />
            </Tabs>
          </Box>

          {/* Enhanced Search and Filter Controls */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={handleSearch}
              size="small"
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={handleFilterMenuOpen}
              size="small"
            >
              Filters
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              size="small"
              onClick={() => {/* Add export functionality */}}
            >
              Export
            </Button>

            {/* Show active filters */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {statusFilter !== 'all' && (
                <Chip
                  label={`Status: ${statusFilter}`}
                  size="small"
                  onDelete={() => handleStatusFilterChange('all')}
                  color="primary"
                />
              )}
              {typeFilter !== 'all' && (
                <Chip
                  label={`Type: ${typeFilter}`}
                  size="small"
                  onDelete={() => handleTypeFilterChange('all')}
                  color="primary"
                />
              )}
              {searchTerm && (
                <Chip
                  label={`Search: ${searchTerm}`}
                  size="small"
                  onDelete={() => setSearchTerm('')}
                  color="primary"
                />
              )}
            </Box>
          </Box>

          {/* Results Summary */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredInvoices.length} of {invoices.length} invoices
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total: ₹{filteredInvoices.reduce((sum, inv) => sum + inv.total, 0).toLocaleString()}
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'invoiceNumber'}
                        direction={sortBy === 'invoiceNumber' ? sortDirection : 'asc'}
                        onClick={() => handleSort('invoiceNumber')}
                      >
                        Invoice Number
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'date'}
                        direction={sortBy === 'date' ? sortDirection : 'asc'}
                        onClick={() => handleSort('date')}
                      >
                        Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'partyName'}
                        direction={sortBy === 'partyName' ? sortDirection : 'asc'}
                        onClick={() => handleSort('partyName')}
                      >
                        Party
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={sortBy === 'total'}
                        direction={sortBy === 'total' ? sortDirection : 'asc'}
                        onClick={() => handleSort('total')}
                      >
                        Total
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No invoices found</TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice, index) => (
                      <TableRow 
                        key={invoice.id} 
                        hover
                        sx={{
                          '&:nth-of-type(odd)': {
                            backgroundColor: 'rgba(0, 0, 0, 0.02)',
                          },
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                          transition: 'background-color 0.2s ease',
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar
                              sx={{ 
                                width: 32, 
                                height: 32, 
                                backgroundColor: invoice.isGstInvoice ? 'primary.main' : 'secondary.main',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                              }}
                            >
                              {invoice.isGstInvoice ? 'G' : 'R'}
                            </Avatar>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" fontWeight="600">
                                  {invoice.invoiceNumber}
                                </Typography>
                                <Chip 
                                  label={invoice.isGstInvoice ? "GST" : "REG"}
                                  size="small"
                                  color={invoice.isGstInvoice ? "primary" : "default"}
                                  variant="outlined"
                                  sx={{
                                    fontSize: '0.6rem',
                                    height: '16px',
                                    fontWeight: 'bold'
                                  }}
                                />
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                #{index + 1 + (page * rowsPerPage)}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="500">
                              {new Date(invoice.date).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(invoice.date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="600" sx={{ mb: 0.5 }}>
                              {invoice.partyName}
                            </Typography>
                            {invoice.partyGstin && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                GSTIN: {invoice.partyGstin}
                              </Typography>
                            )}
                            {invoice.partyPhone && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                📞 {invoice.partyPhone}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body1" fontWeight="700" color="primary.main">
                              ₹{invoice.total.toLocaleString()}
                            </Typography>
                            {invoice.paymentStatus && (
                              <Chip
                                label={invoice.paymentStatus}
                                size="small"
                                color={
                                  invoice.paymentStatus === 'Paid' ? 'success' :
                                  invoice.paymentStatus === 'Pending' ? 'warning' : 'error'
                                }
                                variant="outlined"
                                sx={{ fontSize: '0.65rem', mt: 0.5 }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.25} justifyContent="center" sx={{ minWidth: 140 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => router.push(`/invoices/${invoice.id}`)}
                                sx={{ 
                                  bgcolor: 'primary.main', 
                                  color: 'white',
                                  '&:hover': { bgcolor: 'primary.dark' },
                                  width: 24,
                                  height: 24
                                }}
                              >
                                <VisibilityIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                            
                            <ImprovedPdfDownloadButton
                              invoice={invoice}
                              size="small"
                              variant="icon"
                              color="secondary"
                            />
                            
                            <Tooltip title="WhatsApp">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleSendWhatsApp(invoice)}
                                sx={{ width: 24, height: 24 }}
                              >
                                <WhatsAppIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleEditInvoice(invoice)}
                                sx={{ width: 24, height: 24 }}
                              >
                                <EditIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteClick(invoice)}
                                sx={{ width: 24, height: 24 }}
                              >
                                <DeleteIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {!loading && (
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          )}
        </Paper>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <DialogTitle id="delete-dialog-title">
            Delete Invoice
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-dialog-description">
              Are you sure you want to delete invoice "{selectedInvoice?.invoiceNumber}"? 
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

        {/* Success/Error Messages */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={6000}
          onClose={() => setSuccessMessage(null)}
        >
          <Alert onClose={() => setSuccessMessage(null)} severity="success">
            {successMessage}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert onClose={() => setError(null)} severity="error">
            {error}
          </Alert>
        </Snackbar>

        {/* Filter Menu */}
        <Menu
          anchorEl={filterMenuAnchor}
          open={Boolean(filterMenuAnchor)}
          onClose={handleFilterMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 'bold' }}>
            Filter by Status
          </Typography>
          <MenuItem 
            selected={statusFilter === 'all'} 
            onClick={() => handleStatusFilterChange('all')}
          >
            <ListItemText primary="All Status" />
            {statusFilter === 'all' && <Chip size="small" label="Active" color="primary" />}
          </MenuItem>
          <MenuItem 
            selected={statusFilter === 'active'} 
            onClick={() => handleStatusFilterChange('active')}
          >
            <ListItemIcon>
              <CheckCircleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Active" />
          </MenuItem>
          <MenuItem 
            selected={statusFilter === 'cancelled'} 
            onClick={() => handleStatusFilterChange('cancelled')}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Cancelled" />
          </MenuItem>
          
          <Divider />
          
          <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 'bold' }}>
            Filter by Type
          </Typography>
          <MenuItem 
            selected={typeFilter === 'all'} 
            onClick={() => handleTypeFilterChange('all')}
          >
            <ListItemText primary="All Types" />
            {typeFilter === 'all' && <Chip size="small" label="Active" color="primary" />}
          </MenuItem>
          <MenuItem 
            selected={typeFilter === 'gst'} 
            onClick={() => handleTypeFilterChange('gst')}
          >
            <ListItemIcon>
              <ReceiptIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="GST Invoices" />
          </MenuItem>
          <MenuItem 
            selected={typeFilter === 'regular'} 
            onClick={() => handleTypeFilterChange('regular')}
          >
            <ListItemIcon>
              <AssessmentIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Regular Invoices" />
          </MenuItem>
        </Menu>
      </Container>
    </ImprovedDashboardLayout>
  );
}
