"use client";
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Avatar,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Tooltip,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Payment as PaymentIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Store as StoreIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Place as PlaceIcon,
  ConfirmationNumber as InvoiceNumberIcon,
  LocalShipping as SupplierInvoiceIcon,
  EventNote as DueDateIcon,
  AccountBalanceWallet as WalletIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Description as NotesIcon,
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Tag as TagIcon,
  Inbox as InboxIcon,
  Paid as PaidIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { PurchaseInvoice, PurchasePayment } from '@/types/purchase_no_gst';

interface PurchaseInvoiceDetailsNoGSTProps {
  invoice: PurchaseInvoice;
  payments?: PurchasePayment[];
  onEdit?: () => void;
  onDelete?: () => void;
  onAddPayment?: (payment: Omit<PurchasePayment, 'id' | 'createdAt'>) => void;
  onPrint?: () => void;
  onDownload?: () => void;
  readOnly?: boolean;
}

const PurchaseInvoiceDetailsNoGST: React.FC<PurchaseInvoiceDetailsNoGSTProps> = ({
  invoice,
  payments = [],
  onEdit,
  onDelete,
  onAddPayment,
  onPrint,
  onDownload,
  readOnly = false
}) => {
  const theme = useTheme();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash' as const,
    referenceNumber: '',
    notes: ''
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateInput: string | undefined) => {
    if (!dateInput) return 'N/A';
    try {
      return format(new Date(dateInput), 'dd MMM yyyy');
    } catch {
      return dateInput;
    }
  };

  const handleAddPayment = () => {
    if (newPayment.amount > 0 && onAddPayment) {
      onAddPayment({
        purchaseInvoiceId: invoice.id!,
        amount: newPayment.amount,
        paymentDate: newPayment.paymentDate,
        paymentMethod: newPayment.paymentMethod,
        referenceNumber: newPayment.referenceNumber,
        notes: newPayment.notes
      });
      setShowPaymentForm(false);
      setNewPayment({
        amount: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
        referenceNumber: '',
        notes: ''
      });
    }
  };

  const handleCancelPayment = () => {
    setShowPaymentForm(false);
    setNewPayment({
      amount: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      referenceNumber: '',
      notes: ''
    });
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'partial': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusMeta = (status: string) => {
    switch (status) {
      case 'paid':
        return { label: 'PAID', color: 'success' as const, icon: <CheckCircleIcon fontSize="small" />, bg: alpha(theme.palette.success.main, 0.12) };
      case 'partial':
        return { label: 'PARTIAL', color: 'warning' as const, icon: <WarningIcon fontSize="small" />, bg: alpha(theme.palette.warning.main, 0.12) };
      case 'overdue':
        return { label: 'OVERDUE', color: 'error' as const, icon: <WarningIcon fontSize="small" />, bg: alpha(theme.palette.error.main, 0.12) };
      default:
        return { label: 'PENDING', color: 'default' as const, icon: <RefreshIcon fontSize="small" />, bg: alpha(theme.palette.grey[500], 0.12) };
    }
  };

  const statusMeta = getPaymentStatusMeta(invoice.paymentStatus);
  const paymentProgress = invoice.finalAmount > 0
    ? Math.min(100, Math.round(((invoice.paidAmount || 0) / invoice.finalAmount) * 100))
    : 0;

  const totalPaid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

  const renderInfoRow = (
    icon: React.ReactNode,
    label: string,
    value: React.ReactNode,
    valueColor: string = 'text.primary'
  ) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        py: 1,
        '& + &': { borderTop: `1px dashed ${theme.palette.divider}` }
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          color: 'primary.main'
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight="600" color={valueColor} sx={{ mt: 0.25, wordBreak: 'break-word' }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box>
      {/* ===== Back navigation ===== */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => window.history.back()}
        sx={{ mb: 2, textTransform: 'none', alignSelf: 'flex-start' }}
        color="inherit"
      >
        Back to Purchase Invoices
      </Button>

      {/* ===== Header hero card ===== */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 4 },
          mb: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.background.paper, 1)} 55%)`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            pointerEvents: 'none'
          }}
        />
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Avatar
                sx={{
                  width: { xs: 52, md: 64 },
                  height: { xs: 52, md: 64 },
                  bgcolor: 'primary.main',
                  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`
                }}
              >
                <ReceiptIcon sx={{ fontSize: { xs: 28, md: 34 } }} />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', md: '2.125rem' }, lineHeight: 1.2 }}>
                  {invoice.invoiceNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Purchase Invoice
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
              <Chip
                icon={statusMeta.icon}
                label={statusMeta.label}
                sx={{
                  bgcolor: statusMeta.bg,
                  color: `${statusMeta.color}.main`,
                  fontWeight: 700,
                  letterSpacing: '0.05em'
                }}
              />
              {invoice.paymentMethod && (
                <Chip
                  label={`Payment: ${invoice.paymentMethod.toUpperCase()}`}
                  variant="outlined"
                  size="small"
                />
              )}
              {invoice.notes && (
                <Chip
                  icon={<NotesIcon />}
                  label="Has Notes"
                  variant="outlined"
                  size="small"
                />
              )}
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Total Amount
              </Typography>
              <Typography variant="h3" color="primary.main" sx={{ fontWeight: 800, fontSize: { xs: '2rem', md: '2.5rem' } }}>
                {formatCurrency(invoice.finalAmount)}
              </Typography>
              <Box sx={{ mt: 1.5, maxWidth: { xs: '100%', md: 340 }, ml: { xs: 0, md: 'auto' } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(invoice.paidAmount || 0)} paid
                  </Typography>
                  <Typography variant="body2" fontWeight="600" color={invoice.balanceAmount > 0 ? 'error.main' : 'success.main'}>
                    {invoice.balanceAmount > 0 ? `${formatCurrency(invoice.balanceAmount)} due` : 'Fully paid'}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={paymentProgress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.grey[300], 0.6),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      bgcolor: paymentProgress >= 100
                        ? theme.palette.success.main
                        : theme.palette.warning.main
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {paymentProgress}% paid
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Action bar */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            mt: 3,
            pt: 3,
            borderTop: `1px solid ${theme.palette.divider}`,
            justifyContent: { xs: 'flex-start', md: 'flex-end' }
          }}
        >
          {onPrint && (
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={onPrint} size="small">
              Print
            </Button>
          )}
          {onDownload && (
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={onDownload} size="small">
              Download
            </Button>
          )}
          {!readOnly && onEdit && (
            <Button variant="outlined" color="primary" startIcon={<EditIcon />} onClick={onEdit} size="small">
              Edit
            </Button>
          )}
          {!readOnly && onDelete && (
            <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={onDelete} size="small">
              Delete
            </Button>
          )}
        </Box>
      </Paper>

      {/* ===== Info cards ===== */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main'
                  }}
                >
                  <ReceiptIcon />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Invoice Information
                </Typography>
              </Box>
              {renderInfoRow(<InvoiceNumberIcon fontSize="small" />, 'Invoice Number', invoice.invoiceNumber)}
              {renderInfoRow(<SupplierInvoiceIcon fontSize="small" />, 'Supplier Invoice No.', invoice.supplierInvoiceNumber || '—')}
              {renderInfoRow(<CalendarIcon fontSize="small" />, 'Purchase Date', formatDate(invoice.purchaseDate))}
              {invoice.dueDate && renderInfoRow(<DueDateIcon fontSize="small" />, 'Due Date', formatDate(invoice.dueDate), invoice.balanceAmount > 0 ? 'error.main' : 'text.primary')}
              {renderInfoRow(
                <WalletIcon fontSize="small" />,
                'Payment Status',
                <Chip
                  label={invoice.paymentStatus.toUpperCase()}
                  color={getPaymentStatusColor(invoice.paymentStatus)}
                  size="small"
                  sx={{ fontWeight: 700, letterSpacing: '0.04em' }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette.secondary.main, 0.12),
                    color: 'secondary.main'
                  }}
                >
                  <BusinessIcon />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Supplier Information
                </Typography>
              </Box>
              {renderInfoRow(<StoreIcon fontSize="small" />, 'Supplier Name', invoice.supplierName)}
              {invoice.supplierPhone && renderInfoRow(<PhoneIcon fontSize="small" />, 'Phone', invoice.supplierPhone)}
              {invoice.supplierEmail && renderInfoRow(<EmailIcon fontSize="small" />, 'Email', invoice.supplierEmail)}
              {invoice.supplierAddress && renderInfoRow(<PlaceIcon fontSize="small" />, 'Address', invoice.supplierAddress)}
              {!invoice.supplierPhone && !invoice.supplierEmail && !invoice.supplierAddress && (
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
                  <InboxIcon fontSize="small" />
                  No additional supplier details available.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ===== Invoice Items ===== */}
      <Card sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.info.main, 0.12),
                  color: 'info.main'
                }}
              >
                <TagIcon />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Invoice Items
              </Typography>
            </Box>
            <Chip
              label={`${invoice.items.length} item${invoice.items.length !== 1 ? 's' : ''}`}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>

          {invoice.items.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, bgcolor: alpha(theme.palette.grey[100], 0.4), borderRadius: 2 }}>
              <InboxIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
              <Typography variant="h6" color="text.secondary">No items found</Typography>
              <Typography variant="body2" color="text.disabled">
                This invoice doesn't contain any items.
              </Typography>
            </Box>
          ) : (
            <>
              {/* Mobile card view */}
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Stack spacing={2}>
                  {invoice.items.map((item, index) => (
                    <Paper
                      key={item.id || index}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        borderColor: theme.palette.divider,
                        '&:hover': { borderColor: 'primary.main' }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', gap: 1.5, minWidth: 0, flex: 1 }}>
                          <Avatar
                            sx={{
                              width: 28,
                              height: 28,
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              bgcolor: alpha(theme.palette.primary.main, 0.12),
                              color: 'primary.main'
                            }}
                          >
                            {index + 1}
                          </Avatar>
                          <Typography variant="body1" fontWeight="600" sx={{ wordBreak: 'break-word' }}>
                            {item.productName}
                          </Typography>
                        </Box>
                        <Typography variant="h6" fontWeight="700" color="success.dark">
                          {formatCurrency(item.totalAmount)}
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 1.5 }} />
                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Quantity</Typography>
                          <Typography variant="body2" fontWeight="600">{item.quantity}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Unit</Typography>
                          <Typography variant="body2" fontWeight="600">{item.unitOfMeasurement}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Unit Price</Typography>
                          <Typography variant="body2" fontWeight="600">{formatCurrency(item.unitPrice)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Discount</Typography>
                          {item.discountAmount && item.discountAmount > 0 ? (
                            <Typography variant="body2" fontWeight="600" color="error">
                              -{formatCurrency(item.discountAmount)}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">—</Typography>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Stack>
              </Box>

              {/* Desktop table view */}
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.grey[100], 0.5) }}>
                        <TableCell sx={{ fontWeight: 700, width: 64 }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, width: 100 }}>Qty</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, width: 110 }}>Unit</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, width: 130 }}>Unit Price</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, width: 120 }}>Discount</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, width: 140 }}>Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoice.items.map((item, index) => (
                        <TableRow
                          key={item.id || index}
                          hover
                          sx={{
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.04)
                            }
                          }}
                        >
                          <TableCell>
                            <Box
                              sx={{
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: 'primary.main',
                                fontWeight: 700,
                                fontSize: '0.85rem'
                              }}
                            >
                              {index + 1}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="600">
                              {item.productName}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight="600">{item.quantity}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={item.unitOfMeasurement} size="small" variant="outlined" sx={{ height: 24, fontSize: '0.75rem' }} />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="500">{formatCurrency(item.unitPrice)}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            {item.discountAmount && item.discountAmount > 0 ? (
                              <Typography variant="body2" fontWeight="600" color="error">
                                -{formatCurrency(item.discountAmount)}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.disabled">—</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Box
                              sx={{
                                display: 'inline-block',
                                bgcolor: alpha(theme.palette.success.main, 0.1),
                                color: 'success.dark',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1,
                                fontWeight: 700,
                                fontSize: '0.875rem'
                              }}
                            >
                              {formatCurrency(item.totalAmount)}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* ===== Totals / Payment Summary + History ===== */}
      <Grid container spacing={3}>
        {/* Payment Summary */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: alpha(theme.palette.success.main, 0.12),
                      color: 'success.main'
                    }}
                  >
                    <PaymentIcon />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Payment Summary
                  </Typography>
                </Box>
                {!readOnly && invoice.balanceAmount > 0 && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={showPaymentForm ? <ArrowBackIcon /> : <AddIcon />}
                    onClick={() => setShowPaymentForm(!showPaymentForm)}
                  >
                    {showPaymentForm ? 'Cancel' : 'Add Payment'}
                  </Button>
                )}
              </Box>

              <Box
                sx={{
                  bgcolor: alpha(theme.palette.background.default, 0.6),
                  borderRadius: 2,
                  p: 2
                }}
              >
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                    <Typography variant="body1" fontWeight="600">{formatCurrency(invoice.subtotal)}</Typography>
                  </Box>
                  {invoice.totalDiscountAmount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Total Discount</Typography>
                      <Typography variant="body1" fontWeight="600" color="error">-{formatCurrency(invoice.totalDiscountAmount)}</Typography>
                    </Box>
                  )}
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="700">Total</Typography>
                    <Typography variant="h6" fontWeight="800" color="primary.main">{formatCurrency(invoice.finalAmount)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PaidIcon fontSize="small" /> Paid
                    </Typography>
                    <Typography variant="body1" fontWeight="600" color="success.main">{formatCurrency(invoice.paidAmount || 0)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color={invoice.balanceAmount > 0 ? 'error.main' : 'text.secondary'}>
                      Balance
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight="700"
                      color={invoice.balanceAmount > 0 ? 'error.main' : 'success.main'}
                    >
                      {formatCurrency(invoice.balanceAmount)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment History */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette.info.main, 0.12),
                    color: 'info.main'
                  }}
                >
                  <WalletIcon />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Payment History
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {payments.length} payment{payments.length !== 1 ? 's' : ''} · {formatCurrency(totalPaid)} received
                  </Typography>
                </Box>
              </Box>

              {payments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, bgcolor: alpha(theme.palette.grey[100], 0.4), borderRadius: 2 }}>
                  <InboxIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No payments recorded yet.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5} sx={{ maxHeight: 340, overflowY: 'auto', pr: 0.5 }}>
                  {payments.map((payment, index) => (
                    <Paper
                      key={payment.id || index}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        borderColor: alpha(theme.palette.success.main, 0.25),
                        bgcolor: alpha(theme.palette.success.main, 0.04)
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body1" fontWeight="700" color="success.dark">
                          {formatCurrency(payment.amount)}
                        </Typography>
                        <Chip
                          label={formatDate(payment.paymentDate)}
                          size="small"
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.72rem' }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={payment.paymentMethod.toUpperCase()}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.72rem' }}
                        />
                        {payment.referenceNumber && (
                          <Typography variant="caption" color="text.secondary">
                            Ref: {payment.referenceNumber}
                          </Typography>
                        )}
                      </Box>
                      {payment.notes && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          {payment.notes}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Inline Payment Form */}
        {showPaymentForm && (
          <Grid size={{ xs: 12 }}>
            <Card
              sx={{
                borderRadius: 2,
                border: `2px solid ${theme.palette.primary.main}`,
                boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main'
                    }}
                  >
                    <AddIcon />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    Add New Payment
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Amount *"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                      inputProps={{ min: 0.01, max: invoice.balanceAmount, step: 0.01 }}
                      InputProps={{
                        startAdornment: '₹'
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Payment Date *"
                      value={newPayment.paymentDate}
                      onChange={(e) => setNewPayment({ ...newPayment, paymentDate: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <FormControl fullWidth>
                      <InputLabel>Payment Method *</InputLabel>
                      <Select
                        value={newPayment.paymentMethod}
                        onChange={(e) => setNewPayment({ ...newPayment, paymentMethod: e.target.value as any })}
                        label="Payment Method *"
                      >
                        <MenuItem value="cash">Cash</MenuItem>
                        <MenuItem value="bank">Bank Transfer</MenuItem>
                        <MenuItem value="cheque">Cheque</MenuItem>
                        <MenuItem value="upi">UPI</MenuItem>
                        <MenuItem value="card">Card</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Reference Number"
                      value={newPayment.referenceNumber}
                      onChange={(e) => setNewPayment({ ...newPayment, referenceNumber: e.target.value })}
                      placeholder="Cheque no., Transaction ID, etc."
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={1}
                      label="Notes"
                      value={newPayment.notes}
                      onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                      placeholder="Optional notes about this payment"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button variant="outlined" onClick={handleCancelPayment}>
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleAddPayment}
                        disabled={newPayment.amount <= 0 || newPayment.amount > invoice.balanceAmount}
                        startIcon={<AddIcon />}
                      >
                        Add Payment
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Notes */}
        {invoice.notes && (
          <Grid size={{ xs: 12 }}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: alpha(theme.palette.warning.main, 0.12),
                      color: 'warning.dark'
                    }}
                  >
                    <NotesIcon />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Notes
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line', pl: 0.5 }}>
                  {invoice.notes}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default PurchaseInvoiceDetailsNoGST;
