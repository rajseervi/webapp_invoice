"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Tooltip,
  Paper,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  IconButton,
  Badge,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Drawer,
  useTheme,
  useMediaQuery,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Dashboard as DashboardIcon,
  Upload as ImportIcon,
  Download as ExportIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Sort as SortIcon,
  MoreVert as MoreVertIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Category as CategoryIcon,
  AttachMoney as MoneyIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';
import PageHeader from '@/components/PageHeader/PageHeader';
import ProductList from '../components/EnhancedProductList';
import ProductForm from '../components/ProductForm';
import ProductAnalytics from '../components/ProductAnalytics';
import BulkOperations from '../components/EnhancedBulkOperations';
import ProductDashboard from '../components/ProductDashboard';
import ProductImportExport from '../components/EnhancedProductImportExport';
import { productService, ProductFilters } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { Product, Category } from '@/types/inventory';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function EnhancedProductManagementPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // UI states
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(!isMobile);

  // Dialog states
  const [productDialog, setProductDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [bulkDialog, setBulkDialog] = useState(false);
  const [importDialog, setImportDialog] = useState(false);

  // Filter states
  const [filters, setFilters] = useState<ProductFilters>({
    searchTerm: '',
    category: '',
    status: 'all',
    priceRange: [0, 100000],
    stockRange: [0, 10000],
    gstRate: undefined,
    isService: undefined
  });

  // Selection state
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.isActive).length;
    const lowStockProducts = products.filter(p => p.quantity <= (p.reorderPoint || 10)).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const averagePrice = totalProducts > 0 ? totalValue / totalProducts : 0;
    
    const gstRateDistribution = products.reduce((acc, p) => {
      const rate = p.gstExempt ? 0 : (p.gstRate || 0);
      acc[rate] = (acc[rate] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalValue,
      averagePrice,
      gstRateDistribution
    };
  }, [products]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData] = await Promise.all([
        categoryService.getCategories()
      ]);
      setCategories(categoriesData);
      await loadProducts();
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const result = await productService.getProducts(filters);
      setProducts(result.products);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products');
    }
  };

  const handleCreateProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await productService.createProduct(productData);
      setSuccess('Product created successfully');
      setProductDialog(false);
      setSelectedProduct(null);
      await loadProducts();
    } catch (err) {
      console.error('Error creating product:', err);
      setError('Failed to create product');
    }
  };

  const handleUpdateProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedProduct?.id) return;

    try {
      await productService.updateProduct(selectedProduct.id, productData);
      setSuccess('Product updated successfully');
      setProductDialog(false);
      setSelectedProduct(null);
      await loadProducts();
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await productService.deleteProduct(productId);
      setSuccess('Product deleted successfully');
      await loadProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
    }
  };

  const handleBulkUpdate = async (updateData: any) => {
    if (selectedProducts.length === 0) return;

    try {
      await productService.bulkUpdateProducts(selectedProducts, updateData);
      setSuccess(`Updated ${selectedProducts.length} products successfully`);
      setSelectedProducts([]);
      setBulkDialog(false);
      await loadProducts();
    } catch (err) {
      console.error('Error bulk updating products:', err);
      setError('Failed to update products');
    }
  };

  const handleFilterChange = (field: keyof ProductFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      category: '',
      status: 'all',
      priceRange: [0, 100000],
      stockRange: [0, 10000],
      gstRate: undefined,
      isService: undefined
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.category) count++;
    if (filters.status !== 'all') count++;
    if (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000)) count++;
    if (filters.stockRange && (filters.stockRange[0] > 0 || filters.stockRange[1] < 10000)) count++;
    if (filters.gstRate !== undefined) count++;
    if (filters.isService !== undefined) count++;
    return count;
  };

  const speedDialActions = [
    {
      icon: <AddIcon />,
      name: 'Add Product',
      onClick: () => {
        setSelectedProduct(null);
        setProductDialog(true);
      }
    },
    {
      icon: <ImportIcon />,
      name: 'Import Products',
      onClick: () => setImportDialog(true)
    },
    {
      icon: <ExportIcon />,
      name: 'Export Products',
      onClick: () => {
        // Handle export
      }
    },
    {
      icon: <AnalyticsIcon />,
      name: 'Analytics',
      onClick: () => setActiveTab(1)
    }
  ];

  // Mobile filter drawer content
  const filterDrawerContent = (
    <Box sx={{ width: 300, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Filters</Typography>
        <IconButton onClick={() => setMobileDrawerOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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

        <FormControl fullWidth size="small">
          <InputLabel>Category</InputLabel>
          <Select
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            label="Category"
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status || 'all'}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            label="Status"
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="low-stock">Low Stock</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>GST Rate</InputLabel>
          <Select
            value={filters.gstRate || ''}
            onChange={(e) => handleFilterChange('gstRate', e.target.value || undefined)}
            label="GST Rate"
          >
            <MenuItem value="">All Rates</MenuItem>
            <MenuItem value={0}>0%</MenuItem>
            <MenuItem value={5}>5%</MenuItem>
            <MenuItem value={12}>12%</MenuItem>
            <MenuItem value={18}>18%</MenuItem>
            <MenuItem value={28}>28%</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Type</InputLabel>
          <Select
            value={filters.isService === undefined ? '' : filters.isService ? 'service' : 'goods'}
            onChange={(e) => {
              const value = e.target.value;
              handleFilterChange('isService', value === '' ? undefined : value === 'service');
            }}
            label="Type"
          >
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="goods">Goods</MenuItem>
            <MenuItem value="service">Services</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={clearFilters}
            disabled={getActiveFiltersCount() === 0}
          >
            Clear Filters
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={() => setMobileDrawerOpen(false)}
          >
            Apply
          </Button>
        </Box>
      </Box>
    </Box>
  );

  return (
    <ImprovedDashboardLayout>
      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        {/* Mobile Header */}
        {isMobile && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              Products
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={() => setMobileDrawerOpen(true)}>
                <Badge badgeContent={getActiveFiltersCount()} color="primary">
                  <FilterIcon />
                </Badge>
              </IconButton>
              <IconButton onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}>
                {viewMode === 'list' ? <ViewModuleIcon /> : <ViewListIcon />}
              </IconButton>
            </Box>
          </Box>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <PageHeader
            title="Product Management"
            subtitle="Manage your product inventory with GST compliance"
            action={
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<DashboardIcon />}
                  onClick={() => setActiveTab(0)}
                  size={isTablet ? 'small' : 'medium'}
                >
                  Dashboard
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AnalyticsIcon />}
                  onClick={() => setActiveTab(1)}
                  size={isTablet ? 'small' : 'medium'}
                >
                  Analytics
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ImportIcon />}
                  onClick={() => setImportDialog(true)}
                  size={isTablet ? 'small' : 'medium'}
                >
                  Import
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setSelectedProduct(null);
                    setProductDialog(true);
                  }}
                  size={isTablet ? 'small' : 'medium'}
                >
                  Add Product
                </Button>
              </Box>
            }
          />
        )}

        {/* Quick Stats Cards - Mobile Optimized */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InventoryIcon color="primary" fontSize={isMobile ? 'small' : 'medium'} />
                  <Box>
                    <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="bold">
                      {stats.totalProducts}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Products
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon color="success" fontSize={isMobile ? 'small' : 'medium'} />
                  <Box>
                    <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="bold">
                      {stats.activeProducts}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Active
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon color="warning" fontSize={isMobile ? 'small' : 'medium'} />
                  <Box>
                    <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="bold">
                      {stats.lowStockProducts}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Low Stock
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MoneyIcon color="success" fontSize={isMobile ? 'small' : 'medium'} />
                  <Box>
                    <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="bold">
                      ₹{(stats.totalValue / 1000).toFixed(0)}K
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Value
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
          >
            <Tab label="Products" icon={<ViewListIcon />} />
            <Tab label="Analytics" icon={<AnalyticsIcon />} />
            <Tab label="Bulk Operations" icon={<SettingsIcon />} />
          </Tabs>
        </Paper>

        {/* Desktop Filters */}
        {!isMobile && (
          <Accordion expanded={filtersExpanded} onChange={() => setFiltersExpanded(!filtersExpanded)}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterIcon />
                <Typography>Filters</Typography>
                {getActiveFiltersCount() > 0 && (
                  <Chip label={`${getActiveFiltersCount()} active`} size="small" color="primary" />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
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
                      value={filters.category || ''}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      label="Category"
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.status || 'all'}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="low-stock">Low Stock</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>GST Rate</InputLabel>
                    <Select
                      value={filters.gstRate || ''}
                      onChange={(e) => handleFilterChange('gstRate', e.target.value || undefined)}
                      label="GST Rate"
                    >
                      <MenuItem value="">All Rates</MenuItem>
                      <MenuItem value={0}>0%</MenuItem>
                      <MenuItem value={5}>5%</MenuItem>
                      <MenuItem value={12}>12%</MenuItem>
                      <MenuItem value={18}>18%</MenuItem>
                      <MenuItem value={28}>28%</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={filters.isService === undefined ? '' : filters.isService ? 'service' : 'goods'}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleFilterChange('isService', value === '' ? undefined : value === 'service');
                      }}
                      label="Type"
                    >
                      <MenuItem value="">All Types</MenuItem>
                      <MenuItem value="goods">Goods</MenuItem>
                      <MenuItem value="service">Services</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={1}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Clear filters">
                      <Button
                        size="small"
                        onClick={clearFilters}
                        disabled={getActiveFiltersCount() === 0}
                      >
                        <ClearIcon />
                      </Button>
                    </Tooltip>
                    <Tooltip title="Refresh">
                      <Button size="small" onClick={loadProducts}>
                        <RefreshIcon />
                      </Button>
                    </Tooltip>
                  </Box>
                </Grid>
              </Grid>

              {/* Active Filters */}
              {getActiveFiltersCount() > 0 && (
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="body2" sx={{ mr: 1, alignSelf: 'center' }}>
                    Active filters:
                  </Typography>
                  {filters.searchTerm && (
                    <Chip
                      label={`Search: ${filters.searchTerm}`}
                      size="small"
                      onDelete={() => handleFilterChange('searchTerm', '')}
                    />
                  )}
                  {filters.category && (
                    <Chip
                      label={`Category: ${categories.find(c => c.id === filters.category)?.name}`}
                      size="small"
                      onDelete={() => handleFilterChange('category', '')}
                    />
                  )}
                  {filters.status !== 'all' && (
                    <Chip
                      label={`Status: ${filters.status}`}
                      size="small"
                      onDelete={() => handleFilterChange('status', 'all')}
                    />
                  )}
                  {filters.gstRate !== undefined && (
                    <Chip
                      label={`GST: ${filters.gstRate}%`}
                      size="small"
                      onDelete={() => handleFilterChange('gstRate', undefined)}
                    />
                  )}
                  {filters.isService !== undefined && (
                    <Chip
                      label={`Type: ${filters.isService ? 'Service' : 'Goods'}`}
                      size="small"
                      onDelete={() => handleFilterChange('isService', undefined)}
                    />
                  )}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        )}

        {/* Results Summary */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {products.length} products found
            {selectedProducts.length > 0 && ` • ${selectedProducts.length} selected`}
          </Typography>
          
          {selectedProducts.length > 0 && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => setBulkDialog(true)}
            >
              Bulk Actions ({selectedProducts.length})
            </Button>
          )}
        </Box>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <ProductList
            products={products}
            loading={loading}
            onEdit={(product) => {
              setSelectedProduct(product);
              setProductDialog(true);
            }}
            onDelete={handleDeleteProduct}
            onView={(product) => {
              setSelectedProduct(product);
              setViewDialog(true);
            }}
            onSelectionChange={setSelectedProducts}
            selectedProducts={selectedProducts}
            onRefresh={loadProducts}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <ProductAnalytics
            products={products}
            categories={categories}
            stats={stats}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <BulkOperations
            selectedProducts={selectedProducts}
            products={products.filter(p => selectedProducts.includes(p.id!))}
            categories={categories}
            onUpdate={handleBulkUpdate}
            onClose={() => setSelectedProducts([])}
          />
        </TabPanel>

        {/* Mobile Speed Dial */}
        {isMobile && (
          <SpeedDial
            ariaLabel="Product actions"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            icon={<SpeedDialIcon />}
          >
            {speedDialActions.map((action) => (
              <SpeedDialAction
                key={action.name}
                icon={action.icon}
                tooltipTitle={action.name}
                onClick={action.onClick}
              />
            ))}
          </SpeedDial>
        )}

        {/* Desktop FAB */}
        {!isMobile && (
          <Fab
            color="primary"
            aria-label="add product"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={() => {
              setSelectedProduct(null);
              setProductDialog(true);
            }}
          >
            <AddIcon />
          </Fab>
        )}

        {/* Mobile Filter Drawer */}
        <Drawer
          anchor="right"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
        >
          {filterDrawerContent}
        </Drawer>

        {/* Product Form Dialog */}
        <Dialog
          open={productDialog}
          onClose={() => setProductDialog(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>
            {selectedProduct ? 'Edit Product' : 'Create New Product'}
          </DialogTitle>
          <DialogContent>
            <ProductForm
              initialData={selectedProduct || undefined}
              onSubmit={selectedProduct ? handleUpdateProduct : handleCreateProduct}
              onCancel={() => setProductDialog(false)}
              mode={selectedProduct ? 'edit' : 'create'}
              error={error}
            />
          </DialogContent>
        </Dialog>

        {/* Product View Dialog */}
        <Dialog
          open={viewDialog}
          onClose={() => setViewDialog(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>Product Details</DialogTitle>
          <DialogContent>
            {selectedProduct && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">{selectedProduct.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedProduct.description}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Category:</strong> {selectedProduct.categoryId}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Price:</strong> ₹{selectedProduct.price}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Stock:</strong> {selectedProduct.quantity} {selectedProduct.unitOfMeasurement}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>GST Rate:</strong> {selectedProduct.gstExempt ? 'Exempt' : `${selectedProduct.gstRate}%`}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>HSN/SAC:</strong> {selectedProduct.hsnCode || selectedProduct.sacCode || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Type:</strong> {selectedProduct.isService ? 'Service' : 'Goods'}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialog(false)}>Close</Button>
            <Button
              variant="contained"
              onClick={() => {
                setViewDialog(false);
                setProductDialog(true);
              }}
            >
              Edit
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Operations Dialog */}
        <Dialog
          open={bulkDialog}
          onClose={() => setBulkDialog(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>Bulk Operations</DialogTitle>
          <DialogContent>
            <BulkOperations
              selectedProducts={selectedProducts}
              products={products.filter(p => selectedProducts.includes(p.id!))}
              categories={categories}
              onUpdate={handleBulkUpdate}
              onClose={() => setBulkDialog(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <Dialog
          open={importDialog}
          onClose={() => setImportDialog(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>Import Products</DialogTitle>
          <DialogContent>
            <ProductImportExport
              onImportComplete={() => {
                setImportDialog(false);
                loadProducts();
              }}
              onClose={() => setImportDialog(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Success Snackbar */}
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
        >
          <Alert onClose={() => setSuccess(null)} severity="success">
            {success}
          </Alert>
        </Snackbar>

        {/* Error Snackbar */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert onClose={() => setError(null)} severity="error">
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </ImprovedDashboardLayout>
  );
}