"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import PageHeader from '@/components/PageHeader/PageHeader';
import {
  Container,
  Typography,
  Paper,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  DatePicker,
  Avatar,
  Divider,
  Stack,
  Badge,
  useTheme,
  TablePagination,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  CreditCard as CreditCardIcon,
  MonetizationOn as MonetizationOnIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Party } from '@/types/party';
import { Transaction } from '@/types/transaction';
import { format, isValid, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Enhanced interfaces for better data handling
interface LedgerEntry extends Transaction {
  balance?: number;
  formattedDate?: string;
  description?: string;
  invoiceNumber?: string;
  items?: Array<{ 
    productName: string; 
    quantity: number; 
    price: number; 
    total: number;
    category?: string;
  }>;
  dueDate?: string;
  status?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  isOverdue?: boolean;
  daysPastDue?: number;
}

interface PartyDetails extends Party {
  totalTransactions?: number;
  totalSales?: number;
  totalPayments?: number;
  averageTransactionValue?: number;
  lastTransactionDate?: string;
}

interface TransactionSummary {
  totalDebit: number;
  totalCredit: number;
  netBalance: number;
  transactionCount: number;
  averageTransaction: number;
}

interface FilterOptions {
  dateFrom: Date | null;
  dateTo: Date | null;
  transactionType: string;
  status: string;
  amountRange: {
    min: number;
    max: number;
  };
}

export default function PartyStatementPage() {
  const params = useParams();
  const partyId = params.id as string;
  const router = useRouter();
  const theme = useTheme();

  // Core state
  const [partyDetails, setPartyDetails] = useState<PartyDetails | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingBalance, setOpeningBalance] = useState<number>(0);

  // Enhanced state for improved functionality
  const [transactionSummary, setTransactionSummary] = useState<TransactionSummary>({
    totalDebit: 0,
    totalCredit: 0,
    netBalance: 0,
    transactionCount: 0,
    averageTransaction: 0
  });

  // Filter and pagination state
  const [filters, setFilters] = useState<FilterOptions>({
    dateFrom: startOfMonth(subMonths(new Date(), 3)), // Last 3 months by default
    dateTo: new Date(),
    transactionType: 'all',
    status: 'all',
    amountRange: { min: 0, max: 999999 }
  });
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Utility functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const calculateDaysPastDue = (dueDate: string) => {
    if (!dueDate || dueDate === 'N/A') return 0;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getStatusColor = (status: string, isOverdue: boolean) => {
    if (isOverdue) return 'error';
    switch (status?.toLowerCase()) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const applyFilters = (entries: LedgerEntry[]) => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const dateInRange = (!filters.dateFrom || entryDate >= filters.dateFrom) &&
                         (!filters.dateTo || entryDate <= filters.dateTo);
      
      const typeMatch = filters.transactionType === 'all' || 
                       entry.type?.toLowerCase() === filters.transactionType.toLowerCase();
      
      const statusMatch = filters.status === 'all' || 
                         entry.status?.toLowerCase() === filters.status.toLowerCase();
      
      const amount = (entry.debit || 0) + (entry.credit || 0);
      const amountInRange = amount >= filters.amountRange.min && amount <= filters.amountRange.max;
      
      return dateInRange && typeMatch && statusMatch && amountInRange;
    });
  };

  const calculateSummary = (entries: LedgerEntry[]): TransactionSummary => {
    const totalDebit = entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
    const totalCredit = entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);
    const netBalance = totalDebit - totalCredit;
    const transactionCount = entries.length;
    const averageTransaction = transactionCount > 0 ? (totalDebit + totalCredit) / transactionCount : 0;

    return {
      totalDebit,
      totalCredit,
      netBalance,
      transactionCount,
      averageTransaction
    };
  };

  useEffect(() => {
    if (!partyId) return;

    const fetchPartyDetails = async () => {
      try {
        const partyRef = doc(db, 'parties', partyId);
        const partySnap = await getDoc(partyRef);
        if (partySnap.exists()) {
          const partyData = { id: partySnap.id, ...partySnap.data() } as PartyDetails;
          setPartyDetails(partyData);
        } else {
          setError('Party not found.');
        }
      } catch (err) {
        console.error('Error fetching party details:', err);
        setError('Failed to fetch party details.');
      }
    };

    const fetchTransactions = async () => {
      try {
        // Fetch Sales (Invoices) with enhanced data processing
        const salesQuery = query(
          collection(db, 'invoices'),
          where('partyId', '==', partyId)
        );
        const salesSnapshot = await getDocs(salesQuery);
        const salesData = salesSnapshot.docs.map(doc => {
          const data = doc.data();
          let formattedDate = 'N/A';
          let transactionDate = new Date();
          let formattedDueDate = 'N/A';
          let dueDate = null;

          // Enhanced date handling
          if (data.date || data.createdAt) {
            const dateField = data.date || data.createdAt;
            if (typeof dateField.toDate === 'function') {
              transactionDate = dateField.toDate();
            } else if (dateField instanceof Date) {
              transactionDate = dateField;
            } else if (typeof dateField === 'string') {
              transactionDate = new Date(dateField);
              if (isNaN(transactionDate.getTime())) {
                transactionDate = new Date();
              }
            }
            formattedDate = format(transactionDate, 'dd MMM yyyy');
          }
          
          // Enhanced due date handling
          if (data.dueDate) {
            if (typeof data.dueDate.toDate === 'function') {
              dueDate = data.dueDate.toDate();
              formattedDueDate = format(dueDate, 'dd MMM yyyy');
            } else if (data.dueDate instanceof Date) {
              dueDate = data.dueDate;
              formattedDueDate = format(dueDate, 'dd MMM yyyy');
            } else if (typeof data.dueDate === 'string') {
              try {
                dueDate = new Date(data.dueDate);
                if (!isNaN(dueDate.getTime())) {
                  formattedDueDate = format(dueDate, 'dd MMM yyyy');
                }
              } catch (e) {
                console.warn(`Could not parse dueDate for invoice ${doc.id}`);
              }
            }
          }

          const daysPastDue = dueDate ? calculateDaysPastDue(dueDate.toISOString()) : 0;
          const isOverdue = daysPastDue > 0 && data.status !== 'paid';

          return {
            id: doc.id,
            ...data,
            type: 'Sale',
            date: transactionDate,
            formattedDate: formattedDate,
            description: `Invoice #${data.invoiceNumber || doc.id}`,
            invoiceNumber: data.invoiceNumber,
            items: data.items || [],
            dueDate: formattedDueDate,
            status: data.status || 'pending',
            debit: data.totalAmount || data.total || 0,
            credit: 0,
            isOverdue,
            daysPastDue,
          } as LedgerEntry;
        });

        // Fetch Payments with enhanced data processing
        const paymentsQuery = query(
          collection(db, 'payments'),
          where('partyId', '==', partyId)
        );
        const paymentsSnapshot = await getDocs(paymentsQuery);
        const paymentsData = paymentsSnapshot.docs.map(doc => {
          const data = doc.data();
          let formattedDate = 'N/A';
          let transactionDate = new Date();
          
          if (data.date || data.createdAt) {
            const dateField = data.date || data.createdAt;
            if (typeof dateField.toDate === 'function') {
              transactionDate = dateField.toDate();
            } else if (dateField instanceof Date) {
              transactionDate = dateField;
            } else if (typeof dateField === 'string') {
              transactionDate = new Date(dateField);
              if (isNaN(transactionDate.getTime())) {
                transactionDate = new Date();
              }
            }
            formattedDate = format(transactionDate, 'dd MMM yyyy');
          }
          
          return {
            id: doc.id,
            ...data,
            type: 'Payment',
            date: transactionDate,
            formattedDate: formattedDate,
            description: `Payment - ${data.paymentMethod || 'Cash'}`,
            paymentMethod: data.paymentMethod || data.method,
            referenceNumber: data.referenceNumber,
            debit: 0,
            credit: data.amount || 0,
            status: 'paid',
            isOverdue: false,
            daysPastDue: 0,
          } as LedgerEntry;
        });

        // Combine all transactions
        let allTransactions = [...salesData, ...paymentsData];

        // Sort by date (most recent first)
        allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        // Calculate running balance
        let currentBalance = openingBalance;
        const entriesWithBalance = allTransactions.map(tx => {
          currentBalance += (tx.debit || 0) - (tx.credit || 0);
          return { ...tx, balance: currentBalance };
        });

        setLedgerEntries(entriesWithBalance);
        
        // Calculate summary statistics
        const summary = calculateSummary(entriesWithBalance);
        setTransactionSummary(summary);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to fetch transactions. Please try again later.');
      }
    };

    const loadData = async () => {
      setLoading(true);
      await fetchPartyDetails();
      await fetchTransactions(); // Ensure party details are fetched first if needed for transactions
      setLoading(false);
    };

    loadData();
  }, [partyId, openingBalance]);

  // Apply filters when filters change or ledger entries change
  useEffect(() => {
    const filtered = applyFilters(ledgerEntries);
    setFilteredEntries(filtered);
    setPage(0); // Reset to first page when filters change
  }, [ledgerEntries, filters]);

  // Event handlers
  const handleExpandRow = (rowId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Implement export functionality
    console.log('Export functionality to be implemented');
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <Container sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <CircularProgress size={60} />
          </Box>
        </Container>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <Container sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        </Container>
      </DashboardLayout>
    );
  }

  // No party details state
  if (!partyDetails) {
    return (
      <DashboardLayout>
        <Container sx={{ mt: 4, mb: 4 }}>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            Party details not available.
          </Alert>
        </Container>
      </DashboardLayout>
    );
  }

  // Calculate pagination
  const paginatedEntries = filteredEntries.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DashboardLayout>
        <PageHeader title={`Statement for ${partyDetails.name}`} />
        
        <Container sx={{ mt: 2, mb: 4 }}>
          {/* Party Information Card */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: theme.shadows[3] }}>
            <Grid container spacing={3}>
              {/* Party Details */}
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: theme.palette.primary.main,
                      fontSize: '2rem',
                      fontWeight: 600
                    }}
                  >
                    {partyDetails.name.charAt(0).toUpperCase()}
                  </Avatar>
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                      {partyDetails.name}
                    </Typography>
                    
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body1" color="text.secondary">
                          {partyDetails.email}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body1" color="text.secondary">
                          {partyDetails.phone}
                        </Typography>
                      </Box>
                      
                      {partyDetails.address && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body1" color="text.secondary">
                            {partyDetails.address}
                          </Typography>
                        </Box>
                      )}
                      
                      {partyDetails.gstin && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BusinessIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body1" color="text.secondary">
                            GSTIN: {partyDetails.gstin}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                </Box>
              </Grid>
              
              {/* Action Buttons */}
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    startIcon={<PrintIcon />}
                    onClick={handlePrint}
                    sx={{ borderRadius: 2 }}
                  >
                    Print Statement
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExport}
                    sx={{ borderRadius: 2 }}
                  >
                    Export PDF
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, boxShadow: theme.shadows[2] }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.success.light }}>
                      <TrendingUpIcon sx={{ color: theme.palette.success.main }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                        {formatCurrency(transactionSummary.totalDebit)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Sales
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, boxShadow: theme.shadows[2] }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.info.light }}>
                      <TrendingDownIcon sx={{ color: theme.palette.info.main }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'info.main' }}>
                        {formatCurrency(transactionSummary.totalCredit)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Payments
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, boxShadow: theme.shadows[2] }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: transactionSummary.netBalance >= 0 ? theme.palette.warning.light : theme.palette.error.light 
                    }}>
                      <AccountBalanceIcon sx={{ 
                        color: transactionSummary.netBalance >= 0 ? theme.palette.warning.main : theme.palette.error.main 
                      }} />
                    </Avatar>
                    <Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          color: transactionSummary.netBalance >= 0 ? 'warning.main' : 'error.main' 
                        }}
                      >
                        {formatCurrency(Math.abs(transactionSummary.netBalance))}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {transactionSummary.netBalance >= 0 ? 'Outstanding' : 'Credit Balance'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, boxShadow: theme.shadows[2] }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.primary.light }}>
                      <ReceiptIcon sx={{ color: theme.palette.primary.main }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {transactionSummary.transactionCount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Transactions
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filters Section */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: theme.shadows[2] }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Transaction History
              </Typography>
              <Button
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
                sx={{ borderRadius: 2 }}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </Box>
            
            <Collapse in={showFilters}>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <MuiDatePicker
                    label="From Date"
                    value={filters.dateFrom}
                    onChange={(newValue) => setFilters(prev => ({ ...prev, dateFrom: newValue }))}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <MuiDatePicker
                    label="To Date"
                    value={filters.dateTo}
                    onChange={(newValue) => setFilters(prev => ({ ...prev, dateTo: newValue }))}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Transaction Type</InputLabel>
                    <Select
                      value={filters.transactionType}
                      label="Transaction Type"
                      onChange={(e) => setFilters(prev => ({ ...prev, transactionType: e.target.value }))}
                    >
                      <MenuItem value="all">All Types</MenuItem>
                      <MenuItem value="sale">Sales</MenuItem>
                      <MenuItem value="payment">Payments</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.status}
                      label="Status"
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="paid">Paid</MenuItem>
                      <MenuItem value="overdue">Overdue</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Collapse>
          </Paper>

          {/* Transactions Table */}
          <Paper sx={{ borderRadius: 3, boxShadow: theme.shadows[3] }}>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Debit</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Credit</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Balance</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <ReceiptIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary">
                            No transactions found
                          </Typography>
                          <Typography variant="body2" color="text.disabled">
                            Try adjusting your filters or date range
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedEntries.map((entry) => (
                      <React.Fragment key={entry.id}>
                        <TableRow 
                          sx={{ 
                            '&:hover': { backgroundColor: 'action.hover' },
                            cursor: 'pointer'
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {entry.formattedDate}
                              </Typography>
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            <Box>
                              {entry.type === 'Sale' ? (
                                <Link href={`/invoices/${entry.id}`} passHref legacyBehavior>
                                  <Typography 
                                    component="a" 
                                    sx={{ 
                                      cursor: 'pointer', 
                                      textDecoration: 'none', 
                                      color: 'primary.main',
                                      fontWeight: 500,
                                      '&:hover': { textDecoration: 'underline' }
                                    }}
                                  >
                                    {entry.description}
                                  </Typography>
                                </Link>
                              ) : (
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {entry.description}
                                </Typography>
                              )}
                              
                              {entry.referenceNumber && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Ref: {entry.referenceNumber}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            <Chip
                              icon={entry.type === 'Sale' ? <ReceiptIcon /> : <PaymentIcon />}
                              label={entry.type}
                              size="small"
                              color={entry.type === 'Sale' ? 'primary' : 'success'}
                              variant="outlined"
                            />
                          </TableCell>
                          
                          <TableCell>
                            <Chip
                              label={entry.status || 'N/A'}
                              size="small"
                              color={getStatusColor(entry.status || '', entry.isOverdue || false)}
                              variant="filled"
                            />
                            {entry.isOverdue && entry.daysPastDue && entry.daysPastDue > 0 && (
                              <Typography variant="caption" color="error" display="block">
                                {entry.daysPastDue} days overdue
                              </Typography>
                            )}
                          </TableCell>
                          
                          <TableCell align="right">
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: entry.debit ? 600 : 400,
                                color: entry.debit ? 'error.main' : 'text.disabled'
                              }}
                            >
                              {entry.debit ? formatCurrency(entry.debit) : '-'}
                            </Typography>
                          </TableCell>
                          
                          <TableCell align="right">
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: entry.credit ? 600 : 400,
                                color: entry.credit ? 'success.main' : 'text.disabled'
                              }}
                            >
                              {entry.credit ? formatCurrency(entry.credit) : '-'}
                            </Typography>
                          </TableCell>
                          
                          <TableCell align="right">
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 600,
                                color: (entry.balance || 0) >= 0 ? 'warning.main' : 'success.main'
                              }}
                            >
                              {formatCurrency(entry.balance || 0)}
                            </Typography>
                          </TableCell>
                          
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              {entry.items && entry.items.length > 0 && (
                                <Tooltip title="View Details">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleExpandRow(entry.id!)}
                                  >
                                    {expandedRows.has(entry.id!) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                  </IconButton>
                                </Tooltip>
                              )}
                              
                              {entry.type === 'Sale' && (
                                <Tooltip title="View Invoice">
                                  <IconButton
                                    size="small"
                                    onClick={() => router.push(`/invoices/${entry.id}`)}
                                  >
                                    <VisibilityIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                        
                        {/* Expandable Row for Item Details */}
                        {entry.items && entry.items.length > 0 && (
                          <TableRow>
                            <TableCell colSpan={8} sx={{ py: 0, border: 0 }}>
                              <Collapse in={expandedRows.has(entry.id!)} timeout="auto" unmountOnExit>
                                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, m: 1 }}>
                                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                    Invoice Items:
                                  </Typography>
                                  <List dense>
                                    {entry.items.map((item, index) => (
                                      <ListItem key={index} sx={{ py: 0.5 }}>
                                        <ListItemIcon>
                                          <MonetizationOnIcon sx={{ fontSize: 20 }} />
                                        </ListItemIcon>
                                        <ListItemText
                                          primary={
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                              {item.productName}
                                            </Typography>
                                          }
                                          secondary={
                                            <Typography variant="caption" color="text.secondary">
                                              Qty: {item.quantity} × {formatCurrency(item.price)} = {formatCurrency(item.total)}
                                            </Typography>
                                          }
                                        />
                                      </ListItem>
                                    ))}
                                  </List>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Pagination */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredEntries.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </Container>
      </DashboardLayout>
    </LocalizationProvider>
  );
}
 