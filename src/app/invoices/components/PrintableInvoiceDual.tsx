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
import { get } from 'http';

// Styled components for print-specific styling
const PrintContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  maxWidth: '297mm', // A4 landscape width
  margin: '0 auto',
  backgroundColor: '#fff',
  fontSize: '1.85rem', // Smaller base font size for more content
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  minHeight: '18.85cm', // Half of A4 width (29.7cm) for landscape mode
  '@media print': get,
    padding: theme.spacing(0.2),
    margin: 0,
    width: '100%',
    height: '14.85cm', // Fixed height for A4 landscape
    '@page': {
      size: 'A4 landscape',
      margin: '0.5cm' // Standard margin for better readability
  }
}));

// Divider for original/duplicate copies
const CopyDivider = styled(Divider)(({ theme }) => ({
  borderStyle: 'dashed',
  borderWidth: '2px',
  borderColor: '#aaa',
  position: 'relative',
  height: 'auto',
  margin: '0 2px',
  orientation: 'vertical',
  '&::after': {
    content: '"✂"',
    position: 'absolute',
    top: '50%',
    left: '-8px',
    backgroundColor: '#fff',
    padding: '2px 0',
    transform: 'translateY(-50%)',
    color: '#666',
    fontSize: '0.8rem'
  },
  '@media print': {
    pageBreakAfter: 'avoid',
    pageBreakBefore: 'avoid',
    margin: '0 1px'
  }
}));

// Single invoice copy component
interface InvoiceCopyProps {
  invoice: Invoice;
  subtotal: number;
  totalDiscount: number;
  total: number;
  copyType: 'ORIGINAL' | 'DUPLICATE';
}

