"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Zoom,
  useTheme,
  alpha,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  LinearProgress
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  ContentCopy as CopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  AccountBalance as GstIcon,
  Description as RegularIcon,
  Add as AddIcon,
  Timeline as TimelineIcon,
  Payment as PaymentIcon,
  LocalShipping as ShippingIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { format, parseISO, isValid } from 'date-fns';
import { useRouter } from 'next/navigation';

interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  hsn?: string;
  tax?: number;
  discount?: number;
  unit?: string;
  category?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  partyName: string;
  partyId?: string;
  partyGstin?: string;
  partyAddress?: string;
  partyPhone?: string;
  partyEmail?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  type?: 'gst' | 'regular';
  notes?: string;
  terms?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  paymentStatus?: 'pending' | 'partial' | 'paid';
  paidAmount?: number;
  balanceAmount?: number;
  isGstInvoice?: boolean;
  companyDetails?: {
    name: string;
    address: string;
    gstin?: string;
    phone?: string;
    email?: string;
  };
}

interface EnhancedInvoiceDetailsProps {
  invoice: Invoice;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onStatusChange?: (status: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

export default function EnhancedInvoiceDetails({
  invoice,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
  showActions = true,
  compact = false
}: EnhancedInvoiceDetailsProps) {
  const theme = useTheme();
  const router = useRouter();
  
  // State management
  const [showFullDetails, setShowFullDetails] = useState(!compact);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    items: true,
    summary: true,
    party: false,
    timeline: false
  });

  // Computed values
  const isGstInvoice = invoice.type === 'gst' || invoice.isGstInvoice || 
                      invoice.cgst || invoice.sgst || invoice.igst || invoice.partyGstin;
  
  const gstTotal = (invoice.cgst || 0) + (invoice.sgst || 0) + (invoice.igst || 0);
  const balanceAmount = invoice.balanceAmount || (invoice.total - (invoice.paidAmount || 0));
  
  const statusColor = {
    draft: 'default',
    sent: 'info',
    paid: 'success',
    overdue: 'error',
    cancelled: 'warning'
  }[invoice.status] as 'default' | 'info' | 'success' | 'error' | 'warning';

  const paymentProgress = invoice.total > 0 ? ((invoice.paidAmount || 0) / invoice.total) * 100 : 0;

