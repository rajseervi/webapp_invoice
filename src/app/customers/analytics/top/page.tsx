"use client";
import React, { useState, useEffect } from 'react';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  IconButton,
  Tooltip,
  Stack
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  MonetizationOn as MoneyIcon,
  ShoppingCart as ShoppingCartIcon,
  Timeline as TimelineIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AccountBalance as AccountBalanceIcon,
  Analytics as AnalyticsIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { CustomerAnalyticsService, TopCustomerAnalytics, CustomerAnalyticsFilters } from '@/services/customerAnalyticsService';

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

function TopCustomersAnalyticsPage() {
  const [customers, setCustomers] = useState<TopCustomerAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [filters, setFilters] = useState<CustomerAnalyticsFilters>({
    limit: 50,
    businessType: '',
    minRevenue: 0,
    dateRange: {
      start: new Date(new Date().getFullYear(), 0, 1), // Start of current year
      end: new Date()
    }
  });
  const [segmentAnalysis, setSegmentAnalysis] = useState<Array<{
    segment: string;
    count: number;
    totalRevenue: number;
    averageRevenue: number;
  }>>([]);
  const [growthTrend, setGrowthTrend] = useState<Array<{
    month: string;
    newCustomers: number;
    totalRevenue: number;
  }>>([]);

  useEffect(() => {
    loadAnalytics();
  }, [filters]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [topCustomersData, segmentData, growthData] = await Promise.all([
        CustomerAnalyticsService.getTopCustomers(filters),
        CustomerAnalyticsService.getCustomerSegmentAnalysis(),
        CustomerAnalyticsService.getCustomerGrowthTrend()
      ]);

      setCustomers(topCustomersData);
      setSegmentAnalysis(segmentData);
      setGrowthTrend(growthData);
    } catch (err) {
      console.error('Error loading customer analytics:', err);
      setError('Failed to load customer analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof CustomerAnalyticsFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Platinum': return 'primary';
      case 'Gold': return 'warning';
      case 'Silver': return 'info';
      case 'Bronze': return 'secondary';
      default: return 'default';
    }
  };

  const getReliabilityColor = (reliability: string) => {
    switch (reliability) {
      case 'Excellent': return 'success';
      case 'Good': return 'info';
      case 'Fair': return 'warning';
      case 'Poor': return 'error';
      default: return 'default';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'success';
      case 'Medium': return 'warning';
      case 'High': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalMetrics = {
    totalCustomers: customers.length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalRevenue, 0),
    totalOrders: customers.reduce((sum, c) => sum + c.totalOrders, 0),
    averageOrderValue: customers.length > 0 
      ? customers.reduce((sum, c) => sum + c.averageOrderValue, 0) / customers.length 
      : 0,
    totalProfit: customers.reduce((sum, c) => sum + c.totalProfit, 0),
    averageProfitMargin: customers.length > 0 
      ? customers.reduce((sum, c) => sum + c.profitMargin, 0) / customers.length 
      : 0
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2 }}>Loading customer analytics...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadAnalytics}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            📊 Top Customers Analytics
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadAnalytics}>
              Refresh
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />}>
              Export
            </Button>
            <Button variant="outlined" startIcon={<PrintIcon />}>
              Print Report
            </Button>
          </Stack>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom startIcon={<FilterListIcon />}>
              🔍 Filters & Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Minimum Revenue"
                  type="number"
                  value={filters.minRevenue || ''}
                  onChange={(e) => handleFilterChange('minRevenue', Number(e.target.value))}
                  InputProps={{ startAdornment: '₹' }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Business Type</InputLabel>
                  <Select
                    value={filters.businessType || ''}
                    label="Business Type"
                    onChange={(e) => handleFilterChange('businessType', e.target.value)}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="Customer">Customer</MenuItem>
                    <MenuItem value="B2B">B2B</MenuItem>
                    <MenuItem value="B2C">B2C</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Results Limit"
                  type="number"
                  value={filters.limit || 50}
                  onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={loadAnalytics}
                  sx={{ height: '56px' }}
                >
                  Apply Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{totalMetrics.totalCustomers}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Customers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MoneyIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{formatCurrency(totalMetrics.totalRevenue)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ShoppingCartIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{totalMetrics.totalOrders}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Orders
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{formatCurrency(totalMetrics.averageOrderValue)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Order Value
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountBalanceIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{formatCurrency(totalMetrics.totalProfit)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Profit
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AnalyticsIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{totalMetrics.averageProfitMargin.toFixed(1)}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Profit Margin
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different views */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="🏆 Top Customers" />
            <Tab label="📊 Customer Segments" />
            <Tab label="📈 Growth Trends" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Top Customers Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                  <TableCell align="right">Orders</TableCell>
                  <TableCell align="right">AOV</TableCell>
                  <TableCell align="right">Profit</TableCell>
                  <TableCell>Reliability</TableCell>
                  <TableCell>Risk</TableCell>
                  <TableCell>Last Order</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.slice(0, 20).map((customer, index) => (
                  <TableRow key={customer.customerId} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: getStatusColor(customer.customerStatus) + '.main' }}>
                          {index + 1}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">{customer.customerName}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            {customer.customerEmail && (
                              <Tooltip title={customer.customerEmail}>
                                <EmailIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                              </Tooltip>
                            )}
                            {customer.customerPhone && (
                              <Tooltip title={customer.customerPhone}>
                                <PhoneIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                              </Tooltip>
                            )}
                            <BusinessIcon fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                              {customer.businessType}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={customer.customerStatus}
                        color={getStatusColor(customer.customerStatus) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2">
                        {formatCurrency(customer.totalRevenue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2">{customer.totalOrders}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(customer.averageOrderValue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="success.main">
                        {formatCurrency(customer.totalProfit)}
                        <br />
                        <Typography variant="caption">
                          ({customer.profitMargin.toFixed(1)}%)
                        </Typography>
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={customer.paymentReliability}
                        color={getReliabilityColor(customer.paymentReliability) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={customer.riskLevel}
                        color={getRiskColor(customer.riskLevel) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(customer.lastOrderDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Customer Segments */}
          <Grid container spacing={3}>
            {segmentAnalysis.map((segment, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>{segment.segment}</Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h4">{segment.count}</Typography>
                      <Typography variant="body2" color="text.secondary">Customers</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1">
                        {formatCurrency(segment.totalRevenue)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">
                        {formatCurrency(segment.averageRevenue)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Average Revenue</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Growth Trends */}
          <Typography variant="h6" gutterBottom>📈 Customer Growth Trend (Last 12 Months)</Typography>
          <Grid container spacing={3}>
            {growthTrend.map((trend, index) => (
              <Grid item xs={12} md={3} key={index}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">
                      {new Date(trend.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h4" color="primary">
                        {trend.newCustomers}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        New Customers
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Card>
    </Container>
  );
}

export default function ModernTopCustomersAnalyticsPage() {
  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Top Customers Analytics"
        pageType="analytics"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <TopCustomersAnalyticsPage />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}