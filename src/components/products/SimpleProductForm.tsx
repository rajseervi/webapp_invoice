"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Autocomplete,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { calculateProfit, formatCurrency, formatPercentage, getProfitStatus } from '@/utils/profitCalculations';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Product, Category } from '@/types/inventory';
import SimpleProductService from '@/services/simpleProductService';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';

interface SimpleProductFormProps {
  onSuccess?: (productId?: string) => void;
  initialData?: Partial<Product>;
  mode?: 'create' | 'edit';
}

const UNITS = ['PCS', 'KG', 'LITER', 'METER', 'BOX', 'DOZEN', 'GRAM', 'TON', 'PAIR', 'SET'];

export default function SimpleProductForm({ 
  onSuccess, 
  initialData, 
  mode = 'create' 
}: SimpleProductFormProps) {
  const router = useRouter();
  const { userId } = useCurrentUser();
  
  // Form state
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    categoryId: initialData?.categoryId || '',
    price: initialData?.price || initialData?.salePrice || 0, // For backward compatibility
    purchasePrice: initialData?.purchasePrice || 0,
    salePrice: initialData?.salePrice || initialData?.price || 0,
    quantity: initialData?.quantity || 0,
    unitOfMeasurement: initialData?.unitOfMeasurement || 'PCS',
    isService: initialData?.isService || false,
    isActive: initialData?.isActive ?? true,
    reorderPoint: initialData?.reorderPoint || 0,
    maxStockLevel: initialData?.maxStockLevel || 0,
    minStockLevel: initialData?.minStockLevel || 0,
    barcode: initialData?.barcode || '',
    sku: initialData?.sku || '',
    brand: initialData?.brand || '',
    model: initialData?.model || '',
    weight: initialData?.weight || 0,
    tags: initialData?.tags || [],
    discountedPrice: initialData?.discountedPrice || 0,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      if (!userId) return;
      
      try {
        const categoriesQuery = query(
          collection(db, 'categories'),
          where('userId', '==', userId),
          where('isActive', '==', true)
        );
        const categoriesSnapshot = await getDocs(categoriesQuery);
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[];
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    loadCategories();
  }, [userId]);

  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle price changes with profit calculation
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

  // Calculate profit metrics
  const profitMetrics = React.useMemo(() => {
    if (formData.purchasePrice > 0 && formData.salePrice > 0) {
      return calculateProfit(formData.purchasePrice, formData.salePrice);
    }
    return { profitAmount: 0, profitPercentage: 0, marginPercentage: 0 };
  }, [formData.purchasePrice, formData.salePrice]);

  // Handle tag addition
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Validate form
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Product name is required');
      return false;
    }
    
    if (!formData.categoryId) {
      setError('Category is required');
      return false;
    }
    
    if (formData.purchasePrice <= 0) {
      setError('Purchase price must be greater than 0');
      return false;
    }
    
    if (formData.salePrice <= 0) {
      setError('Sale price must be greater than 0');
      return false;
    }
    
    if (formData.salePrice < formData.purchasePrice) {
      setError('Sale price should typically be higher than purchase price (you will have a loss)');
      // Don't return false here, just warn the user
    }
    
    if (formData.quantity < 0) {
      setError('Quantity cannot be negative');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm() || !userId) return;

    setLoading(true);
    setError(null);

    try {
      const productData = {
        ...formData,
        userId,
        createdBy: userId,
        updatedBy: userId
      };

      if (mode === 'edit' && initialData?.id) {
        await SimpleProductService.updateProduct(initialData.id, productData);
        if (onSuccess) {
          onSuccess(initialData.id);
        } else {
          router.push(`/products`);
        }
      } else {
        const productId = await SimpleProductService.createProduct(productData);
        if (onSuccess) {
          onSuccess(productId);
        } else {
          router.push(`/products`);
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setError('Failed to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <InventoryIcon />
        {mode === 'edit' ? 'Edit Product' : 'Add New Product'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Basic Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                error={!formData.name.trim()}
                helperText={!formData.name.trim() ? 'Product name is required' : ''}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={categories}
                getOptionLabel={(option) => option.name}
                value={categories.find(c => c.id === formData.categoryId) || null}
                onChange={(_, category) => handleChange('categoryId', category?.id || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Category"
                    required
                    error={!formData.categoryId}
                    helperText={!formData.categoryId ? 'Category is required' : ''}
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                multiline
                rows={3}
                placeholder="Enter product description..."
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isService}
                    onChange={(e) => handleChange('isService', e.target.checked)}
                  />
                }
                label="This is a service (not a physical product)"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => handleChange('isActive', e.target.checked)}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Pricing & Profitability */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Pricing & Profitability
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Purchase Price"
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => handlePriceChange('purchasePrice', parseFloat(e.target.value) || 0)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 }
                }}
                helperText="Cost price at which you buy"
                required
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Sale Price"
                type="number"
                value={formData.salePrice}
                onChange={(e) => handlePriceChange('salePrice', parseFloat(e.target.value) || 0)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 }
                }}
                helperText="Price at which you sell"
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Discounted Price"
                type="number"
                value={formData.discountedPrice}
                onChange={(e) => handleChange('discountedPrice', parseFloat(e.target.value) || 0)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 }
                }}
                helperText="Optional discounted price"
              />
            </Grid>

            {/* Profit Display */}
            {formData.purchasePrice > 0 && formData.salePrice > 0 && (
              <Grid item xs={12}>
                <Card sx={{ mt: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <TrendingUpIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle1" fontWeight="bold">
                        Profit Analysis
                      </Typography>
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
          </Grid>
        </CardContent>
      </Card>

      {/* Stock Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Stock Information
          </Typography>
          
          <Grid container spacing={3}>
            
            {!formData.isService && (
              <>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Current Stock"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
                    inputProps={{ min: 0, step: 1 }}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <Typography variant="body2" sx={{ mb: 1 }}>Unit of Measurement</Typography>
                    <Select
                      value={formData.unitOfMeasurement}
                      onChange={(e) => handleChange('unitOfMeasurement', e.target.value)}
                    >
                      {UNITS.map(unit => (
                        <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Reorder Point"
                    type="number"
                    value={formData.reorderPoint}
                    onChange={(e) => handleChange('reorderPoint', parseFloat(e.target.value) || 0)}
                    inputProps={{ min: 0, step: 1 }}
                    helperText="Alert when stock falls below this level"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Minimum Stock Level"
                    type="number"
                    value={formData.minStockLevel}
                    onChange={(e) => handleChange('minStockLevel', parseFloat(e.target.value) || 0)}
                    inputProps={{ min: 0, step: 1 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Maximum Stock Level"
                    type="number"
                    value={formData.maxStockLevel}
                    onChange={(e) => handleChange('maxStockLevel', parseFloat(e.target.value) || 0)}
                    inputProps={{ min: 0, step: 1 }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Additional Details */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Additional Details
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="SKU"
                value={formData.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                placeholder="Stock Keeping Unit"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Barcode"
                value={formData.barcode}
                onChange={(e) => handleChange('barcode', e.target.value)}
                placeholder="Product barcode"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Brand"
                value={formData.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                placeholder="Product brand"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Model"
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
                placeholder="Product model"
              />
            </Grid>
            
            {!formData.isService && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Weight (kg)"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleChange('weight', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>Tags</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                  {formData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      size="small"
                    />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Add tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                  >
                    Add
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSubmit}
          disabled={loading || !formData.name.trim() || !formData.categoryId}
        >
          {loading ? 'Saving...' : (mode === 'edit' ? 'Update Product' : 'Create Product')}
        </Button>
      </Box>
    </Box>
  );
}