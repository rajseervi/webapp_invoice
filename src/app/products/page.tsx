"use client"
import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import PageHeader from '@/components/PageHeader/PageHeader';
import ExcelImportExport from '@/components/products/ExcelImportExport';
import ExportAllProducts from '@/components/products/ExportAllProducts';
import ExportSelectedProducts from '@/components/products/ExportSelectedProducts';
import CategoryPriceUpdate from '@/components/products/CategoryPriceUpdate';
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
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Checkbox,
  Grid,
  Slider,
  Tooltip,
  Divider,
  Autocomplete,
  InputAdornment,
  Snackbar,
  List,
  ListItemButton
} from '@mui/material';
import { RemoveDuplicatesButton } from '@/components/Common/RemoveDuplicatesButton';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  TuneOutlined as TuneIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
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
  getCountFromServer,
  QueryConstraint
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
  const categoryPriceUpdateRef = React.useRef<any>(null);
  const searchDebounceTimeout = React.useRef<NodeJS.Timeout | null>(null);
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [stockRange, setStockRange] = useState<[number, number]>([0, 1000]);
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Category batch edit dialog state
  const [categoryBatchEditOpen, setCategoryBatchEditOpen] = useState(false);
  const [selectedCategoryForBatch, setSelectedCategoryForBatch] = useState<string>('');
  const [productsInSelectedCategory, setProductsInSelectedCategory] = useState<Product[]>([]);
  const [productUpdates, setProductUpdates] = useState<{[id: string]: {price?: number, stock?: number}}>({});
  const [batchEditFields, setBatchEditFields] = useState({
    price: {
      enabled: false,
      value: 0
    },
    stock: {
      enabled: false,
      value: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Using a Set for faster lookups
  const [selectedProductsSet, setSelectedProductsSet] = useState<Set<string>>(new Set());
  // Keep array version for compatibility with existing code
  const selectedProducts = useMemo(() => Array.from(selectedProductsSet), [selectedProductsSet]);
  const [bulkCategoryDialogOpen, setBulkCategoryDialogOpen] = useState(false);
  const [selectedBulkCategory, setSelectedBulkCategory] = useState('');
  // Snackbar state for success messages
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [lastVisible, setLastVisible] = useState<any>(null);

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in-stock' | 'low-stock'>('all');
  const [isFirstPage, setIsFirstPage] = useState(true);
  
  // Sorting state
  type SortField = 'name' | 'category' | 'price' | 'stock' | '';
  const [sortField, setSortField] = useState<SortField>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Column filter state
  const [columnFilters, setColumnFilters] = useState<{
    name: string;
    category: string;
    price: [number, number];
    stock: [number, number];
    status: string;
  }>({
    name: '',
    category: '',
    price: [0, 10000],
    stock: [0, 1000],
    status: ''
  });
  
  // Column filter dialog state
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [activeFilterColumn, setActiveFilterColumn] = useState<string>('');

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

      if (!isSearchActive() && !categoryFilter) {
        // If no filters or search, use the total count
        setTotalCount(totalProducts);
      } else if (categoryFilter && !isSearchActive()) {
        // If only category filter is active, we can use a more efficient query
        const categoryQuery = query(collection(db, 'products'), where('category', '==', categoryFilter));
        const categorySnapshot = await getCountFromServer(categoryQuery);
        setTotalCount(categorySnapshot.data().count);
      } else {
        // If search is active, we'll use the length of the filtered products array
        // This is handled in the fetchProducts function, which sets the products state
        // We don't need to set totalCount here as it won't be used for pagination
        // when search is active
        
        // However, we still need to fetch the count for category filter
        if (categoryFilter && !searchTerm) {
          const categoryQuery = query(collection(db, 'products'), where('category', '==', categoryFilter));
          const categorySnapshot = await getCountFromServer(categoryQuery);
          setTotalCount(categorySnapshot.data().count);
        }
      }
    } catch (error) {
      console.error('Error fetching total count:', error);
    }
  };



  // Fetch products with pagination, search, and filtering
  const fetchProducts = async (reset = false) => {
    try {
      setLoading(true);

      // Base collection reference
      const productsRef = collection(db, 'products');

      // Build query constraints
      let queryConstraints = [];
      let useClientSideFiltering = false;

      // IMPORTANT: To completely avoid index requirements, we'll use a different approach
      // When filtering by category, we'll ONLY use the category filter without any ordering
      // This avoids the need for a composite index entirely
      if (categoryFilter) {
        // Only use category filter without ordering
        queryConstraints.push(where('category', '==', categoryFilter));
        console.log(`Using category-only filter for: ${categoryFilter} (no ordering)`);
      } else {
        // Only add ordering when not filtering by category
        queryConstraints.push(orderBy('name'));
      }

      // Add pagination constraints
      if (!reset && !isFirstPage && !useClientSideFiltering) {
        queryConstraints.push(startAfter(lastVisible));
      } else {
        setIsFirstPage(true);
      }

      // Add limit - don't limit results when search is active or when we need client-side filtering
      if (!isSearchActive() && !useClientSideFiltering) {
        queryConstraints.push(limit(rowsPerPage));
      } else {
        // When search is active or we need client-side filtering, fetch more results
        // but still limit to avoid performance issues
        queryConstraints.push(limit(100)); // Fetch up to 100 results
      }
      
      // If we're using client-side filtering for category, remove the category filter
      // from server-side constraints
      if (useClientSideFiltering && categoryFilter) {
        queryConstraints = queryConstraints.filter(
          constraint => !(constraint instanceof QueryConstraint && 
                         constraint.toString().includes(`category == ${categoryFilter}`))
        );
        console.log('Using client-side filtering for category instead of server-side');
      }

      // Create the query
      let productsQuery = query(productsRef, ...queryConstraints);

      // For search, we'll need to do client-side filtering
      // In a real production app, you would use a search service like Algolia or Elasticsearch
      // Firestore doesn't support full-text search natively

      let productsSnapshot;
      let hadIndexError = false;
      
      try {
        productsSnapshot = await getDocs(productsQuery);
      } catch (queryError: any) {
        // Completely suppress index errors and use a simpler approach
        console.log('Query failed, using fallback approach');
        
        try {
          // For category filtering, try a simple category-only query with a high limit
          if (categoryFilter) {
            const simpleQuery = query(
              productsRef, 
              where('category', '==', categoryFilter),
              limit(500)
            );
            productsSnapshot = await getDocs(simpleQuery);
          } else {
            // For non-category queries, just get all products with a limit
            const simpleQuery = query(productsRef, limit(500));
            productsSnapshot = await getDocs(simpleQuery);
            
            // We'll need to filter client-side
            useClientSideFiltering = true;
          }
        } catch (fallbackError) {
          // If even the simplest query fails, get all products
          console.log('Using last resort query');
          
          const lastResortQuery = query(productsRef, limit(500));
          productsSnapshot = await getDocs(lastResortQuery);
          useClientSideFiltering = true;
        }
      }

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
      
      // If we're using category filtering without ordering, sort the products by name client-side
      if (categoryFilter) {
        productsList.sort((a, b) => a.name.localeCompare(b.name));
        console.log(`Sorted ${productsList.length} products by name client-side`);
      }

      // Apply client-side filtering based on search term and other filters
      if (searchTerm || statusFilter !== 'all' || priceRange[0] > 0 || priceRange[1] < 10000 || 
          stockRange[0] > 0 || stockRange[1] < 1000 || (useClientSideFiltering && categoryFilter)) {
        
        // Log if we're using client-side filtering for category
        if (useClientSideFiltering && categoryFilter) {
          console.log(`Using client-side filtering for category: ${categoryFilter}`);
        }
        
        productsList = productsList.filter(product => {
          // Search term filtering
          let matchesSearch = true;
          if (searchTerm) {
            const termLower = searchTerm.toLowerCase();
            matchesSearch = 
              product.name.toLowerCase().includes(termLower) ||
              (product.category && product.category.toLowerCase().includes(termLower));
          }

          // Status filtering
          let matchesStatus = true;
          if (statusFilter !== 'all') {
            matchesStatus = statusFilter === 'low-stock' 
              ? product.stock < 10 
              : product.stock >= 10;
          }

          // Price range filtering
          const matchesPrice = 
            product.price >= priceRange[0] && 
            product.price <= priceRange[1];

          // Stock range filtering
          const matchesStock = 
            product.stock >= stockRange[0] && 
            product.stock <= stockRange[1];

          // Category filtering (in case we had to fall back to unfiltered query)
          let matchesCategory = true;
          if (useClientSideFiltering && categoryFilter) {
            matchesCategory = product.category === categoryFilter;
          }

          // Product must match all filters
          return matchesSearch && matchesStatus && matchesPrice && matchesStock && matchesCategory;
        });
        
        // Log the results of client-side filtering
        if (useClientSideFiltering && categoryFilter) {
          console.log(`Client-side filtering found ${productsList.length} products in category: ${categoryFilter}`);
        }
        
        // When search is active, update the total count to match the filtered results
        if (isSearchActive()) {
          setTotalCount(productsList.length);
        }

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
          nextPageConstraints.push(limit(rowsPerPage * 2)); // Fetch more to increase chances of finding matches

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

              // Apply the same filters to the next page results
              const filteredNextPage = nextPageProducts.filter(product => {
                // Search term filtering
                let matchesSearch = true;
                if (searchTerm) {
                  const termLower = searchTerm.toLowerCase();
                  matchesSearch = 
                    product.name.toLowerCase().includes(termLower) ||
                    product.category.toLowerCase().includes(termLower);
                }

                // Status filtering
                let matchesStatus = true;
                if (statusFilter !== 'all') {
                  matchesStatus = statusFilter === 'low-stock' 
                    ? product.stock < 10 
                    : product.stock >= 10;
                }

                // Price range filtering
                const matchesPrice = 
                  product.price >= priceRange[0] && 
                  product.price <= priceRange[1];

                // Stock range filtering
                const matchesStock = 
                  product.stock >= stockRange[0] && 
                  product.stock <= stockRange[1];

                // Product must match all filters
                return matchesSearch && matchesStatus && matchesPrice && matchesStock;
              });

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
      }
      
      // Generate search suggestions based on the current products
      if (searchTerm) {
        generateSearchSuggestions(searchTerm);
      } 
      // Always set products regardless of search term
      setProducts(productsList);
      setError(null);
    }
    catch (err: any) {
      console.error('Error fetching products:', err);
      // More detailed error message with error code if available
      const errorMessage = err.code 
        ? `Failed to fetch products (${err.code}). Please try again later.` 
        : 'Failed to fetch products. Please try again later.';
      setError(errorMessage);
      
      // If the error is related to Firebase permissions or authentication, we can handle it specifically
      if (err.code === 'permission-denied' || err.code === 'unauthenticated') {
        // You might want to trigger a re-authentication here or show a specific message
        console.log('Authentication or permission issue detected');
      }
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
  };;

  // Initial data fetch and load saved preferences
  useEffect(() => {
    // Load saved rows per page preference
    try {
      const savedRowsPerPage = localStorage.getItem('productsRowsPerPage');
      if (savedRowsPerPage) {
        const parsedValue = parseInt(savedRowsPerPage, 10);
        if (!isNaN(parsedValue) && parsedValue > 0 && parsedValue <= 100) {
          setRowsPerPage(parsedValue);
        }
      }
    } catch (error) {
      console.error('Error loading rows per page preference:', error);
    }
    
    fetchData(true);
  }, []);
  
  // Handle URL parameters for category filtering and batch editing
  useEffect(() => {
    // Only run this effect after products are loaded and not during loading
    if (products.length === 0 || loading) return;
    
    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    const batchEditParam = urlParams.get('batchEdit');
    const priceUpdateParam = urlParams.get('priceUpdate');
    
    if (categoryParam) {
      // Decode the category parameter to handle special characters
      const decodedCategory = decodeURIComponent(categoryParam);
      console.log('Category from URL:', decodedCategory);
      
      // Set category filter
      setCategoryFilter(decodedCategory);
      
      // If batch edit is requested, open the batch edit dialog
      if (batchEditParam === 'true') {
        // Small delay to ensure the component is fully mounted
        setTimeout(() => {
          handleOpenCategoryBatchEdit(decodedCategory);
        }, 300);
      }
      
      // If price update is requested, open the price update dialog
      if (priceUpdateParam === 'true' && categoryPriceUpdateRef.current) {
        // Small delay to ensure the component is fully mounted
        setTimeout(() => {
          categoryPriceUpdateRef.current.handleOpenWithCategory(decodedCategory);
        }, 300);
      }
    }
  }, [products, loading]);

  // Fetch data when page, rowsPerPage, or searchTerm changes
  useEffect(() => {
    if (page === 0) {
      fetchData(true);
    } else {
      fetchData(false);
    }
  }, [page, rowsPerPage]);

  // We no longer need this effect as search is handled directly in handleSearch
  // with debouncing and dynamic fetching

  // Reset pagination and fetch data when filters change
  useEffect(() => {
    // Reset to first page when filters change
    setPage(0);
    setIsFirstPage(true);

    // Fetch data with the new filters
    fetchData(true);
  }, [categoryFilter, statusFilter]);
  
  // Handle advanced filter changes with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // Reset to first page when advanced filters change
      setPage(0);
      setIsFirstPage(true);

      // Fetch data with the new advanced filters
      fetchData(true);
    }, 500); // 500ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [priceRange, stockRange]);

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
    
    // Save the preference to localStorage for persistence
    try {
      localStorage.setItem('productsRowsPerPage', newRowsPerPage.toString());
    } catch (error) {
      console.error('Error saving rows per page preference:', error);
    }
  };
  
  // Check if search or advanced filters are active
  const isSearchActive = () => {
    return (
      searchTerm !== '' || 
      priceRange[0] > 0 || 
      priceRange[1] < 10000 || 
      stockRange[0] > 0 || 
      stockRange[1] < 1000 ||
      statusFilter !== 'all'
    );
  };
  
  // Custom rows per page input handler
  const [customRowsPerPage, setCustomRowsPerPage] = useState<string>('');
  const [showCustomRowsInput, setShowCustomRowsInput] = useState(false);
  
  const handleCustomRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomRowsPerPage(event.target.value);
  };
  
  const applyCustomRowsPerPage = () => {
    const value = parseInt(customRowsPerPage, 10);
    if (!isNaN(value) && value > 0 && value <= 100) {
      setRowsPerPage(value);
      setPage(0);
      setIsFirstPage(true);
      setShowCustomRowsInput(false);
      
      // Save the preference to localStorage
      try {
        localStorage.setItem('productsRowsPerPage', value.toString());
      } catch (error) {
        console.error('Error saving rows per page preference:', error);
      }
    }
  };

  // Fetch products dynamically as user types
  const fetchDynamicSearchResults = async (term: string) => {
    if (!term || term.length < 2) {
      // If search term is too short, just fetch regular paginated data
      fetchData(true);
      setSearchSuggestions([]);
      return;
    }
    
    setLoading(true);
    
    try {
      // Base collection reference
      const productsRef = collection(db, 'products');
      
      // We'll fetch a larger set of products to search through
      // This is more efficient than fetching all products for large datasets
      let searchQuery = query(productsRef, limit(500));
      
      // If category filter is active, apply it to narrow down results
      if (categoryFilter) {
        searchQuery = query(productsRef, where('category', '==', categoryFilter), limit(500));
      }
      
      const productsSnapshot = await getDocs(searchQuery);
      
      // Map the documents to our product objects
      let allProducts = productsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          category: data.category,
          price: data.price || 0,
          stock: data.stock || 0,
          status: data.stock < 10 ? 'Low Stock' : 'In Stock'
        };
      });
      
      // Client-side search
      const termLower = term.toLowerCase();
      
      // Filter products based on search term
      const searchResults = allProducts.filter(product => {
        const nameMatch = product.name.toLowerCase().includes(termLower);
        const categoryMatch = product.category.toLowerCase().includes(termLower);
        
        // Apply other filters
        const matchesStatus = statusFilter === 'all' ? true : 
          statusFilter === 'low-stock' ? product.stock < 10 : product.stock >= 10;
          
        const matchesPrice = 
          product.price >= priceRange[0] && 
          product.price <= priceRange[1];
          
        const matchesStock = 
          product.stock >= stockRange[0] && 
          product.stock <= stockRange[1];
        
        // Return true if product matches all criteria
        return (nameMatch || categoryMatch) && matchesStatus && matchesPrice && matchesStock;
      });
      
      // Debug log to see what's happening
      console.log(`Search term: "${term}" found ${searchResults.length} matches out of ${allProducts.length} products`);
      
      if (searchResults.length === 0) {
        console.log("WARNING: No search results found!");
      } else {
        console.log(`First result: ${searchResults[0].name}`);
      }
      
      // Update state with the search results
      setProducts(searchResults);
      
      // Update total count for display purposes
      setTotalCount(searchResults.length);
      
      // Clear suggestions to hide the suggestions box
      setSearchSuggestions([]);
      
      // Clear column filters to avoid double filtering
      setColumnFilters({
        name: '',
        category: '',
        price: [0, 10000],
        stock: [0, 1000],
        status: ''
      });
      
      setLoading(false);
      
    } catch (error) {
      console.error('Error in dynamic search:', error);
      setError('Error searching products. Please try again.');
      setLoading(false);
    }
  };

  // Handle search input changes
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    
    // Reset to first page
    setPage(0);
    setIsFirstPage(true);
    
    // If clearing the search, fetch regular data
    if (!value) {
      fetchData(true);
      setSearchSuggestions([]);
      return;
    }
    
    // Generate suggestions as user types (only if we have products loaded)
    if (products.length > 0 && value.length >= 2) {
      const termLower = value.toLowerCase();
      const suggestions = new Set<string>();
      
      // Get suggestions from product names and categories
      products.forEach(product => {
        // Add product name if it contains the search term
        if (product.name.toLowerCase().includes(termLower)) {
          suggestions.add(product.name);
        }
        
        // Add category if it contains the search term
        if (product.category && product.category.toLowerCase().includes(termLower)) {
          suggestions.add(product.category);
        }
      });
      
      // Update suggestions
      setSearchSuggestions(Array.from(suggestions).slice(0, 5));
    } else {
      // Clear suggestions if search term is too short
      setSearchSuggestions([]);
    }
    
    // Debounce the actual search to avoid too many requests
    if (searchDebounceTimeout.current) {
      clearTimeout(searchDebounceTimeout.current);
    }
    
    searchDebounceTimeout.current = setTimeout(() => {
      console.log(`Executing search for: "${value}"`);
      // Hide suggestions when performing the search
      setSearchSuggestions([]);
      fetchDynamicSearchResults(value);
    }, 300); // 300ms debounce
  };

  const handleCategoryFilter = (event: any) => {
    const newCategoryFilter = event.target.value as string;
    setCategoryFilter(newCategoryFilter);
    
    // If search is active, use dynamic search with the new category filter
    if (searchTerm.length >= 2) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        fetchDynamicSearchResults(searchTerm);
      }, 10);
    }
    // Otherwise, the useEffect hook will handle pagination reset and data fetching
  };
  
  const handleStatusFilter = (event: React.ChangeEvent<{ value: unknown }>) => {
    setStatusFilter(event.target.value as 'all' | 'in-stock' | 'low-stock');
    
    // If search is active, use dynamic search with the new status filter
    if (searchTerm.length >= 2) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        fetchDynamicSearchResults(searchTerm);
      }, 10);
    }
    // Otherwise, the useEffect hook will handle pagination reset and data fetching
  };
  
  const handlePriceRangeChange = (event: Event, newValue: number | number[]) => {
    setPriceRange(newValue as [number, number]);
    
    // If search is active, use dynamic search with the new price range
    if (searchTerm.length >= 2) {
      // Use debounce for range sliders to avoid too many requests
      if (searchDebounceTimeout.current) {
        clearTimeout(searchDebounceTimeout.current);
      }
      
      searchDebounceTimeout.current = setTimeout(() => {
        fetchDynamicSearchResults(searchTerm);
      }, 300);
    }
  };
  
  const handleStockRangeChange = (event: Event, newValue: number | number[]) => {
    setStockRange(newValue as [number, number]);
    
    // If search is active, use dynamic search with the new stock range
    if (searchTerm.length >= 2) {
      // Use debounce for range sliders to avoid too many requests
      if (searchDebounceTimeout.current) {
        clearTimeout(searchDebounceTimeout.current);
      }
      
      searchDebounceTimeout.current = setTimeout(() => {
        fetchDynamicSearchResults(searchTerm);
      }, 300);
    }
  };
  
  const handleToggleAdvancedSearch = () => {
    setAdvancedSearchOpen(!advancedSearchOpen);
  };
  
  const handleClearFilters = () => {
    // Clear all filters
    setSearchTerm('');
    setCategoryFilter('');
    setStatusFilter('all');
    setPriceRange([0, 10000]);
    setStockRange([0, 1000]);
    setAdvancedSearchOpen(false);
    setSearchSuggestions([]);
    
    // Clear column filters
    setColumnFilters({
      name: '',
      category: '',
      price: [0, 10000],
      stock: [0, 1000],
      status: ''
    });
    
    // Reset to first page
    setPage(0);
    setIsFirstPage(true);
    
    // Fetch data with cleared filters
    fetchData(true);
  };
  
  // Handle sorting when a column header is clicked
  const handleSort = (field: SortField) => {
    // If clicking the same field, toggle direction
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new field, set it as the sort field with 'asc' direction
      setSortField(field);
      setSortDirection('asc');
    }
    
    // Reset to first page when sorting changes
    setPage(0);
    setIsFirstPage(true);
  };
  
  // Apply sorting to the products list
  const sortProducts = (products: Product[]) => {
    if (!sortField) return products;
    
    return [...products].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'stock':
          comparison = a.stock - b.stock;
          break;
        default:
          return 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };
  
  // Open column filter dialog
  const handleOpenColumnFilter = (column: string) => {
    setActiveFilterColumn(column);
    setFilterDialogOpen(true);
  };
  
  // Apply column filter
  const handleApplyColumnFilter = (column: string, value: any) => {
    setColumnFilters({
      ...columnFilters,
      [column]: value
    });
    
    setFilterDialogOpen(false);
    
    // Reset to first page when filter changes
    setPage(0);
    setIsFirstPage(true);
  };
  
  // Clear a specific column filter
  const handleClearColumnFilter = (column: string) => {
    const defaultValues: any = {
      name: '',
      category: '',
      price: [0, 10000],
      stock: [0, 1000],
      status: ''
    };
    
    setColumnFilters({
      ...columnFilters,
      [column]: defaultValues[column]
    });
    
    // Reset to first page when filter changes
    setPage(0);
    setIsFirstPage(true);
  };

  // Apply column filters and sorting to products
  const filteredProducts = useMemo(() => {
    // Debug log to see what's happening with products
    console.log(`Filtering ${products.length} products with column filters`);
    
    // First apply column filters
    let filtered = products.filter(product => {
      // Name filter
      if (columnFilters.name && !product.name.toLowerCase().includes(columnFilters.name.toLowerCase())) {
        return false;
      }
      
      // Category filter (from column filter)
      if (columnFilters.category && product.category !== columnFilters.category) {
        return false;
      }
      
      // Price range filter
      if (product.price < columnFilters.price[0] || product.price > columnFilters.price[1]) {
        return false;
      }
      
      // Stock range filter
      if (product.stock < columnFilters.stock[0] || product.stock > columnFilters.stock[1]) {
        return false;
      }
      
      // Status filter (from column filter)
      if (columnFilters.status) {
        const productStatus = product.stock < 10 ? 'low-stock' : 'in-stock';
        if (productStatus !== columnFilters.status) {
          return false;
        }
      }
      
      return true;
    });
    
    // Debug log to see filtered results
    console.log(`After column filtering: ${filtered.length} products remain`);
    
    // Then apply sorting
    const sortedProducts = sortProducts(filtered);
    
    // If we're searching and no results are found, log it
    if (searchTerm && sortedProducts.length === 0) {
      console.log(`WARNING: Search term "${searchTerm}" returned 0 results after filtering`);
    }
    
    return sortedProducts;
  }, [products, columnFilters, sortField, sortDirection, searchTerm]);

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
  
  // Open category batch edit dialog
  const handleOpenCategoryBatchEdit = async (categoryName: string) => {
    setSelectedCategoryForBatch(categoryName);
    
    // Reset batch edit fields
    setBatchEditFields({
      price: {
        enabled: false,
        value: 0
      },
      stock: {
        enabled: false,
        value: 0
      }
    });
    
    // Reset product updates
    setProductUpdates({});
    
    // If we don't have products loaded yet or we need to refresh the list
    if (products.length === 0 || categoryFilter !== categoryName) {
      // Set the category filter and fetch products
      setCategoryFilter(categoryName);
      
      try {
        setLoading(true);
        
        // Fetch products for this category directly from Firestore
        const productsRef = collection(db, 'products');
        let productsQuery;
        
        // Use a simple query with just the category filter - no ordering
        // This avoids the need for a composite index entirely
        productsQuery = query(
          productsRef,
          where('category', '==', categoryName),
          limit(500) // Higher limit to ensure we get all products
        );
        console.log(`Created category-only query for batch edit: ${categoryName}`);
        
        let productsSnapshot;
        try {
          productsSnapshot = await getDocs(productsQuery);
        } catch (queryError: any) {
          // Completely suppress any errors and use the simplest possible query
          console.log('Using fallback query for batch edit');
          
          // Get all products and filter client-side
          const simpleQuery = query(productsRef, limit(500));
          productsSnapshot = await getDocs(simpleQuery);
        }
        
        // Map the documents to our product objects
        let fetchedProducts = productsSnapshot.docs.map(doc => {
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
        
        // Filter by category if we had to fetch all products
        if (categoryName) {
          fetchedProducts = fetchedProducts.filter(product => product.category === categoryName);
        }
        
        // Sort products by name client-side to ensure consistent ordering
        fetchedProducts.sort((a, b) => a.name.localeCompare(b.name));
        
        // Filter products by the selected category
        setProductsInSelectedCategory(fetchedProducts);
        
        // Show success message
        setSnackbar({
          open: true,
          message: `Loaded ${fetchedProducts.length} products in ${categoryName} category`,
          severity: 'success'
        });
      } catch (error) {
        console.error('Error fetching products for batch edit:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load products. Please try again.',
          severity: 'error'
        });
        
        // Set empty array to avoid errors
        setProductsInSelectedCategory([]);
      } finally {
        setLoading(false);
      }
    } else {
      // Filter products by the selected category
      const categoryProducts = products.filter(product => product.category === categoryName);
      setProductsInSelectedCategory(categoryProducts);
    }
    
    // Open the dialog
    setCategoryBatchEditOpen(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Close category batch edit dialog
  const handleCloseCategoryBatchEdit = () => {
    setCategoryBatchEditOpen(false);
  };
  
  // Handle batch field change
  const handleBatchFieldChange = (field: 'price' | 'stock', property: 'enabled' | 'value', value: any) => {
    setBatchEditFields(
      prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [property]: value
      }
    }));
  };
  
  // Handle individual product update
  const handleProductUpdateChange = (productId: string, field: 'price' | 'stock', value: number) => {
    setProductUpdates(prev => {
      const updates = { ...prev };
      if (!updates[productId]) {
        updates[productId] = {};
      }
      updates[productId][field] = value;
      return updates;
    });
  };
  
  // Execute batch update for products in category
  const handleCategoryBatchUpdate = async () => {
    // Check if any updates are available
    const hasIndividualUpdates = Object.keys(productUpdates).length > 0;
    const hasBatchUpdates = batchEditFields.price.enabled || batchEditFields.stock.enabled;
    
    if (!hasIndividualUpdates && !hasBatchUpdates) {
      setSnackbar({
        open: true,
        message: 'Please make at least one update',
        severity: 'warning'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Create an array of update promises
      const updatePromises = productsInSelectedCategory.map(async (product) => {
        const productRef = doc(db, 'products', product.id);
        const updates: { price?: number; stock?: number } = {};
        
        // Check for individual product updates first
        const individualUpdate = productUpdates[product.id];
        
        // Apply individual price update if available
        if (individualUpdate?.price !== undefined) {
          updates.price = Number(individualUpdate.price) || 0;
          // Round to 2 decimal places
          updates.price = Math.round(updates.price * 100) / 100;
        } 
        // Otherwise apply batch price update if enabled
        else if (batchEditFields.price.enabled) {
          updates.price = Number(batchEditFields.price.value) || 0;
          // Round to 2 decimal places
          updates.price = Math.round(updates.price * 100) / 100;
        }
        
        // Apply individual stock update if available
        if (individualUpdate?.stock !== undefined) {
          updates.stock = Math.round(Number(individualUpdate.stock) || 0);
        } 
        // Otherwise apply batch stock update if enabled
        else if (batchEditFields.stock.enabled) {
          updates.stock = Math.round(Number(batchEditFields.stock.value) || 0);
        }
        
        // Only update if there are changes
        if (Object.keys(updates).length > 0) {
          // Update in Firestore
          await updateDoc(productRef, updates);
          
          return {
            id: product.id,
            ...updates
          };
        }
        
        return null;
      });
      
      const results = await Promise.all(updatePromises);
      const validResults = results.filter(result => result !== null) as Array<{id: string, price?: number, stock?: number}>;
      
      // Update local state
      setProducts(prevProducts => 
        prevProducts.map(product => {
          const updated = validResults.find(result => result?.id === product.id);
          if (updated) {
            return {
              ...product,
              ...(updated.price !== undefined ? { price: updated.price } : {}),
              ...(updated.stock !== undefined ? { stock: updated.stock } : {}),
              status: updated.stock !== undefined ? 
                (updated.stock < 10 ? 'Low Stock' : 'In Stock') : 
                product.status
            };
          }
          return product;
        })
      );
      
      // Show success message
      setSnackbar({
        open: true,
        message: `Successfully updated ${validResults.length} products in ${selectedCategoryForBatch} category`,
        severity: 'success'
      });
      
      // Close the dialog
      handleCloseCategoryBatchEdit();
    } catch (err) {
      console.error('Error updating products:', err);
      setSnackbar({
        open: true,
        message: 'Failed to update products. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
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

      // Clear selection and close dialog
      setSelectedProductsSet(new Set());
      setBulkCategoryDialogOpen(false);
      setSelectedBulkCategory('');
      setError(null);
      
      // Show success message
      setSnackbar({
        open: true,
        message: `Successfully updated ${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''} to category "${selectedBulkCategory}"`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Error updating categories:', err);
      setError('Failed to update categories. Please try again.');
      setSnackbar({
        open: true,
        message: 'Failed to update categories. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };



  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5">Products</Typography>
         
        </Box>
        <Box sx={{ display: 'flex', gap: 2  , mt: 2, mb: 1, flexWrap: 'wrap-reverse'}}>
            <ExcelImportExport onSuccess={fetchData} />
            <CategoryPriceUpdate ref={categoryPriceUpdateRef} onSuccess={fetchData} />
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

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          {/* Search and Basic Filters */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3 }}>
            {/* Improved Search Box with Suggestions */}
            <Box sx={{ position: 'relative', flexGrow: 1 }}>
              <TextField
                label="Search Products"
                variant="outlined"
                size="small"
                fullWidth
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search by name or category..."
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  endAdornment: (
                    <>
                      {loading && searchTerm && (
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                      )}
                      {searchTerm && (
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            // Clear search and fetch regular data
                            setSearchTerm('');
                            setSearchSuggestions([]);
                            
                            // Reset to first page
                            setPage(0);
                            setIsFirstPage(true);
                            
                            // Fetch regular data
                            fetchData(true);
                            
                            console.log("Search cleared, fetching regular data");
                          }}
                          aria-label="Clear search"
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      )}
                    </>
                  )
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Trigger search on Enter key
                    e.preventDefault();
                    // The useEffect hook will handle the data fetching
                  }
                }}
              />
              
              {/* Search Suggestions - only show while typing, not after search is performed */}
              {searchSuggestions.length > 0 && searchTerm && !loading && (
                <Paper 
                  sx={{ 
                    position: 'absolute', 
                    width: '100%', 
                    zIndex: 10,
                    mt: 0.5,
                    maxHeight: 300,
                    overflow: 'auto',
                    boxShadow: 3
                  }}
                >
                  <List dense>
                    {searchSuggestions.map((suggestion, index) => (
                      <ListItemButton 
                        key={index}
                        onClick={() => {
                          setSearchTerm(suggestion);
                          setSearchSuggestions([]);
                          // Trigger search immediately with the selected suggestion
                          fetchDynamicSearchResults(suggestion);
                        }}
                      >
                        <Typography variant="body2">{suggestion}</Typography>
                      </ListItemButton>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>
            
            {/* Category Filter */}
            <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="category-filter-label">Category</InputLabel>
              <Select
                labelId="category-filter-label"
                id="category-filter"
                value={categoryFilter}
                onChange={handleCategoryFilter}
                label="Category"
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
            
            {/* Status Filter */}
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={statusFilter}
                onChange={handleStatusFilter}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="in-stock">In Stock</MenuItem>
                <MenuItem value="low-stock">Low Stock</MenuItem>
              </Select>
            </FormControl>
            
            {/* Advanced Search Toggle */}
            <Button
              variant="outlined"
              onClick={handleToggleAdvancedSearch}
              startIcon={<FilterListIcon />}
              color={advancedSearchOpen ? "primary" : "inherit"}
            >
              {advancedSearchOpen ? "Hide Filters" : "More Filters"}
            </Button>
            
            {/* Clear Filters Button */}
            <Button
              variant="text"
              onClick={handleClearFilters}
              startIcon={<ClearIcon />}
              sx={{ display: (searchTerm || categoryFilter || statusFilter !== 'all' || priceRange[0] > 0 || priceRange[1] < 10000 || stockRange[0] > 0 || stockRange[1] < 1000) ? 'flex' : 'none' }}
            >
              Clear
            </Button>
          </Box>
          
          {/* Advanced Search Panel */}
          {advancedSearchOpen && (
            <Box 
              sx={{ 
                p: 2, 
                mb: 3, 
                bgcolor: 'background.default', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant="subtitle1" gutterBottom>Advanced Filters</Typography>
              
              <Grid container spacing={3}>
                {/* Price Range */}
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" gutterBottom>
                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                  </Typography>
                  <Box sx={{ px: 2 }}>
                    <Slider
                      value={priceRange}
                      onChange={handlePriceRangeChange}
                      valueLabelDisplay="auto"
                      min={0}
                      max={10000}
                      step={100}
                    />
                  </Box>
                </Grid>
                
                {/* Stock Range */}
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" gutterBottom>
                    Stock Range: {stockRange[0]} - {stockRange[1]} units
                  </Typography>
                  <Box sx={{ px: 2 }}>
                    <Slider
                      value={stockRange}
                      onChange={handleStockRangeChange}
                      valueLabelDisplay="auto"
                      min={0}
                      max={1000}
                      step={10}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {/* Active Filters Display */}
          {(searchTerm || categoryFilter || statusFilter !== 'all' || priceRange[0] > 0 || priceRange[1] < 10000 || stockRange[0] > 0 || stockRange[1] < 1000) && (
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
              
              {categoryFilter && (
                <Chip 
                  label={`Category: ${categoryFilter}`} 
                  size="small" 
                  onDelete={() => setCategoryFilter('')}
                  color="primary"
                  variant="outlined"
                />
              )}
              
              {statusFilter !== 'all' && (
                <Chip 
                  label={`Status: ${statusFilter === 'low-stock' ? 'Low Stock' : 'In Stock'}`} 
                  size="small" 
                  onDelete={() => setStatusFilter('all')}
                  color="primary"
                  variant="outlined"
                />
              )}
              
              {(priceRange[0] > 0 || priceRange[1] < 10000) && (
                <Chip 
                  label={`Price: $${priceRange[0]} - $${priceRange[1]}`} 
                  size="small" 
                  onDelete={() => setPriceRange([0, 10000])}
                  color="primary"
                  variant="outlined"
                />
              )}
              
              {(stockRange[0] > 0 || stockRange[1] < 1000) && (
                <Chip 
                  label={`Stock: ${stockRange[0]} - ${stockRange[1]} units`} 
                  size="small" 
                  onDelete={() => setStockRange([0, 1000])}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          )}
          
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
           
            {selectedProducts.length > 0 && (
              <>
                <ExportSelectedProducts selectedIds={selectedProducts} />
                <Button
                  variant="contained"
                  color="secondary"
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
                      indeterminate={selectedProducts.length > 0 && selectedProducts.length < (searchTerm ? products.length : filteredProducts.length)}
                      checked={selectedProducts.length > 0 && selectedProducts.length === (searchTerm ? products.length : filteredProducts.length)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Select all products on the current page
                          const newSet = new Set(selectedProductsSet);
                          // Use the appropriate array based on whether we're searching
                          const productsToUse = searchTerm ? products : filteredProducts;
                          productsToUse.forEach(product => newSet.add(product.id));
                          setSelectedProductsSet(newSet);
                        } else {
                          // Deselect all products
                          // If we want to deselect only the visible products:
                          const newSet = new Set(selectedProductsSet);
                          // Use the appropriate array based on whether we're searching
                          const productsToUse = searchTerm ? products : filteredProducts;
                          productsToUse.forEach(product => newSet.delete(product.id));
                          setSelectedProductsSet(newSet);
                          // If we want to deselect all products:
                          // setSelectedProductsSet(new Set());
                        }
                      }}
                    />
                  </TableCell>
                  

                  
                  {/* Name Column */}
                  <TableCell 
                    onClick={() => handleSort('name')}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle2">Name</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
                        {sortField === 'name' && (
                          sortDirection === 'asc' ? 
                            <ExpandLessIcon fontSize="small" color="primary" /> : 
                            <ExpandMoreIcon fontSize="small" color="primary" />
                        )}
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenColumnFilter('name');
                          }}
                          sx={{ p: 0.2 }}
                        >
                          <FilterListIcon 
                            fontSize="small" 
                            color={columnFilters.name ? "primary" : "action"}
                          />
                        </IconButton>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  {/* Category Column */}
                  <TableCell 
                    onClick={() => handleSort('category')}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle2">Category</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
                        {sortField === 'category' && (
                          sortDirection === 'asc' ? 
                            <ExpandLessIcon fontSize="small" color="primary" /> : 
                            <ExpandMoreIcon fontSize="small" color="primary" />
                        )}
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenColumnFilter('category');
                          }}
                          sx={{ p: 0.2 }}
                        >
                          <FilterListIcon 
                            fontSize="small" 
                            color={columnFilters.category ? "primary" : "action"}
                          />
                        </IconButton>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  {/* Price Column */}
                  <TableCell 
                    onClick={() => handleSort('price')}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle2">Price</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
                        {sortField === 'price' && (
                          sortDirection === 'asc' ? 
                            <ExpandLessIcon fontSize="small" color="primary" /> : 
                            <ExpandMoreIcon fontSize="small" color="primary" />
                        )}
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenColumnFilter('price');
                          }}
                          sx={{ p: 0.2 }}
                        >
                          <FilterListIcon 
                            fontSize="small" 
                            color={(columnFilters.price[0] > 0 || columnFilters.price[1] < 10000) ? "primary" : "action"}
                          />
                        </IconButton>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  {/* Stock Column */}
                  <TableCell 
                    onClick={() => handleSort('stock')}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle2">Stock</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
                        {sortField === 'stock' && (
                          sortDirection === 'asc' ? 
                            <ExpandLessIcon fontSize="small" color="primary" /> : 
                            <ExpandMoreIcon fontSize="small" color="primary" />
                        )}
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenColumnFilter('stock');
                          }}
                          sx={{ p: 0.2 }}
                        >
                          <FilterListIcon 
                            fontSize="small" 
                            color={(columnFilters.stock[0] > 0 || columnFilters.stock[1] < 1000) ? "primary" : "action"}
                          />
                        </IconButton>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  {/* Status Column */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle2">Status</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenColumnFilter('status')}
                          sx={{ p: 0.2 }}
                        >
                          <FilterListIcon 
                            fontSize="small" 
                            color={columnFilters.status ? "primary" : "action"}
                          />
                        </IconButton>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                      Loading products...
                    </TableCell>
                  </TableRow>
                ) : (searchTerm && products.length === 0) || (!searchTerm && filteredProducts.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No products found</TableCell>
                  </TableRow>
                ) : (
                  // Use products directly when searching, otherwise use filteredProducts
                  (searchTerm ? products : filteredProducts).map((product) => (
                    <TableRow key={product.id}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedProductsSet.has(product.id)}
                          onChange={() => {
                            // Create a new Set from the current one
                            const newSet = new Set(selectedProductsSet);
                            
                            if (newSet.has(product.id)) {
                              // Remove if already selected
                              newSet.delete(product.id);
                            } else {
                              // Add if not selected
                              newSet.add(product.id);
                            }
                            setSelectedProductsSet(newSet);
                          }}
                        />
                      </TableCell>

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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderTop: '1px solid rgba(224, 224, 224, 1)' }}>
              {/* Custom Rows Per Page Control - Hide when search is active */}
              {!isSearchActive() && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2">Rows per page:</Typography>
                  
                  {showCustomRowsInput ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        size="small"
                        type="number"
                        value={customRowsPerPage}
                        onChange={handleCustomRowsPerPageChange}
                        inputProps={{ 
                          min: 1, 
                          max: 100,
                          style: { width: '60px' }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            applyCustomRowsPerPage();
                          }
                        }}
                        autoFocus
                      />
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={applyCustomRowsPerPage}
                      >
                        Apply
                      </Button>
                      <IconButton 
                        size="small" 
                        onClick={() => setShowCustomRowsInput(false)}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Select
                        value={rowsPerPage}
                        onChange={handleChangeRowsPerPage}
                        size="small"
                        sx={{ minWidth: 80 }}
                      >
                        {[5, 10, 25, 50, 100].map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                      <Tooltip title="Custom rows per page">
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            setCustomRowsPerPage(rowsPerPage.toString());
                            setShowCustomRowsInput(true);
                          }}
                        >
                          <TuneIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              )}
              
              {/* Results Count and Pagination */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2">
                  {isSearchActive() ? (
                    // When search is active, just show total count
                    `${products.length} results found`
                  ) : (
                    // When pagination is active, show page info
                    `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, totalCount)} of ${totalCount}`
                  )}
                </Typography>
                
                {/* Pagination Controls - Hide when search is active */}
                {!isSearchActive() && (
                  <Box>
                    <IconButton 
                      onClick={(e) => handleChangePage(e, page - 1)}
                      disabled={page === 0}
                      size="small"
                      aria-label="Previous page"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24">
                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                      </svg>
                    </IconButton>
                    
                    <IconButton 
                      onClick={(e) => handleChangePage(e, page + 1)}
                      disabled={page >= Math.ceil(totalCount / rowsPerPage) - 1}
                      size="small"
                      aria-label="Next page"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24">
                        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                      </svg>
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Box>
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
      
      {/* Category Batch Edit Dialog */}
      <Dialog 
        open={categoryBatchEditOpen} 
        onClose={handleCloseCategoryBatchEdit} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Batch Update Products in {selectedCategoryForBatch} Category
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Summary */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <Typography variant="h6">
                {productsInSelectedCategory.length} products will be updated
              </Typography>
              <Typography variant="body2">
                Select which fields to update and how to update them
              </Typography>
            </Paper>
            
            {/* Batch Update Section */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Batch Update All Products
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Set values to apply to all products in this category
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Checkbox 
                      checked={batchEditFields.price.enabled}
                      onChange={(e) => handleBatchFieldChange('price', 'enabled', e.target.checked)}
                    />
                    <Typography variant="subtitle1">
                      Update All Prices
                    </Typography>
                  </Box>
                  
                  {batchEditFields.price.enabled && (
                    <TextField
                      label="New Price for All Products"
                      type="number"
                      size="small"
                      fullWidth
                      value={batchEditFields.price.value}
                      onChange={(e) => handleBatchFieldChange('price', 'value', parseFloat(e.target.value) || 0)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            $
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Checkbox 
                      checked={batchEditFields.stock.enabled}
                      onChange={(e) => handleBatchFieldChange('stock', 'enabled', e.target.checked)}
                    />
                    <Typography variant="subtitle1">
                      Update All Stock
                    </Typography>
                  </Box>
                  
                  {batchEditFields.stock.enabled && (
                    <TextField
                      label="New Stock for All Products"
                      type="number"
                      size="small"
                      fullWidth
                      value={batchEditFields.stock.value}
                      onChange={(e) => handleBatchFieldChange('stock', 'value', parseFloat(e.target.value) || 0)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            #
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                </Grid>
              </Grid>
            </Paper>
            
            {/* Individual Products List */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Individual Product Updates
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter values for specific products to override batch settings
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product Name</TableCell>
                      <TableCell align="right">Current Price</TableCell>
                      <TableCell align="right">New Price</TableCell>
                      <TableCell align="right">Current Stock</TableCell>
                      <TableCell align="right">New Stock</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {productsInSelectedCategory.map((product) => {
                      const productUpdate = productUpdates[product.id] || {};
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell>{product.name}</TableCell>
                          <TableCell align="right">${product.price.toFixed(2)}</TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={productUpdate.price !== undefined ? productUpdate.price : ''}
                              onChange={(e) => handleProductUpdateChange(
                                product.id, 
                                'price', 
                                e.target.value === '' ? 0 : parseFloat(e.target.value)
                              )}
                              placeholder={batchEditFields.price.enabled ? 
                                `${batchEditFields.price.value}` : 
                                'Enter price'
                              }
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    $
                                  </InputAdornment>
                                )
                              }}
                              sx={{ width: 120 }}
                            />
                          </TableCell>
                          <TableCell align="right">{product.stock}</TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={productUpdate.stock !== undefined ? productUpdate.stock : ''}
                              onChange={(e) => handleProductUpdateChange(
                                product.id, 
                                'stock', 
                                e.target.value === '' ? 0 : parseFloat(e.target.value)
                              )}
                              placeholder={batchEditFields.stock.enabled ? 
                                `${batchEditFields.stock.value}` : 
                                'Enter stock'
                              }
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    #
                                  </InputAdornment>
                                )
                              }}
                              sx={{ width: 120 }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
            {/* <Typography variant="h6" sx={{ mb: 2 }}>
              Products in {selectedCategoryForBatch} Category
            </Typography>
            
            <Box sx={{ maxHeight: '300px', overflow: 'auto', mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Current Price</TableCell>
                    <TableCell align="right">New Price</TableCell>
                    <TableCell align="right">Current Stock</TableCell>
                    <TableCell align="right">New Stock</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productsInSelectedCategory.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell align="right">${product.price.toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ color: 'secondary.main', fontWeight: 'bold' }}>
                        {batchEditFields.price.enabled ? (
                          `$${(Number(batchEditFields.price.value) || 0).toFixed(2)}`
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="right">{product.stock}</TableCell>
                      <TableCell align="right" sx={{ color: 'secondary.main', fontWeight: 'bold' }}>
                        {batchEditFields.stock.enabled ? (
                          Math.round(Number(batchEditFields.stock.value) || 0)
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box> */}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCategoryBatchEdit}>Cancel</Button>
          <Button
            onClick={handleCategoryBatchUpdate}
            variant="contained"
            color="primary"
            disabled={loading || (!batchEditFields.price.enabled && !batchEditFields.stock.enabled)}
          >
            {loading ? <CircularProgress size={24} /> : 'Update All Products'}
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
      {/* Column Filter Dialog */}
      <Dialog 
        open={filterDialogOpen} 
        onClose={() => setFilterDialogOpen(false)} 
        maxWidth="xs" 
        fullWidth
      >
        <DialogTitle>
          Filter by {activeFilterColumn.charAt(0).toUpperCase() + activeFilterColumn.slice(1)}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>

            
            {/* Name Filter */}
            {activeFilterColumn === 'name' && (
              <TextField
                label="Filter by Name"
                fullWidth
                value={columnFilters.name}
                onChange={(e) => setColumnFilters({
                  ...columnFilters,
                  name: e.target.value
                })}
                placeholder="Enter name to filter"
                size="small"
              />
            )}
            
            {/* Category Filter */}
            {activeFilterColumn === 'category' && (
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Category</InputLabel>
                <Select
                  label="Filter by Category"
                  value={columnFilters.category}
                  onChange={(e) => setColumnFilters({
                    ...columnFilters,
                    category: e.target.value as string
                  })}
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
            )}
            
            {/* Price Range Filter */}
            {activeFilterColumn === 'price' && (
              <>
                <Typography variant="body2" gutterBottom>
                  Price Range: ${columnFilters.price[0]} - ${columnFilters.price[1]}
                </Typography>
                <Box sx={{ px: 2, mt: 2, mb: 2 }}>
                  <Slider
                    value={columnFilters.price}
                    onChange={(e, newValue) => setColumnFilters({
                      ...columnFilters,
                      price: newValue as [number, number]
                    })}
                    valueLabelDisplay="auto"
                    min={0}
                    max={10000}
                    step={100}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Min Price"
                    type="number"
                    size="small"
                    value={columnFilters.price[0]}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (!isNaN(value) && value >= 0) {
                        setColumnFilters({
                          ...columnFilters,
                          price: [value, columnFilters.price[1]]
                        });
                      }
                    }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                  <TextField
                    label="Max Price"
                    type="number"
                    size="small"
                    value={columnFilters.price[1]}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (!isNaN(value) && value >= columnFilters.price[0]) {
                        setColumnFilters({
                          ...columnFilters,
                          price: [columnFilters.price[0], value]
                        });
                      }
                    }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Box>
              </>
            )}
            
            {/* Stock Range Filter */}
            {activeFilterColumn === 'stock' && (
              <>
                <Typography variant="body2" gutterBottom>
                  Stock Range: {columnFilters.stock[0]} - {columnFilters.stock[1]} units
                </Typography>
                <Box sx={{ px: 2, mt: 2, mb: 2 }}>
                  <Slider
                    value={columnFilters.stock}
                    onChange={(e, newValue) => setColumnFilters({
                      ...columnFilters,
                      stock: newValue as [number, number]
                    })}
                    valueLabelDisplay="auto"
                    min={0}
                    max={1000}
                    step={10}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Min Stock"
                    type="number"
                    size="small"
                    value={columnFilters.stock[0]}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (!isNaN(value) && value >= 0) {
                        setColumnFilters({
                          ...columnFilters,
                          stock: [value, columnFilters.stock[1]]
                        });
                      }
                    }}
                  />
                  <TextField
                    label="Max Stock"
                    type="number"
                    size="small"
                    value={columnFilters.stock[1]}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (!isNaN(value) && value >= columnFilters.stock[0]) {
                        setColumnFilters({
                          ...columnFilters,
                          stock: [columnFilters.stock[0], value]
                        });
                      }
                    }}
                  />
                </Box>
              </>
            )}
            
            {/* Status Filter */}
            {activeFilterColumn === 'status' && (
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  label="Filter by Status"
                  value={columnFilters.status}
                  onChange={(e) => setColumnFilters({
                    ...columnFilters,
                    status: e.target.value as string
                  })}
                >
                  <MenuItem value="">
                    <em>All Status</em>
                  </MenuItem>
                  <MenuItem value="in-stock">In Stock</MenuItem>
                  <MenuItem value="low-stock">Low Stock</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => handleClearColumnFilter(activeFilterColumn)}
            color="secondary"
          >
            Clear Filter
          </Button>
          <Button onClick={() => setFilterDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => setFilterDialogOpen(false)}
            variant="contained"
            color="primary"
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
};