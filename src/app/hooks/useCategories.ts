import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null;
  isActive?: boolean;
  defaultDiscount?: number;
  sortOrder?: number;
  color?: string;
  icon?: string;
  tags?: string[];
  metadata?: {
    totalProducts?: number;
    totalValue?: number;
    averagePrice?: number;
    lastUpdated?: string;
  };
  createdAt?: any;
  updatedAt?: any;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategoriesWithRetry = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      // Check if db is properly initialized
      if (!db) {
        throw new Error('Firebase database is not initialized');
      }

      // Fetch ALL categories (no composite index needed)
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      
      let categoriesList = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      
      // Filter to active only, sort by name in-memory (avoids composite index requirement)
      categoriesList = categoriesList
        .filter(c => c.isActive !== false) // Include if isActive is true or undefined/missing
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      
      setCategories(categoriesList);
    } catch (err) {
      console.error(`Error fetching categories (attempt ${retryCount + 1}):`, err);
      
      if (retryCount < MAX_RETRIES) {
        // Set a temporary error message during retries
        setError(`Connection issue. Retrying... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
        
        setTimeout(() => {
          fetchCategoriesWithRetry(retryCount + 1);
        }, RETRY_DELAY * Math.pow(2, retryCount)); // Exponential backoff
      } else {
        // Format a more detailed error message
        let errorMessage = 'Failed to fetch categories. Please try again later.';
        
        if (err instanceof Error) {
          // Add the specific error message if available
          errorMessage += ` Error: ${err.message}`;
        }
        
        setError(errorMessage);
        setCategories([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      fetchCategoriesWithRetry();
    } catch (err) {
      console.error('Error initializing categories fetch:', err);
      setError('Failed to initialize categories fetch. Please refresh the page.');
      setLoading(false);
    }
  }, [fetchCategoriesWithRetry]);

  const refetch = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      fetchCategoriesWithRetry(0); // Reset retry count
    } catch (err) {
      console.error('Error during categories refetch:', err);
      setError('Failed to refetch categories. Please try again.');
      setLoading(false);
    }
  }, [fetchCategoriesWithRetry]);

  return { categories, loading, error, refetch };
}
