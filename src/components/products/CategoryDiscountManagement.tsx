"use client";
import React, { useState, useEffect, useCallback } from 'react';
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
  Autocomplete,
  Snackbar,
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
  Person as PersonIcon,
} from '@mui/icons-material';
import { Category } from '@/types/inventory';
import { Party } from '@/types/party';
import { categoryService } from '@/services/categoryService';
import { partyService } from '@/services/partyService';

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

interface CategoryDiscountManagementProps {
  onClose?: () => void;
}

export const CategoryDiscountManagement: React.FC<CategoryDiscountManagementProps> = ({
  onClose
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [discountRules, setDiscountRules] = useState<CategoryDiscountRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CategoryDiscountRule | null>(null);
  const [formData, setFormData] = useState<Partial<CategoryDiscountRule>>({
    categoryId: '',
    discount: 0,
    discountType: 'percentage',
    minQuantity: 1,
    maxDiscount: 0,
    isActive: true,
    description: '',
  });

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesData, partiesData] = await Promise.all([
          categoryService.getCategories({ includeInactive: true }),
          partyService.getAllParties()
        ]);
        setCategories(categoriesData);
        setParties(partiesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        showSnackbar('Failed to fetch data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load discount rules when party is selected
  useEffect(() => {
    if (selectedParty?.categoryDiscounts) {
      const rules: CategoryDiscountRule[] = Object.entries(selectedParty.categoryDiscounts).map(([categoryId, discount]) => {
        const category = categories.find(c => c.id === categoryId);
        const displayName = category?.name && category.name.trim().length > 0 ? category.name : 'Unknown Category';
        return {
          categoryId,
          categoryName: displayName,
          discount: discount as number,
          discountType: 'percentage' as const,
          isActive: true,
          description: `Auto-configured for ${displayName}`,
        };
      });
      setDiscountRules(rules);
    } else {
      setDiscountRules([]);
    }
  }, [selectedParty, categories]);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

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

  const handleSaveRule = useCallback(async () => {
    if (!formData.categoryId || formData.discount === undefined || !selectedParty) {
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

    try {
      let updatedRules: CategoryDiscountRule[];
      if (editingRule) {
        // Update existing rule
        updatedRules = discountRules.map(rule =>
          rule.categoryId === editingRule.categoryId ? newRule : rule
        );
      } else {
        // Add new rule
        updatedRules = [...discountRules, newRule];
      }

      // Update the party with new category discounts
      const updatedCategoryDiscounts = updatedRules.reduce((acc, rule) => {
        if (rule.isActive) {
          acc[rule.categoryId] = rule.discount;
        }
        return acc;
      }, {} as Record<string, number>);

      await partyService.updateParty(selectedParty.id!, {
        categoryDiscounts: updatedCategoryDiscounts
      });

      // Update local state
      setDiscountRules(updatedRules);
      setSelectedParty(prev => prev ? {
        ...prev,
        categoryDiscounts: updatedCategoryDiscounts
      } : null);

      showSnackbar('Category discount rule saved successfully', 'success');
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving discount rule:', error);
      showSnackbar('Failed to save discount rule', 'error');
    }
  }, [formData, editingRule, categories, discountRules, selectedParty, handleCloseDialog]);

  const handleDeleteRule = useCallback(async (categoryId: string) => {
    if (!selectedParty) return;

    try {
      const updatedRules = discountRules.filter(rule => rule.categoryId !== categoryId);
      
      const updatedCategoryDiscounts = updatedRules.reduce((acc, rule) => {
        if (rule.isActive) {
          acc[rule.categoryId] = rule.discount;
        }
        return acc;
      }, {} as Record<string, number>);

      await partyService.updateParty(selectedParty.id!, {
        categoryDiscounts: updatedCategoryDiscounts
      });

      setDiscountRules(updatedRules);
      setSelectedParty(prev => prev ? {
        ...prev,
        categoryDiscounts: updatedCategoryDiscounts
      } : null);

      showSnackbar('Discount rule deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting discount rule:', error);
      showSnackbar('Failed to delete discount rule', 'error');
    }
  }, [discountRules, selectedParty]);

  const handleToggleActive = useCallback(async (categoryId: string) => {
    if (!selectedParty) return;

    try {
      const updatedRules = discountRules.map(rule =>
        rule.categoryId === categoryId
          ? { ...rule, isActive: !rule.isActive }
          : rule
      );

      const updatedCategoryDiscounts = updatedRules.reduce((acc, rule) => {
        if (rule.isActive) {
          acc[rule.categoryId] = rule.discount;
        }
        return acc;
      }, {} as Record<string, number>);

      await partyService.updateParty(selectedParty.id!, {
        categoryDiscounts: updatedCategoryDiscounts
      });

      setDiscountRules(updatedRules);
      setSelectedParty(prev => prev ? {
        ...prev,
        categoryDiscounts: updatedCategoryDiscounts
      } : null);

      showSnackbar('Discount rule status updated', 'success');
    } catch (error) {
      console.error('Error updating discount rule status:', error);
      showSnackbar('Failed to update discount rule status', 'error');
    }
  }, [discountRules, selectedParty]);

  const getAvailableCategories = useCallback(() => {
    const usedCategoryIds = discountRules.map(rule => rule.categoryId);
    return categories.filter(category => !usedCategoryIds.includes(category.id || ''));
  }, [discountRules, categories]);

  const formatDiscount = useCallback((rule: CategoryDiscountRule) => {
    return rule.discountType === 'percentage' 
      ? `${rule.discount}%`
      : `₹${rule.discount}`;
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6">Loading...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CategoryIcon />
            Category Discount Management
          </Typography>
          {onClose && (
            <Button variant="outlined" onClick={onClose}>
              Close
            </Button>
          )}
        </Box>

        {/* Party Selection */}
        <Box sx={{ mb: 3 }}>
          <Autocomplete
            options={parties}
            getOptionLabel={(option) => `${option.name} ${option.gstin ? `(${option.gstin})` : ''}`}
            value={selectedParty}
            onChange={(_, value) => setSelectedParty(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Party"
                helperText="Choose a party to manage their category discounts"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Box>

        {/* Party Information */}
        {selectedParty && (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Managing discounts for:</strong> {selectedParty.name}
                {selectedParty.gstin && ` (GSTIN: ${selectedParty.gstin})`}
                <br />
                <strong>Business Type:</strong> {selectedParty.businessType || 'N/A'}
                {selectedParty.phone && <><br /><strong>Phone:</strong> {selectedParty.phone}</>}
                {selectedParty.email && <><br /><strong>Email:</strong> {selectedParty.email}</>}
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Category Discount Rules ({discountRules.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddCircleIcon />}
                onClick={() => handleOpenDialog()}
                disabled={categories.length === 0 || discountRules.length >= categories.length}
              >
                Add Rule
              </Button>
            </Box>

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
                      {discountRules.filter(rule => rule.isActive).length > 0 
                        ? (discountRules.filter(rule => rule.isActive).reduce((sum, rule) => sum + rule.discount, 0) / discountRules.filter(rule => rule.isActive).length).toFixed(1)
                        : '0'
                      }%
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
                      Total Categories
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

            {/* How it works section */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
              <Typography variant="body2" color="info.main">
                <InfoIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                <strong>How it works:</strong> Category discounts are automatically applied to products based on their category. 
                When creating invoices for this party, products will receive the configured discount percentage for their respective categories.
              </Typography>
            </Box>
          </>
        )}

        {!selectedParty && (
          <Alert severity="info">
            Select a party above to manage their category discounts. Category discounts allow you to set automatic discount percentages that will be applied to products based on their category when creating invoices for the selected party.
          </Alert>
        )}

        {/* Edit/Add Rule Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingRule ? 'Edit Category Discount Rule' : 'Add Category Discount Rule'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.categoryId || ''}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      label="Category"
                      disabled={!!editingRule}
                    >
                      {(editingRule ? categories : getAvailableCategories()).map(category => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    label="Discount Value"
                    type="number"
                    value={formData.discount || 0}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                    required
                  />
                </Grid>
                
                <Grid item xs={4}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={formData.discountType || 'percentage'}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                      label="Type"
                    >
                      <MenuItem value="percentage">%</MenuItem>
                      <MenuItem value="fixed">₹</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Min Quantity"
                    type="number"
                    value={formData.minQuantity || 1}
                    onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 1 })}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Max Discount Amount (₹)"
                    type="number"
                    value={formData.maxDiscount || 0}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: parseFloat(e.target.value) || 0 })}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    multiline
                    rows={2}
                    helperText="Optional description for this discount rule"
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
            </Box>
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
              {editingRule ? 'Update Rule' : 'Add Rule'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          message={snackbar.message}
        />
      </CardContent>
    </Card>
  );
};

export default CategoryDiscountManagement;