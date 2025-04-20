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
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';

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

export default function OptimizedAdminDashboard() {
  const theme = useTheme();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SystemStat[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);

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

  // Stats section component
  const statsSection = (
    <Grid container spacing={3}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={stat.name}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              borderRadius: 2,
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: (theme) => theme.shadows[4],
              },
            }}
            elevation={2}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: `${stat.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                }}
              >
                {React.cloneElement(stat.icon as React.ReactElement, {
                  sx: { color: stat.color, fontSize: 24 }
                })}
              </Box>
              <Typography variant="h6" component="div" color="text.secondary">
                {stat.name}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
              <Typography variant="h4" component="div">
                {stat.value.toLocaleString()}
              </Typography>
              <Typography
                variant="body2"
                color={stat.change >= 0 ? 'success.main' : 'error.main'}
                sx={{ ml: 1, display: 'flex', alignItems: 'center' }}
              >
                {stat.change >= 0 ? '+' : ''}{stat.change}%
              </Typography>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.palette.primary.main,
            },
          }}
        >
          Admin Dashboard
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<SettingsIcon />}
          onClick={() => router.push('/settings')}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            px: 3,
            py: 1,
            backgroundColor: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
          }}
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
          {statsSection}

          {/* Recent Users and Pending Users */}
          <Grid container spacing={3} sx={{ mt: 4 }}>
            {/* Recent Users Section */}
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  height: '100%',
                  p: 3,
                  borderRadius: 2,
                  boxShadow: (theme) => theme.shadows[2],
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) => theme.shadows[4],
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Recent Activity
                  </Typography>
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => router.push('/admin/logs')}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      color: 'primary.main',
                      '&:hover': { backgroundColor: 'primary.light' },
                    }}
                  >
                    View All
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                <List sx={{ p: 0 }}>
                  {recentActivities.map((activity) => (
                    <ListItem
                      key={activity.id}
                      disablePadding
                      sx={{
                        mb: 1,
                        '&:last-child': { mb: 0 },
                        transition: 'background-color 0.2s',
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <ListItemButton
                        sx={{
                          px: 2,
                          py: 1.5,
                          borderRadius: 1,
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5 }}>
                              {activity.action}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ color: 'text.secondary' }}>
                              <Typography variant="body2" sx={{ mb: 0.5 }}>
                                {activity.details}
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {activity.user} • {formatDate(activity.timestamp)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* Pending Users Section */}
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  height: '100%',
                  p: 3,
                  borderRadius: 2,
                  boxShadow: (theme) => theme.shadows[2],
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) => theme.shadows[4],
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Pending User Approvals
                  </Typography>
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => router.push('/users?filter=pending')}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      color: 'primary.main',
                      '&:hover': { backgroundColor: 'primary.light' },
                    }}
                  >
                    Manage Users
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                <List sx={{ p: 0 }}>
                  {pendingUsers.map((user) => (
                    <ListItem
                      key={user.id}
                      disablePadding
                      sx={{
                        mb: 1,
                        '&:last-child': { mb: 0 },
                        transition: 'background-color 0.2s',
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <ListItemButton
                        sx={{
                          px: 2,
                          py: 1.5,
                          borderRadius: 1,
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5 }}>
                              {user.name || user.email}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ color: 'text.secondary' }}>
                              <Typography variant="body2" sx={{ mb: 0.5 }}>
                                {user.email}
                              </Typography>
                              <Typography variant="caption">
                                Registered: {formatDate(user.createdAt)}
                              </Typography>
                            </Box>
                          }
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/users/approve/${user.id}`);
                            }}
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              minWidth: 80,
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/users/reject/${user.id}`);
                            }}
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              minWidth: 80,
                            }}
                          >
                            Reject
                          </Button>
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
          
          <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ width: '100%', mt: { xs: 2, sm: 3, md: 4 } }}>
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
            
            {/* Pending User Approvals */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Pending User Approvals</Typography>
                  <Button 
                    size="small" 
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => router.push('/users?filter=pending')}
                  >
                    Manage Users
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
                            primary={user.name || user.email}
                            secondary={
                              <React.Fragment>
                                <Typography variant="body2" component="span">
                                  {user.email}
                                </Typography>
                                <br />
                                <Typography variant="caption" color="text.secondary">
                                  Registered: {formatDate(user.createdAt)}
                                </Typography>
                              </React.Fragment>
                            }
                          />
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/users/approve/${user.id}`);
                              }}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/users/reject/${user.id}`);
                              }}
                            >
                              Reject
                            </Button>
                          </Box>
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