"use client";
import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Avatar,
  Alert,
  Tooltip,
  CircularProgress,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Fab,
  Menu,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Snackbar,
  Badge,
  LinearProgress
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  AccountBalanceWallet as WalletIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  Receipt as ReceiptIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  GetApp as ExportIcon,
  Sync as SyncIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  MoreVert as MoreVertIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { ledgerService, LedgerAccount, LedgerSummary, LedgerTransaction } from '@/services/ledgerService';
import { LedgerIntegrationService, LedgerIntegrationResult } from '@/services/ledgerIntegrationService';
import AccountLedgerDetail from './AccountLedgerDetail';
import LedgerPrintView from './LedgerPrintView';

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
      id={`ledger-tabpanel-${index}`}
      aria-labelledby={`ledger-tab-${index}`}
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

export default function LedgerManagement() {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<LedgerAccount[]>([]);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [integrating, setIntegrating] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState<{
    isIntegrated: boolean;
    accountsCount: number;
    transactionsCount: number;
    lastSyncDate?: string;
  } | null>(null);

  // Dialog states
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [showStatementDialog, setShowStatementDialog] = useState(false);
  const [showLedgerDetail, setShowLedgerDetail] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<LedgerAccount | null>(null);

  // Form states
  const [accountForm, setAccountForm] = useState({
    accountName: '',
    accountType: 'supplier' as 'supplier' | 'customer' | 'bank' | 'cash' | 'expense' | 'income' | 'asset' | 'liability',
    address: '',
    phone: '',
    email: '',
    contactPerson: '',
    creditLimit: 0,
    creditDays: 30,
    openingBalance: 0,
    isActive: true
  });

  const [transactionForm, setTransactionForm] = useState({
    transactionDate: new Date().toISOString().split('T')[0],
    accountId: '',
    description: '',
    referenceNumber: '',
    referenceType: 'journal' as 'purchase_order' | 'sales_order' | 'invoice' | 'payment' | 'journal' | 'opening_balance',
    debitAmount: 0,
    creditAmount: 0,
    tags: [] as string[]
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showInactiveAccounts, setShowInactiveAccounts] = useState(false);

  // Transaction filter states
  const [transactionSearchTerm, setTransactionSearchTerm] = useState('');
  const [transactionFilterType, setTransactionFilterType] = useState('all');
  const [transactionStartDate, setTransactionStartDate] = useState('');
  const [transactionEndDate, setTransactionEndDate] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<LedgerTransaction | null>(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAccountForMenu, setSelectedAccountForMenu] = useState<LedgerAccount | null>(null);

  useEffect(() => {
    loadData();
    checkIntegrationStatus();
  }, []);

  useEffect(() => {
    filterAccounts();
  }, [accounts, searchTerm, filterType, showInactiveAccounts]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, transactionSearchTerm, transactionFilterType, transactionStartDate, transactionEndDate]);

  const filterTransactions = () => {
    let filtered = transactions;

    // Filter by search term
    if (transactionSearchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(transactionSearchTerm.toLowerCase()) ||
        transaction.referenceNumber?.toLowerCase().includes(transactionSearchTerm.toLowerCase()) ||
        transaction.accountName.toLowerCase().includes(transactionSearchTerm.toLowerCase())
      );
    }

    // Filter by reference type
    if (transactionFilterType !== 'all') {
      filtered = filtered.filter(transaction => transaction.referenceType === transactionFilterType);
    }

    // Filter by date range
    if (transactionStartDate) {
      filtered = filtered.filter(transaction => transaction.transactionDate >= transactionStartDate);
    }
    if (transactionEndDate) {
      filtered = filtered.filter(transaction => transaction.transactionDate <= transactionEndDate);
    }

    return filtered;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('Starting to load ledger data...');
      
      // Load data sequentially to better debug any issues
      console.log('Fetching accounts...');
      const accountsData = await ledgerService.getAccounts();
      console.log('Accounts fetched:', accountsData.length, accountsData);
      setAccounts(accountsData);

      console.log('Fetching summary...');
      const summaryData = await ledgerService.getLedgerSummary();
      console.log('Summary fetched:', summaryData);
      setSummary(summaryData);

      console.log('Fetching recent transactions...');
      const recentTransactions = await ledgerService.getTransactions(undefined, { limit: 50 });
      console.log('Transactions fetched:', recentTransactions.length, recentTransactions);
      setTransactions(recentTransactions);

      console.log('All ledger data loaded successfully');
    } catch (error) {
      console.error('Error loading ledger data:', error);
      showSnackbar(`Error loading ledger data: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkIntegrationStatus = async () => {
    try {
      const integrationService = LedgerIntegrationService.getInstance();
      const status = await integrationService.getIntegrationStatus();
      setIntegrationStatus(status);
    } catch (error) {
      console.error('Error checking integration status:', error);
    }
  };

  const handleIntegrateRealData = async () => {
    setIntegrating(true);
    try {
      showSnackbar('Starting integration with real business data...', 'info');
      
      const integrationService = LedgerIntegrationService.getInstance();
      const result: LedgerIntegrationResult = await integrationService.integrateAllBusinessData();
      
      if (result.success) {
        showSnackbar(
          `Integration successful! Created ${result.accountsCreated} accounts and ${result.transactionsCreated} transactions.`,
          'success'
        );
      } else {
        showSnackbar(
          `Integration completed with ${result.errors.length} errors. Check console for details.`,
          'warning'
        );
        console.error('Integration errors:', result.errors);
      }
      
      if (result.warnings.length > 0) {
        console.warn('Integration warnings:', result.warnings);
      }
      
      // Reload data and check status
      await loadData();
      await checkIntegrationStatus();
      
    } catch (error) {
      console.error('Error during integration:', error);
      showSnackbar('Integration failed. Please check console for details.', 'error');
    } finally {
      setIntegrating(false);
    }
  };

  const filterAccounts = () => {
    let filtered = accounts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(account =>
        account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.accountCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(account => account.accountType === filterType);
    }

    // Filter by active status
    if (!showInactiveAccounts) {
      filtered = filtered.filter(account => account.isActive);
    }

    setFilteredAccounts(filtered);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCreateAccount = async () => {
    setSaving(true);
    try {
      await ledgerService.createAccount({
        ...accountForm,
        accountCode: '', // Will be auto-generated
        isGstApplicable: false,
        gstNumber: '',
        currentBalance: accountForm.openingBalance,
        debitBalance: accountForm.openingBalance > 0 ? accountForm.openingBalance : 0,
        creditBalance: accountForm.openingBalance < 0 ? Math.abs(accountForm.openingBalance) : 0
      });

      showSnackbar('Account created successfully', 'success');
      setShowAccountDialog(false);
      resetAccountForm();
      loadData();
    } catch (error) {
      console.error('Error creating account:', error);
      showSnackbar('Error creating account', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAccount = async () => {
    if (!selectedAccount) return;

    setSaving(true);
    try {
      await ledgerService.updateAccount(selectedAccount.id!, accountForm);
      showSnackbar('Account updated successfully', 'success');
      setShowAccountDialog(false);
      setSelectedAccount(null);
      resetAccountForm();
      loadData();
    } catch (error) {
      console.error('Error updating account:', error);
      showSnackbar('Error updating account', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetAccountForm = () => {
    setAccountForm({
      accountName: '',
      accountType: 'supplier',
      address: '',
      phone: '',
      email: '',
      contactPerson: '',
      creditLimit: 0,
      creditDays: 30,
      openingBalance: 0,
      isActive: true
    });
  };

  const handleEditAccount = (account: LedgerAccount) => {
    setSelectedAccount(account);
    setAccountForm({
      accountName: account.accountName,
      accountType: account.accountType,
      address: account.address || '',
      phone: account.phone || '',
      email: account.email || '',
      contactPerson: account.contactPerson || '',
      creditLimit: account.creditLimit || 0,
      creditDays: account.creditDays || 30,
      openingBalance: account.openingBalance,
      isActive: account.isActive
    });
    setShowAccountDialog(true);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, account: LedgerAccount) => {
    setAnchorEl(event.currentTarget);
    setSelectedAccountForMenu(account);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAccountForMenu(null);
  };

  // Transaction management functions
  const handleCreateTransaction = async () => {
    setSaving(true);
    try {
      await ledgerService.createTransaction({
        ...transactionForm,
        transactionNumber: '', // Will be auto-generated
        accountName: accounts.find(acc => acc.id === transactionForm.accountId)?.accountName || '',
        runningBalance: 0, // Will be calculated
        isReconciled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      showSnackbar('Transaction created successfully', 'success');
      setShowTransactionDialog(false);
      resetTransactionForm();
      loadData();
    } catch (error) {
      console.error('Error creating transaction:', error);
      showSnackbar('Error creating transaction', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditTransaction = (transaction: LedgerTransaction) => {
    setSelectedTransaction(transaction);
    setTransactionForm({
      transactionDate: transaction.transactionDate,
      accountId: transaction.accountId,
      description: transaction.description,
      referenceNumber: transaction.referenceNumber || '',
      referenceType: transaction.referenceType || 'journal',
      debitAmount: transaction.debitAmount,
      creditAmount: transaction.creditAmount,
      tags: transaction.tags || []
    });
    setShowTransactionDialog(true);
  };

  const handleUpdateTransaction = async () => {
    if (!selectedTransaction) return;

    setSaving(true);
    try {
      // Note: The ledger service might need an updateTransaction method
      // For now, we'll show a message that this feature is not yet implemented
      showSnackbar('Transaction update functionality will be implemented', 'info');
    } catch (error) {
      console.error('Error updating transaction:', error);
      showSnackbar('Error updating transaction', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      // Note: The ledger service might need a deleteTransaction method
      showSnackbar('Transaction deletion functionality will be implemented', 'info');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showSnackbar('Error deleting transaction', 'error');
    }
  };

  const resetTransactionForm = () => {
    setTransactionForm({
      transactionDate: new Date().toISOString().split('T')[0],
      accountId: '',
      description: '',
      referenceNumber: '',
      referenceType: 'journal',
      debitAmount: 0,
      creditAmount: 0,
      tags: []
    });
  };

  const handleViewLedger = (account: LedgerAccount) => {
    setSelectedAccount(account);
    setShowLedgerDetail(true);
  };

  const handleAccountNameClick = (account: LedgerAccount) => {
    handleViewLedger(account);
  };

  const getAccountTypeIcon = (type: string) => {
    const icons = {
      supplier: <BusinessIcon />,
      customer: <PersonIcon />,
      bank: <AccountBalanceIcon />,
      cash: <WalletIcon />,
      expense: <TrendingDownIcon />,
      income: <TrendingUpIcon />,
      asset: <AssessmentIcon />,
      liability: <WarningIcon />
    };
    return icons[type as keyof typeof icons] || <AccountBalanceIcon />;
  };

  const getAccountTypeColor = (type: string) => {
    const colors = {
      supplier: 'primary',
      customer: 'secondary',
      bank: 'info',
      cash: 'success',
      expense: 'error',
      income: 'success',
      asset: 'info',
      liability: 'warning'
    };
    return colors[type as keyof typeof colors] || 'default';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Export and print functions
  const handleExportTransactions = () => {
    const filteredTransactions = filterTransactions();
    const csvContent = [
      ['Date', 'Transaction #', 'Account', 'Description', 'Type', 'Debit', 'Credit', 'Balance', 'Status', 'Reference'],
      ...filteredTransactions.map(transaction => [
        new Date(transaction.transactionDate).toLocaleDateString(),
        transaction.transactionNumber,
        transaction.accountName,
        transaction.description,
        transaction.referenceType?.toUpperCase() || 'JOURNAL',
        transaction.debitAmount > 0 ? transaction.debitAmount.toString() : '',
        transaction.creditAmount > 0 ? transaction.creditAmount.toString() : '',
        transaction.runningBalance.toString(),
        transaction.isReconciled ? 'Reconciled' : 'Pending',
        transaction.referenceNumber || ''
      ])
    ];

    const csvString = csvContent.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintTransactions = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const filteredTransactions = filterTransactions();
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transaction Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .debit { color: #d32f2f; }
            .credit { color: #2e7d32; }
            .balance-positive { color: #2e7d32; }
            .balance-negative { color: #d32f2f; }
            .center { text-align: center; }
            .right { text-align: right; }
            .print-info { margin-bottom: 20px; color: #666; }
          </style>
        </head>
        <body>
          <h1>Transaction Management Report</h1>
          <div class="print-info">
            <p><strong>Total Transactions:</strong> ${filteredTransactions.length}</p>
            <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
            ${transactionStartDate && transactionEndDate ? `<p><strong>Period:</strong> ${new Date(transactionStartDate).toLocaleDateString()} to ${new Date(transactionEndDate).toLocaleDateString()}</p>` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Transaction #</th>
                <th>Account</th>
                <th>Description</th>
                <th>Type</th>
                <th class="right">Debit</th>
                <th class="right">Credit</th>
                <th class="right">Balance</th>
                <th class="center">Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.map(transaction => `
                <tr>
                  <td>${new Date(transaction.transactionDate).toLocaleDateString()}</td>
                  <td>${transaction.transactionNumber}</td>
                  <td>${transaction.accountName}</td>
                  <td>${transaction.description}${transaction.referenceNumber ? `<br><small>Ref: ${transaction.referenceNumber}</small>` : ''}</td>
                  <td>${transaction.referenceType?.toUpperCase() || 'JOURNAL'}</td>
                  <td class="right ${transaction.debitAmount > 0 ? 'debit' : ''}">${transaction.debitAmount > 0 ? formatCurrency(transaction.debitAmount) : ''}</td>
                  <td class="right ${transaction.creditAmount > 0 ? 'credit' : ''}">${transaction.creditAmount > 0 ? formatCurrency(transaction.creditAmount) : ''}</td>
                  <td class="right ${transaction.runningBalance >= 0 ? 'balance-positive' : 'balance-negative'}">${formatCurrency(transaction.runningBalance)}</td>
                  <td class="center">${transaction.isReconciled ? 'Reconciled' : 'Pending'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const renderSummaryCards = () => {
    if (!summary) return null;

    const cards = [
      {
        title: 'Total Accounts',
        value: summary.totalAccounts,
        icon: <AccountBalanceIcon />,
        color: 'primary'
      },
      {
        title: 'Suppliers',
        value: summary.totalSuppliers,
        icon: <BusinessIcon />,
        color: 'secondary'
      },
      {
        title: 'Customers',
        value: summary.totalCustomers,
        icon: <PersonIcon />,
        color: 'info'
      },
      {
        title: 'Total Debits',
        value: formatCurrency(summary.totalDebitBalance),
        icon: <TrendingUpIcon />,
        color: 'success'
      },
      {
        title: 'Total Credits',
        value: formatCurrency(summary.totalCreditBalance),
        icon: <TrendingDownIcon />,
        color: 'error'
      },
      {
        title: 'Today\'s Transactions',
        value: summary.todayTransactions,
        icon: <ReceiptIcon />,
        color: 'warning'
      }
    ];

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {card.title}
                      </Typography>
                      <Typography variant="h6" component="div">
                        {card.value}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: `${card.color}.main` }}>
                      {card.icon}
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderAccountsTable = () => (
    <Card>
      <CardHeader
        title="Accounts"
        subheader={`${filteredAccounts.length} accounts`}
        action={
          <Box display="flex" gap={1}>
            <TextField
              size="small"
              placeholder="Search accounts..."
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
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                displayEmpty
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="supplier">Suppliers</MenuItem>
                <MenuItem value="customer">Customers</MenuItem>
                <MenuItem value="bank">Banks</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="expense">Expenses</MenuItem>
                <MenuItem value="income">Income</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAccountDialog(true)}
            >
              Add Account
            </Button>
          </Box>
        }
      />
      <CardContent sx={{ p: 0 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Account</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Current Balance</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAccounts.map((account, index) => (
                <TableRow
                  key={account.id}
                  hover
                  component={motion.tr}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: `${getAccountTypeColor(account.accountType)}.main` }}>
                        {getAccountTypeIcon(account.accountType)}
                      </Avatar>
                      <Box>
                        <Tooltip title="Click to view ledger details" arrow>
                          <Typography 
                            variant="body2" 
                            fontWeight="medium"
                            sx={{ 
                              cursor: 'pointer',
                              color: 'primary.main',
                              '&:hover': {
                                textDecoration: 'underline'
                              }
                            }}
                            onClick={() => handleAccountNameClick(account)}
                          >
                            {account.accountName}
                          </Typography>
                        </Tooltip>
                        <Typography variant="caption" color="textSecondary">
                          {account.accountCode}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={account.accountType.toUpperCase()}
                      color={getAccountTypeColor(account.accountType) as any}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      color={account.currentBalance >= 0 ? 'success.main' : 'error.main'}
                      fontWeight="medium"
                    >
                      {formatCurrency(account.currentBalance)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={account.isActive ? 'Active' : 'Inactive'}
                      color={account.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, account)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredAccounts.length === 0 && (
          <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" py={4}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              No accounts found
            </Typography>
            {accounts.length === 0 && (
              <Box sx={{ mt: 2, display: 'flex', gap: 2, flexDirection: 'column', alignItems: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<SyncIcon />}
                  onClick={handleIntegrateRealData}
                  disabled={integrating}
                  sx={{ minWidth: 200 }}
                >
                  {integrating ? 'Integrating...' : 'Integrate Real Data'}
                </Button>
                <Typography variant="caption" color="textSecondary" textAlign="center">
                  Import existing parties, transactions, and invoices into the ledger system
                </Typography>
              </Box>
            )}
            {integrationStatus && integrationStatus.isIntegrated && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                <Typography variant="body2" color="success.dark">
                  ✅ Ledger integrated with {integrationStatus.accountsCount} accounts and {integrationStatus.transactionsCount} transactions
                </Typography>
                {integrationStatus.lastSyncDate && (
                  <Typography variant="caption" color="success.dark">
                    Last sync: {new Date(integrationStatus.lastSyncDate).toLocaleString()}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderRecentTransactions = () => (
    <Card>
      <CardHeader
        title="Recent Transactions"
        subheader={`Last ${transactions.length} transactions`}
        action={
          <Button
            variant="outlined"
            startIcon={<TimelineIcon />}
            onClick={() => setActiveTab(2)}
          >
            View All
          </Button>
        }
      />
      <CardContent sx={{ p: 0 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Debit</TableCell>
                <TableCell align="right">Credit</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.slice(0, 10).map((transaction, index) => (
                <TableRow key={transaction.id} hover>
                  <TableCell>
                    <Typography variant="caption">
                      {new Date(transaction.transactionDate).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {transaction.accountName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {transaction.description}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {transaction.debitAmount > 0 && (
                      <Typography variant="body2" color="error.main">
                        {formatCurrency(transaction.debitAmount)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {transaction.creditAmount > 0 && (
                      <Typography variant="body2" color="success.main">
                        {formatCurrency(transaction.creditAmount)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={transaction.isReconciled ? 'Reconciled' : 'Pending'}
                      color={transaction.isReconciled ? 'success' : 'warning'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const renderTransactionsManagement = () => {
    const filteredTransactions = filterTransactions();

    return (
      <Card>
        <CardHeader
          title="Transaction Management"
          subheader={`${filteredTransactions.length} transactions`}
          action={
            <Box display="flex" gap={1}>
              <TextField
                size="small"
                placeholder="Search transactions..."
                value={transactionSearchTerm}
                onChange={(e) => setTransactionSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                size="small"
                type="date"
                label="From Date"
                value={transactionStartDate}
                onChange={(e) => setTransactionStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                size="small"
                type="date"
                label="To Date"
                value={transactionEndDate}
                onChange={(e) => setTransactionEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={transactionFilterType}
                  onChange={(e) => setTransactionFilterType(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="journal">Journal</MenuItem>
                  <MenuItem value="invoice">Invoice</MenuItem>
                  <MenuItem value="payment">Payment</MenuItem>
                  <MenuItem value="purchase_order">Purchase Order</MenuItem>
                  <MenuItem value="sales_order">Sales Order</MenuItem>
                </Select>
              </FormControl>
              <Tooltip title="Print transactions">
                <IconButton
                  size="small"
                  onClick={handlePrintTransactions}
                  color="primary"
                >
                  <PrintIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export to CSV">
                <IconButton
                  size="small"
                  onClick={handleExportTransactions}
                  color="primary"
                  disabled={filteredTransactions.length === 0}
                >
                  <ExportIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowTransactionDialog(true)}
              >
                Add Transaction
              </Button>
            </Box>
          }
        />
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Transaction #</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Debit</TableCell>
                  <TableCell align="right">Credit</TableCell>
                  <TableCell align="right">Balance</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.map((transaction, index) => (
                  <TableRow
                    key={transaction.id}
                    hover
                    component={motion.tr}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(transaction.transactionDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {transaction.transactionNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {transaction.accountName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {transaction.description}
                      </Typography>
                      {transaction.referenceNumber && (
                        <Typography variant="caption" color="textSecondary">
                          Ref: {transaction.referenceNumber}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.referenceType?.toUpperCase() || 'JOURNAL'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {transaction.debitAmount > 0 && (
                        <Typography variant="body2" color="error.main" fontWeight="medium">
                          {formatCurrency(transaction.debitAmount)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {transaction.creditAmount > 0 && (
                        <Typography variant="body2" color="success.main" fontWeight="medium">
                          {formatCurrency(transaction.creditAmount)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        color={transaction.runningBalance >= 0 ? 'success.main' : 'error.main'}
                        fontWeight="medium"
                      >
                        {formatCurrency(transaction.runningBalance)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={transaction.isReconciled ? 'Reconciled' : 'Pending'}
                        color={transaction.isReconciled ? 'success' : 'warning'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={1}>
                        <Tooltip title="Edit Transaction">
                          <IconButton
                            size="small"
                            onClick={() => handleEditTransaction(transaction)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Transaction">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteTransaction(transaction.id!)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredTransactions.length === 0 && (
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" py={6}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                No transactions found
              </Typography>
              <Typography variant="caption" color="textSecondary" textAlign="center">
                Try adjusting your search filters or add a new transaction
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceIcon color="primary" />
            Ledger Management
          </Typography>
          <Box display="flex" gap={2} alignItems="center">
            {integrationStatus && !integrationStatus.isIntegrated && (
              <Button
                variant="contained"
                startIcon={<SyncIcon />}
                onClick={handleIntegrateRealData}
                disabled={integrating}
                color="primary"
              >
                {integrating ? 'Integrating...' : 'Integrate Real Data'}
              </Button>
            )}
            {integrationStatus && integrationStatus.isIntegrated && (
              <Tooltip title={`${integrationStatus.accountsCount} accounts, ${integrationStatus.transactionsCount} transactions`}>
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Real Data Integrated"
                  color="success"
                  variant="outlined"
                />
              </Tooltip>
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={showInactiveAccounts}
                  onChange={(e) => setShowInactiveAccounts(e.target.checked)}
                />
              }
              label="Show Inactive"
            />
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => setShowPrintDialog(true)}
              disabled={loading || transactions.length === 0}
            >
              Print
            </Button>
            <Button
              variant="outlined"
              startIcon={<SyncIcon />}
              onClick={loadData}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Summary Cards */}
        {renderSummaryCards()}

        {/* Main Content */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Dashboard" />
            <Tab label="Accounts" />
            <Tab label="Transactions" />
            <Tab label="GST Ledger" />
            <Tab label="Reports" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              {renderAccountsTable()}
            </Grid>
            <Grid item xs={12} lg={4}>
              {renderRecentTransactions()}
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {renderAccountsTable()}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {renderTransactionsManagement()}
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Alert severity="info" sx={{ mb: 2 }}>
            GST ledger functionality will be implemented here.
          </Alert>
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Reports functionality will be implemented here.
          </Alert>
        </TabPanel>
      </motion.div>

      {/* Account Dialog */}
      <Dialog
        open={showAccountDialog}
        onClose={() => {
          setShowAccountDialog(false);
          setSelectedAccount(null);
          resetAccountForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedAccount ? 'Edit Account' : 'Create New Account'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Account Name"
                value={accountForm.accountName}
                onChange={(e) => setAccountForm(prev => ({ ...prev, accountName: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Account Type</InputLabel>
                <Select
                  value={accountForm.accountType}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, accountType: e.target.value as any }))}
                  label="Account Type"
                >
                  <MenuItem value="supplier">Supplier</MenuItem>
                  <MenuItem value="customer">Customer</MenuItem>
                  <MenuItem value="bank">Bank</MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="expense">Expense</MenuItem>
                  <MenuItem value="income">Income</MenuItem>
                  <MenuItem value="asset">Asset</MenuItem>
                  <MenuItem value="liability">Liability</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Person"
                value={accountForm.contactPerson}
                onChange={(e) => setAccountForm(prev => ({ ...prev, contactPerson: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={accountForm.phone}
                onChange={(e) => setAccountForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={accountForm.email}
                onChange={(e) => setAccountForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={accountForm.address}
                onChange={(e) => setAccountForm(prev => ({ ...prev, address: e.target.value }))}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Credit Limit"
                type="number"
                value={accountForm.creditLimit}
                onChange={(e) => setAccountForm(prev => ({ ...prev, creditLimit: Number(e.target.value) }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Credit Days"
                type="number"
                value={accountForm.creditDays}
                onChange={(e) => setAccountForm(prev => ({ ...prev, creditDays: Number(e.target.value) }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Opening Balance"
                type="number"
                value={accountForm.openingBalance}
                onChange={(e) => setAccountForm(prev => ({ ...prev, openingBalance: Number(e.target.value) }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={accountForm.isGstApplicable}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, isGstApplicable: e.target.checked }))}
                  />
                }
                label="GST Applicable"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={accountForm.isActive}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowAccountDialog(false);
              setSelectedAccount(null);
              resetAccountForm();
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={selectedAccount ? handleUpdateAccount : handleCreateAccount}
            disabled={saving || !accountForm.accountName}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {selectedAccount ? 'Update' : 'Create'} Account
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleEditAccount(selectedAccountForMenu!);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Account</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedAccountForMenu) {
            handleViewLedger(selectedAccountForMenu);
          }
          handleMenuClose();
        }}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Ledger</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          // Handle export
          handleMenuClose();
        }}>
          <ListItemIcon>
            <ExportIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export Data</ListItemText>
        </MenuItem>
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => setShowAccountDialog(true)}
      >
        <AddIcon />
      </Fab>

      {/* Account Ledger Detail Dialog */}
      <AccountLedgerDetail
        open={showLedgerDetail}
        onClose={() => {
          setShowLedgerDetail(false);
          setSelectedAccount(null);
        }}
        account={selectedAccount}
      />

      {/* Ledger Print Dialog */}
      <LedgerPrintView
        open={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        partyName="All Transactions"
        transactions={filterTransactions()}
        loading={loading}
      />

      {/* Transaction Dialog */}
      <Dialog
        open={showTransactionDialog}
        onClose={() => {
          setShowTransactionDialog(false);
          setSelectedTransaction(null);
          resetTransactionForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedTransaction ? 'Edit Transaction' : 'Add New Transaction'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Transaction Date"
                value={transactionForm.transactionDate}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, transactionDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Account</InputLabel>
                <Select
                  value={transactionForm.accountId}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, accountId: e.target.value }))}
                  label="Account"
                >
                  {accounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.accountName} ({account.accountType})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Reference Type</InputLabel>
                <Select
                  value={transactionForm.referenceType}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, referenceType: e.target.value as any }))}
                  label="Reference Type"
                >
                  <MenuItem value="journal">Journal Entry</MenuItem>
                  <MenuItem value="invoice">Invoice</MenuItem>
                  <MenuItem value="payment">Payment</MenuItem>
                  <MenuItem value="purchase_order">Purchase Order</MenuItem>
                  <MenuItem value="sales_order">Sales Order</MenuItem>
                  <MenuItem value="opening_balance">Opening Balance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Reference Number"
                value={transactionForm.referenceNumber}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                placeholder="Optional reference number"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={transactionForm.description}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={2}
                placeholder="Transaction description"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Debit Amount"
                value={transactionForm.debitAmount || ''}
                onChange={(e) => setTransactionForm(prev => ({
                  ...prev,
                  debitAmount: parseFloat(e.target.value) || 0,
                  creditAmount: e.target.value ? 0 : prev.creditAmount
                }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                placeholder="0.00"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Credit Amount"
                value={transactionForm.creditAmount || ''}
                onChange={(e) => setTransactionForm(prev => ({
                  ...prev,
                  creditAmount: parseFloat(e.target.value) || 0,
                  debitAmount: e.target.value ? 0 : prev.debitAmount
                }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                placeholder="0.00"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags (comma separated)"
                value={transactionForm.tags.join(', ')}
                onChange={(e) => setTransactionForm(prev => ({
                  ...prev,
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                }))}
                placeholder="e.g., urgent, verified, reconciled"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowTransactionDialog(false);
              setSelectedTransaction(null);
              resetTransactionForm();
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={selectedTransaction ? handleUpdateTransaction : handleCreateTransaction}
            disabled={saving || !transactionForm.accountId || !transactionForm.description || (transactionForm.debitAmount === 0 && transactionForm.creditAmount === 0)}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {selectedTransaction ? 'Update' : 'Create'} Transaction
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}