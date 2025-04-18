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
  ListItemSecondaryAction,
  Alert
} from '@mui/material';
import { 
  ReceiptLong as InvoiceIcon, 
  People as PeopleIcon, 
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  ShoppingCart as ShoppingCartIcon,
  AccessTime as AccessTimeIcon,
  CardMembership as CardMembershipIcon
} from '@mui/icons-material';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Define interfaces for type safety
interface Invoice {
  id: string;
  date: any;
  total: number;
  partyName?: string;
  invoiceNumber?: string;
  status?: string;
  [key: string]: any;
}

interface Subscription {
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  plan: string | null;
}

interface DashboardStats {
  totalInvoices: number;
  totalParties: number;
}

export default function UserDashboard() {
  const theme = useTheme();
  const router = useRouter();
  const { currentUser, subscriptionActive, subscriptionData } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    totalParties: 0,
  });
  
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to get data from cache first
        const cachedStats = localStorage.getItem('user_dashboard_stats');
        const cachedInvoices = localStorage.getItem('user_dashboard_invoices');
        
        if (cachedStats && cachedInvoices) {
          try {
            const parsedStats = JSON.parse(cachedStats);
            const parsedInvoices = JSON.parse(cachedInvoices);
            
            // Check if cache is still valid (less than 5 minutes old)
            const now = Date.now();
            if (parsedStats.timestamp && (now - parsedStats.timestamp < 5 * 60 * 1000)) {
              setStats(parsedStats.data);
              setRecentInvoices(parsedInvoices.data);
              setLoading(false);
              
              // Fetch fresh data in the background
              setTimeout(() => fetchFreshData(false), 100);
              return;
            }
          } catch (cacheError) {
            console.error('Error parsing cached data:', cacheError);
            // Continue with fresh fetch if cache parsing fails
          }
        }
        
        // If no valid cache, fetch fresh data
        await fetchFreshData(true);
        
      } catch (err) {
        console.error('Error in dashboard data flow:', err);
        setError('Failed to fetch dashboard data. Please try again later.');
        setLoading(false);
      }
    };
    
    const fetchFreshData = async (updateLoadingState: boolean) => {
      try {
        // Fetch invoices count and recent invoices
        const invoicesCollection = collection(db, 'invoices');
        const invoicesSnapshot = await getDocs(invoicesCollection);
        
        // Get total invoices count
        const invoicesCount = invoicesSnapshot.size;
        
        // Get recent invoices
        const recentInvoicesQuery = query(
          collection(db, 'invoices'),
          orderBy('date', 'desc'),
          limit(5)
        );
        const recentInvoicesSnapshot = await getDocs(recentInvoicesQuery);
        const recentInvoicesList: Invoice[] = recentInvoicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Invoice));
        
        // Fetch parties count
        const partiesCollection = collection(db, 'parties');
        const partiesSnapshot = await getDocs(partiesCollection);
        const partiesCount = partiesSnapshot.size;
        
        // Update state
        const newStats = {
          totalInvoices: invoicesCount,
          totalParties: partiesCount,
        };
        
        setStats(newStats);
        setRecentInvoices(recentInvoicesList);
        
        // Cache the data with timestamp
        localStorage.setItem('user_dashboard_stats', JSON.stringify({
          data: newStats,
          timestamp: Date.now()
        }));
        
        localStorage.setItem('user_dashboard_invoices', JSON.stringify({
          data: recentInvoicesList,
          timestamp: Date.now()
        }));
        
        setError(null);
      } catch (err) {
        console.error('Error fetching user dashboard data:', err);
        if (updateLoadingState) {
          setError('Failed to fetch dashboard data. Please try again later.');
        }
      } finally {
        if (updateLoadingState) {
          setLoading(false);
        }
      }
    };
    
    fetchUserData();
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
          Loading dashboard...
        </Typography>
      </Box>
    );
  }
  
  // Import the QuickLinks component
  const QuickLinks = React.lazy(() => import('./QuickLinks'));
  
  if (error) {
    return (
      <Box sx={{ width: '100%', p: { xs: 2, sm: 3 } }}>
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
        
        {/* Still show QuickLinks even if dashboard data failed to load */}
        <React.Suspense fallback={<Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>}>
          <QuickLinks />
        </React.Suspense>
      </Box>
    );
  }
  
  // Calculate days remaining in subscription
  const getDaysRemaining = () => {
    if (subscriptionData?.endDate) {
      const endDate = new Date(subscriptionData.endDate);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    }
    return 0;
  };
  
  const daysRemaining = getDaysRemaining();
  
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
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}!
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh data">
            <IconButton 
              onClick={() => {
                setLoading(true);
                localStorage.removeItem('user_dashboard_stats');
                localStorage.removeItem('user_dashboard_invoices');
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
            startIcon={<AddIcon />}
            component={Link}
            href="/invoices/new"
            sx={{ borderRadius: 2 }}
            disabled={!subscriptionActive}
          >
            New Invoice
          </Button>
        </Box>
      </Box>
      
      {/* Subscription Alert */}
      {!subscriptionActive && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => router.push('/profile')}
            >
              Upgrade
            </Button>
          }
        >
          Your subscription is inactive. Please upgrade to access all features.
        </Alert>
      )}
      
      {subscriptionActive && daysRemaining <= 7 && (
        <Alert 
          severity="info" 
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => router.push('/profile')}
            >
              Renew
            </Button>
          }
        >
          Your subscription will expire in {daysRemaining} days. Renew now to avoid interruption.
        </Alert>
      )}
    
      {/* Quick Links Section */}
      <React.Suspense fallback={<Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>}>
        <QuickLinks />
      </React.Suspense>
      
      {/* Stats Cards - Grid Layout */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Subscription Card */}
        <Grid item xs={12} sm={6} md={4}>
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
                  <CardMembershipIcon />
                </Avatar>
                <Chip 
                  label={subscriptionActive ? "Active" : "Inactive"} 
                  color={subscriptionActive ? "success" : "default"}
                  size="small"
                />
              </Box>
              
              <Typography variant="h6" component="div" fontWeight="bold" sx={{ mb: 0.5 }}>
                {subscriptionData?.plan ? 
                  subscriptionData.plan.charAt(0).toUpperCase() + subscriptionData.plan.slice(1) + " Plan" : 
                  "No Active Plan"}
              </Typography>
              
              {subscriptionActive && subscriptionData?.endDate ? (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Expires: {new Date(subscriptionData.endDate).toLocaleDateString()}
                  </Typography>
                  
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min((daysRemaining / 30) * 100, 100)} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        bgcolor: daysRemaining <= 7 ? theme.palette.warning.main : theme.palette.success.main
                      }
                    }} 
                  />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5 }}>
                    <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                    <Typography variant="caption" color="text.secondary">
                      {daysRemaining} days remaining
                    </Typography>
                  </Box>
                </>
              ) : (
                <Button 
                  variant="outlined" 
                  color="primary" 
                  size="small" 
                  fullWidth
                  onClick={() => router.push('/profile')}
                  sx={{ mt: 2, borderRadius: 2 }}
                >
                  Upgrade Now
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Invoices Card */}
        <Grid item xs={12} sm={6} md={4}>
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
                  <InvoiceIcon />
                </Avatar>
              </Box>
              
              <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 0.5 }}>
                {stats.totalInvoices}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Your Invoices
              </Typography>
              
              <Button 
                variant="outlined" 
                color="info" 
                size="small" 
                fullWidth
                onClick={() => router.push('/invoices')}
                sx={{ borderRadius: 2 }}
                disabled={!subscriptionActive}
              >
                View Invoices
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Parties Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 3,
              height: '100%',
              border: `1px solid ${theme.palette.divider}`,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                boxShadow: `0 8px 24px ${alpha(theme.palette.secondary.main, 0.15)}`,
                transform: 'translateY(-4px)',
                borderColor: 'secondary.main'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Avatar 
                  variant="rounded"
                  sx={{ 
                    bgcolor: alpha(theme.palette.secondary.main, 0.1), 
                    color: 'secondary.main',
                    width: 48, 
                    height: 48,
                    borderRadius: 2
                  }}
                >
                  <PeopleIcon />
                </Avatar>
              </Box>
              
              <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 0.5 }}>
                {stats.totalParties}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Your Parties
              </Typography>
              
              <Button 
                variant="outlined" 
                color="secondary" 
                size="small" 
                fullWidth
                onClick={() => router.push('/parties')}
                sx={{ borderRadius: 2 }}
                disabled={!subscriptionActive}
              >
                Manage Parties
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Main Content Area */}
      <Grid container spacing={3}>
        {/* Recent Invoices */}
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
                Recent Invoices
              </Typography>
              <Button 
                variant="text" 
                size="small" 
                endIcon={<VisibilityIcon />}
                onClick={() => router.push('/invoices')}
                disabled={!subscriptionActive}
              >
                View All
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {recentInvoices.length > 0 ? (
              <List sx={{ width: '100%' }}>
                {recentInvoices.map((invoice) => (
                  <ListItem 
                    key={invoice.id}
                    sx={{ 
                      px: 2, 
                      borderRadius: 2,
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                      mb: 1,
                      cursor: subscriptionActive ? 'pointer' : 'default'
                    }}
                    onClick={() => subscriptionActive && router.push(`/invoices/${invoice.id}`)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        <InvoiceIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={invoice.invoiceNumber || `Invoice #${invoice.id.substring(0, 8)}`}
                      secondary={
                        <>
                          {invoice.partyName || 'Unknown Party'}
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            {invoice.date ? new Date(invoice.date.seconds * 1000).toLocaleDateString() : '-'}
                          </Typography>
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Typography variant="body2" fontWeight="medium">
                        ₹{invoice.total?.toLocaleString('en-IN') || '-'}
                      </Typography>
                      <Chip 
                        label={invoice.status || 'Completed'} 
                        size="small"
                        color={
                          invoice.status === 'Paid' ? 'success' : 
                          invoice.status === 'Pending' ? 'warning' : 'default'
                        }
                        sx={{ mt: 1 }}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <InvoiceIcon color="disabled" sx={{ fontSize: 48, mb: 2, opacity: 0.7 }} />
                <Typography variant="body1" color="text.secondary">
                  No invoices found
                </Typography>
                {subscriptionActive && (
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    size="small"
                    onClick={() => router.push('/invoices/new')}
                    sx={{ mt: 2 }}
                  >
                    Create Your First Invoice
                  </Button>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Quick Actions */}
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
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Quick Actions
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<AddIcon />}
                  onClick={() => router.push('/invoices/new')}
                  disabled={!subscriptionActive}
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    justifyContent: 'flex-start',
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                    '&:hover': {
                      borderColor: theme.palette.primary.dark,
                      bgcolor: alpha(theme.palette.primary.main, 0.05)
                    },
                    '&.Mui-disabled': {
                      borderColor: theme.palette.action.disabledBackground,
                    }
                  }}
                >
                  New Invoice
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<PeopleIcon />}
                  onClick={() => router.push('/parties/new')}
                  disabled={!subscriptionActive}
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    justifyContent: 'flex-start',
                    borderColor: theme.palette.secondary.main,
                    color: theme.palette.secondary.main,
                    '&:hover': {
                      borderColor: theme.palette.secondary.dark,
                      bgcolor: alpha(theme.palette.secondary.main, 0.05)
                    },
                    '&.Mui-disabled': {
                      borderColor: theme.palette.action.disabledBackground,
                    }
                  }}
                >
                  Add Party
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<InventoryIcon />}
                  onClick={() => router.push('/products')}
                  disabled={!subscriptionActive}
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    justifyContent: 'flex-start',
                    borderColor: theme.palette.info.main,
                    color: theme.palette.info.main,
                    '&:hover': {
                      borderColor: theme.palette.info.dark,
                      bgcolor: alpha(theme.palette.info.main, 0.05)
                    },
                    '&.Mui-disabled': {
                      borderColor: theme.palette.action.disabledBackground,
                    }
                  }}
                >
                  View Products
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<CardMembershipIcon />}
                  onClick={() => router.push('/profile')}
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
                  {subscriptionActive ? 'Manage Subscription' : 'Upgrade Account'}
                </Button>
              </Grid>
            </Grid>
            
            {!subscriptionActive && (
              <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 2 }}>
                <Typography variant="subtitle2" color="info.main" gutterBottom>
                  Upgrade to access all features
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  With a premium subscription, you can create unlimited invoices, manage parties, and access all features.
                </Typography>
                <Button 
                  variant="contained" 
                  color="info" 
                  size="small"
                  onClick={() => router.push('/profile')}
                >
                  View Plans
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}