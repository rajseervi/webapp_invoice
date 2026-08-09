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
  Paper,
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
  Snackbar,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  FileDownload as ExportIcon,
  Refresh as RefreshIcon,
  TrendingUp as InboundIcon,
  TrendingDown as OutboundIcon,
  SwapHoriz as TransferIcon,
  Inventory as StockIcon,
  DateRange as DateIcon,
  ViewList as ViewIcon,
  Clear as ClearIcon,
  Receipt as ReceiptIcon,
  History as HistoryIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import { StockManagementService } from '@/services/stockManagementService';
import { StockMovement } from '@/types/inventory';

interface MovementFilters {
  searchTerm: string;
  movementType: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  location: string;
}

export default function StockMovementsPage() {
  const router = useRouter();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [filters, setFilters] = useState<MovementFilters>({
    searchTerm: '',
    movementType: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    location: ''
  });

  // Load stock movements from Firebase
  useEffect(() => {
    loadMovements();
  }, []);

  const loadMovements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all stock movements
      const allMovements = await StockManagementService.getAllStockMovements();
      setMovements(allMovements);
      setTotalCount(allMovements.length);
      
    } catch (err) {
      console.error('Error loading movements:', err);
      setError('Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  };

  // Filter movements
  const filteredMovements = useMemo(() => {
    return movements.filter(movement => {
      if (filters.searchTerm && !movement.productName.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      if (filters.movementType && movement.movementType !== filters.movementType) {
        return false;
      }
      // Add date filtering logic if needed
      if (filters.dateFrom && movement.createdAt < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && movement.createdAt > filters.dateTo) {
        return false;
      }
      return true;
    });
  }, [movements, filters]);

  // Paginated movements
  const paginatedMovements = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredMovements.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredMovements, page, rowsPerPage]);

  const handleFilterChange = (field: keyof MovementFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      movementType: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      location: ''
    });
    setPage(0);
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <InboundIcon color="success" />;
      case 'out':
        return <OutboundIcon color="error" />;
      case 'adjustment':
        return <StockIcon color="warning" />;
      default:
        return <StockIcon />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'in':
        return 'success';
      case 'out':
        return 'error';
      case 'adjustment':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'in':
        return 'Inbound';
      case 'out':
        return 'Outbound';
      case 'adjustment':
        return 'Adjustment';
      default:
        return type;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
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

  // Calculate summary statistics
  const totalInbound = movements.filter(m => m.movementType === 'in').reduce((sum, m) => sum + m.quantity, 0);
  const totalOutbound = movements.filter(m => m.movementType === 'out').reduce((sum, m) => sum + m.quantity, 0);
  const totalAdjustments = movements.filter(m => m.movementType === 'adjustment').length;
  const totalMovements = movements.length;

  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Stock Movements"
        pageType="Comprehensive stock movement tracking and analysis"
        enableVisualEffects={true}
        enableParticles={false}
        customQuickActions={[
          { icon: <ExportIcon />, label: 'Export', onClick: () => {} },
          { icon: <RefreshIcon />, label: 'Refresh', onClick: loadMovements },
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
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <InboundIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" color="success.main">
                        {totalInbound.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Inbound Qty
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
                      <OutboundIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" color="error.main">
                        {totalOutbound.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Outbound Qty
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
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <HistoryIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {totalMovements}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Movements
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
                      <StockIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {totalAdjustments}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Stock Adjustments
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
                <Grid item xs={12} md={3}>
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
                
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Movement Type</InputLabel>
                    <Select
                      value={filters.movementType}
                      onChange={(e) => handleFilterChange('movementType', e.target.value)}
                      label="Movement Type"
                    >
                      <MenuItem value="">All Types</MenuItem>
                      <MenuItem value="in">Inbound</MenuItem>
                      <MenuItem value="out">Outbound</MenuItem>
                      <MenuItem value="adjustment">Adjustment</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="">All Status</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={2}>
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
                
                <Grid item xs={12} md={2}>
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
                
                <Grid item xs={12} md={1}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Clear filters">
                      <IconButton size="small" onClick={clearFilters}>
                        <ClearIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Refresh">
                      <IconButton size="small" onClick={() => window.location.reload()}>
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Movements Table */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Stock Movements ({filteredMovements.length})
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<ViewIcon />}
                  onClick={() => router.push('/stock-management')}
                >
                  Back to Overview
                </Button>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {loading && <LinearProgress sx={{ mb: 2 }} />}
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Movement</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Previous</TableCell>
                      <TableCell align="right">New Stock</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell>Created By</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          Loading movements...
                        </TableCell>
                      </TableRow>
                    ) : paginatedMovements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          No movements found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedMovements.map((movement) => (
                        <TableRow key={movement.id} hover>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              {getMovementIcon(movement.movementType)}
                              <Chip 
                                label={getMovementLabel(movement.movementType)}
                                size="small"
                                color={getMovementColor(movement.movementType) as any}
                                variant="outlined"
                              />
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {movement.productName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="body2" 
                              color={movement.movementType === 'in' ? 'success.main' : movement.movementType === 'out' ? 'error.main' : 'warning.main'}
                              fontWeight="medium"
                            >
                              {movement.movementType === 'in' ? '+' : movement.movementType === 'out' ? '-' : ''}{movement.quantity}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {movement.previousQuantity}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="body2" 
                              fontWeight="medium"
                            >
                              {movement.newQuantity}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                              {movement.reason}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              {movement.referenceType && (
                                <Chip 
                                  label={movement.referenceType}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                              {movement.referenceId && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {movement.referenceId}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {movement.createdBy || 'System'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(movement.createdAt)}
                            </Typography>
                            {movement.notes && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {movement.notes}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={filteredMovements.length}
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
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}