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
  Chip,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Fade,
  Slide
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
  ViewModule as ViewModuleIcon,
  FlipToBack as FlipToBackIcon,
  Pages as PagesIcon,
  AutoAwesome as AutoAwesomeIcon,
  Print as PrintPreviewIcon
} from '@mui/icons-material';
import { Invoice } from '@/types/invoice_no_gst';
import SimpleInvoiceService from '@/services/simpleInvoiceService';
import ClassicInvoiceTemplate from '@/components/invoices/templates/ClassicInvoiceTemplate';

export default function DualClassicPrintPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [printing, setPrinting] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [printMode, setPrintMode] = useState<'side-by-side' | 'duplex'>(() => {
    return (searchParams.get('mode') as 'side-by-side' | 'duplex') || 'side-by-side';
  });
  
  // Auto-print if requested
  const autoprint = searchParams.get('autoprint') === 'true';

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
        //   }, 2000);
        // }
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice details');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id, autoprint]);

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 100);
  };

  const handleDownload = () => {
    handlePrint(); // For now, just print - can be enhanced later with PDF generation
  };

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(Math.max(50, Math.min(200, newZoom)));
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
      bgcolor: fullscreen ? '#fafafa' : 'grey.50',
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
        <Slide direction="down" in={!fullscreen} mountOnEnter unmountOnExit>
          <Box className="no-print" sx={{ 
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            color: 'white',
            position: 'sticky', 
            top: 0, 
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
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
                    <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AutoAwesomeIcon />
                      Dual Classic Print
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Invoice: {invoice?.invoiceNumber} • {printMode === 'duplex' ? 'Both Sides (Duplex)' : 'Side by Side'} • {printMode === 'duplex' ? '🔄 Double-sided' : '📄 Single-sided'}
                    </Typography>
                  </Box>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center">
                  {/* Print Mode Toggle */}
                  <ToggleButtonGroup
                    value={printMode}
                    exclusive
                    onChange={(_, newMode) => {
                      if (newMode !== null) {
                        setPrintMode(newMode);
                      }
                    }}
                    size="small"
                    sx={{
                      '& .MuiToggleButton-root': {
                        color: 'white',
                        borderColor: 'rgba(255,255,255,0.3)',
                        '&.Mui-selected': {
                          bgcolor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.3)',
                          }
                        },
                        '&:hover': {
                          borderColor: 'rgba(255,255,255,0.5)',
                          bgcolor: 'rgba(255,255,255,0.1)'
                        }
                      }
                    }}
                  >
                    <ToggleButton value="side-by-side">
                      <ViewModuleIcon sx={{ mr: 0.5, fontSize: 16 }} />
                      Side by Side
                    </ToggleButton>
                    <ToggleButton value="duplex">
                      <FlipToBackIcon sx={{ mr: 0.5, fontSize: 16 }} />
                      Both Sides
                    </ToggleButton>
                  </ToggleButtonGroup>

                  <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.3)', mx: 1 }} />

                  {/* Zoom Controls */}
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Tooltip title="Zoom out">
                      <IconButton 
                        onClick={() => handleZoomChange(zoom - 25)}
                        disabled={zoom <= 50}
                        sx={{ color: 'white', p: 0.5 }}
                      >
                        <ZoomOutIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Typography variant="body2" sx={{ minWidth: '45px', textAlign: 'center' }}>
                      {zoom}%
                    </Typography>
                    <Tooltip title="Zoom in">
                      <IconButton 
                        onClick={() => handleZoomChange(zoom + 25)}
                        disabled={zoom >= 200}
                        sx={{ color: 'white', p: 0.5 }}
                      >
                        <ZoomInIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>

                  <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.3)', mx: 1 }} />

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
                    {printing ? <CircularProgress size={16} /> : 'PDF'}
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
        </Slide>
      )}

      {/* Fullscreen Header */}
      {fullscreen && (
        <Fade in={fullscreen}>
          <Box className="no-print" sx={{ 
            position: 'fixed', 
            top: 20, 
            right: 20, 
            zIndex: 1001,
            display: 'flex',
            gap: 1
          }}>
            <Tooltip title="Exit fullscreen">
              <IconButton 
                onClick={toggleFullscreen}
                sx={{ 
                  bgcolor: 'rgba(0,0,0,0.7)', 
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                }}
              >
                <FullscreenExitIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print">
              <IconButton 
                onClick={handlePrint}
                disabled={printing}
                sx={{ 
                  bgcolor: 'rgba(25,118,210,0.9)', 
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(25,118,210,1)' }
                }}
              >
                {printing ? <CircularProgress size={20} color="inherit" /> : <PrintIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Fade>
      )}

      {/* Print Info Panel */}
      {showInfo && !fullscreen && (
        <Fade in={showInfo}>
          <Box className="no-print" sx={{ 
            bgcolor: 'info.main', 
            color: 'white', 
            py: 2,
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Container maxWidth={false} sx={{ px: 3 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    📄 Print Settings
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Paper: A4 {printMode === 'duplex' ? 'Portrait (Both Sides)' : 'Landscape (Side by Side)'} • Margins: Auto • Scale: {zoom}%
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    🎯 Best Quality
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Enable "Print backgrounds" and "More settings" for optimal results
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {printMode === 'duplex' ? '🔄 Duplex Printing' : '⚡ Quick Print'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {printMode === 'duplex' 
                      ? 'Enable duplex/double-sided printing in printer settings'
                      : 'Press Ctrl+P (Cmd+P on Mac) for quick print'
                    }
                  </Typography>
                </Box>
              </Stack>
            </Container>
          </Box>
        </Fade>
      )}

      {/* Main Content Container */}
      <Container 
        maxWidth={false} 
        sx={{ 
          py: fullscreen ? 0 : 3,
          px: fullscreen ? 0 : 2,
          minHeight: fullscreen ? '100vh' : 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box
          sx={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center',
            transition: 'transform 0.3s ease',
            width: '100%',
            maxWidth: 'none'
          }}
        >
          <Paper 
            elevation={fullscreen ? 0 : 12} 
            sx={{ 
              overflow: 'visible',
              borderRadius: fullscreen ? 0 : 2,
              background: 'white',
              ...(fullscreen && {
                boxShadow: 'none'
              })
            }}
          >
            {printMode === 'side-by-side' ? (
              // Side by Side Layout
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'row', 
                gap: 2,
                p: fullscreen ? 0 : 2,
                bgcolor: 'white',
                position: 'relative'
              }}>
                {/* Layout Indicator */}
                {!fullscreen && (
                  <Chip 
                    label="Side by Side Layout - A4 Landscape"
                    color="primary"
                    size="small"
                    icon={<ViewModuleIcon />}
                    sx={{ 
                      position: 'absolute',
                      top: 8,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 10
                    }}
                  />
                )}

                {/* Original Copy - Left */}
                <Box sx={{ 
                  flex: 1,
                  maxWidth: '50%',
                  position: 'relative'
                }}>
                  <ClassicInvoiceTemplate
                    invoice={invoice}
                    settings={{ paperSize: 'A4', orientation: 'landscape', colorMode: 'color' }}
                    previewMode={false}
                    copyLabel="Original"
                  />
                </Box>

                {/* Duplicate Copy - Right */}
                <Box sx={{ 
                  flex: 1,
                  maxWidth: '50%',
                  position: 'relative'
                }}>
                  <ClassicInvoiceTemplate
                    invoice={invoice}
                    settings={{ paperSize: 'A4', orientation: 'landscape', colorMode: 'color' }}
                    previewMode={false}
                    copyLabel="Duplicate"
                  />
                </Box>
              </Box>
            ) : (
              // Duplex (Both Sides) Layout
              <Box sx={{ 
                width: '100%', 
                bgcolor: 'white',
                p: fullscreen ? 0 : 2
              }}>
                {/* Front Side (Original) */}
                <Box 
                  className="invoice-page front-page"
                  sx={{ 
                    width: '100%',
                    mb: fullscreen ? 0 : 6,
                    position: 'relative',
                    pageBreakAfter: 'always',
                    breakAfter: 'page'
                  }}
                >
                  <ClassicInvoiceTemplate
                    invoice={invoice}
                    settings={{ paperSize: 'A4', orientation: 'portrait', colorMode: 'color' }}
                    previewMode={false}
                    copyLabel="Original"
                  />
                  
                  {/* Front Side Indicator */}
                  {!fullscreen && (
                    <Chip 
                      label="Front Side - Original Copy"
                      color="primary"
                      size="small"
                      icon={<PagesIcon />}
                      sx={{ 
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        zIndex: 10
                      }}
                    />
                  )}
                </Box>
                
                {/* Back Side (Duplicate) */}
                <Box 
                  className="invoice-page back-page"
                  sx={{ 
                    width: '100%',
                    position: 'relative',
                    pageBreakBefore: 'always',
                    breakBefore: 'page'
                  }}
                >
                  <ClassicInvoiceTemplate
                    invoice={invoice}
                    settings={{ paperSize: 'A4', orientation: 'portrait', colorMode: 'color' }}
                    previewMode={false}
                    copyLabel="Duplicate"
                  />
                  
                  {/* Back Side Indicator */}
                  {!fullscreen && (
                    <Chip 
                      label="Back Side - Duplicate Copy"
                      color="secondary"
                      size="small"
                      icon={<FlipToBackIcon />}
                      sx={{ 
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        zIndex: 10
                      }}
                    />
                  )}
                </Box>
              </Box>
            )}
          </Paper>
        </Box>
      </Container>

      {/* Enhanced Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide all UI elements */
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
            background: white !important;
            font-family: 'Times New Roman', serif !important;
          }

          ${printMode === 'side-by-side' ? `
            /* Side by Side Mode - Landscape */
            @page {
              size: A4 landscape;
              margin: 5mm;
            }

            html, body {
              width: 287mm !important;
              height: 200mm !important;
              overflow: hidden !important;
            }

            .MuiContainer-root,
            .MuiBox-root,
            .MuiPaper-root {
              max-width: none !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              height: 100% !important;
              box-shadow: none !important;
              border-radius: 0 !important;
            }

            /* Side by side container */
            .MuiBox-root:has(.tally-template) {
              display: flex !important;
              flex-direction: row !important;
              gap: 5mm !important;
              width: 287mm !important;
              height: 200mm !important;
              padding: 0 !important;
              margin: 0 !important;
            }

            .MuiBox-root:has(.tally-template) > div {
              flex: 1 !important;
              max-width: 141mm !important;
              width: 141mm !important;
              height: 200mm !important;
            }

            /* Template adjustments for landscape */
            .tally-template {
              width: 141mm !important;
              max-width: 141mm !important;
              height: 200mm !important;
              max-height: 200mm !important;
              font-size: 7px !important;
              line-height: 1.1 !important;
            }

            .tally-table {
              font-size: 6px !important;
            }

            .tally-table th,
            .tally-table td {
              padding: 1px 2px !important;
              font-size: 6px !important;
            }

            .tally-company-header {
              font-size: 10px !important;
            }

          ` : `
            /* Duplex Mode - Portrait with Page Breaks */
            @page {
              size: A4 portrait;
              margin: 8mm;
            }

            html, body {
              width: 194mm !important;
              height: auto !important;
              overflow: visible !important;
            }

            .MuiContainer-root,
            .MuiBox-root,
            .MuiPaper-root {
              max-width: none !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              box-shadow: none !important;
              border-radius: 0 !important;
            }

            /* Page break handling */
            .front-page {
              page-break-after: always !important;
              break-after: page !important;
              width: 194mm !important;
              height: 277mm !important;
              margin-bottom: 0 !important;
            }
            
            .back-page {
              page-break-before: always !important;
              break-before: page !important;
              width: 194mm !important;
              height: 277mm !important;
            }

            /* Template adjustments for portrait */
            .tally-template {
              width: 194mm !important;
              max-width: 194mm !important;
              height: auto !important;
              min-height: 270mm !important;
              font-size: 8px !important;
              line-height: 1.2 !important;
            }

            .tally-table {
              font-size: 7px !important;
            }

            .tally-table th,
            .tally-table td {
              padding: 2px 3px !important;
              font-size: 7px !important;
            }

            .tally-company-header {
              font-size: 12px !important;
            }
          `}
        }
        
        /* Smooth transitions for zoom and mode changes */
        .MuiBox-root {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #1976d2;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #1565c0;
        }
      `}</style>
    </Box>
  );
}