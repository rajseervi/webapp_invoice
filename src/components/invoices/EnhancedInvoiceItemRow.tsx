import React, { useState, useEffect } from 'react';
import {
  TableRow,
  TableCell,
  TextField,
  Autocomplete,
  IconButton,
  MenuItem,
  Box,
  Typography,
  Chip,
  Avatar,
  Paper,
  Grid,
  Divider,
  Tooltip,
  Badge,
  Alert,
  Collapse,
  Button,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  Inventory as InventoryIcon,
  LocalOffer as PriceIcon,
  Category as CategoryIcon,
  QrCode as QrCodeIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Percent as PercentIcon,
} from '@mui/icons-material';
import { Product } from '@/types/inventory';
import { GST_RATES } from '@/services/gstService';

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

interface EnhancedInvoiceItemRowProps {
  item: GstInvoiceItem;
  index: number;
  products: Product[];
  categories?: Array<{ id: string; name: string; color?: string }>;
  isInterState: boolean;
  showDiscountDetails?: boolean;
  updateLineItem: (index: number, field: keyof GstInvoiceItem, value: any) => void;
  selectProduct: (index: number, product: Product | null) => void;
  removeLineItem: (index: number) => void;
  categoryDiscountRules?: CategoryDiscountRule[];
  bulkDiscountRules?: BulkDiscountRule[];
  isGstOnly?: boolean; // New prop to indicate GST-only filtering
}

