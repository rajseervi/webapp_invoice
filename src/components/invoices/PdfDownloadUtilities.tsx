"use client";
import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  TextField,
  Slider,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  LinearProgress,
  Chip,
  Grid,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Download,
  Settings,
  Preview,
  Email,
  Print,
  Security,
  Palette,
  Save,
  Cancel,
  ExpandMore,
  Refresh,
  Share,
  FileCopy,
  Image as ImageIcon,
  PictureAsPdf,
  Close
} from '@mui/icons-material';
import { ClassicInvoicePdfService, PdfGenerationOptions, BatchPdfOptions, WatermarkOptions } from '@/services/classicInvoicePdfService';
import { Invoice } from '@/types/invoice_no_gst';

interface PdfDownloadUtilitiesProps {
  invoice: Invoice;
  onClose?: () => void;
}

export default function PdfDownloadUtilities({ invoice, onClose }: PdfDownloadUtilitiesProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Basic Options
  const [copyLabel, setCopyLabel] = useState('');
  const [filename, setFilename] = useState('');
  const [format, setFormat] = useState<'a4' | 'letter' | 'legal'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'png' | 'jpeg'>('pdf');

  // Advanced Options
  const [showPageNumbers, setShowPageNumbers] = useState(false);
  const [showTimestamp, setShowTimestamp] = useState(false);
  const [compress, setCompress] = useState(true);
  const [customHeader, setCustomHeader] = useState('');
  const [customFooter, setCustomFooter] = useState('');

  // Watermark Options
  const [enableWatermark, setEnableWatermark] = useState(false);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);
  const [watermarkPosition, setWatermarkPosition] = useState<'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('center');

  // Batch Options
  const [batchMode, setBatchMode] = useState(false);
  const [copies, setCopies] = useState(2);
  const [copyLabels, setCopyLabels] = useState('Original,Duplicate,Triplicate');

  // Security Options
  const [passwordProtection, setPasswordProtection] = useState(false);
  const [password, setPassword] = useState('');

  // Email Options
  const [emailDialog, setEmailDialog] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState(`Invoice ${invoice.invoiceNumber}`);
  const [emailBody, setEmailBody] = useState(`Please find attached invoice ${invoice.invoiceNumber}.`);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setError(null);
    setSuccess(null);
    setProgress(0);
    onClose?.();
  };

  const getOptions = (): PdfGenerationOptions => ({
    copyLabel: copyLabel || undefined,
    filename: filename || undefined,
    format,
    orientation,
    quality,
    exportFormat,
    showPageNumbers,
    showTimestamp,
    compress,
    customHeader: customHeader || undefined,
    customFooter: customFooter || undefined,
    watermark: enableWatermark ? {
      text: watermarkText,
      opacity: watermarkOpacity,
      position: watermarkPosition
    } : undefined,
    password: passwordProtection ? password : undefined,
    onProgress: setProgress,
    onError: (err) => {
      setError(err.message);
      setLoading(false);
    },
    onSuccess: (result) => {
      setSuccess(`${exportFormat.toUpperCase()} generated successfully!`);
      setLoading(false);
      setProgress(100);
    },
    metadata: {
      title: `Invoice ${invoice.invoiceNumber}`,
      author: 'Invoice System',
      subject: 'Invoice Document',
      keywords: ['invoice', 'billing', 'payment']
    }
  });

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setProgress(0);

    try {
      if (batchMode) {
        const labels = copyLabels.split(',').map(l => l.trim()).filter(l => l);
        const batchOptions: BatchPdfOptions = {
          ...getOptions(),
          copies: Math.max(copies, labels.length),
          copyLabels: labels,
          generateSeparateFiles: true
        };
        
        await ClassicInvoicePdfService.generateBatchPDFs(invoice, batchOptions);
      } else {
        await ClassicInvoicePdfService.generateClassicInvoicePDF(invoice, {
          ...getOptions(),
          action: 'download'
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await ClassicInvoicePdfService.previewPDF(invoice, getOptions());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await ClassicInvoicePdfService.printPDF(invoice, getOptions());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Print failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async () => {
    if (!emailTo) {
      setError('Email address is required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await ClassicInvoicePdfService.emailPDF(
        invoice,
        {
          to: emailTo,
          subject: emailSubject,
          body: emailBody
        },
        getOptions()
      );
      setEmailDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email failed');
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    setCopyLabel('');
    setFilename('');
    setFormat('a4');
    setOrientation('portrait');
    setQuality('high');
    setExportFormat('pdf');
    setShowPageNumbers(false);
    setShowTimestamp(false);
    setCompress(true);
    setCustomHeader('');
    setCustomFooter('');
    setEnableWatermark(false);
    setWatermarkText('CONFIDENTIAL');
    setWatermarkOpacity(0.3);
    setWatermarkPosition('center');
    setBatchMode(false);
    setCopies(1);
    setCopyLabels('Original,Duplicate,Triplicate');
    setPasswordProtection(false);
    setPassword('');
    setError(null);
    setSuccess(null);
  };

  return (
    <>
      <Tooltip title="Advanced PDF Options">
        <Button
          variant="outlined"
          startIcon={<Settings />}
          onClick={handleOpen}
          size="small"
        >
          PDF Options
        </Button>
      </Tooltip>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings />
            <Typography variant="h6">PDF Generation Options</Typography>
            <Chip label={`Invoice ${invoice.invoiceNumber}`} size="small" />
          </Box>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {loading && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="body2" sx={{ mt: 1 }}>
                {progress < 100 ? `Generating... ${Math.round(progress)}%` : 'Complete!'}
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {/* Quick Actions */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={handleDownload}
                  disabled={loading}
                  color="primary"
                >
                  Download
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Preview />}
                  onClick={handlePreview}
                  disabled={loading}
                >
                  Preview
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Print />}
                  onClick={handlePrint}
                  disabled={loading}
                >
                  Print
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Email />}
                  onClick={() => setEmailDialog(true)}
                  disabled={loading}
                >
                  Email
                </Button>
                <Button
                  variant="text"
                  startIcon={<Refresh />}
                  onClick={resetToDefaults}
                  size="small"
                >
                  Reset
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Basic Settings */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">Basic Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Copy Label"
                    value={copyLabel}
                    onChange={(e) => setCopyLabel(e.target.value)}
                    placeholder="Original, Duplicate, etc."
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Custom Filename"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    placeholder="invoice-001.pdf"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Format</InputLabel>
                    <Select value={format} onChange={(e) => setFormat(e.target.value as any)}>
                      <MenuItem value="a4">A4</MenuItem>
                      <MenuItem value="letter">Letter</MenuItem>
                      <MenuItem value="legal">Legal</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Orientation</InputLabel>
                    <Select value={orientation} onChange={(e) => setOrientation(e.target.value as any)}>
                      <MenuItem value="portrait">Portrait</MenuItem>
                      <MenuItem value="landscape">Landscape</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Quality</InputLabel>
                    <Select value={quality} onChange={(e) => setQuality(e.target.value as any)}>
                      <MenuItem value="high">High (Best Quality)</MenuItem>
                      <MenuItem value="medium">Medium (Balanced)</MenuItem>
                      <MenuItem value="low">Low (Smaller Size)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Export Format</InputLabel>
                    <Select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as any)}>
                      <MenuItem value="pdf">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PictureAsPdf />
                          PDF Document
                        </Box>
                      </MenuItem>
                      <MenuItem value="png">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ImageIcon />
                          PNG Image
                        </Box>
                      </MenuItem>
                      <MenuItem value="jpeg">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ImageIcon />
                          JPEG Image
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Advanced Features */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">Advanced Features</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showPageNumbers}
                      onChange={(e) => setShowPageNumbers(e.target.checked)}
                    />
                  }
                  label="Show Page Numbers"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={showTimestamp}
                      onChange={(e) => setShowTimestamp(e.target.checked)}
                    />
                  }
                  label="Show Generation Timestamp"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={compress}
                      onChange={(e) => setCompress(e.target.checked)}
                    />
                  }
                  label="Compress PDF"
                />
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Custom Header"
                    value={customHeader}
                    onChange={(e) => setCustomHeader(e.target.value)}
                    multiline
                    rows={2}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Custom Footer"
                    value={customFooter}
                    onChange={(e) => setCustomFooter(e.target.value)}
                    multiline
                    rows={2}
                    size="small"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Watermark Settings */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">Watermark</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormControlLabel
                control={
                  <Switch
                    checked={enableWatermark}
                    onChange={(e) => setEnableWatermark(e.target.checked)}
                  />
                }
                label="Enable Watermark"
                sx={{ mb: 2 }}
              />
              
              {enableWatermark && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Watermark Text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Position</InputLabel>
                      <Select value={watermarkPosition} onChange={(e) => setWatermarkPosition(e.target.value as any)}>
                        <MenuItem value="center">Center</MenuItem>
                        <MenuItem value="top-left">Top Left</MenuItem>
                        <MenuItem value="top-right">Top Right</MenuItem>
                        <MenuItem value="bottom-left">Bottom Left</MenuItem>
                        <MenuItem value="bottom-right">Bottom Right</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography gutterBottom>Opacity: {Math.round(watermarkOpacity * 100)}%</Typography>
                    <Slider
                      value={watermarkOpacity}
                      onChange={(e, value) => setWatermarkOpacity(value as number)}
                      min={0.1}
                      max={1.0}
                      step={0.1}
                      marks
                      size="small"
                    />
                  </Grid>
                </Grid>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Batch Generation */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">Batch Generation</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormControlLabel
                control={
                  <Switch
                    checked={batchMode}
                    onChange={(e) => setBatchMode(e.target.checked)}
                  />
                }
                label="Enable Batch Mode"
                sx={{ mb: 2 }}
              />
              
              {batchMode && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Number of Copies"
                      type="number"
                      value={copies}
                      onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                      inputProps={{ min: 1, max: 10 }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      label="Copy Labels (comma-separated)"
                      value={copyLabels}
                      onChange={(e) => setCopyLabels(e.target.value)}
                      placeholder="Original,Duplicate,Triplicate"
                      size="small"
                    />
                  </Grid>
                </Grid>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Security */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Security />
                  Security
                  <Chip label="Coming Soon" size="small" color="warning" />
                </Box>
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormControlLabel
                control={
                  <Switch
                    checked={passwordProtection}
                    onChange={(e) => setPasswordProtection(e.target.checked)}
                    disabled
                  />
                }
                label="Password Protection (Coming Soon)"
                sx={{ mb: 2 }}
              />
              
              {passwordProtection && (
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  size="small"
                  disabled
                />
              )}
            </AccordionDetails>
          </Accordion>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleDownload} 
            variant="contained" 
            startIcon={<Download />}
            disabled={loading}
          >
            {loading ? 'Generating...' : `Generate ${exportFormat.toUpperCase()}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailDialog} onClose={() => setEmailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send PDF via Email</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="To Email Address"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                type="email"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                multiline
                rows={4}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleEmail} 
            variant="contained" 
            startIcon={<Email />}
            disabled={loading || !emailTo}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}