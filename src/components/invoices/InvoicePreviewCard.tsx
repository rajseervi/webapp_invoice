"use client";
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Grid,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Stack,
  Avatar,
  Divider,
  LinearProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Copy as CopyIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  AccountBalance as GstIcon,
  Description as RegularIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { format, parseISO, isValid } from 'date-fns';
import { useRouter } from 'next/navigation';

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  partyName: string;
  partyId?: string;
  partyGstin?: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  type?: 'gst' | 'regular';
  cgst?: number;
  sgst?: number;
  igst?: number;
  paidAmount?: number;
  balanceAmount?: number;
  isGstInvoice?: boolean;
  createdAt: string;
}

interface InvoicePreviewCardProps {
  invoice: Invoice;
  onView?: (invoice: Invoice) => void;
  onEdit?: (invoice: Invoice) => void;
  onDelete?: (invoice: Invoice) => void;
  onDuplicate?: (invoice: Invoice) => void;
  onStatusChange?: (invoice: Invoice, status: string) => void;
  onShare?: (invoice: Invoice, method: string) => void;
  compact?: boolean;
  showActions?: boolean;
  elevation?: number;
}

export default function InvoicePreviewCard({
  invoice,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
  onShare,
  compact = false,
  showActions = true,
  elevation = 1
}: InvoicePreviewCardProps) {
  const theme = useTheme();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  // Computed values
  const isGstInvoice = invoice.type === 'gst' || invoice.isGstInvoice || 
                      invoice.cgst || invoice.sgst || invoice.igst || invoice.partyGstin;
  
  const gstTotal = (invoice.cgst || 0) + (invoice.sgst || 0) + (invoice.igst || 0);
  const balanceAmount = invoice.balanceAmount || (invoice.total - (invoice.paidAmount || 0));
  const paymentProgress = invoice.total > 0 ? ((invoice.paidAmount || 0) / invoice.total) * 100 : 0;
  
  const statusConfig = {
    draft: { color: 'default', icon: <ScheduleIcon />, label: 'Draft' },
    sent: { color: 'info', icon: <EmailIcon />, label: 'Sent' },
    paid: { color: 'success', icon: <CheckCircleIcon />, label: 'Paid' },
    overdue: { color: 'error', icon: <WarningIcon />, label: 'Overdue' },
    cancelled: { color: 'warning', icon: <DeleteIcon />, label: 'Cancelled' }
  }[invoice.status] as { color: any, icon: React.ReactNode, label: string };

  // Helper functions
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'dd MMM yyyy') : dateString;
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: string) => {
    handleMenuClose();
    
    switch (action) {
      case 'view':
        onView?.(invoice) || router.push(`/invoices/${invoice.id}`);
        break;
      case 'edit':
        onEdit?.(invoice) || router.push(`/invoices/${invoice.id}/edit`);
        break;
      case 'delete':
        onDelete?.(invoice);
        break;
      case 'duplicate':
        onDuplicate?.(invoice);
        break;
      case 'print':
        router.push(`/invoices/${invoice.id}/print`);
        break;
      case 'share-whatsapp':
        onShare?.(invoice, 'whatsapp');
        break;
      case 'share-email':
        onShare?.(invoice, 'email');
        break;
      case 'mark-paid':
        onStatusChange?.(invoice, 'paid');
        break;
      case 'mark-sent':
        onStatusChange?.(invoice, 'sent');
        break;
    }
  };

  const handleCardClick = () => {
    onView?.(invoice) || router.push(`/invoices/${invoice.id}`);
  };

  return (
    <Card
      elevation={elevation}
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          elevation: elevation + 2,
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4]
        },
        position: 'relative',
        overflow: 'visible'
      }}
      onClick={handleCardClick}
    >
      {/* Status Indicator */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          bgcolor: statusConfig.color === 'default' ? 'grey.300' : `${statusConfig.color}.main`,
          borderRadius: '4px 4px 0 0'
        }}
      />

      <CardContent sx={{ pb: compact ? 2 : 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: isGstInvoice ? theme.palette.primary.main : theme.palette.secondary.main,
                width: compact ? 32 : 40,
                height: compact ? 32 : 40
              }}
            >
              {isGstInvoice ? <GstIcon fontSize="small" /> : <RegularIcon fontSize="small" />}
            </Avatar>
            <Box>
              <Typography variant={compact ? "subtitle2" : "h6"} fontWeight="bold" noWrap>
                {invoice.invoiceNumber}
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Chip
                  label={isGstInvoice ? 'GST' : 'Regular'}
                  size="small"
                  color={isGstInvoice ? 'primary' : 'secondary'}
                  variant="outlined"
                />
                <Chip
                  icon={statusConfig.icon}
                  label={statusConfig.label}
                  size="small"
                  color={statusConfig.color}
                  variant="outlined"
                />
              </Stack>
            </Box>
          </Box>

          {showActions && (
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{ ml: 1 }}
            >
              <MoreVertIcon />
            </IconButton>
          )}
        </Box>

        {/* Invoice Details */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary" noWrap>
                {invoice.partyName}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {formatDate(invoice.date)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography variant={compact ? "h6" : "h5"} color="primary" fontWeight="bold">
                {formatCurrency(invoice.total)}
              </Typography>
              {!compact && gstTotal > 0 && (
                <Typography variant="caption" color="text.secondary">
                  GST: {formatCurrency(gstTotal)}
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Payment Progress */}
        {!compact && invoice.paidAmount && invoice.paidAmount > 0 && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Payment Progress
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {paymentProgress.toFixed(0)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={paymentProgress}
              sx={{ height: 6, borderRadius: 3 }}
              color={paymentProgress === 100 ? 'success' : 'primary'}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="caption" color="success.main">
                Paid: {formatCurrency(invoice.paidAmount)}
              </Typography>
              {balanceAmount > 0 && (
                <Typography variant="caption" color="error.main">
                  Balance: {formatCurrency(balanceAmount)}
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {/* Items Summary */}
        {!compact && (
          <Box sx={{ mt: 2, p: 1, bgcolor: alpha(theme.palette.background.paper, 0.5), borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}
              {invoice.items.length > 0 && (
                <span> • {invoice.items.reduce((sum, item) => sum + item.quantity, 0)} total qty</span>
              )}
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Quick Actions */}
      {!compact && showActions && (
        <CardActions sx={{ pt: 0, justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="View Details">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleAction('view'); }}>
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Invoice">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleAction('edit'); }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print Invoice">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleAction('print'); }}>
                <PrintIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          {invoice.status !== 'paid' && (
            <Button
              size="small"
              variant="outlined"
              color="success"
              onClick={(e) => { e.stopPropagation(); handleAction('mark-paid'); }}
              startIcon={<CheckCircleIcon />}
            >
              Mark Paid
            </Button>
          )}
        </CardActions>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          elevation: 8,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleAction('view')}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleAction('edit')}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Invoice</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleAction('duplicate')}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => handleAction('print')}>
          <ListItemIcon>
            <PrintIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Print</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleAction('share-whatsapp')}>
          <ListItemIcon>
            <WhatsAppIcon fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Share via WhatsApp</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleAction('share-email')}>
          <ListItemIcon>
            <EmailIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share via Email</ListItemText>
        </MenuItem>
        
        <Divider />
        
        {invoice.status === 'draft' && (
          <MenuItem onClick={() => handleAction('mark-sent')}>
            <ListItemIcon>
              <EmailIcon fontSize="small" color="info" />
            </ListItemIcon>
            <ListItemText>Mark as Sent</ListItemText>
          </MenuItem>
        )}
        
        {invoice.status !== 'paid' && (
          <MenuItem onClick={() => handleAction('mark-paid')}>
            <ListItemIcon>
              <CheckCircleIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Mark as Paid</ListItemText>
          </MenuItem>
        )}
        
        <Divider />
        
        <MenuItem onClick={() => handleAction('delete')} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Invoice</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
}