"use client";
import React, { useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Divider, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  styled
} from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import { Invoice } from '@/types/invoice';
import CompanyInfoDisplay from '@/components/CompanyInfoDisplay';

// Styled components for print-specific styling
const PrintContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  maxWidth: '210mm', // A4 width
  margin: '0 auto',
  backgroundColor: '#fff',
  fontSize: '0.85rem',
  minHeight: '26.7cm', // A4 height
  display: 'flex',
  flexDirection: 'column',
  '@media print': {
    padding: theme.spacing(1),
    margin: 0,
    width: '100%',
    height: '26.7cm', // Fixed A4 height for print
    boxShadow: 'none',
    '& .no-print': {
      display: 'none !important'
    },
    // Set page size to A4 with smaller margins
    '@page': {
      size: 'A4',
      margin: '0.5cm'
    }
  }
}));

const PrintHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
  '@media print': {
    marginBottom: theme.spacing(1)
  }
}));

const PrintTable = styled(TableContainer)(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
  '@media print': {
    marginBottom: theme.spacing(1),
    maxHeight: 'none', // Remove height limit for print
    overflowY: 'visible', // Disable scrolling for print
    pageBreakInside: 'avoid',
    '& .MuiTableCell-root': {
      padding: '3px 6px',
      fontSize: '0.75rem'
    },
    '& .MuiTableHead-root .MuiTableCell-root': {
      padding: '4px 6px',
    },
    '& .category-badge': {
      backgroundColor: '#f5f5f5 !important',
      border: '1px solid #ddd !important'
    },
    '& .MuiTypography-colorPrimary': {
      color: '#1976d2 !important'
    },
    '& .MuiTypography-colorTextSecondary': {
      color: '#666 !important'
    },
    '& .MuiPaper-root': {
      boxShadow: 'none !important',
      border: '1px solid #eee !important'
    }
  }
}));

interface PrintableInvoiceProps {
  invoice: Invoice;
}

