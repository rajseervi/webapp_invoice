'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface SpeedDialAction {
  id: string;
  icon: React.ReactNode;
  name: string;
  onClick: () => void;
  color?: string;
  badge?: number | string;
  disabled?: boolean;
  priority?: number; // Higher priority actions appear first
  category?: string; // 'header' | 'layout' | 'page' etc.
}

interface SpeedDialContextValue {
  actions: SpeedDialAction[];
  isOpen: boolean;
  isVisible: boolean;
  
  // Action management
  registerAction: (action: SpeedDialAction) => void;
  unregisterAction: (id: string) => void;
  clearCategory: (category: string) => void;
  
  // State management
  setOpen: (open: boolean) => void;
  setVisible: (visible: boolean) => void;
  
  // Utility
  getActionsByCategory: (category: string) => SpeedDialAction[];
}

const SpeedDialContext = createContext<SpeedDialContextValue | null>(null);

interface SpeedDialProviderProps {
  children: ReactNode;
  maxActions?: number;
}

export function SpeedDialProvider({ children, maxActions = 8 }: SpeedDialProviderProps) {
  const [actions, setActions] = useState<SpeedDialAction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const registerAction = useCallback((action: SpeedDialAction) => {
    setActions(prev => {
      // Check if action already exists and is identical
      const existingAction = prev.find(a => a.id === action.id);
      if (existingAction && 
          existingAction.name === action.name &&
          existingAction.color === action.color &&
          existingAction.badge === action.badge &&
          existingAction.disabled === action.disabled &&
          existingAction.priority === action.priority &&
          existingAction.category === action.category) {
        return prev; // No change needed
      }
      
      // Remove existing action with same id
      const filtered = prev.filter(a => a.id !== action.id);
      
      // Add new action and sort by priority (higher first)
      const updated = [...filtered, action].sort((a, b) => (b.priority || 0) - (a.priority || 0));
      
      // Limit to maxActions
      return updated.slice(0, maxActions);
    });
  }, [maxActions]);

  const unregisterAction = useCallback((id: string) => {
    setActions(prev => prev.filter(a => a.id !== id));
  }, []);

  const clearCategory = useCallback((category: string) => {
    setActions(prev => prev.filter(a => a.category !== category));
  }, []);

  const setOpen = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  const setVisible = useCallback((visible: boolean) => {
    setIsVisible(visible);
  }, []);

  const getActionsByCategory = useCallback((category: string) => {
    return actions.filter(a => a.category === category);
  }, [actions]);

  const value: SpeedDialContextValue = {
    actions,
    isOpen,
    isVisible,
    registerAction,
    unregisterAction,
    clearCategory,
    setOpen,
    setVisible,
    getActionsByCategory,
  };

  return (
    <SpeedDialContext.Provider value={value}>
      {children}
    </SpeedDialContext.Provider>
  );
}

export function useSpeedDial() {
  const context = useContext(SpeedDialContext);
  if (!context) {
    throw new Error('useSpeedDial must be used within a SpeedDialProvider');
  }
  return context;
}

// Hook for easily registering/unregistering actions
export function useSpeedDialAction(action: SpeedDialAction, enabled = true) {
  const { registerAction, unregisterAction } = useSpeedDial();

  React.useEffect(() => {
    if (enabled) {
      registerAction(action);
      return () => unregisterAction(action.id);
    }
  }, [action, enabled, registerAction, unregisterAction]);
}

// Hook for managing category-based actions
export function useSpeedDialCategory(category: string, actions: Omit<SpeedDialAction, 'category'>[], enabled = true) {
  const { registerAction, clearCategory } = useSpeedDial();

  // Memoize the actions with category to prevent infinite re-renders
  const actionsWithCategory = React.useMemo(() => {
    return actions.map(action => ({ ...action, category }));
  }, [actions, category]);

  React.useEffect(() => {
    if (enabled) {
      // Clear existing actions in this category
      clearCategory(category);
      
      // Register new actions
      actionsWithCategory.forEach(action => {
        registerAction(action);
      });

      return () => clearCategory(category);
    }
  }, [actionsWithCategory, category, enabled, registerAction, clearCategory]);
}