"use client"
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ExcelImportExport from '@/components/products/ExcelImportExport';
import ExportAllProducts from '@/components/products/ExportAllProducts';
import ExportSelectedProducts from '@/components/products/ExportSelectedProducts';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Box,
  TextField,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Checkbox
} from '@mui/material';
import { RemoveDuplicatesButton } from '@/components/Common/RemoveDuplicatesButton';
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
  orderBy,
  limit,
  startAfter,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '@/firebase/config';

// Define product interface
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: string;
}

// Add category interface
interface Category {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [bulkCategoryDialogOpen, setBulkCategoryDialogOpen] = useState(false);
  const [selectedBulkCategory, setSelectedBulkCategory] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [lastVisible, setLastVisible] = useState<any>(null);
  
  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [isFirstPage, setIsFirstPage] = useState(true);
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: 0,
    stock: 0
  });

  // Fetch total count of products, considering search term and category filter
  const fetchTotalCount = async () => {
    try {
      const coll = collection(db, 'products');
      
      // Get the total count of all products
      const snapshot = await getCountFromServer(coll);
      const totalProducts = snapshot.data().count;
      
      if (!searchTerm && !categoryFilter) {
        // If no filters, use the total count
        setTotalCount(totalProducts);
      } else {
        // If there are filters, we need to get all products and filter them
        // This is not efficient for large datasets, but Firestore doesn't support
        // full-text search natively
        const allProductsQuery = query(collection(db, 'products'));
        const allProductsSnapshot = await getDocs(allProductsQuery);
        
        // Filter products based on search term and category
        const filteredCount = allProductsSnapshot.docs.filter(doc => {
          const data = doc.data();
          
          // Check if product matches search term
          const matchesSearch = !searchTerm || (
            data.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            data.category.toLowerCase().includes(searchTerm.toLowerCase())
          );
          
          // Check if product matches category filter
          const matchesCategory = !categoryFilter || data.category === categoryFilter;
          
          // Product must match both filters
          return matchesSearch && matchesCategory;
        }).length;
        
        setTotalCount(filteredCount);
      }
    } catch (error) {
      console.error('Error fetching total count:', error);
    }
  };

  // Fetch products with pagination, search, and category filtering
  const fetchProducts = async (reset = false) => {
    try {
      setLoading(true);
      
      // Base collection reference
      const productsRef = collection(db, 'products');
      
      // Build query constraints
      let queryConstraints = [];
      
      // Add category filter if specified (this can be done server-side)
      if (categoryFilter) {
        queryConstraints.push(where('category', '==', categoryFilter));
      }
      
      // Add ordering
      queryConstraints.push(orderBy('name'));
      
      // Add pagination constraints
      if (!reset && !isFirstPage) {
        queryConstraints.push(startAfter(lastVisible));
      } else {
        setIsFirstPage(true);
      }
      
      // Add limit
      queryConstraints.push(limit(rowsPerPage));
      
      // Create the query
      let productsQuery = query(productsRef, ...queryConstraints);
      
      // For search, we'll need to do client-side filtering
      // In a real production app, you would use a search service like Algolia or Elasticsearch
      // Firestore doesn't support full-text search natively
      
      const productsSnapshot = await getDocs(productsQuery);
      
      // Store the last visible document for pagination
      const lastVisibleDoc = productsSnapshot.docs[productsSnapshot.docs.length - 1];
      setLastVisible(lastVisibleDoc);
      
      // Map the documents to our product objects
      let productsList = productsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          category: data.category,
          price: data.price,
          stock: data.stock,
          status: data.stock < 10 ? 'Low Stock' : 'In Stock'
        };
      });
      
      // If there's a search term, filter the results client-side
      if (searchTerm) {
        productsList = productsList.filter(product => 
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      // If we got fewer results than expected, try to fetch more
      if (productsList.length < rowsPerPage && productsSnapshot.docs.length === rowsPerPage && lastVisibleDoc) {
        // There might be more results on the next page
        // Build query constraints for next page
        let nextPageConstraints = [];
        
        // Add category filter if specified
        if (categoryFilter) {
          nextPageConstraints.push(where('category', '==', categoryFilter));
        }
        
        // Add ordering and pagination
        nextPageConstraints.push(orderBy('name'));
        nextPageConstraints.push(startAfter(lastVisibleDoc));
        nextPageConstraints.push(limit(rowsPerPage));
        
        // Create the query
        const nextPageQuery = query(
          collection(db, 'products'),
          ...nextPageConstraints
        );
        
        try {
          const nextPageSnapshot = await getDocs(nextPageQuery);
          
          if (nextPageSnapshot.docs.length > 0) {
            const nextPageProducts = nextPageSnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.name,
                category: data.category,
                price: data.price,
                stock: data.stock,
                status: data.stock < 10 ? 'Low Stock' : 'In Stock'
              };
            });
            
            // Filter and add to current results
            const filteredNextPage = nextPageProducts.filter(product => 
              product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              product.category.toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            if (filteredNextPage.length > 0) {
              // Update last visible for pagination
              setLastVisible(nextPageSnapshot.docs[nextPageSnapshot.docs.length - 1]);
              // Add to current results
              productsList = [...productsList, ...filteredNextPage].slice(0, rowsPerPage);
            }
          }
        } catch (error) {
          console.error('Error fetching additional search results:', error);
        }
      }
      
      setProducts(productsList);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch categories
  const fetchCategories = async () => {
    try {
      const categoriesCollection = collection(db, 'categories');
      const categoriesSnapshot = await getDocs(categoriesCollection);
      
      const categoriesList = categoriesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name
        };
      });
      
      setCategories(categoriesList);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch categories. Please try again later.');
    }
  };
  
  // Main fetch data function
  const fetchData = async (reset = false) => {
    try {
      setLoading(true);
      await Promise.all([
        fetchTotalCount(),
        fetchProducts(reset),
        fetchCategories()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData(true);
  }, []);
  
  // Fetch data when page, rowsPerPage, or searchTerm changes
  useEffect(() => {
    if (page === 0) {
      fetchData(true);
    } else {
      fetchData(false);
    }
  }, [page, rowsPerPage]);
  
  // Reset pagination and fetch data when search term changes
  useEffect(() => {
    // We'll implement debouncing to avoid too many requests
    const delayDebounceFn = setTimeout(() => {
      // Reset to first page when search term changes
      setPage(0);
      setIsFirstPage(true);
      
      // Fetch data with the new search term
      fetchData(true);
    }, 500); // 500ms delay
    
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);
  
  // Reset pagination and fetch data when category filter changes
  useEffect(() => {
    // Reset to first page when category filter changes
    setPage(0);
    setIsFirstPage(true);
    
    // Fetch data with the new category filter
    fetchData(true);
  }, [categoryFilter]);
  
  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    // If going forward, use the current lastVisible
    // If going backward to page 0, reset and fetch from beginning
    if (newPage > page) {
      setIsFirstPage(false);
    } else if (newPage === 0) {
      setIsFirstPage(true);
    }
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to first page
    setIsFirstPage(true);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    // The useEffect hook with debounce will handle the pagination reset and data fetching
  };
  
  const handleCategoryFilter = (event: any) => {
    setCategoryFilter(event.target.value as string);
    // The useEffect hook will handle the pagination reset and data fetching
  };

  // Products are already filtered in the fetchProducts function
  const filteredProducts = products;

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setNewProduct({
      name: '',
      category: '',
      price: 0,
      stock: 0
    });
    setOpenDialog(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setNewProduct({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name as string]: value
    });
  };

  const handleSaveProduct = async () => {
    try {
      setLoading(true);
      
      if (selectedProduct) {
        // Update existing product in Firebase
        const productRef = doc(db, 'products', selectedProduct.id);
        await updateDoc(productRef, {
          name: newProduct.name,
          category: newProduct.category,
          price: Number(newProduct.price),
          stock: Number(newProduct.stock)
        });
        
        // Update local state
        setProducts(products.map(p => 
          p.id === selectedProduct.id 
            ? { 
                ...p, 
                ...newProduct, 
                status: Number(newProduct.stock) < 10 ? 'Low Stock' : 'In Stock' 
              } 
            : p
        ));
      } else {
        // Create new product in Firebase
        const productsCollection = collection(db, 'products');
        const docRef = await addDoc(productsCollection, {
          name: newProduct.name,
          category: newProduct.category,
          price: Number(newProduct.price),
          stock: Number(newProduct.stock)
        });
        
        // Add to local state
        setProducts([...products, {
          id: docRef.id,
          ...newProduct,
          status: Number(newProduct.stock) < 10 ? 'Low Stock' : 'In Stock'
        }]);
      }
      
      setOpenDialog(false);
      setError(null);
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Failed to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        setLoading(true);
        
        // Delete from Firebase
        const productRef = doc(db, 'products', id);
        await deleteDoc(productRef);
        
        // Refresh the data after deletion
        fetchTotalCount();
        fetchProducts(true);
        setPage(0); // Reset to first page
        
        setError(null);
      } catch (err) {
        console.error('Error deleting product:', err);
        setError('Failed to delete product. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkCategoryChange = async () => {
    if (!selectedBulkCategory || selectedProducts.length === 0) return;
    
    try {
      setLoading(true);
      
      // Update all selected products with new category
      const updatePromises = selectedProducts?.map(async (productId) => {
        const productRef = doc(db, 'products', productId);
        await updateDoc(productRef, {
          category: selectedBulkCategory
        });
      });
      
      await Promise.all(updatePromises);
      
      // Refresh the data after update
      fetchProducts(page === 0);
      
      setSelectedProducts([]);
      setBulkCategoryDialogOpen(false);
      setSelectedBulkCategory('');
      setError(null);
    } catch (err) {
      console.error('Error updating categories:', err);
      setError('Failed to update categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAllProducts = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedProducts(filteredProducts.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5">Products</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <ExcelImportExport onSuccess={fetchData} />
            <ExportAllProducts />
            <RemoveDuplicatesButton onSuccess={fetchData} />
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleAddProduct}
            >
              Add Product
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              label="Search Products"
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="category-filter-label">Filter by Category</InputLabel>
              <Select
                labelId="category-filter-label"
                id="category-filter"
                value={categoryFilter}
                onChange={handleCategoryFilter}
                label="Filter by Category"
                startAdornment={<FilterListIcon sx={{ mr: 1, color: 'text.secondary' }} />}
              >
                <MenuItem value="">
                  <em>All Categories</em>
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.name}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button 
              variant="outlined" 
              startIcon={<FilterListIcon />}
            >
              Filter
            </Button>
            {selectedProducts.length > 0 && (
              <>
                <ExportSelectedProducts selectedIds={selectedProducts} />
                <Button
                  variant="contained"
                  onClick={() => setBulkCategoryDialogOpen(true)}
                >
                  Update Category ({selectedProducts.length})
                </Button>
              </>
            )}
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedProducts.length > 0 && selectedProducts.length < filteredProducts.length}
                      checked={selectedProducts.length > 0 && selectedProducts.length === filteredProducts.length}
                      onChange={handleSelectAllProducts}
                    />
                  </TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                      Loading products...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No products found</TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                        />
                      </TableCell>
                      <TableCell>{product.id.substring(0, 8)}...</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>₹{product.price}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>
                        <Chip 
                          label={product.status} 
                          color={product.status === 'Low Stock' ? 'warning' : 'success'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEditProduct(product)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {!loading && (
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{ borderTop: '1px solid rgba(224, 224, 224, 1)' }}
            />
          )}
        </Paper>
      </Container>

      {/* Bulk Category Update Dialog */}
      <Dialog open={bulkCategoryDialogOpen} onClose={() => setBulkCategoryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Category for Selected Products</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                label="Category"
                value={selectedBulkCategory}
                onChange={(e) => setSelectedBulkCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.name}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkCategoryDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleBulkCategoryChange} 
            variant="contained"
            disabled={loading || !selectedBulkCategory}
          >
            {loading ? <CircularProgress size={24} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Product Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Product Name"
              name="name"
              fullWidth
              value={newProduct.name}
              onChange={handleInputChange}
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                label="Category"
                name="category"
                value={newProduct.category}
                onChange={handleInputChange}
              >
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <MenuItem key={category.id} value={category.name}>
                      {category.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled value="">
                    No categories available
                  </MenuItem>
                )}
              </Select>
            </FormControl>
            <TextField
              label="Price"
              name="price"
              type="number"
              fullWidth
              value={newProduct.price}
              onChange={handleInputChange}
            />
            <TextField
              label="Stock"
              name="stock"
              type="number"
              fullWidth
              value={newProduct.stock}
              onChange={handleInputChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveProduct} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Category Update Dialog */}
      <Dialog open={bulkCategoryDialogOpen} onClose={() => setBulkCategoryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Category for Selected Products</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                label="Category"
                value={selectedBulkCategory}
                onChange={(e) => setSelectedBulkCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.name}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkCategoryDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleBulkCategoryChange} 
            variant="contained"
            disabled={loading || !selectedBulkCategory}
          >
            {loading ? <CircularProgress size={24} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAllProducts = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedProducts(filteredProducts.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };