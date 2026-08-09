"use client";
import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Alert,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';

interface StockLevelData {
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  category: string;
  unit: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Overstock';
  value: number; // current stock * unit price
  lastUpdated?: Date;
  supplier?: string;
  location?: string;
  reorderPoint: number;
}

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];

export default function StockLevelsPage() {
  const [stockData, setStockData] = useState<StockLevelData[]>([]);
  const [filteredStock, setFilteredStock] = useState<StockLevelData[]>([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    fetchStockLevels();
  }, []);

  useEffect(() => {
    filterStock();
  }, [stockData, searchTerm, statusFilter, categoryFilter]);

  const fetchStockLevels = async () => {
    try {
      setLoading(true);
      
      // Fetch products with stock information
      const productsRef = collection(db, 'products');
      const productsSnapshot = await getDocs(productsRef);
      
      const stockLevels: StockLevelData[] = productsSnapshot.docs.map(doc => {
        const product = doc.data();
        const currentStock = Number(product.currentStock) || 0;
        const minStock = Number(product.minStock) || 10;
        const maxStock = Number(product.maxStock) || 100;
        const unitPrice = Number(product.price) || 0;
        
        // Determine stock status
        let status: StockLevelData['status'] = 'In Stock';
        if (currentStock === 0) {
          status = 'Out of Stock';
        } else if (currentStock <= minStock) {
          status = 'Low Stock';
        } else if (currentStock >= maxStock * 1.2) {
          status = 'Overstock';
        }

        return {
          productId: doc.id,
          productName: product.name || product.productName || 'Unknown Product',
          currentStock,
          minStock,
          maxStock,
          category: product.category || 'General',
          unit: product.unit || 'PCS',
          status,
          value: currentStock * unitPrice,
          lastUpdated: product.updatedAt?.toDate() || new Date(),
          supplier: product.supplier,
          location: product.location || 'Main Warehouse',
          reorderPoint: minStock
        };
      });

      setStockData(stockLevels);
    } catch (error) {
      console.error('Error fetching stock levels:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStock = () => {
    let filtered = stockData.filter(item => {
      const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });

    setFilteredStock(filtered);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // TODO: Implement CSV download
    console.log('Download stock levels report');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'success';
      case 'Low Stock': return 'warning';
      case 'Out of Stock': return 'error';
      case 'Overstock': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'In Stock': return <CheckCircleIcon />;
      case 'Low Stock': return <WarningIcon />;
      case 'Out of Stock': return <ErrorIcon />;
      case 'Overstock': return <TrendingUpIcon />;
      default: return <InventoryIcon />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const categories = Array.from(new Set(stockData.map(item => item.category)));
  const totalProducts = stockData.length;
  const totalValue = stockData.reduce((sum, item) => sum + item.value, 0);
  const lowStockCount = stockData.filter(item => item.status === 'Low Stock').length;
  const outOfStockCount = stockData.filter(item => item.status === 'Out of Stock').length;

  // Prepare chart data
  const statusDistribution = [
    { name: 'In Stock', value: stockData.filter(item => item.status === 'In Stock').length, color: '#4ECDC4' },
    { name: 'Low Stock', value: lowStockCount, color: '#FECA57' },
    { name: 'Out of Stock', value: outOfStockCount, color: '#FF6B6B' },
    { name: 'Overstock', value: stockData.filter(item => item.status === 'Overstock').length, color: '#45B7D1' }
  ];

  const categoryDistribution = categories.map(category => ({
    name: category,
    value: stockData.filter(item => item.category === category).length,
    totalValue: stockData.filter(item => item.category === category).reduce((sum, item) => sum + item.value, 0)
  }));

  const criticalStock = stockData.filter(item => 
    item.status === 'Out of Stock' || item.status === 'Low Stock'
  ).sort((a, b) => a.currentStock - b.currentStock);

  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Stock Levels Report"
        subtitle="Monitor inventory levels and stock status"
        pageType="reports"
        enableVisualEffects={true}
        enableParticles={false}
        customQuickActions={[
          { icon: <RefreshIcon />, label: 'Refresh', onClick: fetchStockLevels },
          { icon: <DownloadIcon />, label: 'Export', onClick: handleDownload },
          { icon: <PrintIcon />, label: 'Print', onClick: handlePrint },
        ]}
      >
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          {/* Filters */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterListIcon sx={{ mr: 1, color: 'primary.main' }} />
              Stock Level Filters
            </Typography>
            
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status Filter</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status Filter"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="In Stock">In Stock</MenuItem>
                    <MenuItem value="Low Stock">Low Stock</MenuItem>
                    <MenuItem value="Out of Stock">Out of Stock</MenuItem>
                    <MenuItem value="Overstock">Overstock</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category Filter</InputLabel>
                  <Select
                    value={categoryFilter}
                    label="Category Filter"
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {categories.map(category => (
                      <MenuItem key={category} value={category}>{category}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Button
                  variant="contained"
                  onClick={fetchStockLevels}
                  fullWidth
                  disabled={loading}
                  startIcon={<RefreshIcon />}
                >
                  Update Report
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {stockData.length === 0 && !loading && (
            <Alert severity="info" sx={{ mb: 4 }}>
              No stock data found. Make sure products have stock levels configured.
            </Alert>
          )}

          {/* Alert Cards */}
          {(lowStockCount > 0 || outOfStockCount > 0) && (
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {outOfStockCount > 0 && (
                <Grid item xs={12} sm={6}>
                  <Alert 
                    severity="error" 
                    icon={<ErrorIcon />}
                    action={
                      <Button color="inherit" size="small" onClick={() => setStatusFilter('Out of Stock')}>
                        View
                      </Button>
                    }
                  >
                    <strong>{outOfStockCount} products</strong> are out of stock and need immediate attention.
                  </Alert>
                </Grid>
              )}
              {lowStockCount > 0 && (
                <Grid item xs={12} sm={6}>
                  <Alert 
                    severity="warning"
                    icon={<WarningIcon />}
                    action={
                      <Button color="inherit" size="small" onClick={() => setStatusFilter('Low Stock')}>
                        View
                      </Button>
                    }
                  >
                    <strong>{lowStockCount} products</strong> are running low on stock.
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}

          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Total Products</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {totalProducts}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    In inventory
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Total Stock Value</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(totalValue)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Current inventory value
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <Card sx={{ 
                background: lowStockCount > 0 
                  ? 'linear-gradient(135deg, #FFA726 0%, #FF7043 100%)' 
                  : 'linear-gradient(135deg, #4ECDC4 0%, #00BCD4 100%)', 
                color: 'white' 
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Low Stock Items</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {lowStockCount}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Need reordering
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <Card sx={{ 
                background: outOfStockCount > 0 
                  ? 'linear-gradient(135deg, #EF5350 0%, #E53935 100%)' 
                  : 'linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%)', 
                color: 'white' 
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Out of Stock</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {outOfStockCount}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Immediate attention
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {stockData.length > 0 && (
            <Paper sx={{ width: '100%' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="stock analysis tabs">
                  <Tab icon={<PieChart />} label="Stock Overview" iconPosition="start" />
                  <Tab icon={<BarChart />} label="Category Analysis" iconPosition="start" />
                  <Tab icon={<WarningIcon />} label="Critical Stock" iconPosition="start" />
                  <Tab icon={<AssessmentIcon />} label="Detailed Report" iconPosition="start" />
                </Tabs>
              </Box>

              {/* Stock Overview */}
              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Stock Status Distribution</Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={statusDistribution}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {statusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Stock Status Summary</Typography>
                    <Box sx={{ mt: 2 }}>
                      {statusDistribution.map((status) => (
                        <Box key={status.name} sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          p: 2, 
                          mb: 1, 
                          bgcolor: 'grey.50',
                          borderRadius: 1,
                          borderLeft: `4px solid ${status.color}`
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getStatusIcon(status.name)}
                            <Typography variant="body1" sx={{ ml: 1, fontWeight: 'medium' }}>
                              {status.name}
                            </Typography>
                          </Box>
                          <Chip 
                            label={status.value} 
                            color={getStatusColor(status.name) as any}
                            variant="outlined"
                          />
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* Category Analysis */}
              <TabPanel value={tabValue} index={1}>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer>
                    <BarChart data={categoryDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <YAxis yAxisId="right" orientation="right" />
                      <RechartsTooltip 
                        formatter={(value, name) => [
                          name === 'totalValue' ? formatCurrency(value as number) : value,
                          name === 'totalValue' ? 'Total Value' : 'Product Count'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" name="Product Count" />
                      <Bar dataKey="totalValue" fill="#82ca9d" name="Total Value" yAxisId="right" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </TabPanel>

              {/* Critical Stock */}
              <TabPanel value={tabValue} index={2}>
                {criticalStock.length === 0 ? (
                  <Alert severity="success" icon={<CheckCircleIcon />}>
                    All products are adequately stocked! No critical stock issues found.
                  </Alert>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Product</strong></TableCell>
                          <TableCell align="right"><strong>Current Stock</strong></TableCell>
                          <TableCell align="right"><strong>Min Stock</strong></TableCell>
                          <TableCell><strong>Status</strong></TableCell>
                          <TableCell><strong>Category</strong></TableCell>
                          <TableCell><strong>Action Required</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {criticalStock.map((item) => (
                          <TableRow key={item.productId} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ mr: 2, bgcolor: 'error.main', width: 32, height: 32 }}>
                                  {item.productName.charAt(0).toUpperCase()}
                                </Avatar>
                                <Typography variant="body2" fontWeight="medium">
                                  {item.productName}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography 
                                variant="body2" 
                                color={item.currentStock === 0 ? 'error' : 'warning.main'}
                                fontWeight="bold"
                              >
                                {item.currentStock} {item.unit}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">{item.minStock} {item.unit}</TableCell>
                            <TableCell>
                              <Chip
                                icon={getStatusIcon(item.status)}
                                label={item.status}
                                color={getStatusColor(item.status) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell>
                              <Button 
                                size="small" 
                                variant="outlined"
                                color={item.status === 'Out of Stock' ? 'error' : 'warning'}
                              >
                                {item.status === 'Out of Stock' ? 'Urgent Reorder' : 'Reorder Soon'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </TabPanel>

              {/* Detailed Report */}
              <TabPanel value={tabValue} index={3}>
                <TableContainer sx={{ maxHeight: 600 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Product</strong></TableCell>
                        <TableCell align="right"><strong>Current Stock</strong></TableCell>
                        <TableCell align="right"><strong>Min/Max</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell align="right"><strong>Value</strong></TableCell>
                        <TableCell><strong>Category</strong></TableCell>
                        <TableCell><strong>Location</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredStock.map((item) => (
                        <TableRow key={item.productId} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 32, height: 32 }}>
                                {item.productName.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {item.productName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {item.unit}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="medium">
                              {item.currentStock}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {item.minStock} / {item.maxStock}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(item.status)}
                              label={item.status}
                              color={getStatusColor(item.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.value)}
                          </TableCell>
                          <TableCell>
                            <Chip label={item.category} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.location}</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
            </Paper>
          )}
        </Container>
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}