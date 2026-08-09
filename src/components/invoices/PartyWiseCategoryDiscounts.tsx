"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
  Divider,
  InputAdornment,
  Chip,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  CardActions,
  Grid,
  Avatar,
  Badge,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Stack,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  Category as CategoryIcon,
  Percent as PercentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  Psychology as SmartIcon,
  AutoAwesome as AutoIcon,
  Tune as TuneIcon
} from '@mui/icons-material';
import { format, parseISO, isValid, differenceInDays } from 'date-fns';
import { collection, getDocs, query, where, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';

// Types
interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  isActive: boolean;
  productCount?: number;
  averagePrice?: number;
  totalSales?: number;
  lastSaleDate?: string;
  margin?: number;
  tags?: string[];
  priority?: number;
  seasonality?: 'high' | 'medium' | 'low';
  demandTrend?: 'increasing' | 'stable' | 'decreasing';
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
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  discountHistory?: DiscountHistoryEntry[];
}

interface DiscountHistoryEntry {
  id: string;
  categoryId: string;
  categoryName: string;
  oldDiscount: number;
  newDiscount: number;
  changedBy: string;
  changedAt: Date;
  reason?: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

interface CategoryDiscount {
  categoryId: string;
  categoryName: string;
  discount: number;
  isActive: boolean;
  lastUpdated?: Date;
  updatedBy?: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  usageCount?: number;
  totalSavings?: number;
  notes?: string;
  priority?: number;
  autoApply?: boolean;
  conditions?: DiscountCondition[];
}

interface DiscountCondition {
  type: 'quantity' | 'amount' | 'frequency' | 'season' | 'loyalty';
  operator: 'gte' | 'lte' | 'eq' | 'between';
  value: number | string;
  secondValue?: number;
  description: string;
}

interface DiscountTemplate {
  id: string;
  name: string;
  description: string;
  categoryDiscounts: Record<string, number>;
  isDefault?: boolean;
  applicablePartyTypes?: string[];
  createdBy: string;
  createdAt: Date;
  usageCount: number;
}

interface PartyWiseCategoryDiscountsProps {
  open: boolean;
  onClose: () => void;
  party: Party;
  categories: Category[];
  onSave: (updatedDiscounts: Record<string, number>) => void;
  onHistoryView?: (partyId: string) => void;
  showAdvancedFeatures?: boolean;
  allowBulkOperations?: boolean;
  enableTemplates?: boolean;
  enableAnalytics?: boolean;
  readOnly?: boolean;
}

const PartyWiseCategoryDiscounts: React.FC<PartyWiseCategoryDiscountsProps> = ({
  open,
  onClose,
  party,
  categories,
  onSave,
  onHistoryView,
  showAdvancedFeatures = true,
  allowBulkOperations = true,
  enableTemplates = true,
  enableAnalytics = true,
  readOnly = false
}) => {
  const theme = useTheme();
  
  // State management
  const [discounts, setDiscounts] = useState<CategoryDiscount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState(0);
  const [showOnlyActive, setShowOnlyActive] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'name' | 'discount' | 'usage' | 'savings'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkDiscount, setBulkDiscount] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [discountRange, setDiscountRange] = useState<[number, number]>([0, 100]);
  const [templates, setTemplates] = useState<DiscountTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  // Initialize discounts from party data
  useEffect(() => {
    if (open && party && categories.length > 0) {
      const discountsList = categories.map(category => {
        const discount = party.categoryDiscounts[category.name] || 0;
        
        return {
          categoryId: category.id,
          categoryName: category.name,
          discount: discount,
          isActive: discount > 0,
          lastUpdated: new Date(),
          usageCount: 0,
          totalSavings: 0,
          priority: category.priority || 0,
          autoApply: true
        };
      });
      
      setDiscounts(discountsList);
      setError(null);
    }
  }, [open, party, categories]);

  // Load templates and analytics
  useEffect(() => {
    if (open && enableTemplates) {
      loadDiscountTemplates();
    }
    if (open && enableAnalytics) {
      loadAnalytics();
    }
  }, [open, enableTemplates, enableAnalytics]);

