"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Tooltip,
  Avatar,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Assessment as AssessmentIcon,
  Star as StarIcon,
  History as HistoryIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { EnhancedSupplier } from '@/types/enhancedPurchase';
import EnhancedSupplierService from '@/services/enhancedSupplierService';

interface SupplierStats {
  total: number;
  active: number;
  inactive: number;
  highCredit: number;
  totalBalance: number;
}

export default function SuppliersPage() {
  const router = useRouter();
  const { userId } = useCurrentUser();

  // Data states
  const [suppliers, setSuppliers] = useState<EnhancedSupplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<EnhancedSupplier[]>([]);
  const [stats, setStats] = useState<SupplierStats>({
    total: 0,
    active: 0,
    inactive: 0,
    highCredit: 0,
    totalBalance: 0
  });
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<EnhancedSupplier | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<EnhancedSupplier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load suppliers
  useEffect(() => {
    loadSuppliers();
  }, [userId]);

  // Filter suppliers based on search
  useEffect(() => {
    const filtered = suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone?.includes(searchTerm) ||
      supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.gstin?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSuppliers(filtered);
  }, [suppliers, searchTerm]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const suppliersData = await EnhancedSupplierService.getSuppliers(userId);
      setSuppliers(suppliersData);
      
      // Calculate stats
      const stats: SupplierStats = {
        total: suppliersData.length,
        active: suppliersData.filter(s => s.isActive).length,
        inactive: suppliersData.filter(s => !s.isActive).length,
        highCredit: suppliersData.filter(s => (s.creditLimit || 0) > 100000).length,
        totalBalance: suppliersData.reduce((sum, s) => sum + (s.currentBalance || 0), 0)
      };
      setStats(stats);
      
    } catch (err) {
      console.error('Error loading suppliers:', err);
      setError('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = () => {
    router.push('/suppliers/new');
  };

  const handleEditSupplier = (supplier: EnhancedSupplier) => {
    router.push(`/suppliers/edit/${supplier.id}`);
  };

  const handleViewSupplier = (supplier: EnhancedSupplier) => {
    router.push(`/suppliers/${supplier.id}`);
  };

  const handleDeleteSupplier = async () => {
    if (!supplierToDelete) return;

    try {
      await EnhancedSupplierService.deleteSupplier(supplierToDelete.id);
      setSuccess('Supplier deleted successfully');
      await loadSuppliers();
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
    } catch (err) {
      console.error('Error deleting supplier:', err);
      setError('Failed to delete supplier');
    }
  };

  const handleToggleStatus = async (supplier: EnhancedSupplier) => {
    try {
      await EnhancedSupplierService.updateSupplier(supplier.id, {
        ...supplier,
        isActive: !supplier.isActive
      });
      setSuccess(`Supplier ${supplier.isActive ? 'deactivated' : 'activated'} successfully`);
      await loadSuppliers();
    } catch (err) {
      console.error('Error updating supplier status:', err);
      setError('Failed to update supplier status');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'warning';
    if (balance < 0) return 'success';
    return 'default';
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color = 'primary',
    subtitle 
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color?: 'primary' | 'success' | 'warning' | 'error';
    subtitle?: string;
  }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: `${color}.main`, mr: 2 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {title}
            </Typography>
            {subtitle && (
              <Typography color="text.secondary" variant="caption">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Supplier Management"
        pageType="supplier"
        enableVisualEffects={true}
        enableParticles={false}
        actions={
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => {
                // TODO: Implement export functionality
                setSuccess('Export feature coming soon');
              }}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateSupplier}
            >
              Add Supplier
            </Button>
          </Box>
        }
      >
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {/* Statistics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatCard
                title="Total Suppliers"
                value={stats.total}
                icon={<BusinessIcon />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatCard
                title="Active"
                value={stats.active}
                icon={<CheckCircleIcon />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatCard
                title="Inactive"
                value={stats.inactive}
                icon={<WarningIcon />}
                color="warning"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatCard
                title="High Credit"
                value={stats.highCredit}
                icon={<StarIcon />}
                color="primary"
                subtitle="Credit > ₹1L"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatCard
                title="Total Balance"
                value={formatCurrency(stats.totalBalance)}
                icon={<PaymentIcon />}
                color={stats.totalBalance > 0 ? 'warning' : 'success'}
              />
            </Grid>
          </Grid>

          {/* Search and Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="Search suppliers by name, email, phone, contact person, or GSTIN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      startIcon={<FilterListIcon />}
                      onClick={() => setSuccess('Advanced filters coming soon')}
                    >
                      Filter
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Suppliers Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Suppliers ({filteredSuppliers.length})
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Supplier</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Payment Terms</TableCell>
                      <TableCell>Credit Limit</TableCell>
                      <TableCell>Current Balance</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Typography>Loading suppliers...</Typography>
                        </TableCell>
                      </TableRow>
                    ) : filteredSuppliers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Typography>
                            {searchTerm ? 'No suppliers found matching your search' : 'No suppliers found'}
                          </Typography>
                          {!searchTerm && (
                            <Button
                              variant="contained"
                              startIcon={<AddIcon />}
                              onClick={handleCreateSupplier}
                              sx={{ mt: 2 }}
                            >
                              Add Your First Supplier
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSuppliers.map((supplier) => (
                        <TableRow key={supplier.id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {supplier.name}
                              </Typography>
                              {supplier.contactPerson && (
                                <Typography variant="body2" color="text.secondary">
                                  Contact: {supplier.contactPerson}
                                </Typography>
                              )}
                              {supplier.gstin && (
                                <Typography variant="caption" color="text.secondary">
                                  GSTIN: {supplier.gstin}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              {supplier.phone && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                  <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                  <Typography variant="body2">{supplier.phone}</Typography>
                                </Box>
                              )}
                              {supplier.email && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                  <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                  <Typography variant="body2">{supplier.email}</Typography>
                                </Box>
                              )}
                              {supplier.address && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                  <Typography variant="body2" noWrap>
                                    {supplier.address.length > 30 
                                      ? `${supplier.address.substring(0, 30)}...` 
                                      : supplier.address
                                    }
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {supplier.paymentTerms || 'Not specified'}
                              </Typography>
                              {supplier.leadTime && (
                                <Typography variant="caption" color="text.secondary">
                                  Lead time: {supplier.leadTime} days
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {formatCurrency(supplier.creditLimit || 0)}
                            </Typography>
                            {supplier.minimumOrderValue && (
                              <Typography variant="caption" color="text.secondary">
                                Min: {formatCurrency(supplier.minimumOrderValue)}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={formatCurrency(supplier.currentBalance || 0)}
                              color={getBalanceColor(supplier.currentBalance || 0)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={supplier.isActive ? 'Active' : 'Inactive'}
                              color={supplier.isActive ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewSupplier(supplier)}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => handleEditSupplier(supplier)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="More Actions">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  setAnchorEl(e.currentTarget);
                                  setSelectedSupplier(supplier);
                                }}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Container>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem onClick={() => {
            if (selectedSupplier) handleViewSupplier(selectedSupplier);
            setAnchorEl(null);
          }}>
            <ListItemIcon>
              <VisibilityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            if (selectedSupplier) handleEditSupplier(selectedSupplier);
            setAnchorEl(null);
          }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Supplier</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            if (selectedSupplier) handleToggleStatus(selectedSupplier);
            setAnchorEl(null);
          }}>
            <ListItemIcon>
              {selectedSupplier?.isActive ? <WarningIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText>{selectedSupplier?.isActive ? 'Deactivate' : 'Activate'}</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem 
            onClick={() => {
              setSupplierToDelete(selectedSupplier);
              setDeleteDialogOpen(true);
              setAnchorEl(null);
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Supplier</ListItemText>
          </MenuItem>
        </Menu>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{supplierToDelete?.name}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteSupplier} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar Messages */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
        >
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        </Snackbar>
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}