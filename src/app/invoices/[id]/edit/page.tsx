"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import TabbedInvoiceForm from '@/app/invoices/components/TabbedInvoiceForm';
import { Container, Typography, Box, Button, Paper, Skeleton, Alert, CircularProgress } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon, Receipt as ReceiptIcon } from '@mui/icons-material';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { executeWithRetry, getFirestoreErrorMessage } from '@/utils/firestoreHelpers';

export default function EditInvoicePage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  
  useEffect(() => {
    const fetchInvoiceBasicInfo = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Use the executeWithRetry utility to handle connectivity issues
        await executeWithRetry(async () => {
          const invoiceRef = doc(db, 'invoices', id as string);
          const invoiceSnap = await getDoc(invoiceRef);
          
          if (!invoiceSnap.exists()) {
            setError('Invoice not found');
            return;
          }
          
          const invoiceData = invoiceSnap.data();
          setInvoiceNumber(invoiceData.invoiceNumber || '');
        }, 3, (attempt, maxRetries) => {
          setError(`Connection error while loading invoice. Retrying... (Attempt ${attempt}/${maxRetries})`);
        });
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError(getFirestoreErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvoiceBasicInfo();
  }, [id]);

  const handleSuccess = () => {
    router.push('/invoices');
  };

  return (
   <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Button
            component={Link}
            href="/invoices"
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            size="small"
          >
            Back to Invoices
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon color="primary" />
            <Typography variant="h5" component="h1">
              Edit Invoice
              {!loading && invoiceNumber && (
                <Typography 
                  component="span" 
                  variant="subtitle1" 
                  color="text.secondary" 
                  sx={{ ml: 2, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                >
                  <ReceiptIcon fontSize="small" />
                  {invoiceNumber}
                </Typography>
              )}
            </Typography>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Skeleton variant="rectangular" height={40} width="100%" />
            </Box>
            <Box sx={{ mb: 4 }}>
              <Skeleton variant="rectangular" height={200} width="100%" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          </Paper>
        ) : (
          <TabbedInvoiceForm onSuccess={handleSuccess} invoiceId={id as string} />
        )}
      </Container>
   </DashboardLayout>
  );
}