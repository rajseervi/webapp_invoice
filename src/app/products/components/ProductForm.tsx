"use client";
import React, { useState, useEffect } from 'react';
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
  Card,
  CardContent,
  Autocomplete,
  InputAdornment,
  Chip,
  Snackbar,
  Alert as MuiAlert
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ShoppingCart as ProductIcon,
  AttachMoney as PriceIcon,
  ToggleOn as StatusIcon
} from '@mui/icons-material';
import { Product, Category } from '@/types/inventory';
import { categoryService } from '@/services/categoryService';

interface ProductFormProps {
  initialData?: Partial<Product>;
  onSubmit: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  mode?: 'create' | 'edit';
  loading?: boolean;
  error?: string | null;
}

const UNIT_OPTIONS = [
  'PCS', 'KG', 'GRAM', 'LITER', 'ML', 'METER', 'CM', 'INCH', 'FEET',
  'YARD', 'SQ METER', 'SQ FEET', 'CU METER', 'CU FEET', 'DOZEN', 'PAIR',
  'SET', 'BOX', 'PACK', 'BOTTLE', 'BAG', 'ROLL', 'SHEET'
];

export default function ProductForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  mode = 'create', 
  loading = false, 
  error = null 
}: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>({
    name: initialData?.name || '',
    categoryId: initialData?.categoryId || '',
    price: initialData?.price || 0,
    purchasePrice: initialData?.purchasePrice || 0,
    quantity: initialData?.quantity || 0,
    description: initialData?.description || '',
    reorderPoint: initialData?.reorderPoint || 10,
    isActive: initialData?.isActive ?? true,
    unitOfMeasurement: initialData?.unitOfMeasurement || 'PCS',
    isService: false,
    barcode: initialData?.barcode || '',
    sku: initialData?.sku || '',
    brand: initialData?.brand || '',
    model: initialData?.model || '',
    weight: initialData?.weight || 0,
    maxStockLevel: initialData?.maxStockLevel || 0,
    minStockLevel: initialData?.minStockLevel || 0,
    tags: initialData?.tags || [],
    discountedPrice: initialData?.discountedPrice || 0,
    images: initialData?.images || []
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setFetchError(null);
    try {
      const data = await categoryService.getCategories();
      // Filter active categories, but also handle cases where isActive might be undefined
      const activeCategories = data.filter(cat => cat.isActive !== false);
      setCategories(activeCategories);
      console.log('Loaded categories:', data);
      console.log('Active categories:', activeCategories);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load categories';
      setFetchError(errorMessage);
      console.error('Error loading categories:', error);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }

    if (!formData.categoryId) {
      errors.categoryId = 'Category is required';
    }

    if (formData.price <= 0) {
      errors.price = 'Selling price must be greater than 0';
    }

    if (formData.purchasePrice <= 0) {
      errors.purchasePrice = 'Purchase price must be greater than 0';
    }

    if (formData.price > 0 && formData.purchasePrice > 0 && formData.price <= formData.purchasePrice) {
      errors.price = 'Selling price should be higher than purchase price for profit';
    }

    if (formData.quantity < 0) {
      errors.quantity = 'Quantity cannot be negative';
    }

    if (formData.reorderPoint < 0) {
      errors.reorderPoint = 'Reorder point cannot be negative';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const sanitizeInput = (input: any): any => {
    if (typeof input === 'string') {
      return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                  .replace(/javascript:/gi, '')
                  .replace(/on\w+\s*=/gi, '')
                  .trim();
    }
    return input;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      setSnackbar({
        open: true,
        message: `Product "${formData.name}" ${mode === 'edit' ? 'updated' : 'created'} successfully!`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setSnackbar({
        open: true,
        message: `Failed to ${mode === 'edit' ? 'update' : 'create'} product. Please check all required fields.`,
        severity: 'error'
      });
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    const sanitizedValue = sanitizeInput(value);
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <>
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4 }}>
        {error && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {fetchError && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="error">{fetchError}</Alert>
          </Box>
        )}

        {/* Information about simplified product entry */}
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>📋 Simplified Product Entry:</strong> Focus on the essential product details below. 
              No GST or tax calculations required.
            </Typography>
          </Alert>
        </Box>

        <Grid container spacing={4}>
          {/* Section 1: Basic Product Information */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ p: 3, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <ProductIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" color="primary.main">
                  Basic Product Information
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Product Name"
                    required
                    id="product-name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    error={!!validationErrors.name}
                    helperText={validationErrors.name || "Enter a clear, descriptive product name"}
                    placeholder="e.g., Product Name"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Category"
                    required
                    id="product-category"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={(e) => handleInputChange('categoryId', e.target.value)}
                    error={!!validationErrors.categoryId}
                    helperText={validationErrors.categoryId || "Select the appropriate product category"}
                  >
                    <MenuItem value="">
                      <em>Select Category</em>
                    </MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    helperText="Optional product description"
                  />
                </Grid>
              </Grid>
            </Card>
          </Grid>

          {/* Section 2: Pricing & Inventory Management */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ p: 3, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <PriceIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" color="primary.main">
                  Pricing & Inventory Management
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Selling Price (₹)"
                    required
                    id="product-price"
                    name="price"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', Number(e.target.value))}
                    InputProps={{ 
                      inputProps: { min: 0, step: 0.01 },
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>
                    }}
                    error={!!validationErrors.price}
                    helperText={validationErrors.price || "Product selling price"}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Purchase Price (₹)"
                    required
                    id="product-purchase-price"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={(e) => handleInputChange('purchasePrice', Number(e.target.value))}
                    InputProps={{ 
                      inputProps: { min: 0, step: 0.01 },
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>
                    }}
                    error={!!validationErrors.purchasePrice}
                    helperText={validationErrors.purchasePrice || "Product cost/purchase price"}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Current Stock Quantity"
                    required
                    id="product-quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 0 } }}
                    error={!!validationErrors.quantity}
                    helperText={validationErrors.quantity || "Available stock quantity"}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Reorder Alert Level"
                    required
                    id="reorder-point"
                    name="reorderPoint"
                    value={formData.reorderPoint}
                    onChange={(e) => handleInputChange('reorderPoint', Number(e.target.value))}
                    InputProps={{ inputProps: { min: 0 } }}
                    error={!!validationErrors.reorderPoint}
                    helperText={validationErrors.reorderPoint || "Alert when stock falls below this level"}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={UNIT_OPTIONS}
                    value={formData.unitOfMeasurement}
                    onChange={(_, newValue) => handleInputChange('unitOfMeasurement', newValue || 'PCS')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Unit of Measurement"
                        placeholder="Select or type unit (e.g., PCS, KG, LITER)"
                        helperText="Unit for inventory tracking and invoicing"
                        id="unit-of-measurement"
                        name="unitOfMeasurement"
                      />
                    )}
                    freeSolo
                  />
                </Grid>

                {/* Profit Margin Indicator */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      💰 Profit Analysis
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {formData.price > 0 && formData.purchasePrice > 0 ? (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Profit Margin:
                            </Typography>
                            <Chip 
                              label={`₹${(formData.price - formData.purchasePrice).toFixed(2)} (${(((formData.price - formData.purchasePrice) / formData.price) * 100).toFixed(1)}%)`}
                              color={formData.price > formData.purchasePrice ? "success" : "error"}
                              size="small" 
                            />
                          </Box>
                          {formData.price <= formData.purchasePrice && (
                            <Typography variant="body2" color="error.main">
                              ⚠️ Selling price should be higher than purchase price
                            </Typography>
                          )}
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Enter both selling and purchase prices to see profit analysis
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>

                {/* Stock Status Indicator */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      📊 Stock Status
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {formData.quantity > formData.reorderPoint ? (
                        <>
                          <Chip label="✅ In Stock" color="success" size="small" />
                          <Typography variant="body2" color="text.secondary">
                            {formData.quantity - formData.reorderPoint} units above reorder level
                          </Typography>
                        </>
                      ) : (
                        <>
                          <Chip label="⚠️ Low Stock" color="warning" size="small" />
                          <Typography variant="body2" color="warning.main">
                            Reorder recommended
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Card>
          </Grid>

          {/* Section 3: Product Status & Summary */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ p: 3, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <StatusIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" color="primary.main">
                  Product Status & Summary
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.default' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isActive}
                          onChange={(e) => handleInputChange('isActive', e.target.checked)}
                          color="success"
                          id="product-status-switch"
                          name="isActive"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2">
                            Product Status: {formData.isActive ? '✅ Active' : '❌ Inactive'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formData.isActive 
                              ? 'Product is available for sale and will appear in listings' 
                              : 'Product is hidden and not available for sale'
                            }
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ bgcolor: 'background.default', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        📊 Product Summary
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Chip 
                          label="📦 Product" 
                          color="primary" 
                          size="small" 
                          variant="outlined"
                        />
                        <Chip 
                          label={formData.isActive ? '✅ Active' : '❌ Inactive'} 
                          color={formData.isActive ? 'success' : 'default'} 
                          size="small" 
                          variant="outlined"
                        />
                        {formData.quantity <= formData.reorderPoint && (
                          <Chip 
                            label="⚠️ Low Stock Alert" 
                            color="warning" 
                            size="small" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Card>
          </Grid>

          {/* Section 4: Action Buttons */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ p: 3, bgcolor: 'grey.50' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {mode === 'edit' ? 'Update product information' : 'Create new product with the above details'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    onClick={onCancel} 
                    disabled={loading}
                    startIcon={<CancelIcon />}
                    size="large"
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="contained" 
                    type="submit" 
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    size="large"
                  >
                    {loading ? 'Saving...' : mode === 'edit' ? 'Update Product' : 'Create Product'}
                  </Button>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <MuiAlert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </>
  );
}