const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ invoice }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  // Calculate totals
  const subtotal = invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalDiscount = invoice.items.reduce((sum, item) => sum + ((item.price * item.quantity) - item.finalPrice), 0);
  const total = invoice.total || subtotal - totalDiscount;

  return (
    <>
      <Box className="no-print" sx={{ mb: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<PrintIcon />} 
          onClick={handlePrint}
          size="small"
        >
          Print Invoice
        </Button>
      </Box>

      <PrintContainer ref={printRef}>
        <PrintHeader>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, pb: 0.5, borderBottom: '1px solid #eee' }}>
            <Typography variant="h5" sx={{ fontWeight: 900, fontSize: '1.25rem', letterSpacing: 0.5 }}>INVOICE</Typography>
            {invoice.companyName && (
              <Typography variant="subtitle1" sx={{ textAlign: 'right', fontWeight: 700, fontSize: '1rem' }}>{invoice.companyName}</Typography>
            )}
          </Box>
          
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 1, 
              mb: 1, 
              borderRadius: 1,
              '@media print': {
                boxShadow: 'none',
                border: '1px solid #eee'
              }
            }}
          >
            <Grid container spacing={0.5}>
              {/* Left column: Company and Invoice Info */}
              <Grid item xs={6}>
                <Box sx={{ mb: 0.5 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.8rem', fontWeight: 700, mb: 0.2 }}>
                    FROM
                  </Typography>
                  <CompanyInfoDisplay variant="simple" />
                </Box>
                
                <Divider sx={{ my: 0.5 }} />
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.8rem', fontWeight: 700, mb: 0.2 }}>
                    INVOICE INFO
                  </Typography>
                  <Grid container spacing={0.3}>
                    <Grid item xs={5}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.2 }}>Number:</Typography>
                    </Grid>
                    <Grid item xs={7}>
                      <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.85rem', lineHeight: 1.2 }}>{invoice.invoiceNumber}</Typography>
                    </Grid>
                    
                    <Grid item xs={5}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.2 }}>Date:</Typography>
                    </Grid>
                    <Grid item xs={7}>
                      <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.85rem', lineHeight: 1.2 }}>
                        {new Date(invoice.date).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
              
              {/* Right column: Customer Info */}
              <Grid item xs={6}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.8rem', fontWeight: 700, mb: 0.2 }}>
                    BILL TO
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" sx={{ fontSize: '0.95rem', mb: 0.2, lineHeight: 1.2 }}>
                    {invoice.partyName}
                  </Typography>
                  {invoice.partyAddress && (
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.2 }}>{invoice.partyAddress}</Typography>
                  )}
                  
                  <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {invoice.partyEmail && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.2 }}>
                          Email:
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 0.3, fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.2 }}>
                          {invoice.partyEmail}
                        </Typography>
                      </Box>
                    )}
                    {invoice.partyPhone && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.2 }}>
                          Phone:
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 0.3, fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.2 }}>
                          {invoice.partyPhone}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </PrintHeader>

        <PrintTable 
          component={Paper} 
          variant="outlined"
          sx={{ 
            borderRadius: 1,
            flex: 1,
            '& .MuiTableHead-root': {
              position: 'sticky',
              top: 0,
              zIndex: 1,
              backgroundColor: '#f8f9fa'
            },
            '@media print': {
              boxShadow: 'none',
              border: '1px solid #eee',
              '& .MuiTableHead-root': {
                position: 'static'
              }
            }
          }}
        >
           <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
              <TableCell sx={{ fontWeight: 'bold', width: '5%', py: 0.3, px: 1, fontSize: '0.7rem' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '50%', py: 0.3, px: 1, fontSize: '0.7rem' }}>Item</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '10%', py: 0.3, px: 1, fontSize: '0.7rem' }}>Qty</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '10%', py: 0.3, px: 1, fontSize: '0.7rem' }} align="right">Price</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '10%', py: 0.3, px: 1, fontSize: '0.7rem' }} align="right">Discount</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '10%', py: 0.3, px: 1, fontSize: '0.7rem' }} align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ py: 0.2, px: 1, fontSize: '0.68rem' }}>{index+1}</TableCell>
                  <TableCell sx={{ py: 0.3, px: 1 }}>
                    <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.68rem', lineHeight: 1.1 }}>{item.name}</Typography>
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 1, fontSize: '0.68rem' }}>{item.quantity}</TableCell>
                  <TableCell align="right" sx={{ py: 0.3, px: 1, fontSize: '0.7rem' }}>{item.price.toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ py: 0.3, px: 1 }}>
                    {item.discount > 0 ? (
                      <Typography sx={{ fontSize: '0.7rem', lineHeight: 1.1 }}>{item.discount}%</Typography>
                    ) : (
                      <Typography sx={{ fontSize: '0.7rem' }}>-</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.3, px: 1, fontSize: '0.7rem', fontWeight: 'medium' }}>{item.finalPrice.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </PrintTable>

        <Box sx={{ 
          mt: 'auto',
          pt: 1,
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: 0.8,
          '@media print': {
            flexDirection: 'row',
            mt: 'auto'
          }
        }}>
          {/* Left side: Category Discounts */}
          <Box sx={{ 
            flex: 1,
            '@media print': {
              flex: 1
            }
          }}>
            {invoice.items.some(item => item.discountType === 'category' && item.discount > 0) && (
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 0.8, 
                  borderRadius: 1,
                  '@media print': {
                    boxShadow: 'none',
                    border: '1px solid #eee'
                  }
                }}
              >
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.8rem', fontWeight: 700, mb: 0.2 }}>
                  DISCOUNTS
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {Array.from(new Set(
                    invoice.items
                      .filter(item => item.discountType === 'category' && item.discount > 0)
                      .map(item => item.category)
                  )).map((category, index) => {
                    const item = invoice.items.find(i => 
                      i.category === category && i.discountType === 'category'
                    );
                    return (
                      <Box 
                        key={index} 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          border: '1px solid #eee',
                          borderRadius: 1,
                          px: 0.5,
                          py: 0.1
                        }}
                      >
                        <Typography 
                          variant="body2"
                          sx={{ 
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            mr: 0.3
                          }}
                        >
                          {category}:
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.75rem' }}>
                          {item?.discount}%
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            )}
          </Box>
          
          {/* Right side: Totals */}
          <Box sx={{ 
            width: { xs: '100%', md: '250px' },
            '@media print': {
              width: '220px'
            }
          }}>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 0.8, 
                borderRadius: 1,
                '@media print': {
                  boxShadow: 'none',
                  border: '1px solid #eee'
                }
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 0.2 }}>
                SUMMARY
              </Typography>
              
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2, pb: 0.2, borderBottom: '1px solid #f0f0f0' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.2 }}>Subtotal:</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.2 }}>{subtotal.toFixed(2)}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2, pb: 0.2, borderBottom: '1px solid #f0f0f0' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.2 }}>Discount:</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.2 }}>{totalDiscount.toFixed(2)}</Typography>
                </Box>
                
                {invoice.roundOff !== undefined && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2, pb: 0.2, borderBottom: '1px solid #f0f0f0' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.2 }}>Round Off:</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.2 }}>{invoice.roundOff.toFixed(2)}</Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.3 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '1rem', lineHeight: 1.2 }}>Total:</Typography>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '1rem', lineHeight: 1.2 }}>{total.toFixed(2)}</Typography>
                </Box>
                
                {invoice.amountInWords && (
                  <Box sx={{ mt: 0.3, pt: 0.2, borderTop: '1px dashed #eee' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.1 }}>
                      Amount in words:
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.1 }}>
                      {invoice.amountInWords}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
        </Box>

        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box sx={{ width: '30%' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.1 }}>
              Customer Signature
            </Typography>
            <Box sx={{ borderTop: '1px solid #ddd', pt: 0.3, height: 15 }} />
          </Box>
          
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600 }}>
              Thank you for your business!
            </Typography>
          </Box>
          
          <Box sx={{ width: '30%', textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.1 }}>
              Authorized Signature
            </Typography>
            <Box sx={{ borderTop: '1px solid #ddd', pt: 0.3, height: 15 }} />
          </Box>
        </Box>
      </PrintContainer>
    </>
  );
};

export default PrintableInvoice;
