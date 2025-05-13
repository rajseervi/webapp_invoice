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
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  ShoppingCart as ShoppingCartIcon,
  Summarize as SummarizeIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';

import { Invoice } from '@/types/invoice';
import CompanyInfoDisplay from '@/components/CompanyInfoDisplay';

interface InvoiceTemplateProps {
  invoice: Invoice;
}

const ModernInvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ invoice }) => {
  const theme = useTheme();
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 4, 
        mb: 3, 
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        background: `linear-gradient(to bottom, ${alpha(theme.palette.primary.light, 0.05)}, ${alpha(theme.palette.background.paper, 1)} 20%)`,
      }}
    >
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        mb: 4,
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            color: theme.palette.primary.main,
            fontWeight: 'bold'
          }}>
            <ReceiptIcon fontSize="large" />
            INVOICE
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {invoice.createdAt ? 
              `Created on ${invoice.createdAt.toDate ? new Date(invoice.createdAt.toDate()).toLocaleDateString() : new Date(invoice.createdAt).toLocaleDateString()}` : 
              'Date not available'}
          </Typography>
        </Box>
        
        <Box sx={{ 
          p: 2, 
          bgcolor: alpha(theme.palette.primary.main, 0.05), 
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          minWidth: 200,
          textAlign: 'center'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'medium', color: theme.palette.primary.main }}>
            {invoice.invoiceNumber}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 1 }}>
            <CalendarIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {invoice.date}
            </Typography>
          </Box>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 4 }} />
      
      {/* Company and Party Info */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              height: '100%', 
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.background.paper, 0.7)
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <BusinessIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="medium" color="primary.main">
                FROM
              </Typography>
            </Box>
            <CompanyInfoDisplay variant="invoice" />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              height: '100%', 
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.background.paper, 0.7)
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PersonIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="medium" color="primary.main">
                BILL TO
              </Typography>
            </Box>
            <Typography variant="h6" gutterBottom>{invoice.partyName}</Typography>
            {invoice.partyAddress && (
              <Typography variant="body2" paragraph>{invoice.partyAddress}</Typography>
            )}
            {invoice.partyEmail && (
              <Typography variant="body2">Email: {invoice.partyEmail}</Typography>
            )}
            {invoice.partyPhone && (
              <Typography variant="body2">Phone: {invoice.partyPhone}</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Invoice Total */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.background.paper, 0.7)
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                <SummarizeIcon color="primary" />
                <Typography variant="subtitle1" fontWeight="medium" color="primary.main">
                  INVOICE TOTAL
                </Typography>
              </Box>
              <Typography 
                variant="h3" 
                color="primary.main" 
                sx={{ 
                  fontWeight: 'bold',
                  textShadow: `1px 1px 2px ${alpha(theme.palette.primary.main, 0.2)}`
                }}
              >
                ₹{invoice.total.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Including ₹{invoice.discount.toFixed(2)} in discounts
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Products */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <ShoppingCartIcon color="primary" />
          <Typography variant="h6" fontWeight="medium">
            Products
          </Typography>
        </Box>
        
        <TableContainer 
          component={Paper} 
          elevation={0} 
          sx={{ 
            mb: 4, 
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden'
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Price</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Discount</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.items.map((item, index) => (
                <TableRow key={index} sx={{ 
                  '&:nth-of-type(odd)': { 
                    bgcolor: alpha(theme.palette.background.default, 0.5) 
                  },
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.03)
                  }
                }}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell align="right">₹{item.price.toFixed(2)}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">
                    {item.discount > 0 ? (
                      <Chip 
                        label={`${item.discount}%`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        sx={{ 
                          '& .MuiChip-label': { 
                            px: 1,
                            fontWeight: 'medium'
                          } 
                        }}
                      />
                    ) : '-'}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                    ₹{item.finalPrice.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      
      {/* Summary */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            width: { xs: '100%', sm: '50%', md: '40%' },
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.background.paper, 0.7)
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Subtotal:</Typography>
            <Typography variant="subtitle2">₹{invoice.subtotal.toFixed(2)}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Discount:</Typography>
            <Typography variant="subtitle2" color="primary">
              - ₹{invoice.discount.toFixed(2)}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="bold">Total:</Typography>
            <Typography variant="h6" fontWeight="bold" color="primary.main">
              ₹{invoice.total.toFixed(2)}
            </Typography>
          </Box>
        </Paper>
      </Box>
      
      {/* Footer */}
      <Divider sx={{ mb: 3 }} />
      
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body1" color="primary" sx={{ mb: 1, fontWeight: 'medium' }}>
          Thank you for your business!
        </Typography>
        <Typography variant="caption" color="text.secondary">
          This is a computer-generated invoice and does not require a signature.
        </Typography>
      </Box>
    </Paper>
  );
};

export default ModernInvoiceTemplate;