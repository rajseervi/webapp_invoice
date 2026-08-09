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
  Divider
} from '@mui/material';
import { Invoice } from '@/types/invoice_no_gst';

interface ThermalInvoiceTemplateProps {
  invoice: Invoice;
  settings: any;
  previewMode: boolean;
}

const formatCurrency = (value: number | undefined | null): string => {
  return `₹${(value ?? 0).toFixed(2)}`;
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

export default function ThermalInvoiceTemplate({ invoice, settings, previewMode }: ThermalInvoiceTemplateProps) {
  const printStyles = `
    @page {
      size: 80mm auto;
      margin: 2mm;
    }
    
    @media print {
      .thermal-template {
        font-family: 'Courier New', monospace;
        color: #000;
        line-height: 1.2;
        font-size: 10px;
        width: 76mm;
        margin: 0;
        padding: 0;
      }
      
      .thermal-header {
        text-align: center;
        margin-bottom: 2mm;
      }
      
      .thermal-divider {
        border: none;
        border-top: 1px dashed #000;
        margin: 2mm 0;
      }
      
      .thermal-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 9px;
      }
      
      .thermal-table td {
        padding: 1px 2px;
        vertical-align: top;
      }
      
      .thermal-total {
        font-weight: bold;
        font-size: 11px;
      }
      
      .thermal-footer {
        text-align: center;
        margin-top: 3mm;
        font-size: 8px;
      }
    }
  `;

  return (
    <>
      <style>{printStyles}</style>
      <Box className="thermal-template" sx={{ 
        width: previewMode ? '80mm' : '76mm',
        margin: '0 auto', 
        p: 1, 
        bgcolor: 'white',
        fontFamily: '"Courier New", monospace',
        fontSize: '10px',
        lineHeight: 1.2,
        border: previewMode ? '1px solid #ddd' : 'none',
        minHeight: previewMode ? '200mm' : 'auto'
      }}>
        {/* Thermal Header */}
        <Box className="thermal-header" sx={{ textAlign: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 'bold', 
            fontSize: '14px',
            fontFamily: '"Courier New", monospace',
            textTransform: 'uppercase'
          }}>
            [COMPANY NAME]
          </Typography>
          <Typography variant="caption" sx={{ 
            fontSize: '9px',
            display: 'block',
            fontFamily: '"Courier New", monospace'
          }}>
            [Company Address]
          </Typography>
          <Typography variant="caption" sx={{ 
            fontSize: '9px',
            display: 'block',
            fontFamily: '"Courier New", monospace'
          }}>
            Ph: [Phone] | Email: [Email]
          </Typography>
        </Box>

        <Divider className="thermal-divider" sx={{ 
          border: 'none',
          borderTop: '1px dashed #000',
          my: 1
        }} />

        {/* Invoice Details */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" sx={{ 
            fontSize: '10px',
            fontFamily: '"Courier New", monospace',
            fontWeight: 'bold'
          }}>
            INVOICE: {invoice.invoiceNumber || 'N/A'}
          </Typography>
          <br />
          <Typography variant="caption" sx={{ 
            fontSize: '9px',
            fontFamily: '"Courier New", monospace'
          }}>
            Date: {formatDate(invoice.date)}
          </Typography>
          <br />
          <Typography variant="caption" sx={{ 
            fontSize: '9px',
            fontFamily: '"Courier New", monospace'
          }}>
            Customer: {invoice.partyName || 'N/A'}
          </Typography>
          {invoice.partyPhone && (
            <>
              <br />
              <Typography variant="caption" sx={{ 
                fontSize: '9px',
                fontFamily: '"Courier New", monospace'
              }}>
                Phone: {invoice.partyPhone}
              </Typography>
            </>
          )}
        </Box>

        <Divider className="thermal-divider" sx={{ 
          border: 'none',
          borderTop: '1px dashed #000',
          my: 1
        }} />

        {/* Items */}
        <Box sx={{ mb: 1 }}>
          <Table className="thermal-table" size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ 
                  p: 0.2, 
                  fontSize: '8px',
                  fontWeight: 'bold',
                  fontFamily: '"Courier New", monospace',
                  border: 'none'
                }}>
                  Item
                </TableCell>
                <TableCell align="right" sx={{ 
                  p: 0.2, 
                  fontSize: '8px',
                  fontWeight: 'bold',
                  fontFamily: '"Courier New", monospace',
                  border: 'none'
                }}>
                  Qty
                </TableCell>
                <TableCell align="right" sx={{ 
                  p: 0.2, 
                  fontSize: '8px',
                  fontWeight: 'bold',
                  fontFamily: '"Courier New", monospace',
                  border: 'none'
                }}>
                  Rate
                </TableCell>
                <TableCell align="right" sx={{ 
                  p: 0.2, 
                  fontSize: '8px',
                  fontWeight: 'bold',
                  fontFamily: '"Courier New", monospace',
                  border: 'none'
                }}>
                  Amt
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.items?.map((item, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ 
                    p: 0.2, 
                    fontSize: '8px',
                    fontFamily: '"Courier New", monospace',
                    border: 'none',
                    maxWidth: '30mm',
                    wordBreak: 'break-word'
                  }}>
                    {item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name}
                    {item.discount > 0 && (
                      <Typography variant="caption" sx={{ 
                        fontSize: '7px',
                        display: 'block',
                        color: '#666'
                      }}>
                        Disc: {item.discount}%
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    p: 0.2, 
                    fontSize: '8px',
                    fontFamily: '"Courier New", monospace',
                    border: 'none'
                  }}>
                    {item.quantity}
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    p: 0.2, 
                    fontSize: '8px',
                    fontFamily: '"Courier New", monospace',
                    border: 'none'
                  }}>
                    {(item.price || 0).toFixed(0)}
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    p: 0.2, 
                    fontSize: '8px',
                    fontFamily: '"Courier New", monospace',
                    border: 'none',
                    fontWeight: 'bold'
                  }}>
                    {(item.totalAmount || item.finalPrice || 0).toFixed(0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        <Divider className="thermal-divider" sx={{ 
          border: 'none',
          borderTop: '1px dashed #000',
          my: 1
        }} />

        {/* Totals */}
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ 
              fontSize: '9px',
              fontFamily: '"Courier New", monospace'
            }}>
              Subtotal:
            </Typography>
            <Typography variant="caption" sx={{ 
              fontSize: '9px',
              fontFamily: '"Courier New", monospace'
            }}>
              {formatCurrency(invoice.subtotal)}
            </Typography>
          </Box>
          
          {(invoice.totalDiscount || invoice.discount || 0) > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ 
                fontSize: '9px',
                fontFamily: '"Courier New", monospace'
              }}>
                Discount:
              </Typography>
              <Typography variant="caption" sx={{ 
                fontSize: '9px',
                fontFamily: '"Courier New", monospace'
              }}>
                -{formatCurrency(invoice.totalDiscount || invoice.discount)}
              </Typography>
            </Box>
          )}
          
          <Divider sx={{ my: 0.5, borderStyle: 'dashed' }} />
          
          <Box className="thermal-total" sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontWeight: 'bold'
          }}>
            <Typography variant="body2" sx={{ 
              fontSize: '11px',
              fontFamily: '"Courier New", monospace',
              fontWeight: 'bold'
            }}>
              TOTAL:
            </Typography>
            <Typography variant="body2" sx={{ 
              fontSize: '11px',
              fontFamily: '"Courier New", monospace',
              fontWeight: 'bold'
            }}>
              {formatCurrency(invoice.totalAmount || invoice.total)}
            </Typography>
          </Box>
        </Box>

        <Divider className="thermal-divider" sx={{ 
          border: 'none',
          borderTop: '1px dashed #000',
          my: 1
        }} />

        {/* Payment Info */}
        <Box sx={{ mb: 1, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ 
            fontSize: '8px',
            fontFamily: '"Courier New", monospace',
            display: 'block'
          }}>
            Payment Status: {invoice.paymentStatus?.toUpperCase() || 'PENDING'}
          </Typography>
          {invoice.balanceAmount && invoice.balanceAmount > 0 && (
            <Typography variant="caption" sx={{ 
              fontSize: '8px',
              fontFamily: '"Courier New", monospace',
              display: 'block',
              fontWeight: 'bold'
            }}>
              Balance: {formatCurrency(invoice.balanceAmount)}
            </Typography>
          )}
        </Box>

        {/* Notes */}
        {invoice.notes && (
          <>
            <Divider className="thermal-divider" sx={{ 
              border: 'none',
              borderTop: '1px dashed #000',
              my: 1
            }} />
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ 
                fontSize: '8px',
                fontFamily: '"Courier New", monospace',
                display: 'block',
                textAlign: 'center'
              }}>
                Note: {invoice.notes.length > 50 ? invoice.notes.substring(0, 50) + '...' : invoice.notes}
              </Typography>
            </Box>
          </>
        )}

        <Divider className="thermal-divider" sx={{ 
          border: 'none',
          borderTop: '1px dashed #000',
          my: 1
        }} />

        {/* Footer */}
        <Box className="thermal-footer" sx={{ textAlign: 'center', mt: 1 }}>
          <Typography variant="caption" sx={{ 
            fontSize: '8px',
            fontFamily: '"Courier New", monospace',
            display: 'block'
          }}>
            Thank you for your business!
          </Typography>
          <Typography variant="caption" sx={{ 
            fontSize: '7px',
            fontFamily: '"Courier New", monospace',
            display: 'block',
            mt: 0.5
          }}>
            Generated on {new Date().toLocaleString('en-IN')}
          </Typography>
          <Typography variant="caption" sx={{ 
            fontSize: '7px',
            fontFamily: '"Courier New", monospace',
            display: 'block'
          }}>
            Powered by Invoice System
          </Typography>
        </Box>

        {/* QR Code Placeholder */}
        <Box sx={{ 
          textAlign: 'center', 
          mt: 1,
          border: '1px dashed #000',
          p: 1,
          fontSize: '7px'
        }}>
          <Typography variant="caption" sx={{ 
            fontSize: '7px',
            fontFamily: '"Courier New", monospace'
          }}>
            [QR CODE FOR PAYMENT]
          </Typography>
        </Box>

        {/* Cut Line */}
        <Box sx={{ 
          textAlign: 'center', 
          mt: 2,
          borderTop: '1px dashed #000',
          pt: 1
        }}>
          <Typography variant="caption" sx={{ 
            fontSize: '7px',
            fontFamily: '"Courier New", monospace'
          }}>
            ✂ --------------------------------- ✂
          </Typography>
        </Box>
      </Box>
    </>
  );
}