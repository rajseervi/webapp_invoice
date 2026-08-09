"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Stack,
  Grid,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  alpha,
  Skeleton,
  Tabs,
  Tab,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  DateRange as DateRangeIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ShowChart as ShowChartIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

interface AnalyticsData {
  revenue: {
    current: number;
    previous: number;
    growth: number;
    trend: 'up' | 'down' | 'stable';
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    churnRate: number;
  };
  products: {
    topSelling: Array<{
      id: string;
      name: string;
      sales: number;
      revenue: number;
    }>;
    lowStock: number;
    outOfStock: number;
  };
  geography: Array<{
    region: string;
    sales: number;
    customers: number;
  }>;
  timeAnalysis: {
    peakHours: string[];
    peakDays: string[];
    seasonality: Array<{
      month: string;
      performance: number;
    }>;
  };
}

interface AdvancedAnalyticsWidgetProps {
  showHeader?: boolean;
  height?: number;
}

export default function AdvancedAnalyticsWidget({
  showHeader = true,
  height = 500
}: AdvancedAnalyticsWidgetProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [timeRange, setTimeRange] = useState('30d');

  const fetchAnalyticsData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Simulate API call with mock data
      const mockData: AnalyticsData = {
        revenue: {
          current: 2450000,
          previous: 2180000,
          growth: 12.4,
          trend: 'up'
        },
        customers: {
          total: 1248,
          new: 156,
          returning: 1092,
          churnRate: 3.2
        },
        products: {
          topSelling: [
            { id: '1', name: 'Premium Widget', sales: 245, revenue: 122500 },
            { id: '2', name: 'Standard Kit', sales: 189, revenue: 94500 },
            { id: '3', name: 'Deluxe Package', sales: 156, revenue: 156000 },
            { id: '4', name: 'Basic Tool', sales: 134, revenue: 26800 },
            { id: '5', name: 'Pro Series', sales: 98, revenue: 98000 }
          ],
          lowStock: 12,
          outOfStock: 3
        },
        geography: [
          { region: 'North', sales: 450000, customers: 312 },
          { region: 'South', sales: 680000, customers: 445 },
          { region: 'East', sales: 520000, customers: 298 },
          { region: 'West', sales: 800000, customers: 193 }
        ],
        timeAnalysis: {
          peakHours: ['10:00-12:00', '14:00-16:00', '19:00-21:00'],
          peakDays: ['Tuesday', 'Wednesday', 'Thursday'],
          seasonality: [
            { month: 'Jan', performance: 85 },
            { month: 'Feb', performance: 92 },
            { month: 'Mar', performance: 108 },
            { month: 'Apr', performance: 115 },
            { month: 'May', performance: 122 },
            { month: 'Jun', performance: 118 }
          ]
        }
      };

      await new Promise(resolve => setTimeout(resolve, 800));
      setData(mockData);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Revenue Analysis</Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">Current Period</Typography>
                <Typography variant="h4" color="primary.main" fontWeight={700}>
                  {formatCurrency(data?.revenue.current || 0)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Previous Period</Typography>
                <Typography variant="h6">
                  {formatCurrency(data?.revenue.previous || 0)}
                </Typography>
              </Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                {data?.revenue.trend === 'up' ? (
                  <TrendingUpIcon color="success" />
                ) : (
                  <TrendingDownIcon color="error" />
                )}
                <Chip
                  label={formatPercentage(data?.revenue.growth || 0)}
                  color={data?.revenue.trend === 'up' ? 'success' : 'error'}
                  size="small"
                />
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Customer Insights</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary.main" fontWeight={700}>
                    {data?.customers.total.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Total Customers</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main" fontWeight={700}>
                    {data?.customers.new}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">New This Month</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h5" fontWeight={600}>
                    {data?.customers.returning}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Returning</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h5" color="warning.main" fontWeight={600}>
                    {data?.customers.churnRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Churn Rate</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderProductsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader title="Top Selling Products" />
          <CardContent>
            <Stack spacing={2}>
              {data?.products.topSelling.map((product, index) => (
                <Box key={product.id}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}
                      >
                        #{index + 1}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight={600}>
                          {product.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product.sales} units sold
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography variant="h6" color="success.main" fontWeight={600}>
                      {formatCurrency(product.revenue)}
                    </Typography>
                  </Stack>
                  {index < data.products.topSelling.length - 1 && (
                    <Divider sx={{ mt: 2 }} />
                  )}
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%' }}>
          <CardHeader title="Inventory Status" />
          <CardContent>
            <Stack spacing={3}>
              <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2">Low Stock Items</Typography>
                  <Typography variant="h6" color="warning.main">
                    {data?.products.lowStock}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={75}
                  color="warning"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2">Out of Stock</Typography>
                  <Typography variant="h6" color="error.main">
                    {data?.products.outOfStock}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={15}
                  color="error"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderGeographyTab = () => (
    <Grid container spacing={3}>
      {data?.geography.map((region) => (
        <Grid item xs={12} sm={6} md={3} key={region.region}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>{region.region}</Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Sales</Typography>
                  <Typography variant="h5" color="primary.main" fontWeight={700}>
                    {formatCurrency(region.sales)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Customers</Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {region.customers.toLocaleString()}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderTimeAnalysisTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title="Peak Hours" />
          <CardContent>
            <Stack spacing={1}>
              {data?.timeAnalysis.peakHours.map((hour) => (
                <Chip key={hour} label={hour} variant="outlined" />
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title="Peak Days" />
          <CardContent>
            <Stack spacing={1}>
              {data?.timeAnalysis.peakDays.map((day) => (
                <Chip key={day} label={day} color="primary" variant="outlined" />
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title="Seasonal Performance" />
          <CardContent>
            <Stack spacing={2}>
              {data?.timeAnalysis.seasonality.map((season) => (
                <Box key={season.month}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="body2">{season.month}</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {season.performance}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={season.performance}
                    color={season.performance > 100 ? 'success' : 'primary'}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  if (loading && !data) {
    return (
      <Card sx={{ height }}>
        {showHeader && (
          <CardHeader
            title={<Skeleton width={200} />}
            action={<Skeleton variant="circular" width={40} height={40} />}
          />
        )}
        <CardContent>
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={40} />
            <Grid container spacing={2}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Skeleton variant="rectangular" height={120} />
                </Grid>
              ))}
            </Grid>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height }}>
      {showHeader && (
        <CardHeader
          avatar={
            <Avatar
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}
            >
              <AnalyticsIcon />
            </Avatar>
          }
          title={
            <Typography variant="h6" fontWeight={600}>
              Advanced Analytics
            </Typography>
          }
          action={
            <Stack direction="row" spacing={1}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  label="Time Range"
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <MenuItem value="7d">Last 7 days</MenuItem>
                  <MenuItem value="30d">Last 30 days</MenuItem>
                  <MenuItem value="90d">Last 90 days</MenuItem>
                  <MenuItem value="1y">Last year</MenuItem>
                </Select>
              </FormControl>
              <Tooltip title="Refresh">
                <IconButton
                  onClick={() => fetchAnalyticsData(true)}
                  disabled={refreshing}
                  size="small"
                >
                  <RefreshIcon
                    sx={{
                      animation: refreshing ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      }
                    }}
                  />
                </IconButton>
              </Tooltip>
            </Stack>
          }
        />
      )}

      <CardContent sx={{ pt: showHeader ? 0 : 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Overview" icon={<AssessmentIcon />} iconPosition="start" />
            <Tab label="Products" icon={<PieChartIcon />} iconPosition="start" />
            <Tab label="Geography" icon={<BarChartIcon />} iconPosition="start" />
            <Tab label="Time Analysis" icon={<ShowChartIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        <Box sx={{ height: height - 200, overflow: 'auto' }}>
          {selectedTab === 0 && renderOverviewTab()}
          {selectedTab === 1 && renderProductsTab()}
          {selectedTab === 2 && renderGeographyTab()}
          {selectedTab === 3 && renderTimeAnalysisTab()}
        </Box>
      </CardContent>
    </Card>
  );
}