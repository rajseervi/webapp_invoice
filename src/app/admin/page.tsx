"use client"
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
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
  useTheme
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
  const { userRole } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SystemStat[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);

  // Check if user has admin role
  useEffect(() => {
    if (userRole !== 'admin') {
      router.push('/unauthorized');
    }
  }, [userRole, router]);

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
        
        // Fetch pending users
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
            name: data.name,
            email: data.email,
            createdAt: data.createdAt
          };
        });
        setPendingUsers(pendingUsersData);
        
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
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Admin Dashboard
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<SettingsIcon />}
            onClick={() => router.push('/settings')}
          >
            System Settings
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
                            {stat.value}
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
              {/* Recent Activity */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Recent Activity</Typography>
                    <Button 
                      size="small" 
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => router.push('/admin/logs')}
                    >
                      View All
                    </Button>
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
                                    By {activity.user} • {formatDate(activity.timestamp)}
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
              
              {/* Quick Actions */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Quick Actions</Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Button 
                        fullWidth 
                        variant="outlined" 
                        startIcon={<PeopleIcon />}
                        onClick={() => router.push('/users')}
                        sx={{ justifyContent: 'flex-start', py: 1.5 }}
                      >
                        Manage Users
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button 
                        fullWidth 
                        variant="outlined" 
                        startIcon={<SecurityIcon />}
                        onClick={() => router.push('/admin/roles')}
                        sx={{ justifyContent: 'flex-start', py: 1.5 }}
                      >
                        Roles & Permissions
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button 
                        fullWidth 
                        variant="outlined" 
                        color="secondary"
                        startIcon={<PeopleIcon />}
                        onClick={() => router.push('/admin/roles/assign')}
                        sx={{ justifyContent: 'flex-start', py: 1.5 }}
                      >
                        Assign User Roles
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button 
                        fullWidth 
                        variant="outlined" 
                        startIcon={<AssessmentIcon />}
                        onClick={() => router.push('/reports')}
                        sx={{ justifyContent: 'flex-start', py: 1.5 }}
                      >
                        View Reports
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button 
                        fullWidth 
                        variant="outlined" 
                        startIcon={<NotificationsIcon />}
                        onClick={() => router.push('/admin/notifications')}
                        sx={{ justifyContent: 'flex-start', py: 1.5 }}
                      >
                        Send Notifications
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              {/* Pending User Approvals */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Pending User Approvals</Typography>
                    <Button 
                      size="small" 
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => router.push('/users?filter=pending')}
                    >
                      View All
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  {pendingUsers.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No pending user approvals
                    </Typography>
                  ) : (
                    <List>
                      {pendingUsers.map((user) => (
                        <ListItem key={user.id} disablePadding>
                          <ListItemButton sx={{ px: 1, py: 1.5 }}>
                            <ListItemText 
                              primary={user.name}
                              secondary={user.email}
                            />
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/users/approve/${user.id}`);
                              }}
                            >
                              Review
                            </Button>
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
    </DashboardLayout>
  );
}