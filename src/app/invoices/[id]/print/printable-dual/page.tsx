"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
  Tooltip,
  Fab,
  Zoom,
  Chip,
  Divider
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { Invoice } from '@/types/invoice_no_gst';
import SimpleInvoiceService from '@/services/simpleInvoiceService';
import PrintableInvoiceDual from '@/app/invoices/components/PrintableInvoiceDual';
import DualPrintWidthControls from '@/app/invoices/components/DualPrintWidthControls';
import PrintScaleManager from '@/utils/printScaleUtils';

export default function PrintableInvoiceDualPrintPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [printing, setPrinting] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [printSettings, setPrintSettings] = useState(() => {
    // Read settings from URL parameters
    const leftWidth = parseInt(searchParams.get('leftWidth') || '50');
    const rightWidth = parseInt(searchParams.get('rightWidth') || '50');
    const gapWidth = parseInt(searchParams.get('gapWidth') || '12');
    const equalWidth = searchParams.get('equalWidth') === 'true';
    const colorMode = searchParams.get('colorMode') || 'color';
    const orientation = searchParams.get('orientation') || 'landscape';
    
    return {
      fontSize: 10,
      colorMode,
      paperSize: 'A4',
      orientation,
      leftWidth,
      rightWidth,
      gapWidth,
      equalWidth,
      showWatermark: false
    };
  });
  
  // Auto-print if requested
  const autoprint = searchParams.get('autoprint') === 'true';
  const download = searchParams.get('download') === 'true';

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
        
        // Auto-print disabled to prevent direct print dialog box
        // if (autoprint) {
        //   setTimeout(() => {
        //     handlePrint();
        //   }, 2000); // Wait 2 seconds for content to load
        // }
        
        // Auto-download if requested
        if (download) {
          setTimeout(() => {
            handleDownload();
          }, 2000);
        }
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice details');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id, autoprint, download]);

  // Setup print optimization for landscape dual layout
  useEffect(() => {
    if (invoice) {
      // Add optimized print styles
      PrintScaleManager.addOptimizedPrintStyles();
      
      // Setup auto-scaling for print (landscape specific)
      PrintScaleManager.setupPrintListeners({
        maxHeight: 200, // Landscape A4 height minus margins
        maxWidth: 291, // Landscape A4 width minus margins
        containerSelector: '.printable-dual-container, .dual-layout, .force-fit',
        enableAutoScale: true,
        minScale: 0.4 // More aggressive scaling for dual layout
      });
    }
  }, [invoice]);

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 100);
  };

  const handleDownload = () => {
    // For now, just print - can be enhanced later with PDF generation
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 100);
  };

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const resetZoom = () => {
    setZoom(1);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Loading Invoice...
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
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          variant="contained"
        >
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: fullscreen ? '#f8f9fa' : 'grey.50',
      position: 'relative',
      ...(fullscreen && {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        overflow: 'auto'
      })
    }}>
      {/* Enhanced Header Controls */}
      {!fullscreen && (
        <Box className="no-print" sx={{ 
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          position: 'sticky', 
          top: 0, 
          zIndex: 1000,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <Container maxWidth={false} sx={{ py: 2, px: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Tooltip title="Go back">
                  <IconButton 
                    onClick={() => router.back()}
                    sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                </Tooltip>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    PrintableInvoiceDual
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Invoice: {invoice?.invoiceNumber} • Side by Side Layout • {printSettings.orientation === 'landscape' ? '🖼️ Landscape' : '📄 Portrait'}
                  </Typography>
                </Box>
              </Box>

              <Stack direction="row" spacing={1}>
                <Tooltip title="Width settings">
                  <IconButton 
                    onClick={() => setShowControls(!showControls)}
                    sx={{ 
                      color: 'white',
                      bgcolor: showControls ? 'rgba(255,255,255,0.2)' : 'transparent'
                    }}
                  >
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Print information">
                  <IconButton 
                    onClick={() => setShowInfo(!showInfo)}
                    sx={{ color: 'white' }}
                  >
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Refresh page">
                  <IconButton 
                    onClick={handleRefresh}
                    sx={{ color: 'white' }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Button
                  startIcon={<FullscreenIcon />}
                  onClick={toggleFullscreen}
                  variant="outlined"
                  size="small"
                  sx={{ 
                    color: 'white', 
                    borderColor: 'rgba(255,255,255,0.3)',
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  Fullscreen
                </Button>
                <Button
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                  disabled={printing}
                  variant="outlined"
                  sx={{ 
                    color: 'white', 
                    borderColor: 'rgba(255,255,255,0.3)',
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  {printing ? <CircularProgress size={16} /> : 'Download PDF'}
                </Button>
                <Button
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                  disabled={printing}
                  variant="contained"
                  sx={{ 
                    bgcolor: 'white', 
                    color: 'primary.main',
                    '&:hover': { bgcolor: 'grey.100' }
                  }}
                >
                  {printing ? <CircularProgress size={16} /> : 'Print'}
                </Button>
              </Stack>
            </Box>
          </Container>
        </Box>
      )}

      {/* Print Info Panel */}
      {showInfo && !fullscreen && (
        <Zoom in={showInfo}>
          <Box className="no-print" sx={{ 
            bgcolor: 'primary.main', 
            color: 'white', 
            py: 2,
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Container maxWidth={false} sx={{ px: 3 }}>
              <Stack direction="row" spacing={4} alignItems="center">
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    📄 Print Settings
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Paper: A4 {printSettings.orientation === 'landscape' ? 'Landscape' : 'Portrait'} • Margins: Normal • Scale: 100%
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    🎯 Best Quality
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Use "Print backgrounds" option for optimal results
                    {printSettings.orientation === 'landscape' ? ' • More content fits' : ''}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    ⚡ Quick Print
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Press Ctrl+P (Cmd+P on Mac) for quick print
                  </Typography>
                </Box>
              </Stack>
            </Container>
          </Box>
        </Zoom>
      )}

      {/* Width Controls Panel */}
      {showControls && !fullscreen && (
        <Box className="no-print" sx={{ bgcolor: 'background.paper', borderBottom: '1px solid #e0e0e0' }}>
          <Container maxWidth={false} sx={{ px: 3, py: 2 }}>
            <DualPrintWidthControls
              initialSettings={printSettings}
              onSettingsChange={setPrintSettings}
              onPreview={() => setShowControls(false)}
              onPrint={handlePrint}
            />
          </Container>
        </Box>
      )}

      {/* Fullscreen Controls */}
      {fullscreen && (
        <Box className="no-print" sx={{ 
          position: 'fixed', 
          top: 20, 
          right: 20, 
          zIndex: 10000,
          display: 'flex',
          gap: 1,
          bgcolor: 'rgba(0,0,0,0.8)',
          borderRadius: '12px',
          p: 1,
          backdropFilter: 'blur(10px)'
        }}>
          <Tooltip title="Zoom out">
            <IconButton 
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              sx={{ color: 'white' }}
            >
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          <Chip 
            label={`${Math.round(zoom * 100)}%`}
            size="small"
            onClick={resetZoom}
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
            }}
          />
          <Tooltip title="Zoom in">
            <IconButton 
              onClick={handleZoomIn}
              disabled={zoom >= 2}
              sx={{ color: 'white' }}
            >
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.2)', mx: 1 }} />
          <Tooltip title="Print">
            <IconButton
              onClick={handlePrint}
              disabled={printing}
              sx={{ color: 'white' }}
            >
              {printing ? <CircularProgress size={20} /> : <PrintIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Exit fullscreen">
            <IconButton
              onClick={toggleFullscreen}
              sx={{ color: 'white' }}
            >
              <FullscreenExitIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* PrintableInvoiceDual Layout */}
      <Box sx={{ 
        width: '100vw',
        minHeight: fullscreen ? '100vh' : 'auto',
        display: 'flex',
        alignItems: fullscreen ? 'center' : 'flex-start',
        justifyContent: 'center',
        py: fullscreen ? 0 : 4,
        px: 2
      }}>
        <Box
          sx={{
            transform: fullscreen ? `scale(${zoom})` : 'scale(1)',
            transformOrigin: 'center',
            transition: 'transform 0.3s ease',
            width: '100%',
            maxWidth: fullscreen ? 'none' : '1200px'
          }}
        >
          <Paper 
            elevation={fullscreen ? 0 : 8} 
            className="printable-dual-container"
            sx={{ 
              overflow: 'hidden',
              borderRadius: fullscreen ? '0' : '12px',
              background: 'white',
              width: '100%'
            }}
          >
            <PrintableInvoiceDual 
              invoice={invoice}
              settings={printSettings}
              previewMode={!fullscreen}
            />
          </Paper>
        </Box>
      </Box>

      {/* Floating Action Buttons */}
      {!fullscreen && (
        <Box className="no-print" sx={{ 
          position: 'fixed', 
          bottom: 24, 
          right: 24, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2,
          zIndex: 1000
        }}>
          <Zoom in={!printing}>
            <Tooltip title="Quick Print" placement="left">
              <Fab 
                color="primary" 
                onClick={handlePrint}
                sx={{ 
                  boxShadow: '0 8px 32px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    boxShadow: '0 12px 40px rgba(25, 118, 210, 0.4)'
                  }
                }}
              >
                <PrintIcon />
              </Fab>
            </Tooltip>
          </Zoom>
          <Zoom in={printing}>
            <Fab 
              color="primary" 
              disabled
              sx={{ 
                bgcolor: 'grey.300',
                '&.Mui-disabled': {
                  bgcolor: 'grey.300'
                }
              }}
            >
              <CircularProgress size={24} />
            </Fab>
          </Zoom>
        </Box>
      )}

      {/* Enhanced Print Styles - Full Width Landscape Optimization */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 5mm 3mm 5mm 3mm;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            print-color-adjust: exact;
          }

          .no-print, .no-print * {
            display: none !important;
            visibility: hidden !important;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 297mm !important;
            height: 210mm !important;
            font-size: 8px !important;
            line-height: 1.1 !important;
            background: white !important;
            overflow: hidden !important;
          }
          
          .MuiContainer-root {
            max-width: none !important;
            width: 291mm !important; /* A4 landscape width minus margins */
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .MuiPaper-root {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 200mm !important; /* A4 landscape height minus margins */
            border-radius: 0 !important;
            background: white !important;
          }
          
          .printable-dual-container {
            width: 100% !important;
            height: 100% !important;
            border-radius: 0 !important;
            transform: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Optimize dual layout for landscape */
          .printable-dual-container .dual-layout {
            display: flex !important;
            width: 100% !important;
            height: 100% !important;
            gap: 0 !important;
          }

          .printable-dual-container .dual-layout > * {
            width: 50% !important;
            height: 100% !important;
            padding: 0 1mm !important;
            margin: 0 !important;
            font-size: 7px !important;
            line-height: 1.05 !important;
          }

          /* Compact table styling for landscape dual */
          table {
            font-size: 6px !important;
            line-height: 1 !important;
            border-collapse: collapse !important;
            width: 100% !important;
          }

          th, td {
            padding: 1px 2px !important;
            font-size: 6px !important;
            line-height: 1 !important;
            border: 0.5px solid #000 !important;
          }

          /* Typography adjustments */
          h1, h2, h3, h4, h5, h6 {
            margin: 0 0 1px 0 !important;
            line-height: 1 !important;
          }

          h1 { font-size: 10px !important; }
          h2 { font-size: 9px !important; }
          h3 { font-size: 8px !important; }
          h4 { font-size: 7px !important; }
          h5 { font-size: 6px !important; }
          h6 { font-size: 6px !important; }

          p, div {
            margin: 0 !important;
            line-height: 1.05 !important;
            font-size: 7px !important;
          }

          /* Force single page fitting */
          .force-fit {
            max-height: 200mm !important;
            overflow: hidden !important;
            transform: scale(var(--scale-factor, 1)) !important;
            transform-origin: top left !important;
          }
        }
        
        /* Smooth transitions */
        .printable-dual-container {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Better scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </Box>
  );
}