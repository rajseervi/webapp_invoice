"use client"
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Card,
  CardContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { 
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { transactionService } from '@/services/transactionService';
import { formatDate } from '@/utils/dateUtils';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [transactionType, setTransactionType] = useState('all');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const transactionsData = await transactionService.getTransactions();
      setTransactions(transactionsData || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredTransactions = transactions.filter((transaction: any) => {
    // Filter by search query
    const searchMatch = 
      transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.partyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.reference?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by date range
    const dateMatch = 
      (!dateRange.startDate || new Date(transaction.date) >= new Date(dateRange.startDate)) &&
      (!dateRange.endDate || new Date(transaction.date) <= new Date(dateRange.endDate));
    
    // Filter by transaction type
    const typeMatch = 
      transactionType === 'all' || 
      (transactionType === 'debit' && transaction.amount < 0) ||
      (transactionType === 'credit' && transaction.amount > 0);
    
    return searchMatch && dateMatch && typeMatch;
  });

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Transactions</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => window.location.href = '/accounting/transactions/new'}
          >
            Add Transaction
          </Button>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small"
                onClick={fetchTransactions}
              >
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search transactions..."
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                size="small"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                size="small"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={transactionType}
                  label="Type"
                  onChange={(e) => setTransactionType(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="credit">Credit</MenuItem>
                  <MenuItem value="debit">Debit</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 440 }}>
                <Table stickyHeader aria-label="transactions table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Party</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((transaction: any) => (
                          <TableRow hover key={transaction.id}>
                            <TableCell>{formatDate(transaction.date)}</TableCell>
                            <TableCell>{transaction.partyName}</TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell>{transaction.reference || '-'}</TableCell>
                            <TableCell align="right">
                              <Typography
                                sx={{
                                  color: transaction.amount > 0 ? 'success.main' : 'error.main',
                                  fontWeight: 500
                                }}
                              >
                                {transaction.amount > 0 ? '+' : ''}
                                ₹{Math.abs(transaction.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => window.location.href = `/accounting/transactions/${transaction.id}`}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => window.location.href = `/accounting/transactions/${transaction.id}/edit`}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          <Typography variant="body1" color="text.secondary">
                            No transactions found
                          </Typography>
                          <Button
                            variant="text"
                            startIcon={<AddIcon />}
                            onClick={() => window.location.href = '/accounting/transactions/new'}
                            sx={{ mt: 1 }}
                          >
                            Add Transaction
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredTransactions.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </Paper>
      </Container>
    </DashboardLayout>
  );
}