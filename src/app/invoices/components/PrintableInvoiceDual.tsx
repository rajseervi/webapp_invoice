"use client";
import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Grid,
  Chip
} from '@mui/material';
import { Invoice } from '@/types/invoice_no_gst';

interface PrintableInvoiceDualProps {
  invoice: Invoice;
  settings?: {
    fontSize?: number;
    showWatermark?: boolean;
    colorMode?: 'color' | 'blackwhite';
    paperSize?: 'A4' | 'Letter';
    orientation?: 'portrait' | 'landscape';
    leftWidth?: number;  // Width percentage for left copy (0-100)
    rightWidth?: number; // Width percentage for right copy (0-100)
    gapWidth?: number;   // Gap width in pixels/mm
    equalWidth?: boolean; // Force equal widths
  };
  previewMode?: boolean;
}

interface InvoiceCopyProps {
  invoice: Invoice;
  copyType: 'ORIGINAL' | 'DUPLICATE';
  settings?: any;
}

const InvoiceCopy: React.FC<InvoiceCopyProps> = ({ invoice, copyType, settings }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate optimal font size based on orientation and settings
  const isLandscape = settings?.orientation === 'landscape';
  const baseFontSize = settings?.fontSize 
    ? Math.max(settings.fontSize - (isLandscape ? 2 : 3), 8) 
    : (isLandscape ? 10 : 9);
  const headerFontSize = baseFontSize + (isLandscape ? 5 : 4);
  const titleFontSize = baseFontSize + (isLandscape ? 2 : 1);

  return (
    <Box sx={{
      width: '100%',
      height: '100%',
      p: { xs: 0.5, sm: 1 },
      fontSize: `${baseFontSize}px`,
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      border: '1px solid #333',
      borderRadius: 0,
      bgcolor: 'white',
      display: 'flex',
      flexDirection: 'column',
      '@media print': {
        border: '1px solid #000',
        fontSize: `${baseFontSize}px`,
        p: 0.5,
        height: 'auto',
        minHeight: '100%'
      }
    }}>
      {/* Header */}
      <Box sx={{
        textAlign: 'center',
        mb: 1,
        borderBottom: '2px solid #333',
        pb: 0.5,
        '@media print': {
          borderBottom: '2px solid #000'
        }
      }}>
        <Typography variant="h5" sx={{
          fontSize: `${headerFontSize}px`,
          fontWeight: 'bold',
          mb: 0.3,
          letterSpacing: '1px',
          color: '#333'
        }}>
          INVOICE
        </Typography>
        <Chip
          label={`${copyType} COPY`}
          size="small"
          sx={{
            fontSize: `${baseFontSize}px`,
            fontWeight: 'bold',
            bgcolor: copyType === 'ORIGINAL' ? '#e3f2fd' : '#fff3e0',
            color: copyType === 'ORIGINAL' ? '#1976d2' : '#f57c00',
            border: `2px solid ${copyType === 'ORIGINAL' ? '#1976d2' : '#f57c00'}`,
            height: 'auto',
            '& .MuiChip-label': {
              px: 1,
              py: 0.3
            }
          }}
        />
      </Box>

      {/* Company and Invoice Details */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        mb: 1,
        bgcolor: '#f8f9fa',
        p: 0.5,
        border: '1px solid #dee2e6'
      }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{
            fontWeight: 'bold',
            fontSize: `${titleFontSize}px`,
            color: '#333',
            mb: 0.2
          }}>
            Your Company Name
          </Typography>
          <Typography variant="caption" sx={{
            fontSize: 'inherit',
            display: 'block',
            lineHeight: 1.2,
            color: '#666'
          }}>
            Your Company Address Line 1<br />
            City, State - PIN Code
          </Typography>
          <Typography variant="caption" sx={{
            fontSize: 'inherit',
            display: 'block',
            mt: 0.2,
            color: '#666'
          }}>
            📞 +91 XXXXXXXXXX | ✉️ info@company.com
          </Typography>
        </Box>
        <Box sx={{
          textAlign: 'right',
          borderLeft: '1px solid #dee2e6',
          pl: 1,
          minWidth: '120px'
        }}>
          <Typography variant="body2" sx={{
            fontWeight: 'bold',
            fontSize: `${titleFontSize}px`,
            color: '#333'
          }}>
            Invoice #: {invoice.invoiceNumber}
          </Typography>
          <Typography variant="caption" sx={{
            fontSize: 'inherit',
            display: 'block',
            mt: 0.3,
            color: '#666'
          }}>
            📅 {formatDate(invoice.date)}
          </Typography>
          {invoice.dueDate && (
            <Typography variant="caption" sx={{
              fontSize: 'inherit',
              display: 'block',
              color: '#d32f2f',
              fontWeight: 'medium'
            }}>
              Due: {formatDate(invoice.dueDate)}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Bill To */}
      <Box sx={{
        mb: 1,
        bgcolor: '#fff',
        border: '1px solid #dee2e6',
        p: 0.5
      }}>
        <Typography variant="body2" sx={{
          fontWeight: 'bold',
          fontSize: `${titleFontSize}px`,
          mb: 0.3,
          color: '#495057',
          borderBottom: '1px solid #dee2e6',
          pb: 0.2
        }}>
          📋 BILL TO:
        </Typography>
        <Typography variant="body2" sx={{
          fontSize: `${titleFontSize}px`,
          fontWeight: 'bold',
          color: '#333',
          mb: 0.2
        }}>
          {invoice.partyName}
        </Typography>
        {invoice.partyAddress && (
          <Typography variant="caption" sx={{
            fontSize: 'inherit',
            display: 'block',
            color: '#666',
            lineHeight: 1.2
          }}>
            📍 {invoice.partyAddress}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 1, mt: 0.2, flexWrap: 'wrap' }}>
          {invoice.partyPhone && (
            <Typography variant="caption" sx={{
              fontSize: 'inherit',
              color: '#666'
            }}>
              📞 {invoice.partyPhone}
            </Typography>
          )}
          {invoice.partyEmail && (
            <Typography variant="caption" sx={{
              fontSize: 'inherit',
              color: '#666'
            }}>
              ✉️ {invoice.partyEmail}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Items Table */}
      <Box sx={{ flex: 1, mb: 1 }}>
        <Table size="small" sx={{
          width: '100%',
          border: '1px solid #333',
          '& .MuiTableCell-root': {
            fontSize: 'inherit',
            padding: '3px 4px',
            border: '1px solid #333',
            lineHeight: 1.2,
            '@media print': {
              border: '1px solid #000',
              padding: '2px 3px'
            }
          }
        }}>
          <TableHead>
            <TableRow sx={{
              bgcolor: '#343a40',
              '& .MuiTableCell-root': {
                color: 'white',
                fontWeight: 'bold',
                fontSize: `${titleFontSize}px`
              }
            }}>
              <TableCell sx={{ width: '45%' }}>📦 ITEM DESCRIPTION</TableCell>
              <TableCell align="center" sx={{ width: '15%' }}>QTY</TableCell>
              <TableCell align="right" sx={{ width: '20%' }}>RATE</TableCell>
              <TableCell align="right" sx={{ width: '20%' }}>AMOUNT</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoice.items?.map((item, index) => (
              <TableRow key={index} sx={{
                '&:nth-of-type(even)': {
                  bgcolor: '#f8f9fa'
                }
              }}>
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <Typography variant="body2" sx={{
                    fontSize: 'inherit',
                    fontWeight: 'medium',
                    color: '#333',
                    mb: item.description ? 0.2 : 0
                  }}>
                    {item.name}
                  </Typography>
                  {item.description && (
                    <Typography variant="caption" sx={{
                      fontSize: `${baseFontSize - 1}px`,
                      color: '#666',
                      display: 'block',
                      fontStyle: 'italic'
                    }}>
                      {item.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center" sx={{
                  fontWeight: 'medium',
                  color: '#333'
                }}>
                  {item.quantity}
                </TableCell>
                <TableCell align="right" sx={{
                  fontWeight: 'medium',
                  color: '#333'
                }}>
                  {formatCurrency(item.price)}
                </TableCell>
                <TableCell align="right" sx={{
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  {formatCurrency(item.finalPrice || item.price * item.quantity)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* Totals */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        mb: 1
      }}>
        <Box sx={{
          minWidth: '150px',
          border: '1px solid #333',
          bgcolor: '#f8f9fa',
          '@media print': {
            border: '1px solid #000'
          }
        }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            p: 0.3,
            borderBottom: '1px solid #dee2e6'
          }}>
            <Typography variant="body2" sx={{ fontSize: 'inherit', color: '#666' }}>
              Subtotal:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 'inherit', fontWeight: 'medium' }}>
              {formatCurrency(invoice.subtotal || 0)}
            </Typography>
          </Box>



          {invoice.transportCharges && invoice.transportCharges > 0 && (
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              p: 0.3,
              borderBottom: '1px solid #dee2e6'
            }}>
              <Typography variant="body2" sx={{ fontSize: 'inherit', color: '#666' }}>
                Transport:
              </Typography>
              <Typography variant="body2" sx={{ fontSize: 'inherit', fontWeight: 'medium' }}>
                {formatCurrency(invoice.transportCharges)}
              </Typography>
            </Box>
          )}

          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            p: 0.3,
            bgcolor: '#343a40',
            color: 'white'
          }}>
            <Typography variant="body2" sx={{
              fontSize: `${titleFontSize}px`,
              fontWeight: 'bold'
            }}>
              💰 TOTAL:
            </Typography>
            <Typography variant="body2" sx={{
              fontSize: `${titleFontSize}px`,
              fontWeight: 'bold'
            }}>
              {formatCurrency(invoice.total || 0)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Notes */}
      {invoice.notes && (
        <Box sx={{
          mt: 1,
          border: '1px solid #dee2e6',
          bgcolor: '#fff3cd',
          p: 0.5
        }}>
          <Typography variant="caption" sx={{
            fontSize: `${titleFontSize}px`,
            fontWeight: 'bold',
            color: '#856404',
            display: 'block',
            mb: 0.2
          }}>
            📝 NOTES:
          </Typography>
          <Typography variant="caption" sx={{
            fontSize: 'inherit',
            display: 'block',
            color: '#856404',
            lineHeight: 1.3
          }}>
            {invoice.notes}
          </Typography>
        </Box>
      )}

      {/* Footer */}
      <Box sx={{
        mt: 'auto',
        pt: 0.5,
        borderTop: '2px solid #333',
        textAlign: 'center',
        '@media print': {
          borderTop: '2px solid #000'
        }
      }}>
        <Typography variant="caption" sx={{
          fontSize: 'inherit',
          display: 'block',
          fontWeight: 'bold',
          color: '#495057'
        }}>
          🙏 Thank you for your business!
        </Typography>
        {settings?.showWatermark && (
          <Typography variant="caption" sx={{
            fontSize: `${baseFontSize - 1}px`,
            display: 'block',
            color: '#6c757d',
            fontStyle: 'italic',
            mt: 0.2
          }}>
            Generated by Invoice Management System
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const PrintableInvoiceDual: React.FC<PrintableInvoiceDualProps> = ({
  invoice,
  settings = {},
  previewMode = false
}) => {
  // Default settings with width configuration
  const defaultSettings = {
    fontSize: 10,
    showWatermark: false,
    colorMode: 'color' as const,
    paperSize: 'A4' as const,
    orientation: 'landscape' as const,
    leftWidth: 50,      // 50% width for left copy
    rightWidth: 50,     // 50% width for right copy
    gapWidth: 8,        // 8px gap between copies
    equalWidth: true,   // Force equal widths by default
    ...settings
  };

  // Calculate actual widths
  const calculateWidths = () => {
    if (defaultSettings.equalWidth) {
      return {
        leftWidth: '50%',
        rightWidth: '50%',
        gapWidth: `${defaultSettings.gapWidth}px`
      };
    }
    
    const totalContentWidth = defaultSettings.leftWidth + defaultSettings.rightWidth;
    const leftPercentage = (defaultSettings.leftWidth / totalContentWidth) * 100;
    const rightPercentage = (defaultSettings.rightWidth / totalContentWidth) * 100;
    
    return {
      leftWidth: `${leftPercentage}%`,
      rightWidth: `${rightPercentage}%`,
      gapWidth: `${defaultSettings.gapWidth}px`
    };
  };

  const widths = calculateWidths();
  return (
    <Box sx={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#f8f9fa',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      '@media print': {
        bgcolor: 'white',
        minHeight: defaultSettings.orientation === 'landscape' ? '210mm' : '297mm',
        width: defaultSettings.orientation === 'landscape' ? '297mm' : '210mm',
        margin: 0,
        padding: 0,
        fontSize: defaultSettings.orientation === 'landscape' ? '7pt' : '8pt',
        '@page': {
          size: defaultSettings.paperSize === 'Letter' 
            ? `Letter ${defaultSettings.orientation}`
            : `A4 ${defaultSettings.orientation}`,
          margin: defaultSettings.orientation === 'landscape' ? '8mm' : '10mm'
        }
      }
    }}>
      {/* Page Header - Only in preview mode */}
      {previewMode && (
        <Box sx={{
          textAlign: 'center',
          p: 1.5,
          bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '@media print': {
            display: 'none'
          }
        }}>
          <Typography variant="h5" sx={{
            fontWeight: 'bold',
            mb: 0.5,
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
          }}>
            📄 Dual Copy Invoice - {defaultSettings.orientation === 'landscape' ? 'Landscape' : 'Portrait'} Format
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Professional dual-copy layout optimized for {defaultSettings.orientation} printing
            {defaultSettings.orientation === 'landscape' ? ' • More horizontal space' : ' • Standard vertical layout'}
          </Typography>
        </Box>
      )}

      {/* Dual Invoice Layout */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        gap: widths.gapWidth,
        p: { xs: 1, sm: 2 },
        minHeight: 0, // Allow flex children to shrink
        alignItems: 'stretch', // Ensure both copies have same height
        flexDirection: 'row', // Always side by side for dual layout
        '@media print': {
          gap: defaultSettings.orientation === 'landscape' ? '5mm' : '3mm',
          p: defaultSettings.orientation === 'landscape' ? '5mm' : '8mm',
          height: defaultSettings.orientation === 'landscape' 
            ? 'calc(210mm - 16mm)' // A4 landscape height minus margins
            : 'calc(297mm - 20mm)', // A4 portrait height minus margins
          minHeight: 'auto',
          maxWidth: defaultSettings.orientation === 'landscape' 
            ? 'calc(297mm - 16mm)' // A4 landscape width minus margins
            : 'calc(210mm - 20mm)'  // A4 portrait width minus margins
        }
      }}>
        {/* Original Copy - Left Side */}
        <Box sx={{
          width: widths.leftWidth,
          flex: defaultSettings.equalWidth ? 1 : 'none',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0, // Prevent flex item from overflowing
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          borderRadius: 1,
          overflow: 'hidden',
          '@media print': {
            boxShadow: 'none',
            borderRadius: 0,
            width: widths.leftWidth
          }
        }}>
          <InvoiceCopy
            invoice={invoice}
            copyType="ORIGINAL"
            settings={settings}
          />
        </Box>

        {/* Divider */}
        <Box sx={{
          width: Math.max(2, defaultSettings.gapWidth / 4), // Dynamic divider width
          background: 'linear-gradient(to bottom, #667eea, #764ba2)',
          borderRadius: 1,
          position: 'relative',
          flexShrink: 0, // Prevent divider from shrinking
          '@media print': {
            width: defaultSettings.orientation === 'landscape' ? '2mm' : '1mm',
            background: defaultSettings.colorMode === 'color' ? '#667eea' : '#000',
            borderRadius: 0
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 8,
            height: 8,
            bgcolor: 'white',
            borderRadius: '50%',
            '@media print': {
              display: 'none'
            }
          }
        }} />

        {/* Duplicate Copy - Right Side */}
        <Box sx={{
          width: widths.rightWidth,
          flex: defaultSettings.equalWidth ? 1 : 'none',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0, // Prevent flex item from overflowing
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          borderRadius: 1,
          overflow: 'hidden',
          '@media print': {
            boxShadow: 'none',
            borderRadius: 0,
            width: widths.rightWidth
          }
        }}>
          <InvoiceCopy
            invoice={invoice}
            copyType="DUPLICATE"
            settings={settings}
          />
        </Box>
      </Box>

      {/* Print Instructions - Only in preview mode */}
      {previewMode && (
        <Box sx={{
          p: 1.5,
          bgcolor: '#e8f5e8',
          borderTop: '1px solid #c8e6c9',
          '@media print': {
            display: 'none'
          }
        }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            flexWrap: 'wrap'
          }}>
            <Typography variant="body2" color="#2e7d32" sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontWeight: 'medium'
            }}>
              🖨️ <strong>Print Settings:</strong> {defaultSettings.orientation === 'landscape' ? 'Landscape' : 'Portrait'} orientation
              {defaultSettings.orientation === 'landscape' ? ' (more space)' : ' (standard)'}
            </Typography>
            <Typography variant="body2" color="#2e7d32" sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontWeight: 'medium'
            }}>
              📏 <strong>Paper:</strong> {defaultSettings.paperSize} size for optimal results
            </Typography>
            <Typography variant="body2" color="#2e7d32" sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontWeight: 'medium'
            }}>
              ✂️ <strong>Output:</strong> Both copies on single page
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PrintableInvoiceDual;