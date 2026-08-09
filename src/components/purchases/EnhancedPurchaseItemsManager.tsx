"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Autocomplete,
  IconButton,
  Button,
  Chip,
  Grid,
  Divider,
  Tooltip,
  Alert,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  useTheme,
  alpha,
  Stack,
  Fab,
  Zoom,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Collapse,
  Switch,
  FormControlLabel,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ShoppingCart as CartIcon,
  Inventory as InventoryIcon,
  LocalOffer as PriceIcon,
  Category as CategoryIcon,
  Calculate as CalculateIcon,
  Receipt as ReceiptIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Percent as PercentIcon,
  AttachMoney as MoneyIcon,
  QrCodeScanner as ScanIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ContentCopy as CopyIcon,
  FileUpload as ImportIcon,
  GetApp as ExportIcon,
  Bookmark as BookmarkIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { PurchaseItem } from '@/types/purchase';
import { Product } from '@/types/inventory';
import { usePurchasePreferences } from '@/hooks/usePurchasePreferences';

interface EnhancedPurchaseItemsManagerProps {
  items: PurchaseItem[];
  onItemsChange: (items: PurchaseItem[]) => void;
  products: Product[];
  onProductSearch?: (searchTerm: string) => void;
  loading?: boolean;
  readOnly?: boolean;
  supplierId?: string;
  supplierName?: string;
}

interface EditingItem extends Partial<PurchaseItem> {
  isNew?: boolean;
  tempId?: string;
}

interface ProductFilters {
  category: string;
  priceRange: string;
  stockStatus: string;
  supplier: string;
}

interface BulkAddItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  selected: boolean;
}

