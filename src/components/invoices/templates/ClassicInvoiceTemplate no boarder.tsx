"use client";
import React, { useState, useEffect } from 'react';
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
  Grid
} from '@mui/material';
import { Invoice } from '@/types/invoice_no_gst';
import { CompanyInfo } from '@/types/company';
import { getCompanyInfo } from '@/services/settingsService';
import CompanyInfoDisplay from '@/components/CompanyInfoDisplay';

interface ClassicInvoiceTemplateProps {
  invoice: Invoice;
  settings: any;
  previewMode: boolean;
  copyLabel?: string; // e.g., Original, Duplicate, Triplicate
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

export default function ClassicInvoiceTemplate({ invoice, settings, previewMode, copyLabel }: ClassicInvoiceTemplateProps) {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompanyInfo = async () => {
      try {
        const info = await getCompanyInfo();
        setCompanyInfo(info);
      } catch (error) {
        console.error('Error loading company info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCompanyInfo();
  }, []);

  const printStyles = `
    @page {
      size: A4 portrait;
      margin: 8mm 8mm 8mm 8mm;
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
        font-family: 'Times New Roman', serif;
        font-size: 9px;
        line-height: 1.1;
        color: #000;
      }
      
      .tally-template {
        font-family: 'Times New Roman', serif;
        color: #000;
        line-height: 1.1;
        font-size: 9px;
        width: 100%;
        max-width: none;
        margin: 0;
        padding: 0;
        page-break-inside: avoid;
        margin-top: 0;
        display: flex;
        flex-direction: column;
        min-height: calc(297mm - 16mm);
        height: calc(297mm - 16mm);
        max-height: calc(297mm - 16mm);
      }
      
      .tally-border {
        border: 1px solid #000 !important;
      }
      
      .tally-header {
        border-bottom: 2px double #000 !important;
        text-align: center;
        padding: 1px 0;
        margin-bottom: 0;
      }
      
      .tally-section-border {
        border: 1px solid #000 !important;
      }
      
      .tally-table {
        border-collapse: collapse;
        width: 100%;
        font-size: 10px;
      }
      
      .tally-table th,
      .tally-table td {
        border: none !important;
        border-bottom: 1px solid #ddd !important;
        padding: 2px 3px;
        text-align: left;
        vertical-align: top;
        line-height: 1.4;
      }
      
      .tally-table thead tr {
        border-bottom: 2px solid #000 !important;
      }
      
      .tally-table thead th {
        border: none !important;
        border-bottom: 2px solid #000 !important;
      }
      
      .tally-table tbody tr:last-child td {
        border-bottom: 2px solid #000 !important;
      }
      
      .tally-table th {
        background: #f0f0f0 !important;
        font-weight: bold;
        text-align: center;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .tally-table .number-cell {
        text-align: right;
      }
      
      .tally-table .center-cell {
        text-align: center;
      }
      
      .tally-total-row {
        background: #f8f8f8 !important;
        font-weight: bold;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .tally-grand-total {
        background: #e8e8e8 !important;
        font-weight: bold;
        border: 1px solid #000 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .tally-amount-words {
        border: 1px solid #000 !important;
        padding: 3px;
        background: #f9f9f9 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        font-size: 8px;
      }
      
      .tally-terms {
        border: 1px solid #000 !important;
        padding: 3px;
        margin-top: 2px;
        font-size: 7px;
        line-height: 1;
      }
      
      .tally-signature-section {
        border-top: 1px solid #000;
        margin-top: 4px;
        padding-top: 3px;
      }
      
      .tally-company-header {
        font-size: 15px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 1px;
      }
      
      .tally-invoice-title {
        font-size: 10px;
        font-weight: bold;
        text-decoration: underline;
        margin: 2px 0;
      }
      
      .tally-invoice-subtitle {
        font-size: 8px;
        font-style: italic;
        margin-bottom: 2px;
      }
      
      /* Compact spacing for Tally-style layout */
      .tally-template h1,
      .tally-template h2,
      .tally-template h3,
      .tally-template h4,
      .tally-template h5,
      .tally-template h6 {
        margin: 0 0 1px 0;
        line-height: 1;
      }
      
      .tally-template p,
      .tally-template div {
        margin: 0 0 0 0;
      }
      
      .tally-template .MuiTypography-root {
        margin-bottom: 0 !important;
      }
      
      .tally-template .MuiBox-root {
        margin-bottom: 1px !important;
      }
      
      .tally-template .MuiGrid-item {
        padding: 1px !important;
      }
      
      .tally-content {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
      }
      
      .tally-bottom-section {
        margin-top: auto;
        display: flex;
        flex-direction: column;
        flex: 0 0 auto;
        page-break-inside: avoid;
      }
      
      .tally-bottom-section > * {
        page-break-inside: avoid;
      }
      
      .tally-info-section {
        padding: 2px 3px;
        min-height: 30mm;
      }
      
      .tally-label {
        font-weight: bold;
        text-decoration: underline;
        font-size: 19px;
      }
      
      .tally-value {
        font-size: 18px;
        margin-left: 2px;
      }
      
      .tally-footer-text {
        font-size: 7px;
        text-align: center;
        font-style: italic;
        margin-top: 2px;
        border-top: 1px solid #000;
        padding-top: 1px;
      }
    }
    
    @media screen {
      .tally-template {
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        border-radius: 4px;
        overflow: hidden;
        max-width: 210mm;
        min-height: 297mm;
        background: white;
      }
    }
  `;

  return (
    <>
      <style>{printStyles}</style>
      <Box className="tally-template tally-border" sx={{
        maxWidth: '210mm',
        margin: '0 auto',
        p: previewMode ? 1 : 0,
        bgcolor: 'white',
        minHeight: 'auto',
        border: '1px solid #000',
        fontFamily: '"Times New Roman", serif',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: previewMode ? '0 4px 20px rgba(0,0,0,0.1)' : 'none',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        {/* Dynamic Company Header */}
        <Box className="tally-header" sx={{
          borderBottom: '1px double #000',
          textAlign: 'center',
          pb: 0.2,
          mb: 0.2,
          position: 'relative'
        }}>
          {/* Optional Copy Label (inside template, top-right) */}
          {copyLabel && (
            <Typography className="tally-invoice-subtitle" variant="body2" sx={{
              fontStyle: 'italic',
              fontSize: '0.65rem',
              fontFamily: '"Times New Roman", serif',
              position: 'absolute',
              top: 4,
              right: 6,
              textAlign: 'right',
              backgroundColor: 'white',
              px: 0.6,
            }}>
              ({copyLabel})
            </Typography>
          )}
          <Typography className="tally-company-header" variant="h4" sx={{
            fontWeight: 'bold',
            fontSize: '2rem',
            fontFamily: '"Times New Roman", serif',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            mb: 0.1
          }}>
            {companyInfo?.name || 'COMPANY NAME'}
          </Typography>
          <Typography variant="body2" sx={{
            fontSize: '0.95rem',
            fontFamily: '"Times New Roman", serif',
            mb: 0.25,
            fontWeight: 'medium'
          }}>
            {companyInfo?.address || 'Complete Business Address with PIN Code'}
          </Typography>
          <Typography variant="body2" sx={{
            fontSize: '0.85rem',
            fontFamily: '"Times New Roman", serif',
            mb: 0.25
          }}>
            {companyInfo?.phone ? `Phone: ${companyInfo.phone}` : 'Phone: +91-XXXXXXXXXX'} | {companyInfo?.email ? `Email: ${companyInfo.email}` : 'Email: info@company.com'} | {companyInfo?.website ? `Website: ${companyInfo.website}` : 'Website: www.company.com'}
          </Typography>
          <Typography variant="body2" sx={{
            fontSize: '0.75rem',
            fontFamily: '"Times New Roman", serif',
            mb: 0.15,
            fontStyle: 'italic'
          }}>
            {/* {companyInfo?.gstin ? `GSTIN: ${companyInfo.gstin}` : 'GSTIN: 00XXXXX0000X0X0'} | PAN: XXXXX0000X | CIN: U00000XX0000XXX000 */}
          </Typography>

          <Typography className="tally-invoice-title" variant="h5" sx={{
            fontWeight: 'bold',
            fontSize: '0.9rem',
            fontFamily: '"Times New Roman", serif',
            textDecoration: 'underline',
            mb: 0.1
          }}>
            PERFORMA QUOTATION
          </Typography>

        </Box>

        <Box className="tally-content" sx={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
          {/* Enhanced Invoice Details Section */}
          <Grid container spacing={0.1} sx={{ mb: 0.1 }}>
            {/* Invoice Information */}

            <Grid item xs={6} sx={{ flex: '1', textAlign: 'left', width: '30%' }}>
            <Box className="tally-section-border tally-info-section" sx={{
              p: 0.2,
              height: 'auto',
              mr: 0.1,
              pb: 0.2,
            }}>
              <Typography className="tally-label" variant="body2" sx={{
                fontWeight: 'bold',
                textDecoration: 'underline',
                fontSize: '0.85rem',
                mb: 0.15,
              }}>
                Bill To:
              </Typography>
              <Typography variant="body2" sx={{
                fontSize: (invoice.partyName && invoice.partyName.length > 20) ? '0.85rem' : '1rem',
                fontWeight: 'bold',
                mb: 0.15,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {invoice.partyName || 'N/A'}
              </Typography>
              {invoice.partyAddress && (
                <Typography variant="body2" sx={{ fontSize: '0.85rem', mb: 0.15, lineHeight: 1.25 }}>
                  {invoice.partyAddress}
                </Typography>
              )}
              <Box sx={{  justifyContent: 'space-between', mb: 0.15, }}>
                <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>

                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                  Phone: {invoice.partyPhone || 'N/A'}
                </Typography>
              </Box>
              {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.1, textAlign: 'right' }}>
                <Typography variant="body2" sx={{ fontSize: '0.6rem', fontWeight: 'bold', }}>

                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.6rem' }}>
                  Email: {invoice.partyEmail || 'N/A'}
                </Typography>
              </Box> */}
            </Box>
          </Grid>


          <Grid item xs={6} sx={{ flex: '1', textAlign: 'left', width: '30%' }}>
            <Box className="tally-section-border tally-info-section" sx={{
              p: 0.2,
              height: 'auto',
              mr: 0.25,
              pb: 0.2,
            }}>
              <Typography className="tally-label" variant="body2" sx={{
                fontWeight: 'bold',
                textDecoration: 'underline',
                fontSize: '0.85rem',
                mb: 0.2
              }}>
                Quotation Information:
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.12 }}>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                  Quotation No.:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem',fontWeight: '800' }}>
                  {invoice.invoiceNumber || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.12 }}>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                  Quotation Date:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  {formatDate(invoice.date)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.12 }}>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                  Due Date:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  {invoice.dueDate ? formatDate(invoice.dueDate) : formatDate(new Date(new Date(invoice.date).getTime() + 30 * 24 * 60 * 60 * 1000))}
                </Typography>
              </Box>
              {/* <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                  Payment Mode:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.65rem' }}>
                  {invoice.paymentMode || 'Cash/Cheque'}
                </Typography>
              </Box> */}
            </Box>
          </Grid>

         
        </Grid>


        {/* Items Table - Tally Style */}
        <Box sx={{ mb: 0.2 }}>
          <TableContainer>
            <Table className="tally-table" sx={{ border: 'none', borderCollapse: 'collapse' }}>
              <TableHead>
                <TableRow sx={{ borderBottom: '2px solid #000' }}>
                  <TableCell className="center-cell" sx={{
                    border: 'none',
                    borderBottom: '2px solid #000',
                    bgcolor: '#f0f0f0',
                    fontWeight: 'bold',
                    width: '5%',
                    fontSize: '0.6rem',
                    py: 0.3,
                    px: 0.3
                  }}>
                    S.No.
                  </TableCell>
                  <TableCell sx={{
                    border: 'none',
                    borderBottom: '2px solid #000',
                    bgcolor: '#f0f0f0',
                    fontWeight: 'bold',
                    width: '35%',
                    fontSize: '0.6rem',
                    py: 0.3,
                    px: 0.3
                  }}>
                    Description of Goods
                  </TableCell>
                  <TableCell className="center-cell" sx={{
                    border: 'none',
                    borderBottom: '2px solid #000',
                    bgcolor: '#f0f0f0',
                    fontWeight: 'bold',
                    width: '8%',
                    fontSize: '0.6rem',
                    py: 0.3,
                    px: 0.3
                  }}>
                    Qty
                  </TableCell>
                  <TableCell className="center-cell" sx={{
                    border: 'none',
                    borderBottom: '2px solid #000',
                    bgcolor: '#f0f0f0',
                    fontWeight: 'bold',
                    width: '6%',
                    fontSize: '0.6rem',
                    py: 0.3,
                    px: 0.3
                  }}>
                    UOM
                  </TableCell>
                  <TableCell className="number-cell" sx={{
                    border: 'none',
                    borderBottom: '2px solid #000',
                    bgcolor: '#f0f0f0',
                    fontWeight: 'bold',
                    width: '12%',
                    fontSize: '0.6rem',
                    py: 0.3,
                    px: 0.3
                  }}>
                    Rate (₹)
                  </TableCell>
                  <TableCell className="number-cell" sx={{
                    border: 'none',
                    borderBottom: '2px solid #000',
                    bgcolor: '#f0f0f0',
                    fontWeight: 'bold',
                    width: '8%',
                    fontSize: '0.6rem',
                    py: 0.3,
                    px: 0.3
                  }}>
                    Disc. %
                  </TableCell>
                  <TableCell className="number-cell" sx={{
                    border: 'none',
                    borderBottom: '2px solid #000',
                    bgcolor: '#f0f0f0',
                    fontWeight: 'bold',
                    width: '8%',
                    fontSize: '0.6rem',
                    py: 0.3,
                    px: 0.3
                  }}>
                    DP %
                  </TableCell>
                  <TableCell className="number-cell" sx={{
                    border: 'none',
                    borderBottom: '2px solid #000',
                    bgcolor: '#f0f0f0',
                    fontWeight: 'bold',
                    width: '18%',
                    fontSize: '0.6rem',
                    py: 0.3,
                    px: 0.3
                  }}>
                    Amount (₹)
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.items?.map((item, index) => (
                  <TableRow key={index} sx={{ 
                    height: 'auto',
                    borderBottom: '1px solid #ddd',
                    '&:last-child': {
                      borderBottom: '2px solid #000'
                    }
                  }}>
                    <TableCell className="center-cell" sx={{ 
                      border: 'none', 
                      fontSize: '0.7rem', 
                      py: 0.3,
                      px: 0.3
                    }}>
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ 
                      border: 'none', 
                      fontSize: '0.7rem', 
                      py: 0.3,
                      px: 0.3
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.7rem' }}>
                        {item.name}
                      </Typography>
                      {item.description && (
                        <Typography variant="caption" sx={{ color: '#666', display: 'block', fontSize: '0.65rem', whiteSpace: 'pre-line' }}>
                          {item.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell className="center-cell" sx={{ 
                      border: 'none', 
                      fontSize: '0.7rem', 
                      py: 0.3,
                      px: 0.3
                    }}>
                      {item.quantity}
                    </TableCell>
                    <TableCell className="center-cell" sx={{ 
                      border: 'none', 
                      fontSize: '0.7rem', 
                      py: 0.3,
                      px: 0.3
                    }}>
                      {item.unitOfMeasurement || 'PCS'}
                    </TableCell>
                    <TableCell className="number-cell" sx={{ 
                      border: 'none', 
                      fontSize: '0.7rem', 
                      py: 0.3,
                      px: 0.3
                    }}>
                      {(item.price || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="center-cell" sx={{ 
                      border: 'none', 
                      fontSize: '0.7rem', 
                      py: 0.3,
                      px: 0.3
                    }}>
                      {item.discount > 0 ? `${item.discount}%` : '0.00'}
                    </TableCell>
                    <TableCell className="center-cell" sx={{ 
                      border: 'none', 
                      fontSize: '0.7rem', 
                      py: 0.3,
                      px: 0.3
                    }}>
                      {typeof (item as any).margin === 'number' ? `${(item as any).margin}%` : '0.00'}
                    </TableCell>
                    <TableCell className="number-cell" sx={{ 
                      border: 'none', 
                      fontSize: '0.7rem', 
                      fontWeight: 'bold', 
                      py: 0.3,
                      px: 0.3
                    }}>
                      {(
                        (item.quantity || 0) * (item.price || 0) * (1 - (item.discount || 0) / 100)
                      ).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Totals Summary */}
        <Box sx={{ mb: 0.2, display: 'flex', justifyContent: 'flex-end', pr: 0 }}>
          <Box sx={{ border: '1px solid #000', width: '45%', minWidth: '180px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 0.2, borderBottom: '1px solid #ddd' }}>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>Subtotal:</Typography>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                ₹{(invoice.items?.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0) || 0).toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 0.2, borderBottom: '1px solid #ddd' }}>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>Discount:</Typography>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                ₹{(invoice.items?.reduce((sum, item) => sum + (((item.quantity || 0) * (item.price || 0)) * ((item.discount || 0) / 100)), 0) || 0).toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 0.2, bgcolor: '#e8e8e8', fontWeight: 'bold', border: '1px solid #000' }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Grand Total:</Typography>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                ₹{(invoice.items?.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0) * (1 - (item.discount || 0) / 100)), 0) || 0).toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </Box>
        </Box>
        <Box className="tally-bottom-section" sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', width: '100%', flex: '0 0 auto' }}>
        {/* Payment Company Information */}
        {/* <Box className="tally-section-border" sx={{ 
          border: '1px solid #000', 
          p: 1,
          mb: 1
        }}>
          <Typography className="tally-label" variant="body2" sx={{ 
            fontWeight: 'bold', 
            textDecoration: 'underline',
            fontSize: '0.75rem',
            mb: 0.5
          }}>
            Payment Information:
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ fontSize: '0.7rem', mb: 0.2 }}>
                <strong>Company:</strong> {companyInfo?.name || 'COMPANY NAME'}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.7rem', mb: 0.2 }}>
                <strong>Bank Name:</strong> State Bank of India
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.7rem', mb: 0.2 }}>
                <strong>Account No.:</strong> 00000000000000
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ fontSize: '0.7rem', mb: 0.2 }}>
                <strong>Branch:</strong> Main Branch
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.7rem', mb: 0.2 }}>
                <strong>IFSC Code:</strong> SBIN0000000
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.7rem', mb: 0.2 }}>
                <strong>UPI ID:</strong> {companyInfo?.name?.toLowerCase().replace(/\s+/g, '') || 'company'}@paytm
              </Typography>
            </Grid>
          </Grid>
        </Box> */}


        {/* Declaration */}
        <Box className="tally-section-border" sx={{
          border: '1px solid #000',
          p: 0.2,
          mb: 0.15,
          mt: 0.15,
          width: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}>
          <Typography className="tally-label" variant="body2" sx={{
            fontWeight: 'bold',
            textDecoration: 'underline',
            fontSize: '0.7rem',
            mb: 0.1,
            lineHeight: 1
          }}>
            Declaration: 
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.65rem', lineHeight: 1.1, wordWrap: 'break-word' }}>
            We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
          </Typography>
        </Box>

        {/* Terms & Conditions */}
        <Box className="tally-terms" sx={{
          border: '1px solid #000',
          p: 0.2,
          mb: 0.15,
          mt: 0.15,
          width: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}>
          <Typography className="tally-label" variant="body2" sx={{
            fontWeight: 'bold',
            textDecoration: 'underline',
            fontSize: '0.7rem',
            mb: 0.05,
            lineHeight: 1
          }}>
            Terms & Conditions:
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.6rem', mb: 0.05, lineHeight: 1, wordWrap: 'break-word' }}>
            1.We declare that this invoice shows the actual price	of the goods described and that all particulars are true and correct
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.6rem', mb: 0.05, lineHeight: 1, wordWrap: 'break-word' }}>
            Note: Warrenty not covered for physical damage
          </Typography>

          
        </Box>

       {/* Notes Section */}
       {invoice.notes && (
         <Box className="tally-section-border" sx={{
           border: '1px solid #000',
           p: 0.2,
           mb: 0.15,
           mt: 0.15,
           width: '100%',
           boxSizing: 'border-box',
           overflow: 'hidden'
         }}>
           <Typography className="tally-label" variant="body2" sx={{
             fontWeight: 'bold',
             textDecoration: 'underline',
             fontSize: '0.7rem',
             mb: 0.1,
             lineHeight: 1
           }}>
             Notes:
           </Typography>
           <Typography variant="body2" sx={{ fontSize: '0.65rem', lineHeight: 1.1, wordWrap: 'break-word' }}>
             {invoice.notes}
           </Typography>
         </Box>
       )}

       {/* Signatures - Tally Style */}
       <Box className="tally-signature-section" sx={{ borderTop: '1px solid #000', mt: 0.15, mb: 0, pt: 0.2, pb: 0.2, width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
          <Grid container spacing={0} sx={{ width: '100%' }}>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'left', p: 0.15 }}>
                <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 'bold', mb: 0.3, lineHeight: 1 }}>
                  Receiver's Signature:
                </Typography>
                <Box sx={{
                  borderBottom: '1px solid #000',
                  width: '100px',
                  height: '20px'
                }} />
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'right', p: 0.15 }}>
                <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 'bold', mb: 0.3, lineHeight: 1 }}>
                  for {companyInfo?.name || 'COMPANY NAME'}
                </Typography>

                <Typography variant="body2" sx={{
                  mb: 0,
                  marginTop: '2px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  textAlign: 'right',
                  lineHeight: 1
                }}>
                  Authorised Signatory
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
        {/* Footer */}
        <Box className="tally-footer-text" sx={{ width: '100%', p: 0.1, mt: 0.1, mb: 0, boxSizing: 'border-box', borderTop: '1px solid #000' }}>
          <Typography variant="caption" sx={{ fontSize: '0.6rem', textAlign: 'center', display: 'block', lineHeight: 1 }}>
            This is a Computer Generated Invoice
          </Typography>
        </Box>
      </Box>

        
      </Box>
    </>
  );
}