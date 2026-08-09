"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { 
  Container, 
  Typography, 
  Box, 
  CircularProgress, 
  Alert,
  Button,
  Paper,
  IconButton,
  Stack,
  Tooltip
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon,
  Remove as RemoveIcon,
  Add as AddIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import ClassicInvoiceTemplate from '@/components/invoices/templates/ClassicInvoiceTemplate';
import { Invoice } from '@/types/invoice_no_gst';
import SimpleInvoiceService from '@/services/simpleInvoiceService';

export default function EnhancedPrintInvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const autoprint = searchParams.get('autoprint') === 'true';
  const defaultCopies = Math.max(1, Math.min(10, parseInt(searchParams.get('copies') || '1')));
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copies, setCopies] = useState(defaultCopies);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        if (!id) {
          setError('Invoice ID is missing');
          return;
        }

        const invoiceData = await SimpleInvoiceService.getInvoiceById(id as string);
        
        if (!invoiceData) {
          setError('Invoice not found');
          return;
        }

        setInvoice(invoiceData);
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice details');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  // Auto-print when autoprint=true query param is present
  useEffect(() => {
    if (autoprint && !loading && invoice) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [autoprint, loading, invoice]);

  const handlePrint = () => {
    setIsPrinting(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
        const resetTimer = setTimeout(() => setIsPrinting(false), 1000);
        window.addEventListener('afterprint', () => {
          clearTimeout(resetTimer);
          setIsPrinting(false);
        }, { once: true });
      });
    });
  };

  const handleDownload = () => {
    alert('PDF download functionality will be implemented. Use the Print button to access browser print dialog.');
  };

  const handleBackNavigation = () => {
    const invoiceId = id as string;
    if (invoiceId) {
      router.push(`/invoices/${invoiceId}`);
    } else {
      router.back();
    }
  };

  const handleCopiesChange = (delta: number) => {
    setCopies(prev => Math.max(1, Math.min(10, prev + delta)));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleBackNavigation();
      } else if (event.ctrlKey && event.key === 'p') {
        event.preventDefault();
        handlePrint();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [id, router]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Loading Invoice Preview...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  if (error || !invoice) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Invoice not found'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBackNavigation} variant="contained">
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Box className="no-print" sx={{ 
        bgcolor: 'white',
        borderBottom: '1px solid #e0e0e0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <Container maxWidth="lg" sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tooltip title="Back to Invoice Details (Esc)">
                <IconButton 
                  onClick={handleBackNavigation}
                  sx={{ 
                    bgcolor: 'grey.100',
                    '&:hover': { bgcolor: 'primary.main', color: 'white' }
                  }}
                  size="large"
                >
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Print Preview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Invoice #{invoice.invoiceNumber} • Esc to go back • Ctrl+P to print
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontWeight="medium" color="text.secondary">
                  Copies:
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => handleCopiesChange(-1)}
                  disabled={copies <= 1}
                  sx={{ border: '1px solid', borderColor: 'divider' }}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    minWidth: 32, 
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}
                >
                  {copies}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => handleCopiesChange(1)}
                  disabled={copies >= 10}
                  sx={{ border: '1px solid', borderColor: 'divider' }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>

              <Button
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                variant="outlined"
                size="large"
                disabled={isPrinting}
              >
                PDF
              </Button>
              <Button
                startIcon={isPrinting ? <CircularProgress size={20} color="inherit" /> : <PrintIcon />}
                onClick={handlePrint}
                variant="contained"
                size="large"
                color="primary"
                disabled={isPrinting}
              >
                {isPrinting ? 'Printing...' : 'Print'}
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      <Container 
        maxWidth={false} 
        sx={{ 
          py: 3,
          px: 2,
          minHeight: 'calc(100vh - 80px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'transparent',
          '@media print': {
            py: 0,
            px: 0,
            minHeight: 'auto',
            height: 'auto',
            display: 'block',
            alignItems: 'flex-start',
            justifyContent: 'flex-start'
          }
        }}
      >
        <Paper 
          elevation={0}
          sx={{ 
            width: '8.5in',
            bgcolor: 'white',
            border: 'none',
            '@media print': {
              width: '100%',
              boxShadow: 'none',
              elevation: 0,
              bgcolor: 'transparent'
            }
          }}
        >
          {Array.from({ length: copies }).map((_, idx) => {
            const isLast = idx === copies - 1;
            return (
              <Box 
                key={idx}
                className="invoice-copy"
                sx={{ 
                  mb: !isLast ? 3 : 0,
                  border: '1px solid #000',
                  '@media print': {
                    mb: 0,
                    pageBreakAfter: isLast ? 'auto' : 'always',
                    border: 'none',
                    pageBreakInside: 'avoid'
                  }
                }}
              >
                <ClassicInvoiceTemplate 
                  invoice={invoice}
                  settings={{
                    paperSize: 'A4',
                    orientation: 'portrait',
                    colorMode: 'color',
                    marginType: 'normal',
                    fontSize: 'normal',
                    compactMode: false,
                    singlePageOptimization: true,
                    autoScale: true,
                    printQuality: 'high'
                  }}
                  previewMode={true}
                  copyLabel={copies === 1 ? 'Original for Recipient' : (
                    ['Original for Recipient', 'Duplicate for Supplier', 'Triplicate for Transporter'][idx] ?? `Copy ${idx + 1}`
                  )}
                />
              </Box>
            );
          })}
        </Paper>
      </Container>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          
          .no-print {
            display: none !important;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          .invoice-copy {
            margin-bottom: 0 !important;
            opacity: 1 !important;
            visibility: visible !important;
            display: block !important;
          }
          
          .MuiFade-root,
          [class*="MuiFade"],
          [style*="opacity"] {
            opacity: 1 !important;
            visibility: visible !important;
            animation: none !important;
            transition: none !important;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </Box>
  );
}
