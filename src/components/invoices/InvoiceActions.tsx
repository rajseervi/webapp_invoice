"use client";
import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  FileCopy as CopyIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  PictureAsPdf as PdfIcon,
  GetApp as ExportIcon,
  Send as SendIcon,
  WhatsApp as WhatsAppIcon,
  Sms as SmsIcon
} from '@mui/icons-material';

interface Invoice {
  id: string;
  invoiceNumber: string;
  partyName: string;
  partyEmail?: string;
  partyPhone?: string;
  total: number;
  status: string;
  archived?: boolean;
  date: string;
}

interface InvoiceActionsProps {
  invoice: Invoice;
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onPrint: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
  onArchive: (invoice: Invoice) => void;
  onDuplicate: (invoice: Invoice) => void;
  onStatusChange: (invoice: Invoice, status: string) => void;
  onEmail: (invoice: Invoice, email: string, template: string) => void;
  onWhatsApp: (invoice: Invoice, phone: string) => void;
  onSms: (invoice: Invoice, phone: string) => void;
  disabled?: boolean;
}

const statusOptions = [
  { value: 'draft', label: 'Draft', color: 'default' },
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'paid', label: 'Paid', color: 'success' },
  { value: 'overdue', label: 'Overdue', color: 'error' },
  { value: 'cancelled', label: 'Cancelled', color: 'default' }
];

const emailTemplates = [
  { value: 'standard', label: 'Standard Invoice' },
  { value: 'reminder', label: 'Payment Reminder' },
  { value: 'thank_you', label: 'Thank You' },
  { value: 'overdue', label: 'Overdue Notice' }
];

export default function InvoiceActions({
  invoice,
  onView,
  onEdit,
  onPrint,
  onDelete,
  onArchive,
  onDuplicate,
  onStatusChange,
  onEmail,
  onWhatsApp,
  onSms,
  disabled = false
}: InvoiceActionsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Email dialog state
  const [emailAddress, setEmailAddress] = useState(invoice.partyEmail || '');
  const [emailTemplate, setEmailTemplate] = useState('standard');
  const [emailSubject, setEmailSubject] = useState(`Invoice ${invoice.invoiceNumber}`);
  const [emailMessage, setEmailMessage] = useState('');

  // Share dialog state
  const [shareMethod, setShareMethod] = useState('email');
  const [sharePhone, setSharePhone] = useState(invoice.partyPhone || '');

  // Status dialog state
  const [newStatus, setNewStatus] = useState(invoice.status);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: () => void) => {
    action();
    handleMenuClose();
  };

  const handleEmailSend = async () => {
    if (!emailAddress.trim()) return;
    
    setLoading(true);
    try {
      await onEmail(invoice, emailAddress, emailTemplate);
      setEmailDialogOpen(false);
      setEmailAddress('');
      setEmailMessage('');
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!sharePhone.trim()) return;
    onWhatsApp(invoice, sharePhone);
    setShareDialogOpen(false);
  };

  const handleSmsShare = () => {
    if (!sharePhone.trim()) return;
    onSms(invoice, sharePhone);
    setShareDialogOpen(false);
  };

  const handleStatusUpdate = () => {
    onStatusChange(invoice, newStatus);
    setStatusDialogOpen(false);
  };

  const handleDelete = () => {
    onDelete(invoice);
    setDeleteDialogOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.color || 'default';
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={handleMenuOpen}
        disabled={disabled}
      >
        <MoreVertIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 200 }
        }}
      >
        <MenuItem onClick={() => handleAction(() => onView(invoice))}>
          <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
          <ListItemText>View Invoice</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleAction(() => onEdit(invoice))}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleAction(() => onPrint(invoice))}>
          <ListItemIcon><PrintIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Print</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleAction(() => onDuplicate(invoice))}>
          <ListItemIcon><CopyIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => {
          setEmailDialogOpen(true);
          handleMenuClose();
        }}>
          <ListItemIcon><EmailIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Email Invoice</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => {
          setShareDialogOpen(true);
          handleMenuClose();
        }}>
          <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => {
          setStatusDialogOpen(true);
          handleMenuClose();
        }}>
          <ListItemIcon><PaymentIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Update Status</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => handleAction(() => onArchive(invoice))}>
          <ListItemIcon><ArchiveIcon fontSize="small" /></ListItemIcon>
          <ListItemText>
            {invoice.archived ? 'Unarchive' : 'Archive'}
          </ListItemText>
        </MenuItem>

        <MenuItem 
          onClick={() => {
            setDeleteDialogOpen(true);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Email Dialog */}
      <Dialog 
        open={emailDialogOpen} 
        onClose={() => setEmailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Email Invoice</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Invoice Details
                  </Typography>
                  <Typography variant="body2">
                    Invoice: {invoice.invoiceNumber}
                  </Typography>
                  <Typography variant="body2">
                    Party: {invoice.partyName}
                  </Typography>
                  <Typography variant="body2">
                    Amount: {formatCurrency(invoice.total)}
                  </Typography>
                  <Typography variant="body2">
                    Status: <Chip 
                      size="small" 
                      label={invoice.status} 
                      color={getStatusColor(invoice.status) as any}
                    />
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Template</InputLabel>
                <Select
                  value={emailTemplate}
                  label="Template"
                  onChange={(e) => setEmailTemplate(e.target.value)}
                >
                  {emailTemplates.map((template) => (
                    <MenuItem key={template.value} value={template.value}>
                      {template.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                multiline
                rows={4}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Add a personal message (optional)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleEmailSend}
            variant="contained"
            disabled={!emailAddress.trim() || loading}
            startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog 
        open={shareDialogOpen} 
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Share Invoice</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Share invoice {invoice.invoiceNumber} with {invoice.partyName}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                value={sharePhone}
                onChange={(e) => setSharePhone(e.target.value)}
                placeholder="+91 XXXXXXXXXX"
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<WhatsAppIcon />}
                  onClick={handleWhatsAppShare}
                  disabled={!sharePhone.trim()}
                  sx={{ 
                    color: '#25D366', 
                    borderColor: '#25D366',
                    '&:hover': { borderColor: '#25D366', backgroundColor: 'rgba(37, 211, 102, 0.04)' }
                  }}
                >
                  WhatsApp
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SmsIcon />}
                  onClick={handleSmsShare}
                  disabled={!sharePhone.trim()}
                >
                  SMS
                </Button>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog 
        open={statusDialogOpen} 
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Invoice Status</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Update status for invoice {invoice.invoiceNumber}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newStatus}
                  label="Status"
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  {statusOptions.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          size="small" 
                          label={status.label} 
                          color={status.color as any}
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {newStatus === 'paid' && (
              <Grid item xs={12}>
                <Alert severity="success">
                  Marking this invoice as paid will update your revenue reports.
                </Alert>
              </Grid>
            )}

            {newStatus === 'cancelled' && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  Cancelled invoices will be excluded from revenue calculations.
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleStatusUpdate}
            variant="contained"
            disabled={newStatus === invoice.status}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
      >
        <DialogTitle>Delete Invoice</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action cannot be undone!
          </Alert>
          <Typography>
            Are you sure you want to delete invoice <strong>{invoice.invoiceNumber}</strong>?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            This will permanently remove the invoice and all associated data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDelete}
            color="error"
            variant="contained"
          >
            Delete Invoice
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}