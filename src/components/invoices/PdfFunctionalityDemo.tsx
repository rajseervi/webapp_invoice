"use client";
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Divider,
  Alert,
  Stack,
  Chip
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  Visibility as PreviewIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import EnhancedPdfButton from './EnhancedPdfButton';
import { downloadInvoicePDF, generateInvoiceBlob } from '@/utils/enhancedPdfGenerator';

// Sample invoice data for demonstration
const sampleInvoiceData = {
  id: 'demo-invoice-001',
  invoiceNumber: 'INV-2024-001',
  date: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  company: {
    name: 'Demo Company Ltd.',
    address: '123 Business Street\nCity, State 12345\nCountry',
    gstin: '22AAAAA0000A1Z5',
    phone: '+91 98765 43210',
    email: 'info@democompany.com'
  },
  customer: {
    name: 'Sample Customer',
    address: '456 Customer Avenue\nCustomer City, State 67890\nCountry',
    gstin: '33BBBBB0000B1Z5',
    phone: '+91 87654 32109',
    email: 'customer@example.com'
  },
  items: [
    {
      description: 'Product A - High Quality Item',
      quantity: 2,
      rate: 1000,
      amount: 2000,
      hsn: '1234',
      gstRate: 18
    },
    {
      description: 'Product B - Premium Service',
      quantity: 1,
      rate: 1500,
      amount: 1500,
      hsn: '5678',
      gstRate: 18
    },
    {
      description: 'Product C - Consultation',
      quantity: 3,
      rate: 500,
      amount: 1500,
      hsn: '9012',
      gstRate: 18
    }
  ],
  subtotal: 5000,
  totalTaxAmount: 900,
  total: 5900,
  grandTotal: 5900,
  balanceAmount: 5900,
  discount: 0,
  notes: 'Thank you for your business!\nPayment due within 30 days.',
  terms: 'Terms and Conditions:\n1. Payment due within 30 days\n2. Late payment charges may apply\n3. All disputes subject to local jurisdiction',
  isGstInvoice: true,
  type: 'Sales Invoice',
  status: 'Pending',
  paymentStatus: 'Unpaid',
  paymentDetails: {
    bankName: 'Demo Bank Ltd.',
    accountNumber: '1234567890',
    ifscCode: 'DEMO0001234'
  }
};

const PdfFunctionalityDemo: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleDirectDownload = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      await downloadInvoicePDF(sampleInvoiceData, 'demo-invoice.pdf', { template: 'classic' });
      setMessage('PDF downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      setMessage('Error downloading PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBlobGeneration = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const blob = await generateInvoiceBlob(sampleInvoiceData, { template: 'modern' });
      const url = URL.createObjectURL(blob);
      
      // Open in new tab for preview
      window.open(url, '_blank');
      setMessage('PDF blob generated and opened in new tab!');
      
      // Clean up the URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      console.error('Blob generation error:', error);
      setMessage('Error generating PDF blob. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Enhanced PDF Functionality Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        This demo showcases the enhanced PDF download functionality with blob view capabilities.
        Try the different options below to see how the PDF generation works.
      </Typography>

      <Grid container spacing={3}>
        {/* Enhanced PDF Button Demo */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Enhanced PDF Button
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Full-featured PDF button with preview, download, and template options.
              </Typography>
              
              <Stack spacing={2}>
                <EnhancedPdfButton
                  invoiceData={sampleInvoiceData}
                  variant="contained"
                  size="medium"
                  color="primary"
                  showDropdown={true}
                  defaultAction="preview"
                  buttonText="PDF with Preview"
                />
                
                <EnhancedPdfButton
                  invoiceData={sampleInvoiceData}
                  variant="outlined"
                  size="medium"
                  color="secondary"
                  showDropdown={true}
                  defaultAction="download"
                  buttonText="PDF with Download"
                />
                
                <EnhancedPdfButton
                  invoiceData={sampleInvoiceData}
                  variant="text"
                  size="small"
                  color="primary"
                  showDropdown={false}
                  defaultAction="preview"
                  buttonText="Simple PDF"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Direct API Usage Demo */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Direct API Usage
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Direct usage of PDF generation functions for custom implementations.
              </Typography>
              
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleDirectDownload}
                  disabled={loading}
                  fullWidth
                >
                  Direct Download (Classic Template)
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<PreviewIcon />}
                  onClick={handleBlobGeneration}
                  disabled={loading}
                  fullWidth
                >
                  Generate Blob & Preview (Modern Template)
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Features Overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Available Features
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <PreviewIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      PDF Preview
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      View PDF in modal dialog before downloading
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <DownloadIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Direct Download
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Instant PDF download with custom filename
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <PrintIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Print Integration
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Direct printing from preview or new tab
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <PdfIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Multiple Templates
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Classic, Modern, Minimal, and Thermal layouts
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Template Options:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label="Classic Template" size="small" variant="outlined" />
                <Chip label="Modern Template" size="small" variant="outlined" />
                <Chip label="Minimal Template" size="small" variant="outlined" />
                <Chip label="Thermal Template" size="small" variant="outlined" />
                <Chip label="Custom Settings" size="small" variant="outlined" />
                <Chip label="Watermark Support" size="small" variant="outlined" />
                <Chip label="Multiple Paper Sizes" size="small" variant="outlined" />
                <Chip label="Color Schemes" size="small" variant="outlined" />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Status Messages */}
        {message && (
          <Grid item xs={12}>
            <Alert severity={message.includes('Error') ? 'error' : 'success'}>
              {message}
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default PdfFunctionalityDemo;