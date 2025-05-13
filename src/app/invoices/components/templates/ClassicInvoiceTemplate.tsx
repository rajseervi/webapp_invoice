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
  Stack // Import Stack
} from '@mui/material';

import { Invoice } from '@/types/invoice';
import CompanyInfoDisplay from '@/components/CompanyInfoDisplay';

interface InvoiceTemplateProps {
  invoice: Invoice;
}

const ClassicInvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ invoice }) => {
  const theme = useTheme();

  // Helper to safely format currency
  const formatCurrency = (value: number | undefined | null): string => {
    return `₹${(value ?? 0).toFixed(2)}`;
  };

  // Helper to safely format date
  const formatDate = (dateInput: any): string => {
    if (!dateInput) return 'N/A';
    try {
      // Handle Firestore Timestamp
      if (dateInput.toDate) {
        return new Date(dateInput.toDate()).toLocaleDateString();
      }
      // Handle ISO string or other date formats Date can parse
      const date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
    } catch (e) {
      console.error("Error formatting date:", e);
    }
    // Fallback for simple strings or unparseable dates
    return String(dateInput);
  };


  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 4 }, // Responsive padding
        mb: 3,
        borderRadius: 1, // Slightly rounded corners
        border: `1px solid ${theme.palette.divider}`,
        position: 'relative',
        overflow: 'hidden',
        bgcolor: theme.palette.background.paper // Ensure background color
      }}
    >
      {/* Watermark */}
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(-45deg)',
        fontSize: { xs: '80px', sm: '100px', md: '120px' }, // Responsive font size
        fontWeight: 'bold',
        color: alpha(theme.palette.text.primary, 0.03), // Use text color alpha
        zIndex: 0,
        pointerEvents: 'none',
        width: '100%',
        textAlign: 'center',
        userSelect: 'none' // Prevent selection
      }}>
        INVOICE
      </Box>

      {/* Content */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Grid container spacing={2} sx={{ mb: 4 }} alignItems="flex-start">
           <Grid item xs={12} sm={6}>
             <Typography variant="h4" sx={{
               fontWeight: 'bold',
               letterSpacing: 1,
               color: theme.palette.text.primary
             }}>
               INVOICE
             </Typography>
             <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
               {`Created on ${formatDate(invoice.createdAt)}`}
             </Typography>
           </Grid>

           <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
             <Paper variant="outlined" sx={{ p: 2, minWidth: 220, mt: { xs: 2, sm: 0 } }}>
               <Stack spacing={1}>
                 <Box>
                   <Typography variant="body2" color="text.secondary">
                     Invoice Number
                   </Typography>
                   <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                     {invoice.invoiceNumber || 'N/A'}
                   </Typography>
                 </Box>
                 <Box>
                   <Typography variant="body2" color="text.secondary">
                     Date
                   </Typography>
                   <Typography variant="body1">
                     {formatDate(invoice.date) || 'N/A'}
                   </Typography>
                 </Box>
               </Stack>
             </Paper>
           </Grid>
        </Grid>

        <Divider sx={{ mb: 4 }} />


        {/* Party and From Info */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
             <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
             <CompanyInfoDisplay variant="invoice" />
             </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
             <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
               <Typography variant="overline" color="text.secondary" display="block" gutterBottom>
                 BILL TO
               </Typography>
               <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
                 {invoice.partyName || 'N/A'}
               </Typography>
               {invoice.partyAddress && (
                 <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: 1 }}>
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
             </Paper>
          </Grid>

      
        </Grid>

        {/* Products */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', mb: 2 }}>
          Invoice Items
        </Typography>

        <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.08) }}>
                <TableCell sx={{ fontWeight: 'bold', py: 1 }}>Description</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', py: 1 }}>Quantity</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', py: 1 }}>Unit Price</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', py: 1 }}>Discount</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', py: 1 }}>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.items?.map((item, index) => ( // Add safe navigation for items
                <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ py: 1 }}>{item.name}</TableCell>
                  <TableCell align="right" sx={{ py: 1 }}>{item.quantity}</TableCell>
                  <TableCell align="right" sx={{ py: 1 }}>{formatCurrency(item.price)}</TableCell>
                  <TableCell align="right" sx={{ py: 1 }}>
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
                  <TableCell align="right" sx={{ py: 1 }}>{formatCurrency(item.finalPrice)}</TableCell>
                </TableRow>
              ))}

              {/* Add empty rows logic can be kept or removed based on preference */}
              {(invoice.items?.length ?? 0) < 5 && Array(5 - (invoice.items?.length ?? 0)).fill(0).map((_, index) => (
                <TableRow key={`empty-${index}`} sx={{ height: '42px' }}>
                  <TableCell sx={{ py: 1 }}></TableCell>
                  <TableCell sx={{ py: 1 }}></TableCell>
                  <TableCell sx={{ py: 1 }}></TableCell>
                  <TableCell sx={{ py: 1 }}></TableCell>
                  <TableCell sx={{ py: 1 }}></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Summary */}
        <Grid container justifyContent="flex-end" sx={{ mb: 4 }}>
           <Grid item xs={12} sm={6} md={5}>
             <Paper variant="outlined" sx={{ p: 2 }}>
               <Stack spacing={1.5}>
                 <Stack direction="row" justifyContent="space-between">
                   <Typography variant="body1">Subtotal:</Typography>
                   <Typography variant="body1">{formatCurrency(invoice.subtotal)}</Typography>
                 </Stack>

                 <Stack direction="row" justifyContent="space-between">
                   <Typography variant="body1">Discount:</Typography>
                   <Typography variant="body1" color="error.main">
                     - {formatCurrency(invoice.discount)}
                   </Typography>
                 </Stack>

                 {/* Add Transport Charges if available in your Invoice type */}
                 {invoice.transportCharges != null && invoice.transportCharges > 0 && (
                    <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body1">Transport:</Typography>
                        <Typography variant="body1">
                            {formatCurrency(invoice.transportCharges)}
                        </Typography>
                    </Stack>
                 )}

                 <Divider />

                 <Stack direction="row" justifyContent="space-between">
                   <Typography variant="h6" fontWeight="bold">Total:</Typography>
                   <Typography variant="h6" fontWeight="bold">
                     {formatCurrency(invoice.total)}
                   </Typography>
                 </Stack>
               </Stack>
             </Paper>
           </Grid>
        </Grid>

        {/* Notes, Payment Info, Terms */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Notes Section */}
            {invoice.notes && (
                <Grid item xs={12} md={6}>
                    <Typography variant="overline" color="text.secondary" display="block" gutterBottom>
                        Notes
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, whiteSpace: 'pre-wrap', minHeight: 100 }}>
                        <Typography variant="body2">{invoice.notes}</Typography>
                    </Paper>
                </Grid>
            )}

            {/* Payment Info Section */}
            <Grid item xs={12} md={invoice.notes ? 6 : 12}> {/* Adjust width if notes exist */}
                <Typography variant="overline" color="text.secondary" display="block" gutterBottom>
                    Payment Information
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2">
                        Bank Name: EXAMPLE BANK
                        <br />
                        Account Name: Your Company Name
                        <br />
                        Account Number: XXXXXXXXXXXX
                        <br />
                        IFSC Code: EXMPL12345
                    </Typography>
                </Paper>
            </Grid>
        </Grid>


        {/* Terms */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="overline" color="text.secondary" display="block" gutterBottom>
            Terms & Conditions
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2" component="div"> {/* Use div for proper list rendering */}
              <ol style={{ paddingLeft: '20px', margin: 0 }}>
                <li>Payment is due within 30 days.</li>
                <li>Please include the invoice number on your payment.</li>
                <li>This is a computer-generated invoice and does not require a signature.</li>
              </ol>
            </Typography>
          </Paper>
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