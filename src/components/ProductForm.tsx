'use client';
import React, { useEffect, useState } from 'react';
import {
  Paper,
  Grid,
  TextField,
  Button,
  Box,
  Switch,
  FormControlLabel,
  MenuItem,
  Alert,
  CircularProgress,
  Typography,
  Divider,
  Autocomplete,
  InputAdornment,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { Product, Category } from '@/types/inventory';
import { categoryService } from '@/services/categoryService';
import { AutoAwesome, TrendingUp, Calculate } from '@mui/icons-material';
import { calculateProfit, formatCurrency, formatPercentage, getProfitStatus } from '@/utils/profitCalculations';

interface ProductFormProps {
  initialData?: Partial<Product>;
  onSubmit: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
  loading?: boolean;
  error?: string | null;
}

// Units of measurement
const UNITS_OF_MEASUREMENT = [
  'PCS', 'KG', 'GRAM', 'LITER', 'ML', 'METER', 'CM', 'INCH', 'FEET', 'YARD',
  'SQM', 'SQFT', 'CBM', 'CBFT', 'TON', 'QUINTAL', 'DOZEN', 'PAIR', 'SET', 'BOX'
];

export default function ProductForm({ initialData, onSubmit, onCancel, mode = 'create', loading = false, error = null }: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = React.useState<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>({
    name: initialData?.name || '',
    categoryId: initialData?.categoryId || '',
    price: initialData?.price || initialData?.salePrice || 0, // For backward compatibility
    purchasePrice: initialData?.purchasePrice || 0,
    salePrice: initialData?.salePrice || initialData?.price || 0,
    quantity: initialData?.quantity || 0,
    description: initialData?.description || '',
    reorderPoint: initialData?.reorderPoint || 0,
    isActive: initialData?.isActive ?? true,
    sku: initialData?.sku || '',
    unitOfMeasurement: initialData?.unitOfMeasurement || 'PCS',
    isService: initialData?.isService ?? false,
    barcode: initialData?.barcode || '',
    brand: initialData?.brand || '',
    model: initialData?.model || '',
    weight: initialData?.weight || 0,
    maxStockLevel: initialData?.maxStockLevel || 0,
    minStockLevel: initialData?.minStockLevel || 0,
    tags: initialData?.tags || [],
    discountedPrice: initialData?.discountedPrice || 0,
    images: initialData?.images || []
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data.filter(cat => cat.isActive));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const generateSKU = () => {
    const category = categories.find(cat => cat.id === formData.categoryId);
    const categoryPrefix = category ? category.name.substring(0, 3).toUpperCase() : 'PRD';
    const timestamp = Date.now().toString().slice(-6);
    const sku = `${categoryPrefix}-${timestamp}`;
    setFormData({ ...formData, sku });
  };

  // Calculate profit metrics whenever purchase or sale price changes
  const profitMetrics = React.useMemo(() => {
    if (formData.purchasePrice > 0 && formData.salePrice > 0) {
      return calculateProfit(formData.purchasePrice, formData.salePrice);
    }
    return { profitAmount: 0, profitPercentage: 0, marginPercentage: 0 };
  }, [formData.purchasePrice, formData.salePrice]);

  const handlePriceChange = (field: 'purchasePrice' | 'salePrice', value: number) => {
    const updatedData = { 
      ...formData, 
      [field]: value,
      price: field === 'salePrice' ? value : formData.price // Keep price in sync with salePrice
    };
    
    // Calculate and add profit metrics
    if (updatedData.purchasePrice > 0 && updatedData.salePrice > 0) {
      const metrics = calculateProfit(updatedData.purchasePrice, updatedData.salePrice);
      updatedData.profitAmount = metrics.profitAmount;
      updatedData.profitPercentage = metrics.profitPercentage;
      updatedData.marginPercentage = metrics.marginPercentage;
    }
    
    setFormData(updatedData);
  };

  return (
    <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4 }}>
      {error && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}
      
      {/* Information about enhanced product entry */}
      <Box sx={{ mb: 3 }}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography variant="body2">
            <strong>💰 Enhanced Product Entry with Profit Tracking:</strong> Enter both purchase and sale prices to automatically calculate profit margins and improve your business productivity. 
            Real-time profit analysis helps you make better pricing decisions.
          </Typography>
        </Alert>
      </Box>

      <Grid container spacing={3}>
        {/* Basic Product Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            label="Product Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            helperText="Enter a descriptive product name"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="SKU"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Generate SKU automatically">
                    <IconButton onClick={generateSKU} edge="end">
                      <AutoAwesome />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
            helperText="Stock Keeping Unit (auto-generate available)"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            select
            fullWidth
            label="Category"
            required
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          >
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} md={6}>
          <Autocomplete
            freeSolo
            options={UNITS_OF_MEASUREMENT}
            value={formData.unitOfMeasurement}
            onChange={(event, newValue) => {
              setFormData({ ...formData, unitOfMeasurement: newValue || 'PCS' });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Unit of Measurement"
                helperText="Select or type custom unit (e.g., PCS, KG, LITER)"
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            helperText="Optional product description"
          />
        </Grid>
        
        {/* Pricing Section */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Pricing & Profitability
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Purchase Price (₹)"
            required
            value={formData.purchasePrice}
            onChange={(e) => handlePriceChange('purchasePrice', Number(e.target.value))}
            InputProps={{ 
              inputProps: { min: 0, step: 0.01 },
              startAdornment: <InputAdornment position="start">₹</InputAdornment>
            }}
            helperText="Cost price at which you buy this product"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Sale Price (₹)"
            required
            value={formData.salePrice}
            onChange={(e) => handlePriceChange('salePrice', Number(e.target.value))}
            InputProps={{ 
              inputProps: { min: 0, step: 0.01 },
              startAdornment: <InputAdornment position="start">₹</InputAdornment>
            }}
            helperText="Price at which you sell this product"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Discounted Price (₹)"
            value={formData.discountedPrice}
            onChange={(e) => setFormData({ ...formData, discountedPrice: Number(e.target.value) })}
            InputProps={{ 
              inputProps: { min: 0, step: 0.01 },
              startAdornment: <InputAdornment position="start">₹</InputAdornment>
            }}
            helperText="Optional discounted selling price"
          />
        </Grid>

        {/* Profit Display */}
        {formData.purchasePrice > 0 && formData.salePrice > 0 && (
          <Grid item xs={12}>
            <Card sx={{ mt: 2, bgcolor: 'background.default' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Profit Analysis</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Profit Amount
                      </Typography>
                      <Typography variant="h6" color={profitMetrics.profitAmount >= 0 ? 'success.main' : 'error.main'}>
                        {formatCurrency(profitMetrics.profitAmount)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Profit Percentage
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Typography variant="h6" color={profitMetrics.profitPercentage >= 0 ? 'success.main' : 'error.main'}>
                          {formatPercentage(profitMetrics.profitPercentage)}
                        </Typography>
                        <Chip 
                          label={getProfitStatus(profitMetrics.profitPercentage).label}
                          color={getProfitStatus(profitMetrics.profitPercentage).color}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Margin Percentage
                      </Typography>
                      <Typography variant="h6" color={profitMetrics.marginPercentage >= 0 ? 'success.main' : 'error.main'}>
                        {formatPercentage(profitMetrics.marginPercentage)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Stock Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Stock Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Current Stock"
            required
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
            InputProps={{ inputProps: { min: 0 } }}
            helperText="Available quantity"
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Reorder Point"
            required
            value={formData.reorderPoint}
            onChange={(e) => setFormData({ ...formData, reorderPoint: Number(e.target.value) })}
            InputProps={{ inputProps: { min: 0 } }}
            helperText="Minimum stock level"
          />
        </Grid>

        {/* Status */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Status & Visibility
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
            }
            label="Active Product"
          />
          <Typography variant="caption" display="block" color="text.secondary">
            Inactive products won't appear in product selection for invoices
          </Typography>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
            {onCancel && (
              <Button variant="outlined" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            )}
            <Button variant="contained" type="submit" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : mode === 'edit' ? 'Update Product' : 'Create Product'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}