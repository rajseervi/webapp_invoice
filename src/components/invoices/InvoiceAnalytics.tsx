"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Stack,
  useTheme,
  alpha,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  MonetizationOn as MoneyIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon,
  BusinessCenter as BusinessIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { invoiceService } from '@/services/invoiceService';

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
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

interface RevenueData {
  month: string;
  revenue: number;
  invoices: number;
  growth: number;
}

interface TopCustomer {
  id: string;
  name: string;
  invoiceCount: number;
  totalRevenue: number;
  avgInvoiceValue: number;
  lastInvoiceDate: string;
}

interface ProductPerformance {
  productName: string;
  quantitySold: number;
  revenue: number;
  invoiceCount: number;
}

export default function InvoiceAnalytics() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState('last6months');
  const [loading, setLoading] = useState(false);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Load real invoice data
      const invoiceData = await invoiceService.getInvoices();
      
      // Filter by date range
      const months = dateRange === 'last3months' ? 3 : dateRange === 'last6months' ? 6 : 12;
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - months);
      
      const filteredInvoices = invoiceData.filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt || invoice.saleDate || invoice.date || '');
        return invoiceDate >= cutoffDate;
      });
      
      // Calculate revenue data by month
      const monthlyData = new Map<string, { revenue: number; invoices: number }>();
      
      filteredInvoices.forEach(invoice => {
        const date = new Date(invoice.createdAt || invoice.saleDate || invoice.date || '');
        const monthKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { revenue: 0, invoices: 0 });
        }
        
        const data = monthlyData.get(monthKey)!;
        data.revenue += invoice.total || invoice.totalAmount || 0;
        data.invoices += 1;
      });
      
      const revenueArray = Array.from(monthlyData.entries()).map(([month, data], index, array) => {
        const prevData = index > 0 ? array[index - 1][1] : null;
        const growth = prevData ? ((data.revenue - prevData.revenue) / prevData.revenue) * 100 : 0;
        
        return {
          month,
          revenue: data.revenue,
          invoices: data.invoices,
          growth
        };
      });
      
      setRevenueData(revenueArray.slice(-months));
      
      // Calculate top customers
      const customerMap = new Map<string, { invoices: any[]; totalRevenue: number }>();
      
      filteredInvoices.forEach(invoice => {
        const customerName = invoice.partyName || invoice.customer?.name || 'Unknown Customer';
        
        if (!customerMap.has(customerName)) {
          customerMap.set(customerName, { invoices: [], totalRevenue: 0 });
        }
        
        const customerData = customerMap.get(customerName)!;
        customerData.invoices.push(invoice);
        customerData.totalRevenue += invoice.total || invoice.totalAmount || 0;
      });
      
      const topCustomersArray = Array.from(customerMap.entries())
        .map(([name, data]) => ({
          id: name,
          name,
          invoiceCount: data.invoices.length,
          totalRevenue: data.totalRevenue,
          avgInvoiceValue: data.totalRevenue / data.invoices.length,
          lastInvoiceDate: data.invoices
            .sort((a, b) => new Date(b.createdAt || b.saleDate || b.date || '').getTime() - new Date(a.createdAt || a.saleDate || a.date || '').getTime())[0]
            ?.createdAt || data.invoices[0]?.saleDate || data.invoices[0]?.date || ''
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 3);
      
      setTopCustomers(topCustomersArray);
      
      // Calculate product performance
      const productMap = new Map<string, { quantity: number; revenue: number; invoiceCount: number }>();
      
      filteredInvoices.forEach(invoice => {
        if (invoice.items && Array.isArray(invoice.items)) {
          invoice.items.forEach(item => {
            const productName = item.name || 'Unknown Product';
            
            if (!productMap.has(productName)) {
              productMap.set(productName, { quantity: 0, revenue: 0, invoiceCount: 0 });
            }
            
            const productData = productMap.get(productName)!;
            productData.quantity += item.quantity || 0;
            productData.revenue += (item.quantity || 0) * (item.price || 0);
            productData.invoiceCount += 1;
          });
        }
      });
      
      const productArray = Array.from(productMap.entries())
        .map(([productName, data]) => ({
          productName,
          quantitySold: data.quantity,
          revenue: data.revenue,
          invoiceCount: data.invoiceCount
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 4);
      
      setProductPerformance(productArray);
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalRevenue = revenueData.reduce((sum, data) => sum + data.revenue, 0);
  const totalInvoices = revenueData.reduce((sum, data) => sum + data.invoices, 0);
  const avgGrowth = revenueData.length > 0 ? revenueData.reduce((sum, data) => sum + data.growth, 0) / revenueData.length : 0;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, p: 3 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading analytics data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            📈 Invoice Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive insights into your invoice performance and trends
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              label="Date Range"
              onChange={(e) => setDateRange(e.target.value)}
            >
              <MenuItem value="last3months">Last 3 Months</MenuItem>
              <MenuItem value="last6months">Last 6 Months</MenuItem>
              <MenuItem value="lastyear">Last Year</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<RefreshIcon />}>
            Refresh
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />}>
            Export
          </Button>
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Revenue (6M)
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {formatCurrency(totalRevenue)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUpIcon color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                      +{avgGrowth.toFixed(1)}% avg growth
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                  <MoneyIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Invoices (6M)
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {totalInvoices}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {(totalInvoices / 6).toFixed(0)} per month avg
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  <ReceiptIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Avg Invoice Value
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {formatCurrency(totalRevenue / totalInvoices)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Per invoice
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                  <AssessmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Top Customer Share
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {((topCustomers[0]?.totalRevenue / totalRevenue) * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {topCustomers[0]?.name}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                  <PersonIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="📊 Revenue Trends" />
            <Tab label="👥 Top Customers" />
            <Tab label="📦 Product Performance" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              📈 Monthly Revenue & Invoice Trends
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Month</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Invoices</TableCell>
                    <TableCell align="right">Avg Value</TableCell>
                    <TableCell align="right">Growth</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {revenueData.map((data) => (
                    <TableRow key={data.month} hover>
                      <TableCell>{data.month}</TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(data.revenue)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{data.invoices}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(data.revenue / data.invoices)}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          {data.growth > 0 ? (
                            <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                          ) : (
                            <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                          )}
                          <Typography
                            variant="body2"
                            color={data.growth > 0 ? 'success.main' : 'error.main'}
                          >
                            {data.growth > 0 ? '+' : ''}{data.growth.toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              🏆 Top Customers by Revenue
            </Typography>
            <List>
              {topCustomers.map((customer, index) => (
                <React.Fragment key={customer.id}>
                  <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: index === 0 ? theme.palette.primary.main : 
                                index === 1 ? theme.palette.secondary.main :
                                theme.palette.info.main,
                        width: 48,
                        height: 48
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {index + 1}
                        </Typography>
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {customer.name}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {formatCurrency(customer.totalRevenue)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="text.secondary">
                                Invoices: {customer.invoiceCount}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="text.secondary">
                                Avg: {formatCurrency(customer.avgInvoiceValue)}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="text.secondary">
                                Last: {new Date(customer.lastInvoiceDate).toLocaleDateString()}
                              </Typography>
                            </Grid>
                          </Grid>
                          <LinearProgress
                            variant="determinate"
                            value={(customer.totalRevenue / topCustomers[0].totalRevenue) * 100}
                            sx={{ mt: 1, height: 4, borderRadius: 2 }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < topCustomers.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              📦 Product Performance Analysis
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product Name</TableCell>
                    <TableCell align="right">Qty Sold</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Invoices</TableCell>
                    <TableCell align="right">Avg Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productPerformance.map((product, index) => (
                    <TableRow key={product.productName} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ 
                            mr: 2, 
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            width: 32,
                            height: 32
                          }}>
                            {index + 1}
                          </Avatar>
                          <Typography variant="subtitle2">{product.productName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {product.quantitySold}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(product.revenue)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{product.invoiceCount}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(product.revenue / product.quantitySold)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </TabPanel>
      </Card>
    </Box>
  );
}