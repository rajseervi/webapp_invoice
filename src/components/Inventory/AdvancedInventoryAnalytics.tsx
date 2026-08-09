"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Avatar,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Inventory as InventoryIcon,
  Speed as SpeedIcon,
  MonetizationOn as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
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
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { EnhancedInventoryTrackingService, InventoryAnalytics } from '@/services/enhancedInventoryTrackingService';

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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const StatCard = ({
  title,
  value,
  icon,
  color = 'primary',
  trend,
  subtitle
}: {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  trend?: number;
  subtitle?: string;
}) => (
  <Card>
    <CardContent>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: `${color}.main` }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h5" fontWeight="bold" color={`${color}.main`}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
        {typeof trend === 'number' && (
          <Stack alignItems="center">
            {trend >= 0 ? (
              <TrendingUpIcon color="success" />
            ) : (
              <TrendingDownIcon color="error" />
            )}
            <Typography 
              variant="caption" 
              color={trend >= 0 ? 'success.main' : 'error.main'}
              fontWeight="bold"
            >
              {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
            </Typography>
          </Stack>
        )}
      </Stack>
    </CardContent>
  </Card>
);

function AdvancedInventoryAnalytics() {
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1),
    endDate: new Date()
  });

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await EnhancedInventoryTrackingService.getInventoryAnalytics({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString()
      });
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  if (loading && !analytics) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading analytics...</Typography>
      </Box>
    );
  }

  if (!analytics) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No analytics data available
        </Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold">
            Inventory Analytics
          </Typography>
          <Stack direction="row" spacing={2}>
            <DatePicker
              label="Start Date"
              value={dateRange.startDate}
              onChange={(date) => date && setDateRange(prev => ({ ...prev, startDate: date }))}
              slotProps={{ textField: { size: 'small' } }}
            />
            <DatePicker
              label="End Date"
              value={dateRange.endDate}
              onChange={(date) => date && setDateRange(prev => ({ ...prev, endDate: date }))}
              slotProps={{ textField: { size: 'small' } }}
            />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadAnalytics}
              disabled={loading}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Products"
              value={formatNumber(analytics.totalProducts)}
              icon={<InventoryIcon />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Stock Value"
              value={formatCurrency(analytics.totalStockValue)}
              icon={<MoneyIcon />}
              color="success"
              trend={5.2}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Stock Turnover"
              value={`${analytics.stockTurnoverRate.toFixed(1)}x`}
              icon={<SpeedIcon />}
              color="info"
              trend={-2.1}
              subtitle="per year"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Low Stock Items"
              value={formatNumber(analytics.lowStockItems)}
              icon={<WarningIcon />}
              color="warning"
            />
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab label="Stock Trends" />
              <Tab label="Category Analysis" />
              <Tab label="Movement Analysis" />
              <Tab label="Performance Metrics" />
            </Tabs>
          </Box>

          {/* Stock Trends Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              {/* Stock Value Trend */}
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Stock Value Trend
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={analytics.stockValueTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Quick Stats */}
              <Grid item xs={12} lg={4}>
                <Stack spacing={2}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Quick Stats
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2">Avg Daily Value</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {formatCurrency(analytics.totalStockValue / 30)}
                            </Typography>
                          </Stack>
                        </Box>
                        <Box>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2">Stock Coverage</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {Math.round(analytics.stockCoverageDays)} days
                            </Typography>
                          </Stack>
                        </Box>
                        <Box>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2">Active Products</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {formatNumber(analytics.activeProducts)}
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Stock Health
                      </Typography>
                      <Stack spacing={2} alignItems="center">
                        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                          <LinearProgress
                            variant="determinate"
                            value={85}
                            sx={{
                              height: 20,
                              borderRadius: 10,
                              width: 200,
                              backgroundColor: 'grey.200'
                            }}
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              bottom: 0,
                              right: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography variant="body2" fontWeight="bold" color="white">
                              85%
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          Good
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Category Analysis Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              {/* Category Distribution */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Stock Value by Category
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analytics.categoryAnalysis}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="totalValue"
                        >
                          {analytics.categoryAnalysis.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Category Performance */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Category Performance
                    </Typography>
                    <TableContainer sx={{ maxHeight: 300 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Category</TableCell>
                            <TableCell align="right">Products</TableCell>
                            <TableCell align="right">Value</TableCell>
                            <TableCell align="right">Turnover</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {analytics.categoryAnalysis.map((category) => (
                            <TableRow key={category.categoryId}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {category.categoryName}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                {formatNumber(category.totalProducts)}
                              </TableCell>
                              <TableCell align="right">
                                {formatCurrency(category.totalValue)}
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={`${category.turnoverRate.toFixed(1)}x`}
                                  color={category.turnoverRate > 2 ? 'success' : category.turnoverRate > 1 ? 'warning' : 'error'}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Movement Analysis Tab */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              {/* Movement Trends */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Stock Movement Trends
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={analytics.movementTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="inbound"
                          stroke="#00C49F"
                          strokeWidth={2}
                          name="Inbound"
                        />
                        <Line
                          type="monotone"
                          dataKey="outbound"
                          stroke="#FF8042"
                          strokeWidth={2}
                          name="Outbound"
                        />
                        <Line
                          type="monotone"
                          dataKey="net"
                          stroke="#8884d8"
                          strokeWidth={2}
                          name="Net Movement"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Top Moving Products */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Top Moving Products
                    </Typography>
                    <TableContainer sx={{ maxHeight: 300 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Product</TableCell>
                            <TableCell align="right">Movements</TableCell>
                            <TableCell align="right">Velocity</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {analytics.topMovingProducts.map((product) => (
                            <TableRow key={product.productId}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {product.productName}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                {formatNumber(product.totalMovements)}
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={product.velocity}
                                  color={
                                    product.velocity === 'Fast' ? 'success' :
                                    product.velocity === 'Medium' ? 'warning' : 'error'
                                  }
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Slow Moving Products */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Slow Moving Products
                    </Typography>
                    <TableContainer sx={{ maxHeight: 300 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Product</TableCell>
                            <TableCell align="right">Days Since Move</TableCell>
                            <TableCell align="right">Stock Value</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {analytics.slowMovingProducts.slice(0, 10).map((product) => (
                            <TableRow key={product.productId}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {product.productName}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={`${product.daysSinceLastMovement} days`}
                                  color={
                                    product.daysSinceLastMovement > 90 ? 'error' :
                                    product.daysSinceLastMovement > 60 ? 'warning' : 'info'
                                  }
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="right">
                                {formatCurrency(product.currentQuantity * (product.unitPrice || 0))}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Performance Metrics Tab */}
          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={3}>
              {/* Key Performance Indicators */}
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Key Performance Indicators
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" fontWeight="bold" color="primary.main">
                            {analytics.stockTurnoverRate.toFixed(1)}x
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Stock Turnover Rate
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Industry avg: 4-6x
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" fontWeight="bold" color="success.main">
                            {Math.round(analytics.stockCoverageDays)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Days of Stock Coverage
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Target: 30-45 days
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" fontWeight="bold" color="info.main">
                            95.2%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Fill Rate
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Target: &gt;95%
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" fontWeight="bold" color="warning.main">
                            2.1%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Stockout Rate
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Target: &lt;5%
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Recommendations */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recommendations
                    </Typography>
                    <Stack spacing={2}>
                      <Paper sx={{ p: 2, bgcolor: 'success.50' }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                          <CheckCircleIcon color="success" />
                          <Typography variant="subtitle2" fontWeight="bold">
                            Reorder Soon
                          </Typography>
                        </Stack>
                        <Typography variant="body2">
                          {analytics.lowStockItems} products need immediate reordering
                        </Typography>
                      </Paper>
                      <Paper sx={{ p: 2, bgcolor: 'warning.50' }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                          <WarningIcon color="warning" />
                          <Typography variant="subtitle2" fontWeight="bold">
                            Review Slow Movers
                          </Typography>
                        </Stack>
                        <Typography variant="body2">
                          {analytics.slowMovingProducts.filter(p => p.daysSinceLastMovement > 60).length} products haven't moved in 60+ days
                        </Typography>
                      </Paper>
                      <Paper sx={{ p: 2, bgcolor: 'info.50' }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                          <AssessmentIcon color="info" />
                          <Typography variant="subtitle2" fontWeight="bold">
                            Optimize Stock Levels
                          </Typography>
                        </Stack>
                        <Typography variant="body2">
                          Consider adjusting reorder points for top-moving products
                        </Typography>
                      </Paper>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Card>
      </Box>
    </LocalizationProvider>
  );
}

export default AdvancedInventoryAnalytics;