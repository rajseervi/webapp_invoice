"use client";
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  ExpandMore as ExpandMoreIcon,
  Calculate as CalculateIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { ledgerService, LedgerAccount, LedgerTransaction } from '@/services/ledgerService';

interface TransactionRecorderProps {
  open: boolean;
  onClose: () => void;
  onTransactionRecorded: () => void;
  preSelectedAccount?: LedgerAccount;
  referenceData?: {
    referenceType: string;
    referenceId: string;
    referenceNumber: string;
  };
}

interface TransactionFormEntry {
  accountId: string;
  accountName: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  gstDetails?: {
    gstAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    gstRate: number;
    isInterState: boolean;
  };
}

export default function TransactionRecorder({
  open,
  onClose,
  onTransactionRecorded,
  preSelectedAccount,
  referenceData
}: TransactionRecorderProps) {
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [entries, setEntries] = useState<TransactionFormEntry[]>([
    {
      accountId: '',
      accountName: '',
      description: '',
      debitAmount: 0,
      creditAmount: 0
    },
    {
      accountId: '',
      accountName: '',
      description: '',
      debitAmount: 0,
      creditAmount: 0
    }
  ]);

  // GST settings
  const [includeGST, setIncludeGST] = useState(false);
  const [companyStateCode, setCompanyStateCode] = useState('27'); // Default to Maharashtra
  const [supplierStateCode, setSupplierStateCode] = useState('27');

  // Validation
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      loadAccounts();
      resetForm();
      
      if (preSelectedAccount) {
        setEntries(prev => [
          {
            ...prev[0],
            accountId: preSelectedAccount.id!,
            accountName: preSelectedAccount.accountName
          },
          prev[1]
        ]);
      }

      if (referenceData) {
        setReferenceNumber(referenceData.referenceNumber);
        setDescription(`Transaction for ${referenceData.referenceType} - ${referenceData.referenceNumber}`);
      }
    }
  }, [open, preSelectedAccount, referenceData]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const accountsData = await ledgerService.getAccounts({ isActive: true });
      setAccounts(accountsData);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setReferenceNumber('');
    setEntries([
      {
        accountId: '',
        accountName: '',
        description: '',
        debitAmount: 0,
        creditAmount: 0
      },
      {
        accountId: '',
        accountName: '',
        description: '',
        debitAmount: 0,
        creditAmount: 0
      }
    ]);
    setIncludeGST(false);
    setErrors([]);
  };

  const addEntry = () => {
    setEntries(prev => [
      ...prev,
      {
        accountId: '',
        accountName: '',
        description: '',
        debitAmount: 0,
        creditAmount: 0
      }
    ]);
  };

  const removeEntry = (index: number) => {
    if (entries.length > 2) {
      setEntries(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateEntry = (index: number, field: keyof TransactionFormEntry, value: any) => {
    setEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  const handleAccountChange = (index: number, account: LedgerAccount | null) => {
    if (account) {
      updateEntry(index, 'accountId', account.id);
      updateEntry(index, 'accountName', account.accountName);
      
      // Update state codes for GST calculation if it's a supplier/customer
      if (account.accountType === 'supplier' || account.accountType === 'customer') {
        // Assuming account has state code information
        // setSupplierStateCode(account.stateCode || '27');
      }
    }
  };

  const calculateGST = (entry: TransactionFormEntry, gstRate: number) => {
    const amount = Math.max(entry.debitAmount, entry.creditAmount);
    const isInterState = companyStateCode !== supplierStateCode;
    const gstAmount = (amount * gstRate) / 100;
    
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isInterState) {
      igstAmount = gstAmount;
    } else {
      cgstAmount = gstAmount / 2;
      sgstAmount = gstAmount / 2;
    }

    return {
      gstAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      gstRate,
      isInterState
    };
  };

  const validateTransaction = (): string[] => {
    const validationErrors: string[] = [];

    // Check if at least 2 entries have accounts selected
    const validEntries = entries.filter(entry => entry.accountId && (entry.debitAmount > 0 || entry.creditAmount > 0));
    if (validEntries.length < 2) {
      validationErrors.push('At least 2 account entries are required');
    }

    // Check if debits equal credits
    const totalDebits = entries.reduce((sum, entry) => sum + entry.debitAmount, 0);
    const totalCredits = entries.reduce((sum, entry) => sum + entry.creditAmount, 0);
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      validationErrors.push(`Transaction is not balanced. Debits: ₹${totalDebits.toFixed(2)}, Credits: ₹${totalCredits.toFixed(2)}`);
    }

    // Check if each entry has either debit or credit (not both)
    entries.forEach((entry, index) => {
      if (entry.accountId && entry.debitAmount > 0 && entry.creditAmount > 0) {
        validationErrors.push(`Entry ${index + 1}: Cannot have both debit and credit amounts`);
      }
    });

    // Check for duplicate accounts
    const accountIds = entries.filter(e => e.accountId).map(e => e.accountId);
    const duplicates = accountIds.filter((id, index) => accountIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      validationErrors.push('Duplicate accounts are not allowed in the same transaction');
    }

    return validationErrors;
  };

  const handleSave = async () => {
    const validationErrors = validateTransaction();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      // Create individual transactions for each entry
      const transactionPromises = entries
        .filter(entry => entry.accountId && (entry.debitAmount > 0 || entry.creditAmount > 0))
        .map(async (entry) => {
          const transactionData: Omit<LedgerTransaction, 'id'> = {
            transactionNumber: await generateTransactionNumber(),
            transactionDate,
            accountId: entry.accountId,
            accountName: entry.accountName,
            description: entry.description || description,
            referenceNumber,
            referenceType: referenceData?.referenceType as any,
            referenceId: referenceData?.referenceId,
            debitAmount: entry.debitAmount,
            creditAmount: entry.creditAmount,
            runningBalance: 0, // Will be calculated by the service
            gstDetails: entry.gstDetails,
            isReconciled: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          return ledgerService.createTransaction(transactionData);
        });

      await Promise.all(transactionPromises);
      onTransactionRecorded();
      onClose();
    } catch (error) {
      console.error('Error recording transaction:', error);
      setErrors(['Error recording transaction. Please try again.']);
    } finally {
      setSaving(false);
    }
  };

  const generateTransactionNumber = async (): Promise<string> => {
    // Simple transaction number generation - can be enhanced
    return `TXN${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  };

  const getTotalDebits = () => entries.reduce((sum, entry) => sum + entry.debitAmount, 0);
  const getTotalCredits = () => entries.reduce((sum, entry) => sum + entry.creditAmount, 0);
  const getDifference = () => Math.abs(getTotalDebits() - getTotalCredits());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <ReceiptIcon color="primary" />
          Record Transaction
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Transaction Details */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Transaction Date"
                      type="date"
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Reference Number"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Invoice/Order number"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={includeGST}
                          onChange={(e) => setIncludeGST(e.target.checked)}
                        />
                      }
                      label="Include GST Calculations"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Transaction Description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      multiline
                      rows={2}
                      placeholder="Brief description of the transaction"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Transaction Entries */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Transaction Entries</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={addEntry}
                    size="small"
                  >
                    Add Entry
                  </Button>
                </Box>

                {entries.map((entry, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={3}>
                            <Autocomplete
                              size="small"
                              options={accounts}
                              getOptionLabel={(option) => option.accountName}
                              value={accounts.find(a => a.id === entry.accountId) || null}
                              onChange={(_, value) => handleAccountChange(index, value)}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Account"
                                  required
                                />
                              )}
                              renderOption={(props, option) => (
                                <Box component="li" {...props}>
                                  <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body2">{option.accountName}</Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      {option.accountCode} | {option.accountType.toUpperCase()}
                                    </Typography>
                                  </Box>
                                </Box>
                              )}
                            />
                          </Grid>

                          <Grid item xs={12} md={3}>
                            <TextField
                              size="small"
                              fullWidth
                              label="Description"
                              value={entry.description}
                              onChange={(e) => updateEntry(index, 'description', e.target.value)}
                              placeholder="Entry description"
                            />
                          </Grid>

                          <Grid item xs={12} md={2}>
                            <TextField
                              size="small"
                              fullWidth
                              label="Debit Amount"
                              type="number"
                              value={entry.debitAmount || ''}
                              onChange={(e) => updateEntry(index, 'debitAmount', Number(e.target.value) || 0)}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                              }}
                              inputProps={{ min: 0, step: 0.01 }}
                            />
                          </Grid>

                          <Grid item xs={12} md={2}>
                            <TextField
                              size="small"
                              fullWidth
                              label="Credit Amount"
                              type="number"
                              value={entry.creditAmount || ''}
                              onChange={(e) => updateEntry(index, 'creditAmount', Number(e.target.value) || 0)}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                              }}
                              inputProps={{ min: 0, step: 0.01 }}
                            />
                          </Grid>

                          <Grid item xs={12} md={2}>
                            <Box display="flex" alignItems="center" gap={1}>
                              {entries.length > 2 && (
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() => removeEntry(index)}
                                >
                                  Remove
                                </Button>
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {/* Transaction Summary */}
                <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="textSecondary">Total Debits</Typography>
                        <Typography variant="h6" color="error.main">
                          {formatCurrency(getTotalDebits())}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="textSecondary">Total Credits</Typography>
                        <Typography variant="h6" color="success.main">
                          {formatCurrency(getTotalCredits())}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="textSecondary">Difference</Typography>
                        <Typography 
                          variant="h6" 
                          color={getDifference() === 0 ? 'success.main' : 'error.main'}
                        >
                          {formatCurrency(getDifference())}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getDifference() === 0 ? (
                            <Chip label="Balanced" color="success" size="small" />
                          ) : (
                            <Chip label="Not Balanced" color="error" size="small" />
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* GST Settings */}
            {includeGST && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">GST Settings</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    GST calculations will be applied automatically based on account types and state codes.
                  </Alert>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Company State Code"
                        value={companyStateCode}
                        onChange={(e) => setCompanyStateCode(e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Supplier/Customer State Code"
                        value={supplierStateCode}
                        onChange={(e) => setSupplierStateCode(e.target.value)}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Validation Errors */}
            {errors.length > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Please fix the following errors:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {errors.map((error, index) => (
                    <li key={index}>
                      <Typography variant="body2">{error}</Typography>
                    </li>
                  ))}
                </ul>
              </Alert>
            )}
          </motion.div>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || getDifference() !== 0}
          startIcon={saving ? <CircularProgress size={20} /> : <CalculateIcon />}
        >
          {saving ? 'Recording...' : 'Record Transaction'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}