"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Box,
  TextField,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Checkbox,
  Grid,
  Slider,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Tooltip,
  Badge,
  Tabs,
  Tab,
  Divider,
  InputAdornment,
  Switch,
  FormControlLabel,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Menu,
  ListItemIcon,
  ListItemText,
  Collapse,
  LinearProgress,
  Stack,
  ButtonGroup,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  GetApp as ExportIcon,
  Upload as UploadIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Category as CategoryIcon,
  MonetizationOn as MoneyIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
  Dashboard as DashboardIcon,
  List as ListIcon,
  ViewModule as GridViewIcon,
  Sort as SortIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocalOffer as TagIcon,
  Store as StoreIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';
import PageHeader from '@/components/PageHeader/PageHeader';
import ExcelImportExport from '@/components/products/ExcelImportExport';
import ExportAllProducts from '@/components/products/ExportAllProducts';
import ExportSelectedProducts from '@/components/products/ExportSelectedProducts';
import { RemoveDuplicatesButton } from '@/components/Common/RemoveDuplicatesButton';
import { productService, ProductFilters, ProductSortOptions, PaginationOptions } from '@/services/productService';
import { Product, Category } from '@/types/inventory';
import { categoryService } from '@/services/categoryService';

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

interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  totalValue: number;
  avgPrice: number;
  topCategory: string;
  recentlyAdded: number;
  outOfStock: number;
}

