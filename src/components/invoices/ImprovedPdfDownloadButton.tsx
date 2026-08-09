'use client';

import React, { useState, useRef } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Box,
  Typography,
  Divider,
  CircularProgress,
  Fade,
  ButtonGroup,
  Button,
  Chip,
  Stack,
  Badge,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  FileCopy as FileCopyIcon,
  Settings as SettingsIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Receipt as ReceiptIcon,
  Description as DescriptionIcon,
  Business as BusinessIcon,
  Article as ArticleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadClassicTemplatePdf } from '@/utils/pdfGenerator';
import { usePrintingPreferences } from '@/hooks/usePrintingPreferences';

interface ImprovedPdfDownloadButtonProps {
  invoice: any;
  size?: 'small' | 'medium' | 'large';
  variant?: 'icon' | 'button' | 'split';
  showLabel?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'info';
}

const pdfTemplates = [
  {
    id: 'classic',
    name: 'Classic Invoice',
    description: 'Traditional business format',
    icon: <DescriptionIcon />,
    color: '#1976d2',
  },
  {
    id: 'modern',
    name: 'Modern Invoice',
    description: 'Clean contemporary design',
    icon: <ArticleIcon />,
    color: '#2e7d32',
  },
  {
    id: 'thermal',
    name: 'Thermal Receipt',
    description: 'Compact thermal printer format',
    icon: <ReceiptIcon />,
    color: '#ed6c02',
  },
  {
    id: 'minimal',
    name: 'Minimal Invoice',
    description: 'Simple and clean layout',
    icon: <BusinessIcon />,
    color: '#9c27b0',
  },
];

