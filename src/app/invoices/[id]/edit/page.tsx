"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import TabbedInvoiceForm from '@/app/invoices/components/TabbedInvoiceForm';
import MobileInvoiceForm from '@/app/invoices/components/MobileInvoiceForm';
import { Container, Typography, Box, Button, Paper, Skeleton, Alert, CircularProgress, Fab, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon, Receipt as ReceiptIcon, MenuOpen as MenuOpenIcon, Menu as MenuIcon, Fullscreen as FullscreenIcon, FullscreenExit as FullscreenExitIcon } from '@mui/icons-material';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { executeWithRetry, getFirestoreErrorMessage } from '@/utils/firestoreHelpers';

export default function EditInvoicePage() {
  const router = useRouter();
  const { id } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDesktopMd = useMediaQuery(theme.breakpoints.up('md'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [isGstInvoice, setIsGstInvoice] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
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
          
          // Check if this is a GST invoice
          const isGst = invoiceData.isGstInvoice === true ||
                       (invoiceData.isGstInvoice === undefined && (
                         invoiceData.totalCgst !== undefined ||
                         invoiceData.totalSgst !== undefined ||
                         invoiceData.totalIgst !== undefined ||
                         invoiceData.companyGstin !== undefined ||
                         invoiceData.totalTaxableAmount !== undefined ||
                         invoiceData.totalTaxAmount !== undefined ||
                         invoiceData.placeOfSupply !== undefined
                       ));          
          setIsGstInvoice(isGst);
          
          // If it's a GST invoice, redirect to the GST edit page
          if (isGst) {
            router.replace(`/invoices/gst/${id}/edit`);
            return;
          }
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
  }, [id, router]);

  const handleSuccess = () => {
    router.push('/invoices');
  };

  // Toggle sidebar visibility
  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    const url = new URL(window.location.href);
    if (!sidebarCollapsed) {
      url.searchParams.set('sidebar', 'collapsed');
    } else {
      url.searchParams.delete('sidebar');
    }
    window.history.replaceState({}, '', url.toString());
  };

  // Toggle fullscreen mode
  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Initialize sidebar state from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setSidebarCollapsed(urlParams.get('sidebar') === 'collapsed');
  }, []);

  // Don't render the form if we're redirecting to GST edit
  if (isGstInvoice) {
    return (
      <ModernThemeProvider>
        <VisuallyEnhancedDashboardLayout>
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  Redirecting to GST invoice editor...
                </Typography>
              </Box>
            </Box>
          </Container>
        </VisuallyEnhancedDashboardLayout>
      </ModernThemeProvider>
    );
  }

  // Mobile: use MobileInvoiceForm wrapped in layout for sidebar access
  if (isMobile) {
    return (
      <ModernThemeProvider>
        <VisuallyEnhancedDashboardLayout
          title="Edit Invoice"
          pageType="invoices"
          enableVisualEffects={false}
          enableParticles={false}
        >
          <MobileInvoiceForm onSuccess={handleSuccess} invoiceId={id as string} />
        </VisuallyEnhancedDashboardLayout>
      </ModernThemeProvider>
    );
  }

  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout>
        <Container
          maxWidth={isFullscreen ? false : "lg"}
          sx={{
            mt: 4,
            mb: 4,
            mx: { xs: 1, sm: 2, md: 3 },
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 2, sm: 3, md: 4 },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            ...(isFullscreen && {
              maxWidth: '100%',
              px: 2,
            })
          }}
        >
          {/* Enhanced Header with Toggle Controls */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: 2, 
            mb: 3,
            flexWrap: 'wrap'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
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
                  Edit Regular Invoice
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
            
            {/* View Enhancement Controls */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={sidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={sidebarCollapsed ? <MenuIcon /> : <MenuOpenIcon />}
                  onClick={handleSidebarToggle}
                  sx={{
                    minWidth: 'auto',
                    borderRadius: 2,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {sidebarCollapsed ? 'Show' : 'Hide'} Menu
                </Button>
              </Tooltip>
              
              <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}>
                <Button
                  variant={isFullscreen ? "contained" : "outlined"}
                  size="small"
                  startIcon={isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                  onClick={handleFullscreenToggle}
                  sx={{
                    minWidth: 'auto',
                    borderRadius: 2,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isFullscreen ? 'Exit' : 'Focus'}
                </Button>
              </Tooltip>
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

        {/* Floating Action Buttons for Quick Access */}
        {!loading && (
          <Box sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            zIndex: 1000
          }}>
            {!isDesktopMd && (
              <Tooltip title={sidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"} placement="left">
                <Fab
                  size="small"
                  color="primary"
                  onClick={handleSidebarToggle}
                  sx={{
                    backgroundColor: sidebarCollapsed ? 'success.main' : 'primary.main',
                    '&:hover': {
                      backgroundColor: sidebarCollapsed ? 'success.dark' : 'primary.dark',
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: sidebarCollapsed ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {sidebarCollapsed ? <MenuIcon /> : <MenuOpenIcon />}
                </Fab>
              </Tooltip>
            )}
            
            <Tooltip title={isFullscreen ? "Exit Focus Mode" : "Focus Mode"} placement="left">
              <Fab
                size="small"
                color={isFullscreen ? "secondary" : "default"}
                onClick={handleFullscreenToggle}
                sx={{
                  backgroundColor: isFullscreen ? 'secondary.main' : 'grey.100',
                  color: isFullscreen ? 'white' : 'text.primary',
                  '&:hover': {
                    backgroundColor: isFullscreen ? 'secondary.dark' : 'grey.200',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isFullscreen ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </Fab>
            </Tooltip>
          </Box>
        )}
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}
