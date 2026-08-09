import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import TabbedInvoiceForm from '../components/TabbedInvoiceForm';
import { useRouter } from 'next/navigation';
import { Receipt as ReceiptIcon } from '@mui/icons-material';

export default function OriginalPageComponent() {
  const router = useRouter();
  
  const handleSuccess = (invoiceId?: string) => {
    if (invoiceId) {
      // Open the created invoice
      router.push(`/invoices/${invoiceId}`);
    } else {
      // Fallback to invoices list
      router.push('/invoices');
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ReceiptIcon color="primary" />
        <Typography variant="h5" component="h1">
          Create New Invoice
        </Typography>
      </Box>
      
      <TabbedInvoiceForm onSuccess={handleSuccess} />
    </Container>
  );
}