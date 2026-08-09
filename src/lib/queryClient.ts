'use client';

import { QueryClient } from '@tanstack/react-query';

/**
 * Firestore-specific query client configuration.
 * 
 * KEY COST-SAVING SETTINGS:
 * - staleTime: 5 minutes (don't refetch for 5 min = massive read reduction)
 * - gcTime: 30 minutes (keep cache for 30 min even when unmounted)
 * - refetchOnWindowFocus: false (avoid duplicate reads on tab switch)
 * - retry: 1 (only retry once on failure)
 * 
 * These settings mean:
 * - A user navigating between pages won't re-fetch the same data
 * - Tab switching won't trigger useless reads  
 * - Cache persists across route changes
 */

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
        gcTime: 30 * 60 * 1000,   // 30 minutes - keep unused cache
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

/**
 * Shared query keys for consistent cache management.
 * Using structured keys allows targeted cache invalidation.
 */
export const queryKeys = {
  products: {
    all: ['products'] as const,
    list: (filters?: Record<string, unknown>) => ['products', 'list', filters] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
    stats: ['products', 'stats'] as const,
  },
  parties: {
    all: ['parties'] as const,
    list: (filters?: Record<string, unknown>) => ['parties', 'list', filters] as const,
    detail: (id: string) => ['parties', 'detail', id] as const,
    stats: ['parties', 'stats'] as const,
    active: ['parties', 'active'] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: (filters?: Record<string, unknown>) => ['categories', 'list', filters] as const,
    detail: (id: string) => ['categories', 'detail', id] as const,
    discounts: ['categories', 'discounts'] as const,
  },
  invoices: {
    all: ['invoices'] as const,
    list: (filters?: Record<string, unknown>) => ['invoices', 'list', filters] as const,
    detail: (id: string) => ['invoices', 'detail', id] as const,
  },
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
  },
  aggregation: {
    counts: ['aggregation', 'counts'] as const,
  },
} as const;
