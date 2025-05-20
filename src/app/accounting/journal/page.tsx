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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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
import { formatDate } from '@/utils/dateUtils';

export default function JournalEntriesPage() {
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<any>(null);

  // Mock data for journal entries
  const mockJournalEntries = [
    {
      id: '1',
      date: '2023-07-15',
      reference: 'JE-001',
      description: 'Purchase of office supplies',
      debitAccount: 'Office Supplies',
      creditAccount: 'Cash',
      amount: 5000,
      status: 'posted'
    },
    {
      id: '2',
      date: '2023-07-20',
      reference: 'JE-002',
      description: 'Rent payment for July',
      debitAccount: 'Rent Expense',
      creditAccount: 'Bank Account',
      amount: 25000,
      status: 'posted'
    },
    {
      id: '3',
      date: '2023-07-25',
      reference: 'JE-003',
      description: 'Sales revenue',
      debitAccount: 'Bank Account',
      creditAccount: 'Sales Revenue',
      amount: 75000,
      status: 'posted'
    },
    {
      id: '4',
      date: '2023-07-30',
      reference: 'JE-004',
      description: 'Salary payment',
      debitAccount: 'Salary Expense',
      creditAccount: 'Bank Account',
      amount: 120000,
      status: 'draft'
    },
    {
      id: '5',
      date: '2023-08-05',
      reference: 'JE-005',
      description: 'Utility bills payment',
      debitAccount: 'Utilities Expense',
      creditAccount: 'Cash',
      amount: 8500,
      status: 'draft'
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setJournalEntries(mockJournalEntries);
      setLoading(false);
    }, 1000);
  }, []);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (entry: any = null) => {
    setCurrentEntry(entry);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentEntry(null);
  };

  const filteredEntries = journalEntries.filter((entry: any) => 
    entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.debitAccount.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.creditAccount.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Journal Entries</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            New Journal Entry
          </Button>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search journal entries..."
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
        </Paper>

        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 440 }}>
                <Table stickyHeader aria-label="journal entries table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Debit Account</TableCell>
                      <TableCell>Credit Account</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredEntries.length > 0 ? (
                      filteredEntries
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((entry: any) => (
                          <TableRow hover key={entry.id}>
                            <TableCell>{formatDate(entry.date)}</TableCell>
                            <TableCell>{entry.reference}</TableCell>
                            <TableCell>{entry.description}</TableCell>
                            <TableCell>{entry.debitAccount}</TableCell>
                            <TableCell>{entry.creditAccount}</TableCell>
                            <TableCell align="right">
                              ₹{entry.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={entry.status} 
                                color={entry.status === 'posted' ? 'success' : 'default'} 
                                size="small" 
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => handleOpenDialog(entry)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                          <Typography variant="body1" color="text.secondary">
                            No journal entries found
                          </Typography>
                          <Button
                            variant="text"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog()}
                            sx={{ mt: 1 }}
                          >
                            Create Journal Entry
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
                count={filteredEntries.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </Paper>

        {/* Journal Entry Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {currentEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  defaultValue={currentEntry?.date || new Date().toISOString().split('T')[0]}
                  InputLabelProps={{ shrink: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Reference"
                  defaultValue={currentEntry?.reference || ''}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  defaultValue={currentEntry?.description || ''}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Debit Account</InputLabel>
                  <Select
                    defaultValue={currentEntry?.debitAccount || ''}
                    label="Debit Account"
                  >
                    <MenuItem value="Office Supplies">Office Supplies</MenuItem>
                    <MenuItem value="Rent Expense">Rent Expense</MenuItem>
                    <MenuItem value="Salary Expense">Salary Expense</MenuItem>
                    <MenuItem value="Utilities Expense">Utilities Expense</MenuItem>
                    <MenuItem value="Bank Account">Bank Account</MenuItem>
                    <MenuItem value="Cash">Cash</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={5}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Credit Account</InputLabel>
                  <Select
                    defaultValue={currentEntry?.creditAccount || ''}
                    label="Credit Account"
                  >
                    <MenuItem value="Bank Account">Bank Account</MenuItem>
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Sales Revenue">Sales Revenue</MenuItem>
                    <MenuItem value="Accounts Payable">Accounts Payable</MenuItem>
                    <MenuItem value="Accounts Receivable">Accounts Receivable</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  defaultValue={currentEntry?.amount || ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Status</InputLabel>
                  <Select
                    defaultValue={currentEntry?.status || 'draft'}
                    label="Status"
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="posted">Posted</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleCloseDialog}
            >
              {currentEntry ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </DashboardLayout>
  );
}