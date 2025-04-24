"use client";
import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  useTheme,
  alpha,
  Chip,
  Avatar,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  ArrowForward as ArrowForwardIcon,
  Analytics as AnalyticsIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { DashboardStat, Invoice, LowStockItem, Customer, SalesData } from '../hooks/useDashboardData';

// Utility functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'success';
    case 'pending':
      return 'warning';
    case 'overdue':
      return 'error';
    default:
      return 'default';
  }
};

const getCustomerInitial = (name: string) => {
  return name.charAt(0).toUpperCase();
};

const getCustomerAvatarColor = (id: string) => {
  const colors = [
    '#1976d2', '#388e3c', '#d32f2f', '#f57c00', '#7b1fa2',
    '#0288d1', '#689f38', '#e64a19', '#fbc02d', '#512da8'
  ];
  const index = id.charCodeAt(0) % colors.length;
  return colors[index];
};

// Define color constants
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Welcome Section Component
export const WelcomeSection = () => {
  const theme = useTheme();
  const router = useRouter();
  
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 4,
        p: { xs: 3, md: 4 },
        borderRadius: 3,
        background: theme => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
        border: theme => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: theme => `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 70%, transparent 100%)`,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: theme => `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 70%, transparent 100%)`,
        }}
      />
      
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} md={7}>
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom 
              fontWeight={800}
              sx={{ 
                fontSize: { xs: '2rem', md: '2.5rem' },
                background: theme => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              Welcome to your Dashboard
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2, fontWeight: 400 }}>
              Get a quick overview of your business performance and access key features.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                onClick={() => router.push('/analytics')}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  boxShadow: theme => `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`
                }}
              >
                View Analytics
              </Button>
              <Button 
                variant="outlined" 
                color="primary"
                size="large"
                onClick={() => router.push('/invoices')}
                sx={{ borderRadius: 2, px: 3 }}
              >
                Manage Invoices
              </Button>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              position: 'relative',
              zIndex: 1
            }}
          >
            <Box 
              component="img" 
              src="/dashboard-illustration.svg" 
              alt="Dashboard Illustration"
              sx={{ 
                maxWidth: '100%', 
                height: 'auto',
                maxHeight: 200,
                opacity: 0.9
              }}
              onError={(e) => {
                // Fallback if image doesn't exist
                e.currentTarget.style.display = 'none';
              }}
            />
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

// Stats Section Component
export const StatsSection = ({ stats }: { stats: DashboardStat[] }) => {
  const theme = useTheme();
  
  // Add icons to stats
  const statsWithIcons = stats.map((stat, index) => {
    let icon;
    switch (index) {
      case 0:
        icon = <TrendingUpIcon />;
        break;
      case 1:
        icon = <InventoryIcon />;
        break;
      case 2:
        icon = <ReceiptIcon />;
        break;
      case 3:
        icon = <PeopleIcon />;
        break;
      default:
        icon = <TrendingUpIcon />;
    }
    return { ...stat, icon };
  });
  
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {statsWithIcons.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              height: '100%',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                boxShadow: theme => `0 8px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
                transform: 'translateY(-4px)'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: alpha(stat.color, 0.1),
                  color: stat.color,
                  mr: 2
                }}
              >
                {stat.icon}
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {stat.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h5" sx={{ mr: 1, fontWeight: 600 }}>
                    {stat.name.includes('Sales') ? formatCurrency(stat.value) : stat.value}
                  </Typography>
                  <Chip
                    label={`${stat.change > 0 ? '+' : ''}${stat.change}%`}
                    size="small"
                    color={stat.change >= 0 ? 'success' : 'error'}
                    sx={{ height: 20, fontWeight: 500 }}
                  />
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

// Analytics Preview Component
export const AnalyticsPreview = ({ monthlySalesData }: { monthlySalesData: SalesData[] }) => {
  const theme = useTheme();
  const router = useRouter();
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 0,
        borderRadius: 3,
        bgcolor: theme.palette.background.paper,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: theme => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          boxShadow: theme => `0 8px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
          transform: 'translateY(-4px)'
        }
      }}
    >
      <Box 
        sx={{ 
          background: theme => `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.9)} 0%, ${alpha(theme.palette.primary.main, 0.85)} 100%)`,
          p: 3,
          position: 'relative',
          overflow: 'hidden',
          color: 'white'
        }}
      >
        {/* Decorative circles */}
        <Box
          sx={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -20,
            left: 30,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        />
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AnalyticsIcon sx={{ fontSize: 24, mr: 1 }} />
              <Typography variant="h6" fontWeight={600}>
                Analytics Overview
              </Typography>
            </Box>
            <Button 
              size="small" 
              endIcon={<ArrowForwardIcon />}
              onClick={() => router.push('/analytics')}
              sx={{ 
                color: 'white', 
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                }
              }}
            >
              View Details
            </Button>
          </Box>
          
          <Typography variant="body2" sx={{ mb: 2, opacity: 0.9, maxWidth: '80%' }}>
            Track your business performance with real-time analytics and actionable insights.
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Monthly Sales Performance
        </Typography>
        
        <Box sx={{ flex: 1, minHeight: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlySalesData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(theme.palette.divider, 0.5)} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                axisLine={{ stroke: theme.palette.divider }}
                tickLine={{ stroke: theme.palette.divider }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                axisLine={{ stroke: theme.palette.divider }}
                tickLine={{ stroke: theme.palette.divider }}
                tickFormatter={(value) => `₹${value/1000}k`}
              />
              <Tooltip 
                formatter={(value) => [formatCurrency(value as number), 'Sales']}
                contentStyle={{ 
                  backgroundColor: theme.palette.background.paper,
                  borderColor: theme.palette.divider,
                  borderRadius: 8,
                  boxShadow: theme.shadows[3]
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              <Bar 
                dataKey="sales" 
                name="Sales" 
                fill={theme.palette.primary.main} 
                radius={[4, 4, 0, 0]} 
              />
              <Bar 
                dataKey="target" 
                name="Target" 
                fill={alpha(theme.palette.primary.main, 0.4)} 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Paper>
  );
};

// Recent Invoices Component
export const RecentInvoices = ({ invoices }: { invoices: Invoice[] }) => {
  const theme = useTheme();
  const router = useRouter();
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        height: '100%',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Recent Invoices</Typography>
        <Button 
          size="small" 
          endIcon={<ArrowForwardIcon />}
          onClick={() => router.push('/invoices')}
        >
          View All
        </Button>
      </Box>
      
      {invoices.map((invoice, index) => (
        <Box key={invoice.id}>
          <Box sx={{ display: 'flex', py: 1.5, alignItems: 'center' }}>
            <Avatar 
              sx={{ 
                bgcolor: getCustomerAvatarColor(invoice.customerId),
                width: 40,
                height: 40,
                mr: 2
              }}
            >
              {getCustomerInitial(invoice.customer)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2">{invoice.customer}</Typography>
                <Typography variant="subtitle2" fontWeight={600}>
                  {formatCurrency(invoice.amount)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {invoice.id} • {formatDate(invoice.date)}
                </Typography>
                <Chip 
                  label={invoice.status} 
                  size="small"
                  color={getStatusColor(invoice.status) as any}
                  sx={{ height: 24 }}
                />
              </Box>
            </Box>
          </Box>
          {index < invoices.length - 1 && <Divider sx={{ my: 1 }} />}
        </Box>
      ))}
    </Paper>
  );
};

// Low Stock Items Component
export const LowStockItemsSection = ({ items }: { items: LowStockItem[] }) => {
  const theme = useTheme();
  const router = useRouter();
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        height: '100%',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6">Low Stock Items</Typography>
          <Chip 
            label={items.length} 
            size="small" 
            color="error" 
            sx={{ ml: 1, height: 20, minWidth: 20 }} 
          />
        </Box>
        <Button 
          size="small" 
          endIcon={<ArrowForwardIcon />}
          onClick={() => router.push('/inventory')}
        >
          View Inventory
        </Button>
      </Box>
      
      {items.map((item, index) => (
        <Box key={item.id}>
          <Box sx={{ display: 'flex', py: 1.5, alignItems: 'center' }}>
            <Box 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.error.main, 0.1),
                color: theme.palette.error.main,
                mr: 2
              }}
            >
              <WarningIcon />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2">{item.name}</Typography>
                <Typography 
                  variant="subtitle2" 
                  fontWeight={600}
                  color={item.currentStock <= item.minStock / 2 ? 'error' : 'warning.main'}
                >
                  {item.currentStock} left
                </Typography>
              </Box>
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    SKU: {item.sku}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Min: {item.minStock}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(item.currentStock / item.minStock) * 100} 
                  color={item.currentStock <= item.minStock / 2 ? 'error' : 'warning'}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            </Box>
          </Box>
          {index < items.length - 1 && <Divider sx={{ my: 1 }} />}
        </Box>
      ))}
    </Paper>
  );
};

