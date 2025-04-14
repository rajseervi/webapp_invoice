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
} from '@mui/material';
import { Product, Category } from '@/types/inventory';
import { categoryService } from '@/services/categoryService';

interface ProductFormProps {
  initialData?: Partial<Product>;
  onSubmit: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  mode?: 'create' | 'edit';
  loading?: boolean;
  error?: string | null;
}

export default function ProductForm({ initialData, onSubmit, onCancel, mode = 'create', loading = false, error = null }: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = React.useState<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>({
    name: initialData?.name || '',
    sku: initialData?.sku || '',
    categoryId: initialData?.categoryId || '',
    price: initialData?.price || 0,
    quantity: initialData?.quantity || 0,
    description: initialData?.description || '',
    reorderPoint: initialData?.reorderPoint || 0,
    isActive: initialData?.isActive ?? true,
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

  return (
    <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4 }}>
      {error && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="SKU"
            required
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
          <TextField
            fullWidth
            type="number"
            label="Price"
            required
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            InputProps={{ inputProps: { min: 0 } }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Quantity"
            required
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
            InputProps={{ inputProps: { min: 0 } }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Reorder Point"
            required
            value={formData.reorderPoint}
            onChange={(e) => setFormData({ ...formData, reorderPoint: Number(e.target.value) })}
            InputProps={{ inputProps: { min: 0 } }}
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
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
            }
            label="Active"
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button variant="contained" type="submit" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : mode === 'edit' ? 'Update' : 'Save'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}