"use client"
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  useTheme
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';

// Define threshold for low stock
const LOW_STOCK_THRESHOLD = 10;
const CRITICAL_STOCK_THRESHOLD = 5;

// Interface for product data
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

// Interface for category data
interface CategoryData {
  name: string;
  totalProducts: number;
  lowStockProducts: number;
  criticalStockProducts: number;
  averageStock: number;
}

export default function InventoryAlertsPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tabValue, setTabValue] = useState(0);
  
  // Colors for the charts
  const normalColor = theme.palette.primary.main;
  const warningColor = theme.palette.warning.main;
  const criticalColor = theme.palette.error.main;

  // Fetch products data
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsRef = collection(db, 'products');
      const productsQuery = query(productsRef, orderBy('stock', 'asc'));
      const productsSnapshot = await getDocs(productsQuery);
      
      const productsData = productsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          category: data.category,
          price: data.price,
          stock: data.stock
        };
      });
      
      setProducts(productsData);
      
      // Filter low stock products
      const lowStock = productsData.filter(product => product.stock <= LOW_STOCK_THRESHOLD);
      setLowStockProducts(lowStock);
      
      // Process category data
      processCategoryData(productsData);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch inventory data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Process category data for charts
  const processCategoryData = (productsData: Product[]) => {
    // Group products by category
    const categoriesMap = new Map<string, Product[]>();
    
    productsData.forEach(product => {
      const category = product.category || 'Uncategorized';
      if (!categoriesMap.has(category)) {
        categoriesMap.set(category, []);
      }
      categoriesMap.get(category)?.push(product);
    });
    
    // Calculate statistics for each category
    const categoryStats: CategoryData[] = [];
    
    categoriesMap.forEach((products, categoryName) => {
      const totalProducts = products.length;
      const lowStockProducts = products.filter(p => p.stock <= LOW_STOCK_THRESHOLD && p.stock > CRITICAL_STOCK_THRESHOLD).length;
      const criticalStockProducts = products.filter(p => p.stock <= CRITICAL_STOCK_THRESHOLD).length;
      const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
      const averageStock = totalProducts > 0 ? Math.round(totalStock / totalProducts) : 0;
      
      categoryStats.push({
        name: categoryName,
        totalProducts,
        lowStockProducts,
        criticalStockProducts,
        averageStock
      });
    });
    
    // Sort categories by number of low stock products (descending)
    categoryStats.sort((a, b) => (b.lowStockProducts + b.criticalStockProducts) - (a.lowStockProducts + a.criticalStockProducts));
    
    setCategoryData(categoryStats);
  };
  
  // Handle category filter change
  const handleCategoryChange = (event: any) => {
    setSelectedCategory(event.target.value);
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Filter products based on selected category
  const filteredProducts = selectedCategory === 'all' 
    ? lowStockProducts 
    : lowStockProducts.filter(product => product.category === selectedCategory);
  
  // Prepare data for product-based chart
  const productChartData = filteredProducts
    .slice(0, 10) // Show top 10 products with lowest stock
    .map(product => ({
      name: product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name,
      stock: product.stock,
      threshold: LOW_STOCK_THRESHOLD
    }))
    .sort((a, b) => a.stock - b.stock); // Sort by stock (ascending)
  
  // Prepare data for category-based chart
  const categoryChartData = categoryData.map(category => ({
    name: category.name,
    normal: category.totalProducts - category.lowStockProducts - category.criticalStockProducts,
    warning: category.lowStockProducts,
    critical: category.criticalStockProducts
  }));
  
  // Initial data fetch
  useEffect(() => {
    fetchProducts();
  }, []);
  
  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Inventory Alerts
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Total Products
                    </Typography>
                    <Typography variant="h3">
                      {products.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="warning.main" gutterBottom>
                      Low Stock Products
                    </Typography>
                    <Typography variant="h3" color="warning.main">
                      {products.filter(p => p.stock <= LOW_STOCK_THRESHOLD && p.stock > CRITICAL_STOCK_THRESHOLD).length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="error.main" gutterBottom>
                      Critical Stock Products
                    </Typography>
                    <Typography variant="h3" color="error.main">
                      {products.filter(p => p.stock <= CRITICAL_STOCK_THRESHOLD).length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* Tabs for different views */}
            <Paper sx={{ mb: 4 }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                centered
              >
                <Tab label="Category Overview" />
                <Tab label="Product Details" />
              </Tabs>
            </Paper>
            
            {/* Category Overview Tab */}
            {tabValue === 0 && (
              <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Inventory Status by Category
                </Typography>
                <Box sx={{ height: 400, mt: 3 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryChartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end"
                        height={70}
                        interval={0}
                      />
                      <YAxis label={{ value: 'Number of Products', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="normal" name="Normal Stock" stackId="a" fill={normalColor} />
                      <Bar dataKey="warning" name="Low Stock" stackId="a" fill={warningColor} />
                      <Bar dataKey="critical" name="Critical Stock" stackId="a" fill={criticalColor} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
                
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Category Details
                  </Typography>
                  <Grid container spacing={2}>
                    {categoryData.map((category) => (
                      <Grid item xs={12} md={6} lg={4} key={category.name}>
                        <Card variant="outlined">
                          <CardHeader 
                            title={category.name} 
                            subheader={`${category.totalProducts} products`}
                            titleTypographyProps={{ variant: 'h6' }}
                          />
                          <Divider />
                          <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Average Stock: {category.averageStock} units
                            </Typography>
                            <Typography variant="body2" color="warning.main" gutterBottom>
                              Low Stock: {category.lowStockProducts} products
                            </Typography>
                            <Typography variant="body2" color="error.main" gutterBottom>
                              Critical Stock: {category.criticalStockProducts} products
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Paper>
            )}
            
            {/* Product Details Tab */}
            {tabValue === 1 && (
              <Paper sx={{ p: 3, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5">
                    Low Stock Products
                  </Typography>
                  <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                    <InputLabel id="category-filter-label">Filter by Category</InputLabel>
                    <Select
                      labelId="category-filter-label"
                      id="category-filter"
                      value={selectedCategory}
                      onChange={handleCategoryChange}
                      label="Filter by Category"
                    >
                      <MenuItem value="all">
                        <em>All Categories</em>
                      </MenuItem>
                      {categoryData.map((category) => (
                        <MenuItem key={category.name} value={category.name}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ height: 400, mt: 3 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={productChartData}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" label={{ value: 'Stock Quantity', position: 'insideBottom', offset: -10 }} />
                      <YAxis type="category" dataKey="name" width={100} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="stock" name="Current Stock" barSize={20}>
                        {productChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.stock <= CRITICAL_STOCK_THRESHOLD ? criticalColor : warningColor} 
                          />
                        ))}
                      </Bar>
                      <Bar dataKey="threshold" name="Low Stock Threshold" barSize={2} fill="#000000" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
                
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={() => window.location.href = '/products'}
                  >
                    Manage Inventory
                  </Button>
                </Box>
              </Paper>
            )}
          </>
        )}
      </Container>
    </DashboardLayout>
  );
}