  // Memoized calculations
  const filteredDiscounts = useMemo(() => {
    let filtered = discounts.filter(item => {
      // Search filter
      const matchesSearch = !searchQuery || 
        item.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Active filter
      const matchesActive = !showOnlyActive || item.discount > 0;
      
      // Category filter
      const matchesCategory = categoryFilter === 'all' || item.categoryId === categoryFilter;
      
      // Discount range filter
      const matchesRange = item.discount >= discountRange[0] && item.discount <= discountRange[1];
      
      return matchesSearch && matchesActive && matchesCategory && matchesRange;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.categoryName.toLowerCase();
          bValue = b.categoryName.toLowerCase();
          break;
        case 'discount':
          aValue = a.discount;
          bValue = b.discount;
          break;
        case 'usage':
          aValue = a.usageCount || 0;
          bValue = b.usageCount || 0;
          break;
        case 'savings':
          aValue = a.totalSavings || 0;
          bValue = b.totalSavings || 0;
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
  }, [discounts, searchQuery, showOnlyActive, categoryFilter, discountRange, sortBy, sortOrder]);

  const discountSummary = useMemo(() => {
    const activeDiscounts = discounts.filter(d => d.discount > 0);
    const totalCategories = discounts.length;
    const activeCount = activeDiscounts.length;
    const averageDiscount = activeCount > 0 
      ? activeDiscounts.reduce((sum, d) => sum + d.discount, 0) / activeCount 
      : 0;
    const maxDiscount = Math.max(...discounts.map(d => d.discount), 0);
    const totalSavings = discounts.reduce((sum, d) => sum + (d.totalSavings || 0), 0);
    
    return {
      totalCategories,
      activeCount,
      inactiveCount: totalCategories - activeCount,
      averageDiscount,
      maxDiscount,
      totalSavings,
      coveragePercentage: totalCategories > 0 ? (activeCount / totalCategories) * 100 : 0
    };
  }, [discounts]);

  // Helper functions
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }, []);

  const getCategoryInfo = useCallback((categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || {
      id: categoryId,
      name: 'Unknown Category',
      color: theme.palette.grey[500],
      isActive: false
    };
  }, [categories, theme]);