// Top Customers Component
export const TopCustomers = ({ customers }: { customers: Customer[] }) => {
  const theme = useTheme();
  const router = useRouter();
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        height: '100%',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Top Customers</Typography>
        <Button 
          size="small" 
          endIcon={<ArrowForwardIcon />}
          onClick={() => router.push('/parties')}
        >
          View All
        </Button>
      </Box>
      
      {customers.map((customer, index) => (
        <Box key={customer.id}>
          <Box sx={{ display: 'flex', py: 1.5, alignItems: 'center' }}>
            <Avatar 
              sx={{ 
                bgcolor: getCustomerAvatarColor(customer.id),
                width: 40,
                height: 40,
                mr: 2
              }}
            >
              {getCustomerInitial(customer.name)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2">{customer.name}</Typography>
                <Typography variant="subtitle2" fontWeight={600}>
                  {formatCurrency(customer.totalSpent)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {customer.ordersCount} orders
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: theme.palette.success.main,
                      mr: 0.5
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Active
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
          {index < customers.length - 1 && <Divider sx={{ my: 1 }} />}
        </Box>
      ))}
    </Paper>
  );
};

// Category Sales Component
export const CategorySales = ({ data }: { data: SalesData[] }) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        height: '100%',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      <Typography variant="h6" sx={{ mb: 3 }}>Sales by Category</Typography>
      <Box sx={{ height: 250, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

// Daily Sales Trend Component
export const DailySalesTrend = ({ data }: { data: SalesData[] }) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        height: '100%',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      <Typography variant="h6" sx={{ mb: 3 }}>Daily Sales Trend</Typography>
      <Box sx={{ height: 250, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
              axisLine={{ stroke: theme.palette.divider }}
              tickLine={{ stroke: theme.palette.divider }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
              axisLine={{ stroke: theme.palette.divider }}
              tickLine={{ stroke: theme.palette.divider }}
              tickFormatter={(value) => `₹${value/1000}k`}
            />
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(theme.palette.divider, 0.5)} />
            <Tooltip 
              formatter={(value) => [formatCurrency(value as number), 'Sales']}
              contentStyle={{ 
                backgroundColor: theme.palette.background.paper,
                borderColor: theme.palette.divider,
                borderRadius: 8,
                boxShadow: theme.shadows[3]
              }}
            />
            <Area 
              type="monotone" 
              dataKey="amount" 
              stroke={theme.palette.primary.main} 
              fillOpacity={1} 
              fill="url(#colorUv)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};