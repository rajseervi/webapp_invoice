'use client';
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Typography,
  Box,
  Alert,
  InputAdornment,
  Autocomplete,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { Product, Category } from '@/types/inventory';
import { productService } from '@/services/productService';

interface QuickAddProductProps {
  open: boolean;
  categories: Category[];
  onClose: () => void;
  onProductAdded: (product: Product) => void;
  onShowSnackbar: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
  prefilledData?: Partial<Product>;
}

const GST_RATES = [0, 5, 12, 18, 28];
const UNITS_OF_MEASUREMENT = [
  'PCS', 'KG', 'GRAM', 'LITER', 'ML', 'METER', 'CM', 'INCH', 'FEET', 'SQ.FT', 'SQ.M', 'BOX', 'PACK', 'SET'
];

export function QuickAddProduct({
  open,
  categories,
  onClose,
  onProductAdded,
  onShowSnackbar,
  prefilledData = {}
}: QuickAddProductProps) {
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    categoryId: '',
    price: 0,
    quantity: 0,
    unitOfMeasurement: 'PCS',
    hsnCode: '',
    sacCode: '',
    gstRate: 18,
    gstExempt: false,
    isService: false,
    isActive: true,
    sku: '',
    brand: '',
    ...prefilledData
  });

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        description: '',
        categoryId: '',
        price: 0,
        quantity: 0,
        unitOfMeasurement: 'PCS',
        hsnCode: '',
        sacCode: '',
        gstRate: 18,
        gstExempt: false,
        isService: false,
        isActive: true,
        sku: '',
        brand: '',
        ...prefilledData
      });
      setErrors({});
    }
  }, [open, prefilledData]);

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.quantity === undefined || formData.quantity < 0) {
      newErrors.quantity = 'Quantity cannot be negative';
    }

    // For GST invoices, HSN/SAC code is required
    if (!formData.isService && !formData.hsnCode?.trim()) {
      newErrors.hsnCode = 'HSN code is required for products';
    }

    if (formData.isService && !formData.sacCode?.trim()) {
      newErrors.sacCode = 'SAC code is required for services';
    }

    if (formData.gstRate === undefined || formData.gstRate < 0 || formData.gstRate > 100) {
      newErrors.gstRate = 'GST rate must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSave = async () => {
    if (!validateForm()) {
      onShowSnackbar('Please fix the validation errors', 'error');
      return;
    }

    setLoading(true);
    try {
      // Create new product
      const productId = await productService.createProduct(formData as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);
      const newProduct = { ...formData, id: productId } as Product;
      
      onProductAdded(newProduct);
      onShowSnackbar('Product created successfully', 'success');
      onClose();
    } catch (error) {
      console.error('Error creating product:', error);
      onShowSnackbar('Failed to create product', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Auto-generate SKU when name or category changes
    if (field === 'name' || field === 'categoryId') {
      const category = categories.find(c => c.id === (field === 'categoryId' ? value : formData.categoryId));
      const productName = field === 'name' ? value : formData.name;
      
      if (category && productName) {
        const categoryPrefix = category.name.substring(0, 3).toUpperCase();
        const namePrefix = productName.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString().slice(-4);
        const sku = `${categoryPrefix}-${namePrefix}-${timestamp}`;
        setFormData(prev => ({ ...prev, sku }));
      }
    }
  };

  // Get category name
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || '';
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <AddIcon />
          </Avatar>
          <Box>
            <Typography variant="h6">Quick Add Product</Typography>
            <Typography variant="body2" color="text.secondary">
              Add a new product for GST invoice
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Fill in the essential product information. All fields marked with * are required for GST invoices.
              </Typography>
            </Alert>
          </Grid>

          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Product Name *"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              placeholder="Enter product name"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth error={!!errors.categoryId}>
              <InputLabel>Category *</InputLabel>
              <Select
                value={formData.categoryId || ''}
                label="Category *"
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.categoryId && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {errors.categoryId}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Price *"
              type="number"
              value={formData.price || ''}
              onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
              error={!!errors.price}
              helperText={errors.price}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              options={UNITS_OF_MEASUREMENT}
              value={formData.unitOfMeasurement || 'PCS'}
              onChange={(_, value) => handleInputChange('unitOfMeasurement', value || 'PCS')}
              renderInput={(params) => (
                <TextField {...params} label="Unit of Measurement" />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Current Stock"
              type="number"
              value={formData.quantity || ''}
              onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
              error={!!errors.quantity}
              helperText={errors.quantity}
              InputProps={{
                endAdornment: <InputAdornment position="end">{formData.unitOfMeasurement || 'PCS'}</InputAdornment>
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>GST Rate *</InputLabel>
              <Select
                value={formData.gstRate || 18}
                label="GST Rate *"
                onChange={(e) => handleInputChange('gstRate', parseFloat(e.target.value as string))}
                error={!!errors.gstRate}
              >
                {GST_RATES.map((rate) => (
                  <MenuItem key={rate} value={rate}>
                    {rate}%
                  </MenuItem>
                ))}
              </Select>
              {errors.gstRate && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {errors.gstRate}
                </Typography>
              )}
            </FormControl>
          </Grid>

          {/* Service/Product Toggle */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isService || false}
                  onChange={(e) => handleInputChange('isService', e.target.checked)}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {formData.isService ? <ReceiptIcon /> : <InventoryIcon />}
                  <Typography>
                    This is a {formData.isService ? 'Service' : 'Product'}
                  </Typography>
                </Box>
              }
            />
          </Grid>

          {/* HSN/SAC Code */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={formData.isService ? "SAC Code *" : "HSN Code *"}
              value={formData.isService ? (formData.sacCode || '') : (formData.hsnCode || '')}
              onChange={(e) => handleInputChange(formData.isService ? 'sacCode' : 'hsnCode', e.target.value)}
              error={formData.isService ? !!errors.sacCode : !!errors.hsnCode}
              helperText={formData.isService ? errors.sacCode : errors.hsnCode}
              placeholder={formData.isService ? "Enter SAC code for service" : "Enter HSN code for product"}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="SKU"
              value={formData.sku || ''}
              onChange={(e) => handleInputChange('sku', e.target.value)}
              placeholder="Auto-generated or enter custom SKU"
              helperText="Unique product identifier"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Brand"
              value={formData.brand || ''}
              onChange={(e) => handleInputChange('brand', e.target.value)}
              placeholder="Enter brand name"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.gstExempt || false}
                  onChange={(e) => handleInputChange('gstExempt', e.target.checked)}
                />
              }
              label="GST Exempt"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter product description (optional)"
            />
          </Grid>

          {/* Preview */}
          <Grid item xs={12}>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Product Preview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Name:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.name || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Category:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {getCategoryName(formData.categoryId || '')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Price:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    ₹{(formData.price || 0).toFixed(2)} per {formData.unitOfMeasurement || 'unit'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">GST:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.gstRate || 0}% {formData.gstExempt ? '(Exempt)' : ''}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Button
          onClick={onClose}
          startIcon={<CancelIcon />}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={loading}
          size="large"
        >
          {loading ? 'Creating...' : 'Create Product'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}