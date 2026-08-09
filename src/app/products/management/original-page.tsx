import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Dashboard as DashboardIcon,
  Upload as ImportIcon,
  Download as ExportIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';
import PageHeader from '@/components/PageHeader/PageHeader';
import ProductList from '../components/ProductList';
import ProductForm from '../components/ProductForm';
import { productService, ProductFilters } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { Product, Category } from '@/types/inventory';

export default function OriginalPageComponent() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [productDialog, setProductDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewDialog, setViewDialog] = useState(false);

  // Filter states
  const [filters, setFilters] = useState<ProductFilters>({
    searchTerm: '',
    category: '',
    status: 'all',
    priceRange: [0, 100000],
    stockRange: [0, 10000],
    gstRate: undefined,
    isService: undefined
  });

  // Selection state
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData] = await Promise.all([
        categoryService.getCategories()
      ]);
      setCategories(categoriesData);
      await loadProducts();
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const result = await productService.getProducts(filters);
      setProducts(result.products);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products');
    }
  };

  const handleCreateProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await productService.createProduct(productData);
      setSuccess('Product created successfully');
      setProductDialog(false);
      setSelectedProduct(null);
      await loadProducts();
    } catch (err) {
      console.error('Error creating product:', err);
      setError('Failed to create product');
    }
  };

  const handleUpdateProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedProduct?.id) return;

    try {
      await productService.updateProduct(selectedProduct.id, productData);
      setSuccess('Product updated successfully');
      setProductDialog(false);
      setSelectedProduct(null);
      await loadProducts();
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await productService.deleteProduct(productId);
      setSuccess('Product deleted successfully');
      await loadProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
    }
  };

  const handleBulkUpdate = async (updateData: any) => {
    if (selectedProducts.length === 0) return;

    try {
      await productService.bulkUpdateProducts(selectedProducts, updateData);
      setSuccess(`Updated ${selectedProducts.length} products successfully`);
      setSelectedProducts([]);
      await loadProducts();
    } catch (err) {
      console.error('Error bulk updating products:', err);
      setError('Failed to update products');
    }
  };

  const handleFilterChange = (field: keyof ProductFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      category: '',
      status: 'all',
      priceRange: [0, 100000],
      stockRange: [0, 10000],
      gstRate: undefined,
      isService: undefined
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.category) count++;
    if (filters.status !== 'all') count++;
    if (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000)) count++;
    if (filters.stockRange && (filters.stockRange[0] > 0 || filters.stockRange[1] < 10000)) count++;
    if (filters.gstRate !== undefined) count++;
    if (filters.isService !== undefined) count++;
    return count;
  };

  return (
    <ImprovedDashboardLayout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <PageHeader
          title="Product Management"
          subtitle="Manage your product inventory with GST compliance"
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<DashboardIcon />}
                onClick={() => router.push('/products/dashboard')}
              >
                Dashboard
              </Button>
              <Button
                variant="outlined"
                startIcon={<ImportIcon />}
                onClick={() => router.push('/products/import')}
              >
                Import
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedProduct(null);
                  setProductDialog(true);
                }}
              >
                Add Product
              </Button>
            </Box>
          }
        />

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search products..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filters.category || ''}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    label="Category"
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status || 'all'}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="low-stock">Low Stock</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>GST Rate</InputLabel>
                  <Select
                    value={filters.gstRate || ''}
                    onChange={(e) => handleFilterChange('gstRate', e.target.value || undefined)}
                    label="GST Rate"
                  >
                    <MenuItem value="">All Rates</MenuItem>
                    <MenuItem value={0}>0%</MenuItem>
                    <MenuItem value={5}>5%</MenuItem>
                    <MenuItem value={12}>12%</MenuItem>
                    <MenuItem value={18}>18%</MenuItem>
                    <MenuItem value={28}>28%</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filters.isService === undefined ? '' : filters.isService ? 'service' : 'goods'}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleFilterChange('isService', value === '' ? undefined : value === 'service');
                    }}
                    label="Type"
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="goods">Goods</MenuItem>
                    <MenuItem value="service">Services</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={1}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Clear filters">
                    <Button
                      size="small"
                      onClick={clearFilters}
                      disabled={getActiveFiltersCount() === 0}
                    >
                      <ClearIcon />
                    </Button>
                  </Tooltip>
                  <Tooltip title="Refresh">
                    <Button size="small" onClick={loadProducts}>
                      <RefreshIcon />
                    </Button>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>

            {/* Active Filters */}
            {getActiveFiltersCount() > 0 && (
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2" sx={{ mr: 1, alignSelf: 'center' }}>
                  Active filters:
                </Typography>
                {filters.searchTerm && (
                  <Chip
                    label={`Search: ${filters.searchTerm}`}
                    size="small"
                    onDelete={() => handleFilterChange('searchTerm', '')}
                  />
                )}
                {filters.category && (
                  <Chip
                    label={`Category: ${categories.find(c => c.id === filters.category)?.name}`}
                    size="small"
                    onDelete={() => handleFilterChange('category', '')}
                  />
                )}
                {filters.status !== 'all' && (
                  <Chip
                    label={`Status: ${filters.status}`}
                    size="small"
                    onDelete={() => handleFilterChange('status', 'all')}
                  />
                )}
                {filters.gstRate !== undefined && (
                  <Chip
                    label={`GST: ${filters.gstRate}%`}
                    size="small"
                    onDelete={() => handleFilterChange('gstRate', undefined)}
                  />
                )}
                {filters.isService !== undefined && (
                  <Chip
                    label={`Type: ${filters.isService ? 'Service' : 'Goods'}`}
                    size="small"
                    onDelete={() => handleFilterChange('isService', undefined)}
                  />
                )}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Results Summary */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {products.length} products found
            {selectedProducts.length > 0 && ` • ${selectedProducts.length} selected`}
          </Typography>
          
          {selectedProducts.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  // Implement bulk actions
                }}
              >
                Bulk Actions ({selectedProducts.length})
              </Button>
            </Box>
          )}
        </Box>

        {/* Product List */}
        <ProductList
          products={products}
          loading={loading}
          onEdit={(product) => {
            setSelectedProduct(product);
            setProductDialog(true);
          }}
          onDelete={handleDeleteProduct}
          onView={(product) => {
            setSelectedProduct(product);
            setViewDialog(true);
          }}
          onSelectionChange={setSelectedProducts}
          selectedProducts={selectedProducts}
          onRefresh={loadProducts}
        />

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add product"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => {
            setSelectedProduct(null);
            setProductDialog(true);
          }}
        >
          <AddIcon />
        </Fab>

        {/* Product Form Dialog */}
        <Dialog
          open={productDialog}
          onClose={() => setProductDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedProduct ? 'Edit Product' : 'Create New Product'}
          </DialogTitle>
          <DialogContent>
            <ProductForm
              initialData={selectedProduct || undefined}
              onSubmit={selectedProduct ? handleUpdateProduct : handleCreateProduct}
              onCancel={() => setProductDialog(false)}
              mode={selectedProduct ? 'edit' : 'create'}
              error={error}
            />
          </DialogContent>
        </Dialog>

        {/* Product View Dialog */}
        <Dialog
          open={viewDialog}
          onClose={() => setViewDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Product Details</DialogTitle>
          <DialogContent>
            {selectedProduct && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">{selectedProduct.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedProduct.description}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Category:</strong> {selectedProduct.categoryId}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Price:</strong> ₹{selectedProduct.price}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Stock:</strong> {selectedProduct.quantity} {selectedProduct.unitOfMeasurement}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>GST Rate:</strong> {selectedProduct.gstExempt ? 'Exempt' : `${selectedProduct.gstRate}%`}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>HSN/SAC:</strong> {selectedProduct.hsnCode || selectedProduct.sacCode || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Type:</strong> {selectedProduct.isService ? 'Service' : 'Goods'}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialog(false)}>Close</Button>
            <Button
              variant="contained"
              onClick={() => {
                setViewDialog(false);
                setProductDialog(true);
              }}
            >
              Edit
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success Snackbar */}
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
        >
          <Alert onClose={() => setSuccess(null)} severity="success">
            {success}
          </Alert>
        </Snackbar>

        {/* Error Snackbar */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert onClose={() => setError(null)} severity="error">
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </ImprovedDashboardLayout>
  );
}