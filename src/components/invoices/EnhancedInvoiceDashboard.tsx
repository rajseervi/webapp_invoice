"use client";
import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  LinearProgress,
  Avatar,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  MonetizationOn as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Analytics as AnalyticsIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Assessment as AssessmentIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { invoiceService } from '@/services/invoiceService';

interface DashboardStats {
  totalInvoices: number;
  totalRevenue: number;
  pendingInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  monthlyGrowth: number;
  averageInvoiceValue: number;
}

interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  partyName: string;
  totalAmount: number;
  createdAt: string;
  status: 'paid' | 'pending' | 'overdue';
}

export default function EnhancedInvoiceDashboard() {
  const theme = useTheme();
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    monthlyGrowth: 0,
    averageInvoiceValue: 0
  });
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load real invoice data
      const invoiceData = await invoiceService.getInvoices();
      
      // Calculate real statistics
      const totalInvoices = invoiceData.length;
      const totalRevenue = invoiceData.reduce((sum, invoice) => sum + (invoice.total || invoice.totalAmount || 0), 0);
      const paidInvoices = invoiceData.filter(invoice => invoice.status === 'paid').length;
      const pendingInvoices = invoiceData.filter(invoice => !invoice.status || invoice.status === 'pending').length;
      const overdueInvoices = invoiceData.filter(invoice => invoice.status === 'overdue').length;
      const averageInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;
      
      // Calculate monthly growth (simplified - comparing current month to previous month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const currentMonthInvoices = invoiceData.filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt || invoice.saleDate || invoice.date || '');
        return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
      });
      const previousMonthInvoices = invoiceData.filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt || invoice.saleDate || invoice.date || '');
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return invoiceDate.getMonth() === prevMonth && invoiceDate.getFullYear() === prevYear;
      });
      
      const monthlyGrowth = previousMonthInvoices.length > 0 
        ? ((currentMonthInvoices.length - previousMonthInvoices.length) / previousMonthInvoices.length) * 100
        : currentMonthInvoices.length > 0 ? 100 : 0;
      
      setStats({
        totalInvoices,
        totalRevenue,
        pendingInvoices,
        paidInvoices,
        overdueInvoices,
        monthlyGrowth,
        averageInvoiceValue
      });

      // Get recent invoices (last 3)
      const sortedInvoices = invoiceData
        .sort((a, b) => new Date(b.createdAt || b.saleDate || b.date || '').getTime() - new Date(a.createdAt || a.saleDate || a.date || '').getTime())
        .slice(0, 3);
        
      const recentInvoicesData = sortedInvoices.map(invoice => ({
        id: invoice.id || '',
        invoiceNumber: invoice.invoiceNumber || '',
        partyName: invoice.partyName || invoice.customer?.name || 'Unknown',
        totalAmount: invoice.total || invoice.totalAmount || 0,
        createdAt: invoice.createdAt || invoice.saleDate || invoice.date || '',
        status: invoice.status || 'pending'
      }));
      
      setRecentInvoices(recentInvoicesData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircleIcon />;
      case 'pending': return <ScheduleIcon />;
      case 'overdue': return <WarningIcon />;
      default: return <ReceiptIcon />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          Loading Dashboard...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            📊 Invoice Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Overview of your invoice performance and recent activities
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<DownloadIcon />}>
            Export Report
          </Button>
          <Button variant="outlined" startIcon={<PrintIcon />}>
            Print
          </Button>
          <Button variant="contained" startIcon={<AddIcon />}>
            New Invoice
          </Button>
        </Stack>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Invoices
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.totalInvoices.toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  <ReceiptIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {formatCurrency(stats.totalRevenue)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUpIcon color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                      +{stats.monthlyGrowth}% this month
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                  <MoneyIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Pending Payment
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.pendingInvoices}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(stats.pendingInvoices / stats.totalInvoices) * 100}
                    sx={{ mt: 1, height: 4, borderRadius: 2 }}
                    color="warning"
                  />
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                  <ScheduleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Overdue
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                    {stats.overdueInvoices}
                  </Typography>
                  <Typography variant="body2" color="error.main">
                    Requires attention
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.error.main }}>
                  <WarningIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Content Grid */}
      <Grid container spacing={3}>
        {/* Recent Invoices */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  📋 Recent Invoices
                </Typography>
                <Button variant="text" endIcon={<ViewIcon />}>
                  View All
                </Button>
              </Box>
              
              <List sx={{ width: '100%' }}>
                {recentInvoices.map((invoice, index) => (
                  <React.Fragment key={invoice.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: alpha(theme.palette[getStatusColor(invoice.status) as keyof typeof theme.palette].main, 0.1) }}>
                          {getStatusIcon(invoice.status)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {invoice.invoiceNumber}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                              {formatCurrency(invoice.totalAmount)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              {invoice.partyName}
                            </Typography>
                            <Chip
                              label={invoice.status.toUpperCase()}
                              size="small"
                              color={getStatusColor(invoice.status) as any}
                              variant="outlined"
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentInvoices.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats & Actions */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            {/* Payment Status Distribution */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    💳 Payment Status
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Paid</Typography>
                        <Typography variant="body2">{stats.paidInvoices}</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(stats.paidInvoices / stats.totalInvoices) * 100}
                        color="success"
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Pending</Typography>
                        <Typography variant="body2">{stats.pendingInvoices}</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(stats.pendingInvoices / stats.totalInvoices) * 100}
                        color="warning"
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Overdue</Typography>
                        <Typography variant="body2">{stats.overdueInvoices}</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(stats.overdueInvoices / stats.totalInvoices) * 100}
                        color="error"
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    ⚡ Quick Actions
                  </Typography>
                  <Stack spacing={1}>
                    <Button variant="outlined" fullWidth startIcon={<ReceiptIcon />}>
                      Create Invoice
                    </Button>
                    <Button variant="outlined" fullWidth startIcon={<AssessmentIcon />}>
                      View Reports
                    </Button>
                    <Button variant="outlined" fullWidth startIcon={<AccountBalanceIcon />}>
                      Payment Tracking
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Average Invoice Value */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    💰 Avg Invoice Value
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {formatCurrency(stats.averageInvoiceValue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Based on last 30 days
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}