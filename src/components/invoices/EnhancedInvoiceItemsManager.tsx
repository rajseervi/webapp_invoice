"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Badge,
  Avatar,
  Collapse,
  Switch,
  FormControlLabel
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
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { PurchaseInvoiceItem } from '@/types/purchase_no_gst';
import { Product } from '@/types/inventory';

interface EnhancedInvoiceItemsManagerProps {
  items: PurchaseInvoiceItem[];
  onItemsChange: (items: PurchaseInvoiceItem[]) => void;
  products: Product[];
  onProductSearch?: (searchTerm: string) => void;
  loading?: boolean;
  readOnly?: boolean;
}

interface EditingItem extends Partial<PurchaseInvoiceItem> {
  isNew?: boolean;
  tempId?: string;
}

interface ProductFilters {
  category: string;
  priceRange: string;
  stockStatus: string;
}

const EnhancedInvoiceItemsManager: React.FC<EnhancedInvoiceItemsManagerProps> = ({
  items,
  onItemsChange,
  products,
  onProductSearch,
  loading = false,
  readOnly = false
}) => {
  const theme = useTheme();
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  
  const [filters, setFilters] = useState<ProductFilters>({
    category: 'all',
    priceRange: 'all',
    stockStatus: 'all'
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

    // Sort by relevance (name match first, then alphabetically)
    if (searchTerm) {
      filtered.sort((a, b) => {
        const aNameMatch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
        const bNameMatch = b.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        
        return a.name.localeCompare(b.name);
      });
    }

    return filtered;
  }, [products, searchTerm, filters]);

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const totalDiscountAmount = items.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscountAmount: Math.round(totalDiscountAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      itemCount: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0)
    };
  }, [items]);

  // Calculate item total with discount
  const calculateItemTotal = useCallback((item: Partial<PurchaseInvoiceItem>) => {
    const baseAmount = (item.unitPrice || 0) * (item.quantity || 0);
    let discountAmount = 0;
    
    if (item.discountType && item.discountValue && item.discountValue > 0) {
      if (item.discountType === 'percentage') {
        discountAmount = (baseAmount * item.discountValue) / 100;
      } else if (item.discountType === 'amount') {
        discountAmount = item.discountValue;
      }
    }
    
    return {
      discountAmount: Math.round(discountAmount * 100) / 100,
      totalAmount: Math.round((baseAmount - discountAmount) * 100) / 100
    };
  }, []);

  // Start editing an item
  const startEditing = useCallback((item?: PurchaseInvoiceItem, index?: number) => {
    if (readOnly) return;
    
    if (item) {
      setEditingItem({ ...item, tempId: `edit-${index}` });
    } else {
      setEditingItem({
        isNew: true,
        tempId: `new-${Date.now()}`,
        productId: '',
        productName: '',
        quantity: 1,
        unitPrice: 0,
        unitOfMeasurement: 'pcs',
        discountType: 'percentage',
        discountValue: 0,
        discountAmount: 0,
        totalAmount: 0
      });
    }
  }, [readOnly]);



  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingItem(null);
  }, []);

  // Save item
  const saveItem = useCallback(() => {
    if (!editingItem || !editingItem.productId || !editingItem.productName) return;

    const calculated = calculateItemTotal(editingItem);
    const finalItem: PurchaseInvoiceItem = {
      id: editingItem.id || `item-${Date.now()}`,
      productId: editingItem.productId,
      productName: editingItem.productName,
      quantity: editingItem.quantity || 1,
      unitPrice: editingItem.unitPrice || 0,
      discountType: editingItem.discountType,
      discountValue: editingItem.discountValue,
      discountAmount: calculated.discountAmount,
      unitOfMeasurement: editingItem.unitOfMeasurement || 'pcs',
      totalAmount: calculated.totalAmount
    };

    if (editingItem.isNew) {
      onItemsChange([...items, finalItem]);
    } else {
      const index = items.findIndex(item => 
        item.id === editingItem.id || 
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
      unitPrice: product.price || 0,
      unitOfMeasurement: product.unitOfMeasurement || 'pcs'
    }));
  }, [editingItem]);

  // Handle field changes
  const handleFieldChange = useCallback((field: keyof EditingItem, value: any) => {
    setEditingItem(prev => {
      if (!prev) return null;
      const updated = { ...prev, [field]: value };
      
      // Recalculate totals when relevant fields change
      if (['quantity', 'unitPrice', 'discountType', 'discountValue'].includes(field)) {
        const calculated = calculateItemTotal(updated);
        updated.discountAmount = calculated.discountAmount;
        updated.totalAmount = calculated.totalAmount;
      }
      
      return updated;
    });
  }, [calculateItemTotal]);

  // Bulk operations
  const handleBulkDiscount = useCallback((discountType: 'percentage' | 'amount', discountValue: number) => {
    const newItems = items.map((item, index) => {
      if (selectedItems.includes(index)) {
        const calculated = calculateItemTotal({
          ...item,
          discountType,
          discountValue
        });
        return {
          ...item,
          discountType,
          discountValue,
          discountAmount: calculated.discountAmount,
          totalAmount: calculated.totalAmount
        };
      }
      return item;
    });
    onItemsChange(newItems);
    setSelectedItems([]);
    setBulkEditMode(false);
  }, [items, selectedItems, onItemsChange, calculateItemTotal]);

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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
            >
              <ReceiptIcon color="primary" />
            </motion.div>
            <Typography variant="h6">Invoice Items</Typography>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Badge badgeContent={totals.itemCount} color="primary">
                <Chip 
                  label={`${totals.totalQuantity} units`} 
                  size="small" 
                  variant="outlined" 
                />
              </Badge>
            </motion.div>
          </Box>
          
          {!readOnly && (
            <Box sx={{ display: 'flex', gap: 1 }}>

              
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Tooltip title="Filter Products">
                  <IconButton
                    color={showFilters ? 'primary' : 'default'}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <FilterIcon />
                  </IconButton>
                </Tooltip>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => startEditing()}
                  disabled={!!editingItem}
                >
                  Add Item
                </Button>
              </motion.div>
            </Box>
          )}
        </Box>
      </motion.div>



      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
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
            </motion.div>
        )}
      </AnimatePresence>

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
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Qty</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Unit</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Unit Price</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Discount</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Total</TableCell>
              {!readOnly && <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.tr
                  key={item.id || index}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  component={TableRow}
                  hover
                  sx={{
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
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
                  <Typography variant="body2" fontWeight="medium">
                    {item.productName}
                  </Typography>
                </TableCell>
                
                <TableCell align="center">
                  <Typography variant="body2" fontWeight="medium">
                    {item.quantity}
                  </Typography>
                </TableCell>
                
                <TableCell align="center">
                  <Chip 
                    label={item.unitOfMeasurement} 
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
                  {item.discountAmount && item.discountAmount > 0 ? (
                    <Box>
                      <Typography variant="body2" color="error">
                        -₹{item.discountAmount.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({item.discountValue}{item.discountType === 'percentage' ? '%' : '₹'})
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  )}
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
                    ₹{item.totalAmount.toFixed(2)}
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
                </motion.tr>
              ))}
            </AnimatePresence>

            <AnimatePresence>
              {/* Editing Row */}
              {editingItem && (
                <motion.tr
                  key="editing-row"
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  component={TableRow}
                  sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}
                >
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
                            <Chip
                              label={option.quantity}
                              size="small"
                              color={getStockStatusColor(option)}
                              variant="outlined"
                            />
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
                    value={editingItem.unitOfMeasurement || ''}
                    onChange={(e) => handleFieldChange('unitOfMeasurement', e.target.value)}
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
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 80 }}>
                      <Select
                        value={editingItem.discountType || 'percentage'}
                        onChange={(e) => handleFieldChange('discountType', e.target.value)}
                      >
                        <MenuItem value="percentage">%</MenuItem>
                        <MenuItem value="amount">₹</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      size="small"
                      type="number"
                      value={editingItem.discountValue || ''}
                      onChange={(e) => handleFieldChange('discountValue', Number(e.target.value))}
                      inputProps={{ min: 0, step: 0.01 }}
                      sx={{ width: 80 }}
                    />
                  </Box>
                </TableCell>
                
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    ₹{(editingItem.totalAmount || 0).toFixed(2)}
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
                </motion.tr>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {/* Empty State */}
              {items.length === 0 && !editingItem && (
                <motion.tr
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  component={TableRow}
                >
                  <TableCell colSpan={readOnly ? 7 : 8} align="center" sx={{ py: 4 }}>
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          <CartIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                        </motion.div>
                        <Typography variant="body1" color="text.secondary">
                          No items added yet
                        </Typography>
                        {!readOnly && (
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              variant="outlined"
                              startIcon={<AddIcon />}
                              onClick={() => startEditing()}
                            >
                              Add First Item
                            </Button>
                          </motion.div>
                        )}
                      </Box>
                    </motion.div>
                  </TableCell>
                </motion.tr>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Totals Summary */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2} justifyContent="flex-end">
                <Grid item xs={12} sm={6} md={4}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Card variant="outlined">
                      <CardContent sx={{ p: 2 }}>
                        <Stack spacing={1}>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4 }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">
                                Subtotal ({totals.itemCount} items):
                              </Typography>
                              <motion.div
                                key={totals.subtotal}
                                initial={{ scale: 1.1 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Typography variant="body2">
                                  ₹{totals.subtotal.toFixed(2)}
                                </Typography>
                              </motion.div>
                            </Box>
                          </motion.div>
                          
                          <AnimatePresence>
                            {totals.totalDiscountAmount > 0 && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Total Discount:
                                  </Typography>
                                  <motion.div
                                    key={totals.totalDiscountAmount}
                                    initial={{ scale: 1.1 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <Typography variant="body2" color="error">
                                      -₹{totals.totalDiscountAmount.toFixed(2)}
                                    </Typography>
                                  </motion.div>
                                </Box>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          
                          <Divider />
                          
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="h6" fontWeight="bold">
                                Items Total:
                              </Typography>
                              <motion.div
                                key={totals.totalAmount}
                                initial={{ scale: 1.1 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Typography 
                                  variant="h6" 
                                  fontWeight="bold" 
                                  color="primary"
                                >
                                  ₹{totals.totalAmount.toFixed(2)}
                                </Typography>
                              </motion.div>
                            </Box>
                          </motion.div>
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              </Grid>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Floating Action Button for Mobile */}
      {!readOnly && (
        <Zoom in={!editingItem}>
          <Fab
            color="primary"
            aria-label="add item"
            onClick={() => startEditing()}
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

export default EnhancedInvoiceItemsManager;