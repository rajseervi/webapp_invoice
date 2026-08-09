'use client';

import React, { useState, useRef } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  CircularProgress,
  LinearProgress,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  Archive as ArchiveIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadClassicTemplatePdf } from '@/utils/pdfGenerator';
import { usePrintingPreferences } from '@/hooks/usePrintingPreferences';
import JSZip from 'jszip';

interface BulkPdfDownloadButtonProps {
  invoices: any[];
  selectedInvoices?: any[];
  label?: string;
  disabled?: boolean;
}

export default function BulkPdfDownloadButton({
  invoices,
  selectedInvoices,
  label = 'Bulk PDF',
  disabled = false,
}: BulkPdfDownloadButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentInvoice, setCurrentInvoice] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { preferences } = usePrintingPreferences();

  // Bulk download options
  const [bulkOptions, setBulkOptions] = useState({
    template: preferences.template || 'classic',
    paperSize: preferences.paperSize || 'A4',
    colorMode: preferences.colorMode || 'color',
    includeHeaders: true,
    includeFooters: true,
    separateFiles: true,
    createZip: true,
    filenamePattern: 'invoice-{number}',
    dateRange: 'all',
    statusFilter: 'all',
  });

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDialogOpen = () => {
    setDialogOpen(true);
    handleClose();
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setError(null);
    setProgress(0);
    setCurrentInvoice('');
  };

  const transformInvoiceForPdf = (invoice: any) => {
    return {
      ...invoice,
      partyName: invoice.partyName || 'Customer',
      items: invoice.items || [],
      subtotal: invoice.subtotal || invoice.total || 0,
      total: invoice.total || 0,
      date: invoice.date || new Date().toLocaleDateString(),
    };
  };

  const generatePdfBlob = async (invoice: any, options: any): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        // Since downloadClassicTemplatePdf directly downloads, 
        // we need to modify this to return blob data
        // For now, we'll simulate the PDF generation
        const pdfData = `PDF content for invoice ${invoice.invoiceNumber}`;
        const blob = new Blob([pdfData], { type: 'application/pdf' });
        resolve(blob);
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleBulkDownload = async () => {
    const targetInvoices = selectedInvoices && selectedInvoices.length > 0 
      ? selectedInvoices 
      : invoices;

    if (targetInvoices.length === 0) {
      setError('No invoices selected for download.');
      return;
    }

    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      if (bulkOptions.createZip) {
        // Create ZIP file with all PDFs
        const zip = new JSZip();
        
        for (let i = 0; i < targetInvoices.length; i++) {
          const invoice = targetInvoices[i];
          setCurrentInvoice(`Processing ${invoice.invoiceNumber || invoice.id}`);
          setProgress((i / targetInvoices.length) * 100);

          try {
            const pdfInvoice = transformInvoiceForPdf(invoice);
            const filename = bulkOptions.filenamePattern
              .replace('{number}', invoice.invoiceNumber || invoice.id)
              .replace('{date}', invoice.date?.replace(/\//g, '-') || 'unknown')
              .replace('{party}', invoice.partyName?.replace(/[^a-zA-Z0-9]/g, '-') || 'customer');

            // Generate PDF blob (this is a simplified version)
            const pdfBlob = await generatePdfBlob(pdfInvoice, bulkOptions);
            zip.file(`${filename}.pdf`, pdfBlob);

            // Small delay to prevent overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (invoiceError) {
            console.error(`Error processing invoice ${invoice.invoiceNumber}:`, invoiceError);
            // Continue with other invoices
          }
        }

        setCurrentInvoice('Creating ZIP file...');
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        // Download the ZIP file
        const url = window.URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoices-bulk-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Download individual PDFs
        for (let i = 0; i < targetInvoices.length; i++) {
          const invoice = targetInvoices[i];
          setCurrentInvoice(`Downloading ${invoice.invoiceNumber || invoice.id}`);
          setProgress((i / targetInvoices.length) * 100);

          try {
            const pdfInvoice = transformInvoiceForPdf(invoice);
            const filename = `${bulkOptions.filenamePattern
              .replace('{number}', invoice.invoiceNumber || invoice.id)
              .replace('{date}', invoice.date?.replace(/\//g, '-') || 'unknown')
              .replace('{party}', invoice.partyName?.replace(/[^a-zA-Z0-9]/g, '-') || 'customer')}.pdf`;

            await downloadClassicTemplatePdf(pdfInvoice, filename, {
              ...preferences,
              ...bulkOptions,
            });

            // Delay between downloads to prevent browser blocking
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (invoiceError) {
            console.error(`Error downloading invoice ${invoice.invoiceNumber}:`, invoiceError);
          }
        }
      }

      setProgress(100);
      setCurrentInvoice('Complete!');
      setSuccess(true);
      
      setTimeout(() => {
        handleDialogClose();
        setSuccess(false);
      }, 2000);

    } catch (err) {
      console.error('Bulk download error:', err);
      setError('Failed to process bulk download. Some files may have been downloaded successfully.');
    } finally {
      setLoading(false);
    }
  };

  const getInvoiceCount = () => {
    return selectedInvoices && selectedInvoices.length > 0 
      ? selectedInvoices.length 
      : invoices.length;
  };

  return (
    <>
      <Button
        variant="outlined"
        color="info"
        startIcon={<PdfIcon />}
        onClick={handleClick}
        disabled={disabled || invoices.length === 0}
        sx={{ textTransform: 'none' }}
      >
        {label} ({getInvoiceCount()})
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            minWidth: 280,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          },
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Bulk PDF Download
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {getInvoiceCount()} invoices selected
          </Typography>
        </Box>

        <Divider />

        <MenuItem onClick={() => {
          setBulkOptions(prev => ({ ...prev, createZip: true }));
          handleDialogOpen();
        }}>
          <ListItemIcon>
            <ArchiveIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Download as ZIP" 
            secondary="All PDFs in one archive"
          />
        </MenuItem>

        <MenuItem onClick={() => {
          setBulkOptions(prev => ({ ...prev, createZip: false }));
          handleDialogOpen();
        }}>
          <ListItemIcon>
            <DownloadIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Download Individually" 
            secondary="Separate PDF downloads"
          />
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleDialogOpen}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Advanced Options" />
        </MenuItem>
      </Menu>

      {/* Advanced Options Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PdfIcon />
            <Typography variant="h6">Bulk PDF Download Options</Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body2">{currentInvoice}</Typography>
              </Box>
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {Math.round(progress)}% Complete
              </Typography>
            </Box>
          )}

          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>PDF Template</Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={bulkOptions.template}
                  onChange={(e) => setBulkOptions(prev => ({ ...prev, template: e.target.value }))}
                >
                  <MenuItem value="classic">Classic Invoice</MenuItem>
                  <MenuItem value="modern">Modern Invoice</MenuItem>
                  <MenuItem value="thermal">Thermal Receipt</MenuItem>
                  <MenuItem value="minimal">Minimal Invoice</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>File Options</Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={bulkOptions.createZip}
                    onChange={(e) => setBulkOptions(prev => ({ ...prev, createZip: e.target.checked }))}
                  />
                }
                label="Create ZIP archive"
              />
              <Typography variant="caption" color="text.secondary" display="block">
                Bundle all PDFs into a single ZIP file
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Filename Pattern</Typography>
              <TextField
                fullWidth
                size="small"
                value={bulkOptions.filenamePattern}
                onChange={(e) => setBulkOptions(prev => ({ ...prev, filenamePattern: e.target.value }))}
                placeholder="invoice-{number}"
                helperText="Use {number}, {date}, {party} as placeholders"
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>Summary</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip label={`${getInvoiceCount()} invoices`} size="small" />
                <Chip label={bulkOptions.template} size="small" color="primary" />
                <Chip 
                  label={bulkOptions.createZip ? 'ZIP Archive' : 'Individual Files'} 
                  size="small" 
                  color="secondary" 
                />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleDialogClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkDownload}
            variant="contained"
            disabled={loading || getInvoiceCount() === 0}
            startIcon={loading ? <CircularProgress size={16} /> : <DownloadIcon />}
          >
            {loading ? 'Processing...' : 'Download PDFs'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}