  const loadDiscountTemplates = async () => {
    try {
      const templatesQuery = query(collection(db, 'discountTemplates'));
      const snapshot = await getDocs(templatesQuery);
      const templatesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DiscountTemplate[];
      setTemplates(templatesList);
    } catch (err) {
      console.error('Error loading discount templates:', err);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Load analytics data for the party
      const analyticsData = {
        totalOrders: party.totalOrders || 0,
        averageOrderValue: 0,
        totalSavings: discountSummary.totalSavings,
        discountUtilization: discountSummary.coveragePercentage,
        topCategories: discounts
          .filter(d => d.discount > 0)
          .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
          .slice(0, 5),
        trends: {
          lastMonth: 0,
          thisMonth: 0,
          growth: 0
        }
      };
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  };

  // Event handlers
  const handleStartEditing = (categoryId: string, currentDiscount: number) => {
    if (readOnly) return;
    setEditingCategoryId(categoryId);
    setEditValue(currentDiscount);
  };

  const handleCancelEditing = () => {
    setEditingCategoryId(null);
    setEditValue(0);
  };

  const handleSaveDiscount = (categoryId: string) => {
    if (readOnly) return;
    
    const validDiscount = Math.min(100, Math.max(0, editValue));
    
    setDiscounts(prevDiscounts => 
      prevDiscounts.map(item => 
        item.categoryId === categoryId 
          ? { 
              ...item, 
              discount: validDiscount,
              isActive: validDiscount > 0,
              lastUpdated: new Date()
            } 
          : item
      )
    );
    
    setEditingCategoryId(null);
    
    setNotification({
      message: `Discount updated for ${getCategoryInfo(categoryId).name}`,
      type: 'success'
    });
  };

  const handleBulkUpdate = () => {
    if (readOnly || selectedCategories.size === 0) return;
    
    setDiscounts(prevDiscounts =>
      prevDiscounts.map(item =>
        selectedCategories.has(item.categoryId)
          ? {
              ...item,
              discount: bulkDiscount,
              isActive: bulkDiscount > 0,
              lastUpdated: new Date()
            }
          : item
      )
    );
    
    setBulkEditMode(false);
    setSelectedCategories(new Set());
    setBulkDiscount(0);
    
    setNotification({
      message: `Updated ${selectedCategories.size} categories`,
      type: 'success'
    });
  };

  const handleApplyTemplate = (templateId: string) => {
    if (readOnly) return;
    
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    setDiscounts(prevDiscounts =>
      prevDiscounts.map(item => {
        const templateDiscount = template.categoryDiscounts[item.categoryName] || 0;
        return {
          ...item,
          discount: templateDiscount,
          isActive: templateDiscount > 0,
          lastUpdated: new Date()
        };
      })
    );
    
    setNotification({
      message: `Applied template: ${template.name}`,
      type: 'success'
    });
  };

  const handleSaveAsTemplate = async () => {
    if (!newTemplateName.trim()) return;
    
    try {
      const templateData = {
        name: newTemplateName,
        description: `Template created from ${party.name}'s discounts`,
        categoryDiscounts: discounts.reduce((acc, item) => {
          if (item.discount > 0) {
            acc[item.categoryName] = item.discount;
          }
          return acc;
        }, {} as Record<string, number>),
        createdBy: 'current-user', // Replace with actual user ID
        createdAt: serverTimestamp(),
        usageCount: 0
      };
      
      await addDoc(collection(db, 'discountTemplates'), templateData);
      await loadDiscountTemplates();
      
      setShowTemplateDialog(false);
      setNewTemplateName('');
      
      setNotification({
        message: 'Template saved successfully',
        type: 'success'
      });
    } catch (err) {
      console.error('Error saving template:', err);
      setNotification({
        message: 'Failed to save template',
        type: 'error'
      });
    }
  };

  const handleSaveAllDiscounts = () => {
    if (readOnly) return;
    
    const updatedDiscounts: Record<string, number> = {};
    
    discounts.forEach(item => {
      if (item.discount > 0) {
        updatedDiscounts[item.categoryName] = item.discount;
      }
    });
    
    onSave(updatedDiscounts);
    onClose();
    
    setNotification({
      message: 'Category discounts saved successfully',
      type: 'success'
    });
  };

  const handleSelectAll = () => {
    if (selectedCategories.size === filteredDiscounts.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(filteredDiscounts.map(d => d.categoryId)));
    }
  };

  const handleResetToDefaults = () => {
    if (readOnly) return;
    
    setDiscounts(prevDiscounts =>
      prevDiscounts.map(item => ({
        ...item,
        discount: 0,
        isActive: false,
        lastUpdated: new Date()
      }))
    );
    
    setNotification({
      message: 'All discounts reset to default',
      type: 'info'
    });
  };

