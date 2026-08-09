'use client';
import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  Typography,
  Chip,
  Avatar,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Badge,
  Alert,
  Divider,
  Paper,
  Stack,
  Switch,
  FormControlLabel,
  Collapse
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalOffer as LocalOfferIcon
} from '@mui/icons-material';
import { Product, Category } from '@/types/inventory';
import { QuickAddProduct } from './QuickAddProduct';

interface EnhancedProductSelectorProps {
  products: Product[];
  categories: Category[];
  selectedProduct: Product | null;
  onProductSelect: (product: Product | null) => void;
  onProductAdded?: (product: Product) => void;
  onShowSnackbar?: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  showGstEligibleOnly?: boolean;
  showActiveOnly?: boolean;
  allowQuickAdd?: boolean;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  sx?: any;
}

interface ProductFilters {
  categoryId: string;
  priceRange: [number, number];
  gstRate: number | null;
  stockStatus: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
  isService: boolean | null;
  gstExempt: boolean | null;
}

const defaultFilters: ProductFilters = {
  categoryId: '',
  priceRange: [0, 100000],
  gstRate: null,
  stockStatus: 'all',
  isService: null,
  gstExempt: null
};

export function EnhancedProductSelector({
  products,
  categories,
  selectedProduct,
  onProductSelect,
  onProductAdded,
  onShowSnackbar,
  placeholder = "Search and select product...",
  error = false,
  helperText,
  disabled = false,
  showGstEligibleOnly = false,
  showActiveOnly = true,
  allowQuickAdd = true,
  size = 'small',
  fullWidth = true,
  sx = {}
}: EnhancedProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>(defaultFilters);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<Product | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Filter and search products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Apply basic filters
    if (showActiveOnly) {
      filtered = filtered.filter(product => product.isActive !== false);
    }

    if (showGstEligibleOnly) {
      filtered = filtered.filter(product => {
        if (product.gstExempt && !product.hsnCode && !product.sacCode) return false;
        if (product.isService && !product.sacCode) return false;
        if (!product.isService && !product.hsnCode) return false;
        return true;
      });
    }

    // Apply advanced filters
    if (filters.categoryId) {
      filtered = filtered.filter(product => product.categoryId === filters.categoryId);
    }

    if (filters.gstRate !== null) {
      filtered = filtered.filter(product => product.gstRate === filters.gstRate);
    }

    if (filters.isService !== null) {
      filtered = filtered.filter(product => product.isService === filters.isService);
    }

    if (filters.gstExempt !== null) {
      filtered = filtered.filter(product => product.gstExempt === filters.gstExempt);
    }

    // Apply stock status filter
    if (filters.stockStatus !== 'all') {
      filtered = filtered.filter(product => {
        const quantity = product.quantity || 0;
        const reorderPoint = product.reorderPoint || 10;
        
        switch (filters.stockStatus) {
          case 'in-stock':
            return quantity > reorderPoint;
          case 'low-stock':
            return quantity > 0 && quantity <= reorderPoint;
          case 'out-of-stock':
            return quantity === 0;
          default:
            return true;
        }
      });
    }

    // Apply price range filter
    filtered = filtered.filter(product => 
      product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
    );

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term) ||
        product.sku?.toLowerCase().includes(term) ||
        product.hsnCode?.toLowerCase().includes(term) ||
        product.sacCode?.toLowerCase().includes(term) ||
        product.brand?.toLowerCase().includes(term) ||
        product.model?.toLowerCase().includes(term) ||
        product.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    return filtered.sort((a, b) => {
      // Sort by relevance: exact name match first, then alphabetical
      if (searchTerm) {
        const aExact = a.name.toLowerCase().startsWith(searchTerm.toLowerCase());
        const bExact = b.name.toLowerCase().startsWith(searchTerm.toLowerCase());
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
      }
      return a.name.localeCompare(b.name);
    });
  }, [products, searchTerm, filters, showActiveOnly, showGstEligibleOnly]);

  // Get category name
  const getCategoryName = useCallback((categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Uncategorized';
  }, [categories]);

  // Get stock status
  const getStockStatus = useCallback((product: Product) => {
    const quantity = product.quantity || 0;
    const reorderPoint = product.reorderPoint || 10;
    
    if (quantity === 0) return { status: 'out-of-stock', label: 'Out of Stock', color: 'error' as const };
    if (quantity <= reorderPoint) return { status: 'low-stock', label: 'Low Stock', color: 'warning' as const };
    return { status: 'in-stock', label: 'In Stock', color: 'success' as const };
  }, []);

  // Reset filters
  const resetFilters = () => {
    setFilters(defaultFilters);
    setSearchTerm('');
  };

  // Handle filter change
  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Show product details
  const handleShowDetails = (product: Product) => {
    setSelectedProductForDetails(product);
    setShowProductDetails(true);
  };

  // Custom option rendering
  const renderOption = (props: any, product: Product) => {
    const { key, ...otherProps } = props;
    const stockStatus = getStockStatus(product);
    const categoryName = getCategoryName(product.categoryId);

    return (
      <Box component="li" key={key} {...otherProps} sx={{ p: 1 }}>
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {product.isService ? <ReceiptIcon fontSize="small" /> : <InventoryIcon fontSize="small" />}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight="medium" noWrap>
                  {product.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    label={categoryName} 
                    size="small" 
                    variant="outlined" 
                    icon={<CategoryIcon />}
                  />
                  <Chip 
                    label={`₹${product.price.toFixed(2)}`} 
                    size="small" 
                    color="primary" 
                    icon={<MoneyIcon />}
                  />
                  <Chip 
                    label={`${product.gstRate}% GST`} 
                    size="small" 
                    variant="outlined"
                  />
                  <Chip 
                    label={stockStatus.label} 
                    size="small" 
                    color={stockStatus.color}
                    icon={stockStatus.status === 'out-of-stock' ? <WarningIcon /> : <CheckCircleIcon />}
                  />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <Typography variant="caption" color="text.secondary">
                  {product.sku || product.hsnCode || product.sacCode || 'No Code'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Stock: {product.quantity || 0} {product.unitOfMeasurement || 'units'}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Get option label
  const getOptionLabel = (option: Product) => option.name;

  // Check if option equals value
  const isOptionEqualToValue = (option: Product, value: Product) => option.id === value.id;

  return (
    <Box sx={sx}>
      {/* Main Autocomplete */}
      <Autocomplete
        options={filteredProducts}
        getOptionLabel={getOptionLabel}
        value={selectedProduct}
        onChange={(_, newValue) => onProductSelect(newValue)}
        renderOption={renderOption}
        isOptionEqualToValue={isOptionEqualToValue}
        size={size}
        fullWidth={fullWidth}
        disabled={disabled}
        noOptionsText={
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {filteredProducts.length === 0 && products.length > 0 
                ? "No products match your search criteria" 
                : "No products available"}
            </Typography>
            {allowQuickAdd && onProductAdded && onShowSnackbar && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setShowQuickAdd(true)}
                sx={{ mt: 1 }}
              >
                Add New Product
              </Button>
            )}
          </Box>
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="Product"
            placeholder={placeholder}
            error={error}
            helperText={helperText}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {params.InputProps.endAdornment}
                  <Tooltip title="Advanced Filters">
                    <IconButton
                      size="small"
                      onClick={() => setShowFilters(!showFilters)}
                      color={showFilters ? 'primary' : 'default'}
                    >
                      <Badge 
                        badgeContent={Object.values(filters).filter(v => 
                          v !== null && v !== '' && 
                          (Array.isArray(v) ? v[0] !== 0 || v[1] !== 100000 : true)
                        ).length}
                        color="primary"
                      >
                        <FilterIcon />
                      </Badge>
                    </IconButton>
                  </Tooltip>
                </Box>
              )
            }}
          />
        )}
        ListboxProps={{
          style: { maxHeight: 300 }
        }}
      />

      {/* Advanced Filters */}
      <Collapse in={showFilters}>
        <Paper variant="outlined" sx={{ mt: 1, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterIcon fontSize="small" />
              Advanced Filters
            </Typography>
            <Button size="small" onClick={resetFilters} startIcon={<ClearIcon />}>
              Clear All
            </Button>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.categoryId}
                  label="Category"
                  onChange={(e) => handleFilterChange('categoryId', e.target.value)}
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

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>GST Rate</InputLabel>
                <Select
                  value={filters.gstRate || ''}
                  label="GST Rate"
                  onChange={(e) => handleFilterChange('gstRate', e.target.value || null)}
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

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Stock Status</InputLabel>
                <Select
                  value={filters.stockStatus}
                  label="Stock Status"
                  onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
                >
                  <MenuItem value="all">All Items</MenuItem>
                  <MenuItem value="in-stock">In Stock</MenuItem>
                  <MenuItem value="low-stock">Low Stock</MenuItem>
                  <MenuItem value="out-of-stock">Out of Stock</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.isService === null ? '' : filters.isService ? 'service' : 'product'}
                  label="Type"
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFilterChange('isService', value === '' ? null : value === 'service');
                  }}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="product">Products</MenuItem>
                  <MenuItem value="service">Services</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.gstExempt === true}
                      onChange={(e) => handleFilterChange('gstExempt', e.target.checked ? true : null)}
                      size="small"
                    />
                  }
                  label="GST Exempt Only"
                />
                <Typography variant="body2" color="text.secondary">
                  Showing {filteredProducts.length} of {products.length} products
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {/* Product Details Dialog */}
      <Dialog 
        open={showProductDetails} 
        onClose={() => setShowProductDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <InfoIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">Product Details</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedProductForDetails?.name}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedProductForDetails && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Basic Information
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="Name" 
                          secondary={selectedProductForDetails.name} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Category" 
                          secondary={getCategoryName(selectedProductForDetails.categoryId)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Description" 
                          secondary={selectedProductForDetails.description || 'No description'} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="SKU" 
                          secondary={selectedProductForDetails.sku || 'Not set'} 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Pricing & Stock
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="Price" 
                          secondary={`₹${selectedProductForDetails.price.toFixed(2)} per ${selectedProductForDetails.unitOfMeasurement || 'unit'}`} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Stock Quantity" 
                          secondary={`${selectedProductForDetails.quantity || 0} ${selectedProductForDetails.unitOfMeasurement || 'units'}`} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Reorder Point" 
                          secondary={selectedProductForDetails.reorderPoint || 'Not set'} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Stock Status" 
                          secondary={
                            <Chip 
                              label={getStockStatus(selectedProductForDetails).label}
                              color={getStockStatus(selectedProductForDetails).color}
                              size="small"
                            />
                          } 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Tax Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box textAlign="center">
                          <Typography variant="body2" color="text.secondary">HSN/SAC Code</Typography>
                          <Typography variant="h6">
                            {selectedProductForDetails.hsnCode || selectedProductForDetails.sacCode || 'Not set'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box textAlign="center">
                          <Typography variant="body2" color="text.secondary">GST Rate</Typography>
                          <Typography variant="h6">{selectedProductForDetails.gstRate}%</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box textAlign="center">
                          <Typography variant="body2" color="text.secondary">Type</Typography>
                          <Typography variant="h6">
                            {selectedProductForDetails.isService ? 'Service' : 'Product'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box textAlign="center">
                          <Typography variant="body2" color="text.secondary">GST Status</Typography>
                          <Typography variant="h6">
                            {selectedProductForDetails.gstExempt ? 'Exempt' : 'Taxable'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowProductDetails(false)}>Close</Button>
          {selectedProductForDetails && (
            <Button 
              variant="contained" 
              onClick={() => {
                onProductSelect(selectedProductForDetails);
                setShowProductDetails(false);
              }}
              startIcon={<ShoppingCartIcon />}
            >
              Select Product
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Quick Stats */}
      {filteredProducts.length > 0 && (
        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip 
            label={`${filteredProducts.length} products`} 
            size="small" 
            icon={<InventoryIcon />}
            variant="outlined"
          />
          {showGstEligibleOnly && (
            <Chip 
              label="GST Eligible Only" 
              size="small" 
              color="primary"
              icon={<ReceiptIcon />}
            />
          )}
          {Object.values(filters).some(v => v !== null && v !== '' && 
            (Array.isArray(v) ? v[0] !== 0 || v[1] !== 100000 : true)) && (
            <Chip 
              label="Filters Applied" 
              size="small" 
              color="secondary"
              icon={<FilterIcon />}
              onDelete={resetFilters}
            />
          )}
        </Box>
      )}

      {/* Quick Add Product Dialog */}
      {allowQuickAdd && onProductAdded && onShowSnackbar && (
        <QuickAddProduct
          open={showQuickAdd}
          categories={categories}
          onClose={() => setShowQuickAdd(false)}
          onProductAdded={(product) => {
            onProductAdded(product);
            onProductSelect(product);
            setShowQuickAdd(false);
          }}
          onShowSnackbar={onShowSnackbar}
          prefilledData={{
            name: searchTerm,
            categoryId: filters.categoryId,
            gstRate: filters.gstRate || 18,
            isService: filters.isService || false
          }}
        />
      )}
    </Box>
  );
}