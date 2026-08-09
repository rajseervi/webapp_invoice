import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

export interface Product {
  id: string;
  name: string;
  price: number;
  category?: string;
  stock?: number;
  code?: string;
  gstRate?: number;
  description?: string;
  isActive?: boolean;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      if (!currentUser) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Query products collection
        const q = query(
          collection(db, 'products'),
          where('isActive', '!=', false), // Get active products
          orderBy('isActive', 'desc'),
          orderBy('name', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];

        setProducts(productsData);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentUser]);

  return { products, loading, error, refetch: () => fetchProducts() };
}