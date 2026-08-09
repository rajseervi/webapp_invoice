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
        border-top: none !important;
        border-bottom: none !important;
        padding: 2px 3px;
        text-align: left;
        vertical-align: top;
        line-height: 1.4;
      }
      
      .tally-table thead tr {
        border-bottom: none !important;
        border-top: none !important;
      }
      
      .tally-table thead th {
        border-bottom: none !important;
        border-top: none !important;
      }
      
      .tally-table tbody tr:last-child td {
        border-bottom: none !important;
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
        page-break-inside: avoid;
      }
      
      .signature-container {
        display: flex;
        flex-direction: row;
        width: 100%;
        page-break-inside: avoid;
      }
      
      .signature-box {
        flex: 1;
        padding: 3px;
        display: flex;
        flex-direction: column;
        page-break-inside: avoid;
      }
      
      .signature-box-left {
        border-right: 1px solid #000;
      }
      
      .signature-box-middle {
        border-right: 1px solid #000;
      }
      
      .signature-header {
        font-weight: bold;
        font-size: 8px;
        margin-bottom: 2px;
        text-transform: uppercase;
        border-bottom: 1px solid #000;
        padding-bottom: 2px;
      }
      
      .signature-line {
        border: 1px solid #000;
        height: 20px;
        margin-bottom: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 7px;
        background: #fafafa;
      }
      
      .signature-field {
        font-size: 7px;
        margin-bottom: 1px;
        line-height: 1.2;
      }
      
      .stamp-container {
        flex: 1;
        padding: 3px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        page-break-inside: avoid;
      }
      
      .stamp-box {
        border: 2px dashed #000;
        width: 90%;
        height: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f5f5;
        font-size: 7px;
        color: #ccc;
        font-style: italic;
        text-align: center;
      }
      
      .payment-information-section {
        border: 1px solid #000;
        margin-top: 4px;
        margin-bottom: 4px;
        padding: 3px 2px;
        page-break-inside: avoid;
        background-color: #fafafa;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .payment-info-header {
        font-weight: bold;
        font-size: 8px;
        margin-bottom: 3px;
        text-transform: uppercase;
        text-decoration: underline;
        line-height: 1;
        border-bottom: 1px solid #000;
        padding: 2px 2px 2px 2px;
        color: #000;
      }
      
      .payment-rows-container {
        display: flex;
        flex-direction: column;
        width: 100%;
        page-break-inside: avoid;
      }
      
      .payment-row {
        flex: 1;
        display: flex;
        flex-direction: row;
        width: 100%;
        page-break-inside: avoid;
      }
      
      .payment-row:first-child {
        border-bottom: 1px solid #000;
      }
      
      .payment-row-field {
        flex: 1;
        padding: 2px 3px;
        display: flex;
        flex-direction: column;
        page-break-inside: avoid;
        justify-content: flex-start;
      }
      
      .payment-row-field:first-child {
        border-right: 1px solid #000;
      }
      
      .payment-info-field {
        display: grid;
        grid-template-columns: auto 1fr;
        column-gap: 2px;
        margin-bottom: 2px;
        font-size: 7px;
        line-height: 1.15;
        align-items: flex-start;
      }
      
      .payment-info-label {
        font-weight: bold;
        color: #000;
        white-space: nowrap;
        padding-right: 2px;
        vertical-align: top;
      }
      
      .payment-info-value {
        word-break: break-word;
        overflow-wrap: break-word;
        color: #333;
        line-height: 1.15;
        text-align: left;
      }
      
      .payment-info-divider {
        height: 1px;
        background-color: #999;
        margin: 1px 0;
      }
      
      .payment-field-group {
        page-break-inside: avoid;
      }
      
      .payment-field-group:last-child {
        margin-bottom: 0;
      }
      
      .tally-company-header {
        font-size: 30px;
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

    const bankDetails = companyInfo?.bankDetails;
    const hasBankDetails = !!bankDetails && Object.values(bankDetails).some((value) => typeof value === 'string' ? value.trim() !== '' : false);
    const getDisplayValue = (value?: string | null) => {
        if (!value) {
            return null;
        }
        const trimmedValue = value.trim();
        return trimmedValue ? trimmedValue : null;
    };
    const displayCompanyName = getDisplayValue(companyInfo?.name);
    const accountHolderName = getDisplayValue(bankDetails?.accountHolderName);
    const bankName = getDisplayValue(bankDetails?.bankName);
    const accountNumber = getDisplayValue(bankDetails?.accountNumber);
    const branch = getDisplayValue(bankDetails?.branch);
    const ifscCode = getDisplayValue(bankDetails?.ifscCode);
    const upiId = getDisplayValue(bankDetails?.upiId);
    const verticalBorder = '1px solid #000';
    const totalItemRows = invoice.items?.length || 0;
    const fillerRowCount = Math.max(0, 20 - totalItemRows);

    return (
        <>
        <style>{ printStyles } </style>
        < Box className = "tally-template tally-border" sx = {{
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
    }
}>
    {/* Dynamic Company Header */ }
    < Box className = "tally-header" sx = {{
    borderBottom: '1px double #000',
        textAlign: 'center',
            pb: 0.2,
                mb: 0.2,
                    position: 'relative'
}}>
    {/* Optional Copy Label (inside template, top-right) */ }
{
    copyLabel && (
        <Typography className="tally-invoice-subtitle" variant = "body2" sx = {{
        fontStyle: 'italic',
            fontSize: '0.65rem',
                fontFamily: '"Times New Roman", serif',
                    position: 'absolute',
                        top: 4,
                            right: 6,
                                textAlign: 'right',
                                    backgroundColor: 'white',
                                        px: 0.6,
            }
}>
    ({ copyLabel })
    </Typography>
          )}
<Typography className="tally-company-header" variant = "h4" sx = {{
    fontWeight: 'bold',
        fontSize: '2rem',
            fontFamily: '"Times New Roman", serif',
                textTransform: 'uppercase',
                    letterSpacing: '2px',
                        mb: 0.1
}}>
    { companyInfo?.name || 'COMPANY NAME'}
</Typography>
    < Typography variant = "body2" sx = {{
    fontSize: '0.95rem',
        fontFamily: '"Times New Roman", serif',
            mb: 0.25,
                fontWeight: 'medium'
}}>
    { companyInfo?.address || 'Complete Business Address with PIN Code'}
</Typography>
    < Typography variant = "body2" sx = {{
    fontSize: '0.85rem',
        fontFamily: '"Times New Roman", serif',
            mb: 0.25
}}>
    { companyInfo?.phone? `Phone: ${companyInfo.phone}` : 'Phone: +91-XXXXXXXXXX'} | { companyInfo?.email? `Email: ${companyInfo.email}` : 'Email: info@company.com'} | { companyInfo?.website? `Website: ${companyInfo.website}` : 'Website: www.company.com'}
</Typography>
    < Typography variant = "body2" sx = {{
    fontSize: '0.75rem',
        fontFamily: '"Times New Roman", serif',
            mb: 0.15,
                fontStyle: 'italic'
}}>
    {/* {companyInfo?.gstin ? `GSTIN: ${companyInfo.gstin}` : 'GSTIN: 00XXXXX0000X0X0'} | PAN: XXXXX0000X | CIN: U00000XX0000XXX000 */ }
    </Typography>

    < Typography className = "tally-invoice-title" variant = "h5" sx = {{
    fontWeight: 'bold',
        fontSize: '0.9rem',
            fontFamily: '"Times New Roman", serif',
                textDecoration: 'underline',
                    mb: 0.1
}}>
    PERFORMA QUOTATION
        </Typography>

        </Box>

        < Box className = "tally-content" sx = {{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
            {/* Enhanced Invoice Details Section */ }
            < Grid container spacing = { 0.1} sx = {{ mb: 0.1 }}>
                {/* Invoice Information */ }

                < Grid item xs = { 6} sx = {{ flex: '1', textAlign: 'left', width: '30%' }}>
                    <Box className="tally-section-border tally-info-section" sx = {{
    p: 0.2,
        height: 'auto',
            mr: 0.1,
                pb: 0.2,
            }}>
    <Typography className="tally-label" variant = "body2" sx = {{
    fontWeight: 'bold',
        textDecoration: 'underline',
            fontSize: '0.85rem',
                mb: 0.15,
              }}>
    Bill To:
</Typography>
    < Typography variant = "body2" sx = {{
    fontSize: (invoice.partyName && invoice.partyName.length > 20) ? '0.85rem' : '1rem',
        fontWeight: 'bold',
            mb: 0.15,
                overflow: 'hidden',
                    textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
}}>
    { invoice.partyName || 'N/A' }
    </Typography>
{
    invoice.partyAddress && (
        <Typography variant="body2" sx = {{ fontSize: '0.85rem', mb: 0.15, lineHeight: 1.25 }
}>
    { invoice.partyAddress }
    </Typography>
              )}
<Box sx={ { justifyContent: 'space-between', mb: 0.15, } }>
    <Typography variant="body2" sx = {{ fontSize: '0.7rem', fontWeight: 'bold' }}>

        </Typography>
        < Typography variant = "body2" sx = {{ fontSize: '0.7rem' }}>
            Phone: { invoice.partyPhone || 'N/A' }
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


    < Grid item xs = { 6} sx = {{ flex: '1', textAlign: 'left', width: '30%' }}>
        <Box className="tally-section-border tally-info-section" sx = {{
    p: 0.2,
        height: 'auto',
            mr: 0.25,
                pb: 0.2,
            }}>
    <Typography className="tally-label" variant = "body2" sx = {{
    fontWeight: 'bold',
        textDecoration: 'underline',
            fontSize: '0.85rem',
                mb: 0.2
}}>
    Quotation Information:
</Typography>
    < Box sx = {{ display: 'flex', justifyContent: 'space-between', mb: 0.12 }}>
        <Typography variant="body2" sx = {{ fontSize: '0.75rem', fontWeight: 'bold' }}>
            Quotation No.:
</Typography>
    < Typography variant = "body2" sx = {{ fontSize: '0.8rem', fontWeight: '800' }}>
        { invoice.invoiceNumber || 'N/A' }
        </Typography>
        </Box>
        < Box sx = {{ display: 'flex', justifyContent: 'space-between', mb: 0.12 }}>
            <Typography variant="body2" sx = {{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                Quotation Date:
</Typography>
    < Typography variant = "body2" sx = {{ fontSize: '0.75rem' }}>
        { formatDate(invoice.date) }
        </Typography>
        </Box>
        < Box sx = {{ display: 'flex', justifyContent: 'space-between', mb: 0.12 }}>
            <Typography variant="body2" sx = {{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                Due Date:
</Typography>
    < Typography variant = "body2" sx = {{ fontSize: '0.75rem' }}>
        { invoice.dueDate ? formatDate(invoice.dueDate) : formatDate(new Date(new Date(invoice.date).getTime() + 30 * 24 * 60 * 60 * 1000)) }
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


{/* Items Table - Tally Style */ }
<Box sx={ { mb: 0.2 } }>
    <TableContainer>
    <Table className="tally-table" sx = {{ border: 'none', borderCollapse: 'collapse' }}>
        <TableHead>
        <TableRow sx={ { border: 'none' } }>
            <TableCell className="center-cell" sx = {{
    border: 'none',
        bgcolor: '#f0f0f0',
            fontWeight: 'bold',
                width: '5%',
                    fontSize: '0.6rem',
                        py: 0.3,
                            px: 0.3,
                                borderLeft: verticalBorder,
                                    borderRight: verticalBorder
}}>
    S.No.
                  </TableCell>
    < TableCell sx = {{
    border: 'none',
        bgcolor: '#f0f0f0',
            fontWeight: 'bold',
                width: '35%',
                    fontSize: '0.6rem',
                        py: 0.3,
                            px: 0.3,
                                borderRight: verticalBorder
}}>
    Description of Goods
        </TableCell>
        < TableCell className = "center-cell" sx = {{
    border: 'none',
        bgcolor: '#f0f0f0',
            fontWeight: 'bold',
                width: '8%',
                    fontSize: '0.6rem',
                        py: 0.3,
                            px: 0.3,
                                borderRight: verticalBorder
}}>
    Qty
    </TableCell>
    < TableCell className = "center-cell" sx = {{
    border: 'none',
        bgcolor: '#f0f0f0',
            fontWeight: 'bold',
                width: '6%',
                    fontSize: '0.6rem',
                        py: 0.3,
                            px: 0.3,
                                borderRight: verticalBorder
}}>
    UOM
    </TableCell>
    < TableCell className = "number-cell" sx = {{
    border: 'none',
        bgcolor: '#f0f0f0',
            fontWeight: 'bold',
                width: '12%',
                    fontSize: '0.6rem',
                        py: 0.3,
                            px: 0.3,
                                borderRight: verticalBorder
}}>
    Rate(₹)
    </TableCell>
    < TableCell className = "number-cell" sx = {{
    border: 'none',
        bgcolor: '#f0f0f0',
            fontWeight: 'bold',
                width: '8%',
                    fontSize: '0.6rem',
                        py: 0.3,
                            px: 0.3,
                                borderRight: verticalBorder
}}>
    Disc. %
    </TableCell>
{/* <TableCell className="number-cell" sx={{
                    border: 'none',
                    bgcolor: '#f0f0f0',
                    fontWeight: 'bold',
                    width: '8%',
                    fontSize: '0.6rem',
                    py: 0.3,
                    px: 0.3,
                    borderRight: verticalBorder
                  }}>
                    DP %
                  </TableCell> */}
<TableCell className="number-cell" sx = {{
    border: 'none',
        bgcolor: '#f0f0f0',
            fontWeight: 'bold',
                width: '18%',
                    fontSize: '0.6rem',
                        py: 0.3,
                            px: 0.3,
                                borderLeft: verticalBorder,
                                    borderRight: verticalBorder
}}>
    Amount(₹)
    </TableCell>
    </TableRow>
    </TableHead>
    <TableBody>
{
    invoice.items?.map((item, index) => (
        <TableRow key= { index } sx = {{
        height: 'auto',
        borderBottom: fillerRowCount === 0 && index === totalItemRows - 1 ? '2px solid #000' : 'none'
    }}>
        <TableCell className="center-cell" sx = {{
    border: 'none',
        fontSize: '0.7rem',
            py: 0.3,
                px: 0.3,
                    borderLeft: verticalBorder,
                        borderRight: verticalBorder
}}>
    { index + 1}
</TableCell>
    < TableCell sx = {{
    border: 'none',
        fontSize: '0.7rem',
            py: 0.3,
                px: 0.3,
                    borderRight: verticalBorder
}}>
    <Typography variant="body2" sx = {{ fontWeight: 'medium', fontSize: '0.75rem' }}>
        { item.name }
        </Typography>
{
    item.description && (
        <Typography variant="caption" sx = {{ color: '#666', display: 'block', fontSize: '0.7rem', whiteSpace: 'pre-line' }
}>
    { item.description }
    </Typography>
                      )}
</TableCell>
    < TableCell className = "center-cell" sx = {{
    border: 'none',
        fontSize: '0.7rem',
            py: 0.3,
                px: 0.3,
                    borderRight: verticalBorder
}}>
    { item.quantity }
    </TableCell>
    < TableCell className = "center-cell" sx = {{
    border: 'none',
        fontSize: '0.7rem',
            py: 0.3,
                px: 0.3,
                    borderRight: verticalBorder
}}>
    { item.unitOfMeasurement || 'PCS' }
    </TableCell>
    < TableCell className = "number-cell" sx = {{
    border: 'none',
        fontSize: '0.7rem',
            py: 0.3,
                px: 0.3,
                    borderRight: verticalBorder
}}>
    {(item.price || 0).toFixed(2)}
</TableCell>
    < TableCell className = "center-cell" sx = {{
    border: 'none',
        fontSize: '0.7rem',
            py: 0.3,
                px: 0.3,
                    borderRight: verticalBorder
}}>
    { item.discount > 0 ? `${item.discount}%` : '0.00' }
    </TableCell>
{/* <TableCell className="center-cell" sx={{ 
                      border: 'none', 
                      fontSize: '0.7rem', 
                      py: 0.3,
                      px: 0.3,
                      borderRight: verticalBorder
                    }}>
                      {typeof (item as any).margin === 'number' ? `${(item as any).margin}%` : '0.00'}
                    </TableCell> */}
<TableCell className="number-cell" sx = {{
    border: 'none',
        fontSize: '0.7rem',
            fontWeight: 'bold',
                py: 0.3,
                    px: 0.3,
                        borderLeft: verticalBorder,
                            borderRight: verticalBorder
}}>
    {(
        (item.quantity || 0) * (item.price || 0) * (1 - (item.discount || 0) / 100)
    ).toFixed(2)}
</TableCell>
    </TableRow>
                ))}
{
    Array.from({ length: fillerRowCount }).map((_, fillerIndex) => (
        <TableRow key= {`filler-${fillerIndex}`} sx = {{
    height: 'auto',
        borderBottom: fillerIndex === fillerRowCount - 1 ? '2px solid #000' : 'none'
}}>
    <TableCell className="center-cell" sx = {{
    border: 'none',
        fontSize: '0.7rem',
            py: 0.3,
                px: 0.3,
                    borderLeft: verticalBorder,
                        borderRight: verticalBorder
}}>
                      & nbsp;
</TableCell>
    < TableCell sx = {{
    border: 'none',
        fontSize: '0.7rem',
            py: 0.3,
                px: 0.3,
                    borderRight: verticalBorder
}}>
                      & nbsp;
</TableCell>
    < TableCell className = "center-cell" sx = {{
    border: 'none',
        fontSize: '0.7rem',
            py: 0.3,
                px: 0.3,
                    borderRight: verticalBorder
}}>
                      & nbsp;
</TableCell>
    < TableCell className = "center-cell" sx = {{
    border: 'none',
        fontSize: '0.7rem',
            py: 0.3,
                px: 0.3,
                    borderRight: verticalBorder
}}>
                      & nbsp;
</TableCell>
    < TableCell className = "number-cell" sx = {{
    border: 'none',
        fontSize: '0.7rem',
            py: 0.3,
                px: 0.3,
                    borderRight: verticalBorder
}}>
                      & nbsp;
</TableCell>
    < TableCell className = "center-cell" sx = {{
    border: 'none',
        fontSize: '0.7rem',
            py: 0.3,
                px: 0.3,
                    borderRight: verticalBorder
}}>
                      & nbsp;
</TableCell>
    < TableCell className = "number-cell" sx = {{
    border: 'none',
        fontSize: '0.7rem',
            py: 0.3,
                px: 0.3,
                    borderLeft: verticalBorder,
                        borderRight: verticalBorder
}}>
                      & nbsp;
</TableCell>
    </TableRow>
                ))}
</TableBody>
    </Table>
    </TableContainer>
    </Box>

{/* Totals Summary */ }
<Box sx={ { mb: 0.2, display: 'flex', justifyContent: 'flex-end', pr: 0 } }>
{/* <Box sx={{ border: '1px solid #000', width: '45%', minWidth: '180px' }}>
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
          </Box> */}
    </Box>
    </Box>
    < Box className = "tally-bottom-section" sx = {{ mt: 'auto', display: 'flex', flexDirection: 'column', width: '100%', flex: '0 0 auto' }}>
        <Box sx={ { mb: 0.15, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' } }>
        {/* <Typography className="tally-label" variant="body2" sx={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '0.7rem', mb: 0.1, lineHeight: 1, textAlign: 'right', width: '100%' }}>
            Totals Summary:
          </Typography> */}
            < Box sx = {{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                <Box sx={ { border: '1px solid #000', width: '45%', minWidth: '180px' } }>
                {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 0.2, borderBottom: '1px solid #ddd' }}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>Subtotal:</Typography>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                  ₹{(invoice.items?.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0) || 0).toFixed(2)}
                </Typography>
              </Box> */}
{/* <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 0.2, borderBottom: '1px solid #ddd' }}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>Discount:</Typography>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                  ₹{(invoice.items?.reduce((sum, item) => sum + (((item.quantity || 0) * (item.price || 0)) * ((item.discount || 0) / 100)), 0) || 0).toFixed(2)}
                </Typography>
              </Box> */}
<Box sx={ { display: 'flex', justifyContent: 'space-between', p: 0.2, bgcolor: '#e8e8e8', fontWeight: 'bold', border: '1px solid #000' } }>
    <Typography sx={ { fontSize: '0.75rem', fontWeight: 'bold' } }> Grand Total: </Typography>
        < Typography sx = {{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                  ₹{ (invoice.items?.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0) * (1 - (item.discount || 0) / 100)), 0) || 0).toFixed(2) }
</Typography>
    </Box>
    </Box>
    </Box>
    </Box>
{/* Payment Company Information */ }
{/* {hasBankDetails && (
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
              Payment Information:
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                {displayCompanyName && (
                  <Typography variant="body2" sx={{ fontSize: '0.7rem', mb: 0.2 }}>
                    <strong>Company:</strong> {displayCompanyName}
                  </Typography>
                )}
                {accountHolderName && (
                  <Typography variant="body2" sx={{ fontSize: '0.7rem', mb: 0.2 }}>
                    <strong>Account Holder:</strong> {accountHolderName}
                  </Typography>
                )}
                {bankName && (
                  <Typography variant="body2" sx={{ fontSize: '0.7rem', mb: 0.2 }}>
                    <strong>Bank Name:</strong> {bankName}
                  </Typography>
                )}
                {accountNumber && (
                  <Typography variant="body2" sx={{ fontSize: '0.7rem', mb: 0.2 }}>
                    <strong>Account No.:</strong> {accountNumber}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={6}>
                {branch && (
                  <Typography variant="body2" sx={{ fontSize: '0.7rem', mb: 0.2 }}>
                    <strong>Branch:</strong> {branch}
                  </Typography>
                )}
                {ifscCode && (
                  <Typography variant="body2" sx={{ fontSize: '0.7rem', mb: 0.2 }}>
                    <strong>IFSC Code:</strong> {ifscCode}
                  </Typography>
                )}
                {upiId && (
                  <Typography variant="body2" sx={{ fontSize: '0.7rem', mb: 0.2 }}>
                    <strong>UPI ID:</strong> {upiId}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Box>
        )} */}


{/* Declaration */ }
<Box className="tally-section-border" sx = {{
    border: '1px solid #000',
        p: 0.2,
            mb: 0.15,
                mt: 0.15,
                    width: '100%',
                        boxSizing: 'border-box',
                            overflow: 'hidden'
}}>
    <Typography className="tally-label" variant = "body2" sx = {{
    fontWeight: 'bold',
        textDecoration: 'underline',
            fontSize: '0.7rem',
                mb: 0.1,
                    lineHeight: 1
}}>
    Declaration:
</Typography>
    < Typography variant = "body2" sx = {{ fontSize: '0.65rem', lineHeight: 1.1, wordWrap: 'break-word' }}>
        We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
          </Typography>
            </Box>

{/* Terms & Conditions */ }
<Box className="tally-terms" sx = {{
    border: '1px solid #000',
        p: 0.2,
            mb: 0.15,
                mt: 0.15,
                    width: '100%',
                        boxSizing: 'border-box',
                            overflow: 'hidden'
}}>
    <Typography className="tally-label" variant = "body2" sx = {{
    fontWeight: 'bold',
        textDecoration: 'underline',
            fontSize: '0.7rem',
                mb: 0.05,
                    lineHeight: 1
}}>
    Terms & Conditions:
</Typography>
    < Typography variant = "body2" sx = {{ fontSize: '0.6rem', mb: 0.05, lineHeight: 1, wordWrap: 'break-word' }}>
        1.We declare that this invoice shows the actual price	of the goods described and that all particulars are true and correct
            </Typography>
            < Typography variant = "body2" sx = {{ fontSize: '0.6rem', mb: 0.05, lineHeight: 1, wordWrap: 'break-word' }}>
                Note: Warrenty not covered for physical damage
                    </Typography>


                    </Box>

       {/* Payment Information Section - 4 Row Layout (8 Fields) - Enhanced Print View */ }
       {
    (companyInfo?.bankName || companyInfo?.accountNumber || companyInfo?.ifscCode || companyInfo?.accountHolder) && (
        <Box className="payment-information-section" sx = {{
        border: '1px solid #000',
            mt: 0.15,
                mb: 0.15,
                    p: '2px',
                        width: '100%',
                            boxSizing: 'border-box',
                                overflow: 'hidden',
                                    backgroundColor: '#fafafa'
    }
}>
    <Typography className="payment-info-header" variant = "body2" sx = {{
    fontWeight: 'bold',
        textDecoration: 'underline',
            fontSize: '0.7rem',
                mb: 0.12,
                    lineHeight: 1,
                        textTransform: 'uppercase',
                            borderBottom: '1px solid #000',
                                pb: 0.12,
                                    px: 0.15
}}>
    Payment Information
        </Typography>

{/* 4-Row Layout Container */ }
<Box sx={ { display: 'flex', flexDirection: 'column', width: '100%', mt: 0.1 } }>

    {/* Row 1: Bank Name & Account Number */ }
    < Box sx = {{ display: 'flex', flexDirection: 'row', width: '100%', borderBottom: '1px solid #000', pb: 0.1, mb: 0.1 }}>

        {/* Row 1, Left Field - Bank Name */ }
        < Box className = "payment-field-group" sx = {{ flex: 1, pr: 0.15, pl: 0.15, display: 'flex', flexDirection: 'column' }}>
            <Box className="payment-info-field" sx = {{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '2px' }}>
                <Typography className="payment-info-label" variant = "body2" sx = {{
    fontWeight: 'bold',
        fontSize: '0.65rem',
            whiteSpace: 'nowrap',
                color: '#000'
}}>
    Bank Name:
</Typography>
    < Typography className = "payment-info-value" variant = "body2" sx = {{
    fontSize: '0.65rem',
        flex: 1,
            wordBreak: 'break-word',
                color: '#333'
}}>
    { companyInfo?.bankName || 'N/A'}
</Typography>
    </Box>
    </Box>

{/* Vertical Divider */ }
<Box sx={ { borderRight: '1px solid #000', mx: 0 } } />

{/* Row 1, Right Field - Account Number */ }
<Box className="payment-field-group" sx = {{ flex: 1, pr: 0.15, pl: 0.15, display: 'flex', flexDirection: 'column' }}>
    <Box className="payment-info-field" sx = {{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '2px' }}>
        <Typography className="payment-info-label" variant = "body2" sx = {{
    fontWeight: 'bold',
        fontSize: '0.65rem',
            whiteSpace: 'nowrap',
                color: '#000'
}}>
    Account No:
</Typography>
    < Typography className = "payment-info-value" variant = "body2" sx = {{
    fontSize: '0.65rem',
        flex: 1,
            wordBreak: 'break-word',
                overflowWrap: 'break-word',
                    color: '#333'
}}>
    { companyInfo?.accountNumber || 'N/A'}
</Typography>
    </Box>
    </Box>

    </Box>

{/* Row 2: IFSC Code & Account Holder */ }
<Box sx={ { display: 'flex', flexDirection: 'row', width: '100%', borderBottom: '1px solid #000', pb: 0.1, mb: 0.1, pt: 0.1 } }>

    {/* Row 2, Left Field - IFSC Code */ }
    < Box className = "payment-field-group" sx = {{ flex: 1, pr: 0.15, pl: 0.15, display: 'flex', flexDirection: 'column' }}>
        <Box className="payment-info-field" sx = {{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '2px' }}>
            <Typography className="payment-info-label" variant = "body2" sx = {{
    fontWeight: 'bold',
        fontSize: '0.65rem',
            whiteSpace: 'nowrap',
                color: '#000'
}}>
    IFSC Code:
</Typography>
    < Typography className = "payment-info-value" variant = "body2" sx = {{
    fontSize: '0.65rem',
        flex: 1,
            wordBreak: 'break-word',
                color: '#333'
}}>
    { companyInfo?.ifscCode || 'N/A'}
</Typography>
    </Box>
    </Box>

{/* Vertical Divider */ }
<Box sx={ { borderRight: '1px solid #000', mx: 0 } } />

{/* Row 2, Right Field - Account Holder */ }
<Box className="payment-field-group" sx = {{ flex: 1, pr: 0.15, pl: 0.15, display: 'flex', flexDirection: 'column' }}>
    <Box className="payment-info-field" sx = {{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '2px' }}>
        <Typography className="payment-info-label" variant = "body2" sx = {{
    fontWeight: 'bold',
        fontSize: '0.65rem',
            whiteSpace: 'nowrap',
                color: '#000'
}}>
    A / C Holder:
</Typography>
    < Typography className = "payment-info-value" variant = "body2" sx = {{
    fontSize: '0.65rem',
        flex: 1,
            wordBreak: 'break-word',
                color: '#333'
}}>
    { companyInfo?.accountHolder || 'N/A'}
</Typography>
    </Box>
    </Box>

    </Box>

{/* Row 3: UPI ID & Payment Mode */ }
<Box sx={ { display: 'flex', flexDirection: 'row', width: '100%', borderBottom: '1px solid #000', pb: 0.1, mb: 0.1, pt: 0.1 } }>

    {/* Row 3, Left Field - UPI ID */ }
    < Box className = "payment-field-group" sx = {{ flex: 1, pr: 0.15, pl: 0.15, display: 'flex', flexDirection: 'column' }}>
        <Box className="payment-info-field" sx = {{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '2px' }}>
            <Typography className="payment-info-label" variant = "body2" sx = {{
    fontWeight: 'bold',
        fontSize: '0.65rem',
            whiteSpace: 'nowrap',
                color: '#000'
}}>
    UPI ID:
</Typography>
    < Typography className = "payment-info-value" variant = "body2" sx = {{
    fontSize: '0.65rem',
        flex: 1,
            wordBreak: 'break-word',
                color: '#333'
}}>
    { companyInfo?.upiId || 'N/A'}
</Typography>
    </Box>
    </Box>

{/* Vertical Divider */ }
<Box sx={ { borderRight: '1px solid #000', mx: 0 } } />

{/* Row 3, Right Field - Payment Mode */ }
<Box className="payment-field-group" sx = {{ flex: 1, pr: 0.15, pl: 0.15, display: 'flex', flexDirection: 'column' }}>
    <Box className="payment-info-field" sx = {{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '2px' }}>
        <Typography className="payment-info-label" variant = "body2" sx = {{
    fontWeight: 'bold',
        fontSize: '0.65rem',
            whiteSpace: 'nowrap',
                color: '#000'
}}>
    Payment Mode:
</Typography>
    < Typography className = "payment-info-value" variant = "body2" sx = {{
    fontSize: '0.65rem',
        flex: 1,
            wordBreak: 'break-word',
                color: '#333'
}}>
    { companyInfo?.paymentMode || 'N/A'}
</Typography>
    </Box>
    </Box>

    </Box>

{/* Row 4: Swift Code & Account Type */ }
<Box sx={ { display: 'flex', flexDirection: 'row', width: '100%', pt: 0.1 } }>

    {/* Row 4, Left Field - Swift Code */ }
    < Box className = "payment-field-group" sx = {{ flex: 1, pr: 0.15, pl: 0.15, display: 'flex', flexDirection: 'column' }}>
        <Box className="payment-info-field" sx = {{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '2px' }}>
            <Typography className="payment-info-label" variant = "body2" sx = {{
    fontWeight: 'bold',
        fontSize: '0.65rem',
            whiteSpace: 'nowrap',
                color: '#000'
}}>
    Swift Code:
</Typography>
    < Typography className = "payment-info-value" variant = "body2" sx = {{
    fontSize: '0.65rem',
        flex: 1,
            wordBreak: 'break-word',
                color: '#333'
}}>
    { companyInfo?.swiftCode || 'N/A'}
</Typography>
    </Box>
    </Box>

{/* Vertical Divider */ }
<Box sx={ { borderRight: '1px solid #000', mx: 0 } } />

{/* Row 4, Right Field - Account Type */ }
<Box className="payment-field-group" sx = {{ flex: 1, pr: 0.15, pl: 0.15, display: 'flex', flexDirection: 'column' }}>
    <Box className="payment-info-field" sx = {{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '2px' }}>
        <Typography className="payment-info-label" variant = "body2" sx = {{
    fontWeight: 'bold',
        fontSize: '0.65rem',
            whiteSpace: 'nowrap',
                color: '#000'
}}>
    Account Type:
</Typography>
    < Typography className = "payment-info-value" variant = "body2" sx = {{
    fontSize: '0.65rem',
        flex: 1,
            wordBreak: 'break-word',
                color: '#333'
}}>
    { companyInfo?.accountType || 'N/A'}
</Typography>
    </Box>
    </Box>

    </Box>

    </Box>

    </Box>
       )}

{/* Notes Section */ }
{
    invoice.notes && (
        <Box className="tally-section-border" sx = {{
        border: '1px solid #000',
            p: 0.2,
                mb: 0.15,
                    mt: 0.15,
                        width: '100%',
                            boxSizing: 'border-box',
                                overflow: 'hidden'
    }
}>
    <Typography className="tally-label" variant = "body2" sx = {{
    fontWeight: 'bold',
        textDecoration: 'underline',
            fontSize: '0.7rem',
                mb: 0.1,
                    lineHeight: 1
}}>
    Notes:
</Typography>
    < Typography variant = "body2" sx = {{ fontSize: '0.65rem', lineHeight: 1.1, wordWrap: 'break-word' }}>
        { invoice.notes }
        </Typography>
        </Box>
       )}

{/* Signatures & Stamp Section - Improved for Stamping */ }
<Box className="tally-signature-section" sx = {{ borderTop: '1px solid #000', mt: 0.15, mb: 0, pt: 0.2, pb: 0.1, width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
    <Grid container spacing = { 0} sx = {{ width: '100%', height: '100%' }}>
        {/* Receiver's Signature Section - Left */ }
        < Grid item xs = { 4} sx = {{ borderRight: '1px solid #000', display: 'flex', flexDirection: 'column', p: 0.15 }}>
            <Box sx={ { display: 'flex', flexDirection: 'column', height: '100%' } }>
                <Typography variant="body2" sx = {{ fontSize: '0.65rem', fontWeight: 'bold', mb: 0.1, lineHeight: 1 }}>
                    RECEIVER'S SIGNATURE
                        </Typography>

{/* Signature box */ }
<Box sx={
    {
        border: '1px solid #000',
            width: '100%',
                height: '25px',
                    mb: 0.1,
                        display: 'flex',
                            alignItems: 'center',
                                justifyContent: 'center',
                                    bgcolor: '#fafafa',
                                        fontSize: '0.55rem',
                                            color: '#999'
    }
}>
    <Typography sx={ { fontSize: '0.55rem', color: '#999' } }> ______________ </Typography>
        </Box>

{/* Name line */ }
<Typography variant="body2" sx = {{ fontSize: '0.55rem', mb: 0.05, lineHeight: 1 }}>
    Name: _______________
        </Typography>

{/* Date line */ }
<Typography variant="body2" sx = {{ fontSize: '0.55rem', lineHeight: 1 }}>
    Date: _______________
        </Typography>
        </Box>
        </Grid>



{/* Company Stamp Section - Right */ }
<Grid item xs = { 4} sx = {{ display: 'flex', flexDirection: 'column', p: 0.15 }}>
    <Box sx={ { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' } }>
        <Typography variant="body2" sx = {{ fontSize: '0.65rem', fontWeight: 'bold', mb: 0.1, lineHeight: 1, textAlign: 'center' }}>
            COMPANY STAMP
                </Typography>

{/* Stamp box */ }
<Box sx={
    {
        border: '2px dashed #000',
            width: '90%',
                height: '35px',
                    display: 'flex',
                        alignItems: 'center',
                            justifyContent: 'center',
                                bgcolor: '#f5f5f5',
                                    fontSize: '0.6rem',
                                        color: '#bbb',
                                            fontStyle: 'italic'
    }
}>
    <Typography sx={ { fontSize: '0.6rem', color: '#bbb', textAlign: 'center' } }>
        [Place Stamp Here]
        </Typography>
        </Box>
        </Box>
        </Grid>
{/* Proprietor/Company Signature Section - Middle */ }
<Grid item xs = { 4} sx = {{ borderRight: '1px solid #000', display: 'flex', flexDirection: 'column', p: 0.15 }}>
    <Box sx={ { display: 'flex', flexDirection: 'column', height: '100%' } }>
        <Typography variant="body2" sx = {{ fontSize: '0.65rem', fontWeight: 'bold', mb: 0.1, lineHeight: 1 }}>
            PROPRIETOR'S SIGNATURE
                </Typography>

{/* Signature box */ }
<Box sx={
    {
        border: '1px solid #000',
            width: '100%',
                height: '25px',
                    mb: 0.1,
                        display: 'flex',
                            alignItems: 'center',
                                justifyContent: 'center',
                                    bgcolor: '#fafafa',
                                        fontSize: '0.55rem',
                                            color: '#999'
    }
}>
    <Typography sx={ { fontSize: '0.55rem', color: '#999' } }> ______________ </Typography>
        </Box>

{/* Name line */ }
<Typography variant="body2" sx = {{ fontSize: '0.55rem', mb: 0.05, lineHeight: 1 }}>
    Name: _______________
        </Typography>

{/* Date line */ }
<Typography variant="body2" sx = {{ fontSize: '0.55rem', lineHeight: 1 }}>
    Date: _______________
        </Typography>
        </Box>
        </Grid>

        </Grid>
        </Box>
{/* Footer */ }
<Box className="tally-footer-text" sx = {{ width: '100%', p: 0.1, mt: 0.1, mb: 0, boxSizing: 'border-box', borderTop: '1px solid #000' }}>
    <Typography variant="caption" sx = {{ fontSize: '0.6rem', textAlign: 'center', display: 'block', lineHeight: 1 }}>
        This is a Computer Generated Invoice
            </Typography>
            </Box>
            </Box>


            </Box>
            </>
  );
}