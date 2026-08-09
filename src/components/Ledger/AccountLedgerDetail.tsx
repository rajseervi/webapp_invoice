'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { ledgerService, LedgerAccount, LedgerTransaction } from '@/services/ledgerService';

interface AccountLedgerDetailProps {
  open: boolean;
  onClose: () => void;
  account: LedgerAccount | null;
}

interface LedgerSummary {
  openingBalance: number;
  totalDebits: number;
  totalCredits: number;
  closingBalance: number;
  transactionCount: number;
}

export default function AccountLedgerDetail({ open, onClose, account }: AccountLedgerDetailProps) {
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<LedgerTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<LedgerTransaction | null>(null);

  useEffect(() => {
    if (open && account) {
      loadAccountLedger();
    }
  }, [open, account]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, dateFilter]);

  const loadAccountLedger = async () => {
    if (!account) return;

    setLoading(true);
    try {
      console.log(`Loading ledger for account: ${account.accountName}`);
      
      // Get all transactions for this account
      const accountTransactions = await ledgerService.getTransactions(account.id);
      console.log(`Found ${accountTransactions.length} transactions for account ${account.accountName}`);
      
      setTransactions(accountTransactions);
      
      // Calculate summary
      const ledgerSummary = calculateLedgerSummary(accountTransactions, account.openingBalance);
      setSummary(ledgerSummary);
      
    } catch (error) {
      console.error('Error loading account ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateLedgerSummary = (transactions: LedgerTransaction[], openingBalance: number): LedgerSummary => {
    const totalDebits = transactions.reduce((sum, txn) => sum + txn.debitAmount, 0);
    const totalCredits = transactions.reduce((sum, txn) => sum + txn.creditAmount, 0);
    const closingBalance = openingBalance + totalDebits - totalCredits;

    return {
      openingBalance,
      totalDebits,
      totalCredits,
      closingBalance,
      transactionCount: transactions.length
    };
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(txn =>
        txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter.startDate) {
      filtered = filtered.filter(txn => txn.transactionDate >= dateFilter.startDate);
    }
    if (dateFilter.endDate) {
      filtered = filtered.filter(txn => txn.transactionDate <= dateFilter.endDate);
    }

    setFilteredTransactions(filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTransactionTypeIcon = (transaction: LedgerTransaction) => {
    if (transaction.debitAmount > 0) {
      return <TrendingUpIcon color="success" />;
    } else {
      return <TrendingDownIcon color="error" />;
    }
  };

  const getTransactionTypeChip = (transaction: LedgerTransaction) => {
    if (transaction.debitAmount > 0) {
      return <Chip label="Debit" color="success" size="small" />;
    } else {
      return <Chip label="Credit" color="error" size="small" />;
    }
  };

  const getReferenceTypeIcon = (referenceType: string) => {
    switch (referenceType) {
      case 'invoice':
        return <ReceiptIcon />;
      case 'payment':
        return <PaymentIcon />;
      case 'journal':
        return <AccountBalanceIcon />;
      default:
        return <AccountBalanceIcon />;
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, transaction: LedgerTransaction) => {
    setAnchorEl(event.currentTarget);
    setSelectedTransaction(transaction);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTransaction(null);
  };

  const handleExportLedger = () => {
    // TODO: Implement export functionality
    console.log('Export ledger for account:', account?.accountName);
    handleMenuClose();
  };

  const handlePrintLedger = () => {
    // TODO: Implement print functionality
    console.log('Print ledger for account:', account?.accountName);
    handleMenuClose();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter({ startDate: '', endDate: '' });
  };

  if (!account) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <AccountBalanceIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">
                {account.accountName} - Ledger
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Account Code: {account.accountCode} | Type: {account.accountType.toUpperCase()}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title="Refresh">
              <IconButton onClick={loadAccountLedger} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export">
              <IconButton onClick={handleExportLedger}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print">
              <IconButton onClick={handlePrintLedger}>
                <PrintIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress size={60} />
          </Box>
        ) : (
          <Box>
            {/* Summary Cards */}
            {summary && (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(summary.openingBalance)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Opening Balance
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="success.main">
                        {formatCurrency(summary.totalDebits)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Total Debits
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="error.main">
                        {formatCurrency(summary.totalCredits)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Total Credits
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography 
                        variant="h6" 
                        color={summary.closingBalance >= 0 ? 'success.main' : 'error.main'}
                      >
                        {formatCurrency(summary.closingBalance)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Closing Balance
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Filters */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Start Date"
                      value={dateFilter.startDate}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="End Date"
                      value={dateFilter.endDate}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
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

            {/* Transactions Table */}
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Transaction History ({filteredTransactions.length})
                  </Typography>
                </Box>

                {filteredTransactions.length === 0 ? (
                  <Alert severity="info">
                    No transactions found for the selected filters.
                  </Alert>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Transaction #</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Reference</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell align="right">Debit</TableCell>
                          <TableCell align="right">Credit</TableCell>
                          <TableCell align="right">Balance</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <AnimatePresence>
                          {filteredTransactions.map((transaction, index) => (
                            <motion.tr
                              key={transaction.id}
                              component={TableRow}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.2, delay: index * 0.05 }}
                              hover
                            >
                              <TableCell>
                                {formatDate(transaction.transactionDate)}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {transaction.transactionNumber}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                  {getReferenceTypeIcon(transaction.referenceType)}
                                  <Box>
                                    <Typography variant="body2">
                                      {transaction.description}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption">
                                  {transaction.referenceNumber}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {getTransactionTypeChip(transaction)}
                              </TableCell>
                              <TableCell align="right">
                                {transaction.debitAmount > 0 && (
                                  <Typography variant="body2" color="success.main" fontWeight="medium">
                                    {formatCurrency(transaction.debitAmount)}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                {transaction.creditAmount > 0 && (
                                  <Typography variant="body2" color="error.main" fontWeight="medium">
                                    {formatCurrency(transaction.creditAmount)}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <Typography 
                                  variant="body2" 
                                  fontWeight="medium"
                                  color={transaction.runningBalance >= 0 ? 'success.main' : 'error.main'}
                                >
                                  {formatCurrency(transaction.runningBalance)}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleMenuClick(e, transaction)}
                                >
                                  <MoreVertIcon />
                                </IconButton>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          // Handle view transaction details
          console.log('View transaction:', selectedTransaction);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          // Handle edit transaction
          console.log('Edit transaction:', selectedTransaction);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Transaction</ListItemText>
        </MenuItem>
      </Menu>
    </Dialog>
  );
}