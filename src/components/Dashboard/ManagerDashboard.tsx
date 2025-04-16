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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
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
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

interface Product {
  id: string;
  name: string;
  stock: number;
  price: number;
  category?: string;
}

interface DashboardStats {
  totalInvoices: number;
  totalParties: number;
  totalProducts: number;
  totalRevenue: number;
  lowStockItems: number;
}

export default function ManagerDashboard() {
  const theme = useTheme();
  const router = useRouter();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    totalParties: 0,
    totalProducts: 0,
    totalRevenue: 0,
    lowStockItems: 0
  });
  
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        setLoading(true);
        
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
        
        // Fetch products count and low stock items
        const productsCollection = collection(db, 'products');
        const productsSnapshot = await getDocs(productsCollection);
        const productsCount = productsSnapshot.size;
        
        // Get low stock products
        const lowStockItems: Product[] = [];
        productsSnapshot.forEach(doc => {
          const productData = doc.data();
          if (productData.stock < 10) { // Assuming 10 is the threshold
            lowStockItems.push({
              id: doc.id,
              name: productData.name,
              stock: productData.stock,
              price: productData.price,
              category: productData.category
            });
          }
        });
        
        // Update state
        setStats({
          totalInvoices: invoicesCount,
          totalParties: partiesCount,
          totalProducts: productsCount,
          totalRevenue: totalRevenue,
          lowStockItems: lowStockItems.length
        });
        
        setRecentInvoices(recentInvoicesList);
        setLowStockProducts(lowStockItems);
        
      } catch (err) {
        console.error('Error fetching manager dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchManagerData();
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
          Loading manager dashboard...
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
            Manager Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor sales, inventory, and business performance
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
              </Box>
              
              <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 0.5 }}>
                {stats.totalProducts}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Total Products
              </Typography>
              
              <Button 
                variant="outlined" 
                color="info" 
                size="small" 
                fullWidth
                onClick={() => router.push('/products')}
                sx={{ borderRadius: 2 }}
              >
                Manage Products
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Low Stock Card */}
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
                  <AssignmentIcon />
                </Avatar>
              </Box>
              
              <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 0.5 }}>
                {stats.lowStockItems}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Low Stock Items
              </Typography>
              
              <Button 
                variant="outlined" 
                color="warning" 
                size="small" 
                fullWidth
                onClick={() => router.push('/inventory/alerts')}
                sx={{ borderRadius: 2 }}
              >
                View Alerts
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
              >
                View All
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Party</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentInvoices.map((invoice) => (
                    <TableRow 
                      key={invoice.id}
                      sx={{ 
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                        cursor: 'pointer'
                      }}
                      onClick={() => router.push(`/invoices/${invoice.id}`)}
                    >
                      <TableCell>{invoice.invoiceNumber || '-'}</TableCell>
                      <TableCell>{invoice.partyName || '-'}</TableCell>
                      <TableCell>
                        {invoice.date ? new Date(invoice.date.seconds * 1000).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell align="right">₹{invoice.total?.toLocaleString('en-IN') || '-'}</TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={invoice.status || 'Completed'} 
                          size="small"
                          color={
                            invoice.status === 'Paid' ? 'success' : 
                            invoice.status === 'Pending' ? 'warning' : 'default'
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        
        {/* Low Stock Products */}
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
                Low Stock Products
              </Typography>
              <Button 
                variant="text" 
                size="small" 
                endIcon={<VisibilityIcon />}
                onClick={() => router.push('/inventory/alerts')}
              >
                View All
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Stock</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lowStockProducts.map((product) => (
                    <TableRow 
                      key={product.id}
                      sx={{ 
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                      }}
                    >
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.category || '-'}</TableCell>
                      <TableCell align="right">₹{product.price?.toLocaleString('en-IN') || '-'}</TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          color={product.stock <= 5 ? 'error.main' : 'warning.main'}
                          fontWeight="medium"
                        >
                          {product.stock}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button 
                          size="small" 
                          variant="outlined"
                          color="primary"
                          onClick={() => router.push(`/products/${product.id}`)}
                        >
                          Update
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        
        {/* Quick Actions */}
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
              Quick Actions
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<AddIcon />}
                  onClick={() => router.push('/invoices/new')}
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
                  New Invoice
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<InventoryIcon />}
                  onClick={() => router.push('/products/new')}
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
                  Add Product
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<PeopleIcon />}
                  onClick={() => router.push('/parties/new')}
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
                  Add Party
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<TrendingUpIcon />}
                  onClick={() => router.push('/reports/sales')}
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
                  Sales Report
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}