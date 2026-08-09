'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Autocomplete,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  Alert,
  Slider,
  InputAdornment
} from '@mui/material';
import {
  Palette as PaletteIcon,
  Info as InfoIcon,
  Category as CategoryIcon,
  Percent as PercentIcon,
  Tag as TagIcon
} from '@mui/icons-material';
import { Category } from '@/types/inventory';
import { categoryService } from '@/services/categoryService';

interface NewCategoryFormProps {
  data: Partial<Category>;
  onChange: (data: Partial<Category>) => void;
  currentStep: number;
}

const PREDEFINED_COLORS = [
  '#1976d2', '#dc004e', '#9c27b0', '#673ab7', '#3f51b5',
  '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
  '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
  '#ff5722', '#795548', '#607d8b', '#e91e63', '#f44336'
];

const PREDEFINED_ICONS = [
  'category', 'inventory', 'shopping_cart', 'store', 'local_grocery_store',
  'restaurant', 'computer', 'phone_android', 'home', 'directions_car',
  'sports_esports', 'book', 'music_note', 'movie', 'fitness_center',
  'local_hospital', 'school', 'work', 'beach_access', 'pets'
];

const COMMON_TAGS = [
  'Electronics', 'Food & Beverages', 'Clothing & Fashion', 'Books & Media',
  'Home & Garden', 'Sports & Fitness', 'Automotive', 'Health & Beauty',
  'Toys & Games', 'Office Supplies', 'Pet Supplies', 'Jewelry & Accessories',
  'Tools & Hardware', 'Music & Instruments', 'Art & Crafts'
];

export default function NewCategoryForm({ data, onChange, currentStep }: NewCategoryFormProps) {
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadParentCategories();
  }, []);

  const loadParentCategories = async () => {
    try {
      setLoading(true);
      const categories = await categoryService.getCategories({ includeInactive: false });
      setParentCategories(categories);
    } catch (error) {
      console.error('Error loading parent categories:', error);
    } finally {
      setLoading(false);
    }
  };

  
  const handleChange = (field: keyof Category, value: any) => {
    onChange({ ...data, [field]: value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!data.name?.trim()) {
        newErrors.name = 'Category name is required';
      }
    }

    if (step === 2) {
      if (data.defaultDiscount && (data.defaultDiscount < 0 || data.defaultDiscount > 100)) {
        newErrors.defaultDiscount = 'Discount must be between 0 and 100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  const renderBasicInformation = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <CategoryIcon color="primary" />
        Basic Information
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Category Name"
            required
            value={data.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            error={!!errors.name}
            helperText={errors.name || 'Enter a unique name for your category'}
            placeholder="e.g., Electronics, Clothing, Food Items"
                      />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={data.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Describe what products belong to this category..."
            helperText="Optional: Provide a detailed description to help users understand this category"
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Parent Category</InputLabel>
            <Select
              value={data.parentId || ''}
              onChange={(e) => handleChange('parentId', e.target.value || null)}
              label="Parent Category"
            >
              <MenuItem value="">
                <em>None (Root Category)</em>
              </MenuItem>
              {parentCategories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        bgcolor: category.color,
                        fontSize: '12px'
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: '12px' }}>
                        {category.icon}
                      </span>
                    </Avatar>
                    {category.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TagIcon />
            Tags
          </Typography>
          <Autocomplete
            multiple
            freeSolo
            options={COMMON_TAGS}
            value={data.tags || []}
            onChange={(_, newValue) => handleChange('tags', newValue)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option}
                  {...getTagProps({ index })}
                  key={option}
                  size="small"
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Add tags to help organize and search categories"
                helperText="Press Enter to add custom tags or select from suggestions"
              />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderVisualDesign = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <PaletteIcon color="primary" />
        Visual Design
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>
            Category Color
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {PREDEFINED_COLORS.map((color) => (
                <Box
                  key={color}
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: color,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: data.color === color ? '3px solid #000' : '2px solid #e0e0e0',
                    transition: 'all 0.2s ease',
                    '&:hover': { 
                      transform: 'scale(1.1)',
                      boxShadow: 2
                    }
                  }}
                  onClick={() => handleChange('color', color)}
                />
              ))}
            </Box>
            <TextField
              fullWidth
              label="Custom Color"
              type="color"
              value={data.color || '#1976d2'}
              onChange={(e) => handleChange('color', e.target.value)}
              size="small"
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>
            Category Icon
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Icon</InputLabel>
            <Select
              value={data.icon || 'category'}
              onChange={(e) => handleChange('icon', e.target.value)}
              label="Icon"
            >
              {PREDEFINED_ICONS.map((icon) => (
                <MenuItem key={icon} value={icon}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span className="material-icons">{icon}</span>
                    <Typography sx={{ textTransform: 'capitalize' }}>
                      {icon.replace(/_/g, ' ')}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" gutterBottom>
              Preview
            </Typography>
            <Avatar
              sx={{
                bgcolor: data.color || '#1976d2',
                width: 64,
                height: 64,
                mx: 'auto',
                mb: 1,
                fontSize: '24px'
              }}
            >
              <span className="material-icons" style={{ fontSize: '24px' }}>
                {data.icon || 'category'}
              </span>
            </Avatar>
            <Typography variant="h6">
              {data.name || 'Category Name'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {data.description || 'Category description will appear here'}
            </Typography>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderSettingsAndPreview = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <PercentIcon color="primary" />
        Settings & Configuration
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Default Discount (%)"
            value={data.defaultDiscount || ''}
            onChange={(e) => handleChange('defaultDiscount', Number(e.target.value) || 0)}
            InputProps={{ 
              inputProps: { min: 0, max: 100, step: 0.1 },
              endAdornment: <InputAdornment position="end">%</InputAdornment>
            }}
            error={!!errors.defaultDiscount}
            helperText={errors.defaultDiscount || 'Applied to new products in this category'}
          />
        </Grid>

        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Sort Order"
            value={data.sortOrder || 0}
            onChange={(e) => handleChange('sortOrder', Number(e.target.value) || 0)}
            helperText="Lower numbers appear first in lists"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={data.isActive !== false}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                color="primary"
              />
            }
            label="Active Category"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Inactive categories are hidden from product forms
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Ready to Create Category
            </Typography>
            <Typography variant="body2">
              Review your category settings above. Once created, you can always edit these settings later.
              The category will be immediately available for use with your products.
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );

  // Validate current step
  useEffect(() => {
    validateStep(currentStep);
  }, [data, currentStep]);

  switch (currentStep) {
    case 0:
      return renderBasicInformation();
    case 1:
      return renderVisualDesign();
    case 2:
      return renderSettingsAndPreview();
    default:
      return null;
  }
}