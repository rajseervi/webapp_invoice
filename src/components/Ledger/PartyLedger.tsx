import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Transaction } from '@/types/transaction';
import { Party } from '@/types/party';
import { transactionService } from '@/services/transactionService';
import TransactionForm from './TransactionForm';
import ConfirmationDialog from '../ConfirmationDialog';

interface PartyLedgerProps {
  partyId: string;
  party: Party;
}

export default function PartyLedger({ partyId, party }: PartyLedgerProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openTransactionForm, setOpenTransactionForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    totalCredit: 0,
    totalDebit: 0,
    balance: 0
  });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      if (!partyId) {
        setError('Invalid party selected. Please try again.');
        setLoading(false);
        return;
      }
      
      console.log(`Fetching transactions for party: ${party.name} (${partyId})`);
      const data = await transactionService.getPartyTransactions(partyId);
      
      if (!data) {
        setError('Failed to load transactions. Please try again.');
        setTransactions([]);
        setLoading(false);
        return;
      }
      
      console.log(`Loaded ${data.length} transactions for party: ${party.name}`);
      setTransactions(data);

      // Calculate summary
      let totalCredit = 0;
      let totalDebit = 0;

      data.forEach(transaction => {
        // Ensure amount is a number
        const amount = typeof transaction.amount === 'number' 
          ? transaction.amount 
          : parseFloat(transaction.amount as any) || 0;
          
        if (transaction.type === 'credit') {
          totalCredit += amount;
        } else {
          totalDebit += amount;
        }
      });

      // Calculate balance (positive means party owes money)
      const balance = totalDebit - totalCredit;

      setSummary({
        totalCredit,
        totalDebit,
        balance
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions. Please try again.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (partyId) {
      fetchTransactions();
    }
  }, [partyId]);

  const handleAddTransaction = () => {
    setSelectedTransaction(null);
    setOpenTransactionForm(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setOpenTransactionForm(true);
  };

  const handleDeleteClick = (id: string) => {
    setTransactionToDelete(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return;

    try {
      setLoading(true);
      await transactionService.deleteTransaction(transactionToDelete);
      await fetchTransactions();
      setError(null);
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError('Failed to delete transaction. Please try again.');
    } finally {
      setLoading(false);
      setOpenDeleteDialog(false);
      setTransactionToDelete(null);
    }
  };

  const handleTransactionSave = () => {
    fetchTransactions();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          {party.name} - Ledger
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddTransaction}
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

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Total Debit (Party Owes)
              </Typography>
              <Typography variant="h5" sx={{ mt: 1 }}>
                ₹{summary.totalDebit.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Total Credit (We Owe)
              </Typography>
              <Typography variant="h5" sx={{ mt: 1 }}>
                ₹{summary.totalCredit.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Balance
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="h5" color={summary.balance > 0 ? 'error.main' : 'success.main'}>
                  ₹{Math.abs(summary.balance).toFixed(2)}
                </Typography>
                <Chip
                  size="small"
                  label={summary.balance > 0 ? 'Party Owes' : summary.balance < 0 ? 'We Owe' : 'Settled'}
                  color={summary.balance > 0 ? 'error' : summary.balance < 0 ? 'success' : 'default'}
                  sx={{ ml: 1 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        {loading && transactions.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell align="right">Debit</TableCell>
                  <TableCell align="right">Credit</TableCell>
                  <TableCell align="right">Balance</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No transactions found</TableCell>
                  </TableRow>
                ) : (
                  <>
                    {transactions.map((transaction, index) => {
                      // Calculate running balance
                      let runningBalance = 0;
                      for (let i = 0; i <= index; i++) {
                        if (transactions[i].type === 'debit') {
                          runningBalance += transactions[i].amount;
                        } else {
                          runningBalance -= transactions[i].amount;
                        }
                      }

                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {format(new Date(transaction.date), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>{transaction.reference || '-'}</TableCell>
                          <TableCell align="right">
                            {transaction.type === 'debit' ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <ArrowUpwardIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                                ₹{transaction.amount.toFixed(2)}
                              </Box>
                            ) : '-'}
                          </TableCell>
                          <TableCell align="right">
                            {transaction.type === 'credit' ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <ArrowDownwardIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                                ₹{transaction.amount.toFixed(2)}
                              </Box>
                            ) : '-'}
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              color={runningBalance > 0 ? 'error.main' : runningBalance < 0 ? 'success.main' : 'text.primary'}
                            >
                              ₹{Math.abs(runningBalance).toFixed(2)}
                              {runningBalance !== 0 && (
                                <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                                  {runningBalance > 0 ? '(DR)' : '(CR)'}
                                </Typography>
                              )}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => handleEditTransaction(transaction)}
                              title="Edit"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(transaction.id!)}
                              title="Delete"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Transaction Form Dialog */}
      {openTransactionForm && (
        <TransactionForm
          open={openTransactionForm}
          onClose={() => setOpenTransactionForm(false)}
          onSave={handleTransactionSave}
          parties={[party]}
          initialData={selectedTransaction ? {
            partyId: selectedTransaction.partyId,
            amount: selectedTransaction.amount,
            type: selectedTransaction.type,
            description: selectedTransaction.description,
            reference: selectedTransaction.reference,
            date: selectedTransaction.date
          } : {
            partyId: partyId,
            amount: 0,
            type: 'debit',
            description: '',
            reference: '',
            date: format(new Date(), 'yyyy-MM-dd')
          }}
          transactionId={selectedTransaction?.id}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={openDeleteDialog}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmText="Delete"
        confirmColor="error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setOpenDeleteDialog(false)}
      />
    </Box>
  );
}