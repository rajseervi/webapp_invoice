"use client";
import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Checkbox,
  CircularProgress,
  Alert,
  SelectChangeEvent
} from '@mui/material';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { findOrCreateCategory, validateCategoryName } from '@/utils/categoryUtils';
import { validateProductName } from '@/utils/validation';
import { executeWithRetry, getFirestoreErrorMessage } from '@/utils/firestoreHelpers';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  categoryId?: string;
  categoryName?: string;
  stock?: number;
}

interface ImprovedProductCreatorProps {
  open: boolean;
  onClose: () => void;
  onProductCreated: (product: Product) => void;
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
  existingProducts: Product[];
  prefilledName?: string;
}

export default function ImprovedProductCreator({
  open,
  onClose,
  onProductCreated,
  onError,
  onSuccess,
  existingProducts,
  prefilledName = ''
}: ImprovedProductCreatorProps) {
  const [creating, setCreating] = useState(false);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Extract unique categories from existing products
  const uniqueCategories = useMemo(() => {
    const categories = existingProducts
      .map(product => product.category)
      .filter(Boolean)
      .filter((category, index, arr) => arr.indexOf(category) === index)
      .sort();
    return categories;
  }, [existingProducts]);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setProductName(prefilledName);
      setProductPrice(0);
      setSelectedCategory('');
      setCustomCategory('');
      setUseCustomCategory(false);
      setLocalError(null);
    }
  }, [open, prefilledName]);

  // Handle custom category toggle
  React.useEffect(() => {
    if (useCustomCategory) {
      setSelectedCategory('');
    } else {
      setCustomCategory('');
    }
  }, [useCustomCategory]);

  const validateForm = (): string | null => {
    const err = validateProductName(productName || '');
    if (err) return err;

    if (productPrice <= 0) {
      return 'Product price must be greater than 0';
    }

    const finalCategoryName = useCustomCategory ? customCategory.trim() : selectedCategory;
    
    if (!finalCategoryName) {
      return 'Please select or enter a category';
    }

    if (useCustomCategory) {
      const validation = validateCategoryName(customCategory);
      if (!validation.isValid) {
        return validation.error || 'Invalid category name';
      }
    }

    return null;
  };

  const handleCreateProduct = async () => {
    const validationError = validateForm();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    try {
      setCreating(true);
      setLocalError(null);

      const finalCategoryName = useCustomCategory ? customCategory.trim() : selectedCategory;

      console.log('Creating product with category:', {
        useCustomCategory,
        customCategory: customCategory.trim(),
        selectedCategory,
        finalCategoryName
      });

      // Find or create the category
      const categoryId = await findOrCreateCategory(finalCategoryName);

      // Create the product data
      const productData = {
        name: productName.trim(),
        price: productPrice,
        categoryId: categoryId, // Link to category document
        categoryName: finalCategoryName, // Store name for backward compatibility
        category: finalCategoryName, // Legacy field
        quantity: 0, // Default stock quantity
        stock: 0, // Stock field
        isActive: true,
        gstRate: 18, // Default GST rate
        unitOfMeasurement: 'PCS',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Create the product with retry logic
      const productRef = await executeWithRetry(
        async () => {
          return await addDoc(collection(db, 'products'), productData);
        },
        3, // Max retries
        (attempt, maxRetries, error) => {
          setLocalError(`Connection error. Retrying... (Attempt ${attempt}/${maxRetries})`);
        }
      );

      // Create the product object to return
      const newProduct: Product = {
        id: productRef.id,
        name: productName.trim(),
        price: productPrice,
        category: finalCategoryName,
        categoryId: categoryId,
        categoryName: finalCategoryName,
        stock: 0
      };

      // Notify parent components
      onProductCreated(newProduct);
      onSuccess(`Product created successfully${categoryId ? ' and linked to category' : ''}`);
      
      // Close the dialog
      onClose();

    } catch (err) {
      console.error('Error creating product:', err);
      const errorMessage = getFirestoreErrorMessage(err);
      setLocalError(errorMessage);
      onError(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Create New Product</Typography>
        <Typography variant="body2" color="text.secondary">
          Add a new product with proper category linking
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {localError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {localError}
          </Alert>
        )}

        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Product Name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            fullWidth
            required
            error={!productName.trim() && creating}
            helperText={validateProductName(productName || '') || 'No spaces. Use underscore, hyphen, or camelCase.'}
            autoFocus
          />

          <TextField
            label="Price"
            type="number"
            value={productPrice}
            onChange={(e) => setProductPrice(parseFloat(e.target.value) || 0)}
            fullWidth
            required
            InputProps={{
              startAdornment: <span style={{ fontSize: '0.8rem', marginRight: '2px' }}>₹</span>
            }}
            inputProps={{ min: 0, step: 0.01 }}
            error={productPrice <= 0 && creating}
            helperText={productPrice <= 0 && creating ? "Price must be greater than 0" : ""}
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth disabled={useCustomCategory}>
              <InputLabel id="category-select-label">Category</InputLabel>
              <Select
                labelId="category-select-label"
                value={selectedCategory}
                onChange={(e: SelectChangeEvent) => setSelectedCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="">
                  <em>Select a category</em>
                </MenuItem>
                {uniqueCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              p: 1, 
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: useCustomCategory ? 'primary.light' : 'transparent'
            }}>
              <Checkbox
                checked={useCustomCategory}
                onChange={(e) => setUseCustomCategory(e.target.checked)}
                id="use-custom-category"
                color="primary"
              />
              <Typography 
                component="label" 
                htmlFor="use-custom-category" 
                sx={{ 
                  fontWeight: useCustomCategory ? 'bold' : 'normal',
                  color: useCustomCategory ? 'primary.main' : 'text.primary',
                  cursor: 'pointer'
                }}
              >
                Create a new category instead
              </Typography>
            </Box>

            {useCustomCategory && (
              <TextField
                label="New Category Name"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                fullWidth
                required
                error={!customCategory.trim() && creating}
                helperText={
                  !customCategory.trim() && creating 
                    ? "Category name is required" 
                    : "This will create a new category if it doesn't exist"
                }
                placeholder="e.g., Electronics, Clothing, Food Items"
              />
            )}
          </Box>

          {/* Preview */}
          <Box sx={{ 
            p: 2, 
            bgcolor: 'grey.50', 
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="subtitle2" gutterBottom>
              Product Preview
            </Typography>
            <Typography variant="body2">
              <strong>Name:</strong> {productName || 'Not specified'}
            </Typography>
            <Typography variant="body2">
              <strong>Price:</strong> ₹{productPrice.toFixed(2)}
            </Typography>
            <Typography variant="body2">
              <strong>Category:</strong> {
                useCustomCategory 
                  ? (customCategory || 'Not specified')
                  : (selectedCategory || 'Not selected')
              }
            </Typography>
            {useCustomCategory && customCategory && (
              <Typography variant="caption" color="primary">
                ✓ New category will be created
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={creating}>
          Cancel
        </Button>
        <Button 
          onClick={handleCreateProduct} 
          variant="contained" 
          disabled={
            creating || 
            !productName.trim() || 
            productPrice <= 0 || 
            (useCustomCategory && !customCategory.trim()) ||
            (!useCustomCategory && !selectedCategory)
          }
          startIcon={creating ? <CircularProgress size={20} /> : null}
        >
          {creating ? 'Creating...' : 'Create Product'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}