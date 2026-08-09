"use client";
import React, { useState, useEffect, Suspense, lazy } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Stack,
  Container,
  Fade,
  Card,
  CardContent,
  Skeleton,
  useTheme,
  alpha,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Receipt as ReceiptIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';

// Lazy load components for better performance
const QuickStatsWidget = lazy(() => import('./QuickStatsWidget'));
const RecentActivitiesWidget = lazy(() => import('./RecentActivitiesWidget'));
const PerformanceMetricsWidget = lazy(() => import('./PerformanceMetricsWidget'));
const AdvancedAnalyticsWidget = lazy(() => import('./AdvancedAnalyticsWidget'));
const RecentInvoicesWidget = lazy(() => import('./RecentInvoicesWidget'));
const LazyChart = lazy(() => import('./LazyChart'));

interface DashboardStats {
  totalSales: number;
  totalInvoices: number;
  pendingPayments: number;
  totalParties: number;
  totalProducts: number;
  totalOrders: number;
  monthlyGrowth: number;
  conversionRate: number;
}

interface ComprehensiveDashboardProps {
  initialTab?: number;
}

// Loading skeleton for widgets
const WidgetSkeleton = ({ height = 400 }: { height?: number }) => (
  <Card sx={{ height }}>
    <CardContent>
      <Stack spacing={2}>
        <Skeleton variant="rectangular" height={40} />
        <Skeleton variant="rectangular" height={height - 120} />
        <Skeleton variant="rectangular" height={30} />
      </Stack>
    </CardContent>
  </Card>
);

export default function ComprehensiveDashboard({ initialTab = 0 }: ComprehensiveDashboardProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Chart data
  const [revenueData, setRevenueData] = useState<number[]>([]);
  const [monthLabels, setMonthLabels] = useState<string[]>([]);

  useEffect(() => {
    // Generate month labels
    const now = new Date();
    const labels: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleString('default', { month: 'short' }));
    }
    setMonthLabels(labels);

    // Fetch initial data
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchDashboardData(true);
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockStats: DashboardStats = {
        totalSales: 2450000,
        totalInvoices: 324,
        pendingPayments: 450000,
        totalParties: 118,
        totalProducts: 245,
        totalOrders: 324,
        monthlyGrowth: 12.5,
        conversionRate: 3.2
      };

      const mockRevenueData = Array.from({ length: 12 }, (_, i) => 
        120000 + (i % 3) * 15000 + Math.random() * 10000
      );

      setStats(mockStats);
      setRevenueData(mockRevenueData);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const revenueChartData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Revenue',
        data: revenueData,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        borderColor: theme.palette.primary.main,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: theme.palette.primary.main,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      {/* Quick Stats */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Key Performance Indicators</Typography>
          <Grid container spacing={2}>
            <Suspense fallback={
              <>
                {Array.from({ length: 6 }).map((_, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
                    <WidgetSkeleton height={160} />
                  </Grid>
                ))}
              </>
            }>
              <QuickStatsWidget stats={stats} loading={loading} />
            </Suspense>
          </Grid>
        </Paper>
      </Grid>

      {/* Revenue Chart and Recent Activities */}
      <Grid item xs={12} lg={8}>
        <Card sx={{ height: 400 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Revenue Trend (Last 12 Months)
            </Typography>
            <Box sx={{ height: 320 }}>
              <Suspense fallback={<Skeleton variant="rectangular" height={320} />}>
                <LazyChart 
                  type="line" 
                  data={revenueChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value: any) {
                            return '₹' + (value / 1000).toFixed(0) + 'K';
                          }
                        }
                      },
                    },
                  }}
                />
              </Suspense>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} lg={4}>
        <Suspense fallback={<WidgetSkeleton height={400} />}>
          <RecentActivitiesWidget 
            limit={8} 
            compact={true}
            refreshInterval={30000}
          />
        </Suspense>
      </Grid>

      {/* Performance Metrics */}
      <Grid item xs={12}>
        <Suspense fallback={<WidgetSkeleton height={350} />}>
          <PerformanceMetricsWidget 
            compact={true}
            refreshInterval={15000}
          />
        </Suspense>
      </Grid>
    </Grid>
  );

  const renderAnalyticsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Suspense fallback={<WidgetSkeleton height={600} />}>
          <AdvancedAnalyticsWidget height={600} />
        </Suspense>
      </Grid>
    </Grid>
  );

  const renderInvoicesTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Suspense fallback={<WidgetSkeleton height={500} />}>
          <RecentInvoicesWidget 
            limit={10}
            fullWidth={true}
            showPagination={true}
            showSearch={true}
            refreshInterval={60000}
          />
        </Suspense>
      </Grid>
    </Grid>
  );

  const renderPerformanceTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} lg={8}>
        <Suspense fallback={<WidgetSkeleton height={500} />}>
          <PerformanceMetricsWidget 
            compact={false}
            refreshInterval={10000}
          />
        </Suspense>
      </Grid>
      <Grid item xs={12} lg={4}>
        <Suspense fallback={<WidgetSkeleton height={500} />}>
          <RecentActivitiesWidget 
            limit={12} 
            compact={false}
            refreshInterval={20000}
          />
        </Suspense>
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Fade in timeout={300}>
        <Paper 
          sx={{ 
            p: 3, 
            mb: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                Comprehensive Dashboard 🚀
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Advanced analytics, real-time monitoring, and comprehensive business insights
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, display: 'block' }}>
                Last updated: {lastRefresh.toLocaleTimeString()}
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    color="default"
                  />
                }
                label="Auto Refresh"
                sx={{ color: 'white', '& .MuiSwitch-track': { backgroundColor: 'rgba(255,255,255,0.3)' } }}
              />
              <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }}>
                  {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </Tooltip>
              <Button 
                onClick={handleRefresh} 
                startIcon={<RefreshIcon />} 
                variant="contained"
                disabled={refreshing}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  },
                }}
              >
                {refreshing ? 'Refreshing…' : 'Refresh All'}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Fade>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2 }}
        >
          <Tab 
            label="Overview" 
            icon={<DashboardIcon />} 
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab 
            label="Analytics" 
            icon={<AnalyticsIcon />} 
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab 
            label="Recent Invoices" 
            icon={<ReceiptIcon />} 
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab 
            label="Performance" 
            icon={<SpeedIcon />} 
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ mt: 3 }}>
        {activeTab === 0 && renderOverviewTab()}
        {activeTab === 1 && renderAnalyticsTab()}
        {activeTab === 2 && renderInvoicesTab()}
        {activeTab === 3 && renderPerformanceTab()}
      </Box>
    </Container>
  );
}