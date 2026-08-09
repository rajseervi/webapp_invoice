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
  Paper,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  FileDownload as ExportIcon,
  Refresh as RefreshIcon,
  Inventory as InventoryIcon,
  TrendingDown as LowStockIcon,
  Error as OutOfStockIcon,
  TrendingUp as OverStockIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Clear as ClearIcon,
  ViewList as ViewIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Tune as TuneIcon
} from '@mui/icons-material';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import { StockManagementService } from '@/services/stockManagementService';
import { ProductService } from '@/services/productService';
import { Product } from '@/types/inventory';

interface StockFilters {
  searchTerm: string;
  category: string;
  stockStatus: string;
  showInactive: boolean;
}

interface StockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
  alertType: 'low_stock' | 'out_of_stock' | 'overstock';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export default function StockLevelsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);

  // Filters
  const [filters, setFilters] = useState<StockFilters>({
    searchTerm: '',
    category: '',
    stockStatus: '',
    showInactive: false
  });

  // Load data
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allProducts = await ProductService.getAllProducts();
      setProducts(allProducts);
      
      // Generate stock alerts
      generateStockAlerts(allProducts);
      
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load stock levels');
    } finally {
      setLoading(false);
    }
  };

  const generateStockAlerts = (productList: Product[]) => {
    const alerts: StockAlert[] = [];
    
    productList.forEach(product => {
      const currentStock = product.quantity || 0;
      const minLevel = product.minStockLevel || product.reorderPoint || 5;
      const maxLevel = product.maxStockLevel || 1000;

      let alertType: StockAlert['alertType'] | null = null;
      let severity: StockAlert['severity'] = 'low';

      if (currentStock === 0) {
        alertType = 'out_of_stock';
        severity = 'critical';
      } else if (currentStock <= minLevel) {
        alertType = 'low_stock';
        severity = currentStock <= minLevel * 0.5 ? 'high' : 'medium';
      } else if (maxLevel && currentStock > maxLevel) {
        alertType = 'overstock';
        severity = 'medium';
      }

      if (alertType) {
        alerts.push({
          productId: product.id!,
          productName: product.name,
          currentStock,
          threshold: alertType === 'overstock' ? maxLevel : minLevel,
          alertType,
          severity
        });
      }
    });

    setStockAlerts(alerts);
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search filter
      if (filters.searchTerm && !product.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) &&
          !product.sku?.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      
      // Category filter
      if (filters.category && product.categoryName !== filters.category) {
        return false;
      }
      
      // Active/Inactive filter
      if (!filters.showInactive && !product.isActive) {
        return false;
      }
      
      // Stock status filter
      if (filters.stockStatus) {
        const currentStock = product.quantity || 0;
        const minLevel = product.minStockLevel || product.reorderPoint || 5;
        const maxLevel = product.maxStockLevel || 1000;

        switch (filters.stockStatus) {
          case 'out_of_stock':
            if (currentStock > 0) return false;
            break;
          case 'low_stock':
            if (currentStock === 0 || currentStock > minLevel) return false;
            break;
          case 'normal':
            if (currentStock === 0 || currentStock <= minLevel || (maxLevel && currentStock > maxLevel)) return false;
            break;
          case 'overstock':
            if (!maxLevel || currentStock <= maxLevel) return false;
            break;
        }
      }
      
      return true;
    });
  }, [products, filters]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredProducts.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredProducts, page, rowsPerPage]);

  const handleFilterChange = (field: keyof StockFilters, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      category: '',
      stockStatus: '',
      showInactive: false
    });
    setPage(0);
  };

  const getStockStatusChip = (product: Product) => {
    const currentStock = product.quantity || 0;
    const minLevel = product.minStockLevel || product.reorderPoint || 5;
    const maxLevel = product.maxStockLevel || 1000;

    if (currentStock === 0) {
      return <Chip label="Out of Stock" size="small" color="error" />;
    } else if (currentStock <= minLevel) {
      return <Chip label="Low Stock" size="small" color="warning" />;
    } else if (maxLevel && currentStock > maxLevel) {
      return <Chip label="Overstock" size="small" color="info" />;
    } else {
      return <Chip label="Normal" size="small" color="success" />;
    }
  };

  const getStockStatusIcon = (product: Product) => {
    const currentStock = product.quantity || 0;
    const minLevel = product.minStockLevel || product.reorderPoint || 5;
    const maxLevel = product.maxStockLevel || 1000;

    if (currentStock === 0) {
      return <OutOfStockIcon color="error" />;
    } else if (currentStock <= minLevel) {
      return <LowStockIcon color="warning" />;
    } else if (maxLevel && currentStock > maxLevel) {
      return <OverStockIcon color="info" />;
    } else {
      return <CheckCircleIcon color="success" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Calculate statistics
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.isActive).length;
  const outOfStockProducts = products.filter(p => (p.quantity || 0) === 0).length;
  const lowStockProducts = stockAlerts.filter(a => a.alertType === 'low_stock').length;
  const overstockProducts = stockAlerts.filter(a => a.alertType === 'overstock').length;
  const totalStockValue = products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.purchasePrice || 0)), 0);

  // Get unique categories
  const categories = Array.from(new Set(products.map(p => p.categoryName).filter(Boolean)));

  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Stock Levels"
        pageType="Current inventory levels and stock alerts"
        enableVisualEffects={true}
        enableParticles={false}
        customQuickActions={[
          { icon: <ExportIcon />, label: 'Export', onClick: () => {} },
          { icon: <RefreshIcon />, label: 'Refresh', onClick: loadProducts },
          { icon: <AddIcon />, label: 'Add Product', onClick: () => router.push('/products/new') },
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

          {/* Stock Alerts Banner */}
          {stockAlerts.length > 0 && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>{stockAlerts.length} stock alerts:</strong> 
                {` ${outOfStockProducts} out of stock, ${lowStockProducts} low stock, ${overstockProducts} overstock`}
              </Typography>
            </Alert>
          )}

          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <InventoryIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {activeProducts}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Products
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
                      <Badge badgeContent={outOfStockProducts} color="error">
                        <OutOfStockIcon />
                      </Badge>
                    </Avatar>
                    <Box>
                      <Typography variant="h6" color="error.main">
                        {outOfStockProducts}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Out of Stock
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
                      <Badge badgeContent={lowStockProducts} color="warning">
                        <LowStockIcon />
                      </Badge>
                    </Avatar>
                    <Box>
                      <Typography variant="h6" color="warning.main">
                        {lowStockProducts}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Low Stock Alerts
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
                      <InventoryIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" color="success.main">
                        {formatCurrency(totalStockValue)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Stock Value
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
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      label="Category"
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {categories.map(category => (
                        <MenuItem key={category} value={category}>{category}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Stock Status</InputLabel>
                    <Select
                      value={filters.stockStatus}
                      onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
                      label="Stock Status"
                    >
                      <MenuItem value="">All Status</MenuItem>
                      <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                      <MenuItem value="low_stock">Low Stock</MenuItem>
                      <MenuItem value="normal">Normal</MenuItem>
                      <MenuItem value="overstock">Overstock</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Show</InputLabel>
                    <Select
                      value={filters.showInactive ? 'all' : 'active'}
                      onChange={(e) => handleFilterChange('showInactive', e.target.value === 'all')}
                      label="Show"
                    >
                      <MenuItem value="active">Active Only</MenuItem>
                      <MenuItem value="all">All Products</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={1}>
                  <Tooltip title="Clear filters">
                    <IconButton size="small" onClick={clearFilters}>
                      <ClearIcon />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Stock Levels Table */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Stock Levels ({filteredProducts.length})
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<TuneIcon />}
                    onClick={() => router.push('/stock-management/adjustments')}
                  >
                    Adjustments
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ViewIcon />}
                    onClick={() => router.push('/stock-management/movements')}
                  >
                    Movements
                  </Button>
                </Stack>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Current Stock</TableCell>
                      <TableCell align="right">Min Level</TableCell>
                      <TableCell align="right">Max Level</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Stock Value</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          Loading products...
                        </TableCell>
                      </TableRow>
                    ) : paginatedProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          No products found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedProducts.map((product) => (
                        <TableRow 
                          key={product.id} 
                          hover
                          sx={{
                            backgroundColor: !product.isActive ? 'action.hover' : 'inherit'
                          }}
                        >
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              {getStockStatusIcon(product)}
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {product.name}
                                  {!product.isActive && (
                                    <Chip label="Inactive" size="small" color="default" sx={{ ml: 1 }} />
                                  )}
                                </Typography>
                                {product.sku && (
                                  <Typography variant="caption" color="text.secondary">
                                    SKU: {product.sku}
                                  </Typography>
                                )}
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {product.categoryName || 'Uncategorized'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="body2" 
                              fontWeight="medium"
                              color={
                                (product.quantity || 0) === 0 ? 'error.main' : 
                                (product.quantity || 0) <= (product.minStockLevel || product.reorderPoint || 5) ? 'warning.main' : 
                                'text.primary'
                              }
                            >
                              {product.quantity || 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {product.unitOfMeasurement}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {product.minStockLevel || product.reorderPoint || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {product.maxStockLevel || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {formatCurrency(product.purchasePrice || 0)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="medium">
                              {formatCurrency((product.quantity || 0) * (product.purchasePrice || 0))}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {getStockStatusChip(product)}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Edit Product">
                              <IconButton 
                                size="small" 
                                onClick={() => router.push(`/products/${product.id}/edit`)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={filteredProducts.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 25, 50, 100]}
              />
            </CardContent>
          </Card>
        </Container>
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}