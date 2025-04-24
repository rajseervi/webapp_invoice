"use client";
import React, { useState } from 'react';
import {
  Grid,
  Paper,
  Box,
  Typography,
  useTheme,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  alpha,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon,
  MoreVert as MoreVertIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { 
  Customer, 
  LowStockItem, 
  Invoice 
} from '@/app/dashboard/hooks/dashboardData';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`metrics-tabpanel-${index}`}
      aria-labelledby={`metrics-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `metrics-tab-${index}`,
    'aria-controls': `metrics-tabpanel-${index}`,
  };
}

interface PerformanceMetricsProps {
  topCustomers: Customer[];
  lowStockItems: LowStockItem[];
  recentInvoices: Invoice[];
  formatCurrency: (amount: number) => string;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ 
  topCustomers, 
  lowStockItems, 
  recentInvoices,
  formatCurrency
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Function to get status color
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

  // Function to get stock level color
  const getStockLevelColor = (current: number, min: number) => {
    const ratio = current / min;
    if (ratio <= 0.5) return theme.palette.error.main;
    if (ratio <= 0.8) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  // Function to get customer avatar
  const getCustomerAvatar = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Paper sx={{ 
      borderRadius: 2,
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      overflow: 'hidden'
    }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="performance metrics tabs"
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              py: 2
            }
          }}
        >
          <Tab 
            label="Top Customers" 
            icon={<PersonIcon />} 
            iconPosition="start" 
            {...a11yProps(0)} 
          />
          <Tab 
            label="Inventory Alerts" 
            icon={<InventoryIcon />} 
            iconPosition="start" 
            {...a11yProps(1)} 
          />
          <Tab 
            label="Recent Invoices" 
            icon={<TrendingUpIcon />} 
            iconPosition="start" 
            {...a11yProps(2)} 
          />
        </Tabs>
      </Box>
      
      {/* Top Customers Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {topCustomers.map((customer, index) => (
            <Grid item xs={12} md={6} key={customer.id}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: theme.palette.primary.main,
                        width: 48,
                        height: 48,
                        mr: 2
                      }}
                    >
                      {getCustomerAvatar(customer.name)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="div">
                        {customer.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {customer.ordersCount} orders
                      </Typography>
                    </Box>
                    <Box sx={{ ml: 'auto' }}>
                      <Chip 
                        label={`#${index + 1}`} 
                        color="primary" 
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Spent
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(customer.totalSpent)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Avg. Order Value
                      </Typography>
                      <Typography variant="body1">
                        {formatCurrency(customer.totalSpent / customer.ordersCount)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Customer Since
                      </Typography>
                      <Typography variant="body1">
                        {new Date().getFullYear() - Math.floor(Math.random() * 3) - 1}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Customer Value
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={(customer.totalSpent / topCustomers[0].totalSpent) * 100} 
                        color="primary"
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          mb: 1
                        }} 
                      />
                      <Typography variant="caption" color="text.secondary">
                        {Math.round((customer.totalSpent / topCustomers[0].totalSpent) * 100)}% of top customer
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>
      
      {/* Inventory Alerts Tab */}
      <TabPanel value={tabValue} index={1}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="inventory alerts table">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell align="center">Current Stock</TableCell>
                <TableCell align="center">Min. Stock</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lowStockItems.map((item) => {
                const stockRatio = item.currentStock / item.minStock;
                let statusText = 'Critical';
                let statusColor = 'error';
                
                if (stockRatio > 0.8) {
                  statusText = 'Warning';
                  statusColor = 'warning';
                } else if (stockRatio > 0.5) {
                  statusText = 'Low';
                  statusColor = 'warning';
                }
                
                return (
                  <TableRow
                    key={item.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      <Typography variant="body2" fontWeight="medium">
                        {item.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {item.sku}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        color={getStockLevelColor(item.currentStock, item.minStock)}
                      >
                        {item.currentStock}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary">
                        {item.minStock}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={statusText} 
                        color={statusColor as 'error' | 'warning' | 'success'} 
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <ArrowForwardIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.05), borderRadius: 1, m: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon color="warning" sx={{ mr: 1 }} />
            <Typography variant="subtitle2">
              Inventory Alert Summary
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {lowStockItems.filter(item => item.currentStock / item.minStock <= 0.5).length} items at critical level and 
            {' '}{lowStockItems.filter(item => item.currentStock / item.minStock > 0.5 && item.currentStock / item.minStock <= 0.8).length} items at low stock level.
            Consider restocking these items soon.
          </Typography>
        </Box>
      </TabPanel>
      
      {/* Recent Invoices Tab */}
      <TabPanel value={tabValue} index={2}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="recent invoices table">
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="center">Date</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentInvoices.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    <Typography variant="body2" fontWeight="medium">
                      {invoice.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ 
                          width: 28, 
                          height: 28, 
                          fontSize: '0.875rem',
                          mr: 1,
                          bgcolor: theme.palette.primary.main
                        }}
                      >
                        {getCustomerAvatar(invoice.customer)}
                      </Avatar>
                      <Typography variant="body2">
                        {invoice.customer}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(invoice.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary">
                      {new Date(invoice.date).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)} 
                      color={getStatusColor(invoice.status) as 'success' | 'warning' | 'error' | 'default'} 
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton size="small">
                        <ArrowForwardIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="subtitle2">
              Invoice Summary
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {recentInvoices.filter(inv => inv.status === 'paid').length} paid, 
              {' '}{recentInvoices.filter(inv => inv.status === 'pending').length} pending, 
              {' '}{recentInvoices.filter(inv => inv.status === 'overdue').length} overdue
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2">
              Total Amount
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {formatCurrency(recentInvoices.reduce((sum, inv) => sum + inv.amount, 0))}
            </Typography>
          </Box>
        </Box>
      </TabPanel>
    </Paper>
  );
};

export default PerformanceMetrics;