"use client";
import React, { useState, useEffect } from 'react';
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
  ListItemSecondaryAction
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
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function AdminDashboard() {
  const theme = useTheme();
  const router = useRouter();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingApprovals: 0,
    activeUsers: 0,
    totalRevenue: 0,
  });
  
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        
        // Fetch users count
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const totalUsers = usersSnapshot.size;
        
        // Count pending approvals
        const pendingApprovalQuery = query(
          collection(db, 'users'),
          where('status', '==', 'pending')
        );
        const pendingApprovalSnapshot = await getDocs(pendingApprovalQuery);
        const pendingApprovals = pendingApprovalSnapshot.size;
        
        // Count active users
        const activeUsersQuery = query(
          collection(db, 'users'),
          where('status', '==', 'active')
        );
        const activeUsersSnapshot = await getDocs(activeUsersQuery);
        const activeUsers = activeUsersSnapshot.size;
        
        // Get pending approval users
        const pendingUsersList = pendingApprovalSnapshot.docs.map(doc => {
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
        
        // Get recent users
        const recentUsersQuery = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentUsersSnapshot = await getDocs(recentUsersQuery);
        const recentUsersList = recentUsersSnapshot.docs.map(doc => {
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
        
        // Fetch total revenue
        const invoicesCollection = collection(db, 'invoices');
        const invoicesSnapshot = await getDocs(invoicesCollection);
        let totalRevenue = 0;
        invoicesSnapshot.forEach(doc => {
          const invoiceData = doc.data();
          if (invoiceData.total) {
            totalRevenue += invoiceData.total;
          }
        });
        
        // Update state
        setStats({
          totalUsers,
          pendingApprovals,
          activeUsers,
          totalRevenue,
        });
        
        setPendingUsers(pendingUsersList);
        setRecentUsers(recentUsersList);
        
      } catch (err) {
        console.error('Error fetching admin dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminData();
  }, []);
  
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        height: 'calc(100vh - 88px)',
        gap: 2
      }}>
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary">
          Loading admin dashboard...
        </Typography>
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
              onClick={() => window.location.reload()}
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
    
      {/* Stats Cards - Grid Layout */}
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
                onClick={() => router.push('/users')}
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
                value={(stats.activeUsers / stats.totalUsers) * 100} 
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
                  {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% of total users
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
                onClick={() => router.push('/reports/financial')}
                sx={{ borderRadius: 2 }}
              >
                View Reports
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Main Content Area */}
      <Grid container spacing={3}>
        {/* Pending Approvals List */}
        <Grid item xs={12} md={6}>
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
                  variant="text" 
                  size="small" 
                  endIcon={<VisibilityIcon />}
                  onClick={() => router.push('/users')}
                >
                  View All
                </Button>
              )}
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {pendingUsers.length > 0 ? (
              <List sx={{ width: '100%' }}>
                {pendingUsers.map((user) => (
                  <ListItem 
                    key={user.id}
                    sx={{ 
                      px: 2, 
                      borderRadius: 2,
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                      mb: 1
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                        {user.name.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={user.name}
                      secondary={
                        <>
                          {user.email}
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            Registered: {new Date(user.createdAt).toLocaleDateString()}
                          </Typography>
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button 
                        variant="outlined" 
                        color="success" 
                        size="small"
                        onClick={() => router.push(`/users?approve=${user.id}`)}
                      >
                        Approve
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 2, opacity: 0.7 }} />
                <Typography variant="body1" color="text.secondary">
                  No pending approval requests
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Recent Users */}
        <Grid item xs={12} md={6}>
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
                variant="text" 
                size="small" 
                endIcon={<VisibilityIcon />}
                onClick={() => router.push('/users')}
              >
                View All
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <List sx={{ width: '100%' }}>
              {recentUsers.map((user) => (
                <ListItem 
                  key={user.id}
                  sx={{ 
                    px: 2, 
                    borderRadius: 2,
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                    mb: 1
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={user.name}
                    secondary={
                      <>
                        {user.email}
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          Registered: {new Date(user.createdAt).toLocaleDateString()}
                        </Typography>
                      </>
                    }
                  />
                  <Chip 
                    label={user.status} 
                    size="small"
                    color={
                      user.status === 'active' ? 'success' : 
                      user.status === 'pending' ? 'warning' : 'default'
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        {/* Admin Actions */}
        <Grid item xs={12}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Admin Actions
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<PeopleIcon />}
                  onClick={() => router.push('/users')}
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    justifyContent: 'flex-start',
                    borderColor: theme.palette.primary.main,
                    '&:hover': {
                      borderColor: theme.palette.primary.dark,
                      bgcolor: alpha(theme.palette.primary.main, 0.05)
                    }
                  }}
                >
                  Manage Users
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<SecurityIcon />}
                  onClick={() => router.push('/admin/roles')}
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    justifyContent: 'flex-start',
                    borderColor: theme.palette.secondary.main,
                    color: theme.palette.secondary.main,
                    '&:hover': {
                      borderColor: theme.palette.secondary.dark,
                      bgcolor: alpha(theme.palette.secondary.main, 0.05)
                    }
                  }}
                >
                  Roles & Permissions
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<AdminPanelSettingsIcon />}
                  onClick={() => router.push('/admin/logs')}
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    justifyContent: 'flex-start',
                    borderColor: theme.palette.info.main,
                    color: theme.palette.info.main,
                    '&:hover': {
                      borderColor: theme.palette.info.dark,
                      bgcolor: alpha(theme.palette.info.main, 0.05)
                    }
                  }}
                >
                  System Logs
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<InventoryIcon />}
                  onClick={() => router.push('/settings')}
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    justifyContent: 'flex-start',
                    borderColor: theme.palette.success.main,
                    color: theme.palette.success.main,
                    '&:hover': {
                      borderColor: theme.palette.success.dark,
                      bgcolor: alpha(theme.palette.success.main, 0.05)
                    }
                  }}
                >
                  System Settings
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}