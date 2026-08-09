'use client'
import { createTheme, alpha } from '@mui/material/styles'
import { PaletteMode } from '@mui/material'

// Modern Color Palette - Inspired by contemporary design systems
const modernColors = {
  // Primary - Deep Blue with excellent contrast
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Secondary - Modern Purple
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7', // Main
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
  
  // Success - Modern Green
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // Main
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  
  // Warning - Warm Orange
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Main
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Error - Modern Red
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Main
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Info - Cyan
  info: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4', // Main
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
  },
  
  // Neutral Grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
}

// Define theme settings based on mode
const getModernDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light mode palette
          primary: {
            main: modernColors.primary[500],
            light: modernColors.primary[400],
            dark: modernColors.primary[600],
            contrastText: '#ffffff',
          },
          secondary: {
            main: modernColors.secondary[500],
            light: modernColors.secondary[400],
            dark: modernColors.secondary[600],
            contrastText: '#ffffff',
          },
          success: {
            main: modernColors.success[500],
            light: modernColors.success[400],
            dark: modernColors.success[600],
            contrastText: '#ffffff',
          },
          warning: {
            main: modernColors.warning[500],
            light: modernColors.warning[400],
            dark: modernColors.warning[600],
            contrastText: '#ffffff',
          },
          error: {
            main: modernColors.error[500],
            light: modernColors.error[400],
            dark: modernColors.error[600],
            contrastText: '#ffffff',
          },
          info: {
            main: modernColors.info[500],
            light: modernColors.info[400],
            dark: modernColors.info[600],
            contrastText: '#ffffff',
          },
          text: {
            primary: modernColors.gray[900],
            secondary: modernColors.gray[600],
            disabled: modernColors.gray[400],
          },
          background: {
            default: modernColors.gray[50],
            paper: '#ffffff',
          },
          divider: modernColors.gray[200],
          action: {
            hover: alpha(modernColors.primary[500], 0.04),
            selected: alpha(modernColors.primary[500], 0.08),
            disabled: modernColors.gray[300],
            disabledBackground: modernColors.gray[100],
          },
        }
      : {
          // Dark mode palette
          primary: {
            main: modernColors.primary[400],
            light: modernColors.primary[300],
            dark: modernColors.primary[500],
            contrastText: '#ffffff',
          },
          secondary: {
            main: modernColors.secondary[400],
            light: modernColors.secondary[300],
            dark: modernColors.secondary[500],
            contrastText: '#ffffff',
          },
          success: {
            main: modernColors.success[400],
            light: modernColors.success[300],
            dark: modernColors.success[500],
            contrastText: '#ffffff',
          },
          warning: {
            main: modernColors.warning[400],
            light: modernColors.warning[300],
            dark: modernColors.warning[500],
            contrastText: '#ffffff',
          },
          error: {
            main: modernColors.error[400],
            light: modernColors.error[300],
            dark: modernColors.error[500],
            contrastText: '#ffffff',
          },
          info: {
            main: modernColors.info[400],
            light: modernColors.info[300],
            dark: modernColors.info[500],
            contrastText: '#ffffff',
          },
          text: {
            primary: modernColors.gray[100],
            secondary: modernColors.gray[400],
            disabled: modernColors.gray[600],
          },
          background: {
            default: modernColors.gray[900],
            paper: modernColors.gray[800],
          },
          divider: modernColors.gray[700],
          action: {
            hover: alpha(modernColors.primary[400], 0.08),
            selected: alpha(modernColors.primary[400], 0.12),
            disabled: modernColors.gray[600],
            disabledBackground: modernColors.gray[800],
          },
        }),
  },
});

// Modern Typography System
const modernTypography = {
  fontFamily: [
    'Inter',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
  ].join(','),
  
  // Display styles for hero sections
  h1: {
    fontWeight: 800,
    fontSize: '3.5rem',
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    '@media (max-width:600px)': {
      fontSize: '2.5rem',
    },
  },
  h2: {
    fontWeight: 700,
    fontSize: '2.75rem',
    lineHeight: 1.2,
    letterSpacing: '-0.01em',
    '@media (max-width:600px)': {
      fontSize: '2rem',
    },
  },
  h3: {
    fontWeight: 700,
    fontSize: '2.25rem',
    lineHeight: 1.2,
    letterSpacing: '-0.01em',
    '@media (max-width:600px)': {
      fontSize: '1.75rem',
    },
  },
  h4: {
    fontWeight: 600,
    fontSize: '1.875rem',
    lineHeight: 1.3,
    '@media (max-width:600px)': {
      fontSize: '1.5rem',
    },
  },
  h5: {
    fontWeight: 600,
    fontSize: '1.5rem',
    lineHeight: 1.3,
    '@media (max-width:600px)': {
      fontSize: '1.25rem',
    },
  },
  h6: {
    fontWeight: 600,
    fontSize: '1.25rem',
    lineHeight: 1.4,
    '@media (max-width:600px)': {
      fontSize: '1.125rem',
    },
  },
  
  // Body text
  body1: {
    fontSize: '1rem',
    lineHeight: 1.6,
    fontWeight: 400,
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.5,
    fontWeight: 400,
  },
  
  // UI text
  subtitle1: {
    fontSize: '1.125rem',
    lineHeight: 1.5,
    fontWeight: 500,
  },
  subtitle2: {
    fontSize: '1rem',
    lineHeight: 1.5,
    fontWeight: 500,
  },
  
  // Interactive elements
  button: {
    fontWeight: 600,
    fontSize: '0.875rem',
    textTransform: 'none' as const,
    letterSpacing: '0.01em',
  },
  
  // Small text
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.4,
    fontWeight: 400,
  },
  overline: {
    fontSize: '0.75rem',
    lineHeight: 1.4,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
};

