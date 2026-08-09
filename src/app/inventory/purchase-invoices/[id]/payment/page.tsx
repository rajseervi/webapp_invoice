

"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  Payment as PaymentIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';
import PageHeader from '@/components/PageHeader/PageHeader';
import { PurchaseInvoiceService, PurchaseInvoice, PurchasePayment } from '@/services/purchaseInvoiceService';

interface PaymentFormData {
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  referenceNumber: string;
  notes: string;
}

export default function AddPurchasePayment() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoice, setInvoice] = useState<PurchaseInvoice | null>(null);
  const [existingPayments, setExistingPayments] = useState<PurchasePayment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: 0,
    paymentDate: new Date(),
    paymentMethod: '',
    referenceNumber: '',
    notes: ''
  });

  useEffect(() => {
    if (invoiceId) {
      loadInvoiceData();
    }
  }, [invoiceId]);

  const loadInvoiceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [invoiceData, paymentsData] = await Promise.all([
        PurchaseInvoiceService.getPurchaseInvoiceById(invoiceId),
        PurchaseInvoiceService.getPaymentsByInvoiceId(invoiceId)
      ]);
      
      if (!invoiceData) {
        setError('Invoice not found');
        return;
      }
      
      setInvoice(invoiceData);
      setExistingPayments(paymentsData);
      
      // Set default payment amount to remaining balance
      setFormData(prev => ({
        ...prev,
        amount: invoiceData.balanceAmount
      }));
    } catch (err) {
      console.error('Error loading invoice data:', err);
      setError('Failed to load invoice data');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field: keyof PaymentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string | null => {
    if (!invoice) return 'Invoice not loaded';
    if (formData.amount <= 0) return 'Payment amount must be greater than 0';
    if (formData.amount > invoice.balanceAmount) return 'Payment amount cannot exceed balance amount';
    if (!formData.paymentMethod) return 'Please select a payment method';
    if (!formData.paymentDate) return 'Please select a payment date';
    
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!invoice) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const paymentData: Omit<PurchasePayment, 'id' | 'createdAt'> = {
        purchaseInvoiceId: invoice.id!,
        amount: formData.amount,
        paymentDate: formData.paymentDate.toISOString().split('T')[0],
        paymentMethod: formData.paymentMethod as any,
        referenceNumber: formData.referenceNumber || undefined,
        notes: formData.notes || undefined
      };

      await PurchaseInvoiceService.addPayment(paymentData);
      
      setSuccess('Payment added successfully!');
      
      // Redirect back to invoice details after a short delay
      setTimeout(() => {
        router.push(`/inventory/purchase-invoices/${invoice.id}`);
      }, 1500);
    } catch (err) {
      console.error('Error adding payment:', err);
      setError('Failed to add payment');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <ImprovedDashboardLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress size={60} />
          </Box>
        </Container>
      </ImprovedDashboardLayout>
    );
  }

  if (error && !invoice) {
    return (
      <ImprovedDashboardLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/inventory/purchase-invoices')}
          >
            Back to Invoices
          </Button>
        </Container>
      </ImprovedDashboardLayout>
    );
  }

  if (invoice?.paymentStatus === 'paid') {
    return (
      <ImprovedDashboardLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            This invoice has been fully paid. No additional payments can be added.
          </Alert>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push(`/inventory/purchase-invoices/${invoice.id}`)}
          >
            Back to Invoice
          </Button>
        </Container>
      </ImprovedDashboardLayout>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <ImprovedDashboardLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <PageHeader
            title="Add Payment"
            subtitle={`For Invoice ${invoice?.invoiceNumber} - ${invoice?.supplierName}`}
            icon={<PaymentIcon />}
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => router.push(`/inventory/purchase-invoices/${invoice?.id}`)}
                >
                  Cancel
                </Button>
                <LoadingButton
                  variant="contained"
                  startIcon={<SaveIcon />}
                  loading={saving}
                  onClick={handleSubmit}
                >
                  Add Payment
                </LoadingButton>
              </Box>
            }
          />

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Invoice Summary */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Invoice Summary
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Invoice Number
                    </Typography>
                    <Typography variant="h6">
                      {invoice?.invoiceNumber}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Amount
                    </Typography>
                    <Typography variant="h5" color="primary">
                      {formatCurrency(invoice?.finalAmount || 0)}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Paid Amount
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(invoice?.paidAmount || 0)}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Balance Amount
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {formatCurrency(invoice?.balanceAmount || 0)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="body2" color="text.secondary">
                    Supplier: {invoice?.supplierName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Date: {invoice?.purchaseDate && formatDate(invoice.purchaseDate)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Payment Form */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Payment Details
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Payment Amount *"
                        value={formData.amount}
                        onChange={(e) => handleFormChange('amount', Number(e.target.value))}
                        inputProps={{ 
                          min: 0.01, 
                          max: invoice?.balanceAmount || 0,
                          step: 0.01 
                        }}
                        error={formData.amount > (invoice?.balanceAmount || 0)}
                        helperText={
                          formData.amount > (invoice?.balanceAmount || 0)
                            ? 'Amount exceeds balance'
                            : `Max: ${formatCurrency(invoice?.balanceAmount || 0)}`
                        }
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Payment Date *"
                        value={formData.paymentDate}
                        onChange={(date) => handleFormChange('paymentDate', date || new Date())}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        select
                        label="Payment Method *"
                        value={formData.paymentMethod}
                        onChange={(e) => handleFormChange('paymentMethod', e.target.value)}
                        required
                      >
                        <MenuItem value="">Select Method</MenuItem>
                        <MenuItem value="cash">Cash</MenuItem>
                        <MenuItem value="bank">Bank Transfer</MenuItem>
                        <MenuItem value="cheque">Cheque</MenuItem>
                        <MenuItem value="upi">UPI</MenuItem>
                        <MenuItem value="card">Card</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Reference Number"
                        value={formData.referenceNumber}
                        onChange={(e) => handleFormChange('referenceNumber', e.target.value)}
                        placeholder="Transaction ID, Cheque No., etc."
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Notes"
                        value={formData.notes}
                        onChange={(e) => handleFormChange('notes', e.target.value)}
                        multiline
                        rows={3}
                        placeholder="Any additional notes about this payment..."
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Existing Payments */}
            {existingPayments.length > 0 && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Previous Payments
                    </Typography>
                    
                    <List>
                      {existingPayments.map((payment, index) => (
                        <ListItem key={payment.id || index} divider>
                          <ListItemIcon>
                            <AccountBalanceIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${formatCurrency(payment.amount)} - ${payment.paymentMethod.toUpperCase()}`}
                            secondary={
                              <Box>
                                <Typography variant="body2">
                                  Date: {formatDate(payment.paymentDate)}
                                </Typography>
                                {payment.referenceNumber && (
                                  <Typography variant="body2">
                                    Reference: {payment.referenceNumber}
                                  </Typography>
                                )}
                                {payment.notes && (
                                  <Typography variant="body2">
                                    Notes: {payment.notes}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Container>
      </ImprovedDashboardLayout>
    </LocalizationProvider>
  );
}
