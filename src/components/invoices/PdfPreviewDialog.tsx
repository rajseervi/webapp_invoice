"use client";
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
  Typography,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Settings as SettingsIcon,
  Fullscreen as FullscreenIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon
} from '@mui/icons-material';
import { generateInvoiceBlob, downloadInvoicePDF } from '@/utils/enhancedPdfGenerator';
import { generateClassicInvoicePdf, downloadClassicInvoicePdf } from '@/utils/reactToPdfGenerator';
import { generateClassicTemplateBlob, downloadClassicTemplatePdf } from '@/utils/classicTemplatePdfGenerator';

interface PdfPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceData: any;
  title?: string;
}

interface PdfOptions {
  template: 'classic' | 'modern' | 'minimal' | 'thermal';
  showQRCode: boolean;
  showCompanyLogo: boolean;
  showBankDetails: boolean;
  showTermsAndConditions: boolean;
  showSignature: boolean;
  paperSize: 'A4' | 'A5' | 'thermal';
  fontSize: 'small' | 'medium' | 'large';
  colorScheme: 'color' | 'grayscale' | 'blackwhite';
  includeWatermark: boolean;
  watermarkText: string;
}

const PdfPreviewDialog: React.FC<PdfPreviewDialogProps> = ({
  open,
  onClose,
  invoiceData,
  title = 'PDF Preview'
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [options, setOptions] = useState<PdfOptions>({
    template: 'classic',
    showQRCode: true,
    showCompanyLogo: true,
    showBankDetails: true,
    showTermsAndConditions: true,
    showSignature: true,
    paperSize: 'A4',
    fontSize: 'medium',
    colorScheme: 'color',
    includeWatermark: false,
    watermarkText: 'INVOICE'
  });

  const generatePreview = async () => {
    if (!invoiceData) return;

    setLoading(true);
    setError(null);

    try {
      // Use ClassicInvoiceTemplate for PDF generation
      const blob = await generateClassicTemplateBlob(invoiceData);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error('Error generating PDF preview:', err);
      setError('Failed to generate PDF preview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && invoiceData) {
      generatePreview();
    }

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [open, invoiceData, options]);

  const handleDownload = async () => {
    if (!invoiceData) return;
    
    try {
      const filename = `invoice-${invoiceData.invoiceNumber || 'document'}.pdf`;
      await downloadClassicTemplatePdf(invoiceData, filename);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Failed to download PDF. Please try again.');
    }
  };

  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl);
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleFullscreen = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const handleOptionChange = (key: keyof PdfOptions, value: any) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClose = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh', maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        {title}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Settings">
            <IconButton
              size="small"
              onClick={() => setShowSettings(!showSettings)}
              color={showSettings ? 'primary' : 'default'}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton size="small" onClick={handleZoomOut} disabled={zoom <= 50}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="body2" sx={{ minWidth: '50px', textAlign: 'center' }}>
            {zoom}%
          </Typography>
          <Tooltip title="Zoom In">
            <IconButton size="small" onClick={handleZoomIn} disabled={zoom >= 200}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fullscreen">
            <IconButton size="small" onClick={handleFullscreen} disabled={!pdfUrl}>
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {showSettings && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" gutterBottom>PDF Settings</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Template</InputLabel>
                  <Select
                    value={options.template}
                    label="Template"
                    onChange={(e) => handleOptionChange('template', e.target.value)}
                  >
                    <MenuItem value="classic">Classic</MenuItem>
                    <MenuItem value="modern">Modern</MenuItem>
                    <MenuItem value="minimal">Minimal</MenuItem>
                    <MenuItem value="thermal">Thermal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Paper Size</InputLabel>
                  <Select
                    value={options.paperSize}
                    label="Paper Size"
                    onChange={(e) => handleOptionChange('paperSize', e.target.value)}
                  >
                    <MenuItem value="A4">A4</MenuItem>
                    <MenuItem value="A5">A5</MenuItem>
                    <MenuItem value="thermal">Thermal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Font Size</InputLabel>
                  <Select
                    value={options.fontSize}
                    label="Font Size"
                    onChange={(e) => handleOptionChange('fontSize', e.target.value)}
                  >
                    <MenuItem value="small">Small</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="large">Large</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Color Scheme</InputLabel>
                  <Select
                    value={options.colorScheme}
                    label="Color Scheme"
                    onChange={(e) => handleOptionChange('colorScheme', e.target.value)}
                  >
                    <MenuItem value="color">Color</MenuItem>
                    <MenuItem value="grayscale">Grayscale</MenuItem>
                    <MenuItem value="blackwhite">Black & White</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={options.showBankDetails}
                        onChange={(e) => handleOptionChange('showBankDetails', e.target.checked)}
                        size="small"
                      />
                    }
                    label="Bank Details"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={options.showTermsAndConditions}
                        onChange={(e) => handleOptionChange('showTermsAndConditions', e.target.checked)}
                        size="small"
                      />
                    }
                    label="Terms & Conditions"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={options.showSignature}
                        onChange={(e) => handleOptionChange('showSignature', e.target.checked)}
                        size="small"
                      />
                    }
                    label="Signature"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={options.includeWatermark}
                        onChange={(e) => handleOptionChange('includeWatermark', e.target.checked)}
                        size="small"
                      />
                    }
                    label="Watermark"
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
          {loading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Generating PDF preview...
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ maxWidth: 400 }}>
              {error}
            </Alert>
          )}

          {pdfUrl && !loading && (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                overflow: 'auto'
              }}
            >
              <iframe
                src={pdfUrl}
                style={{
                  width: `${zoom}%`,
                  height: '100%',
                  border: 'none',
                  minHeight: '600px'
                }}
                title="PDF Preview"
              />
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={handleClose} color="inherit">
          Close
        </Button>
        <Button
          onClick={handlePrint}
          startIcon={<PrintIcon />}
          disabled={!pdfUrl || loading}
          variant="outlined"
        >
          Print
        </Button>
        <Button
          onClick={handleDownload}
          startIcon={<DownloadIcon />}
          disabled={!invoiceData || loading}
          variant="contained"
        >
          Download PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PdfPreviewDialog;