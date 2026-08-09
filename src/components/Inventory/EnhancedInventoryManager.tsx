"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Tabs,
  Tab,
  Badge,
  Alert,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  ShoppingCart as PurchaseIcon,
  Receipt as SalesIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
  FileUpload as ImportIcon
} from '@mui/icons-material';
import { productService } from '@/services/productService';
import ProductManagement from './ProductManagement';
import PurchaseInvoiceManager from './PurchaseInvoiceManager';
import RegularInvoiceManager from './RegularInvoiceManager';
import InventoryDashboard from './InventoryDashboard';

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
      id={`inventory-tabpanel-${index}`}
      aria-labelledby={`inventory-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `inventory-tab-${index}`,
    'aria-controls': `inventory-tabpanel-${index}`,
  };
}

export default function EnhancedInventoryManager() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    totalValue: 0,
    pendingPurchases: 0,
    pendingSales: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const productStats = await productService.getProductStatistics();
      setStats({
        totalProducts: productStats.totalProducts,
        activeProducts: productStats.activeProducts,
        lowStockProducts: productStats.lowStockProducts,
        totalValue: productStats.totalValue,
        pendingPurchases: 0, // Will be updated when we implement purchase service
        pendingSales: 0 // Will be updated when we implement sales service
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    loadStats();
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InventoryIcon color="primary" />
              Inventory Management System
            </Typography>
            
            <Stack direction="row" spacing={1}>
              <Tooltip title="Refresh Data">
                <IconButton onClick={handleRefresh} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                startIcon={<ImportIcon />}
                size="small"
              >
                Import
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                size="small"
              >
                Export
              </Button>
            </Stack>
          </Box>

          {/* Quick Stats */}
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3} md={2}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h6" color="primary">
                    {stats.totalProducts}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Total Products
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} sm={3} md={2}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h6" color="success.main">
                    {stats.activeProducts}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Active Products
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} sm={3} md={2}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h6" color="warning.main">
                    {stats.lowStockProducts}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Low Stock
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} sm={3} md={2}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h6" color="info.main">
                    ₹{stats.totalValue.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Total Value
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} sm={3} md={2}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h6" color="secondary.main">
                    {stats.pendingPurchases}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Pending Purchases
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} sm={3} md={2}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h6" color="error.main">
                    {stats.pendingSales}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Pending Sales
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Low Stock Alert */}
          {stats.lowStockProducts > 0 && (
            <Alert 
              severity="warning" 
              sx={{ mt: 2 }}
              action={
                <Button 
                  color="inherit" 
                  size="small"
                  onClick={() => setActiveTab(1)}
                >
                  View Products
                </Button>
              }
            >
              <strong>{stats.lowStockProducts}</strong> products are running low on stock. 
              Consider restocking soon.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="inventory management tabs"
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
          >
            <Tab 
              label="Dashboard" 
              icon={<TrendingUpIcon />} 
              iconPosition="start"
              {...a11yProps(0)} 
            />
            <Tab 
              label={
                <Badge badgeContent={stats.lowStockProducts} color="warning">
                  Products
                </Badge>
              } 
              icon={<InventoryIcon />} 
              iconPosition="start"
              {...a11yProps(1)} 
            />
            <Tab 
              label={
                <Badge badgeContent={stats.pendingPurchases} color="secondary">
                  Purchase Invoices
                </Badge>
              } 
              icon={<PurchaseIcon />} 
              iconPosition="start"
              {...a11yProps(2)} 
            />
            <Tab 
              label={
                <Badge badgeContent={stats.pendingSales} color="error">
                  Regular Invoices
                </Badge>
              } 
              icon={<SalesIcon />} 
              iconPosition="start"
              {...a11yProps(3)} 
            />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <InventoryDashboard onStatsUpdate={loadStats} />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <ProductManagement onStatsUpdate={loadStats} />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <PurchaseInvoiceManager onStatsUpdate={loadStats} />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <RegularInvoiceManager onStatsUpdate={loadStats} />
        </TabPanel>
      </Card>
    </Box>
  );
}