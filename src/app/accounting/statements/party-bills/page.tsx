"use client"
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import { 
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { transactionService } from '@/services/transactionService';
import { partyService } from '@/services/partyService';
import { formatDate } from '@/utils/dateUtils';
import { Party } from '@/types/party';
import { Transaction } from '@/types/transaction';

interface PartyBillStatement {
  party: Party;
  transactions: Transaction[];
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

export default function PartyBillStatementsPage() {
  const searchParams = useSearchParams();
  const partyIdParam = searchParams.get('partyId');
  
  const [partyStatements, setPartyStatements] = useState<PartyBillStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [balanceFilter, setBalanceFilter] = useState('all');
  const [expandedParty, setExpandedParty] = useState<string | null>(partyIdParam);
  const [indexUrl, setIndexUrl] = useState<string | null>(null);

  const fetchPartyStatements = async () => {
    try {
      setLoading(true);
      
      // Get all parties
      const parties = await partyService.getParties();
      
      // Get party balances
      const partyBalances = await transactionService.getPartyBalances();
      
      // Create statements for each party
      const statements: PartyBillStatement[] = [];
      
      for (const party of parties) {
        // Get transactions for this party
        const transactions = await transactionService.getPartyTransactions(party.id || '');
        
        // Find balance info for this party
        const balanceInfo = partyBalances.find(b => b.partyId === party.id);
        
        if (balanceInfo) {
          statements.push({
            party,
            transactions,
            totalDebit: balanceInfo.totalDebit,
            totalCredit: balanceInfo.totalCredit,
            balance: balanceInfo.balance
          });
        }
      }
      
      setPartyStatements(statements);
      setError(null);
      
      // Check if we have a Firestore index URL stored
      if (typeof window !== 'undefined') {
        const storedIndexUrl = localStorage.getItem('firestoreIndexUrl');
        if (storedIndexUrl) {
          setIndexUrl(storedIndexUrl);
        }
      }
    } catch (err) {
      console.error('Error fetching party statements:', err);
      setError('Failed to load party statements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartyStatements();
  }, []);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAccordionChange = (partyId: string) => {
    setExpandedParty(expandedParty === partyId ? null : partyId);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert('Download functionality will be implemented here');
  };

  const filteredPartyStatements = partyStatements.filter((statement) => {
    // Filter by search query
    const searchMatch = 
      statement.party.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      statement.party.gstin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      statement.party.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by balance type
    const balanceMatch = 
      balanceFilter === 'all' || 
      (balanceFilter === 'receivable' && statement.balance > 0) ||
      (balanceFilter === 'payable' && statement.balance < 0) ||
      (balanceFilter === 'zero' && statement.balance === 0);
    
    return searchMatch && balanceMatch;
  });

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Party-wise Bill Statements</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{ mr: 1 }}
            >
              Print
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
            >
              Download
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small"
                onClick={fetchPartyStatements}
              >
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}
        
        {indexUrl && (
          <Alert 
            severity="warning" 
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small"
                href={indexUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Create Index
              </Button>
            }
          >
            <Typography variant="body2">
              For better performance, this application requires a Firestore index. 
              Click "Create Index" to set it up in the Firebase console.
            </Typography>
          </Alert>
        )}

        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search parties..."
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
                <InputLabel>Balance</InputLabel>
                <Select
                  value={balanceFilter}
                  label="Balance"
                  onChange={(e) => setBalanceFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="receivable">Receivable</MenuItem>
                  <MenuItem value="payable">Payable</MenuItem>
                  <MenuItem value="zero">Zero Balance</MenuItem>
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
              {filteredPartyStatements.length > 0 ? (
                <>
                  {filteredPartyStatements
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((statement) => (
                      <Accordion 
                        key={statement.party.id}
                        expanded={expandedParty === statement.party.id}
                        onChange={() => handleAccordionChange(statement.party.id || '')}
                        sx={{ mb: 1 }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          aria-controls={`panel-${statement.party.id}-content`}
                          id={`panel-${statement.party.id}-header`}
                        >
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={4}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {statement.party.name}
                              </Typography>
                              {statement.party.gstin && (
                                <Typography variant="caption" color="text.secondary">
                                  GSTIN: {statement.party.gstin}
                                </Typography>
                              )}
                            </Grid>
                            <Grid item xs={4} md={2}>
                              <Typography variant="body2" color="text.secondary">
                                Total Debit
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                ₹{statement.totalDebit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </Typography>
                            </Grid>
                            <Grid item xs={4} md={2}>
                              <Typography variant="body2" color="text.secondary">
                                Total Credit
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                ₹{statement.totalCredit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </Typography>
                            </Grid>
                            <Grid item xs={4} md={2}>
                              <Typography variant="body2" color="text.secondary">
                                Balance
                              </Typography>
                              <Typography 
                                variant="body1" 
                                fontWeight="medium"
                                color={statement.balance > 0 ? 'error.main' : statement.balance < 0 ? 'success.main' : 'text.primary'}
                              >
                                ₹{Math.abs(statement.balance).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                {statement.balance !== 0 && (
                                  <Chip 
                                    label={statement.balance > 0 ? 'Receivable' : 'Payable'} 
                                    size="small" 
                                    color={statement.balance > 0 ? 'error' : 'success'}
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={2}>
                              <Typography variant="body2" color="text.secondary">
                                Transactions
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {statement.transactions.length}
                              </Typography>
                            </Grid>
                          </Grid>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Contact Information
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="text.secondary">
                                  Phone
                                </Typography>
                                <Typography variant="body1">
                                  {statement.party.phone || 'N/A'}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="text.secondary">
                                  Email
                                </Typography>
                                <Typography variant="body1">
                                  {statement.party.email || 'N/A'}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="text.secondary">
                                  Address
                                </Typography>
                                <Typography variant="body1">
                                  {statement.party.address || 'N/A'}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Box>
                          
                          <Typography variant="subtitle2" gutterBottom>
                            Transaction History
                          </Typography>
                          
                          <TableContainer sx={{ maxHeight: 300 }}>
                            <Table stickyHeader size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Date</TableCell>
                                  <TableCell>Description</TableCell>
                                  <TableCell>Reference</TableCell>
                                  <TableCell align="right">Debit</TableCell>
                                  <TableCell align="right">Credit</TableCell>
                                  <TableCell align="right">Balance</TableCell>
                                  <TableCell align="right">Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {statement.transactions.length > 0 ? (
                                  statement.transactions.map((transaction, index) => {
                                    // Calculate running balance
                                    const prevTransactions = statement.transactions.slice(0, index + 1);
                                    const runningBalance = prevTransactions.reduce((acc, curr) => {
                                      return curr.type === 'debit' ? acc + curr.amount : acc - curr.amount;
                                    }, 0);
                                    
                                    return (
                                      <TableRow hover key={transaction.id}>
                                        <TableCell>{formatDate(transaction.date)}</TableCell>
                                        <TableCell>{transaction.description}</TableCell>
                                        <TableCell>{transaction.reference || '-'}</TableCell>
                                        <TableCell align="right">
                                          {transaction.type === 'debit' ? 
                                            `₹${transaction.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : 
                                            '-'}
                                        </TableCell>
                                        <TableCell align="right">
                                          {transaction.type === 'credit' ? 
                                            `₹${transaction.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : 
                                            '-'}
                                        </TableCell>
                                        <TableCell align="right">
                                          <Typography
                                            sx={{
                                              color: runningBalance > 0 ? 'error.main' : runningBalance < 0 ? 'success.main' : 'text.primary',
                                              fontWeight: 500
                                            }}
                                          >
                                            ₹{Math.abs(runningBalance).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
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
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 2 }}>
                                      <Typography variant="body2" color="text.secondary">
                                        No transactions found for this party
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => window.location.href = `/accounting/transactions/new?partyId=${statement.party.id}`}
                            >
                              Add Transaction
                            </Button>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={filteredPartyStatements.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                  />
                </>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No party statements found
                  </Typography>
                  <Button
                    variant="text"
                    startIcon={<AddIcon />}
                    onClick={() => window.location.href = '/parties/new'}
                    sx={{ mt: 1 }}
                  >
                    Add Party
                  </Button>
                </Box>
              )}
            </>
          )}
        </Paper>
      </Container>
    </DashboardLayout>
  );
}