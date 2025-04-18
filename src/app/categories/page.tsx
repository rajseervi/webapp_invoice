"use client"
import React, { useState, useEffect, useMemo } from 'react';
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
  Alert,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon
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
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState<'all' | 'with-products' | 'empty'>('all');
  
  // Filtered categories based on search and filter
  const filteredCategories = useMemo(() => {
    return categories.filter(category => {
      // Search filter
      const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Product count filter
      let matchesFilter = true;
      if (filterOption === 'with-products') {
        matchesFilter = (category.productCount || 0) > 0;
      } else if (filterOption === 'empty') {
        matchesFilter = (category.productCount || 0) === 0;
      }
      
      return matchesSearch && matchesFilter;
    });
  }, [categories, searchTerm, filterOption]);

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
        
        // Sort categories by product count (highest first)
        const sortedCategories = [...categoriesList].sort((a, b) => 
          (b.productCount || 0) - (a.productCount || 0)
        );
        
        setCategories(sortedCategories);
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

        {/* Summary Cards */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          {/* Total Categories Card */}
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              flexGrow: 1, 
              minWidth: '200px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'primary.light',
              color: 'primary.contrastText'
            }}
          >
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
              {loading ? <CircularProgress size={40} color="inherit" /> : categories.length}
            </Typography>
            <Typography variant="body1">Total Categories</Typography>
          </Paper>
          
          {/* Total Products Card */}
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              flexGrow: 1, 
              minWidth: '200px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'secondary.light',
              color: 'secondary.contrastText'
            }}
          >
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
              {loading ? (
                <CircularProgress size={40} color="inherit" />
              ) : (
                categories.reduce((total, category) => total + (category.productCount || 0), 0)
              )}
            </Typography>
            <Typography variant="body1">Total Products</Typography>
          </Paper>
          
          {/* Empty Categories Card */}
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              flexGrow: 1, 
              minWidth: '200px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: loading ? 'grey.300' : 
                categories.filter(c => !c.productCount || c.productCount === 0).length > 0 ? 
                'warning.light' : 'success.light',
              color: 'text.primary'
            }}
          >
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
              {loading ? (
                <CircularProgress size={40} color="inherit" />
              ) : (
                categories.filter(c => !c.productCount || c.productCount === 0).length
              )}
            </Typography>
            <Typography variant="body1">Empty Categories</Typography>
          </Paper>
        </Box>
        
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="div">
              Category List
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filteredCategories.length} of {categories.length} categories shown
            </Typography>
          </Box>
          
          {/* Search and Filter Bar */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            {/* Search Field */}
            <TextField
              placeholder="Search categories..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flexGrow: 1, minWidth: '200px' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton 
                      size="small" 
                      onClick={() => setSearchTerm('')}
                      edge="end"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            {/* Filter Toggle Buttons */}
            <ToggleButtonGroup
              value={filterOption}
              exclusive
              onChange={(e, newValue) => {
                if (newValue !== null) {
                  setFilterOption(newValue);
                }
              }}
              size="small"
              aria-label="category filter"
            >
              <ToggleButton value="all">
                All
              </ToggleButton>
              <ToggleButton value="with-products">
                With Products
              </ToggleButton>
              <ToggleButton value="empty">
                Empty
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          
          {/* Active Filters Display */}
          {(searchTerm || filterOption !== 'all') && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Typography variant="body2" sx={{ mr: 1, alignSelf: 'center' }}>
                Active Filters:
              </Typography>
              
              {searchTerm && (
                <Chip 
                  label={`Search: ${searchTerm}`} 
                  size="small" 
                  onDelete={() => setSearchTerm('')}
                  color="primary"
                  variant="outlined"
                />
              )}
              
              {filterOption !== 'all' && (
                <Chip 
                  label={`Filter: ${filterOption === 'with-products' ? 'With Products' : 'Empty'}`} 
                  size="small" 
                  onDelete={() => setFilterOption('all')}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          )}
          
          {loading && categories.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography>Loading categories...</Typography>
            </Box>
          ) : categories.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography>No categories found. Add your first category!</Typography>
            </Box>
          ) : filteredCategories.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography>No categories match your search or filter criteria.</Typography>
              <Button 
                variant="text" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterOption('all');
                }}
                sx={{ mt: 1 }}
              >
                Clear Filters
              </Button>
            </Box>
          ) : (
            <List>
              {filteredCategories.map((category, index) => (
                <React.Fragment key={category.id}>
                  <ListItem 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      py: 2
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      flexGrow: 1,
                      width: '100%',
                      alignItems: 'center'
                    }}>
                      {/* Category Name */}
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="div">
                          {category.name}
                        </Typography>
                      </Box>
                      
                      {/* Product Count Badge */}
                      <Box 
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: index === 0 ? 'success.main' : 
                                   index === 1 ? 'success.light' :
                                   index === 2 ? 'info.main' :
                                   'primary.main',
                          color: 'white',
                          borderRadius: '16px',
                          px: 2,
                          py: 0.5,
                          mr: 2,
                          minWidth: '100px',
                          textAlign: 'center',
                          position: 'relative'
                        }}
                      >
                        {/* Top category indicators */}
                        {index < 3 && category.productCount > 0 && (
                          <Box 
                            sx={{ 
                              position: 'absolute', 
                              top: -10, 
                              right: -10,
                              bgcolor: index === 0 ? 'gold' : index === 1 ? 'silver' : '#cd7f32', // bronze
                              color: index === 0 ? 'black' : 'white',
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                              border: '2px solid white'
                            }}
                          >
                            {index + 1}
                          </Box>
                        )}
                        
                        <Typography variant="body1" component="div" sx={{ fontWeight: 'bold' }}>
                          {category.productCount || 0}
                        </Typography>
                        <Typography variant="body2" component="div" sx={{ ml: 1 }}>
                          Products
                        </Typography>
                      </Box>
                      
                      {/* View Products Button */}
                      <Button 
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          // Navigate to products page with this category filter
                          window.location.href = `/products?category=${encodeURIComponent(category.name)}`;
                        }}
                        sx={{ mr: 2 }}
                        disabled={!category.productCount || category.productCount === 0}
                      >
                        View Products
                      </Button>
                      
                      {/* Batch Edit Button */}
                      <Button 
                        variant="contained"
                        size="small"
                        color="secondary"
                        onClick={() => {
                          // Navigate to products page with batch edit mode for this category
                          window.location.href = `/products?category=${encodeURIComponent(category.name)}&batchEdit=true`;
                        }}
                        sx={{ mr: 2 }}
                        disabled={!category.productCount || category.productCount === 0}
                      >
                        Batch Edit
                      </Button>
                      
                      {/* Price Update Button */}
                      <Button 
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() => {
                          // Navigate to products page with price update mode for this category
                          window.location.href = `/products?category=${encodeURIComponent(category.name)}&priceUpdate=true`;
                        }}
                        sx={{ mr: 2 }}
                        disabled={!category.productCount || category.productCount === 0}
                      >
                        Price Update
                      </Button>
                    </Box>
                    
                    {/* Actions */}
                    <Box sx={{ 
                      display: 'flex', 
                      mt: { xs: 1, sm: 0 },
                      width: { xs: '100%', sm: 'auto' },
                      justifyContent: { xs: 'flex-end', sm: 'flex-end' }
                    }}>
                      <IconButton onClick={() => handleEditCategory(category)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        color="error"
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={category.productCount ? category.productCount > 0 : false}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
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