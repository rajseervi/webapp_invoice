'use client';
import React, { useState, useEffect, ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, useMediaQuery, Box, SpeedDial, SpeedDialAction, SpeedDialIcon, Backdrop } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import ModernSidebar from '@/components/ModernSidebar/ModernSidebar';
import SuperEnhancedHeader from '@/components/Header/SuperEnhancedHeader';
import { HeaderProvider } from '@/contexts/HeaderContext';
import {
  Receipt as ReceiptIcon,
  ShoppingCart as ShoppingCartIcon,
  Store as StoreIcon,
  Category as CategoryIcon,
  People as PeopleIcon,
  Add as AddIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';

interface ModernLayoutProps {
  children: ReactNode;
  title?: string;
  showBreadcrumbs?: boolean;
  enableEnhancedSearch?: boolean;
  enablePartyQuickAccess?: boolean;
  enableAdvancedFeatures?: boolean;
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
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        },
      },
    },
    // Enhanced menu styling for better integration
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: isDarkMode
            ? '0 8px 32px rgba(0, 0, 0, 0.4)'
            : '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: isDarkMode
            ? '0 16px 64px rgba(0, 0, 0, 0.5)'
            : '0 16px 64px rgba(0, 0, 0, 0.15)',
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

// Custom quick actions for the enhanced header
const getCustomQuickActions = (router: any) => [
  {
    id: 'new-invoice',
    title: 'New Invoice',
    icon: <ReceiptIcon />,
    path: '/invoices/new',
    color: '#4CAF50',
    category: 'primary' as const,
    shortcut: 'Ctrl+N',
    isNew: true,
  },
  {
    id: 'new-order',
    title: 'New Order',
    icon: <ShoppingCartIcon />,
    path: '/orders/new',
    color: '#FF9800',
    category: 'primary' as const,
    shortcut: 'Ctrl+O',
  },
  {
    id: 'add-party',
    title: 'Add Party',
    icon: <PeopleIcon />,
    path: '/parties/new',
    color: '#9C27B0',
    category: 'primary' as const,
    shortcut: 'Ctrl+P',
  },
  {
    id: 'add-product',
    title: 'Add Product',
    icon: <StoreIcon />,
    path: '/products/new',
    color: '#2196F3',
    category: 'secondary' as const,
  },
  {
    id: 'add-category',
    title: 'Add Category',
    icon: <CategoryIcon />,
    path: '/categories/new',
    color: '#607D8B',
    category: 'secondary' as const,
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: <AnalyticsIcon />,
    path: '/reports',
    color: '#795548',
    category: 'secondary' as const,
  },
];

