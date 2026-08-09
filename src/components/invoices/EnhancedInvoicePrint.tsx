"use client";
import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Button,
  Stack,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  TextField
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  QrCode as QrCodeIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { EnhancedInvoice } from '@/services/enhancedInvoiceService';
// Note: QR Code and print functionality can be added later with appropriate libraries
// import { useReactToPrint } from 'react-to-print';
// import QRCode from 'qrcode.react';

interface EnhancedInvoicePrintProps {
  invoice: EnhancedInvoice;
  template?: 'standard' | 'minimal' | 'detailed' | 'thermal';
  showSettings?: boolean;
}

interface PrintSettings {
  template: 'standard' | 'minimal' | 'detailed' | 'thermal';
  showQRCode: boolean;
  showCompanyLogo: boolean;
  showBankDetails: boolean;
  showTermsAndConditions: boolean;
  showSignature: boolean;
  paperSize: 'A4' | 'A5' | 'thermal';
  fontSize: 'small' | 'medium' | 'large';
  colorScheme: 'color' | 'grayscale' | 'blackwhite';
}

export default function EnhancedInvoicePrint({
  invoice,
  template = 'standard',
  showSettings = true
}: EnhancedInvoicePrintProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    template,
    showQRCode: true,
    showCompanyLogo: true,
    showBankDetails: true,
    showTermsAndConditions: true,
    showSignature: true,
    paperSize: 'A4',
    fontSize: 'medium',
    colorScheme: 'color'
  });

  const handlePrint = () => {
    // Simple browser print functionality
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const generateQRData = () => {
    return JSON.stringify({
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.invoiceDate,
      amount: invoice.grandTotal,
      gstin: invoice.customerGstin || invoice.supplierGstin,
      type: invoice.type
    });
  };

  const CompanyHeader = () => (
    <Box sx={{ mb: 3, textAlign: 'center' }}>
      {printSettings.showCompanyLogo && (
        <Avatar
          sx={{
            width: 80,
            height: 80,
            mx: 'auto',
            mb: 2,
            bgcolor: 'primary.main'
          }}
        >
          <BusinessIcon sx={{ fontSize: 40 }} />
        </Avatar>
      )}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Your Company Name
      </Typography>
      <Typography variant="body2" color="text.secondary">
        123 Business Street, City, State - 123456
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Phone: +91 12345 67890 | Email: info@company.com
      </Typography>
      <Typography variant="body2" color="text.secondary">
        GSTIN: 27ABCDE1234F1Z5
      </Typography>
    </Box>
  );

  const InvoiceHeader = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              {invoice.type === 'sales' ? 'Bill To:' : 'Bill From:'}
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {invoice.customerName || invoice.supplierName}
            </Typography>
            {(invoice.customerGstin || invoice.supplierGstin) && (
              <Typography variant="body2" color="text.secondary">
                GSTIN: {invoice.customerGstin || invoice.supplierGstin}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Invoice Details:
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Invoice #:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight="bold">
                  {invoice.invoiceNumber}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Date:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  {new Date(invoice.invoiceDate).toLocaleDateString()}
                </Typography>
              </Grid>
              
              {invoice.dueDate && (
                <>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Due Date:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                </>
              )}
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Status:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Chip
                  label={invoice.status.toUpperCase()}
                  size="small"
                  color={invoice.status === 'confirmed' ? 'success' : 'default'}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const ItemsTable = () => (
    <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
      <Table size={printSettings.paperSize === 'thermal' ? 'small' : 'medium'}>
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.100' }}>
            <TableCell><strong>S.No</strong></TableCell>
            <TableCell><strong>Description</strong></TableCell>
            <TableCell><strong>HSN/SAC</strong></TableCell>
            <TableCell align="right"><strong>Qty</strong></TableCell>
            <TableCell align="right"><strong>Rate</strong></TableCell>
            {printSettings.template !== 'minimal' && (
              <>
                <TableCell align="right"><strong>Discount</strong></TableCell>
                <TableCell align="right"><strong>Taxable</strong></TableCell>
                <TableCell align="right"><strong>GST</strong></TableCell>
              </>
            )}
            <TableCell align="right"><strong>Amount</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invoice.items.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight="medium">
                  {item.productName}
                </Typography>
                {item.description && printSettings.template === 'detailed' && (
                  <Typography variant="caption" color="text.secondary">
                    {item.description}
                  </Typography>
                )}
              </TableCell>
              <TableCell>{item.hsnCode || item.sacCode}</TableCell>
              <TableCell align="right">
                {item.quantity} {item.unitOfMeasurement}
              </TableCell>
              <TableCell align="right">
                {formatCurrency(item.unitPrice)}
              </TableCell>
              {printSettings.template !== 'minimal' && (
                <>
                  <TableCell align="right">
                    {item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(item.taxableAmount)}
                  </TableCell>
                  <TableCell align="right">
                    {item.gstRate}%
                  </TableCell>
                </>
              )}
              <TableCell align="right">
                <Typography variant="body2" fontWeight="bold">
                  {formatCurrency(item.totalAmount)}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const TotalsSection = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} md={8}>
        {printSettings.showQRCode && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" gutterBottom>
              QR Code for Invoice Details
            </Typography>
            <Box sx={{ 
              width: 100, 
              height: 100, 
              border: '2px dashed #ccc', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              mx: 'auto'
            }}>
              <QrCodeIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
            </Box>
            <Typography variant="caption" color="text.secondary">
              QR Code will be generated here
            </Typography>
          </Box>
        )}
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Invoice Summary
            </Typography>
            
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Subtotal:</Typography>
                <Typography variant="body2">
                  {formatCurrency(invoice.subtotal)}
                </Typography>
              </Box>
              
              {invoice.totalDiscount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Discount:</Typography>
                  <Typography variant="body2">
                    -{formatCurrency(invoice.totalDiscount)}
                  </Typography>
                </Box>
              )}
              
              {!invoice.isInterState ? (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">CGST:</Typography>
                    <Typography variant="body2">
                      {formatCurrency(invoice.totalCgst)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">SGST:</Typography>
                    <Typography variant="body2">
                      {formatCurrency(invoice.totalSgst)}
                    </Typography>
                  </Box>
                </>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">IGST:</Typography>
                  <Typography variant="body2">
                    {formatCurrency(invoice.totalIgst)}
                  </Typography>
                </Box>
              )}
              
              {invoice.totalCess > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">CESS:</Typography>
                  <Typography variant="body2">
                    {formatCurrency(invoice.totalCess)}
                  </Typography>
                </Box>
              )}
              
              {invoice.roundOffAmount !== 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Round Off:</Typography>
                  <Typography variant="body2">
                    {formatCurrency(invoice.roundOffAmount)}
                  </Typography>
                </Box>
              )}
              
              <Divider />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight="bold">
                  Grand Total:
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {formatCurrency(invoice.grandTotal)}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const Footer = () => (
    <Box sx={{ mt: 4 }}>
      {invoice.notes && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Notes:
          </Typography>
          <Typography variant="body2">
            {invoice.notes}
          </Typography>
        </Box>
      )}
      
      {printSettings.showTermsAndConditions && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Terms & Conditions:
          </Typography>
          <Typography variant="caption">
            1. Payment is due within 30 days of invoice date.
            <br />
            2. Late payments may incur additional charges.
            <br />
            3. Goods once sold cannot be returned without prior approval.
          </Typography>
        </Box>
      )}
      
      {printSettings.showBankDetails && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Bank Details:
          </Typography>
          <Typography variant="caption">
            Bank: State Bank of India
            <br />
            Account No: 1234567890
            <br />
            IFSC: SBIN0001234
            <br />
            Branch: Main Branch
          </Typography>
        </Box>
      )}
      
      {printSettings.showSignature && (
        <Box sx={{ mt: 4, textAlign: 'right' }}>
          <Typography variant="body2" fontWeight="bold">
            Authorized Signatory
          </Typography>
          <Box sx={{ height: 60, borderBottom: '1px solid #ccc', width: 200, ml: 'auto', mt: 2 }} />
        </Box>
      )}
    </Box>
  );

  const PrintSettingsDialog = () => (
    <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        Print Settings
        <IconButton
          onClick={() => setSettingsOpen(false)}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Template</InputLabel>
              <Select
                value={printSettings.template}
                label="Template"
                onChange={(e) => setPrintSettings(prev => ({ ...prev, template: e.target.value as any }))}
              >
                <MenuItem value="standard">Standard</MenuItem>
                <MenuItem value="minimal">Minimal</MenuItem>
                <MenuItem value="detailed">Detailed</MenuItem>
                <MenuItem value="thermal">Thermal</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Paper Size</InputLabel>
              <Select
                value={printSettings.paperSize}
                label="Paper Size"
                onChange={(e) => setPrintSettings(prev => ({ ...prev, paperSize: e.target.value as any }))}
              >
                <MenuItem value="A4">A4</MenuItem>
                <MenuItem value="A5">A5</MenuItem>
                <MenuItem value="thermal">Thermal (80mm)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Font Size</InputLabel>
              <Select
                value={printSettings.fontSize}
                label="Font Size"
                onChange={(e) => setPrintSettings(prev => ({ ...prev, fontSize: e.target.value as any }))}
              >
                <MenuItem value="small">Small</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="large">Large</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Color Scheme</InputLabel>
              <Select
                value={printSettings.colorScheme}
                label="Color Scheme"
                onChange={(e) => setPrintSettings(prev => ({ ...prev, colorScheme: e.target.value as any }))}
              >
                <MenuItem value="color">Color</MenuItem>
                <MenuItem value="grayscale">Grayscale</MenuItem>
                <MenuItem value="blackwhite">Black & White</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Include Sections:
            </Typography>
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={printSettings.showQRCode}
                    onChange={(e) => setPrintSettings(prev => ({ ...prev, showQRCode: e.target.checked }))}
                  />
                }
                label="QR Code"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={printSettings.showCompanyLogo}
                    onChange={(e) => setPrintSettings(prev => ({ ...prev, showCompanyLogo: e.target.checked }))}
                  />
                }
                label="Company Logo"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={printSettings.showBankDetails}
                    onChange={(e) => setPrintSettings(prev => ({ ...prev, showBankDetails: e.target.checked }))}
                  />
                }
                label="Bank Details"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={printSettings.showTermsAndConditions}
                    onChange={(e) => setPrintSettings(prev => ({ ...prev, showTermsAndConditions: e.target.checked }))}
                  />
                }
                label="Terms & Conditions"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={printSettings.showSignature}
                    onChange={(e) => setPrintSettings(prev => ({ ...prev, showSignature: e.target.checked }))}
                  />
                }
                label="Signature Section"
              />
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
        <Button onClick={() => setSettingsOpen(false)} variant="contained">Apply</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      {/* Print Controls */}
      {showSettings && (
        <Box className="no-print" sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
            >
              Print Invoice
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => {
                // Implement PDF download
                console.log('Download PDF');
              }}
            >
              Download PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => setSettingsOpen(true)}
            >
              Print Settings
            </Button>
          </Stack>
        </Box>
      )}

      {/* Printable Content */}
      <Box
        ref={printRef}
        sx={{
          bgcolor: 'white',
          p: printSettings.paperSize === 'thermal' ? 1 : 3,
          minHeight: '297mm',
          filter: printSettings.colorScheme === 'grayscale' ? 'grayscale(100%)' : 'none'
        }}
      >
        <CompanyHeader />
        <InvoiceHeader />
        <ItemsTable />
        <TotalsSection />
        <Footer />
      </Box>

      <PrintSettingsDialog />
    </Box>
  );
}