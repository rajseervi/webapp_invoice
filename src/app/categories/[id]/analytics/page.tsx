"use client"
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  Button,
  IconButton,
  Breadcrumbs,
  Link,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Home as HomeIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Category, CategoryAnalytics, Product } from '@/types/inventory';
import { categoryService } from '@/services/categoryService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function CategoryAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [analytics, setAnalytics] = useState<CategoryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (categoryId) {
      loadCategoryAnalytics();
    }
  }, [categoryId]);

  const loadCategoryAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [categoryData, analyticsData] = await Promise.all([
        categoryService.getCategoryById(categoryId),
        categoryService.getCategoryAnalytics(categoryId)
      ]);

      setCategory(categoryData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error loading category analytics:', err);
      setError('Failed to load category analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <ImprovedDashboardLayout>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress size={60} />
          </Box>
        </Container>
      </ImprovedDashboardLayout>
    );
  }

  if (error || !category || !analytics) {
    return (
      <ImprovedDashboardLayout>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Category not found'}
          </Alert>
          <Button
            variant="contained"
            startIcon={<BackIcon />}
            onClick={() => router.push('/categories')}
          >
            Back to Categories
          </Button>
        </Container>
      </ImprovedDashboardLayout>
    );
  }

  // Prepare chart data
  const salesTrendData = analytics.salesTrend.map(item => ({
    ...item,
    salesFormatted: formatCurrency(item.sales)
  }));

  const topProductsData = analytics.topSellingProducts.slice(0, 5).map((product, index) => ({
    name: product.name,
    value: product.price * product.quantity,
    quantity: product.quantity,
    color: COLORS[index % COLORS.length]
  }));

  const performanceMetrics = [
    {
      title: 'Total Products',
      value: analytics.totalProducts,
      icon: <InventoryIcon />,
      color: 'primary.main',
      trend: null
    },
    {
      title: 'Total Value',
      value: formatCurrency(analytics.totalValue),
      icon: <MoneyIcon />,
      color: 'success.main',
      trend: null
    },
    {
      title: 'Average Price',
      value: formatCurrency(analytics.averagePrice),
      icon: <AssessmentIcon />,
      color: 'info.main',
      trend: null
    },
    {
      title: 'Profit Margin',
      value: formatPercentage(analytics.profitMargin),
      icon: analytics.profitMargin > 20 ? <TrendingUpIcon /> : <TrendingDownIcon />,
      color: analytics.profitMargin > 20 ? 'success.main' : 'warning.main',
      trend: analytics.profitMargin > 20 ? 'up' : 'down'
    },
    {
      title: 'Turnover Rate',
      value: `${analytics.turnoverRate.toFixed(1)}x`,
      icon: <SpeedIcon />,
      color: 'secondary.main',
      trend: analytics.turnoverRate > 3 ? 'up' : 'down'
    }
  ];

  return (
    <ImprovedDashboardLayout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <IconButton onClick={() => router.push('/categories')} sx={{ mr: 1 }}>
                <BackIcon />
              </IconButton>
              <Avatar
                sx={{
                  bgcolor: category.color || '#1976d2',
                  width: 40,
                  height: 40,
                  mr: 2
                }}
              >
                <span className="material-icons">
                  {category.icon || 'category'}
                </span>
              </Avatar>
              <Box>
                <Typography variant="h4">
                  {category.name} Analytics
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {category.description || 'Category performance insights'}
                </Typography>
              </Box>
            </Box>
            <Breadcrumbs>
              <Link color="inherit" href="/dashboard">
                <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Dashboard
              </Link>
              <Link color="inherit" href="/categories">
                <CategoryIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Categories
              </Link>
              <Typography color="text.primary">{category.name}</Typography>
              <Typography color="text.primary">Analytics</Typography>
            </Breadcrumbs>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => router.push(`/products?category=${categoryId}`)}
            >
              View Products
            </Button>
            <Button
              variant="contained"
              onClick={() => router.push(`/categories/edit/${categoryId}`)}
            >
              Edit Category
            </Button>
          </Box>
        </Box>

        {/* Performance Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {performanceMetrics.map((metric, index) => (
            <Grid item xs={12} sm={6} md={2.4} key={index}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ color: metric.color, fontWeight: 'bold' }}>
                        {metric.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {metric.title}
                      </Typography>
                    </Box>
                    <Box sx={{ color: metric.color }}>
                      {metric.icon}
                    </Box>
                  </Box>
                  {metric.trend && (
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        size="small"
                        label={metric.trend === 'up' ? 'Good' : 'Needs Attention'}
                        color={metric.trend === 'up' ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Sales Trend */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <TimelineIcon sx={{ mr: 1 }} />
                Sales Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'sales' ? formatCurrency(value as number) : value,
                      name === 'sales' ? 'Sales' : 'Quantity'
                    ]}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="quantity"
                    stackId="2"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Top Products */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top Products by Value
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topProductsData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {topProductsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Detailed Tables */}
        <Grid container spacing={3}>
          {/* Top Selling Products Table */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top Selling Products
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Stock</TableCell>
                      <TableCell align="right">Value</TableCell>
                      <TableCell align="right">Performance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.topSellingProducts.slice(0, 10).map((product, index) => {
                      const value = product.price * product.quantity;
                      const maxValue = Math.max(...analytics.topSellingProducts.map(p => p.price * p.quantity));
                      const performance = (value / maxValue) * 100;
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {product.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {product.description || 'No description'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(product.price)}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={product.quantity}
                              size="small"
                              color={product.quantity > 10 ? 'success' : product.quantity > 0 ? 'warning' : 'error'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(value)}
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 60 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={performance}
                                  color={performance > 80 ? 'success' : performance > 50 ? 'warning' : 'error'}
                                />
                              </Box>
                              <Typography variant="caption">
                                {performance.toFixed(0)}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Category Insights */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Category Insights
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Stock Health
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">In Stock</Typography>
                  <Typography variant="body2" color="success.main">
                    {analytics.topSellingProducts.filter(p => p.quantity > 10).length}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Low Stock</Typography>
                  <Typography variant="body2" color="warning.main">
                    {analytics.topSellingProducts.filter(p => p.quantity > 0 && p.quantity <= 10).length}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Out of Stock</Typography>
                  <Typography variant="body2" color="error.main">
                    {analytics.topSellingProducts.filter(p => p.quantity === 0).length}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Price Range
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Minimum</Typography>
                  <Typography variant="body2">
                    {formatCurrency(Math.min(...analytics.topSellingProducts.map(p => p.price)))}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Maximum</Typography>
                  <Typography variant="body2">
                    {formatCurrency(Math.max(...analytics.topSellingProducts.map(p => p.price)))}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Average</Typography>
                  <Typography variant="body2">
                    {formatCurrency(analytics.averagePrice)}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Category Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {category.tags?.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  )) || (
                    <Typography variant="body2" color="text.secondary">
                      No tags assigned
                    </Typography>
                  )}
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </ImprovedDashboardLayout>
  );
}