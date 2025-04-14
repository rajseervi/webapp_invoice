"use client";
import React from 'react';
import DashboardLayout from '@/components/DashboardLayout'; 
import { Container, Typography, Box, Paper } from '@mui/material';
import TabbedInvoiceForm from '../components/TabbedInvoiceForm';
import { useRouter } from 'next/navigation';
import { Receipt as ReceiptIcon } from '@mui/icons-material';

export default function NewInvoicePage() {
  const router = useRouter();
  
  const handleSuccess = () => {
    router.push('/invoices');
  };
  
  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon color="primary" />
          <Typography variant="h5" component="h1">
            Create New Invoice
          </Typography>
        </Box>
        
        <TabbedInvoiceForm onSuccess={handleSuccess} />
      </Container>
   </DashboardLayout>
  );
}