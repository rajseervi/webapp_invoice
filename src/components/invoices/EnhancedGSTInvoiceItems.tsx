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
  Avatar,
  Grid,
  Divider,
  Tooltip,
  Badge,
  Alert,
  Collapse,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Fab,
  Zoom,
  useTheme,
  alpha,
  Stack,
  InputAdornment,
  Menu,
  ListItemIcon,
  ListItemText,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  Inventory as InventoryIcon,
  LocalOffer as PriceIcon,
  Category as CategoryIcon,
  QrCode as QrCodeIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Percent as PercentIcon,
  Calculate as CalculateIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ShoppingCart as CartIcon,
  AccountBalance as TaxIcon,
  MonetizationOn as MoneyIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  AutoAwesome as AutoIcon,
  Tune as TuneIcon,
  Psychology as SmartIcon,
  Star as StarIcon,
  BookmarkBorder as BookmarkIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

// Types
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  categoryId?: string;
  hsnCode?: string;
  gstRate?: number;
  sku?: string;
  description?: string;
  quantity?: number;
  minStockLevel?: number;
  costPrice?: number;
  weight?: number;
  weightUnit?: string;
  imageUrl?: string;
  isActive?: boolean;
  tags?: string[];
  brand?: string;
  unit?: string;
  barcode?: string;
  lastSoldDate?: string;
  totalSold?: number;
  averageRating?: number;
  isFavorite?: boolean;
}

interface Party {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  stateCode?: string;
  categoryDiscounts: Record<string, number>;
  productDiscounts?: Record<string, number>;
  paymentTerms?: number;
  creditLimit?: number;
  isGstRegistered?: boolean;
  preferredCategories?: string[];
  lastOrderDate?: string;
  totalOrders?: number;
  outstandingAmount?: number;
}

interface GSTInvoiceItem {
  id: string;
  productId: string;
  name: string;
  description?: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  discountType: 'percentage' | 'amount';
  discountSource: 'none' | 'category' | 'product' | 'party' | 'custom' | 'bulk' | 'seasonal';
  taxableAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  totalAmount: number;
  category: string;
  categoryId?: string;
  notes?: string;
  isCustomProduct?: boolean;
  originalPrice?: number;
  marginPercentage?: number;
  profitAmount?: number;
  stockImpact?: number;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  lineNumber?: number;
}

interface CategoryDiscount {
  categoryId: string;
  categoryName: string;
  discountPercentage: number;
  isActive: boolean;
  validFrom?: Date;
  validTo?: Date;
  minQuantity?: number;
  maxDiscount?: number;
  description?: string;
}

interface BulkDiscountRule {
  id: string;
  name: string;
  type: 'quantity' | 'amount' | 'category';
  minQuantity?: number;
  minAmount?: number;
  categoryIds?: string[];
  discountPercentage: number;
  maxDiscount?: number;
  isActive: boolean;
  priority: number;
}

interface InvoiceItemsProps {
  items: GSTInvoiceItem[];
  products: Product[];
  party: Party | null;
  isInterState: boolean;
  onItemsChange: (items: GSTInvoiceItem[]) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: keyof GSTInvoiceItem, value: any) => void;
  categories?: Array<{ id: string; name: string; color?: string; icon?: string }>;
  bulkDiscountRules?: BulkDiscountRule[];
  showAdvancedFeatures?: boolean;
  allowCustomProducts?: boolean;
  enableSmartSuggestions?: boolean;
  enableBulkOperations?: boolean;
  enableQuickActions?: boolean;
  compactMode?: boolean;
  readOnly?: boolean;
}

const GST_RATES = [0, 5, 12, 18, 28];
const UNITS = ['PCS', 'KG', 'LITER', 'METER', 'BOX', 'DOZEN', 'GRAM', 'TON'];
const DISCOUNT_SOURCES = [
  { value: 'none', label: 'No Discount', color: 'default' },
  { value: 'category', label: 'Category Discount', color: 'primary' },
  { value: 'product', label: 'Product Discount', color: 'secondary' },
  { value: 'party', label: 'Party Discount', color: 'info' },
  { value: 'custom', label: 'Custom Discount', color: 'warning' },
  { value: 'bulk', label: 'Bulk Discount', color: 'success' },
  { value: 'seasonal', label: 'Seasonal Discount', color: 'error' }
];