const EnhancedPurchaseItemsManager: React.FC<EnhancedPurchaseItemsManagerProps> = ({
  items,
  onItemsChange,
  products,
  onProductSearch,
  loading = false,
  readOnly = false,
  supplierId,
  supplierName
}) => {
  const theme = useTheme();
  const { recentProducts, favoriteProducts, addRecentProduct, toggleFavoriteProduct } = usePurchasePreferences();
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [productDialog, setProductDialog] = useState(false);
  const [bulkAddDialog, setBulkAddDialog] = useState(false);
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [bulkAddItems, setBulkAddItems] = useState<BulkAddItem[]>([]);
  
  const [filters, setFilters] = useState<ProductFilters>({
    category: 'all',
    priceRange: 'all',
    stockStatus: 'all',
    supplier: 'all'
  });

  // Get unique categories from products
  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.categoryName).filter(Boolean))];
    return cats.sort();
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!product.name.toLowerCase().includes(search) &&
            !product.sku?.toLowerCase().includes(search) &&
            !product.categoryName?.toLowerCase().includes(search)) {
          return false;
        }
      }

      // Category filter
      if (filters.category !== 'all' && product.categoryName !== filters.category) {
        return false;
      }

      // Price range filter
      if (filters.priceRange !== 'all') {
        const price = product.price || 0;
        switch (filters.priceRange) {
          case 'low':
            if (price >= 100) return false;
            break;
          case 'medium':
            if (price < 100 || price >= 1000) return false;
            break;
          case 'high':
            if (price < 1000) return false;
            break;
        }
      }

      // Stock status filter
      if (filters.stockStatus !== 'all') {
        const stock = product.quantity || 0;
        const reorderPoint = product.reorderPoint || 10;
        switch (filters.stockStatus) {
          case 'low':
            if (stock > reorderPoint) return false;
            break;
          case 'medium':
            if (stock <= reorderPoint || stock >= 100) return false;
            break;
          case 'high':
            if (stock < 100) return false;
            break;
          case 'out':
            if (stock > 0) return false;
            break;
        }
      }

      return true;
    });

    // Sort by relevance and favorites
    filtered.sort((a, b) => {
      // Favorites first
      const aFavorite = favoriteProducts.includes(a.id);
      const bFavorite = favoriteProducts.includes(b.id);
      if (aFavorite && !bFavorite) return -1;
      if (!aFavorite && bFavorite) return 1;

      // Then by search relevance
      if (searchTerm) {
        const aNameMatch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
        const bNameMatch = b.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
      }
      
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [products, searchTerm, filters, favoriteProducts]);

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalGstAmount = items.reduce((sum, item) => sum + item.gstAmount, 0);
    const finalAmount = items.reduce((sum, item) => sum + item.finalAmount, 0);
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalGstAmount: Math.round(totalGstAmount * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100,
      itemCount: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0)
    };
  }, [items]);

  // Calculate item total with GST
  const calculateItemTotal = useCallback((item: Partial<PurchaseItem>) => {
    const totalPrice = (item.unitPrice || 0) * (item.quantity || 0);
    const gstAmount = (totalPrice * (item.gstRate || 0)) / 100;
    const finalAmount = totalPrice + gstAmount;
    
    return {
      totalPrice: Math.round(totalPrice * 100) / 100,
      gstAmount: Math.round(gstAmount * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100
    };
  }, []);

  // Start editing an item
  const startEditing = useCallback((item?: PurchaseItem, index?: number) => {
    if (readOnly) return;
    
    if (item) {
      setEditingItem({ ...item, tempId: `edit-${index}` });
    } else {
      setEditingItem({
        isNew: true,
        tempId: `new-${Date.now()}`,
        productId: '',
        productName: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        gstRate: 18,
        gstAmount: 0,
        finalAmount: 0,
        category: '',
        unit: 'PCS'
      });
    }
  }, [readOnly]);

  // Quick add item
  const quickAddItem = useCallback((product: Product) => {
    if (readOnly) return;

    const existingItemIndex = items.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      // Increase quantity of existing item
      const newItems = [...items];
      const updatedItem = { ...newItems[existingItemIndex] };
      updatedItem.quantity += 1;
      const calculated = calculateItemTotal(updatedItem);
      updatedItem.totalPrice = calculated.totalPrice;
      updatedItem.gstAmount = calculated.gstAmount;
      updatedItem.finalAmount = calculated.finalAmount;
      newItems[existingItemIndex] = updatedItem;
      onItemsChange(newItems);
    } else {
      // Add new item
      const calculated = calculateItemTotal({
        quantity: 1,
        unitPrice: product.price || 0,
        gstRate: 18
      });
      
      const newItem: PurchaseItem = {
        productId: product.id,
        productName: product.name,
        description: product.description || '',
        quantity: 1,
        unitPrice: product.price || 0,
        totalPrice: calculated.totalPrice,
        gstRate: 18,
        gstAmount: calculated.gstAmount,
        finalAmount: calculated.finalAmount,
        category: product.categoryName || '',
        unit: product.unitOfMeasurement || 'PCS'
      };
      onItemsChange([...items, newItem]);
    }

    // Add to recent products
    addRecentProduct(product);
  }, [items, onItemsChange, readOnly, calculateItemTotal]);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingItem(null);
  }, []);

  // Save item
  const saveItem = useCallback(() => {
    if (!editingItem || !editingItem.productId || !editingItem.productName) return;

    const calculated = calculateItemTotal(editingItem);
    const finalItem: PurchaseItem = {
      productId: editingItem.productId,
      productName: editingItem.productName,
      description: editingItem.description || '',
      quantity: editingItem.quantity || 1,
      unitPrice: editingItem.unitPrice || 0,
      totalPrice: calculated.totalPrice,
      gstRate: editingItem.gstRate || 18,
      gstAmount: calculated.gstAmount,
      finalAmount: calculated.finalAmount,
      category: editingItem.category || '',
      unit: editingItem.unit || 'PCS'
    };

    if (editingItem.isNew) {
      onItemsChange([...items, finalItem]);
    } else {
      const index = items.findIndex(item => 
        item.productId === editingItem.productId || 
        items.indexOf(item).toString() === editingItem.tempId?.split('-')[1]
      );
      if (index >= 0) {
        const newItems = [...items];
        newItems[index] = finalItem;
        onItemsChange(newItems);
      }
    }

    setEditingItem(null);
  }, [editingItem, items, onItemsChange, calculateItemTotal]);

  // Delete item
  const deleteItem = useCallback((index: number) => {
    if (readOnly) return;
    const newItems = items.filter((_, i) => i !== index);
    onItemsChange(newItems);
  }, [items, onItemsChange, readOnly]);

  // Handle product selection
  const handleProductSelect = useCallback((product: Product | null) => {
    if (!product || !editingItem) return;
    
    setEditingItem(prev => ({
      ...prev,
      productId: product.id,
      productName: product.name,
      description: product.description || '',
      unitPrice: product.price || 0,
      category: product.categoryName || '',
      unit: product.unitOfMeasurement || 'PCS'
    }));
  }, [editingItem]);

  // Handle field changes
  const handleFieldChange = useCallback((field: keyof EditingItem, value: any) => {
    setEditingItem(prev => {
      if (!prev) return null;
      const updated = { ...prev, [field]: value };
      
      // Recalculate totals when relevant fields change
      if (['quantity', 'unitPrice', 'gstRate'].includes(field)) {
        const calculated = calculateItemTotal(updated);
        updated.totalPrice = calculated.totalPrice;
        updated.gstAmount = calculated.gstAmount;
        updated.finalAmount = calculated.finalAmount;
      }
      
      return updated;
    });
  }, [calculateItemTotal]);

  // Bulk operations
  const handleBulkGSTUpdate = useCallback((gstRate: number) => {
    const newItems = items.map((item, index) => {
      if (selectedItems.includes(index)) {
        const calculated = calculateItemTotal({
          ...item,
          gstRate
        });
        return {
          ...item,
          gstRate,
          gstAmount: calculated.gstAmount,
          finalAmount: calculated.finalAmount
        };
      }
      return item;
    });
    onItemsChange(newItems);
    setSelectedItems([]);
    setBulkEditMode(false);
  }, [items, selectedItems, onItemsChange, calculateItemTotal]);

  // Initialize bulk add items
  const initializeBulkAdd = useCallback(() => {
    const availableProducts = products.filter(product => 
      !items.some(item => item.productId === product.id)
    );
    
    setBulkAddItems(availableProducts.slice(0, 20).map(product => ({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.price || 0,
      selected: false
    })));
    setBulkAddDialog(true);
  }, [products, items]);

  // Handle bulk add
  const handleBulkAdd = useCallback(() => {
    const selectedBulkItems = bulkAddItems.filter(item => item.selected);
    const newItems = selectedBulkItems.map(bulkItem => {
      const calculated = calculateItemTotal({
        quantity: bulkItem.quantity,
        unitPrice: bulkItem.unitPrice,
        gstRate: 18
      });
      
      return {
        productId: bulkItem.productId,
        productName: bulkItem.productName,
        description: '',
        quantity: bulkItem.quantity,
        unitPrice: bulkItem.unitPrice,
        totalPrice: calculated.totalPrice,
        gstRate: 18,
        gstAmount: calculated.gstAmount,
        finalAmount: calculated.finalAmount,
        category: '',
        unit: 'PCS'
      } as PurchaseItem;
    });
    
    onItemsChange([...items, ...newItems]);
    setBulkAddDialog(false);
    setBulkAddItems([]);
  }, [bulkAddItems, items, onItemsChange, calculateItemTotal]);

  // Toggle favorite product
  const toggleFavorite = useCallback((productId: string) => {
    toggleFavoriteProduct(productId);
  }, [toggleFavoriteProduct]);

  // Get stock status color
  const getStockStatusColor = (product: Product) => {
    const stock = product.quantity || 0;
    const reorderPoint = product.reorderPoint || 10;
    
    if (stock === 0) return 'error';
    if (stock <= reorderPoint) return 'warning';
    return 'success';
  };

  // Get stock status text
  const getStockStatusText = (product: Product) => {
    const stock = product.quantity || 0;
    const reorderPoint = product.reorderPoint || 10;
    
    if (stock === 0) return 'Out of Stock';
    if (stock <= reorderPoint) return 'Low Stock';
    return 'In Stock';
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CartIcon color="primary" />
          <Typography variant="h6">Purchase Items</Typography>
          <Badge badgeContent={totals.itemCount} color="primary">
            <Chip 
              label={`${totals.totalQuantity} units`} 
              size="small" 
              variant="outlined" 
            />
          </Badge>
          {supplierName && (
            <Chip 
              label={`Supplier: ${supplierName}`} 
              size="small" 
              color="secondary"
              variant="outlined"
            />
          )}
        </Box>
        
        {!readOnly && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Quick Add Mode">
              <IconButton
                color={quickAddMode ? 'primary' : 'default'}
                onClick={() => setQuickAddMode(!quickAddMode)}
              >
                <ScanIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Filter Products">
              <IconButton
                color={showFilters ? 'primary' : 'default'}
                onClick={() => setShowFilters(!showFilters)}
              >
                <FilterIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Bulk Add Items">
              <IconButton
                onClick={initializeBulkAdd}
                disabled={!!editingItem}
              >
                <ImportIcon />
              </IconButton>
            </Tooltip>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setProductDialog(true)}
              disabled={!!editingItem}
            >
              Add Item
            </Button>
          </Box>
        )}
      </Box>

      {/* Quick Add Mode */}
      {quickAddMode && !readOnly && (
        <Alert 
          severity="info" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => setQuickAddMode(false)}>
              Exit Quick Add
            </Button>
          }
        >
          Quick Add Mode: Click on any product below to instantly add it to the purchase order
        </Alert>
      )}

      {/* Filters */}
      <Collapse in={showFilters}>
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    label="Category"
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {categories.map(cat => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Price Range</InputLabel>
                  <Select
                    value={filters.priceRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                    label="Price Range"
                  >
                    <MenuItem value="all">All Prices</MenuItem>
                    <MenuItem value="low">Under ₹100</MenuItem>
                    <MenuItem value="medium">₹100 - ₹1000</MenuItem>
                    <MenuItem value="high">Above ₹1000</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Stock Status</InputLabel>
                  <Select
                    value={filters.stockStatus}
                    onChange={(e) => setFilters(prev => ({ ...prev, stockStatus: e.target.value }))}
                    label="Stock Status"
                  >
                    <MenuItem value="all">All Stock</MenuItem>
                    <MenuItem value="high">High Stock (100+)</MenuItem>
                    <MenuItem value="medium">Medium Stock</MenuItem>
                    <MenuItem value="low">Low Stock</MenuItem>
                    <MenuItem value="out">Out of Stock</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Collapse>

      {/* Recent Products */}
      {recentProducts.length > 0 && !readOnly && (
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon fontSize="small" />
              Recently Added Products
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {recentProducts.slice(0, 5).map(product => (
                <Chip
                  key={product.id}
                  label={product.name}
                  size="small"
                  onClick={() => quickAddItem(product)}
                  clickable
                  variant="outlined"
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {bulkEditMode && (
                <TableCell padding="checkbox">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === items.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(items.map((_, index) => index));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                  />
                </TableCell>
              )}
              <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Qty</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Unit</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Unit Price</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">GST %</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Total</TableCell>
              {!readOnly && <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow 
                key={index}
                hover
                sx={{
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.04)
                  }
                }}
              >
                {bulkEditMode && (
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(index)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(prev => [...prev, index]);
                        } else {
                          setSelectedItems(prev => prev.filter(i => i !== index));
                        }
                      }}
                    />
                  </TableCell>
                )}
                
                <TableCell>
                  <Chip 
                    label={index + 1} 
                    size="small" 
                    color="primary" 
                    sx={{ minWidth: 32 }}
                  />
                </TableCell>
                
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {item.productName}
                    </Typography>
                    {quickAddMode && (
                      <Chip 
                        label="Click to add more" 
                        size="small" 
                        variant="outlined"
                        onClick={() => {
                          const product = products.find(p => p.id === item.productId);
                          if (product) quickAddItem(product);
                        }}
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </Box>
                </TableCell>

                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {item.description || '-'}
                  </Typography>
                </TableCell>
                
                <TableCell align="center">
                  <Typography variant="body2" fontWeight="medium">
                    {item.quantity}
                  </Typography>
                </TableCell>
                
                <TableCell align="center">
                  <Chip 
                    label={item.unit} 
                    size="small" 
                    variant="outlined"
                  />
                </TableCell>
                
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="medium">
                    ₹{item.unitPrice.toFixed(2)}
                  </Typography>
                </TableCell>

                <TableCell align="right">
                  <Typography variant="body2">
                    {item.gstRate}%
                  </Typography>
                </TableCell>
                
                <TableCell align="right">
                  <Typography 
                    variant="body2" 
                    fontWeight="bold"
                    sx={{ 
                      color: theme.palette.success.main,
                      backgroundColor: alpha(theme.palette.success.main, 0.1),
                      px: 1,
                      py: 0.5,
                      borderRadius: 1
                    }}
                  >
                    ₹{item.finalAmount.toFixed(2)}
                  </Typography>
                </TableCell>
                
                {!readOnly && (
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Edit Item">
                        <IconButton
                          size="small"
                          onClick={() => startEditing(item, index)}
                          disabled={!!editingItem}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Item">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => deleteItem(index)}
                          disabled={!!editingItem}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))}

            {/* Editing Row */}
            {editingItem && (
              <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                {bulkEditMode && <TableCell />}
                
                <TableCell>
                  <Chip 
                    label={editingItem.isNew ? items.length + 1 : "Edit"} 
                    size="small" 
                    color="primary"
                  />
                </TableCell>
                
                <TableCell>
                  <Autocomplete
                    size="small"
                    options={filteredProducts}
                    getOptionLabel={(option) => option.name}
                    value={filteredProducts.find(p => p.id === editingItem.productId) || null}
                    onChange={(_, value) => handleProductSelect(value)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Search products..."
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon fontSize="small" />
                            </InputAdornment>
                          )
                        }}
                      />
                    )}
                    renderOption={(props, option) => {
                      const { key, ...otherProps } = props;
                      return (
                        <Box component="li" key={key} {...otherProps}>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <Avatar sx={{ mr: 2, bgcolor: getStockStatusColor(option) + '.main' }}>
                              <InventoryIcon />
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="body2">{option.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {option.categoryName} • ₹{option.price} • {getStockStatusText(option)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                label={option.quantity}
                                size="small"
                                color={getStockStatusColor(option)}
                                variant="outlined"
                              />
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(option.id);
                                }}
                              >
                                <BookmarkIcon 
                                  fontSize="small"
                                  color={favoriteProducts.includes(option.id) ? 'primary' : 'disabled'}
                                />
                              </IconButton>
                            </Box>
                          </Box>
                        </Box>
                      );
                    }}
                    sx={{ minWidth: 250 }}
                  />
                </TableCell>

                <TableCell>
                  <TextField
                    size="small"
                    value={editingItem.description || ''}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Description"
                    sx={{ minWidth: 150 }}
                  />
                </TableCell>
                
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={editingItem.quantity || ''}
                    onChange={(e) => handleFieldChange('quantity', Number(e.target.value))}
                    inputProps={{ min: 0.01, step: 0.01 }}
                    sx={{ width: 80 }}
                  />
                </TableCell>
                
                <TableCell>
                  <TextField
                    size="small"
                    value={editingItem.unit || ''}
                    onChange={(e) => handleFieldChange('unit', e.target.value)}
                    sx={{ width: 80 }}
                  />
                </TableCell>
                
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={editingItem.unitPrice || ''}
                    onChange={(e) => handleFieldChange('unitPrice', Number(e.target.value))}
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>
                    }}
                    sx={{ width: 120 }}
                  />
                </TableCell>

                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={editingItem.gstRate || ''}
                    onChange={(e) => handleFieldChange('gstRate', Number(e.target.value))}
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>
                    }}
                    sx={{ width: 80 }}
                  />
                </TableCell>
                
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    ₹{(editingItem.finalAmount || 0).toFixed(2)}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Save Item">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={saveItem}
                        disabled={!editingItem.productId || !editingItem.productName}
                      >
                        <SaveIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Cancel">
                      <IconButton
                        size="small"
                        onClick={cancelEditing}
                      >
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {/* Empty State */}
            {items.length === 0 && !editingItem && (
              <TableRow>
                <TableCell colSpan={readOnly ? 9 : 10} align="center" sx={{ py: 4 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <CartIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                    <Typography variant="body1" color="text.secondary">
                      No items added yet
                    </Typography>
                    {!readOnly && (
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => setProductDialog(true)}
                      >
                        Add First Item
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Totals Summary */}
      {items.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2} justifyContent="flex-end">
            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined">
                <CardContent sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Subtotal ({totals.itemCount} items):
                      </Typography>
                      <Typography variant="body2">
                        ₹{totals.subtotal.toFixed(2)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Total GST:
                      </Typography>
                      <Typography variant="body2">
                        ₹{totals.totalGstAmount.toFixed(2)}
                      </Typography>
                    </Box>
                    
                    <Divider />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6" fontWeight="bold">
                        Items Total:
                      </Typography>
                      <Typography 
                        variant="h6" 
                        fontWeight="bold" 
                        color="primary"
                      >
                        ₹{totals.finalAmount.toFixed(2)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Product Selection Dialog */}
      <Dialog open={productDialog} onClose={() => setProductDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Select Products</Typography>
            <TextField
              size="small"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
              sx={{ width: 250 }}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {filteredProducts.slice(0, 20).map((product) => (
              <ListItem
                key={product.id}
                button
                onClick={() => {
                  quickAddItem(product);
                  setProductDialog(false);
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: getStockStatusColor(product) + '.main' }}>
                    <InventoryIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {product.name}
                      {favoriteProducts.includes(product.id) && (
                        <BookmarkIcon fontSize="small" color="primary" />
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                        {product.categoryName} • ₹{product.price} • Stock: {product.quantity}
                      </span>
                      <br />
                      <span style={{ 
                        display: 'inline-block', 
                        marginTop: '4px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        border: `1px solid ${getStockStatusColor(product) === 'error' ? '#f44336' : 
                                              getStockStatusColor(product) === 'warning' ? '#ff9800' : '#4caf50'}`,
                        color: getStockStatusColor(product) === 'error' ? '#f44336' : 
                               getStockStatusColor(product) === 'warning' ? '#ff9800' : '#4caf50'
                      }}>
                        {getStockStatusText(product)}
                      </span>
                    </>
                  }
                />
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(product.id);
                  }}
                >
                  <BookmarkIcon 
                    color={favoriteProducts.includes(product.id) ? 'primary' : 'disabled'}
                  />
                </IconButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={bulkAddDialog} onClose={() => setBulkAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Bulk Add Items</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select multiple products to add to your purchase order at once.
          </Typography>
          <List>
            {bulkAddItems.map((item, index) => (
              <ListItem key={item.productId}>
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={(e) => {
                    const newBulkItems = [...bulkAddItems];
                    newBulkItems[index].selected = e.target.checked;
                    setBulkAddItems(newBulkItems);
                  }}
                  style={{ marginRight: 16 }}
                />
                <ListItemText
                  primary={item.productName}
                  secondary={`₹${item.unitPrice.toFixed(2)}`}
                />
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    type="number"
                    label="Qty"
                    value={item.quantity}
                    onChange={(e) => {
                      const newBulkItems = [...bulkAddItems];
                      newBulkItems[index].quantity = Number(e.target.value) || 1;
                      setBulkAddItems(newBulkItems);
                    }}
                    inputProps={{ min: 1 }}
                    sx={{ width: 80 }}
                  />
                  <TextField
                    size="small"
                    type="number"
                    label="Price"
                    value={item.unitPrice}
                    onChange={(e) => {
                      const newBulkItems = [...bulkAddItems];
                      newBulkItems[index].unitPrice = Number(e.target.value) || 0;
                      setBulkAddItems(newBulkItems);
                    }}
                    inputProps={{ min: 0, step: 0.01 }}
                    sx={{ width: 100 }}
                  />
                </Box>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkAddDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleBulkAdd}
            disabled={!bulkAddItems.some(item => item.selected)}
          >
            Add Selected Items ({bulkAddItems.filter(item => item.selected).length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      {!readOnly && (
        <Zoom in={!editingItem}>
          <Fab
            color="primary"
            aria-label="add item"
            onClick={() => setProductDialog(true)}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              display: { xs: 'flex', sm: 'none' }
            }}
          >
            <AddIcon />
          </Fab>
        </Zoom>
      )}
    </Paper>
  );
};

export default EnhancedPurchaseItemsManager;