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
  IconButton,
  Tooltip,
  Badge,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Category as CategoryIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Calculate as CalculateIcon,
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

interface SimplifiedInvoiceItemsSectionProps {
  lineItems: GstInvoiceItem[];
  setLineItems: (items: GstInvoiceItem[]) => void;
  products: Product[];
  categories: Category[];
  selectedParty: Party | null;
  isInterState: boolean;
  gstSettings: any;
  onRecalculate: () => void;
  isGstOnly?: boolean;
  categoryDiscountRules?: CategoryDiscountRule[];
}

export const SimplifiedInvoiceItemsSection: React.FC<SimplifiedInvoiceItemsSectionProps> = ({
  lineItems,
  setLineItems,
  products,
  categories,
  selectedParty,
  isInterState,
  gstSettings,
  onRecalculate,
  isGstOnly = false,
  categoryDiscountRules = [],
}) => {
  const [showDiscountDetails, setShowDiscountDetails] = useState(false);
  const [autoApplyDiscounts, setAutoApplyDiscounts] = useState(true);

  // Calculate category discount for an item
  const calculateCategoryDiscount = useCallback((item: GstInvoiceItem): number => {
    if (!autoApplyDiscounts || !item.category) return 0;
    
    const rule = categoryDiscountRules.find(r => r.categoryId === item.category && r.isActive);
    if (!rule) return 0;

    const baseAmount = (item.price || 0) * (item.quantity || 0);
    
    // Check minimum quantity requirement
    if (rule.minQuantity && item.quantity < rule.minQuantity) return 0;
    
    let discount = rule.discountType === 'percentage' 
      ? (baseAmount * rule.discount) / 100
      : rule.discount;
    
    // Apply maximum discount limit
    if (rule.maxDiscount && discount > rule.maxDiscount) {
      discount = rule.maxDiscount;
    }
    
    return discount;
  }, [categoryDiscountRules, autoApplyDiscounts]);

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
    const partyDiscount = calculatePartyDiscount(item);
    const manualDiscount = item.discountType === 'percentage' 
      ? (baseAmount * (item.discount || 0)) / 100
      : (item.discount || 0);

    // Apply discounts (category discount vs party discount - highest wins, plus manual)
    const autoDiscount = Math.max(categoryDiscount, partyDiscount);
    const totalDiscount = autoDiscount + manualDiscount;
    
    item.categoryDiscount = categoryDiscount;
    item.partyDiscount = partyDiscount;
    item.bulkDiscount = 0; // No bulk discounts in simplified version
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
        hsnCode: product.hsnCode || product.sacCode || '',
        category: product.categoryId || ''
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

  // Recalculate all items when discount rules or auto-apply changes
  useEffect(() => {
    if (lineItems.length > 0) {
      const updatedItems = [...lineItems];
      let hasChanges = false;
      
      updatedItems.forEach((item, index) => {
        const oldCategoryDiscount = item.categoryDiscount || 0;
        const oldTotalDiscount = item.totalDiscount || 0;
        
        recalculateLineItem(updatedItems, index);
        
        // Check if there were actual changes
        if (item.categoryDiscount !== oldCategoryDiscount || item.totalDiscount !== oldTotalDiscount) {
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        setLineItems(updatedItems);
        onRecalculate();
      }
    }
  }, [autoApplyDiscounts, categoryDiscountRules, recalculateLineItem, setLineItems, onRecalculate]);

  // Force recalculation when category discount rules change
  useEffect(() => {
    if (lineItems.length > 0 && categoryDiscountRules.length > 0) {
      const updatedItems = [...lineItems];
      updatedItems.forEach((_, index) => {
        recalculateLineItem(updatedItems, index);
      });
      setLineItems(updatedItems);
      onRecalculate();
    }
  }, [categoryDiscountRules]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalItems = lineItems.length;
    const totalQuantity = lineItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalOriginalAmount = lineItems.reduce((sum, item) => sum + (item.originalPrice || 0), 0);
    const totalDiscountAmount = lineItems.reduce((sum, item) => sum + (item.totalDiscount || 0), 0);
    const totalCategoryDiscount = lineItems.reduce((sum, item) => sum + (item.categoryDiscount || 0), 0);
    const totalPartyDiscount = lineItems.reduce((sum, item) => sum + (item.partyDiscount || 0), 0);
    const averageDiscountPercent = totalOriginalAmount > 0 ? (totalDiscountAmount / totalOriginalAmount) * 100 : 0;

    return {
      totalItems,
      totalQuantity,
      totalOriginalAmount,
      totalDiscountAmount,
      totalCategoryDiscount,
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
              <Grid item xs={12} md={6}>
                <Typography variant="body2" fontWeight="medium">Category Discounts:</Typography>
                {categoryDiscountRules.length > 0 ? (
                  categoryDiscountRules.filter(rule => rule.isActive).map(rule => (
                    <Chip
                      key={rule.categoryId}
                      label={`${rule.categoryName}: ${rule.discount}${rule.discountType === 'percentage' ? '%' : '₹'}`}
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
              <Grid item xs={12} md={6}>
                <Typography variant="body2" fontWeight="medium">Summary:</Typography>
                <Typography variant="caption" display="block">
                  Total Discount: ₹{summaryStats.totalDiscountAmount.toFixed(2)} ({summaryStats.averageDiscountPercent.toFixed(1)}%)
                </Typography>
                <Typography variant="caption" display="block">
                  Category: ₹{summaryStats.totalCategoryDiscount.toFixed(2)} | 
                  Party: ₹{summaryStats.totalPartyDiscount.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </Alert>
        </Collapse>

        {/* Items Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>Product</TableCell>
                <TableCell>HSN/SAC</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Rate</TableCell>
                <TableCell>Disc %</TableCell>
                {showDiscountDetails && (
                  <>
                    <TableCell>Cat Disc</TableCell>
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
                  bulkDiscountRules={[]} // No bulk discount rules
                  isGstOnly={isGstOnly}
                />
              ))}
              
              {lineItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={showDiscountDetails ? 13 : 11} sx={{ textAlign: 'center', py: 4 }}>
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

export default SimplifiedInvoiceItemsSection;