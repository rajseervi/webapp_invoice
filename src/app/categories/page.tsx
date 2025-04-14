"use client"
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  where,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '@/firebase/config';

// Define category interface
interface Category {
  id: string;
  name: string;
  productCount?: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Fetch categories from Firebase
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const categoriesCollection = collection(db, 'categories');
        const categoriesSnapshot = await getDocs(categoriesCollection);
        
        const categoriesList = await Promise.all(categoriesSnapshot.docs.map(async (doc) => {
          const data = doc.data();
          
          // Count products in this category
          const productsCollection = collection(db, 'products');
          const q = query(productsCollection, where('category', '==', data.name));
          const snapshot = await getCountFromServer(q);
          
          return {
            id: doc.id,
            name: data.name,
            productCount: snapshot.data().count
          };
        }));
        
        setCategories(categoriesList);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to fetch categories. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setNewCategoryName('');
    setOpenDialog(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setNewCategoryName(category.name);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) {
      return;
    }
    
    try {
      setLoading(true);
      
      if (selectedCategory) {
        // Update existing category in Firebase
        const categoryRef = doc(db, 'categories', selectedCategory.id);
        await updateDoc(categoryRef, {
          name: newCategoryName
        });
        
        // Update local state
        setCategories(categories.map(c => 
          c.id === selectedCategory.id 
            ? { ...c, name: newCategoryName } 
            : c
        ));
      } else {
        // Create new category in Firebase
        const categoriesCollection = collection(db, 'categories');
        const docRef = await addDoc(categoriesCollection, {
          name: newCategoryName
        });
        
        // Add to local state
        setCategories([...categories, {
          id: docRef.id,
          name: newCategoryName,
          productCount: 0
        }]);
      }
      
      setOpenDialog(false);
      setError(null);
    } catch (err) {
      console.error('Error saving category:', err);
      setError('Failed to save category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const categoryToDelete = categories.find(c => c.id === id);
    
    if (!categoryToDelete) return;
    
    if (categoryToDelete.productCount && categoryToDelete.productCount > 0) {
      alert(`Cannot delete category "${categoryToDelete.name}" because it has ${categoryToDelete.productCount} products associated with it.`);
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        setLoading(true);
        
        // Delete from Firebase
        const categoryRef = doc(db, 'categories', id);
        await deleteDoc(categoryRef);
        
        // Remove from local state
        setCategories(categories.filter(c => c.id !== id));
        setError(null);
      } catch (err) {
        console.error('Error deleting category:', err);
        setError('Failed to delete category. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5">Categories</Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleAddCategory}
          >
            Add Category
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 2 }}>
          {loading && categories.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography>Loading categories...</Typography>
            </Box>
          ) : categories.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography>No categories found. Add your first category!</Typography>
            </Box>
          ) : (
            <List>
              {categories.map((category, index) => (
                <React.Fragment key={category.id}>
                  <ListItem>
                    <ListItemText 
                      primary={category.name} 
                      secondary={`${category.productCount || 0} products`} 
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => handleEditCategory(category)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        color="error"
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={category.productCount ? category.productCount > 0 : false}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < categories.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      </Container>

      {/* Add/Edit Category Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Category Name"
              fullWidth
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveCategory} 
            variant="contained"
            disabled={loading || !newCategoryName.trim()}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}