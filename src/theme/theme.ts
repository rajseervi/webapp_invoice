'use client'
import { createTheme, alpha } from '@mui/material/styles'
import { PaletteMode } from '@mui/material'

// Define custom color palette
const primaryColor = {
  light: '#4361ee', // Modern blue
  dark: '#4895ef'   // Slightly lighter blue for dark mode
};

const secondaryColor = {
  light: '#f72585', // Vibrant pink
  dark: '#ff6b6b'   // Coral for dark mode
};

const successColor = {
  light: '#4cc9f0', // Teal
  dark: '#4cc9f0'   // Same teal for dark mode
};

const warningColor = {
  light: '#fca311', // Amber
  dark: '#ffb703'   // Slightly lighter amber for dark mode
};

const errorColor = {
  light: '#e63946', // Red
  dark: '#ff5d8f'   // Pinkish red for dark mode
};

const infoColor = {
  light: '#4895ef', // Light blue
  dark: '#4cc9f0'   // Teal for dark mode
};

// Define theme settings based on mode
const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light mode palette
          primary: {
            main: primaryColor.light,
            light: alpha(primaryColor.light, 0.8),
            dark: '#3a56d4',
            contrastText: '#ffffff',
          },
          secondary: {
            main: secondaryColor.light,
            light: alpha(secondaryColor.light, 0.8),
            dark: '#d91a70',
            contrastText: '#ffffff',
          },
          success: {
            main: successColor.light,
            light: alpha(successColor.light, 0.8),
            dark: '#3db8dd',
            contrastText: '#ffffff',
          },
          warning: {
            main: warningColor.light,
            light: alpha(warningColor.light, 0.8),
            dark: '#e5940f',
            contrastText: '#ffffff',
          },
          error: {
            main: errorColor.light,
            light: alpha(errorColor.light, 0.8),
            dark: '#d0333f',
            contrastText: '#ffffff',
          },
          info: {
            main: infoColor.light,
            light: alpha(infoColor.light, 0.8),
            dark: '#3a85d9',
            contrastText: '#ffffff',
          },
          text: {
            primary: '#2d3748',
            secondary: '#718096',
          },
          background: {
            default: '#f8fafc',
            paper: '#ffffff',
          },
          divider: alpha('#718096', 0.12),
        }
      : {
          // Dark mode palette
          primary: {
            main: primaryColor.dark,
            light: alpha(primaryColor.dark, 0.8),
            dark: '#3a85d9',
            contrastText: '#ffffff',
          },
          secondary: {
            main: secondaryColor.dark,
            light: alpha(secondaryColor.dark, 0.8),
            dark: '#ff5252',
            contrastText: '#ffffff',
          },
          success: {
            main: successColor.dark,
            light: alpha(successColor.dark, 0.8),
            dark: '#3db8dd',
            contrastText: '#ffffff',
          },
          warning: {
            main: warningColor.dark,
            light: alpha(warningColor.dark, 0.8),
            dark: '#e5a40f',
            contrastText: '#ffffff',
          },
          error: {
            main: errorColor.dark,
            light: alpha(errorColor.dark, 0.8),
            dark: '#ff4081',
            contrastText: '#ffffff',
          },
          info: {
            main: infoColor.dark,
            light: alpha(infoColor.dark, 0.8),
            dark: '#3db8dd',
            contrastText: '#ffffff',
          },
          text: {
            primary: '#e2e8f0',
            secondary: '#a0aec0',
          },
          background: {
            default: '#1a202c',
            paper: '#2d3748',
          },
          divider: alpha('#a0aec0', 0.12),
        }),
  },
});

// Create the theme with typography and component overrides
const getTheme = (mode: 'light' | 'dark') => {
  const tokens = getDesignTokens(mode);
  
  return createTheme({
    ...tokens,
    typography: {
      fontFamily: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
        lineHeight: 1.2,
      },
      h2: {
        fontWeight: 700,
        fontSize: '2rem',
        lineHeight: 1.2,
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.75rem',
        lineHeight: 1.2,
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem',
        lineHeight: 1.2,
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem',
        lineHeight: 1.2,
      },
      h6: {
        fontWeight: 600,
        fontSize: '1rem',
        lineHeight: 1.2,
      },
      subtitle1: {
        fontSize: '1rem',
        lineHeight: 1.5,
        fontWeight: 500,
      },
      subtitle2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
        fontWeight: 500,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
      button: {
        fontWeight: 600,
        fontSize: '0.875rem',
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*': {
            boxSizing: 'border-box',
          },
          html: {
            height: '100%',
            width: '100%',
          },
          body: {
            height: '100%',
            margin: 0,
            padding: 0,
          },
          '#root': {
            height: '100%',
          },
          'input:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 1000px white inset',
            WebkitTextFillColor: tokens.palette.text.primary,
          },
          '::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '::-webkit-scrollbar-thumb': {
            backgroundColor: mode === 'light' ? '#d1d5db' : '#4b5563',
            borderRadius: '4px',
          },
          '::-webkit-scrollbar-track': {
            backgroundColor: mode === 'light' ? '#f3f4f6' : '#1f2937',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'light' 
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            ':hover': {
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
          },
          contained: {
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'light'
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
            borderRadius: '12px',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          elevation1: {
            boxShadow: mode === 'light'
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
          },
          elevation8: {
            boxShadow: mode === 'light'
              ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
              : '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${tokens.palette.divider}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            border: 'none',
            backgroundImage: 'none',
            ...(mode === 'dark' && {
              backgroundColor: '#1e293b', // Slightly different from background.paper for contrast
            }),
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            margin: '4px 8px',
            '&.Mui-selected': {
              backgroundColor: mode === 'light' 
                ? alpha(primaryColor.light, 0.12)
                : alpha(primaryColor.dark, 0.2),
              '&:hover': {
                backgroundColor: mode === 'light' 
                  ? alpha(primaryColor.light, 0.18)
                  : alpha(primaryColor.dark, 0.3),
              },
            },
            '&:hover': {
              backgroundColor: mode === 'light' 
                ? alpha(tokens.palette.primary.main, 0.08)
                : alpha(tokens.palette.primary.main, 0.15),
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            height: 3,
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.875rem',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500,
          },
        },
      },
    },
  });
};

const theme = getTheme('light');
export default theme;
export { getTheme };