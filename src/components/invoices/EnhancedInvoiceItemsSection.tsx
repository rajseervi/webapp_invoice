import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Collapse,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  LocalOffer as DiscountIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon,
  Calculate as CalculateIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  AutoAwesome as AutoAwesomeIcon,
  Speed as SpeedIcon,
  Percent as PercentIcon,
} from '@mui/icons-material';
import { Product, Category } from '@/types/inventory';
import { Party } from '@/types/party';
import { EnhancedInvoiceItemRow } from './EnhancedInvoiceItemRow';

interface GstInvoiceItem {
  name: string;
  price: number;
  quantity: number;
  discount: number;
  discountType: 'none' | 'percentage' | 'amount';
  finalPrice: number;
  productId: string;
  category: string;
  gstRate: number;
  hsnCode: string;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxableAmount: number;
  totalTaxAmount: number;
  // Enhanced fields
  categoryDiscount?: number;
  partyDiscount?: number;
  bulkDiscount?: number;
  totalDiscount?: number;
  originalPrice?: number;
  profitMargin?: number;
  costPrice?: number;
}

interface CategoryDiscountRule {
  categoryId: string;
  categoryName: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  minQuantity?: number;
  maxDiscount?: number;
  isActive: boolean;
}

interface BulkDiscountRule {
  minQuantity: number;
  maxQuantity?: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
}

