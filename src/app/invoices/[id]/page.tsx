"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Grid, 
  Divider, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Skeleton
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon, 
  Edit as EditIcon, 
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  ShoppingCart as ShoppingCartIcon,
  Summarize as SummarizeIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { executeWithRetry, getFirestoreErrorMessage } from '@/utils/firestoreHelpers';
import DashboardLayout from '@/components/DashboardLayout';
import InvoicePDF from '../components/InvoicePDF';
import InvoiceTemplateSelector from '../components/InvoiceTemplateSelector';
import Link from 'next/link';
import { Invoice } from '@/types/invoice';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          setError('Invoice ID is missing');
          return;
        }
        
        // Use the executeWithRetry utility to handle connectivity issues
        await executeWithRetry(async () => {
          const invoiceRef = doc(db, 'invoices', id as string);
          const invoiceSnap = await getDoc(invoiceRef);
          
          if (!invoiceSnap.exists()) {
            setError('Invoice not found');
            return;
          }
          
          const invoiceData = {
            id: invoiceSnap.id,
            ...invoiceSnap.data()
          };
          
          setInvoice(invoiceData);
          setError(null);
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
    
    fetchInvoice();
  }, [id]);
  
  // Common header component
  const PageHeader = () => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
          <ReceiptIcon color="primary" />
          <Typography variant="h5" component="h1">
            Invoice Details
            {!loading && invoice && (
              <Typography 
                component="span" 
                variant="subtitle1" 
                color="text.secondary" 
                sx={{ ml: 2, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
              >
                {invoice.invoiceNumber}
              </Typography>
            )}
          </Typography>
        </Box>
      </Box>
      
      {!loading && invoice && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            component={Link}
            href={`/invoices/${id}/edit`}
            startIcon={<EditIcon />}
            variant="outlined"
            size="small"
          >
            Edit
          </Button>
          
          <InvoicePDF invoice={invoice} />
        </Box>
      )}
    </Box>
  );
  
  if (loading) {
    return (
     <DashboardLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <PageHeader />
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
        </Container>
     </DashboardLayout>
    );
  }
  
  if (error || !invoice) {
    return (
     <DashboardLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <PageHeader />
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Failed to load invoice'}
          </Alert>
          <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              Unable to load invoice details
            </Typography>
            <Button 
              component={Link} 
              href="/invoices" 
              startIcon={<ArrowBackIcon />}
              variant="contained"
            >
              Return to Invoices
            </Button>
          </Paper>
        </Container>
     </DashboardLayout>
    );
  }
  
  return (
   <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <PageHeader />
        
        <InvoiceTemplateSelector invoice={invoice} />
      </Container>
   </DashboardLayout>
  );
}