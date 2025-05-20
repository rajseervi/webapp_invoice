"use client";
import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Grid, // Added Grid
  Paper // Added Paper
} from '@mui/material';
import { Invoice } from '@/types/invoice';
import CompanyInfoDisplay from '@/components/CompanyInfoDisplay'; // Assuming this exists

interface SimpleInvoiceViewProps {
  invoice: Invoice;
}

// Helper to safely format currency
const formatCurrency = (value: number | undefined | null): string => {
  return `₹${(value ?? 0).toFixed(2)}`;
};

// Helper to safely format date
const formatDate = (dateInput: any): string => {
  if (!dateInput) return 'N/A';
  try {
    if (dateInput.toDate) {
      return new Date(dateInput.toDate()).toLocaleDateString();
    }
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString();
    }
  } catch (e) { /* ignore */ }
  return String(dateInput);
};

const SimpleInvoiceView: React.FC<SimpleInvoiceViewProps> = ({ invoice }) => {
  return (
    // Use Paper for the main container for a slightly elevated look
    <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: '1px solid #eee', bgcolor: '#fff' }}>
      {/* Header using Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }} alignItems="flex-start">
        <Grid item xs={12} sm={6}>
          <Typography variant="h5" component="h1" gutterBottom>INVOICE</Typography>
          <Typography variant="body2">Invoice #: {invoice.invoiceNumber || 'N/A'}</Typography>
          <Typography variant="body2">Date: {formatDate(invoice.date)}</Typography>
          <Typography variant="body2">Created: {formatDate(invoice.createdAt)}</Typography>
        </Grid>
        <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'left', sm: 'right' }, mt: { xs: 2, sm: 0 } }}>
           <CompanyInfoDisplay variant="simple" />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Bill To in a Paper */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="overline" display="block" color="text.secondary" gutterBottom>Bill To:</Typography>
        <Typography variant="body1" fontWeight="medium">{invoice.partyName || 'N/A'}</Typography>
        {invoice.partyAddress && <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mt: 0.5 }}>{invoice.partyAddress}</Typography>}
        {invoice.partyEmail && <Typography variant="body2">Email: {invoice.partyEmail}</Typography>}
        {invoice.partyPhone && <Typography variant="body2">Phone: {invoice.partyPhone}</Typography>}
      </Paper>

      {/* Items Table */}
      <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>Items</Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Discount</TableCell>
              <TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoice.items?.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.name}</TableCell>
                <TableCell align="right">{item.quantity}</TableCell>
                <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                <TableCell align="right">{item.discount > 0 ? `${item.discount}%` : '-'}</TableCell>
                <TableCell align="right">{formatCurrency(item.finalPrice)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Summary in a Paper */}
      <Grid container justifyContent="flex-end" sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={5}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Subtotal:</Typography>
                <Typography variant="body2">{formatCurrency(invoice.subtotal)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Discount:</Typography>
                <Typography variant="body2" color="error">{formatCurrency(invoice.discount)}</Typography>
              </Box>
              {invoice.transportCharges != null && invoice.transportCharges > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">Transport:</Typography>
                  <Typography variant="body2">{formatCurrency(invoice.transportCharges)}</Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1" fontWeight="bold">Total:</Typography>
                <Typography variant="body1" fontWeight="bold">{formatCurrency(invoice.total)}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>


      {/* Notes */}
      {invoice.notes && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="overline" display="block" color="text.secondary" gutterBottom>Notes:</Typography>
          <Paper variant="outlined" sx={{ p: 2, whiteSpace: 'pre-wrap' }}>
             <Typography variant="body2">{invoice.notes}</Typography>
          </Paper>
        </Box>
      )}

      {/* Terms */}
      <Box sx={{ mb: 2 }}>
         <Typography variant="overline" display="block" color="text.secondary" gutterBottom>Terms:</Typography>
         <Typography variant="caption">Payment due within 30 days.</Typography>
      </Box>

    </Paper> // Changed closing tag
  );
};

export default SimpleInvoiceView;