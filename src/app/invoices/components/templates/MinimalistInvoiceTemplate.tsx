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
  alpha,
  Card,
  CardContent
} from '@mui/material';

import { Invoice } from '@/types/invoice';

interface InvoiceTemplateProps {
  invoice: Invoice;
}

const MinimalistInvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ invoice }) => {
  const theme = useTheme();
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: 3, 
        borderRadius: 1,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper
      }}
    >
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        mb: 3
      }}>
        <Box>
          <Typography variant="h5" sx={{ 
            fontWeight: 500,
            letterSpacing: 0.5,
            color: theme.palette.text.primary
          }}>
            Invoice
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {invoice.invoiceNumber}
          </Typography>
        </Box>
        
        <Box sx={{ mt: { xs: 1, sm: 0 } }}>
          <Typography variant="body2" color="text.secondary">
            Date: {invoice.date}
          </Typography>
          {invoice.createdAt && (
            <Typography variant="caption" color="text.secondary" display="block">
              Created: {new Date(invoice.createdAt.toDate()).toLocaleDateString()}
            </Typography>
          )}
        </Box>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Party and Total Info */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              BILLED TO
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {invoice.partyName}
            </Typography>
            {invoice.partyAddress && (
              <Typography variant="body2" color="text.secondary">
                {invoice.partyAddress}
              </Typography>
            )}
            {(invoice.partyEmail || invoice.partyPhone) && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {invoice.partyEmail && `Email: ${invoice.partyEmail}`}
                {invoice.partyEmail && invoice.partyPhone && <br />}
                {invoice.partyPhone && `Phone: ${invoice.partyPhone}`}
              </Typography>
            )}
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Box sx={{ 
            textAlign: { xs: 'left', sm: 'right' },
            mt: { xs: 2, sm: 0 }
          }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              AMOUNT DUE
            </Typography>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 500,
                color: theme.palette.primary.main
              }}
            >
              ₹{invoice.total.toFixed(2)}
            </Typography>
            {invoice.discount > 0 && (
              <Typography variant="caption" color="text.secondary">
                You saved: ₹{invoice.discount.toFixed(2)}
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>
      
      {/* Products */}
      <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
        ITEMS
      </Typography>
      
      <TableContainer sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 500, color: theme.palette.text.secondary }}>Item</TableCell>
              <TableCell align="right" sx={{ fontWeight: 500, color: theme.palette.text.secondary }}>Qty</TableCell>
              <TableCell align="right" sx={{ fontWeight: 500, color: theme.palette.text.secondary }}>Price</TableCell>
              <TableCell align="right" sx={{ fontWeight: 500, color: theme.palette.text.secondary }}>Discount</TableCell>
              <TableCell align="right" sx={{ fontWeight: 500, color: theme.palette.text.secondary }}>Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoice.items.map((item, index) => (
              <TableRow key={index} sx={{ 
                '&:last-child td, &:last-child th': { border: 0 },
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) }
              }}>
                <TableCell component="th" scope="row">
                  {item.name}
                </TableCell>
                <TableCell align="right">{item.quantity}</TableCell>
                <TableCell align="right">₹{item.price.toFixed(2)}</TableCell>
                <TableCell align="right">
                  {item.discount > 0 ? `${item.discount}%` : '-'}
                </TableCell>
                <TableCell align="right">₹{item.finalPrice.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Summary */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Card variant="outlined" sx={{ width: { xs: '100%', sm: '50%', md: '40%' } }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Subtotal</Typography>
              <Typography variant="body2">₹{invoice.subtotal.toFixed(2)}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Discount</Typography>
              <Typography variant="body2">₹{invoice.discount.toFixed(2)}</Typography>
            </Box>
            
            <Divider sx={{ my: 1 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2">Total</Typography>
              <Typography variant="subtitle2" color="primary.main">
                ₹{invoice.total.toFixed(2)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
      
      {/* Notes */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          NOTES
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Thank you for your business. Payment is due within 15 days of invoice date.
        </Typography>
      </Box>
      
      {/* Footer */}
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Invoice #{invoice.invoiceNumber}
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          Page 1 of 1
        </Typography>
      </Box>
    </Paper>
  );
};

export default MinimalistInvoiceTemplate;