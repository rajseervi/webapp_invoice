"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { 
  Container, 
  Typography, 
  Box, 
  CircularProgress, 
  Alert,
  Button,
  Paper,
  Fab,
  Tooltip,
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
  Grid,
  IconButton,
  Stack
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  Share as ShareIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { Invoice } from '@/types/invoice_no_gst';
import EnhancedPrintService, { PrintSettings } from '@/services/enhancedPrintService';
import SimpleInvoiceService from '@/services/simpleInvoiceService';

export default function SimpleEnhancedPrintPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const template = searchParams.get('template') as PrintSettings['template'] || 'modern';

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const [settings, setSettings] = useState<PrintSettings>({
    template,
    paperSize: 'A4',
    orientation: 'portrait',
    includeHeader: true,
    includeFooter: true,
    showWatermark: false,
    copies: 2,
    colorMode: 'color'
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        if (!id) {
          setError('Invoice ID is missing');
          return;
        }

        const invoiceData = await SimpleInvoiceService.getInvoiceById(id as string);
        
        if (!invoiceData) {
          setError('Invoice not found');
          return;
        }

        setInvoice(invoiceData);
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice details');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const handlePrint = async () => {
    if (!invoice) return;
    
    setPrinting(true);
    try {
      await EnhancedPrintService.generateInvoicePDF(
        invoice,
        settings,
        { action: 'print' }
      );
    } catch (error) {
      console.error('Print error:', error);
      setError('Failed to print invoice');
    } finally {
      setPrinting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    
    setPrinting(true);
    try {
      await EnhancedPrintService.generateInvoicePDF(
        invoice,
        settings,
        { action: 'download', filename: `invoice-${invoice.invoiceNumber}.pdf` }
      );
    } catch (error) {
      console.error('PDF download error:', error);
      setError('Failed to download PDF');
    } finally {
      setPrinting(false);
    }
  };

  const handleShare = () => {
    if (navigator.share && invoice) {
      navigator.share({
        title: `Invoice ${invoice.invoiceNumber}`,
        text: `Invoice from ${invoice.partyName}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Invoice URL copied to clipboard');
    }
  };

  const updateSettings = (newSettings: Partial<PrintSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const renderPreview = () => {
    if (!invoice) return null;
    
    const htmlContent = EnhancedPrintService.generatePrintPreviewHTML(invoice, settings);
    
    return (
      <div 
        dangerouslySetInnerHTML={{ 
          __html: htmlContent.replace(/<html>.*?<body[^>]*>|<\/body>.*?<\/html>/gs, '') 
        }} 
      />
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Loading Invoice...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  if (error || !invoice) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Invoice not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          variant="contained"
        >
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => router.back()}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6">
              Print Preview - {invoice.invoiceNumber}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<SettingsIcon />}
              onClick={() => setSettingsOpen(true)}
              variant="outlined"
            >
              Settings
            </Button>
            <Button
              startIcon={<DownloadIcon />}
              onClick={handleDownloadPDF}
              disabled={printing}
              variant="outlined"
            >
              Download PDF
            </Button>
            <Button
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              disabled={printing}
              variant="contained"
            >
              {printing ? <CircularProgress size={20} /> : 'Print'}
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Preview */}
      <Container maxWidth="lg">
        <Paper elevation={4} sx={{ p: 4, minHeight: '80vh' }}>
          {renderPreview()}
        </Paper>
      </Container>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Print Settings
            <IconButton onClick={() => setSettingsOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Template</InputLabel>
                <Select
                  value={settings.template}
                  label="Template"
                  onChange={(e) => updateSettings({ template: e.target.value as any })}
                >
                  <MenuItem value="modern">Modern Template</MenuItem>
                  <MenuItem value="classic">Classic Template</MenuItem>
                  <MenuItem value="minimal">Minimal Template</MenuItem>
                  <MenuItem value="thermal">Thermal Receipt</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Paper Size</InputLabel>
                <Select
                  value={settings.paperSize}
                  label="Paper Size"
                  onChange={(e) => updateSettings({ paperSize: e.target.value as any })}
                >
                  <MenuItem value="A4">A4</MenuItem>
                  <MenuItem value="A5">A5</MenuItem>
                  <MenuItem value="Letter">Letter</MenuItem>
                  <MenuItem value="Thermal">Thermal</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Orientation</InputLabel>
                <Select
                  value={settings.orientation}
                  label="Orientation"
                  onChange={(e) => updateSettings({ orientation: e.target.value as any })}
                >
                  <MenuItem value="portrait">Portrait</MenuItem>
                  <MenuItem value="landscape">Landscape</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Color Mode</InputLabel>
                <Select
                  value={settings.colorMode}
                  label="Color Mode"
                  onChange={(e) => updateSettings({ colorMode: e.target.value as any })}
                >
                  <MenuItem value="color">Color</MenuItem>
                  <MenuItem value="grayscale">Grayscale</MenuItem>
                  <MenuItem value="blackwhite">Black & White</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.includeHeader}
                      onChange={(e) => updateSettings({ includeHeader: e.target.checked })}
                    />
                  }
                  label="Include Header"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.includeFooter}
                      onChange={(e) => updateSettings({ includeFooter: e.target.checked })}
                    />
                  }
                  label="Include Footer"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.showWatermark}
                      onChange={(e) => updateSettings({ showWatermark: e.target.checked })}
                    />
                  }
                  label="Show Watermark"
                />
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <Typography gutterBottom>
                Number of Copies: {settings.copies}
              </Typography>
              <Box sx={{ px: 2 }}>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={settings.copies}
                  onChange={(e) => updateSettings({ copies: parseInt(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>
            Close
          </Button>
          <Button onClick={handlePrint} variant="contained" disabled={printing}>
            Apply & Print
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Buttons */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Tooltip title="Share" placement="left">
          <Fab color="secondary" onClick={handleShare} size="medium">
            <ShareIcon />
          </Fab>
        </Tooltip>
        <Tooltip title="Print" placement="left">
          <Fab color="primary" onClick={handlePrint} disabled={printing}>
            {printing ? <CircularProgress size={24} /> : <PrintIcon />}
          </Fab>
        </Tooltip>
      </Box>
    </Box>
  );
}