// Create the modern theme
const getModernTheme = (mode: 'light' | 'dark') => {
  const tokens = getModernDesignTokens(mode);
  
  return createTheme({
    ...tokens,
    typography: modernTypography,
    shape: {
      borderRadius: 12,
    },
    shadows: mode === 'light' ? [
      'none',
      '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    ] : [
      'none',
      '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
      '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
      '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*': {
            boxSizing: 'border-box',
          },
          html: {
            height: '100%',
            width: '100%',
            scrollBehavior: 'smooth',
          },
          body: {
            height: '100%',
            margin: 0,
            padding: 0,
            fontFeatureSettings: '"cv02", "cv03", "cv04", "cv11"',
          },
          '#root': {
            height: '100%',
          },
          // Custom scrollbar
          '::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '::-webkit-scrollbar-thumb': {
            backgroundColor: mode === 'light' ? modernColors.gray[300] : modernColors.gray[600],
            borderRadius: '3px',
            '&:hover': {
              backgroundColor: mode === 'light' ? modernColors.gray[400] : modernColors.gray[500],
            },
          },
          '::-webkit-scrollbar-track': {
            backgroundColor: mode === 'light' ? modernColors.gray[100] : modernColors.gray[800],
          },
        },
      },
      
      // Enhanced Button Component
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '0.875rem',
            transition: 'background-color 0.1s ease',
            '&:hover': {
              // Removed transform to reduce animation overhead
            },
          },
          contained: {
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            '&:hover': {
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px',
            },
          },
        },
      },
      
      // Enhanced Card Component
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '16px',
            border: `1px solid ${mode === 'light' ? modernColors.gray[200] : modernColors.gray[700]}`,
            boxShadow: mode === 'light' 
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
            transition: 'box-shadow 0.1s ease',
            '&:hover': {
              // Simplified hover effect for better performance
              boxShadow: mode === 'light'
                ? '0 2px 4px -1px rgba(0, 0, 0, 0.1)'
                : '0 2px 4px -1px rgba(0, 0, 0, 0.3)',
            },
          },
        },
      },
      
      // Enhanced Paper Component
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: '12px',
          },
          elevation1: {
            boxShadow: mode === 'light'
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
          },
        },
      },
      
      // Enhanced AppBar
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backdropFilter: 'blur(20px)',
            backgroundColor: mode === 'light' 
              ? alpha('#ffffff', 0.8)
              : alpha(modernColors.gray[900], 0.8),
            borderBottom: `1px solid ${mode === 'light' ? modernColors.gray[200] : modernColors.gray[700]}`,
            boxShadow: 'none',
          },
        },
      },
      
      // Enhanced Drawer
      MuiDrawer: {
        styleOverrides: {
          paper: {
            border: 'none',
            backgroundImage: 'none',
            backgroundColor: mode === 'light' ? '#ffffff' : modernColors.gray[800],
            borderRight: `1px solid ${mode === 'light' ? modernColors.gray[200] : modernColors.gray[700]}`,
          },
        },
      },
      
      // Enhanced List Items
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            margin: '2px 12px',
            padding: '12px 16px',
            transition: 'background-color 0.1s ease',
            '&.Mui-selected': {
              backgroundColor: mode === 'light' 
                ? alpha(modernColors.primary[500], 0.1)
                : alpha(modernColors.primary[400], 0.2),
              color: mode === 'light' ? modernColors.primary[700] : modernColors.primary[300],
              '&:hover': {
                backgroundColor: mode === 'light' 
                  ? alpha(modernColors.primary[500], 0.15)
                  : alpha(modernColors.primary[400], 0.25),
              },
            },
            '&:hover': {
              backgroundColor: mode === 'light' 
                ? alpha(modernColors.gray[500], 0.05)
                : alpha(modernColors.gray[400], 0.1),
              // Removed translateX transform for better performance
            },
          },
        },
      },
      
      // Enhanced Input Fields
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              transition: 'border-color 0.1s ease',
              '&:hover': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: mode === 'light' ? modernColors.gray[400] : modernColors.gray[500],
                },
              },
              '&.Mui-focused': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderWidth: '2px',
                },
              },
            },
          },
        },
      },
      
      // Enhanced Tabs
      MuiTabs: {
        styleOverrides: {
          root: {
            '& .MuiTabs-indicator': {
              height: '3px',
              borderRadius: '3px 3px 0 0',
            },
          },
        },
      },
      
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.875rem',
            minHeight: '48px',
            transition: 'color 0.1s ease',
            '&:hover': {
              color: mode === 'light' ? modernColors.primary[600] : modernColors.primary[400],
            },
          },
        },
      },
      
      // Enhanced Chip
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500,
            borderRadius: '8px',
            height: '32px',
          },
        },
      },
    },
  });
};

export { getModernTheme, modernColors };
export default getModernTheme('light');