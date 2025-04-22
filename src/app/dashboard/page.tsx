"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Grid, 
  Paper,
  Typography,
  Button,
  useTheme,
  Container,
  Alert,
  alpha
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

// Import custom hook for data fetching and layout component
import { useDashboardData } from './hooks/useDashboardData'; 
// import SimpleDashboardLayout from './components/DashboardLayout';


import DashboardLayout from '@/components/DashboardLayout/DashboardLayout'; 
// Import the quick actions component
import QuickActions from '@/components/Common/QuickActions';
// Import the dashboard skeleton for loading state
import DashboardSkeleton from '@/components/Dashboard/DashboardSkeleton';
// Import utility functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const getStatusColor = (status) => {
  switch (status) {
    case 'paid':
      return 'success';
    case 'pending':
      return 'warning';
    case 'overdue':
      return 'error';
    default:
      return 'default';
  }
};

const getCustomerInitial = (name) => {
  return name.charAt(0).toUpperCase();
};

const getCustomerAvatarColor = (id) => {
  const colors = [
    '#1976d2', '#388e3c', '#d32f2f', '#f57c00', '#7b1fa2',
    '#0288d1', '#689f38', '#e64a19', '#fbc02d', '#512da8'
  ];
  const index = id.charCodeAt(0) % colors.length;
  return colors[index];
};

// Define color constants
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Dashboard() {
  const theme = useTheme();
  const router = useRouter();
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  
  // Use custom hook to fetch dashboard data
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

  // Add icons to stats
  const statsWithIcons = stats.map((stat, index) => {
    let icon;
    switch (index) {
      case 0:
        icon = <TrendingUpIcon />;
        break;
      case 1:
        icon = <InventoryIcon />;
        break;
      case 2:
        icon = <ReceiptIcon />;
        break;
      case 3:
        icon = <PeopleIcon />;
        break;
      default:
        icon = <TrendingUpIcon />;
    }
    return { ...stat, icon };
  });

  // Filter customers based on search query
  useEffect(() => {
    if (customerSearchQuery.trim() === '') {
      setFilteredCustomers(topCustomers);
    } else {
      const filtered = topCustomers.filter(customer => 
        customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  }, [customerSearchQuery, topCustomers]);

  return (
    <DashboardLayout>
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
      
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Welcome Section with Gradient Background */}
          <Paper
            elevation={0}
            sx={{
              mb: 4,
              p: { xs: 3, md: 4 },
              borderRadius: 3,
              background: theme => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
              border: theme => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative Elements */}
            <Box
              sx={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: theme => `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 70%, transparent 100%)`,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -30,
                left: -30,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: theme => `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 70%, transparent 100%)`,
              }}
            />
            
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={7}>
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Typography 
                    variant="h3" 
                    component="h1" 
                    gutterBottom 
                    fontWeight={800}
                    sx={{ 
                      fontSize: { xs: '2rem', md: '2.5rem' },
                      background: theme => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1
                    }}
                  >
                    Welcome to your Dashboard
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 2, fontWeight: 400 }}>
                    Get a quick overview of your business performance and access key features.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      size="large"
                      onClick={() => router.push('/analytics')}
                      sx={{ 
                        borderRadius: 2,
                        px: 3,
                        boxShadow: theme => `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`
                      }}
                    >
                      View Analytics
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="primary"
                      size="large"
                      onClick={() => router.push('/invoices')}
                      sx={{ borderRadius: 2, px: 3 }}
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
          
          <Container 
            maxWidth="xl" 
            disableGutters 
            sx={{ 
              px: { xs: 0, sm: 2 }
            }}
          >
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Quick Actions Section */}
              <Grid item xs={12} md={6} lg={4}>
                <QuickActions variant="grid" showLabels={true} />
              </Grid>
              
              {/* Analytics Preview */}
              <Grid item xs={12} md={6} lg={8}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 0,
                    borderRadius: 3,
                    bgcolor: theme.palette.background.paper,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    border: theme => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      boxShadow: theme => `0 8px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      background: theme => `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.9)} 0%, ${alpha(theme.palette.primary.main, 0.85)} 100%)`,
                      p: 3,
                      position: 'relative',
                      overflow: 'hidden',
                      color: 'white'
                    }}
                  >
                    {/* Decorative circles */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -30,
                        right: -30,
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.1)',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: -20,
                        left: 30,
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.1)',
                      }}
                    />
                    
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AnalyticsIcon sx={{ fontSize: 24, mr: 1 }} />
                          <Typography variant="h6" fontWeight={600}>
                            Analytics Overview
                          </Typography>
                        </Box>
                        <Button 
                          size="small" 
                          endIcon={<ArrowForwardIcon />}
                          onClick={() => router.push('/analytics')}
                          sx={{ 
                            color: 'white', 
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            '&:hover': {
                              bgcolor: 'rgba(255, 255, 255, 0.2)',
                            }
                          }}
                        >
                          View Details
                        </Button>
                      </Box>
                      
                      <Typography variant="body2" sx={{ mb: 2, opacity: 0.9, maxWidth: '80%' }}>
                        Track your business performance with real-time analytics and actionable insights.
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Grid container spacing={2}>
                      {/* Mini Stats */}
                      {[
                        { label: 'Active Users', value: '2,845', change: '+12%', icon: <PeopleIcon />, color: theme.palette.primary.main },
                        { label: 'Page Views', value: '18.5K', change: '+8%', icon: <TrendingUpIcon />, color: theme.palette.success.main },
                        { label: 'Conversion', value: '3.2%', change: '+0.6%', icon: <ReceiptIcon />, color: theme.palette.info.main }
                      ].map((stat, index) => (
                        <Grid item xs={12} md={4} key={index}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: alpha(stat.color, 0.1),
                                color: stat.color,
                                mr: 2
                              }}
                            >
                              {stat.icon}
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {stat.label}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="h6" sx={{ mr: 1, fontWeight: 600 }}>
                                  {stat.value}
                                </Typography>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: stat.change.startsWith('+') ? 'success.main' : 'error.main',
                                    fontWeight: 500
                                  }}
                                >
                                  {stat.change}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                    
                    <Box sx={{ flex: 1, mt: 3, minHeight: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={dailySalesData}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                              <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                            axisLine={{ stroke: theme.palette.divider }}
                            tickLine={{ stroke: theme.palette.divider }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                            axisLine={{ stroke: theme.palette.divider }}
                            tickLine={{ stroke: theme.palette.divider }}
                          />
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(theme.palette.divider, 0.5)} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: theme.palette.background.paper,
                              borderColor: theme.palette.divider,
                              borderRadius: 8,
                              boxShadow: theme.shadows[3]
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="amount" 
                            stroke={theme.palette.primary.main} 
                            fillOpacity={1} 
                            fill="url(#colorUv)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
            
            {/* Floating Quick Action Button */}
            <Box sx={{ position: 'relative', height: 0 }}>
              <QuickActions variant="fab" position="bottom-right" showLabels={true} />
            </Box>
          </Container>
        </>
      )}
    </DashboardLayout>
  );
}