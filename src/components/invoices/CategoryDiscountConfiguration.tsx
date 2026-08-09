import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Category as CategoryIcon,
  LocalOffer as DiscountIcon,
  Info as InfoIcon,
  AddCircle as AddCircleIcon,
  EditNote as EditNoteIcon,
} from '@mui/icons-material';
import { Category } from '@/types/inventory';
import { Party } from '@/types/party';

interface CategoryDiscountRule {
  categoryId: string;
  categoryName: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  minQuantity?: number;
  maxDiscount?: number;
  isActive: boolean;
  description?: string;
}

interface CategoryDiscountConfigurationProps {
  categories: Category[];
  selectedParty: Party | null;
  onDiscountRulesChange: (rules: CategoryDiscountRule[]) => void;
  initialRules?: CategoryDiscountRule[];
}

export const CategoryDiscountConfiguration: React.FC<CategoryDiscountConfigurationProps> = ({
  categories,
  selectedParty,
  onDiscountRulesChange,
  initialRules = [],
}) => {
  const [discountRules, setDiscountRules] = useState<CategoryDiscountRule[]>(initialRules);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CategoryDiscountRule | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [formData, setFormData] = useState<Partial<CategoryDiscountRule>>({
    categoryId: '',
    discount: 0,
    discountType: 'percentage',
    minQuantity: 1,
    maxDiscount: 0,
    isActive: true,
    description: '',
  });

  // Use ref to track if we've already initialized from party data
  const partyInitializedRef = useRef<string | null>(null);

  // Initialize rules from party data or initial rules (only once per party)
  useEffect(() => {
    const partyId = selectedParty?.id || null;
    
    // Only initialize if party changed or we haven't initialized yet
    if (partyId !== partyInitializedRef.current) {
      partyInitializedRef.current = partyId;
      
      if (selectedParty?.categoryDiscounts) {
        const rules: CategoryDiscountRule[] = Object.entries(selectedParty.categoryDiscounts).map(([categoryId, discount]) => {
          const category = categories.find(c => c.id === categoryId);
          return {
            categoryId,
            categoryName: category?.name || 'Unknown Category',
            discount: discount as number,
            discountType: 'percentage' as const,
            isActive: true,
            description: `Auto-configured for ${category?.name || 'category'}`,
          };
        });
        setDiscountRules(rules);
      } else if (initialRules.length > 0 && !initialized) {
        setDiscountRules(initialRules);
      } else {
        // Clear rules when no party is selected
        setDiscountRules([]);
      }
      setInitialized(true);
    }
  }, [selectedParty?.id, categories, initialRules, initialized]);

  // Notify parent component when rules change (with proper debouncing)
  useEffect(() => {
    if (initialized) {
      const timeoutId = setTimeout(() => {
        onDiscountRulesChange(discountRules);
      }, 100); // Small delay to prevent rapid updates

      return () => clearTimeout(timeoutId);
    }
  }, [discountRules, initialized]); // Removed onDiscountRulesChange from dependencies

  const handleOpenDialog = useCallback((rule?: CategoryDiscountRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData(rule);
    } else {
      setEditingRule(null);
      setFormData({
        categoryId: '',
        discount: 0,
        discountType: 'percentage',
        minQuantity: 1,
        maxDiscount: 0,
        isActive: true,
        description: '',
      });
    }
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingRule(null);
    setFormData({});
  }, []);

  const handleSaveRule = useCallback(() => {
    if (!formData.categoryId || formData.discount === undefined) {
      return;
    }

    const category = categories.find(c => c.id === formData.categoryId);
    if (!category) return;

    const newRule: CategoryDiscountRule = {
      categoryId: formData.categoryId,
      categoryName: category.name,
      discount: formData.discount || 0,
      discountType: formData.discountType || 'percentage',
      minQuantity: formData.minQuantity || 1,
      maxDiscount: formData.maxDiscount || 0,
      isActive: formData.isActive !== false,
      description: formData.description || `Discount for ${category.name}`,
    };

    if (editingRule) {
      // Update existing rule
      setDiscountRules(prev => 
        prev.map(rule => 
          rule.categoryId === editingRule.categoryId ? newRule : rule
        )
      );
    } else {
      // Add new rule
      setDiscountRules(prev => [...prev, newRule]);
    }

    handleCloseDialog();
  }, [formData, editingRule, categories, handleCloseDialog]);

  const handleDeleteRule = useCallback((categoryId: string) => {
    setDiscountRules(prev => prev.filter(rule => rule.categoryId !== categoryId));
  }, []);

  const handleToggleActive = useCallback((categoryId: string) => {
    setDiscountRules(prev => 
      prev.map(rule => 
        rule.categoryId === categoryId 
          ? { ...rule, isActive: !rule.isActive }
          : rule
      )
    );
  }, []);

  const getAvailableCategories = useCallback(() => {
    const usedCategoryIds = discountRules.map(rule => rule.categoryId);
    return categories.filter(category => !usedCategoryIds.includes(category.id || ''));
  }, [discountRules, categories]);

  const formatDiscount = useCallback((rule: CategoryDiscountRule) => {
    return rule.discountType === 'percentage' 
      ? `${rule.discount}%`
      : `₹${rule.discount}`;
  }, []);

  const getTotalPotentialSavings = useCallback(() => {
    return discountRules
      .filter(rule => rule.isActive)
      .reduce((total, rule) => total + (rule.discountType === 'percentage' ? rule.discount : 0), 0);
  }, [discountRules]);

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CategoryIcon />
            Advanced Category Discount Rules
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddCircleIcon />}
            onClick={() => handleOpenDialog()}
            disabled={categories.length === 0 || discountRules.length >= categories.length}
          >
            Add New Rule
          </Button>
        </Box>

        {/* Party Information */}
        {selectedParty && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Configuring discounts for:</strong> {selectedParty.name}
              {selectedParty.gstin && ` (GSTIN: ${selectedParty.gstin})`}
            </Typography>
          </Alert>
        )}

        {/* Summary Statistics */}
        {discountRules.length > 0 && (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6} sm={3}>
              <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {discountRules.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Rules
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="h6" color="success.main">
                  {discountRules.filter(rule => rule.isActive).length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active Rules
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="h6" color="warning.main">
                  {getTotalPotentialSavings().toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg. Discount
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="h6" color="info.main">
                  {categories.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Categories
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Rules Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>Category</TableCell>
                <TableCell>Discount</TableCell>
                <TableCell>Min Qty</TableCell>
                <TableCell>Max Discount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {discountRules.map((rule) => (
                <TableRow key={rule.categoryId} hover sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CategoryIcon fontSize="small" color="primary" />
                      <Typography variant="body2" fontWeight="medium">
                        {rule.categoryName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={formatDiscount(rule)}
                      color="primary"
                      size="small"
                      variant={rule.isActive ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {rule.minQuantity || 1}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {rule.maxDiscount ? `₹${rule.maxDiscount}` : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={rule.isActive}
                      onChange={() => handleToggleActive(rule.categoryId)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={rule.description || 'No description'}>
                      <Typography variant="caption" color="text.secondary" noWrap maxWidth={150}>
                        {rule.description || '-'}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="Edit Rule">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(rule)}
                        >
                          <EditNoteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Rule">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteRule(rule.categoryId)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              
              {discountRules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No discount rules configured. Click "Add Rule" to create category-specific discounts.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Help Information */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>How it works:</strong> Category discounts are automatically applied to products based on their category. 
            You can set percentage or fixed amount discounts, minimum quantities, and maximum discount limits.
          </Typography>
        </Alert>
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingRule ? 'Edit Category Discount Rule' : 'Add Category Discount Rule'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.categoryId || ''}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  disabled={!!editingRule}
                >
                  {(editingRule ? categories : getAvailableCategories()).map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Discount"
                type="number"
                value={formData.discount || ''}
                onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                inputProps={{ min: 0, max: formData.discountType === 'percentage' ? 100 : undefined }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.discountType || 'percentage'}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                >
                  <MenuItem value="percentage">Percentage (%)</MenuItem>
                  <MenuItem value="fixed">Fixed Amount (₹)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Minimum Quantity"
                type="number"
                value={formData.minQuantity || 1}
                onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
                inputProps={{ min: 1 }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Maximum Discount (₹)"
                type="number"
                value={formData.maxDiscount || ''}
                onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                inputProps={{ min: 0 }}
                helperText="0 = No limit"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description for this discount rule"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive !== false}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveRule} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={!formData.categoryId || formData.discount === undefined}
          >
            {editingRule ? 'Update' : 'Add'} Rule
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default CategoryDiscountConfiguration;