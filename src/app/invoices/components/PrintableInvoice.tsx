"use client";
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Invoice } from '@/types/invoice';
import InvoicePrintView from './InvoicePrintView';

interface PrintableInvoicesProps {
  invoices: Invoice[];
}

const PrintableInvoices: React.FC<PrintableInvoicesProps> = ({ invoices }) => {
  return (
    <Box>
      {invoices.map((invoice, index) => (
        <Paper 
          key={invoice.id} 
          sx={{ 
            mb: 4, 
            p: 4, 
            pageBreakAfter: index < invoices.length - 1 ? 'always' : 'auto' 
          }}
        >
          <InvoicePrintView invoice={invoice} />
        </Paper>
      ))}
    </Box>
  );
};

export default PrintableInvoices;