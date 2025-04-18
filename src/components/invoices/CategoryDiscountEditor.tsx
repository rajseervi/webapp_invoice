"use client";
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
  Divider,
  InputAdornment,
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';

interface Category {
  id: string;
  name: string;
  defaultDiscount?: number;
}

interface CategoryDiscount {
  categoryId: string;
  categoryName: string;
  discount: number;
}

interface CategoryDiscountEditorProps {
  open: boolean;
  onClose: () => void;
  partyId: string;
  categoryDiscounts: Record<string, number>;
  onSave: (updatedDiscounts: Record<string, number>) => void;
}

const CategoryDiscountEditor: React.FC<CategoryDiscountEditorProps> = ({
  open,
  onClose,
  partyId,
  categoryDiscounts,
  onSave
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [discounts, setDiscounts] = useState<CategoryDiscount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDiscountsCount, setActiveDiscountsCount] = useState<number>(0);
  const [showOnlyActive, setShowOnlyActive] = useState<boolean>(false);

  // Fetch all categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const categoriesCollection = collection(db, 'categories');
        const categoriesSnapshot = await getDocs(categoriesCollection);
        
        const categoriesList = categoriesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            defaultDiscount: data.defaultDiscount || 0
          };
        });
        
        setCategories(categoriesList);
        
        // Initialize discounts array with current values
        const discountsList = categoriesList.map(category => {
          // Check if there's a discount for this category name
          const discount = categoryDiscounts[category.name] || 0;
          
          // Log for debugging
          console.log(`Loading discount for category "${category.name}": ${discount}%`);
          
          return {
            categoryId: category.id,
            categoryName: category.name,
            discount: discount
          };
        });
        
        setDiscounts(discountsList);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (open) {
      fetchCategories();
    }
  }, [open, categoryDiscounts]);

  // Update active discounts count whenever discounts change
  useEffect(() => {
    const count = discounts.filter(item => item.discount > 0).length;
    setActiveDiscountsCount(count);
  }, [discounts]);

  // Create a ref for the input field
  const discountInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleStartEditing = (categoryId: string, currentDiscount: number) => {
    setEditingCategoryId(categoryId);
    setEditValue(currentDiscount);
    
    // Focus and select the input field after the state has been updated
    setTimeout(() => {
      if (discountInputRef.current) {
        discountInputRef.current.focus();
        discountInputRef.current.select();
      }
    }, 100);
  };

  const handleCancelEditing = () => {
    setEditingCategoryId(null);
    setEditValue(0);
  };

  const handleSaveDiscount = (categoryId: string) => {
    // Ensure the discount value is valid (between 0 and 100)
    const validDiscount = Math.min(100, Math.max(0, editValue));
    
    // Update the discount in the local state
    setDiscounts(prevDiscounts => 
      prevDiscounts.map(item => 
        item.categoryId === categoryId 
          ? { ...item, discount: validDiscount } 
          : item
      )
    );
    
    // Log for debugging
    const categoryName = discounts.find(item => item.categoryId === categoryId)?.categoryName || '';
    console.log(`Saving discount for category "${categoryName}" (ID: ${categoryId}): ${validDiscount}%`);
    
    setEditingCategoryId(null);
  };

  const handleSaveAllDiscounts = () => {
    // Convert discounts array to the expected format
    const updatedDiscounts: Record<string, number> = {};
    
    discounts.forEach(item => {
      if (item.discount > 0) {
        // Use category name as the key instead of category ID
        updatedDiscounts[item.categoryName] = item.discount;
        
        // Log for debugging
        console.log(`Setting discount for category "${item.categoryName}": ${item.discount}%`);
      }
    });
    
    // Log the final discount object
    console.log('Final category discounts:', updatedDiscounts);
    
    onSave(updatedDiscounts);
    onClose();
  };

  const handleResetToDefaults = () => {
    // Reset to default discounts from categories
    setDiscounts(
      categories.map(category => ({
        categoryId: category.id,
        categoryName: category.name,
        discount: category.defaultDiscount || 0
      }))
    );
  };
  
  // Filter discounts based on search query and active filter
  const filteredDiscounts = discounts.filter(item => {
    // First check if we should only show active discounts
    if (showOnlyActive && item.discount <= 0) {
      return false;
    }
    
    // Then check if it matches the search query
    return searchQuery === '' || 
      item.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  // Handle search query change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  
  // Clear search query
  const handleClearSearch = () => {
    setSearchQuery('');
  };
  
  // Toggle showing only active discounts
  const handleToggleShowOnlyActive = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowOnlyActive(event.target.checked);
  };
  
  // Function to highlight matching text in search results
  const highlightMatchingText = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    
    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <Box 
              component="span" 
              key={index} 
              sx={{ 
                backgroundColor: 'primary.light', 
                color: 'primary.contrastText',
                px: 0.5,
                borderRadius: 0.5,
                fontWeight: 'medium'
              }}
            >
              {part}
            </Box>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Handle keyboard shortcuts
  const handleDialogKeyDown = (event: React.KeyboardEvent) => {
    // Ctrl+F or Command+F to focus search
    if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
      event.preventDefault();
      const searchInput = document.getElementById('category-search-input');
      if (searchInput) {
        searchInput.focus();
      }
    }
    
    // Escape to clear search if search is focused and has content
    if (event.key === 'Escape' && searchQuery && document.activeElement?.id === 'category-search-input') {
      event.preventDefault();
      setSearchQuery('');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      onKeyDown={handleDialogKeyDown}
    >
      <DialogTitle>
        <Typography variant="h6">Edit Category Discounts</Typography>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Set discount percentages for each product category. These discounts will be applied to all products in the respective categories for this invoice.
        </Typography>
        
        {/* Search and Active Discounts Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Tooltip title="Press Ctrl+F or ⌘+F to search">
            <TextField
              id="category-search-input"
              placeholder="Search categories... (Ctrl+F)"
              size="small"
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{ width: '300px' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton 
                      size="small" 
                      onClick={handleClearSearch}
                      edge="end"
                      aria-label="clear search"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Tooltip>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch 
                  size="small" 
                  checked={showOnlyActive}
                  onChange={handleToggleShowOnlyActive}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  Show active only
                </Typography>
              }
              sx={{ mr: 1 }}
            />
            
            <Chip 
              label={`${activeDiscountsCount} Active Discount${activeDiscountsCount !== 1 ? 's' : ''}`}
              color="primary"
              variant={activeDiscountsCount > 0 ? "default" : "outlined"}
              size="small"
            />
          </Box>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Discount (%)</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDiscounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        {searchQuery !== '' && showOnlyActive ? (
                          <>No active categories found matching "{searchQuery}"</>
                        ) : searchQuery !== '' ? (
                          <>No categories found matching "{searchQuery}"</>
                        ) : showOnlyActive ? (
                          <>No active discounts found. Set discounts for categories to see them here.</>
                        ) : (
                          <>No categories found</>
                        )}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredDiscounts.map((item) => (
                  <TableRow key={item.categoryId}>
                    <TableCell>
                      {searchQuery ? (
                        // Highlight the matching text
                        highlightMatchingText(item.categoryName, searchQuery)
                      ) : (
                        item.categoryName
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {editingCategoryId === item.categoryId ? (
                        <TextField
                          type="number"
                          size="small"
                          value={editValue}
                          onChange={(e) => {
                            // Parse the value, default to 0 if empty or NaN
                            let value = Number(e.target.value);
                            if (isNaN(value)) value = 0;
                            
                            // Ensure value is between 0 and 100
                            value = Math.min(100, Math.max(0, value));
                            
                            setEditValue(value);
                          }}
                          onFocus={(e) => e.target.select()} // Select all text when focused
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveDiscount(item.categoryId);
                            } else if (e.key === 'Escape') {
                              handleCancelEditing();
                            }
                          }}
                          inputProps={{ 
                            min: 0, 
                            max: 100, 
                            step: 0.5,
                            // Add aria-label for accessibility
                            'aria-label': `Discount percentage for ${item.categoryName}`
                          }}
                          sx={{ width: 100 }}
                          inputRef={discountInputRef}
                        />
                      ) : (
                        <Typography 
                          variant="body2" 
                          color={item.discount > 0 ? 'primary.main' : 'text.secondary'}
                          fontWeight={item.discount > 0 ? 'medium' : 'normal'}
                        >
                          {item.discount}%
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {editingCategoryId === item.categoryId ? (
                        <Box>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleSaveDiscount(item.categoryId)}
                          >
                            <SaveIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={handleCancelEditing}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : (
                        <IconButton 
                          size="small" 
                          onClick={() => handleStartEditing(item.categoryId, item.discount)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {/* We don't need this anymore since we handle all empty states above */}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title="Reset to default category discounts">
            <Button 
              startIcon={<RefreshIcon />} 
              onClick={handleResetToDefaults}
              size="small"
            >
              Reset to Defaults
            </Button>
          </Tooltip>
        </Box>
      </DialogContent>
      
      <Divider />
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleSaveAllDiscounts} 
          variant="contained"
          disabled={loading}
        >
          Apply Discounts
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryDiscountEditor;