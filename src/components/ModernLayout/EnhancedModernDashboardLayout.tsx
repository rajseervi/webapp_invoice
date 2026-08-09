
'use client';
import React, { useState, useEffect, useMemo, ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, useMediaQuery, AppBar, Toolbar, IconButton, Typography, Box, Breadcrumbs, Link as MuiLink, InputBase, Avatar, Tooltip, Badge, Divider, Button, Menu, MenuItem, ListItemIcon, SpeedDial, SpeedDialAction, SpeedDialIcon } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import ModernSidebar from '@/components/ModernSidebar/ModernSidebar';
import ConfiguredVisuallyEnhancedHeader from '@/components/Header/ConfiguredVisuallyEnhancedHeader';

import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  Payments as PaymentsIcon,
  Inventory as InventoryIcon,
  Store as StoreIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  Category as CategoryIcon,
  People as PeopleIcon,
  AccountBalance as AccountBalanceIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  AttachMoney as AttachMoneyIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Add as AddIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Notifications as NotificationsIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';

interface QuickActionItem {
  id: string;
  title: string;
  icon: ReactNode;
  path: string;
  color?: string;
  badge?: number;
  isNew?: boolean;
}

interface ModernLayoutProps {
  children: ReactNode;
  title?: string;
  showBreadcrumbs?: boolean;
  pageType?: string;
  showHeader?: boolean;
  showSearch?: boolean;
  showQuickActions?: boolean;
  showNotifications?: boolean;
  customQuickActions?: QuickActionItem[];
}

// Create theme with enhanced design tokens
const createAppTheme = (isDarkMode: boolean) => createTheme({
  palette: {
    mode: isDarkMode ? 'dark' : 'light',
    primary: {
      main: '#2196F3',
      light: '#64B5F6',
      dark: '#1976D2',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FF4081',
      light: '#FF80AB',
      dark: '#C2185B',
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
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
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
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
        contained: {
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #1976D2 30%, #0288D1 90%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: isDarkMode 
            ? '0 8px 32px rgba(0, 0, 0, 0.3)'
            : '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
          backgroundImage: 'none',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 0',
          '&.Mui-selected': {
            backgroundColor: isDarkMode 
              ? 'rgba(33, 150, 243, 0.15)'
              : 'rgba(33, 150, 243, 0.08)',
            '&:hover': {
              backgroundColor: isDarkMode 
                ? 'rgba(33, 150, 243, 0.2)'
                : 'rgba(33, 150, 243, 0.12)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

export default function ModernLayout({ 
  children, 
  title,
  showBreadcrumbs = true,
  pageType,
  showHeader = true,
  showSearch,
  showQuickActions,
  showNotifications,
  customQuickActions
}: ModernLayoutProps) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Theme state
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme-mode');
      return saved ? saved === 'dark' : prefersDarkMode;
    }
    return prefersDarkMode;
  });

  const theme = createAppTheme(isDarkMode);

  // State for create menu (desktop)
  const [createAnchorEl, setCreateAnchorEl] = useState<null | HTMLElement>(null);

  // Responsive breakpoints
  const isMobile = useMediaQuery('(max-width:767px)');

  // Sidebar toggle state
  const [isSidebarMini, setIsSidebarMini] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('sidebar') === 'collapsed';
    }
    return false;
  });

  // Mobile drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const handleSidebarToggle = () => {
    if (isMobile) {
      // On mobile, toggle the drawer
      setIsMobileDrawerOpen((prev) => !prev);
    } else {
      // On desktop/tablet, toggle mini sidebar
      setIsSidebarMini((prev) => {
        const next = !prev;
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          if (next) url.searchParams.set('sidebar', 'collapsed');
          else url.searchParams.delete('sidebar');
          window.history.replaceState({}, '', url.toString());
        }
        return next;
      });
    }
  };

  const handleMobileDrawerClose = () => {
    setIsMobileDrawerOpen(false);
  };

  // Handle theme toggle
  const handleThemeToggle = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme-mode', newMode ? 'dark' : 'light');
  };

  // Authentication check
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  // Update theme based on system preference
  useEffect(() => {
    const saved = localStorage.getItem('theme-mode');
    if (!saved) {
      setIsDarkMode(prefersDarkMode);
    }
  }, [prefersDarkMode]);

  // Loading state
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: theme.palette.background.default,
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `4px solid ${theme.palette.divider}`,
            borderTop: `4px solid ${theme.palette.primary.main}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </ThemeProvider>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ display: 'flex', minHeight: '100dvh', background: theme.palette.background.default }}>
        {/* Single sidebar instance with toggle support */}
        <ModernSidebar
          isOpen={isMobile ? isMobileDrawerOpen : true}
          isMini={isSidebarMini}
          onToggle={handleSidebarToggle}
          onMobileClose={handleMobileDrawerClose}
        />
        {/* Main content area */}
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          {showHeader && (
            <ConfiguredVisuallyEnhancedHeader
              pageType={pageType}
              title={title}
              onThemeToggle={() => {
                setIsDarkMode(!isDarkMode);
                localStorage.setItem('theme-mode', !isDarkMode ? 'dark' : 'light');
              }}
              isDarkMode={isDarkMode}
              onMenuClick={handleSidebarToggle}
              showSearch={showSearch}
              showQuickActions={showQuickActions}
              showNotifications={showNotifications}
              customQuickActions={customQuickActions}
              // Ensure mobile drawer closes after navigation from sidebar
              // by wiring onMobileClose through sidebar props
              // (Handled below via onMobileClose prop)
            />
          )}

          {/* Mobile create FAB removed - using header SpeedDial to avoid duplicates */}

          {/* Page content */}
          <Box component="section" sx={{ p: { xs: 2, sm: 3, md: 4 }, flex: 1, minHeight: 1 }}>
            {children}
          </Box>
        </main>
      </div>
    </ThemeProvider>
  );
}
