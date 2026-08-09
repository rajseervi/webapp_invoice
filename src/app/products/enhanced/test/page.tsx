"use client"
import React, { useState, useEffect } from 'react';
import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';
import {
  Container,
  Typography,
  Box,
  Button,
  Alert,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Visibility,
  BookmarkBorder,
  Bookmark,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Cancel,
  Inventory,
  AttachMoney
} from '@mui/icons-material';
import {
  collection,
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '@/firebase/config';

// Simplified Product interface for testing
interface TestProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  hsnCode?: string;
  gstRate?: number;
  sku?: string;
  isBookmarked?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function EnhancedProductsTestPage() {
  // State
  const [products, setProducts] = useState<TestProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Statistics
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    categoriesCount: 0
  });

  // Fetch products from Firestore with safe date handling
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsRef = collection(db, 'products');
      const q = query(productsRef, orderBy('name'));
      const snapshot = await getDocs(q);
      
      const productsList: TestProduct[] = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Helper function to safely convert dates
        const safeToDate = (dateField: any): Date => {
          if (!dateField) return new Date();
          if (typeof dateField.toDate === 'function') {
            return dateField.toDate();
          }
          if (dateField instanceof Date) {
            return dateField;
          }
          if (typeof dateField === 'string') {
            return new Date(dateField);
          }
          return new Date();
        };

        return {
          id: doc.id,
          name: data.name || '',
          category: data.category || '',
          price: Number(data.price) || 0,
          stock: Number(data.stock) || 0,
          status: data.status || (Number(data.stock) > 0 ? 'In Stock' : 'Out of Stock'),
          hsnCode: data.hsnCode || '',
          gstRate: Number(data.gstRate) || 0,
          sku: data.sku || '',
          isBookmarked: Boolean(data.isBookmarked) || false,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt)
        };
      });
      
      setProducts(productsList);
      calculateStats(productsList);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (productsList: TestProduct[]) => {
    const totalProducts = productsList.length;
    const totalValue = productsList.reduce((sum, product) => sum + (product.price * product.stock), 0);
    const lowStockCount = productsList.filter(p => p.stock > 0 && p.stock <= 10).length;
    const outOfStockCount = productsList.filter(p => p.stock === 0).length;
    const categoriesCount = new Set(productsList.map(p => p.category)).size;
    
    setStats({
      totalProducts,
      totalValue,
      lowStockCount,
      outOfStockCount,
      categoriesCount
    });
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === '' || product.category === categoryFilter;
    
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'in-stock' && product.stock > 10) ||
      (statusFilter === 'low-stock' && product.stock > 0 && product.stock <= 10) ||
      (statusFilter === 'out-of-stock' && product.stock === 0);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Paginated products
  const paginatedProducts = filteredProducts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Get unique categories for filter
  const categories = Array.from(new Set(products.map(p => p.category))).sort();

  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(paginatedProducts.map(p => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  // Get status color and icon
  const getStatusDisplay = (stock: number) => {
    if (stock === 0) {
      return { color: 'error' as const, icon: <Cancel />, text: 'Out of Stock' };
    } else if (stock <= 10) {
      return { color: 'warning' as const, icon: <Warning />, text: 'Low Stock' };
    } else {
      return { color: 'success' as const, icon: <CheckCircle />, text: 'In Stock' };
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <ImprovedDashboardLayout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Enhanced Products (Test Mode)
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={fetchProducts}
                disabled={loading}
              >
                Refresh
              </Button>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => console.log('Add product')}
              >
                Add Product
              </Button>
            </Box>
          </Box>

          {/* Statistics Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    <Inventory sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      {stats.totalProducts}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Products
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    <AttachMoney sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="h5" color="success.main" fontWeight="bold">
                      {stats.totalValue.toLocaleString()}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Value (₹)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="h5" color="success.main" fontWeight="bold">
                      {stats.totalProducts - stats.lowStockCount - stats.outOfStockCount}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    In Stock
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    <Warning sx={{ mr: 1, color: 'warning.main' }} />
                    <Typography variant="h5" color="warning.main" fontWeight="bold">
                      {stats.lowStockCount}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Low Stock
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    <Cancel sx={{ mr: 1, color: 'error.main' }} />
                    <Typography variant="h5" color="error.main" fontWeight="bold">
                      {stats.outOfStockCount}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Out of Stock
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Filters and Search */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchTerm('')}
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="in-stock">In Stock</MenuItem>
                  <MenuItem value="low-stock">Low Stock</MenuItem>
                  <MenuItem value="out-of-stock">Out of Stock</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('');
                    setStatusFilter('all');
                  }}
                >
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Active Filters */}
        {(searchTerm || categoryFilter || statusFilter !== 'all') && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Typography variant="body2" sx={{ alignSelf: 'center', mr: 1 }}>
              Active Filters:
            </Typography>
            
            {searchTerm && (
              <Chip
                label={`Search: ${searchTerm}`}
                onDelete={() => setSearchTerm('')}
                size="small"
                color="primary"
              />
            )}
            
            {categoryFilter && (
              <Chip
                label={`Category: ${categoryFilter}`}
                onDelete={() => setCategoryFilter('')}
                size="small"
                color="primary"
              />
            )}
            
            {statusFilter !== 'all' && (
              <Chip
                label={`Status: ${statusFilter}`}
                onDelete={() => setStatusFilter('all')}
                size="small"
                color="primary"
              />
            )}
          </Box>
        )}

        {/* Selection Actions */}
        {selectedProducts.size > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="body2" color="primary">
              {selectedProducts.size} selected
            </Typography>
            <Button size="small" variant="outlined">
              Export
            </Button>
            <Button size="small" variant="outlined" color="error">
              Delete
            </Button>
          </Box>
        )}

        {/* Products Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedProducts.size > 0 && selectedProducts.size < paginatedProducts.length}
                    checked={paginatedProducts.length > 0 && selectedProducts.size === paginatedProducts.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell>Name</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>GST Rate</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    Loading products...
                  </TableCell>
                </TableRow>
              ) : paginatedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="h6" color="text.secondary">
                      No products found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try adjusting your search or filters
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((product) => {
                  const statusDisplay = getStatusDisplay(product.stock);
                  return (
                    <TableRow key={product.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedProducts.has(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {product.name}
                          </Typography>
                          {product.isBookmarked && (
                            <Bookmark color="warning" fontSize="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{product.sku || '-'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={product.category} 
                          size="small" 
                          variant="outlined" 
                        />
                      </TableCell>
                      <TableCell>₹{product.price.toFixed(2)}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>
                        <Chip
                          icon={statusDisplay.icon}
                          label={statusDisplay.text}
                          size="small"
                          color={statusDisplay.color}
                        />
                      </TableCell>
                      <TableCell>{product.gstRate ? `${product.gstRate}%` : '-'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View">
                            <IconButton size="small" color="primary">
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" color="secondary">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error">
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={filteredProducts.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Container>
    </ImprovedDashboardLayout>
  );
}