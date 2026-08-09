import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Grid, MenuItem, Chip, Stack, Typography, Alert } from '@mui/material';
import { EnhancedProduct } from './EnhancedProductList';

interface EnhancedProductFormProps {
  initialData?: EnhancedProduct;
  onSubmit: (data: Omit<EnhancedProduct, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const categories = ['Electronics', 'Books', 'Home Appliances', 'Clothing', 'Food'];
const units = ['Pcs', 'Kg', 'Ltr', 'Mtr', 'Box'];

const EnhancedProductForm: React.FC<EnhancedProductFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Omit<EnhancedProduct, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    category: '',
    price: 0,
    stock: 0,
    status: 'Active',
    description: '',
    sku: '',
    unit: undefined,
    manufacturer: undefined,
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || '',
        price: initialData.price || 0,
        stock: initialData.stock || 0,
        status: initialData.status || 'Active',
        description: initialData.description || '',
        sku: initialData.sku || '',
        unit: initialData.unit || undefined,
        manufacturer: initialData.manufacturer || undefined,
        tags: initialData.tags || [],
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    if (!formData.name.trim()) newErrors.name = 'Product Name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (formData.stock < 0) newErrors.stock = 'Stock cannot be negative';

    if (!formData.unit) newErrors.unit = 'Unit is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setErrors(prev => ({ ...prev, [name]: '' })); // Clear error when input changes
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
    setErrors(prev => ({ ...prev, [name]: '' })); // Clear error when input changes
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToDelete),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
      {/* Information about GST/Tax handling */}
      <Box sx={{ mb: 3 }}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography variant="body2">
            <strong>📋 Simplified Product Entry:</strong> GST and tax calculations are handled automatically. 
            Focus on the essential product details below.
          </Typography>
        </Alert>
      </Box>
      
      <Grid container spacing={3} component="div">
        <Grid item xs={12} sm={6} component="div">
          <TextField
            required
            id="name"
            name="name"
            label="Product Name"
            fullWidth
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
          />
        </Grid>
        <Grid item xs={12} sm={6} component="div">
          <TextField
            required
            id="category"
            name="category"
            label="Category"
            fullWidth
            select
            value={formData.category}
            onChange={handleChange}
            error={!!errors.category}
            helperText={errors.category}
          >
            {categories.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6} component="div">
          <TextField
            required
            id="price"
            name="price"
            label="Price"
            fullWidth
            type="number"
            value={formData.price}
            onChange={handleNumberChange}
            error={!!errors.price}
            helperText={errors.price}
          />
        </Grid>
        <Grid item xs={12} sm={6} component="div">
          <TextField
            required
            id="stock"
            name="stock"
            label="Stock"
            fullWidth
            type="number"
            value={formData.stock}
            onChange={handleNumberChange}
            error={!!errors.stock}
            helperText={errors.stock}
          />
        </Grid>
        <Grid item xs={12} sm={6} component="div">
          <TextField
            id="sku"
            name="sku"
            label="SKU"
            fullWidth
            value={formData.sku}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6} component="div">
          <TextField
            id="hsn"
            name="hsn"
            label="HSN Code"
            fullWidth
            value={formData.hsn}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6} component="div">
          <TextField
            required
            id="unit"
            name="unit"
            label="Unit"
            fullWidth
            select
            value={formData.unit}
            onChange={handleChange}
            error={!!errors.unit}
            helperText={errors.unit}
          >
            {units.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6} component="div">
          <TextField
            id="manufacturer"
            name="manufacturer"
            label="Manufacturer"
            fullWidth
            value={formData.manufacturer}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} component="div">
          <TextField
            id="description"
            name="description"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={formData.description}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} component="div">
          <Typography variant="subtitle1" gutterBottom>Tags</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {formData.tags.map((tag) => (
              <Chip key={tag} label={tag} onDelete={() => handleDeleteTag(tag)} />
            ))}
          </Box>
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              label="Add Tag"
              value={tagInput}
              onChange={handleTagInputChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button variant="outlined" onClick={handleAddTag}>Add</Button>
          </Stack>
        </Grid>
        <Grid item xs={12} component="div">
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={onCancel}>Cancel</Button>
            <Button type="submit" variant="contained">Save Product</Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedProductForm;