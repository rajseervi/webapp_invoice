'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider, createTheme, Theme } from '@mui/material/styles';
import { CssBaseline, useMediaQuery } from '@mui/material';

// Theme configuration interface
interface ThemeConfig {
  isDarkMode: boolean;
  primaryColor: string;
  secondaryColor: string;
  borderRadius: number;
  fontFamily: string;
}

// Theme context interface
interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: Theme;
  config: ThemeConfig;
  updateConfig: (newConfig: Partial<ThemeConfig>) => void;
}

// Create theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Hook to use theme context
export const useModernTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useModernTheme must be used within a ModernThemeProvider');
  }
  return context;
};

// Default theme configuration
const defaultConfig: ThemeConfig = {
  isDarkMode: false,
  primaryColor: '#2196F3',
  secondaryColor: '#FF4081',
  borderRadius: 12,
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
};

// Enhanced theme creation function
const createModernTheme = (config: ThemeConfig): Theme => {
  const { isDarkMode, primaryColor, secondaryColor, borderRadius, fontFamily } = config;

  return createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: primaryColor,
        light: isDarkMode ? '#64B5F6' : '#E3F2FD',
        dark: isDarkMode ? '#0D47A1' : '#1976D2',
        contrastText: '#ffffff',
      },
      secondary: {
        main: secondaryColor,
        light: isDarkMode ? '#FF80AB' : '#FCE4EC',
        dark: isDarkMode ? '#AD1457' : '#C2185B',
        contrastText: '#ffffff',
      },
      background: {
        default: isDarkMode ? '#0a0e1a' : '#f8f9fa',
        paper: isDarkMode ? '#1a1d29' : '#ffffff',
      },
      text: {
        primary: isDarkMode ? '#ffffff' : '#1a1d29',
        secondary: isDarkMode ? '#b0b3b8' : '#6c757d',
      },
      divider: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      action: {
        hover: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
        selected: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        disabled: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)',
        disabledBackground: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      },
      success: {
        main: '#4CAF50',
        light: '#81C784',
        dark: '#388E3C',
      },
      warning: {
        main: '#FF9800',
        light: '#FFB74D',
        dark: '#F57C00',
      },
      error: {
        main: '#F44336',
        light: '#E57373',
        dark: '#D32F2F',
      },
      info: {
        main: '#2196F3',
        light: '#64B5F6',
        dark: '#1976D2',
      },
    },
    typography: {
      fontFamily,
      h1: {
        fontWeight: 800,
        fontSize: '3rem',
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontWeight: 700,
        fontSize: '2.5rem',
        lineHeight: 1.2,
        letterSpacing: '-0.01em',
      },
      h3: {
        fontWeight: 700,
        fontSize: '2rem',
        lineHeight: 1.3,
        letterSpacing: '-0.01em',
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.75rem',
        lineHeight: 1.3,
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.5rem',
        lineHeight: 1.4,
      },
      h6: {
        fontWeight: 600,
        fontSize: '1.25rem',
        lineHeight: 1.4,
      },
      subtitle1: {
        fontWeight: 500,
        fontSize: '1.125rem',
        lineHeight: 1.5,
      },
      subtitle2: {
        fontWeight: 500,
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
      caption: {
        fontSize: '0.75rem',
        lineHeight: 1.4,
        letterSpacing: '0.03em',
      },
      overline: {
        fontSize: '0.75rem',
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        letterSpacing: '0.02em',
      },
    },
    shape: {
      borderRadius,
    },
    spacing: 8,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            scrollbarColor: isDarkMode 
              ? 'rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.1)',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            },
            '&::-webkit-scrollbar-thumb': {
              background: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
              '&:hover': {
                background: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
              },
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: borderRadius / 1.5,
            textTransform: 'none',
            fontWeight: 600,
            padding: '10px 24px',
            boxShadow: 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              transform: 'translateY(-1px)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          },
          contained: {
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${primaryColor}dd 0%, ${primaryColor}bb 100%)`,
            },
          },
          outlined: {
            borderWidth: '2px',
            '&:hover': {
              borderWidth: '2px',
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
          },
          text: {
            '&:hover': {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: borderRadius * 1.2,
            boxShadow: isDarkMode 
              ? '0 8px 32px rgba(0, 0, 0, 0.4)'
              : '0 8px 32px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: isDarkMode 
                ? '0 12px 40px rgba(0, 0, 0, 0.5)'
                : '0 12px 40px rgba(0, 0, 0, 0.12)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: borderRadius,
          },
          elevation1: {
            boxShadow: isDarkMode 
              ? '0 2px 8px rgba(0, 0, 0, 0.3)'
              : '0 2px 8px rgba(0, 0, 0, 0.08)',
          },
          elevation2: {
            boxShadow: isDarkMode 
              ? '0 4px 16px rgba(0, 0, 0, 0.3)'
              : '0 4px 16px rgba(0, 0, 0, 0.08)',
          },
          elevation3: {
            boxShadow: isDarkMode 
              ? '0 8px 24px rgba(0, 0, 0, 0.3)'
              : '0 8px 24px rgba(0, 0, 0, 0.08)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: 'transparent',
            backgroundImage: 'none',
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            backgroundColor: isDarkMode ? '#1a1d29' : '#ffffff',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: borderRadius / 1.5,
            margin: '2px 8px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&.Mui-selected': {
              backgroundColor: `${primaryColor}20`,
              color: primaryColor,
              '&:hover': {
                backgroundColor: `${primaryColor}30`,
              },
              '& .MuiListItemIcon-root': {
                color: primaryColor,
              },
            },
            '&:hover': {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: borderRadius / 1.5,
            fontWeight: 500,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: borderRadius / 1.5,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderWidth: '2px',
              },
            },
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: borderRadius,
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: borderRadius / 2,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              transform: 'scale(1.05)',
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(97, 97, 97, 0.9)',
            fontSize: '0.75rem',
            borderRadius: borderRadius / 2,
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: borderRadius / 2,
            height: '6px',
          },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: {
            borderRadius: borderRadius / 2,
          },
        },
      },
    },
  });
};

// Theme provider props
interface ModernThemeProviderProps {
  children: ReactNode;
  initialConfig?: Partial<ThemeConfig>;
}

// Modern theme provider component
export const ModernThemeProvider: React.FC<ModernThemeProviderProps> = ({
  children,
  initialConfig = {},
}) => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  
  // Initialize theme configuration
  const [config, setConfig] = useState<ThemeConfig>(() => {
    const savedConfig = typeof window !== 'undefined' 
      ? localStorage.getItem('modern-theme-config')
      : null;
    
    const parsedConfig = savedConfig ? JSON.parse(savedConfig) : {};
    
    return {
      ...defaultConfig,
      ...parsedConfig,
      ...initialConfig,
      isDarkMode: parsedConfig.isDarkMode ?? initialConfig.isDarkMode ?? prefersDarkMode,
    };
  });

  // Create theme based on current configuration
  const theme = createModernTheme(config);

  // Toggle theme function
  const toggleTheme = () => {
    const newConfig = { ...config, isDarkMode: !config.isDarkMode };
    setConfig(newConfig);
    localStorage.setItem('modern-theme-config', JSON.stringify(newConfig));
  };

  // Update configuration function
  const updateConfig = (newConfig: Partial<ThemeConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    localStorage.setItem('modern-theme-config', JSON.stringify(updatedConfig));
  };

  // Update theme based on system preference
  useEffect(() => {
    const savedConfig = localStorage.getItem('modern-theme-config');
    if (!savedConfig) {
      setConfig(prev => ({ ...prev, isDarkMode: prefersDarkMode }));
    }
  }, [prefersDarkMode]);

  // Context value
  const contextValue: ThemeContextType = {
    isDarkMode: config.isDarkMode,
    toggleTheme,
    theme,
    config,
    updateConfig,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ModernThemeProvider;