export default function ModernLayout({ 
  children, 
  title,
  showBreadcrumbs = true,
  enableEnhancedSearch = true,
  enablePartyQuickAccess = true,
  enableAdvancedFeatures = true,
}: ModernLayoutProps) {
  const { currentUser, loadingAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMediaQuery('(max-width:767px)');
  const isTablet = useMediaQuery('(min-width:768px) and (max-width:1023px)');
  
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

  // Sidebar toggle state
  const [isSidebarMini, setIsSidebarMini] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-mini');
      if (saved !== null) return saved === 'true';
      // Default: mini on tablet widths (768–1023px), expanded otherwise
      const width = window.innerWidth;
      return width >= 768 && width <= 1023;
    }
    return false;
  });

  // Mobile drawer state (separate from desktop mini sidebar)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Mobile FAB state
  const [fabOpen, setFabOpen] = useState(false);

  const handleSidebarToggle = () => {
    if (isMobile) {
      // Mobile: toggle drawer open/close
      setMobileDrawerOpen(prev => !prev);
    } else {
      // Desktop: toggle mini sidebar
      setIsSidebarMini((prev) => {
        const next = !prev;
        if (typeof window !== 'undefined') {
          localStorage.setItem('sidebar-mini', next.toString());
        }
        return next;
      });
    }
  };

  const handleMobileDrawerClose = () => {
    setMobileDrawerOpen(false);
  };

  // Handle theme toggle
  const handleThemeToggle = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme-mode', newMode ? 'dark' : 'light');
  };

  // Authentication check
  useEffect(() => {
    if (!loadingAuth && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loadingAuth, router]);

  // Update theme based on system preference
  useEffect(() => {
    const saved = localStorage.getItem('theme-mode');
    if (!saved) {
      setIsDarkMode(prefersDarkMode);
    }
  }, [prefersDarkMode]);

  // Loading state
  if (loadingAuth) {
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
      <HeaderProvider>
        <Box sx={{ 
          display: 'flex', 
          minHeight: '100dvh', 
          background: theme.palette.background.default 
        }}>
          {/* Modern Sidebar */}
          <ModernSidebar
            isOpen={isMobile ? mobileDrawerOpen : true}
            // Desktop: controlled by parent; Tablet: let sidebar auto-manage mini; Mobile: not mini
            isMini={isMobile ? false : (isTablet ? undefined : isSidebarMini)}
            onToggle={handleSidebarToggle}
            onMobileClose={handleMobileDrawerClose}
            variant={isMobile ? 'temporary' : 'permanent'}
          />

          {/* Main content area with enhanced header */}
          <Box 
            component="main" 
            sx={{ 
              flex: 1, 
              minWidth: 0, 
              display: 'flex', 
              flexDirection: 'column',
              transition: theme.transitions.create(['margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            }}
          >
            {/* Super Enhanced Header */}
            <SuperEnhancedHeader
              onDrawerToggle={handleSidebarToggle}
              isDrawerOpen={isMobile ? mobileDrawerOpen : !isSidebarMini}
              onThemeToggle={handleThemeToggle}
              isDarkMode={isDarkMode}
              title={title}
              showSearch={enableEnhancedSearch}
              showQuickActions={true}
              showPartyQuickAccess={enablePartyQuickAccess}
              enableAdvancedSearch={enableAdvancedFeatures}
              enableShortcuts={enableAdvancedFeatures}
              customQuickActions={getCustomQuickActions(router)}
            />

            {/* Page content with proper spacing */}
            <Box 
              component="section" 
              sx={{ 
                p: { xs: 2, sm: 3, md: 4 }, 
                flex: 1, 
                minHeight: 0,
                pt: { xs: 9, sm: 10 }, // Account for header height
                transition: theme.transitions.create(['padding'], {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
              }}
            >
              {children}
            </Box>
          </Box>

          {/* Enhanced Mobile FAB with backdrop */}
          {isMobile && (
            <>
              <Backdrop
                open={fabOpen}
                onClick={() => setFabOpen(false)}
                sx={{ 
                  zIndex: theme.zIndex.speedDial - 1,
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                }}
              />
              <SpeedDial
                ariaLabel="Create new item"
                sx={{ 
                  position: 'fixed', 
                  right: 16, 
                  bottom: 16,
                  zIndex: theme.zIndex.speedDial,
                  '& .MuiSpeedDial-fab': {
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1976D2 30%, #0288D1 90%)',
                    },
                  },
                }}
                icon={<SpeedDialIcon openIcon={<AddIcon />} />}
                open={fabOpen}
                onClick={() => setFabOpen(!fabOpen)}
                onClose={() => setFabOpen(false)}
                onOpen={() => setFabOpen(true)}
              >
                <SpeedDialAction
                  icon={<ReceiptIcon />}
                  tooltipTitle="New Invoice"
                  onClick={() => {
                    setFabOpen(false);
                    router.push('/invoices/new');
                  }}
                  sx={{
                    '& .MuiSpeedDialAction-fab': {
                      backgroundColor: '#4CAF50',
                      '&:hover': { backgroundColor: '#388E3C' },
                    },
                  }}
                />
                <SpeedDialAction
                  icon={<ShoppingCartIcon />}
                  tooltipTitle="New Order"
                  onClick={() => {
                    setFabOpen(false);
                    router.push('/orders/new');
                  }}
                  sx={{
                    '& .MuiSpeedDialAction-fab': {
                      backgroundColor: '#FF9800',
                      '&:hover': { backgroundColor: '#F57C00' },
                    },
                  }}
                />
                <SpeedDialAction
                  icon={<StoreIcon />}
                  tooltipTitle="Add Product"
                  onClick={() => {
                    setFabOpen(false);
                    router.push('/products/new');
                  }}
                  sx={{
                    '& .MuiSpeedDialAction-fab': {
                      backgroundColor: '#2196F3',
                      '&:hover': { backgroundColor: '#1976D2' },
                    },
                  }}
                />
                <SpeedDialAction
                  icon={<CategoryIcon />}
                  tooltipTitle="Add Category"
                  onClick={() => {
                    setFabOpen(false);
                    router.push('/categories/new');
                  }}
                  sx={{
                    '& .MuiSpeedDialAction-fab': {
                      backgroundColor: '#607D8B',
                      '&:hover': { backgroundColor: '#455A64' },
                    },
                  }}
                />
                <SpeedDialAction
                  icon={<PeopleIcon />}
                  tooltipTitle="Add Party"
                  onClick={() => {
                    setFabOpen(false);
                    router.push('/parties/new');
                  }}
                  sx={{
                    '& .MuiSpeedDialAction-fab': {
                      backgroundColor: '#9C27B0',
                      '&:hover': { backgroundColor: '#7B1FA2' },
                    },
                  }}
                />
                <SpeedDialAction
                  icon={<AssignmentIcon />}
                  tooltipTitle="Reports"
                  onClick={() => {
                    setFabOpen(false);
                    router.push('/reports');
                  }}
                  sx={{
                    '& .MuiSpeedDialAction-fab': {
                      backgroundColor: '#795548',
                      '&:hover': { backgroundColor: '#5D4037' },
                    },
                  }}
                />
              </SpeedDial>
            </>
          )}
        </Box>
      </HeaderProvider>
    </ThemeProvider>
  );
}