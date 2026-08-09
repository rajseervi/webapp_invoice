"use client";

import { useState, useEffect, useCallback } from 'react';

interface DashboardStats {
  monthlyRevenue: {
    current: number;
    previous: number;
    growth: number;
  };
  totalOrders: {
    count: number;
    growth: number;
  };
  activeProducts: {
    count: number;
    lowStock: number;
  };
  activeParties: {
    count: number;
    recent: number;
  };
}

interface DashboardState {
  data: DashboardStats | null;
  loading: boolean;
  error: string | null;
  lastFetch: Date | null;
}

export function useDashboard(autoRefresh = false, refreshInterval = 5 * 60 * 1000) {
  const [state, setState] = useState<DashboardState>({
    data: null,
    loading: false,
    error: null,
    lastFetch: null
  });

  const fetchDashboardData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/dashboard', {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success || result.fallback) {
        setState({
          data: result.data,
          loading: false,
          error: result.fallback ? 'Using fallback data due to connection issues' : null,
          lastFetch: new Date()
        });
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }
    } catch (error: any) {
      console.error('Dashboard fetch error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch dashboard data'
      }));
    }
  }, []);

  // Auto-refresh functionality - optimized to reduce performance impact
  useEffect(() => {
    if (!autoRefresh) return;

    // Increase refresh interval to reduce performance impact
    const optimizedInterval = Math.max(refreshInterval, 30000); // Minimum 30 seconds
    const interval = setInterval(fetchDashboardData, optimizedInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchDashboardData]);

  // Initial fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const refresh = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    ...state,
    refresh,
    isStale: state.lastFetch ? Date.now() - state.lastFetch.getTime() > refreshInterval : true
  };
}