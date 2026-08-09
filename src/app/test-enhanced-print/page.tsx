"use client";
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Container, 
  Typography, 
  Box, 
  Button,
  Paper,
  IconButton,
  Stack,
  Tooltip,
  Chip,
  ButtonGroup,
  Fade
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon
} from '@mui/icons-material';
import ClassicInvoiceTemplate from '@/components/invoices/templates/ClassicInvoiceTemplate';
import { Invoice } from '@/types/invoice_no_gst';

// Mock invoice data
const mockInvoice: Invoice = {
  id: 'test001',
  invoiceNumber: 'INV-2024-001',
  invoiceDate: new Date('2024-01-15'),
  customerName: 'Acme Corporation Ltd.',
  customerAddress: '123 Business Street\nCommercial District\nCity, State 12345',
  customerPhone: '+1 (555) 123-4567',
  items: [
    {
      id: '1',
      description: 'Professional Web Development Services',
      quantity: 40,
      rate: 125.00,
      amount: 5000.00
    },
    {
      id: '2', 
      description: 'UI/UX Design Consultation',
      quantity: 15,
      rate: 150.00,
      amount: 2250.00
    },
    {
      id: '3',
      description: 'Technical Documentation',
      quantity: 8,
      rate: 100.00,
      amount: 800.00
    }
  ],
  subtotal: 8050.00,
  total: 8050.00,
  userId: 'test-user',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  notes: 'Payment due within 30 days. Thank you for your business!'
};

