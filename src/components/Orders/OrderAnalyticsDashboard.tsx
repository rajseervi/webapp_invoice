"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Divider,
  alpha,
  useTheme
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as AttachMoneyIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  LocalShipping as LocalShippingIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { Order, OrderStatus, PaymentStatus } from '@/types/order';
import { formatCurrency } from '@/utils/numberUtils';
import { formatDate } from '@/utils/dateUtils';

interface OrderAnalyticsDashboardProps {
  orders: Order[];
  loading?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
}

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  revenueGrowth: number;
  orderGrowth: number;
  topCustomers: Array<{
    name: string;
    orders: number;
    revenue: number;
  }>;
  statusDistribution: Array<{
    status: OrderStatus;
    count: number;
    percentage: number;
  }>;
  recentOrders: Order[];
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
}

export default function OrderAnalyticsDashboard({ 
  orders, 
  loading = false, 
  onRefresh, 
  onExport 
}: OrderAnalyticsDashboardProps) {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('30'); // days
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (orders.length > 0) {
      calculateAnalytics();
    }
  }, [orders, timeRange]);

  const calculateAnalytics = () => {
    const now = new Date();
    const daysAgo = new Date(now.getTime() - parseInt(timeRange) * 24 * 60 * 60 * 1000);
    
    // Filter orders by time range
    const filteredOrders = orders.filter(order => 
      new Date(order.createdAt) >= daysAgo
    );

    // Previous period for comparison
    const previousPeriodStart = new Date(daysAgo.getTime() - parseInt(timeRange) * 24 * 60 * 60 * 1000);
    const previousOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= previousPeriodStart && orderDate < daysAgo;
    });

    // Basic metrics
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const pendingOrders = filteredOrders.filter(order => 
      [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.CONFIRMED].includes(order.status)
    ).length;
    
    const completedOrders = filteredOrders.filter(order => 
      order.status === OrderStatus.COMPLETED
    ).length;
    
    const cancelledOrders = filteredOrders.filter(order => 
      order.status === OrderStatus.CANCELLED
    ).length;

    // Growth calculations
    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total, 0);
    const revenueGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;
    
    const orderGrowth = previousOrders.length > 0 
      ? ((totalOrders - previousOrders.length) / previousOrders.length) * 100 
      : 0;

    // Top customers
    const customerMap = new Map();
    filteredOrders.forEach(order => {
      const existing = customerMap.get(order.partyId) || { 
        name: order.partyName, 
        orders: 0, 
        revenue: 0 
      };
      existing.orders += 1;
      existing.revenue += order.total;
      customerMap.set(order.partyId, existing);
    });
    
    const topCustomers = Array.from(customerMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Status distribution
    const statusMap = new Map();
    filteredOrders.forEach(order => {
      statusMap.set(order.status, (statusMap.get(order.status) || 0) + 1);
    });
    
    const statusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({
      status: status as OrderStatus,
      count,
      percentage: (count / totalOrders) * 100
    }));

    // Recent orders
    const recentOrders = filteredOrders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    // Monthly revenue (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= monthStart && orderDate <= monthEnd;
      });
      
      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthOrders.reduce((sum, order) => sum + order.total, 0),
        orders: monthOrders.length
      });
    }

    setAnalytics({
      totalOrders,
      totalRevenue,
      averageOrderValue,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      revenueGrowth,
      orderGrowth,
      topCustomers,
      statusDistribution,
      recentOrders,
      monthlyRevenue
    });
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return 'success';
      case OrderStatus.PENDING:
      case OrderStatus.PROCESSING:
        return 'warning';
      case OrderStatus.CANCELLED:
        return 'error';
      case OrderStatus.SHIPPED:
        return 'info';
      default:
        return 'default';
    }
  };

  const MetricCard = ({ 
    title, 
    value, 
    icon, 
    growth, 
    color = 'primary',
    format = 'number' 
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    growth?: number;
    color?: string;
    format?: 'number' | 'currency' | 'percentage';
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'currency':
          return formatCurrency(val);
        case 'percentage':
          return `${val.toFixed(1)}%`;
        default:
          return val.toLocaleString();
      }
    };

    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {title}
              </Typography>
              <Typography variant="h4" fontWeight="bold" color={`${color}.main`}>
                {formatValue(value)}
              </Typography>
              {growth !== undefined && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {growth >= 0 ? (
                    <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                  ) : (
                    <TrendingDownIcon sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
                  )}
                  <Typography 
                    variant="caption" 
                    color={growth >= 0 ? 'success.main' : 'error.main'}
                    fontWeight="medium"
                  >
                    {Math.abs(growth).toFixed(1)}% vs last period
                  </Typography>
                </Box>
              )}
            </Box>
            <Avatar 
              sx={{ 
                bgcolor: alpha(theme.palette[color as keyof typeof theme.palette].main, 0.1),
                color: `${color}.main`,
                width: 56,
                height: 56
              }}
            >
              {icon}
            </Avatar>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (!analytics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Order Analytics Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="7">Last 7 days</MenuItem>
              <MenuItem value="30">Last 30 days</MenuItem>
              <MenuItem value="90">Last 90 days</MenuItem>
              <MenuItem value="365">Last year</MenuItem>
            </Select>
          </FormControl>
          {onRefresh && (
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
          )}
          {onExport && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={onExport}
            >
              Export
            </Button>
          )}
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Orders"
            value={analytics.totalOrders}
            icon={<ShoppingCartIcon />}
            growth={analytics.orderGrowth}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Revenue"
            value={analytics.totalRevenue}
            icon={<AttachMoneyIcon />}
            growth={analytics.revenueGrowth}
            color="success"
            format="currency"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Average Order Value"
            value={analytics.averageOrderValue}
            icon={<TrendingUpIcon />}
            color="info"
            format="currency"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Pending Orders"
            value={analytics.pendingOrders}
            icon={<ScheduleIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Order Status Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Order Status Distribution
            </Typography>
            <Box sx={{ mt: 2 }}>
              {analytics.statusDistribution.map((item) => (
                <Box key={item.status} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      {item.status.replace('_', ' ').toUpperCase()}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {item.count} ({item.percentage.toFixed(1)}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={item.percentage}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.grey[300], 0.3)
                    }}
                    color={getStatusColor(item.status) as any}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Top Customers */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Top Customers
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Orders</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.topCustomers.map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                            {customer.name.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" fontWeight="medium">
                            {customer.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={customer.orders} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(customer.revenue)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Recent Orders
              </Typography>
              <Button size="small" endIcon={<MoreVertIcon />}>
                View All
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Payment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.recentOrders.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {order.orderNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                            {order.partyName.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">
                            {order.partyName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(order.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(order.total)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.status.replace('_', ' ').toUpperCase()}
                          size="small"
                          color={getStatusColor(order.status) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.paymentStatus.toUpperCase()}
                          size="small"
                          variant="outlined"
                          color={order.paymentStatus === PaymentStatus.PAID ? 'success' : 'warning'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Monthly Revenue Trend */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Monthly Revenue Trend
            </Typography>
            <Box sx={{ mt: 2 }}>
              {analytics.monthlyRevenue.map((month, index) => {
                const maxRevenue = Math.max(...analytics.monthlyRevenue.map(m => m.revenue));
                const percentage = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
                
                return (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        {month.month}
                      </Typography>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(month.revenue)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {month.orders} orders
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.primary.main, 0.1)
                      }}
                      color="primary"
                    />
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Divider,
  alpha,
  useTheme
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as AttachMoneyIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  LocalShipping as LocalShippingIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { Order, OrderStatus, PaymentStatus } from '@/types/order';
import { formatCurrency } from '@/utils/numberUtils';
import { formatDate } from '@/utils/dateUtils';

interface OrderAnalyticsDashboardProps {
  orders: Order[];
  loading?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
}

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  revenueGrowth: number;
  orderGrowth: number;
  topCustomers: Array<{
    name: string;
    orders: number;
    revenue: number;
  }>;
  statusDistribution: Array<{
    status: OrderStatus;
    count: number;
    percentage: number;
  }>;
  recentOrders: Order[];
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
}

export default function OrderAnalyticsDashboard({ 
  orders, 
  loading = false, 
  onRefresh, 
  onExport 
}: OrderAnalyticsDashboardProps) {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('30'); // days
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (orders.length > 0) {
      calculateAnalytics();
    }
  }, [orders, timeRange]);

  const calculateAnalytics = () => {
    const now = new Date();
    const daysAgo = new Date(now.getTime() - parseInt(timeRange) * 24 * 60 * 60 * 1000);
    
    // Filter orders by time range
    const filteredOrders = orders.filter(order => 
      new Date(order.createdAt) >= daysAgo
    );

    // Previous period for comparison
    const previousPeriodStart = new Date(daysAgo.getTime() - parseInt(timeRange) * 24 * 60 * 60 * 1000);
    const previousOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= previousPeriodStart && orderDate < daysAgo;
    });

    // Basic metrics
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const pendingOrders = filteredOrders.filter(order => 
      [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.CONFIRMED].includes(order.status)
    ).length;
    
    const completedOrders = filteredOrders.filter(order => 
      order.status === OrderStatus.COMPLETED
    ).length;
    
    const cancelledOrders = filteredOrders.filter(order => 
      order.status === OrderStatus.CANCELLED
    ).length;

    // Growth calculations
    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total, 0);
    const revenueGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;
    
    const orderGrowth = previousOrders.length > 0 
      ? ((totalOrders - previousOrders.length) / previousOrders.length) * 100 
      : 0;

    // Top customers
    const customerMap = new Map();
    filteredOrders.forEach(order => {
      const existing = customerMap.get(order.partyId) || { 
        name: order.partyName, 
        orders: 0, 
        revenue: 0 
      };
      existing.orders += 1;
      existing.revenue += order.total;
      customerMap.set(order.partyId, existing);
    });
    
    const topCustomers = Array.from(customerMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Status distribution
    const statusMap = new Map();
    filteredOrders.forEach(order => {
      statusMap.set(order.status, (statusMap.get(order.status) || 0) + 1);
    });
    
    const statusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({
      status: status as OrderStatus,
      count,
      percentage: (count / totalOrders) * 100
    }));

    // Recent orders
    const recentOrders = filteredOrders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    // Monthly revenue (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= monthStart && orderDate <= monthEnd;
      });
      
      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthOrders.reduce((sum, order) => sum + order.total, 0),
        orders: monthOrders.length
      });
    }

    setAnalytics({
      totalOrders,
      totalRevenue,
      averageOrderValue,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      revenueGrowth,
      orderGrowth,
      topCustomers,
      statusDistribution,
      recentOrders,
      monthlyRevenue
    });
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return 'success';
      case OrderStatus.PENDING:
      case OrderStatus.PROCESSING:
        return 'warning';
      case OrderStatus.CANCELLED:
        return 'error';
      case OrderStatus.SHIPPED:
        return 'info';
      default:
        return 'default';
    }
  };

  const MetricCard = ({ 
    title, 
    value, 
    icon, 
    growth, 
    color = 'primary',
    format = 'number' 
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    growth?: number;
    color?: string;
    format?: 'number' | 'currency' | 'percentage';
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'currency':
          return formatCurrency(val);
        case 'percentage':
          return `${val.toFixed(1)}%`;
        default:
          return val.toLocaleString();
      }
    };

    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {title}
              </Typography>
              <Typography variant="h4" fontWeight="bold" color={`${color}.main`}>
                {formatValue(value)}
              </Typography>
              {growth !== undefined && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {growth >= 0 ? (
                    <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                  ) : (
                    <TrendingDownIcon sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
                  )}
                  <Typography 
                    variant="caption" 
                    color={growth >= 0 ? 'success.main' : 'error.main'}
                    fontWeight="medium"
                  >
                    {Math.abs(growth).toFixed(1)}% vs last period
                  </Typography>
                </Box>
              )}
            </Box>
            <Avatar 
              sx={{ 
                bgcolor: alpha(theme.palette[color as keyof typeof theme.palette].main, 0.1),
                color: `${color}.main`,
                width: 56,
                height: 56
              }}
            >
              {icon}
            </Avatar>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (!analytics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Order Analytics Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="7">Last 7 days</MenuItem>
              <MenuItem value="30">Last 30 days</MenuItem>
              <MenuItem value="90">Last 90 days</MenuItem>
              <MenuItem value="365">Last year</MenuItem>
            </Select>
          </FormControl>
          {onRefresh && (
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
          )}
          {onExport && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={onExport}
            >
              Export
            </Button>
          )}
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Orders"
            value={analytics.totalOrders}
            icon={<ShoppingCartIcon />}
            growth={analytics.orderGrowth}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Revenue"
            value={analytics.totalRevenue}
            icon={<AttachMoneyIcon />}
            growth={analytics.revenueGrowth}
            color="success"
            format="currency"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Average Order Value"
            value={analytics.averageOrderValue}
            icon={<TrendingUpIcon />}
            color="info"
            format="currency"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Pending Orders"
            value={analytics.pendingOrders}
            icon={<ScheduleIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Order Status Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Order Status Distribution
            </Typography>
            <Box sx={{ mt: 2 }}>
              {analytics.statusDistribution.map((item) => (
                <Box key={item.status} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      {item.status.replace('_', ' ').toUpperCase()}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {item.count} ({item.percentage.toFixed(1)}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={item.percentage}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.grey[300], 0.3)
                    }}
                    color={getStatusColor(item.status) as any}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Top Customers */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Top Customers
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Orders</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.topCustomers.map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                            {customer.name.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" fontWeight="medium">
                            {customer.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={customer.orders} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(customer.revenue)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Recent Orders
              </Typography>
              <Button size="small" endIcon={<MoreVertIcon />}>
                View All
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Payment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.recentOrders.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {order.orderNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                            {order.partyName.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">
                            {order.partyName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(order.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(order.total)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.status.replace('_', ' ').toUpperCase()}
                          size="small"
                          color={getStatusColor(order.status) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.paymentStatus.toUpperCase()}
                          size="small"
                          variant="outlined"
                          color={order.paymentStatus === PaymentStatus.PAID ? 'success' : 'warning'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Monthly Revenue Trend */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Monthly Revenue Trend
            </Typography>
            <Box sx={{ mt: 2 }}>
              {analytics.monthlyRevenue.map((month, index) => {
                const maxRevenue = Math.max(...analytics.monthlyRevenue.map(m => m.revenue));
                const percentage = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
                
                return (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        {month.month}
                      </Typography>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(month.revenue)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {month.orders} orders
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.primary.main, 0.1)
                      }}
                      color="primary"
                    />
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}