const InvoiceCopy: React.FC<InvoiceCopyProps> = ({ invoice, subtotal, totalDiscount, total, copyType }) => {
  return (
    
    <Box sx={{ 
      position: 'relative',
      margin: '0 auto',
      pb: 0.3,
      width: '49%', // Slightly reduced to prevent overflow
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      '@media print': { 
        pb: 0.2,
        width: '49%', // Consistent width for printing
        height: '100%'
      }
    }}>
      {/* Copy type watermark */}
      <Box sx={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%) rotate(-45deg)',
        opacity: 0.06,
        pointerEvents: 'none',
        zIndex: 1,
        '@media print': { opacity: 0.04 }
      }}>
        <Typography variant="h1" sx={{ fontWeight: 'bold', fontSize: '4.5rem' }}>
          {copyType}
        </Typography>
      </Box>

      <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 0.2,
          pb: 0.2, // Reduced from 0.5
          width: '49.7%', // Increased from 49.5%
          '@media print': { 
            pb: 0.1, // Reduced from 0.3
            width: '49.7%'
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '0.85rem', mr: 0.5 }}>INVOICE</Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                bgcolor: copyType === 'ORIGINAL' ? '#e3f2fd' : '#fff8e1',
                color: copyType === 'ORIGINAL' ? '#1565c0' : '#f57c00',
                px: 0.6, 
                py: 0.1, 
                borderRadius: 0.8,
                fontWeight: 'medium',
                fontSize: '0.6rem'
              }}
            >
              {copyType}
            </Typography>
          </Box>
          {invoice.companyName && (
            <Typography variant="subtitle2" sx={{ textAlign: 'right', fontSize: '0.75rem' }}>{invoice.companyName}</Typography>
          )}
        </Box>
        
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 0.6, 
            mb: 0.5, 
            borderRadius: 1,
            '@media print': {
              boxShadow: 'none',
              border: '1px solid #eee'
            }
          }}
        >
          <Grid container spacing={0.3}>
            {/* Left column: Company and Invoice Info */}
            <Grid item xs={6}>
              <Box sx={{ mb: 0.2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.65rem', mb: 0.1 }}>
                {invoice.companyAddress && (
                  <Typography variant="body2" sx={{ fontSize: '0.7rem', lineHeight: 1.1 }}>{invoice.companyAddress}</Typography>
                )}
                {invoice.companyPhone && (
                  <Typography variant="body2" sx={{ fontSize: '0.7rem', lineHeight: 1.1 }}>Phone: {invoice.companyPhone}</Typography>
                )}
                </Typography>
                
              </Box>
              
             
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.65rem', mb: 0.1 }}>
                  INVOICE INFO
                </Typography>
                <Grid container spacing={0.2}>
                  <Grid item xs={5}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.1 }}>Number:</Typography>
                  </Grid>
                  <Grid item xs={7}>
                    <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.7rem', lineHeight: 1.1 }}>{invoice.invoiceNumber}</Typography>
                  </Grid>
                  
                  <Grid item xs={5}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.1 }}>Date:</Typography>
                  </Grid>
                  <Grid item xs={7}>
                    <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.7rem', lineHeight: 1.1 }}>
                      {new Date(invoice.date).toLocaleDateString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            <Divider sx={{ my: 0.3 }} />
            {/* Right column: Customer Info */}
            <Grid item xs={6}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.65rem', mb: 0.1 }}>
                  BILL TO
                </Typography>
                <Typography variant="body1" fontWeight="medium" sx={{ fontSize: '0.75rem', mb: 0.1, lineHeight: 1.1 }}>
                  {invoice.partyName}
                </Typography>
                {invoice.partyAddress && (
                  <Typography variant="body2" sx={{ fontSize: '0.7rem', lineHeight: 1.1 }}>{invoice.partyAddress}</Typography>
                )}
                
                <Box sx={{ mt: 0.2, display: 'flex', flexWrap: 'wrap', gap: 0.3 }}>
                  {invoice.partyEmail && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.1 }}>
                        Email:
                      </Typography>
                      <Typography variant="body2" sx={{ ml: 0.3, fontSize: '0.7rem', lineHeight: 1.1 }}>
                        {invoice.partyEmail}
                      </Typography>
                    </Box>
                  )}
                  {invoice.partyPhone && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.1 }}>
                        Phone:
                      </Typography>
                      <Typography variant="body2" sx={{ ml: 0.3, fontSize: '0.7rem', lineHeight: 1.1 }}>
                        {invoice.partyPhone}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        
        <TableContainer 
          component={Paper} 
          variant="outlined"
          sx={{ 
            borderRadius: 1,
            mb: 0.2,
            flex: 1,
            '@media print': {
              maxHeight: 'none' // Remove fixed height
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
        </TableContainer>

        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'row', 
          gap: 0.5,
          mt: 'auto', // Push to bottom
          pt: 0.5
        }}>
          {/* Left side: Category Discounts */}
          <Box sx={{ flex: 1 }}>
            {/* Only show if there are items with category discounts */}
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
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.5rem', mb: 0.2 }}>
                  DISCOUNTS
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3 }}>
                  {Array.from(new Set(
                    invoice.items
                      .filter(item => item.discountType === 'category' && item.discount > 0)
                      .map(item => item.category)
                  )).map((category, index) => {
                    // Find the first item with this category to get the discount percentage
                    const item = invoice.items.find(i => 
                      i.category === category && i.discountType === 'category'
                    );
                    return (
                      <Box 
                        key={index} 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          border: '1px dotted red',
                          borderRadius: 1,
                          px: 0.5,
                          py: 0.1, 
                        }}
                      >
                        <Typography 
                          variant="body2"
                          sx={{ 
                            fontSize: '0.5rem',
                            fontWeight: 'medium',
                            mr: 0.3
                          }}
                        >
                          {category}:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.5rem' }}>
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
          <Box sx={{ width: '200px' }}>
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
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.7rem', mb: 0.2 }}>
                SUMMARY
              </Typography>
              
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2, pb: 0.2, borderBottom: '1px solid #f0f0f0' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.1 }}>Subtotal:</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.7rem', lineHeight: 1.1 }}>{subtotal.toFixed(2)}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2, pb: 0.2, borderBottom: '1px solid #f0f0f0' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.1 }}>Discount:</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.7rem', lineHeight: 1.1 }}>{totalDiscount.toFixed(2)}</Typography>
                </Box>
                
                {invoice.roundOff !== undefined && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2, pb: 0.2, borderBottom: '1px solid #f0f0f0' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.1 }}>Round Off:</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', lineHeight: 1.1 }}>{invoice.roundOff.toFixed(2)}</Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.3 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '0.8rem', lineHeight: 1.2 }}>Total:</Typography>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '0.8rem', lineHeight: 1.2 }}>{total.toFixed(2)}</Typography>
                </Box>
                
                {invoice.amountInWords && (
                  <Box sx={{ mt: 0.3, pt: 0.2, borderTop: '1px dashed #eee' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1.1 }}>
                      Amount in words:
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', fontSize: '0.65rem', lineHeight: 1.1 }}>
                      {invoice.amountInWords}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
        </Box>

        <Box sx={{ mt: 0.3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box sx={{ width: '30%' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.65rem', mb: 0.1 }}>
              Customer Signature
            </Typography>
            <Box sx={{ borderTop: '1px solid #ddd', pt: 0.3, height: 15 }} />
          </Box>
          
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', fontSize: '0.65rem' }}>
              Thank you for your business!
            </Typography>
          </Box>
          
          <Box sx={{ width: '30%', textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.65rem', mb: 0.1 }}>
              Authorized Signature
            </Typography>
            <Box sx={{ borderTop: '1px solid #ddd', pt: 0.3, height: 15 }} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

interface PrintableInvoiceDualProps {
  invoice: Invoice;
}

const PrintableInvoiceDual: React.FC<PrintableInvoiceDualProps & { template?: string }> = ({ invoice, template = "dual" }) => {
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
      <Box className="no-print" sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'medium' }}>
          Landscape format with original and duplicate copies on a single page
        </Typography>
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
        {/* Original Copy */}
        <InvoiceCopy 
          invoice={invoice} 
          subtotal={subtotal} 
          totalDiscount={totalDiscount} 
          total={total} 
          copyType="ORIGINAL" 
        />
        
        {/* Vertical divider between copies */}
        <CopyDivider orientation="vertical" flexItem />
        
        {/* Duplicate Copy */}
        <InvoiceCopy 
          invoice={invoice} 
          subtotal={subtotal} 
          totalDiscount={totalDiscount} 
          total={total} 
          copyType="DUPLICATE" 
        />
      </PrintContainer>
    </>
  );
};

export default PrintableInvoiceDual;