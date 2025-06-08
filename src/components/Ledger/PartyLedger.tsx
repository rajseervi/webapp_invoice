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
  Alert,
  Tabs,
  Tab,
  Tooltip,
  Fab,
  useMediaQuery,
  useTheme,
  Switch,
  FormControlLabel,
  FormGroup,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Receipt as ReceiptIcon,
  Payments as PaymentsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  FilterList as FilterListIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Transaction } from '@/types/transaction';
import { Party } from '@/types/party';
import { transactionService } from '@/services/transactionService';
import { invoiceService } from '@/services/invoiceService';
import TransactionForm from './TransactionForm';
import ConfirmationDialog from '../ConfirmationDialog';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';

interface PartyLedgerProps {
  partyId: string;
  party: Party;
}

interface Invoice {
  id?: string;
  invoiceNumber: string;
  date?: string;
  saleDate?: string;
  partyId?: string;
  partyName?: string;
  total?: number;
  totalAmount?: number;
  userId?: string;
  transactionId?: string;
  createdAt: string;
}

export default function PartyLedger({ partyId, party }: PartyLedgerProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { userId, canViewAllData } = useCurrentUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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
  const [activeTab, setActiveTab] = useState(0);
  const [columnVisibility, setColumnVisibility] = useState({
    description: false,//!isMobile
    reference: false,
    debitCredit: false  //!isMobile
  });
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      if (!partyId) {
        setError('Invalid party selected. Please try again.');
        setLoading(false);
        return;
      }
      
      console.log(`Fetching transactions for party: ${party.name} (${partyId})`);
      
      let data;
      if (canViewAllData()) {
        // Admin can see all transactions for this party
        data = await transactionService.getPartyTransactions(partyId);
      } else {
        // Non-admin users can only see their own transactions
        data = await transactionService.getPartyTransactions(partyId, userId || undefined);
      }
      
      if (!data) {
        setError('Failed to load transactions. Please try again.');
        setTransactions([]);
        setLoading(false);
        return;
      }
      
      console.log(`Loaded ${data.length} transactions for party: ${party.name}`);
      
      // Fetch invoices for this party based on user role
      let invoiceData: Invoice[] = [];
      try {
        if (canViewAllData()) {
          // Admin can see all invoices for this party
          invoiceData = await invoiceService.getPartyInvoices(partyId);
        } else {
          // Non-admin users can only see their own invoices
          invoiceData = await invoiceService.getPartyInvoices(partyId, userId || undefined);
        }
        console.log(`Loaded ${invoiceData.length} invoices for party: ${party.name}`);
        setInvoices(invoiceData);
        
        // Check if any invoices don't have corresponding transactions
        // This is for backward compatibility with existing invoices
        for (const invoice of invoiceData) {
          if (!invoice.transactionId) {
            // Check if there's already a transaction with this invoice number as reference
            const existingTransaction = data.find(t => 
              t.reference === invoice.invoiceNumber && 
              t.description?.includes('Invoice')
            );
            
            if (!existingTransaction) {
              console.log(`Creating missing transaction for invoice ${invoice.invoiceNumber}`);
              
              try {
                // Create a transaction for this invoice
                // Always use the original invoice's userId to maintain data integrity
                const transactionId = await transactionService.createTransaction({
                  partyId: partyId,
                  userId: invoice.userId || userId || 'default-user', // Use invoice userId if available, otherwise current userId
                  amount: invoice.total || invoice.totalAmount || 0,
                  type: 'debit',
                  description: `Invoice ${invoice.invoiceNumber}`,
                  reference: invoice.invoiceNumber,
                  date: invoice.date || invoice.saleDate || invoice.createdAt.split('T')[0]
                });
                
                // Update the invoice with the transaction ID
                if (invoice.id) {
                  await invoiceService.updateInvoice(invoice.id, {
                    transactionId: transactionId
                  });
                  console.log(`Updated invoice ${invoice.id} with transaction ID ${transactionId}`);
                }
              } catch (err) {
                console.error(`Failed to create transaction for invoice ${invoice.invoiceNumber}:`, err);
              }
            }
          }
        }
      } catch (invoiceErr) {
        console.error('Error fetching invoices:', invoiceErr);
        // Don't fail if invoices can't be loaded
        setInvoices([]);
      }
      
      // Fetch transactions again to include any newly created ones
      const updatedData = await transactionService.getPartyTransactions(partyId);
      setTransactions(updatedData || []);
      
      // Calculate summary
      let totalCredit = 0;
      let totalDebit = 0;

      (updatedData || []).forEach(transaction => {
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleViewInvoice = (invoiceId: string) => {
    router.push(`/invoices/${invoiceId}`);
  };

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const toggleColumnVisibility = (column: keyof typeof columnVisibility) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
    handleSettingsClose();
  };

  return (
    <Box>
      {/* Enhanced Header Section */}
      <Paper sx={{ p: 3, mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2 }} elevation={3}>
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            {party.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {party.email ? `Email: ${party.email}` : ''} {party.phone ? `| Phone: ${party.phone}` : ''}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddTransaction}
          sx={{ display: { xs: 'none', md: 'inline-flex' } }}
        >
          Add Transaction
        </Button>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'error.lighter', borderLeft: '5px solid', borderColor: 'error.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ArrowUpwardIcon color="error" />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Debit (Party Owes)
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ mt: 1 }}>
                ₹{summary.totalDebit.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'success.lighter', borderLeft: '5px solid', borderColor: 'success.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ArrowDownwardIcon color="success" />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Credit (We Owe)
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ mt: 1 }}>
                ₹{summary.totalCredit.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'info.lighter', borderLeft: '5px solid', borderColor: summary.balance > 0 ? 'error.main' : summary.balance < 0 ? 'success.main' : 'grey.500' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PaymentsIcon color={summary.balance > 0 ? 'error' : summary.balance < 0 ? 'success' : 'disabled'} />
                <Typography variant="subtitle2" color="text.secondary">
                  Balance
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="h5" color={summary.balance > 0 ? 'error.main' : summary.balance < 0 ? 'success.main' : 'text.primary'}>
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
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider', 
          mb: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1,
          pb: 1
        }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="ledger tabs"
            sx={{ flexGrow: 1 }}
          >
            <Tab 
              label={isMobile ? "" : "Transactions"} 
              icon={<PaymentsIcon />} 
              iconPosition={isMobile ? "top" : "start"}
            />
            <Tab 
              label={isMobile ? "" : "Invoices"} 
              icon={<ReceiptIcon />} 
              iconPosition={isMobile ? "top" : "start"}
              disabled={invoices.length === 0}
            />
          </Tabs>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Column Settings">
              <IconButton 
                size="small" 
                onClick={handleSettingsClick}
                color="primary"
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            
            <Menu
              anchorEl={settingsAnchorEl}
              open={Boolean(settingsAnchorEl)}
              onClose={handleSettingsClose}
            >
              <MenuItem onClick={() => toggleColumnVisibility('description')}>
                <ListItemIcon>
                  {columnVisibility.description ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                </ListItemIcon>
                <ListItemText>Description Column</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => toggleColumnVisibility('reference')}>
                <ListItemIcon>
                  {columnVisibility.reference ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                </ListItemIcon>
                <ListItemText>Reference Column</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => toggleColumnVisibility('debitCredit')}>
                <ListItemIcon>
                  {columnVisibility.debitCredit ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                </ListItemIcon>
                <ListItemText>Separate Debit/Credit Columns</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {activeTab === 0 && (
          <>
            {loading && transactions.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
                <Table size={isMobile ? "small" : "medium"} sx={{ minWidth: isMobile ? 450 : 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      {columnVisibility.description && <TableCell>Description</TableCell>}
                      {columnVisibility.reference && <TableCell>Reference</TableCell>}
                      
                      {columnVisibility.debitCredit ? (
                        <>
                          <TableCell align="right">Debit</TableCell>
                          <TableCell align="right">Credit</TableCell>
                        </>
                      ) : (
                        <TableCell align="right">Amount</TableCell>
                      )}
                      
                      <TableCell align="right">Balance</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell 
                          colSpan={
                            2 + // Date and Actions columns are always visible
                            (columnVisibility.description ? 1 : 0) +
                            (columnVisibility.reference ? 1 : 0) +
                            (columnVisibility.debitCredit ? 2 : 1) + // Debit/Credit or Amount
                            1 // Balance column
                          } 
                          align="center"
                        >
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {transactions.map((transaction, index) => {
                          // Calculate running balance
                          let runningBalance = 0;
                          for (let i = 0; i <= index; i++) {
                            // Ensure amount is a number
                            const amount = typeof transactions[i].amount === 'number' 
                              ? transactions[i].amount 
                              : parseFloat(String(transactions[i].amount)) || 0;
                              
                            if (transactions[i].type === 'debit') {
                              runningBalance += amount;
                            } else {
                              runningBalance -= amount;
                            }
                          }

                          // Format amount for display
                          const formattedAmount = (typeof transaction.amount === 'number' 
                            ? transaction.amount 
                            : parseFloat(String(transaction.amount)) || 0).toFixed(2);

                          return (
                            <TableRow 
                              key={transaction.id}
                              sx={{ 
                                '&:hover': { 
                                  bgcolor: 'action.hover' 
                                }
                              }}
                            >
                              <TableCell>
                                {format(new Date(transaction.date), 'dd/MM/yyyy')}
                              </TableCell>
                              
                              {columnVisibility.description && (
                                <TableCell>
                                  {transaction.description?.includes('Invoice') ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <ReceiptIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.main', flexShrink: 0 }} />
                                      <Typography noWrap sx={{ maxWidth: { xs: '120px', sm: '200px', md: '300px' } }}>
                                        {transaction.description}
                                      </Typography>
                                    </Box>
                                  ) : (
                                    <Typography noWrap sx={{ maxWidth: { xs: '120px', sm: '200px', md: '300px' } }}>
                                      {transaction.description}
                                    </Typography>
                                  )}
                                </TableCell>
                              )}
                              
                              {columnVisibility.reference && (
                                <TableCell>
                                  {transaction.reference ? (
                                    transaction.description?.includes('Invoice') ? (
                                      <Tooltip title="Click to view invoice details">
                                        <Chip 
                                          size="small" 
                                          label={transaction.reference} 
                                          color="primary" 
                                          variant="outlined"
                                          onClick={() => {
                                            // Find the invoice with this reference number
                                            const invoice = invoices.find(inv => inv.invoiceNumber === transaction.reference);
                                            if (invoice?.id) {
                                              handleViewInvoice(invoice.id);
                                            }
                                          }}
                                          clickable
                                          sx={{ cursor: 'pointer' }}
                                        />
                                      </Tooltip>
                                    ) : (
                                      transaction.reference
                                    )
                                  ) : '-'}
                                </TableCell>
                              )}
                              
                              {columnVisibility.debitCredit ? (
                                <>
                                  <TableCell align="right">
                                    {transaction.type === 'debit' ? (
                                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                        <ArrowUpwardIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                                        ₹{formattedAmount}
                                      </Box>
                                    ) : '-'}
                                  </TableCell>
                                  <TableCell align="right">
                                    {transaction.type === 'credit' ? (
                                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                        <ArrowDownwardIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                                        ₹{formattedAmount}
                                      </Box>
                                    ) : '-'}
                                  </TableCell>
                                </>
                              ) : (
                                <TableCell align="right">
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                    {transaction.type === 'debit' ? (
                                      <ArrowUpwardIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                                    ) : (
                                      <ArrowDownwardIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                                    )}
                                    ₹{formattedAmount}
                                  </Box>
                                </TableCell>
                              )}
                              
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
                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditTransaction(transaction)}
                                    title="Edit"
                                    sx={{ mx: 0.5 }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteClick(transaction.id!)}
                                    title="Delete"
                                    sx={{ mx: 0.5 }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
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
          </>
        )}

        {activeTab === 1 && (
          <>
            {loading && invoices.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
                <Table size={isMobile ? "small" : "medium"} sx={{ minWidth: isMobile ? 450 : 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No invoices found</TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {invoices.map((invoice) => (
                          <TableRow 
                            key={invoice.id}
                            sx={{ 
                              '&:hover': { 
                                bgcolor: 'action.hover' 
                              }
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <ReceiptIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.main' }} />
                                {invoice.invoiceNumber}
                              </Box>
                            </TableCell>
                            <TableCell>
                              {invoice.date || invoice.saleDate 
                                ? format(new Date(invoice.date || invoice.saleDate || ''), 'dd/MM/yyyy')
                                : format(new Date(invoice.createdAt), 'dd/MM/yyyy')}
                            </TableCell>
                            <TableCell align="right">
                              ₹{(invoice.total || invoice.totalAmount || 0).toFixed(2)}
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => invoice.id && handleViewInvoice(invoice.id)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Paper>

      {/* Transaction Form */}
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
      
      {/* Floating Action Button for mobile */}
      {isMobile && (
        <Fab 
          color="primary" 
          aria-label="add transaction" 
          onClick={handleAddTransaction}
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            right: 16,
            zIndex: 1000
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
}