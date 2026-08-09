"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Stack,
  Chip,
  Avatar,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
  Tab,
  Tabs
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ShowChart as ShowChartIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  DateRange as DateRangeIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon,
  CompareArrows as CompareIcon
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
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Scatter,
  ScatterChart,
  ZAxis
} from 'recharts';

interface InventoryAnalyticsProps {
  stats: any;
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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

export default function InventoryAnalytics({ stats }: InventoryAnalyticsProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);

  const [analyticsData, setAnalyticsData] = useState({
    salesTrends: [
      { month: 'Jan', sales: 4000, purchases: 2400, profit: 1600 },
      { month: 'Feb', sales: 3000, purchases: 1398, profit: 1602 },
      { month: 'Mar', sales: 2000, purchases: 9800, profit: -7800 },
      { month: 'Apr', sales: 2780, purchases: 3908, profit: -1128 },
      { month: 'May', sales: 1890, purchases: 4800, profit: -2910 },
      { month: 'Jun', sales: 2390, purchases: 3800, profit: -1410 },
      { month: 'Jul', sales: 3490, purchases: 4300, profit: -810 }
    ],
    categoryPerformance: [
      { category: 'Electronics', revenue: 45000, profit: 12000, margin: 26.7, turnover: 4.2 },
      { category: 'Clothing', revenue: 32000, profit: 8500, margin: 26.6, turnover: 3.8 },
      { category: 'Books', revenue: 28000, profit: 7200, margin: 25.7, turnover: 5.1 },
      { category: 'Home & Garden', revenue: 22000, profit: 5800, margin: 26.4, turnover: 3.2 },
      { category: 'Sports', revenue: 18000, profit: 4200, margin: 23.3, turnover: 2.9 }
    ],
    inventoryTurnover: [
      { product: 'Product A', turnover: 8.5, avgStock: 120, sales: 1020 },
      { product: 'Product B', turnover: 6.2, avgStock: 95, sales: 589 },
      { product: 'Product C', turnover: 4.8, avgStock: 150, sales: 720 },
      { product: 'Product D', turnover: 3.9, avgStock: 200, sales: 780 },
      { product: 'Product E', turnover: 2.1, avgStock: 180, sales: 378 }
    ],
    stockMovements: [
      { date: '2024-01-01', inbound: 150, outbound: 120, adjustments: -5 },
      { date: '2024-01-02', inbound: 200, outbound: 180, adjustments: 0 },
      { date: '2024-01-03', inbound: 100, outbound: 150, adjustments: -10 },
      { date: '2024-01-04', inbound: 250, outbound: 200, adjustments: 5 },
      { date: '2024-01-05', inbound: 180, outbound: 160, adjustments: -2 },
      { date: '2024-01-06', inbound: 220, outbound: 190, adjustments: 0 },
      { date: '2024-01-07', inbound: 160, outbound: 140, adjustments: -8 }
    ],
    profitabilityAnalysis: [
      { product: 'Product A', cost: 100, price: 150, profit: 50, margin: 33.3, volume: 200 },
      { product: 'Product B', cost: 80, price: 120, profit: 40, margin: 33.3, volume: 150 },
      { product: 'Product C', cost: 120, price: 160, profit: 40, margin: 25.0, volume: 180 },
      { product: 'Product D', cost: 200, price: 250, profit: 50, margin: 20.0, volume: 100 },
      { product: 'Product E', cost: 60, price: 75, profit: 15, margin: 20.0, volume: 300 }
    ],
    seasonalTrends: [
      { month: 'Jan', electronics: 4000, clothing: 2000, books: 1500, sports: 1000 },
      { month: 'Feb', electronics: 3500, clothing: 2200, books: 1600, sports: 1100 },
      { month: 'Mar', electronics: 4200, clothing: 2800, books: 1400, sports: 1300 },
      { month: 'Apr', electronics: 3800, clothing: 3200, books: 1300, sports: 1500 },
      { month: 'May', electronics: 4100, clothing: 3500, books: 1200, sports: 1800 },
      { month: 'Jun', electronics: 4500, clothing: 3800, books: 1100, sports: 2000 }
    ],
    abcAnalysis: [
      { category: 'A', products: 20, revenue: 80, description: 'High Value Items' },
      { category: 'B', products: 30, revenue: 15, description: 'Medium Value Items' },
      { category: 'C', products: 50, revenue: 5, description: 'Low Value Items' }
    ],
    supplierPerformance: [
      { supplier: 'Supplier A', orders: 25, onTime: 92, quality: 95, cost: 88 },
      { supplier: 'Supplier B', orders: 18, onTime: 88, quality: 90, cost: 92 },
      { supplier: 'Supplier C', orders: 22, onTime: 95, quality: 88, cost: 85 },
      { supplier: 'Supplier D', orders: 15, onTime: 85, quality: 92, cost: 90 }
    ]
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exporting analytics data as ${format}`);
    // Implement export functionality
  };

  const MetricCard = ({ title, value, change, icon, color }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Avatar sx={{ bgcolor: `${color}.main` }}>
            {icon}
          </Avatar>
          <Chip
            size="small"
            icon={change >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
            label={`${change >= 0 ? '+' : ''}${change}%`}
            color={change >= 0 ? 'success' : 'error'}
            variant="outlined"
          />
        </Box>
        <Typography variant="h4" component="div" color={`${color}.main`} gutterBottom>
          {value}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Analytics Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                <AnalyticsIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Inventory Analytics
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Comprehensive insights and performance metrics
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={1}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  label="Time Range"
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <MenuItem value="7d">7 Days</MenuItem>
                  <MenuItem value="30d">30 Days</MenuItem>
                  <MenuItem value="90d">90 Days</MenuItem>
                  <MenuItem value="1y">1 Year</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="electronics">Electronics</MenuItem>
                  <MenuItem value="clothing">Clothing</MenuItem>
                  <MenuItem value="books">Books</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('pdf')}
              >
                Export
              </Button>

              <IconButton onClick={() => setLoading(true)}>
                <RefreshIcon />
              </IconButton>
            </Stack>
          </Box>

          {/* Key Metrics */}
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <MetricCard
                title="Revenue Growth"
                value="12.5%"
                change={2.3}
                icon={<MoneyIcon />}
                color="success"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <MetricCard
                title="Inventory Turnover"
                value="4.2x"
                change={-0.8}
                icon={<SpeedIcon />}
                color="primary"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <MetricCard
                title="Profit Margin"
                value="26.8%"
                change={1.5}
                icon={<TrendingUpIcon />}
                color="info"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <MetricCard
                title="Stock Accuracy"
                value="98.5%"
                change={0.3}
                icon={<AssessmentIcon />}
                color="warning"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Sales Trends" icon={<ShowChartIcon />} iconPosition="start" />
            <Tab label="Category Analysis" icon={<CategoryIcon />} iconPosition="start" />
            <Tab label="Inventory Turnover" icon={<SpeedIcon />} iconPosition="start" />
            <Tab label="Profitability" icon={<MoneyIcon />} iconPosition="start" />
            <Tab label="Stock Movements" icon={<TimelineIcon />} iconPosition="start" />
            <Tab label="ABC Analysis" icon={<PieChartIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Sales Trends Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Sales vs Purchases Trend
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={analyticsData.salesTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="purchases" fill="#8884d8" name="Purchases" />
                  <Line type="monotone" dataKey="sales" stroke="#82ca9d" name="Sales" strokeWidth={3} />
                  <Line type="monotone" dataKey="profit" stroke="#ff7300" name="Profit" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Seasonal Trends by Category
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.seasonalTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Area type="monotone" dataKey="electronics" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="clothing" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                  <Area type="monotone" dataKey="books" stackId="1" stroke="#ffc658" fill="#ffc658" />
                  <Area type="monotone" dataKey="sports" stackId="1" stroke="#ff7c7c" fill="#ff7c7c" />
                </AreaChart>
              </ResponsiveContainer>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Growth Rate Analysis
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.salesTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} name="Sales Growth" />
                  <Line type="monotone" dataKey="profit" stroke="#82ca9d" strokeWidth={2} name="Profit Growth" />
                </LineChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Category Analysis Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Category Performance Comparison
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.categoryPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                  <Bar dataKey="profit" fill="#82ca9d" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Revenue Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={analyticsData.categoryPerformance}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, revenue }) => `${category}: ₹${(revenue/1000).toFixed(0)}K`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {analyticsData.categoryPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Category Performance Radar
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={analyticsData.categoryPerformance}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={90} domain={[0, 50]} />
                  <Radar name="Profit Margin" dataKey="margin" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Radar name="Turnover" dataKey="turnover" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Inventory Turnover Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Product Turnover Analysis
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={analyticsData.inventoryTurnover}>
                  <CartesianGrid />
                  <XAxis type="number" dataKey="avgStock" name="Average Stock" />
                  <YAxis type="number" dataKey="turnover" name="Turnover Rate" />
                  <ZAxis type="number" dataKey="sales" range={[50, 400]} />
                  <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Products" data={analyticsData.inventoryTurnover} fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Turnover Rate by Product
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.inventoryTurnover} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="product" type="category" width={80} />
                  <RechartsTooltip />
                  <Bar dataKey="turnover" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Stock vs Sales Correlation
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.inventoryTurnover}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avgStock" stroke="#8884d8" name="Avg Stock" />
                  <Line type="monotone" dataKey="sales" stroke="#82ca9d" name="Sales" />
                </LineChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Profitability Tab */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Profitability Analysis by Product
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={analyticsData.profitabilityAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="cost" fill="#ff7c7c" name="Cost" />
                  <Bar dataKey="price" fill="#8884d8" name="Price" />
                  <Line type="monotone" dataKey="margin" stroke="#82ca9d" strokeWidth={3} name="Margin %" />
                </ComposedChart>
              </ResponsiveContainer>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Profit Margin Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.profitabilityAnalysis}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="profit"
                    label={({ product, margin }) => `${product}: ${margin}%`}
                  >
                    {analyticsData.profitabilityAnalysis.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Volume vs Margin Analysis
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={analyticsData.profitabilityAnalysis}>
                  <CartesianGrid />
                  <XAxis type="number" dataKey="volume" name="Volume" />
                  <YAxis type="number" dataKey="margin" name="Margin %" />
                  <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Products" data={analyticsData.profitabilityAnalysis} fill="#82ca9d" />
                </ScatterChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Stock Movements Tab */}
        <TabPanel value={activeTab} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Daily Stock Movements
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={analyticsData.stockMovements}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="inbound" fill="#82ca9d" name="Inbound" />
                  <Bar dataKey="outbound" fill="#8884d8" name="Outbound" />
                  <Line type="monotone" dataKey="adjustments" stroke="#ff7300" strokeWidth={2} name="Adjustments" />
                </ComposedChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
        </TabPanel>

        {/* ABC Analysis Tab */}
        <TabPanel value={activeTab} index={5}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                ABC Analysis - Product Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.abcAnalysis}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="products"
                    label={({ category, products }) => `${category}: ${products}%`}
                  >
                    {analyticsData.abcAnalysis.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                ABC Analysis - Revenue Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.abcAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="revenue" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Supplier Performance Radar
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={analyticsData.supplierPerformance}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="supplier" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="On Time %" dataKey="onTime" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Radar name="Quality %" dataKey="quality" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  <Radar name="Cost Score" dataKey="cost" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
}