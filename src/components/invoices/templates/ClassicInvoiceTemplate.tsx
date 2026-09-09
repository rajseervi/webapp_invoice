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
  Grid
} from '@mui/material';
import { Invoice } from '@/types/invoice_no_gst';
import { CompanyInfo } from '@/types/company';
import { getCompanyInfo } from '@/services/settingsService';

interface ClassicInvoiceTemplateProps {
  invoice: Invoice;
  settings: any;
  previewMode: boolean;
  copyLabel?: string; // e.g., Original, Duplicate, Triplicate
}

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

export default function ClassicInvoiceTemplate({ invoice, settings, previewMode, copyLabel }: ClassicInvoiceTemplateProps) {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    const loadCompanyInfo = async () => {
      try {
        const info = await getCompanyInfo();
        setCompanyInfo(info);
      } catch (error) {
        console.error('Error loading company info:', error);
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
        display: block;
      }

      /* Each page is a fixed-height A4 content box that repeats the header */
      .tally-page {
        border: 1px solid #000 !important;
        page-break-after: always;
        break-after: page;
        width: 100%;
        min-height: calc(297mm - 16mm);
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        overflow: hidden;
      }

      .tally-page:last-child {
        page-break-after: auto;
        break-after: auto;
      }
      
      .tally-border {
        border: 1px solid #000 !important;
      }
      
      /* Page header - repeated on every page */
      .tally-page-header {
        width: 100% !important;
        background: #fff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        border-bottom: 1px solid #000 !important;
        padding: 0 !important;
        margin: 0 !important;
        box-sizing: border-box !important;
      }
      
      .tally-header {
        border-bottom: 2px double #000 !important;
        text-align: center;
        padding: 4px 0;
        margin-bottom: 2px;
        background: #fff !important;
      }
      
      .tally-page-header .tally-section-border {
        border: 1px solid #000 !important;
      }
      
      .tally-page-header .tally-info-section {
        padding: 2px 3px;
        min-height: 0 !important;
      }
      
      .tally-page-header .tally-label {
        font-weight: bold;
        text-decoration: underline;
        font-size: 12px !important;
      }
      
      .tally-section-border {
        border: 1px solid #000 !important;
      }
      
      .tally-table {
        border-collapse: collapse;
        width: 100%;
        font-size: 10px;
        height: 100% !important;
      }
      
      .tally-table-container {
        flex: 1;
        display: block;
        overflow: visible !important;
      }
      
      .tally-table tbody {
        display: table-row-group;
        height: auto !important;
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
      }
      
      .tally-label {
        font-weight: bold;
        text-decoration: underline;
        font-size: 12px !important;
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

      .tally-page-footer {
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
        max-width: 210mm;
        background: white;
        overflow: visible;
      }

      .tally-page {
        min-height: calc(297mm - 16mm);
        width: 100%;
      }
    }
  `;

  const verticalBorder = '1px solid #000';
  const rowsPerPage = 30;

  const totalItems = invoice.items?.length || 0;
  const pageCount = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const itemPages = Array.from({ length: pageCount }).map((_, pageIndex) => {
    const start = pageIndex * rowsPerPage;
    return (invoice.items || []).slice(start, start + rowsPerPage);
  });

  // Check if any product has discount
  const hasDiscount = invoice.items?.some(item => item.discount && item.discount > 0) ?? false;

  // Check if any product has DP(+) margin
  const hasDp = invoice.items?.some(item => (item as any).margin && (item as any).margin > 0) ?? false;

  const calculateItemTotal = (item: any) =>
    (item.quantity || 0) * (item.price || 0) * (1 - (item.discount || 0) / 100) * (1 + ((item as any).margin || 0) / 100);

  const subtotal = invoice.items?.reduce((sum, item) => sum + calculateItemTotal(item), 0) || 0;
  const grandTotal = Math.ceil(subtotal + (invoice.transportCharges || 0) + (invoice.roundOff || 0));

  const renderPageHeader = () => (
    <Box className="tally-page-header" sx={{ pb: 0.2, mb: 0.2 }}>
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
        {companyInfo?.address && (
          <Typography variant="body2" sx={{
            fontSize: '0.95rem',
            fontFamily: '"Times New Roman", serif',
            mb: 0.25,
            fontWeight: 'medium'
          }}>
            {companyInfo.address}
          </Typography>
        )}
        <Typography variant="body2" sx={{
          fontSize: '0.85rem',
          fontFamily: '"Times New Roman", serif',
          mb: 0.25
        }}>
          {[
            companyInfo?.phone && `Phone: ${companyInfo.phone}`,
            companyInfo?.email && `Email: ${companyInfo.email}`,
          ].filter(Boolean).join(' | ')}
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

      {/* Enhanced Invoice Details Section - Bill To + Quotation Info (repeats on every printed page) */}
      <Grid container spacing={0.1} sx={{ mb: 0.1 }}>
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
            <Box sx={{ justifyContent: 'space-between', mb: 0.15 }}>
              <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                Phone: {invoice.partyPhone || 'N/A'}
              </Typography>
            </Box>
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
              <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: '800' }}>
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
          </Box>
        </Grid>
      </Grid>
    </Box>
  );

  const renderItemRow = (item: any, index: number, isLastPageOfAll: boolean) => (
    <TableRow key={index} sx={{
      height: 'auto',
      borderBottom: isLastPageOfAll && index === totalItems - 1 ? '2px solid #000' : 'none',
    }}>
      <TableCell className="center-cell" sx={{
        border: 'none',
        fontSize: '0.85rem',
        py: 0.3,
        px: 0.3,
        borderLeft: verticalBorder,
        borderRight: verticalBorder
      }}>
        {index + 1}
      </TableCell>
      <TableCell sx={{
        border: 'none',
        fontSize: '0.85rem',
        py: 0.3,
        px: 0.3,
        borderRight: verticalBorder
      }}>
        <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.9rem' }}>
          {item.name}
        </Typography>
        {item.description && (
          <Typography variant="caption" sx={{ color: '#666', display: 'block', fontSize: '0.8rem', whiteSpace: 'pre-line' }}>
            {item.description}
          </Typography>
        )}
      </TableCell>
      <TableCell className="center-cell" sx={{
        border: 'none',
        fontSize: '0.85rem',
        py: 0.3,
        px: 0.3,
        borderRight: verticalBorder
      }}>
        {item.quantity}
      </TableCell>
      <TableCell className="center-cell" sx={{
        border: 'none',
        fontSize: '0.85rem',
        py: 0.3,
        px: 0.3,
        borderRight: verticalBorder
      }}>
        {item.unitOfMeasurement || 'PCS'}
      </TableCell>
      <TableCell className="number-cell" sx={{
        border: 'none',
        fontSize: '0.85rem',
        py: 0.3,
        px: 0.3,
        borderRight: verticalBorder
      }}>
        {(item.price || 0).toFixed(2)}
      </TableCell>
      {hasDp && (
        <TableCell className="center-cell" sx={{
          border: 'none',
          fontSize: '0.7rem',
          py: 0.3,
          px: 0.3,
          borderRight: verticalBorder
        }}>
          {typeof (item as any).margin === 'number' ? `${(item as any).margin}%` : '0.00'}
        </TableCell>
      )}
      {hasDiscount && (
        <TableCell className="center-cell" sx={{
          border: 'none',
          fontSize: '0.85rem',
          py: 0.3,
          px: 0.3,
          borderRight: verticalBorder
        }}>
          {item.discount > 0 ? `${item.discount}%` : '0.00'}
        </TableCell>
      )}
      <TableCell className="number-cell" sx={{
        border: 'none',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        py: 0.3,
        px: 0.3,
        borderLeft: verticalBorder,
        borderRight: verticalBorder
      }}>
        {calculateItemTotal(item).toFixed(2)}
      </TableCell>
    </TableRow>
  );

  const renderFillerRow = (fillerIndex: number, isLastFillerRow: boolean) => (
    <TableRow key={`filler-${fillerIndex}`} sx={{
      height: 'auto',
      borderBottom: isLastFillerRow ? '2px solid #000' : 'none'
    }}>
      <TableCell className="center-cell" sx={{
        border: 'none',
        fontSize: '0.7rem',
        py: 0.3,
        px: 0.3,
        borderLeft: verticalBorder,
        borderRight: verticalBorder
      }}>
        &nbsp;
      </TableCell>
      <TableCell sx={{
        border: 'none',
        fontSize: '0.7rem',
        py: 0.3,
        px: 0.3,
        borderRight: verticalBorder
      }}>
        &nbsp;
      </TableCell>
      <TableCell className="center-cell" sx={{
        border: 'none',
        fontSize: '0.7rem',
        py: 0.3,
        px: 0.3,
        borderRight: verticalBorder
      }}>
        &nbsp;
      </TableCell>
      <TableCell className="center-cell" sx={{
        border: 'none',
        fontSize: '0.7rem',
        py: 0.3,
        px: 0.3,
        borderRight: verticalBorder
      }}>
        &nbsp;
      </TableCell>
      <TableCell className="number-cell" sx={{
        border: 'none',
        fontSize: '0.7rem',
        py: 0.3,
        px: 0.3,
        borderRight: verticalBorder
      }}>
        &nbsp;
      </TableCell>
      {hasDp && (
        <TableCell className="center-cell" sx={{
          border: 'none',
          fontSize: '0.7rem',
          py: 0.3,
          px: 0.3,
          borderRight: verticalBorder
        }}>
          &nbsp;
        </TableCell>
      )}
      {hasDiscount && (
        <TableCell className="center-cell" sx={{
          border: 'none',
          fontSize: '0.7rem',
          py: 0.3,
          px: 0.3,
          borderRight: verticalBorder
        }}>
          &nbsp;
        </TableCell>
      )}
      <TableCell className="number-cell" sx={{
        border: 'none',
        fontSize: '0.7rem',
        py: 0.3,
        px: 0.3,
        borderLeft: verticalBorder,
        borderRight: verticalBorder
      }}>
        &nbsp;
      </TableCell>
    </TableRow>
  );

  return (
    <>
      <style>{printStyles}</style>
      <Box className="tally-template" sx={{
        maxWidth: '210mm',
        margin: '0 auto',
        p: previewMode ? 1 : 0,
        bgcolor: 'white',
        fontFamily: '"Times New Roman", serif',
        display: 'flex',
        flexDirection: 'column',
        gap: previewMode ? '16px' : 0,
        boxShadow: previewMode ? '0 4px 20px rgba(0,0,0,0.1)' : 'none',
        boxSizing: 'border-box'
      }}>
        {itemPages.map((pageItems, pageIndex) => {
          const isLastPage = pageIndex === pageCount - 1;
          const pageFillerRows = Math.max(0, rowsPerPage - pageItems.length);
          const lastPageRealItemCount = itemPages[itemPages.length - 1].length;

          return (
            <Box
              key={pageIndex}
              className="tally-page tally-border"
              sx={{
                border: '1px solid #000',
                minHeight: 'calc(297mm - 16mm)',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                overflow: 'hidden',
              }}
            >
              {/* ========== REPEATING PAGE HEADER (company + bill-to + quotation info) ========== */}
              {renderPageHeader()}

              {/* ========== ITEMS TABLE - continues on every page ========== */}
              <Box sx={{ mb: 0.2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <TableContainer sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Table className="tally-table" sx={{ border: 'none', borderCollapse: 'collapse', height: '100%' }}>
                    <TableHead>
                      <TableRow sx={{ border: 'none' }}>
                        <TableCell className="center-cell" sx={{
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
                        <TableCell sx={{
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
                        <TableCell className="center-cell" sx={{
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
                        <TableCell className="center-cell" sx={{
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
                        <TableCell className="number-cell" sx={{
                          border: 'none',
                          bgcolor: '#f0f0f0',
                          fontWeight: 'bold',
                          width: '12%',
                          fontSize: '0.6rem',
                          py: 0.3,
                          px: 0.3,
                          borderRight: verticalBorder
                        }}>
                          Rate (₹)
                        </TableCell>
                        {hasDp && (
                          <TableCell className="number-cell" sx={{
                            border: 'none',
                            bgcolor: '#f0f0f0',
                            fontWeight: 'bold',
                            width: '8%',
                            fontSize: '0.6rem',
                            py: 0.3,
                            px: 0.3,
                            borderRight: verticalBorder
                          }}>
                            DP(+)
                          </TableCell>
                        )}
                        {hasDiscount && (
                          <TableCell className="number-cell" sx={{
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
                        )}
                        <TableCell className="number-cell" sx={{
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
                          Amount (₹)
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pageItems.map((item, index) => renderItemRow(item, pageIndex * rowsPerPage + index, isLastPage))}
                      {Array.from({ length: pageFillerRows }).map((_, fillerIndex) =>
                        renderFillerRow(fillerIndex, fillerIndex === pageFillerRows - 1)
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* ========== BOTTOM SECTION - only on the last page ========== */}
              {isLastPage ? (
                <Box className="tally-bottom-section" sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', width: '100%', flex: '0 0 auto' }}>
                  <Box sx={{ mb: 0.15, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                      <Box sx={{ border: '1px solid #000', width: '45%', minWidth: '180px' }}>
                        {/* Subtotal */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 0.2, borderBottom: '1px solid #ddd' }}>
                          <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>Subtotal:</Typography>
                          <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                            ₹{subtotal.toFixed(2)}
                          </Typography>
                        </Box>
                        {/* Transport Charges */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 0.2, borderBottom: '1px solid #ddd' }}>
                          <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>Transport Charges:</Typography>
                          <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                            ₹{(invoice.transportCharges || 0).toFixed(2)}
                          </Typography>
                        </Box>
                        {/* Round Off */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 0.2, borderBottom: '1px solid #ddd' }}>
                          <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>Round Off:</Typography>
                          <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                            ₹{(invoice.roundOff || 0).toFixed(2)}
                          </Typography>
                        </Box>
                        {/* Grand Total */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 0.2, bgcolor: '#e8e8e8', fontWeight: 'bold', border: '1px solid #000' }}>
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Grand Total:</Typography>
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                            ₹{grandTotal.toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

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
                      1.We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.6rem', mb: 0.05, lineHeight: 1, wordWrap: 'break-word' }}>
                      Note: Warrenty not covered for physical damage
                    </Typography>
                  </Box>

                  {/* Payment Information Section - 4 Row Layout (8 Fields) - Enhanced Print View */}
                  {(companyInfo?.bankName || companyInfo?.accountNumber || companyInfo?.ifscCode || companyInfo?.accountHolder) && (
                    <Box className="payment-information-section" sx={{
                      border: '1px solid #000',
                      mt: 0.15,
                      mb: 0.15,
                      p: '2px',
                      width: '100%',
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      backgroundColor: '#fafafa'
                    }}>
                      <Typography className="payment-info-header" variant="body2" sx={{
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

                      {/* 4-Row Layout Container */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', mt: 0.1 }}>
                        {/* Row 1: Bank Name & Account Number */}
                        <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', borderBottom: '1px solid #000', pb: 0.1, mb: 0.1 }}>
                          <Box className="payment-field-group" sx={{ flex: 1, pr: 0.15, pl: 0.15, display: 'flex', flexDirection: 'column' }}>
                            <Box className="payment-info-field" sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '2px' }}>
                              <Typography className="payment-info-label" variant="body2" sx={{
                                fontWeight: 'bold',
                                fontSize: '0.65rem',
                                whiteSpace: 'nowrap',
                                color: '#000'
                              }}>
                                Bank Name:
                              </Typography>
                              <Typography className="payment-info-value" variant="body2" sx={{
                                fontSize: '0.65rem',
                                flex: 1,
                                wordBreak: 'break-word',
                                color: '#333'
                              }}>
                                {companyInfo?.bankName || 'N/A'}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ borderRight: '1px solid #000', mx: 0 }} />
                          <Box className="payment-field-group" sx={{ flex: 1, pr: 0.15, pl: 0.15, display: 'flex', flexDirection: 'column' }}>
                            <Box className="payment-info-field" sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '2px' }}>
                              <Typography className="payment-info-label" variant="body2" sx={{
                                fontWeight: 'bold',
                                fontSize: '0.65rem',
                                whiteSpace: 'nowrap',
                                color: '#000'
                              }}>
                                Account No:
                              </Typography>
                              <Typography className="payment-info-value" variant="body2" sx={{
                                fontSize: '0.65rem',
                                flex: 1,
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                color: '#333'
                              }}>
                                {companyInfo?.accountNumber || 'N/A'}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        {/* Row 2: IFSC Code & Account Holder */}
                        <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', borderBottom: '1px solid #000', pb: 0.1, mb: 0.1, pt: 0.1 }}>
                          <Box className="payment-field-group" sx={{ flex: 1, pr: 0.15, pl: 0.15, display: 'flex', flexDirection: 'column' }}>
                            <Box className="payment-info-field" sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '2px' }}>
                              <Typography className="payment-info-label" variant="body2" sx={{
                                fontWeight: 'bold',
                                fontSize: '0.65rem',
                                whiteSpace: 'nowrap',
                                color: '#000'
                              }}>
                                IFSC Code:
                              </Typography>
                              <Typography className="payment-info-value" variant="body2" sx={{
                                fontSize: '0.65rem',
                                flex: 1,
                                wordBreak: 'break-word',
                                color: '#333'
                              }}>
                                {companyInfo?.ifscCode || 'N/A'}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ borderRight: '1px solid #000', mx: 0 }} />
                          <Box className="payment-field-group" sx={{ flex: 1, pr: 0.15, pl: 0.15, display: 'flex', flexDirection: 'column' }}>
                            <Box className="payment-info-field" sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '2px' }}>
                              <Typography className="payment-info-label" variant="body2" sx={{
                                fontWeight: 'bold',
                                fontSize: '0.65rem',
                                whiteSpace: 'nowrap',
                                color: '#000'
                              }}>
                                A/C Holder:
                              </Typography>
                              <Typography className="payment-info-value" variant="body2" sx={{
                                fontSize: '0.65rem',
                                flex: 1,
                                wordBreak: 'break-word',
                                color: '#333'
                              }}>
                                {companyInfo?.accountHolder || 'N/A'}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        {/* Row 3: UPI ID & Payment Mode */}
                        <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', borderBottom: '1px solid #000', pb: 0.1, mb: 0.1, pt: 0.1 }}>
                          <Box className="payment-field-group" sx={{ flex: 1, pr: 0.15, pl: 0.15, display: 'flex', flexDirection: 'column' }}>
                            <Box className="payment-info-field" sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '2px' }}>
                              <Typography className="payment-info-label" variant="body2" sx={{
                                fontWeight: 'bold',
                                fontSize: '0.65rem',
                                whiteSpace: 'nowrap',
                                color: '#000'
                              }}>
                                UPI ID:
                              </Typography>
                              <Typography className="payment-info-value" variant="body2" sx={{
                                fontSize: '0.65rem',
                                flex: 1,
                                wordBreak: 'break-word',
                                color: '#333'
                              }}>
                                {companyInfo?.upiId || 'N/A'}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ borderRight: '1px solid #000', mx: 0 }} />
                          <Box className="payment-field-group" sx={{ flex: 1, pr: 0.15, pl: 0.15, display: 'flex', flexDirection: 'column' }}>
                            <Box className="payment-info-field" sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '2px' }}>
                              <Typography className="payment-info-label" variant="body2" sx={{
                                fontWeight: 'bold',
                                fontSize: '0.65rem',
                                whiteSpace: 'nowrap',
                                color: '#000'
                              }}>
                                Payment Mode:
                              </Typography>
                              <Typography className="payment-info-value" variant="body2" sx={{
                                fontSize: '0.65rem',
                                flex: 1,
                                wordBreak: 'break-word',
                                color: '#333'
                              }}>
                                {companyInfo?.paymentMode || 'N/A'}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        {/* Row 4: Swift Code & Account Type */}
                        <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', pt: 0.1 }}>
                          <Box className="payment-field-group" sx={{ flex: 1, pr: 0.15, pl: 0.15, display: 'flex', flexDirection: 'column' }}>
                            <Box className="payment-info-field" sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '2px' }}>
                              <Typography className="payment-info-label" variant="body2" sx={{
                                fontWeight: 'bold',
                                fontSize: '0.65rem',
                                whiteSpace: 'nowrap',
                                color: '#000'
                              }}>
                                Swift Code:
                              </Typography>
                              <Typography className="payment-info-value" variant="body2" sx={{
                                fontSize: '0.65rem',
                                flex: 1,
                                wordBreak: 'break-word',
                                color: '#333'
                              }}>
                                {companyInfo?.swiftCode || 'N/A'}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ borderRight: '1px solid #000', mx: 0 }} />
                          <Box className="payment-field-group" sx={{ flex: 1, pr: 0.15, pl: 0.15, display: 'flex', flexDirection: 'column' }}>
                            <Box className="payment-info-field" sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '2px' }}>
                              <Typography className="payment-info-label" variant="body2" sx={{
                                fontWeight: 'bold',
                                fontSize: '0.65rem',
                                whiteSpace: 'nowrap',
                                color: '#000'
                              }}>
                                Account Type:
                              </Typography>
                              <Typography className="payment-info-value" variant="body2" sx={{
                                fontSize: '0.65rem',
                                flex: 1,
                                wordBreak: 'break-word',
                                color: '#333'
                              }}>
                                {companyInfo?.accountType || 'N/A'}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  )}

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

                  {/* Footer */}
                  <Box className="tally-footer-text" sx={{ width: '100%', p: 0.1, mt: 0.1, mb: 0, boxSizing: 'border-box', borderTop: '1px solid #000' }}>
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', textAlign: 'center', display: 'block', lineHeight: 1 }}>
                      This is a Computer Generated Invoice
                    </Typography>
                  </Box>
                </Box>
              ) : (
                /* Non-last pages: "Continued" footer pinned to bottom */
                <Box className="tally-page-footer" sx={{ mt: 'auto', width: '100%', p: 0.1, mb: 0, boxSizing: 'border-box', borderTop: '1px solid #000' }}>
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', textAlign: 'center', display: 'block', lineHeight: 1 }}>
                    Continued on next page...
                  </Typography>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </>
  );
}
