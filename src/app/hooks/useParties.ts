import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';

export interface Party {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  categoryDiscounts: Record<string, number>;
  productDiscounts?: Record<string, number>;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export function useParties() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPartiesWithRetry = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      const partiesCollection = collection(db, 'parties');
      const partiesSnapshot = await getDocs(partiesCollection);
      
      const partiesList = partiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        categoryDiscounts: doc.data().categoryDiscounts || {},
        productDiscounts: doc.data().productDiscounts || {}
      } as Party));
      
      setParties(partiesList);
    } catch (err) {
      console.error(`Error fetching parties (attempt ${retryCount + 1}):`, err);
      
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          fetchPartiesWithRetry(retryCount + 1);
        }, RETRY_DELAY * Math.pow(2, retryCount)); // Exponential backoff
      } else {
        setError('Failed to fetch parties. Please try again later.');
        setParties([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartiesWithRetry();
  }, [fetchPartiesWithRetry]);

  const refetch = useCallback(() => {
    fetchPartiesWithRetry();
  }, [fetchPartiesWithRetry]);

  return { parties, loading, error, refetch };
}