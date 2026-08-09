"use client";
import React, { useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Download,
  Preview,
  Print,
  Email,
  Settings,
  FileCopy,
  Share,
  PictureAsPdf,
  Image as ImageIcon,
  ArrowDropDown
} from '@mui/icons-material';
import { ClassicInvoicePdfService, PdfGenerationOptions } from '@/services/classicInvoicePdfService';
import { Invoice } from '@/types/invoice_no_gst';
import PdfDownloadUtilities from './PdfDownloadUtilities';

interface EnhancedPdfActionsProps {
  invoice: Invoice;
  variant?: 'default' | 'compact' | 'minimal';
}

export default function EnhancedPdfActions({ invoice, variant = 'default' }: EnhancedPdfActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleQuickAction = async (action: 'download' | 'preview' | 'print', format: 'pdf' | 'png' | 'jpeg' = 'pdf') => {
    setLoading(action);
    
    try {
      const options: PdfGenerationOptions = {
        action,
        exportFormat: format,
        quality: 'high',
        format: 'a4',
        orientation: 'portrait'
      };

      switch (action) {
        case 'download':
          await ClassicInvoicePdfService.generateClassicInvoicePDF(invoice, options);
          break;
        case 'preview':
          await ClassicInvoicePdfService.previewPDF(invoice, options);
          break;
        case 'print':
          await ClassicInvoicePdfService.printPDF(invoice, options);
          break;
      }
    } catch (error) {
      console.error(`${action} failed:`, error);
    } finally {
      setLoading(null);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleBatchDownload = async (copyLabels: string[]) => {
    setLoading('batch');
    try {
      await ClassicInvoicePdfService.generateBatchPDFs(invoice, {
        copyLabels,
        generateSeparateFiles: true,
        format: 'a4',
        quality: 'high'
      });
    } catch (error) {
      console.error('Batch download failed:', error);
    } finally {
      setLoading(null);
    }
    handleMenuClose();
  };

  if (variant === 'minimal') {
    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={loading === 'download' ? <CircularProgress size={16} /> : <Download />}
          onClick={() => handleQuickAction('download')}
          disabled={!!loading}
        >
          PDF
        </Button>
        <PdfDownloadUtilities invoice={invoice} />
      </Box>
    );
  }

  if (variant === 'compact') {
    return (
      <ButtonGroup variant="outlined" size="small">
        <Button
          startIcon={loading === 'download' ? <CircularProgress size={16} /> : <Download />}
          onClick={() => handleQuickAction('download')}
          disabled={!!loading}
        >
          Download
        </Button>
        <Button
          startIcon={<Preview />}
          onClick={() => handleQuickAction('preview')}
          disabled={!!loading}
        >
          Preview
        </Button>
        <Button
          onClick={handleMenuClick}
          disabled={!!loading}
        >
          <ArrowDropDown />
        </Button>
      </ButtonGroup>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
      {/* Primary Actions */}
      <ButtonGroup variant="contained" size="medium">
        <Button
          startIcon={loading === 'download' ? <CircularProgress size={20} color="inherit" /> : <Download />}
          onClick={() => handleQuickAction('download')}
          disabled={!!loading}
        >
          Download PDF
        </Button>
        <Button
          onClick={handleMenuClick}
          disabled={!!loading}
        >
          <ArrowDropDown />
        </Button>
      </ButtonGroup>

      {/* Secondary Actions */}
      <Button
        variant="outlined"
        startIcon={loading === 'preview' ? <CircularProgress size={20} /> : <Preview />}
        onClick={() => handleQuickAction('preview')}
        disabled={!!loading}
      >
        Preview
      </Button>

      <Button
        variant="outlined"
        startIcon={loading === 'print' ? <CircularProgress size={20} /> : <Print />}
        onClick={() => handleQuickAction('print')}
        disabled={!!loading}
      >
        Print
      </Button>

      {/* Advanced Options */}
      <PdfDownloadUtilities invoice={invoice} />

      {/* Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 200 }
        }}
      >
        <MenuItem onClick={() => handleQuickAction('download', 'pdf')}>
          <ListItemIcon>
            <PictureAsPdf fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download as PDF</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleQuickAction('download', 'png')}>
          <ListItemIcon>
            <ImageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download as PNG</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleQuickAction('download', 'jpeg')}>
          <ListItemIcon>
            <ImageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download as JPEG</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem 
          onClick={() => handleBatchDownload(['Original'])}
          disabled={loading === 'batch'}
        >
          <ListItemIcon>
            <FileCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            Original Copy
            {loading === 'batch' && <CircularProgress size={16} sx={{ ml: 1 }} />}
          </ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleBatchDownload(['Original', 'Duplicate'])}
          disabled={loading === 'batch'}
        >
          <ListItemIcon>
            <FileCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText>Original + Duplicate</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleBatchDownload(['Original', 'Duplicate', 'Triplicate'])}
          disabled={loading === 'batch'}
        >
          <ListItemIcon>
            <FileCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText>All Copies (3)</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <Share fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share Options (Coming Soon)</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}