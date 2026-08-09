"use client";
import React from 'react';
import { Box, Typography, Chip, Divider } from '@mui/material';
import { Invoice } from '@/types/invoice_no_gst';
import ClassicInvoiceTemplate from '@/components/invoices/templates/ClassicInvoiceTemplate';

interface ClassicDualInvoiceProps {
  invoice: Invoice;
  settings?: {
    paperSize?: 'A4' | 'Letter';
    orientation?: 'portrait' | 'landscape';
    colorMode?: 'color' | 'blackwhite';
    fullWidth?: boolean;
    scale?: number;
  };
  previewMode?: boolean;
}

const ClassicDualInvoice: React.FC<ClassicDualInvoiceProps> = ({ 
  invoice, 
  settings = {}, 
  previewMode = false 
}) => {
  const defaultSettings = {
    paperSize: 'A4' as const,
    orientation: 'landscape' as const,
    colorMode: 'color' as const,
    fullWidth: false,
    scale: 0.48,
    ...settings
  };

  // Calculate optimal scaling based on settings
  const getOptimalScale = () => {
    if (defaultSettings.fullWidth && previewMode) {
      return defaultSettings.scale + 0.08; // Increase scale for full width preview
    }
    return defaultSettings.scale;
  };

  const scale = getOptimalScale();
  const compensatedWidth = `${(100 / scale).toFixed(2)}%`;

  return (
    <Box
      className={`dual-invoice-container ${defaultSettings.fullWidth ? 'full-width' : ''}`}
      sx={{
        width: '100%',
        minHeight: defaultSettings.orientation === 'landscape' ? '210mm' : '297mm',
        maxWidth: defaultSettings.fullWidth && previewMode ? '100%' : 
                  defaultSettings.orientation === 'landscape' ? '297mm' : '210mm',
        display: 'flex',
        flexDirection: 'row',
        bgcolor: 'white',
        position: 'relative',
        mx: 'auto',
        boxShadow: previewMode ? '0 8px 32px rgba(0,0,0,0.12)' : 'none',
        borderRadius: previewMode ? '12px' : '0',
        overflow: 'hidden',
        aspectRatio: defaultSettings.orientation === 'landscape' ? '297/210' : '210/297',
        '@media print': {
          minHeight: defaultSettings.orientation === 'landscape' ? '210mm' : '297mm',
          maxWidth: defaultSettings.orientation === 'landscape' ? '297mm' : '210mm',
          width: defaultSettings.orientation === 'landscape' ? '297mm' : '210mm',
          boxShadow: 'none',
          borderRadius: '0',
          margin: '0',
          padding: '0',
          aspectRatio: 'unset',
        }
      }}
    >
      {/* Original Copy - Left Side */}
      <Box
        sx={{
          width: '50%',
          position: 'relative',
          borderRight: previewMode ? '2px dashed #e0e0e0' : '1px dashed #ccc',
          pr: 0.5,
          display: 'flex',
          flexDirection: 'column',
          '@media print': {
            borderRight: '1px dashed #000',
            pr: '2mm',
          }
        }}
      >
        {/* Copy Type Header */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 0.5,
            py: 1,
            position: 'relative',
            background: previewMode 
              ? 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)' 
              : 'transparent',
            color: previewMode ? 'white' : '#000',
            borderRadius: previewMode ? '8px 8px 0 0' : '0',
            '@media print': {
              background: 'transparent',
              color: '#000',
              border: '1px solid #000',
              borderRadius: '0',
              py: '1mm',
            }
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 'bold',
              fontSize: previewMode ? '11px' : '10px',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              '@media print': {
                fontSize: '8px',
                letterSpacing: '1px',
              }
            }}
          >
            ✓ Original for Recipient
          </Typography>
          {previewMode && (
            <Chip
              label="CUSTOMER COPY"
              size="small"
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontSize: '8px',
                height: '20px',
                '@media print': {
                  display: 'none',
                }
              }}
            />
          )}
        </Box>

        {/* Scaled Classic Invoice Template - Original */}
        <Box
          sx={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: compensatedWidth,
            height: 'auto',
            overflow: 'hidden',
            flex: 1,
            '@media print': {
              transform: `scale(${defaultSettings.scale})`,
              width: `${(100 / defaultSettings.scale).toFixed(2)}%`,
            }
          }}
        >
          <ClassicInvoiceTemplate
            invoice={invoice}
            settings={defaultSettings}
            previewMode={previewMode}
          />
        </Box>
      </Box>

      {/* Center Divider with Scissors Icon */}
      {previewMode && (
        <Box
          className="no-print"
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            bgcolor: 'white',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '2px solid #e0e0e0',
          }}
        >
          <Typography sx={{ fontSize: '16px', color: 'text.secondary' }}>
            ✂️
          </Typography>
        </Box>
      )}

      {/* Duplicate Copy - Right Side */}
      <Box
        sx={{
          width: '50%',
          position: 'relative',
          pl: 0.5,
          display: 'flex',
          flexDirection: 'column',
          '@media print': {
            pl: '2mm',
          }
        }}
      >
        {/* Copy Type Header */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 0.5,
            py: 1,
            position: 'relative',
            background: previewMode 
              ? 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)' 
              : 'transparent',
            color: previewMode ? 'white' : '#000',
            borderRadius: previewMode ? '8px 8px 0 0' : '0',
            '@media print': {
              background: 'transparent',
              color: '#000',
              border: '1px solid #000',
              borderRadius: '0',
              py: '1mm',
            }
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 'bold',
              fontSize: previewMode ? '11px' : '10px',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              '@media print': {
                fontSize: '8px',
                letterSpacing: '1px',
              }
            }}
          >
            ⚡ Duplicate for Supplier
          </Typography>
          {previewMode && (
            <Chip
              label="OFFICE COPY"
              size="small"
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontSize: '8px',
                height: '20px',
                '@media print': {
                  display: 'none',
                }
              }}
            />
          )}
        </Box>

        {/* Scaled Classic Invoice Template - Duplicate */}
        <Box
          sx={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: compensatedWidth,
            height: 'auto',
            overflow: 'hidden',
            flex: 1,
            '@media print': {
              transform: `scale(${defaultSettings.scale})`,
              width: `${(100 / defaultSettings.scale).toFixed(2)}%`,
            }
          }}
        >
          <ClassicInvoiceTemplate
            invoice={invoice}
            settings={defaultSettings}
            previewMode={previewMode}
          />
        </Box>
      </Box>

      {/* Print Quality Indicators */}
      {previewMode && (
        <Box
          className="no-print"
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            display: 'flex',
            gap: 1,
            zIndex: 10,
          }}
        >
          <Chip
            label="A4 Landscape"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontSize: '10px', height: '24px' }}
          />
          <Chip
            label="Print Ready"
            size="small"
            color="success"
            variant="outlined"
            sx={{ fontSize: '10px', height: '24px' }}
          />
        </Box>
      )}

      {/* Enhanced Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            font-size: 8px !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .no-print, .no-print * {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Ensure proper scaling for print */
          .MuiBox-root {
            box-sizing: border-box !important;
          }
          
          /* Hide any shadows or elevations */
          .MuiPaper-root {
            box-shadow: none !important;
            elevation: 0 !important;
            background: white !important;
          }
          
          /* Ensure text is crisp and black */
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Force black text for better readability */
          .MuiTypography-root {
            color: #000 !important;
          }
          
          /* Ensure borders are visible */
          .MuiTableCell-root {
            border-color: #000 !important;
          }
          
          /* Optimize table printing */
          table {
            page-break-inside: avoid;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          /* Prevent content from being cut off */
          .dual-invoice-container {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
        
        @media screen {
          /* Enhanced preview mode styling */
          .dual-invoice-container {
            transition: all 0.3s ease;
          }
          
          .dual-invoice-container:hover {
            box-shadow: 0 12px 40px rgba(0,0,0,0.15);
            transform: translateY(-2px);
          }
          
          /* Smooth scaling animations */
          .invoice-copy {
            transition: transform 0.2s ease;
          }
          
          /* Better text rendering */
          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        }
        
        /* Responsive adjustments for full width landscape mode */
        @media screen and (max-width: 1600px) {
          .dual-invoice-container {
            transform: scale(0.9);
            transform-origin: top center;
          }
        }
        
        @media screen and (max-width: 1400px) {
          .dual-invoice-container {
            transform: scale(0.8);
            transform-origin: top center;
          }
        }
        
        @media screen and (max-width: 1200px) {
          .dual-invoice-container {
            transform: scale(0.7);
            transform-origin: top center;
          }
        }
        
        @media screen and (max-width: 900px) {
          .dual-invoice-container {
            transform: scale(0.55);
            transform-origin: top center;
          }
        }
        
        @media screen and (max-width: 600px) {
          .dual-invoice-container {
            transform: scale(0.4);
            transform-origin: top center;
          }
        }
        
        /* Full width mode specific adjustments */
        .dual-invoice-container.full-width {
          width: 100% !important;
          max-width: none !important;
        }
        
        /* Landscape orientation optimizations */
        @media screen and (orientation: landscape) and (max-height: 800px) {
          .dual-invoice-container {
            transform: scale(0.75);
            transform-origin: top center;
          }
        }
      `}</style>
    </Box>
  );
};

export default ClassicDualInvoice;