  // Helper functions
  const formatDate = (dateInput: string | { toDate: () => Date } | undefined | null) => {
    if (dateInput === undefined || dateInput === null) {
      return 'N/A'; // Or any other appropriate fallback string
    }
    try {
      let date;
      if (typeof dateInput === 'object' && 'toDate' in dateInput && typeof dateInput.toDate === 'function') {
        date = dateInput.toDate();
      } else if (typeof dateInput === 'string') {
        date = parseISO(dateInput);
      } else {
        return String(dateInput); // Fallback for unexpected types
      }
      return isValid(date) ? format(date, 'dd MMM yyyy') : String(dateInput);
    } catch (e) {
      console.error("Error formatting date:", e);
      return String(dateInput); // Ensure a string is always returned on error
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleSectionToggle = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCreateNewInvoice = (type: 'gst' | 'regular') => {
    if (type === 'gst') {
      router.push('/invoices/gst/new');
    } else {
      router.push('/invoices/new');
    }
  };

  const handleShare = (method: string) => {
    const invoiceUrl = `${window.location.origin}/invoices/${invoice.id}`;
    const message = `Invoice ${invoice.invoiceNumber} - ${formatCurrency(invoice.total)}\nView: ${invoiceUrl}`;

    switch (method) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=Invoice ${invoice.invoiceNumber}&body=${encodeURIComponent(message)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(invoiceUrl);
        break;
    }
    setShareDialogOpen(false);
  };

  // Render components
  const renderQuickActions = () => (
    <Card sx={{ mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
      <CardContent sx={{ pb: 1 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon color="primary" />
          Quick Actions
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Button
            variant="contained"
            startIcon={<GstIcon />}
            onClick={() => handleCreateNewInvoice('gst')}
            sx={{ minWidth: 160 }}
          >
            New GST Invoice
          </Button>
          <Button
            variant="outlined"
            startIcon={<RegularIcon />}
            onClick={() => handleCreateNewInvoice('regular')}
            sx={{ minWidth: 160 }}
          >
            New Regular Invoice
          </Button>
          {onDuplicate && (
            <Button
              variant="outlined"
              startIcon={<CopyIcon />}
              onClick={onDuplicate}
              color="secondary"
            >
              Duplicate This
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  const renderInvoiceHeader = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: isGstInvoice ? theme.palette.primary.main : theme.palette.secondary.main,
                  width: 56,
                  height: 56
                }}
              >
                {isGstInvoice ? <GstIcon /> : <RegularIcon />}
              </Avatar>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  {invoice.invoiceNumber}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={isGstInvoice ? 'GST Invoice' : 'Regular Invoice'}
                    color={isGstInvoice ? 'primary' : 'secondary'}
                    size="small"
                  />
                  <Chip
                    label={invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'N/A'}
                    color={statusColor}
                    size="small"
                  />
                </Stack>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Typography variant="h3" color="primary" gutterBottom>
                {formatCurrency(invoice.total)}
              </Typography>
              {balanceAmount > 0 && (
                <Typography variant="body1" color="error">
                  Balance: {formatCurrency(balanceAmount)}
                </Typography>
              )}
              {invoice.paidAmount && invoice.paidAmount > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Payment Progress
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={paymentProgress}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {paymentProgress.toFixed(1)}% paid
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>

      {showActions && (
        <CardActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
          <Stack direction="row" spacing={1}>
            {onEdit && (
              <Button
                startIcon={<EditIcon />}
                onClick={onEdit}
                variant="outlined"
                size="small"
              >
                Edit
              </Button>
            )}
            <Button
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
              variant="outlined"
              size="small"
            >
              Print
            </Button>
            <Button
              startIcon={<ShareIcon />}
              onClick={() => setShareDialogOpen(true)}
              variant="outlined"
              size="small"
            >
              Share
            </Button>
          </Stack>

          <Stack direction="row" spacing={1}>
            {onStatusChange && invoice.status !== 'paid' && (
              <Button
                startIcon={<CheckCircleIcon />}
                onClick={() => onStatusChange('paid')}
                variant="contained"
                size="small"
                color="success"
              >
                Mark Paid
              </Button>
            )}
            {onStatusChange && invoice.status === 'draft' && (
              <Button
                startIcon={<EmailIcon />}
                onClick={() => onStatusChange('sent')}
                variant="contained"
                size="small"
              >
                Mark Sent
              </Button>
            )}
          </Stack>
        </CardActions>
      )}
    </Card>
  );

  const renderInvoiceInfo = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon color="primary" />
              Invoice Information
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Invoice Date"
                  secondary={formatDate(invoice.date)}
                />
              </ListItem>
              {invoice.dueDate && (
                <ListItem>
                  <ListItemText
                    primary="Due Date"
                    secondary={formatDate(invoice.dueDate)}
                  />
                </ListItem>
              )}
              <ListItem>
                <ListItemText
                  primary="Created"
                  secondary={formatDate(invoice.createdAt)}
                />
              </ListItem>
              {invoice.updatedAt && (
                <ListItem>
                  <ListItemText
                    primary="Last Updated"
                    secondary={formatDate(invoice.updatedAt)}
                  />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Accordion expanded={expandedSections.party} onChange={() => handleSectionToggle('party')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon color="primary" />
              Party Details
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Name"
                  secondary={invoice.partyName}
                />
              </ListItem>
              {invoice.partyGstin && (
                <ListItem>
                  <ListItemText
                    primary="GSTIN"
                    secondary={invoice.partyGstin}
                  />
                </ListItem>
              )}
              {invoice.partyAddress && (
                <ListItem>
                  <ListItemText
                    primary="Address"
                    secondary={invoice.partyAddress}
                  />
                </ListItem>
              )}
              {invoice.partyPhone && (
                <ListItem>
                  <ListItemText
                    primary="Phone"
                    secondary={invoice.partyPhone}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      size="small"
                      onClick={() => handleShare('whatsapp')}
                      color="success"
                    >
                      <WhatsAppIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              )}
              {invoice.partyEmail && (
                <ListItem>
                  <ListItemText
                    primary="Email"
                    secondary={invoice.partyEmail}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      size="small"
                      onClick={() => handleShare('email')}
                      color="primary"
                    >
                      <EmailIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              )}
            </List>
          </AccordionDetails>
        </Accordion>
      </Grid>
    </Grid>
  );

  const renderItemsTable = () => {
    const hasDiscounts = invoice.items?.some(item => item.discount && item.discount > 0);
    const hasTax = invoice.items?.some(item => item.tax && item.tax > 0);
    const hasCategories = invoice.items?.some(item => item.category);

    const groupedItems = hasCategories
      ? invoice.items?.reduce((acc, item, index) => {
          const category = item.category || 'Uncategorized';
          if (!acc[category]) acc[category] = [];
          acc[category].push({ ...item, originalIndex: index });
          return acc;
        }, {} as Record<string, (InvoiceItem & { originalIndex: number })[]>)
      : { 'All Items': invoice.items?.map((item, index) => ({ ...item, originalIndex: index })) || [] };

    return (
      <Accordion expanded={expandedSections.items} onChange={() => handleSectionToggle('items')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon color="primary" />
            Invoice Items
            <Badge badgeContent={invoice.items?.length || 0} color="primary" />
            {hasCategories && (
              <Chip
                label={`${Object.keys(groupedItems || {}).length} categories`}
                size="small"
                variant="outlined"
                color="secondary"
              />
            )}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          {/* Mobile View */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {Object.entries(groupedItems || {}).map(([category, items]) => (
              <Box key={category} sx={{ mb: 2 }}>
                {hasCategories && (
                  <Box sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    p: 1.5,
                    borderRadius: 1,
                    mb: 1
                  }}>
                    <Typography variant="subtitle2" color="primary" fontWeight="bold">
                      {category} ({items.length} items)
                    </Typography>
                  </Box>
                )}
                {items.map((item, idx) => (
                  <Card key={idx} sx={{ mb: 2, border: 1, borderColor: 'divider' }}>
                    <CardContent sx={{ pb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" fontWeight="medium" gutterBottom>
                            {item.originalIndex + 1}. {item.name || item.description || 'N/A'}
                          </Typography>
                          {item.category && !hasCategories && (
                            <Chip
                              label={item.category}
                              size="small"
                              variant="outlined"
                              sx={{ mb: 1 }}
                            />
                          )}
                        </Box>
                        <Typography variant="h6" color="primary" fontWeight="bold">
                          {formatCurrency(item.amount)}
                        </Typography>
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Quantity</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {item.quantity} {item.unit || 'pcs'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Rate</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(item.rate)}
                          </Typography>
                        </Grid>

                        {isGstInvoice && item.hsn && (
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">HSN Code</Typography>
                            <Typography variant="body2">{item.hsn}</Typography>
                          </Grid>
                        )}

                        {hasDiscounts && item.discount && item.discount > 0 && (
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Discount</Typography>
                            <Typography variant="body2" color="error">
                              -{formatCurrency(item.discount)}
                            </Typography>
                          </Grid>
                        )}

                        {hasTax && item.tax && item.tax > 0 && (
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Tax</Typography>
                            <Typography variant="body2" color="primary">
                              {formatCurrency(item.tax)}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ))}
          </Box>

          {/* Desktop View */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            {Object.entries(groupedItems || {}).map(([category, items]) => (
              <Box key={category}>
                {hasCategories && (
                  <Box sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    p: 2,
                    borderRadius: 1,
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <Typography variant="subtitle1" color="primary" fontWeight="bold">
                      {category}
                    </Typography>
                    <Chip
                      label={`${items.length} items`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                )}

                <TableContainer sx={{ mb: hasCategories ? 3 : 0 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.grey[100], 0.5) }}>
                        <TableCell sx={{ fontWeight: 'bold', width: '60px' }}>S.No.</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', minWidth: '200px' }}>Description</TableCell>
                        {isGstInvoice && (
                          <TableCell align="center" sx={{ fontWeight: 'bold', width: '100px' }}>HSN</TableCell>
                        )}
                        <TableCell align="center" sx={{ fontWeight: 'bold', width: '100px' }}>Qty</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', width: '80px' }}>Unit</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', width: '120px' }}>Rate</TableCell>
                        {hasDiscounts && (
                          <TableCell align="right" sx={{ fontWeight: 'bold', width: '100px' }}>Discount</TableCell>
                        )}
                        {hasTax && (
                          <TableCell align="right" sx={{ fontWeight: 'bold', width: '100px' }}>Tax</TableCell>
                        )}
                        <TableCell align="right" sx={{ fontWeight: 'bold', width: '140px' }}>Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item, idx) => (
                        <TableRow
                          key={idx}
                          hover
                          sx={{
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.04)
                            },
                            borderLeft: 3,
                            borderLeftColor: 'transparent',
                            '&:hover .MuiTableCell-root': {
                              borderLeftColor: theme.palette.primary.main
                            }
                          }}
                        >
                          <TableCell>
                            <Box sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: 'primary.main',
                              fontWeight: 'bold',
                              fontSize: '0.875rem'
                            }}>
                              {item.originalIndex + 1}
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium" gutterBottom>
                                {item.name || item.description || 'N/A'}
                              </Typography>
                              {item.category && !hasCategories && (
                                <Chip
                                  label={item.category}
                                  size="small"
                                  variant="outlined"
                                  color="secondary"
                                  sx={{ fontSize: '0.75rem', height: 20 }}
                                />
                              )}
                            </Box>
                          </TableCell>

                          {isGstInvoice && (
                            <TableCell align="center">
                              <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                                {item.hsn || '-'}
                              </Typography>
                            </TableCell>
                          )}

                          <TableCell align="center">
                            <Box sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 0.5
                            }}>
                              <Typography variant="body2" fontWeight="medium">
                                {item.quantity}
                              </Typography>
                            </Box>
                          </TableCell>

                          <TableCell align="center">
                            <Typography variant="body2" color="text.secondary">
                              {item.unit || 'pcs'}
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="medium">
                              {formatCurrency(item.rate)}
                            </Typography>
                          </TableCell>

                          {hasDiscounts && (
                            <TableCell align="right">
                              {item.discount && item.discount > 0 ? (
                                <Typography variant="body2" color="error" fontWeight="medium">
                                  -{formatCurrency(item.discount)}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.disabled">
                                  -
                                </Typography>
                              )}
                            </TableCell>
                          )}

                          {hasTax && (
                            <TableCell align="right">
                              {item.tax && item.tax > 0 ? (
                                <Typography variant="body2" color="primary" fontWeight="medium">
                                  {formatCurrency(item.tax)}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.disabled">
                                  -
                                </Typography>
                              )}
                            </TableCell>
                          )}

                          <TableCell align="right">
                            <Box sx={{
                              bgcolor: alpha(theme.palette.success.main, 0.1),
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              display: 'inline-block'
                            }}>
                              <Typography variant="body2" fontWeight="bold" color="success.dark">
                                {formatCurrency(item.amount)}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Category Subtotal */}
                      {hasCategories && items.length > 1 && (
                        <TableRow sx={{ bgcolor: alpha(theme.palette.grey[100], 0.3) }}>
                          <TableCell colSpan={isGstInvoice ? (hasDiscounts && hasTax ? 8 : hasDiscounts || hasTax ? 7 : 6) : (hasDiscounts && hasTax ? 7 : hasDiscounts || hasTax ? 6 : 5)}>
                            <Typography variant="body2" fontWeight="bold" color="text.secondary">
                              {category} Subtotal
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold" color="primary">
                              {formatCurrency(items.reduce((sum, item) => sum + item.amount, 0))}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))}
          </Box>

          {/* Empty State */}
          {(!invoice.items || invoice.items.length === 0) && (
            <Box sx={{
              textAlign: 'center',
              py: 8,
              bgcolor: alpha(theme.palette.grey[100], 0.3),
              borderRadius: 1
            }}>
              <ReceiptIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No items found
              </Typography>
              <Typography variant="body2" color="text.disabled">
                This invoice doesn't contain any items yet.
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderSummary = () => (
    <Accordion expanded={expandedSections.summary} onChange={() => handleSectionToggle('summary')}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon color="primary" />
          Invoice Summary
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box sx={{ bgcolor: alpha(theme.palette.background.paper, 0.5), p: 2, borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">Subtotal:</Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" fontWeight="medium">
                    {formatCurrency(invoice.subtotal)}
                  </Typography>
                </Grid>

                {invoice.discount && invoice.discount > 0 && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="error">Discount:</Typography>
                    </Grid>
                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" color="error">
                        -{formatCurrency(invoice.discount)}
                      </Typography>
                    </Grid>
                  </>
                )}

                {isGstInvoice && (
                  <>
                    {invoice.cgst !== undefined && invoice.cgst > 0 && (
                      <>
                        <Grid item xs={6}>
                          <Typography variant="body2">CGST:</Typography>
                        </Grid>
                        <Grid item xs={6} sx={{ textAlign: 'right' }}>
                          <Typography variant="body2">
                            {formatCurrency(invoice.cgst)}
                          </Typography>
                        </Grid>
                      </>
                    )}

                    {invoice.sgst !== undefined && invoice.sgst > 0 && (
                      <>
                        <Grid item xs={6}>
                          <Typography variant="body2">SGST:</Typography>
                        </Grid>
                        <Grid item xs={6} sx={{ textAlign: 'right' }}>
                          <Typography variant="body2">
                            {formatCurrency(invoice.sgst)}
                          </Typography>
                        </Grid>
                      </>
                    )}

                    {invoice.igst !== undefined && invoice.igst > 0 && (
                      <>
                        <Grid item xs={6}>
                          <Typography variant="body2">IGST:</Typography>
                        </Grid>
                        <Grid item xs={6} sx={{ textAlign: 'right' }}>
                          <Typography variant="body2">
                            {formatCurrency(invoice.igst)}
                          </Typography>
                        </Grid>
                      </>
                    )}

                    {gstTotal > 0 && (
                      <>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="primary">Total GST:</Typography>
                        </Grid>
                        <Grid item xs={6} sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" color="primary" fontWeight="medium">
                            {formatCurrency(gstTotal)}
                          </Typography>
                        </Grid>
                      </>
                    )}
                  </>
                )}

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="h6" color="primary">Total:</Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    {formatCurrency(invoice.total)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Payment Status
                </Typography>
                <Typography variant="h6" color="success.main" gutterBottom>
                  {formatCurrency(invoice.paidAmount || 0)} paid
                </Typography>
                {balanceAmount > 0 && (
                  <Typography variant="body2" color="error">
                    {formatCurrency(balanceAmount)} pending
                  </Typography>
                )}
                <LinearProgress
                  variant="determinate"
                  value={paymentProgress}
                  sx={{ mt: 2, height: 8, borderRadius: 4 }}
                  color="success"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );

  const renderNotes = () => (
    invoice.notes || invoice.terms ? (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          {invoice.notes && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Notes:
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {invoice.notes}
              </Typography>
            </Box>
          )}
          
          {invoice.terms && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Terms & Conditions:
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {invoice.terms}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    ) : null
  );

  return (
    <Box sx={{ maxWidth: '100%', margin: 'auto' }}>
      {/* Quick Actions */}
      {renderQuickActions()}
      
      {/* Invoice Header */}
      {renderInvoiceHeader()}
      
      {/* Invoice Information */}
      {showFullDetails && renderInvoiceInfo()}
      
      {/* Items Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          {renderItemsTable()}
        </CardContent>
      </Card>
      
      {/* Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {renderSummary()}
        </CardContent>
      </Card>
      
      {/* Notes and Terms */}
      {renderNotes()}
      
      {/* Floating Action Button for Quick Actions */}
      <Zoom in={true}>
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000
          }}
          onClick={() => setShowFullDetails(!showFullDetails)}
        >
          {showFullDetails ? <VisibilityOffIcon /> : <VisibilityIcon />}
        </Fab>
      </Zoom>
      
      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
        <DialogTitle>Share Invoice</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Button
              startIcon={<WhatsAppIcon />}
              onClick={() => handleShare('whatsapp')}
              variant="outlined"
              color="success"
              fullWidth
            >
              Share via WhatsApp
            </Button>
            <Button
              startIcon={<EmailIcon />}
              onClick={() => handleShare('email')}
              variant="outlined"
              fullWidth
            >
              Share via Email
            </Button>
            <Button
              startIcon={<CopyIcon />}
              onClick={() => handleShare('copy')}
              variant="outlined"
              fullWidth
            >
              Copy Link
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}