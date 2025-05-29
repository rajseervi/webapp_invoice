'use client';
 
import { useEffect, useState } from "react";
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
  alpha  // Add this import
} from '@mui/material';
import {
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

// Define interfaces
interface SystemStat {
  name: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

interface RecentActivity {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  category: string;
}

interface PendingUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const theme = useTheme();
  const router = useRouter();
  const { userRole, loadingAuth } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SystemStat[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [userToChangePassword, setUserToChangePassword] = useState(null);

  // Check if user has admin role
  useEffect(() => {
    if (!loadingAuth && userRole !== 'admin') {
      router.push('/unauthorized');
    }
  }, [userRole, router, loadingAuth]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch system stats
        const mockStats: SystemStat[] = [
          { 
            name: 'Total Users', 
            value: 24, 
            change: 12, 
            icon: <PeopleIcon />, 
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
        
        // Fetch recent activities
        // In a real app, you would fetch this from Firestore
        const mockActivities: RecentActivity[] = [
          {
            id: '1',
            action: 'User Created',
            user: 'admin@example.com',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            details: 'Created new user john@example.com'
          },
          {
            id: '2',
            action: 'Product Updated',
            user: 'manager@example.com',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            details: 'Updated stock for product "Laptop XPS 15"'
          },
          {
            id: '3',
            action: 'Invoice Generated',
            user: 'sales@example.com',
            timestamp: new Date(Date.now() - 10800000).toISOString(),
            details: 'Generated invoice #INV-2023-0042 for Customer ABC'
          },
          {
            id: '4',
            action: 'System Settings Changed',
            user: 'admin@example.com',
            timestamp: new Date(Date.now() - 14400000).toISOString(),
            details: 'Updated company information'
          },
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
        
        // Fetch pending users
        try {
          const usersRef = collection(db, 'users');
          const pendingUsersQuery = query(
            usersRef,
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc'),
            limit(5)
          );
          
          const pendingUsersSnapshot = await getDocs(pendingUsersQuery);
          const pendingUsersData = pendingUsersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || data.displayName || 'Unknown',
              email: data.email,
              createdAt: data.createdAt
            };
          });
          setPendingUsers(pendingUsersData);
        } catch (err) {
          console.error('Error fetching pending users:', err);
          // Use mock data if Firestore query fails
          setPendingUsers([
            { id: '1', name: 'John Doe', email: 'john@example.com', createdAt: new Date(Date.now() - 86400000).toISOString() },
            { id: '2', name: 'Jane Smith', email: 'jane@example.com', createdAt: new Date(Date.now() - 172800000).toISOString() }
          ]);
        }
        
        setError(null);
      } catch (err) {
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

  // Navigate to different admin sections
  const navigateTo = (path: string) => {
    router.push(path);
  };

  // Admin menu items
  const adminMenuItems = [
    { name: 'Users Management', icon: <PeopleIcon />, path: '/admin/users' },
    { name: 'Roles & Permissions', icon: <SecurityIcon />, path: '/admin/roles' },
    { name: 'Assign Roles', icon: <SecurityIcon />, path: '/admin/roles/assign' },
    { name: 'Permissions', icon: <SecurityIcon />, path: '/admin/permissions' },
    { name: 'System Logs', icon: <AssessmentIcon />, path: '/admin/logs' },
    { name: 'System Settings', icon: <SettingsIcon />, path: '/settings' }
  ];

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
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
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            // Remove the commented line completely
                            color: stat.color,
                            mr: 2
                          }}
                        >
                          {stat.icon}
                        </Box>
                        <Typography variant="h6" component="div">
                          {stat.name}
                        </Typography>
                      </Box>
                      <Typography variant="h4" component="div">
                        {stat.value}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Chip
                          size="small"
                          label={`${stat.change > 0 ? '+' : ''}${stat.change}%`}
                          color={stat.change > 0 ? 'success' : 'error'}
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          vs. last month
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            <Grid container spacing={3}>
              {/* Admin Menu */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Admin Controls
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <List>
                    {adminMenuItems.map((item, index) => (
                      <ListItem disablePadding key={index}>
                        <ListItemButton onClick={() => navigateTo(item.path)}>
                          <ListItemIcon>
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText primary={item.name} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
              
              {/* Recent Activities */}
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Recent Activities
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <List>
                    {recentActivities.map((activity) => (
                      <ListItem key={activity.id} sx={{ py: 1.5 }}>
                        <ListItemText
                          primary={activity.action}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {activity.user}
                              </Typography>
                              {` — ${activity.details} (${formatDate(activity.timestamp)})`}
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button 
                      size="small" 
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigateTo('/admin/logs')}
                    >
                      View All Logs
                    </Button>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Pending Users */}
              <Grid item xs={12} md={6} sx={{ mt: 3 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Pending User Approvals
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {pendingUsers.length > 0 ? (
                    <List>
                      {pendingUsers.map((user) => (
                        <ListItem key={user.id} sx={{ py: 1.5 }}>
                          <ListItemIcon>
                            <PeopleIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={user.name}
                            secondary={
                              <>
                                {user.email} - Registered on {formatDate(user.createdAt)}
                              </>
                            }
                          />
                          <Button 
                            size="small" 
                            variant="outlined" 
                            onClick={() => navigateTo(`/admin/users?id=${user.id}`)}
                          >
                            Review
                          </Button>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ py: 2, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary">
                        No pending user approvals
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button 
                      size="small" 
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigateTo('/admin/users')}
                    >
                      Manage Users
                    </Button>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Low Stock Items */}
              <Grid item xs={12} md={6} sx={{ mt: 3 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Low Stock Alerts
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {lowStockItems.length > 0 ? (
                    <List>
                      {lowStockItems.map((item) => (
                        <ListItem key={item.id} sx={{ py: 1.5 }}>
                          <ListItemIcon>
                            <InventoryIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={item.name}
                            secondary={`Category: ${item.category}`}
                          />
                          <Chip 
                            label={`Stock: ${item.stock}`} 
                            color={item.stock <= 5 ? 'error' : 'warning'} 
                            size="small" 
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ py: 2, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary">
                        No low stock items
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button 
                      size="small" 
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigateTo('/inventory/alerts')}
                    >
                      View All Alerts
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </Container>
    </DashboardLayout>
  );
}

const handleOpenChangePasswordDialog = (user) => {
  setUserToChangePassword(user);
  // ... rest of your dialog opening logic
};
