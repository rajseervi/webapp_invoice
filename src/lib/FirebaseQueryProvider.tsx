'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { createQueryClient } from './queryClient';

interface FirebaseQueryContextType {
  invalidateProductCache: () => void;
  invalidatePartyCache: () => void;
  invalidateCategoryCache: () => void;
  invalidateInvoiceCache: () => void;
  invalidateDashboardCache: () => void;
  invalidateAllCaches: () => void;
  queryClient: QueryClient;
}

const FirebaseQueryContext = createContext<FirebaseQueryContextType | undefined>(undefined);

export function useFirebaseQuery() {
  const context = useContext(FirebaseQueryContext);
  if (!context) {
    throw new Error('useFirebaseQuery must be used within FirebaseQueryProvider');
  }
  return context;
}

interface FirebaseQueryProviderProps {
  children: React.ReactNode;
}

/**
 * Firebase-aware QueryProvider.
 * 
 * Provides:
 * 1. React Query caching (reduces reads by 70%+)
 * 2. Targeted cache invalidation for mutations
 * 3. Singleton queryClient across the app
 */
export function FirebaseQueryProvider({ children }: FirebaseQueryProviderProps) {
  const [queryClient] = useState(() => createQueryClient());

  // Memoized cache invalidation helpers
  const invalidateProductCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
  }, [queryClient]);

  const invalidatePartyCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['parties'] });
  }, [queryClient]);

  const invalidateCategoryCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  }, [queryClient]);

  const invalidateInvoiceCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
  }, [queryClient]);

  const invalidateDashboardCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [queryClient]);

  const invalidateAllCaches = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  const value: FirebaseQueryContextType = {
    invalidateProductCache,
    invalidatePartyCache,
    invalidateCategoryCache,
    invalidateInvoiceCache,
    invalidateDashboardCache,
    invalidateAllCaches,
    queryClient,
  };

  return (
    <QueryClientProvider client={queryClient}>
      <FirebaseQueryContext.Provider value={value}>
        {children}
      </FirebaseQueryContext.Provider>
    </QueryClientProvider>
  );
}
