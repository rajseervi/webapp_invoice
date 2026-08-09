"use client";
import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider } from '@mui/material';
import { Invoice } from '@/types/invoice';

import { CompanyInfo } from '@/types/company';

interface GstInvoiceSimpleViewProps {
  invoice: Invoice;
  companyInfo?: CompanyInfo | null;
}

export default function GstInvoiceSimpleView({ invoice, companyInfo }: GstInvoiceSimpleViewProps) {
  const isInterState = invoice.companyStateCode !== invoice.partyStateCode;

  return (
    <Paper sx={{ p: 3, maxWidth: '210mm', margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          TAX INVOICE (Simple)
        </Typography>
        {companyInfo?.logo && (
          <Box sx={{ mb: 1 }}>
            <img 
              src={companyInfo.logo} 
              alt={`${companyInfo.name || 'Company'} Logo`} 
              style={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain' }} 
            />
          </Box>
        )}
        <Typography variant="subtitle1" color="primary">
          {companyInfo?.name || 'Your Company Name'}
        </Typography>
        <Typography variant="body2">
          {companyInfo?.address || 'Company Address'}
        </Typography>
        {companyInfo?.phone && (
          <Typography variant="body2">
            <strong>Phone:</strong> {companyInfo.phone}
          </Typography>
        )}
        {companyInfo?.email && (
          <Typography variant="body2">
            <strong>Email:</strong> {companyInfo.email}
          </Typography>
        )}
        {companyInfo?.gstin && (
          <Typography variant="body2">
            <strong>GSTIN:</strong> {companyInfo.gstin}
          </Typography>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Invoice Details */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2"><strong>Bill To:</strong> {invoice.partyName}</Typography>
        {invoice.partyAddress && <Typography variant="body2">{invoice.partyAddress}</Typography>}
        {invoice.partyGstin && (
          <Typography variant="body2">
            <strong>GSTIN:</strong> {invoice.partyGstin}
          </Typography>
        )}
        <Typography variant="body2">
          <strong>Invoice No:</strong> {invoice.invoiceNumber} &nbsp; | &nbsp; <strong>Date:</strong> {invoice.date}
        </Typography>
        <Typography variant="body2">
          <strong>Place of Supply:</strong> {invoice.placeOfSupply}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          <strong>Supply Type:</strong> {isInterState ? 'Inter-State' : 'Intra-State'}
        </Typography>
      </Box>

      {/* Items Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>S.No</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell align="center"><strong>Qty</strong></TableCell>
              <TableCell align="right"><strong>Rate</strong></TableCell>
              <TableCell align="right"><strong>Total</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoice.items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell align="center">{item.quantity}</TableCell>
                <TableCell align="right">₹{item.price.toFixed(2)}</TableCell>
                <TableCell align="right">₹{(item.finalPrice || 0).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Total Amount */}
      <Box sx={{ textAlign: 'right', mb: 2 }}>
        <Typography variant="body1">
          <strong>Total Amount: ₹{invoice.total.toFixed(2)}</strong>
        </Typography>
      </Box>

      {/* Footer */}
      <Box sx={{ mt: 3, pt: 1, borderTop: '1px solid #ddd' }}>
        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
          <strong>Declaration:</strong> This is a simplified GST invoice view.
        </Typography>
      </Box>
    </Paper>
  );
}
