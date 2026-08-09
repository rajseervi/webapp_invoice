import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
// Fix the import path to use the correct file extension
import { db } from '@/firebase/config';

export interface Product {
  id: string;
  name: string;
  price: number;
  purchasePrice?: number;
  category: string;
  categoryId?: string;
  categoryName?: string;
  description?: string;
  stock?: number;
  quantity?: number;
  gstRate?: number;
  hsnCode?: string;
  isActive?: boolean;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProductsWithRetry = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      // Check if db is properly initialized
      if (!db) {
        throw new Error('Firebase database is not initialized');
      }

      // Fetch products and categories in parallel
      const [productsSnapshot, categoriesSnapshot] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'categories'))
      ]);
      
      // Create a map of category IDs to category names
      const categoryMap = new Map<string, string>();
      categoriesSnapshot.docs.forEach(doc => {
        const categoryData = doc.data();
        categoryMap.set(doc.id, categoryData.name || 'Unknown Category');
      });
      
      // Map products and resolve category names
      const productsList = productsSnapshot.docs.map(doc => {
        const productData = doc.data();
        let categoryName = '';
        
        // Try to get category name from categoryId first
        if (productData.categoryId) {
          categoryName = categoryMap.get(productData.categoryId) || '';
        }
        
        // Fallback to existing category field if categoryName is empty
        if (!categoryName && productData.category) {
          categoryName = productData.category;
        }
        
        // Fallback to categoryName field if it exists
        if (!categoryName && productData.categoryName) {
          categoryName = productData.categoryName;
        }
        
        // Final fallback
        if (!categoryName) {
          categoryName = 'Uncategorized';
        }
        
        return {
          id: doc.id,
          ...productData,
          category: categoryName, // Ensure category field is populated with name
          stock: productData.quantity || productData.stock || 0, // Handle both stock and quantity fields
        } as Product;
      });
      
      setProducts(productsList);
    } catch (err) {
      console.error(`Error fetching products (attempt ${retryCount + 1}):`, err);
      
      if (retryCount < MAX_RETRIES) {
        // Set a temporary error message during retries
        setError(`Connection issue. Retrying... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
        
        setTimeout(() => {
          fetchProductsWithRetry(retryCount + 1);
        }, RETRY_DELAY * Math.pow(2, retryCount)); // Exponential backoff
      } else {
        // Format a more detailed error message
        let errorMessage = 'Failed to fetch products. Please try again later.';
        
        if (err instanceof Error) {
          // Add the specific error message if available
          errorMessage += ` Error: ${err.message}`;
        }
        
        setError(errorMessage);
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      fetchProductsWithRetry();
    } catch (err) {
      console.error('Error initializing products fetch:', err);
      setError('Failed to initialize products fetch. Please refresh the page.');
      setLoading(false);
    }
  }, [fetchProductsWithRetry]);

  const refetch = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      fetchProductsWithRetry(0); // Reset retry count
    } catch (err) {
      console.error('Error during products refetch:', err);
      setError('Failed to refetch products. Please try again.');
      setLoading(false);
    }
  }, [fetchProductsWithRetry]);

  return { products, loading, error, refetch };
}