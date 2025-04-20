"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  TextField,
  InputAdornment,
  Avatar,
  IconButton,
  Paper,
  Typography,
  Button,
  useTheme,
  Container,
  Alert
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

// Import custom hook for data fetching and layout component
import { useDashboardData } from './hooks/useDashboardData';
// import DashboardLayout from '@app/components/DashboardLayout';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
// Import utility functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const getStatusColor = (status) => {
  switch (status) {
    case 'paid':
      return 'success';
    case 'pending':
      return 'warning';
    case 'overdue':
      return 'error';
    default:
      return 'default';
  }
};

const getCustomerInitial = (name) => {
  return name.charAt(0).toUpperCase();
};

const getCustomerAvatarColor = (id) => {
  const colors = [
    '#1976d2', '#388e3c', '#d32f2f', '#f57c00', '#7b1fa2',
    '#0288d1', '#689f38', '#e64a19', '#fbc02d', '#512da8'
  ];
  const index = id.charCodeAt(0) % colors.length;
  return colors[index];
};

// Define color constants
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Dashboard() {
  const theme = useTheme();
  const router = useRouter();
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  
  // Use custom hook to fetch dashboard data
  const { 
    stats, 
    recentInvoices, 
    lowStockItems, 
    topCustomers, 
    monthlySalesData, 
    categorySalesData, 
    dailySalesData, 
    loading, 
    error, 
    refetch 
  } = useDashboardData();

  // Add icons to stats
  const statsWithIcons = stats.map((stat, index) => {
    let icon;
    switch (index) {
      case 0:
        icon = <TrendingUpIcon />;
        break;
      case 1:
        icon = <InventoryIcon />;
        break;
      case 2:
        icon = <ReceiptIcon />;
        break;
      case 3:
        icon = <PeopleIcon />;
        break;
      default:
        icon = <TrendingUpIcon />;
    }
    return { ...stat, icon };
  });

  // Filter customers based on search query
  useEffect(() => {
    if (customerSearchQuery.trim() === '') {
      setFilteredCustomers(topCustomers);
    } else {
      const filtered = topCustomers.filter(customer => 
        customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  }, [customerSearchQuery, topCustomers]);

  return (
    <DashboardLayout>
      <Container maxWidth="lg">
        
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {statsWithIcons.map((stat, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card sx={{ 
                    height: '100%', 
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 20px rgba(0,0,0,0.1)'
                    }
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            {stat.name}
                          </Typography>
                          <Typography variant="h4" sx={{ my: 1, fontWeight: 600 }}>
                            {stat.name === 'Today\'s Sales' ? formatCurrency(stat.value) : stat.value.toLocaleString()}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography 
                              variant="body2" 
                              color={stat.change >= 0 ? 'success.main' : 'error.main'}
                              sx={{ display: 'flex', alignItems: 'center', fontWeight: 500 }}
                            >
                              {stat.change >= 0 ? '+' : ''}{stat.change}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                              vs last month
                            </Typography>
                          </Box>
                        </Box>
                        <Box 
                          sx={{ 
                            p: 1.5, 
                            borderRadius: '50%', 
                            bgcolor: `${stat.color}20`
                          }}
                        >
                          <Box sx={{ color: stat.color }}>
                            {stat.icon}
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {/* Charts Section */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Monthly Sales Chart */}
            {/*   <Grid item xs={12} md={8}>
                <Paper sx={{ 
                  p: 3, 
                  height: '100%', 
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                  <Typography variant="h6" gutterBottom>
                    Monthly Sales Performance
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Comparison of actual sales vs targets for the last 6 months
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlySalesData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => formatCurrency(value)}
                          labelStyle={{ fontWeight: 'bold' }}
                        />
                        <Legend />
                        <Bar 
                          dataKey="sales" 
                          name="Actual Sales" 
                          fill={theme.palette.primary.main} 
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          dataKey="target" 
                          name="Target" 
                          fill={theme.palette.grey[300]} 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid> */}
              
              {/* Category Sales Pie Chart */}
              {/* <Grid item xs={12} md={4}>
                <Paper sx={{ 
                  p: 3, 
                  height: '100%', 
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                  <Typography variant="h6" gutterBottom>
                    Sales by Category
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Distribution of sales across product categories
                  </Typography>
                  <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categorySalesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {categorySalesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
             */}  
              {/* Daily Sales Trend */}
            {/*   <Grid item xs={12}>
                <Paper sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                  <Typography variant="h6" gutterBottom>
                    Daily Sales Trend
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Sales performance over the last 30 days
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={dailySalesData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            // Show fewer ticks for better readability
                            const index = dailySalesData.findIndex(item => item.date === value);
                            return index % 5 === 0 ? value : '';
                          }}
                        />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Area 
                          type="monotone" Monthly Sales Performance
                          dataKey="amount" 
                          name="Sales" 
                          stroke={theme.palette.primary.main}
                          fill={`${theme.palette.primary.main}20`}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid> */}
            </Grid>
            
            <Grid container spacing={3}>
              {/* Recent Invoices */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ 
                  p: 3, 
                  height: '100%', 
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Recent Invoices</Typography>
                    <Button 
                      size="small" 
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => router.push('/invoices')}
                    >
                      View All
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  {recentInvoices.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No recent invoices found
                    </Typography>
                  ) : (
                    <List sx={{ p: 0 }}>
                      {recentInvoices.map((invoice) => (
                        <ListItem 
                          key={invoice.id} 
                          disablePadding 
                          sx={{ 
                            mb: 1,
                            '&:last-child': { mb: 0 }
                          }}
                        >
                          <ListItemButton 
                            sx={{ 
                              px: 2, 
                              py: 1.5, 
                              borderRadius: 1,
                              '&:hover': { bgcolor: 'action.hover' }
                            }}
                            onClick={() => router.push(`/invoices/${invoice.id}`)}
                          >
                            <ListItemText 
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body1" fontWeight={500}>
                                    {invoice.invoiceNumber}
                                  </Typography>
                                  <Typography variant="body1" fontWeight="bold">
                                    {formatCurrency(invoice.amount)}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <React.Fragment>
                                  <Typography variant="body2" component="span">
                                    {invoice.customerName}
                                  </Typography>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      {formatDate(invoice.date)}
                                    </Typography>
                                    <Chip 
                                      label={invoice.status} 
                                      color={getStatusColor(invoice.status)} 
                                      size="small" 
                                      variant="outlined"
                                    />
                                  </Box>
                                </React.Fragment>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Button 
                      variant="contained" 
                      startIcon={<AddIcon />}
                      onClick={() => router.push('/invoices/new')}
                      fullWidth
                      sx={{ 
                        borderRadius: 2,
                        py: 1,
                        bgcolor: theme.palette.success.main,
                        '&:hover': { bgcolor: theme.palette.success.dark }
                      }}
                    >
                      Create New Invoice
                    </Button>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Top Customers with Quick Invoice */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ 
                  p: 3, 
                  height: '100%', 
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Top Customers</Typography>
                    <Button 
                      size="small" 
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => router.push('/parties')}
                    >
                      View All
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  <TextField
                    fullWidth
                    placeholder="Search customers..."
                    variant="outlined"
                    size="small"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />
                  
                  {filteredCustomers.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No customers found
                    </Typography>
                  ) : (
                    <List sx={{ p: 0 }}>
                      {filteredCustomers.map((customer) => (
                        <ListItem 
                          key={customer.id} 
                          disablePadding 
                          sx={{ 
                            mb: 1,
                            '&:last-child': { mb: 0 }
                          }}
                        >
                          <ListItemButton 
                            sx={{ 
                              px: 2, 
                              py: 1.5, 
                              borderRadius: 1,
                              '&:hover': { bgcolor: 'action.hover' }
                            }}
                            onClick={() => router.push(`/parties?id=${customer.id}`)}
                          >
                            <Avatar 
                              sx={{ 
                                mr: 2, 
                                bgcolor: getCustomerAvatarColor(customer.id),
                                width: 40,
                                height: 40
                              }}
                            >
                              {getCustomerInitial(customer.name)}
                            </Avatar>
                            <ListItemText 
                              primary={
                                <Typography variant="body1" fontWeight={500}>
                                  {customer.name}
                                </Typography>
                              }
                              secondary={
                                <React.Fragment>
                                  <Typography variant="body2" component="span" color="text.secondary">
                                    Total: {formatCurrency(customer.totalPurchases)}
                                  </Typography>
                                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Last purchase: {formatDate(customer.lastPurchase)}
                                  </Typography>
                                </React.Fragment>
                              }
                            />
                            <IconButton 
                              color="primary"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/invoices/new?customer=${customer.id}`);
                              }}
                              sx={{ 
                                ml: 1,
                                bgcolor: `${theme.palette.primary.main}10`,
                                '&:hover': { bgcolor: `${theme.palette.primary.main}20` }
                              }}
                              title="Create invoice for this customer"
                            >
                              <ReceiptIcon fontSize="small" />
                            </IconButton>
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Button 
                      variant="outlined" 
                      startIcon={<PersonIcon />}
                      onClick={() => router.push('/parties')}
                      fullWidth
                      sx={{ 
                        borderRadius: 2,
                        py: 1
                      }}
                    >
                      Add New Customer
                    </Button>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Low Stock Items */}
              <Grid item xs={12}>
                <Paper sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  mt: 3
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Low Stock Items</Typography>
                    <Button 
                      size="small" 
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => router.push('/products')}
                    >
                      View All Products
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  {lowStockItems.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No low stock items found
                    </Typography>
                  ) : (
                    <Grid container spacing={2}>
                      {lowStockItems.map((item) => (
                        <Grid item xs={12} sm={6} md={4} key={item.id}>
                          <Card 
                            variant="outlined" 
                            sx={{ 
                              borderRadius: 2,
                              borderColor: item.stock < 5 ? theme.palette.error.light : theme.palette.warning.light,
                              '&:hover': { 
                                borderColor: item.stock < 5 ? theme.palette.error.main : theme.palette.warning.main,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                  <Typography variant="subtitle1" fontWeight={500}>
                                    {item.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Category: {item.category}
                                  </Typography>
                                </Box>
                                <Chip 
                                  label={`${item.stock} left`} 
                                  color={item.stock < 5 ? 'error' : 'warning'} 
                                  size="small"
                                />
                              </Box>
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => router.push(`/products?id=${item.id}`)}
                                sx={{ mt: 1 }}
                              >
                                Update Stock
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </Container>
    </DashboardLayout>
  );
}