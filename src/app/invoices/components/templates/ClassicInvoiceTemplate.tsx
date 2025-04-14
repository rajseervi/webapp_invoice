"use client";
import React from 'react';
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
  useTheme,
  alpha
} from '@mui/material';

import { Invoice } from '@/types/invoice';

interface InvoiceTemplateProps {
  invoice: Invoice;
}

const ClassicInvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ invoice }) => {
  const theme = useTheme();
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 4, 
        mb: 3, 
        borderRadius: 0,
        border: `1px solid ${theme.palette.divider}`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Watermark */}
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(-45deg)',
        fontSize: '120px',
        fontWeight: 'bold',
        color: alpha(theme.palette.primary.main, 0.03),
        zIndex: 0,
        pointerEvents: 'none',
        width: '100%',
        textAlign: 'center'
      }}>
        INVOICE
      </Box>
      
      {/* Content */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'flex-start' },
          mb: 4
        }}>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 'bold',
              letterSpacing: 1,
              color: theme.palette.text.primary
            }}>
              INVOICE
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {invoice.createdAt ? 
                `Created on ${new Date(invoice.createdAt.toDate()).toLocaleDateString()}` : 
                'Date not available'}
            </Typography>
          </Box>
          
          <Box sx={{ 
            p: 2, 
            border: `1px solid ${theme.palette.divider}`,
            minWidth: 200
          }}>
            <Typography variant="body2" color="text.secondary">
              Invoice Number
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
              {invoice.invoiceNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Date
            </Typography>
            <Typography variant="body1">
              {invoice.date}
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        {/* Party and From Info */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              BILL TO
            </Typography>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
              {invoice.partyName}
            </Typography>
            {invoice.partyAddress && (
              <Typography variant="body2" paragraph>
                {invoice.partyAddress}
              </Typography>
            )}
            {invoice.partyEmail && (
              <Typography variant="body2">
                Email: {invoice.partyEmail}
              </Typography>
            )}
            {invoice.partyPhone && (
              <Typography variant="body2">
                Phone: {invoice.partyPhone}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              FROM
            </Typography>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
              Your Company Name
            </Typography>
            <Typography variant="body2" paragraph>
              123 Business Street
              <br />
              City, State 12345
            </Typography>
            <Typography variant="body2">
              Email: contact@yourcompany.com
              <br />
              Phone: (123) 456-7890
            </Typography>
          </Grid>
        </Grid>
        
        {/* Products */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
          Invoice Items
        </Typography>
        
        <TableContainer sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: theme.palette.background.default }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Unit Price</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Discount</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">₹{item.price.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    {item.discount > 0 ? (
                      <Box>
                        <Typography variant="body2">
                          {item.discount}%
                        </Typography>
                        {item.discountType && item.discountType !== 'none' && (
                          <Typography variant="caption" color="text.secondary">
                            ({item.discountType})
                          </Typography>
                        )}
                      </Box>
                    ) : '-'}
                  </TableCell>
                  <TableCell align="right">₹{item.finalPrice.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              
              {/* Add empty rows to make the table look more balanced */}
              {invoice.items.length < 5 && Array(5 - invoice.items.length).fill(0).map((_, index) => (
                <TableRow key={`empty-${index}`}>
                  <TableCell sx={{ height: '42px' }}></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
          <Box sx={{ width: { xs: '100%', sm: '50%', md: '40%' } }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              py: 1,
              borderBottom: `1px solid ${theme.palette.divider}`
            }}>
              <Typography variant="body2">Subtotal:</Typography>
              <Typography variant="body2">₹{invoice.subtotal.toFixed(2)}</Typography>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              py: 1,
              borderBottom: `1px solid ${theme.palette.divider}`
            }}>
              <Typography variant="body2">Discount:</Typography>
              <Typography variant="body2">₹{invoice.discount.toFixed(2)}</Typography>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              py: 2,
              mt: 1,
              bgcolor: theme.palette.background.default
            }}>
              <Typography variant="subtitle1" fontWeight="bold">Total:</Typography>
              <Typography variant="subtitle1" fontWeight="bold">
                ₹{invoice.total.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {/* Payment Info */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            PAYMENT INFORMATION
          </Typography>
          <Typography variant="body2">
            Bank Name: EXAMPLE BANK
            <br />
            Account Name: Your Company Name
            <br />
            Account Number: XXXXXXXXXXXX
            <br />
            IFSC Code: EXMPL12345
          </Typography>
        </Box>
        
        {/* Terms */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            TERMS & CONDITIONS
          </Typography>
          <Typography variant="body2">
            1. Payment is due within 30 days.
            <br />
            2. Please include the invoice number on your check.
            <br />
            3. This is a computer-generated invoice and does not require a signature.
          </Typography>
        </Box>
        
        {/* Footer */}
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Thank you for your business!
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default ClassicInvoiceTemplate;