"use client"
import React, { useState, useEffect } from 'react';
import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';
import PageHeader from '@/components/PageHeader/PageHeader';
import EnhancedProductList from '../components/EnhancedProductList';
import ExcelImportExport from '@/components/products/ExcelImportExport';
import {
  Container,
  Typography,
  Box,
  Button,
  Snackbar,
  Alert,
  Fab,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  FileDownload,
  Analytics,
  Refresh
} from '@mui/icons-material';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/firebase/config';

// Enhanced Product interface (same as in the component)
interface EnhancedProduct {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  sku?: string;
  barcode?: string;
  unitOfMeasure?: string;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  supplier?: string;
  lastRestocked?: Date;
  lastSold?: Date;
  totalSold?: number;
  profit?: number;
  images?: string[];
  tags?: string[];
  rating?: number;
  reviews?: number;
  isBookmarked?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function EnhancedProductsPage() {
  // State
  const [products, setProducts] = useState<EnhancedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<EnhancedProduct | null>(null);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Statistics
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    categoriesCount: 0
  });

  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: '',
    price: 0,
    stock: 0,
    sku: '',
    unitOfMeasure: 'units',
    reorderPoint: 10,
    supplier: '',
    tags: [] as string[]
  });

  // Fetch products from Firestore
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsRef = collection(db, 'products');
      const q = query(productsRef, orderBy('name'));
      const snapshot = await getDocs(q);
      
      const productsList: EnhancedProduct[] = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Helper function to safely convert dates
        const safeToDate = (dateField: any): Date => {
          if (!dateField) return new Date();
          if (typeof dateField.toDate === 'function') {
            return dateField.toDate();
          }
          if (dateField instanceof Date) {
            return dateField;
          }
          if (typeof dateField === 'string') {
            return new Date(dateField);
          }
          return new Date();
        };

        const safeToDateOrUndefined = (dateField: any): Date | undefined => {
          if (!dateField) return undefined;
          if (typeof dateField.toDate === 'function') {
            return dateField.toDate();
          }
          if (dateField instanceof Date) {
            return dateField;
          }
          if (typeof dateField === 'string') {
            return new Date(dateField);
          }
          return undefined;
        };

        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          category: data.category || '',
          price: Number(data.price) || 0,
          stock: Number(data.stock) || 0,
          status: data.status || (Number(data.stock) > 0 ? 'In Stock' : 'Out of Stock'),
          sku: data.sku || '',
          barcode: data.barcode || '',
          unitOfMeasure: data.unitOfMeasure || 'units',
          minStock: Number(data.minStock) || 0,
          maxStock: Number(data.maxStock) || 0,
          reorderPoint: Number(data.reorderPoint) || 10,
          supplier: data.supplier || '',
          lastRestocked: safeToDate(data.lastRestocked),
          lastSold: safeToDateOrUndefined(data.lastSold),
          totalSold: Number(data.totalSold) || 0,
          profit: Number(data.profit) || 0,
          images: data.images || [],
          tags: data.tags || [],
          rating: Number(data.rating) || 0,
          reviews: Number(data.reviews) || 0,
          isBookmarked: Boolean(data.isBookmarked) || false,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt)
        };
      });
      
      setProducts(productsList);
      calculateStats(productsList);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products. Please try again.');
      showSnackbar('Failed to fetch products', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (productsList: EnhancedProduct[]) => {
    const totalProducts = productsList.length;
    const totalValue = productsList.reduce((sum, product) => sum + (product.price * product.stock), 0);
    const lowStockCount = productsList.filter(p => p.stock > 0 && p.stock <= p.reorderPoint).length;
    const outOfStockCount = productsList.filter(p => p.stock === 0).length;
    const categoriesCount = new Set(productsList.map(p => p.category)).size;
    
    setStats({
      totalProducts,
      totalValue,
      lowStockCount,
      outOfStockCount,
      categoriesCount
    });
  };

  // Handle product selection
  const handleProductSelect = (product: EnhancedProduct) => {
    console.log('Product selected:', product);
  };

  // Handle product edit
  const handleProductEdit = (product: EnhancedProduct) => {
    setSelectedProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description || '',
      category: product.category,
      price: product.price,
      stock: product.stock,
      sku: product.sku || '',
      unitOfMeasure: product.unitOfMeasure || 'units',
      reorderPoint: product.reorderPoint || 10,
      supplier: product.supplier || '',
      tags: product.tags || []
    });
    setEditProductOpen(true);
  };

  // Handle product delete
  const handleProductDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'products', productId));
      setProducts(prev => prev.filter(p => p.id !== productId));
      showSnackbar('Product deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting product:', err);
      showSnackbar('Failed to delete product', 'error');
    }
  };

  // Handle bulk actions
  const handleBulkActions = async (action: string, productIds: string[]) => {
    try {
      switch (action) {
        case 'delete':
          if (!window.confirm(`Are you sure you want to delete ${productIds.length} products?`)) {
            return;
          }
          
          const batch = writeBatch(db);
          productIds.forEach(id => {
            batch.delete(doc(db, 'products', id));
          });
          await batch.commit();
          
          setProducts(prev => prev.filter(p => !productIds.includes(p.id)));
          showSnackbar(`${productIds.length} products deleted successfully`, 'success');
          break;
          
        case 'export':
          // Handle export logic
          const selectedProducts = products.filter(p => productIds.includes(p.id));
          const csvContent = generateCSV(selectedProducts);
          downloadCSV(csvContent, 'selected-products.csv');
          showSnackbar('Products exported successfully', 'success');
          break;
          
        default:
          console.log('Unknown bulk action:', action);
      }
    } catch (err) {
      console.error('Error performing bulk action:', err);
      showSnackbar('Failed to perform bulk action', 'error');
    }
  };

  // Save product (add or update)
  const handleSaveProduct = async () => {
    try {
      const productData = {
        ...newProduct,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        reorderPoint: Number(newProduct.reorderPoint),
        updatedAt: new Date()
      };

      if (selectedProduct) {
        // Update existing product
        await updateDoc(doc(db, 'products', selectedProduct.id), productData);
        setProducts(prev => prev.map(p => 
          p.id === selectedProduct.id 
            ? { ...p, ...productData, updatedAt: new Date() }
            : p
        ));
        showSnackbar('Product updated successfully', 'success');
      } else {
        // Add new product
        const docRef = await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: new Date()
        });
        
        const newProductWithId: EnhancedProduct = {
          id: docRef.id,
          ...productData,
          description: productData.description || '',
          sku: productData.sku || '',
          barcode: '',
          minStock: 0,
          maxStock: 0,
          supplier: productData.supplier || '',
          lastRestocked: new Date(),
          lastSold: undefined,
          totalSold: 0,
          profit: 0,
          images: [],
          tags: productData.tags || [],
          rating: 0,
          reviews: 0,
          isBookmarked: false,
          status: productData.stock > 0 ? 'In Stock' : 'Out of Stock',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        setProducts(prev => [...prev, newProductWithId]);
        showSnackbar('Product added successfully', 'success');
      }
      
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving product:', err);
      showSnackbar('Failed to save product', 'error');
    }
  };

  // Close dialogs
  const handleCloseDialog = () => {
    setAddProductOpen(false);
    setEditProductOpen(false);
    setSelectedProduct(null);
    setNewProduct({
      name: '',
      description: '',
      category: '',
      price: 0,
      stock: 0,
      sku: '',
      unitOfMeasure: 'units',
      reorderPoint: 10,
      supplier: '',
      tags: []
    });
  };

  // Show snackbar
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  // Generate CSV
  const generateCSV = (data: EnhancedProduct[]) => {
    const headers = ['Name', 'SKU', 'Category', 'Price', 'Stock', 'Status'];
    const rows = data.map(product => [
      product.name,
      product.sku || '',
      product.category,
      product.price.toString(),
      product.stock.toString(),
      product.status
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  // Download CSV
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Load data on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <ImprovedDashboardLayout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Enhanced Products Management
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchProducts}
                disabled={loading}
              >
                Refresh
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Analytics />}
                onClick={() => console.log('Analytics')}
              >
                Analytics
              </Button>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddProductOpen(true)}
              >
                Add Product
              </Button>
            </Box>
          </Box>

          {/* Statistics Cards */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Paper sx={{ p: 2, minWidth: 150, flex: 1 }}>
              <Typography variant="h5" color="primary" fontWeight="bold">
                {stats.totalProducts}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Products
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, minWidth: 150, flex: 1 }}>
              <Typography variant="h5" color="success.main" fontWeight="bold">
                ₹{stats.totalValue.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Value
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, minWidth: 150, flex: 1 }}>
              <Typography variant="h5" color="warning.main" fontWeight="bold">
                {stats.lowStockCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Low Stock
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, minWidth: 150, flex: 1 }}>
              <Typography variant="h5" color="error.main" fontWeight="bold">
                {stats.outOfStockCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Out of Stock
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, minWidth: 150, flex: 1 }}>
              <Typography variant="h5" color="info.main" fontWeight="bold">
                {stats.categoriesCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Categories
              </Typography>
            </Paper>
          </Box>

          {/* Quick Actions */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <ExcelImportExport onSuccess={fetchProducts} />
            
            <Button
              variant="outlined"
              startIcon={<FileDownload />}
              onClick={() => {
                const csvContent = generateCSV(products);
                downloadCSV(csvContent, 'all-products.csv');
                showSnackbar('Products exported successfully', 'success');
              }}
            >
              Export All
            </Button>
          </Box>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Enhanced Product List */}
        <EnhancedProductList
          products={products}
          loading={loading}
          onProductSelect={handleProductSelect}
          onProductEdit={handleProductEdit}
          onProductDelete={handleProductDelete}
          onBulkActions={handleBulkActions}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add product"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16
          }}
          onClick={() => setAddProductOpen(true)}
        >
          <AddIcon />
        </Fab>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </ImprovedDashboardLayout>
  );
}