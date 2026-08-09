"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
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
  TablePagination,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Tooltip,
  IconButton,
  Stack,
  Divider,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Autocomplete
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Tune as TuneIcon,
  FileDownload as ExportIcon,
  Clear as ClearIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import { StockManagementService } from '@/services/stockManagementService';
import { ProductService } from '@/services/productService';
import { Product, StockMovement } from '@/types/inventory';

interface AdjustmentFilters {
  searchTerm: string;
  dateFrom: string;
  dateTo: string;
}

interface NewAdjustment {
  productId: string;
  productName: string;
  currentQuantity: number;
  newQuantity: number;
  reason: string;
  notes?: string;
}

export default function StockAdjustmentsPage() {
  const router = useRouter();
  const [adjustments, setAdjustments] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newAdjustment, setNewAdjustment] = useState<NewAdjustment>({
    productId: '',
    productName: '',
    currentQuantity: 0,
    newQuantity: 0,
    reason: '',
    notes: ''
  });

  // Filters
  const [filters, setFilters] = useState<AdjustmentFilters>({
    searchTerm: '',
    dateFrom: '',
    dateTo: ''
  });

  // Load data
  useEffect(() => {
    loadAdjustments();
    loadProducts();
  }, []);

  const loadAdjustments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all stock movements filtered by adjustment type
      const allMovements = await StockManagementService.getAllStockMovements();
      const adjustmentMovements = allMovements.filter(m => m.movementType === 'adjustment');
      setAdjustments(adjustmentMovements);
      
    } catch (err) {
      console.error('Error loading adjustments:', err);
      setError('Failed to load stock adjustments');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const allProducts = await ProductService.getAllProducts();
      setProducts(allProducts);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  // Filter adjustments
  const filteredAdjustments = useMemo(() => {
    return adjustments.filter(adjustment => {
      if (filters.searchTerm && !adjustment.productName.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      if (filters.dateFrom && adjustment.createdAt < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && adjustment.createdAt > filters.dateTo) {
        return false;
      }
      return true;
    });
  }, [adjustments, filters]);

  // Paginated adjustments
  const paginatedAdjustments = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredAdjustments.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAdjustments, page, rowsPerPage]);

  const handleFilterChange = (field: keyof AdjustmentFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      dateFrom: '',
      dateTo: ''
    });
    setPage(0);
  };

  const handleOpenDialog = () => {
    setNewAdjustment({
      productId: '',
      productName: '',
      currentQuantity: 0,
      newQuantity: 0,
      reason: '',
      notes: ''
    });
    setSelectedProduct(null);
    setOpenDialog(true);
  };

  const handleProductSelect = (product: Product | null) => {
    if (product) {
      setSelectedProduct(product);
      setNewAdjustment(prev => ({
        ...prev,
        productId: product.id!,
        productName: product.name,
        currentQuantity: product.quantity || 0,
        newQuantity: product.quantity || 0
      }));
    } else {
      setSelectedProduct(null);
      setNewAdjustment(prev => ({
        ...prev,
        productId: '',
        productName: '',
        currentQuantity: 0,
        newQuantity: 0
      }));
    }
  };

  const handleSaveAdjustment = async () => {
    if (!selectedProduct || !newAdjustment.reason.trim()) {
      setError('Please select a product and provide a reason for adjustment');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const result = await StockManagementService.updateStock({
        productId: newAdjustment.productId,
        quantity: newAdjustment.newQuantity,
        movementType: 'adjustment',
        reason: newAdjustment.reason,
        notes: newAdjustment.notes,
        referenceType: 'adjustment'
      });

      if (result.success) {
        setSuccess(`Stock adjustment completed successfully. New quantity: ${result.newQuantity}`);
        setOpenDialog(false);
        await loadAdjustments();
        await loadProducts();
      } else {
        setError(result.errors?.join(', ') || 'Failed to process adjustment');
      }
    } catch (err) {
      console.error('Error saving adjustment:', err);
      setError('Failed to save stock adjustment');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAdjustmentIcon = (previousQty: number, newQty: number) => {
    if (newQty > previousQty) {
      return <CheckCircleIcon color="success" />;
    } else if (newQty < previousQty) {
      return <ErrorIcon color="error" />;
    } else {
      return <WarningIcon color="warning" />;
    }
  };

  const getAdjustmentColor = (previousQty: number, newQty: number) => {
    if (newQty > previousQty) {
      return 'success';
    } else if (newQty < previousQty) {
      return 'error';
    } else {
      return 'warning';
    }
  };

  // Calculate statistics
  const totalAdjustments = adjustments.length;
  const positiveAdjustments = adjustments.filter(adj => adj.newQuantity > adj.previousQuantity).length;
  const negativeAdjustments = adjustments.filter(adj => adj.newQuantity < adj.previousQuantity).length;
  const neutralAdjustments = adjustments.filter(adj => adj.newQuantity === adj.previousQuantity).length;

  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Stock Adjustments"
        pageType="Stock level adjustments and corrections"
        enableVisualEffects={true}
        enableParticles={false}
        customQuickActions={[
          { icon: <AddIcon />, label: 'New Adjustment', onClick: handleOpenDialog },
          { icon: <ExportIcon />, label: 'Export', onClick: () => {} },
          { icon: <RefreshIcon />, label: 'Refresh', onClick: loadAdjustments },
        ]}
      >
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {/* Loading */}
          {loading && <LinearProgress sx={{ mb: 3 }} />}

          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <TuneIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {totalAdjustments}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Adjustments
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <CheckCircleIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" color="success.main">
                        {positiveAdjustments}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Positive Adjustments
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'error.main' }}>
                      <ErrorIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" color="error.main">
                        {negativeAdjustments}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Negative Adjustments
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                      <WarningIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" color="warning.main">
                        {neutralAdjustments}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Neutral Adjustments
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search products..."
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="From Date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="To Date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} md={2}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Clear filters">
                      <IconButton size="small" onClick={clearFilters}>
                        <ClearIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="New Adjustment">
                      <IconButton size="small" onClick={handleOpenDialog} color="primary">
                        <AddIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Adjustments Table */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Stock Adjustments ({filteredAdjustments.length})
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenDialog}
                >
                  New Adjustment
                </Button>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Adjustment</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Previous Qty</TableCell>
                      <TableCell align="right">New Qty</TableCell>
                      <TableCell align="right">Difference</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Created By</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          Loading adjustments...
                        </TableCell>
                      </TableRow>
                    ) : paginatedAdjustments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          No adjustments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedAdjustments.map((adjustment) => (
                        <TableRow key={adjustment.id} hover>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              {getAdjustmentIcon(adjustment.previousQuantity, adjustment.newQuantity)}
                              <Chip 
                                label="Adjustment"
                                size="small"
                                color={getAdjustmentColor(adjustment.previousQuantity, adjustment.newQuantity) as any}
                                variant="outlined"
                              />
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {adjustment.productName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {adjustment.previousQuantity}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="medium">
                              {adjustment.newQuantity}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="body2" 
                              color={
                                adjustment.newQuantity > adjustment.previousQuantity ? 'success.main' : 
                                adjustment.newQuantity < adjustment.previousQuantity ? 'error.main' : 'warning.main'
                              }
                              fontWeight="medium"
                            >
                              {adjustment.newQuantity > adjustment.previousQuantity ? '+' : ''}
                              {adjustment.newQuantity - adjustment.previousQuantity}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                              {adjustment.reason}
                            </Typography>
                            {adjustment.notes && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {adjustment.notes}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {adjustment.createdBy || 'System'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(adjustment.createdAt)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={filteredAdjustments.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </CardContent>
          </Card>
        </Container>

        {/* New Adjustment Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Create Stock Adjustment</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Autocomplete
                  options={products}
                  getOptionLabel={(option) => `${option.name} (Current: ${option.quantity})`}
                  value={selectedProduct}
                  onChange={(_, value) => handleProductSelect(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Product"
                      placeholder="Search and select product..."
                      fullWidth
                      required
                    />
                  )}
                />
              </Grid>
              
              {selectedProduct && (
                <>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Current Quantity"
                      value={newAdjustment.currentQuantity}
                      disabled
                      type="number"
                    />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="New Quantity"
                      value={newAdjustment.newQuantity}
                      onChange={(e) => setNewAdjustment(prev => ({
                        ...prev,
                        newQuantity: parseInt(e.target.value) || 0
                      }))}
                      type="number"
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Reason for Adjustment"
                      value={newAdjustment.reason}
                      onChange={(e) => setNewAdjustment(prev => ({
                        ...prev,
                        reason: e.target.value
                      }))}
                      required
                      multiline
                      rows={2}
                      placeholder="Explain why this adjustment is needed..."
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Additional Notes (Optional)"
                      value={newAdjustment.notes}
                      onChange={(e) => setNewAdjustment(prev => ({
                        ...prev,
                        notes: e.target.value
                      }))}
                      multiline
                      rows={2}
                      placeholder="Any additional notes or comments..."
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Alert 
                      severity={
                        newAdjustment.newQuantity > newAdjustment.currentQuantity ? 'success' :
                        newAdjustment.newQuantity < newAdjustment.currentQuantity ? 'warning' : 'info'
                      }
                    >
                      Adjustment: {newAdjustment.newQuantity - newAdjustment.currentQuantity} units
                      {newAdjustment.newQuantity > newAdjustment.currentQuantity ? ' (Increase)' : 
                       newAdjustment.newQuantity < newAdjustment.currentQuantity ? ' (Decrease)' : ' (No Change)'}
                    </Alert>
                  </Grid>
                </>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpenDialog(false)} 
              startIcon={<CancelIcon />}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAdjustment} 
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={!selectedProduct || !newAdjustment.reason.trim() || saving}
            >
              {saving ? 'Saving...' : 'Save Adjustment'}
            </Button>
          </DialogActions>
        </Dialog>
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}