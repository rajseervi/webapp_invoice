"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid, 
  Paper,
  Typography,
  Button,
  Container,
  Alert,
  useTheme,
  alpha,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  useMediaQuery
} from '@mui/material';
import { useRouter } from 'next/navigation';
import DashboardSkeleton from '@/app/dashboard/components/DashboardSkeleton';
// Import dashboard layout
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';

// Import dashboard data hook
import { useDashboardData } from '@/app/dashboard/hooks/useDashboardData';
  

// Import enhanced visualization components
import KPISummary from './components/KPISummary';
import EnhancedVisualizations from '@/components/DashboardLayout/EnhancedVisualizations';
// import PerformanceMetrics from './components/PerformanceMetrics';

// Import icons
import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowUpward,
  ArrowDownward
} from '@mui/icons-material';

// Import useCurrentUser hook
import { useCurrentUser } from '@/app/hooks/useCurrentUser'; // Make sure this hook provides the role

// Dashboard Content Component
const DashboardContent = () => {
  const theme = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const { userId, role } = useCurrentUser(); // Assuming role is returned here ('admin', 'manager', 'user')
  const [pendingUsers, setPendingUsers] = useState<number>(0);

  // Add responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  
  // Use dashboard data hook
 
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Use dashboard data hook - This hook might call hooks conditionally based on 'role'
  const {
    stats,
    recentInvoices,
    lowStockItems,
    topCustomers,
    monthlySalesData,
    categorySalesData,
    dailySalesData,
    loading,
    error,
    refetch
  } = useDashboardData(role); // Pass role to the hook

  // Move the useEffect here, before any conditional returns
  useEffect(() => {
    if (role === 'admin') {
      // Fetch pending users count
      const fetchPendingUsers = async () => {
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const pending = usersSnapshot.docs.filter(doc => doc.data().status === 'pending').length;
        setPendingUsers(pending);
      };
      fetchPendingUsers();
    }
  }, [role]);

  // Conditional return is okay IF all hooks were called before it
  if (loading) {
    return <DashboardSkeleton />;
  }

  // --- Role-Specific Content ---

  const renderAdminDashboard = () => (
    <>
      {/* Admin Welcome Section (Can be customized) */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: { xs: 2, sm: 2.5, md: 4 },
          borderRadius: 3,
          background: theme => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
          border: theme => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={7}>
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography 
                variant="h3" 
                component="h1" 
                gutterBottom 
                fontWeight={800}
                sx={{ 
                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.5rem' },
                  background: theme => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                Welcome to your Dashboard
              </Typography>
              <Typography 
                variant="h6" 
                color="text.secondary" 
                sx={{ 
                  mb: 2, 
                  fontWeight: 400,
                  fontSize: { xs: '0.85rem', sm: '1rem', md: '1.25rem' }
                }}
              >
                Get a comprehensive overview of your business performance and make data-driven decisions.
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2, 
                mt: 3,
                width: { xs: '100%', sm: 'auto' }
              }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  size={isMobile ? "medium" : "large"}
                  fullWidth={isMobile}
                  onClick={() => router.push('/analytics')}
                  sx={{ 
                    borderRadius: 2,
                    px: { xs: 2, md: 3 },
                    py: { xs: 1, sm: 1.5 },
                    boxShadow: theme => `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`
                  }}
                >
                  View Analytics
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary"
                  size={isMobile ? "medium" : "large"}
                  fullWidth={isMobile}
                  onClick={() => router.push('/invoices')}
                  sx={{ 
                    borderRadius: 2, 
                    px: { xs: 2, md: 3 },
                    py: { xs: 1, sm: 1.5 }
                  }}
                >
                  Manage Invoices
                </Button>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                position: 'relative',
                zIndex: 1
              }}
            >
              
            </Box>
          </Grid>
        </Grid>
        
        {/* Background decoration */}
        <Box
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: theme => `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 70%, transparent 100%)`,
            zIndex: 0
          }}
        />
      </Paper>
      
      {/* Stats Cards */}
      <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, md: 3 },
                height: '100%',
                borderRadius: 2,
                border: '1px solid',
                borderColor: theme => alpha(theme.palette.divider, 0.1),
                background: theme => stat.color ? alpha(stat.color, 0.05) : 'transparent',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    backgroundColor: theme => stat.color ? alpha(stat.color, 0.12) : alpha(theme.palette.primary.main, 0.12),
                    color: stat.color || theme.palette.primary.main,
                    mr: 2
                  }}
                >
                  {stat.icon}
                </Box>
                <Typography variant="subtitle2" color="text.secondary">
                  {stat.title}
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 0.5 }}>
                {stat.value}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography 
                  variant="body2" 
                  color={stat.change >= 0 ? 'success.main' : 'error.main'}
                  sx={{ display: 'flex', alignItems: 'center', mr: 1 }}
                >
                  {stat.change >= 0 ? '+' : ''}{stat.change}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  vs. yesterday
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      {/* Main Dashboard Content */}
      <Box sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : undefined}
          sx={{
            mb: 3,
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          <Tab label="Overview" />
          <Tab label="Sales" />
          <Tab label="Inventory" />
          <Tab label="Customers" />
        </Tabs>
        
        {/* Tab Content */}
        <Box role="tabpanel" hidden={activeTab !== 0}>
          {activeTab === 0 && (
            <Grid container spacing={isMobile ? 2 : 3}>
              {/* KPI Summary */}
              <Grid item xs={12}>
                <KPISummary />
              </Grid>
              
              {/* Recent Invoices */}
              <Grid item xs={12} md={6} lg={8}>
                <Paper sx={{ 
                  p: { xs: 2, md: 3 }, 
                  height: '100%', 
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Recent Invoices</Typography>
                    <Button 
                      size="small" 
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => router.push('/invoices')}
                    >
                      View All
                    </Button>
                  </Box>
                  {/* Recent Invoices Content */}
                </Paper>
              </Grid>
              
              {/* Low Stock Items */}
              <Grid item xs={12} md={6} lg={4}>
                <Paper sx={{ 
                  p: { xs: 2, md: 3 }, 
                  height: '100%', 
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Low Stock Items</Typography>
                    <Button 
                      size="small" 
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => router.push('/inventory')}
                    >
                      View All
                    </Button>
                  </Box>
                  {/* Low Stock Items Content */}
                </Paper>
              </Grid>
            </Grid>
          )}
        </Box>
        
        {/* Sales Tab Content */}
        <Box role="tabpanel" hidden={activeTab !== 1}>
          {activeTab === 1 && (
            <EnhancedVisualizations />
          )}
        </Box>
        
        {/* Inventory Tab Content */}
        <Box role="tabpanel" hidden={activeTab !== 2}>
          {activeTab === 2 && (
            <Typography>Inventory content coming soon</Typography>
          )}
        </Box>
        
        {/* Customers Tab Content */}
        <Box role="tabpanel" hidden={activeTab !== 3}>
          {activeTab === 3 && (
            <Grid container spacing={isMobile ? 2 : 3}>
              <Grid item xs={12}>
                <Paper sx={{ 
                  p: { xs: 2, md: 3 }, 
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                  <Typography variant="h6" gutterBottom>Top Customers</Typography>
                  {/* Top Customers Content */}
                </Paper>
              </Grid>
            </Grid>
          )}
        </Box>
      </Box>
    </>
  );

  // Move this function outside of DashboardContent
  function ClientOnlyComponent(props) {
    const [mounted, setMounted] = useState(false);
  
    useEffect(() => {
      setMounted(true);
    }, []);
  
    if (!mounted) {
      // Optionally render a placeholder or nothing
      return null;
    }
  
    // Now it's safe to use useLayoutEffect inside children
    return <YourComponent {...props} />;
  }


  // --- Role render functions ---
  
  // Manager Dashboard
  const renderManagerDashboard = () => (
    <>
      {/* Manager Welcome Section */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: { xs: 2, sm: 2.5, md: 4 },
          borderRadius: 3,
          background: theme => `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.info.main, 0.1)} 100%)`,
          border: theme => `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={7}>
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography 
                variant="h3" 
                component="h1" 
                gutterBottom 
                fontWeight={800}
                sx={{ 
                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.5rem' },
                  background: theme => `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                Manager Dashboard
              </Typography>
              <Typography 
                variant="h6" 
                color="text.secondary" 
                sx={{ 
                  mb: 2, 
                  fontWeight: 400,
                  fontSize: { xs: '0.85rem', sm: '1rem', md: '1.25rem' }
                }}
              >
                Monitor team performance, manage inventory, and oversee daily operations.
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2, 
                mt: 3,
                width: { xs: '100%', sm: 'auto' }
              }}>
                <Button 
                  variant="contained" 
                  color="info" 
                  size={isMobile ? "medium" : "large"}
                  fullWidth={isMobile}
                  onClick={() => router.push('/inventory')}
                  sx={{ 
                    borderRadius: 2,
                    px: { xs: 2, md: 3 },
                    py: { xs: 1, sm: 1.5 },
                    boxShadow: theme => `0 4px 14px ${alpha(theme.palette.info.main, 0.4)}`
                  }}
                >
                  Manage Inventory
                </Button>
                <Button 
                  variant="outlined" 
                  color="info"
                  size={isMobile ? "medium" : "large"}
                  fullWidth={isMobile}
                  onClick={() => router.push('/orders')}
                  sx={{ 
                    borderRadius: 2, 
                    px: { xs: 2, md: 3 },
                    py: { xs: 1, sm: 1.5 }
                  }}
                >
                  View Orders
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Manager-specific KPIs */}
      <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
        Team Performance
      </Typography>
      
      <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 4 }}>
        {stats.slice(0, 4).map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, md: 3 },
                height: '100%',
                borderRadius: 2,
                border: '1px solid',
                borderColor: theme => alpha(theme.palette.divider, 0.1),
                background: theme => stat.color ? alpha(stat.color, 0.05) : 'transparent',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: theme => stat.color ? alpha(stat.color, 0.12) : 'transparent',
                    color: stat.color,
                    mr: 1.5
                  }}
                >
                  {stat.icon}
                </Box>
                <Typography variant="h6" component="h3" fontWeight={600}>
                  {stat.title}
                </Typography>
              </Box>
              <Typography variant="h4" component="p" fontWeight={700} sx={{ mb: 1 }}>
                {stat.value}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {stat.trend > 0 ? (
                  <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                    <ArrowUpward fontSize="small" sx={{ mr: 0.5 }} />
                    {stat.trend}% increase
                  </Typography>
                ) : (
                  <Typography variant="body2" color="error.main" sx={{ display: 'flex', alignItems: 'center' }}>
                    <ArrowDownward fontSize="small" sx={{ mr: 0.5 }} />
                    {Math.abs(stat.trend)}% decrease
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  vs last month
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      {/* Inventory Status */}
      <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
        Inventory Status
      </Typography>
      
      <Paper 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          boxShadow: theme => `0 2px 10px ${alpha(theme.palette.info.main, 0.08)}`,
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Low Stock Items
          </Typography>
          <Divider />
        </Box>
        
        {lowStockItems && lowStockItems.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">SKU</TableCell>
                  <TableCell align="right">Current Stock</TableCell>
                  <TableCell align="right">Reorder Level</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lowStockItems.map((item, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="right">{item.sku}</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={item.quantity} 
                        color={item.quantity <= 5 ? "error" : "warning"} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="right">{item.reorderLevel}</TableCell>
                    <TableCell align="right">
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => router.push(`/inventory/${item.id}`)}
                      >
                        Restock
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography color="text.secondary">
              No low stock items at the moment
            </Typography>
          </Box>
        )}
      </Paper>
    </>
  );
  
  // Regular User Dashboard
  const renderUserDashboard = () => (
    <>
      {/* User Welcome Section */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: { xs: 2, sm: 2.5, md: 4 },
          borderRadius: 3,
          background: theme => `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.main, 0.1)} 100%)`,
          border: theme => `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={7}>
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography 
                variant="h3" 
                component="h1" 
                gutterBottom 
                fontWeight={800}
                sx={{ 
                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.5rem' },
                  background: theme => `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                User Dashboard
              </Typography>
              <Typography 
                variant="h6" 
                color="text.secondary" 
                sx={{ 
                  mb: 2, 
                  fontWeight: 400,
                  fontSize: { xs: '0.85rem', sm: '1rem', md: '1.25rem' }
                }}
              >
                Track your daily tasks, manage orders, and view your performance.
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2, 
                mt: 3,
                width: { xs: '100%', sm: 'auto' }
              }}>
                <Button 
                  variant="contained" 
                  color="success" 
                  size={isMobile ? "medium" : "large"}
                  fullWidth={isMobile}
                  onClick={() => router.push('/orders/new')}
                  sx={{ 
                    borderRadius: 2,
                    px: { xs: 2, md: 3 },
                    py: { xs: 1, sm: 1.5 },
                    boxShadow: theme => `0 4px 14px ${alpha(theme.palette.success.main, 0.4)}`
                  }}
                >
                  Create New Order
                </Button>
                <Button 
                  variant="outlined" 
                  color="success"
                  size={isMobile ? "medium" : "large"}
                  fullWidth={isMobile}
                  onClick={() => router.push('/orders')}
                  sx={{ 
                    borderRadius: 2, 
                    px: { xs: 2, md: 3 },
                    py: { xs: 1, sm: 1.5 }
                  }}
                >
                  View Orders
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* User-specific KPIs - Simplified for regular users */}
      <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
        Your Activity
      </Typography>
      
      <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 4 }}>
        {stats.slice(0, 2).map((stat, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, md: 3 },
                height: '100%',
                borderRadius: 2,
                border: '1px solid',
                borderColor: theme => alpha(theme.palette.divider, 0.1),
                background: theme => stat.color ? alpha(stat.color, 0.05) : 'transparent',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: theme => stat.color ? alpha(stat.color, 0.12) : 'transparent',
                    color: stat.color,
                    mr: 1.5
                  }}
                >
                  {stat.icon}
                </Box>
                <Typography variant="h6" component="h3" fontWeight={600}>
                  {stat.title}
                </Typography>
              </Box>
              <Typography variant="h4" component="p" fontWeight={700} sx={{ mb: 1 }}>
                {stat.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      {/* Recent Orders - Limited view for users */}
      <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
        Recent Orders
      </Typography>
      
      <Paper 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          boxShadow: theme => `0 2px 10px ${alpha(theme.palette.success.main, 0.08)}`,
        }}
      >
        {recentInvoices && recentInvoices.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentInvoices.slice(0, 5).map((invoice, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{invoice.id}</TableCell>
                    <TableCell>{invoice.customer}</TableCell>
                    <TableCell align="right">{formatCurrency(invoice.amount)}</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={invoice.status} 
                        color={
                          invoice.status === 'Paid' ? 'success' :
                          invoice.status === 'Pending' ? 'warning' : 'error'
                        } 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => router.push(`/orders/${invoice.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography color="text.secondary">
              No recent orders
            </Typography>
          </Box>
        )}
      </Paper>
    </>
  );

  // --- Main return logic based on role ---
  if (role === 'admin') {
    return renderAdminDashboard();
  } else if (role === 'manager') {
    return renderManagerDashboard();
  } else {
    return renderUserDashboard();
  }
};

// --- Main Page Component ---
export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}