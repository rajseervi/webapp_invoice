import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
  IconButton,
  TextField,
  InputAdornment,
  Avatar
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Add as AddIcon,
  AttachMoney as AttachMoneyIcon,
  ShoppingCart as ShoppingCartIcon,
  Person as PersonIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

// Define interfaces
interface SalesStat {
  name: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  status: string;
  date: string;
}

interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  category: string;
}

interface TopCustomer {
  id: string;
  name: string;
  totalPurchases: number;
  lastPurchase: string;
}

interface MonthlySales {
  name: string;
  sales: number;
  target: number;
}

interface CategorySales {
  name: string;
  value: number;
}

interface DailySales {
  date: string;
  amount: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function NewDashboard() {
  const theme = useTheme();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SalesStat[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [monthlySalesData, setMonthlySalesData] = useState<MonthlySales[]>([]);
  const [categorySalesData, setCategorySalesData] = useState<CategorySales[]>([]);
  const [dailySalesData, setDailySalesData] = useState<DailySales[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<TopCustomer[]>([]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch sales stats
        const mockStats: SalesStat[] = [
          { 
            name: 'Today\'s Sales', 
            value: 4250, 
            change: 12, 
            icon: <TrendingUpIcon />, 
            color: theme.palette.primary.main 
          },
          { 
            name: 'Products', 
            value: 156, 
            change: 8, 
            icon: <InventoryIcon />, 
            color: theme.palette.success.main 
          },
          { 
            name: 'Invoices', 
            value: 89, 
            change: 23, 
            icon: <ReceiptIcon />, 
            color: theme.palette.info.main 
          },
          { 
            name: 'Customers', 
            value: 42, 
            change: 15, 
            icon: <PeopleIcon />, 
            color: theme.palette.warning.main 
          }
        ];
        setStats(mockStats);
        
        // Fetch recent invoices
        try {
          const invoicesRef = collection(db, 'invoices');
          const recentInvoicesQuery = query(
            invoicesRef,
            orderBy('createdAt', 'desc'),
            limit(5)
          );
          
          const invoicesSnapshot = await getDocs(recentInvoicesQuery);
          const invoicesData = invoicesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              invoiceNumber: data.invoiceNumber,
              customerName: data.partyName,
              amount: data.total || 0,
              status: 'completed',
              date: data.date || data.createdAt
            };
          });
          
          if (invoicesData.length > 0) {
            setRecentInvoices(invoicesData);
          } else {
            // Use mock data if no invoices found
            setRecentInvoices([
              {
                id: '1',
                invoiceNumber: 'INV-2023-0045',
                customerName: 'Acme Corp',
                amount: 1250.00,
                status: 'paid',
                date: new Date(Date.now() - 3600000).toISOString()
              },
              {
                id: '2',
                invoiceNumber: 'INV-2023-0044',
                customerName: 'XYZ Industries',
                amount: 875.50,
                status: 'pending',
                date: new Date(Date.now() - 7200000).toISOString()
              },
              {
                id: '3',
                invoiceNumber: 'INV-2023-0043',
                customerName: 'Global Tech',
                amount: 2340.00,
                status: 'paid',
                date: new Date(Date.now() - 10800000).toISOString()
              },
              {
                id: '4',
                invoiceNumber: 'INV-2023-0042',
                customerName: 'Local Business',
                amount: 450.75,
                status: 'overdue',
                date: new Date(Date.now() - 14400000).toISOString()
              },
              {
                id: '5',
                invoiceNumber: 'INV-2023-0041',
                customerName: 'Tech Solutions',
                amount: 1875.25,
                status: 'paid',
                date: new Date(Date.now() - 18000000).toISOString()
              }
            ]);
          }
        } catch (err) {
          console.error('Error fetching invoices:', err);
          // Use mock data if Firestore query fails
          setRecentInvoices([
            {
              id: '1',
              invoiceNumber: 'INV-2023-0045',
              customerName: 'Acme Corp',
              amount: 1250.00,
              status: 'paid',
              date: new Date(Date.now() - 3600000).toISOString()
            },
            {
              id: '2',
              invoiceNumber: 'INV-2023-0044',
              customerName: 'XYZ Industries',
              amount: 875.50,
              status: 'pending',
              date: new Date(Date.now() - 7200000).toISOString()
            },
            {
              id: '3',
              invoiceNumber: 'INV-2023-0043',
              customerName: 'Global Tech',
              amount: 2340.00,
              status: 'paid',
              date: new Date(Date.now() - 10800000).toISOString()
            },
            {
              id: '4',
              invoiceNumber: 'INV-2023-0042',
              customerName: 'Local Business',
              amount: 450.75,
              status: 'overdue',
              date: new Date(Date.now() - 14400000).toISOString()
            },
            {
              id: '5',
              invoiceNumber: 'INV-2023-0041',
              customerName: 'Tech Solutions',
              amount: 1875.25,
              status: 'paid',
              date: new Date(Date.now() - 18000000).toISOString()
            }
          ]);
        }
        
        // Fetch low stock items
        try {
          const productsRef = collection(db, 'products');
          const lowStockQuery = query(
            productsRef,
            where('stock', '<', 10),
            orderBy('stock', 'asc'),
            limit(5)
          );
          
          const lowStockSnapshot = await getDocs(lowStockQuery);
          const lowStockData = lowStockSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name,
              stock: data.stock,
              category: data.category
            };
          });
          setLowStockItems(lowStockData);
        } catch (err) {
          console.error('Error fetching low stock items:', err);
          // Use mock data if Firestore query fails
          setLowStockItems([
            { id: '1', name: 'Laptop XPS 15', stock: 3, category: 'Electronics' },
            { id: '2', name: 'Wireless Mouse', stock: 5, category: 'Accessories' },
            { id: '3', name: 'USB-C Cable', stock: 7, category: 'Accessories' },
            { id: '4', name: 'Bluetooth Speaker', stock: 2, category: 'Electronics' },
            { id: '5', name: 'Mechanical Keyboard', stock: 4, category: 'Accessories' }
          ]);
        }
        
        // Fetch top customers
        try {
          const partiesRef = collection(db, 'parties');
          const partiesSnapshot = await getDocs(partiesRef);
          
          // This is a simplified approach - in a real app, you would calculate
          // top customers based on their total purchases from invoices
          const customersData = partiesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name,
              totalPurchases: Math.floor(Math.random() * 10000) + 1000, // Mock data
              lastPurchase: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString()
            };
          }).sort((a, b) => b.totalPurchases - a.totalPurchases).slice(0, 5);
          
          if (customersData.length > 0) {
            setTopCustomers(customersData);
            setFilteredCustomers(customersData);
          } else {
            // Use mock data if no customers found
            const mockTopCustomers = [
              {
                id: '1',
                name: 'Acme Corp',
                totalPurchases: 12500.00,
                lastPurchase: new Date(Date.now() - 86400000).toISOString()
              },
              {
                id: '2',
                name: 'XYZ Industries',
                totalPurchases: 8750.50,
                lastPurchase: new Date(Date.now() - 172800000).toISOString()
              },
              {
                id: '3',
                name: 'Global Tech',
                totalPurchases: 6340.00,
                lastPurchase: new Date(Date.now() - 259200000).toISOString()
              },
              {
                id: '4',
                name: 'Local Business',
                totalPurchases: 4500.75,
                lastPurchase: new Date(Date.now() - 345600000).toISOString()
              },
              {
                id: '5',
                name: 'Tech Solutions',
                totalPurchases: 3875.25,
                lastPurchase: new Date(Date.now() - 432000000).toISOString()
              }
            ];
            setTopCustomers(mockTopCustomers);
            setFilteredCustomers(mockTopCustomers);
          }
        } catch (err) {
          console.error('Error fetching top customers:', err);
          // Use mock data if Firestore query fails
          const mockTopCustomers = [
            {
              id: '1',
              name: 'Acme Corp',
              totalPurchases: 12500.00,
              lastPurchase: new Date(Date.now() - 86400000).toISOString()
            },
            {
              id: '2',
              name: 'XYZ Industries',
              totalPurchases: 8750.50,
              lastPurchase: new Date(Date.now() - 172800000).toISOString()
            },
            {
              id: '3',
              name: 'Global Tech',
              totalPurchases: 6340.00,
              lastPurchase: new Date(Date.now() - 259200000).toISOString()
            },
            {
              id: '4',
              name: 'Local Business',
              totalPurchases: 4500.75,
              lastPurchase: new Date(Date.now() - 345600000).toISOString()
            },
            {
              id: '5',
              name: 'Tech Solutions',
              totalPurchases: 3875.25,
              lastPurchase: new Date(Date.now() - 432000000).toISOString()
            }
          ];
          setTopCustomers(mockTopCustomers);
          setFilteredCustomers(mockTopCustomers);
        }
        
        // Generate monthly sales data for chart
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        
        const monthlySales = months.map((month, index) => {
          // Generate realistic sales data with an upward trend and seasonal variations
          const baseSales = 5000 + (index * 500); // Base increasing trend
          const seasonalFactor = 1 + 0.3 * Math.sin((index / 12) * 2 * Math.PI); // Seasonal variation
          const randomFactor = 0.8 + (Math.random() * 0.4); // Random variation between 0.8 and 1.2
          
          const sales = Math.round(baseSales * seasonalFactor * randomFactor);
          const target = Math.round(sales * (1 + (Math.random() * 0.3))); // Target is 0-30% higher than actual
          
          return {
            name: month,
            sales: sales,
            target: target
          };
        });
        
        // Only show the last 6 months
        const lastSixMonths = [];
        for (let i = 0; i < 6; i++) {
          const monthIndex = (currentMonth - 5 + i + 12) % 12; // Ensure positive index
          lastSixMonths.push(monthlySales[monthIndex]);
        }
        
        setMonthlySalesData(lastSixMonths);
        
        // Generate category sales data for pie chart
        const categories = [
          { name: 'Electronics', value: 35 },
          { name: 'Clothing', value: 25 },
          { name: 'Food', value: 20 },
          { name: 'Books', value: 10 },
          { name: 'Others', value: 10 }
        ];
        setCategorySalesData(categories);
        
        // Generate daily sales data for area chart
        const dailySales = [];
        const today = new Date();
        
        for (let i = 30; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          
          // Generate sales with weekly pattern (weekends have higher sales)
          const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          
          const baseSales = isWeekend ? 2000 : 1000;
          const randomFactor = 0.7 + (Math.random() * 0.6); // Random variation
          
          dailySales.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            amount: Math.round(baseSales * randomFactor)
          });
        }
        
        setDailySalesData(dailySales);
        
        setError(null);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to fetch dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [theme.palette]);

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

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get status color
  const getStatusColor = (status: string) => {
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

  // Get customer initial for avatar
  const getCustomerInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Get random color for customer avatar
  const getCustomerAvatarColor = (id: string) => {
    const colors = [
      '#1976d2', '#388e3c', '#d32f2f', '#f57c00', '#7b1fa2',
      '#0288d1', '#689f38', '#e64a19', '#fbc02d', '#512da8'
    ];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            startIcon={<ReceiptIcon />}
            onClick={() => router.push('/invoices/new')}
            sx={{ bgcolor: theme.palette.success.main, '&:hover': { bgcolor: theme.palette.success.dark } }}
          >
            New Invoice
          </Button>
          <Button 
            variant="contained" 
            startIcon={<PersonIcon />}
            onClick={() => router.push('/parties')}
          >
            New Customer
          </Button>
        </Box>
      </Box>
      
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
            {stats.map((stat, index) => (
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
            <Grid item xs={12} md={8}>
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
                        formatter={(value) => formatCurrency(value as number)}
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
            </Grid>
            
            {/* Category Sales Pie Chart */}
            <Grid item xs={12} md={4}>
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
            
            {/* Daily Sales Trend */}
            <Grid item xs={12}>
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
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        name="Sales" 
                        stroke={theme.palette.primary.main}
                        fill={`${theme.palette.primary.main}20`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
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
                                    color={getStatusColor(invoice.status) as any} 
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
  );
}