"use client"
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  InputAdornment,
  Divider,
  Card,
  CardContent,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import { 
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
  CalendarToday as CalendarTodayIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import { partyService } from '@/services/partyService';
import { transactionService } from '@/services/transactionService';
import { Party } from '@/types/party';
import { TransactionFormData } from '@/types/transaction';

export default function NewTransactionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partyIdParam = searchParams.get('partyId');
  
  const [loading, setLoading] = useState(false);
  const [parties, setParties] = useState<Party[]>([]);
  const [partiesLoading, setPartiesLoading] = useState(true);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<TransactionFormData>({
    partyId: partyIdParam || '',
    amount: 0,
    type: 'debit',
    description: '',
    reference: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  // Form validation
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Fetch parties
  useEffect(() => {
    const fetchParties = async () => {
      try {
        setPartiesLoading(true);
        const partiesData = await partyService.getParties();
        setParties(partiesData);
        
        // If partyId is provided in URL, set the selected party
        if (partyIdParam) {
          const party = partiesData.find(p => p.id === partyIdParam);
          if (party) {
            setSelectedParty(party);
          }
        }
      } catch (err) {
        console.error('Error fetching parties:', err);
        setError('Failed to load parties. Please try again.');
      } finally {
        setPartiesLoading(false);
      }
    };
    
    fetchParties();
  }, [partyIdParam]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    
    if (name) {
      // Clear error for this field when user changes it
      if (formErrors[name]) {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
      
      // Special handling for amount to ensure it's a number
      if (name === 'amount') {
        const numValue = parseFloat(value as string);
        setFormData(prev => ({
          ...prev,
          [name]: isNaN(numValue) ? 0 : numValue
        }));
      } else if (name === 'partyId') {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
        
        // Update selected party
        const party = parties.find(p => p.id === value);
        setSelectedParty(party || null);
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    }
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.partyId) {
      errors.partyId = 'Party is required';
    }
    
    if (formData.amount <= 0) {
      errors.amount = 'Amount must be greater than zero';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!formData.date) {
      errors.date = 'Date is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await transactionService.createTransaction(formData);
      
      setSuccess('Transaction created successfully');
      
      // Reset form
      setFormData({
        partyId: '',
        amount: 0,
        type: 'debit',
        description: '',
        reference: '',
        date: new Date().toISOString().split('T')[0]
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/accounting/transactions');
      }, 1500);
    } catch (err) {
      console.error('Error creating transaction:', err);
      setError('Failed to create transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              New Transaction
            </Typography>
            <Breadcrumbs aria-label="breadcrumb">
              <MuiLink 
                underline="hover" 
                color="inherit" 
                href="/accounting"
                sx={{ cursor: 'pointer' }}
              >
                Accounting
              </MuiLink>
              <MuiLink 
                underline="hover" 
                color="inherit" 
                href="/accounting/transactions"
                sx={{ cursor: 'pointer' }}
              >
                Transactions
              </MuiLink>
              <Typography color="text.primary">New Transaction</Typography>
            </Breadcrumbs>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.back()}
          >
            Back
          </Button>
        </Box>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert 
            severity="success" 
            sx={{ mb: 3 }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Transaction Details
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl 
                      fullWidth 
                      error={!!formErrors.partyId}
                      disabled={partiesLoading}
                    >
                      <InputLabel id="party-select-label">Party</InputLabel>
                      <Select
                        labelId="party-select-label"
                        id="party-select"
                        name="partyId"
                        value={formData.partyId}
                        onChange={handleInputChange}
                        label="Party"
                        startAdornment={
                          <InputAdornment position="start">
                            <PersonIcon fontSize="small" />
                          </InputAdornment>
                        }
                      >
                        {partiesLoading ? (
                          <MenuItem value="">
                            <CircularProgress size={20} /> Loading...
                          </MenuItem>
                        ) : (
                          parties.map(party => (
                            <MenuItem key={party.id} value={party.id}>
                              {party.name}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                      {formErrors.partyId && (
                        <FormHelperText>{formErrors.partyId}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl 
                      fullWidth 
                      error={!!formErrors.type}
                    >
                      <InputLabel id="type-select-label">Transaction Type</InputLabel>
                      <Select
                        labelId="type-select-label"
                        id="type-select"
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        label="Transaction Type"
                      >
                        <MenuItem value="debit">Debit (Receive)</MenuItem>
                        <MenuItem value="credit">Credit (Pay)</MenuItem>
                      </Select>
                      {formErrors.type && (
                        <FormHelperText>{formErrors.type}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      id="amount"
                      name="amount"
                      label="Amount"
                      type="number"
                      value={formData.amount}
                      onChange={handleInputChange}
                      error={!!formErrors.amount}
                      helperText={formErrors.amount}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AttachMoneyIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      id="date"
                      name="date"
                      label="Date"
                      type="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      error={!!formErrors.date}
                      helperText={formErrors.date}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarTodayIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="description"
                      name="description"
                      label="Description"
                      value={formData.description}
                      onChange={handleInputChange}
                      error={!!formErrors.description}
                      helperText={formErrors.description}
                      multiline
                      rows={2}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <DescriptionIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="reference"
                      name="reference"
                      label="Reference (Optional)"
                      value={formData.reference}
                      onChange={handleInputChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ReceiptIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => router.back()}
                        sx={{ mr: 2 }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save Transaction'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Party Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {partiesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : selectedParty ? (
                  <>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {selectedParty.name}
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Contact Information
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedParty.email}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedParty.phone}
                      </Typography>
                    </Box>
                    
                    {selectedParty.address && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Address
                        </Typography>
                        <Typography variant="body1">
                          {selectedParty.address}
                        </Typography>
                      </Box>
                    )}
                    
                    {selectedParty.gstin && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          GSTIN
                        </Typography>
                        <Typography variant="body1">
                          {selectedParty.gstin}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Outstanding Balance
                      </Typography>
                      <Typography 
                        variant="body1" 
                        fontWeight={600}
                        color={
                          selectedParty.outstandingBalance && selectedParty.outstandingBalance > 0 
                            ? 'error.main' 
                            : selectedParty.outstandingBalance && selectedParty.outstandingBalance < 0 
                              ? 'success.main' 
                              : 'text.primary'
                        }
                      >
                        ₹{selectedParty.outstandingBalance 
                          ? Math.abs(selectedParty.outstandingBalance).toLocaleString('en-IN', { maximumFractionDigits: 2 })
                          : '0.00'
                        }
                        {selectedParty.outstandingBalance ? (
                          selectedParty.outstandingBalance > 0 
                            ? ' (Receivable)' 
                            : ' (Payable)'
                        ) : ''}
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Select a party to view their information
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Transaction Help
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="body2" paragraph>
                  <strong>Debit (Receive):</strong> Select this when you are receiving money from the party. This increases the amount they owe you.
                </Typography>
                
                <Typography variant="body2" paragraph>
                  <strong>Credit (Pay):</strong> Select this when you are paying money to the party. This decreases the amount they owe you.
                </Typography>
                
                <Typography variant="body2">
                  <strong>Reference:</strong> Optional field to add invoice numbers, check numbers, or any other reference information.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </DashboardLayout>
  );
}