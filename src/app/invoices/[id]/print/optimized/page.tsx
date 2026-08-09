"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { 
  Container, 
  Typography, 
  Box, 
  CircularProgress, 
  Alert,
  Button,
  ButtonGroup,
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
  Divider,
  Stack,
  Card,
  CardContent
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  Visibility as PreviewIcon,
  Share as ShareIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Fullscreen as FullscreenIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon
} from '@mui/icons-material';
import { Invoice } from '@/types/invoice_no_gst';
import EnhancedPrintService, { PrintSettings } from '@/services/enhancedPrintService';
import SimpleInvoiceService from '@/services/simpleInvoiceService';

export default function OptimizedPrintPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);

  // Get settings from URL params or use defaults
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    template: (searchParams.get('template') as any) || 'modern',
    paperSize: (searchParams.get('paperSize') as any) || 'A4',
    orientation: (searchParams.get('orientation') as any) || 'portrait',
    includeHeader: searchParams.get('includeHeader') !== 'false',
    includeFooter: searchParams.get('includeFooter') !== 'false',
    showWatermark: searchParams.get('showWatermark') === 'true',
    copies: parseInt(searchParams.get('copies') || '1'),
    colorMode: (searchParams.get('colorMode') as any) || 'color'
  });

  // Auto-print if requested
  const autoprint = searchParams.get('autoprint') === 'true';
  const downloadRequested = searchParams.get('download') === 'true';

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

        // Auto-actions disabled to prevent direct print dialog box
        // if (autoprint) {
        //   setTimeout(() => handlePrint(), 1000);
        // } else if (downloadRequested) {
        //   setTimeout(() => handleDownload(), 1000);
        // }

      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice details');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id, autoprint, downloadRequested]);

  const handlePrint = async () => {
    if (!invoice) return;
    
    setPrinting(true);
    try {
      if (printRef.current) {
        // Use browser's native print for better compatibility
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const printContent = printRef.current.innerHTML;
          const printStyles = Array.from(document.styleSheets)
            .map(styleSheet => {
              try {
                return Array.from(styleSheet.cssRules)
                  .map(rule => rule.cssText)
                  .join('\n');
              } catch (e) {
                return '';
              }
            })
            .join('\n');

          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Invoice ${invoice.invoiceNumber}</title>
              <style>
                ${printStyles}
                @media print {
                  body { margin: 0; }
                  .no-print { display: none !important; }
                  .print-content { 
                    transform: none !important; 
                    zoom: 1 !important;
                  }
                }
                body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 20px;
                  color: ${printSettings.colorMode === 'blackwhite' ? '#000' : '#333'};
                }
              </style>
            </head>
            <body>
              <div class="print-content">${printContent}</div>
            </body>
            </html>
          `);
          
          printWindow.document.close();
          printWindow.focus();
          
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 500);
        }
      }
    } catch (error) {
      console.error('Print error:', error);
      setError('Failed to print invoice');
    } finally {
      setPrinting(false);
    }
  };

  const handleDownload = async () => {
    if (!invoice) return;
    
    setPrinting(true);
    try {
      await EnhancedPrintService.generateInvoicePDF(
        invoice,
        printSettings,
        { action: 'download', filename: `invoice-${invoice.invoiceNumber}.pdf` }
      );
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download PDF');
    } finally {
      setPrinting(false);
    }
  };

  const handleShare = () => {
    if (navigator.share && invoice) {
      navigator.share({
        title: `Invoice ${invoice.invoiceNumber}`,
        text: `Invoice for ${invoice.partyName} - ₹${invoice.totalAmount?.toLocaleString()}`,
        url: window.location.href
      });
    }
  };

  const updateSettings = (newSettings: Partial<PrintSettings>) => {
    setPrintSettings(prev => ({ ...prev, ...newSettings }));
  };

  const generatePrintHTML = () => {
    if (!invoice) return '';
    return EnhancedPrintService.generatePrintPreviewHTML(invoice, printSettings);
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
      {/* Toolbar */}
      <Paper 
        elevation={2} 
        sx={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 1000, 
          p: 2, 
          borderRadius: 0,
          borderBottom: '1px solid #e0e0e0'
        }}
      >
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
            <Tooltip title="Zoom Out">
              <IconButton 
                onClick={() => setZoom(prev => Math.max(50, prev - 10))}
                disabled={zoom <= 50}
              >
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
            
            <Typography variant="body2" sx={{ alignSelf: 'center', minWidth: '60px', textAlign: 'center' }}>
              {zoom}%
            </Typography>
            
            <Tooltip title="Zoom In">
              <IconButton 
                onClick={() => setZoom(prev => Math.min(200, prev + 10))}
                disabled={zoom >= 200}
              >
                <ZoomInIcon />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem />

            <Tooltip title="Fullscreen">
              <IconButton onClick={() => setFullscreen(!fullscreen)}>
                <FullscreenIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Print Settings">
              <IconButton onClick={() => setSettingsOpen(true)}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>

            <Button
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
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

      {/* Print Preview */}
      <Container 
        maxWidth={fullscreen ? false : "lg"} 
        sx={{ 
          py: 4,
          ...(fullscreen && {
            maxWidth: '100vw',
            width: '100vw',
            px: 2
          })
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 120px)'
          }}
        >
          <Paper
            ref={printRef}
            elevation={8}
            sx={{
              width: printSettings.paperSize === 'A4' ? '210mm' : 
                     printSettings.paperSize === 'A5' ? '148mm' : 
                     printSettings.paperSize === 'Letter' ? '216mm' : '80mm',
              minHeight: printSettings.paperSize === 'A4' ? '297mm' : 
                        printSettings.paperSize === 'A5' ? '210mm' : 
                        printSettings.paperSize === 'Letter' ? '279mm' : 'auto',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.3s ease',
              bgcolor: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Render invoice content based on template */}
            <Box 
              sx={{ 
                p: printSettings.paperSize === 'Thermal' ? 1 : 3,
                height: '100%',
                position: 'relative'
              }}
              dangerouslySetInnerHTML={{ 
                __html: generatePrintHTML().replace(/<html>.*?<body[^>]*>|<\/body>.*?<\/html>/gs, '') 
              }}
            />
          </Paper>
        </Box>
      </Container>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="md" fullWidth>
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
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Template</InputLabel>
                <Select
                  value={printSettings.template}
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
                  value={printSettings.paperSize}
                  label="Paper Size"
                  onChange={(e) => updateSettings({ paperSize: e.target.value as any })}
                >
                  <MenuItem value="A4">A4 (210 × 297 mm)</MenuItem>
                  <MenuItem value="A5">A5 (148 × 210 mm)</MenuItem>
                  <MenuItem value="Letter">Letter (8.5 × 11 in)</MenuItem>
                  <MenuItem value="Thermal">Thermal (80mm)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Orientation</InputLabel>
                <Select
                  value={printSettings.orientation}
                  label="Orientation"
                  onChange={(e) => updateSettings({ orientation: e.target.value as any })}
                >
                  <MenuItem value="portrait">Portrait</MenuItem>
                  <MenuItem value="landscape">Landscape</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Color Mode</InputLabel>
                <Select
                  value={printSettings.colorMode}
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
                      checked={printSettings.includeHeader}
                      onChange={(e) => updateSettings({ includeHeader: e.target.checked })}
                    />
                  }
                  label="Include Header"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={printSettings.includeFooter}
                      onChange={(e) => updateSettings({ includeFooter: e.target.checked })}
                    />
                  }
                  label="Include Footer"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={printSettings.showWatermark}
                      onChange={(e) => updateSettings({ showWatermark: e.target.checked })}
                    />
                  }
                  label="Show Watermark"
                />
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <Typography gutterBottom>
                Number of Copies: {printSettings.copies}
              </Typography>
              <Box sx={{ px: 2 }}>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={printSettings.copies}
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