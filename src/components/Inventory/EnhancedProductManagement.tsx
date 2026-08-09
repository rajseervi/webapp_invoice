"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  Switch,
  FormControlLabel,
  Autocomplete,
  InputAdornment,
  Tooltip,
  Alert,
  Snackbar,
  Pagination,
  Stack,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  Badge,
  LinearProgress,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  FormHelperText,
  Avatar,
  CardHeader,
  CardActions,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  TableSortLabel,
  Checkbox,
  FormGroup,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { validateProductName } from '@/utils/validation';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  ContentCopy as CopyIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Save as SaveIcon,
  QrCode as QrCodeIcon,
  QrCode2 as BarcodeIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  FileUpload as ImportIcon,
  GetApp as ExportIcon,
  Analytics as AnalyticsIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  PriceChange as PriceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  PhotoCamera as PhotoIcon,
  AttachFile as AttachIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  LocalOffer as TagIcon,
  Timeline as TimelineIcon,
  Assessment as ReportIcon,
  Tune as TuneIcon,
  ViewColumn as ViewColumnIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
  Sort as SortIcon,
  FilterAlt as FilterAltIcon,
  Clear as ClearIcon,
  History as HistoryIcon,
  ShoppingCart as CartIcon,
  Store as StoreIcon,
  Inventory2 as Inventory2Icon,
  LocalShipping as ShippingIcon,
  MonetizationOn as MoneyIcon,
  Percent as PercentIcon,
  Scale as WeightIcon,
  Straighten as DimensionIcon,
  Palette as ColorIcon,
  Style as StyleIcon,
  Build as BuildIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Verified as VerifiedIcon,
  NewReleases as NewIcon,
  Update as UpdateIcon,
  Schedule as ScheduleIcon,
  Today as TodayIcon,
  DateRange as DateRangeIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as WebIcon,
  Link as LinkIcon,
  Info as InfoIcon,
  Help as HelpIcon,
  Settings as SettingsIcon,
  MoreHoriz as MoreHorizIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowLeft as ArrowLeftIcon,
  KeyboardArrowRight as ArrowRightIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  Image as ImageIcon,
  CloudUpload as CloudUploadIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  TableView as TableViewIcon,
  Dashboard as DashboardIcon,
  Widgets as WidgetsIcon,
  Extension as ExtensionIcon,
  Apps as AppsIcon
} from '@mui/icons-material';
import { productService, ProductFilters } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { Product } from '@/types/inventory';

