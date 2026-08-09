"use client";
import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Divider,
  Grid,
  Paper
} from '@mui/material';
import { Receipt, DateRange, Person, Payment } from '@mui/icons-material';
import { Invoice } from '@/types/invoice_no_gst';
import EnhancedPdfActions from './EnhancedPdfActions';

interface InvoiceWithEnhancedPdfProps {
  invoice: Invoice;
  showDetails?: boolean;
  variant?: 'card' | 'list' | 'detail';
}

export default function InvoiceWithEnhancedPdf({ 
  invoice, 
  showDetails = true, 
  variant = 'card' 
}: InvoiceWithEnhancedPdfProps) {
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

  if (variant === 'list') {
    return (
      <Paper elevation={1} sx={{ p: 2, mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Receipt color="primary" />
            <Box>
              <Typography variant="h6">
                {invoice.invoiceNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {invoice.partyName} • {formatDate(invoice.date)}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" color="primary">
              {formatCurrency(invoice.totalAmount)}
            </Typography>
            <EnhancedPdfActions invoice={invoice} variant="compact" />
          </Box>
        </Box>
      </Paper>
    );
  }

  if (variant === 'detail') {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="h4" gutterBottom>
                  Invoice #{invoice.invoiceNumber}
                </Typography>
                <Chip 
                  label="Quotation" 
                  color="info" 
                  variant="outlined" 
                  size="small"
                />
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h5" color="primary" gutterBottom>
                  {formatCurrency(invoice.totalAmount)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Amount
                </Typography>
              </Box>
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Person sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Customer
                  </Typography>
                  <Typography variant="body1">
                    {invoice.partyName || 'N/A'}
                  </Typography>
                  {invoice.partyAddress && (
                    <Typography variant="body2" color="text.secondary">
                      {invoice.partyAddress}
                    </Typography>
                  )}
                  {invoice.partyPhone && (
                    <Typography variant="body2" color="text.secondary">
                      Phone: {invoice.partyPhone}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DateRange sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Invoice Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(invoice.date)}
                  </Typography>
                  {invoice.dueDate && (
                    <Typography variant="body2" color="text.secondary">
                      Due: {formatDate(invoice.dueDate)}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Payment sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Payment Details
                  </Typography>
                  <Typography variant="body1">
                    Subtotal: {formatCurrency(invoice.subtotal)}
                  </Typography>
                  {invoice.transportCharges && invoice.transportCharges > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Transport: {formatCurrency(invoice.transportCharges)}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>

            {showDetails && invoice.items && invoice.items.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Items ({invoice.items.length})
                </Typography>
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {invoice.items.map((item, index) => (
                    <Box key={index} sx={{ p: 1, border: '1px solid #e0e0e0', mb: 1, borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" fontWeight="medium">
                            {item.name || item.productName || 'N/A'}
                          </Typography>
                          {item.description && (
                            <Typography variant="body2" color="text.secondary">
                              {item.description}
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary">
                            Qty: {item.quantity} {item.unitOfMeasurement || 'PCS'} × ₹{(item.price || 0).toFixed(2)}
                            {item.discount > 0 && ` (${item.discount}% off)`}
                          </Typography>
                        </Box>
                        <Typography variant="body1" fontWeight="bold">
                          {formatCurrency(item.totalAmount || item.finalPrice || 0)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
        
        <Divider />
        
        <CardActions sx={{ p: 2 }}>
          <EnhancedPdfActions invoice={invoice} variant="default" />
        </CardActions>
      </Card>
    );
  }

  // Default card variant
  return (
    <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="div">
            {invoice.invoiceNumber}
          </Typography>
          <Chip 
            label="Quotation" 
            color="info" 
            variant="outlined" 
            size="small"
          />
        </Box>

        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Customer:</strong> {invoice.partyName || 'N/A'}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          <strong>Date:</strong> {formatDate(invoice.date)}
        </Typography>

        {showDetails && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Items:</strong> {invoice.items?.length || 0}
            </Typography>
            
            {invoice.partyPhone && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Phone:</strong> {invoice.partyPhone}
              </Typography>
            )}
          </>
        )}

        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
          <Typography variant="h6" color="primary" align="right">
            {formatCurrency(invoice.totalAmount)}
          </Typography>
          <Typography variant="body2" color="text.secondary" align="right">
            Total Amount
          </Typography>
        </Box>
      </CardContent>

      <Divider />

      <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
        <EnhancedPdfActions invoice={invoice} variant="minimal" />
      </CardActions>
    </Card>
  );
}