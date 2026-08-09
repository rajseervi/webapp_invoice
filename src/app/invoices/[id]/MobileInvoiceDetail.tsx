"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Button, Paper, IconButton, CircularProgress, Alert,
  Chip, Divider, Fade, Avatar, Snackbar, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Payment as PaymentIcon,
  FileCopy as FileCopyIcon,
  Description as DescIcon,
} from '@mui/icons-material';
import SimpleInvoiceService from '@/services/simpleInvoiceService';
import { Invoice } from '@/types/invoice_no_gst';
import { alpha } from '@mui/material/styles';

const palette = {
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  primaryDark: '#1E40AF',
  accent: '#F59E0B',
  accentLight: '#FEF3C7',
  success: '#10B981',
  successLight: '#D1FAE5',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  surface: '#F8FAFC',
  surfaceAlt: '#F1F5F9',
  border: '#E2E8F0',
  text: '#1E293B',
  textSecondary: '#64748B',
  white: '#FFFFFF',
};

const styles = {
  chip: (bg: string, fg: string) => ({
    bgcolor: bg, color: fg, fontWeight: 600, borderRadius: 1.5,
    fontSize: '0.7rem', height: 22, '& .MuiChip-label': { px: 1 },
  }),
  sectionCard: {
    mx: 1, mb: 1.5, borderRadius: 2.5,
    bgcolor: palette.white,
    border: `1px solid ${palette.border}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
};

export default function MobileInvoiceDetail() {
  const { id } = useParams();
  const router = useRouter();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [copies, setCopies] = useState(1);

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);
      const data = await SimpleInvoiceService.getInvoiceById(id as string);
      if (!data) { setError('Invoice not found'); return; }
      setInvoice(data);
    } catch { setError('Failed to load invoice'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchInvoice(); }, [fetchInvoice]);

  const handleDelete = async () => {
    if (!invoice) return;
    const result = await SimpleInvoiceService.deleteInvoice(invoice.id!, true);
    if (result.success) {
      setSnack('Invoice deleted');
      setTimeout(() => router.push('/invoices'), 1200);
    } else {
      setError('Failed to delete');
    }
    setDeleteOpen(false);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'confirmed': return palette.success;
      case 'draft': return palette.accent;
      case 'cancelled': return palette.danger;
      default: return palette.textSecondary;
    }
  };

  const paymentColor = (s: string) => {
    switch (s) {
      case 'paid': return palette.success;
      case 'partial': return palette.accent;
      default: return palette.danger;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: palette.surface }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !invoice) {
    return (
      <Box sx={{ p: 2, bgcolor: palette.surface, minHeight: '100vh' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/invoices')} sx={{ mb: 2 }}>Back</Button>
        <Alert severity="error">{error || 'Invoice not found'}</Alert>
      </Box>
    );
  }

  const total = invoice.totalAmount || 0;
  const subtotal = invoice.subtotal || 0;
  const discount = invoice.totalDiscount || 0;
  const transport = invoice.transportCharges || 0;

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto', bgcolor: palette.surface, minHeight: '100vh', pb: 8 }}>
      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} message={snack} />
      {error && <Alert severity="error" sx={{ mx: 1, mt: 1 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* --- HEADER --- */}
      <Box sx={{ px: 1.5, pt: 2, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton onClick={() => router.push('/invoices')} sx={{ color: palette.text }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={800} color={palette.text} sx={{ fontSize: '1rem' }}>
            Invoice Details
          </Typography>
        </Box>
        <IconButton onClick={() => setPrintOpen(true)} sx={{ color: palette.primary, bgcolor: palette.primaryLight, borderRadius: 1.5 }}>
          <PrintIcon />
        </IconButton>
        <IconButton onClick={() => router.push(`/invoices/${id}/edit`)} sx={{ color: palette.primary, bgcolor: palette.primaryLight, borderRadius: 1.5 }}>
          <EditIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* --- INVOICE NUMBER & STATUS --- */}
      <Paper variant="outlined" sx={styles.sectionCard}>
        <Box sx={{ p: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: palette.primary, boxShadow: `0 2px 8px ${alpha(palette.primary, 0.3)}` }}>
                <ReceiptIcon sx={{ fontSize: 16 }} />
              </Avatar>
              <Typography variant="h6" fontWeight={800} color={palette.text} sx={{ fontSize: '1rem' }}>
                {invoice.invoiceNumber || '#'}
              </Typography>
            </Box>
            <Chip
              label={(invoice.status || 'draft').toUpperCase()}
              size="small"
              sx={{ bgcolor: statusColor(invoice.status || 'draft'), color: palette.white, fontWeight: 700, fontSize: '0.65rem', height: 22 }}
            />
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            <Chip icon={<CalendarIcon sx={{ fontSize: 14 }} />} label={invoice.date ? new Date(invoice.date).toLocaleDateString('en-IN') : 'N/A'} size="small" variant="outlined" sx={{ borderRadius: 1.5, fontSize: '0.7rem' }} />
            <Chip icon={<PaymentIcon sx={{ fontSize: 14 }} />} label={(invoice.paymentStatus || 'pending').toUpperCase()} size="small"
              sx={{ bgcolor: paymentColor(invoice.paymentStatus || 'pending'), color: palette.white, fontWeight: 700, fontSize: '0.65rem', height: 22 }} />
          </Box>
        </Box>
      </Paper>

      {/* --- PARTY INFO --- */}
      <Paper variant="outlined" sx={styles.sectionCard}>
        <Box sx={{ p: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <PersonIcon sx={{ fontSize: 18, color: palette.primary }} />
            <Typography variant="caption" fontWeight={700} color={palette.textSecondary} textTransform="uppercase" letterSpacing={0.5}>
              {invoice.type === 'purchase' ? 'Supplier' : 'Customer'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: palette.surfaceAlt, borderRadius: 2, p: 1.5 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: palette.primaryLight, color: palette.primary, fontWeight: 700 }}>
              {(invoice.partyName || '?').charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" fontWeight={700} color={palette.text} sx={{ fontSize: '0.95rem' }}>
                {invoice.partyName || 'Unknown'}
              </Typography>
              {invoice.partyPhone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
                  <PhoneIcon sx={{ fontSize: 14, color: palette.textSecondary }} />
                  <Typography variant="body2" color={palette.textSecondary} sx={{ fontSize: '0.8rem' }}>
                    {invoice.partyPhone}
                  </Typography>
                </Box>
              )}
            </Box>
            {invoice.partyPhone && (
              <Button
                variant="outlined"
                size="small"
                href={`tel:${invoice.partyPhone}`}
                sx={{ ...styles.chip(palette.primaryLight, palette.primary), borderRadius: 1.5, fontSize: '0.65rem', minWidth: 44, textTransform: 'none', borderColor: palette.primary }}
              >
                <PhoneIcon sx={{ fontSize: 16, mr: 0.3 }} /> Call
              </Button>
            )}
          </Box>
          {invoice.partyAddress && (
            <Typography variant="caption" color={palette.textSecondary} sx={{ mt: 1, display: 'block' }}>
              {invoice.partyAddress}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* --- ITEMS --- */}
      <Paper variant="outlined" sx={styles.sectionCard}>
        <Box sx={{ p: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <DescIcon sx={{ fontSize: 18, color: palette.accent }} />
            <Typography variant="caption" fontWeight={700} color={palette.textSecondary} textTransform="uppercase" letterSpacing={0.5}>
              Items ({invoice.items?.length || 0})
            </Typography>
          </Box>
          {(!invoice.items || invoice.items.length === 0) ? (
            <Typography variant="body2" color={palette.textSecondary} sx={{ textAlign: 'center', py: 2 }}>No items</Typography>
          ) : (
            <Box>
              {invoice.items.map((item, i) => (
                <Box key={i} sx={{
                  display: 'flex', alignItems: 'center', gap: 1, py: 1,
                  borderBottom: i < (invoice.items?.length || 0) - 1 ? `1px solid ${palette.border}` : 'none',
                }}>
                  <Avatar sx={{ width: 26, height: 26, bgcolor: alpha(palette.primary, 0.1), color: palette.primary, fontSize: '0.7rem', fontWeight: 700 }}>
                    {i + 1}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.85rem' }}>
                      {item.name || item.productName || 'Product'}
                    </Typography>
                    <Typography variant="caption" color={palette.textSecondary}>
                      {item.quantity || 0} × ₹{(item.price || 0).toLocaleString()}
                      {item.discount > 0 && ` (-${item.discount}%)`}
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={800} color={palette.primary} sx={{ fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                    ₹{(item.totalAmount || item.finalPrice || 0).toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Paper>

      {/* --- TOTALS --- */}
      <Paper variant="outlined" sx={styles.sectionCard}>
        <Box sx={{ p: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" color={palette.textSecondary}>Subtotal</Typography>
            <Typography variant="body2" fontWeight={600}>₹{subtotal.toLocaleString()}</Typography>
          </Box>
          {discount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color={palette.success}>Discount</Typography>
              <Typography variant="body2" fontWeight={600} color={palette.success}>-₹{discount.toLocaleString()}</Typography>
            </Box>
          )}
          {transport > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color={palette.textSecondary}>Transport</Typography>
              <Typography variant="body2" fontWeight={600}>₹{transport.toLocaleString()}</Typography>
            </Box>
          )}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1" fontWeight={800}>Grand Total</Typography>
            <Typography variant="subtitle1" fontWeight={800} color={palette.primary} sx={{ fontSize: '1.1rem' }}>
              ₹{total.toLocaleString()}
            </Typography>
          </Box>
          {invoice.paidAmount !== undefined && invoice.paidAmount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="body2" color={palette.success}>Paid</Typography>
              <Typography variant="body2" fontWeight={600} color={palette.success}>₹{invoice.paidAmount.toLocaleString()}</Typography>
            </Box>
          )}
          {invoice.balanceAmount !== undefined && invoice.balanceAmount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="body2" color={palette.danger}>Balance</Typography>
              <Typography variant="body2" fontWeight={600} color={palette.danger}>₹{invoice.balanceAmount.toLocaleString()}</Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* --- NOTES --- */}
      {invoice.notes && (
        <Paper variant="outlined" sx={styles.sectionCard}>
          <Box sx={{ p: 1.5 }}>
            <Typography variant="caption" fontWeight={700} color={palette.textSecondary} textTransform="uppercase" letterSpacing={0.5}>
              Notes
            </Typography>
            <Typography variant="body2" color={palette.text} sx={{ mt: 0.5 }}>
              {invoice.notes}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* --- ACTIONS --- */}
      <Box sx={{ px: 1, mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button fullWidth variant="outlined" startIcon={<FileCopyIcon />} onClick={() => router.push(`/invoices/new?duplicate=${id}`)}
          sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600 }}>
          Duplicate
        </Button>
        <Button fullWidth variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteOpen(true)}
          sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600 }}>
          Delete
        </Button>
      </Box>

      {/* --- PRINT DIALOG --- */}
      <Dialog open={printOpen} onClose={() => setPrintOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PrintIcon color="primary" /> Print Invoice
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color={palette.textSecondary} gutterBottom>Number of copies: {copies}</Typography>
          <input type="range" min={1} max={10} value={copies} onChange={e => setCopies(parseInt(e.target.value))} style={{ width: '100%' }} />
        </DialogContent>
        <DialogActions sx={{ p: 2, flexDirection: 'column-reverse', gap: 1 }}>
          <Button fullWidth variant="outlined" onClick={() => setPrintOpen(false)}>Cancel</Button>
          <Button fullWidth variant="contained" startIcon={<PrintIcon />}
            onClick={() => { window.open(`/invoices/${id}/print/enhanced?copies=${copies}`, '_blank'); setPrintOpen(false); }}>
            Print
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- DELETE CONFIRM --- */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Invoice?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color={palette.textSecondary}>
            Are you sure you want to delete invoice <strong>{invoice.invoiceNumber}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} variant="outlined" sx={{ flex: 1 }}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" sx={{ flex: 1 }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
