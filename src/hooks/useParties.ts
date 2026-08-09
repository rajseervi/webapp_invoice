import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

export interface Party {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  isActive?: boolean;
}

export function useParties() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchParties = async () => {
      if (!currentUser) {
        setParties([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Query parties collection
        const q = query(
          collection(db, 'parties'),
          where('isActive', '!=', false), // Get active parties
          orderBy('isActive', 'desc'),
          orderBy('name', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const partiesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Party[];

        setParties(partiesData);
      } catch (err) {
        console.error('Error fetching parties:', err);
        setError('Failed to load parties');
        setParties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchParties();
  }, [currentUser]);

  return { parties, loading, error, refetch: () => fetchParties() };
}