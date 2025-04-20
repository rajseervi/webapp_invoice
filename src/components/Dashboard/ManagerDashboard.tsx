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
  useTheme
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';

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

export default function ManagerDashboard() {
  const theme = useTheme();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SalesStat[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);

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
            name: 'Low Stock Items', 
            value: 12, 
            change: -5, 
            icon: <WarningIcon />, 
            color: theme.palette.warning.main 
          }
        ];
        setStats(mockStats);
        
        // Fetch recent invoices
        // In a real app, you would fetch this from Firestore
        const mockInvoices: RecentInvoice[] = [
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
        ];
        setRecentInvoices(mockInvoices);
        
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
        // In a real app, you would fetch this from Firestore
        const mockTopCustomers: TopCustomer[] = [
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
          }
        ];
        setTopCustomers(mockTopCustomers);
        
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

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Manager Dashboard
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => router.push('/reports/sales')}
        >
          View Sales Reports
        </Button>
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
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          {stat.name}
                        </Typography>
                        <Typography variant="h4">
                          {stat.name === 'Today\'s Sales' ? formatCurrency(stat.value) : stat.value}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <Typography 
                            variant="body2" 
                            color={stat.change >= 0 ? 'success.main' : 'error.main'}
                            sx={{ display: 'flex', alignItems: 'center' }}
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
          
          <Grid container spacing={3}>
            {/* Recent Invoices */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
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
                  <List>
                    {recentInvoices.map((invoice) => (
                      <ListItem key={invoice.id} disablePadding>
                        <ListItemButton sx={{ px: 1, py: 1.5 }}>
                          <ListItemText 
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body1">{invoice.invoiceNumber}</Typography>
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
                                <br />
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
              </Paper>
            </Grid>
            
            {/* Low Stock Items */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Low Stock Items</Typography>
                  <Button 
                    size="small" 
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => router.push('/inventory/alerts')}
                  >
                    View All
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                {lowStockItems.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No low stock items found
                  </Typography>
                ) : (
                  <List>
                    {lowStockItems.map((item) => (
                      <ListItem key={item.id} disablePadding>
                        <ListItemButton sx={{ px: 1, py: 1.5 }}>
                          <ListItemText 
                            primary={item.name}
                            secondary={
                              <React.Fragment>
                                <Typography variant="caption" color="text.secondary">
                                  Category: {item.category}
                                </Typography>
                              </React.Fragment>
                            }
                          />
                          <Chip 
                            label={`Stock: ${item.stock}`} 
                            color="error" 
                            size="small" 
                            variant="outlined"
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>
            
            {/* Top Customers */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Top Customers</Typography>
                  <Button 
                    size="small" 
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => router.push('/parties')}
                  >
                    View All Customers
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                {topCustomers.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No customer data available
                  </Typography>
                ) : (
                  <List>
                    {topCustomers.map((customer) => (
                      <ListItem key={customer.id} disablePadding>
                        <ListItemButton sx={{ px: 1, py: 1.5 }}>
                          <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                              <PeopleIcon />
                            </Avatar>
                          </Box>
                          <ListItemText 
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body1">{customer.name}</Typography>
                                <Typography variant="body1" fontWeight="bold">
                                  {formatCurrency(customer.totalPurchases)}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                Last purchase: {formatDate(customer.lastPurchase)}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
}

// Avatar component for top customers
function Avatar({ children, sx }: { children: React.ReactNode, sx?: any }) {
  return (
    <Box sx={{ 
      width: 40, 
      height: 40, 
      borderRadius: '50%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      color: 'white',
      ...sx
    }}>
      {children}
    </Box>
  );
}