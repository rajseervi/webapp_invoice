"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getModernTheme } from '@/theme/modernTheme';

interface ModernThemeContextType {
  darkMode: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const ModernThemeContext = createContext<ModernThemeContextType | undefined>(undefined);

interface ModernThemeProviderProps {
  children: ReactNode;
}

export function ModernThemeProvider({ children }: ModernThemeProviderProps) {
  const [darkMode, setDarkMode] = useState(false);

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('modernThemeMode');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, []);

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('modernThemeMode', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };

  const setTheme = (isDark: boolean) => {
    setDarkMode(isDark);
  };

  const theme = getModernTheme(darkMode ? 'dark' : 'light');

  const contextValue: ModernThemeContextType = {
    darkMode,
    toggleTheme,
    setTheme,
  };

  return (
    <ModernThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ModernThemeContext.Provider>
  );
}

export function useModernTheme() {
  const context = useContext(ModernThemeContext);
  if (context === undefined) {
    throw new Error('useModernTheme must be used within a ModernThemeProvider');
  }
  return context;
}

export default ModernThemeProvider;