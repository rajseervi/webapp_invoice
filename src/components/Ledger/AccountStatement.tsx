"use client";
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  Grid,
  TextField,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Print as PrintIcon,
  GetApp as ExportIcon,
  Refresh as RefreshIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Receipt as ReceiptIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { ledgerService, LedgerAccount, AccountStatement as AccountStatementType } from '@/services/ledgerService';

interface AccountStatementProps {
  open: boolean;
  onClose: () => void;
  account: LedgerAccount | null;
}

export default function AccountStatement({ open, onClose, account }: AccountStatementProps) {
  const [statement, setStatement] = useState<AccountStatementType | null>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (open && account) {
      generateStatement();
    }
  }, [open, account, startDate, endDate]);

  const generateStatement = async () => {
    if (!account) return;

    setLoading(true);
    try {
      const statementData = await ledgerService.getAccountStatement(
        account.id!,
        startDate,
        endDate
      );
      setStatement(statementData);
    } catch (error) {
      console.error('Error generating account statement:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getAccountTypeIcon = (type: string) => {
    const icons = {
      supplier: '🏢',
      customer: '👤',
      bank: '🏦',
      cash: '💰',
      expense: '📉',
      income: '📈',
      asset: '🏠',
      liability: '⚠️'
    };
    return icons[type as keyof typeof icons] || '📊';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!statement) return;

    // Create CSV content
    const csvContent = [
      // Header
      ['Account Statement'],
      [`Account: ${statement.account.accountName}`],
      [`Period: ${startDate} to ${endDate}`],
      [''],
      // Transaction headers
      ['Date', 'Description', 'Reference', 'Debit', 'Credit', 'Balance'],
      // Opening balance
      ['Opening Balance', '', '', '', '', formatCurrency(statement.summary.openingBalance)],
      // Transactions
      ...statement.transactions.map(t => [
        new Date(t.transactionDate).toLocaleDateString(),
        t.description,
        t.referenceNumber || '',
        t.debitAmount > 0 ? formatCurrency(t.debitAmount) : '',
        t.creditAmount > 0 ? formatCurrency(t.creditAmount) : '',
        formatCurrency(t.runningBalance)
      ]),
      // Summary
      [''],
      ['Summary'],
      ['Total Debits', '', '', formatCurrency(statement.summary.totalDebits), '', ''],
      ['Total Credits', '', '', '', formatCurrency(statement.summary.totalCredits), ''],
      ['Closing Balance', '', '', '', '', formatCurrency(statement.summary.closingBalance)]
    ];

    const csvString = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${statement.account.accountName}_Statement_${startDate}_to_${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!account) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <AccountBalanceIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">Account Statement</Typography>
              <Typography variant="body2" color="textSecondary">
                {account.accountName} ({account.accountCode})
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title="Refresh">
              <IconButton onClick={generateStatement} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print">
              <IconButton onClick={handlePrint} disabled={loading}>
                <PrintIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export">
              <IconButton onClick={handleExport} disabled={loading || !statement}>
                <ExportIcon />
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
          <Box display="flex" justifyContent="center" alignItems="center" py={8}>
            <CircularProgress size={60} />
          </Box>
        ) : statement ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Date Range Selector */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Start Date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="End Date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Button
                      variant="contained"
                      onClick={generateStatement}
                      disabled={loading}
                      startIcon={<RefreshIcon />}
                    >
                      Update Statement
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Account Info Card */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Typography variant="h2" sx={{ fontSize: '2rem' }}>
                        {getAccountTypeIcon(account.accountType)}
                      </Typography>
                      <Box>
                        <Typography variant="h5" fontWeight="bold">
                          {account.accountName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {account.accountCode} • {account.accountType.toUpperCase()}
                        </Typography>
                        {account.gstNumber && (
                          <Chip label={`GST: ${account.gstNumber}`} size="small" sx={{ mt: 1 }} />
                        )}
                      </Box>
                    </Box>

                    {account.address && (
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        <strong>Address:</strong> {account.address}
                      </Typography>
                    )}
                    
                    <Box display="flex" gap={2} flexWrap="wrap">
                      {account.phone && (
                        <Typography variant="body2" color="textSecondary">
                          <strong>Phone:</strong> {account.phone}
                        </Typography>
                      )}
                      {account.email && (
                        <Typography variant="body2" color="textSecondary">
                          <strong>Email:</strong> {account.email}
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Statement Period
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                      {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {statement.summary.transactionCount} transactions
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: 'info.main' }}>
                        <AccountBalanceIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Opening Balance
                        </Typography>
                        <Typography variant="h6" color="info.main">
                          {formatCurrency(statement.summary.openingBalance)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: 'error.main' }}>
                        <TrendingUpIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Total Debits
                        </Typography>
                        <Typography variant="h6" color="error.main">
                          {formatCurrency(statement.summary.totalDebits)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: 'success.main' }}>
                        <TrendingDownIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Total Credits
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {formatCurrency(statement.summary.totalCredits)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <ReceiptIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Closing Balance
                        </Typography>
                        <Typography
                          variant="h6"
                          color={statement.summary.closingBalance >= 0 ? 'primary.main' : 'error.main'}
                        >
                          {formatCurrency(statement.summary.closingBalance)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Transactions Table */}
            <Card>
              <CardContent sx={{ p: 0 }}>
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
                        <TableCell align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* Opening Balance Row */}
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {new Date(startDate).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            Opening Balance
                          </Typography>
                        </TableCell>
                        <TableCell>-</TableCell>
                        <TableCell align="right">-</TableCell>
                        <TableCell align="right">-</TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color={statement.summary.openingBalance >= 0 ? 'success.main' : 'error.main'}
                          >
                            {formatCurrency(statement.summary.openingBalance)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">-</TableCell>
                      </TableRow>

                      {/* Transaction Rows */}
                      {statement.transactions.map((transaction, index) => (
                        <motion.tr
                          key={transaction.id}
                          component={TableRow}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          hover
                          sx={{
                            '&:nth-of-type(even)': { bgcolor: 'grey.25' }
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(transaction.transactionDate).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {transaction.description}
                            </Typography>
                            {transaction.referenceType && (
                              <Typography variant="caption" color="textSecondary">
                                {transaction.referenceType.replace('_', ' ').toUpperCase()}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {transaction.referenceNumber || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {transaction.debitAmount > 0 ? (
                              <Typography variant="body2" color="error.main" fontWeight="medium">
                                {formatCurrency(transaction.debitAmount)}
                              </Typography>
                            ) : '-'}
                          </TableCell>
                          <TableCell align="right">
                            {transaction.creditAmount > 0 ? (
                              <Typography variant="body2" color="success.main" fontWeight="medium">
                                {formatCurrency(transaction.creditAmount)}
                              </Typography>
                            ) : '-'}
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              fontWeight="medium"
                              color={transaction.runningBalance >= 0 ? 'primary.main' : 'error.main'}
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
                        </motion.tr>
                      ))}

                      {/* Closing Balance Row */}
                      <TableRow sx={{ bgcolor: 'primary.50', fontWeight: 'bold' }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {new Date(endDate).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            Closing Balance
                          </Typography>
                        </TableCell>
                        <TableCell>-</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(statement.summary.totalDebits)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(statement.summary.totalCredits)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color={statement.summary.closingBalance >= 0 ? 'success.main' : 'error.main'}
                          >
                            {formatCurrency(statement.summary.closingBalance)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">-</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {statement.transactions.length === 0 && (
                  <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                    <Alert severity="info">
                      No transactions found for the selected period.
                    </Alert>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Alert severity="error">
            Unable to generate account statement. Please try again.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          onClick={handlePrint}
          disabled={loading || !statement}
          startIcon={<PrintIcon />}
        >
          Print Statement
        </Button>
      </DialogActions>
    </Dialog>
  );
}