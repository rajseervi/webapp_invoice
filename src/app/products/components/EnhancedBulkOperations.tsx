'use client';
import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  LinearProgress,
  Divider,
  Switch,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  SelectAll as SelectAllIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { Product, Category } from '@/types/inventory';
import { productService } from '@/services/productService';

interface BulkOperationsProps {
  selectedProducts: string[];
  products: Product[];
  categories: Category[];
  onUpdate: (updateData: any) => Promise<void>;
  onClose: () => void;
}

interface BulkUpdateData {
  categoryId?: string;
  priceAdjustment?: {
    type: 'percentage' | 'fixed';
    operation: 'increase' | 'decrease';
    value: number;
  };
  gstRate?: number;
  isActive?: boolean;
  reorderPoint?: number;
  stockAdjustment?: {
    type: 'set' | 'adjust';
    value: number;
  };
}

const steps = [
  'Select Products',
  'Choose Operations',
  'Review Changes',
  'Execute'
];

export default function EnhancedBulkOperations({
  selectedProducts,
  products,
  categories,
  onUpdate,
  onClose
}: BulkOperationsProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Selection and filtering
  const [localSelectedProducts, setLocalSelectedProducts] = useState<string[]>(selectedProducts);
  const [filterCriteria, setFilterCriteria] = useState({
    category: '',
    status: 'all',
    priceRange: { min: '', max: '' },
    stockRange: { min: '', max: '' },
    gstRate: ''
  });

  // Bulk update data
  const [updateData, setUpdateData] = useState<BulkUpdateData>({});
  const [operationsToPerform, setOperationsToPerform] = useState({
    updateCategory: false,
    adjustPrice: false,
    updateGST: false,
    updateStatus: false,
    updateReorderPoint: false,
    adjustStock: false
  });

  // Get filtered products for selection
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (filterCriteria.category) {
      filtered = filtered.filter(p => p.categoryId === filterCriteria.category);
    }

    if (filterCriteria.status !== 'all') {
      switch (filterCriteria.status) {
        case 'active':
          filtered = filtered.filter(p => p.isActive);
          break;
        case 'inactive':
          filtered = filtered.filter(p => !p.isActive);
          break;
        case 'low-stock':
          filtered = filtered.filter(p => p.quantity < (p.reorderPoint || 10));
          break;
        case 'out-of-stock':
          filtered = filtered.filter(p => p.quantity === 0);
          break;
      }
    }

    if (filterCriteria.priceRange.min) {
      filtered = filtered.filter(p => p.price >= parseFloat(filterCriteria.priceRange.min));
    }

    if (filterCriteria.priceRange.max) {
      filtered = filtered.filter(p => p.price <= parseFloat(filterCriteria.priceRange.max));
    }

    if (filterCriteria.stockRange.min) {
      filtered = filtered.filter(p => p.quantity >= parseInt(filterCriteria.stockRange.min));
    }

    if (filterCriteria.stockRange.max) {
      filtered = filtered.filter(p => p.quantity <= parseInt(filterCriteria.stockRange.max));
    }

    if (filterCriteria.gstRate) {
      filtered = filtered.filter(p => p.gstRate === parseInt(filterCriteria.gstRate));
    }

    return filtered;
  }, [products, filterCriteria]);

  // Get selected product details
  const selectedProductDetails = useMemo(() => {
    return products.filter(p => localSelectedProducts.includes(p.id!));
  }, [products, localSelectedProducts]);

  // Calculate impact of changes
  const changeImpact = useMemo(() => {
    let totalPriceChange = 0;
    let affectedProducts = 0;

    selectedProductDetails.forEach(product => {
      if (operationsToPerform.adjustPrice && updateData.priceAdjustment) {
        const { type, operation, value } = updateData.priceAdjustment;
        let newPrice = product.price;
        
        if (type === 'percentage') {
          const adjustment = (product.price * value) / 100;
          newPrice = operation === 'increase' ? product.price + adjustment : product.price - adjustment;
        } else {
          newPrice = operation === 'increase' ? product.price + value : product.price - value;
        }
        
        totalPriceChange += (newPrice - product.price) * product.quantity;
        affectedProducts++;
      }
    });

    return {
      totalPriceChange,
      affectedProducts,
      totalProducts: selectedProductDetails.length
    };
  }, [selectedProductDetails, operationsToPerform, updateData]);

  const handleSelectAll = () => {
    if (localSelectedProducts.length === filteredProducts.length) {
      setLocalSelectedProducts([]);
    } else {
      setLocalSelectedProducts(filteredProducts.map(p => p.id!));
    }
  };

  const handleProductSelect = (productId: string) => {
    setLocalSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleExecute = async () => {
    setLoading(true);
    setProgress(0);

    try {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      await onUpdate({
        productIds: localSelectedProducts,
        operations: operationsToPerform,
        data: updateData
      });

      setProgress(100);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError('Failed to execute bulk operations');
      console.error('Bulk operation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Products for Bulk Operations
            </Typography>
            
            {/* Filter Controls */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Filter Products
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={filterCriteria.category}
                        onChange={(e) => setFilterCriteria(prev => ({ ...prev, category: e.target.value }))}
                        label="Category"
                      >
                        <MenuItem value="">All Categories</MenuItem>
                        {categories.map(cat => (
                          <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filterCriteria.status}
                        onChange={(e) => setFilterCriteria(prev => ({ ...prev, status: e.target.value }))}
                        label="Status"
                      >
                        <MenuItem value="all">All Status</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                        <MenuItem value="low-stock">Low Stock</MenuItem>
                        <MenuItem value="out-of-stock">Out of Stock</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Min Price"
                      type="number"
                      value={filterCriteria.priceRange.min}
                      onChange={(e) => setFilterCriteria(prev => ({
                        ...prev,
                        priceRange: { ...prev.priceRange, min: e.target.value }
                      }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Max Price"
                      type="number"
                      value={filterCriteria.priceRange.max}
                      onChange={(e) => setFilterCriteria(prev => ({
                        ...prev,
                        priceRange: { ...prev.priceRange, max: e.target.value }
                      }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>
                      }}
                    />
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    startIcon={<SelectAllIcon />}
                    onClick={handleSelectAll}
                    size="small"
                  >
                    {localSelectedProducts.length === filteredProducts.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button
                    startIcon={<ClearIcon />}
                    onClick={() => setFilterCriteria({
                      category: '',
                      status: 'all',
                      priceRange: { min: '', max: '' },
                      stockRange: { min: '', max: '' },
                      gstRate: ''
                    })}
                    size="small"
                  >
                    Clear Filters
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Product Selection Table */}
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={localSelectedProducts.length > 0 && localSelectedProducts.length < filteredProducts.length}
                        checked={filteredProducts.length > 0 && localSelectedProducts.length === filteredProducts.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProducts.slice(0, 10).map(product => {
                    const category = categories.find(c => c.id === product.categoryId);
                    return (
                      <TableRow key={product.id}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={localSelectedProducts.includes(product.id!)}
                            onChange={() => handleProductSelect(product.id!)}
                          />
                        </TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{category?.name || 'N/A'}</TableCell>
                        <TableCell>₹{product.price}</TableCell>
                        <TableCell>{product.quantity}</TableCell>
                        <TableCell>
                          <Chip
                            label={product.isActive ? 'Active' : 'Inactive'}
                            color={product.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            
            {filteredProducts.length > 10 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Showing first 10 of {filteredProducts.length} products
              </Typography>
            )}
            
            <Typography variant="body2" sx={{ mt: 2 }}>
              Selected: {localSelectedProducts.length} products
            </Typography>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose Operations to Perform
            </Typography>
            
            <Grid container spacing={3}>
              {/* Category Update */}
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={operationsToPerform.updateCategory}
                          onChange={(e) => setOperationsToPerform(prev => ({
                            ...prev,
                            updateCategory: e.target.checked
                          }))}
                        />
                      }
                      label="Update Category"
                    />
                  </AccordionSummary>
                  <AccordionDetails>
                    <FormControl fullWidth>
                      <InputLabel>New Category</InputLabel>
                      <Select
                        value={updateData.categoryId || ''}
                        onChange={(e) => setUpdateData(prev => ({ ...prev, categoryId: e.target.value }))}
                        label="New Category"
                        disabled={!operationsToPerform.updateCategory}
                      >
                        {categories.map(cat => (
                          <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Price Adjustment */}
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={operationsToPerform.adjustPrice}
                          onChange={(e) => setOperationsToPerform(prev => ({
                            ...prev,
                            adjustPrice: e.target.checked
                          }))}
                        />
                      }
                      label="Adjust Prices"
                    />
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                          <InputLabel>Adjustment Type</InputLabel>
                          <Select
                            value={updateData.priceAdjustment?.type || 'percentage'}
                            onChange={(e) => setUpdateData(prev => ({
                              ...prev,
                              priceAdjustment: {
                                ...prev.priceAdjustment,
                                type: e.target.value as 'percentage' | 'fixed'
                              }
                            }))}
                            label="Adjustment Type"
                            disabled={!operationsToPerform.adjustPrice}
                          >
                            <MenuItem value="percentage">Percentage</MenuItem>
                            <MenuItem value="fixed">Fixed Amount</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                          <InputLabel>Operation</InputLabel>
                          <Select
                            value={updateData.priceAdjustment?.operation || 'increase'}
                            onChange={(e) => setUpdateData(prev => ({
                              ...prev,
                              priceAdjustment: {
                                ...prev.priceAdjustment,
                                operation: e.target.value as 'increase' | 'decrease'
                              }
                            }))}
                            label="Operation"
                            disabled={!operationsToPerform.adjustPrice}
                          >
                            <MenuItem value="increase">Increase</MenuItem>
                            <MenuItem value="decrease">Decrease</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Value"
                          type="number"
                          value={updateData.priceAdjustment?.value || ''}
                          onChange={(e) => setUpdateData(prev => ({
                            ...prev,
                            priceAdjustment: {
                              ...prev.priceAdjustment,
                              value: parseFloat(e.target.value) || 0
                            }
                          }))}
                          disabled={!operationsToPerform.adjustPrice}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                {updateData.priceAdjustment?.type === 'percentage' ? '%' : '₹'}
                              </InputAdornment>
                            )
                          }}
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* GST Rate Update */}
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={operationsToPerform.updateGST}
                          onChange={(e) => setOperationsToPerform(prev => ({
                            ...prev,
                            updateGST: e.target.checked
                          }))}
                        />
                      }
                      label="Update GST Rate"
                    />
                  </AccordionSummary>
                  <AccordionDetails>
                    <FormControl fullWidth>
                      <InputLabel>GST Rate</InputLabel>
                      <Select
                        value={updateData.gstRate || ''}
                        onChange={(e) => setUpdateData(prev => ({ ...prev, gstRate: e.target.value as number }))}
                        label="GST Rate"
                        disabled={!operationsToPerform.updateGST}
                      >
                        <MenuItem value={0}>0%</MenuItem>
                        <MenuItem value={5}>5%</MenuItem>
                        <MenuItem value={12}>12%</MenuItem>
                        <MenuItem value={18}>18%</MenuItem>
                        <MenuItem value={28}>28%</MenuItem>
                      </Select>
                    </FormControl>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Status Update */}
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={operationsToPerform.updateStatus}
                          onChange={(e) => setOperationsToPerform(prev => ({
                            ...prev,
                            updateStatus: e.target.checked
                          }))}
                        />
                      }
                      label="Update Status"
                    />
                  </AccordionSummary>
                  <AccordionDetails>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={updateData.isActive || false}
                          onChange={(e) => setUpdateData(prev => ({ ...prev, isActive: e.target.checked }))}
                          disabled={!operationsToPerform.updateStatus}
                        />
                      }
                      label={updateData.isActive ? 'Active' : 'Inactive'}
                    />
                  </AccordionDetails>
                </Accordion>
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Changes
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Impact Summary
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <InventoryIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Products Affected"
                          secondary={`${localSelectedProducts.length} products`}
                        />
                      </ListItem>
                      {operationsToPerform.adjustPrice && (
                        <ListItem>
                          <ListItemIcon>
                            <MoneyIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Total Value Change"
                            secondary={`₹${changeImpact.totalPriceChange.toFixed(2)}`}
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Operations to Perform
                    </Typography>
                    <List dense>
                      {operationsToPerform.updateCategory && (
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircleIcon color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Update Category"
                            secondary={categories.find(c => c.id === updateData.categoryId)?.name}
                          />
                        </ListItem>
                      )}
                      {operationsToPerform.adjustPrice && (
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircleIcon color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Adjust Prices"
                            secondary={`${updateData.priceAdjustment?.operation} by ${updateData.priceAdjustment?.value}${updateData.priceAdjustment?.type === 'percentage' ? '%' : '₹'}`}
                          />
                        </ListItem>
                      )}
                      {operationsToPerform.updateGST && (
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircleIcon color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Update GST Rate"
                            secondary={`${updateData.gstRate}%`}
                          />
                        </ListItem>
                      )}
                      {operationsToPerform.updateStatus && (
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircleIcon color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Update Status"
                            secondary={updateData.isActive ? 'Active' : 'Inactive'}
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Alert severity="warning" sx={{ mt: 2 }}>
              These changes cannot be undone. Please review carefully before proceeding.
            </Alert>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Executing Bulk Operations
            </Typography>
            
            {loading && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress variant="determinate" value={progress} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Progress: {progress}%
                </Typography>
              </Box>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {progress === 100 && (
              <Alert severity="success">
                Bulk operations completed successfully!
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Stepper activeStep={activeStep} orientation={isMobile ? 'vertical' : 'horizontal'}>
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
            {isMobile && (
              <StepContent>
                {renderStepContent(index)}
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    onClick={index === steps.length - 1 ? handleExecute : handleNext}
                    sx={{ mt: 1, mr: 1 }}
                    disabled={loading || (index === 0 && localSelectedProducts.length === 0)}
                  >
                    {index === steps.length - 1 ? 'Execute' : 'Continue'}
                  </Button>
                  <Button
                    disabled={index === 0 || loading}
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Back
                  </Button>
                </Box>
              </StepContent>
            )}
          </Step>
        ))}
      </Stepper>

      {!isMobile && (
        <Box sx={{ mt: 3 }}>
          {renderStepContent(activeStep)}
          
          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
            <Button
              color="inherit"
              disabled={activeStep === 0 || loading}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
            <Box sx={{ flex: '1 1 auto' }} />
            <Button
              variant="contained"
              onClick={activeStep === steps.length - 1 ? handleExecute : handleNext}
              disabled={loading || (activeStep === 0 && localSelectedProducts.length === 0)}
            >
              {activeStep === steps.length - 1 ? 'Execute' : 'Next'}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}