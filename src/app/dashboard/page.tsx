"use client";
import React, { useState, useEffect } from 'react';
import { safelyParseJson } from '@/utils/apiHelpers';
import InventoryAlertsWidget from '@/components/dashboard/InventoryAlertsWidget';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Avatar, 
  Divider, 
  Paper,
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  CircularProgress,
  useTheme,
  useMediaQuery,
  Grid,
  IconButton,
  Chip,
  alpha,
  Tooltip as MuiTooltip,
  LinearProgress
} from '@mui/material';
import { 
  ReceiptLong as InvoiceIcon, 
  People as PeopleIcon, 
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  Category as CategoryIcon,
  Refresh as RefreshIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  CalendarToday as CalendarIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import dynamic from 'next/dynamic';

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

interface SalesDataItem {
  name: string;
  amount: number;
}

interface DashboardStats {
  totalInvoices: number;
  totalParties: number;
  totalProducts: number;
  totalRevenue: number;
}

// Dynamically import chart components to avoid SSR issues
const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const BarChart = dynamic(
  () => import('recharts').then((mod) => mod.BarChart),
  { ssr: false }
);
const Bar = dynamic(
  () => import('recharts').then((mod) => mod.Bar),
  { ssr: false }
);
const XAxis = dynamic(
  () => import('recharts').then((mod) => mod.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import('recharts').then((mod) => mod.YAxis),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import('recharts').then((mod) => mod.CartesianGrid),
  { ssr: false }
);
const RechartsTooltip = dynamic(
  () => import('recharts').then((mod) => mod.Tooltip),
  { ssr: false }
);
const RechartsLegend = dynamic(
  () => import('recharts').then((mod) => mod.Legend),
  { ssr: false }
);

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    totalParties: 0,
    totalProducts: 0,
    totalRevenue: 0,
  });
  
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  
  const salesData: SalesDataItem[] = [
    { name: 'Jan', amount: 4000 },
    { name: 'Feb', amount: 3000 },
    { name: 'Mar', amount: 5000 },
    { name: 'Apr', amount: 2780 },
    { name: 'May', amount: 1890 },
    { name: 'Jun', amount: 2390 }
  ];
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Verify authentication status first
        const authResponse = await fetch('/api/auth/verify');
        
        // Check if the response is JSON
        const contentType = authResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const authData = await authResponse.json();
          
          if (!authData.authenticated) {
            console.error('User is not authenticated');
            window.location.href = '/login?callbackUrl=' + encodeURIComponent('/dashboard');
            return;
          }
        } else {
          // Handle non-JSON response (likely HTML error page)
          console.error('Received non-JSON response from auth verify endpoint');
          const text = await authResponse.text();
          console.error('Response text:', text.substring(0, 200) + '...');
          setError('Authentication service unavailable');
          setLoading(false);
          return;
        }
        
        // Fetch invoices count and recent invoices
        const invoicesCollection = collection(db, 'invoices');
        const invoicesSnapshot = await getDocs(invoicesCollection);
        
        // Get total invoices count
        const invoicesCount = invoicesSnapshot.size;
        
        // Calculate total revenue
        let totalRevenue = 0;
        invoicesSnapshot.forEach(doc => {
          const invoiceData = doc.data();
          if (invoiceData.total) {
            totalRevenue += invoiceData.total;
          }
        });
        
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
        
        // Fetch products count
        const productsCollection = collection(db, 'products');
        const productsSnapshot = await getDocs(productsCollection);
        const productsCount = productsSnapshot.size;
        
        // Update state
        setStats({
          totalInvoices: invoicesCount,
          totalParties: partiesCount,
          totalProducts: productsCount,
          totalRevenue: totalRevenue,
        });
        
        setRecentInvoices(recentInvoicesList);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  if (loading) {
    return (
      <DashboardLayout>
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
            Loading dashboard data...
          </Typography>
        </Box>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
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
              Welcome back! Here's what's happening with your business today.
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <MuiTooltip title="Refresh data">
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
            </MuiTooltip>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              component={Link}
              href="/invoices/new"
              sx={{ borderRadius: 2 }}
            >
              New Invoice
            </Button>
          </Box>
        </Box>
      
        {/* Stats Cards - Grid Layout */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Invoices Card */}
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
                    <InvoiceIcon />
                  </Avatar>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ArrowUpwardIcon 
                      fontSize="small" 
                      color="success" 
                      sx={{ mr: 0.5, fontSize: '1rem' }} 
                    />
                    <Typography variant="body2" color="success.main" fontWeight="medium">
                      +12%
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 0.5 }}>
                  {stats.totalInvoices}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Total Invoices
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
                    <MoneyIcon />
                  </Avatar>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ArrowUpwardIcon 
                      fontSize="small" 
                      color="success" 
                      sx={{ mr: 0.5, fontSize: '1rem' }} 
                    />
                    <Typography variant="body2" color="success.main" fontWeight="medium">
                      +18%
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 0.5 }}>
                  ₹{stats.totalRevenue.toLocaleString('en-IN')}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Total Revenue
                </Typography>
                
                <LinearProgress 
                  variant="determinate" 
                  value={85} 
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
                  <CalendarIcon fontSize="small" color="action" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                  <Typography variant="caption" color="text.secondary">
                    Last 30 days
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Parties Card */}
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
                    <PeopleIcon />
                  </Avatar>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ArrowUpwardIcon 
                      fontSize="small" 
                      color="success" 
                      sx={{ mr: 0.5, fontSize: '1rem' }} 
                    />
                    <Typography variant="body2" color="success.main" fontWeight="medium">
                      +5%
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 0.5 }}>
                  {stats.totalParties}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Total Parties
                </Typography>
                
                <LinearProgress 
                  variant="determinate" 
                  value={60} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      bgcolor: theme.palette.warning.main
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
          
          {/* Products Card */}
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
                    <InventoryIcon />
                  </Avatar>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ArrowUpwardIcon 
                      fontSize="small" 
                      color="success" 
                      sx={{ mr: 0.5, fontSize: '1rem' }} 
                    />
                    <Typography variant="body2" color="success.main" fontWeight="medium">
                      +8%
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 0.5 }}>
                  {stats.totalProducts}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Total Products
                </Typography>
                
                <LinearProgress 
                  variant="determinate" 
                  value={70} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      bgcolor: theme.palette.info.main
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
        </Grid>
        
        {/* Quick Actions - Card Grid Layout */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              Quick Actions
            </Typography>
            <Button 
              variant="text" 
              component={Link} 
              href="/settings"
              endIcon={<VisibilityIcon />}
              sx={{ textTransform: 'none' }}
            >
              View All
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {/* Invoice Actions */}
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                elevation={0} 
                sx={{ 
                  borderRadius: 3,
                  height: '100%',
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      variant="rounded"
                      sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.1), 
                        color: 'primary.main',
                        width: 40, 
                        height: 40,
                        borderRadius: 2,
                        mr: 2
                      }}
                    >
                      <InvoiceIcon />
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold">
                      Invoices
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Button 
                      variant="contained" 
                      color="primary"
                      component={Link}
                      href="/invoices/new"
                      startIcon={<AddIcon />}
                      fullWidth
                      sx={{ 
                        borderRadius: 2, 
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      Create New Invoice
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="primary"
                      component={Link}
                      href="/invoices"
                      startIcon={<VisibilityIcon />}
                      fullWidth
                      sx={{ 
                        borderRadius: 2, 
                        py: 1,
                        textTransform: 'none'
                      }}
                    >
                      View All Invoices
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Products Actions */}
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                elevation={0} 
                sx={{ 
                  borderRadius: 3,
                  height: '100%',
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'secondary.main',
                    boxShadow: `0 4px 20px ${alpha(theme.palette.secondary.main, 0.15)}`
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      variant="rounded"
                      sx={{ 
                        bgcolor: alpha(theme.palette.secondary.main, 0.1), 
                        color: 'secondary.main',
                        width: 40, 
                        height: 40,
                        borderRadius: 2,
                        mr: 2
                      }}
                    >
                      <InventoryIcon />
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold">
                      Products
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Button 
                      variant="contained" 
                      color="secondary"
                      component={Link}
                      href="/products/new"
                      startIcon={<AddIcon />}
                      fullWidth
                      sx={{ 
                        borderRadius: 2, 
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      Add New Product
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="secondary"
                      component={Link}
                      href="/categories/new"
                      startIcon={<CategoryIcon />}
                      fullWidth
                      sx={{ 
                        borderRadius: 2, 
                        py: 1,
                        textTransform: 'none'
                      }}
                    >
                      Manage Categories
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Parties Actions */}
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                elevation={0} 
                sx={{ 
                  borderRadius: 3,
                  height: '100%',
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'warning.main',
                    boxShadow: `0 4px 20px ${alpha(theme.palette.warning.main, 0.15)}`
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      variant="rounded"
                      sx={{ 
                        bgcolor: alpha(theme.palette.warning.main, 0.1), 
                        color: 'warning.main',
                        width: 40, 
                        height: 40,
                        borderRadius: 2,
                        mr: 2
                      }}
                    >
                      <PeopleIcon />
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold">
                      Parties
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Button 
                      variant="contained" 
                      color="warning"
                      component={Link}
                      href="/parties/new"
                      startIcon={<AddIcon />}
                      fullWidth
                      sx={{ 
                        borderRadius: 2, 
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      Add New Party
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="warning"
                      component={Link}
                      href="/parties"
                      startIcon={<VisibilityIcon />}
                      fullWidth
                      sx={{ 
                        borderRadius: 2, 
                        py: 1,
                        textTransform: 'none'
                      }}
                    >
                      View All Parties
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Reports Actions */}
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                elevation={0} 
                sx={{ 
                  borderRadius: 3,
                  height: '100%',
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'success.main',
                    boxShadow: `0 4px 20px ${alpha(theme.palette.success.main, 0.15)}`
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      variant="rounded"
                      sx={{ 
                        bgcolor: alpha(theme.palette.success.main, 0.1), 
                        color: 'success.main',
                        width: 40, 
                        height: 40,
                        borderRadius: 2,
                        mr: 2
                      }}
                    >
                      <TrendingUpIcon />
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold">
                      Reports
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Button 
                      variant="contained" 
                      color="success"
                      component={Link}
                      href="/reports/sales"
                      startIcon={<TrendingUpIcon />}
                      fullWidth
                      sx={{ 
                        borderRadius: 2, 
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      Sales Report
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="success"
                      component={Link}
                      href="/reports"
                      startIcon={<VisibilityIcon />}
                      fullWidth
                      sx={{ 
                        borderRadius: 2, 
                        py: 1,
                        textTransform: 'none'
                      }}
                    >
                      All Reports
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
        
        {/* Charts and Recent Invoices - Grid Layout */}
        <Grid container spacing={3}>
          {/* Sales Overview Chart */}
          <Grid item xs={12} lg={8}>
            <Card 
              elevation={0} 
              sx={{ 
                p: 3, 
                borderRadius: 3,
                height: '100%',
                border: `1px solid ${theme.palette.divider}`,
                overflow: 'hidden'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Sales Overview
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monthly revenue for the current year
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip 
                    label="This Year" 
                    color="primary" 
                    size="small" 
                    variant="filled"
                    sx={{ 
                      borderRadius: 2,
                      fontWeight: 'medium'
                    }}
                  />
                  <Chip 
                    label="Last Year" 
                    color="default" 
                    size="small" 
                    variant="outlined"
                    sx={{ 
                      borderRadius: 2,
                      fontWeight: 'medium'
                    }}
                  />
                </Box>
              </Box>
              
              <Box sx={{ width: '100%', height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={salesData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 25,
                    }}
                    barSize={20}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      dx={-10}
                    />
                    <RechartsTooltip 
                      cursor={{fill: alpha(theme.palette.primary.main, 0.1)}}
                      contentStyle={{
                        borderRadius: 8,
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                      }}
                    />
                    <RechartsLegend 
                      wrapperStyle={{
                        paddingTop: 20
                      }}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill={theme.palette.primary.main} 
                      name="Sales Amount" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid>
          
          {/* Recent Invoices */}
          <Grid item xs={12} lg={4}>
            <Card 
              elevation={0} 
              sx={{ 
                borderRadius: 3,
                height: '100%',
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box sx={{ 
                p: 3, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center'
              }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Recent Invoices
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Latest transactions
                  </Typography>
                </Box>
                
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              
              <Divider />
              
              <Box sx={{ 
                flex: 1, 
                overflow: 'auto',
                maxHeight: 350
              }}>
                {recentInvoices.length > 0 ? (
                  <List disablePadding>
                    {recentInvoices.map((invoice: any, index: number) => (
                      <React.Fragment key={invoice.id}>
                        <ListItem 
                          alignItems="flex-start"
                          sx={{ 
                            px: 3, 
                            py: 2,
                            transition: 'background-color 0.2s',
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.05)
                            }
                          }}
                          component={Link}
                          href={`/invoices/${invoice.id}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <ListItemAvatar>
                            <Avatar 
                              sx={{ 
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: 'primary.main'
                              }}
                            >
                              <InvoiceIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle2" fontWeight="bold">
                                  {invoice.invoiceNumber || `Invoice #${invoice.id.substring(0, 8)}`}
                                </Typography>
                                <Typography variant="subtitle2" fontWeight="bold" color="primary">
                                  ₹{invoice.total?.toFixed(2) || '0.00'}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <React.Fragment>
                                <Typography
                                  variant="body2"
                                  component="span"
                                  color="text.primary"
                                  sx={{ display: 'block', mt: 0.5 }}
                                >
                                  {invoice.partyName}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                  <CalendarIcon fontSize="small" color="action" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {invoice.date}
                                  </Typography>
                                </Box>
                              </React.Fragment>
                            }
                          />
                        </ListItem>
                        {index < recentInvoices.length - 1 && (
                          <Divider component="li" />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center', 
                    alignItems: 'center',
                    height: '100%',
                    p: 3
                  }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                        width: 60,
                        height: 60,
                        mb: 2
                      }}
                    >
                      <InvoiceIcon fontSize="large" />
                    </Avatar>
                    <Typography variant="body1" color="text.secondary" align="center">
                      No recent invoices found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                      Create your first invoice to get started
                    </Typography>
                    <Button 
                      variant="contained" 
                      component={Link}
                      href="/invoices/new"
                      sx={{ mt: 2, borderRadius: 2 }}
                    >
                      Create Invoice
                    </Button>
                  </Box>
                )}
              </Box>
              
              {recentInvoices.length > 0 && (
                <>
                  <Divider />
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Button 
                      component={Link}
                      href="/invoices"
                      endIcon={<VisibilityIcon />}
                      sx={{ 
                        borderRadius: 2,
                        textTransform: 'none'
                      }}
                    >
                      View All Invoices
                    </Button>
                  </Box>
                </>
              )}
            </Card>
          </Grid>
        </Grid>
        
        {/* Additional Widgets */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Inventory Alerts Widget */}
          <Grid item xs={12} md={6} lg={4}>
            <InventoryAlertsWidget />
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
}