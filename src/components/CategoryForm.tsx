'use client';
import React, { useState, useEffect } from 'react';
import {
  Paper,
  Grid,
  TextField,
  Button,
  Box,
  Switch,
  FormControlLabel,
  Typography,
  Autocomplete,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  ColorLens as ColorIcon,
  Category as CategoryIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Inventory as InventoryIcon,
  Discount as DiscountIcon,
  Sort as SortIcon,
  Label as LabelIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import { Category } from '@/types/inventory';
import { categoryService } from '@/services/categoryService';

interface CategoryFormProps {
  initialData?: Partial<Category>;
  onSubmit: (data: Omit<Category, 'id'>) => void;
  onCancel: () => void;
  loading?: boolean;
}

const PREDEFINED_COLORS = [
  '#2563EB', '#EF4444', '#8B5CF6', '#F59E0B', '#10B981',
  '#06B6D4', '#EC4899', '#6366F1', '#F97316', '#14B8A6',
  '#3B82F6', '#D946EF', '#0EA5E9', '#84CC16', '#E11D48',
  '#7C3AED', '#059669', '#DC2626', '#4F46E5', '#EA580C',
];

const COMMON_TAGS = [
  'Electronics', 'Food', 'Clothing', 'Books', 'Home & Garden',
  'Sports', 'Automotive', 'Health', 'Beauty', 'Toys',
  'Office Supplies', 'Pet Supplies', 'Jewelry', 'Tools', 'Music',
];

export default function CategoryForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}: CategoryFormProps) {
  const [formData, setFormData] = useState<Omit<Category, 'id'>>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    parentId: initialData?.parentId,
    isActive: initialData?.isActive ?? true,
    sortOrder: initialData?.sortOrder || 0,
    defaultDiscount: initialData?.defaultDiscount || 0,
    color: initialData?.color || '#2563EB',
    icon: initialData?.icon || 'category',
    tags: initialData?.tags || [],
    createdAt: initialData?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingData, setLoadingData] = useState(false);
  const [customColor, setCustomColor] = useState(formData.color || '#2563EB');

  useEffect(() => {
    loadParentCategories();
  }, []);

  const loadParentCategories = async () => {
    try {
      setLoadingData(true);
      const categories = await categoryService.getCategories({ includeInactive: false });
      const filteredCategories = initialData?.id
        ? categories.filter(cat => cat.id !== initialData.id)
        : categories;
      setParentCategories(filteredCategories);
    } catch (error) {
      console.error('Error loading parent categories:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Category name is required';
    if (formData.defaultDiscount < 0 || formData.defaultDiscount > 100)
      newErrors.defaultDiscount = 'Discount must be between 0 and 100';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) onSubmit(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 800, mx: 'auto', p: { xs: 1.5, sm: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 3,
          p: 2.5,
          borderRadius: 3,
          border: '2.5px solid #1E293B',
          bgcolor: '#fff',
          boxShadow: '4px 4px 0 #1E293B',
        }}
      >
        <Avatar
          sx={{
            width: 52,
            height: 52,
            bgcolor: formData.color || '#2563EB',
            border: '3px solid #1E293B',
            fontSize: '1.4rem',
            fontWeight: 800,
          }}
        >
          {(formData.name || 'C').charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={800} color="#1E293B" lineHeight={1.2}>
            {initialData?.id ? `Edit: ${initialData.name}` : 'New Category'}
          </Typography>
          <Typography variant="body2" fontWeight={600} color="#64748B">
            {initialData?.id ? 'Update details and settings' : 'Create a new product category'}
          </Typography>
        </Box>
        <Chip
          label={formData.isActive ? 'ACTIVE' : 'INACTIVE'}
          size="small"
          sx={{
            bgcolor: formData.isActive ? '#10B981' : '#EF4444',
            color: '#fff',
            fontWeight: 800,
            borderRadius: 1.5,
            border: '2px solid #1E293B',
            fontSize: '0.65rem',
            height: 24,
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Name & Parent */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: '2px solid #E2E8F0',
            boxShadow: '3px 3px 0 #E2E8F0',
            bgcolor: '#fff',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CategoryIcon sx={{ color: formData.color }} />
            <Typography variant="subtitle2" fontWeight={800} color="#1E293B">
              BASIC INFO
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <TextField
              fullWidth
              label="Category Name *"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              error={!!errors.name}
              helperText={errors.name}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  border: '2px solid #E2E8F0',
                  '&:hover': { borderColor: '#94A3B8' },
                  '&.Mui-focused': { borderColor: formData.color || '#2563EB' },
                },
              }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Parent (optional)</InputLabel>
              <Select
                value={formData.parentId || ''}
                onChange={e => setFormData({ ...formData, parentId: e.target.value || undefined })}
                label="Parent (optional)"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">None (Root)</MenuItem>
                {parentCategories.map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Description */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: '2px solid #E2E8F0',
            boxShadow: '3px 3px 0 #E2E8F0',
            bgcolor: '#fff',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <InfoIcon sx={{ color: formData.color }} />
            <Typography variant="subtitle2" fontWeight={800} color="#1E293B">
              DESCRIPTION
            </Typography>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Describe what products belong to this category..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                border: '2px solid #E2E8F0',
                '&:hover': { borderColor: '#94A3B8' },
                '&.Mui-focused': { borderColor: formData.color || '#2563EB' },
              },
            }}
          />
        </Paper>

        {/* Color & Tags */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: '2px solid #E2E8F0',
            boxShadow: '3px 3px 0 #E2E8F0',
            bgcolor: '#fff',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PaletteIcon sx={{ color: formData.color }} />
            <Typography variant="subtitle2" fontWeight={800} color="#1E293B">
              COLOR
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {PREDEFINED_COLORS.map(color => (
              <Box
                key={color}
                onClick={() => {
                  setFormData({ ...formData, color });
                  setCustomColor(color);
                }}
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: color,
                  borderRadius: 2,
                  cursor: 'pointer',
                  border: formData.color === color ? '3px solid #1E293B' : '2px solid transparent',
                  boxShadow: formData.color === color ? '2px 2px 0 #1E293B' : 'none',
                  transform: formData.color === color ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                  '&:hover': { transform: 'scale(1.15)' },
                }}
              />
            ))}
            <Box
              onClick={() => {
                const input = document.getElementById('custom-color-input');
                input?.click();
              }}
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                border: '2px dashed #CBD5E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                bgcolor: customColor && !PREDEFINED_COLORS.includes(customColor) ? customColor : 'transparent',
                '&:hover': { borderColor: '#94A3B8' },
              }}
            >
              <AddIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
            </Box>
            <input
              id="custom-color-input"
              type="color"
              value={customColor}
              onChange={e => {
                setCustomColor(e.target.value);
                setFormData({ ...formData, color: e.target.value });
              }}
              style={{ display: 'none' }}
            />
          </Box>
        </Paper>

        {/* Settings */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: '2px solid #E2E8F0',
            boxShadow: '3px 3px 0 #E2E8F0',
            bgcolor: '#fff',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <SettingsIcon sx={{ color: formData.color }} />
            <Typography variant="subtitle2" fontWeight={800} color="#1E293B">
              SETTINGS
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'flex-start' }}>
            <TextField
              type="number"
              label="Default Discount %"
              value={formData.defaultDiscount}
              onChange={e => setFormData({ ...formData, defaultDiscount: Number(e.target.value) })}
              InputProps={{
                startAdornment: <DiscountIcon sx={{ mr: 0.5, color: '#64748B', fontSize: 18 }} />,
                inputProps: { min: 0, max: 100, step: 0.1 },
              }}
              error={!!errors.defaultDiscount}
              helperText={errors.defaultDiscount || 'Applied to new products'}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
              }}
            />
            <TextField
              type="number"
              label="Sort Order"
              value={formData.sortOrder}
              onChange={e => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
              InputProps={{
                startAdornment: <SortIcon sx={{ mr: 0.5, color: '#64748B', fontSize: 18 }} />,
              }}
              helperText="Lower = first"
              sx={{
                width: { xs: '100%', sm: 150 },
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" fontWeight={700} color={formData.isActive ? '#10B981' : '#EF4444'}>
                  {formData.isActive ? 'ACTIVE' : 'INACTIVE'}
                </Typography>
              }
            />
          </Box>
        </Paper>

        {/* Tags */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: '2px solid #E2E8F0',
            boxShadow: '3px 3px 0 #E2E8F0',
            bgcolor: '#fff',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <LabelIcon sx={{ color: formData.color }} />
            <Typography variant="subtitle2" fontWeight={800} color="#1E293B">
              TAGS
            </Typography>
          </Box>
          <Autocomplete
            multiple
            freeSolo
            options={COMMON_TAGS}
            value={formData.tags || []}
            onChange={(_, newValue) => setFormData({ ...formData, tags: newValue })}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="filled"
                  label={option}
                  {...getTagProps({ index })}
                  key={option}
                  sx={{
                    bgcolor: alpha(formData.color || '#2563EB', 0.12),
                    color: formData.color || '#1E293B',
                    fontWeight: 700,
                    borderRadius: 1.5,
                    border: '2px solid',
                    borderColor: alpha(formData.color || '#2563EB', 0.3),
                    mr: 1,
                    mb: 1,
                  }}
                />
              ))
            }
            renderInput={params => (
              <TextField
                {...params}
                placeholder="Add tags..."
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 2 },
                }}
              />
            )}
          />
        </Paper>

        {/* Stats (edit mode only) */}
        {initialData?.metadata && (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {[
              { label: 'Products', value: initialData.metadata.totalProducts || 0, icon: <InventoryIcon />, color: '#2563EB' },
              { label: 'Total Value', value: `₹${((initialData.metadata.totalValue || 0) / 1000).toFixed(1)}K`, icon: <SaveIcon />, color: '#F59E0B' },
              { label: 'Avg Price', value: `₹${(initialData.metadata.averagePrice || 0).toLocaleString()}`, icon: <DiscountIcon />, color: '#10B981' },
            ].map(stat => (
              <Paper
                key={stat.label}
                variant="outlined"
                sx={{
                  flex: 1,
                  minWidth: 120,
                  p: 2,
                  borderRadius: 2.5,
                  border: '2px solid #E2E8F0',
                  boxShadow: '2px 2px 0 #E2E8F0',
                  bgcolor: '#fff',
                  textAlign: 'center',
                }}
              >
                <Box sx={{ color: stat.color, mb: 0.5 }}>{stat.icon}</Box>
                <Typography variant="h6" fontWeight={800} color="#1E293B">
                  {stat.value}
                </Typography>
                <Typography variant="caption" fontWeight={600} color="#64748B">
                  {stat.label}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}

        {/* Actions */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            pt: 1,
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="body2" fontWeight={600} color="#64748B">
            {initialData?.id ? 'Updating existing category' : 'Creating new category'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
              startIcon={<CloseIcon />}
              sx={{
                borderRadius: 2,
                border: '2px solid #E2E8F0',
                color: '#64748B',
                fontWeight: 700,
                textTransform: 'none',
                px: 3,
                '&:hover': { borderColor: '#94A3B8', bgcolor: '#F8FAFC' },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              type="submit"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : initialData?.id ? <EditIcon /> : <AddIcon />}
              sx={{
                borderRadius: 2,
                border: '2.5px solid #1E293B',
                bgcolor: formData.color || '#2563EB',
                color: '#fff',
                fontWeight: 800,
                textTransform: 'none',
                px: 4,
                boxShadow: '3px 3px 0 #1E293B',
                '&:hover': {
                  bgcolor: formData.color || '#1D4ED8',
                  boxShadow: '2px 2px 0 #1E293B',
                  transform: 'translate(1px, 1px)',
                },
                '&:active': {
                  boxShadow: 'none',
                  transform: 'translate(3px, 3px)',
                },
                transition: 'all 0.1s ease',
              }}
            >
              {loading ? 'Saving...' : initialData?.id ? 'Update Category' : 'Create Category'}
            </Button>
          </Box>
        </Box>

        {/* Error summary */}
        {Object.keys(errors).length > 0 && (
          <Alert
            severity="error"
            sx={{
              borderRadius: 2.5,
              border: '2px solid #EF4444',
              bgcolor: '#FEF2F2',
              fontWeight: 600,
            }}
          >
            {Object.entries(errors).map(([_, error]) => (
              <Typography key={_} variant="body2" fontWeight={600}>
                • {error}
              </Typography>
            ))}
          </Alert>
        )}
      </Box>
    </Box>
  );
}
