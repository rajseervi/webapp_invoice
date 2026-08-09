'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  IconButton,
  Breadcrumbs,
  Link,
  Alert,
  CircularProgress,
  Avatar,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Tooltip,
  Badge,
  Stack,
  CardHeader,
  CardActions,
  Fade,
  Grow,
  Slide,
  useTheme,
  alpha,
  Tab,
  Tabs,
  TabPanel,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemButton,
  Menu,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Home as HomeIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Analytics as AnalyticsIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  LocalOffer as DiscountIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ShowChart as ShowChartIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  SelectAll as SelectAllIcon,
  Close as CloseIcon,
  Done as DoneIcon,
  ContentCopy as CopyIcon,
  ImportExport as ImportExportIcon
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { Category, CategoryHierarchy } from '@/types/inventory';
import { categoryService } from '@/services/categoryService';

const COLORS = ['#1976d2', '#dc004e', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50'];

interface CategoryInsight {
  id: string;
  name: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  action?: string;
  actionUrl?: string;
  icon?: React.ReactNode;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface FilterOptions {
  status: 'all' | 'active' | 'inactive';
  hasProducts: 'all' | 'with-products' | 'empty';
  sortBy: 'name' | 'createdAt' | 'productCount' | 'value';
  sortOrder: 'asc' | 'desc';
  tags: string[];
}

interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  action: (selectedIds: string[]) => void;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function CategoryDashboardPage() {
  const router = useRouter();
  const theme = useTheme();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [hierarchy, setHierarchy] = useState<CategoryHierarchy[]>([]);
  const [insights, setInsights] = useState<CategoryInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  // New state for enhanced features
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    hasProducts: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
    tags: []
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [bulkActionAnchor, setBulkActionAnchor] = useState<null | HTMLElement>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error' | 'warning' | 'info'}>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [categoriesData, hierarchyData] = await Promise.all([
        categoryService.getCategories({ includeInactive: true }),
        categoryService.getCategoryHierarchy()
      ]);

      setCategories(categoriesData);
      setHierarchy(hierarchyData);
      generateInsights(categoriesData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Filtered and sorted categories
  const filteredCategories = useMemo(() => {
    let filtered = categories.filter(category => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!category.name.toLowerCase().includes(query) && 
            !category.description?.toLowerCase().includes(query) &&
            !category.tags?.some(tag => tag.toLowerCase().includes(query))) {
          return false;
        }
      }

      // Status filter
      if (filters.status === 'active' && !category.isActive) return false;
      if (filters.status === 'inactive' && category.isActive) return false;

      // Products filter
      const hasProducts = (category.metadata?.totalProducts || 0) > 0;
      if (filters.hasProducts === 'with-products' && !hasProducts) return false;
      if (filters.hasProducts === 'empty' && hasProducts) return false;

      // Tags filter
      if (filters.tags.length > 0) {
        const categoryTags = category.tags || [];
        if (!filters.tags.some(tag => categoryTags.includes(tag))) return false;
      }

      return true;
    });

    // Sort categories
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'productCount':
          aValue = a.metadata?.totalProducts || 0;
          bValue = b.metadata?.totalProducts || 0;
          break;
        case 'value':
          aValue = a.metadata?.totalValue || 0;
          bValue = b.metadata?.totalValue || 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (filters.sortOrder === 'desc') {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [categories, searchQuery, filters]);

  // Get all unique tags from categories
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    categories.forEach(category => {
      category.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [categories]);

  // Bulk action handlers
  const handleSelectAll = () => {
    if (selectedCategories.length === filteredCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(filteredCategories.map(c => c.id!));
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleBulkActivate = async (categoryIds: string[]) => {
    try {
      await Promise.all(categoryIds.map(id => 
        categoryService.updateCategory(id, { isActive: true })
      ));
      await loadDashboardData();
      setSelectedCategories([]);
      showSnackbar(`${categoryIds.length} categories activated successfully`);
    } catch (error) {
      showSnackbar('Failed to activate categories', 'error');
    }
  };

  const handleBulkDeactivate = async (categoryIds: string[]) => {
    try {
      await Promise.all(categoryIds.map(id => 
        categoryService.updateCategory(id, { isActive: false })
      ));
      await loadDashboardData();
      setSelectedCategories([]);
      showSnackbar(`${categoryIds.length} categories deactivated successfully`);
    } catch (error) {
      showSnackbar('Failed to deactivate categories', 'error');
    }
  };

  const handleBulkDelete = async (categoryIds: string[]) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Categories',
      message: `Are you sure you want to delete ${categoryIds.length} categories? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await Promise.all(categoryIds.map(id => categoryService.deleteCategory(id)));
          await loadDashboardData();
          setSelectedCategories([]);
          showSnackbar(`${categoryIds.length} categories deleted successfully`);
        } catch (error) {
          showSnackbar('Failed to delete categories', 'error');
        }
        setConfirmDialog(prev => ({ ...prev, open: false }));
      }
    });
  };

  const handleExportCategories = () => {
    const selectedData = selectedCategories.length > 0 
      ? categories.filter(c => selectedCategories.includes(c.id!))
      : filteredCategories;
    
    const csvContent = [
      ['Name', 'Description', 'Status', 'Products', 'Value', 'Created At'].join(','),
      ...selectedData.map(category => [
        category.name,
        category.description || '',
        category.isActive ? 'Active' : 'Inactive',
        category.metadata?.totalProducts || 0,
        category.metadata?.totalValue || 0,
        new Date(category.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `categories-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showSnackbar(`Exported ${selectedData.length} categories`);
  };

  const bulkActions: BulkAction[] = [
    {
      id: 'activate',
      label: 'Activate',
      icon: <CheckCircleIcon />,
      color: 'success',
      action: handleBulkActivate
    },
    {
      id: 'deactivate',
      label: 'Deactivate',
      icon: <ArchiveIcon />,
      color: 'warning',
      action: handleBulkDeactivate
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <DeleteIcon />,
      color: 'error',
      action: handleBulkDelete
    },
    {
      id: 'export',
      label: 'Export',
      icon: <DownloadIcon />,
      color: 'primary',
      action: () => handleExportCategories()
    }
  ];

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      status: 'all',
      hasProducts: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
      tags: []
    });
    setSelectedCategories([]);
  };

  const generateInsights = (categories: Category[]) => {
    const insights: CategoryInsight[] = [];

    // Empty categories
    const emptyCategories = categories.filter(c => (c.metadata?.totalProducts || 0) === 0 && c.isActive);
    if (emptyCategories.length > 0) {
      insights.push({
        id: 'empty-categories',
        name: 'Empty Categories',
        type: 'warning',
        message: `${emptyCategories.length} active categories have no products`,
        action: 'Review Categories',
        actionUrl: '/categories?filter=empty',
        icon: <WarningIcon />
      });
    }

    // Inactive categories with products
    const inactiveWithProducts = categories.filter(c => !c.isActive && (c.metadata?.totalProducts || 0) > 0);
    if (inactiveWithProducts.length > 0) {
      insights.push({
        id: 'inactive-with-products',
        name: 'Inactive Categories with Products',
        type: 'error',
        message: `${inactiveWithProducts.length} inactive categories still have products`,
        action: 'Fix Categories',
        actionUrl: '/categories?filter=inactive',
        icon: <TrendingDownIcon />
      });
    }

    // High-value categories
    const highValueCategories = categories.filter(c => (c.metadata?.totalValue || 0) > 100000);
    if (highValueCategories.length > 0) {
      insights.push({
        id: 'high-value',
        name: 'High-Value Categories',
        type: 'success',
        message: `${highValueCategories.length} categories have inventory value > ₹1L`,
        action: 'View Details',
        actionUrl: '/categories',
        icon: <TrendingUpIcon />
      });
    }

    // Categories without descriptions
    const noDescription = categories.filter(c => !c.description && c.isActive);
    if (noDescription.length > 0) {
      insights.push({
        id: 'no-description',
        name: 'Missing Descriptions',
        type: 'info',
        message: `${noDescription.length} categories need descriptions`,
        action: 'Add Descriptions',
        actionUrl: '/categories',
        icon: <EditIcon />
      });
    }

    setInsights(insights);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 10000000) return (num / 10000000).toFixed(1) + 'Cr';
    if (num >= 100000) return (num / 100000).toFixed(1) + 'L';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalCategories = categories.length;
    const activeCategories = categories.filter(c => c.isActive).length;
    const categoriesWithProducts = categories.filter(c => (c.metadata?.totalProducts || 0) > 0).length;
    const totalProducts = categories.reduce((sum, c) => sum + (c.metadata?.totalProducts || 0), 0);
    const totalValue = categories.reduce((sum, c) => sum + (c.metadata?.totalValue || 0), 0);
    const averageProductsPerCategory = totalCategories > 0 ? totalProducts / totalCategories : 0;

    return {
      totalCategories,
      activeCategories,
      categoriesWithProducts,
      totalProducts,
      totalValue,
      averageProductsPerCategory,
      emptyCategories: totalCategories - categoriesWithProducts,
      utilizationRate: totalCategories > 0 ? (categoriesWithProducts / totalCategories) * 100 : 0,
      filteredCount: filteredCategories.length
    };
  }, [categories, filteredCategories]);

  // Prepare chart data
  const categoryDistributionData = categories
    .filter(c => (c.metadata?.totalProducts || 0) > 0)
    .sort((a, b) => (b.metadata?.totalProducts || 0) - (a.metadata?.totalProducts || 0))
    .slice(0, 10)
    .map((category, index) => ({
      name: category.name.length > 15 ? category.name.substring(0, 15) + '...' : category.name,
      fullName: category.name,
      products: category.metadata?.totalProducts || 0,
      value: category.metadata?.totalValue || 0,
      color: COLORS[index % COLORS.length]
    }));

  const valueDistributionData = categories
    .filter(c => (c.metadata?.totalValue || 0) > 0)
    .sort((a, b) => (b.metadata?.totalValue || 0) - (a.metadata?.totalValue || 0))
    .slice(0, 8)
    .map((category, index) => ({
      name: category.name.length > 12 ? category.name.substring(0, 12) + '...' : category.name,
      fullName: category.name,
      value: category.metadata?.totalValue || 0,
      color: COLORS[index % COLORS.length]
    }));

  const topCategories = categories
    .filter(c => c.isActive)
    .sort((a, b) => (b.metadata?.totalValue || 0) - (a.metadata?.totalValue || 0))
    .slice(0, 5);

  const recentCategories = categories
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Growth trend data (mock data for demonstration)
  const growthTrendData = [
    { month: 'Jan', categories: 15, products: 120, value: 45000 },
    { month: 'Feb', categories: 18, products: 145, value: 52000 },
    { month: 'Mar', categories: 22, products: 180, value: 68000 },
    { month: 'Apr', categories: 25, products: 210, value: 75000 },
    { month: 'May', categories: 28, products: 245, value: 89000 },
    { month: 'Jun', categories: stats.totalCategories, products: stats.totalProducts, value: stats.totalValue }
  ];

  if (loading) {
    return (
      <ImprovedDashboardLayout>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Loading Dashboard...
              </Typography>
            </Box>
          </Box>
        </Container>
      </ImprovedDashboardLayout>
    );
  }

  return (
    <ImprovedDashboardLayout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Enhanced Header */}
        <Fade in={true} timeout={800}>
          <Box sx={{ mb: 4 }}>
            {/* Breadcrumbs */}
            <Breadcrumbs sx={{ mb: 2 }}>
              <Link color="inherit" href="/dashboard" sx={{ display: 'flex', alignItems: 'center' }}>
                <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Dashboard
              </Link>
              <Link color="inherit" href="/categories" sx={{ display: 'flex', alignItems: 'center' }}>
                <CategoryIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Categories
              </Link>
              <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
                <DashboardIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Analytics
              </Typography>
            </Breadcrumbs>

            {/* Header with Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography 
                  variant="h3" 
                  component="h1" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 700,
                    background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Category Analytics
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                  Comprehensive insights into your product categorization
                </Typography>
                
                {/* Quick Stats Pills */}
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <Chip 
                    icon={<CategoryIcon />} 
                    label={`${stats.totalCategories} Categories`} 
                    color="primary" 
                    variant="outlined" 
                  />
                  <Chip 
                    icon={<InventoryIcon />} 
                    label={`${formatNumber(stats.totalProducts)} Products`} 
                    color="success" 
                    variant="outlined" 
                  />
                  <Chip 
                    icon={<MoneyIcon />} 
                    label={`${formatNumber(stats.totalValue)} Value`} 
                    color="info" 
                    variant="outlined" 
                  />
                </Stack>
              </Box>

              {/* Action Buttons */}
              <Stack direction="row" spacing={1}>
                <Tooltip title="Refresh Data">
                  <IconButton 
                    onClick={handleRefresh} 
                    disabled={refreshing}
                    sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                    }}
                  >
                    <RefreshIcon sx={{ 
                      animation: refreshing ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' }
                      }
                    }} />
                  </IconButton>
                </Tooltip>
                
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => {/* Export functionality */}}
                >
                  Export
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={() => router.push('/categories/settings')}
                >
                  Settings
                </Button>
                
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => router.push('/categories/new')}
                  sx={{ 
                    background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                    boxShadow: '0 3px 5px 2px rgba(25, 118, 210, .3)'
                  }}
                >
                  Add Category
                </Button>
              </Stack>
            </Box>
          </Box>
        </Fade>

        {error && (
          <Slide direction="down" in={!!error} mountOnEnter unmountOnExit>
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          </Slide>
        )}

        {/* Enhanced Search and Filter Section */}
        <Fade in={true} timeout={1000}>
          <Paper 
            sx={{ 
              p: 3, 
              mb: 4, 
              borderRadius: 3,
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}
          >
            {/* Search Bar */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search categories by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchQuery('')}
                        edge="end"
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    '&:hover': {
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
                    }
                  }
                }}
              />
            </Box>

            {/* Filter Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                {/* Status Filter */}
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>

                {/* Products Filter */}
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Products</InputLabel>
                  <Select
                    value={filters.hasProducts}
                    label="Products"
                    onChange={(e) => setFilters(prev => ({ ...prev, hasProducts: e.target.value as any }))}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="with-products">With Products</MenuItem>
                    <MenuItem value="empty">Empty</MenuItem>
                  </Select>
                </FormControl>

                {/* Sort By */}
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={filters.sortBy}
                    label="Sort By"
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  >
                    <MenuItem value="name">Name</MenuItem>
                    <MenuItem value="createdAt">Created Date</MenuItem>
                    <MenuItem value="productCount">Product Count</MenuItem>
                    <MenuItem value="value">Value</MenuItem>
                  </Select>
                </FormControl>

                {/* Sort Order */}
                <ToggleButtonGroup
                  value={filters.sortOrder}
                  exclusive
                  onChange={(_, value) => value && setFilters(prev => ({ ...prev, sortOrder: value }))}
                  size="small"
                >
                  <ToggleButton value="asc" aria-label="ascending">
                    <Tooltip title="Ascending">
                      <SortIcon sx={{ transform: 'rotate(0deg)' }} />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="desc" aria-label="descending">
                    <Tooltip title="Descending">
                      <SortIcon sx={{ transform: 'rotate(180deg)' }} />
                    </Tooltip>
                  </ToggleButton>
                </ToggleButtonGroup>

                {/* Tags Filter */}
                {availableTags.length > 0 && (
                  <Autocomplete
                    multiple
                    size="small"
                    options={availableTags}
                    value={filters.tags}
                    onChange={(_, newValue) => setFilters(prev => ({ ...prev, tags: newValue }))}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Tags"
                        placeholder="Select tags"
                        sx={{ minWidth: 200 }}
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="outlined"
                          label={option}
                          size="small"
                          {...getTagProps({ index })}
                          key={option}
                        />
                      ))
                    }
                  />
                )}
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* View Mode Toggle */}
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(_, value) => value && setViewMode(value)}
                  size="small"
                >
                  <ToggleButton value="list" aria-label="list view">
                    <Tooltip title="List View">
                      <ViewListIcon />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="grid" aria-label="grid view">
                    <Tooltip title="Grid View">
                      <ViewModuleIcon />
                    </Tooltip>
                  </ToggleButton>
                </ToggleButtonGroup>

                {/* Clear Filters */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={clearFilters}
                  startIcon={<ClearIcon />}
                  disabled={!searchQuery && filters.status === 'all' && filters.hasProducts === 'all' && filters.tags.length === 0}
                >
                  Clear
                </Button>

                {/* Export Button */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleExportCategories}
                  startIcon={<DownloadIcon />}
                >
                  Export ({stats.filteredCount})
                </Button>
              </Box>
            </Box>

            {/* Results Summary */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Showing {stats.filteredCount} of {stats.totalCategories} categories
                {searchQuery && ` for "${searchQuery}"`}
              </Typography>

              {/* Bulk Actions */}
              {selectedCategories.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                    {selectedCategories.length} selected
                  </Typography>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={(e) => setBulkActionAnchor(e.currentTarget)}
                    endIcon={<MoreVertIcon />}
                  >
                    Actions
                  </Button>
                  <Menu
                    anchorEl={bulkActionAnchor}
                    open={Boolean(bulkActionAnchor)}
                    onClose={() => setBulkActionAnchor(null)}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  >
                    {bulkActions.map((action) => (
                      <MenuItem
                        key={action.id}
                        onClick={() => {
                          action.action(selectedCategories);
                          setBulkActionAnchor(null);
                        }}
                        sx={{ color: `${action.color}.main` }}
                      >
                        <ListItemIcon sx={{ color: 'inherit' }}>
                          {action.icon}
                        </ListItemIcon>
                        <ListItemText>{action.label}</ListItemText>
                      </MenuItem>
                    ))}
                  </Menu>
                </Box>
              )}
            </Box>
          </Paper>
        </Fade>

        {/* Enhanced Key Metrics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            {
              title: 'Total Categories',
              value: stats.totalCategories,
              subtitle: `${stats.activeCategories} active`,
              icon: <CategoryIcon />,
              color: 'primary',
              progress: (stats.activeCategories / stats.totalCategories) * 100,
              trend: '+12%'
            },
            {
              title: 'Total Products',
              value: formatNumber(stats.totalProducts),
              subtitle: `Avg: ${stats.averageProductsPerCategory.toFixed(1)} per category`,
              icon: <InventoryIcon />,
              color: 'success',
              progress: 85,
              trend: '+8%'
            },
            {
              title: 'Total Value',
              value: formatCurrency(stats.totalValue).replace('₹', '₹'),
              subtitle: 'Across all categories',
              icon: <MoneyIcon />,
              color: 'info',
              progress: 92,
              trend: '+15%'
            },
            {
              title: 'Utilization Rate',
              value: `${stats.utilizationRate.toFixed(1)}%`,
              subtitle: `${stats.emptyCategories} empty categories`,
              icon: <SpeedIcon />,
              color: 'warning',
              progress: stats.utilizationRate,
              trend: stats.utilizationRate > 80 ? '+5%' : '-2%'
            }
          ].map((metric, index) => (
            <Grid item xs={12} sm={6} md={3} key={metric.title}>
              <Grow in={true} timeout={800 + (index * 200)}>
                <Card 
                  sx={{ 
                    height: '100%',
                    background: `linear-gradient(135deg, ${theme.palette[metric.color as keyof typeof theme.palette].main}15 0%, ${theme.palette[metric.color as keyof typeof theme.palette].main}05 100%)`,
                    border: `1px solid ${alpha(theme.palette[metric.color as keyof typeof theme.palette].main, 0.2)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 25px ${alpha(theme.palette[metric.color as keyof typeof theme.palette].main, 0.3)}`
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: `${metric.color}.main` }}>
                          {metric.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {metric.title}
                        </Typography>
                      </Box>
                      <Avatar
                        sx={{
                          bgcolor: `${metric.color}.main`,
                          width: 48,
                          height: 48
                        }}
                      >
                        {metric.icon}
                      </Avatar>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={metric.progress}
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          bgcolor: alpha(theme.palette[metric.color as keyof typeof theme.palette].main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: `${metric.color}.main`,
                            borderRadius: 3
                          }
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {metric.subtitle}
                      </Typography>
                      <Chip 
                        label={metric.trend} 
                        size="small" 
                        color={metric.trend.startsWith('+') ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>
          ))}
        </Grid>

        {/* Insights Section */}
        {insights.length > 0 && (
          <Fade in={true} timeout={1200}>
            <Paper 
              sx={{ 
                p: 3, 
                mb: 4, 
                borderRadius: 3,
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
              }}
            >
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AnalyticsIcon color="primary" />
                Smart Insights
              </Typography>
              <Grid container spacing={2}>
                {insights.map((insight, index) => (
                  <Grid item xs={12} md={6} key={insight.id}>
                    <Grow in={true} timeout={1000 + (index * 200)}>
                      <Alert
                        severity={insight.type}
                        icon={insight.icon}
                        action={
                          insight.action && insight.actionUrl ? (
                            <Button
                              color="inherit"
                              size="small"
                              onClick={() => router.push(insight.actionUrl!)}
                              variant="outlined"
                            >
                              {insight.action}
                            </Button>
                          ) : undefined
                        }
                        sx={{ 
                          borderRadius: 2,
                          '& .MuiAlert-message': { fontWeight: 500 }
                        }}
                      >
                        <strong>{insight.name}:</strong> {insight.message}
                      </Alert>
                    </Grow>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Fade>
        )}

        {/* Tabbed Analytics Section */}
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Tabs 
              value={tabValue} 
              onChange={(_, newValue) => setTabValue(newValue)}
              sx={{ px: 3 }}
            >
              <Tab 
                icon={<BarChartIcon />} 
                label="Distribution" 
                iconPosition="start"
                sx={{ minHeight: 64 }}
              />
              <Tab 
                icon={<PieChartIcon />} 
                label="Value Analysis" 
                iconPosition="start"
                sx={{ minHeight: 64 }}
              />
              <Tab 
                icon={<ShowChartIcon />} 
                label="Growth Trends" 
                iconPosition="start"
                sx={{ minHeight: 64 }}
              />
            </Tabs>
          </Box>

          <CustomTabPanel value={tabValue} index={0}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Category Distribution by Product Count
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={categoryDistributionData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8
                    }}
                    formatter={(value, name, props) => [
                      `${value} products`,
                      props.payload.fullName
                    ]}
                  />
                  <Bar 
                    dataKey="products" 
                    fill={theme.palette.primary.main}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CustomTabPanel>

          <CustomTabPanel value={tabValue} index={1}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Value Distribution Across Categories
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={valueDistributionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {valueDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value, name, props) => [
                      formatCurrency(value as number),
                      props.payload.fullName
                    ]}
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CustomTabPanel>

          <CustomTabPanel value={tabValue} index={2}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Growth Trends Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={growthTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="categories" 
                    stackId="1" 
                    stroke={theme.palette.primary.main} 
                    fill={alpha(theme.palette.primary.main, 0.3)} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="products" 
                    stackId="2" 
                    stroke={theme.palette.success.main} 
                    fill={alpha(theme.palette.success.main, 0.3)} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </CustomTabPanel>
        </Paper>

        {/* Enhanced Categories List */}
        <Fade in={true} timeout={1400}>
          <Paper sx={{ borderRadius: 3, overflow: 'hidden', mt: 2 }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h6">
                    Categories ({stats.filteredCount})
                  </Typography>
                  {filteredCategories.length > 0 && (
                    <Checkbox
                      checked={selectedCategories.length === filteredCategories.length}
                      indeterminate={selectedCategories.length > 0 && selectedCategories.length < filteredCategories.length}
                      onChange={handleSelectAll}
                      icon={<SelectAllIcon />}
                      checkedIcon={<SelectAllIcon />}
                      size="small"
                    />
                  )}
                </Box>
              }
              subheader={`Filtered and sorted by ${filters.sortBy} (${filters.sortOrder})`}
              action={
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    onClick={() => router.push('/categories')}
                    endIcon={<VisibilityIcon />}
                  >
                    View All
                  </Button>
                  <Button
                    size="small"
                    onClick={() => router.push('/categories/new')}
                    startIcon={<AddIcon />}
                    variant="contained"
                    sx={{ borderRadius: 2 }}
                  >
                    Add New
                  </Button>
                </Stack>
              }
              sx={{ bgcolor: 'grey.50' }}
            />
            
            {filteredCategories.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CategoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No categories found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {searchQuery || filters.status !== 'all' || filters.hasProducts !== 'all' || filters.tags.length > 0
                    ? 'Try adjusting your search criteria or filters'
                    : 'Get started by creating your first category'
                  }
                </Typography>
                {(!searchQuery && filters.status === 'all' && filters.hasProducts === 'all' && filters.tags.length === 0) && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => router.push('/categories/new')}
                  >
                    Create Category
                  </Button>
                )}
              </Box>
            ) : (
              <List sx={{ p: 0, maxHeight: 600, overflow: 'auto' }}>
                {filteredCategories.map((category, index) => (
                  <React.Fragment key={category.id}>
                    <ListItemButton
                      sx={{ 
                        py: 2,
                        px: 3,
                        '&:hover': { bgcolor: 'action.hover' },
                        bgcolor: selectedCategories.includes(category.id!) ? alpha(theme.palette.primary.main, 0.08) : 'transparent'
                      }}
                      onClick={() => handleSelectCategory(category.id!)}
                    >
                      <ListItemIcon>
                        <Checkbox
                          checked={selectedCategories.includes(category.id!)}
                          onChange={() => handleSelectCategory(category.id!)}
                          size="small"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </ListItemIcon>
                      
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            bgcolor: category.color || '#1976d2',
                            width: 48,
                            height: 48,
                            mr: 1
                          }}
                        >
                          <span className="material-icons" style={{ fontSize: 20 }}>
                            {category.icon || 'category'}
                          </span>
                        </Avatar>
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {category.name}
                            </Typography>
                            <Chip
                              label={category.isActive ? 'Active' : 'Inactive'}
                              size="small"
                              color={category.isActive ? 'success' : 'warning'}
                              variant="outlined"
                            />
                            {category.tags?.map((tag) => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            ))}
                          </Box>
                        }
                        secondary={
                          <Box component="div">
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {category.description || 'No description'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <InventoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {category.metadata?.totalProducts || 0} products
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <MoneyIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {formatCurrency(category.metadata?.totalValue || 0)}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                Created {new Date(category.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                            {(category.metadata?.totalValue || 0) > 0 && (
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(((category.metadata?.totalValue || 0) / Math.max(...categories.map(c => c.metadata?.totalValue || 0))) * 100, 100)}
                                sx={{ mt: 1, height: 4, borderRadius: 2 }}
                              />
                            )}
                          </Box>
                        }
                        primaryTypographyProps={{ component: 'div' }}
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                      
                      <ListItemSecondaryAction>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="View Analytics">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/categories/${category.id}/analytics`);
                              }}
                            >
                              <AnalyticsIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Category">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/categories/edit/${category.id}`);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Copy Category">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(JSON.stringify({
                                  name: category.name,
                                  description: category.description,
                                  tags: category.tags
                                }, null, 2));
                                showSnackbar('Category details copied to clipboard');
                              }}
                            >
                              <CopyIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItemButton>
                    {index < filteredCategories.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Fade>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDialog.open}
          onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-description"
        >
          <DialogTitle id="confirm-dialog-title">
            {confirmDialog.title}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="confirm-dialog-description">
              {confirmDialog.message}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
              color="inherit"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDialog.onConfirm}
              color="error"
              variant="contained"
              autoFocus
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </ImprovedDashboardLayout>
  );
}