"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  Alert,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Divider
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  ViewDay as ViewDayIcon,
  ViewWeek as ViewWeekIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { executeWithRetry, getFirestoreErrorMessage } from '@/utils/firestoreHelpers';
import PrintableInvoice from '../../components/PrintableInvoice';
import PrintableInvoiceDual from '../../components/PrintableInvoiceDual';
import { Invoice } from '@/types/invoice';

// Custom styles for print page
const printStyles = `
  @media print {
    body {
      margin: 0;
      padding: 0;
      background: #fff;
    }
    .no-print {
      display: none !important;
    }
  }
`;

export default function InvoicePrintPage() {
  const { id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printMode, setPrintMode] = useState<'single' | 'dual'>('single');
  
  useEffect(() => {
    const fetchInvoice = async () => {
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
          setInvoice({
            id: invoiceSnap.id,
            ...invoiceData
          } as Invoice);
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
    
    if (id) {
      fetchInvoice();
    }
  }, [id]);
  
  // Auto-print when the invoice is loaded
  useEffect(() => {
    if (invoice && !loading && !error) {
      // Short delay to ensure the content is fully rendered
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [invoice, loading, error]);

  const handleBack = () => {
    router.back();
  };
  
  const handlePrintNow = () => {
    window.print();
  };

  const handlePrintModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: 'single' | 'dual' | null,
  ) => {
    if (newMode !== null) {
      setPrintMode(newMode);
    }
  };

  return (
    <>
      <style jsx global>{printStyles}</style>
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box className="no-print" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<ArrowBackIcon />} 
              onClick={handleBack}
            >
              Back to Invoice
            </Button>
            <Typography variant="h5">Print Invoice</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handlePrintNow}
              startIcon={<PrintIcon />}
            >
              Print Now
            </Button>
          </Box>
          
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Select Print Format</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <ToggleButtonGroup
                value={printMode}
                exclusive
                onChange={handlePrintModeChange}
                aria-label="print mode"
                size="small"
              >
                <ToggleButton value="single" aria-label="single copy">
                  <ViewDayIcon sx={{ mr: 1 }} />
                  Single Copy (Portrait)
                </ToggleButton>
                <ToggleButton value="dual" aria-label="dual copy">
                  <ViewWeekIcon sx={{ mr: 1 }} />
                  Original + Duplicate (Landscape)
                </ToggleButton>
              </ToggleButtonGroup>
              
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                {printMode === 'single' 
                  ? 'Standard portrait format with one invoice per page' 
                  : 'Landscape format with original and duplicate copies on a single page'}
              </Typography>
            </Box>
          </Paper>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : invoice ? (
          <>
            {printMode === 'single' ? (
              <PrintableInvoice invoice={invoice} />
            ) : (
              <PrintableInvoiceDual invoice={invoice} />
            )}
          </>
        ) : (
          <Alert severity="warning">Invoice not found</Alert>
        )}
      </Container>
    </>
  );
}