  // Render components
  const renderSearchAndFilters = () => (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search categories..."
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
        
        <FormControlLabel
          control={
            <Switch 
              size="small" 
              checked={showOnlyActive}
              onChange={(e) => setShowOnlyActive(e.target.checked)}
            />
          }
          label="Active Only"
        />
      </Box>
      
      {showFilters && (
        <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  label="Sort By"
                >
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="discount">Discount</MenuItem>
                  <MenuItem value="usage">Usage</MenuItem>
                  <MenuItem value="savings">Savings</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
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
            </Grid>
            
            <Grid item xs={12} sm={12} md={6}>
              <Typography variant="caption" gutterBottom>
                Discount Range: {discountRange[0]}% - {discountRange[1]}%
              </Typography>
              <Slider
                value={discountRange}
                onChange={(_, newValue) => setDiscountRange(newValue as [number, number])}
                valueLabelDisplay="auto"
                min={0}
                max={100}
                step={1}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 25, label: '25%' },
                  { value: 50, label: '50%' },
                  { value: 75, label: '75%' },
                  { value: 100, label: '100%' }
                ]}
              />
            </Grid>
          </Grid>
        </Card>
      )}
    </Box>
  );

  const renderSummaryCards = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {discountSummary.activeCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Discounts
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={discountSummary.coveragePercentage} 
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {discountSummary.averageDiscount.toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Average Discount
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              {discountSummary.maxDiscount}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Maximum Discount
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">
              {formatCurrency(discountSummary.totalSavings)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Savings
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderDiscountsTable = () => (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            {allowBulkOperations && !readOnly && (
              <TableCell padding="checkbox">
                <input
                  type="checkbox"
                  checked={selectedCategories.size === filteredDiscounts.length && filteredDiscounts.length > 0}
                  onChange={handleSelectAll}
                />
              </TableCell>
            )}
            <TableCell>Category</TableCell>
            <TableCell align="center">Current Discount</TableCell>
            <TableCell align="center">Usage Count</TableCell>
            <TableCell align="center">Total Savings</TableCell>
            <TableCell align="center">Status</TableCell>
            {!readOnly && <TableCell align="center">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredDiscounts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={allowBulkOperations && !readOnly ? 7 : 6} align="center" sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <CategoryIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                  <Typography variant="body1" color="text.secondary">
                    No categories found
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    {searchQuery ? `No categories match "${searchQuery}"` : 'No categories available'}
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            filteredDiscounts.map((item) => {
              const categoryInfo = getCategoryInfo(item.categoryId);
              const isEditing = editingCategoryId === item.categoryId;
              
              return (
                <TableRow 
                  key={item.categoryId}
                  hover
                  sx={{ 
                    bgcolor: selectedCategories.has(item.categoryId) 
                      ? alpha(theme.palette.primary.main, 0.08) 
                      : 'inherit'
                  }}
                >
                  {allowBulkOperations && !readOnly && (
                    <TableCell padding="checkbox">
                      <input
                        type="checkbox"
                        checked={selectedCategories.has(item.categoryId)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedCategories);
                          if (e.target.checked) {
                            newSelected.add(item.categoryId);
                          } else {
                            newSelected.delete(item.categoryId);
                          }
                          setSelectedCategories(newSelected);
                        }}
                      />
                    </TableCell>
                  )}
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar 
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          bgcolor: categoryInfo.color || theme.palette.primary.main,
                          fontSize: '0.875rem'
                        }}
                      >
                        {categoryInfo.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {item.categoryName}
                        </Typography>
                        {categoryInfo.description && (
                          <Typography variant="caption" color="text.secondary">
                            {categoryInfo.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell align="center">
                    {isEditing ? (
                      <TextField
                        size="small"
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(Number(e.target.value) || 0)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveDiscount(item.categoryId);
                          } else if (e.key === 'Escape') {
                            handleCancelEditing();
                          }
                        }}
                        inputProps={{ min: 0, max: 100, step: 0.1 }}
                        sx={{ width: 80 }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">%</InputAdornment>
                        }}
                        autoFocus
                      />
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2" 
                          color={item.discount > 0 ? 'primary.main' : 'text.secondary'}
                          fontWeight={item.discount > 0 ? 'bold' : 'normal'}
                        >
                          {item.discount}%
                        </Typography>
                        {item.discount > 0 && (
                          <Chip 
                            label="Active" 
                            size="small" 
                            color="success" 
                            sx={{ fontSize: '0.65rem', height: 18 }}
                          />
                        )}
                      </Box>
                    )}
                  </TableCell>
                  
                  <TableCell align="center">
                    <Typography variant="body2">
                      {item.usageCount || 0}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Typography variant="body2" color="success.main">
                      {formatCurrency(item.totalSavings || 0)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    {item.isActive ? (
                      <Chip 
                        label="Active" 
                        size="small" 
                        color="success"
                        icon={<CheckCircleIcon />}
                      />
                    ) : (
                      <Chip 
                        label="Inactive" 
                        size="small" 
                        color="default"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  
                  {!readOnly && (
                    <TableCell align="center">
                      {isEditing ? (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Save">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleSaveDiscount(item.categoryId)}
                            >
                              <SaveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={handleCancelEditing}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Tooltip title="Edit Discount">
                          <IconButton 
                            size="small" 
                            onClick={() => handleStartEditing(item.categoryId, item.discount)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderBulkActions = () => {
    if (!allowBulkOperations || readOnly || selectedCategories.size === 0) return null;
    
    return (
      <Card sx={{ mb: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="subtitle2">
              {selectedCategories.size} categories selected
            </Typography>
            
            <TextField
              size="small"
              type="number"
              label="Bulk Discount %"
              value={bulkDiscount}
              onChange={(e) => setBulkDiscount(Number(e.target.value) || 0)}
              inputProps={{ min: 0, max: 100, step: 0.1 }}
              sx={{ width: 150 }}
            />
            
            <Button
              size="small"
              variant="contained"
              onClick={handleBulkUpdate}
              startIcon={<EditIcon />}
            >
              Apply to Selected
            </Button>
            
            <Button
              size="small"
              variant="outlined"
              onClick={() => setSelectedCategories(new Set())}
            >
              Clear Selection
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderTemplatesTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Discount Templates</Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setShowTemplateDialog(true)}
          disabled={readOnly}
        >
          Save as Template
        </Button>
      </Box>
      
      <Grid container spacing={2}>
        {templates.map(template => (
          <Grid item xs={12} sm={6} md={4} key={template.id}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  {template.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {template.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {Object.keys(template.categoryDiscounts).length} categories
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Used {template.usageCount} times
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  onClick={() => handleApplyTemplate(template.id)}
                  disabled={readOnly}
                >
                  Apply
                </Button>
                <Button size="small" color="error">
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderAnalyticsTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Discount Analytics
      </Typography>
      
      {analytics && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Usage Statistics
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">
                    <strong>Total Orders:</strong> {analytics.totalOrders}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total Savings:</strong> {formatCurrency(analytics.totalSavings)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Discount Utilization:</strong> {analytics.discountUtilization.toFixed(1)}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Top Categories
                </Typography>
                <List dense>
                  {analytics.topCategories.map((category: any, index: number) => (
                    <ListItem key={category.categoryId}>
                      <ListItemIcon>
                        <Badge badgeContent={index + 1} color="primary">
                          <CategoryIcon />
                        </Badge>
                      </ListItemIcon>
                      <ListItemText
                        primary={category.categoryName}
                        secondary={`${category.discount}% discount, ${category.usageCount || 0} uses`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PercentIcon color="primary" />
            <Typography variant="h6">
              Category Discounts - {party.name}
            </Typography>
            {party.loyaltyTier && (
              <Chip 
                label={party.loyaltyTier.toUpperCase()} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onHistoryView && (
              <Tooltip title="View History">
                <IconButton onClick={() => onHistoryView(party.id)}>
                  <HistoryIcon />
                </IconButton>
              </Tooltip>
            )}
            {enableAnalytics && (
              <Tooltip title="Analytics">
                <IconButton onClick={() => setShowAnalyticsDialog(true)}>
                  <AssessmentIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {showAdvancedFeatures && (
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
              <Tab label="Discounts" />
              {enableTemplates && <Tab label="Templates" />}
              {enableAnalytics && <Tab label="Analytics" />}
            </Tabs>
          )}
          
          {activeTab === 0 && (
            <>
              {renderSummaryCards()}
              {renderSearchAndFilters()}
              {renderBulkActions()}
              {renderDiscountsTable()}
            </>
          )}
          
          {activeTab === 1 && enableTemplates && renderTemplatesTab()}
          {activeTab === 2 && enableAnalytics && renderAnalyticsTab()}
        </Box>
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Reset all discounts to 0%">
              <Button 
                startIcon={<RefreshIcon />} 
                onClick={handleResetToDefaults}
                disabled={readOnly}
              >
                Reset All
              </Button>
            </Tooltip>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={onClose} color="inherit">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAllDiscounts} 
              variant="contained"
              disabled={loading || readOnly}
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              Save Discounts
            </Button>
          </Box>
        </Box>
      </DialogActions>
      
      {/* Template Save Dialog */}
      <Dialog open={showTemplateDialog} onClose={() => setShowTemplateDialog(false)}>
        <DialogTitle>Save as Template</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Template Name"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTemplateDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveAsTemplate} variant="contained">
            Save Template
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default PartyWiseCategoryDiscounts;