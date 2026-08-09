"use client";
import React, { useState } from 'react';
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
  Grid,
  Paper,
  Chip,
  Card,
  CardContent,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Button,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  LocalShipping as ShippingIcon,
  Payments as PaymentsIcon,
  Notes as NotesIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FileCopy as FileCopyIcon,
  Share as ShareIcon,Print as PrintIcon,
  ShoppingCart as ShoppingIcon
} from '@mui/icons-material';
import { Invoice } from '@/types/invoice';
import CompanyInfoDisplay from '@/components/CompanyInfoDisplay';

interface EnhancedInvoiceViewProps {
  invoice: Invoice;
}

// Helper to safely format currency
const formatCurrency = (value: number | undefined | null): string => {
  return `₹${(value ?? 0).toFixed(2)}`;
};

// Helper to safely format date
const formatDate = (dateInput: any): string => {
  if (!dateInput) return 'N/A';
  try {
    if (dateInput.toDate) {
      return new Date(dateInput.toDate()).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
  } catch (e) { /* ignore */ }
  return String(dateInput);
};

// Helper to copy text to clipboard
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
    .then(() => {
      alert('Copied to clipboard!');
    })
    .catch(err => {
      console.error('Failed to copy: ', err);
    });
};

const EnhancedInvoiceView: React.FC<EnhancedInvoiceViewProps> = ({ invoice }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'items': true,
    'summary': true,
    'party': true,
    'company': true,
    'notes': true,
    'gst': invoice.isGstInvoice || false
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Calculate payment status based on invoice date
  const getPaymentStatus = () => {
    try {
      const invoiceDate = new Date(invoice.date);
      const today = new Date();
      const daysDifference = Math.floor((today.getTime() - invoiceDate.getTime()) / (1000 * 3600 * 24));
      
      if (daysDifference > 30) {
        return { label: 'Overdue', color: 'error' };
      } else if (daysDifference > 15) {
        return { label: 'Due Soon', color: 'warning' };
      } else {
        return { label: 'Paid', color: 'success' };
      }
    } catch (e) {
      return { label: 'Unknown', color: 'default' };
    }
  };

  const paymentStatus = getPaymentStatus();

  return (
    <Box sx={{ mb: 4 }}>
      {/* Invoice Header Card */}
      <Card 
        elevation={0} 
        sx={{ 
          mb: 3, 
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          overflow: 'visible'
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {/* Top Banner */}
          <Box 
            sx={{ 
              p: 3, 
              bgcolor: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.primary.main, 0.1) 
                : alpha(theme.palette.primary.main, 0.05),
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ReceiptIcon color="primary" fontSize="large" />
              <Box>
                <Typography variant="h5" component="h1" fontWeight="bold">
                  Invoice #{invoice.invoiceNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Created on {formatDate(invoice.createdAt)}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={paymentStatus.label} 
                color={paymentStatus.color as any} 
                variant="outlined" 
                size="small"
              />
              <Chip 
                label={invoice.isGstInvoice ? 'GST Invoice' : 'Regular Invoice'} 
                color="primary" 
                variant="outlined" 
                size="small"
              />
              <Tooltip title="Copy Invoice Number">
                <IconButton 
                  size="small" 
                  onClick={() => copyToClipboard(invoice.invoiceNumber)}
                >
                  <FileCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share Invoice">
                <IconButton size="small">
                  <ShareIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Invoice Summary */}
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Invoice Date
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(invoice.date)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Invoice Total
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatCurrency(invoice.total)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Customer
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" noWrap>
                    {invoice.partyName}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Payment Due
                  </Typography>
                  <Typography 
                    variant="body1" 
                    fontWeight="medium"
                    color={paymentStatus.color === 'error' ? 'error.main' : 'inherit'}
                  >
                    {formatDate(new Date(new Date(invoice.date).getTime() + 30 * 24 * 60 * 60 * 1000))}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minWidth: 'auto',
              px: 3
            }
          }}
        >
          <Tab label="Details" />
          <Tab label="Items" />
          {invoice.isGstInvoice && <Tab label="GST Information" />}
          <Tab label="Notes & Terms" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box>
        {/* Details Tab */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {/* Party Information */}
            <Grid item xs={12} md={6}>
              <Card 
                elevation={0} 
                sx={{ 
                  height: '100%',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2
                }}
              >
                <CardContent>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon color="primary" />
                      <Typography variant="h6">Customer Information</Typography>
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={() => toggleSection('party')}
                      aria-label={expandedSections.party ? 'Collapse party section' : 'Expand party section'}
                    >
                      {expandedSections.party ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                  
                  {expandedSections.party && (
                    <Box>
                      <Typography variant="body1" fontWeight="bold" gutterBottom>
                        {invoice.partyName}
                      </Typography>
                      
                      {invoice.partyAddress && (
                        <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-line' }}>
                          {invoice.partyAddress}
                        </Typography>
                      )}
                      
                      <Grid container spacing={2}>
                        {invoice.partyEmail && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Email
                            </Typography>
                            <Typography variant="body2">
                              {invoice.partyEmail}
                            </Typography>
                          </Grid>
                        )}
                        
                        {invoice.partyPhone && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Phone
                            </Typography>
                            <Typography variant="body2">
                              {invoice.partyPhone}
                            </Typography>
                          </Grid>
                        )}
                        
                        {invoice.partyGstin && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              GSTIN
                            </Typography>
                            <Typography variant="body2">
                              {invoice.partyGstin}
                            </Typography>
                          </Grid>
                        )}
                        
                        {invoice.partyStateCode && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              State Code
                            </Typography>
                            <Typography variant="body2">
                              {invoice.partyStateCode}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Company Information */}
            <Grid item xs={12} md={6}>
              <Card 
                elevation={0} 
                sx={{ 
                  height: '100%',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2
                }}
              >
                <CardContent>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <InfoIcon color="primary" />
                      <Typography variant="h6">Company Information</Typography>
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={() => toggleSection('company')}
                      aria-label={expandedSections.company ? 'Collapse company section' : 'Expand company section'}
                    >
                      {expandedSections.company ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                  
                  {expandedSections.company && (
                    <Box>
                      <Typography variant="body1" fontWeight="bold" gutterBottom>
                        {invoice.companyName || 'Your Company'}
                      </Typography>
                      
                      {invoice.companyAddress && (
                        <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-line' }}>
                          {invoice.companyAddress}
                        </Typography>
                      )}
                      
                      <Grid container spacing={2}>
                        {invoice.companyEmail && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Email
                            </Typography>
                            <Typography variant="body2">
                              {invoice.companyEmail}
                            </Typography>
                          </Grid>
                        )}
                        
                        {invoice.companyPhone && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Phone
                            </Typography>
                            <Typography variant="body2">
                              {invoice.companyPhone}
                            </Typography>
                          </Grid>
                        )}
                        
                        {invoice.companyGstin && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              GSTIN
                            </Typography>
                            <Typography variant="body2">
                              {invoice.companyGstin}
                            </Typography>
                          </Grid>
                        )}
                        
                        {invoice.companyStateCode && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              State Code
                            </Typography>
                            <Typography variant="body2">
                              {invoice.companyStateCode}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Payment Summary */}
            <Grid item xs={12}>
              <Card 
                elevation={0} 
                sx={{ 
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2
                }}
              >
                <CardContent>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PaymentsIcon color="primary" />
                      <Typography variant="h6">Payment Summary</Typography>
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={() => toggleSection('summary')}
                      aria-label={expandedSections.summary ? 'Collapse summary section' : 'Expand summary section'}
                    >
                      {expandedSections.summary ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                  
                  {expandedSections.summary && (
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableBody>
                              <TableRow>
                                <TableCell component="th" scope="row">Subtotal</TableCell>
                                <TableCell align="right">{formatCurrency(invoice.subtotal)}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" scope="row">Discount</TableCell>
                                <TableCell align="right" sx={{ color: 'error.main' }}>
                                  {formatCurrency(invoice.discount)}
                                </TableCell>
                              </TableRow>
                              {invoice.isGstInvoice && (
                                <TableRow>
                                  <TableCell component="th" scope="row">Total Tax</TableCell>
                                  <TableCell align="right">{formatCurrency(invoice.totalTaxAmount)}</TableCell>
                                </TableRow>
                              )}
                              {invoice.roundOff !== undefined && (
                                <TableRow>
                                  <TableCell component="th" scope="row">Round Off</TableCell>
                                  <TableCell align="right">{formatCurrency(invoice.roundOff)}</TableCell>
                                </TableRow>
                              )}
                              <TableRow>
                                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                                  Total Amount
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                  {formatCurrency(invoice.total)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 2, 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'center' 
                          }}
                        >
                          <Typography variant="overline" color="text.secondary" gutterBottom>
                            Amount in Words
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {invoice.amountInWords || `Rupees ${invoice.total.toFixed(0)} Only`}
                          </Typography>
                          
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="overline" color="text.secondary" gutterBottom>
                              Payment Status
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip 
                                label={paymentStatus.label} 
                                color={paymentStatus.color as any} 
                                size="small"
                              />
                              <Typography variant="body2" color="text.secondary">
                                Due on {formatDate(new Date(new Date(invoice.date).getTime() + 30 * 24 * 60 * 60 * 1000))}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        
        {/* Items Tab */}
        {activeTab === 1 && (
          <Card 
            elevation={0} 
            sx={{ 
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2
            }}
          >
            <CardContent>
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mb: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShoppingIcon color="primary" />
                  <Typography variant="h6">Invoice Items</Typography>
                </Box>
                <IconButton 
                  size="small" 
                  onClick={() => toggleSection('items')}
                  aria-label={expandedSections.items ? 'Collapse items section' : 'Expand items section'}
                >
                  {expandedSections.items ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              {expandedSections.items && (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.primary.main, 0.05) }}>
                      <TableRow>
                        <TableCell width="5%">#</TableCell>
                        <TableCell width="30%">Item Description</TableCell>
                        {invoice.isGstInvoice && <TableCell>HSN/SAC</TableCell>}
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Discount</TableCell>
                        {invoice.isGstInvoice && <TableCell align="right">GST Rate</TableCell>}
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoice.items.map((item, index) => (
                        <TableRow key={index} hover>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {item.name}
                            </Typography>
                            {item.category && (
                              <Typography variant="caption" color="text.secondary">
                                Category: {item.category}
                              </Typography>
                            )}
                          </TableCell>
                          {invoice.isGstInvoice && <TableCell>{item.hsnCode || '-'}</TableCell>}
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                          <TableCell align="right">
                            {item.discount > 0 ? `${item.discount}%` : '-'}
                          </TableCell>
                          {invoice.isGstInvoice && (
                            <TableCell align="right">{item.gstRate || 0}%</TableCell>
                          )}
                          <TableCell align="right" fontWeight="medium">
                            {formatCurrency(item.finalPrice)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* GST Information Tab */}
        {activeTab === 2 && invoice.isGstInvoice && (
          <Card 
            elevation={0} 
            sx={{ 
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2
            }}
          >
            <CardContent>
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mb: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReceiptIcon color="primary" />
                  <Typography variant="h6">GST Details</Typography>
                </Box>
                <IconButton 
                  size="small" 
                  onClick={() => toggleSection('gst')}
                  aria-label={expandedSections.gst ? 'Collapse GST section' : 'Expand GST section'}
                >
                  {expandedSections.gst ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              {expandedSections.gst && (
                <Box>
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          GST Registration Details
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Company GSTIN
                            </Typography>
                            <Typography variant="body2">
                              {invoice.companyGstin || 'Not provided'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Company State Code
                            </Typography>
                            <Typography variant="body2">
                              {invoice.companyStateCode || 'Not provided'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Customer GSTIN
                            </Typography>
                            <Typography variant="body2">
                              {invoice.partyGstin || 'Not provided'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Customer State Code
                            </Typography>
                            <Typography variant="body2">
                              {invoice.partyStateCode || 'Not provided'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              Place of Supply
                            </Typography>
                            <Typography variant="body2">
                              {invoice.placeOfSupply || 'Not specified'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                        <Typography variant="subtitle2" gutterBottom>
                          GST Summary
                        </Typography>
                        <TableContainer>
                          <Table size="small">
                            <TableBody>
                              <TableRow>
                                <TableCell component="th" scope="row">Total Taxable Amount</TableCell>
                                <TableCell align="right">
                                  {formatCurrency(invoice.totalTaxableAmount || invoice.subtotal)}
                                </TableCell>
                              </TableRow>
                              
                              {invoice.companyStateCode === invoice.partyStateCode ? (
                                <>
                                  <TableRow>
                                    <TableCell component="th" scope="row">CGST</TableCell>
                                    <TableCell align="right">
                                      {formatCurrency(invoice.totalCgst || 0)}
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell component="th" scope="row">SGST</TableCell>
                                    <TableCell align="right">
                                      {formatCurrency(invoice.totalSgst || 0)}
                                    </TableCell>
                                  </TableRow>
                                </>
                              ) : (
                                <TableRow>
                                  <TableCell component="th" scope="row">IGST</TableCell>
                                  <TableCell align="right">
                                    {formatCurrency(invoice.totalIgst || 0)}
                                  </TableCell>
                                </TableRow>
                              )}
                              
                              <TableRow>
                                <TableCell component="th" scope="row">Total Tax</TableCell>
                                <TableCell align="right">
                                  {formatCurrency(invoice.totalTaxAmount || 0)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    GST Breakdown by Rate
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.primary.main, 0.05) }}>
                        <TableRow>
                          <TableCell>GST Rate</TableCell>
                          <TableCell align="right">Taxable Amount</TableCell>
                          {invoice.companyStateCode === invoice.partyStateCode ? (
                            <>
                              <TableCell align="right">CGST</TableCell>
                              <TableCell align="right">SGST</TableCell>
                            </>
                          ) : (
                            <TableCell align="right">IGST</TableCell>
                          )}
                          <TableCell align="right">Total Tax</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {/* Group items by GST rate */}
                        {Object.entries(
                          invoice.items.reduce((acc, item) => {
                            const rate = item.gstRate || 0;
                            if (!acc[rate]) {
                              acc[rate] = {
                                taxableAmount: 0,
                                cgstAmount: 0,
                                sgstAmount: 0,
                                igstAmount: 0,
                                totalTaxAmount: 0
                              };
                            }
                            acc[rate].taxableAmount += item.taxableAmount || item.finalPrice;
                            acc[rate].cgstAmount += item.cgstAmount || 0;
                            acc[rate].sgstAmount += item.sgstAmount || 0;
                            acc[rate].igstAmount += item.igstAmount || 0;
                            acc[rate].totalTaxAmount += item.totalTaxAmount || 0;
                            return acc;
                          }, {} as Record<number, any>)
                        ).map(([rate, amounts]) => (
                          <TableRow key={rate} hover>
                            <TableCell>{rate}%</TableCell>
                            <TableCell align="right">{formatCurrency(amounts.taxableAmount)}</TableCell>
                            {invoice.companyStateCode === invoice.partyStateCode ? (
                              <>
                                <TableCell align="right">{formatCurrency(amounts.cgstAmount)}</TableCell>
                                <TableCell align="right">{formatCurrency(amounts.sgstAmount)}</TableCell>
                              </>
                            ) : (
                              <TableCell align="right">{formatCurrency(amounts.igstAmount)}</TableCell>
                            )}
                            <TableCell align="right">{formatCurrency(amounts.totalTaxAmount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Notes & Terms Tab */}
        {activeTab === 3 && (
          <Card 
            elevation={0} 
            sx={{ 
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2
            }}
          >
            <CardContent>
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mb: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotesIcon color="primary" />
                  <Typography variant="h6">Notes & Terms</Typography>
                </Box>
                <IconButton 
                  size="small" 
                  onClick={() => toggleSection('notes')}
                  aria-label={expandedSections.notes ? 'Collapse notes section' : 'Expand notes section'}
                >
                  {expandedSections.notes ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              {expandedSections.notes && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Invoice Notes
                      </Typography>
                      {invoice.notes ? (
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {invoice.notes}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          No notes provided for this invoice.
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Terms & Conditions
                      </Typography>
                      <Typography variant="body2" paragraph>
                        1. Payment is due within 30 days of invoice date.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        2. Interest @ 18% p.a. will be charged on overdue amounts.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        3. Subject to local jurisdiction only.
                      </Typography>
                      {invoice.isGstInvoice && (
                        <Typography variant="body2" paragraph>
                          4. E-way bill to be generated for goods transportation as per GST rules.
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.05) : '#f9f9f9' 
                      }}
                    >
                      <Typography variant="subtitle2" gutterBottom>
                        Declaration
                      </Typography>
                      <Typography variant="body2">
                        We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
      
      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button 
          variant="outlined" 
          startIcon={<PrintIcon />}
          component="a"
          href={`/invoices/${invoice.id}/print`}
        >
          Print Invoice
        </Button>
        {invoice.isGstInvoice ? (
          <Button 
            variant="contained" 
            startIcon={<ReceiptIcon />}
            component="a"
            href={`/invoices/gst/${invoice.id}/edit`}
          >
            Edit GST Invoice
          </Button>
        ) : (
          <Button 
            variant="contained" 
            startIcon={<ReceiptIcon />}
            component="a"
            href={`/invoices/${invoice.id}/edit`}
          >
            Edit Invoice
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default EnhancedInvoiceView;