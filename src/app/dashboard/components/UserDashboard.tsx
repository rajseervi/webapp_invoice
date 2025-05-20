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
  ListItemIcon,
  CircularProgress,
  Alert,
  Chip,
  useTheme
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  Category as CategoryIcon,
  People as PeopleIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

// Define interfaces
interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

interface RecentActivity {
  id: string;
  action: string;
  timestamp: string;
  details: string;
}

interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  category: string;
}

export default function UserDashboard() {
  const theme = useTheme();
  const router = useRouter();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Set quick actions
        const actions: QuickAction[] = [
          { 
            id: '1',
            title: 'Add Product', 
            description: 'Create a new product in inventory',
            icon: <InventoryIcon />, 
            path: '/products/new',
            color: theme.palette.primary.main
          },
          { 
            id: '2',
            title: 'Add Category', 
            description: 'Create a new product category',
            icon: <CategoryIcon />, 
            path: '/categories/new',
            color: theme.palette.success.main
          },
          { 
            id: '3',
            title: 'Add Customer', 
            description: 'Add a new customer to the system',
            icon: <PeopleIcon />, 
            path: '/parties/new',
            color: theme.palette.info.main
          },
          { 
            id: '4',
            title: 'Quick Links', 
            description: 'Access your personalized quick links',
            icon: <LinkIcon />, 
            path: '/quick-links',
            color: theme.palette.warning.main
          }
        ];
        setQuickActions(actions);
        
        // Fetch recent activities
        // In a real app, you would fetch this from Firestore based on the current user
        const mockActivities: RecentActivity[] = [
          {
            id: '1',
            action: 'Product Added',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            details: 'You added "Wireless Keyboard" to inventory'
          },
          {
            id: '2',
            action: 'Stock Updated',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            details: 'You updated stock for "Laptop XPS 15"'
          },
          {
            id: '3',
            action: 'Category Created',
            timestamp: new Date(Date.now() - 10800000).toISOString(),
            details: 'You created a new category "Office Supplies"'
          }
        ];
        setRecentActivities(mockActivities);
        
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {currentUser?.displayName || 'User'}
        </Typography>
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
          {/* Quick Actions */}
          <Typography variant="h6" sx={{ mb: 2 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {quickActions.map((action) => (
              <Grid item xs={12} sm={6} md={3} key={action.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                      cursor: 'pointer'
                    }
                  }}
                  onClick={() => router.push(action.path)}
                >
                  <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box 
                      sx={{ 
                        p: 1.5, 
                        borderRadius: '50%', 
                        bgcolor: `${action.color}20`,
                        width: 'fit-content',
                        mb: 2
                      }}
                    >
                      <Box sx={{ color: action.color }}>
                        {action.icon}
                      </Box>
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {action.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                      {action.description}
                    </Typography>
                    <Button 
                      variant="text" 
                      color="primary" 
                      endIcon={<ArrowForwardIcon />}
                      sx={{ alignSelf: 'flex-start', mt: 'auto' }}
                    >
                      Go
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Grid container spacing={3}>
            {/* Recent Activity */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Your Recent Activity</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                {recentActivities.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No recent activities found
                  </Typography>
                ) : (
                  <List>
                    {recentActivities.map((activity) => (
                      <ListItem key={activity.id} disablePadding>
                        <ListItemButton sx={{ px: 1, py: 1.5 }}>
                          <ListItemText 
                            primary={activity.action}
                            secondary={
                              <React.Fragment>
                                <Typography variant="body2" component="span">
                                  {activity.details}
                                </Typography>
                                <br />
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(activity.timestamp)}
                                </Typography>
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
            
            {/* Common Tasks */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Common Tasks
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      startIcon={<InventoryIcon />}
                      onClick={() => router.push('/products')}
                      sx={{ justifyContent: 'flex-start', py: 1.5, textAlign: 'left' }}
                    >
                      Manage Inventory
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      startIcon={<PeopleIcon />}
                      onClick={() => router.push('/parties')}
                      sx={{ justifyContent: 'flex-start', py: 1.5, textAlign: 'left' }}
                    >
                      Manage Customers
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      startIcon={<CategoryIcon />}
                      onClick={() => router.push('/categories')}
                      sx={{ justifyContent: 'flex-start', py: 1.5, textAlign: 'left' }}
                    >
                      Manage Categories
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      startIcon={<WarningIcon />}
                      onClick={() => router.push('/inventory/alerts')}
                      sx={{ justifyContent: 'flex-start', py: 1.5, textAlign: 'left' }}
                    >
                      Stock Alerts
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      startIcon={<ShoppingCartIcon />}
                      onClick={() => router.push('/purchase-orders')}
                      sx={{ justifyContent: 'flex-start', py: 1.5, textAlign: 'left' }}
                    >
                      Purchase Orders
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      startIcon={<Receipt />}
                      onClick={() => router.push('/invoices')}
                      sx={{ justifyContent: 'flex-start', py: 1.5, textAlign: 'left' }}
                    >
                      Invoices
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
}

// Receipt icon component
function Receipt() {
  return <ReceiptIcon />;
}

const UserDashboard = ({ stats, recentInvoices }) => {
  // ... existing code ...

  return (
    <Grid container spacing={3}>
      {/* Stats Cards */}
      {/* ... existing stats cards ... */}

      {/* Quick Actions */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Typography variant="h6" gutterBottom>Quick Actions</Typography>
          <QuickActions userRole="user" /> {/* Pass role if needed */}
        </Paper>
      </Grid>

      {/* My Recent Invoices */}
      <Grid item xs={12} md={8}>
         <MyRecentInvoices invoices={recentInvoices} /> {/* Pass user-specific invoices */}
      </Grid>

      {/* Other user-specific components */}
      {/* ... */}
    </Grid>
  );
};

export default UserDashboard;
 