export default function EnhancedProductsPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProductStats>({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    totalValue: 0,
    avgPrice: 0,
    topCategory: '',
    recentlyAdded: 0,
    outOfStock: 0
  });

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'low-stock'>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [stockRange, setStockRange] = useState<[number, number]>([0, 1000]);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  // Pagination and sorting
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [lastVisible, setLastVisible] = useState<any>(null);
  
  type SortField = 'name' | 'price' | 'quantity' | 'createdAt';
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Dialog and selection states
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newProductData, setNewProductData] = useState<Partial<Product>>({});
  const [selectedProductsSet, setSelectedProductsSet] = useState<Set<string>>(new Set());
  const selectedProducts = useMemo(() => Array.from(selectedProductsSet), [selectedProductsSet]);
  
  // Bulk operations
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<null | HTMLElement>(null);
  const [bulkCategoryDialogOpen, setBulkCategoryDialogOpen] = useState(false);
  const [selectedBulkCategory, setSelectedBulkCategory] = useState('');
  
  // UI states
  const [snackbar, setSnackbar] = useState<{ 
    open: boolean; 
    message: string; 
    severity: 'success' | 'error' | 'info' | 'warning'; 
  }>({ open: false, message: '', severity: 'success' });

  const searchDebounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Calculate statistics
  const calculateStats = useCallback((productList: Product[]) => {
    const totalProducts = productList.length;
    const activeProducts = productList.filter(p => p.isActive).length;
    const lowStockProducts = productList.filter(p => p.quantity < (p.reorderPoint || 10)).length;
    const outOfStock = productList.filter(p => p.quantity === 0).length;
    const totalValue = productList.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const avgPrice = totalProducts > 0 ? totalValue / totalProducts : 0;
    
    // Find top category
    const categoryCount = productList.reduce((acc, p) => {
      acc[p.categoryId] = (acc[p.categoryId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topCategoryId = Object.entries(categoryCount).sort(([,a], [,b]) => b - a)[0]?.[0];
    const topCategory = categories.find(c => c.id === topCategoryId)?.name || 'N/A';
    
    // Recently added (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentlyAdded = productList.filter(p => 
      p.createdAt && new Date(p.createdAt) > weekAgo
    ).length;

    setStats({
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalValue,
      avgPrice,
      topCategory,
      recentlyAdded,
      outOfStock
    });
  }, [categories]);

  const fetchCategories = useCallback(async () => {
    try {
      const categoriesData = await categoryService.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setSnackbar({ open: true, message: 'Failed to fetch categories.', severity: 'error' });
    }
  }, []);

  const fetchData = useCallback(async (resetPagination = false) => {
    setLoading(true);
    setError(null);

    const currentPage = resetPagination ? 0 : page;
    if (resetPagination) {
      setPage(0);
    }

    try {
      const filters: ProductFilters = {
        searchTerm: searchTerm || undefined,
        category: categoryFilter || undefined,
        status: statusFilter,
        priceRange: priceRange[0] > 0 || priceRange[1] < 10000 ? priceRange : undefined,
        stockRange: stockRange[0] > 0 || stockRange[1] < 1000 ? stockRange : undefined,
      };

      const sortOptions: ProductSortOptions = { field: sortField, direction: sortDirection };
      const paginationOptions: PaginationOptions = { 
        page: currentPage, 
        limit: rowsPerPage, 
        lastVisible: resetPagination ? undefined : lastVisible 
      };

      const response = await productService.getProducts(filters, sortOptions, paginationOptions);
      
      setProducts(response.products);
      setTotalCount(response.totalCount);
      setLastVisible(response.lastVisible);
      calculateStats(response.products);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, categoryFilter, statusFilter, priceRange, stockRange, sortField, sortDirection, lastVisible, calculateStats]);

  useEffect(() => {
    fetchCategories();
    const savedRowsPerPage = localStorage.getItem('productsRowsPerPage');
    if (savedRowsPerPage) setRowsPerPage(parseInt(savedRowsPerPage, 10));
    const savedViewMode = localStorage.getItem('productsViewMode') as 'table' | 'grid';
    if (savedViewMode) setViewMode(savedViewMode);
  }, [fetchCategories]);

  useEffect(() => {
    if (searchDebounceTimeout.current) clearTimeout(searchDebounceTimeout.current);
    searchDebounceTimeout.current = setTimeout(() => {
      fetchData(true);
    }, 500);
    return () => { 
      if (searchDebounceTimeout.current) clearTimeout(searchDebounceTimeout.current);
    };
  }, [searchTerm, categoryFilter, statusFilter, priceRange, stockRange, sortField, sortDirection, rowsPerPage]);

  useEffect(() => {
    if (page > 0) fetchData(false);
  }, [page]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleViewModeChange = (mode: 'table' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('productsViewMode', mode);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStatusFilter('all');
    setPriceRange([0, 10000]);
    setStockRange([0, 1000]);
    setAdvancedFiltersOpen(false);
    setShowInactive(false);
  };

  const handleSort = (field: SortField) => {
    setSortDirection(sortField === field && sortDirection === 'asc' ? 'desc' : 'asc');
    setSortField(field);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setNewProductData({});
    setOpenDialog(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setNewProductData(product);
    setOpenDialog(true);
  };

  const handleSaveProduct = async () => {
    if (!newProductData.name || !newProductData.categoryId || 
        newProductData.price === undefined || newProductData.quantity === undefined) {
      setSnackbar({ open: true, message: 'Please fill all required fields.', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      if (selectedProduct?.id) {
        await productService.updateProduct(selectedProduct.id, newProductData);
        setSnackbar({ open: true, message: 'Product updated successfully!', severity: 'success' });
      } else {
        await productService.createProduct(newProductData as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);
        setSnackbar({ open: true, message: 'Product created successfully!', severity: 'success' });
      }
      setOpenDialog(false);
      fetchData(true);
    } catch (err) {
      console.error('Error saving product:', err);
      setSnackbar({ open: true, message: 'Failed to save product.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setLoading(true);
      try {
        await productService.deleteProduct(id);
        setSnackbar({ open: true, message: 'Product deleted successfully.', severity: 'success' });
        fetchData(true);
      } catch (err) {
        console.error('Error deleting product:', err);
        setSnackbar({ open: true, message: 'Failed to delete product.', severity: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkCategoryChange = async () => {
    if (!selectedBulkCategory || selectedProducts.length === 0) return;
    
    setLoading(true);
    try {
      await productService.bulkUpdateProducts(selectedProducts, { categoryId: selectedBulkCategory });
      setSnackbar({ 
        open: true, 
        message: `Updated ${selectedProducts.length} products successfully.`, 
        severity: 'success' 
      });
      fetchData(true);
      setSelectedProductsSet(new Set());
      setBulkCategoryDialogOpen(false);
    } catch (err) {
      console.error('Error updating categories:', err);
      setSnackbar({ open: true, message: 'Failed to update categories.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedProductsSet(new Set(products.map((n) => n.id!)));
    } else {
      setSelectedProductsSet(new Set());
    }
  };

  const handleSelectClick = (id: string) => {
    const newSelecteds = new Set(selectedProductsSet);
    if (newSelecteds.has(id)) {
      newSelecteds.delete(id);
    } else {
      newSelecteds.add(id);
    }
    setSelectedProductsSet(newSelecteds);
  };

  const productsWithCategoryData = useMemo(() => {
    return products.map(p => ({
      ...p,
      categoryName: categories.find(c => c.id === p.categoryId)?.name || 'N/A',
      status: p.isActive ? 
        (p.quantity === 0 ? 'Out of Stock' :
         p.quantity < (p.reorderPoint || 10) ? 'Low Stock' : 'In Stock') : 
        'Inactive',
    }));
  }, [products, categories]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'success';
      case 'Low Stock': return 'warning';
      case 'Out of Stock': return 'error';
      case 'Inactive': return 'default';
      default: return 'default';
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary', trend, subtitle }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ mb: 1 }}>
              {value}
            </Typography>
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {trend >= 0 ? (
                  <TrendingUpIcon color="success" fontSize="small" />
                ) : (
                  <TrendingDownIcon color="error" fontSize="small" />
                )}
                <Typography
                  variant="body2"
                  color={trend >= 0 ? 'success.main' : 'error.main'}
                  sx={{ ml: 0.5 }}
                >
                  {Math.abs(trend).toFixed(1)}%
                </Typography>
              </Box>
            )}
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const speedDialActions = [
    { 
      icon: <AddIcon />, 
      name: 'Add Product', 
      action: handleAddProduct,
      color: theme.palette.primary.main
    },
    { 
      icon: <UploadIcon />, 
      name: 'Import Excel', 
      action: () => {},
      color: theme.palette.info.main
    },
    { 
      icon: <ExportIcon />, 
      name: 'Export All', 
      action: () => {},
      color: theme.palette.success.main
    },
    { 
      icon: <SettingsIcon />, 
      name: 'Settings', 
      action: () => router.push('/settings'),
      color: theme.palette.grey[600]
    },
  ];

  return (
    <ImprovedDashboardLayout>
      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        <PageHeader
          title="Product Management"
          subtitle="Manage your inventory with advanced tools and analytics"
          icon={<InventoryIcon />}
          actions={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => fetchData(true)}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddProduct}
              >
                Add Product
              </Button>
            </Box>
          }
        />

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab icon={<DashboardIcon />} label="Dashboard" />
            <Tab icon={<ListIcon />} label="All Products" />
            <Tab icon={<AnalyticsIcon />} label="Analytics" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          {/* Dashboard Tab */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Products"
                value={stats.totalProducts}
                icon={<InventoryIcon />}
                color="primary"
                subtitle="All products"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Active Products"
                value={stats.activeProducts}
                icon={<CheckCircleIcon />}
                color="success"
                subtitle="Currently active"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Low Stock"
                value={stats.lowStockProducts}
                icon={<WarningIcon />}
                color="warning"
                subtitle="Need restocking"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Value"
                value={formatCurrency(stats.totalValue)}
                icon={<MoneyIcon />}
                color="info"
                subtitle="Inventory value"
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={handleAddProduct}
                      >
                        Add Product
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<ExportIcon />}
                        onClick={() => setActiveTab(1)}
                      >
                        Export
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<CategoryIcon />}
                        onClick={() => router.push('/categories')}
                      >
                        Categories
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<AnalyticsIcon />}
                        onClick={() => setActiveTab(2)}
                      >
                        Analytics
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Inventory Summary
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Average Price</Typography>
                      <Typography>{formatCurrency(stats.avgPrice)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Top Category</Typography>
                      <Typography>{stats.topCategory}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Recently Added</Typography>
                      <Chip label={stats.recentlyAdded} size="small" color="primary" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Out of Stock</Typography>
                      <Chip 
                        label={stats.outOfStock} 
                        size="small" 
                        color={stats.outOfStock > 0 ? "error" : "success"} 
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {/* All Products Tab */}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Quick Actions */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <ExcelImportExport onSuccess={() => fetchData(true)} />
            <ExportAllProducts />
            <RemoveDuplicatesButton onSuccess={() => fetchData(true)} />
          </Box>

          {/* Product Table/Grid would go here */}
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Product List
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Product listing functionality would be implemented here
            </Typography>
          </Paper>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {/* Analytics Tab */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Product Analytics
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Detailed analytics and insights about your product inventory.
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Button variant="outlined" disabled>
                      Coming Soon
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Enhanced Speed Dial - Mobile Optimized */}
        <SpeedDial
          ariaLabel="Product Actions"
          direction="up"
          sx={{
            position: 'fixed',
            bottom: { xs: 'calc(env(safe-area-inset-bottom) + 80px)', sm: 80 },
            right: { xs: 16, sm: 24 },
            zIndex: theme.zIndex.speedDial,
            '& .MuiSpeedDial-fab': {
              width: { xs: 56, sm: 64 },
              height: { xs: 56, sm: 64 },
              background: `linear-gradient(135deg, 
                ${theme.palette.primary.main} 0%, 
                ${theme.palette.secondary.main} 100%)`,
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              '&:hover': {
                background: `linear-gradient(135deg, 
                  ${theme.palette.primary.dark} 0%, 
                  ${theme.palette.secondary.dark} 100%)`,
                transform: 'scale(1.1)',
                boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.4)}`,
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
            },
          }}
          icon={<SpeedDialIcon />}
          FabProps={{
            size: isMobile ? 'medium' : 'large',
          }}
        >
          {speedDialActions.map((action, index) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.action}
              tooltipOpen={!isMobile}
              TooltipProps={{ 
                placement: 'left',
                enterDelay: isMobile ? 0 : 200,
                sx: {
                  '& .MuiTooltip-tooltip': {
                    backgroundColor: alpha(theme.palette.background.paper, 0.95),
                    color: theme.palette.text.primary,
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    fontSize: '0.875rem',
                  },
                },
              }}
              sx={{
                '& .MuiSpeedDialAction-fab': {
                  width: { xs: 48, sm: 56 },
                  height: { xs: 48, sm: 56 },
                  minHeight: { xs: 48, sm: 56 },
                  background: `linear-gradient(135deg, 
                    ${alpha(action.color, 0.9)} 0%, 
                    ${alpha(action.color, 0.7)} 100%)`,
                  boxShadow: `0 4px 16px ${alpha(action.color, 0.3)}`,
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${alpha(action.color, 0.3)}`,
                  marginBottom: index === 0 ? 1 : 0.5,
                  '&:hover': {
                    transform: 'scale(1.1)',
                    background: `linear-gradient(135deg, 
                      ${action.color} 0%, 
                      ${alpha(action.color, 0.9)} 100%)`,
                    boxShadow: `0 6px 24px ${alpha(action.color, 0.4)}`,
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                  },
                },
                '& .MuiSpeedDialAction-staticTooltipLabel': {
                  backgroundColor: alpha(theme.palette.background.paper, 0.95),
                  color: theme.palette.text.primary,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  borderRadius: theme.shape.borderRadius,
                  padding: '8px 12px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`,
                  whiteSpace: 'nowrap',
                  minWidth: 'auto',
                },
              }}
            />
          ))}
        </SpeedDial>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </ImprovedDashboardLayout>
  );
}