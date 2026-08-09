'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useSuperEnhancedHeader } from '@/hooks/useSuperEnhancedHeader';

// Types
interface HeaderContextType {
  // State
  searchHistory: any[];
  userPreferences: any;
  notifications: any[];
  isLoading: boolean;
  unreadNotificationCount: number;

  // Actions
  savePreferences: (preferences: any) => void;
  addToSearchHistory: (query: string, resultCount: number, selectedResult?: string) => void;
  toggleFavorite: (itemId: string) => void;
  addToQuickAccess: (partyId: string) => void;
  removeFromQuickAccess: (partyId: string) => void;
  getSearchSuggestions: (query: string) => any[];
  performEnhancedSearch: (query: string, filter?: string, options?: any) => Promise<any[]>;
  loadNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;

  // Computed values
  recentSearches: string[];
  favoriteItems: string[];
  quickAccessParties: string[];
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

interface HeaderProviderProps {
  children: ReactNode;
}

export const HeaderProvider: React.FC<HeaderProviderProps> = ({ children }) => {
  const headerData = useSuperEnhancedHeader();

  return (
    <HeaderContext.Provider value={headerData}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeaderContext = () => {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error('useHeaderContext must be used within a HeaderProvider');
  }
  return context;
};