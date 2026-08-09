"use client";
import React, { useMemo } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { Product, Category } from '@/types/inventory';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ProductAnalyticsProps {
  products: Product[];
  categories: Category[];
  stats: {
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    totalValue: number;
    averagePrice: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

export default function ProductAnalytics({ products, categories, stats }: ProductAnalyticsProps) {
  
  // Price range analysis
  const priceRangeAnalysis = useMemo(() => {
    const ranges = [
      { label: '₹0 - ₹100', min: 0, max: 100 },
      { label: '₹101 - ₹500', min: 101, max: 500 },
      { label: '₹501 - ₹1000', min: 501, max: 1000 },
      { label: '₹1001 - ₹5000', min: 1001, max: 5000 },
      { label: '₹5000+', min: 5001, max: Infinity }
    ];

    return ranges.map(range => ({
      range: range.label,
      count: products.filter(p => p.price >= range.min && p.price <= range.max).length,
      percentage: ((products.filter(p => p.price >= range.min && p.price <= range.max).length / stats.totalProducts) * 100).toFixed(1)
    }));
  }, [products, stats.totalProducts]);

  // Category analysis
  const categoryAnalysis = useMemo(() => {
    return categories.map(category => {
      const categoryProducts = products.filter(p => p.categoryId === category.id);
      const totalValue = categoryProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      const avgPrice = categoryProducts.length > 0 ? categoryProducts.reduce((sum, p) => sum + p.price, 0) / categoryProducts.length : 0;
      const lowStockCount = categoryProducts.filter(p => p.quantity < (p.reorderPoint || 10)).length;

      return {
        id: category.id,
        name: category.name,
        productCount: categoryProducts.length,
        totalValue,
        avgPrice,
        lowStockCount,
        percentage: ((categoryProducts.length / stats.totalProducts) * 100).toFixed(1)
      };
    }).sort((a, b) => b.totalValue - a.totalValue);
  }, [products, categories, stats.totalProducts]);

  // Stock level analysis
  const stockAnalysis = useMemo(() => {
    const outOfStock = products.filter(p => p.quantity === 0).length;
    const lowStock = products.filter(p => p.quantity > 0 && p.quantity < (p.reorderPoint || 10)).length;
    const adequateStock = products.filter(p => p.quantity >= (p.reorderPoint || 10) && p.quantity < 50).length;
    const highStock = products.filter(p => p.quantity >= 50).length;

    return [
      { status: 'Out of Stock', count: outOfStock, color: '#F44336' },
      { status: 'Low Stock', count: lowStock, color: '#FF9800' },
      { status: 'Adequate Stock', count: adequateStock, color: '#4CAF50' },
      { status: 'High Stock', count: highStock, color: '#2196F3' }
    ];
  }, [products]);

  // Top performing products
  const topProducts = useMemo(() => {
    return products
      .map(p => ({ ...p, totalValue: p.price * p.quantity }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);
  }, [products]);

  // Price distribution chart data
  const priceDistributionData = useMemo(() => {
    return priceRangeAnalysis.filter(range => range.count > 0);
  }, [priceRangeAnalysis]);

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Product Analytics
      </Typography>

      <Grid container spacing={3}>
        {/* Price Range Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MoneyIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Price Range Distribution
                </Typography>
              </Box>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priceDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Stock Level Analysis */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <InventoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Stock Level Analysis
                </Typography>
              </Box>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stockAnalysis}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stockAnalysis.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Category Performance Analysis */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CategoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Category Performance Analysis
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Products</TableCell>
                      <TableCell align="right">Share (%)</TableCell>
                      <TableCell align="right">Total Value</TableCell>
                      <TableCell align="right">Avg Price</TableCell>
                      <TableCell align="right">Low Stock Items</TableCell>
                      <TableCell align="right">Performance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categoryAnalysis.map((category, index) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={index + 1} 
                              size="small" 
                              color="primary" 
                              variant="outlined" 
                            />
                            {category.name}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{category.productCount}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {category.percentage}%
                            <Box sx={{ width: 50 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={parseFloat(category.percentage)} 
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right">₹{category.totalValue.toLocaleString()}</TableCell>
                        <TableCell align="right">₹{category.avgPrice.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          {category.lowStockCount > 0 ? (
                            <Chip 
                              label={category.lowStockCount} 
                              color="warning" 
                              size="small" 
                              icon={<WarningIcon />}
                            />
                          ) : (
                            <CheckCircleIcon color="success" fontSize="small" />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={category.totalValue > stats.totalValue / categories.length ? 'High' : 'Normal'}
                            color={category.totalValue > stats.totalValue / categories.length ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Products by Value */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Top Products by Inventory Value
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Rank</TableCell>
                      <TableCell>Product Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Stock</TableCell>
                      <TableCell align="right">Total Value</TableCell>
                      <TableCell align="right">Stock Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topProducts.map((product, index) => {
                      const category = categories.find(c => c.id === product.categoryId);
                      const stockStatus = product.quantity === 0 ? 'Out of Stock' : 
                                         product.quantity < (product.reorderPoint || 10) ? 'Low Stock' : 'In Stock';
                      const statusColor = product.quantity === 0 ? 'error' : 
                                         product.quantity < (product.reorderPoint || 10) ? 'warning' : 'success';
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Chip 
                              label={index + 1} 
                              color={index < 3 ? 'primary' : 'default'}
                              variant={index < 3 ? 'filled' : 'outlined'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {product.name}
                            </Typography>
                          </TableCell>
                          <TableCell>{category?.name || 'N/A'}</TableCell>
                          <TableCell align="right">₹{product.price.toFixed(2)}</TableCell>
                          <TableCell align="right">{product.quantity}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold" color="primary">
                              ₹{product.totalValue.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={stockStatus}
                              color={statusColor}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Summary Statistics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Summary Statistics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      {stats.totalProducts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Products
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      ₹{stats.totalValue.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Inventory Value
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      ₹{stats.averagePrice.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Product Price
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                      {stats.lowStockProducts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Low Stock Products
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}