'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { partyService } from '@/services/partyService';
import { productService } from '@/services/productService';

// Types
interface SearchHistory {
  query: string;
  timestamp: Date;
  resultCount: number;
  selectedResult?: string;
}

interface UserPreferences {
  enableAdvancedSearch: boolean;
  enableVoiceSearch: boolean;
  enableShortcuts: boolean;
  searchFilters: string[];
  favoriteItems: string[];
  recentSearches: string[];
  quickAccessParties: string[];
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

export const useSuperEnhancedHeader = () => {
  const router = useRouter();
  
  // State
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    enableAdvancedSearch: true,
    enableVoiceSearch: false,
    enableShortcuts: true,
    searchFilters: ['all'],
    favoriteItems: [],
    recentSearches: [],
    quickAccessParties: [],
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load user preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('headerPreferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setUserPreferences(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    }

    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setSearchHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        })));
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = useCallback((newPreferences: Partial<UserPreferences>) => {
    const updated = { ...userPreferences, ...newPreferences };
    setUserPreferences(updated);
    localStorage.setItem('headerPreferences', JSON.stringify(updated));
  }, [userPreferences]);

  // Add to search history
  const addToSearchHistory = useCallback((query: string, resultCount: number, selectedResult?: string) => {
    const newEntry: SearchHistory = {
      query,
      timestamp: new Date(),
      resultCount,
      selectedResult,
    };

    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.query !== query);
      const updated = [newEntry, ...filtered].slice(0, 50); // Keep last 50 searches
      localStorage.setItem('searchHistory', JSON.stringify(updated));
      return updated;
    });

    // Update recent searches in preferences
    savePreferences({
      recentSearches: [query, ...userPreferences.recentSearches.filter(q => q !== query)].slice(0, 10)
    });
  }, [userPreferences.recentSearches, savePreferences]);

  // Toggle favorite item
  const toggleFavorite = useCallback((itemId: string) => {
    const newFavorites = userPreferences.favoriteItems.includes(itemId)
      ? userPreferences.favoriteItems.filter(id => id !== itemId)
      : [...userPreferences.favoriteItems, itemId];
    
    savePreferences({ favoriteItems: newFavorites });
  }, [userPreferences.favoriteItems, savePreferences]);

  // Add party to quick access
  const addToQuickAccess = useCallback((partyId: string) => {
    const newQuickAccess = userPreferences.quickAccessParties.includes(partyId)
      ? userPreferences.quickAccessParties
      : [...userPreferences.quickAccessParties, partyId].slice(0, 10); // Limit to 10
    
    savePreferences({ quickAccessParties: newQuickAccess });
  }, [userPreferences.quickAccessParties, savePreferences]);

  // Remove from quick access
  const removeFromQuickAccess = useCallback((partyId: string) => {
    const newQuickAccess = userPreferences.quickAccessParties.filter(id => id !== partyId);
    savePreferences({ quickAccessParties: newQuickAccess });
  }, [userPreferences.quickAccessParties, savePreferences]);

  // Get search suggestions based on history
  const getSearchSuggestions = useCallback((query: string) => {
    if (!query.trim()) return [];

    const historySuggestions = searchHistory
      .filter(item => item.query.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5)
      .map(item => ({
        type: 'history' as const,
        query: item.query,
        resultCount: item.resultCount,
      }));

    const recentSuggestions = userPreferences.recentSearches
      .filter(recent => recent.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .map(recent => ({
        type: 'recent' as const,
        query: recent,
      }));

    return [...historySuggestions, ...recentSuggestions];
  }, [searchHistory, userPreferences.recentSearches]);

  // Enhanced search with analytics
  const performEnhancedSearch = useCallback(async (
    query: string, 
    filter: string = 'all',
    options: {
      includeInactive?: boolean;
      sortBy?: 'relevance' | 'date' | 'name';
      limit?: number;
    } = {}
  ) => {
    if (!query.trim()) return [];

    setIsLoading(true);
    const startTime = Date.now();

    try {
      const results: any[] = [];
      const { includeInactive = false, sortBy = 'relevance', limit = 12 } = options;

      // Search parties
      if (filter === 'all' || filter === 'party') {
        const parties = await partyService.getAllParties();
        const matchingParties = parties
          .filter(party => {
            if (!includeInactive && !party.isActive) return false;
            
            const searchFields = [
              party.name,
              party.email,
              party.phone,
              party.contactPerson,
              party.businessType,
              party.address,
              ...(party.tags || [])
            ].filter(Boolean).join(' ').toLowerCase();
            
            return searchFields.includes(query.toLowerCase());
          })
          .map(party => ({
            ...party,
            type: 'party',
            relevanceScore: calculateRelevanceScore(query, [
              party.name,
              party.email,
              party.contactPerson,
            ]),
          }));

        results.push(...matchingParties);
      }

      // Search products
      if (filter === 'all' || filter === 'product') {
        try {
          const products = await productService.getAllProducts();
          const matchingProducts = products
            .filter(product => {
              if (!includeInactive && !product.isActive) return false;
              
              const searchFields = [
                product.name,
                product.sku,
                product.categoryName,
                product.brand,
                product.description,
                ...(product.tags || [])
              ].filter(Boolean).join(' ').toLowerCase();
              
              return searchFields.includes(query.toLowerCase());
            })
            .map(product => ({
              ...product,
              type: 'product',
              relevanceScore: calculateRelevanceScore(query, [
                product.name,
                product.sku,
                product.categoryName,
              ]),
            }));

          results.push(...matchingProducts);
        } catch (error) {
          console.log('Product search not available:', error);
        }
      }

      // Sort results
      let sortedResults = results;
      switch (sortBy) {
        case 'relevance':
          sortedResults = results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
          break;
        case 'date':
          sortedResults = results.sort((a, b) => 
            new Date(b.updatedAt || b.createdAt || 0).getTime() - 
            new Date(a.updatedAt || a.createdAt || 0).getTime()
          );
          break;
        case 'name':
          sortedResults = results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          break;
      }

      const limitedResults = sortedResults.slice(0, limit);
      
      // Add to search history
      const searchTime = Date.now() - startTime;
      addToSearchHistory(query, limitedResults.length);
      
      // Log search analytics (in a real app, you'd send this to your analytics service)
      console.log('Search Analytics:', {
        query,
        filter,
        resultCount: limitedResults.length,
        searchTime,
        options,
      });

      return limitedResults;
    } catch (error) {
      console.error('Enhanced search error:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [addToSearchHistory]);

  // Calculate relevance score for search results
  const calculateRelevanceScore = (query: string, fields: (string | undefined)[]): number => {
    const queryLower = query.toLowerCase();
    let score = 0;

    fields.forEach((field, index) => {
      if (!field) return;
      
      const fieldLower = field.toLowerCase();
      
      // Exact match gets highest score
      if (fieldLower === queryLower) {
        score += 100 - (index * 10);
      }
      // Starts with query gets high score
      else if (fieldLower.startsWith(queryLower)) {
        score += 80 - (index * 10);
      }
      // Contains query gets medium score
      else if (fieldLower.includes(queryLower)) {
        score += 60 - (index * 10);
      }
      // Word boundary match gets lower score
      else if (new RegExp(`\\b${queryLower}`, 'i').test(fieldLower)) {
        score += 40 - (index * 10);
      }
    });

    return score;
  };

  // Load notifications (mock implementation)
  const loadNotifications = useCallback(async () => {
    // In a real app, this would fetch from your API
    const mockNotifications: NotificationItem[] = [
      {
        id: '1',
        title: 'Payment Overdue',
        message: 'Invoice #INV-001 from ABC Corp is 15 days overdue',
        type: 'error',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: false,
        actionUrl: '/invoices/INV-001',
        priority: 'high',
      },
      {
        id: '2',
        title: 'New Invoice Created',
        message: 'Invoice #INV-002 has been generated for XYZ Ltd',
        type: 'success',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        read: false,
        actionUrl: '/invoices/INV-002',
        priority: 'medium',
      },
      {
        id: '3',
        title: 'Low Stock Alert',
        message: 'Product "Widget A" is running low (5 units remaining)',
        type: 'warning',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        read: true,
        actionUrl: '/products/widget-a',
        priority: 'medium',
      },
    ];

    setNotifications(mockNotifications);
  }, []);

  // Mark notification as read
  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  // Mark all notifications as read
  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  // Get unread notification count
  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return {
    // State
    searchHistory,
    userPreferences,
    notifications,
    isLoading,
    unreadNotificationCount,

    // Actions
    savePreferences,
    addToSearchHistory,
    toggleFavorite,
    addToQuickAccess,
    removeFromQuickAccess,
    getSearchSuggestions,
    performEnhancedSearch,
    loadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,

    // Computed values
    recentSearches: userPreferences.recentSearches,
    favoriteItems: userPreferences.favoriteItems,
    quickAccessParties: userPreferences.quickAccessParties,
  };
};