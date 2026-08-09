'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Fab,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Analytics as AnalyticsIcon,
  ImportExport as ImportExportIcon,
  Category as CategoryIcon,
  QrCode as QrCodeIcon,
  Print as PrintIcon,
  GetApp as ExportIcon,
  Upload as UploadIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import ModernDashboardLayout from '@/components/ModernLayout/ModernDashboardLayout';
import PageHeader from '@/components/PageHeader/PageHeader';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { Product, Category } from '@/types/inventory';

// Import enhanced components
import ProductDashboard from '../components/ProductDashboard';
import EnhancedProductList from '../components/EnhancedProductList';
import ProductAnalytics from '../components/ProductAnalytics';
import BulkOperations from '../components/BulkOperations';
import ProductImportExport from '../components/ProductImportExport';

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
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function EnhancedProductManagementPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { userId } = useCurrentUser();
  
  // State management
  const [currentTab, setCurrentTab] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  // Statistics
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    totalValue: 0,
    averagePrice: 0,
    gstRateDistribution: {} as Record<number, number>
  });

  // Speed dial actions
  const speedDialActions = [
    { 
      icon: <AddIcon />, 
      name: 'Add Product', 
      action: () => router.push('/products/new'),
      color: theme.palette.primary.main
    },
    { 
      icon: <UploadIcon />, 
      name: 'Import Products', 
      action: () => setCurrentTab(4),
      color: theme.palette.info.main
    },
    { 
      icon: <ExportIcon />, 
      name: 'Export Products', 
      action: () => setCurrentTab(4),
      color: theme.palette.success.main
    },
    { 
      icon: <QrCodeIcon />, 
      name: 'Generate Barcodes', 
      action: () => handleBulkBarcodeGeneration(),
      color: theme.palette.secondary.main
    },
    { 
      icon: <PrintIcon />, 
      name: 'Print Labels', 
      action: () => handlePrintLabels(),
      color: theme.palette.warning.main
    },
    { 
      icon: <CategoryIcon />, 
      name: 'Manage Categories', 
      action: () => router.push('/categories'),
      color: theme.palette.grey[600]
    }
  ];

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [userId]);

  const loadInitialData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);

      // Load products, categories, and statistics in parallel
      const [productsResponse, categoriesData, statisticsData] = await Promise.all([
        productService.getProducts({ status: 'all' }),
        categoryService.getCategories(),
        productService.getProductStatistics()
      ]);

      setProducts(productsResponse.products);
      setCategories(categoriesData);
      setStats(statisticsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load product data. Please try again.');
      showSnackbar('Failed to load product data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleRefreshData = () => {
    loadInitialData();
  };

  const handleBulkBarcodeGeneration = () => {
    // TODO: Implement bulk barcode generation
    showSnackbar('Bulk barcode generation feature coming soon!', 'info');
  };

  const handlePrintLabels = () => {
    // TODO: Implement print labels functionality
    showSnackbar('Print labels feature coming soon!', 'info');
  };

  // Calculate low stock count for badge
  const lowStockCount = useMemo(() => {
    return products.filter(p => p.quantity < (p.reorderPoint || 10)).length;
  }, [products]);

  // Calculate inactive products count
  const inactiveCount = useMemo(() => {
    return products.filter(p => !p.isActive).length;
  }, [products]);

  if (loading) {
    return (
      <ModernDashboardLayout>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <Typography>Loading product management...</Typography>
          </Box>
        </Container>
      </ModernDashboardLayout>
    );
  }

  return (
    <ModernDashboardLayout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Enhanced Page Header */}
        <PageHeader
          title="Product Management"
          subtitle="Comprehensive product inventory management with advanced features"
          icon={<InventoryIcon />}
          actions={
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => router.push('/products/new')}
                size="large"
              >
                Add Product
              </Button>
              <Button
                variant="outlined"
                startIcon={<AnalyticsIcon />}
                onClick={() => setCurrentTab(2)}
              >
                Analytics
              </Button>
            </Box>
          }
        />

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Quick Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Products
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats.totalProducts}
                    </Typography>
                  </Box>
                  <InventoryIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Active Products
                    </Typography>
                    <Typography variant="h4" component="div" color="success.main">
                      {stats.activeProducts}
                    </Typography>
                  </Box>
                  <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Low Stock Items
                    </Typography>
                    <Typography variant="h4" component="div" color="warning.main">
                      {stats.lowStockProducts}
                    </Typography>
                  </Box>
                  <Badge badgeContent={lowStockCount} color="error">
                    <WarningIcon color="warning" sx={{ fontSize: 40 }} />
                  </Badge>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Value
                    </Typography>
                    <Typography variant="h4" component="div">
                      ₹{stats.totalValue.toLocaleString()}
                    </Typography>
                  </Box>
                  <DashboardIcon color="info" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content Tabs */}
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={currentTab} 
              onChange={handleTabChange} 
              aria-label="product management tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DashboardIcon fontSize="small" />
                    Dashboard
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InventoryIcon fontSize="small" />
                    Products
                    {inactiveCount > 0 && (
                      <Chip label={inactiveCount} size="small" color="warning" />
                    )}
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AnalyticsIcon fontSize="small" />
                    Analytics
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon fontSize="small" />
                    Bulk Operations
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ImportExportIcon fontSize="small" />
                    Import/Export
                  </Box>
                } 
              />
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <TabPanel value={currentTab} index={0}>
            <ProductDashboard 
              products={products}
              categories={categories}
              stats={stats}
              onRefresh={handleRefreshData}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <EnhancedProductList 
              products={products}
              categories={categories}
              onRefresh={handleRefreshData}
              onProductUpdate={(updatedProduct) => {
                setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
              }}
              onProductDelete={(deletedId) => {
                setProducts(prev => prev.filter(p => p.id !== deletedId));
              }}
              onShowSnackbar={showSnackbar}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            <ProductAnalytics 
              products={products}
              categories={categories}
              stats={stats}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={3}>
            <BulkOperations 
              products={products}
              categories={categories}
              onBulkUpdate={handleRefreshData}
              onShowSnackbar={showSnackbar}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={4}>
            <ProductImportExport 
              products={products}
              categories={categories}
              onImportSuccess={handleRefreshData}
              onShowSnackbar={showSnackbar}
            />
          </TabPanel>
        </Paper>

        {/* Enhanced Speed Dial for Quick Actions - Mobile Optimized */}
        <SpeedDial
          ariaLabel="Product actions"
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

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message}
        />
      </Container>
    </ModernDashboardLayout>
  );
}