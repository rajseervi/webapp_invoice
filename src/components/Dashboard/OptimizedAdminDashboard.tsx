"use client";
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Avatar, 
  Paper,
  Button, 
  CircularProgress,
  useTheme,
  Grid,
  IconButton,
  Chip,
  alpha,
  Tooltip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Skeleton
} from '@mui/material';
import { 
  ReceiptLong as InvoiceIcon, 
  People as PeopleIcon, 
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
  ArrowUpward as ArrowUpwardIcon,
  CalendarToday as CalendarIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { collection, getDocs, query, orderBy, limit, where, getCountFromServer } from 'firebase/firestore';
import { db } from '@/firebase/config';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getFromCache, saveToCache, clearCacheByPrefix } from '@/utils/cacheUtils';

// Define interfaces for type safety
interface User {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
}

interface DashboardStats {
  totalUsers: number;
  pendingApprovals: number;
  activeUsers: number;
  totalRevenue: number;
}

// Create skeleton loaders for different sections
const StatCardSkeleton = () => {
  const theme = useTheme();
  return (
    <Card 
      elevation={0} 
      sx={{ 
        borderRadius: 3,
        height: '100%',
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Skeleton variant="circular" width={48} height={48} />
          <Skeleton variant="text" width={60} />
        </Box>
        <Skeleton variant="text" width="40%" height={40} />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="rectangular" height={6} sx={{ mt: 1.5, borderRadius: 3 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5 }}>
          <Skeleton variant="text" width={120} />
        </Box>
      </CardContent>
    </Card>
  );
};

const UserListSkeleton = () => {
  return (
    <List>
      {[1, 2, 3].map((item) => (
        <ListItem key={item} divider>
          <ListItemAvatar>
            <Skeleton variant="circular" width={40} height={40} />
          </ListItemAvatar>
          <ListItemText
            primary={<Skeleton variant="text" width="70%" />}
            secondary={<Skeleton variant="text" width="40%" />}
          />
          <ListItemSecondaryAction>
            <Skeleton variant="rectangular" width={80} height={36} />
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );
};

// Create a custom hook for fetching dashboard data
function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingApprovals: 0,
    activeUsers: 0,
    totalRevenue: 0,
  });
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch only the counts (more efficient)
  const fetchCounts = async () => {
    try {
      // Fetch users count
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getCountFromServer(usersCollection);
      const totalUsers = usersSnapshot.data().count;
      
      // Count pending approvals
      const pendingApprovalQuery = query(
        collection(db, 'users'),
        where('status', '==', 'pending')
      );
      const pendingApprovalSnapshot = await getCountFromServer(pendingApprovalQuery);
      const pendingApprovals = pendingApprovalSnapshot.data().count;
      
      // Count active users
      const activeUsersQuery = query(
        collection(db, 'users'),
        where('status', '==', 'active')
      );
      const activeUsersSnapshot = await getCountFromServer(activeUsersQuery);
      const activeUsers = activeUsersSnapshot.data().count;

      // Fetch total revenue (simplified)
      const invoicesCollection = collection(db, 'invoices');
      const invoicesSnapshot = await getDocs(invoicesCollection);
      let totalRevenue = 0;
      invoicesSnapshot.forEach(doc => {
        const invoiceData = doc.data();
        if (invoiceData.total) {
          totalRevenue += invoiceData.total;
        }
      });

      return {
        totalUsers,
        pendingApprovals,
        activeUsers,
        totalRevenue
      };
    } catch (error) {
      console.error("Error fetching counts:", error);
      throw error;
    }
  };

  // Function to fetch pending users
  const fetchPendingUsers = async () => {
    try {
      const pendingApprovalQuery = query(
        collection(db, 'users'),
        where('status', '==', 'pending'),
        limit(5)
      );
      const pendingApprovalSnapshot = await getDocs(pendingApprovalQuery);
      
      return pendingApprovalSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.firstName && data.lastName 
            ? `${data.firstName} ${data.lastName}`
            : data.name || data.email,
          email: data.email,
          status: data.status,
          createdAt: data.createdAt
        };
      });
    } catch (error) {
      console.error("Error fetching pending users:", error);
      throw error;
    }
  };

  // Function to fetch recent users
  const fetchRecentUsers = async () => {
    try {
      const recentUsersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentUsersSnapshot = await getDocs(recentUsersQuery);
      
      return recentUsersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.firstName && data.lastName 
            ? `${data.firstName} ${data.lastName}`
            : data.name || data.email,
          email: data.email,
          status: data.status,
          createdAt: data.createdAt
        };
      });
    } catch (error) {
      console.error("Error fetching recent users:", error);
      throw error;
    }
  };

  // Fetch all data in parallel with caching
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Check if we have cached data
        const cachedStats = getFromCache<DashboardStats>('admin_dashboard_stats');
        const cachedPendingUsers = getFromCache<User[]>('admin_dashboard_pending_users');
        const cachedRecentUsers = getFromCache<User[]>('admin_dashboard_recent_users');
        
        // If we have all cached data, use it
        if (cachedStats && cachedPendingUsers && cachedRecentUsers) {
          setStats(cachedStats);
          setPendingUsers(cachedPendingUsers);
          setRecentUsers(cachedRecentUsers);
          setLoading(false);
          setError(null);
          
          // Fetch fresh data in the background
          setTimeout(() => {
            refreshDataInBackground();
          }, 100);
          
          return;
        }
        
        // Otherwise fetch all data
        const [countsData, pendingUsersData, recentUsersData] = await Promise.all([
          fetchCounts(),
          fetchPendingUsers(),
          fetchRecentUsers()
        ]);
        
        // Update state with fetched data
        setStats(countsData);
        setPendingUsers(pendingUsersData);
        setRecentUsers(recentUsersData);
        
        // Cache the data
        saveToCache('admin_dashboard_stats', countsData);
        saveToCache('admin_dashboard_pending_users', pendingUsersData);
        saveToCache('admin_dashboard_recent_users', recentUsersData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching admin dashboard data:', err);
        setError('Failed to fetch dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    // Function to refresh data in the background without showing loading state
    const refreshDataInBackground = async () => {
      try {
        const [countsData, pendingUsersData, recentUsersData] = await Promise.all([
          fetchCounts(),
          fetchPendingUsers(),
          fetchRecentUsers()
        ]);
        
        // Update state with fresh data
        setStats(countsData);
        setPendingUsers(pendingUsersData);
        setRecentUsers(recentUsersData);
        
        // Update cache
        saveToCache('admin_dashboard_stats', countsData);
        saveToCache('admin_dashboard_pending_users', pendingUsersData);
        saveToCache('admin_dashboard_recent_users', recentUsersData);
      } catch (err) {
        console.error('Error refreshing dashboard data in background:', err);
        // Don't show error for background refresh
      }
    };
    
    fetchData();
  }, []);

  return { stats, pendingUsers, recentUsers, loading, error };
}

