import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  stock?: number;
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

      const productsCollection = collection(db, 'products');
      const productsSnapshot = await getDocs(productsCollection);
      
      const productsList = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));
      
      setProducts(productsList);
    } catch (err) {
      console.error(`Error fetching products (attempt ${retryCount + 1}):`, err);
      
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          fetchProductsWithRetry(retryCount + 1);
        }, RETRY_DELAY * Math.pow(2, retryCount)); // Exponential backoff
      } else {
        setError('Failed to fetch products. Please try again later.');
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProductsWithRetry();
  }, [fetchProductsWithRetry]);

  const refetch = useCallback(() => {
    fetchProductsWithRetry();
  }, [fetchProductsWithRetry]);

  return { products, loading, error, refetch };
}