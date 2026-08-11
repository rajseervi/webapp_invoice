"use client"; 
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import { Button, Stack } from '@mui/material'; 

import PageHeader from '@/components/PageHeader/PageHeader';
import ExcelImportExport from '@/components/products/ExcelImportExport';
import ExportAllProducts from '@/components/products/ExportAllProducts';
import ExportSelectedProducts from '@/app/products/components/ExportSelectedProducts';
import CategoryDiscountManagement from '@/components/products/CategoryDiscountManagement';

import { RemoveDuplicatesButton } from '@/components/Common/RemoveDuplicatesButton';
import BulkPriceUpdate from '@/components/products/BulkPriceUpdate';
import AdvancedProductsTable from '@/app/products/components/AdvancedProductsTable';
import { productService, ProductFilters, ProductSortOptions, PaginationOptions } from '@/services/productService';
import { Product, Category } from '@/types/inventory';
import { categoryService } from '@/services/categoryService';

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
  Grid as MuiGrid,
  Slider,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Avatar,
  Divider,
  LinearProgress,
  InputAdornment,
  Badge,
} from '@mui/material';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  LocalOffer as DiscountIcon,
  ViewList as TableViewIcon,
  ViewModule as CardViewIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  MoreVert as MoreVertIcon,
  Speed as SpeedIcon,
  BarChart as BarChartIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Tune as TuneIcon,
  FileUpload as FileUploadIcon,
  FileDownload as FileDownloadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { alpha, useTheme, Fade, Grow, Zoom } from '@mui/material'; 

