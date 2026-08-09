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
  Grid,
  Divider
} from '@mui/material';
import { Invoice } from '@/types/invoice';
import { GstCalculator } from '@/services/gstService';
import CompanyInfoDisplay from '@/components/CompanyInfoDisplay';
import { CompanyInfo } from '@/types/company';

interface GstInvoiceViewProps {
  invoice: Invoice;
  companyInfo?: CompanyInfo | null;
}

export default function GstInvoiceView({ invoice, companyInfo }: GstInvoiceViewProps) {
  const isInterState = invoice.companyStateCode !== invoice.partyStateCode;

  // Helper to safely format currency
  const formatCurrency = (value: number | undefined | null): string => {
    return `₹${(value ?? 0).toFixed(2)}`;
  };

  // Helper to safely format date
  const formatDate = (dateInput: any): string => {
    if (!dateInput) return 'N/A';
    try {
      if (dateInput.toDate) {
        return new Date(dateInput.toDate()).toLocaleDateString();
      }
      const date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
    } catch (e) { /* ignore */ }
    return String(dateInput);
  };

  // Convert number to words for amount
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

  const printStyles = `
    @page {
      size: A4 portrait;
      margin: 0.4in;
    }
    
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      body { 
        margin: 0; 
        padding: 0;
        font-family: 'Arial', 'Helvetica', sans-serif;
        font-size: 9px;
        line-height: 1.1;
        color: #000;
        background: white;
      }
      
      .no-print { display: none !important; }
      
      .print-page { 
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100vh;
        max-height: 100vh;
        display: flex;
        flex-direction: column;
        page-break-inside: avoid;
        overflow: hidden;
      }
      
      .gst-modern-header {
        background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%) !important;
        color: white !important;
        margin-bottom: 3px;
        border-radius: 3px;
        page-break-inside: avoid;
        flex-shrink: 0;
      }
      
      .company-customer-gst {
        border: 1px solid #ccc;
        border-radius: 2px;
        margin-bottom: 3px;
        background: #f9f9f9 !important;
        page-break-inside: avoid;
        flex-shrink: 0;
      }
      
      .gst-items-section {
        flex: 1;
        margin-bottom: 3px;
        min-height: 0;
        overflow: hidden;
      }
      
      table { 
        border-collapse: collapse;
        width: 100%;
        font-size: 7px;
        margin: 0;
      }
      
      th {
        background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%) !important;
        color: white !important;
        border: none;
        padding: 2px 1px;
        font-weight: 600;
        font-size: 6px;
      }
      
      td {
        border: 1px solid #ccc;
        padding: 2px 1px;
        font-size: 6px;
        vertical-align: top;
      }
      
      .gst-summary-grid {
        margin-top: auto;
        flex-shrink: 0;
        page-break-inside: avoid;
      }
      
      .gst-footer {
        border-top: 2px solid #1976d2;
        margin-top: 3px;
        padding-top: 3px;
        flex-shrink: 0;
        page-break-inside: avoid;
      }
      
      /* Ensure single page */
      .print-page > * {
        page-break-inside: avoid;
      }
      
      /* Ultra compact spacing for single page */
      .MuiBox-root {
        margin-bottom: 1px !important;
      }
      
      .MuiGrid-item {
        padding: 1px !important;
      }
      
      .MuiTypography-root {
        margin-bottom: 0.5px !important;
      }
    }
    
    @media screen {
      .print-page {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border-radius: 6px;
        overflow: hidden;
        max-width: 210mm;
        min-height: 297mm;
      }
    }
  `;

  return (
    <>
      <style>{printStyles}</style>
      <Box className="print-page" sx={{ maxWidth: '210mm', margin: '0 auto', p: 0.6, bgcolor: 'white' }}>
        {/* Ultra Compact GST Header */}
        <Box className="gst-modern-header" sx={{ 
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', 
          color: 'white', 
          p: 0.6, 
          mb: 0.4,
          borderRadius: 1
        }}>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item>
              <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                TAX INVOICE
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.65rem' }}>
                {isInterState ? 'Inter-State Supply' : 'Intra-State Supply'}
              </Typography>
            </Grid>
            <Grid item>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.1, fontSize: '0.9rem' }}>
                  {invoice.invoiceNumber || 'N/A'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.1, fontSize: '0.7rem' }}>
                  {formatDate(invoice.date)}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.6rem' }}>
                  Place: {GstCalculator.getStateName(invoice.partyStateCode)} ({invoice.partyStateCode})
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Ultra Compact Company and Customer Details */}
        <Box className="company-customer-gst" sx={{ 
          border: '1px solid #e0e0e0', 
          borderRadius: 1, 
          p: 0.6, 
          mb: 0.4,
          bgcolor: '#fafafa'
        }}>
          <Grid container spacing={0.5}>
            {/* Company Details */}
            <Grid item xs={6}>
              <Box sx={{ pr: 0.5, borderRight: '1px solid #e0e0e0' }}>
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 'bold', 
                  color: '#1976d2', 
                  mb: 0.2,
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.2px'
                }}>
                  From (Supplier)
                </Typography>
                <CompanyInfoDisplay variant="gst-compact" />
              </Box>
            </Grid>
            
            {/* Customer Details */}
            <Grid item xs={6}>
              <Box sx={{ pl: 0.5 }}>
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 'bold', 
                  color: '#1976d2', 
                  mb: 0.2,
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.2px'
                }}>
                  Bill To (Recipient)
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.1, fontSize: '0.7rem' }}>
                  {invoice.partyName || 'N/A'}
                </Typography>
                {invoice.partyAddress && (
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.1, lineHeight: 1.0, fontSize: '0.6rem' }}>
                    {invoice.partyAddress}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 0.3, flexWrap: 'wrap', mb: 0.1 }}>
                  {invoice.partyPhone && (
                    <Typography variant="caption" sx={{ fontSize: '0.55rem' }}>
                      📞 {invoice.partyPhone}
                    </Typography>
                  )}
                  {invoice.partyEmail && (
                    <Typography variant="caption" sx={{ fontSize: '0.55rem' }}>
                      ✉️ {invoice.partyEmail}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 0.3, flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ 
                    fontWeight: 'bold', 
                    color: '#1976d2',
                    fontSize: '0.55rem'
                  }}>
                    GSTIN: {invoice.partyGstin || 'Unregistered'}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.55rem' }}>
                    State: {invoice.partyStateCode}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Enhanced GST Items Table */}
        <Box className="gst-items-section" sx={{ mb: 0.4 }}>
          <TableContainer sx={{ 
            border: '2px solid #1976d2', 
            borderRadius: 1,
            boxShadow: '0 2px 8px rgba(25,118,210,0.15)',
            overflow: 'hidden'
          }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ 
                  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)'
                }}>
                  <TableCell sx={{ 
                    color: 'white', 
                    fontWeight: 700, 
                    width: '3%', 
                    p: 0.3, 
                    fontSize: '0.6rem',
                    textAlign: 'center',
                    borderRight: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    S.No
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'white', 
                    fontWeight: 700, 
                    width: '25%', 
                    p: 0.3, 
                    fontSize: '0.6rem',
                    borderRight: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>Description of Goods/Services</Typography>
                      <Typography sx={{ fontSize: '0.5rem', opacity: 0.9 }}>Product Name & Details</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'white', 
                    fontWeight: 700, 
                    width: '6%', 
                    p: 0.3, 
                    fontSize: '0.6rem',
                    textAlign: 'center',
                    borderRight: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>HSN/SAC</Typography>
                      <Typography sx={{ fontSize: '0.5rem', opacity: 0.9 }}>Code</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'white', 
                    fontWeight: 700, 
                    width: '6%', 
                    p: 0.3, 
                    fontSize: '0.6rem',
                    textAlign: 'center',
                    borderRight: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>Qty</Typography>
                      <Typography sx={{ fontSize: '0.5rem', opacity: 0.9 }}>Units</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'white', 
                    fontWeight: 700, 
                    width: '8%', 
                    p: 0.3, 
                    fontSize: '0.6rem',
                    textAlign: 'right',
                    borderRight: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>Unit Rate</Typography>
                      <Typography sx={{ fontSize: '0.5rem', opacity: 0.9 }}>₹ per unit</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'white', 
                    fontWeight: 700, 
                    width: '6%', 
                    p: 0.3, 
                    fontSize: '0.6rem',
                    textAlign: 'right',
                    borderRight: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>Disc</Typography>
                      <Typography sx={{ fontSize: '0.5rem', opacity: 0.9 }}>%</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'white', 
                    fontWeight: 700, 
                    width: '10%', 
                    p: 0.3, 
                    fontSize: '0.6rem',
                    textAlign: 'right',
                    borderRight: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>Taxable Value</Typography>
                      <Typography sx={{ fontSize: '0.5rem', opacity: 0.9 }}>After Discount</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'white', 
                    fontWeight: 700, 
                    width: '5%', 
                    p: 0.3, 
                    fontSize: '0.6rem',
                    textAlign: 'center',
                    borderRight: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>GST</Typography>
                      <Typography sx={{ fontSize: '0.5rem', opacity: 0.9 }}>Rate %</Typography>
                    </Box>
                  </TableCell>
                  {isInterState ? (
                    <TableCell sx={{ 
                      color: 'white', 
                      fontWeight: 700, 
                      width: '8%', 
                      p: 0.3, 
                      fontSize: '0.6rem',
                      textAlign: 'right',
                      borderRight: '1px solid rgba(255,255,255,0.2)'
                    }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>IGST</Typography>
                        <Typography sx={{ fontSize: '0.5rem', opacity: 0.9 }}>Amount</Typography>
                      </Box>
                    </TableCell>
                  ) : (
                    <>
                      <TableCell sx={{ 
                        color: 'white', 
                        fontWeight: 700, 
                        width: '6%', 
                        p: 0.3, 
                        fontSize: '0.6rem',
                        textAlign: 'right',
                        borderRight: '1px solid rgba(255,255,255,0.2)'
                      }}>
                        <Box>
                          <Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>CGST</Typography>
                          <Typography sx={{ fontSize: '0.5rem', opacity: 0.9 }}>Amount</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ 
                        color: 'white', 
                        fontWeight: 700, 
                        width: '6%', 
                        p: 0.3, 
                        fontSize: '0.6rem',
                        textAlign: 'right',
                        borderRight: '1px solid rgba(255,255,255,0.2)'
                      }}>
                        <Box>
                          <Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>SGST</Typography>
                          <Typography sx={{ fontSize: '0.5rem', opacity: 0.9 }}>Amount</Typography>
                        </Box>
                      </TableCell>
                    </>
                  )}
                  <TableCell sx={{ 
                    color: 'white', 
                    fontWeight: 700, 
                    width: '12%', 
                    p: 0.3, 
                    fontSize: '0.6rem',
                    textAlign: 'right'
                  }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>Total Amount</Typography>
                      <Typography sx={{ fontSize: '0.5rem', opacity: 0.9 }}>Inc. GST</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.items?.map((item, index) => {
                  // Calculate values if not present
                  const baseAmount = item.price * item.quantity;
                  const discountAmount = (baseAmount * (item.discount || 0)) / 100;
                  const taxableAmount = item.taxableAmount || (baseAmount - discountAmount);
                  const gstRate = item.gstRate || 0;
                  const gstAmount = (taxableAmount * gstRate) / 100;
                  const cgstAmount = item.cgstAmount || (isInterState ? 0 : gstAmount / 2);
                  const sgstAmount = item.sgstAmount || (isInterState ? 0 : gstAmount / 2);
                  const igstAmount = item.igstAmount || (isInterState ? gstAmount : 0);
                  const totalAmount = item.totalAmount || (taxableAmount + gstAmount);

                  return (
                    <TableRow 
                      key={index} 
                      sx={{ 
                        '&:nth-of-type(odd)': { bgcolor: '#f8f9fa' },
                        '&:nth-of-type(even)': { bgcolor: '#ffffff' },
                        '&:hover': { bgcolor: '#e3f2fd' },
                        borderBottom: '1px solid #e0e0e0'
                      }}
                    >
                      <TableCell sx={{ 
                        p: 0.3, 
                        fontSize: '0.6rem', 
                        textAlign: 'center',
                        fontWeight: 600,
                        color: '#1976d2',
                        borderRight: '1px solid #e0e0e0'
                      }}>
                        {index + 1}
                      </TableCell>
                      
                      <TableCell sx={{ 
                        p: 0.3, 
                        fontSize: '0.6rem',
                        borderRight: '1px solid #e0e0e0'
                      }}>
                        <Box>
                          <Typography sx={{ 
                            fontSize: '0.6rem', 
                            fontWeight: 600, 
                            color: '#333',
                            lineHeight: 1.1,
                            mb: 0.1
                          }}>
                            {item.name}
                          </Typography>
                          {item.category && (
                            <Typography sx={{ 
                              fontSize: '0.5rem', 
                              color: '#666',
                              fontStyle: 'italic'
                            }}>
                              Category: {item.category}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      
                      <TableCell sx={{ 
                        p: 0.3, 
                        fontSize: '0.6rem', 
                        textAlign: 'center',
                        fontWeight: 500,
                        color: '#1976d2',
                        borderRight: '1px solid #e0e0e0'
                      }}>
                        {item.hsnCode || '-'}
                      </TableCell>
                      
                      <TableCell sx={{ 
                        p: 0.3, 
                        fontSize: '0.6rem', 
                        textAlign: 'center',
                        fontWeight: 600,
                        borderRight: '1px solid #e0e0e0'
                      }}>
                        <Box>
                          <Typography sx={{ fontSize: '0.6rem', fontWeight: 600 }}>
                            {item.quantity}
                          </Typography>
                          <Typography sx={{ fontSize: '0.5rem', color: '#666' }}>
                            Nos
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell sx={{ 
                        p: 0.3, 
                        fontSize: '0.6rem', 
                        textAlign: 'right',
                        fontWeight: 500,
                        borderRight: '1px solid #e0e0e0'
                      }}>
                        {formatCurrency(item.price)}
                      </TableCell>
                      
                      <TableCell sx={{ 
                        p: 0.3, 
                        fontSize: '0.6rem', 
                        textAlign: 'right',
                        borderRight: '1px solid #e0e0e0'
                      }}>
                        <Box>
                          <Typography sx={{ 
                            fontSize: '0.6rem', 
                            color: item.discount > 0 ? '#d32f2f' : '#666',
                            fontWeight: item.discount > 0 ? 600 : 400
                          }}>
                            {item.discount > 0 ? `${item.discount}%` : '-'}
                          </Typography>
                          {item.discount > 0 && (
                            <Typography sx={{ fontSize: '0.5rem', color: '#d32f2f' }}>
                              -{formatCurrency(discountAmount)}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      
                      <TableCell sx={{ 
                        p: 0.3, 
                        fontSize: '0.6rem', 
                        textAlign: 'right',
                        fontWeight: 600,
                        color: '#1976d2',
                        borderRight: '1px solid #e0e0e0'
                      }}>
                        {formatCurrency(taxableAmount)}
                      </TableCell>
                      
                      <TableCell sx={{ 
                        p: 0.3, 
                        fontSize: '0.6rem', 
                        textAlign: 'center',
                        fontWeight: 600,
                        color: gstRate > 0 ? '#1976d2' : '#666',
                        borderRight: '1px solid #e0e0e0'
                      }}>
                        <Box>
                          <Typography sx={{ 
                            fontSize: '0.6rem', 
                            fontWeight: 600,
                            color: gstRate > 0 ? '#1976d2' : '#666'
                          }}>
                            {gstRate}%
                          </Typography>
                          {gstRate > 0 && (
                            <Typography sx={{ fontSize: '0.5rem', color: '#666' }}>
                              {formatCurrency(gstAmount)}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      
                      {isInterState ? (
                        <TableCell sx={{ 
                          p: 0.3, 
                          fontSize: '0.6rem', 
                          textAlign: 'right',
                          fontWeight: 500,
                          color: '#1976d2',
                          borderRight: '1px solid #e0e0e0'
                        }}>
                          <Box>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 600 }}>
                              {formatCurrency(igstAmount)}
                            </Typography>
                            {gstRate > 0 && (
                              <Typography sx={{ fontSize: '0.5rem', color: '#666' }}>
                                @{gstRate}%
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                      ) : (
                        <>
                          <TableCell sx={{ 
                            p: 0.3, 
                            fontSize: '0.6rem', 
                            textAlign: 'right',
                            fontWeight: 500,
                            color: '#1976d2',
                            borderRight: '1px solid #e0e0e0'
                          }}>
                            <Box>
                              <Typography sx={{ fontSize: '0.6rem', fontWeight: 600 }}>
                                {formatCurrency(cgstAmount)}
                              </Typography>
                              {gstRate > 0 && (
                                <Typography sx={{ fontSize: '0.5rem', color: '#666' }}>
                                  @{gstRate/2}%
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ 
                            p: 0.3, 
                            fontSize: '0.6rem', 
                            textAlign: 'right',
                            fontWeight: 500,
                            color: '#1976d2',
                            borderRight: '1px solid #e0e0e0'
                          }}>
                            <Box>
                              <Typography sx={{ fontSize: '0.6rem', fontWeight: 600 }}>
                                {formatCurrency(sgstAmount)}
                              </Typography>
                              {gstRate > 0 && (
                                <Typography sx={{ fontSize: '0.5rem', color: '#666' }}>
                                  @{gstRate/2}%
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                        </>
                      )}
                      
                      <TableCell sx={{ 
                        p: 0.3, 
                        fontSize: '0.6rem', 
                        textAlign: 'right',
                        fontWeight: 700,
                        color: '#1976d2',
                        bgcolor: 'rgba(25, 118, 210, 0.05)'
                      }}>
                        <Box>
                          <Typography sx={{ 
                            fontSize: '0.65rem', 
                            fontWeight: 700,
                            color: '#1976d2'
                          }}>
                            {formatCurrency(totalAmount)}
                          </Typography>
                          <Typography sx={{ 
                            fontSize: '0.5rem', 
                            color: '#666',
                            fontStyle: 'italic'
                          }}>
                            All inclusive
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {/* Totals Row */}
                <TableRow sx={{ 
                  bgcolor: 'rgba(25, 118, 210, 0.1)',
                  borderTop: '2px solid #1976d2'
                }}>
                  <TableCell 
                    colSpan={isInterState ? 7 : 8} 
                    sx={{ 
                      p: 0.4, 
                      fontSize: '0.65rem', 
                      fontWeight: 700,
                      textAlign: 'right',
                      color: '#1976d2',
                      borderRight: '1px solid #1976d2'
                    }}
                  >
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700 }}>
                      TOTAL:
                    </Typography>
                  </TableCell>
                  
                  {isInterState ? (
                    <TableCell sx={{ 
                      p: 0.4, 
                      fontSize: '0.65rem', 
                      textAlign: 'right',
                      fontWeight: 700,
                      color: '#1976d2',
                      borderRight: '1px solid #1976d2'
                    }}>
                      {formatCurrency(invoice.totalIgst || 0)}
                    </TableCell>
                  ) : (
                    <>
                      <TableCell sx={{ 
                        p: 0.4, 
                        fontSize: '0.65rem', 
                        textAlign: 'right',
                        fontWeight: 700,
                        color: '#1976d2',
                        borderRight: '1px solid #1976d2'
                      }}>
                        {formatCurrency(invoice.totalCgst || 0)}
                      </TableCell>
                      <TableCell sx={{ 
                        p: 0.4, 
                        fontSize: '0.65rem', 
                        textAlign: 'right',
                        fontWeight: 700,
                        color: '#1976d2',
                        borderRight: '1px solid #1976d2'
                      }}>
                        {formatCurrency(invoice.totalSgst || 0)}
                      </TableCell>
                    </>
                  )}
                  
                  <TableCell sx={{ 
                    p: 0.4, 
                    fontSize: '0.7rem', 
                    textAlign: 'right',
                    fontWeight: 700,
                    color: '#1976d2',
                    bgcolor: 'rgba(25, 118, 210, 0.15)'
                  }}>
                    <Typography sx={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 700,
                      color: '#1976d2'
                    }}>
                      {formatCurrency(invoice.grandTotal || invoice.total)}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Extremely Compact Summary Grid */}
        <Grid container spacing={0.4} className="gst-summary-grid" sx={{ mb: 0.4 }}>
          {/* Tax Breakup */}
          <Grid item xs={4.5}>
            <Box sx={{ 
              border: '1px solid #ddd', 
              borderRadius: 1, 
              p: 0.5, 
              height: '100%',
              bgcolor: '#f8f9fa'
            }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 'bold', 
                mb: 0.3, 
                color: '#1976d2',
                fontSize: '0.6rem'
              }}>
                TAX BREAKUP
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ 
                        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                        color: 'white',
                        fontWeight: 600, 
                        p: 0.2,
                        fontSize: '0.55rem'
                      }}>Rate</TableCell>
                      <TableCell sx={{ 
                        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                        color: 'white',
                        fontWeight: 600, 
                        p: 0.2,
                        fontSize: '0.55rem'
                      }} align="right">Taxable</TableCell>
                      {isInterState ? (
                        <TableCell sx={{ 
                          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                          color: 'white',
                          fontWeight: 600, 
                          p: 0.2,
                          fontSize: '0.55rem'
                        }} align="right">IGST</TableCell>
                      ) : (
                        <>
                          <TableCell sx={{ 
                            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                            color: 'white',
                            fontWeight: 600, 
                            p: 0.2,
                            fontSize: '0.55rem'
                          }} align="right">CGST</TableCell>
                          <TableCell sx={{ 
                            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                            color: 'white',
                            fontWeight: 600, 
                            p: 0.2,
                            fontSize: '0.55rem'
                          }} align="right">SGST</TableCell>
                        </>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(
                      invoice.items?.reduce((acc, item) => {
                        const rate = item.gstRate || 0;
                        if (!acc[rate]) {
                          acc[rate] = {
                            taxableAmount: 0,
                            cgstAmount: 0,
                            sgstAmount: 0,
                            igstAmount: 0,
                            totalTaxAmount: 0
                          };
                        }
                        acc[rate].taxableAmount += item.taxableAmount || 0;
                        acc[rate].cgstAmount += item.cgstAmount || 0;
                        acc[rate].sgstAmount += item.sgstAmount || 0;
                        acc[rate].igstAmount += item.igstAmount || 0;
                        acc[rate].totalTaxAmount += item.totalTaxAmount || 0;
                        return acc;
                      }, {} as Record<number, any>) || {}
                    ).map(([rate, amounts]) => (
                      <TableRow key={rate}>
                        <TableCell sx={{ p: 0.2, fontSize: '0.55rem' }}>{rate}%</TableCell>
                        <TableCell sx={{ p: 0.2, fontSize: '0.55rem' }} align="right">{formatCurrency(amounts.taxableAmount)}</TableCell>
                        {isInterState ? (
                          <TableCell sx={{ p: 0.2, fontSize: '0.55rem' }} align="right">{formatCurrency(amounts.igstAmount)}</TableCell>
                        ) : (
                          <>
                            <TableCell sx={{ p: 0.2, fontSize: '0.55rem' }} align="right">{formatCurrency(amounts.cgstAmount)}</TableCell>
                            <TableCell sx={{ p: 0.2, fontSize: '0.55rem' }} align="right">{formatCurrency(amounts.sgstAmount)}</TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Grid>

          {/* Invoice Summary */}
          <Grid item xs={3}>
            <Box sx={{ 
              border: '1px solid #ddd', 
              borderRadius: 1, 
              p: 0.5,
              bgcolor: '#f8f9fa'
            }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 'bold', 
                mb: 0.3, 
                color: '#1976d2',
                fontSize: '0.6rem'
              }}>
                SUMMARY
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.1 }}>
                <Typography variant="caption" sx={{ fontSize: '0.55rem' }}>Taxable:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.55rem' }}>
                  {formatCurrency(invoice.totalTaxableAmount)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.1 }}>
                <Typography variant="caption" sx={{ fontSize: '0.55rem' }}>Tax:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.55rem' }}>
                  {formatCurrency(invoice.totalTaxAmount)}
                </Typography>
              </Box>
              {(invoice.transportCharges || 0) > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.1 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.55rem' }}>Transport:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.55rem' }}>
                    {formatCurrency(invoice.transportCharges)}
                  </Typography>
                </Box>
              )}
              <Divider sx={{ my: 0.2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}>Total:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: '0.65rem' }}>
                  {formatCurrency(invoice.grandTotal || invoice.total)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Amount in Words */}
          <Grid item xs={4.5}>
            <Box sx={{ 
              border: '1px solid #ddd', 
              borderRadius: 1, 
              p: 0.5, 
              height: '100%',
              bgcolor: '#e3f2fd'
            }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 'bold', 
                mb: 0.3, 
                color: '#1976d2',
                fontSize: '0.6rem'
              }}>
                AMOUNT IN WORDS
              </Typography>
              <Typography variant="caption" sx={{ 
                fontStyle: 'italic', 
                lineHeight: 1.0,
                display: 'block',
                fontSize: '0.55rem'
              }}>
                {numberToWords(invoice.grandTotal || invoice.total || 0)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Compact Notes and Terms */}
        {(invoice.notes || true) && (
          <Grid container spacing={0.4} sx={{ mb: 0.4 }}>
            {/* Notes */}
            {invoice.notes && (
              <Grid item xs={6}>
                <Box sx={{ 
                  border: '1px solid #ddd', 
                  borderRadius: 1, 
                  p: 0.5,
                  bgcolor: '#fff3e0'
                }}>
                  <Typography variant="subtitle2" sx={{ 
                    fontWeight: 'bold', 
                    mb: 0.2, 
                    color: '#f57c00',
                    fontSize: '0.6rem'
                  }}>
                    NOTES
                  </Typography>
                  <Typography variant="caption" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.1, fontSize: '0.55rem' }}>
                    {invoice.notes}
                  </Typography>
                </Box>
              </Grid>
            )}

            {/* Terms */}
            <Grid item xs={invoice.notes ? 6 : 12}>
              <Box sx={{ 
                border: '1px solid #ddd', 
                borderRadius: 1, 
                p: 0.5,
                bgcolor: '#f3e5f5'
              }}>
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 'bold', 
                  mb: 0.2, 
                  color: '#7b1fa2',
                  fontSize: '0.6rem'
                }}>
                  TERMS & CONDITIONS
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.55rem', lineHeight: 1.0 }}>
                  1. Payment due within 30 days • 2. Interest @ 18% p.a. on overdue • 
                  3. Subject to local jurisdiction • 4. E. & O.E.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}

        {/* Extremely Compact Footer */}
        <Box className="gst-footer" sx={{ 
          borderTop: '2px solid #1976d2', 
          pt: 0.4, 
          mt: 0.4
        }}>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: '0.6rem' }}>
                Customer Signature: ________________________
              </Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: '0.6rem' }}>
                Authorized Signatory
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', fontSize: '0.55rem' }}>
                For [Company Name]
              </Typography>
            </Grid>
          </Grid>
          
          {/* Declaration */}
          <Box sx={{ mt: 0.3, p: 0.3, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ fontSize: '0.5rem', lineHeight: 1.0 }}>
              <strong>Declaration:</strong> We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. This is a computer generated invoice.
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center', mt: 0.2 }}>
            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.5rem' }}>
              Generated on {new Date().toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
}