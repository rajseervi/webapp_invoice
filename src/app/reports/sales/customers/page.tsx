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
  Alert,
  Badge
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
  ScatterChart,
  Scatter,
  LineChart,
  Line
} from 'recharts';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
  Assessment as AssessmentIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';

interface CustomerSalesData {
  customerName: string;
  totalRevenue: number;
  totalInvoices: number;
  averageOrderValue: number;
  lastOrderDate?: Date;
  firstOrderDate?: Date;
  phone?: string;
  email?: string;
  address?: string;
  rank: number;
  customerSince?: number; // days
  frequency: 'High' | 'Medium' | 'Low';
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

export default function SalesCustomersPage() {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 6)),
    end: new Date(),
  });
  const [customerSales, setCustomerSales] = useState<CustomerSalesData[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerSalesData[]>([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'revenue' | 'invoices' | 'average' | 'recent'>('revenue');
  const [topCount, setTopCount] = useState(10);

  useEffect(() => {
    fetchCustomerSales();
  }, [dateRange]);

  useEffect(() => {
    filterAndSortCustomers();
  }, [customerSales, searchTerm, sortBy, topCount]);

  const fetchCustomerSales = async () => {
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
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));

      // Get customer data from parties collection
      const partiesRef = collection(db, 'parties');
      const partiesSnapshot = await getDocs(partiesRef);
      const partiesMap = new Map();
      partiesSnapshot.docs.forEach(doc => {
        const party = doc.data();
        partiesMap.set(party.name || doc.id, {
          phone: party.phone,
          email: party.email,
          address: party.address
        });
      });

      // Aggregate customer sales data
      const customerMap: Record<string, {
        revenue: number;
        invoiceCount: number;
        orderDates: Date[];
        customerInfo?: any;
      }> = {};

      invoices.forEach(invoice => {
        const customerName = invoice.customer?.name || invoice.partyName || 'Unknown Customer';
        const totalAmount = Number(invoice.totalAmount) || 0;
        const orderDate = new Date(invoice.createdAt);

        if (!customerMap[customerName]) {
          customerMap[customerName] = {
            revenue: 0,
            invoiceCount: 0,
            orderDates: [],
            customerInfo: partiesMap.get(customerName)
          };
        }

        customerMap[customerName].revenue += totalAmount;
        customerMap[customerName].invoiceCount += 1;
        customerMap[customerName].orderDates.push(orderDate);
      });

      // Convert to array and calculate additional metrics
      const customerArray: CustomerSalesData[] = Object.entries(customerMap)
        .map(([customerName, data], index) => {
          const sortedDates = data.orderDates.sort((a, b) => b.getTime() - a.getTime());
          const lastOrderDate = sortedDates[0];
          const firstOrderDate = sortedDates[sortedDates.length - 1];
          const customerSince = firstOrderDate 
            ? Math.floor((new Date().getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          // Calculate frequency based on order count and time span
          let frequency: 'High' | 'Medium' | 'Low' = 'Low';
          if (data.invoiceCount >= 10) frequency = 'High';
          else if (data.invoiceCount >= 5) frequency = 'Medium';

          return {
            customerName,
            totalRevenue: data.revenue,
            totalInvoices: data.invoiceCount,
            averageOrderValue: data.invoiceCount > 0 ? data.revenue / data.invoiceCount : 0,
            lastOrderDate,
            firstOrderDate,
            customerSince,
            frequency,
            phone: data.customerInfo?.phone,
            email: data.customerInfo?.email,
            address: data.customerInfo?.address,
            rank: index + 1
          };
        })
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .map((customer, index) => ({ ...customer, rank: index + 1 }));

      setCustomerSales(customerArray);
    } catch (error) {
      console.error('Error fetching customer sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCustomers = () => {
    let filtered = customerSales.filter(customer =>
      customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm)) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort by selected criteria
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'invoices':
          return b.totalInvoices - a.totalInvoices;
        case 'average':
          return b.averageOrderValue - a.averageOrderValue;
        case 'recent':
          if (!a.lastOrderDate || !b.lastOrderDate) return 0;
          return b.lastOrderDate.getTime() - a.lastOrderDate.getTime();
        case 'revenue':
        default:
          return b.totalRevenue - a.totalRevenue;
      }
    });

    setFilteredCustomers(filtered.slice(0, topCount));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // TODO: Implement CSV download
    console.log('Download customers report');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN');
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'High': return 'success';
      case 'Medium': return 'warning';
      case 'Low': return 'default';
      default: return 'default';
    }
  };

  const getRankColor = (rank: number) => {
    if (rank <= 3) return 'success';
    if (rank <= 10) return 'primary';
    if (rank <= 20) return 'warning';
    return 'default';
  };

  const totalRevenue = customerSales.reduce((sum, customer) => sum + customer.totalRevenue, 0);
  const totalCustomers = customerSales.length;
  const avgRevenuePerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
  const totalInvoices = customerSales.reduce((sum, customer) => sum + customer.totalInvoices, 0);

  // Prepare chart data
  const pieChartData = filteredCustomers.map(customer => ({
    name: customer.customerName.length > 20 
      ? `${customer.customerName.substring(0, 20)}...` 
      : customer.customerName,
    value: customer.totalRevenue,
    fullName: customer.customerName
  }));

  // Customer segmentation data
  const segmentationData = [
    { segment: 'High Value (>50K)', count: customerSales.filter(c => c.totalRevenue > 50000).length },
    { segment: 'Medium Value (10K-50K)', count: customerSales.filter(c => c.totalRevenue > 10000 && c.totalRevenue <= 50000).length },
    { segment: 'Low Value (<10K)', count: customerSales.filter(c => c.totalRevenue <= 10000).length },
  ];

  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Customer Sales Analysis"
        subtitle="Analyze customer performance and relationship insights"
        pageType="reports"
        enableVisualEffects={true}
        enableParticles={false}
        customQuickActions={[
          { icon: <RefreshIcon />, label: 'Refresh', onClick: fetchCustomerSales },
          { icon: <DownloadIcon />, label: 'Export', onClick: handleDownload },
          { icon: <PrintIcon />, label: 'Print', onClick: handlePrint },
        ]}
      >
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          {/* Filters */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
              Customer Analysis Filters
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
                  placeholder="Search customers..."
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
                    <MenuItem value="invoices">Invoices</MenuItem>
                    <MenuItem value="average">Avg Order</MenuItem>
                    <MenuItem value="recent">Recent Activity</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Top Customers</InputLabel>
                  <Select
                    value={topCount}
                    label="Top Customers"
                    onChange={(e) => setTopCount(Number(e.target.value))}
                  >
                    <MenuItem value={10}>Top 10</MenuItem>
                    <MenuItem value={20}>Top 20</MenuItem>
                    <MenuItem value={50}>Top 50</MenuItem>
                    <MenuItem value={100}>All</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <Button
                  variant="contained"
                  onClick={fetchCustomerSales}
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

          {customerSales.length === 0 && !loading && (
            <Alert severity="info" sx={{ mb: 4 }}>
              No customer sales data found for the selected date range.
            </Alert>
          )}

          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Total Revenue</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(totalRevenue)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    From {totalCustomers} customers
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Total Customers</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {totalCustomers}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Unique customers
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Avg Revenue/Customer</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(avgRevenuePerCustomer)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Customer lifetime value
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Total Orders</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {totalInvoices}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    {totalCustomers > 0 ? (totalInvoices / totalCustomers).toFixed(1) : 0} avg per customer
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {customerSales.length > 0 && (
            <Paper sx={{ width: '100%' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="customer analysis tabs">
                  <Tab icon={<PieChart />} label="Revenue Distribution" iconPosition="start" />
                  <Tab icon={<BarChart />} label="Customer Segments" iconPosition="start" />
                  <Tab icon={<AssessmentIcon />} label="Customer Details" iconPosition="start" />
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

              {/* Customer Segments */}
              <TabPanel value={tabValue} index={1}>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Customer Value Segments</Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer>
                        <BarChart data={segmentationData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="segment" fontSize={12} />
                          <YAxis />
                          <RechartsTooltip />
                          <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Top Performers</Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer>
                        <BarChart 
                          data={filteredCustomers.slice(0, 5)}
                          layout="horizontal"
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="customerName" type="category" fontSize={10} width={100} />
                          <RechartsTooltip formatter={(value) => formatCurrency(value as number)} />
                          <Bar dataKey="totalRevenue" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* Customer Details */}
              <TabPanel value={tabValue} index={2}>
                <TableContainer sx={{ maxHeight: 600 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Rank</strong></TableCell>
                        <TableCell><strong>Customer</strong></TableCell>
                        <TableCell align="right"><strong>Revenue</strong></TableCell>
                        <TableCell align="right"><strong>Orders</strong></TableCell>
                        <TableCell align="right"><strong>Avg Order</strong></TableCell>
                        <TableCell><strong>Frequency</strong></TableCell>
                        <TableCell><strong>Last Order</strong></TableCell>
                        <TableCell><strong>Contact</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(searchTerm ? filteredCustomers : customerSales).map((customer) => (
                        <TableRow key={customer.customerName} hover>
                          <TableCell>
                            <Chip
                              icon={customer.rank <= 3 ? <StarIcon /> : <TrendingUpIcon />}
                              label={`#${customer.rank}`}
                              color={getRankColor(customer.rank) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 32, height: 32 }}>
                                {customer.customerName.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {customer.customerName}
                                </Typography>
                                {customer.customerSince && (
                                  <Typography variant="caption" color="text.secondary">
                                    Customer since {customer.customerSince} days
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="medium">
                              {formatCurrency(customer.totalRevenue)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Badge badgeContent={customer.totalInvoices} color="primary">
                              📊
                            </Badge>
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(customer.averageOrderValue)}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={customer.frequency}
                              color={getFrequencyColor(customer.frequency) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {customer.lastOrderDate ? formatDate(customer.lastOrderDate) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Box>
                              {customer.phone && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                  <PhoneIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                  <Typography variant="caption">{customer.phone}</Typography>
                                </Box>
                              )}
                              {customer.email && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <EmailIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                  <Typography variant="caption">{customer.email}</Typography>
                                </Box>
                              )}
                            </Box>
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