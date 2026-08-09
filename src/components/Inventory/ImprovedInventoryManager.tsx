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
  useMediaQuery,
  Paper,
  Fab,
  Zoom,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Avatar,
  ListItemAvatar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
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
  FileUpload as ImportIcon,
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  Sort as SortIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  LocalOffer as TagIcon,
  Category as CategoryIcon,
  Store as StoreIcon,
  Assessment as ReportIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  CloudSync as SyncIcon,
  Backup as BackupIcon,
  CheckCircle as CheckCircleIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { productService } from '@/services/productService';
import ProductManagement from './ProductManagement';
import PurchaseInvoiceManager from './PurchaseInvoiceManager';
import RegularInvoiceManager from './RegularInvoiceManager';
import ImprovedInventoryDashboard from './ImprovedInventoryDashboard';
import InventoryAnalytics from './InventoryAnalytics';
import InventorySettings from './InventorySettings';
import InventoryAlerts from './InventoryAlerts';

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
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
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

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  action: () => void;
}

export default function ImprovedInventoryManager() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as any });
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalValue: 0,
    pendingPurchases: 0,
    pendingSales: 0,
    recentMovements: 0,
    criticalAlerts: 0,
    monthlyGrowth: 0,
    profitMargin: 0,
    turnoverRate: 0
  });

  const [quickActionsDialog, setQuickActionsDialog] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);

  useEffect(() => {
    loadStats();
    loadNotifications();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => {
      loadStats();
      loadNotifications();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const productStats = await productService.getProductStatistics();
      setStats(prevStats => ({
        ...prevStats,
        totalProducts: productStats.totalProducts,
        activeProducts: productStats.activeProducts,
        lowStockProducts: productStats.lowStockProducts,
        outOfStockProducts: productStats.outOfStockProducts || 0,
        totalValue: productStats.totalValue,
        monthlyGrowth: Math.random() * 20 - 10, // Mock data
        profitMargin: Math.random() * 30 + 10, // Mock data
        turnoverRate: Math.random() * 5 + 1, // Mock data
        pendingPurchases: 0, // Will be updated when we implement purchase service
        pendingSales: 0, // Will be updated when we implement sales service
        recentMovements: Math.floor(Math.random() * 50),
        criticalAlerts: productStats.lowStockProducts + (productStats.outOfStockProducts || 0)
      }));
    } catch (error) {
      console.error('Error loading stats:', error);
      showSnackbar('Error loading inventory statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      // Mock notifications - replace with actual service call
      const mockNotifications = [
        {
          id: 1,
          type: 'warning',
          title: 'Low Stock Alert',
          message: `${stats.lowStockProducts} products are running low on stock`,
          timestamp: new Date(),
          read: false
        },
        {
          id: 2,
          type: 'info',
          title: 'New Purchase Order',
          message: 'Purchase order #PO-2024-001 has been received',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          read: false
        },
        {
          id: 3,
          type: 'success',
          title: 'Inventory Updated',
          message: 'Stock levels have been successfully updated',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          read: true
        }
      ];
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    await loadNotifications();
    setRefreshing(false);
    showSnackbar('Data refreshed successfully', 'success');
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const quickActions: QuickAction[] = [
    {
      id: 'add-product',
      label: 'Add Product',
      icon: <AddIcon />,
      color: 'primary',
      action: () => setActiveTab(1)
    },
    {
      id: 'create-purchase',
      label: 'Create Purchase',
      icon: <PurchaseIcon />,
      color: 'secondary',
      action: () => setActiveTab(2)
    },
    {
      id: 'generate-report',
      label: 'Generate Report',
      icon: <ReportIcon />,
      color: 'info',
      action: () => setActiveTab(4)
    },
    {
      id: 'view-alerts',
      label: 'View Alerts',
      icon: <NotificationsIcon />,
      color: 'warning',
      action: () => setActiveTab(5)
    }
  ];

  const StatCard = ({ title, value, subtitle, icon, color, trend }: any) => (
    <Card 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${theme.palette[color]?.main}15 0%, ${theme.palette[color]?.main}05 100%)`,
        border: `1px solid ${theme.palette[color]?.main}20`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
          border: `1px solid ${theme.palette[color]?.main}40`
        }
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 40, height: 40 }}>
            {icon}
          </Avatar>
          {trend && (
            <Chip
              size="small"
              icon={trend > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
              label={`${Math.abs(trend).toFixed(1)}%`}
              color={trend > 0 ? 'success' : 'error'}
              variant="outlined"
            />
          )}
        </Box>
        <Typography variant="h4" component="div" color={`${color}.main`} fontWeight="bold">
          {typeof value === 'number' && value > 1000 ? 
            `${(value / 1000).toFixed(1)}K` : 
            value?.toLocaleString?.() || value
          }
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="textSecondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Enhanced Header */}
      <Card sx={{ mb: 3, overflow: 'visible' }}>
        <CardContent sx={{ pb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                <InventoryIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" component="h1" fontWeight="bold">
                  Inventory Management
                </Typography>
                <Typography variant="subtitle1" color="textSecondary">
                  Comprehensive inventory control system
                </Typography>
              </Box>
            </Box>
            
            <Stack direction="row" spacing={1} alignItems="center">
              <Badge badgeContent={notifications.filter(n => !n.read).length} color="error">
                <IconButton onClick={() => setActiveTab(5)}>
                  <NotificationsIcon />
                </IconButton>
              </Badge>
              
              <Tooltip title="Refresh Data">
                <IconButton onClick={handleRefresh} disabled={refreshing}>
                  <RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="View Mode">
                <IconButton onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
                  {viewMode === 'grid' ? <ViewListIcon /> : <ViewModuleIcon />}
                </IconButton>
              </Tooltip>
              
              <Button
                variant="outlined"
                startIcon={<ImportIcon />}
                size="small"
                sx={{ display: { xs: 'none', sm: 'flex' } }}
              >
                Import
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                size="small"
                sx={{ display: { xs: 'none', sm: 'flex' } }}
              >
                Export
              </Button>
              
              <IconButton onClick={() => setSettingsDialog(true)}>
                <SettingsIcon />
              </IconButton>
            </Stack>
          </Box>

          {/* Enhanced Stats Grid */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6} sm={4} md={3} lg={2}>
              <StatCard
                title="Total Products"
                value={stats.totalProducts}
                icon={<InventoryIcon />}
                color="primary"
                trend={stats.monthlyGrowth}
              />
            </Grid>
            
            <Grid item xs={6} sm={4} md={3} lg={2}>
              <StatCard
                title="Active Products"
                value={stats.activeProducts}
                icon={<CheckCircleIcon />}
                color="success"
              />
            </Grid>
            
            <Grid item xs={6} sm={4} md={3} lg={2}>
              <StatCard
                title="Low Stock"
                value={stats.lowStockProducts}
                subtitle="Needs attention"
                icon={<WarningIcon />}
                color="warning"
              />
            </Grid>
            
            <Grid item xs={6} sm={4} md={3} lg={2}>
              <StatCard
                title="Out of Stock"
                value={stats.outOfStockProducts}
                subtitle="Critical"
                icon={<TrendingDownIcon />}
                color="error"
              />
            </Grid>
            
            <Grid item xs={6} sm={4} md={3} lg={2}>
              <StatCard
                title="Total Value"
                value={`₹${(stats.totalValue / 100000).toFixed(1)}L`}
                subtitle="Inventory worth"
                icon={<MoneyIcon />}
                color="info"
                trend={stats.profitMargin}
              />
            </Grid>
            
            <Grid item xs={6} sm={4} md={3} lg={2}>
              <StatCard
                title="Turnover Rate"
                value={`${stats.turnoverRate.toFixed(1)}x`}
                subtitle="Per month"
                icon={<SpeedIcon />}
                color="secondary"
              />
            </Grid>
          </Grid>

          {/* Critical Alerts */}
          {(stats.lowStockProducts > 0 || stats.outOfStockProducts > 0) && (
            <Alert 
              severity="warning" 
              sx={{ 
                mb: 2,
                '& .MuiAlert-message': { width: '100%' }
              }}
              action={
                <Stack direction="row" spacing={1}>
                  <Button 
                    color="inherit" 
                    size="small"
                    onClick={() => setActiveTab(5)}
                  >
                    View Alerts
                  </Button>
                  <Button 
                    color="inherit" 
                    size="small"
                    onClick={() => setActiveTab(1)}
                  >
                    Manage Stock
                  </Button>
                </Stack>
              }
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                <Typography variant="body2">
                  <strong>{stats.criticalAlerts}</strong> products need immediate attention
                  {stats.outOfStockProducts > 0 && (
                    <> • <strong>{stats.outOfStockProducts}</strong> out of stock</>
                  )}
                  {stats.lowStockProducts > 0 && (
                    <> • <strong>{stats.lowStockProducts}</strong> low stock</>
                  )}
                </Typography>
              </Box>
            </Alert>
          )}

          {/* Quick Actions */}
          {showQuickActions && (
            <Paper sx={{ p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Quick Actions
                </Typography>
                <IconButton size="small" onClick={() => setShowQuickActions(false)}>
                  <MoreVertIcon />
                </IconButton>
              </Box>
              <Grid container spacing={2}>
                {quickActions.map((action) => (
                  <Grid item xs={6} sm={3} key={action.id}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={action.icon}
                      onClick={action.action}
                      sx={{
                        py: 1.5,
                        borderColor: `${action.color}.main`,
                        color: `${action.color}.main`,
                        '&:hover': {
                          bgcolor: `${action.color}.main`,
                          color: 'white'
                        }
                      }}
                    >
                      {action.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Navigation Tabs */}
      <Card sx={{ overflow: 'visible' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="inventory management tabs"
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 500
              }
            }}
          >
            <Tab 
              label="Dashboard" 
              icon={<DashboardIcon />} 
              iconPosition="start"
              {...a11yProps(0)} 
            />
            <Tab 
              label={
                <Badge badgeContent={stats.lowStockProducts} color="warning" max={99}>
                  Products
                </Badge>
              } 
              icon={<InventoryIcon />} 
              iconPosition="start"
              {...a11yProps(1)} 
            />
            <Tab 
              label={
                <Badge badgeContent={stats.pendingPurchases} color="secondary" max={99}>
                  Purchases
                </Badge>
              } 
              icon={<PurchaseIcon />} 
              iconPosition="start"
              {...a11yProps(2)} 
            />
            <Tab 
              label={
                <Badge badgeContent={stats.pendingSales} color="error" max={99}>
                  Sales
                </Badge>
              } 
              icon={<SalesIcon />} 
              iconPosition="start"
              {...a11yProps(3)} 
            />
            <Tab 
              label="Analytics" 
              icon={<AnalyticsIcon />} 
              iconPosition="start"
              {...a11yProps(4)} 
            />
            <Tab 
              label={
                <Badge badgeContent={stats.criticalAlerts} color="error" max={99}>
                  Alerts
                </Badge>
              } 
              icon={<NotificationsIcon />} 
              iconPosition="start"
              {...a11yProps(5)} 
            />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <ImprovedInventoryDashboard 
            onStatsUpdate={loadStats} 
            stats={stats}
            viewMode={viewMode}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <ProductManagement 
            onStatsUpdate={loadStats} 
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <PurchaseInvoiceManager onStatsUpdate={loadStats} />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <RegularInvoiceManager onStatsUpdate={loadStats} />
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <InventoryAnalytics stats={stats} />
        </TabPanel>

        <TabPanel value={activeTab} index={5}>
          <InventoryAlerts 
            notifications={notifications}
            onNotificationUpdate={loadNotifications}
            stats={stats}
          />
        </TabPanel>
      </Card>

      {/* Floating Action Button */}
      <Zoom in={activeTab === 1}>
        <Fab
          color="primary"
          aria-label="add product"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000
          }}
          onClick={() => setQuickActionsDialog(true)}
        >
          <AddIcon />
        </Fab>
      </Zoom>

      {/* Quick Actions Dialog */}
      <Dialog open={quickActionsDialog} onClose={() => setQuickActionsDialog(false)}>
        <DialogTitle>Quick Actions</DialogTitle>
        <DialogContent>
          <List>
            {quickActions.map((action, index) => (
              <React.Fragment key={action.id}>
                <ListItem button onClick={() => {
                  action.action();
                  setQuickActionsDialog(false);
                }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: `${action.color}.main` }}>
                      {action.icon}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={action.label} />
                </ListItem>
                {index < quickActions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickActionsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsDialog} onClose={() => setSettingsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Inventory Settings</DialogTitle>
        <DialogContent>
          <InventorySettings onClose={() => setSettingsDialog(false)} />
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
}