// Separate components for each dashboard section
const StatsSection = ({ stats, loading }: { stats: DashboardStats, loading: boolean }) => {
  const theme = useTheme();
  
  if (loading) {
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item}>
            <StatCardSkeleton />
          </Grid>
        ))}
      </Grid>
    );
  }
  
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {/* Total Users Card */}
      <Grid item xs={12} sm={6} md={3}>
        <Card 
          elevation={0} 
          sx={{ 
            borderRadius: 3,
            height: '100%',
            border: `1px solid ${theme.palette.divider}`,
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
              transform: 'translateY(-4px)',
              borderColor: 'primary.main'
            }
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Avatar 
                variant="rounded"
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1), 
                  color: 'primary.main',
                  width: 48, 
                  height: 48,
                  borderRadius: 2
                }}
              >
                <PeopleIcon />
              </Avatar>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ArrowUpwardIcon 
                  fontSize="small" 
                  color="success" 
                  sx={{ mr: 0.5, fontSize: '1rem' }} 
                />
                <Typography variant="body2" color="success.main" fontWeight="medium">
                  +{Math.round((stats.totalUsers / (stats.totalUsers - 2)) * 100 - 100)}%
                </Typography>
              </Box>
            </Box>
            
            <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 0.5 }}>
              {stats.totalUsers}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Total Users
            </Typography>
            
            <LinearProgress 
              variant="determinate" 
              value={75} 
              sx={{ 
                height: 6, 
                borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                }
              }} 
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5 }}>
              <CalendarIcon fontSize="small" color="action" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
              <Typography variant="caption" color="text.secondary">
                Last 30 days
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Pending Approvals Card */}
      <Grid item xs={12} sm={6} md={3}>
        <Card 
          elevation={0} 
          sx={{ 
            borderRadius: 3,
            height: '100%',
            border: `1px solid ${theme.palette.divider}`,
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              boxShadow: `0 8px 24px ${alpha(theme.palette.warning.main, 0.15)}`,
              transform: 'translateY(-4px)',
              borderColor: 'warning.main'
            }
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Avatar 
                variant="rounded"
                sx={{ 
                  bgcolor: alpha(theme.palette.warning.main, 0.1), 
                  color: 'warning.main',
                  width: 48, 
                  height: 48,
                  borderRadius: 2
                }}
              >
                <PersonAddIcon />
              </Avatar>
            </Box>
            
            <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 0.5 }}>
              {stats.pendingApprovals}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Pending Approvals
            </Typography>
            
            <Button 
              variant="outlined" 
              color="warning" 
              size="small" 
              fullWidth
              component={Link}
              href="/users"
              sx={{ borderRadius: 2 }}
            >
              Review Requests
            </Button>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Active Users Card */}
      <Grid item xs={12} sm={6} md={3}>
        <Card 
          elevation={0} 
          sx={{ 
            borderRadius: 3,
            height: '100%',
            border: `1px solid ${theme.palette.divider}`,
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              boxShadow: `0 8px 24px ${alpha(theme.palette.success.main, 0.15)}`,
              transform: 'translateY(-4px)',
              borderColor: 'success.main'
            }
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Avatar 
                variant="rounded"
                sx={{ 
                  bgcolor: alpha(theme.palette.success.main, 0.1), 
                  color: 'success.main',
                  width: 48, 
                  height: 48,
                  borderRadius: 2
                }}
              >
                <CheckCircleIcon />
              </Avatar>
            </Box>
            
            <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 0.5 }}>
              {stats.activeUsers}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Active Users
            </Typography>
            
            <LinearProgress 
              variant="determinate" 
              value={(stats.activeUsers / (stats.totalUsers || 1)) * 100} 
              sx={{ 
                height: 6, 
                borderRadius: 3,
                bgcolor: alpha(theme.palette.success.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  bgcolor: theme.palette.success.main
                }
              }} 
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                {Math.round((stats.activeUsers / (stats.totalUsers || 1)) * 100)}% of total users
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Revenue Card */}
      <Grid item xs={12} sm={6} md={3}>
        <Card 
          elevation={0} 
          sx={{ 
            borderRadius: 3,
            height: '100%',
            border: `1px solid ${theme.palette.divider}`,
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              boxShadow: `0 8px 24px ${alpha(theme.palette.info.main, 0.15)}`,
              transform: 'translateY(-4px)',
              borderColor: 'info.main'
            }
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Avatar 
                variant="rounded"
                sx={{ 
                  bgcolor: alpha(theme.palette.info.main, 0.1), 
                  color: 'info.main',
                  width: 48, 
                  height: 48,
                  borderRadius: 2
                }}
              >
                <MoneyIcon />
              </Avatar>
            </Box>
            
            <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 0.5 }}>
              ₹{stats.totalRevenue.toLocaleString('en-IN')}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Total Revenue
            </Typography>
            
            <Button 
              variant="outlined" 
              color="info" 
              size="small" 
              fullWidth
              component={Link}
              href="/reports/financial"
              sx={{ borderRadius: 2 }}
            >
              View Reports
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

