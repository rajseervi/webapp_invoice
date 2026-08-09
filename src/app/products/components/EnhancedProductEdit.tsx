'use client';
import React, { useState, useEffect } from 'react';
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
  Chip,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  InputAdornment,
  Autocomplete,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  LinearProgress,
  Avatar
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
  Image as ImageIcon,
  QrCode as QrCodeIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { Product, Category } from '@/types/inventory';
import { productService } from '@/services/productService';

interface EnhancedProductEditProps {
  open: boolean;
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSave: (product: Product) => void;
  onShowSnackbar: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-edit-tabpanel-${index}`}
      aria-labelledby={`product-edit-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const GST_RATES = [0, 5, 12, 18, 28];
const UNITS_OF_MEASUREMENT = [
  'PCS', 'KG', 'GRAM', 'LITER', 'ML', 'METER', 'CM', 'INCH', 'FEET', 'SQ.FT', 'SQ.M', 'BOX', 'PACK', 'SET'
];

export function EnhancedProductEdit({
  open,
  product,
  categories,
  onClose,
  onSave,
  onShowSnackbar
}: EnhancedProductEditProps) {
  
  // State management
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [newTag, setNewTag] = useState('');

  // Initialize form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        tags: product.tags || [],
        dimensions: product.dimensions || { length: 0, width: 0, height: 0 }
      });
    } else {
      // Default values for new product
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
        cessRate: 0,
        isService: false,
        isActive: true,
        reorderPoint: 10,
        maxStockLevel: 1000,
        minStockLevel: 5,
        sku: '',
        brand: '',
        model: '',
        weight: 0,
        dimensions: { length: 0, width: 0, height: 0 },
        tags: []
      });
    }
    setErrors({});
    setCurrentTab(0);
  }, [product, open]);

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

    if (formData.hsnCode && formData.hsnCode.length > 0 && formData.hsnCode.length < 4) {
      newErrors.hsnCode = 'HSN code should be at least 4 digits';
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
      if (product?.id) {
        // Update existing product
        await productService.updateProduct(product.id, formData);
        onSave({ ...product, ...formData } as Product);
        onShowSnackbar('Product updated successfully', 'success');
      } else {
        // Create new product
        const productId = await productService.createProduct(formData as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);
        onSave({ ...formData, id: productId } as Product);
        onShowSnackbar('Product created successfully', 'success');
      }
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      onShowSnackbar('Failed to save product', 'error');
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
  };

  // Handle dimensions change
  const handleDimensionChange = (dimension: 'length' | 'width' | 'height', value: number) => {
    setFormData(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [dimension]: value
      }
    }));
  };

  // Handle tags
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  // Generate SKU
  const generateSku = () => {
    const category = categories.find(c => c.id === formData.categoryId);
    const categoryPrefix = category?.name.substring(0, 3).toUpperCase() || 'PRD';
    const timestamp = Date.now().toString().slice(-6);
    const sku = `${categoryPrefix}-${timestamp}`;
    handleInputChange('sku', sku);
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
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <InventoryIcon />
          </Avatar>
          <Box>
            <Typography variant="h6">
              {product ? 'Edit Product' : 'Create New Product'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {product ? `Editing: ${product.name}` : 'Add a new product to your inventory'}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {loading && <LinearProgress />}
        
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
            <Tab 
              label="Basic Info" 
              icon={<InfoIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Pricing & Stock" 
              icon={<MoneyIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="GST & Tax" 
              icon={<ReceiptIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Advanced" 
              icon={<SettingsIcon />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Basic Information Tab */}
          <TabPanel value={currentTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Fill in the basic product information. Fields marked with * are required.
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

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter product description"
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
                <TextField
                  fullWidth
                  label="Model"
                  value={formData.model || ''}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="Enter model number"
                />
              </Grid>

              <Grid item xs={12} md={12}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    label="SKU"
                    value={formData.sku || ''}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    placeholder="Product SKU"
                  />
                  <Tooltip title="Generate SKU">
                    <IconButton onClick={generateSku} color="primary">
                      <QrCodeIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Product Tags
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {formData.tags?.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          onDelete={() => handleRemoveTag(tag)}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        label="Add Tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        placeholder="Enter tag and press Enter"
                      />
                      <Button
                        variant="outlined"
                        onClick={handleAddTag}
                        startIcon={<AddIcon />}
                        disabled={!newTag.trim()}
                      >
                        Add
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive || false}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    />
                  }
                  label="Active Product"
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Pricing & Stock Tab */}
          <TabPanel value={currentTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Configure pricing, inventory levels, and stock management settings.
                  </Typography>
                </Alert>
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

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Current Stock *"
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

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Reorder Point"
                  type="number"
                  value={formData.reorderPoint || ''}
                  onChange={(e) => handleInputChange('reorderPoint', parseInt(e.target.value) || 0)}
                  helperText="Alert when stock falls below this level"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Max Stock Level"
                  type="number"
                  value={formData.maxStockLevel || ''}
                  onChange={(e) => handleInputChange('maxStockLevel', parseInt(e.target.value) || 0)}
                  helperText="Maximum inventory level"
                />
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Stock Status
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Chip
                        label={`Current: ${formData.quantity || 0} ${formData.unitOfMeasurement || 'PCS'}`}
                        color="primary"
                        icon={<InventoryIcon />}
                      />
                      <Chip
                        label={`Reorder at: ${formData.reorderPoint || 10}`}
                        color="warning"
                        icon={<WarningIcon />}
                      />
                      <Chip
                        label={`Max: ${formData.maxStockLevel || 1000}`}
                        color="info"
                        icon={<CheckCircleIcon />}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Weight"
                  type="number"
                  value={formData.weight || ''}
                  onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">kg</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Dimensions (cm)
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="Length"
                      type="number"
                      size="small"
                      value={formData.dimensions?.length || ''}
                      onChange={(e) => handleDimensionChange('length', parseFloat(e.target.value) || 0)}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="Width"
                      type="number"
                      size="small"
                      value={formData.dimensions?.width || ''}
                      onChange={(e) => handleDimensionChange('width', parseFloat(e.target.value) || 0)}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="Height"
                      type="number"
                      size="small"
                      value={formData.dimensions?.height || ''}
                      onChange={(e) => handleDimensionChange('height', parseFloat(e.target.value) || 0)}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </TabPanel>

          {/* GST & Tax Tab */}
          <TabPanel value={currentTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Configure GST and tax settings for compliance and accurate billing.
                  </Typography>
                </Alert>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="HSN/SAC Code"
                  value={formData.hsnCode || ''}
                  onChange={(e) => handleInputChange('hsnCode', e.target.value)}
                  error={!!errors.hsnCode}
                  helperText={errors.hsnCode || 'HSN for goods, SAC for services'}
                  placeholder="Enter HSN/SAC code"
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

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="CESS Rate"
                  type="number"
                  value={formData.cessRate || ''}
                  onChange={(e) => handleInputChange('cessRate', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                  }}
                  helperText="Additional CESS if applicable"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isService || false}
                        onChange={(e) => handleInputChange('isService', e.target.checked)}
                      />
                    }
                    label="This is a Service"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.gstExempt || false}
                        onChange={(e) => handleInputChange('gstExempt', e.target.checked)}
                      />
                    }
                    label="GST Exempt"
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Tax Calculation Preview
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="text.secondary">Base Price</Typography>
                        <Typography variant="h6">₹{(formData.price || 0).toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="text.secondary">GST Amount</Typography>
                        <Typography variant="h6">
                          ₹{((formData.price || 0) * (formData.gstRate || 0) / 100).toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="text.secondary">CESS Amount</Typography>
                        <Typography variant="h6">
                          ₹{((formData.price || 0) * (formData.cessRate || 0) / 100).toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="text.secondary">Total with Tax</Typography>
                        <Typography variant="h6" color="primary">
                          ₹{((formData.price || 0) * (1 + (formData.gstRate || 0) / 100 + (formData.cessRate || 0) / 100)).toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Advanced Tab */}
          <TabPanel value={currentTab} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Advanced settings and additional product information.
                  </Typography>
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Product Summary
                </Typography>
                <Card variant="outlined">
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <List dense>
                          <ListItem>
                            <ListItemIcon><InfoIcon /></ListItemIcon>
                            <ListItemText 
                              primary="Product Name" 
                              secondary={formData.name || 'Not specified'} 
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon><CategoryIcon /></ListItemIcon>
                            <ListItemText 
                              primary="Category" 
                              secondary={getCategoryName(formData.categoryId || '')} 
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon><MoneyIcon /></ListItemIcon>
                            <ListItemText 
                              primary="Price" 
                              secondary={`₹${(formData.price || 0).toFixed(2)} per ${formData.unitOfMeasurement || 'unit'}`} 
                            />
                          </ListItem>
                        </List>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <List dense>
                          <ListItem>
                            <ListItemIcon><InventoryIcon /></ListItemIcon>
                            <ListItemText 
                              primary="Stock Quantity" 
                              secondary={`${formData.quantity || 0} ${formData.unitOfMeasurement || 'units'}`} 
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon><ReceiptIcon /></ListItemIcon>
                            <ListItemText 
                              primary="GST Rate" 
                              secondary={`${formData.gstRate || 0}%${formData.gstExempt ? ' (Exempt)' : ''}`} 
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon><CheckCircleIcon /></ListItemIcon>
                            <ListItemText 
                              primary="Status" 
                              secondary={formData.isActive ? 'Active' : 'Inactive'} 
                            />
                          </ListItem>
                        </List>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {Object.keys(errors).length > 0 && (
                <Grid item xs={12}>
                  <Alert severity="error">
                    <Typography variant="body2" fontWeight="medium">
                      Please fix the following errors:
                    </Typography>
                    <List dense>
                      {Object.entries(errors).map(([field, error]) => (
                        <ListItem key={field}>
                          <ListItemText primary={error} />
                        </ListItem>
                      ))}
                    </List>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </TabPanel>
        </Box>
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
          startIcon={<SaveIcon />}
          disabled={loading}
          size="large"
        >
          {loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}