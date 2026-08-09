"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Snackbar,
  Menu,
  MenuItem,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  Stack,
  Fade,
  Zoom,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Skeleton,
  useMediaQuery,
  useTheme,
  CardActions,
  Collapse,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Error as ErrorIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  FileCopy as FileCopyIcon,
  MoreVert as MoreVertIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  CalendarToday as CalendarTodayIcon,
  AccountBalance as AccountBalanceIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Send as SendIcon,
  History as HistoryIcon,
  Analytics as AnalyticsIcon,
  Payment as PaymentIcon,
  LocalShipping as ShippingIcon,
  Inventory as InventoryIcon,
  Remove as RemoveIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { doc, getDoc, deleteDoc, updateDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import SimpleInvoiceService from '@/services/simpleInvoiceService';
import { Invoice } from '@/types/invoice_no_gst';
import Link from 'next/link';
import ConfirmationDialog from '@/components/ConfirmationDialog';

// Enhanced Print Dialog Component
interface PrintDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  invoice: Invoice;
  isMobile?: boolean;
}

const EnhancedPrintDialog: React.FC<PrintDialogProps> = ({ open, onClose, invoiceId, invoice, isMobile = false }) => {
  const [copies, setCopies] = useState(1);
  const [paperSize, setPaperSize] = useState('A4');
  const [orientation, setOrientation] = useState('portrait');
  const [printing, setPrinting] = useState(false);
  const router = useRouter();

  const handlePrint = async (mode: 'print' | 'preview') => {
    setPrinting(true);
    try {
      const params = new URLSearchParams({
        copies: copies.toString(),
        paperSize,
        orientation,
      });

      if (mode === 'preview') {
        window.open(`/invoices/${invoiceId}/print/enhanced?${params.toString()}`, '_blank');
      } else {
        window.open(`/invoices/${invoiceId}/print/enhanced?${params.toString()}&autoprint=true`, '_blank');
      }
      onClose();
    } catch (error) {
      console.error('Print error:', error);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden'
        }
      }}
    >
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white',
        px: { xs: 2, sm: 3 },
        py: { xs: 1.5, sm: 2 }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              p: 1,
              borderRadius: 1.5,
              display: 'flex'
            }}>
              <PrintIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '0.95rem', sm: '1.15rem' } }}>
                Print Invoice
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                #{invoice?.invoiceNumber || invoiceId}
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={onClose} 
            size="small"
            sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
        <Stack spacing={{ xs: 2.5, sm: 3 }}>
          {/* Copies */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <CopyIcon fontSize="small" color="primary" />
              Number of Copies
            </Typography>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              bgcolor: 'grey.50',
              borderRadius: 2,
              p: 1.5
            }}>
              <IconButton
                size="small"
                onClick={() => setCopies(Math.max(1, copies - 1))}
                disabled={copies <= 1}
                sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'white' }}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              <Typography
                variant="h5"
                sx={{
                  minWidth: 40,
                  textAlign: 'center',
                  fontWeight: 800,
                  color: 'primary.main'
                }}
              >
                {copies}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setCopies(Math.min(10, copies + 1))}
                disabled={copies >= 10}
                sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'white' }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                Max 10
              </Typography>
            </Box>
          </Box>

          {/* Paper Size */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <ReceiptIcon fontSize="small" color="primary" />
              Paper Size
            </Typography>
            <Stack direction="row" spacing={1}>
              {['A4', 'Letter', 'Legal'].map((size) => (
                <Button
                  key={size}
                  variant={paperSize === size ? 'contained' : 'outlined'}
                  size={isMobile ? 'small' : 'medium'}
                  onClick={() => setPaperSize(size)}
                  sx={{
                    flex: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: paperSize === size ? 700 : 500,
                    fontSize: isMobile ? '0.8rem' : undefined
                  }}
                >
                  {size}
                </Button>
              ))}
            </Stack>
          </Box>

          {/* Orientation */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <VisibilityIcon fontSize="small" color="primary" />
              Orientation
            </Typography>
            <Stack direction="row" spacing={1}>
              {[
                { value: 'portrait', label: 'Portrait', icon: '⬜' },
                { value: 'landscape', label: 'Landscape', icon: '⬛' },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  variant={orientation === opt.value ? 'contained' : 'outlined'}
                  size={isMobile ? 'small' : 'medium'}
                  onClick={() => setOrientation(opt.value)}
                  startIcon={<Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>{opt.icon}</Typography>}
                  sx={{
                    flex: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: orientation === opt.value ? 700 : 500,
                    fontSize: isMobile ? '0.8rem' : undefined
                  }}
                >
                  {opt.label}
                </Button>
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{
        px: { xs: 2, sm: 3 },
        pb: { xs: 2, sm: 3 },
        flexDirection: { xs: 'column-reverse', sm: 'row' },
        gap: 1,
        bgcolor: 'grey.50',
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Button
          onClick={onClose}
          variant="text"
          color="inherit"
          size={isMobile ? 'small' : 'medium'}
          fullWidth={isMobile}
          sx={{ fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => handlePrint('preview')}
          startIcon={<VisibilityIcon />}
          disabled={printing}
          variant="outlined"
          size={isMobile ? 'small' : 'medium'}
          fullWidth={isMobile}
          sx={{ fontWeight: 600, borderRadius: 2 }}
        >
          Preview
        </Button>
        <Button
          onClick={() => handlePrint('print')}
          startIcon={printing ? <CircularProgress size={16} color="inherit" /> : <PrintIcon />}
          variant="contained"
          disabled={printing}
          size={isMobile ? 'small' : 'medium'}
          fullWidth={isMobile}
          sx={{ fontWeight: 700, borderRadius: 2, minWidth: { xs: 'auto', sm: 140 } }}
        >
          {printing ? 'Opening...' : 'Print Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Tab Panel Component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, index, value, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`invoice-tabpanel-${index}`}
      aria-labelledby={`invoice-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

export default function EnhancedInvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [shareMenuAnchor, setShareMenuAnchor] = useState<null | HTMLElement>(null);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [relatedInvoices, setRelatedInvoices] = useState<Invoice[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Memoized calculations
  const invoiceStats = useMemo(() => {
    if (!invoice) return null;
    
    return {
      totalItems: invoice.items?.length || 0,
      totalQuantity: invoice.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
      averageItemValue: invoice.items?.length ? (invoice.subtotal || 0) / invoice.items.length : 0,
      discountPercentage: invoice.subtotal ? ((invoice.totalDiscount || 0) / invoice.subtotal) * 100 : 0,
      profitMargin: invoice.subtotal ? ((invoice.totalAmount || 0) - (invoice.subtotal || 0)) / (invoice.subtotal || 0) * 100 : 0
    };
  }, [invoice]);

  // Fetch invoice data with error handling and retry logic
  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

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
      
      // Fetch related data in parallel
      await Promise.all([
        fetchRelatedInvoices(invoiceData.partyId),
        fetchPaymentHistory(invoiceData.id!)
      ]);
      
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch related invoices for the same party
  const fetchRelatedInvoices = async (partyId: string) => {
    try {
      if (!partyId) return;
      
      const invoicesQuery = query(
        collection(db, 'invoices'),
        where('partyId', '==', partyId),
        where('id', '!=', id),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      
      const snapshot = await getDocs(invoicesQuery);
      const related = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
      setRelatedInvoices(related);
    } catch (error) {
      console.error('Error fetching related invoices:', error);
    }
  };

  // Fetch payment history
  const fetchPaymentHistory = async (invoiceId: string) => {
    try {
      // This would typically fetch from a payments collection
      // For now, we'll simulate some payment data
      setPaymentHistory([]);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleEdit = () => {
    if (invoice) {
      router.push(`/invoices/${invoice.id}/edit`);
    }
  };

  const handleDelete = () => {
    setOpenConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    setOpenConfirmDelete(false);
    if (!invoice) return;

    try {
      const result = await SimpleInvoiceService.deleteInvoice(invoice.id!, true);
      if (result.success) {
        setSuccessMessage('Invoice deleted successfully');
        setTimeout(() => {
          router.push('/invoices');
        }, 2000);
      } else {
        setError(result.errors?.join(', ') || 'Failed to delete invoice');
      }
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError('Failed to delete invoice');
    }
  };

  const handleDuplicate = () => {
    if (invoice) {
      router.push(`/invoices/create?duplicate=${invoice.id}`);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!invoice) return;

    try {
      const result = await SimpleInvoiceService.updateInvoice(invoice.id!, { status });
      if (result.success) {
        setSuccessMessage(`Invoice status updated to ${status}`);
        setInvoice(prev => prev ? { ...prev, status } : null);
      } else {
        setError(result.errors?.join(', ') || 'Failed to update invoice status');
      }
    } catch (err) {
      console.error('Error updating invoice status:', err);
      setError('Failed to update invoice status');
    }
  };

  const handleShare = (method: string) => {
    setShareMenuAnchor(null);
    
    if (method === 'email') {
      const subject = `Invoice ${invoice?.invoiceNumber}`;
      const body = `Please find attached invoice ${invoice?.invoiceNumber} for ₹${invoice?.totalAmount?.toLocaleString()}.`;
      window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    } else if (method === 'whatsapp') {
      const message = `Invoice ${invoice?.invoiceNumber} for ₹${invoice?.totalAmount?.toLocaleString()} is ready. View: ${window.location.href}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
    } else if (method === 'download') {
      window.open(`/invoices/${id}/print/enhanced?download=true&template=modern`);
    }
  };

  const handleCopyInvoiceNumber = () => {
    if (invoice) {
      navigator.clipboard.writeText(invoice.invoiceNumber);
      setSuccessMessage('Invoice number copied to clipboard');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setSuccessMessage('Invoice link copied to clipboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'confirmed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'error';
      case 'partial': return 'warning';
      case 'paid': return 'success';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  // Enhanced header with better actions — mobile-first compact layout
  const PageHeader = () => (
    <Fade in timeout={800}>
      <Box sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: isMobile ? 2 : 3,
        p: isMobile ? 2 : 3,
        mb: isMobile ? 2 : 4,
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {/* Mobile: column layout; Desktop: row layout */}
          <Box sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'flex-start',
            gap: isMobile ? 1.5 : 0,
            mb: 2
          }}>
            <Box>
              <Button
                component={Link}
                href="/invoices"
                startIcon={<ArrowBackIcon />}
                variant="outlined"
                size="small"
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  mb: 1.5,
                  fontSize: isMobile ? '0.75rem' : undefined,
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Back
              </Button>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1.5 : 2 }}>
                <Zoom in timeout={1000}>
                  <Box sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    p: isMobile ? 1 : 1.5,
                    borderRadius: 2,
                    backdropFilter: 'blur(10px)'
                  }}>
                    <ReceiptIcon sx={{ fontSize: isMobile ? 24 : 32, color: 'white' }} />
                  </Box>
                </Zoom>
                <Box>
                  <Typography variant={isMobile ? "h5" : "h4"} component="h1" fontWeight="bold" sx={{ fontSize: isMobile ? '1.1rem' : undefined }} gutterBottom>
                    Invoice Details
                  </Typography>
                  {!loading && invoice && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant={isMobile ? "body1" : "h6"} sx={{ opacity: 0.9 }}>
                        {invoice.invoiceNumber}
                      </Typography>
                      <Tooltip title="Copy invoice number">
                        <IconButton
                          size="small"
                          onClick={handleCopyInvoiceNumber}
                          sx={{ color: 'rgba(255,255,255,0.7)' }}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Copy invoice link">
                        <IconButton
                          size="small"
                          onClick={handleCopyLink}
                          sx={{ color: 'rgba(255,255,255,0.7)' }}
                        >
                          <ShareIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>

            {!loading && invoice && (
              <Stack
                direction={isMobile ? 'row' : 'row'}
                spacing={1}
                flexWrap="wrap"
                sx={{ alignSelf: isMobile ? 'flex-start' : undefined }}
              >
                <Tooltip title="Edit invoice">
                  <Button
                    onClick={handleEdit}
                    startIcon={isMobile ? undefined : <EditIcon />}
                    variant="contained"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      backdropFilter: 'blur(10px)',
                      fontSize: isMobile ? '0.75rem' : undefined,
                      minWidth: isMobile ? 36 : undefined,
                      px: isMobile ? 1 : undefined,
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                    }}
                  >
                    {isMobile ? <EditIcon fontSize="small" /> : 'Edit'}
                  </Button>
                </Tooltip>

                <Tooltip title="Print options">
                  <Button
                    onClick={() => setPrintDialogOpen(true)}
                    startIcon={isMobile ? undefined : <PrintIcon />}
                    variant="outlined"
                    size="small"
                    sx={{
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.3)',
                      fontSize: isMobile ? '0.75rem' : undefined,
                      minWidth: isMobile ? 36 : undefined,
                      px: isMobile ? 1 : undefined,
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    {isMobile ? <PrintIcon fontSize="small" /> : 'Print'}
                  </Button>
                </Tooltip>
 

                <Tooltip title="More options">
                  <IconButton
                    onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
                    sx={{
                      color: 'white',
                      bgcolor: 'rgba(255,255,255,0.2)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            )}
          </Box>

          {/* Enhanced Status Chips — compact on mobile */}
          {!loading && invoice && (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ gap: 0.5 }}>
              <Chip
                label={`${isMobile ? '' : 'Status: '}${invoice.status?.toUpperCase() || 'DRAFT'}`}
                color={getStatusColor(invoice.status || 'draft') as any}
                variant="outlined"
                size={isMobile ? 'small' : 'medium'}
                sx={{ 
                  color: 'white', 
                  borderColor: 'rgba(255,255,255,0.3)',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  height: isMobile ? 24 : 32,
                  '& .MuiChip-label': { fontSize: isMobile ? '0.7rem' : undefined }
                }}
              />
              <Chip
                label={`${isMobile ? '' : 'Payment: '}${invoice.paymentStatus?.toUpperCase() || 'PENDING'}`}
                color={getPaymentStatusColor(invoice.paymentStatus || 'pending') as any}
                variant="outlined"
                size={isMobile ? 'small' : 'medium'}
                sx={{ 
                  color: 'white', 
                  borderColor: 'rgba(255,255,255,0.3)',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  height: isMobile ? 24 : 32,
                  '& .MuiChip-label': { fontSize: isMobile ? '0.7rem' : undefined }
                }}
              />
              <Chip
                label={`${isMobile ? '' : 'Type: '}${invoice.type?.toUpperCase() || 'SALES'}`}
                variant="outlined"
                size={isMobile ? 'small' : 'medium'}
                sx={{ 
                  color: 'white', 
                  borderColor: 'rgba(255,255,255,0.3)',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  height: isMobile ? 24 : 32,
                  '& .MuiChip-label': { fontSize: isMobile ? '0.7rem' : undefined }
                }}
              />
              {invoiceStats && (
                <Chip
                  label={isMobile ? `${invoiceStats.totalItems} items` : `${invoiceStats.totalItems} Items`}
                  variant="outlined"
                  size={isMobile ? 'small' : 'medium'}
                  sx={{ 
                    color: 'white', 
                    borderColor: 'rgba(255,255,255,0.3)',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    height: isMobile ? 24 : 32,
                    '& .MuiChip-label': { fontSize: isMobile ? '0.7rem' : undefined }
                  }}
                />
              )}
            </Stack>
          )}
        </Box>
      </Box>
    </Fade>
  );

  // Enhanced overview with more metrics — compact on mobile
  const InvoiceOverview = () => {
    const totalAmt = invoice?.totalAmount || 0;
    return (
      <Fade in timeout={1000}>
        <Grid container spacing={isMobile ? 1.5 : 3} sx={{ mb: isMobile ? 2 : 4 }}>
          <Grid item xs={6} md={3}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent sx={{ p: isMobile ? 1.5 : 2, '&:last-child': { pb: isMobile ? 1.5 : 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccountBalanceIcon sx={{ mr: 1, fontSize: isMobile ? 16 : 24 }} />
                  <Typography variant={isMobile ? "body2" : "h6"} sx={{ fontWeight: 600 }}>Financial Summary</Typography>
                </Box>
                <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" gutterBottom>
                  ₹{totalAmt.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                  Subtotal: ₹{invoice?.subtotal?.toLocaleString() || '0'}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                  Discount: ₹{invoice?.totalDiscount?.toLocaleString() || '0'}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                  Balance: ₹{invoice?.balanceAmount?.toLocaleString() || '0'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: isMobile ? 1.5 : 2, '&:last-child': { pb: isMobile ? 1.5 : 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarTodayIcon sx={{ mr: 1, color: 'primary.main', fontSize: isMobile ? 16 : 24 }} />
                  <Typography variant={isMobile ? "body2" : "h6"} sx={{ fontWeight: 600 }}>Timeline</Typography>
                </Box>
                <Typography variant="caption" display="block">
                  <strong>Date:</strong> {invoice?.date ? new Date(invoice.date).toLocaleDateString() : 'N/A'}
                </Typography>
                {invoice?.dueDate && (
                  <Typography variant="caption" display="block">
                    <strong>Due:</strong> {new Date(invoice.dueDate).toLocaleDateString()}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" display="block">
                  Created: {invoice?.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: isMobile ? 1.5 : 2, '&:last-child': { pb: isMobile ? 1.5 : 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <BusinessIcon sx={{ mr: 1, color: 'primary.main', fontSize: isMobile ? 16 : 24 }} />
                  <Typography variant={isMobile ? "body2" : "h6"} sx={{ fontWeight: 600 }}>Party Details</Typography>
                </Box>
                <Typography variant="caption" fontWeight="bold" display="block">
                  {invoice?.partyName || 'N/A'}
                </Typography>
                {invoice?.partyPhone && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Phone: {invoice.partyPhone}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" display="block">
                  {invoice?.type === 'sales' ? 'Customer' : 'Supplier'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: isMobile ? 1.5 : 2, '&:last-child': { pb: isMobile ? 1.5 : 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AnalyticsIcon sx={{ mr: 1, color: 'primary.main', fontSize: isMobile ? 16 : 24 }} />
                  <Typography variant={isMobile ? "body2" : "h6"} sx={{ fontWeight: 600 }}>Statistics</Typography>
                </Box>
                {invoiceStats && (
                  <>
                    <Typography variant="caption" display="block">
                      <strong>Items:</strong> {invoiceStats.totalItems}
                    </Typography>
                    <Typography variant="caption" display="block">
                      <strong>Qty:</strong> {invoiceStats.totalQuantity}
                    </Typography>
                    <Typography variant="caption" display="block">
                      <strong>Avg:</strong> ₹{invoiceStats.averageItemValue.toFixed(2)}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Fade>
    );
  };

  // Enhanced tabbed content
  const TabbedContent = () => (
    <Card sx={{ mb: 4 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptIcon fontSize="small" />
                Items ({invoice?.items?.length || 0})
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PaymentIcon fontSize="small" />
                Payments
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon fontSize="small" />
                Related ({relatedInvoices.length})
              </Box>
            } 
          />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Product</strong></TableCell>
                <TableCell align="right"><strong>Qty</strong></TableCell>
                <TableCell align="right"><strong>Unit</strong></TableCell>
                <TableCell align="right"><strong>Price</strong></TableCell>
                <TableCell align="right"><strong>Discount</strong></TableCell>
                <TableCell align="right"><strong>Total</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!invoice?.items || invoice.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box sx={{ py: 4 }}>
                      <InventoryIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        No items found
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                invoice.items.map((item, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {item.name || item.productName || 'N/A'}
                        </Typography>
                        {item.description && (
                          <Typography variant="caption" color="text.secondary">
                            {item.description}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={item.quantity || 0} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {item.unitOfMeasurement || 'PCS'}
                    </TableCell>
                    <TableCell align="right">₹{(item.price || 0).toLocaleString()}</TableCell>
                    <TableCell align="right">
                      {item.discount > 0 && (
                        <Chip
                          label={item.discountType === 'percentage' ? `${item.discount}%` : `₹${item.discount}`}
                          size="small"
                          color="secondary"
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        ₹{(item.totalAmount || item.finalPrice || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <PaymentIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Payment History
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Payment tracking feature coming soon
          </Typography>
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {relatedInvoices.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <HistoryIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Related Invoices
            </Typography>
            <Typography variant="body2" color="text.disabled">
              No other invoices found for this party
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {relatedInvoices.map((relatedInvoice) => (
              <Grid item xs={12} md={6} key={relatedInvoice.id}>
                <Card variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => router.push(`/invoices/${relatedInvoice.id}`)}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {relatedInvoice.invoiceNumber}
                      </Typography>
                      <Chip 
                        label={relatedInvoice.status || 'draft'} 
                        size="small" 
                        color={getStatusColor(relatedInvoice.status || 'draft') as any}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {relatedInvoice.date ? new Date(relatedInvoice.date).toLocaleDateString() : 'N/A'}
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      ₹{relatedInvoice.totalAmount?.toLocaleString() || '0'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>
    </Card>
  );

  if (loading) {
    return (
      <ModernThemeProvider>
        <VisuallyEnhancedDashboardLayout
          title="Invoice Details"
          pageType="invoices"
          enableVisualEffects={true}
          enableParticles={true}
        >
          <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 4 }}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3, mb: 3 }} />
              <Grid container spacing={3}>
                {[1, 2, 3, 4].map((i) => (
                  <Grid item xs={12} md={3} key={i}>
                    <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Container>
        </VisuallyEnhancedDashboardLayout>
      </ModernThemeProvider>
    );
  }

  if (error || !invoice) {
    return (
      <ModernThemeProvider>
        <VisuallyEnhancedDashboardLayout
          title="Invoice Details"
          pageType="invoices"
          enableVisualEffects={true}
          enableParticles={false}
        >
          <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              textAlign: 'center'
            }}>
              <Avatar sx={{ bgcolor: 'error.light', width: 80, height: 80, mb: 3 }}>
                <ErrorIcon sx={{ fontSize: 48 }} />
              </Avatar>
              <Typography variant="h5" color="text.primary" gutterBottom fontWeight="bold">
                Unable to Load Invoice
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
                {error || 'The invoice you\'re looking for could not be found or there was an error loading it.'}
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  component={Link}
                  href="/invoices"
                  startIcon={<ArrowBackIcon />}
                  variant="contained"
                  size="large"
                >
                  Return to Invoices
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outlined"
                  size="large"
                >
                  Try Again
                </Button>
              </Stack>
            </Box>
          </Container>
        </VisuallyEnhancedDashboardLayout>
      </ModernThemeProvider>
    );
  }

  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title={`Invoice ${invoice.invoiceNumber}`}
        subtitle={`${invoice.partyName} • ₹${invoice.totalAmount?.toLocaleString()}`}
        showBreadcrumbs={true} 
        pageHeaderActions={
          <Stack direction="row" spacing={1}>
            <Button
              onClick={handleEdit}
              startIcon={<EditIcon />}
              variant="outlined"
              size="small"
            >
              Edit
            </Button>
            <Button
              onClick={() => setPrintDialogOpen(true)}
              startIcon={<PrintIcon />}
              variant="contained"
              size="small"
            >
              Print
            </Button>
            <Button
              onClick={() => window.open(`/invoices/${id}/print/printable-dual`, '_blank')}
              startIcon={<ReceiptIcon />}
              variant="outlined"
              size="small"
              sx={{ 
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.main',
                  color: 'white'
                }
              }}
            >
              Side by Side
            </Button>
          </Stack>
        }
      >
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', pb: 4 }}>
          <Container maxWidth="xl" sx={{ pt: 2 }}>
            <PageHeader />
            <InvoiceOverview />
            <TabbedContent />

            {/* Additional Notes */}
            {invoice?.notes && (
              <Fade in timeout={1400}>
                <Card sx={{ mb: 4 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EditIcon color="primary" />
                      Notes
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {invoice.notes}
                    </Typography>
                  </CardContent>
                </Card>
              </Fade>
            )}

            {/* Enhanced Print Dialog */}
            <EnhancedPrintDialog
              open={printDialogOpen}
              onClose={() => setPrintDialogOpen(false)}
              invoiceId={id as string}
              invoice={invoice}
            />

            {/* Share Menu */}
            <Menu
              anchorEl={shareMenuAnchor}
              open={Boolean(shareMenuAnchor)}
              onClose={() => setShareMenuAnchor(null)}
            >
              <MenuItem onClick={() => handleShare('email')}>
                <EmailIcon sx={{ mr: 1 }} />
                Email
              </MenuItem>
              <MenuItem onClick={() => handleShare('whatsapp')}>
                <WhatsAppIcon sx={{ mr: 1 }} />
                WhatsApp
              </MenuItem>
              <MenuItem onClick={() => handleShare('download')}>
                <DownloadIcon sx={{ mr: 1 }} />
                Download PDF
              </MenuItem>
            </Menu>

            {/* More Menu */}
            <Menu
              anchorEl={moreMenuAnchor}
              open={Boolean(moreMenuAnchor)}
              onClose={() => setMoreMenuAnchor(null)}
            >
              <MenuItem onClick={handleDuplicate}>
                <FileCopyIcon sx={{ mr: 1 }} />
                Duplicate Invoice
              </MenuItem>
              <MenuItem onClick={() => handleStatusChange('confirmed')}>
                <CheckCircleIcon sx={{ mr: 1 }} />
                Mark as Confirmed
              </MenuItem>
              <MenuItem onClick={() => handleStatusChange('cancelled')}>
                <ErrorIcon sx={{ mr: 1 }} />
                Cancel Invoice
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                <DeleteIcon sx={{ mr: 1 }} />
                Delete Invoice
              </MenuItem>
            </Menu>

            {/* Success/Error Messages */}
            <Snackbar
              open={!!successMessage}
              autoHideDuration={6000}
              onClose={() => setSuccessMessage(null)}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <Alert
                onClose={() => setSuccessMessage(null)}
                severity="success"
                variant="filled"
                sx={{ borderRadius: 2 }}
              >
                {successMessage}
              </Alert>
            </Snackbar>

            <Snackbar
              open={!!error}
              autoHideDuration={6000}
              onClose={() => setError(null)}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <Alert
                onClose={() => setError(null)}
                severity="error"
                variant="filled"
                sx={{ borderRadius: 2 }}
              >
                {error}
              </Alert>
            </Snackbar>

            <ConfirmationDialog
              open={openConfirmDelete}
              onClose={() => setOpenConfirmDelete(false)}
              onConfirm={handleConfirmDelete}
              title="Confirm Deletion"
              message={`Are you sure you want to delete invoice ${invoice?.invoiceNumber}? This action cannot be undone.`}
              confirmText="Delete"
              confirmColor="error"
            />
          </Container>
        </Box>
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}
