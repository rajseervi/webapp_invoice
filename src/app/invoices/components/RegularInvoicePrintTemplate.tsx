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
  Paper,
  Grid,
  Divider
} from '@mui/material';
import { Invoice } from '@/types/invoice';

interface RegularInvoicePrintTemplateProps {
  invoice: Invoice;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export default function RegularInvoicePrintTemplate({ 
  invoice, 
  companyInfo 
}: RegularInvoicePrintTemplateProps) {
  
  // Convert amount to words (simplified version)
  const numberToWords = (amount: number): string => {
    if (amount === 0) return 'Zero Rupees Only';
    
    const rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);
    
    let result = `Rupees ${rupees.toLocaleString('en-IN')} `;
    
    if (paise > 0) {
      result += `and ${paise} Paise `;
    }
    
    result += 'Only';
    return result;
  };

  const printStyles = `
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
      .print-page { 
        page-break-after: always; 
        margin: 0;
        padding: 20px;
      }
      table { page-break-inside: avoid; }
      .invoice-header { 
        border: 2px solid #000;
        margin-bottom: 10px;
      }
      .invoice-section {
        border: 1px solid #000;
        margin-bottom: 5px;
      }
    }
  `;

  return (
    <>
      <style>{printStyles}</style>
      <Box className="print-page" sx={{ maxWidth: '210mm', margin: '0 auto', p: 2, bgcolor: 'white' }}>
        {/* Header */}
        <Box className="invoice-header" sx={{ border: '2px solid #000', p: 2, mb: 2 }}>
          <Typography variant="h4" align="center" sx={{ fontWeight: 'bold', mb: 1 }}>
            INVOICE
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box sx={{ border: '1px solid #000', p: 1, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {companyInfo?.name || 'Company Name'}
                </Typography>
                <Typography variant="body2">
                  {companyInfo?.address || 'Company Address'}
                </Typography>
                <Typography variant="body2">
                  Phone: {companyInfo?.phone || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  Email: {companyInfo?.email || 'N/A'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ border: '1px solid #000', p: 1, height: '100%' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Invoice No: {invoice.invoiceNumber}
                </Typography>
                <Typography variant="body2">
                  Date: {invoice.date}
                </Typography>
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Created: {new Date().toLocaleDateString()}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Bill To Section */}
        <Box className="invoice-section" sx={{ border: '1px solid #000', p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            Bill To:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {invoice.partyName}
              </Typography>
              {invoice.partyAddress && (
                <Typography variant="body2">
                  {invoice.partyAddress}
                </Typography>
              )}
              {invoice.partyPhone && (
                <Typography variant="body2">
                  Phone: {invoice.partyPhone}
                </Typography>
              )}
              {invoice.partyEmail && (
                <Typography variant="body2">
                  Email: {invoice.partyEmail}
                </Typography>
              )}
            </Grid>
          </Grid>
        </Box>

        {/* Items Table */}
        <TableContainer component={Paper} sx={{ border: '1px solid #000', mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold' }}>S.No</TableCell>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold' }} align="center">Qty</TableCell>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold' }} align="right">Rate</TableCell>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold' }} align="right">Discount</TableCell>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold' }} align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.items?.map((item, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ border: '1px solid #000' }}>{index + 1}</TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>{item.name}</TableCell>
                  <TableCell sx={{ border: '1px solid #000' }} align="center">{item.quantity}</TableCell>
                  <TableCell sx={{ border: '1px solid #000' }} align="right">₹{item.price.toFixed(2)}</TableCell>
                  <TableCell sx={{ border: '1px solid #000' }} align="right">
                    {item.discount > 0 ? `${item.discount}%` : '-'}
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #000' }} align="right">₹{item.finalPrice.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              
              {/* Spacer rows for better formatting */}
              {Array.from({ length: Math.max(0, 5 - (invoice.items?.length || 0)) }).map((_, index) => (
                <TableRow key={`spacer-${index}`}>
                  <TableCell sx={{ border: '1px solid #000', height: '30px' }}>&nbsp;</TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>&nbsp;</TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>&nbsp;</TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>&nbsp;</TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>&nbsp;</TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>&nbsp;</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Invoice Summary */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box sx={{ border: '1px solid #000', p: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Payment Information
              </Typography>
              <Typography variant="body2">
                Payment Terms: Net 30 Days
              </Typography>
              <Typography variant="body2">
                Payment Method: Cash/Cheque/Bank Transfer
              </Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                Bank Details:
              </Typography>
              <Typography variant="body2">
                Account Name: [Company Name]
              </Typography>
              <Typography variant="body2">
                Account No: [Account Number]
              </Typography>
              <Typography variant="body2">
                IFSC Code: [IFSC Code]
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ border: '1px solid #000', p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Invoice Summary
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ border: 'none', fontWeight: 'bold' }}>Subtotal:</TableCell>
                    <TableCell sx={{ border: 'none' }} align="right">₹{(invoice.subtotal || 0).toFixed(2)}</TableCell>
                  </TableRow>
                  {invoice.discount > 0 && (
                    <TableRow>
                      <TableCell sx={{ border: 'none', fontWeight: 'bold' }}>Discount:</TableCell>
                      <TableCell sx={{ border: 'none' }} align="right">-₹{invoice.discount.toFixed(2)}</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell sx={{ border: 'none', fontWeight: 'bold', fontSize: '1.1em' }}>Total:</TableCell>
                    <TableCell sx={{ border: 'none', fontWeight: 'bold', fontSize: '1.1em' }} align="right">
                      ₹{invoice.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Grid>
        </Grid>

        {/* Amount in Words */}
        <Box sx={{ border: '1px solid #000', p: 2, mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Amount in Words: {numberToWords(invoice.total)}
          </Typography>
        </Box>

        {/* Terms and Conditions */}
        <Box sx={{ border: '1px solid #000', p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            Terms & Conditions:
          </Typography>
          <Typography variant="body2">
            1. Payment is due within 30 days of invoice date.
          </Typography>
          <Typography variant="body2">
            2. Interest @ 18% per annum will be charged on overdue amounts.
          </Typography>
          <Typography variant="body2">
            3. All disputes are subject to local jurisdiction only.
          </Typography>
          <Typography variant="body2">
            4. Goods once sold will not be taken back or exchanged.
          </Typography>
          <Typography variant="body2">
            5. This is a computer-generated invoice and does not require a signature.
          </Typography>
        </Box>

        {/* Signature Section */}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ border: '1px solid #000', p: 2, height: '80px' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Customer Signature
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ border: '1px solid #000', p: 2, height: '80px', textAlign: 'right' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Authorized Signatory
              </Typography>
              <Typography variant="body2" sx={{ mt: 3 }}>
                {companyInfo?.name || 'Company Name'}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Thank you for your business!
          </Typography>
          <Typography variant="caption">
            Invoice generated on {new Date().toLocaleString()}
          </Typography>
        </Box>
      </Box>
    </>
  );
}