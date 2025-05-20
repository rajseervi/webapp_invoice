import React, { useState, useRef, useEffect } from 'react';
import { 
  Button, 
  Box, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Typography, 
  Alert, 
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { 
  CloudUpload as UploadIcon, 
  CloudDownload as DownloadIcon,
  FileDownload as TemplateIcon,
  PriceChange as PriceChangeIcon
} from '@mui/icons-material';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  writeBatch, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { 
  generateCategoryPriceTemplate, 
  parseCategoryPriceExcel 
} from '@/utils/categoryPriceUtils';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

interface Category {
  id: string;
  name: string;
}

interface PriceUpdate {
  productId: string;
  productName: string;
  category: string;
  currentPrice: number;
  newPrice: number;
}

interface CategoryPriceUpdateProps {
  onSuccess: () => void;
}

const CategoryPriceUpdate: React.FC<CategoryPriceUpdateProps> = React.forwardRef(({ onSuccess }, ref) => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [priceUpdates, setPriceUpdates] = useState<PriceUpdate[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Expose methods to parent component
  React.useImperativeHandle(ref, () => ({
    handleOpenWithCategory: (categoryName: string) => {
      setOpen(true);
      setError(null);
      setSuccess(null);
      setPriceUpdates([]);
      setSelectedCategory(categoryName);
    }
  }));

  // Fetch categories when dialog opens
  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  // Fetch products when category is selected
  useEffect(() => {
    if (selectedCategory) {
      fetchProductsByCategory(selectedCategory);
    } else {
      setProducts([]);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const categoriesCollection = collection(db, 'categories');
      const categoriesSnapshot = await getDocs(categoriesCollection);
      const categoriesList = categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name
      }));
      setCategories(categoriesList);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(`Error fetching categories: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsByCategory = async (categoryName: string) => {
    try {
      setLoading(true);
      const productsRef = collection(db, 'products');
      const q = query(productsRef, where('category', '==', categoryName));
      const productsSnapshot = await getDocs(q);
      
      const productsList = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        category: doc.data().category,
        price: doc.data().price,
        stock: doc.data().stock
      }));
      
      setProducts(productsList);
      setPriceUpdates([]);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(`Error fetching products: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setError(null);
    setSuccess(null);
    setPriceUpdates([]);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedCategory('');
  };

  const handleCategoryChange = (event: any) => {
    setSelectedCategory(event.target.value);
    setError(null);
    setSuccess(null);
    setPriceUpdates([]);
  };

  const handleDownloadTemplate = () => {
    if (!selectedCategory || products.length === 0) {
      setError('Please select a category with products first.');
      return;
    }
    
    generateCategoryPriceTemplate(selectedCategory, products);
    setSuccess('Template downloaded successfully. Update prices in Excel and upload the file.');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!selectedCategory) {
      setError('Please select a category first.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const updates = await parseCategoryPriceExcel(file, products);
      setPriceUpdates(updates);
      setSuccess(`Successfully parsed ${updates.length} price updates from Excel file.`);
    } catch (err: any) {
      console.error('Error parsing Excel file:', err);
      setError(`Error parsing Excel file: ${err.message}`);
      setPriceUpdates([]);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUpdatePrices = async () => {
    if (priceUpdates.length === 0) {
      setError('No price updates to apply.');
      return;
    }

    setUploading(true);
    setError(null);
    
    try {
      const batch = writeBatch(db);
      
      // Add each price update to the batch
      for (const update of priceUpdates) {
        const productRef = doc(db, 'products', update.productId);
        const newPrice = Number(update.newPrice) || 0;
        batch.update(productRef, { 
          price: newPrice,
          updatedAt: new Date()
        });
      }
      
      // Commit the batch
      await batch.commit();
      
      setSuccess(`Successfully updated prices for ${priceUpdates.length} products.`);
      setPriceUpdates([]);
      onSuccess(); // Refresh product list
    } catch (err: any) {
      console.error('Error updating prices:', err);
      setError(`Error updating prices: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<PriceChangeIcon />}
        onClick={handleOpen}
        sx={{ mr: 1 }}
      >
        Category Price Update
      </Button>
      
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Update Prices by Category</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Category Price Update Tool
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Update product prices by category using Excel. Select a category, download the template, 
              update prices in Excel, and upload the file to apply changes.
            </Typography>
            
            {/* Category Selection */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Select Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={handleCategoryChange}
                label="Select Category"
                disabled={loading}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.name}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress />
              </Box>
            )}
            
            {selectedCategory && products.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {products.length} Products in {selectedCategory} Category
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Button
                    variant="outlined"
                    startIcon={<TemplateIcon />}
                    onClick={handleDownloadTemplate}
                  >
                    Download Price Template
                  </Button>
                  
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<UploadIcon />}
                    disabled={uploading}
                  >
                    Upload Price Updates
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls"
                      hidden
                      onChange={handleFileChange}
                    />
                  </Button>
                </Box>
              </Box>
            )}
            
            {selectedCategory && products.length === 0 && !loading && (
              <Alert severity="info" sx={{ mb: 3 }}>
                No products found in the {selectedCategory} category.
              </Alert>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            
            {uploading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress />
              </Box>
            )}
            
            {/* Price Updates Preview */}
            {priceUpdates.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Price Updates Preview:
                </Typography>
                
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Current Price</TableCell>
                        <TableCell align="right">New Price</TableCell>
                        <TableCell align="right">Change</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {priceUpdates.map((update) => {
                        const currentPrice = Number(update.currentPrice) || 0;
                        const newPrice = Number(update.newPrice) || 0;
                        const priceDiff = newPrice - currentPrice;
                        const percentChange = currentPrice !== 0 ? (priceDiff / currentPrice) * 100 : 0;
                        
                        return (
                          <TableRow key={update.productId}>
                            <TableCell>{update.productName}</TableCell>
                            <TableCell align="right">${currentPrice.toFixed(2)}</TableCell>
                            <TableCell align="right">${newPrice.toFixed(2)}</TableCell>
                            <TableCell align="right">
                              <Chip 
                                label={`${priceDiff >= 0 ? '+' : ''}${priceDiff.toFixed(2)} (${percentChange.toFixed(1)}%)`}
                                color={priceDiff > 0 ? 'success' : priceDiff < 0 ? 'error' : 'default'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleUpdatePrices}
                  disabled={uploading}
                  fullWidth
                >
                  {uploading ? 
                    <CircularProgress size={24} /> : 
                    `Update Prices for ${priceUpdates.length} Products`
                  }
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

);
export default React.forwardRef((props: CategoryPriceUpdateProps, ref) => (
  <CategoryPriceUpdate {...props} ref={ref} />
));