export default function ImprovedPdfDownloadButton({
  invoice,
  size = 'small',
  variant = 'icon',
  showLabel = false,
  color = 'secondary',
}: ImprovedPdfDownloadButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { preferences } = usePrintingPreferences();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (variant === 'icon' && !anchorEl) {
      // Direct download for icon variant
      handleDownload();
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDownload = async (templateId?: string) => {
    if (!invoice) return;

    setLoading(true);
    setError(null);
    setSuccess(false);
    handleClose();

    try {
      const filename = `invoice-${invoice.invoiceNumber || invoice.id || 'document'}.pdf`;
      const template = templateId || preferences.template || 'classic';
      
      // Convert invoice data to the format expected by PDF generator
      const pdfInvoice = transformInvoiceForPdf(invoice);
      
      if (template === 'thermal' && preferences.defaultCopies > 1) {
        // Generate multiple copies for thermal receipts
        for (let i = 0; i < preferences.defaultCopies; i++) {
          const copyFilename = preferences.defaultCopies > 1 
            ? `invoice-${invoice.invoiceNumber || invoice.id}-copy${i + 1}.pdf`
            : filename;
          await downloadClassicTemplatePdf(pdfInvoice, copyFilename, {
            ...preferences,
            template: 'thermal'
          });
        }
      } else {
        // Generate single PDF with selected template
        await downloadClassicTemplatePdf(pdfInvoice, filename, {
          ...preferences,
          template
        });
      }

      setSuccess(true);
      
      // Reset success state after 3 seconds
      timeoutRef.current = setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Failed to download PDF. Please try again.');
      
      // Clear error after 5 seconds
      timeoutRef.current = setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  // Transform invoice data to match PDF generator expectations
  const transformInvoiceForPdf = (invoice: any) => {
    return {
      ...invoice,
      partyName: invoice.partyName || 'Customer',
      items: Array.isArray(invoice.items) ? invoice.items : [],
      subtotal: invoice.subtotal || invoice.total || 0,
      total: invoice.total || 0,
      date: invoice.date || new Date().toLocaleDateString(),
    };
  };

  const handlePrint = () => {
    window.open(`/invoices/${invoice.id}/print/enhanced`, '_blank');
    handleClose();
  };

  const handleShare = () => {
    // Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: `Invoice ${invoice.invoiceNumber}`,
        text: `Invoice for ${invoice.partyName}`,
        url: window.location.href,
      });
    }
    handleClose();
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (variant === 'icon') {
    return (
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        <Tooltip title={success ? "PDF Downloaded!" : error || "Download PDF"}>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <IconButton
              size={size}
              color={success ? 'success' : error ? 'error' : color}
              onClick={handleClick}
              disabled={loading}
              sx={{
                width: size === 'small' ? 24 : size === 'medium' ? 32 : 40,
                height: size === 'small' ? 24 : size === 'medium' ? 32 : 40,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.1)',
                  backgroundColor: `${color}.main`,
                  '& .MuiSvgIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <CircularProgress 
                      size={size === 'small' ? 12 : size === 'medium' ? 16 : 20}
                      color="inherit" 
                    />
                  </motion.div>
                ) : success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <CheckCircleIcon sx={{ fontSize: size === 'small' ? 14 : size === 'medium' ? 18 : 24 }} />
                  </motion.div>
                ) : error ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <ErrorIcon sx={{ fontSize: size === 'small' ? 14 : size === 'medium' ? 18 : 24 }} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="pdf"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <PdfIcon sx={{ fontSize: size === 'small' ? 14 : size === 'medium' ? 18 : 24 }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </IconButton>
          </motion.div>
        </Tooltip>
      </Box>
    );
  }

  if (variant === 'button') {
    return (
      <>
        <Button
          variant="outlined"
          color={color}
          size={size}
          startIcon={loading ? <CircularProgress size={16} /> : <PdfIcon />}
          onClick={handleClick}
          disabled={loading}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
          }}
        >
          {showLabel ? 'Download PDF' : 'PDF'}
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
              PDF Templates
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Choose your preferred invoice format
            </Typography>
          </Box>
          
          <Divider />
          
          {pdfTemplates.map((template, index) => (
            <MenuItem
              key={template.id}
              onClick={() => handleDownload(template.id)}
              sx={{
                py: 1.5,
                px: 2,
                '&:hover': {
                  backgroundColor: `${template.color}10`,
                },
              }}
            >
              <ListItemIcon sx={{ color: template.color }}>
                {template.icon}
              </ListItemIcon>
              <ListItemText
                primary={template.name}
                secondary={template.description}
                primaryTypographyProps={{ 
                  sx: { fontWeight: 500, fontSize: '0.9rem' } 
                }}
                secondaryTypographyProps={{ 
                  sx: { fontSize: '0.75rem' } 
                }}
              />
              {template.id === preferences.template && (
                <Chip
                  label="Default"
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    color: template.color,
                    borderColor: template.color,
                  }}
                />
              )}
            </MenuItem>
          ))}
          
          <Divider />
          
          <MenuItem onClick={handlePrint}>
            <ListItemIcon>
              <PrintIcon />
            </ListItemIcon>
            <ListItemText primary="Print" />
          </MenuItem>
          
          <MenuItem onClick={handleShare}>
            <ListItemIcon>
              <ShareIcon />
            </ListItemIcon>
            <ListItemText primary="Share" />
          </MenuItem>
        </Menu>
      </>
    );
  }

  // Split button variant
  return (
    <>
      <ButtonGroup variant="outlined" color={color} size={size}>
        <Button
          onClick={() => handleDownload()}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <PdfIcon />}
          sx={{ textTransform: 'none' }}
        >
          {showLabel ? 'Download' : 'PDF'}
        </Button>
        <Button
          size="small"
          onClick={handleClick}
          disabled={loading}
          sx={{ px: 1 }}
        >
          <ArrowDownIcon />
        </Button>
      </ButtonGroup>
      
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
            PDF Options
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Chip
              label={`${preferences.paperSize}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
            <Chip
              label={`${preferences.defaultCopies} copies`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          </Stack>
        </Box>
        
        <Divider />
        
        {pdfTemplates.map((template) => (
          <MenuItem
            key={template.id}
            onClick={() => handleDownload(template.id)}
            sx={{
              py: 1.5,
              px: 2,
              '&:hover': {
                backgroundColor: `${template.color}10`,
              },
            }}
          >
            <ListItemIcon sx={{ color: template.color }}>
              {template.icon}
            </ListItemIcon>
            <ListItemText
              primary={template.name}
              secondary={template.description}
              primaryTypographyProps={{ 
                sx: { fontWeight: 500, fontSize: '0.9rem' } 
              }}
              secondaryTypographyProps={{ 
                sx: { fontSize: '0.75rem' } 
              }}
            />
            {template.id === preferences.template && (
              <Badge
                badgeContent="✓"
                color="success"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.6rem',
                    minWidth: 16,
                    height: 16,
                  },
                }}
              />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}