export const EnhancedGSTInvoiceItems: React.FC<InvoiceItemsProps> = ({
  items,
  products,
  party,
  isInterState,
  onItemsChange,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  categories = [],
  bulkDiscountRules = [],
  showAdvancedFeatures = true,
  allowCustomProducts = true,
  enableSmartSuggestions = true,
  enableBulkOperations = true,
  enableQuickActions = true,
  compactMode = false,
  readOnly = false
}) => {
  const theme = useTheme();
  
  // State management
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [showItemDetails, setShowItemDetails] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'category' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkEditValues, setBulkEditValues] = useState<Partial<GSTInvoiceItem>>({});
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorValues, setCalculatorValues] = useState({
    quantity: 0,
    rate: 0,
    discount: 0,
    gstRate: 18
  });
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [loading, setLoading] = useState(false);

  // Memoized calculations
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.hsnCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter;
      
      return matchesSearch && matchesCategory && product.isActive !== false;
    });

    // Sort products
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'category':
          aValue = a.category?.toLowerCase() || '';
          bValue = b.category?.toLowerCase() || '';
          break;
        case 'stock':
          aValue = a.quantity || 0;
          bValue = b.quantity || 0;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [products, searchQuery, categoryFilter, sortBy, sortOrder]);

  const invoiceSummary = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
    const totalDiscount = items.reduce((sum, item) => {
      const itemTotal = item.rate * item.quantity;
      const discountAmount = item.discountType === 'percentage' 
        ? (itemTotal * item.discount / 100)
        : item.discount;
      return sum + discountAmount;
    }, 0);
    const taxableAmount = items.reduce((sum, item) => sum + item.taxableAmount, 0);
    const totalTax = items.reduce((sum, item) => sum + item.totalTaxAmount, 0);
    const grandTotal = items.reduce((sum, item) => sum + item.totalAmount, 0);
    
    return {
      itemCount: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      totalDiscount,
      discountPercentage: subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0,
      taxableAmount,
      totalTax,
      grandTotal,
      averageItemValue: items.length > 0 ? grandTotal / items.length : 0,
      categoriesCount: new Set(items.map(item => item.categoryId)).size
    };
  }, [items]);

  const smartSuggestions = useMemo(() => {
    if (!enableSmartSuggestions || !party) return [];
    
    const suggestions = [];
    
    // Suggest products based on party's preferred categories
    if (party.preferredCategories?.length) {
      const preferredProducts = products.filter(p => 
        party.preferredCategories!.includes(p.categoryId || '') && 
        !items.some(item => item.productId === p.id)
      ).slice(0, 3);
      
      if (preferredProducts.length > 0) {
        suggestions.push({
          type: 'preferred',
          title: 'Preferred Products',
          products: preferredProducts,
          reason: 'Based on party preferences'
        });
      }
    }
    
    // Suggest frequently ordered products
    const frequentProducts = products
      .filter(p => p.totalSold && p.totalSold > 10 && !items.some(item => item.productId === p.id))
      .sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))
      .slice(0, 3);
    
    if (frequentProducts.length > 0) {
      suggestions.push({
        type: 'frequent',
        title: 'Popular Products',
        products: frequentProducts,
        reason: 'Frequently ordered by other customers'
      });
    }
    
    // Suggest complementary products
    const currentCategories = new Set(items.map(item => item.categoryId));
    const complementaryProducts = products
      .filter(p => !currentCategories.has(p.categoryId) && !items.some(item => item.productId === p.id))
      .slice(0, 2);
    
    if (complementaryProducts.length > 0) {
      suggestions.push({
        type: 'complementary',
        title: 'Complementary Products',
        products: complementaryProducts,
        reason: 'Complete your order'
      });
    }
    
    return suggestions;
  }, [party, products, items, enableSmartSuggestions]);

  // Helper functions
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }, []);

  const calculateItemTotals = useCallback((item: Partial<GSTInvoiceItem>) => {
    const quantity = item.quantity || 0;
    const rate = item.rate || 0;
    const discount = item.discount || 0;
    const gstRate = item.gstRate || 0;
    
    const lineTotal = quantity * rate;
    const discountAmount = item.discountType === 'percentage' 
      ? (lineTotal * discount / 100)
      : discount;
    
    const taxableAmount = lineTotal - discountAmount;
    const totalTaxAmount = (taxableAmount * gstRate) / 100;
    
    const cgstAmount = isInterState ? 0 : totalTaxAmount / 2;
    const sgstAmount = isInterState ? 0 : totalTaxAmount / 2;
    const igstAmount = isInterState ? totalTaxAmount : 0;
    
    return {
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTaxAmount,
      totalAmount: taxableAmount + totalTaxAmount
    };
  }, [isInterState]);

  const applyPartyDiscounts = useCallback((productId: string, categoryId: string) => {
    if (!party) return { discount: 0, discountSource: 'none' as const };
    
    // Check product-specific discount first
    const productDiscount = party.productDiscounts?.[productId] || 0;
    if (productDiscount > 0) {
      return { discount: productDiscount, discountSource: 'product' as const };
    }
    
    // Check category discount
    const category = categories.find(c => c.id === categoryId);
    if (category && party.categoryDiscounts[category.name]) {
      const categoryDiscount = party.categoryDiscounts[category.name];
      return { discount: categoryDiscount, discountSource: 'category' as const };
    }
    
    return { discount: 0, discountSource: 'none' as const };
  }, [party, categories]);

  const applyBulkDiscounts = useCallback((items: GSTInvoiceItem[]) => {
    if (!bulkDiscountRules.length) return items;
    
    return items.map(item => {
      let bestDiscount = item.discount;
      let bestSource = item.discountSource;
      
      for (const rule of bulkDiscountRules.filter(r => r.isActive)) {
        let qualifies = false;
        
        if (rule.type === 'quantity') {
          const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
          qualifies = totalQuantity >= (rule.minQuantity || 0);
        } else if (rule.type === 'amount') {
          const totalAmount = items.reduce((sum, i) => sum + i.totalAmount, 0);
          qualifies = totalAmount >= (rule.minAmount || 0);
        } else if (rule.type === 'category') {
          qualifies = rule.categoryIds?.includes(item.categoryId || '') || false;
        }
        
        if (qualifies && rule.discountPercentage > bestDiscount) {
          bestDiscount = Math.min(rule.discountPercentage, rule.maxDiscount || 100);
          bestSource = 'bulk';
        }
      }
      
      if (bestDiscount !== item.discount || bestSource !== item.discountSource) {
        const updatedItem = { ...item, discount: bestDiscount, discountSource: bestSource };
        const totals = calculateItemTotals(updatedItem);
        return { ...updatedItem, ...totals };
      }
      
      return item;
    });
  }, [bulkDiscountRules, calculateItemTotals]);

  const getStockStatus = useCallback((product: Product) => {
    if (!product.quantity) return { status: 'out', color: 'error', text: 'Out of Stock', icon: WarningIcon };
    if (product.quantity <= (product.minStockLevel || 5)) return { status: 'low', color: 'warning', text: 'Low Stock', icon: WarningIcon };
    return { status: 'good', color: 'success', text: 'In Stock', icon: CheckCircleIcon };
  }, []);

  const getCategoryInfo = useCallback((categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || { 
      id: 'uncategorized', 
      name: 'Uncategorized', 
      color: theme.palette.grey[500],
      icon: 'category'
    };
  }, [categories, theme]);

  const getDiscountSourceInfo = useCallback((source: string) => {
    return DISCOUNT_SOURCES.find(s => s.value === source) || DISCOUNT_SOURCES[0];
  }, []);

  // Event handlers
  const handleAddProduct = useCallback((product: Product) => {
    if (readOnly) return;
    
    const { discount, discountSource } = applyPartyDiscounts(product.id, product.categoryId || '');
    
    const newItem: GSTInvoiceItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      productId: product.id,
      name: product.name,
      description: product.description,
      hsnCode: product.hsnCode || '',
      quantity: 1,
      unit: product.unit || 'PCS',
      rate: product.price,
      discount,
      discountType: 'percentage',
      discountSource,
      gstRate: product.gstRate || 18,
      category: product.category || '',
      categoryId: product.categoryId,
      originalPrice: product.price,
      lineNumber: items.length + 1,
      ...calculateItemTotals({
        quantity: 1,
        rate: product.price,
        discount,
        discountType: 'percentage',
        gstRate: product.gstRate || 18
      })
    };
    
    const updatedItems = [...items, newItem];
    const itemsWithBulkDiscounts = applyBulkDiscounts(updatedItems);
    onItemsChange(itemsWithBulkDiscounts);
    
    // Add to recent products
    setRecentProducts(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      return [product, ...filtered].slice(0, 10);
    });
    
    setNotification({
      message: `${product.name} added to invoice`,
      type: 'success'
    });
  }, [items, onItemsChange, applyPartyDiscounts, calculateItemTotals, applyBulkDiscounts, readOnly]);

  const handleUpdateItem = useCallback((index: number, field: keyof GSTInvoiceItem, value: any) => {
    if (readOnly) return;
    
    const updatedItems = [...items];
    const item = { ...updatedItems[index], [field]: value };
    
    // Recalculate totals if relevant fields changed
    if (['quantity', 'rate', 'discount', 'discountType', 'gstRate'].includes(field)) {
      const totals = calculateItemTotals(item);
      Object.assign(item, totals);
    }
    
    updatedItems[index] = item;
    const itemsWithBulkDiscounts = applyBulkDiscounts(updatedItems);
    onItemsChange(itemsWithBulkDiscounts);
  }, [items, onItemsChange, calculateItemTotals, applyBulkDiscounts, readOnly]);

  const handleBulkUpdate = useCallback(() => {
    if (readOnly || selectedItems.size === 0) return;
    
    const updatedItems = items.map((item, index) => {
      if (!selectedItems.has(index)) return item;
      
      const updatedItem = { ...item, ...bulkEditValues };
      
      // Recalculate totals
      const totals = calculateItemTotals(updatedItem);
      return { ...updatedItem, ...totals };
    });
    
    const itemsWithBulkDiscounts = applyBulkDiscounts(updatedItems);
    onItemsChange(itemsWithBulkDiscounts);
    
    setBulkEditMode(false);
    setSelectedItems(new Set());
    setBulkEditValues({});
    
    setNotification({
      message: `Updated ${selectedItems.size} items`,
      type: 'success'
    });
  }, [items, selectedItems, bulkEditValues, onItemsChange, calculateItemTotals, applyBulkDiscounts, readOnly]);

  const handleSelectAll = useCallback(() => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map((_, index) => index)));
    }
  }, [items, selectedItems]);

  const handleQuickAdd = useCallback((productIds: string[]) => {
    if (readOnly) return;
    
    const newItems = productIds.map(productId => {
      const product = products.find(p => p.id === productId);
      if (!product) return null;
      
      const { discount, discountSource } = applyPartyDiscounts(product.id, product.categoryId || '');
      
      return {
        id: `item-${Date.now()}-${Math.random()}`,
        productId: product.id,
        name: product.name,
        description: product.description,
        hsnCode: product.hsnCode || '',
        quantity: 1,
        unit: product.unit || 'PCS',
        rate: product.price,
        discount,
        discountType: 'percentage' as const,
        discountSource,
        gstRate: product.gstRate || 18,
        category: product.category || '',
        categoryId: product.categoryId,
        originalPrice: product.price,
        lineNumber: items.length + 1,
        ...calculateItemTotals({
          quantity: 1,
          rate: product.price,
          discount,
          discountType: 'percentage' as const,
          gstRate: product.gstRate || 18
        })
      };
    }).filter(Boolean) as GSTInvoiceItem[];
    
    const updatedItems = [...items, ...newItems];
    const itemsWithBulkDiscounts = applyBulkDiscounts(updatedItems);
    onItemsChange(itemsWithBulkDiscounts);
    
    setNotification({
      message: `Added ${newItems.length} products to invoice`,
      type: 'success'
    });
  }, [items, products, onItemsChange, applyPartyDiscounts, calculateItemTotals, applyBulkDiscounts, readOnly]);

  // Render components
  const renderProductSearch = () => (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search products by name, SKU, HSN code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <Tooltip title="Filters">
            <IconButton onClick={() => setShowFilters(!showFilters)}>
              <FilterIcon />
            </IconButton>
          </Tooltip>
          
          {enableQuickActions && (
            <Tooltip title="Quick Add Mode">
              <IconButton 
                color={quickAddMode ? 'primary' : 'default'}
                onClick={() => setQuickAddMode(!quickAddMode)}
              >
                <SpeedIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        <Collapse in={showFilters}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                label="Sort By"
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="price">Price</MenuItem>
                <MenuItem value="category">Category</MenuItem>
                <MenuItem value="stock">Stock</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Order</InputLabel>
              <Select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                label="Order"
              >
                <MenuItem value="asc">Ascending</MenuItem>
                <MenuItem value="desc">Descending</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Collapse>
        
        {/* Product Grid */}
        <Grid container spacing={1} sx={{ maxHeight: 300, overflow: 'auto' }}>
          {filteredProducts.slice(0, quickAddMode ? 20 : 8).map(product => {
            const stockStatus = getStockStatus(product);
            const categoryInfo = getCategoryInfo(product.categoryId || '');
            const isInInvoice = items.some(item => item.productId === product.id);
            
            return (
              <Grid item xs={12} sm={6} md={quickAddMode ? 3 : 4} key={product.id}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    cursor: readOnly ? 'default' : 'pointer',
                    opacity: isInInvoice ? 0.7 : 1,
                    '&:hover': readOnly ? {} : { 
                      boxShadow: 2,
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s'
                  }}
                  onClick={() => !readOnly && !isInInvoice && handleAddProduct(product)}
                >
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {product.imageUrl ? (
                        <Avatar src={product.imageUrl} sx={{ width: 32, height: 32 }} />
                      ) : (
                        <Avatar sx={{ width: 32, height: 32, bgcolor: categoryInfo.color }}>
                          {product.name.charAt(0)}
                        </Avatar>
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight="medium" noWrap>
                          {product.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatCurrency(product.price)}
                        </Typography>
                      </Box>
                      {isInInvoice && (
                        <CheckCircleIcon color="success" fontSize="small" />
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <Chip 
                        label={categoryInfo.name} 
                        size="small" 
                        sx={{ 
                          fontSize: '0.65rem', 
                          height: 18,
                          bgcolor: alpha(categoryInfo.color || theme.palette.grey[500], 0.1),
                          color: categoryInfo.color || theme.palette.grey[700]
                        }}
                      />
                      <Chip 
                        label={stockStatus.text} 
                        size="small" 
                        color={stockStatus.color as any}
                        sx={{ fontSize: '0.65rem', height: 18 }}
                      />
                      {product.hsnCode && (
                        <Chip 
                          label={product.hsnCode} 
                          size="small" 
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', height: 18 }}
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
        
        {filteredProducts.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              No products found matching your criteria
            </Typography>
            {allowCustomProducts && (
              <Button 
                variant="outlined" 
                size="small" 
                sx={{ mt: 1 }}
                startIcon={<AddIcon />}
              >
                Add Custom Product
              </Button>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderSmartSuggestions = () => {
    if (!enableSmartSuggestions || !smartSuggestions.length) return null;
    
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <SmartIcon color="primary" />
            <Typography variant="h6">Smart Suggestions</Typography>
            <Chip label="AI Powered" size="small" color="primary" variant="outlined" />
          </Box>
          
          {smartSuggestions.map((suggestion, index) => (
            <Accordion key={index} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2">{suggestion.title}</Typography>
                  <Chip label={suggestion.reason} size="small" variant="outlined" />
                  <Badge badgeContent={suggestion.products.length} color="primary" />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={1}>
                  {suggestion.products.map(product => (
                    <Grid item xs={12} sm={6} md={4} key={product.id}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { boxShadow: 1 }
                        }}
                        onClick={() => handleAddProduct(product)}
                      >
                        <CardContent sx={{ p: 1 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {product.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatCurrency(product.price)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>
    );
  };

  const renderInvoiceItemsTable = () => (
    <TableContainer component={Paper} sx={{ mb: 2 }}>
      <Table size={compactMode ? 'small' : 'medium'}>
        <TableHead>
          <TableRow>
            {enableBulkOperations && !readOnly && (
              <TableCell padding="checkbox">
                <input
                  type="checkbox"
                  checked={selectedItems.size === items.length && items.length > 0}
                  onChange={handleSelectAll}
                />
              </TableCell>
            )}
            <TableCell>Product Details</TableCell>
            <TableCell align="center">HSN/SAC</TableCell>
            <TableCell align="center">Qty</TableCell>
            <TableCell align="center">Unit</TableCell>
            <TableCell align="right">Rate</TableCell>
            <TableCell align="center">Discount</TableCell>
            <TableCell align="center">GST%</TableCell>
            <TableCell align="right">Taxable</TableCell>
            {isInterState ? (
              <TableCell align="right">IGST</TableCell>
            ) : (
              <>
                <TableCell align="right">CGST</TableCell>
                <TableCell align="right">SGST</TableCell>
              </>
            )}
            <TableCell align="right">Total</TableCell>
            {!readOnly && <TableCell align="center">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              <TableRow 
                hover
                sx={{ 
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                  bgcolor: selectedItems.has(index) ? alpha(theme.palette.primary.main, 0.08) : 'inherit'
                }}
              >
                {enableBulkOperations && !readOnly && (
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(index)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedItems);
                        if (e.target.checked) {
                          newSelected.add(index);
                        } else {
                          newSelected.delete(index);
                        }
                        setSelectedItems(newSelected);
                      }}
                    />
                  </TableCell>
                )}
                
                {/* Product Details */}
                <TableCell sx={{ minWidth: 250 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      {item.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {item.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        {item.category && (
                          <Chip 
                            label={item.category} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', height: 18 }}
                          />
                        )}
                        {item.discountSource !== 'none' && (
                          <Chip 
                            label={getDiscountSourceInfo(item.discountSource).label} 
                            size="small" 
                            color={getDiscountSourceInfo(item.discountSource).color as any}
                            sx={{ fontSize: '0.65rem', height: 18 }}
                          />
                        )}
                      </Box>
                      {item.description && (
                        <Typography variant="caption" color="text.secondary">
                          {item.description}
                        </Typography>
                      )}
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={() => setShowItemDetails(prev => ({ ...prev, [index]: !prev[index] }))}
                    >
                      {showItemDetails[index] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                </TableCell>
                
                {/* HSN Code */}
                <TableCell align="center">
                  <TextField
                    size="small"
                    value={item.hsnCode}
                    onChange={(e) => handleUpdateItem(index, 'hsnCode', e.target.value)}
                    sx={{ width: 100 }}
                    disabled={readOnly}
                  />
                </TableCell>
                
                {/* Quantity */}
                <TableCell align="center">
                  <TextField
                    size="small"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleUpdateItem(index, 'quantity', Number(e.target.value) || 0)}
                    sx={{ width: 80 }}
                    inputProps={{ min: 0, step: 1 }}
                    disabled={readOnly}
                  />
                </TableCell>
                
                {/* Unit */}
                <TableCell align="center">
                  <TextField
                    size="small"
                    select
                    value={item.unit}
                    onChange={(e) => handleUpdateItem(index, 'unit', e.target.value)}
                    sx={{ width: 80 }}
                    disabled={readOnly}
                  >
                    {UNITS.map(unit => (
                      <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                
                {/* Rate */}
                <TableCell align="right">
                  <TextField
                    size="small"
                    type="number"
                    value={item.rate}
                    onChange={(e) => handleUpdateItem(index, 'rate', Number(e.target.value) || 0)}
                    sx={{ width: 100 }}
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{
                      startAdornment: <Typography variant="caption">₹</Typography>
                    }}
                    disabled={readOnly}
                  />
                </TableCell>
                
                {/* Discount */}
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TextField
                      size="small"
                      type="number"
                      value={item.discount}
                      onChange={(e) => handleUpdateItem(index, 'discount', Number(e.target.value) || 0)}
                      sx={{ width: 70 }}
                      inputProps={{ min: 0, max: item.discountType === 'percentage' ? 100 : undefined }}
                      disabled={readOnly}
                    />
                    <TextField
                      size="small"
                      select
                      value={item.discountType}
                      onChange={(e) => handleUpdateItem(index, 'discountType', e.target.value)}
                      sx={{ width: 60 }}
                      disabled={readOnly}
                    >
                      <MenuItem value="percentage">%</MenuItem>
                      <MenuItem value="amount">₹</MenuItem>
                    </TextField>
                  </Box>
                </TableCell>
                
                {/* GST Rate */}
                <TableCell align="center">
                  <TextField
                    size="small"
                    select
                    value={item.gstRate}
                    onChange={(e) => handleUpdateItem(index, 'gstRate', Number(e.target.value))}
                    sx={{ width: 80 }}
                    disabled={readOnly}
                  >
                    {GST_RATES.map(rate => (
                      <MenuItem key={rate} value={rate}>{rate}%</MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                
                {/* Taxable Amount */}
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="medium">
                    {formatCurrency(item.taxableAmount)}
                  </Typography>
                </TableCell>
                
                {/* GST Amounts */}
                {isInterState ? (
                  <TableCell align="right">
                    <Typography variant="body2" color="primary">
                      {formatCurrency(item.igstAmount)}
                    </Typography>
                  </TableCell>
                ) : (
                  <>
                    <TableCell align="right">
                      <Typography variant="body2" color="primary">
                        {formatCurrency(item.cgstAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="primary">
                        {formatCurrency(item.sgstAmount)}
                      </Typography>
                    </TableCell>
                  </>
                )}
                
                {/* Total Amount */}
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    {formatCurrency(item.totalAmount)}
                  </Typography>
                </TableCell>
                
                {/* Actions */}
                {!readOnly && (
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Remove Item">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => onRemoveItem(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Item Details">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => setShowItemDetails(prev => ({ ...prev, [index]: !prev[index] }))}
                        >
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                )}
              </TableRow>
              
              {/* Item Details Row */}
              {showItemDetails[index] && (
                <TableRow>
                  <TableCell 
                    colSpan={enableBulkOperations && !readOnly ? 12 : 11} 
                    sx={{ py: 0, borderBottom: 'none' }}
                  >
                    <Collapse in={showItemDetails[index]}>
                      <Box sx={{ p: 2, bgcolor: alpha(theme.palette.grey[100], 0.5) }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                              Item Analysis
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Typography variant="body2">
                                <strong>Line Total:</strong> {formatCurrency(item.quantity * item.rate)}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Discount Amount:</strong> {formatCurrency(
                                  item.discountType === 'percentage' 
                                    ? (item.quantity * item.rate * item.discount / 100)
                                    : item.discount
                                )}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Tax Amount:</strong> {formatCurrency(item.totalTaxAmount)}
                              </Typography>
                              {item.originalPrice && item.originalPrice !== item.rate && (
                                <Typography variant="body2" color="warning.main">
                                  <strong>Price Changed:</strong> {formatCurrency(item.originalPrice)} → {formatCurrency(item.rate)}
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                              Additional Info
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              label="Notes"
                              value={item.notes || ''}
                              onChange={(e) => handleUpdateItem(index, 'notes', e.target.value)}
                              multiline
                              rows={2}
                              disabled={readOnly}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
          
          {items.length === 0 && (
            <TableRow>
              <TableCell 
                colSpan={enableBulkOperations && !readOnly ? 12 : 11} 
                align="center" 
                sx={{ py: 4 }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <CartIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                  <Typography variant="h6" color="text.secondary">
                    No items added yet
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    Search and add products to get started
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderInvoiceSummary = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon color="primary" />
          Invoice Summary
          <Chip label={`${invoiceSummary.itemCount} items`} size="small" color="primary" />
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Subtotal ({invoiceSummary.totalQuantity} items):</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatCurrency(invoiceSummary.subtotal)}
                </Typography>
              </Box>
              
              {invoiceSummary.totalDiscount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="error">
                    Total Discount ({invoiceSummary.discountPercentage.toFixed(1)}%):
                  </Typography>
                  <Typography variant="body2" color="error" fontWeight="medium">
                    -{formatCurrency(invoiceSummary.totalDiscount)}
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Taxable Amount:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatCurrency(invoiceSummary.taxableAmount)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="primary">Total GST:</Typography>
                <Typography variant="body2" color="primary" fontWeight="medium">
                  {formatCurrency(invoiceSummary.totalTax)}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" color="success.main">Grand Total:</Typography>
                <Typography variant="h6" color="success.main" fontWeight="bold">
                  {formatCurrency(invoiceSummary.grandTotal)}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Quick Stats
              </Typography>
              <Typography variant="body2">
                <strong>Categories:</strong> {invoiceSummary.categoriesCount}
              </Typography>
              <Typography variant="body2">
                <strong>Avg Item Value:</strong> {formatCurrency(invoiceSummary.averageItemValue)}
              </Typography>
              {party && (
                <Typography variant="body2">
                  <strong>Party:</strong> {party.name}
                </Typography>
              )}
              <Typography variant="body2">
                <strong>GST Type:</strong> {isInterState ? 'IGST' : 'CGST + SGST'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderBulkActions = () => {
    if (!enableBulkOperations || readOnly || selectedItems.size === 0) return null;
    
    return (
      <Card sx={{ mb: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="subtitle2">
              {selectedItems.size} items selected
            </Typography>
            
            <Button
              size="small"
              variant="outlined"
              onClick={() => setBulkEditMode(true)}
              startIcon={<EditIcon />}
            >
              Bulk Edit
            </Button>
            
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => {
                const indicesToRemove = Array.from(selectedItems).sort((a, b) => b - a);
                indicesToRemove.forEach(index => onRemoveItem(index));
                setSelectedItems(new Set());
              }}
              startIcon={<DeleteIcon />}
            >
              Remove Selected
            </Button>
            
            <Button
              size="small"
              variant="outlined"
              onClick={() => setSelectedItems(new Set())}
            >
              Clear Selection
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {/* Product Search */}
      {!readOnly && renderProductSearch()}
      
      {/* Smart Suggestions */}
      {renderSmartSuggestions()}
      
      {/* Bulk Actions */}
      {renderBulkActions()}
      
      {/* Invoice Items Table */}
      {renderInvoiceItemsTable()}
      
      {/* Invoice Summary */}
      {renderInvoiceSummary()}
      
      {/* Floating Action Buttons */}
      {!readOnly && (
        <Box sx={{ position: 'fixed', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Zoom in={true}>
            <Fab
              color="primary"
              onClick={onAddItem}
              sx={{ mb: 1 }}
            >
              <AddIcon />
            </Fab>
          </Zoom>
          
          {enableQuickActions && (
            <Zoom in={true} style={{ transitionDelay: '100ms' }}>
              <Fab
                color="secondary"
                size="small"
                onClick={() => setShowCalculator(true)}
              >
                <CalculateIcon />
              </Fab>
            </Zoom>
          )}
          
          {showAdvancedFeatures && (
            <Zoom in={true} style={{ transitionDelay: '200ms' }}>
              <Fab
                color="info"
                size="small"
                onClick={() => setShowAnalytics(true)}
              >
                <TrendingUpIcon />
              </Fab>
            </Zoom>
          )}
        </Box>
      )}
      
      {/* Bulk Edit Dialog */}
      <Dialog open={bulkEditMode} onClose={() => setBulkEditMode(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Edit Items</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Discount (%)"
              type="number"
              value={bulkEditValues.discount || ''}
              onChange={(e) => setBulkEditValues(prev => ({ ...prev, discount: Number(e.target.value) || 0 }))}
              inputProps={{ min: 0, max: 100 }}
            />
            
            <FormControl fullWidth>
              <InputLabel>GST Rate</InputLabel>
              <Select
                value={bulkEditValues.gstRate || ''}
                onChange={(e) => setBulkEditValues(prev => ({ ...prev, gstRate: Number(e.target.value) }))}
                label="GST Rate"
              >
                {GST_RATES.map(rate => (
                  <MenuItem key={rate} value={rate}>{rate}%</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Unit</InputLabel>
              <Select
                value={bulkEditValues.unit || ''}
                onChange={(e) => setBulkEditValues(prev => ({ ...prev, unit: e.target.value }))}
                label="Unit"
              >
                {UNITS.map(unit => (
                  <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkEditMode(false)}>Cancel</Button>
          <Button onClick={handleBulkUpdate} variant="contained">
            Update {selectedItems.size} Items
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={!!notification}
        autoHideDuration={3000}
        onClose={() => setNotification(null)}
        message={notification?.message}
      />
      
      {/* Loading Overlay */}
      {loading && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: alpha(theme.palette.background.default, 0.8),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <CircularProgress size={60} />
        </Box>
      )}
    </Box>
  );
};

export default EnhancedGSTInvoiceItems;