interface EnhancedInvoiceItemsSectionProps {
  lineItems: GstInvoiceItem[];
  setLineItems: (items: GstInvoiceItem[]) => void;
  products: Product[];
  categories: Category[];
  selectedParty: Party | null;
  isInterState: boolean;
  gstSettings: any;
  onRecalculate: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`items-tabpanel-${index}`}
      aria-labelledby={`items-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const EnhancedInvoiceItemsSection: React.FC<EnhancedInvoiceItemsSectionProps> = ({
  lineItems,
  setLineItems,
  products,
  categories,
  selectedParty,
  isInterState,
  gstSettings,
  onRecalculate,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [showDiscountDetails, setShowDiscountDetails] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [autoApplyDiscounts, setAutoApplyDiscounts] = useState(true);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

  // Category-wise discount rules
  const categoryDiscountRules = useMemo<CategoryDiscountRule[]>(() => {
    if (!selectedParty?.categoryDiscounts) return [];
    
    return Object.entries(selectedParty.categoryDiscounts).map(([categoryId, discount]) => {
      const category = categories.find(c => c.id === categoryId);
      return {
        categoryId,
        categoryName: category?.name || 'Unknown Category',
        discount: discount as number,
        discountType: 'percentage' as const,
        isActive: true,
      };
    });
  }, [selectedParty, categories]);

  // Bulk discount rules
  const bulkDiscountRules = useMemo<BulkDiscountRule[]>(() => [
    { minQuantity: 10, maxQuantity: 49, discount: 5, discountType: 'percentage' },
    { minQuantity: 50, maxQuantity: 99, discount: 10, discountType: 'percentage' },
    { minQuantity: 100, discount: 15, discountType: 'percentage' },
  ], []);

  // Calculate category discount for an item
  const calculateCategoryDiscount = useCallback((item: GstInvoiceItem): number => {
    if (!autoApplyDiscounts || !item.category) return 0;
    
    const rule = categoryDiscountRules.find(r => r.categoryId === item.category && r.isActive);
    if (!rule) return 0;

    const baseAmount = (item.price || 0) * (item.quantity || 0);
    return rule.discountType === 'percentage' 
      ? (baseAmount * rule.discount) / 100
      : rule.discount;
  }, [categoryDiscountRules, autoApplyDiscounts]);

  // Calculate bulk discount for an item
  const calculateBulkDiscount = useCallback((item: GstInvoiceItem): number => {
    if (!autoApplyDiscounts || !item.quantity) return 0;
    
    const rule = bulkDiscountRules.find(r => 
      item.quantity >= r.minQuantity && 
      (!r.maxQuantity || item.quantity <= r.maxQuantity)
    );
    if (!rule) return 0;

    const baseAmount = (item.price || 0) * (item.quantity || 0);
    return rule.discountType === 'percentage' 
      ? (baseAmount * rule.discount) / 100
      : rule.discount;
  }, [bulkDiscountRules, autoApplyDiscounts]);

  // Calculate party-specific discount
  const calculatePartyDiscount = useCallback((item: GstInvoiceItem): number => {
    if (!autoApplyDiscounts || !selectedParty?.productDiscounts || !item.productId) return 0;
    
    const productDiscount = selectedParty.productDiscounts[item.productId];
    if (!productDiscount) return 0;

    const baseAmount = (item.price || 0) * (item.quantity || 0);
    return (baseAmount * productDiscount) / 100;
  }, [selectedParty, autoApplyDiscounts]);

  // Recalculate line item with enhanced discounts
  const recalculateLineItem = useCallback((items: GstInvoiceItem[], index: number) => {
    const item = items[index];
    const quantity = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    const baseAmount = price * quantity;

    // Calculate various discounts
    const categoryDiscount = calculateCategoryDiscount(item);
    const bulkDiscount = calculateBulkDiscount(item);
    const partyDiscount = calculatePartyDiscount(item);
    const manualDiscount = item.discountType === 'percentage' 
      ? (baseAmount * (item.discount || 0)) / 100
      : (item.discount || 0);

    // Apply discounts (category and bulk discounts are additive, party discount is separate)
    const totalCategoryBulkDiscount = categoryDiscount + bulkDiscount;
    const totalDiscount = Math.max(totalCategoryBulkDiscount, partyDiscount) + manualDiscount;
    
    item.categoryDiscount = categoryDiscount;
    item.bulkDiscount = bulkDiscount;
    item.partyDiscount = partyDiscount;
    item.totalDiscount = totalDiscount;
    item.originalPrice = baseAmount;
    item.taxableAmount = Math.max(0, baseAmount - totalDiscount);
    item.finalPrice = item.taxableAmount;

    // Calculate profit margin if cost price is available
    const product = products.find(p => p.id === item.productId);
    if (product?.costPrice) {
      item.costPrice = product.costPrice;
      item.profitMargin = ((item.finalPrice - (product.costPrice * quantity)) / item.finalPrice) * 100;
    }

    // Calculate GST
    if (gstSettings && selectedParty) {
      const partyStateCode = selectedParty.gstin 
        ? selectedParty.gstin.substring(0, 2) 
        : gstSettings.companyStateCode;
      const isInterStateTransaction = gstSettings.companyStateCode !== partyStateCode;
      
      const gstAmount = (item.taxableAmount * item.gstRate) / 100;
      
      if (isInterStateTransaction) {
        item.igstAmount = gstAmount;
        item.cgstAmount = 0;
        item.sgstAmount = 0;
      } else {
        item.cgstAmount = gstAmount / 2;
        item.sgstAmount = gstAmount / 2;
        item.igstAmount = 0;
      }
      
      item.totalTaxAmount = gstAmount;
    }
  }, [
    calculateCategoryDiscount,
    calculateBulkDiscount,
    calculatePartyDiscount,
    products,
    gstSettings,
    selectedParty
  ]);

  // Update line item
  const updateLineItem = useCallback((index: number, field: keyof GstInvoiceItem, value: any) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    recalculateLineItem(updatedItems, index);
    setLineItems(updatedItems);
    onRecalculate();
  }, [lineItems, setLineItems, recalculateLineItem, onRecalculate]);

  // Select product
  const selectProduct = useCallback((index: number, product: Product | null) => {
    const updatedItems = [...lineItems];
    if (!product) {
      updatedItems[index] = {
        ...updatedItems[index],
        name: '',
        price: 0,
        productId: '',
        gstRate: gstSettings?.defaultGstRate || 18,
        hsnCode: '',
        category: ''
      };
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        name: product.name,
        price: product.price,
        productId: product.id || '',
        gstRate: product.gstRate || gstSettings?.defaultGstRate || 18,
        hsnCode: product.hsnCode || '',
        category: product.categoryId
      };
    }
    recalculateLineItem(updatedItems, index);
    setLineItems(updatedItems);
    onRecalculate();
  }, [lineItems, setLineItems, recalculateLineItem, gstSettings, onRecalculate]);

  // Remove line item
  const removeLineItem = useCallback((index: number) => {
    const updatedItems = lineItems.filter((_, i) => i !== index);
    setLineItems(updatedItems);
    onRecalculate();
  }, [lineItems, setLineItems, onRecalculate]);

  // Add line item
  const addLineItem = useCallback(() => {
    const newItem: GstInvoiceItem = {
      name: '',
      price: 0,
      quantity: 1,
      discount: 0,
      discountType: 'none',
      finalPrice: 0,
      productId: '',
      category: '',
      gstRate: gstSettings?.defaultGstRate || 18,
      hsnCode: '',
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      taxableAmount: 0,
      totalTaxAmount: 0,
      categoryDiscount: 0,
      partyDiscount: 0,
      bulkDiscount: 0,
      totalDiscount: 0,
      originalPrice: 0,
    };
    setLineItems([...lineItems, newItem]);
  }, [lineItems, setLineItems, gstSettings]);

  // Apply bulk discount to all items
  const applyBulkDiscount = useCallback((discountPercent: number) => {
    const updatedItems = lineItems.map(item => ({
      ...item,
      discount: discountPercent,
      discountType: 'percentage' as const
    }));
    
    updatedItems.forEach((_, index) => recalculateLineItem(updatedItems, index));
    setLineItems(updatedItems);
    onRecalculate();
  }, [lineItems, setLineItems, recalculateLineItem, onRecalculate]);

  // Recalculate all items when auto-apply changes
  useEffect(() => {
    if (lineItems.length > 0) {
      const updatedItems = [...lineItems];
      updatedItems.forEach((_, index) => recalculateLineItem(updatedItems, index));
      setLineItems(updatedItems);
      onRecalculate();
    }
  }, [autoApplyDiscounts]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalItems = lineItems.length;
    const totalQuantity = lineItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalOriginalAmount = lineItems.reduce((sum, item) => sum + (item.originalPrice || 0), 0);
    const totalDiscountAmount = lineItems.reduce((sum, item) => sum + (item.totalDiscount || 0), 0);
    const totalCategoryDiscount = lineItems.reduce((sum, item) => sum + (item.categoryDiscount || 0), 0);
    const totalBulkDiscount = lineItems.reduce((sum, item) => sum + (item.bulkDiscount || 0), 0);
    const totalPartyDiscount = lineItems.reduce((sum, item) => sum + (item.partyDiscount || 0), 0);
    const averageDiscountPercent = totalOriginalAmount > 0 ? (totalDiscountAmount / totalOriginalAmount) * 100 : 0;

    return {
      totalItems,
      totalQuantity,
      totalOriginalAmount,
      totalDiscountAmount,
      totalCategoryDiscount,
      totalBulkDiscount,
      totalPartyDiscount,
      averageDiscountPercent,
    };
  }, [lineItems]);

  return (
    <Card>
      <CardContent>
        {/* Header with Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CategoryIcon />
            Invoice Items
            <Badge badgeContent={lineItems.length} color="primary" />
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoApplyDiscounts}
                  onChange={(e) => setAutoApplyDiscounts(e.target.checked)}
                  size="small"
                />
              }
              label="Auto Discounts"
            />
            
            <Tooltip title="Show Discount Details">
              <IconButton
                onClick={() => setShowDiscountDetails(!showDiscountDetails)}
                color={showDiscountDetails ? 'primary' : 'default'}
                size="small"
              >
                {showDiscountDetails ? <VisibilityIcon /> : <VisibilityOffIcon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Bulk Actions">
              <IconButton
                onClick={() => setShowBulkActions(!showBulkActions)}
                color={showBulkActions ? 'primary' : 'default'}
                size="small"
              >
                <SpeedIcon />
              </IconButton>
            </Tooltip>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addLineItem}
              size="small"
            >
              Add Item
            </Button>
          </Box>
        </Box>

        {/* Discount Rules Summary */}
        <Collapse in={showDiscountDetails}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Active Discount Rules for {selectedParty?.name || 'Selected Party'}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" fontWeight="medium">Category Discounts:</Typography>
                {categoryDiscountRules.length > 0 ? (
                  categoryDiscountRules.map(rule => (
                    <Chip
                      key={rule.categoryId}
                      label={`${rule.categoryName}: ${rule.discount}%`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))
                ) : (
                  <Typography variant="caption" color="text.secondary">None configured</Typography>
                )}
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" fontWeight="medium">Bulk Discounts:</Typography>
                {bulkDiscountRules.map((rule, index) => (
                  <Chip
                    key={index}
                    label={`${rule.minQuantity}+ qty: ${rule.discount}%`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" fontWeight="medium">Summary:</Typography>
                <Typography variant="caption" display="block">
                  Total Discount: ₹{summaryStats.totalDiscountAmount.toFixed(2)} ({summaryStats.averageDiscountPercent.toFixed(1)}%)
                </Typography>
                <Typography variant="caption" display="block">
                  Category: ₹{summaryStats.totalCategoryDiscount.toFixed(2)} | 
                  Bulk: ₹{summaryStats.totalBulkDiscount.toFixed(2)} | 
                  Party: ₹{summaryStats.totalPartyDiscount.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </Alert>
        </Collapse>

        {/* Bulk Actions */}
        <Collapse in={showBulkActions}>
          <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" gutterBottom>
              Bulk Actions
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => applyBulkDiscount(5)}
                  startIcon={<PercentIcon />}
                  fullWidth
                >
                  Apply 5% Discount
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => applyBulkDiscount(10)}
                  startIcon={<PercentIcon />}
                  fullWidth
                >
                  Apply 10% Discount
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => applyBulkDiscount(0)}
                  startIcon={<AutoAwesomeIcon />}
                  fullWidth
                >
                  Clear All Discounts
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={onRecalculate}
                  startIcon={<CalculateIcon />}
                  fullWidth
                >
                  Recalculate All
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Collapse>

        {/* Items Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>Product</TableCell>
                <TableCell>HSN</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Rate</TableCell>
                <TableCell>Disc %</TableCell>
                {showDiscountDetails && (
                  <>
                    <TableCell>Cat Disc</TableCell>
                    <TableCell>Bulk Disc</TableCell>
                    <TableCell>Party Disc</TableCell>
                  </>
                )}
                <TableCell>GST %</TableCell>
                <TableCell>Taxable</TableCell>
                {isInterState ? (
                  <TableCell>IGST</TableCell>
                ) : (
                  <>
                    <TableCell>CGST</TableCell>
                    <TableCell>SGST</TableCell>
                  </>
                )}
                <TableCell>Total</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lineItems.map((item, index) => (
                <EnhancedInvoiceItemRow
                  key={index}
                  item={item}
                  index={index}
                  products={products}
                  categories={categories}
                  isInterState={isInterState}
                  showDiscountDetails={showDiscountDetails}
                  updateLineItem={updateLineItem}
                  selectProduct={selectProduct}
                  removeLineItem={removeLineItem}
                  categoryDiscountRules={categoryDiscountRules}
                  bulkDiscountRules={bulkDiscountRules}
                />
              ))}
              
              {lineItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No items added yet. Click "Add Item" to start building your invoice.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Summary Statistics */}
        {lineItems.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {summaryStats.totalItems}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Items
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {summaryStats.totalQuantity}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Qty
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="h6" color="success.main">
                    ₹{summaryStats.totalDiscountAmount.toFixed(0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Savings
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="h6" color="warning.main">
                    {summaryStats.averageDiscountPercent.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Avg Discount
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedInvoiceItemsSection;