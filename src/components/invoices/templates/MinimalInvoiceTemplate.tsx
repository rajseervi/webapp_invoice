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
  Grid
} from '@mui/material';
import { Invoice } from '@/types/invoice_no_gst';
import CompanyInfoDisplay from '@/components/CompanyInfoDisplay';

interface MinimalInvoiceTemplateProps {
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

export default function MinimalInvoiceTemplate({ invoice, settings, previewMode }: MinimalInvoiceTemplateProps) {
  const printStyles = `
    @media print {
      .minimal-template {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        color: #333;
        line-height: 1.4;
      }
      
      .minimal-divider {
        border-color: #ddd !important;
      }
      
      .minimal-table {
        border-collapse: collapse;
      }
      
      .minimal-table th {
        background: #f8f9fa !important;
        border-bottom: 2px solid #dee2e6 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .minimal-table td {
        border-bottom: 1px solid #dee2e6 !important;
      }
      
      .minimal-total {
        background: #f8f9fa !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  `;

  return (
    <>
      <style>{printStyles}</style>
      <Box className="minimal-template" sx={{ 
        maxWidth: '210mm', 
        margin: '0 auto', 
        p: 4, 
        bgcolor: 'white',
        minHeight: '297mm',
        fontFamily: '"Helvetica Neue", Arial, sans-serif',
        boxShadow: previewMode ? '0 2px 10px rgba(0,0,0,0.1)' : 'none'
      }}>
        {/* Minimal Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" sx={{ 
            fontWeight: 300, 
            mb: 1, 
            fontSize: '3rem',
            color: '#333'
          }}>
            Invoice
          </Typography>
          <Divider className="minimal-divider" sx={{ borderColor: '#ddd', mb: 2 }} />
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Typography variant="h6" sx={{ color: '#666', fontWeight: 300 }}>
                {invoice.invoiceNumber || 'N/A'}
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="body1" sx={{ color: '#666' }}>
                {formatDate(invoice.date)}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Company and Customer Details */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          {/* From Section */}
          <Grid item xs={6}>
            <Typography variant="h6" sx={{ 
              color: '#333', 
              fontWeight: 400, 
              mb: 2,
              fontSize: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              From
            </Typography>
            <CompanyInfoDisplay variant="minimal" />
          </Grid>

          {/* To Section */}
          <Grid item xs={6}>
            <Typography variant="h6" sx={{ 
              color: '#333', 
              fontWeight: 400, 
              mb: 2,
              fontSize: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              To
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 400, mb: 1, color: '#333' }}>
              {invoice.partyName || 'N/A'}
            </Typography>
            {invoice.partyAddress && (
              <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.6, color: '#666' }}>
                {invoice.partyAddress}
              </Typography>
            )}
            {invoice.partyPhone && (
              <Typography variant="body2" sx={{ color: '#666' }}>
                {invoice.partyPhone}
              </Typography>
            )}
            {invoice.partyEmail && (
              <Typography variant="body2" sx={{ color: '#666' }}>
                {invoice.partyEmail}
              </Typography>
            )}
          </Grid>
        </Grid>

        {/* Items Table */}
        <Box sx={{ mb: 4 }}>
          <TableContainer>
            <Table className="minimal-table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ 
                    bgcolor: '#f8f9fa',
                    borderBottom: '2px solid #dee2e6',
                    fontWeight: 500,
                    color: '#495057',
                    py: 2
                  }}>
                    Description
                  </TableCell>
                  <TableCell align="center" sx={{ 
                    bgcolor: '#f8f9fa',
                    borderBottom: '2px solid #dee2e6',
                    fontWeight: 500,
                    color: '#495057',
                    py: 2
                  }}>
                    Qty
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    bgcolor: '#f8f9fa',
                    borderBottom: '2px solid #dee2e6',
                    fontWeight: 500,
                    color: '#495057',
                    py: 2
                  }}>
                    Rate
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    bgcolor: '#f8f9fa',
                    borderBottom: '2px solid #dee2e6',
                    fontWeight: 500,
                    color: '#495057',
                    py: 2
                  }}>
                    Amount
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.items?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ 
                      borderBottom: '1px solid #dee2e6',
                      py: 2
                    }}>
                      <Typography variant="body1" sx={{ fontWeight: 400, mb: 0.5 }}>
                        {item.name}
                      </Typography>
                      {item.description && (
                        <Typography variant="caption" sx={{ color: '#6c757d' }}>
                          {item.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ 
                      borderBottom: '1px solid #dee2e6',
                      py: 2,
                      color: '#495057'
                    }}>
                      {item.quantity}
                    </TableCell>
                    <TableCell align="right" sx={{ 
                      borderBottom: '1px solid #dee2e6',
                      py: 2,
                      color: '#495057'
                    }}>
                      {formatCurrency(item.price)}
                    </TableCell>
                    <TableCell align="right" sx={{ 
                      borderBottom: '1px solid #dee2e6',
                      py: 2,
                      fontWeight: 500,
                      color: '#333'
                    }}>
                      {formatCurrency(item.totalAmount || item.finalPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
          <Box sx={{ width: '300px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1" sx={{ color: '#495057' }}>
                Subtotal
              </Typography>
              <Typography variant="body1" sx={{ color: '#495057' }}>
                {formatCurrency(invoice.subtotal)}
              </Typography>
            </Box>
            
            {(invoice.totalDiscount || invoice.discount || 0) > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1" sx={{ color: '#495057' }}>
                  Discount
                </Typography>
                <Typography variant="body1" sx={{ color: '#dc3545' }}>
                  -{formatCurrency(invoice.totalDiscount || invoice.discount)}
                </Typography>
              </Box>
            )}
            
            <Divider sx={{ my: 2, borderColor: '#dee2e6' }} />
            
            <Box className="minimal-total" sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              bgcolor: '#f8f9fa',
              p: 2,
              borderRadius: 1
            }}>
              <Typography variant="h6" sx={{ fontWeight: 500, color: '#333' }}>
                Total
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 500, color: '#333' }}>
                {formatCurrency(invoice.totalAmount || invoice.total)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Notes */}
        {invoice.notes && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ 
              color: '#333', 
              fontWeight: 400, 
              mb: 2,
              fontSize: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Notes
            </Typography>
            <Typography variant="body2" sx={{ 
              whiteSpace: 'pre-wrap', 
              lineHeight: 1.6,
              color: '#495057',
              bgcolor: '#f8f9fa',
              p: 2,
              borderRadius: 1,
              border: '1px solid #dee2e6'
            }}>
              {invoice.notes}
            </Typography>
          </Box>
        )}

        {/* Footer */}
        <Box sx={{ 
          mt: 'auto',
          pt: 4,
          borderTop: '1px solid #dee2e6'
        }}>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Typography variant="body2" sx={{ color: '#6c757d' }}>
                Thank you for your business
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="body2" sx={{ color: '#6c757d' }}>
                Invoice #{invoice.invoiceNumber}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Watermark */}
        {settings.showWatermark && (
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-45deg)',
            fontSize: '8rem',
            color: 'rgba(0, 0, 0, 0.03)',
            fontWeight: 100,
            zIndex: 0,
            pointerEvents: 'none',
            fontFamily: '"Helvetica Neue", Arial, sans-serif'
          }}>
            INVOICE
          </Box>
        )}
      </Box>
    </>
  );
}