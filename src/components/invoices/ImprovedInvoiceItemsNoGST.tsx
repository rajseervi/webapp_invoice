"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Autocomplete,
  IconButton,
  Button,
  Chip,
  Grid,
  Divider,
  Tooltip,
  Alert,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  useTheme,
  alpha,
  Stack,
  Fab,
  Zoom
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ShoppingCart as CartIcon,
  Inventory as InventoryIcon,
  LocalOffer as PriceIcon,
  Category as CategoryIcon,
  Calculate as CalculateIcon,
  Receipt as ReceiptIcon,
  Clear as ClearIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { PurchaseInvoiceItem } from '@/types/purchase_no_gst';
import { Product } from '@/types/inventory';

interface ImprovedInvoiceItemsNoGSTProps {
  items: PurchaseInvoiceItem[];
  onItemsChange: (items: PurchaseInvoiceItem[]) => void;
  products: Product[];
  onProductSearch?: (searchTerm: string) => void;
  loading?: boolean;
  readOnly?: boolean;
}

interface EditingItem extends Partial<PurchaseInvoiceItem> {
  isNew?: boolean;
  tempId?: string;
}

const ImprovedInvoiceItemsNoGST: React.FC<ImprovedInvoiceItemsNoGSTProps> = ({
  items,
  onItemsChange,
  products,
  onProductSearch,
  loading = false,
  readOnly = false
}) => {
  const theme = useTheme();
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const totalDiscountAmount = items.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscountAmount: Math.round(totalDiscountAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      itemCount: items.length
    };
  }, [items]);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  // Calculate item total with discount
  const calculateItemTotal = useCallback((item: Partial<PurchaseInvoiceItem>) => {
    const baseAmount = (item.unitPrice || 0) * (item.quantity || 0);
    let discountAmount = 0;
    
    if (item.discountType && item.discountValue && item.discountValue > 0) {
      if (item.discountType === 'percentage') {
        discountAmount = (baseAmount * item.discountValue) / 100;
      } else if (item.discountType === 'amount') {
        discountAmount = item.discountValue;
      }
    }
    
    return {
      discountAmount: Math.round(discountAmount * 100) / 100,
      totalAmount: Math.round((baseAmount - discountAmount) * 100) / 100
    };
  }, []);

  // Start editing an item
  const startEditing = useCallback((item?: PurchaseInvoiceItem, index?: number) => {
    if (readOnly) return;
    
    if (item) {
      setEditingItem({ ...item, tempId: `edit-${index}` });
    } else {
      setEditingItem({
        isNew: true,
        tempId: `new-${Date.now()}`,
        productId: '',
        productName: '',
        quantity: 1,
        unitPrice: 0,
        unitOfMeasurement: 'pcs',
        discountType: 'percentage',
        discountValue: 0,
        discountAmount: 0,
        totalAmount: 0
      });
    }
  }, [readOnly]);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingItem(null);
  }, []);

  // Save item
  const saveItem = useCallback(() => {
    if (!editingItem || !editingItem.productId || !editingItem.productName) return;

    const calculated = calculateItemTotal(editingItem);
    const finalItem: PurchaseInvoiceItem = {
      id: editingItem.id,
      productId: editingItem.productId,
      productName: editingItem.productName,
      quantity: editingItem.quantity || 1,
      unitPrice: editingItem.unitPrice || 0,
      discountType: editingItem.discountType,
      discountValue: editingItem.discountValue,
      discountAmount: calculated.discountAmount,
      unitOfMeasurement: editingItem.unitOfMeasurement || 'pcs',
      totalAmount: calculated.totalAmount
    };

    if (editingItem.isNew) {
      onItemsChange([...items, finalItem]);
    } else {
      const index = items.findIndex(item => 
        item.id === editingItem.id || 
        items.indexOf(item).toString() === editingItem.tempId?.split('-')[1]
      );
      if (index >= 0) {
        const newItems = [...items];
        newItems[index] = finalItem;
        onItemsChange(newItems);
      }
    }

    setEditingItem(null);
  }, [editingItem, items, onItemsChange, calculateItemTotal]);

  // Delete item
  const deleteItem = useCallback((index: number) => {
    if (readOnly) return;
    const newItems = items.filter((_, i) => i !== index);
    onItemsChange(newItems);
  }, [items, onItemsChange, readOnly]);

  // Handle product selection
  const handleProductSelect = useCallback((product: Product | null) => {
    if (!product || !editingItem) return;
    
    setEditingItem(prev => ({
      ...prev,
      productId: product.id,
      productName: product.name,
      unitPrice: product.price || 0,
      unitOfMeasurement: product.unit || 'pcs'
    }));
  }, [editingItem]);

  // Handle field changes
  const handleFieldChange = useCallback((field: keyof EditingItem, value: any) => {
    setEditingItem(prev => {
      if (!prev) return null;
      const updated = { ...prev, [field]: value };
      
      // Recalculate totals when relevant fields change
      if (['quantity', 'unitPrice', 'discountType', 'discountValue'].includes(field)) {
        const calculated = calculateItemTotal(updated);
        updated.discountAmount = calculated.discountAmount;
        updated.totalAmount = calculated.totalAmount;
      }
      
      return updated;
    });
  }, [calculateItemTotal]);

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ReceiptIcon color="primary" />
          <Typography variant="h6">Invoice Items</Typography>
          <Chip 
            label={`${totals.itemCount} items`} 
            size="small" 
            color="primary" 
            variant="outlined" 
          />
        </Box>
        {!readOnly && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => startEditing()}
            disabled={!!editingItem}
          >
            Add Item
          </Button>
        )}
      </Box>

      {/* Items Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Qty</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Unit</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Unit Price</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Discount</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Total</TableCell>
              {!readOnly && <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow 
                key={item.id || index}
                hover
                sx={{
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.04)
                  }
                }}
              >
                <TableCell>
                  <Chip 
                    label={index + 1} 
                    size="small" 
                    color="primary" 
                    sx={{ minWidth: 32 }}
                  />
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {item.productName}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">
                    {item.quantity}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip 
                    label={item.unitOfMeasurement} 
                    size="small" 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="medium">
                    ₹{item.unitPrice.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  {item.discountAmount && item.discountAmount > 0 ? (
                    <Typography variant="body2" color="error">
                      -₹{item.discountAmount.toFixed(2)}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Typography 
                    variant="body2" 
                    fontWeight="bold"
                    sx={{ 
                      color: theme.palette.success.main,
                      backgroundColor: alpha(theme.palette.success.main, 0.1),
                      px: 1,
                      py: 0.5,
                      borderRadius: 1
                    }}
                  >
                    ₹{item.totalAmount.toFixed(2)}
                  </Typography>
                </TableCell>
                {!readOnly && (
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Edit Item">
                        <IconButton
                          size="small"
                          onClick={() => startEditing(item, index)}
                          disabled={!!editingItem}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Item">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => deleteItem(index)}
                          disabled={!!editingItem}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))}

            {/* Editing Row */}
            {editingItem && (
              <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                <TableCell>
                  <Chip 
                    label={editingItem.isNew ? items.length + 1 : "Edit"} 
                    size="small" 
                    color="primary"
                  />
                </TableCell>
                <TableCell>
                  <Autocomplete
                    size="small"
                    options={filteredProducts}
                    getOptionLabel={(option) => option.name}
                    value={filteredProducts.find(p => p.id === editingItem.productId) || null}
                    onChange={(_, value) => handleProductSelect(value)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Search products..."
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon fontSize="small" />
                            </InputAdornment>
                          )
                        }}
                      />
                    )}
                    renderOption={(props, option) => {
                      const { key, ...otherProps } = props;
                      return (
                        <Box component="li" key={key} {...otherProps}>
                          <Box>
                            <Typography variant="body2">{option.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.category} • ₹{option.price}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    }}
                    sx={{ minWidth: 200 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={editingItem.quantity || ''}
                    onChange={(e) => handleFieldChange('quantity', Number(e.target.value))}
                    inputProps={{ min: 0.01, step: 0.01 }}
                    sx={{ width: 80 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={editingItem.unitOfMeasurement || ''}
                    onChange={(e) => handleFieldChange('unitOfMeasurement', e.target.value)}
                    sx={{ width: 80 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={editingItem.unitPrice || ''}
                    onChange={(e) => handleFieldChange('unitPrice', Number(e.target.value))}
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>
                    }}
                    sx={{ width: 120 }}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 80 }}>
                      <Select
                        value={editingItem.discountType || 'percentage'}
                        onChange={(e) => handleFieldChange('discountType', e.target.value)}
                      >
                        <MenuItem value="percentage">%</MenuItem>
                        <MenuItem value="amount">₹</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      size="small"
                      type="number"
                      value={editingItem.discountValue || ''}
                      onChange={(e) => handleFieldChange('discountValue', Number(e.target.value))}
                      inputProps={{ min: 0, step: 0.01 }}
                      sx={{ width: 80 }}
                    />
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    ₹{(editingItem.totalAmount || 0).toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Save Item">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={saveItem}
                        disabled={!editingItem.productId || !editingItem.productName}
                      >
                        <SaveIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Cancel">
                      <IconButton
                        size="small"
                        onClick={cancelEditing}
                      >
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {/* Empty State */}
            {items.length === 0 && !editingItem && (
              <TableRow>
                <TableCell colSpan={readOnly ? 7 : 8} align="center" sx={{ py: 4 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <CartIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                    <Typography variant="body1" color="text.secondary">
                      No items added yet
                    </Typography>
                    {!readOnly && (
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => startEditing()}
                      >
                        Add First Item
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Totals Summary */}
      {items.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2} justifyContent="flex-end">
            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined">
                <CardContent sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Subtotal:
                      </Typography>
                      <Typography variant="body2">
                        ₹{totals.subtotal.toFixed(2)}
                      </Typography>
                    </Box>
                    
                    {totals.totalDiscountAmount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Discount:
                        </Typography>
                        <Typography variant="body2" color="error">
                          -₹{totals.totalDiscountAmount.toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                    
                    <Divider />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6" fontWeight="bold">
                        Total Amount:
                      </Typography>
                      <Typography 
                        variant="h6" 
                        fontWeight="bold" 
                        color="primary"
                      >
                        ₹{totals.totalAmount.toFixed(2)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Floating Action Button for Mobile */}
      {!readOnly && (
        <Zoom in={!editingItem}>
          <Fab
            color="primary"
            aria-label="add item"
            onClick={() => startEditing()}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              display: { xs: 'flex', sm: 'none' }
            }}
          >
            <AddIcon />
          </Fab>
        </Zoom>
      )}
    </Paper>
  );
};

export default ImprovedInvoiceItemsNoGST;