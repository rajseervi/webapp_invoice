"use client";
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Button,
  useTheme,
} from '@mui/material';
import { PictureAsPdf as PdfIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { generateClassicInvoicePDF } from '@/utils/pdfInvoiceGenerator';

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  hsn?: string;
  tax?: number;
}

interface InvoiceViewProps {
  data: {
    invoiceNumber: string;
    date: Date;
    dueDate?: Date;
    company: {
      name: string;
      address: string;
      gstin?: string;
      phone?: string;
      email?: string;
    };
    customer: {
      name: string;
      address: string;
      gstin?: string;
      phone?: string;
      email?: string;
    };
    items: InvoiceItem[];
    subtotal: number;
    tax?: number;
    discount?: number;
    total: number;
    notes?: string;
    terms?: string;
    paymentDetails?: {
      bankName?: string;
      accountNumber?: string;
      ifscCode?: string;
    };
  };
}

const ClassicInvoiceView: React.FC<InvoiceViewProps> = ({ data }) => {
  const theme = useTheme();

  const handleDownloadPDF = () => {
    const doc = generateClassicInvoicePDF(data);
    doc.save(`invoice-${data.invoiceNumber}.pdf`);
  };

  return (
    <Box sx={{ maxWidth: '850px', margin: 'auto', p: 3 }}>
      <Paper 
        elevation={2} 
        sx={{ 
          p: 4,
          backgroundColor: '#fff',
          position: 'relative'
        }}
      >
        {/* Download PDF Button */}
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <Button
            variant="contained"
            startIcon={<PdfIcon />}
            onClick={handleDownloadPDF}
            sx={{
              bgcolor: theme.palette.primary.main,
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              },
            }}
          >
            Download PDF
          </Button>
        </Box>

        {/* Header */}
        <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
          INVOICE
        </Typography>

        {/* Company and Invoice Details */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={6}>
            <Typography variant="subtitle2" color="text.secondary">From:</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{data.company.name}</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{data.company.address}</Typography>
            {data.company.gstin && (
              <Typography variant="body2">GSTIN: {data.company.gstin}</Typography>
            )}
            {data.company.phone && (
              <Typography variant="body2">Phone: {data.company.phone}</Typography>
            )}
            {data.company.email && (
              <Typography variant="body2">Email: {data.company.email}</Typography>
            )}
          </Grid>
          <Grid item xs={6} sx={{ textAlign: 'right' }}>
            <Typography variant="subtitle2" color="text.secondary">Invoice Details:</Typography>
            <Typography variant="body2">Invoice No: {data.invoiceNumber}</Typography>
            <Typography variant="body2">Date: {format(data.date, 'dd/MM/yyyy')}</Typography>
            {data.dueDate && (
              <Typography variant="body2">Due Date: {format(data.dueDate, 'dd/MM/yyyy')}</Typography>
            )}
          </Grid>
        </Grid>

        {/* Customer Details */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle2" color="text.secondary">Bill To:</Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{data.customer.name}</Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{data.customer.address}</Typography>
          {data.customer.gstin && (
            <Typography variant="body2">GSTIN: {data.customer.gstin}</Typography>
          )}
        </Box>

        {/* Items Table */}
        <TableContainer sx={{ mt: 4 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: theme.palette.primary.main + '10' }}>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>HSN</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Quantity</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Rate</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.hsn}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{item.rate.toFixed(2)}</TableCell>
                  <TableCell align="right">{item.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Summary */}
        <Box sx={{ mt: 3, ml: 'auto', width: '250px' }}>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="body2">Subtotal:</Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'right' }}>
              <Typography variant="body2">{data.subtotal.toFixed(2)}</Typography>
            </Grid>
            {data.tax && (
              <>
                <Grid item xs={6}>
                  <Typography variant="body2">Tax ({data.tax}%):</Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2">
                    {(data.subtotal * data.tax / 100).toFixed(2)}
                  </Typography>
                </Grid>
              </>
            )}
            {data.discount && (
              <>
                <Grid item xs={6}>
                  <Typography variant="body2">Discount:</Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2">{data.discount.toFixed(2)}</Typography>
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Total:</Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'right' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {data.total.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Payment Details */}
        {data.paymentDetails && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Payment Details:
            </Typography>
            {data.paymentDetails.bankName && (
              <Typography variant="body2">Bank Name: {data.paymentDetails.bankName}</Typography>
            )}
            {data.paymentDetails.accountNumber && (
              <Typography variant="body2">Account Number: {data.paymentDetails.accountNumber}</Typography>
            )}
            {data.paymentDetails.ifscCode && (
              <Typography variant="body2">IFSC Code: {data.paymentDetails.ifscCode}</Typography>
            )}
          </Box>
        )}

        {/* Terms and Notes */}
        {data.terms && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Terms & Conditions:
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{data.terms}</Typography>
          </Box>
        )}

        {data.notes && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Notes:
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{data.notes}</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ClassicInvoiceView;