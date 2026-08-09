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
  Divider,
  Grid,
  Paper,
  Chip
} from '@mui/material';
import { Invoice } from '@/types/invoice_no_gst';
import CompanyInfoDisplay from '@/components/CompanyInfoDisplay';

interface ModernInvoiceTemplateProps {
  invoice: Invoice;
  settings: any;
  previewMode: boolean;
}

const formatCurrency = (value: number | undefined | null): string => {
  return `₹${(value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateInput: any): string => {
  if (!dateInput) return 'N/A';
  try {
    if (dateInput.toDate) {
      return new Date(dateInput.toDate()).toLocaleDateString('en-IN');
    }
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-IN');
    }
  } catch (e) { /* ignore */ }
  return String(dateInput);
};

const numberToWords = (amount: number): string => {
  if (amount === 0) return 'Zero Rupees Only';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convertHundreds = (num: number): string => {
    let result = '';
    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    } else if (num >= 10) {
      result += teens[num - 10] + ' ';
      return result;
    }
    if (num > 0) {
      result += ones[num] + ' ';
    }
    return result;
  };
  
  let rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  
  let result = '';
  
  if (rupees >= 10000000) {
    result += convertHundreds(Math.floor(rupees / 10000000)) + 'Crore ';
    rupees %= 10000000;
  }
  if (rupees >= 100000) {
    result += convertHundreds(Math.floor(rupees / 100000)) + 'Lakh ';
    rupees %= 100000;
  }
  if (rupees >= 1000) {
    result += convertHundreds(Math.floor(rupees / 1000)) + 'Thousand ';
    rupees %= 1000;
  }
  if (rupees > 0) {
    result += convertHundreds(rupees);
  }
  
  result += 'Rupees ';
  
  if (paise > 0) {
    result += 'and ' + convertHundreds(paise) + 'Paise ';
  }
  
  result += 'Only';
  return result.trim();
};

export default function ModernInvoiceTemplate({ invoice, settings, previewMode }: ModernInvoiceTemplateProps) {
  const printStyles = `
    @page {
      size: A4 portrait;
      margin: 8mm 6mm 8mm 6mm;
    }
    
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
        box-sizing: border-box;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
      }
      
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 10px;
        line-height: 1.2;
        color: #333;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      .modern-template {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #333;
        line-height: 1.3;
        font-size: 11px;
        width: 100%;
        max-width: 194mm;
        height: auto;
        min-height: 275mm;
        margin: 0 auto;
        padding: 0;
        page-break-inside: avoid;
        position: relative;
        background: white;
        transform: scale(0.99);
        transform-origin: top center;
      }
      
      .modern-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        color: white !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        margin-bottom: 4mm;
        padding: 10px 14px;
        border-radius: 2px;
        page-break-inside: avoid;
        width: 100%;
        box-sizing: border-box;
        overflow: hidden;
      }
      
      .modern-accent {
        background: #f8f9ff !important;
        border-left: 4px solid #667eea !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        padding: 6px 8px;
        margin-bottom: 2mm;
        border-radius: 2px;
      }
      
      .modern-table {
        width: 100%;
        border-collapse: collapse;
        margin: 3mm 0;
        font-size: 10px;
        table-layout: fixed;
        border: 1px solid #dee2e6;
      }
      
      .modern-table th {
        background: #667eea !important;
        color: white !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        padding: 4px 6px;
        font-size: 9px;
        font-weight: 600;
        border: 1px solid #5a6fd8;
        line-height: 1.2;
        text-align: left;
        white-space: nowrap;
      }
      
      .modern-table td {
        padding: 4px 6px;
        font-size: 9px;
        border: 1px solid #dee2e6;
        vertical-align: top;
        line-height: 1.3;
        word-wrap: break-word;
        word-break: break-word;
      }
      
      .modern-table tr:nth-child(even) {
        background: #f8f9ff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .modern-total {
        background: #e8f2ff !important;
        border: 1px solid #667eea !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        padding: 6px 8px;
        margin: 2mm 0;
        border-radius: 3px;
      }
      
      .modern-summary-section {
        margin: 2mm 0;
        page-break-inside: avoid;
        display: flex;
        gap: 2mm;
      }
      
      .modern-notes {
        background: #fff8e1 !important;
        border: 1px solid #ffc107 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        padding: 6px 8px;
        margin: 2mm 0;
        border-radius: 3px;
      }
      
      .modern-footer {
        border-top: 2px solid #667eea;
        padding-top: 4mm;
        margin-top: 3mm;
        page-break-inside: avoid;
        min-height: 15mm;
      }
      
      .modern-company-details {
        height: auto;
        min-height: 20mm;
        padding: 6px 8px;
        box-sizing: border-box;
      }
      
      .modern-customer-details {
        height: auto;
        min-height: 20mm;
        padding: 6px 8px;
        border: 1px solid #e0e7ff;
        border-radius: 3px;
        box-sizing: border-box;
      }
      
      /* Optimized A4 typography */
      .modern-template h1,
      .modern-template h2,
      .modern-template h3,
      .modern-template h4,
      .modern-template h5,
      .modern-template h6 {
        margin: 0 0 2px 0;
        line-height: 1.1;
        font-weight: 600;
      }
      
      .modern-template p,
      .modern-template div {
        margin: 0 0 1px 0;
        line-height: 1.2;
      }
      
      .modern-template .MuiTypography-root {
        margin-bottom: 1px !important;
        line-height: 1.2 !important;
      }
      
      .modern-template .MuiBox-root {
        margin-bottom: 1px !important;
      }
      
      .modern-template .MuiGrid-item {
        padding: 2px !important;
      }
      
      .modern-template .MuiGrid-container {
        margin-bottom: 2px !important;
      }
      
      /* A4 optimized header styling */
      .modern-header h1,
      .modern-header h2,
      .modern-header h3 {
        font-size: 18px !important;
        margin: 0 !important;
        line-height: 1.2 !important;
        font-weight: 700 !important;
      }
      
      .modern-header .MuiTypography-h6 {
        font-size: 10px !important;
        margin: 0 !important;
        line-height: 1.2 !important;
      }
      
      .modern-header .MuiTypography-h4 {
        font-size: 14px !important;
        margin: 0 !important;
        line-height: 1.2 !important;
      }
      
      .modern-header .MuiTypography-body1,
      .modern-header .MuiTypography-body2 {
        font-size: 9px !important;
        margin: 0 !important;
        line-height: 1.2 !important;
      }
      
      /* A4 optimized section headers */
      .modern-section-header {
        font-size: 10px !important;
        margin: 0 0 3px 0 !important;
        line-height: 1.2 !important;
        font-weight: 600 !important;
        text-transform: uppercase;
        letter-spacing: 0.8px;
      }
      
      /* A4 optimized chip styling */
      .modern-template .MuiChip-root {
        height: 20px !important;
        font-size: 8px !important;
        margin: 0 2px !important;
        border-radius: 4px !important;
      }
      
      /* Remove extra spacing from decorative elements in print */
      .modern-decorative {
        display: none !important;
      }
      
      /* A4 page break controls */
      .page-break-before {
        page-break-before: always;
        break-before: page;
      }
      
      .page-break-after {
        page-break-after: always;
        break-after: page;
      }
      
      .no-page-break {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      /* Enhanced print table control */
      .modern-table-container {
        page-break-inside: auto;
        break-inside: auto;
      }
      
      .modern-table tbody tr {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      /* Better text rendering for print */
      .print-optimized {
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
    }
    
    @media screen {
      .modern-template {
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        border-radius: 8px;
        overflow: hidden;
        max-width: 210mm;
        min-height: 297mm;
        margin: 20px auto;
        background: white;
        padding: 20mm;
        box-sizing: border-box;
      }
      
      .modern-header {
        margin-bottom: 20px !important;
        padding: 16px 20px !important;
      }
      
      .modern-accent {
        margin-bottom: 15px !important;
        padding: 12px 16px !important;
      }
      
      .modern-table {
        margin: 15px 0 !important;
        font-size: 14px !important;
      }
      
      .modern-table th {
        padding: 8px 12px !important;
        font-size: 13px !important;
      }
      
      .modern-table td {
        padding: 8px 12px !important;
        font-size: 13px !important;
      }
      
      .modern-company-details,
      .modern-customer-details {
        min-height: 120px !important;
        padding: 12px 16px !important;
      }
      
      .modern-total {
        padding: 12px 16px !important;
        margin: 15px 0 !important;
      }
      
      .modern-notes {
        padding: 12px 16px !important;
        margin: 15px 0 !important;
      }
      
      .modern-footer {
        padding-top: 20px !important;
        margin-top: 20px !important;
        min-height: 80px !important;
      }
    }
  `;

  return (
    <>
      <style>{printStyles}</style>
      <Box className="modern-template" sx={{ 
        width: previewMode ? '210mm' : '100%',
        maxWidth: '210mm', 
        margin: '0 auto', 
        p: previewMode ? '15mm' : '5mm',
        bgcolor: 'white',
        minHeight: '297mm',
        boxShadow: previewMode ? '0 4px 20px rgba(0,0,0,0.1)' : 'none',
        boxSizing: 'border-box',
        position: 'relative',
        fontSize: '0.9rem',
        lineHeight: 1.3,
        '@media print': {
          width: '100%',
          maxWidth: 'none',
          margin: 0,
          padding: '3mm',
          boxShadow: 'none',
          minHeight: '275mm',
          fontSize: '11px',
          lineHeight: 1.3
        }
      }}>
        {/* A4 Optimized Modern Header */}
        <Box className="modern-header no-page-break" sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white', 
          p: { xs: 1.5, print: 1 }, 
          mb: { xs: 2, print: 1 },
          borderRadius: 1,
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Minimal decorative elements for print */}
          <Box className="modern-decorative" sx={{
            position: 'absolute',
            top: -10,
            right: -10,
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            zIndex: 0
          }} />
          
          <Grid container alignItems="center" justifyContent="space-between" sx={{ position: 'relative', zIndex: 1 }}>
            <Grid item xs={8}>
              <Typography variant="h3" sx={{ 
                fontWeight: 'bold', 
                mb: 0.8, 
                fontSize: { xs: '2.2rem', print: '18px' },
                lineHeight: 1.2,
                letterSpacing: '1px'
              }}>
                INVOICE
              </Typography>
              <Typography variant="body2" sx={{ 
                opacity: 0.9, 
                fontWeight: 300, 
                fontSize: { xs: '1rem', print: '9px' },
                lineHeight: 1.3
              }}>
                Professional Invoice Document
              </Typography>
            </Grid>
            <Grid item xs={4} sx={{ textAlign: 'right' }}>
              <Box sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                p: { xs: 1.5, print: 1 }, 
                borderRadius: 1,
                backdropFilter: 'blur(10px)'
              }}>
                <Typography variant="h5" sx={{ 
                  fontWeight: 'bold', 
                  mb: 0.8, 
                  fontSize: { xs: '1.5rem', print: '14px' },
                  lineHeight: 1.2,
                  letterSpacing: '0.5px'
                }}>
                  {invoice.invoiceNumber || 'N/A'}
                </Typography>
                <Typography variant="caption" sx={{ 
                  opacity: 0.9, 
                  fontSize: { xs: '0.9rem', print: '9px' },
                  lineHeight: 1.3,
                  display: 'block',
                  mb: 0.3
                }}>
                  Date: {formatDate(invoice.date)}
                </Typography>
                {invoice.dueDate && (
                  <Typography variant="caption" sx={{ 
                    opacity: 0.8, 
                    display: 'block', 
                    fontSize: { xs: '0.85rem', print: '9px' },
                    lineHeight: 1.3
                  }}>
                    Due: {formatDate(invoice.dueDate)}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* A4 Optimized Company and Customer Details */}
        <Grid container spacing={{ xs: 2, print: 1 }} sx={{ mb: { xs: 2, print: 1 } }} className="no-page-break">
          {/* From Section */}
          <Grid item xs={6}>
            <Box className="modern-accent modern-company-details" sx={{ 
              bgcolor: '#f8f9ff', 
              p: { xs: 1.5, print: 1 }, 
              borderRadius: 1,
              borderLeft: '4px solid #667eea',
              height: '100%',
              minHeight: { xs: 'auto', print: '20mm' },
              boxSizing: 'border-box'
            }}>
              <Typography className="modern-section-header" variant="subtitle2" sx={{ 
                color: '#667eea', 
                fontWeight: 'bold', 
                mb: { xs: 1, print: 0.5 },
                fontSize: { xs: '0.9rem', print: '9px' },
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                lineHeight: 1.1
              }}>
                From
              </Typography>
              <CompanyInfoDisplay variant="compact" />
            </Box>
          </Grid>

          {/* To Section */}
          <Grid item xs={6}>
            <Box className="modern-customer-details" sx={{ 
              border: '1px solid #e0e7ff', 
              p: { xs: 1.5, print: 1 }, 
              borderRadius: 1,
              height: '100%',
              minHeight: { xs: 'auto', print: '20mm' },
              bgcolor: '#fafbff',
              boxSizing: 'border-box'
            }}>
              <Typography className="modern-section-header" variant="subtitle2" sx={{ 
                color: '#667eea', 
                fontWeight: 'bold', 
                mb: { xs: 1, print: 0.5 },
                fontSize: { xs: '0.9rem', print: '9px' },
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                lineHeight: 1.1
              }}>
                Bill To
              </Typography>
              <Typography variant="body2" sx={{ 
                fontWeight: 'bold', 
                mb: 0.5, 
                color: '#333', 
                fontSize: { xs: '1rem', print: '8px' },
                lineHeight: 1.2
              }}>
                {invoice.partyName || 'N/A'}
              </Typography>
              {invoice.partyAddress && (
                <Typography variant="caption" sx={{ 
                  mb: 0.5, 
                  lineHeight: 1.2, 
                  color: '#666', 
                  display: 'block', 
                  fontSize: { xs: '0.85rem', print: '8px' }
                }}>
                  {invoice.partyAddress}
                </Typography>
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.5, print: 0.2 } }}>
                {invoice.partyPhone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip 
                      label="Ph" 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                      sx={{ 
                        height: { xs: '18px', print: '14px' }, 
                        fontSize: { xs: '0.7rem', print: '7px' }
                      }} 
                    />
                    <Typography variant="caption" sx={{ 
                      fontSize: { xs: '0.85rem', print: '8px' },
                      lineHeight: 1.2
                    }}>
                      {invoice.partyPhone}
                    </Typography>
                  </Box>
                )}
                {invoice.partyEmail && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip 
                      label="Email" 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                      sx={{ 
                        height: { xs: '18px', print: '14px' }, 
                        fontSize: { xs: '0.7rem', print: '7px' }
                      }} 
                    />
                    <Typography variant="caption" sx={{ 
                      fontSize: { xs: '0.85rem', print: '8px' },
                      lineHeight: 1.2
                    }}>
                      {invoice.partyEmail}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* A4 Optimized Items Table */}
        <Box sx={{ mb: { xs: 2, print: 1 } }} className="no-page-break">
          <Typography className="modern-section-header" variant="subtitle2" sx={{ 
            color: '#667eea', 
            fontWeight: 'bold', 
            mb: { xs: 1, print: 0.5 },
            fontSize: { xs: '0.9rem', print: '9px' },
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            lineHeight: 1.1
          }}>
            Invoice Items
          </Typography>
          <TableContainer component={Paper} className="modern-table" sx={{ 
            borderRadius: 1,
            overflow: 'hidden',
            boxShadow: { xs: '0 2px 8px rgba(0,0,0,0.1)', print: 'none' },
            width: '100%',
            '& .MuiTable-root': {
              tableLayout: 'fixed',
              width: '100%'
            }
          }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ 
                    bgcolor: '#667eea', 
                    color: 'white', 
                    fontWeight: 'bold',
                    fontSize: { xs: '0.9rem', print: '9px' },
                    p: { xs: 1, print: 0.4 },
                    width: '5%',
                    lineHeight: 1.3
                  }}>
                    #
                  </TableCell>
                  <TableCell sx={{ 
                    bgcolor: '#667eea', 
                    color: 'white', 
                    fontWeight: 'bold',
                    fontSize: { xs: '0.9rem', print: '9px' },
                    p: { xs: 1, print: 0.4 },
                    width: '45%',
                    lineHeight: 1.3
                  }}>
                    Description
                  </TableCell>
                  <TableCell align="center" sx={{ 
                    bgcolor: '#667eea', 
                    color: 'white', 
                    fontWeight: 'bold',
                    fontSize: { xs: '0.9rem', print: '9px' },
                    p: { xs: 1, print: 0.4 },
                    width: '12%',
                    lineHeight: 1.3
                  }}>
                    Qty
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    bgcolor: '#667eea', 
                    color: 'white', 
                    fontWeight: 'bold',
                    fontSize: { xs: '0.9rem', print: '9px' },
                    p: { xs: 1, print: 0.4 },
                    width: '15%',
                    lineHeight: 1.3
                  }}>
                    Rate
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    bgcolor: '#667eea', 
                    color: 'white', 
                    fontWeight: 'bold',
                    fontSize: { xs: '0.9rem', print: '9px' },
                    p: { xs: 1, print: 0.4 },
                    width: '8%',
                    lineHeight: 1.3
                  }}>
                    Disc
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    bgcolor: '#667eea', 
                    color: 'white', 
                    fontWeight: 'bold',
                    fontSize: { xs: '0.9rem', print: '9px' },
                    p: { xs: 1, print: 0.4 },
                    width: '15%',
                    lineHeight: 1.3
                  }}>
                    Amount
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.items?.map((item, index) => (
                  <TableRow key={index} sx={{ 
                    '&:nth-of-type(even)': { bgcolor: '#f8f9ff' },
                    '&:hover': { bgcolor: '#e8f2ff' }
                  }}>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      color: '#667eea', 
                      p: { xs: 1, print: 0.4 }, 
                      fontSize: { xs: '0.9rem', print: '9px' },
                      lineHeight: 1.3
                    }}>
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ p: { xs: 1, print: 0.4 } }}>
                      <Typography variant="caption" sx={{ 
                        fontWeight: 'medium', 
                        fontSize: { xs: '0.9rem', print: '9px' }, 
                        lineHeight: 1.3,
                        display: 'block'
                      }}>
                        {item.name}
                      </Typography>
                      {item.description && (
                        <Typography variant="caption" sx={{ 
                          color: '#666', 
                          display: 'block', 
                          fontSize: { xs: '0.8rem', print: '8px' },
                          lineHeight: 1.3,
                          mt: 0.3
                        }}>
                          {item.description.length > 50 ? item.description.substring(0, 50) + '...' : item.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ 
                      fontWeight: 'medium', 
                      p: { xs: 1, print: 0.4 }, 
                      fontSize: { xs: '0.9rem', print: '9px' },
                      lineHeight: 1.3
                    }}>
                      {item.quantity} {item.unitOfMeasurement || 'PCS'}
                    </TableCell>
                    <TableCell align="right" sx={{ 
                      fontWeight: 'medium', 
                      p: { xs: 1, print: 0.4 }, 
                      fontSize: { xs: '0.9rem', print: '9px' },
                      lineHeight: 1.3
                    }}>
                      {formatCurrency(item.price)}
                    </TableCell>
                    <TableCell align="right" sx={{ p: { xs: 1, print: 0.4 } }}>
                      {item.discount > 0 ? (
                        <Chip 
                          label={`${item.discount}%`} 
                          size="small" 
                          color="secondary" 
                          variant="outlined"
                          sx={{ 
                            height: { xs: '20px', print: '16px' }, 
                            fontSize: { xs: '0.8rem', print: '8px' }
                          }}
                        />
                      ) : (
                        <Typography variant="caption" sx={{ 
                          fontSize: { xs: '0.8rem', print: '8px' },
                          lineHeight: 1.3
                        }}>
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ 
                      fontWeight: 'bold', 
                      fontSize: { xs: '0.95rem', print: '9px' }, 
                      p: { xs: 1, print: 0.4 },
                      lineHeight: 1.3
                    }}>
                      {formatCurrency(item.totalAmount || item.finalPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* A4 Optimized Summary Section */}
        <Grid container spacing={{ xs: 2, print: 1 }} className="modern-summary-section no-page-break" sx={{ mb: { xs: 2, print: 1 } }}>
          {/* Amount in Words */}
          <Grid item xs={7}>
            <Box sx={{ 
              border: '1px solid #e0e7ff', 
              borderRadius: 1, 
              p: { xs: 1.5, print: 1 },
              bgcolor: '#fafbff',
              height: '100%',
              minHeight: { xs: 'auto', print: '15mm' },
              boxSizing: 'border-box'
            }}>
              <Typography className="modern-section-header" variant="subtitle2" sx={{ 
                color: '#667eea', 
                fontWeight: 'bold', 
                mb: { xs: 1, print: 0.5 },
                fontSize: { xs: '0.9rem', print: '9px' },
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                lineHeight: 1.1
              }}>
                Amount in Words
              </Typography>
              <Typography variant="caption" sx={{ 
                fontStyle: 'italic', 
                lineHeight: 1.2,
                fontSize: { xs: '0.85rem', print: '8px' },
                color: '#333',
                display: 'block'
              }}>
                {numberToWords(invoice.totalAmount || invoice.total || 0)}
              </Typography>
            </Box>
          </Grid>

          {/* Invoice Summary */}
          <Grid item xs={5}>
            <Box className="modern-total" sx={{ 
              bgcolor: '#e8f2ff', 
              border: '1px solid #667eea', 
              borderRadius: 1, 
              p: { xs: 1.5, print: 1 },
              minHeight: { xs: 'auto', print: '15mm' },
              boxSizing: 'border-box'
            }}>
              <Typography className="modern-section-header" variant="subtitle2" sx={{ 
                color: '#667eea', 
                fontWeight: 'bold', 
                mb: { xs: 1, print: 0.5 },
                fontSize: { xs: '0.9rem', print: '9px' },
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                lineHeight: 1.1
              }}>
                Summary
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: { xs: 0.8, print: 0.3 } }}>
                <Typography variant="caption" sx={{ 
                  fontSize: { xs: '0.8rem', print: '8px' },
                  lineHeight: 1.2
                }}>
                  Subtotal:
                </Typography>
                <Typography variant="caption" sx={{ 
                  fontWeight: 'medium', 
                  fontSize: { xs: '0.8rem', print: '8px' },
                  lineHeight: 1.2
                }}>
                  {formatCurrency(invoice.subtotal)}
                </Typography>
              </Box>
              
              {(invoice.totalDiscount || invoice.discount || 0) > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: { xs: 0.8, print: 0.3 } }}>
                  <Typography variant="caption" sx={{ 
                    fontSize: { xs: '0.8rem', print: '8px' },
                    lineHeight: 1.2
                  }}>
                    Discount:
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: '#d32f2f', 
                    fontWeight: 'medium', 
                    fontSize: { xs: '0.8rem', print: '8px' },
                    lineHeight: 1.2
                  }}>
                    -{formatCurrency(invoice.totalDiscount || invoice.discount)}
                  </Typography>
                </Box>
              )}
              
              <Divider sx={{ my: { xs: 0.8, print: 0.3 }, borderColor: '#667eea' }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ 
                  fontWeight: 'bold', 
                  color: '#667eea', 
                  fontSize: { xs: '0.9rem', print: '9px' },
                  lineHeight: 1.2
                }}>
                  Total:
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 'bold', 
                  color: '#667eea', 
                  fontSize: { xs: '0.9rem', print: '9px' },
                  lineHeight: 1.2
                }}>
                  {formatCurrency(invoice.totalAmount || invoice.total)}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* A4 Optimized Notes Section */}
        {invoice.notes && (
          <Box sx={{ mb: { xs: 2, print: 1 } }}>
            <Box className="modern-notes" sx={{ 
              bgcolor: '#fff8e1', 
              border: '1px solid #ffc107', 
              borderRadius: 1, 
              p: { xs: 1.5, print: 1 }
            }}>
              <Typography className="modern-section-header" variant="subtitle2" sx={{ 
                color: '#f57c00', 
                fontWeight: 'bold', 
                mb: { xs: 1, print: 0.5 },
                fontSize: { xs: '0.9rem', print: '9px' },
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                lineHeight: 1.1
              }}>
                Notes
              </Typography>
              <Typography variant="caption" sx={{ 
                whiteSpace: 'pre-wrap', 
                lineHeight: 1.2,
                color: '#333',
                fontSize: { xs: '0.85rem', print: '8px' },
                display: 'block'
              }}>
                {invoice.notes}
              </Typography>
            </Box>
          </Box>
        )}

        {/* A4 Optimized Footer */}
        <Box className="modern-footer no-page-break" sx={{ 
          borderTop: '2px solid #667eea', 
          pt: { xs: 2, print: 1 }, 
          mt: { xs: 2, print: 1 },
          minHeight: { xs: 'auto', print: '15mm' }
        }}>
          <Grid container alignItems="center" justifyContent="space-between" spacing={{ xs: 2, print: 1 }}>
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ 
                fontWeight: 'bold', 
                color: '#667eea', 
                fontSize: { xs: '0.8rem', print: '8px' },
                lineHeight: 1.2,
                display: 'block',
                mb: 1
              }}>
                Customer Signature
              </Typography>
              <Box sx={{ 
                borderBottom: '1px solid #667eea', 
                width: { xs: '140px', print: '120px' }, 
                mt: { xs: 1.5, print: 1 }, 
                mb: { xs: 1, print: 0.5 }
              }} />
              <Typography variant="caption" sx={{ 
                color: '#666', 
                fontSize: { xs: '0.75rem', print: '7px' },
                lineHeight: 1.2
              }}>
                Date: ___________
              </Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ 
                fontWeight: 'bold', 
                color: '#667eea', 
                fontSize: { xs: '0.8rem', print: '8px' },
                lineHeight: 1.2,
                display: 'block',
                mb: 0.5
              }}>
                Authorized Signatory
              </Typography>
              <Typography variant="caption" sx={{ 
                color: '#666', 
                display: 'block', 
                fontSize: { xs: '0.75rem', print: '7px' },
                lineHeight: 1.2,
                mb: 1
              }}>
                For [Company Name]
              </Typography>
              <Box sx={{ 
                borderBottom: '1px solid #667eea', 
                width: { xs: '140px', print: '120px' }, 
                mt: { xs: 1.5, print: 1 },
                ml: 'auto'
              }} />
            </Grid>
          </Grid>
        </Box>

        {/* A4 Optimized Watermark */}
        {settings?.showWatermark && (
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-45deg)',
            fontSize: { xs: '6rem', print: '4rem' },
            color: 'rgba(102, 126, 234, 0.05)',
            fontWeight: 'bold',
            zIndex: 0,
            pointerEvents: 'none',
            userSelect: 'none'
          }}>
            INVOICE
          </Box>
        )}
      </Box>
    </>
  );
}