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
  Paper
} from '@mui/material';
import { Invoice } from '@/types/invoice';
import CompanyInfoDisplay from '@/components/CompanyInfoDisplay';

interface SimpleInvoiceViewProps {
  invoice: Invoice;
}

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

const SimpleInvoiceView: React.FC<SimpleInvoiceViewProps> = ({ invoice }) => {
  const printStyles = `
    @page {
      size: A4 portrait;
      margin: 0.5in;
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
        font-size: 10px;
        line-height: 1.2;
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
      
      .modern-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        color: white !important;
        margin-bottom: 4px;
        border-radius: 4px;
        page-break-inside: avoid;
        flex-shrink: 0;
      }
      
      .company-customer-row {
        border: 1px solid #ccc;
        border-radius: 3px;
        margin-bottom: 4px;
        background: #f9f9f9 !important;
        page-break-inside: avoid;
        flex-shrink: 0;
      }
      
      .items-section {
        flex: 1;
        margin-bottom: 4px;
        min-height: 0;
        overflow: hidden;
      }
      
      table { 
        border-collapse: collapse;
        width: 100%;
        font-size: 9px;
        margin: 0;
      }
      
      th {
        background: #f0f0f0 !important;
        border: 1px solid #ccc;
        padding: 3px 2px;
        font-weight: 600;
        color: #000;
        font-size: 8px;
      }
      
      td {
        border: 1px solid #ccc;
        padding: 3px 2px;
        font-size: 8px;
        vertical-align: top;
      }
      
      .summary-grid {
        margin-top: auto;
        flex-shrink: 0;
        page-break-inside: avoid;
      }
      
      .amount-words {
        background: #f0f8ff !important;
        border-radius: 3px;
        font-style: italic;
      }
      
      .footer-section {
        border-top: 2px solid #667eea;
        margin-top: 4px;
        padding-top: 4px;
        flex-shrink: 0;
        page-break-inside: avoid;
      }
      
      /* Ensure single page */
      .print-page > * {
        page-break-inside: avoid;
      }
      
      /* Compact spacing for single page */
      .MuiBox-root {
        margin-bottom: 2px !important;
      }
      
      .MuiGrid-item {
        padding: 2px !important;
      }
      
      .MuiTypography-root {
        margin-bottom: 1px !important;
      }
    }
    
    @media screen {
      .print-page {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        overflow: hidden;
        max-width: 210mm;
        min-height: 297mm;
      }
    }
  `;

  return (
    <>
      <style>{printStyles}</style>
      <Box className="print-page" sx={{ maxWidth: '210mm', margin: '0 auto', p: 0.8, bgcolor: 'white' }}>
        {/* Compact Header */}
        <Box className="modern-header" sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white', 
          p: 0.8, 
          mb: 0.5,
          borderRadius: 1
        }}>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item>
              <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '1.4rem' }}>
                INVOICE
              </Typography>
            </Grid>
            <Grid item>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.2, fontSize: '1rem' }}>
                  {invoice.invoiceNumber || 'N/A'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.8rem' }}>
                  {formatDate(invoice.date)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Compact Company and Customer Details */}
        <Box className="company-customer-row" sx={{ 
          border: '1px solid #e0e0e0', 
          borderRadius: 1, 
          p: 0.8, 
          mb: 0.5,
          bgcolor: '#fafafa'
        }}>
          <Grid container spacing={1}>
            {/* Company Details */}
            <Grid item xs={6}>
              <Box sx={{ pr: 0.5, borderRight: '1px solid #e0e0e0' }}>
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 'bold', 
                  color: '#667eea', 
                  mb: 0.3,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px'
                }}>
                  From
                </Typography>
                <CompanyInfoDisplay variant="compact" />
              </Box>
            </Grid> 
            {/* Customer Details */}
            <Grid item xs={6} >
              <Box sx={{ pl: 0.5, textAlign: 'right' }}>
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 'bold', 
                  color: '#667eea', 
                  mb: 0.3,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                }}>
                  Bill To
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.2, fontSize: '0.8rem' }}>
                  {invoice.partyName || 'N/A'}
                </Typography>
                {invoice.partyAddress && (
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.2, lineHeight: 1.1, fontSize: '0.7rem' }}>
                    {invoice.partyAddress}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {invoice.partyPhone && (
                    <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                      📞 {invoice.partyPhone}
                    </Typography>
                  )}
                  {invoice.partyEmail && (
                    <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                      ✉️ {invoice.partyEmail}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Ultra Compact Items Table */}
        <Box className="items-section" sx={{ mb: 0.5 }}>
          <TableContainer sx={{ 
            border: '1px solid #dee2e6', 
            borderRadius: 1,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', width: '4%', p: 0.4, fontSize: '0.7rem' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '50%', p: 0.4, fontSize: '0.7rem' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '8%', p: 0.4, fontSize: '0.7rem' }} align="center">Qty</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '12%', p: 0.4, fontSize: '0.7rem' }} align="right">Rate</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '8%', p: 0.4, fontSize: '0.7rem' }} align="right">Disc%</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '18%', p: 0.4, fontSize: '0.7rem' }} align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.items?.map((item, index) => (
                  <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: '#f8f9fa' } }}>
                    <TableCell sx={{ p: 0.4, fontSize: '0.7rem' }}>{index + 1}</TableCell>
                    <TableCell sx={{ p: 0.4, fontWeight: 500, fontSize: '0.7rem' }}>{item.name}</TableCell>
                    <TableCell sx={{ p: 0.4, fontSize: '0.7rem' }} align="center">{item.quantity}</TableCell>
                    <TableCell sx={{ p: 0.4, fontSize: '0.7rem' }} align="right">{formatCurrency(item.price)}</TableCell>
                    <TableCell sx={{ p: 0.4, fontSize: '0.7rem' }} align="right">
                      {item.discount > 0 ? `${item.discount}%` : '-'}
                    </TableCell>
                    <TableCell sx={{ p: 0.4, fontWeight: 600, fontSize: '0.7rem' }} align="right">
                      {formatCurrency(item.finalPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Ultra Compact Summary Grid */}
        <Grid container spacing={0.5} className="summary-grid" sx={{ mb: 0.5 }}>
           {/* Amount in Words */}
          <Grid item xs={5}>
            <Box className="amount-words" sx={{ 
              border: '1px solid #dee2e6', 
              borderRadius: 1, 
              p: 0.6, 
              height: '100%',
              bgcolor: '#e3f2fd'
            }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 'bold', 
                mb: 0.3, 
                color: '#667eea',
                fontSize: '0.7rem'
              }}>
                AMOUNT IN WORDS
              </Typography>
              <Typography variant="caption" sx={{ 
                fontStyle: 'italic', 
                lineHeight: 1.1,
                display: 'block',
                fontSize: '0.65rem'
              }}>
                {numberToWords(invoice.total || 0)}
              </Typography>
            </Box>
          </Grid>

          {/* Invoice Summary */}
          <Grid item xs={7}>
            <Box sx={{ 
              border: '1px solid #dee2e6', 
              borderRadius: 1, 
              p: 0.6,
              bgcolor: '#f8f9fa'
            }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 'bold', 
                mb: 0.3, 
                color: '#667eea',
                fontSize: '0.7rem'
              }}>
                SUMMARY
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2 }}>
                <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Subtotal:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>
                  {formatCurrency(invoice.subtotal)}
                </Typography>
              </Box>
              {(invoice.discount || 0) > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Discount:</Typography>
                  <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 600, fontSize: '0.65rem' }}>
                    -{formatCurrency(invoice.discount)}
                  </Typography>
                </Box>
              )}
              {(invoice.transportCharges || 0) > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Transport:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>
                    {formatCurrency(invoice.transportCharges)}
                  </Typography>
                </Box>
              )}
              <Divider sx={{ my: 0.3 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Total:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#667eea', fontSize: '0.75rem' }}>
                  {formatCurrency(invoice.total)}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Compact Notes */}
        {invoice.notes && (
          <Box sx={{ mb: 0.5 }}>
            <Box sx={{ 
              border: '1px solid #dee2e6', 
              borderRadius: 1, 
              p: 0.6,
              bgcolor: '#fff3e0'
            }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 'bold', 
                mb: 0.3, 
                color: '#f57c00',
                fontSize: '0.7rem'
              }}>
                NOTES
              </Typography>
              <Typography variant="caption" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.2, fontSize: '0.65rem' }}>
                {invoice.notes}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Ultra Compact Footer */}
        <Box className="footer-section" sx={{ 
          borderTop: '2px solid #667eea', 
          pt: 0.5, 
          mt: 0.5
        }}>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#667eea', fontSize: '0.7rem' }}>
                Customer Signature: ________________________
              </Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#667eea', fontSize: '0.7rem' }}>
                Authorized Signatory
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem' }}>
                For [Company Name]
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </>
  );
};

export default SimpleInvoiceView;