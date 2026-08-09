"use client";
import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Container,
  Stack,
  Chip,
  IconButton,
  ButtonGroup
} from '@mui/material';
import {
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon
} from '@mui/icons-material';
import ClassicInvoiceTemplate from '@/components/invoices/templates/ClassicInvoiceTemplate';

// Mock invoice data for testing
const mockInvoice = {
  id: 'TEST001',
  invoiceNumber: 'QTN001',
  date: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  partyName: 'Test Customer Ltd.',
  partyAddress: '123 Business Street, Commercial District, City - 400001',
  partyPhone: '+91-9876543210',
  partyEmail: 'customer@testltd.com',
  items: [
    {
      name: 'Product 1',
      description: 'High quality product with advanced features',
      quantity: 5,
      unitOfMeasurement: 'PCS',
      price: 1500.00,
      discount: 10,
      totalAmount: 6750.00,
      finalPrice: 6750.00
    },
    {
      name: 'Product 2',
      description: 'Premium service offering',
      quantity: 2,
      unitOfMeasurement: 'PCS',
      price: 2500.00,
      discount: 5,
      totalAmount: 4750.00,
      finalPrice: 4750.00
    },
    {
      name: 'Product 3',
      description: 'Standard item with warranty',
      quantity: 10,
      unitOfMeasurement: 'PCS',
      price: 750.00,
      discount: 0,
      totalAmount: 7500.00,
      finalPrice: 7500.00
    }
  ],
  subtotal: 19000.00,
  totalDiscount: 1500.00,
  transportCharges: 500.00,
  totalAmount: 18000.00,
  total: 18000.00,
  paymentMode: 'Bank Transfer',
  notes: 'Thank you for your business!'
};

const mockSettings = {
  template: 'classic',
  colors: {
    primary: '#1976d2',
    secondary: '#dc004e'
  }
};

export default function TestTemplatePage() {
  const [previewMode, setPreviewMode] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showEnhancedPreview, setShowEnhancedPreview] = useState(false);

  const handlePrint = () => {
    setPreviewMode(false);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPreviewMode(true), 1000);
    }, 100);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: showEnhancedPreview ? (previewMode ? '#f5f5f5' : 'white') : 'white' }}>
      {/* Enhanced Controls */}
      <Box sx={{ 
        p: 2, 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e0e0e0',
        mb: showEnhancedPreview ? 0 : 2,
        position: showEnhancedPreview ? 'sticky' : 'static',
        top: 0,
        zIndex: 100,
        boxShadow: showEnhancedPreview ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
        '@media print': { display: 'none' }
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {showEnhancedPreview ? '✨ Enhanced' : '🖨️ Basic'} Print Template Test
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Testing ClassicInvoiceTemplate printing functionality {showEnhancedPreview && '• Ctrl+P to print • 1,2,3 for zoom'}
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={1}>
            <Button
              onClick={() => setShowEnhancedPreview(!showEnhancedPreview)}
              variant={showEnhancedPreview ? "contained" : "outlined"}
              color="secondary"
            >
              {showEnhancedPreview ? 'Enhanced Mode' : 'Switch to Enhanced'}
            </Button>
            
            {showEnhancedPreview && (
              <Button
                startIcon={previewMode ? <VisibilityIcon /> : <VisibilityOffIcon />}
                onClick={() => setPreviewMode(!previewMode)}
                variant={previewMode ? "outlined" : "contained"}
                color="info"
              >
                {previewMode ? 'Preview Mode' : 'Print Mode'}
              </Button>
            )}
            
            <Button 
              onClick={handlePrint}
              variant="contained"
              color="primary"
              startIcon={<PrintIcon />}
            >
              Print
            </Button>
          </Stack>
        </Box>

        {showEnhancedPreview && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Settings Summary */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                icon={<CheckCircleIcon />}
                label="📋 Original for Recipient" 
                color="primary" 
                variant="filled" 
                size="small"
              />
              <Chip 
                label="A4 Portrait" 
                color="default" 
                variant="outlined" 
                size="small"
              />
              <Chip 
                label="Single Page Optimized" 
                color="success" 
                variant="outlined"
                size="small"
                icon={<CheckCircleIcon />}
              />
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
              </Stack>
            )}
          </Box>
        )}
      </Box>

      {showEnhancedPreview ? (
        /* Enhanced Preview Container */
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
          }}
        >
          <Paper 
            elevation={previewMode ? 8 : 0}
            sx={{ 
              position: 'relative',
              width: previewMode ? { xs: '95vw', sm: '8.5in', md: '8.5in' } : '100%',
              maxWidth: previewMode ? '8.5in' : 'none',
              minHeight: previewMode ? 'auto' : '100vh',
              bgcolor: 'white',
              transform: previewMode ? `scale(${zoomLevel / 100})` : 'none',
              transformOrigin: 'top center',
              transition: 'all 0.3s ease-in-out',
              overflow: 'visible',
            }}
          >
            {/* Preview Mode Indicator */}
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
                  label={`Print Preview - A4 Portrait - ${zoomLevel}% zoom`}
                  color="info"
                  size="small"
                  sx={{ bgcolor: 'rgba(25, 118, 210, 0.1)' }}
                />
              </Box>
            )}

            {/* Invoice Content */}
            <Box sx={{ 
              p: previewMode ? { xs: 1, sm: 2 } : 0,
              width: '100%',
              overflow: 'visible',
              '& *': {
                boxSizing: 'border-box'
              }
            }}>
              <ClassicInvoiceTemplate 
                invoice={mockInvoice}
                settings={mockSettings}
                previewMode={previewMode}
                copyLabel="Original for Recipient"
              />
            </Box>
          </Paper>
        </Container>
      ) : (
        /* Basic View */
        <Box sx={{ p: 2 }}>
          <ClassicInvoiceTemplate 
            invoice={mockInvoice}
            settings={mockSettings}
            previewMode={false}
            copyLabel="Original for Recipient"
          />
        </Box>
      )}

      {/* Enhanced Print Styles */}
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
          
          /* Enhanced print quality */
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