"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  Stack,
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
  useTheme,
  alpha,
  TablePagination,
  TextField,
  InputAdornment,
  Fade,
  Zoom
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Edit as EditIcon,
  PictureAsPdf as PdfIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'draft' | 'cancelled';
  items: number;
  paymentMethod?: string;
  notes?: string;
}

interface RecentInvoicesWidgetProps {
  limit?: number;
  showHeader?: boolean;
  fullWidth?: boolean;
  showPagination?: boolean;
  showSearch?: boolean;
  refreshInterval?: number;
}

export default function RecentInvoicesWidget({
  limit = 10,
  showHeader = true,
  fullWidth = true,
  showPagination = true,
  showSearch = true,
  refreshInterval = 60000 // 1 minute
}: RecentInvoicesWidgetProps) {
  const theme = useTheme();
  const router = useRouter();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(limit);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Fetch invoices from API
  const fetchInvoices = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // For now, using mock data - replace with actual API call
      const mockInvoices: Invoice[] = [
        {
          id: '1',
          invoiceNumber: 'INV-2024-001',
          customerName: 'ABC Corporation Ltd.',
          customerEmail: 'contact@abccorp.com',
          customerPhone: '+91 9876543210',
          date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
          amount: 125000,
          status: 'pending',
          items: 5,
          paymentMethod: 'Bank Transfer',
          notes: 'Quarterly maintenance contract'
        },
        {
          id: '2',
          invoiceNumber: 'INV-2024-002',
          customerName: 'XYZ Industries Pvt Ltd',
          customerEmail: 'billing@xyzind.com',
          customerPhone: '+91 9876543211',
          date: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(),
          amount: 75000,
          status: 'paid',
          items: 3,
          paymentMethod: 'UPI',
          notes: 'Hardware supplies'
        },
        {
          id: '3',
          invoiceNumber: 'INV-2024-003',
          customerName: 'Tech Solutions Inc.',
          customerEmail: 'accounts@techsol.com',
          customerPhone: '+91 9876543212',
          date: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
          dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
          amount: 200000,
          status: 'overdue',
          items: 8,
          paymentMethod: 'Cheque',
          notes: 'Software licensing fees'
        },
        {
          id: '4',
          invoiceNumber: 'INV-2024-004',
          customerName: 'Global Enterprises',
          customerEmail: 'finance@global.com',
          customerPhone: '+91 9876543213',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(),
          amount: 350000,
          status: 'pending',
          items: 12,
          paymentMethod: 'NEFT',
          notes: 'Annual service contract'
        },
        {
          id: '5',
          invoiceNumber: 'INV-2024-005',
          customerName: 'Smart Systems Ltd',
          customerEmail: 'billing@smartsys.com',
          customerPhone: '+91 9876543214',
          date: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20).toISOString(),
          amount: 95000,
          status: 'draft',
          items: 4,
          notes: 'Pending customer approval'
        },
        {
          id: '6',
          invoiceNumber: 'INV-2024-006',
          customerName: 'Digital Dynamics',
          customerEmail: 'accounts@digidyn.com',
          customerPhone: '+91 9876543215',
          date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
          amount: 180000,
          status: 'paid',
          items: 7,
          paymentMethod: 'Credit Card',
          notes: 'Equipment purchase'
        },
        {
          id: '7',
          invoiceNumber: 'INV-2024-007',
          customerName: 'Future Tech Corp',
          customerEmail: 'billing@futuretech.com',
          customerPhone: '+91 9876543216',
          date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 25).toISOString(),
          amount: 420000,
          status: 'pending',
          items: 15,
          paymentMethod: 'Bank Transfer',
          notes: 'Custom development project'
        },
        {
          id: '8',
          invoiceNumber: 'INV-2024-008',
          customerName: 'Innovation Hub',
          customerEmail: 'finance@innohub.com',
          customerPhone: '+91 9876543217',
          date: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
          dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          amount: 85000,
          status: 'overdue',
          items: 3,
          paymentMethod: 'UPI',
          notes: 'Consulting services'
        },
        {
          id: '9',
          invoiceNumber: 'INV-2024-009',
          customerName: 'NextGen Solutions',
          customerEmail: 'accounts@nextgen.com',
          customerPhone: '+91 9876543218',
          date: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 35).toISOString(),
          amount: 275000,
          status: 'paid',
          items: 9,
          paymentMethod: 'RTGS',
          notes: 'Infrastructure setup'
        },
        {
          id: '10',
          invoiceNumber: 'INV-2024-010',
          customerName: 'Quantum Systems',
          customerEmail: 'billing@quantum.com',
          customerPhone: '+91 9876543219',
          date: new Date(Date.now() - 1000 * 60 * 60 * 144).toISOString(),
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 40).toISOString(),
          amount: 150000,
          status: 'cancelled',
          items: 6,
          notes: 'Project cancelled by client'
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setInvoices(mockInvoices);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    
    // Set up auto-refresh
    const interval = setInterval(() => {
      fetchInvoices(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Filter invoices based on search term
  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    
    return invoices.filter(invoice =>
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);

  // Paginated invoices
  const paginatedInvoices = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredInvoices.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredInvoices, page, rowsPerPage]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      case 'draft': return 'info';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, invoice: Invoice) => {
    setAnchorEl(event.currentTarget);
    setSelectedInvoice(invoice);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInvoice(null);
  };

  const handleQuickAction = async (action: string, invoice: Invoice) => {
    handleMenuClose();
    
    switch (action) {
      case 'view':
        router.push(`/invoices/${invoice.id}`);
        break;
      case 'edit':
        router.push(`/invoices/${invoice.id}/edit`);
        break;
      case 'pdf':
        // Generate and download PDF
        try {
          const response = await fetch(`/api/invoices/${invoice.id}/pdf`);
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${invoice.invoiceNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }
        } catch (error) {
          console.error('Failed to download PDF:', error);
        }
        break;
      case 'print':
        window.open(`/invoices/${invoice.id}/print`, '_blank');
        break;
      case 'email':
        router.push(`/invoices/${invoice.id}/send`);
        break;
      case 'whatsapp':
        const message = `Invoice ${invoice.invoiceNumber} for ${formatCurrency(invoice.amount)} is ready. Please check your email for details.`;
        const whatsappUrl = `https://wa.me/${invoice.customerPhone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(`${window.location.origin}/invoices/${invoice.id}/public`);
        break;
      case 'duplicate':
        router.push(`/invoices/new?duplicate=${invoice.id}`);
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
          // Handle delete
          console.log('Delete invoice:', invoice.id);
        }
        break;
    }
  };

  if (loading && invoices.length === 0) {
    return (
      <Card sx={{ width: fullWidth ? '100%' : 'auto' }}>
        {showHeader && (
          <CardHeader
            title={<Skeleton width={200} />}
            action={<Skeleton variant="circular" width={40} height={40} />}
          />
        )}
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {['Invoice #', 'Customer', 'Date', 'Due Date', 'Amount', 'Status', 'Actions'].map((header) => (
                    <TableCell key={header}>
                      <Skeleton width={80} />
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 7 }).map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton width={cellIndex === 1 ? 150 : 80} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        width: fullWidth ? '100%' : 'auto',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          boxShadow: theme.shadows[8],
        }
      }}
    >
      {showHeader && (
        <CardHeader
          avatar={
            <Avatar
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}
            >
              <ReceiptIcon />
            </Avatar>
          }
          title={
            <Typography variant="h6" fontWeight={600}>
              Recent Invoices ({filteredInvoices.length})
            </Typography>
          }
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              {showSearch && (
                <TextField
                  size="small"
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: 200 }}
                />
              )}
              <Tooltip title="Refresh">
                <IconButton
                  onClick={() => fetchInvoices(true)}
                  disabled={refreshing}
                  size="small"
                >
                  <RefreshIcon
                    sx={{
                      animation: refreshing ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      }
                    }}
                  />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<ReceiptIcon />}
                onClick={() => router.push('/invoices/new')}
                size="small"
              >
                New Invoice
              </Button>
            </Stack>
          }
        />
      )}

      <CardContent sx={{ pt: showHeader ? 0 : 2, px: 0 }}>
        <TableContainer component={Paper} elevation={0}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Invoice #</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Items</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedInvoices.map((invoice, index) => (
                <Fade in key={invoice.id} timeout={300 + index * 100}>
                  <TableRow
                    hover
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      }
                    }}
                    onClick={() => router.push(`/invoices/${invoice.id}`)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="primary.main">
                        {invoice.invoiceNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {invoice.customerName}
                        </Typography>
                        {invoice.customerEmail && (
                          <Typography variant="caption" color="text.secondary">
                            {invoice.customerEmail}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(invoice.date)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2"
                        color={
                          new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid'
                            ? 'error.main'
                            : 'text.primary'
                        }
                      >
                        {formatDate(invoice.dueDate)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(invoice.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        color={getStatusColor(invoice.status) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {invoice.items} items
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="View Invoice">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAction('view', invoice);
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Invoice">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAction('edit', invoice);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download PDF">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAction('pdf', invoice);
                            }}
                          >
                            <PdfIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More Actions">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMenuClick(e, invoice);
                            }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                </Fade>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {showPagination && (
          <TablePagination
            component="div"
            count={filteredInvoices.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        )}

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => selectedInvoice && handleQuickAction('view', selectedInvoice)}>
            <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
            <ListItemText>View Invoice</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => selectedInvoice && handleQuickAction('edit', selectedInvoice)}>
            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Edit Invoice</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => selectedInvoice && handleQuickAction('pdf', selectedInvoice)}>
            <ListItemIcon><PdfIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Download PDF</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => selectedInvoice && handleQuickAction('print', selectedInvoice)}>
            <ListItemIcon><PrintIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Print Invoice</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => selectedInvoice && handleQuickAction('email', selectedInvoice)}>
            <ListItemIcon><EmailIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Send via Email</ListItemText>
          </MenuItem>
          {selectedInvoice?.customerPhone && (
            <MenuItem onClick={() => selectedInvoice && handleQuickAction('whatsapp', selectedInvoice)}>
              <ListItemIcon><WhatsAppIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Send via WhatsApp</ListItemText>
            </MenuItem>
          )}
          <MenuItem onClick={() => selectedInvoice && handleQuickAction('copy', selectedInvoice)}>
            <ListItemIcon><CopyIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Copy Link</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => selectedInvoice && handleQuickAction('duplicate', selectedInvoice)}>
            <ListItemIcon><CopyIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Duplicate</ListItemText>
          </MenuItem>
          <MenuItem 
            onClick={() => selectedInvoice && handleQuickAction('delete', selectedInvoice)}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Delete Invoice</ListItemText>
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
}