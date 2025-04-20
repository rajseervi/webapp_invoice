import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TransactionFormData, TransactionType } from '@/types/transaction';
import { Party } from '@/types/party';
import { transactionService } from '@/services/transactionService';
import { format } from 'date-fns';

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  parties: Party[];
  initialData?: TransactionFormData;
  transactionId?: string;
}

const initialFormState: TransactionFormData = {
  partyId: '',
  amount: 0,
  type: 'debit',
  description: '',
  reference: '',
  date: format(new Date(), 'yyyy-MM-dd')
};

export default function TransactionForm({
  open,
  onClose,
  onSave,
  parties,
  initialData,
  transactionId
}: TransactionFormProps) {
  const [formData, setFormData] = useState<TransactionFormData>(initialData || initialFormState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    initialData?.date ? new Date(initialData.date) : new Date()
  );

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setSelectedDate(initialData.date ? new Date(initialData.date) : new Date());
    } else {
      setFormData(initialFormState);
      setSelectedDate(new Date());
    }
  }, [initialData, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.partyId) {
      newErrors.partyId = 'Party is required';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.description) {
      newErrors.description = 'Description is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData({
        ...formData,
        [name]: value
      });

      // Clear error when field is updated
      if (errors[name]) {
        setErrors({
          ...errors,
          [name]: ''
        });
      }
    }
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      setFormData({
        ...formData,
        date: format(date, 'yyyy-MM-dd')
      });

      // Clear date error
      if (errors.date) {
        setErrors({
          ...errors,
          date: ''
        });
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (transactionId) {
        // Update existing transaction
        await transactionService.updateTransaction(transactionId, formData);
      } else {
        // Create new transaction
        await transactionService.createTransaction(formData);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      setErrors({
        ...errors,
        submit: 'Failed to save transaction. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {transactionId ? 'Edit Transaction' : 'Add New Transaction'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.partyId}>
                <InputLabel>Party</InputLabel>
                <Select
                  name="partyId"
                  value={formData.partyId}
                  label="Party"
                  onChange={handleInputChange}
                >
                  {parties.map((party) => (
                    <MenuItem key={party.id} value={party.id}>
                      {party.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.partyId && <FormHelperText>{errors.partyId}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Transaction Type</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  label="Transaction Type"
                  onChange={handleInputChange}
                >
                  <MenuItem value="debit">Debit (Party Owes Us)</MenuItem>
                  <MenuItem value="credit">Credit (We Owe Party)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Amount"
                name="amount"
                type="number"
                fullWidth
                value={formData.amount}
                onChange={handleInputChange}
                error={!!errors.amount}
                helperText={errors.amount}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Transaction Date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.date,
                      helperText: errors.date
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Description"
                name="description"
                fullWidth
                value={formData.description}
                onChange={handleInputChange}
                error={!!errors.description}
                helperText={errors.description}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Reference (Optional)"
                name="reference"
                fullWidth
                value={formData.reference || ''}
                onChange={handleInputChange}
                placeholder="Invoice number, check number, etc."
              />
            </Grid>

            {errors.submit && (
              <Grid item xs={12}>
                <Typography color="error">{errors.submit}</Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : transactionId ? 'Update' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}