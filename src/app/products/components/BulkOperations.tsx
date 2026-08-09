'use client';
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  LinearProgress,
  Divider,
  Switch,
  InputAdornment
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Upload as UploadIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { Product, Category } from '@/types/inventory';
import { productService } from '@/services/productService';

interface BulkOperationsProps {
  products: Product[];
  categories: Category[];
  onBulkUpdate: () => void;
  onShowSnackbar: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
}

interface BulkUpdateData {
  categoryId?: string;
  price?: number;
  priceAdjustment?: 'increase' | 'decrease';
  pricePercentage?: number;
  gstRate?: number;
  isActive?: boolean;
  reorderPoint?: number;
}

export default function BulkOperations({ 
  products, 
  categories, 
  onBulkUpdate, 
  onShowSnackbar 
}: BulkOperationsProps) {
  
  // State management
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Bulk update form data
  const [bulkUpdateData, setBulkUpdateData] = useState<BulkUpdateData>({});
  const [updateFields, setUpdateFields] = useState({
    category: false,
    price: false,
    gstRate: false,
    status: false,
    reorderPoint: false
  });

  // Filter options for product selection
  const [filterOptions, setFilterOptions] = useState({
    category: '',
    status: 'all',
    priceRange: { min: '', max: '' },
    stockRange: { min: '', max: '' }
  });

  // Get filtered products based on selection criteria
  const getFilteredProducts = () => {
    let filtered = [...products];

    if (filterOptions.category) {
      filtered = filtered.filter(p => p.categoryId === filterOptions.category);
    }

    if (filterOptions.status !== 'all') {
      switch (filterOptions.status) {
        case 'active':
          filtered = filtered.filter(p => p.isActive);
          break;
        case 'inactive':
          filtered = filtered.filter(p => !p.isActive);
          break;
        case 'low-stock':
          filtered = filtered.filter(p => p.quantity < (p.reorderPoint || 10));
          break;
        case 'out-of-stock':
          filtered = filtered.filter(p => p.quantity === 0);
          break;
      }
    }

    if (filterOptions.priceRange.min) {
      filtered = filtered.filter(p => p.price >= parseFloat(filterOptions.priceRange.min));
    }

    if (filterOptions.priceRange.max) {
      filtered = filtered.filter(p => p.price <= parseFloat(filterOptions.priceRange.max));
    }

    if (filterOptions.stockRange.min) {
      filtered = filtered.filter(p => p.quantity >= parseInt(filterOptions.stockRange.min));
    }

    if (filterOptions.stockRange.max) {
      filtered = filtered.filter(p => p.quantity <= parseInt(filterOptions.stockRange.max));
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  // Handle product selection
  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id!));
    }
  };

  const handleSelectProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  // Quick selection helpers
  const selectLowStockProducts = () => {
    const lowStockIds = products
      .filter(p => p.quantity < (p.reorderPoint || 10))
      .map(p => p.id!);
    setSelectedProducts(lowStockIds);
  };

  const selectInactiveProducts = () => {
    const inactiveIds = products
      .filter(p => !p.isActive)
      .map(p => p.id!);
    setSelectedProducts(inactiveIds);
  };

  const selectByCategory = (categoryId: string) => {
    const categoryProductIds = products
      .filter(p => p.categoryId === categoryId)
      .map(p => p.id!);
    setSelectedProducts(categoryProductIds);
  };

  // Handle bulk update
  const handleBulkUpdate = async () => {
    if (selectedProducts.length === 0) {
      onShowSnackbar('Please select products to update', 'warning');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const updateData: any = {};

      if (updateFields.category && bulkUpdateData.categoryId) {
        updateData.categoryId = bulkUpdateData.categoryId;
      }

      if (updateFields.price) {
        if (bulkUpdateData.priceAdjustment && bulkUpdateData.pricePercentage) {
          // Calculate new prices based on percentage adjustment
          const selectedProductsData = products.filter(p => selectedProducts.includes(p.id!));
          
          for (let i = 0; i < selectedProductsData.length; i++) {
            const product = selectedProductsData[i];
            const adjustment = bulkUpdateData.priceAdjustment === 'increase' ? 1 : -1;
            const newPrice = product.price * (1 + (adjustment * bulkUpdateData.pricePercentage / 100));
            
            await productService.updateProduct(product.id!, { price: Math.max(0, newPrice) });
            setProgress(((i + 1) / selectedProductsData.length) * 50);
          }
        } else if (bulkUpdateData.price) {
          updateData.price = bulkUpdateData.price;
        }
      }

      if (updateFields.gstRate && bulkUpdateData.gstRate !== undefined) {
        updateData.gstRate = bulkUpdateData.gstRate;
      }

      if (updateFields.status && bulkUpdateData.isActive !== undefined) {
        updateData.isActive = bulkUpdateData.isActive;
      }

      if (updateFields.reorderPoint && bulkUpdateData.reorderPoint !== undefined) {
        updateData.reorderPoint = bulkUpdateData.reorderPoint;
      }

      // Perform bulk update for non-price fields
      if (Object.keys(updateData).length > 0) {
        await productService.bulkUpdateProducts(selectedProducts, updateData);
      }

      setProgress(100);
      onShowSnackbar(`Successfully updated ${selectedProducts.length} products`, 'success');
      setBulkUpdateDialogOpen(false);
      setSelectedProducts([]);
      setBulkUpdateData({});
      setUpdateFields({
        category: false,
        price: false,
        gstRate: false,
        status: false,
        reorderPoint: false
      });
      onBulkUpdate();
    } catch (error) {
      console.error('Error in bulk update:', error);
      onShowSnackbar('Failed to update products', 'error');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      onShowSnackbar('Please select products to delete', 'warning');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      await productService.bulkDeleteProducts(selectedProducts);
      setProgress(100);
      onShowSnackbar(`Successfully deleted ${selectedProducts.length} products`, 'success');
      setBulkDeleteDialogOpen(false);
      setSelectedProducts([]);
      onBulkUpdate();
    } catch (error) {
      console.error('Error in bulk delete:', error);
      onShowSnackbar('Failed to delete products', 'error');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Bulk Operations
      </Typography>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Selection
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<WarningIcon />}
                  onClick={selectLowStockProducts}
                  color="warning"
                >
                  Select Low Stock ({products.filter(p => p.quantity < (p.reorderPoint || 10)).length})
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={selectInactiveProducts}
                  color="secondary"
                >
                  Select Inactive ({products.filter(p => !p.isActive).length})
                </Button>
                {categories.slice(0, 3).map(category => (
                  <Button
                    key={category.id}
                    variant="outlined"
                    startIcon={<CategoryIcon />}
                    onClick={() => selectByCategory(category.id!)}
                  >
                    {category.name} ({products.filter(p => p.categoryId === category.id).length})
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Filter & Selection */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Filter & Select Products
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={filterOptions.category}
                      label="Category"
                      onChange={(e) => setFilterOptions({ ...filterOptions, category: e.target.value })}
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {categories.map(category => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterOptions.status}
                      label="Status"
                      onChange={(e) => setFilterOptions({ ...filterOptions, status: e.target.value })}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="low-stock">Low Stock</MenuItem>
                      <MenuItem value="out-of-stock">Out of Stock</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Min Price"
                    type="number"
                    value={filterOptions.priceRange.min}
                    onChange={(e) => setFilterOptions({
                      ...filterOptions,
                      priceRange: { ...filterOptions.priceRange, min: e.target.value }
                    })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Max Price"
                    type="number"
                    value={filterOptions.priceRange.max}
                    onChange={(e) => setFilterOptions({
                      ...filterOptions,
                      priceRange: { ...filterOptions.priceRange, max: e.target.value }
                    })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>
                    }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2">
                  Showing {filteredProducts.length} products | {selectedProducts.length} selected
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleSelectAll}
                  size="small"
                >
                  {selectedProducts.length === filteredProducts.length ? 'Deselect All' : 'Select All'}
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={selectedProducts.length > 0 && selectedProducts.length < filteredProducts.length}
                          checked={filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length}
                          onChange={handleSelectAll}
                        />
                      </TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Stock</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedProducts.includes(product.id!)}
                            onChange={() => handleSelectProduct(product.id!)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {product.name}
                          </Typography>
                        </TableCell>
                        <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                        <TableCell align="right">₹{product.price.toFixed(2)}</TableCell>
                        <TableCell align="right">{product.quantity}</TableCell>
                        <TableCell>
                          <Chip
                            label={product.isActive ? 'Active' : 'Inactive'}
                            color={product.isActive ? 'success' : 'default'}
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

        {/* Bulk Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bulk Actions
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => setBulkUpdateDialogOpen(true)}
                  disabled={selectedProducts.length === 0}
                  fullWidth
                >
                  Update Selected ({selectedProducts.length})
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setBulkDeleteDialogOpen(true)}
                  disabled={selectedProducts.length === 0}
                  fullWidth
                >
                  Delete Selected ({selectedProducts.length})
                </Button>

                <Divider />

                <Typography variant="body2" color="text.secondary">
                  Selected Products Summary:
                </Typography>
                
                {selectedProducts.length > 0 && (
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2">
                      • Total Products: {selectedProducts.length}
                    </Typography>
                    <Typography variant="body2">
                      • Total Value: ₹{selectedProducts.reduce((sum, id) => {
                        const product = products.find(p => p.id === id);
                        return sum + (product ? product.price * product.quantity : 0);
                      }, 0).toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bulk Update Dialog */}
      <Dialog open={bulkUpdateDialogOpen} onClose={() => setBulkUpdateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Bulk Update Products</DialogTitle>
        <DialogContent>
          {loading && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                Updating products... {progress.toFixed(0)}%
              </Typography>
            </Box>
          )}

          <Alert severity="info" sx={{ mb: 3 }}>
            You are about to update {selectedProducts.length} products. Please select the fields you want to update.
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={updateFields.category}
                    onChange={(e) => setUpdateFields({ ...updateFields, category: e.target.checked })}
                  />
                }
                label="Update Category"
              />
              {updateFields.category && (
                <FormControl fullWidth sx={{ mt: 1 }}>
                  <InputLabel>New Category</InputLabel>
                  <Select
                    value={bulkUpdateData.categoryId || ''}
                    label="New Category"
                    onChange={(e) => setBulkUpdateData({ ...bulkUpdateData, categoryId: e.target.value })}
                  >
                    {categories.map(category => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={updateFields.price}
                    onChange={(e) => setUpdateFields({ ...updateFields, price: e.target.checked })}
                  />
                }
                label="Update Price"
              />
              {updateFields.price && (
                <Box sx={{ mt: 1 }}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Price Update Type</InputLabel>
                    <Select
                      value={bulkUpdateData.priceAdjustment || ''}
                      label="Price Update Type"
                      onChange={(e) => setBulkUpdateData({ ...bulkUpdateData, priceAdjustment: e.target.value as any })}
                    >
                      <MenuItem value="increase">Increase by %</MenuItem>
                      <MenuItem value="decrease">Decrease by %</MenuItem>
                    </Select>
                  </FormControl>
                  {bulkUpdateData.priceAdjustment && (
                    <TextField
                      fullWidth
                      label="Percentage"
                      type="number"
                      value={bulkUpdateData.pricePercentage || ''}
                      onChange={(e) => setBulkUpdateData({ ...bulkUpdateData, pricePercentage: parseFloat(e.target.value) })}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>
                      }}
                    />
                  )}
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={updateFields.gstRate}
                    onChange={(e) => setUpdateFields({ ...updateFields, gstRate: e.target.checked })}
                  />
                }
                label="Update GST Rate"
              />
              {updateFields.gstRate && (
                <FormControl fullWidth sx={{ mt: 1 }}>
                  <InputLabel>GST Rate</InputLabel>
                  <Select
                    value={bulkUpdateData.gstRate || ''}
                    label="GST Rate"
                    onChange={(e) => setBulkUpdateData({ ...bulkUpdateData, gstRate: parseFloat(e.target.value as string) })}
                  >
                    <MenuItem value={0}>0%</MenuItem>
                    <MenuItem value={5}>5%</MenuItem>
                    <MenuItem value={12}>12%</MenuItem>
                    <MenuItem value={18}>18%</MenuItem>
                    <MenuItem value={28}>28%</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={updateFields.status}
                    onChange={(e) => setUpdateFields({ ...updateFields, status: e.target.checked })}
                  />
                }
                label="Update Status"
              />
              {updateFields.status && (
                <FormControl fullWidth sx={{ mt: 1 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={bulkUpdateData.isActive !== undefined ? bulkUpdateData.isActive.toString() : ''}
                    label="Status"
                    onChange={(e) => setBulkUpdateData({ ...bulkUpdateData, isActive: e.target.value === 'true' })}
                  >
                    <MenuItem value="true">Active</MenuItem>
                    <MenuItem value="false">Inactive</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={updateFields.reorderPoint}
                    onChange={(e) => setUpdateFields({ ...updateFields, reorderPoint: e.target.checked })}
                  />
                }
                label="Update Reorder Point"
              />
              {updateFields.reorderPoint && (
                <TextField
                  fullWidth
                  label="Reorder Point"
                  type="number"
                  value={bulkUpdateData.reorderPoint || ''}
                  onChange={(e) => setBulkUpdateData({ ...bulkUpdateData, reorderPoint: parseInt(e.target.value) })}
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkUpdateDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleBulkUpdate} variant="contained" disabled={loading}>
            Update Products
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onClose={() => setBulkDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Bulk Delete</DialogTitle>
        <DialogContent>
          {loading && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                Deleting products... {progress.toFixed(0)}%
              </Typography>
            </Box>
          )}

          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography>
              Are you sure you want to delete {selectedProducts.length} products? This action cannot be undone.
            </Typography>
          </Alert>

          <Typography variant="body2" color="text.secondary">
            This will permanently remove the selected products from your inventory.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleBulkDelete} color="error" variant="contained" disabled={loading}>
            Delete Products
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}