function ProductsPage() {
  const theme = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'low-stock'>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [stockRange, setStockRange] = useState<[number, number]>([0, 2000]);
  const [showFilters, setShowFilters] = useState(false);
  const [floatingMenuOpen, setFloatingMenuOpen] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [lastVisible, setLastVisible] = useState<any>(null);

  type SortField = 'name' | 'price' | 'quantity' | 'createdAt';
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newProductData, setNewProductData] = useState<Partial<Product>>({});
  const [selectedProductsSet, setSelectedProductsSet] = useState<Set<string>>(new Set());
  const selectedProducts = useMemo(() => Array.from(selectedProductsSet), [selectedProductsSet]);
  const [bulkCategoryDialogOpen, setBulkCategoryDialogOpen] = useState(false);
  const [selectedBulkCategory, setSelectedBulkCategory] = useState('');
  const [categoryDiscountDialogOpen, setCategoryDiscountDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [listVisible, setListVisible] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const justAdded = sessionStorage.getItem('productsJustAdded') === 'true';
      if (justAdded) {
        sessionStorage.removeItem('productsJustAdded');
        return false;
      }
    }
    return true;
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning'; }>({ open: false, message: '', severity: 'success' });

  const searchDebounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (categoryFilter) count++;
    if (statusFilter !== 'all') count++;
    if (priceRange[0] > 0 || priceRange[1] < 50000) count++;
    if (stockRange[0] > 0 || stockRange[1] < 2000) count++;
    return count;
  }, [categoryFilter, statusFilter, priceRange, stockRange]);

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
      setLastVisible(null);
    }

    try {
      const filters: ProductFilters = {
        searchTerm: searchTerm || undefined,
        category: categoryFilter || undefined,
        status: statusFilter,
        priceRange: priceRange[0] > 0 || priceRange[1] < 50000 ? priceRange : undefined,
        stockRange: stockRange[0] > 0 || stockRange[1] < 2000 ? stockRange : undefined,
      };

      const hasClientSideFilters = !!(filters.searchTerm || filters.priceRange || filters.stockRange);

      const sortOptions: ProductSortOptions = { field: sortField, direction: sortDirection };
      const paginationOptions: PaginationOptions | undefined = (resetPagination || hasClientSideFilters) ? undefined : {
        page: currentPage,
        limit: rowsPerPage,
        lastVisible: lastVisible
      };

      const response = await productService.getProducts(filters, sortOptions, paginationOptions || undefined);
      setProducts(response.products);
      setTotalCount(response.totalCount);
      setLastVisible(response.lastVisible);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, categoryFilter, statusFilter, priceRange, stockRange, sortField, sortDirection, lastVisible]);

  useEffect(() => {
    fetchCategories();
    const savedRowsPerPage = localStorage.getItem('productsRowsPerPage');
    if (savedRowsPerPage) setRowsPerPage(parseInt(savedRowsPerPage, 10));
  }, [fetchCategories]);

  useEffect(() => {
    if (searchDebounceTimeout.current) clearTimeout(searchDebounceTimeout.current);
    searchDebounceTimeout.current = setTimeout(() => {
      fetchData(true);
    }, 400);
    return () => { if (searchDebounceTimeout.current) clearTimeout(searchDebounceTimeout.current) };
  }, [searchTerm, categoryFilter, statusFilter, priceRange, stockRange, sortField, sortDirection, rowsPerPage]);

  useEffect(() => {
    if (page > 0) {
      const hasClientSideFilters = !!(searchTerm || (priceRange[0] > 0 || priceRange[1] < 50000) || (stockRange[0] > 0 || stockRange[1] < 2000));
      if (!hasClientSideFilters) fetchData(false);
    }
  }, [page]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    if (event.target.value.trim()) {
      setLoading(true);
    }
  };
  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStatusFilter('all');
    setPriceRange([0, 50000]);
    setStockRange([0, 2000]);
    setShowFilters(false);
  };
  const handleChangePage = (event: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    localStorage.setItem('productsRowsPerPage', event.target.value);
  };
  const handleSort = (field: SortField) => {
    setSortDirection(sortField === field && sortDirection === 'asc' ? 'desc' : 'asc');
    setSortField(field);
  };
  const handleAddProduct = () => { setSelectedProduct(null); setNewProductData({}); setOpenDialog(true); };
  const handleEditProduct = (product: Product) => { setSelectedProduct(product); setNewProductData(product); setOpenDialog(true); };
  const handleCloseDialog = () => setOpenDialog(false);

  const handleSaveProduct = async () => {
    if (!newProductData.name || !newProductData.categoryId || newProductData.price === undefined || newProductData.purchasePrice === undefined || newProductData.quantity === undefined) {
        setSnackbar({ open: true, message: 'Please fill all required fields including purchase price.', severity: 'error' });
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
        setListVisible(false);
      }
      await fetchData(true);
      await fetchCategories();
      setOpenDialog(false);
    } catch (err) {
      console.error('Error saving product:', err);
      setSnackbar({ open: true, message: 'Failed to save product.', severity: 'error' });
    } finally { setLoading(false); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure?')) {
      setLoading(true);
      try {
        await productService.deleteProduct(id);
        setSnackbar({ open: true, message: 'Product deleted.', severity: 'success' });
        await fetchData(true);
        await fetchCategories();
      } catch (err) {
        console.error('Error deleting product:', err);
        setSnackbar({ open: true, message: 'Failed to delete product.', severity: 'error' });
      } finally { setLoading(false); }
    }
  };
  
  const handleBulkCategoryChange = async () => {
    if (!selectedBulkCategory || selectedProducts.length === 0) return;
    setLoading(true);
    try {
        await productService.bulkUpdateProducts(selectedProducts, { categoryId: selectedBulkCategory });
        setSnackbar({ open: true, message: 'Products updated.', severity: 'success' });
        await fetchData(true);
        await fetchCategories();
        setSelectedProductsSet(new Set());
        setBulkCategoryDialogOpen(false);
    } catch (err) {
        console.error('Error updating categories:', err);
        setSnackbar({ open: true, message: 'Failed to update categories.', severity: 'error' });
    } finally { setLoading(false); }
  };

  const handleBulkDeleteProducts = async () => {
    if (selectedProducts.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedProducts.length} selected product(s)? This action cannot be undone.`)) return;
    setLoading(true);
    try {
        await productService.bulkDeleteProducts(selectedProducts);
        setSnackbar({ open: true, message: `${selectedProducts.length} product(s) deleted successfully.`, severity: 'success' });
        await fetchData(true);
        await fetchCategories();
        setSelectedProductsSet(new Set());
    } catch (err) {
        console.error('Error deleting products:', err);
        setSnackbar({ open: true, message: 'Failed to delete selected products.', severity: 'error' });
    } finally { setLoading(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setNewProductData({ ...newProductData, [name as string]: value });
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
    if (newSelecteds.has(id)) newSelecteds.delete(id);
    else newSelecteds.add(id);
    setSelectedProductsSet(newSelecteds);
  };

  const productsWithCategoryData = useMemo(() => {
    return products.map(p => ({
        ...p,
        categoryName: categories.find(c => c.id === p.categoryId)?.name || 'N/A',
        status: p.isActive ? (p.quantity < (p.reorderPoint || 10) ? 'Low Stock' : 'In Stock') : 'Inactive',
    }));
  }, [products, categories]);

  const stats = useMemo(() => {
    const lowStockCount = productsWithCategoryData.filter(p => p.status === 'Low Stock').length;
    const inStockCount = productsWithCategoryData.filter(p => p.status === 'In Stock').length;
    const inactiveCount = productsWithCategoryData.filter(p => p.status === 'Inactive').length;
    const totalInventoryValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.quantity || 0)), 0);
    return { lowStockCount, inStockCount, inactiveCount, totalInventoryValue };
  }, [productsWithCategoryData, products]);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val.toFixed(0)}`;
  };

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return (
      <Box component="span" sx={{ ml: 0.5, fontSize: '0.7rem', opacity: 0.6 }}>
        {sortDirection === 'asc' ? '▲' : '▼'}
      </Box>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 2, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
      <PageHeader title="Products" />
      
      {/* Compact Stats Bar */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: { xs: 1.5, sm: 2 },
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(8px)',
        }}
      >
        <MuiGrid container spacing={2} alignItems="center">
          <MuiGrid size={{ xs: 6, sm: 4, md: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12), color: theme.palette.primary.main, width: 38, height: 38 }}>
                <InventoryIcon fontSize="small" />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" fontWeight={700} lineHeight={1.2}>{totalCount}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>Total</Typography>
              </Box>
            </Box>
          </MuiGrid>
          <MuiGrid size={{ xs: 6, sm: 4, md: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.12), color: theme.palette.success.main, width: 38, height: 38 }}>
                <CheckCircleIcon fontSize="small" />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" fontWeight={700} lineHeight={1.2} color="success.main">{stats.inStockCount}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>In Stock</Typography>
              </Box>
            </Box>
          </MuiGrid>
          <MuiGrid size={{ xs: 6, sm: 4, md: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.12), color: theme.palette.warning.main, width: 38, height: 38 }}>
                <WarningIcon fontSize="small" />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" fontWeight={700} lineHeight={1.2} color="warning.main">{stats.lowStockCount}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>Low Stock</Typography>
              </Box>
            </Box>
          </MuiGrid>
          <MuiGrid size={{ xs: 6, sm: 4, md: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.12), color: theme.palette.info.main, width: 38, height: 38 }}>
                <MoneyIcon fontSize="small" />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" fontWeight={700} lineHeight={1.2} color="info.main">{formatCurrency(stats.totalInventoryValue)}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>Value</Typography>
              </Box>
            </Box>
          </MuiGrid>
          <MuiGrid size={{ xs: 6, sm: 4, md: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.12), color: theme.palette.secondary.main, width: 38, height: 38 }}>
                <CategoryIcon fontSize="small" />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" fontWeight={700} lineHeight={1.2} color="secondary.main">{categories.length}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>Categ.</Typography>
              </Box>
            </Box>
          </MuiGrid>
          {stats.inactiveCount > 0 && (
            <MuiGrid size={{ xs: 6, sm: 4, md: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.grey[500], 0.12), color: theme.palette.grey[500], width: 38, height: 38 }}>
                  <CloseIcon fontSize="small" />
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" fontWeight={700} lineHeight={1.2} color="text.disabled">{stats.inactiveCount}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>Inactive</Typography>
                </Box>
              </Box>
            </MuiGrid>
          )}
        </MuiGrid>
      </Paper>

      {/* Search + Toolbar */}
      <Paper
        elevation={0}
        sx={{
          mb: 2,
          p: { xs: 1.5, sm: 2 },
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Search Row */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: showFilters ? 2 : 0 }}>
          <TextField
            placeholder="Search by name, SKU..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearch}
            sx={{
              flex: 1,
              maxWidth: 480,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.background.default, 0.5),
                '&:hover': { backgroundColor: alpha(theme.palette.background.default, 0.8) },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ p: 0.5 }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          <Badge badgeContent={activeFiltersCount} color="primary" invisible={activeFiltersCount === 0}>
            <Button
              variant={showFilters ? "contained" : "outlined"}
              startIcon={<TuneIcon />}
              onClick={() => setShowFilters(!showFilters)}
              size="small"
              sx={{ borderRadius: 2, whiteSpace: 'nowrap', minWidth: 'auto', px: 2 }}
            >
              Filters
            </Button>
          </Badge>
          {activeFiltersCount > 0 && (
            <Tooltip title="Clear all filters">
              <IconButton onClick={handleClearFilters} size="small" color="error" sx={{ p: 1 }}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Box sx={{ flex: 1 }} />
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newView) => newView && setViewMode(newView)}
            size="small"
            sx={{ '& .MuiToggleButton-root': { px: 1.5, borderRadius: 2 } }}
          >
            <ToggleButton value="table" aria-label="table view">
              <Tooltip title="Table View"><TableViewIcon fontSize="small" /></Tooltip>
            </ToggleButton>
            <ToggleButton value="cards" aria-label="card view">
              <Tooltip title="Card View"><CardViewIcon fontSize="small" /></Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Expandable Filters */}
        {showFilters && (
          <Fade in={showFilters} timeout={300}>
            <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <MuiGrid container spacing={2}>
                <MuiGrid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      label="Category"
                      sx={{ borderRadius: 1.5 }}
                    >
                      <MenuItem value=""><em>All Categories</em></MenuItem>
                      {categories.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </MuiGrid>
                <MuiGrid size={{ xs: 12, sm: 6, md: 2 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      label="Status"
                      sx={{ borderRadius: 1.5 }}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="low-stock">Low Stock</MenuItem>
                    </Select>
                  </FormControl>
                </MuiGrid>
                <MuiGrid size={{ xs: 12, sm: 6, md: 3.5 }}>
                  <Typography variant="caption" display="block" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Price: ₹{priceRange[0]} – ₹{priceRange[1]}
                  </Typography>
                  <Slider
                    value={priceRange}
                    onChange={(e, v) => setPriceRange(v as [number, number])}
                    valueLabelDisplay="auto"
                    min={0}
                    max={50000}
                    step={500}
                    size="small"
                    sx={{ py: 0.5 }}
                  />
                </MuiGrid>
                <MuiGrid size={{ xs: 12, sm: 6, md: 3.5 }}>
                  <Typography variant="caption" display="block" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Stock: {stockRange[0]} – {stockRange[1]}
                  </Typography>
                  <Slider
                    value={stockRange}
                    onChange={(e, v) => setStockRange(v as [number, number])}
                    valueLabelDisplay="auto"
                    min={0}
                    max={2000}
                    step={50}
                    size="small"
                    sx={{ py: 0.5 }}
                  />
                </MuiGrid>
              </MuiGrid>
            </Box>
          </Fade>
        )}
      </Paper>

      {/* Action Toolbar */}
      <Box
        sx={{
          display: 'flex',
          gap: { xs: 0.5, sm: 1 },
          mb: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddProduct}
          size="small"
          sx={{ borderRadius: 2, px: { xs: 1.5, sm: 2.5 } }}
        >
          Add
        </Button>
        <Button
          variant="outlined"
          startIcon={<DiscountIcon />}
          onClick={() => setCategoryDiscountDialogOpen(true)}
          size="small"
          sx={{ borderRadius: 2, px: { xs: 1.5, sm: 2.5 } }}
        >
          Discounts
        </Button>
        <ExcelImportExport onSuccess={() => {
          setLastVisible(null);
          setPage(0);
          setSelectedProductsSet(new Set());
          fetchCategories();
          setTimeout(() => { fetchData(true); }, 500);
        }} />
        <ExportAllProducts />
        <BulkPriceUpdate
          selectedIds={selectedProducts}
          onSuccess={() => {
            setLastVisible(null);
            setPage(0);
            setTimeout(() => { fetchData(true); }, 500);
          }}
        />
        <RemoveDuplicatesButton onSuccess={() => fetchData(true)} />
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
      )}

      {/* Bulk Selection Bar */}
      {selectedProducts.length > 0 && (
        <Fade in={selectedProducts.length > 0} timeout={300}>
          <Card
            sx={{
              mb: 2,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
              border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                    <CheckCircleIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {selectedProducts.length} selected
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <ExportSelectedProducts
                    selectedIds={selectedProducts}
                    onShowSnackbar={(message, severity) => setSnackbar({ open: true, message, severity })}
                  />
                  <Button
                    variant="contained"
                    color="secondary"
                    size="small"
                    onClick={() => setBulkCategoryDialogOpen(true)}
                    sx={{ borderRadius: 1.5 }}
                  >
                    Update Category
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={handleBulkDeleteProducts}
                    sx={{ borderRadius: 1.5 }}
                  >
                    Delete ({selectedProducts.length})
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => setSelectedProductsSet(new Set())}
                    sx={{ color: 'text.secondary' }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      )}

      {listVisible || searchTerm.trim() ? (
      <>
      {/* Products Display */}
      {viewMode === 'table' ? (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            overflow: 'hidden',
          }}
        >
          <AdvancedProductsTable
            products={products as Product[]}
            categories={categories}
            loading={loading}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onSelectionChange={(ids) => setSelectedProductsSet(new Set(ids))}
          />
        </Paper>
      ) : (
        /* Card Grid View */
        <Box>
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress size={32} />
            </Box>
          ) : productsWithCategoryData.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
              <InventoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No products found
              </Typography>
              <Typography variant="body2" color="text.disabled">
                {activeFiltersCount > 0
                  ? 'Try adjusting your filters or clear them'
                  : 'Click "Add" above to create your first product'}
              </Typography>
            </Paper>
          ) : (
            <MuiGrid container spacing={2}>
              {productsWithCategoryData.map((product) => (
                <MuiGrid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      border: selectedProductsSet.has(product.id!)
                        ? `2px solid ${theme.palette.primary.main}`
                        : `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                      transition: 'all 0.25s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.12)}`,
                      },
                    }}
                    onClick={() => handleEditProduct(product)}
                  >
                    {/* Card Header */}
                    <Box sx={{ p: 2, pb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Chip
                          label={product.categoryName}
                          size="small"
                          variant="outlined"
                          sx={{ borderRadius: 1, fontSize: '0.65rem', height: 20 }}
                        />
                        <Checkbox
                          checked={selectedProductsSet.has(product.id!)}
                          onChange={(e) => { e.stopPropagation(); handleSelectClick(product.id!); }}
                          size="small"
                          sx={{ p: 0, mt: -0.5, mr: -0.5 }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Box>
                      <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ mb: 0.5 }}>
                        {product.name}
                      </Typography>
                    </Box>

                    {/* Pricing */}
                    <Box sx={{ px: 2, pb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography variant="h5" fontWeight={700} color="primary.main" lineHeight={1}>
                          ₹{(parseFloat(product.price as any) || 0).toFixed(0)}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          sell price
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Cost: ₹{(parseFloat(product.purchasePrice as any) || 0).toFixed(0)}
                      </Typography>
                    </Box>

                    {/* Stock */}
                    <Box sx={{ px: 2, pb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                          Stock Level
                        </Typography>
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color={(product.quantity || 0) < (product.reorderPoint || 10) ? 'warning.main' : 'success.main'}
                        >
                          {product.quantity} units
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min((product.quantity! / Math.max(product.reorderPoint || 50, 1)) * 100, 100)}
                        sx={{
                          height: 5,
                          borderRadius: 3,
                          backgroundColor: alpha(theme.palette.divider, 0.15),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            backgroundColor: (product.quantity || 0) < (product.reorderPoint || 10)
                              ? theme.palette.warning.main
                              : theme.palette.success.main,
                          },
                        }}
                      />
                    </Box>

                    {/* Status & Actions */}
                    <Box sx={{ mt: 'auto', p: 2, pt: 1, borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip
                          label={product.status}
                          color={product.status === 'Low Stock' ? 'warning' : product.status === 'In Stock' ? 'success' : 'default'}
                          size="small"
                          variant="outlined"
                          sx={{ borderRadius: 1, fontSize: '0.65rem', height: 22, fontWeight: 600 }}
                        />
                        <Box sx={{ display: 'flex', gap: 0.25 }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => { e.stopPropagation(); handleEditProduct(product); }}
                            sx={{ p: 0.5 }}
                          >
                            <EditIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id!); }}
                            sx={{ p: 0.5 }}
                          >
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                </MuiGrid>
              ))}
            </MuiGrid>
          )}
        </Box>
      )}

      {/* Pagination — hidden in table view; DataGrid renders its own */}
      {viewMode === 'cards' && (
        <Paper
          elevation={0}
          sx={{
            mt: 2,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            overflow: 'hidden',
          }}
        >
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}
      </>
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            background: alpha(theme.palette.background.paper, 0.5),
          }}
        >
          <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Search Products
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Use the search box above to find products by name, SKU, or category.
          </Typography>
        </Paper>
      )}

      {/* Add/Edit Product Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selectedProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Product Name"
            type="text"
            fullWidth
            value={newProductData.name || ''}
            onChange={handleInputChange}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Category</InputLabel>
            <Select
              name="categoryId"
              value={newProductData.categoryId || ''}
              label="Category"
              onChange={(e) => setNewProductData({ ...newProductData, categoryId: e.target.value })}
            >
              {categories.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            name="price"
            label="Selling Price (₹)"
            type="number"
            fullWidth
            value={newProductData.price || ''}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="purchasePrice"
            label="Purchase Price (₹)"
            type="number"
            fullWidth
            value={newProductData.purchasePrice || ''}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="quantity"
            label="Stock Quantity"
            type="number"
            fullWidth
            value={newProductData.quantity || ''}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
          <Button onClick={handleSaveProduct} variant="contained" sx={{ borderRadius: 2 }}>
            {selectedProduct ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Category Dialog */}
      <Dialog open={bulkCategoryDialogOpen} onClose={() => setBulkCategoryDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Update Category for {selectedProducts.length} Products
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>New Category</InputLabel>
            <Select
              value={selectedBulkCategory}
              label="New Category"
              onChange={(e) => setSelectedBulkCategory(e.target.value)}
            >
              {categories.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBulkCategoryDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleBulkCategoryChange} variant="contained" sx={{ borderRadius: 2 }}>Update</Button>
        </DialogActions>
      </Dialog>

      {/* Category Discount Management Dialog */}
      <Dialog
        open={categoryDiscountDialogOpen}
        onClose={() => setCategoryDiscountDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          fontWeight: 700,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DiscountIcon color="primary" />
            Category Discount Management
          </Box>
          <IconButton onClick={() => setCategoryDiscountDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <CategoryDiscountManagement onClose={() => setCategoryDiscountDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
}

export default function ModernProductsPage() {
  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Products"
        pageType="products"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <ProductsPage />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}
