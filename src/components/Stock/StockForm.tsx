"use client";
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Typography,
  Box,
  Divider,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { Product } from '@/types/inventory';

interface StockFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (product: Partial<Product>) => void;
  product?: Product;
  categories: { id: string; name: string }[];
}

const StockForm: React.FC<StockFormProps> = ({ 
  open, 
  onClose, 
  onSubmit, 
  product, 
  categories 
}) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    sku: '',
    categoryId: '',
    price: 0,
    quantity: 0,
    description: '',
    reorderPoint: 10,
    isActive: true
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Initialize form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        // Ensure all required fields are present
        name: product.name || '',
        sku: product.sku || '',
        categoryId: product.categoryId || '',
        price: product.price || 0,
        quantity: product.quantity || 0,
        description: product.description || '',
        reorderPoint: product.reorderPoint || 10,
        isActive: product.isActive !== false
      });
    } else {
      // Reset form for new product
      setFormData({
        name: '',
        sku: '',
        categoryId: '',
        price: 0,
        quantity: 0,
        description: '',
        reorderPoint: 10,
        isActive: true
      });
    }
    
    // Reset errors
    setErrors({});
  }, [product]);
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    
    if (!name) return;
    
    // Clear error for this field when it's changed
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!formData.name?.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.sku?.trim()) {
      newErrors.sku = 'SKU is required';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }
    
    // Numeric validations
    if (formData.price === undefined || formData.price < 0) {
      newErrors.price = 'Price must be a positive number';
    }
    
    if (formData.quantity === undefined || formData.quantity < 0) {
      newErrors.quantity = 'Quantity must be a positive number';
    }
    
    if (formData.reorderPoint === undefined || formData.reorderPoint < 0) {
      newErrors.reorderPoint = 'Reorder point must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h6">
          {product ? 'Edit Product' : 'Add New Product'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Please correct the errors below before submitting.
            </Alert>
          )}
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SKU"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                error={!!errors.sku}
                helperText={errors.sku}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.categoryId} required>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  label="Category"
                >
                  {categories.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.categoryId && (
                  <Typography variant="caption" color="error">
                    {errors.categoryId}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                error={!!errors.price}
                helperText={errors.price}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                error={!!errors.quantity}
                helperText={errors.quantity}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Reorder Point"
                  name="reorderPoint"
                  value={formData.reorderPoint}
                  onChange={handleChange}
                  error={!!errors.reorderPoint}
                  helperText={errors.reorderPoint || 'Minimum stock level before reordering'}
                />
                <Tooltip title="When stock falls below this level, the product will be flagged for reordering">
                  <IconButton size="small" sx={{ mt: 1, ml: 1 }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <Divider />
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            {product ? 'Update' : 'Add'} Product
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default StockForm;