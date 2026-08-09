"use client";
import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import {
  DatePicker,
} from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Treemap
} from 'recharts';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';

interface ProductSalesData {
  productName: string;
  totalRevenue: number;
  totalQuantity: number;
  invoiceCount: number;
  averagePrice: number;
  category?: string;
  unit?: string;
  growth?: number;
  rank: number;
}

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff7f', 
  '#ff69b4', '#87ceeb', '#dda0dd', '#ffa500', '#98fb98'
];

export default function SalesProductsPage() {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    end: new Date(),
  });
  const [productSales, setProductSales] = useState<ProductSalesData[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductSalesData[]>([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'revenue' | 'quantity' | 'invoices'>('revenue');
  const [topCount, setTopCount] = useState(10);

  useEffect(() => {
    fetchProductSales();
  }, [dateRange]);

  useEffect(() => {
    filterAndSortProducts();
  }, [productSales, searchTerm, sortBy, topCount]);

  const fetchProductSales = async () => {
    try {
      setLoading(true);
      
      const invoicesRef = collection(db, 'invoices');
      const q = query(
        invoicesRef,
        where('createdAt', '>=', dateRange.start),
        where('createdAt', '<=', dateRange.end),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const invoices = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Aggregate product sales data
      const productMap: Record<string, {
        revenue: number;
        quantity: number;
        invoiceCount: number;
        prices: number[];
        category?: string;
        unit?: string;
      }> = {};

      invoices.forEach(invoice => {
        if (invoice.items && Array.isArray(invoice.items)) {
          invoice.items.forEach((item: any) => {
            const productName = item.description || item.productName || 'Unknown Product';
            const quantity = Number(item.quantity) || 0;
            const amount = Number(item.amount) || 0;
            const rate = Number(item.rate) || 0;

            if (!productMap[productName]) {
              productMap[productName] = {
                revenue: 0,
                quantity: 0,
                invoiceCount: 0,
                prices: [],
                category: item.category,
                unit: item.unit || 'PCS'
              };
            }

            productMap[productName].revenue += amount;
            productMap[productName].quantity += quantity;
            productMap[productName].invoiceCount += 1;
            if (rate > 0) {
              productMap[productName].prices.push(rate);
            }
          });
        }
      });

      // Convert to array and calculate additional metrics
      const productArray: ProductSalesData[] = Object.entries(productMap)
        .map(([productName, data], index) => ({
          productName,
          totalRevenue: data.revenue,
          totalQuantity: data.quantity,
          invoiceCount: data.invoiceCount,
          averagePrice: data.prices.length > 0 
            ? data.prices.reduce((sum, price) => sum + price, 0) / data.prices.length 
            : 0,
          category: data.category,
          unit: data.unit,
          rank: index + 1
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .map((product, index) => ({ ...product, rank: index + 1 }));

      setProductSales(productArray);
    } catch (error) {
      console.error('Error fetching product sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = productSales.filter(product =>
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort by selected criteria
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'quantity':
          return b.totalQuantity - a.totalQuantity;
        case 'invoices':
          return b.invoiceCount - a.invoiceCount;
        case 'revenue':
        default:
          return b.totalRevenue - a.totalRevenue;
      }
    });

    // Apply top N filter for charts
    setFilteredProducts(filtered.slice(0, topCount));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // TODO: Implement CSV download
    console.log('Download products report');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPerformanceColor = (rank: number) => {
    if (rank <= 3) return 'success';
    if (rank <= 10) return 'primary';
    if (rank <= 20) return 'warning';
    return 'default';
  };

  const totalRevenue = productSales.reduce((sum, product) => sum + product.totalRevenue, 0);
  const totalProducts = productSales.length;
  const avgRevenuePerProduct = totalProducts > 0 ? totalRevenue / totalProducts : 0;

  // Prepare chart data
  const pieChartData = filteredProducts.map(product => ({
    name: product.productName.length > 20 
      ? `${product.productName.substring(0, 20)}...` 
      : product.productName,
    value: product.totalRevenue,
    fullName: product.productName
  }));

  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Product Sales Analysis"
        subtitle="Analyze product performance and sales trends"
        pageType="reports"
        enableVisualEffects={true}
        enableParticles={false}
        customQuickActions={[
          { icon: <RefreshIcon />, label: 'Refresh', onClick: fetchProductSales },
          { icon: <DownloadIcon />, label: 'Export', onClick: handleDownload },
          { icon: <PrintIcon />, label: 'Print', onClick: handlePrint },
        ]}
      >
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          {/* Filters */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <InventoryIcon sx={{ mr: 1, color: 'primary.main' }} />
              Product Analysis Filters
            </Typography>
            
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={2}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={dateRange.start}
                    onChange={(newValue) => newValue && setDateRange(prev => ({ ...prev, start: newValue }))}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={dateRange.end}
                    onChange={(newValue) => newValue && setDateRange(prev => ({ ...prev, end: newValue }))}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <MenuItem value="revenue">Revenue</MenuItem>
                    <MenuItem value="quantity">Quantity</MenuItem>
                    <MenuItem value="invoices">Invoices</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Top Products</InputLabel>
                  <Select
                    value={topCount}
                    label="Top Products"
                    onChange={(e) => setTopCount(Number(e.target.value))}
                  >
                    <MenuItem value={10}>Top 10</MenuItem>
                    <MenuItem value={20}>Top 20</MenuItem>
                    <MenuItem value={50}>Top 50</MenuItem>
                    <MenuItem value={100}>Top 100</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <Button
                  variant="contained"
                  onClick={fetchProductSales}
                  fullWidth
                  disabled={loading}
                  startIcon={<RefreshIcon />}
                >
                  Update
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {productSales.length === 0 && !loading && (
            <Alert severity="info" sx={{ mb: 4 }}>
              No product sales data found for the selected date range.
            </Alert>
          )}

          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Total Revenue</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(totalRevenue)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    From {totalProducts} products
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Total Products</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {totalProducts}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Unique products sold
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Avg Revenue/Product</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(avgRevenuePerProduct)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Per product average
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {productSales.length > 0 && (
            <Paper sx={{ width: '100%' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="product analysis tabs">
                  <Tab icon={<PieChart />} label="Revenue Distribution" iconPosition="start" />
                  <Tab icon={<BarChart />} label="Performance Chart" iconPosition="start" />
                  <Tab icon={<AssessmentIcon />} label="Detailed Analysis" iconPosition="start" />
                </Tabs>
              </Box>

              {/* Revenue Distribution */}
              <TabPanel value={tabValue} index={0}>
                <Box sx={{ height: 500 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: any, name: any, props: any) => [
                          formatCurrency(value), 
                          props.payload.fullName
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </TabPanel>

              {/* Performance Chart */}
              <TabPanel value={tabValue} index={1}>
                <Box sx={{ height: 500 }}>
                  <ResponsiveContainer>
                    <BarChart 
                      data={filteredProducts}
                      margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="productName"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        fontSize={10}
                        interval={0}
                      />
                      <YAxis />
                      <YAxis yAxisId="right" orientation="right" />
                      <RechartsTooltip 
                        formatter={(value, name) => [
                          name === 'totalRevenue' ? formatCurrency(value as number) : value,
                          name === 'totalRevenue' ? 'Revenue' : 'Quantity'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="totalRevenue" fill="#8884d8" name="Revenue" />
                      <Bar dataKey="totalQuantity" fill="#82ca9d" name="Quantity" yAxisId="right" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </TabPanel>

              {/* Detailed Analysis */}
              <TabPanel value={tabValue} index={2}>
                <TableContainer sx={{ maxHeight: 600 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Rank</strong></TableCell>
                        <TableCell><strong>Product Name</strong></TableCell>
                        <TableCell align="right"><strong>Revenue</strong></TableCell>
                        <TableCell align="right"><strong>Quantity</strong></TableCell>
                        <TableCell align="right"><strong>Avg Price</strong></TableCell>
                        <TableCell align="right"><strong>Invoices</strong></TableCell>
                        <TableCell><strong>Category</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(searchTerm ? filteredProducts : productSales).map((product) => (
                        <TableRow key={product.productName} hover>
                          <TableCell>
                            <Chip
                              icon={product.rank <= 3 ? <StarIcon /> : <TrendingUpIcon />}
                              label={`#${product.rank}`}
                              color={getPerformanceColor(product.rank) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 32, height: 32 }}>
                                {product.productName.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {product.productName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {product.unit || 'PCS'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="medium">
                              {formatCurrency(product.totalRevenue)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{product.totalQuantity}</TableCell>
                          <TableCell align="right">{formatCurrency(product.averagePrice)}</TableCell>
                          <TableCell align="right">{product.invoiceCount}</TableCell>
                          <TableCell>
                            <Chip 
                              label={product.category || 'General'} 
                              size="small" 
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
            </Paper>
          )}
        </Container>
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}