interface ProductManagementProps {
  onStatsUpdate?: () => void;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface ProductFormData extends Partial<Product> {
  images?: File[];
  tags?: string[];
  specifications?: Record<string, any>;
}

interface ViewMode {
  type: 'table' | 'grid' | 'card';
  density: 'comfortable' | 'compact' | 'standard';
}

interface FilterState {
  category?: string;
  status?: 'all' | 'active' | 'inactive' | 'low-stock' | 'out-of-stock';
  priceRange?: [number, number];
  stockRange?: [number, number];
  brand?: string;
  tags?: string[];
  dateRange?: [Date | null, Date | null];
}

interface SortState {
  field: 'name' | 'price' | 'quantity' | 'createdAt' | 'updatedAt' | 'category';
  direction: 'asc' | 'desc';
}

const UNITS_OF_MEASUREMENT = [
  'PCS', 'KG', 'GRAM', 'LITER', 'METER', 'FEET', 'INCH', 'BOX', 'DOZEN', 'SET',
  'PACK', 'BOTTLE', 'CAN', 'TUBE', 'ROLL', 'SHEET', 'PAIR', 'BUNDLE'
];

const PRODUCT_TAGS = [
  'New Arrival', 'Best Seller', 'Featured', 'On Sale', 'Limited Edition',
  'Eco-Friendly', 'Premium', 'Budget', 'Seasonal', 'Trending'
];

export default function EnhancedProductManagement({ onStatsUpdate }: ProductManagementProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({});
  const [sortState, setSortState] = useState<SortState>({ field: 'name', direction: 'asc' });
  const [viewMode, setViewMode] = useState<ViewMode>({ type: 'table', density: 'standard' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState(0);

  // Dialog states
  const [productDialog, setProductDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [bulkDialog, setBulkDialog] = useState(false);
  const [importDialog, setImportDialog] = useState(false);
  const [analyticsDialog, setAnalyticsDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Enhanced form state
  const [productForm, setProductForm] = useState<ProductFormData>({
    name: '',
    description: '',
    categoryId: '',
    price: 0,
    quantity: 0,
    reorderPoint: 10,
    unitOfMeasurement: 'PCS',
    isActive: true,
    barcode: '',
    brand: '',
    model: '',
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    tags: [],
    specifications: {},
    images: []
  });

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Advanced filter state
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [stockRange, setStockRange] = useState<[number, number]>([0, 1000]);

  // Import/Export state
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [page, filters, searchTerm, sortState]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const searchFilters: ProductFilters = {
        ...filters,
        searchTerm: searchTerm || undefined,
        priceRange: filters.priceRange,
        stockRange: filters.stockRange
      };

      const result = await productService.getProducts(
        searchFilters,
        { field: sortState.field, direction: sortState.direction },
        { page: page - 1, limit: itemsPerPage }
      );

      setProducts(result.products);
      setTotalPages(Math.ceil(result.totalCount / itemsPerPage));
    } catch (error) {
      console.error('Error loading products:', error);
      showSnackbar('Error loading products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await categoryService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleProductSubmit = async () => {
    try {
      const { images, ...productData } = productForm;
      
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id!, productData);
        showSnackbar('Product updated successfully', 'success');
      } else {
        await productService.createProduct(productData as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);
        showSnackbar('Product created successfully', 'success');
      }
      
      setProductDialog(false);
      setEditingProduct(null);
      resetProductForm();
      loadProducts();
      onStatsUpdate?.();
    } catch (error) {
      console.error('Error saving product:', error);
      showSnackbar('Error saving product', 'error');
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      await productService.deleteProduct(productToDelete);
      showSnackbar('Product deleted successfully', 'success');
      setDeleteDialog(false);
      setProductToDelete(null);
      loadProducts();
      onStatsUpdate?.();
    } catch (error) {
      console.error('Error deleting product:', error);
      showSnackbar('Error deleting product', 'error');
    }
  };

  const handleBulkAction = async (action: 'delete' | 'activate' | 'deactivate' | 'export') => {
    if (selectedProducts.length === 0) return;

    try {
      switch (action) {
        case 'delete':
          await productService.bulkDeleteProducts(selectedProducts);
          showSnackbar(`${selectedProducts.length} products deleted`, 'success');
          break;
        case 'activate':
          await productService.bulkUpdateProducts(selectedProducts, { isActive: true });
          showSnackbar(`${selectedProducts.length} products activated`, 'success');
          break;
        case 'deactivate':
          await productService.bulkUpdateProducts(selectedProducts, { isActive: false });
          showSnackbar(`${selectedProducts.length} products deactivated`, 'success');
          break;
        case 'export':
          await handleExportProducts(selectedProducts);
          return;
      }

      setSelectedProducts([]);
      setBulkDialog(false);
      loadProducts();
      onStatsUpdate?.();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      showSnackbar('Error performing bulk action', 'error');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      ...product,
      tags: product.tags || [],
      specifications: product.specifications || {},
      images: []
    });
    setProductDialog(true);
  };

  const handleDuplicateProduct = async (productId: string) => {
    try {
      await productService.duplicateProduct(productId);
      showSnackbar('Product duplicated successfully', 'success');
      loadProducts();
      onStatsUpdate?.();
    } catch (error) {
      console.error('Error duplicating product:', error);
      showSnackbar('Error duplicating product', 'error');
    }
  };

  const handleImportProducts = async (file: File) => {
    try {
      setImportProgress(0);
      setImportDialog(true);
      
      // Simulate import progress
      const interval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Parse CSV/Excel file and import products
      // This would need actual file parsing implementation
      const mockResults = {
        success: 45,
        failed: 5,
        errors: ['Row 3: Missing required field "name"', 'Row 7: Invalid category']
      };

      setTimeout(() => {
        setImportProgress(100);
        setImportResults(mockResults);
        clearInterval(interval);
        loadProducts();
        onStatsUpdate?.();
      }, 2000);

    } catch (error) {
      console.error('Error importing products:', error);
      showSnackbar('Error importing products', 'error');
    }
  };

  const handleExportProducts = async (productIds?: string[]) => {
    try {
      const filters = productIds ? { productIds } : undefined;
      const products = await productService.exportProducts(filters);
      
      // Convert to CSV and download
      const csvContent = convertToCSV(products);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      showSnackbar('Products exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting products:', error);
      showSnackbar('Error exporting products', 'error');
    }
  };

  const convertToCSV = (products: Product[]): string => {
    const headers = ['Name', 'Category', 'Price', 'Quantity', 'Unit', 'Brand', 'Status'];
    const rows = products.map(product => [
      product.name,
      categories.find(c => c.id === product.categoryId)?.name || '',
      product.price,
      product.quantity,
      product.unitOfMeasurement,
      product.brand || '',
      product.isActive ? 'Active' : 'Inactive'
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      categoryId: '',
      price: 0,
      quantity: 0,
      reorderPoint: 10,
      unitOfMeasurement: 'PCS',
      isActive: true,
      barcode: '',
      brand: '',
      model: '',
      weight: 0,
      dimensions: { length: 0, width: 0, height: 0 },
      tags: [],
      specifications: {},
      images: []
    });
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, productId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedProductId(productId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProductId(null);
  };

  const getStockStatus = (product: Product) => {
    if (product.quantity === 0) {
      return { label: 'Out of Stock', color: 'error' as const, icon: <WarningIcon /> };
    } else if (product.quantity <= (product.reorderPoint || 10)) {
      return { label: 'Low Stock', color: 'warning' as const, icon: <WarningIcon /> };
    } else {
      return { label: 'In Stock', color: 'success' as const, icon: <CheckCircleIcon /> };
    }
  };

  const handleSortChange = (field: SortState['field']) => {
    setSortState(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImportProducts(file);
    }
  };

  const renderProductCard = (product: Product) => (
    <Card key={product.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
            {product.name.charAt(0).toUpperCase()}
          </Avatar>
        }
        action={
          <IconButton onClick={(e) => handleMenuClick(e, product.id!)}>
            <MoreVertIcon />
          </IconButton>
        }
        title={product.name}
        subheader={categories.find(c => c.id === product.categoryId)?.name}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {product.description}
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Typography variant="h6" color="primary">
            ₹{product.price.toLocaleString()}
          </Typography>
          <Chip
            {...getStockStatus(product)}
            size="small"
            variant="outlined"
          />
        </Box>
        <Typography variant="body2" color="textSecondary" mt={1}>
          Stock: {product.quantity} {product.unitOfMeasurement}
        </Typography>
        {product.tags && product.tags.length > 0 && (
          <Box mt={1}>
            {product.tags.slice(0, 2).map((tag, index) => (
              <Chip key={index} label={tag} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
            ))}
            {product.tags.length > 2 && (
              <Chip label={`+${product.tags.length - 2}`} size="small" />
            )}
          </Box>
        )}
      </CardContent>
      <CardActions>
        <Button size="small" onClick={() => handleEditProduct(product)}>
          Edit
        </Button>
        <Button size="small" onClick={() => handleDuplicateProduct(product.id!)}>
          Duplicate
        </Button>
      </CardActions>
    </Card>
  );

  const renderProductTable = () => (
    <TableContainer>
      <Table size={viewMode.density === 'compact' ? 'small' : 'medium'}>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={selectedProducts.length === products.length && products.length > 0}
                indeterminate={selectedProducts.length > 0 && selectedProducts.length < products.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedProducts(products.map(p => p.id!));
                  } else {
                    setSelectedProducts([]);
                  }
                }}
              />
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortState.field === 'name'}
                direction={sortState.direction}
                onClick={() => handleSortChange('name')}
              >
                Product
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortState.field === 'category'}
                direction={sortState.direction}
                onClick={() => handleSortChange('category')}
              >
                Category
              </TableSortLabel>
            </TableCell>
            <TableCell align="right">
              <TableSortLabel
                active={sortState.field === 'price'}
                direction={sortState.direction}
                onClick={() => handleSortChange('price')}
              >
                Price
              </TableSortLabel>
            </TableCell>
            <TableCell align="right">
              <TableSortLabel
                active={sortState.field === 'quantity'}
                direction={sortState.direction}
                onClick={() => handleSortChange('quantity')}
              >
                Stock
              </TableSortLabel>
            </TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={7}>
                  <Skeleton variant="rectangular" height={40} />
                </TableCell>
              </TableRow>
            ))
          ) : products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Box py={4}>
                  <InventoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary">
                    No products found
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Try adjusting your search or filters
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => {
              const stockStatus = getStockStatus(product);
              const category = categories.find(c => c.id === product.categoryId);
              
              return (
                <TableRow key={product.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedProducts.includes(product.id!)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts([...selectedProducts, product.id!]);
                        } else {
                          setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                        }
                      }}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                        {product.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {product.name}
                        </Typography>
                        {product.description && (
                          <Typography variant="caption" color="textSecondary">
                            {product.description.substring(0, 50)}
                            {product.description.length > 50 && '...'}
                          </Typography>
                        )}
                        {product.brand && (
                          <Chip
                            label={product.brand}
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1, height: 20 }}
                          />
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={category ? category.name : 'Uncategorized'}
                      size="small"
                      color="default"
                      variant="outlined"
                    />
                  </TableCell>
                  
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      ₹{product.price.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      per {product.unitOfMeasurement}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="right">
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {product.quantity} {product.unitOfMeasurement}
                      </Typography>
                      <Chip
                        {...stockStatus}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={product.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={product.isActive ? 'success' : 'default'}
                      icon={product.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                    />
                  </TableCell>
                  
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, product.id!)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      {/* Enhanced Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Product Management
          </Typography>
          <Breadcrumbs>
            <Typography color="textSecondary">Inventory</Typography>
            <Typography color="primary">Products</Typography>
          </Breadcrumbs>
        </Box>
        
        <Stack direction="row" spacing={2}>
          {selectedProducts.length > 0 && (
            <Badge badgeContent={selectedProducts.length} color="primary">
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setBulkDialog(true)}
                startIcon={<SettingsIcon />}
              >
                Bulk Actions
              </Button>
            </Badge>
          )}
          
          <ButtonGroup variant="outlined">
            <Button
              startIcon={<ImportIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              Import
            </Button>
            <Button
              startIcon={<ExportIcon />}
              onClick={() => handleExportProducts()}
            >
              Export
            </Button>
          </ButtonGroup>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              resetProductForm();
              setEditingProduct(null);
              setProductDialog(true);
            }}
          >
            Add Product
          </Button>
        </Stack>
      </Box>

      {/* Enhanced Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search products, brands, categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category || ''}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
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
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status || 'all'}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                  label="Status"
                >
                  <MenuItem value="all">All Products</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="low-stock">Low Stock</MenuItem>
                  <MenuItem value="out-of-stock">Out of Stock</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <ToggleButtonGroup
                value={viewMode.type}
                exclusive
                onChange={(_, newView) => newView && setViewMode({ ...viewMode, type: newView })}
                size="small"
              >
                <ToggleButton value="table">
                  <TableViewIcon />
                </ToggleButton>
                <ToggleButton value="grid">
                  <GridViewIcon />
                </ToggleButton>
                <ToggleButton value="card">
                  <ViewColumnIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<TuneIcon />}
                  onClick={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}
                  size="small"
                >
                  Filters
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={() => {
                    setFilters({});
                    setSearchTerm('');
                    setPriceRange([0, 10000]);
                    setStockRange([0, 1000]);
                  }}
                  size="small"
                >
                  Clear
                </Button>
              </Stack>
            </Grid>
          </Grid>

          {/* Advanced Filters */}
          <Collapse in={advancedFiltersOpen}>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography gutterBottom>Price Range</Typography>
                <Slider
                  value={priceRange}
                  onChange={(_, newValue) => {
                    setPriceRange(newValue as [number, number]);
                    setFilters({ ...filters, priceRange: newValue as [number, number] });
                  }}
                  valueLabelDisplay="auto"
                  min={0}
                  max={10000}
                  step={100}
                />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption">₹{priceRange[0]}</Typography>
                  <Typography variant="caption">₹{priceRange[1]}</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography gutterBottom>Stock Range</Typography>
                <Slider
                  value={stockRange}
                  onChange={(_, newValue) => {
                    setStockRange(newValue as [number, number]);
                    setFilters({ ...filters, stockRange: newValue as [number, number] });
                  }}
                  valueLabelDisplay="auto"
                  min={0}
                  max={1000}
                  step={10}
                />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption">{stockRange[0]}</Typography>
                  <Typography variant="caption">{stockRange[1]}</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Autocomplete
                  multiple
                  options={PRODUCT_TAGS}
                  value={filters.tags || []}
                  onChange={(_, newValue) => setFilters({ ...filters, tags: newValue })}
                  renderInput={(params) => (
                    <TextField {...params} label="Tags" placeholder="Select tags" />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        key={option}
                      />
                    ))
                  }
                />
              </Grid>
            </Grid>
          </Collapse>
        </CardContent>
      </Card>

      {/* Products Display */}
      <Card>
        {/* View Controls */}
        <CardHeader
          title={
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">
                Products ({products.length})
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Per Page</InputLabel>
                  <Select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    label="Per Page"
                  >
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                    <MenuItem value={100}>100</MenuItem>
                  </Select>
                </FormControl>
                
                <ToggleButtonGroup
                  value={viewMode.density}
                  exclusive
                  onChange={(_, newDensity) => newDensity && setViewMode({ ...viewMode, density: newDensity })}
                  size="small"
                >
                  <ToggleButton value="compact">Compact</ToggleButton>
                  <ToggleButton value="standard">Standard</ToggleButton>
                  <ToggleButton value="comfortable">Comfortable</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Box>
          }
        />

        {/* Products Content */}
        {viewMode.type === 'table' ? (
          renderProductTable()
        ) : viewMode.type === 'grid' ? (
          <Box p={2}>
            <Grid container spacing={2}>
              {products.map((product) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                  {renderProductCard(product)}
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : (
          <Box p={2}>
            <Grid container spacing={2}>
              {products.map((product) => (
                <Grid item xs={12} md={6} key={product.id}>
                  {renderProductCard(product)}
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" p={2}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          const product = products.find(p => p.id === selectedProductId);
          if (product) handleEditProduct(product);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          if (selectedProductId) handleDuplicateProduct(selectedProductId);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          // Generate QR Code functionality
          handleMenuClose();
        }}>
          <ListItemIcon>
            <QrCodeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Generate QR Code</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => {
          setProductToDelete(selectedProductId);
          setDeleteDialog(true);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Enhanced Product Dialog */}
      <Dialog 
        open={productDialog} 
        onClose={() => setProductDialog(false)} 
        maxWidth="lg" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </Typography>
            <IconButton onClick={() => setProductDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Basic Info" />
            <Tab label="Pricing & Stock" />
            <Tab label="Details" />
            <Tab label="Images & Media" />
          </Tabs>

          {/* Tab Panels */}
          {activeTab === 0 && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Product Name"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  required
                  error={Boolean(validateProductName(productForm.name || ''))}
                  helperText={validateProductName(productForm.name || '') || 'No spaces. Use underscore, hyphen, or camelCase.'}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!productForm.categoryId}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    label="Category"
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {!productForm.categoryId && (
                    <FormHelperText>Category is required</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  multiline
                  rows={3}
                  placeholder="Enter product description..."
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Brand"
                  value={productForm.brand}
                  onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Model"
                  value={productForm.model}
                  onChange={(e) => setProductForm({ ...productForm, model: e.target.value })}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={PRODUCT_TAGS}
                  value={productForm.tags || []}
                  onChange={(_, newValue) => setProductForm({ ...productForm, tags: newValue })}
                  renderInput={(params) => (
                    <TextField {...params} label="Tags" placeholder="Add tags" />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        key={option}
                      />
                    ))
                  }
                />
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  required
                  error={!productForm.price || productForm.price <= 0}
                  helperText={!productForm.price || productForm.price <= 0 ? 'Valid price is required' : ''}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Stock Quantity"
                  type="number"
                  value={productForm.quantity}
                  onChange={(e) => setProductForm({ ...productForm, quantity: Number(e.target.value) })}
                  required
                  error={productForm.quantity === undefined || productForm.quantity < 0}
                  helperText={productForm.quantity === undefined || productForm.quantity < 0 ? 'Valid quantity is required' : ''}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Unit</InputLabel>
                  <Select
                    value={productForm.unitOfMeasurement}
                    onChange={(e) => setProductForm({ ...productForm, unitOfMeasurement: e.target.value })}
                    label="Unit"
                  >
                    {UNITS_OF_MEASUREMENT.map((unit) => (
                      <MenuItem key={unit} value={unit}>
                        {unit}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Reorder Point"
                  type="number"
                  value={productForm.reorderPoint}
                  onChange={(e) => setProductForm({ ...productForm, reorderPoint: Number(e.target.value) })}
                  helperText="Alert when stock falls below this level"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Stock Level"
                  type="number"
                  value={productForm.maxStockLevel || ''}
                  onChange={(e) => setProductForm({ ...productForm, maxStockLevel: Number(e.target.value) || undefined })}
                  helperText="Maximum stock level to maintain"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={productForm.isActive}
                      onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                    />
                  }
                  label="Active Product"
                />
              </Grid>
            </Grid>
          )}

          {activeTab === 2 && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Barcode/SKU"
                  value={productForm.barcode}
                  onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton>
                          <BarcodeIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Weight (kg)"
                  type="number"
                  value={productForm.weight || ''}
                  onChange={(e) => setProductForm({ ...productForm, weight: Number(e.target.value) || undefined })}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Dimensions (cm)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="Length"
                      type="number"
                      value={productForm.dimensions?.length || ''}
                      onChange={(e) => setProductForm({ 
                        ...productForm, 
                        dimensions: { 
                          ...productForm.dimensions, 
                          length: Number(e.target.value) || 0 
                        } 
                      })}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="Width"
                      type="number"
                      value={productForm.dimensions?.width || ''}
                      onChange={(e) => setProductForm({ 
                        ...productForm, 
                        dimensions: { 
                          ...productForm.dimensions, 
                          width: Number(e.target.value) || 0 
                        } 
                      })}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="Height"
                      type="number"
                      value={productForm.dimensions?.height || ''}
                      onChange={(e) => setProductForm({ 
                        ...productForm, 
                        dimensions: { 
                          ...productForm.dimensions, 
                          height: Number(e.target.value) || 0 
                        } 
                      })}
                    />
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Additional Specifications
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Enter specifications in JSON format or key-value pairs"
                  value={JSON.stringify(productForm.specifications || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const specs = JSON.parse(e.target.value);
                      setProductForm({ ...productForm, specifications: specs });
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                />
              </Grid>
            </Grid>
          )}

          {activeTab === 3 && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Box
                  border={2}
                  borderColor="grey.300"
                  borderStyle="dashed"
                  borderRadius={2}
                  p={4}
                  textAlign="center"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <CloudUploadIcon sx={{ fontSize: 48, color: 'grey.500', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Upload Product Images
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Drag and drop images here or click to browse
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Supported formats: JPG, PNG, WebP (Max 5MB each)
                  </Typography>
                </Box>
              </Grid>
              
              {productForm.images && productForm.images.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Images ({productForm.images.length})
                  </Typography>
                  <Grid container spacing={2}>
                    {productForm.images.map((file, index) => (
                      <Grid item xs={6} sm={4} md={3} key={index}>
                        <Card>
                          <Box
                            height={120}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            bgcolor="grey.100"
                          >
                            <ImageIcon sx={{ fontSize: 40, color: 'grey.500' }} />
                          </Box>
                          <CardContent sx={{ p: 1 }}>
                            <Typography variant="caption" noWrap>
                              {file.name}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setProductDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleProductSubmit} 
            variant="contained"
            disabled={!productForm.name || !productForm.categoryId || !productForm.price}
          >
            {editingProduct ? 'Update' : 'Create'} Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this product? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteProduct} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Bulk Actions Dialog */}
      <Dialog open={bulkDialog} onClose={() => setBulkDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Bulk Actions ({selectedProducts.length} products selected)
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => handleBulkAction('activate')}
                startIcon={<CheckCircleIcon />}
                sx={{ height: 60 }}
              >
                Activate Products
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => handleBulkAction('deactivate')}
                startIcon={<CancelIcon />}
                sx={{ height: 60 }}
              >
                Deactivate Products
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => handleBulkAction('export')}
                startIcon={<ExportIcon />}
                sx={{ height: 60 }}
              >
                Export Selected
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                onClick={() => handleBulkAction('delete')}
                startIcon={<DeleteIcon />}
                sx={{ height: 60 }}
              >
                Delete Products
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialog} onClose={() => setImportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Products</DialogTitle>
        <DialogContent>
          {importResults ? (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Import completed successfully!
              </Alert>
              <Typography variant="body1" gutterBottom>
                <strong>Success:</strong> {importResults.success} products imported
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Failed:</strong> {importResults.failed} products failed
              </Typography>
              {importResults.errors.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Errors:
                  </Typography>
                  <List dense>
                    {importResults.errors.map((error, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={error} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          ) : (
            <Box>
              <Typography variant="body1" gutterBottom>
                Importing products...
              </Typography>
              <LinearProgress variant="determinate" value={importProgress} sx={{ mt: 2 }} />
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {importProgress}% complete
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setImportDialog(false);
            setImportResults(null);
            setImportProgress(0);
          }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".csv,.xlsx,.xls"
        onChange={handleFileUpload}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Floating Action Button for Quick Add */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => {
          resetProductForm();
          setEditingProduct(null);
          setProductDialog(true);
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}