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

export default function ClassicInvoiceTemplate({ invoice, settings, previewMode }: ClassicInvoiceTemplateProps) {
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
      margin: 5mm 10mm 10mm 10mm;
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
        font-size: 10px;
        line-height: 1.2;
        color: #000;
      }
      
      .tally-template {
        font-family: 'Times New Roman', serif;
        color: #000;
        line-height: 1.2;
        font-size: 10px;
        width: 100%;
        max-width: none;
        margin: 0;
        padding: 0;
        page-break-inside: avoid;
      }
      
      .tally-border {
        border: 2px solid #000 !important;
      }
      
      .tally-header {
        border-bottom: 3px double #000 !important;
        text-align: center;
        padding: 2px 0;
        margin-bottom: 1px;
      }
      
      .tally-section-border {
        border: 1px solid #000 !important;
      }
      
      .tally-table {
        border-collapse: collapse;
        width: 100%;
        font-size: 9px;
      }
      
      .tally-table th,
      .tally-table td {
        border: 1px solid #000 !important;
        padding: 3px 4px;
        text-align: left;
        vertical-align: top;
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
        border: 2px solid #000 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .tally-amount-words {
        border: 1px solid #000 !important;
        padding: 6px;
        background: #f9f9f9 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .tally-terms {
        border: 1px solid #000 !important;
        padding: 6px;
        margin-top: 4px;
        font-size: 8px;
      }
      
      .tally-signature-section {
        border-top: 1px solid #000;
        margin-top: 8px;
        padding-top: 6px;
      }
      
      .tally-company-header {
        font-size: 18px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-bottom: 2px;
      }
      
      .tally-invoice-title {
        font-size: 12px;
        font-weight: bold;
        text-decoration: underline;
        margin: 4px 0;
      }
      
      .tally-invoice-subtitle {
        font-size: 10px;
        font-style: italic;
        margin-bottom: 4px;
      }
      
      /* Compact spacing for Tally-style layout */
      .tally-template h1,
      .tally-template h2,
      .tally-template h3,
      .tally-template h4,
      .tally-template h5,
      .tally-template h6 {
        margin: 0 0 2px 0;
        line-height: 1.1;
      }
      
      .tally-template p,
      .tally-template div {
        margin: 0 0 1px 0;
      }
      
      .tally-template .MuiTypography-root {
        margin-bottom: 1px !important;
      }
      
      .tally-template .MuiBox-root {
        margin-bottom: 2px !important;
      }
      
      .tally-template .MuiGrid-item {
        padding: 2px !important;
      }
      
      .tally-info-section {
        padding: 2px 4px;
        min-height: 35px;
      }
      
      .tally-label {
        font-weight: bold;
        text-decoration: underline;
        font-size: 9px;
      }
      
      .tally-value {
        font-size: 9px;
        margin-left: 4px;
      }
      
      .tally-footer-text {
        font-size: 8px;
        text-align: center;
        font-style: italic;
        margin-top: 4px;
        border-top: 1px solid #000;
        padding-top: 2px;
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
        p: previewMode ? 2 : 0,
        bgcolor: 'white',
        minHeight: '297mm',
        border: '2px solid #000',
        fontFamily: '"Times New Roman", serif',
        boxShadow: previewMode ? '0 4px 20px rgba(0,0,0,0.1)' : 'none'
      }}>
        {/* Dynamic Company Header */}
        <Box className="tally-header" sx={{
          borderBottom: '3px double #000',
          textAlign: 'center',
          pb: 0.3,
          mb: 0.3
        }}>
          <Typography className="tally-invoice-subtitle" variant="body2" sx={{
            fontStyle: 'italic',
            fontSize: '0.6rem',
            fontFamily: '"Times New Roman", serif',position: 'relative',
            top: '-1em', 
            // maskPosition: 'absolute',
          }}>
            (Original for Recipient)
          </Typography>
          <Typography className="tally-company-header" variant="h4" sx={{
            fontWeight: 'bold',
            fontSize: '1.4rem',
            fontFamily: '"Times New Roman", serif',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            mb: 0.3
          }}>
            {companyInfo?.name || 'COMPANY NAME'}
          </Typography>
          <Typography variant="body2" sx={{
            fontSize: '0.8rem',
            fontFamily: '"Times New Roman", serif',
            mb: 0.2,
            fontWeight: 'medium'
          }}>
            {companyInfo?.address || 'Complete Business Address with PIN Code'}
          </Typography>
          <Typography variant="body2" sx={{
            fontSize: '0.7rem',
            fontFamily: '"Times New Roman", serif',
            mb: 0.2
          }}>
            {companyInfo?.phone ? `Phone: ${companyInfo.phone}` : 'Phone: +91-XXXXXXXXXX'} | {companyInfo?.email ? `Email: ${companyInfo.email}` : 'Email: info@company.com'} | {companyInfo?.website ? `Website: ${companyInfo.website}` : 'Website: www.company.com'}
          </Typography>
          <Typography variant="body2" sx={{
            fontSize: '0.65rem',
            fontFamily: '"Times New Roman", serif',
            mb: 0.3,
            fontStyle: 'italic'
          }}>
            {/* {companyInfo?.gstin ? `GSTIN: ${companyInfo.gstin}` : 'GSTIN: 00XXXXX0000X0X0'} | PAN: XXXXX0000X | CIN: U00000XX0000XXX000 */}
          </Typography>

          <Typography className="tally-invoice-title" variant="h5" sx={{
            fontWeight: 'bold',
            fontSize: '0.9rem',
            fontFamily: '"Times New Roman", serif',
            textDecoration: 'underline',
            mb: 0.2
          }}>
            PERFORMA INVOICE
          </Typography>
          
        </Box>

        {/* Enhanced Invoice Details Section */}
        <Grid container spacing={0.5} sx={{ mb: 0.5 }}>
          {/* Invoice Information */}
          <Grid item xs={6} sx={{ flex: '1', textAlign: 'left',width: '30%' }}>
            <Box className="tally-section-border tally-info-section" sx={{
              border: '1px solid #000',
              p: 0.5,
              minHeight: '65px',
              mr: 0.25
            }}>
              <Typography className="tally-label" variant="body2" sx={{
                fontWeight: 'bold',
                textDecoration: 'underline',
                fontSize: '0.7rem',
                mb: 0.2
              }}>
                Invoice Information:
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                  Invoice No.:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.65rem' }}>
                  {invoice.invoiceNumber || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                  Invoice Date:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.65rem' }}>
                  {formatDate(invoice.date)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                  Due Date:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.65rem' }}>
                  {invoice.dueDate ? formatDate(invoice.dueDate) : formatDate(new Date(new Date(invoice.date).getTime() + 30 * 24 * 60 * 60 * 1000))}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                  Payment Mode:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.65rem' }}>
                  {invoice.paymentMode || 'Cash/Cheque'}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={6} sx={{ flex: '1', textAlign: 'right' }}>
            <Box className="tally-section-border tally-info-section" sx={{
              border: '1px solid #000',
              p: 0.5,
              minHeight: '75px',
              mr: 0.25,
            }}>
              <Typography className="tally-label" variant="body2" sx={{
                fontWeight: 'bold',
                textDecoration: 'underline',
                fontSize: '0.7rem',
                mb: 0.2,
              }}>
                Bill To:
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 'bold', mb: 0.1 }}>
                {invoice.partyName || 'N/A'}
              </Typography>
              {invoice.partyAddress && (
                <Typography variant="body2" sx={{ fontSize: '0.6rem', mb: 0.1, lineHeight: 1.2 }}>
                  {invoice.partyAddress}
                </Typography>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.1, }}>
                <Typography variant="body2" sx={{ fontSize: '0.6rem', fontWeight: 'bold' }}>

                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.6rem' }}>
                  Phone: {invoice.partyPhone || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.1, textAlign: 'right' }}>
                <Typography variant="body2" sx={{ fontSize: '0.6rem', fontWeight: 'bold', }}>

                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.6rem' }}>
                  Email: {invoice.partyEmail || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>


        {/* Items Table - Tally Style */}
        <Box sx={{ mb: 1 }}>
          <TableContainer>
            <Table className="tally-table" sx={{ border: '1px solid #000' }}>
              <TableHead>
                <TableRow>
                  <TableCell className="center-cell" sx={{
                    border: '1px solid #000',
                    bgcolor: '#f0f0f0',
                    fontWeight: 'bold',
                    width: '5%',
                    fontSize: '0.7rem'
                  }}>
                    S.No.
                  </TableCell>
                  <TableCell sx={{
                    border: '1px solid #000',
                    bgcolor: '#f0f0f0',
                    fontWeight: 'bold',
                    width: '35%',
                    fontSize: '0.7rem'
                  }}>
                    Description of Goods
                  </TableCell>
                   
                  <TableCell className="center-cell" sx={{
                    border: '1px solid #000',
                    bgcolor: '#f0f0f0',
                    fontWeight: 'bold',
                    width: '8%',
                    fontSize: '0.7rem'
                  }}>
                    Qty
                  </TableCell>
                  <TableCell className="center-cell" sx={{
                    border: '1px solid #000',
                    bgcolor: '#f0f0f0',
                    fontWeight: 'bold',
                    width: '6%',
                    fontSize: '0.7rem'
                  }}>
                    UOM
                  </TableCell>
                  <TableCell className="number-cell" sx={{
                    border: '1px solid #000',
                    bgcolor: '#f0f0f0',
                    fontWeight: 'bold',
                    width: '12%',
                    fontSize: '0.7rem'
                  }}>
                    Rate (₹)
                  </TableCell>
                  <TableCell className="number-cell" sx={{
                    border: '1px solid #000',
                    bgcolor: '#f0f0f0',
                    fontWeight: 'bold',
                    width: '8%',
                    fontSize: '0.7rem'
                  }}>
                    Disc. %
                  </TableCell>
                  <TableCell className="number-cell" sx={{
                    border: '1px solid #000',
                    bgcolor: '#f0f0f0',
                    fontWeight: 'bold',
                    width: '18%',
                    fontSize: '0.7rem'
                  }}>
                    Amount (₹)
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.items?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="center-cell" sx={{ border: '1px solid #000', fontSize: '0.7rem' }}>
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #000', fontSize: '0.7rem' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.7rem' }}>
                        {item.name}
                      </Typography>
                      {item.description && (
                        <Typography variant="caption" sx={{ color: '#666', display: 'block', fontSize: '0.65rem' }}>
                          {item.description}
                        </Typography>
                      )}
                    </TableCell> 
                    <TableCell className="center-cell" sx={{ border: '1px solid #000', fontSize: '0.7rem' }}>
                      {item.quantity}
                    </TableCell>
                    <TableCell className="center-cell" sx={{ border: '1px solid #000', fontSize: '0.7rem' }}>
                      {item.unitOfMeasurement || 'PCS'}
                    </TableCell>
                    <TableCell className="number-cell" sx={{ border: '1px solid #000', fontSize: '0.7rem' }}>
                      {(item.price || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="center-cell" sx={{ border: '1px solid #000', fontSize: '0.7rem' }}>
                      {item.discount > 0 ? `${item.discount}%` : '0.00'}
                    </TableCell>
                    <TableCell className="number-cell" sx={{ border: '1px solid #000', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      {(item.totalAmount || item.finalPrice || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Empty rows for spacing - Tally style */}
                {Array.from({ length: Math.max(0, 20 - (invoice.items?.length || 0)) }).map((_, index) => (
                  <TableRow key={`empty-${index}`}>
                    <TableCell sx={{ border: '1px solid #000', height: '25px', fontSize: '0.7rem' }}>&nbsp;</TableCell>
                    <TableCell sx={{ border: '1px solid #000', fontSize: '0.7rem' }}>&nbsp;</TableCell>
                    <TableCell sx={{ border: '1px solid #000', fontSize: '0.7rem' }}>&nbsp;</TableCell>
                    <TableCell sx={{ border: '1px solid #000', fontSize: '0.7rem' }}>&nbsp;</TableCell> 
                    <TableCell sx={{ border: '1px solid #000', fontSize: '0.7rem' }}>&nbsp;</TableCell>
                    <TableCell sx={{ border: '1px solid #000', fontSize: '0.7rem' }}>&nbsp;</TableCell>
                    <TableCell sx={{ border: '1px solid #000', fontSize: '0.7rem' }}>&nbsp;</TableCell>
                  </TableRow>
                ))}

                {/* Total Rows - Tally Style (without CGST/SGST) */}
                <TableRow className="tally-total-row">
                  <TableCell colSpan={6} sx={{
                    border: '1px solid #000',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    bgcolor: '#f8f8f8',
                    fontSize: '0.75rem'
                  }}>
                    Sub Total:
                  </TableCell>
                  <TableCell className="number-cell" sx={{
                    border: '1px solid #000',
                    fontWeight: 'bold',
                    bgcolor: '#f8f8f8',
                    fontSize: '0.75rem'
                  }}>
                    {formatCurrency(invoice.subtotal)}
                  </TableCell>
                </TableRow>

                {(invoice.totalDiscount || invoice.discount || 0) > 0 && (
                  <TableRow className="tally-total-row">
                    <TableCell colSpan={6} sx={{
                      border: '1px solid #000',
                      textAlign: 'right',
                      fontWeight: 'bold',
                      bgcolor: '#f8f8f8',
                      fontSize: '0.75rem'
                    }}>
                      Less: Discount:
                    </TableCell>
                    <TableCell className="number-cell" sx={{
                      border: '1px solid #000',
                      fontWeight: 'bold',
                      color: '#d32f2f',
                      bgcolor: '#f8f8f8',
                      fontSize: '0.75rem'
                    }}>
                      {formatCurrency(invoice.totalDiscount || invoice.discount)}
                    </TableCell>
                  </TableRow>
                )}

                <TableRow className="tally-total-row">
                  <TableCell colSpan={6} sx={{
                    border: '1px solid #000',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    bgcolor: '#f8f8f8',
                    fontSize: '0.75rem'
                  }}>
                    Transport Charge:
                  </TableCell>
                  <TableCell className="number-cell" sx={{
                    border: '1px solid #000',
                    fontWeight: 'bold',
                    bgcolor: '#f8f8f8',
                    fontSize: '0.75rem'
                  }}>
                    {formatCurrency(invoice.transportCharges || 0)}
                  </TableCell>
                </TableRow>

                <TableRow className="tally-grand-total">
                  <TableCell colSpan={6} sx={{
                    border: '2px solid #000',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    bgcolor: '#e8e8e8'
                  }}>
                    TOTAL AMOUNT:
                  </TableCell>
                  <TableCell className="number-cell" sx={{
                    border: '2px solid #000',
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    bgcolor: '#e8e8e8'
                  }}>
                    {formatCurrency(invoice.totalAmount || invoice.total)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

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
          p: 1,
          mb: 1
        }}>
          <Typography className="tally-label" variant="body2" sx={{
            fontWeight: 'bold',
            textDecoration: 'underline',
            fontSize: '0.75rem',
            mb: 0.5
          }}>
            Declaration: Amount (in words): {numberToWords(invoice.totalAmount || invoice.total || 0)}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.7rem', lineHeight: 1.3 }}>
            We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
          </Typography>
        </Box>

        {/* Terms & Conditions */}
        <Box className="tally-terms" sx={{
          border: '1px solid #000',
          p: 1,
    
        }}> 
          <Typography className="tally-label" variant="body2" sx={{
            fontWeight: 'bold',
            textDecoration: 'underline',
            fontSize: '0.75rem',
            mb: 0.5
          }}>
            Terms & Conditions:
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.65rem', mb: 0.3 }}>
            1. Goods once sold will not be taken back.
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.65rem', mb: 0.3 }}>
            2. Interest @ 18% p.a. will be charged if the payment is not made within the stipulated time.
          </Typography>

          <Typography variant="body2" sx={{ fontSize: '0.65rem' }}>
            3. Our risk and responsibility ceases the moment goods leave our premises.
          </Typography>
        </Box>

        {/* Signatures - Tally Style */}
        <Box className="tally-signature-section" sx={{bborder: '1px solid #000'}}>
          <Grid container>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'left', p: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'bold', mb: 1 }}>
                  Receiver's Signature:
                </Typography>
                <Box sx={{
                  borderBottom: '1px solid #000',
                  width: '180px',
                  ml: 'auto',  
                }} />
              </Box>
            </Grid>
            <Grid item xs={6} sx={{ flex: 1, textAlign: 'right', }}>
              <Box sx={{ textAlign: 'right', p: 0.5 }}>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'bold', mb: 1 }}>
                  for {companyInfo?.name || 'COMPANY NAME'}
                </Typography>
                {/* <Box sx={{ 
                         borderBottom: '1px solid #000', 
                         width: '180px', 
                         height:'30px',
                         float:'right',
                       }} /> */}

                <Typography variant="body2" sx={{
                  mb: 2, 
                  marginLeft: '366px',
                   marginTop: '10px',
                   fontSize: '0.75rem',
                   fontWeight: 'bold', 
                  textAlign: 'right'
                }}>
                  Authorised Signatory
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
        {/* Footer */}
        <Box className="tally-footer-text">
          <Typography variant="caption" sx={{ fontSize: '0.65rem', textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
            This is a Computer Generated Invoice
          </Typography>
        </Box>
      </Box>
    </>
  );
}
































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

export default function ClassicInvoiceTemplate({ invoice, settings, previewMode }: ClassicInvoiceTemplateProps) {
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
      margin: 2mm 5mm 5mm 10mm;
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
        font-size: 10px;
        line-height: 1.2;
        color: #000;
      }
      
      .tally-template {
        font-family: 'Times New Roman', serif;
        color: #000;
        line-height: 1.2;
        font-size: 10px;
        width: 100%;
        max-width: none;
        margin: 0;
        padding: 0;
        page-break-inside: avoid;
      }
      
      .tally-border {
        border: 2px solid #000 !important;
      }
      
      .tally-header {
        border-bottom: 3px double #000 !important;
        text-align: center;
        padding: 2px 0;
        margin-bottom: 1px;
      }
      
      .tally-section-border {
        border: 1px solid #000 !important;
      }
      
      .tally-table {
        border-collapse: collapse;
        width: 100%;
        font-size: 9px;
      }
      
      .tally-table th,
      .tally-table td {
        border: 1px solid #000 !important;
        padding: 3px 4px;
        text-align: left;
        vertical-align: top;
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
        border: 2px solid #000 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .tally-amount-words {
        border: 1px solid #000 !important;
        padding: 6px;
        background: #f9f9f9 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .tally-terms {
        border: 1px solid #000 !important;
        padding: 6px;
        margin-top: 4px;
        font-size: 8px;
      }
      
      .tally-signature-section {
        border-top: 1px solid #000;
        margin-top: 8px;
        padding-top: 6px;
      }
      
      .tally-company-header {
        font-size: 18px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-bottom: 2px;
      }
      
      .tally-invoice-title {
        font-size: 12px;
        font-weight: bold;
        text-decoration: underline;
        margin: 4px 0;
      }
      
      .tally-invoice-subtitle {
        font-size: 10px;
        font-style: italic;
        margin-bottom: 4px;
      }
      
      /* Compact spacing for Tally-style layout */
      .tally-template h1,
      .tally-template h2,
      .tally-template h3,
      .tally-template h4,
      .tally-template h5,
      .tally-template h6 {
        margin: 0 0 2px 0;
        line-height: 1.1;
      }
      
      .tally-template p,
      .tally-template div {
        margin: 0 0 1px 0;
      }
      
      .tally-template .MuiTypography-root {
        margin-bottom: 1px !important;
      }
      
      .tally-template .MuiBox-root {
        margin-bottom: 2px !important;
      }
      
      .tally-template .MuiGrid-item {
        padding: 2px !important;
      }
      
      .tally-info-section {
        padding: 2px 4px;
        min-height: 35px;
      }
      
      .tally-label {
        font-weight: bold;
        text-decoration: underline;
        font-size: 9px;
      }
      
      .tally-value {
        font-size: 9px;
        margin-left: 4px;
      }
      
      .tally-footer-text {
        font-size: 8px;
        text-align: center;
        font-style: italic;
        margin-top: 4px;
        border-top: 1px solid #000;
        padding-top: 2px;
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
        p: previewMode ? 2 : 0,
        bgcolor: 'white',
        minHeight: '270mm',
        border: '2px solid #000',
        fontFamily: '"Times New Roman", serif',
        boxShadow: previewMode ? '0 4px 20px rgba(0,0,0,0.1)' : 'none'
      }}>
        {/* Dynamic Company Header */}
        <Box className="tally-header" sx={{
          borderBottom: '1px double #000',
          textAlign: 'center',
          pb: 0.3,
          mb: 0.3
        }}>
          <Typography className="tally-invoice-subtitle" variant="body2" sx={{
            fontStyle: 'italic',
            fontSize: '0.6rem',
            fontFamily: '"Times New Roman", serif', position: 'relative',
            top: '1em',
            textAlign:'right',
            // maskPosition: 'absolute',
          }}>
            (Original for Recipient)
          </Typography>
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
            fontSize: '0.8rem',
            fontFamily: '"Times New Roman", serif',
            mb: 0.2,
            fontWeight: 'medium'
          }}>
            {companyInfo?.address || 'Complete Business Address with PIN Code'}
          </Typography>
          <Typography variant="body2" sx={{
            fontSize: '0.7rem',
            fontFamily: '"Times New Roman", serif',
            mb: 0.2
          }}>
            {companyInfo?.phone ? `Phone: ${companyInfo.phone}` : 'Phone: +91-XXXXXXXXXX'} | {companyInfo?.email ? `Email: ${companyInfo.email}` : 'Email: info@company.com'} | {companyInfo?.website ? `Website: ${companyInfo.website}` : 'Website: www.company.com'}
          </Typography>
          <Typography variant="body2" sx={{
            fontSize: '0.65rem',
            fontFamily: '"Times New Roman", serif',
            mb: 0.1,
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

        {/* Enhanced Invoice Details Section */}
        <Grid container spacing={0.5} sx={{ mb: 0.5 }}>
          {/* Invoice Information */}

           <Grid item xs={6} sx={{ flex: '1', textAlign: 'left', width: '30%' }}>
            <Box className="tally-section-border tally-info-section" sx={{
              border: '1px solid #000',
              p: 0.5,
              minHeight: '90px',
              mr: 0.1,
            }}>
              <Typography className="tally-label" variant="body2" sx={{
                fontWeight: 'bold',
                textDecoration: 'underline',
                fontSize: '0.7rem',
                mb: 0.1,
              }}>
                Bill To:
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 'bold', mb: 0.1 }}>
                {invoice.partyName || 'N/A'}
              </Typography>
              {invoice.partyAddress && (
                <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 0.1, lineHeight: 1.2 }}>
                  {invoice.partyAddress}
                </Typography>
              )}
              <Box sx={{  justifyContent: 'space-between', mb: 0.1, }}>
                <Typography variant="body2" sx={{ fontSize: '0.6rem', fontWeight: 'bold' }}>

                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.6rem' }}>
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
              border: '1px solid #000',
              p: 0.5,
              minHeight: '90px',
              mr: 0.25
            }}>
              <Typography className="tally-label" variant="body2" sx={{
                fontWeight: 'bold',
                textDecoration: 'underline',
                fontSize: '0.7rem',
                mb: 0.2
              }}>
                Quotation Information:
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                  Quotation No.:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.7rem',fontWeight: '800' }}>
                  {invoice.invoiceNumber || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                  Quotation Date:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.65rem' }}>
                  {formatDate(invoice.date)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                  Due Date:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.65rem' }}>
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
        <Box sx={{ mb: 1 }}>
          <TableContainer>
            <Table className="tally-table" sx={{ border: '1px solid #000' }}>
              <TableHead>
                <TableRow>
                  <TableCell className="center-cell" sx={{
                    border: '1px solid #000',
                    bgcolor: '#f0f0f0',
                    fontWeight: 'bold',
                    width: '5%',
                    fontSize: '0.6rem'
                  }}>
                    S.No.
                  </TableCell>
                  <TableCell sx={{
                    border: '1px solid #000',
                    bgcolor: '#f0f0f0',
                    fontWeight: 'bold',
                    width: '35%',
                    fontSize: '0.6rem'
                  }}>
                    Description of Goods
                  </TableCell>

                  <TableCell className="center-cell" sx={{
                    border: '1px solid #000',
                    bgcolor: '#f0f0f0',
                    fontWeight: 'bold',
                    width: '8%',
                    fontSize: '0.6rem'
                  }}>
                    Qty
                  </TableCell>
                  <TableCell className="center-cell" sx={{
                    border: '1px solid #000',
                    bgcolor: '#f0f0f0',
                    fontWeight: 'bold',
                    width: '6%',
                    fontSize: '0.6rem'
                  }}>
                    UOM
                  </TableCell>
                  <TableCell className="number-cell" sx={{
                    border: '1px solid #000',
                    bgcolor: '#f0f0f0',
                    fontWeight: 'bold',
                    width: '12%',
                    fontSize: '0.6rem'
                  }}>
                    Rate (₹)
                  </TableCell>
                  <TableCell className="number-cell" sx={{
                    border: '1px solid #000',
                    bgcolor: '#f0f0f0',
                    fontWeight: 'bold',
                    width: '8%',
                    fontSize: '0.6rem'
                  }}>
                    Disc. %
                  </TableCell>
                  <TableCell className="number-cell" sx={{
                    border: '1px solid #000',
                    bgcolor: '#f0f0f0',
                    fontWeight: 'bold',
                    width: '18%',
                    fontSize: '0.6rem'
                  }}>
                    Amount (₹)
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.items?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="center-cell" sx={{ border: '1px solid #000', fontSize: '0.7rem' }}>
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #000', fontSize: '0.7rem' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.7rem' }}>
                        {item.name}
                      </Typography>
                      {item.description && (
                        <Typography variant="caption" sx={{ color: '#666', display: 'block', fontSize: '0.65rem' }}>
                          {item.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell className="center-cell" sx={{ border: '1px solid #000', fontSize: '0.7rem' }}>
                      {item.quantity}
                    </TableCell>
                    <TableCell className="center-cell" sx={{ border: '1px solid #000', fontSize: '0.7rem' }}>
                      {item.unitOfMeasurement || 'PCS'}
                    </TableCell>
                    <TableCell className="number-cell" sx={{ border: '1px solid #000', fontSize: '0.7rem' }}>
                      {(item.price || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="center-cell" sx={{ border: '1px solid #000', fontSize: '0.7rem' }}>
                      {item.discount > 0 ? `${item.discount}%` : '0.00'}
                    </TableCell>
                    <TableCell className="number-cell" sx={{ border: '1px solid #000', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      {(item.totalAmount || item.finalPrice || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Empty rows for spacing - Tally style */}
                {Array.from({ length: Math.max(0, 20 - (invoice.items?.length || 0)) }).map((_, index) => (
                  <TableRow key={`empty-${index}`}>
                    <TableCell sx={{ border: '1px solid #000', height: '22px', fontSize: '0.7rem' }}>&nbsp;</TableCell>
                    <TableCell sx={{ border: '1px solid #000', fontSize: '0.7rem' }}>&nbsp;</TableCell>
                    <TableCell sx={{ border: '1px solid #000', fontSize: '0.7rem' }}>&nbsp;</TableCell>
                    <TableCell sx={{ border: '1px solid #000', fontSize: '0.7rem' }}>&nbsp;</TableCell>
                    <TableCell sx={{ border: '1px solid #000', fontSize: '0.7rem' }}>&nbsp;</TableCell>
                    <TableCell sx={{ border: '1px solid #000', fontSize: '0.7rem' }}>&nbsp;</TableCell>
                    <TableCell sx={{ border: '1px solid #000', fontSize: '0.7rem' }}>&nbsp;</TableCell>
                  </TableRow>
                ))}

                {/* Total Rows - Tally Style (without CGST/SGST) */}
                <TableRow className="tally-total-row">
                  <TableCell colSpan={6} sx={{
                    border: '1px solid #000',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    bgcolor: '#f8f8f8',
                    fontSize: '0.75rem'
                  }}>
                    Sub Total:
                  </TableCell>
                  <TableCell className="number-cell" sx={{
                    border: '1px solid #000',
                    fontWeight: 'bold',
                    bgcolor: '#f8f8f8',
                    fontSize: '0.75rem'
                  }}>
                    {formatCurrency(invoice.subtotal)}
                  </TableCell>
                </TableRow>

                {/* {(invoice.totalDiscount || invoice.discount || 0) > 0 && (
                  <TableRow className="tally-total-row">
                    <TableCell colSpan={6} sx={{
                      border: '1px solid #000',
                      textAlign: 'right',
                      fontWeight: 'bold',
                      bgcolor: '#f8f8f8',
                      fontSize: '0.75rem'
                    }}>
                      Less: Discount:
                    </TableCell>
                    <TableCell className="number-cell" sx={{
                      border: '1px solid #000',
                      fontWeight: 'bold',
                      color: '#d32f2f',
                      bgcolor: '#f8f8f8',
                      fontSize: '0.75rem'
                    }}>
                      {formatCurrency(invoice.totalDiscount || invoice.discount)}
                    </TableCell>
                  </TableRow>
                )} */}

                <TableRow className="tally-total-row">
                  <TableCell colSpan={6} sx={{
                    border: '1px solid #000',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    bgcolor: '#f8f8f8',
                    fontSize: '0.75rem'
                  }}>
                    Transport Charge:
                  </TableCell>
                  <TableCell className="number-cell" sx={{
                    border: '1px solid #000',
                    fontWeight: 'bold',
                    bgcolor: '#f8f8f8',
                    fontSize: '0.75rem'
                  }}>
                    {formatCurrency(invoice.transportCharges || 0)}
                  </TableCell>
                </TableRow>

                <TableRow className="tally-grand-total">
                  <TableCell colSpan={6} sx={{
                    border: '2px solid #000',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    bgcolor: '#e8e8e8'
                  }}>
                    TOTAL AMOUNT: {numberToWords(invoice.totalAmount || invoice.total || 0)}
                  </TableCell>
                  <TableCell className="number-cell" sx={{
                    border: '2px solid #000',
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    bgcolor: '#e8e8e8'
                  }}>
                    {formatCurrency(invoice.totalAmount || invoice.total)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

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
          p: 1,
          mb: 1
        }}>
          <Typography className="tally-label" variant="body2" sx={{
            fontWeight: 'bold',
            textDecoration: 'underline',
            fontSize: '0.75rem',
            mb: 0.5
          }}>
            Declaration: 
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.7rem', lineHeight: 1.3 }}>
            We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
          </Typography>
        </Box>

        {/* Terms & Conditions */}
        <Box className="tally-terms" sx={{
          border: '1px solid #000',
          p: 1,

        }}>
          <Typography className="tally-label" variant="body2" sx={{
            fontWeight: 'bold',
            textDecoration: 'underline',
            fontSize: '0.75rem',
            mb: 0.2
          }}>
            Terms & Conditions:
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.65rem', mb: 0.3 }}>
            1. Goods once sold will not be taken back.
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.65rem', mb: 0.3 }}>
            2. Interest @ 18% p.a. will be charged if the payment is not made within the stipulated time.
          </Typography>

          <Typography variant="body2" sx={{ fontSize: '0.65rem' }}>
            3. Our risk and responsibility ceases the moment goods leave our premises.
          </Typography>
        </Box>

        {/* Signatures - Tally Style */}
        <Box className="tally-signature-section" sx={{ bborder: '1px solid #000' }}>
          <Grid container>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'left', p: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'bold', mb: 1 }}>
                  Receiver's Signature:
                </Typography>
                <Box sx={{
                  borderBottom: '1px solid #000',
                  width: '180px',
                  ml: 'auto',
                }} />
              </Box>
            </Grid>
            <Grid item xs={6} sx={{ flex: 1, textAlign: 'right', }}>
              <Box sx={{ textAlign: 'right', p: 0.1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'bold', mb: 1 }}>
                  for {companyInfo?.name || 'COMPANY NAME'}
                </Typography>
                {/* <Box sx={{ 
                         borderBottom: '1px solid #000', 
                         width: '180px', 
                         height:'30px',
                         float:'right',
                       }} /> */}

                <Typography variant="body2" sx={{
                  mb: 2,
                  marginLeft: '366px',
                  marginTop: '10px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  textAlign: 'right'
                }}>
                  Authorised Signatory
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
        {/* Footer */}
        <Box className="tally-footer-text" sx={{ bottom: 0, width: '100%', p: 1 }}>
          <Typography variant="caption" sx={{ fontSize: '0.65rem', textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
            This is a Computer Generated Invoice
          </Typography>
        </Box>
      </Box>
    </>
  );
}