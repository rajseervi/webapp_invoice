'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService, ProductFilters, ProductSortOptions, PaginationOptions } from '@/services/productService';
import { queryKeys } from '@/lib/queryClient';
import { Product } from '@/types/inventory';
import { aggregationService } from '@/services/aggregationService';

/**
 * Cached product queries — massive read reduction via React Query.
 * 
 * COST SAVINGS:
 * - Products list is cached for 5 minutes (staleTime)
 * - Same filter/sort combinations reuse cached data
 * - Page changes don't re-fetch if within cache window
 * - Aggregated stats use 1-doc read instead of full scan
 */

export function useCachedProducts(
  filters?: ProductFilters,
  sortOptions?: ProductSortOptions,
  pagination?: PaginationOptions
) {
  const filterKey = JSON.stringify({ filters, sortOptions, pagination });

  return useQuery({
    queryKey: queryKeys.products.list({ filterKey }),
    queryFn: () => productService.getProducts(filters, sortOptions, pagination),
    // Products don't change that frequently
    staleTime: 10 * 60 * 1000, // 10 minutes
    select: (data) => ({
      ...data,
      products: data.products.map((p) => ({
        ...p,
        purchasePrice: p.purchasePrice ?? 0,
        price: p.price ?? 0,
      })),
    }),
  });
}

export function useCachedProduct(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.products.detail(id || ''),
    queryFn: () => productService.getProductById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Product statistics — uses aggregation service instead of full scan.
 * This drops reads from N products → 1 document.
 */
export function useCachedProductStats() {
  return useQuery({
    queryKey: queryKeys.products.stats,
    queryFn: async () => {
      const stats = await aggregationService.getStats();
      return {
        totalProducts: stats.products.total,
        activeProducts: stats.products.active,
        inactiveProducts: stats.products.inactive,
        lowStockProducts: stats.products.lowStock,
        totalValue: stats.products.totalValue,
        averagePrice: stats.products.active > 0
          ? stats.products.totalValue / stats.products.active
          : 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Mutation hooks with automatic cache invalidation.
 * After any product mutation, we invalidate:
 * 1. The products list cache (forces next list fetch)
 * 2. The product stats cache (forces stats recalc)
 * 3. The specific product cache if applicable
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) =>
      productService.createProduct(data),
    onSuccess: async () => {
      // Invalidate product caches
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      // Update aggregation counts
      await aggregationService.updateProductCount({ total: 1, active: 1 });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      productService.updateProduct(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.id) });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      await aggregationService.updateProductCount({ total: -1, active: -1 });
    },
  });
}

export function useBulkUpdateProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: string[]; data: any }) =>
      productService.bulkUpdateProducts(ids, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

export function useBulkDeleteProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => productService.bulkDeleteProducts(ids),
    onSuccess: async (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      await aggregationService.updateProductCount({
        total: -ids.length,
        active: -ids.length,
      });
    },
  });
}

export function useSearchProducts() {
  return useMutation({
    mutationFn: (searchTerm: string) => productService.searchProducts(searchTerm),
  });
}

/**
 * Category-specific product fetch with caching.
 */
export function useCachedProductsByCategory(categoryId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.products.list({ category: categoryId }), 'byCategory', categoryId],
    queryFn: () => productService.getProductsByCategory(categoryId!),
    enabled: !!categoryId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Low stock products — cached and uses aggregation fallback.
 */
export function useCachedLowStockProducts(threshold: number = 10) {
  return useQuery({
    queryKey: [...queryKeys.products.all, 'lowStock', threshold],
    queryFn: () => productService.getLowStockProducts(threshold),
    staleTime: 10 * 60 * 1000,
  });
}
