"use client";
import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Print as PrintIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  AttachMoney as AttachMoneyIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';

interface SalesSummary {
  totalRevenue: number;
  totalInvoices: number;
  totalCustomers: number;
  averageOrderValue: number;
  revenueGrowth: number;
  invoicesGrowth: number;
  topSellingProduct: string;
  topCustomer: string;
  thisMonth: {
    revenue: number;
    invoices: number;
  };
  lastMonth: {
    revenue: number;
    invoices: number;
  };
}

export default function SalesSummaryPage() {
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesSummary();
  }, []);

  const fetchSalesSummary = async () => {
    try {
      setLoading(true);
      
      // Get current month dates
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Fetch all invoices
      const invoicesRef = collection(db, 'invoices');
      const allInvoicesQuery = query(invoicesRef);
      const allInvoicesSnapshot = await getDocs(allInvoicesQuery);
      
      // Fetch current month invoices
      const currentMonthQuery = query(
        invoicesRef,
        where('createdAt', '>=', currentMonthStart)
      );
      const currentMonthSnapshot = await getDocs(currentMonthQuery);
      
      // Fetch last month invoices
      const lastMonthQuery = query(
        invoicesRef,
        where('createdAt', '>=', lastMonthStart),
        where('createdAt', '<=', lastMonthEnd)
      );
      const lastMonthSnapshot = await getDocs(lastMonthQuery);

      // Process data
      const allInvoices = allInvoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const currentMonthInvoices = currentMonthSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const lastMonthInvoices = lastMonthSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate totals
      const totalRevenue = allInvoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
      const totalInvoices = allInvoices.length;
      
      const uniqueCustomers = new Set(allInvoices.map(inv => inv.customer?.name || inv.partyName)).size;
      const averageOrderValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

      // Calculate monthly data
      const thisMonthRevenue = currentMonthInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
      const lastMonthRevenue = lastMonthInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
      
      // Calculate growth
      const revenueGrowth = lastMonthRevenue > 0 
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;
      
      const invoicesGrowth = lastMonthInvoices.length > 0
        ? ((currentMonthInvoices.length - lastMonthInvoices.length) / lastMonthInvoices.length) * 100
        : 0;

      // Find top selling product and customer
      const productSales: Record<string, number> = {};
      const customerSales: Record<string, number> = {};

      allInvoices.forEach(invoice => {
        const customerName = invoice.customer?.name || invoice.partyName || 'Unknown';
        customerSales[customerName] = (customerSales[customerName] || 0) + (invoice.totalAmount || 0);

        if (invoice.items) {
          invoice.items.forEach((item: any) => {
            const productName = item.description || item.productName || 'Unknown Product';
            productSales[productName] = (productSales[productName] || 0) + (item.amount || 0);
          });
        }
      });

      const topProduct = Object.entries(productSales)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
      
      const topCustomer = Object.entries(customerSales)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

      setSummary({
        totalRevenue,
        totalInvoices,
        totalCustomers: uniqueCustomers,
        averageOrderValue,
        revenueGrowth,
        invoicesGrowth,
        topSellingProduct: topProduct,
        topCustomer,
        thisMonth: {
          revenue: thisMonthRevenue,
          invoices: currentMonthInvoices.length
        },
        lastMonth: {
          revenue: lastMonthRevenue,
          invoices: lastMonthInvoices.length
        }
      });

    } catch (error) {
      console.error('Error fetching sales summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // TODO: Implement PDF download
    console.log('Download sales summary');
  };

  if (loading) {
    return (
      <ModernThemeProvider>
        <VisuallyEnhancedDashboardLayout
          title="Sales Summary"
          pageType="reports"
          enableVisualEffects={true}
          enableParticles={false}
        >
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
              <LinearProgress sx={{ width: '100%' }} />
            </Box>
          </Container>
        </VisuallyEnhancedDashboardLayout>
      </ModernThemeProvider>
    );
  }

  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Sales Summary"
        subtitle="Overview of sales performance and key metrics"
        pageType="reports"
        enableVisualEffects={true}
        enableParticles={false}
        customQuickActions={[
          { icon: <RefreshIcon />, label: 'Refresh', onClick: fetchSalesSummary },
          { icon: <DownloadIcon />, label: 'Export', onClick: handleDownload },
          { icon: <PrintIcon />, label: 'Print', onClick: handlePrint },
        ]}
      >
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          {/* Key Metrics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Total Revenue */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AttachMoneyIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">Total Revenue</Typography>
                  </Box>
                  <Typography variant="h3" sx={{ mb: 1, fontWeight: 'bold' }}>
                    ₹{(summary?.totalRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {(summary?.revenueGrowth || 0) >= 0 ? <TrendingUp /> : <TrendingDown />}
                    <Typography variant="body2" sx={{ ml: 0.5 }}>
                      {formatPercentage(summary?.revenueGrowth || 0)} vs last month
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Total Invoices */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ShoppingCartIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">Total Invoices</Typography>
                  </Box>
                  <Typography variant="h3" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {summary?.totalInvoices || 0}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {(summary?.invoicesGrowth || 0) >= 0 ? <TrendingUp /> : <TrendingDown />}
                    <Typography variant="body2" sx={{ ml: 0.5 }}>
                      {formatPercentage(summary?.invoicesGrowth || 0)} vs last month
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Total Customers */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PeopleIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">Total Customers</Typography>
                  </Box>
                  <Typography variant="h3" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {summary?.totalCustomers || 0}
                  </Typography>
                  <Typography variant="body2">
                    Unique customers served
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Average Order Value */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                color: 'white'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TimelineIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">Avg Order Value</Typography>
                  </Box>
                  <Typography variant="h3" sx={{ mb: 1, fontWeight: 'bold' }}>
                    ₹{(summary?.averageOrderValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Typography>
                  <Typography variant="body2">
                    Per invoice average
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Monthly Comparison & Top Performers */}
          <Grid container spacing={3}>
            {/* Monthly Performance */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <TimelineIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Monthly Performance
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">This Month</Typography>
                      <Typography variant="h5" color="primary.main" sx={{ fontWeight: 'bold' }}>
                        ₹{(summary?.thisMonth.revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </Typography>
                      <Typography variant="body2">{summary?.thisMonth.invoices || 0} invoices</Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">Last Month</Typography>
                      <Typography variant="h5" color="text.primary" sx={{ fontWeight: 'bold' }}>
                        ₹{(summary?.lastMonth.revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </Typography>
                      <Typography variant="body2">{summary?.lastMonth.invoices || 0} invoices</Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Revenue Growth</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {(summary?.revenueGrowth || 0) >= 0 ? (
                      <Chip
                        icon={<TrendingUp />}
                        label={formatPercentage(summary?.revenueGrowth || 0)}
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip
                        icon={<TrendingDown />}
                        label={formatPercentage(summary?.revenueGrowth || 0)}
                        color="error"
                        size="small"
                      />
                    )}
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>Invoice Growth</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {(summary?.invoicesGrowth || 0) >= 0 ? (
                      <Chip
                        icon={<TrendingUp />}
                        label={formatPercentage(summary?.invoicesGrowth || 0)}
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip
                        icon={<TrendingDown />}
                        label={formatPercentage(summary?.invoicesGrowth || 0)}
                        color="error"
                        size="small"
                      />
                    )}
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Top Performers */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Top Performers
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Top Selling Product
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.lighter' }}>
                    <Typography variant="h6" color="success.main">
                      {summary?.topSellingProduct || 'N/A'}
                    </Typography>
                  </Paper>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Top Customer
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.lighter' }}>
                    <Typography variant="h6" color="info.main">
                      {summary?.topCustomer || 'N/A'}
                    </Typography>
                  </Paper>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}