'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partyService } from '@/services/partyService';
import { queryKeys } from '@/lib/queryClient';
import { Party, PartyFormData } from '@/types/party';
import { aggregationService } from '@/services/aggregationService';

/**
 * Cached party queries — eliminates full-scan reads on every page load.
 *
 * COST SAVINGS:
 * - Party list cached for 10 minutes
 * - Search results reuse cache via client-side filter
 * - Aggregated stats use 1-doc read instead of full scan
 * - Active parties cached separately for dropdowns/selectors
 */

export function useCachedParties() {
  return useQuery({
    queryKey: queryKeys.parties.all,
    queryFn: () => partyService.getAllParties(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCachedActiveParties(userId?: string) {
  return useQuery({
    queryKey: [...queryKeys.parties.active, userId],
    queryFn: () => partyService.getActiveParties(userId),
    staleTime: 15 * 60 * 1000, // Active list changes rarely
  });
}

export function useCachedParty(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.parties.detail(id || ''),
    queryFn: () => partyService.getParty(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Party statistics — uses aggregation service (1 doc read vs N docs).
 */
export function useCachedPartyStats(userId?: string) {
  return useQuery({
    queryKey: queryKeys.parties.stats,
    queryFn: async () => {
      const stats = await aggregationService.getStats();
      return {
        total: stats.parties.total,
        active: stats.parties.active,
        inactive: stats.parties.total - stats.parties.active,
        totalOutstanding: stats.parties.totalOutstanding,
        totalCreditLimit: stats.parties.totalCreditLimit,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateParty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PartyFormData) => partyService.createParty(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parties.all });
      await aggregationService.updatePartyCount({ total: 1, active: 1 });
    },
  });
}

export function useUpdateParty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PartyFormData> }) =>
      partyService.updateParty(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parties.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.parties.detail(variables.id) });
    },
  });
}

export function useDeleteParty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => partyService.deleteParty(id),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parties.all });
      await aggregationService.updatePartyCount({ total: -1, active: -1 });
    },
  });
}
