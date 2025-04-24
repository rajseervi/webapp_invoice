"use client";
import React, { useState } from 'react';
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
  CardContent
} from '@mui/material';
import { useRouter } from 'next/navigation';

// Import dashboard layout
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';

// Import dashboard data hook
import { useDashboardData } from './hooks/dashboardData';

// Import dashboard skeleton for loading state
import DashboardSkeleton from './components/DashboardSkeleton';

// Import quick actions component
import QuickActions from '@/components/Common/QuickActions';

// Import enhanced visualization components
import KPISummary from '@/components/Dashboard/KPISummary';
import EnhancedVisualizations from '@/components/Dashboard/EnhancedVisualizations';
import PerformanceMetrics from '@/components/Dashboard/PerformanceMetrics';

// Import icons
import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

// Dashboard Content Component
const DashboardContent = () => {
  const theme = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  
  // Use dashboard data hook
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
  } = useDashboardData();

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

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            boxShadow: theme => `0 2px 10px ${alpha(theme.palette.error.main, 0.15)}`
          }}
        >
          {error}
        </Alert>
      )}
      
      {/* Welcome Section */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: { xs: 2.5, md: 4 },
          borderRadius: 3,
          background: theme => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
          border: theme => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={7}>
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography 
                variant="h3" 
                component="h1" 
                gutterBottom 
                fontWeight={800}
                sx={{ 
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
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
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' }
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
                  size="large"
                  fullWidth={true}
                  onClick={() => router.push('/analytics')}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    py: { xs: 1.5, sm: 'auto' },
                    boxShadow: theme => `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`
                  }}
                >
                  View Analytics
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary"
                  size="large"
                  fullWidth={true}
                  onClick={() => router.push('/invoices')}
                  sx={{ 
                    borderRadius: 2, 
                    px: 3,
                    py: { xs: 1.5, sm: 'auto' }
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
              <Box 
                component="img" 
                src="/dashboard-illustration.svg" 
                alt="Dashboard Illustration"
                sx={{ 
                  maxWidth: '100%', 
                  height: 'auto',
                  maxHeight: 200,
                  opacity: 0.9
                }}
                onError={(e) => {
                  // Fallback if image doesn't exist
                  e.currentTarget.style.display = 'none';
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* KPI Summary */}
      <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
        Key Performance Indicators
      </Typography>
      
      <KPISummary stats={stats} formatCurrency={formatCurrency} />
      
      {/* Dashboard Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            mb: 2,
            '& .MuiTab-root': {
              minHeight: 64,
              py: 2
            }
          }}
        >
          <Tab 
            icon={<DashboardIcon />} 
            label="Business Overview" 
            iconPosition="start"
          />
          <Tab 
            icon={<AnalyticsIcon />} 
            label="Performance Metrics" 
            iconPosition="start"
          />
        </Tabs>
        
        <Divider />
      </Box>
      
      {/* Tab Content */}
      <Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
            Business Performance
          </Typography>
          <Tooltip title="Refresh Data">
            <IconButton onClick={refetch}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <EnhancedVisualizations 
          monthlySalesData={monthlySalesData}
          categorySalesData={categorySalesData}
          dailySalesData={dailySalesData}
          formatCurrency={formatCurrency}
          onRefresh={refetch}
        />
      </Box>
      
      <Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
            Performance Metrics
          </Typography>
          <Tooltip title="Refresh Data">
            <IconButton onClick={refetch}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <PerformanceMetrics 
          topCustomers={topCustomers}
          lowStockItems={lowStockItems}
          recentInvoices={recentInvoices}
          formatCurrency={formatCurrency}
        />
      </Box>
      
      <Container 
        maxWidth="xl" 
        disableGutters 
        sx={{ 
          px: { xs: 2, sm: 2 },
          mt: 6
        }}
      >
        <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
          Quick Access
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%', 
              borderRadius: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[6],
              },
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Inventory Management
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Track inventory levels, manage stock, and set up alerts for low stock items.
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => router.push('/inventory')}
                >
                  Manage Inventory
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%', 
              borderRadius: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[6],
              },
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Customer Management
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  View customer information, track purchase history, and manage relationships.
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => router.push('/parties')}
                >
                  View Customers
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%', 
              borderRadius: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[6],
              },
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Sales Analytics
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Track user engagement, sales performance, and other key metrics to optimize your business.
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => router.push('/analytics')}
                >
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%', 
              borderRadius: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[6],
              },
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Invoice Management
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Create, manage, and track invoices. Monitor payment status and send reminders.
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => router.push('/invoices')}
                >
                  Manage Invoices
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

// Main Dashboard Page Component
export default function Dashboard() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}