const PendingUsersSection = ({ pendingUsers, loading }: { pendingUsers: User[], loading: boolean }) => {
  const theme = useTheme();
  const router = useRouter();
  
  if (loading) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 3,
          height: '100%',
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Pending Approvals
          </Typography>
          <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
        </Box>
        <UserListSkeleton />
      </Paper>
    );
  }
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        borderRadius: 3,
        height: '100%',
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          Pending Approvals
        </Typography>
        {pendingUsers.length > 0 && (
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => router.push('/users')}
            startIcon={<VisibilityIcon />}
          >
            View All
          </Button>
        )}
      </Box>
      
      {pendingUsers.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 2, opacity: 0.6 }} />
          <Typography variant="body1" color="text.secondary">
            No pending approvals
          </Typography>
        </Box>
      ) : (
        <List>
          {pendingUsers.map((user) => (
            <ListItem 
              key={user.id} 
              divider
              sx={{ 
                px: 2, 
                borderRadius: 2,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                }
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="subtitle2" noWrap>
                    {user.name}
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {user.email}
                  </Typography>
                }
              />
              <ListItemSecondaryAction>
                <Button 
                  variant="contained" 
                  size="small" 
                  color="warning"
                  onClick={() => router.push(`/users/${user.id}`)}
                  sx={{ borderRadius: 2 }}
                >
                  Review
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};

const RecentUsersSection = ({ recentUsers, loading }: { recentUsers: User[], loading: boolean }) => {
  const theme = useTheme();
  
  if (loading) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 3,
          height: '100%',
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Recent Users
          </Typography>
          <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
        </Box>
        <UserListSkeleton />
      </Paper>
    );
  }
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        borderRadius: 3,
        height: '100%',
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          Recent Users
        </Typography>
        <Button 
          variant="outlined" 
          size="small" 
          component={Link}
          href="/users"
          startIcon={<VisibilityIcon />}
        >
          View All
        </Button>
      </Box>
      
      <List>
        {recentUsers.map((user) => (
          <ListItem 
            key={user.id} 
            divider
            sx={{ 
              px: 2, 
              borderRadius: 2,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.05),
              }
            }}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                {user.name.charAt(0).toUpperCase()}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography variant="subtitle2" noWrap>
                  {user.name}
                </Typography>
              }
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {user.email}
                  </Typography>
                  <Chip 
                    label={user.status} 
                    size="small"
                    color={user.status === 'active' ? 'success' : user.status === 'pending' ? 'warning' : 'default'}
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
              }
            />
            <ListItemSecondaryAction>
              <IconButton 
                edge="end" 
                component={Link}
                href={`/users/${user.id}`}
                size="small"
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default function OptimizedAdminDashboard() {
  const theme = useTheme();
  const router = useRouter();
  const { stats, pendingUsers, recentUsers, loading, error } = useDashboardData();
  
  // Memoize the sections to prevent unnecessary re-renders
  const statsSection = useMemo(() => (
    <StatsSection stats={stats} loading={loading} />
  ), [stats, loading]);
  
  const pendingUsersSection = useMemo(() => (
    <PendingUsersSection pendingUsers={pendingUsers} loading={loading} />
  ), [pendingUsers, loading]);
  
  const recentUsersSection = useMemo(() => (
    <RecentUsersSection recentUsers={recentUsers} loading={loading} />
  ), [recentUsers, loading]);
  
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => {
            // Clear cache and reload data
            clearCacheByPrefix('admin_dashboard');
            window.location.reload();
          }}
          startIcon={<RefreshIcon />}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ 
      width: '100%', 
      p: { xs: 2, sm: 3 },
      overflow: 'hidden'
    }}>
      {/* Dashboard Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3
      }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Admin Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your system, users, and permissions
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh data">
            <IconButton 
              onClick={() => {
                // Clear cache and reload data
                clearCacheByPrefix('admin_dashboard');
                window.location.reload();
              }}
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button 
            variant="contained" 
            startIcon={<PersonAddIcon />}
            component={Link}
            href="/users"
            sx={{ borderRadius: 2 }}
          >
            Manage Users
          </Button>
        </Box>
      </Box>
    
      {/* Stats Cards */}
      {statsSection}
      
      {/* Main Content Area */}
      <Grid container spacing={3}>
        {/* Pending Approvals List */}
        <Grid item xs={12} md={6}>
          {pendingUsersSection}
        </Grid>
        
        {/* Recent Users List */}
        <Grid item xs={12} md={6}>
          {recentUsersSection}
        </Grid>
      </Grid>
    </Box>
  );
}