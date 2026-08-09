"use client";
import React, { useState } from 'react';
import {
  Button,
  ButtonGroup,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  CircularProgress,
  Box,
  Divider
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  Visibility as PreviewIcon,
  Print as PrintIcon,
  Settings as SettingsIcon,
  ArrowDropDown as ArrowDropDownIcon
} from '@mui/icons-material';
import { downloadInvoicePDF } from '@/utils/enhancedPdfGenerator';
import { downloadClassicInvoicePdf } from '@/utils/reactToPdfGenerator';
import { downloadClassicTemplatePdf } from '@/utils/classicTemplatePdfGenerator';
import { usePrintingPreferences } from '@/hooks/usePrintingPreferences';
import PdfPreviewDialog from './PdfPreviewDialog';

interface EnhancedPdfButtonProps {
  invoiceData: any;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  disabled?: boolean;
  showDropdown?: boolean;
  defaultAction?: 'download' | 'preview';
  buttonText?: string;
  className?: string;
}

const EnhancedPdfButton: React.FC<EnhancedPdfButtonProps> = ({
  invoiceData,
  variant = 'contained',
  size = 'medium',
  color = 'primary',
  disabled = false,
  showDropdown = true,
  defaultAction = 'download',
  buttonText = 'PDF',
  className
}) => {
  const { preferences } = usePrintingPreferences();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMainAction = async () => {
    if (!invoiceData) return;

    if (defaultAction === 'preview') {
      setPreviewOpen(true);
    } else {
      await handleDownload();
    }
  };

  const handleDownload = async (options?: any) => {
    if (!invoiceData) return;

    setLoading(true);
    setError(null);

    try {
      const filename = `invoice-${invoiceData.invoiceNumber || 'document'}.pdf`;
      const template = options?.template || preferences.template;
      
      // Use the template from printing preferences if not overridden
      switch (template) {
        case 'thermal':
          // Generate thermal receipt style PDF (multiple copies if needed)
          for (let i = 0; i < preferences.defaultCopies; i++) {
            const copyFilename = preferences.defaultCopies > 1 
              ? `invoice-${invoiceData.invoiceNumber || 'document'}-copy${i + 1}.pdf`
              : filename;
            await downloadClassicTemplatePdf(invoiceData, copyFilename, {
              ...preferences,
              template: 'thermal'
            });
          }
          break;
        case 'modern':
        case 'classic':
        case 'minimal':
        default:
          // Generate standard PDF with default settings
          await downloadClassicTemplatePdf(invoiceData, filename, preferences);
          break;
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Failed to download PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    setPreviewOpen(true);
    setAnchorEl(null);
  };

  const handlePrint = () => {
    if (invoiceData) {
      // Open print page in new tab
      const printUrl = `/invoices/${invoiceData.id}/print`;
      window.open(printUrl, '_blank');
    }
    setAnchorEl(null);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleQuickDownload = (template: string) => {
    handleDownload({ template });
    setAnchorEl(null);
  };

  if (!showDropdown) {
    return (
      <>
        <Tooltip title={defaultAction === 'preview' ? 'Preview PDF' : 'Download PDF'}>
          <Button
            variant={variant}
            size={size}
            color={color}
            disabled={disabled || loading || !invoiceData}
            onClick={handleMainAction}
            startIcon={loading ? <CircularProgress size={16} /> : <PdfIcon />}
            className={className}
          >
            {loading ? 'Processing...' : buttonText}
          </Button>
        </Tooltip>
        
        <PdfPreviewDialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          invoiceData={invoiceData}
          title={`Invoice ${invoiceData?.invoiceNumber || ''} - PDF Preview`}
        />
      </>
    );
  }

  return (
    <>
      <ButtonGroup variant={variant} size={size} color={color} disabled={disabled || !invoiceData}>
        <Tooltip title={defaultAction === 'preview' ? 'Preview PDF' : 'Download PDF'}>
          <Button
            onClick={handleMainAction}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <PdfIcon />}
            className={className}
          >
            {loading ? 'Processing...' : buttonText}
          </Button>
        </Tooltip>
        
        <Tooltip title="More PDF options">
          <Button
            size={size}
            onClick={handleMenuClick}
            disabled={loading}
            sx={{ px: 1, minWidth: 'auto' }}
          >
            <ArrowDropDownIcon />
          </Button>
        </Tooltip>
      </ButtonGroup>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handlePreview}>
          <ListItemIcon>
            <PreviewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Preview PDF</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleDownload()}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download PDF</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handlePrint}>
          <ListItemIcon>
            <PrintIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Print Invoice</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => handleQuickDownload('classic')}>
          <ListItemIcon>
            <PdfIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            <Box>
              <Box component="span">Classic Template</Box>
              <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'block' }}>
                Traditional invoice layout
              </Box>
            </Box>
          </ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleQuickDownload('modern')}>
          <ListItemIcon>
            <PdfIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            <Box>
              <Box component="span">Modern Template</Box>
              <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'block' }}>
                Clean, contemporary design
              </Box>
            </Box>
          </ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleQuickDownload('minimal')}>
          <ListItemIcon>
            <PdfIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            <Box>
              <Box component="span">Minimal Template</Box>
              <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'block' }}>
                Simple, compact layout
              </Box>
            </Box>
          </ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleQuickDownload('thermal')}>
          <ListItemIcon>
            <PdfIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            <Box>
              <Box component="span">Thermal Template</Box>
              <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'block' }}>
                Optimized for thermal printers
              </Box>
            </Box>
          </ListItemText>
        </MenuItem>
      </Menu>

      <PdfPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        invoiceData={invoiceData}
        title={`Invoice ${invoiceData?.invoiceNumber || ''} - PDF Preview`}
      />

      {error && (
        <Box sx={{ mt: 1 }}>
          <Box component="span" sx={{ color: 'error.main', fontSize: '0.75rem' }}>
            {error}
          </Box>
        </Box>
      )}
    </>
  );
};

export default EnhancedPdfButton;