export const EnhancedInvoiceItemRow: React.FC<EnhancedInvoiceItemRowProps> = ({
  item,
  index,
  products,
  categories = [],
  isInterState,
  showDiscountDetails = false,
  updateLineItem,
  selectProduct,
  removeLineItem,
  categoryDiscountRules = [],
  bulkDiscountRules = [],
  isGstOnly = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);

  const selectedProduct = products.find(p => p.id === item.productId);

  useEffect(() => {
    let filtered = products;
    
    // First filter by active status and GST eligibility
    filtered = products.filter(product => {
      // Must be active
      if (product.isActive === false) return false;
      
      // For GST-only invoices, apply additional filtering
      if (isGstOnly) {
        // Exclude GST exempt products unless they have HSN/SAC codes
        if (product.gstExempt && !product.hsnCode && !product.sacCode) {
          return false;
        }
        
        // For services, require SAC code
        if (product.isService && !product.sacCode) {
          return false;
        }
        
        // For goods, require HSN code
        if (!product.isService && !product.hsnCode) {
          return false;
        }
      }
      
      return true;
    });
    
    // Then apply search filter if search value exists
    if (searchValue) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchValue.toLowerCase()) ||
        product.hsnCode?.toLowerCase().includes(searchValue.toLowerCase()) ||
        product.sacCode?.toLowerCase().includes(searchValue.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchValue.toLowerCase())
      );
    }
    
    setFilteredProducts(filtered);
  }, [searchValue, products, isGstOnly]);

  const getStockStatus = (product: Product) => {
    if (!product.quantity) return { status: 'out', color: 'error', text: 'Out of Stock' };
    if (product.quantity <= (product.minStockLevel || 5)) return { status: 'low', color: 'warning', text: 'Low Stock' };
    return { status: 'good', color: 'success', text: 'In Stock' };
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || { name: 'Uncategorized', color: '#gray' };
  };

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

  const getProductIcon = (product: Product) => {
    if (product.images && product.images.length > 0) {
      return <Avatar src={product.images[0]} sx={{ width: 32, height: 32 }} />;
    }
    return (
      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
        {product.name.charAt(0).toUpperCase()}
      </Avatar>
    );
  };

  const getApplicableDiscounts = () => {
    const discounts = [];
    
    // Category discount
    const categoryRule = categoryDiscountRules.find(r => r.categoryId === item.category && r.isActive);
    if (categoryRule) {
      discounts.push({
        type: 'Category',
        amount: item.categoryDiscount || 0,
        percentage: categoryRule.discount,
        color: 'success'
      });
    }

    // Bulk discount
    const bulkRule = bulkDiscountRules.find(r => 
      item.quantity >= r.minQuantity && 
      (!r.maxQuantity || item.quantity <= r.maxQuantity)
    );
    if (bulkRule) {
      discounts.push({
        type: 'Bulk',
        amount: item.bulkDiscount || 0,
        percentage: bulkRule.discount,
        color: 'warning'
      });
    }

    // Party discount
    if (item.partyDiscount && item.partyDiscount > 0) {
      discounts.push({
        type: 'Party',
        amount: item.partyDiscount,
        percentage: 0, // Calculate from amount if needed
        color: 'info'
      });
    }

    return discounts;
  };

  const renderProductOption = (props: any, product: Product) => {
    const stockStatus = getStockStatus(product);
    const categoryInfo = getCategoryInfo(product.categoryId || '');

    // Extract key from props to avoid React warning
    const { key, ...otherProps } = props;

    return (
      <Box component="li" key={key} {...otherProps} sx={{ p: 1 }}>
        <Grid container spacing={1} alignItems="center">
          <Grid item>
            {getProductIcon(product)}
          </Grid>
          <Grid item xs>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {product.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                {product.sku && (
                  <Chip 
                    label={`SKU: ${product.sku}`} 
                    size="small" 
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                )}
                {(product.hsnCode || product.sacCode) && (
                  <Chip 
                    label={`${product.isService ? 'SAC' : 'HSN'}: ${product.isService ? product.sacCode : product.hsnCode}`} 
                    size="small" 
                    variant="outlined"
                    color="primary"
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                )}
                <Chip 
                  label={categoryInfo.name} 
                  size="small" 
                  sx={{ 
                    fontSize: '0.7rem', 
                    height: 20,
                    bgcolor: categoryInfo.color + '20',
                    color: categoryInfo.color
                  }}
                />
                {product.gstExempt && (
                  <Chip 
                    label="GST Exempt" 
                    size="small" 
                    color="warning"
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                )}
                {product.isService && (
                  <Chip 
                    label="Service" 
                    size="small" 
                    color="secondary"
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                )}
              </Box>
              {product.description && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {product.description.length > 60 
                    ? `${product.description.substring(0, 60)}...` 
                    : product.description
                  }
                </Typography>
              )}
            </Box>
          </Grid>
          <Grid item>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" fontWeight="bold" color="primary.main">
                {formatCurrency(product.price)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Badge 
                  badgeContent={product.quantity || 0} 
                  color={stockStatus.color as any}
                  sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }}
                >
                  <InventoryIcon fontSize="small" color={stockStatus.color as any} />
                </Badge>
                <Typography variant="caption" color={`${stockStatus.color}.main`}>
                  {stockStatus.text}
                </Typography>
              </Box>
              {product.gstRate !== undefined && !product.gstExempt && (
                <Typography variant="caption" color="text.secondary">
                  GST: {product.gstRate}%
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderSelectedProduct = () => {
    if (!selectedProduct) return null;

    const stockStatus = getStockStatus(selectedProduct);
    const categoryInfo = getCategoryInfo(selectedProduct.categoryId || '');
    const applicableDiscounts = getApplicableDiscounts();

    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {getProductIcon(selectedProduct)}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight="medium">
              {selectedProduct.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
              {selectedProduct.sku && (
                <Chip 
                  label={selectedProduct.sku} 
                  size="small" 
                  variant="outlined"
                  sx={{ fontSize: '0.65rem', height: 18 }}
                />
              )}
              <Chip 
                label={categoryInfo.name} 
                size="small" 
                sx={{ 
                  fontSize: '0.65rem', 
                  height: 18,
                  bgcolor: categoryInfo.color + '20',
                  color: categoryInfo.color
                }}
              />
              <Chip 
                label={stockStatus.text} 
                size="small" 
                color={stockStatus.color as any}
                sx={{ fontSize: '0.65rem', height: 18 }}
              />
              {selectedProduct.gstExempt && (
                <Chip 
                  label="GST Exempt" 
                  size="small" 
                  color="warning"
                  sx={{ fontSize: '0.65rem', height: 18 }}
                />
              )}
              {selectedProduct.isService && (
                <Chip 
                  label="Service" 
                  size="small" 
                  color="secondary"
                  sx={{ fontSize: '0.65rem', height: 18 }}
                />
              )}
            </Box>
          </Box>
          <Tooltip title="Show/Hide Details">
            <IconButton 
              size="small" 
              onClick={() => setShowDetails(!showDetails)}
              sx={{ ml: 1 }}
            >
              {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Discount Summary */}
        {applicableDiscounts.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Applied Discounts:
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {applicableDiscounts.map((discount, idx) => (
                <Chip
                  key={idx}
                  label={`${discount.type}: ${formatCurrency(discount.amount)}`}
                  size="small"
                  color={discount.color as any}
                  variant="outlined"
                  sx={{ fontSize: '0.65rem', height: 18 }}
                />
              ))}
            </Box>
          </Box>
        )}

        <Collapse in={showDetails}>
          <Paper variant="outlined" sx={{ p: 1.5, mt: 1, bgcolor: 'grey.50' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Product Details
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {selectedProduct.description && (
                    <Typography variant="body2">
                      <strong>Description:</strong> {selectedProduct.description}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    <strong>Type:</strong> {selectedProduct.isService ? 'Service' : 'Goods'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Base Price:</strong> {formatCurrency(selectedProduct.price)}
                  </Typography>
                  {selectedProduct.costPrice && (
                    <Typography variant="body2">
                      <strong>Cost Price:</strong> {formatCurrency(selectedProduct.costPrice)}
                    </Typography>
                  )}
                  {selectedProduct.weight && (
                    <Typography variant="body2">
                      <strong>Weight:</strong> {selectedProduct.weight} {selectedProduct.unitOfMeasurement || 'kg'}
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Inventory & Tax
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="body2">
                    <strong>Stock:</strong> {selectedProduct.quantity || 0} units
                  </Typography>
                  {selectedProduct.minStockLevel && (
                    <Typography variant="body2">
                      <strong>Min Level:</strong> {selectedProduct.minStockLevel} units
                    </Typography>
                  )}
                  <Typography variant="body2">
                    <strong>{selectedProduct.isService ? 'SAC' : 'HSN'} Code:</strong> {
                      selectedProduct.isService 
                        ? (selectedProduct.sacCode || 'Not set')
                        : (selectedProduct.hsnCode || 'Not set')
                    }
                  </Typography>
                  <Typography variant="body2">
                    <strong>GST Status:</strong> {
                      selectedProduct.gstExempt 
                        ? 'Exempt' 
                        : `${selectedProduct.gstRate || 0}% GST`
                    }
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Stock Warning */}
            {selectedProduct.quantity && selectedProduct.quantity < (item.quantity || 0) && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                <Typography variant="caption">
                  Warning: Requested quantity ({item.quantity}) exceeds available stock ({selectedProduct.quantity})
                </Typography>
              </Alert>
            )}

            {/* GST Compliance Warning */}
            {isGstOnly && selectedProduct.gstExempt && !selectedProduct.hsnCode && !selectedProduct.sacCode && (
              <Alert severity="error" sx={{ mt: 1 }}>
                <Typography variant="caption">
                  This GST exempt product cannot be used in GST invoices without HSN/SAC code
                </Typography>
              </Alert>
            )}

            {/* Pricing Analysis */}
            {selectedProduct.costPrice && (
              <Box sx={{ mt: 1, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="caption" color="info.dark">
                  <strong>Margin Analysis:</strong> 
                  {selectedProduct.price > selectedProduct.costPrice 
                    ? ` Profit: ${formatCurrency(selectedProduct.price - selectedProduct.costPrice)} (${(((selectedProduct.price - selectedProduct.costPrice) / selectedProduct.costPrice) * 100).toFixed(1)}%)`
                    : ' Loss scenario - selling below cost price'
                  }
                </Typography>
              </Box>
            )}

            {/* Discount Analysis */}
            {item.totalDiscount && item.totalDiscount > 0 && (
              <Box sx={{ mt: 1, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                <Typography variant="caption" color="success.dark">
                  <strong>Total Savings:</strong> {formatCurrency(item.totalDiscount)} 
                  {item.originalPrice && item.originalPrice > 0 && 
                    ` (${((item.totalDiscount / item.originalPrice) * 100).toFixed(1)}%)`
                  }
                </Typography>
              </Box>
            )}
          </Paper>
        </Collapse>
      </Box>
    );
  };

  return (
    <TableRow sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
      {/* Product Selection */}
      <TableCell sx={{ minWidth: 300 }}>
        <Autocomplete
          options={filteredProducts}
          getOptionLabel={(option) => option.name}
          value={selectedProduct || null}
          onChange={(_, newValue) => selectProduct(index, newValue)}
          onInputChange={(_, newInputValue) => setSearchValue(newInputValue)}
          renderOption={renderProductOption}
          renderInput={(params) => (
            <TextField 
              {...params} 
              size="small" 
              placeholder="Search products by name, SKU, HSN/SAC..." 
              sx={{ minWidth: 280 }}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                    <QrCodeIcon fontSize="small" color="action" />
                  </Box>
                ),
              }}
            />
          )}
          filterOptions={(options) => options} // We handle filtering manually
          isOptionEqualToValue={(option, value) => option.id === value.id}
          noOptionsText={
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {isGstOnly 
                  ? `No GST-eligible products found matching "${searchValue}"`
                  : `No products found matching "${searchValue}"`
                }
              </Typography>
              {isGstOnly && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Only products with HSN/SAC codes are shown for GST invoices
                </Typography>
              )}
              <Button size="small" sx={{ mt: 1 }}>
                Add New Product
              </Button>
            </Box>
          }
          PaperComponent={({ children, ...props }) => (
            <Paper {...props} sx={{ maxHeight: 400, overflow: 'auto' }}>
              {children}
            </Paper>
          )}
        />
        {selectedProduct && renderSelectedProduct()}
      </TableCell>

      {/* HSN/SAC Code */}
      <TableCell>
        <TextField
          size="small"
          value={item.hsnCode}
          onChange={(e) => updateLineItem(index, 'hsnCode', e.target.value)}
          placeholder={selectedProduct?.isService ? "SAC Code" : "HSN Code"}
          sx={{ width: 120 }}
          InputProps={{
            startAdornment: (selectedProduct?.hsnCode || selectedProduct?.sacCode) && (
              <Tooltip title="Auto-filled from product">
                <CheckCircleIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
              </Tooltip>
            ),
          }}
        />
      </TableCell>

      {/* Quantity */}
      <TableCell>
        <TextField
          size="small"
          type="number"
          value={item.quantity}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '') {
              updateLineItem(index, 'quantity', '');
            } else {
              const numericValue = Number(value);
              if (numericValue >= 0 && !isNaN(numericValue)) {
                updateLineItem(index, 'quantity', numericValue);
              }
            }
          }}
          sx={{ width: 80 }}
          inputProps={{ min: 0, step: 1 }}
          error={selectedProduct && selectedProduct.quantity && selectedProduct.quantity < (item.quantity || 0)}
          helperText={
            selectedProduct && selectedProduct.quantity && selectedProduct.quantity < (item.quantity || 0)
              ? 'Exceeds stock'
              : ''
          }
        />
      </TableCell>

      {/* Unit Price */}
      <TableCell>
        <TextField
          size="small"
          type="number"
          value={item.price}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '') {
              updateLineItem(index, 'price', '');
            } else {
              const numericValue = Number(value);
              if (numericValue >= 0 && !isNaN(numericValue)) {
                updateLineItem(index, 'price', numericValue);
              }
            }
          }}
          sx={{ width: 100 }}
          inputProps={{ min: 0, step: 0.01 }}
          InputProps={{
            startAdornment: <Typography variant="caption" sx={{ mr: 0.5 }}>₹</Typography>,
          }}
        />
      </TableCell>

      {/* Manual Discount */}
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            size="small"
            type="number"
            value={item.discount}
            onChange={(e) => {
              const value = e.target.value;
              const numericValue = Number(value);
              if (value === '' || (numericValue >= 0 && numericValue <= 100 && !isNaN(numericValue))) {
                updateLineItem(index, 'discount', value === '' ? 0 : numericValue);
              }
            }}
            sx={{ width: 80 }}
            inputProps={{ min: 0, max: 100, step: 0.1 }}
            InputProps={{
              endAdornment: <Typography variant="caption">%</Typography>,
            }}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Quick:</Typography>
            <Box sx={{ display: 'flex', gap: 0.25, flexWrap: 'wrap' }}>
              {[5, 10, 15, 20, 25, 30, 50].map((preset) => (
                <Button
                  key={preset}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    minWidth: 30, 
                    height: 20, 
                    fontSize: '0.7rem',
                    padding: '2px 4px',
                    lineHeight: 1
                  }}
                  onClick={() => updateLineItem(index, 'discount', preset)}
                >
                  {preset}%
                </Button>
              ))}
            </Box>
          </Box>
        </Box>
      </TableCell>

      {/* Enhanced Discount Columns */}
      {showDiscountDetails && (
        <>
          {/* Category Discount */}
          <TableCell>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="success.main">
                {item.categoryDiscount ? formatCurrency(item.categoryDiscount) : '-'}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Category
              </Typography>
            </Box>
          </TableCell>

          {/* Bulk Discount */}
          <TableCell>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="warning.main">
                {item.bulkDiscount ? formatCurrency(item.bulkDiscount) : '-'}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Bulk
              </Typography>
            </Box>
          </TableCell>

          {/* Party Discount */}
          <TableCell>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="info.main">
                {item.partyDiscount ? formatCurrency(item.partyDiscount) : '-'}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Party
              </Typography>
            </Box>
          </TableCell>
        </>
      )}

      {/* GST Rate */}
      <TableCell>
        <TextField
          size="small"
          select
          value={item.gstRate}
          onChange={(e) => updateLineItem(index, 'gstRate', Number(e.target.value))}
          sx={{ width: 80 }}
        >
          {GST_RATES.map((rate) => (
            <MenuItem key={rate} value={rate}>
              {rate}%
            </MenuItem>
          ))}
        </TextField>
      </TableCell>

      {/* Taxable Amount */}
      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {formatCurrency(item.taxableAmount)}
          </Typography>
          {item.totalDiscount && item.totalDiscount > 0 && (
            <Typography variant="caption" color="success.main" display="block">
              Saved: {formatCurrency(item.totalDiscount)}
            </Typography>
          )}
        </Box>
      </TableCell>

      {/* GST Amounts */}
      {isInterState ? (
        <TableCell>
          <Typography variant="body2" color="primary.main">
            {formatCurrency(item.igstAmount)}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            IGST
          </Typography>
        </TableCell>
      ) : (
        <>
          <TableCell>
            <Typography variant="body2" color="primary.main">
              {formatCurrency(item.cgstAmount)}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              CGST
            </Typography>
          </TableCell>
          <TableCell>
            <Typography variant="body2" color="primary.main">
              {formatCurrency(item.sgstAmount)}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              SGST
            </Typography>
          </TableCell>
        </>
      )}

      {/* Total Amount */}
      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight="bold" color="success.main">
            {formatCurrency(item.taxableAmount + item.totalTaxAmount)}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Inc. GST
          </Typography>
          {item.profitMargin && item.profitMargin > 0 && (
            <Typography variant="caption" color="info.main" display="block">
              Margin: {item.profitMargin.toFixed(1)}%
            </Typography>
          )}
        </Box>
      </TableCell>

      {/* Actions */}
      <TableCell>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Remove Item">
            <IconButton onClick={() => removeLineItem(index)} color="error" size="small">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {selectedProduct && (
            <Tooltip title="Product Info">
              <IconButton 
                onClick={() => setShowDetails(!showDetails)} 
                color="primary" 
                size="small"
              >
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {item.totalDiscount && item.totalDiscount > 0 && (
            <Tooltip title="Discount Applied">
              <IconButton color="success" size="small">
                <PercentIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
};

export default EnhancedInvoiceItemRow;