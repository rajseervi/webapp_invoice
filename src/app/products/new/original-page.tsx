'use client';
import React, { useState } from 'react';
import { 
  Button, Box, Typography, Dialog, DialogTitle, 
  DialogContent, DialogActions, Alert, CircularProgress,
  Divider, Tooltip, TextField
} from '@mui/material';
import {
  Add as AddIcon,
  Category as CategoryIcon
} from '@mui/icons-material';

import { Container } from '@mui/material';
import { useRouter } from 'next/navigation';
import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';
import ProductForm from '@/app/products/components/ProductForm';
import { categoryService } from '@/services/categoryService';

const NewProduct = () => {
  const router = useRouter();
  
  // Category management state
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const handleSubmit = async (productData: any) => {
    try {
      const { productService } = await import('@/services/productService');
      const productId = await productService.createProduct(productData);
      
      // Show success message with product details
      alert(`Product "${productData.name}" created successfully!`);
      
      router.push('/products');
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Failed to create product. Please check all required fields.');
    }
  };

  const handleCancel = () => {
    router.push('/products');
  };

  // Category management functions
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setCategoryError('Category name is required');
      return;
    }

    setIsCreatingCategory(true);
    setCategoryError(null);

    try {
      await categoryService.createCategory({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim(),
        defaultDiscount: 0,
        isActive: true
      });

      // Reset form
      setNewCategoryName('');
      setNewCategoryDescription('');
      setShowCategoryDialog(false);
      
      // Show success message
      alert(`Category "${newCategoryName}" created successfully!`);
      
    } catch (error) {
      console.error('Error creating category:', error);
      setCategoryError('Failed to create category. Please try again.');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleCloseCategoryDialog = () => {
    setShowCategoryDialog(false);
    setNewCategoryName('');
    setNewCategoryDescription('');
    setCategoryError(null);
  };

  return (
    <ImprovedDashboardLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Add New Product
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Add a new product to your inventory. GST and tax calculations are handled automatically.
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Product Information
          </Typography>
          <Tooltip title="Create New Category">
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setShowCategoryDialog(true)}
              sx={{ ml: 2 }}
            >
              Add Category
            </Button>
          </Tooltip>
        </Box>
        <ProductForm onSubmit={handleSubmit} onCancel={handleCancel} />

        {/* Category Creation Dialog */}
        <Dialog 
          open={showCategoryDialog} 
          onClose={handleCloseCategoryDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
              Create New Category
            </Box>
          </DialogTitle>
          <DialogContent>
            {categoryError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {categoryError}
              </Alert>
            )}
            
            <Box sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Category Name"
                required
                id="new-category-name"
                name="newCategoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Electronics, Clothing, Food"
                sx={{ mb: 2 }}
                disabled={isCreatingCategory}
              />
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description (Optional)"
                id="new-category-description"
                name="newCategoryDescription"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="Brief description of the category..."
                disabled={isCreatingCategory}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleCloseCategoryDialog}
              disabled={isCreatingCategory}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCategory}
              variant="contained"
              disabled={isCreatingCategory || !newCategoryName.trim()}
              startIcon={isCreatingCategory ? <CircularProgress size={20} /> : <AddIcon />}
            >
              {isCreatingCategory ? 'Creating...' : 'Create Category'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ImprovedDashboardLayout>
  );
};

const OriginalPageComponent = NewProduct;
export default OriginalPageComponent;
export { OriginalPageComponent as NewProduct };