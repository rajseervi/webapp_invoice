"use client";
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,

  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  useTheme,
  alpha,
  Stack
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Payment as PaymentIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Print as PrintIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { PurchaseInvoice, PurchasePayment } from '@/types/purchase_no_gst';

interface PurchaseInvoiceDetailsNoGSTProps {
  invoice: PurchaseInvoice;
  payments?: PurchasePayment[];
  onEdit?: () => void;
  onDelete?: () => void;
  onAddPayment?: (payment: Omit<PurchasePayment, 'id' | 'createdAt'>) => void;
  onPrint?: () => void;
  onDownload?: () => void;
  readOnly?: boolean;
}

const PurchaseInvoiceDetailsNoGST: React.FC<PurchaseInvoiceDetailsNoGSTProps> = ({
  invoice,
  payments = [],
  onEdit,
  onDelete,
  onAddPayment,
  onPrint,
  onDownload,
  readOnly = false
}) => {
  const theme = useTheme();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash' as const,
    referenceNumber: '',
    notes: ''
  });

  const handleAddPayment = () => {
    if (newPayment.amount > 0 && onAddPayment) {
      onAddPayment({
        purchaseInvoiceId: invoice.id!,
        amount: newPayment.amount,
        paymentDate: newPayment.paymentDate,
        paymentMethod: newPayment.paymentMethod,
        referenceNumber: newPayment.referenceNumber,
        notes: newPayment.notes
      });
      setShowPaymentForm(false);
      setNewPayment({
        amount: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
        referenceNumber: '',
        notes: ''
      });
    }
  };

  const handleCancelPayment = () => {
    setShowPaymentForm(false);
    setNewPayment({
      amount: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      referenceNumber: '',
      notes: ''
    });
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'partial': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Purchase Invoice
          </Typography>
          <Typography variant="h6" color="primary">
            {invoice.invoiceNumber}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onPrint && (
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={onPrint}
            >
              Print
            </Button>
          )}
          {onDownload && (
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={onDownload}
            >
              Download
            </Button>
          )}
          {!readOnly && onEdit && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={onEdit}
            >
              Edit
            </Button>
          )}
          {!readOnly && onDelete && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={onDelete}
            >
              Delete
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Invoice Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ReceiptIcon color="primary" />
                <Typography variant="h6">Invoice Information</Typography>
              </Box>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Invoice Number:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {invoice.invoiceNumber}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Supplier Invoice:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {invoice.supplierInvoiceNumber}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Purchase Date:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {format(new Date(invoice.purchaseDate), 'dd MMM yyyy')}
                  </Typography>
                </Box>
                {invoice.dueDate && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Due Date:
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {format(new Date(invoice.dueDate), 'dd MMM yyyy')}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Status:
                  </Typography>
                  <Chip
                    label={invoice.paymentStatus.toUpperCase()}
                    color={getPaymentStatusColor(invoice.paymentStatus)}
                    size="small"
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Supplier Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PersonIcon color="primary" />
                <Typography variant="h6">Supplier Information</Typography>
              </Box>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Name:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {invoice.supplierName}
                  </Typography>
                </Box>
                {invoice.supplierPhone && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Phone:
                    </Typography>
                    <Typography variant="body2">
                      {invoice.supplierPhone}
                    </Typography>
                  </Box>
                )}
                {invoice.supplierEmail && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Email:
                    </Typography>
                    <Typography variant="body2">
                      {invoice.supplierEmail}
                    </Typography>
                  </Box>
                )}
                {invoice.supplierAddress && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Address:
                    </Typography>
                    <Typography variant="body2">
                      {invoice.supplierAddress}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Invoice Items */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Invoice Items
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">Qty</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">Unit</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Unit Price</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Discount</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.items.map((item, index) => (
                      <TableRow 
                        key={item.id || index}
                        hover
                        sx={{
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.04)
                          }
                        }}
                      >
                        <TableCell>
                          <Chip 
                            label={index + 1} 
                            size="small" 
                            color="primary" 
                            sx={{ minWidth: 32 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {item.productName}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {item.quantity}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={item.unitOfMeasurement} 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            ₹{item.unitPrice.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {item.discountAmount && item.discountAmount > 0 ? (
                            <Typography variant="body2" color="error">
                              -₹{item.discountAmount.toFixed(2)}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            fontWeight="bold"
                            sx={{ 
                              color: theme.palette.success.main,
                              backgroundColor: alpha(theme.palette.success.main, 0.1),
                              px: 1,
                              py: 0.5,
                              borderRadius: 1
                            }}
                          >
                            ₹{item.totalAmount.toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Summary */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PaymentIcon color="primary" />
                  <Typography variant="h6">Payment Summary</Typography>
                </Box>
                {!readOnly && invoice.balanceAmount > 0 && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setShowPaymentForm(!showPaymentForm)}
                  >
                    {showPaymentForm ? 'Cancel' : 'Add Payment'}
                  </Button>
                )}
              </Box>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Subtotal:
                  </Typography>
                  <Typography variant="body2">
                    ₹{invoice.subtotal.toFixed(2)}
                  </Typography>
                </Box>
                {invoice.totalDiscountAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Discount:
                    </Typography>
                    <Typography variant="body2" color="error">
                      -₹{invoice.totalDiscountAmount.toFixed(2)}
                    </Typography>
                  </Box>
                )}
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight="bold">
                    Total Amount:
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    ₹{invoice.finalAmount.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Paid Amount:
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    ₹{invoice.paidAmount.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Balance Amount:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color={invoice.balanceAmount > 0 ? "error.main" : "success.main"}
                    fontWeight="medium"
                  >
                    ₹{invoice.balanceAmount.toFixed(2)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Inline Payment Form */}
        {showPaymentForm && (
          <Grid item xs={12}>
            <Card sx={{ border: 2, borderColor: 'primary.main' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                  Add New Payment
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Amount *"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                      inputProps={{ min: 0.01, max: invoice.balanceAmount, step: 0.01 }}
                      InputProps={{
                        startAdornment: '₹'
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Payment Date *"
                      value={newPayment.paymentDate}
                      onChange={(e) => setNewPayment({ ...newPayment, paymentDate: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Payment Method *</InputLabel>
                      <Select
                        value={newPayment.paymentMethod}
                        onChange={(e) => setNewPayment({ ...newPayment, paymentMethod: e.target.value as any })}
                        label="Payment Method *"
                      >
                        <MenuItem value="cash">Cash</MenuItem>
                        <MenuItem value="bank">Bank Transfer</MenuItem>
                        <MenuItem value="cheque">Cheque</MenuItem>
                        <MenuItem value="upi">UPI</MenuItem>
                        <MenuItem value="card">Card</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Reference Number"
                      value={newPayment.referenceNumber}
                      onChange={(e) => setNewPayment({ ...newPayment, referenceNumber: e.target.value })}
                      placeholder="Cheque no., Transaction ID, etc."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Notes"
                      value={newPayment.notes}
                      onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                      placeholder="Optional notes about this payment"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        onClick={handleCancelPayment}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleAddPayment}
                        disabled={newPayment.amount <= 0 || newPayment.amount > invoice.balanceAmount}
                        startIcon={<AddIcon />}
                      >
                        Add Payment
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Payment History */}
        {payments.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment History
                </Typography>
                <Stack spacing={2}>
                  {payments.map((payment, index) => (
                    <Box 
                      key={payment.id || index}
                      sx={{ 
                        p: 2, 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.success.main, 0.05)
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          ₹{payment.amount.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(payment.paymentDate), 'dd MMM yyyy')}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Chip 
                          label={payment.paymentMethod.toUpperCase()} 
                          size="small" 
                          variant="outlined"
                        />
                        {payment.referenceNumber && (
                          <Typography variant="caption" color="text.secondary">
                            Ref: {payment.referenceNumber}
                          </Typography>
                        )}
                      </Box>
                      {payment.notes && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          {payment.notes}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Notes */}
        {invoice.notes && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {invoice.notes}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>


    </Box>
  );
};

export default PurchaseInvoiceDetailsNoGST;