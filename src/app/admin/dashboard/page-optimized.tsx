"use client";
import React, { useEffect, useState, useMemo, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Stack,
  LinearProgress,
  Card,
  CardContent,
  useTheme,
  alpha,
  Container,
  Fade,
  Skeleton
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';

// Lazy load heavy components for better performance
const RecentActivitiesWidget = lazy(() => import('../components/RecentActivitiesWidget'));
const PerformanceMetricsWidget = lazy(() => import('../components/PerformanceMetricsWidget'));
const QuickStatsWidget = lazy(() => import('../components/QuickStatsWidget'));

// Lazy load chart components
const LazyChart = lazy(() => import('../components/LazyChart'));

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

export default function OptimizedAdminDashboardPage() {
  const router = useRouter();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueLast12, setRevenueLast12] = useState<number[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Memoized month labels for better performance
  const monthLabels = useMemo(() => {
    const now = new Date();
    const labels: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleString('default', { month: 'short' }));
    }
    return labels;
  }, []);

  // Optimized data fetching with caching
  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Check if we have cached data that's less than 5 minutes old
      const cacheKey = 'dashboard-data';
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTimestamp = localStorage.getItem(`${cacheKey}-timestamp`);
      
      if (!isRefresh && cachedData && cacheTimestamp) {
        const cacheAge = Date.now() - parseInt(cacheTimestamp);
        if (cacheAge < 5 * 60 * 1000) { // 5 minutes
          const parsed = JSON.parse(cachedData);
          setStats(parsed.stats);
          setRevenueLast12(parsed.revenueLast12);
          setLoading(false);
          return;
        }
      }

      // Fetch fresh data
      const [metricsResponse] = await Promise.all([
        fetch('/api/admin/dashboard?period=12months&section=overview').catch(() => null)
      ]);

      let dashboardStats: DashboardStats;
      let revenueData: number[];

      if (metricsResponse?.ok) {
        const json = await metricsResponse.json();
        const overview = json?.data?.overview || {};
        const metrics = overview?.metrics || {};
        const charts = overview?.charts || {};

        dashboardStats = {
          totalSales: Number(metrics?.revenue?.total) || 0,
          totalInvoices: Number(metrics?.invoices?.total) || 0,
          pendingPayments: Number(metrics?.invoices?.pending) || 0,
          totalParties: Number(metrics?.customers?.total) || 0,
          totalProducts: Number(metrics?.products?.total) || 0,
          totalOrders: Number(metrics?.invoices?.total) || 0,
          monthlyGrowth: Number(metrics?.revenue?.growth) || 0,
          conversionRate: Number(metrics?.performance?.conversionRate) || 0
        };

        const salesTrend = charts?.salesTrend || charts?.revenueTrend || [];
        revenueData = salesTrend.slice(-12).map((d: any) => Math.round(d.value || d.amount || 0));
      } else {
        // Fallback demo data
        dashboardStats = {
          totalSales: 2450000,
          totalInvoices: 324,
          pendingPayments: 450000,
          totalParties: 118,
          totalProducts: 245,
          totalOrders: 324,
          monthlyGrowth: 12.5,
          conversionRate: 3.2
        };
        revenueData = Array.from({ length: 12 }, (_, i) => 120000 + (i % 3) * 15000);
      }

      // Cache the data
      const dataToCache = {
        stats: dashboardStats,
        revenueLast12: revenueData
      };
      localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
      localStorage.setItem(`${cacheKey}-timestamp`, Date.now().toString());

      setStats(dashboardStats);
      setRevenueLast12(revenueData);
      setLastRefresh(new Date());

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Use fallback data on error
      setStats({
        totalSales: 2450000,
        totalInvoices: 324,
        pendingPayments: 450000,
        totalParties: 118,
        totalProducts: 245,
        totalOrders: 324,
        monthlyGrowth: 12.5,
        conversionRate: 3.2
      });
      setRevenueLast12(Array.from({ length: 12 }, (_, i) => 120000 + (i % 3) * 15000));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Memoized chart data for performance
  const revenueChartData = useMemo(() => ({
    labels: monthLabels,
    datasets: [
      {
        label: 'Revenue',
        data: revenueLast12,
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
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
  }), [monthLabels, revenueLast12, theme.palette.primary.main]);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  return (
    <VisuallyEnhancedDashboardLayout 
      title="Admin Dashboard" 
      pageType="dashboard"
      enableVisualEffects={true}
      enableParticles={false} // Disable particles for better performance
    >
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header Section */}
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
                  Admin Dashboard 🚀
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Optimized overview with real-time analytics and performance monitoring
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, display: 'block' }}>
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </Typography>
              </Box>
              <Stack direction="row" spacing={2}>
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
                  {refreshing ? 'Refreshing…' : 'Refresh'}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Fade>

        {/* Loading Progress */}
        {loading && <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />}

        {/* Quick Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
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

        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Revenue Chart */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ height: 400 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="between" sx={{ mb: 3 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Revenue Trend
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Monthly revenue for the last 12 months
                    </Typography>
                  </Box>
                </Stack>
                <Box sx={{ height: 300 }}>
                  <Suspense fallback={<Skeleton variant="rectangular" height={300} />}>
                    <LazyChart 
                      type="line" 
                      data={revenueChartData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            grid: {
                              color: alpha(theme.palette.divider, 0.1),
                            },
                            ticks: {
                              callback: function(value: any) {
                                return '₹' + (value / 1000).toFixed(0) + 'K';
                              }
                            }
                          },
                          x: {
                            grid: {
                              display: false,
                            },
                          },
                        },
                        elements: {
                          point: {
                            hoverRadius: 8,
                          },
                        },
                      }}
                    />
                  </Suspense>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activities */}
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
          <Grid item xs={12} lg={8}>
            <Suspense fallback={<WidgetSkeleton height={350} />}>
              <PerformanceMetricsWidget 
                compact={true}
                refreshInterval={15000}
              />
            </Suspense>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: 350 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Quick Actions
                </Typography>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<DashboardIcon />}
                    onClick={() => router.push('/invoices/new')}
                    sx={{ justifyContent: 'flex-start', py: 1.5 }}
                  >
                    Create New Invoice
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<SpeedIcon />}
                    onClick={() => router.push('/products')}
                    sx={{ justifyContent: 'flex-start', py: 1.5 }}
                  >
                    Manage Products
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<TimelineIcon />}
                    onClick={() => router.push('/parties')}
                    sx={{ justifyContent: 'flex-start', py: 1.5 }}
                  >
                    Manage Parties
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<TimelineIcon />}
                    onClick={() => router.push('/reports')}
                    sx={{ justifyContent: 'flex-start', py: 1.5 }}
                  >
                    View Reports
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </VisuallyEnhancedDashboardLayout>
  );
}