export default function TestEnhancedPrintPage() {
  const searchParams = useSearchParams();
  
  // Enhanced URL parameters with defaults
  const copies = Math.max(1, Math.min(10, parseInt(searchParams.get('copies') || '2')));
  const paperSize = (searchParams.get('paperSize') || 'A4') as 'A4' | 'A5' | 'Letter' | 'Thermal';
  const orientation = (searchParams.get('orientation') || 'portrait') as 'portrait' | 'landscape';
  const colorMode = (searchParams.get('colorMode') || 'color') as 'color' | 'grayscale' | 'blackwhite';
  const copyType = searchParams.get('copyType') || 'original';
  const singlePageOptimization = searchParams.get('singlePageOptimization') !== 'false';
  const compactMode = searchParams.get('compactMode') === 'true';
  const showBorders = searchParams.get('showBorders') === 'true';
  const fontSize = searchParams.get('fontSize') || 'normal';
  
  const [previewMode, setPreviewMode] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);

  const handlePrint = () => {
    setPreviewMode(false);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPreviewMode(true), 1000);
    }, 100);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'p') {
        event.preventDefault();
        handlePrint();
      } else if (event.key === '1') {
        setZoomLevel(100);
      } else if (event.key === '2') {
        setZoomLevel(125);
      } else if (event.key === '3') {
        setZoomLevel(150);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Copy type labels
  const getCopyInfo = (type: string) => {
    switch (type) {
      case 'original': return { label: '📋 Original for Recipient', color: 'primary' as const };
      case 'duplicate': return { label: '📄 Duplicate for Supplier', color: 'secondary' as const };
      case 'triplicate': return { label: '🚛 Triplicate for Transporter', color: 'warning' as const };
      case 'all': return { label: '📋📄🚛 All Copies', color: 'success' as const };
      default: return { label: '📋 Original', color: 'primary' as const };
    }
  };

  const copyInfo = getCopyInfo(copyType);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: previewMode ? '#f5f5f5' : 'white' }}>
      {/* Enhanced Preview Controls - Hidden when printing */}
      <Box className="no-print" sx={{ 
        bgcolor: 'white',
        borderBottom: '1px solid #e0e0e0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: previewMode ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
      }}>
        <Container maxWidth="lg" sx={{ py: 2 }}>
          {/* Main Control Bar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tooltip title="Back to Invoice Details (Esc)">
                <IconButton 
                  onClick={() => window.history.back()}
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
                  ✨ Enhanced Print Preview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Invoice #{mockInvoice.invoiceNumber} • Press Ctrl+P to print • 1,2,3 for zoom
                </Typography>
              </Box>
            </Box>

            {/* Primary Actions */}
            <Stack direction="row" spacing={1}>
              <Tooltip title={previewMode ? "Switch to Print Mode" : "Switch to Preview Mode"}>
                <Button
                  startIcon={previewMode ? <VisibilityIcon /> : <VisibilityOffIcon />}
                  onClick={() => setPreviewMode(!previewMode)}
                  variant={previewMode ? "outlined" : "contained"}
                  color="info"
                  size="large"
                >
                  {previewMode ? 'Preview Mode' : 'Print Mode'}
                </Button>
              </Tooltip>
              <Button
                startIcon={<DownloadIcon />}
                onClick={handlePrint}
                variant="outlined"
                size="large"
              >
                PDF
              </Button>
              <Button
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                variant="contained"
                size="large"
                color="primary"
              >
                Print Now
              </Button>
            </Stack>
          </Box>

          {/* Settings Summary & Controls */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Settings Summary */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                icon={<CheckCircleIcon />}
                label={copyInfo.label} 
                color={copyInfo.color} 
                variant="filled" 
                size="small"
              />
              <Chip 
                label={`${paperSize} ${orientation}`} 
                color="default" 
                variant="outlined" 
                size="small"
              />
              <Chip 
                label={`${copies} ${copies === 1 ? 'copy' : 'copies'}`} 
                color="secondary" 
                variant="outlined" 
                size="small"
              />
              {singlePageOptimization && (
                <Chip 
                  label="Single Page Optimized" 
                  color="success" 
                  variant="outlined"
                  size="small"
                  icon={<CheckCircleIcon />}
                />
              )}
              {compactMode && (
                <Chip 
                  label="Compact Mode" 
                  color="warning" 
                  variant="outlined"
                  size="small"
                />
              )}
            </Box>

            {/* Zoom Controls */}
            {previewMode && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Zoom:
                </Typography>
                <ButtonGroup size="small" variant="outlined">
                  <IconButton 
                    onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))}
                    disabled={zoomLevel <= 50}
                  >
                    <ZoomOutIcon fontSize="small" />
                  </IconButton>
                  <Button
                    onClick={() => setZoomLevel(100)}
                    sx={{ minWidth: '60px' }}
                  >
                    {zoomLevel}%
                  </Button>
                  <IconButton 
                    onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
                    disabled={zoomLevel >= 200}
                  >
                    <ZoomInIcon fontSize="small" />
                  </IconButton>
                </ButtonGroup>
                <Typography variant="caption" color="text.secondary">
                  1,2,3 keys
                </Typography>
              </Stack>
            )}
          </Box>
        </Container>
      </Box>

      {/* Invoice Preview Area */}
      <Container 
        maxWidth={false} 
        sx={{ 
          py: previewMode ? 3 : 0,
          px: previewMode ? 2 : 0,
          minHeight: previewMode ? 'calc(100vh - 140px)' : '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: previewMode ? 'transparent' : 'white',
          '@media print': {
            py: 0,
            px: 0,
            minHeight: '100vh',
            height: '100vh'
          }
        }}
      >
        {/* Print Preview Container */}
        <Paper 
          elevation={previewMode ? 8 : 0}
          sx={{ 
            position: 'relative',
            width: previewMode ? '8.5in' : '100%',
            minHeight: previewMode ? '11in' : '100vh',
            bgcolor: 'white',
            transform: previewMode ? `scale(${zoomLevel / 100})` : 'none',
            transformOrigin: 'top center',
            transition: 'all 0.3s ease-in-out',
            '@media print': {
              transform: 'none',
              width: '100%',
              height: '100vh',
              minHeight: '100vh',
              boxShadow: 'none',
              border: 'none'
            }
          }}
        >
          {/* Preview Mode Indicators */}
          {previewMode && (
            <Box className="no-print" sx={{ 
              position: 'absolute', 
              top: -40, 
              left: 0, 
              right: 0, 
              textAlign: 'center',
              zIndex: 10
            }}>
              <Chip 
                icon={<InfoIcon />}
                label={`Print Preview - ${paperSize} ${orientation} - ${zoomLevel}% zoom`}
                color="info"
                size="small"
                sx={{ bgcolor: 'rgba(25, 118, 210, 0.1)' }}
              />
            </Box>
          )}

          {/* Paper Guidelines (Preview Only) */}
          {previewMode && showBorders && (
            <Box 
              className="no-print"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                border: '2px dashed #2196f3',
                pointerEvents: 'none',
                '&::before': {
                  content: '"Print Area"',
                  position: 'absolute',
                  top: '5px',
                  left: '10px',
                  fontSize: '10px',
                  color: '#2196f3',
                  fontWeight: 'bold'
                }
              }}
            />
          )}

          {/* Invoice Content */}
          <Box 
            className="invoice-print-container"
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              p: previewMode ? 2 : 0,
              '@media print': {
                p: 0,
                height: '100vh'
              }
            }}
          >
            {Array.from({ length: copies }).map((_, idx) => (
              <Fade key={idx} in={true} timeout={(idx + 1) * 200}>
                <Box 
                  className="invoice-copy"
                  sx={{ 
                    mb: idx < copies - 1 ? (previewMode ? 3 : 0) : 0,
                    flex: copies === 1 ? 1 : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    '@media print': {
                      mb: 0,
                      pageBreakAfter: idx < copies - 1 ? 'always' : 'auto'
                    }
                  }}
                >
                  {/* Copy Header (for multiple copies) */}
                  {copies > 1 && (
                    <Box sx={{ 
                      textAlign: 'center', 
                      mb: 1, 
                      py: 0.5,
                      bgcolor: previewMode ? 'rgba(0,0,0,0.03)' : 'transparent',
                      '@media print': { bgcolor: 'transparent' }
                    }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: 700, 
                          letterSpacing: 1,
                          color: previewMode ? 'text.secondary' : 'black'
                        }}
                      >
                        {['Original', 'Duplicate', 'Triplicate', 'Quadruplicate', 'Quintuplicate'][idx] ?? `Copy ${idx + 1}`}
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Invoice Template */}
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <ClassicInvoiceTemplate 
                      invoice={mockInvoice}
                      settings={{
                        paperSize,
                        orientation,
                        colorMode,
                        marginType: 'normal',
                        fontSize,
                        compactMode,
                        singlePageOptimization,
                        autoScale: true,
                        printQuality: 'high'
                      }}
                      previewMode={previewMode}
                      copyLabel={copies === 1 ? copyInfo.label : (
                        ['Original for Recipient', 'Duplicate for Supplier', 'Triplicate for Transporter'][idx] ?? `Copy ${idx + 1}`
                      )}
                    />
                  </Box>
                </Box>
              </Fade>
            ))}
          </Box>
        </Paper>
      </Container>

      {/* Enhanced Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'};
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
          
          .invoice-print-container {
            width: 100% !important;
            height: 100vh !important;
            padding: 0 !important;
          }
          
          .invoice-copy {
            height: ${copies === 1 ? '100vh' : 'auto'} !important;
            margin-bottom: 0 !important;
          }
          
          .tally-template {
            font-size: ${fontSize === 'small' ? '8px' : fontSize === 'large' ? '12px' : '10px'} !important;
            ${compactMode ? 'line-height: 1.1 !important;' : ''}
          }
          
          /* Enhanced print quality */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
        
        /* Preview mode enhancements */
        ${previewMode ? `
          .invoice-print-container {
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
          }
        ` : ''}
      `}</style>
    </Box>
  );
}