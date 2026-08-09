'use client';
import React, { useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  CssBaseline, 
  useMediaQuery, 
  Box, 
  SpeedDial, 
  SpeedDialAction, 
  SpeedDialIcon,
  Fade,
  Zoom,
  Slide,
  Backdrop,
  CircularProgress,
  Typography,
  Drawer,
  SwipeableDrawer,
  IconButton,
  useTheme,
  Avatar,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import ModernSidebar from '@/components/ModernLayout/ModernSidebar';
// import ConfiguredSimpleModernHeader from '@/components/ModernLayout/ConfiguredSimpleModernHeader';
import ConfiguredSimpleModernHeader from '@/components/Header/VisuallyEnhancedHeader';

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
  AutoAwesome as AutoAwesomeIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';

interface VisuallyEnhancedDashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBreadcrumbs?: boolean;
  pageType?: 'dashboard' | 'products' | 'invoices' | 'parties' | 'orders' | 'reports' | 'settings';
  showHeader?: boolean;
  enableVisualEffects?: boolean;
  enableParticles?: boolean;
  customQuickActions?: Array<{
    icon: ReactNode;
    label: string;
    onClick: () => void;
    color?: string;
  }>;
}

// Clean minimal theme
const createCleanTheme = (isDarkMode: boolean, pageType: string = 'dashboard') => {
  return createTheme({
    palette: {
      mode: 'light', // Always light mode for clean UI
      primary: {
        main: '#1976d2',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#dc004e',
        contrastText: '#ffffff',
      },
      background: {
        default: '#ffffff',
        paper: '#ffffff',
      },
      text: {
        primary: '#212121',
        secondary: '#757575',
      },
      divider: '#e0e0e0',
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: { fontWeight: 500, fontSize: '2rem' },
      h2: { fontWeight: 500, fontSize: '1.75rem' },
      h3: { fontWeight: 500, fontSize: '1.5rem' },
      h4: { fontWeight: 500, fontSize: '1.25rem' },
      h5: { fontWeight: 500, fontSize: '1.125rem' },
      h6: { fontWeight: 500, fontSize: '1rem' },
      button: { textTransform: 'none', fontWeight: 400 },
    },
    shape: {
      borderRadius: 4,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            scrollBehavior: 'smooth',
          },
          body: {
            scrollBehavior: 'smooth',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 400,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
            border: '1px solid #e0e0e0',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: 'none',
            border: '1px solid #e0e0e0',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            margin: 0,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 4,
            },
          },
        },
      },
    },
  });
};

// Particle component for background effects
const ParticleBackground: React.FC<{ enabled: boolean; pageType: string }> = ({ enabled, pageType }) => {
  if (!enabled) return null;

  const particleCount = 50;
  const particles = Array.from({ length: particleCount }, (_, i) => i);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -1,
        overflow: 'hidden',
      }}
    >
      {particles.map((particle) => (
        <motion.div
          key={particle}
          style={{
            position: 'absolute',
            width: Math.random() * 4 + 1,
            height: Math.random() * 4 + 1,
            backgroundColor: pageType === 'dashboard' ? '#2196F3' : '#4CAF50',
            borderRadius: '50%',
            opacity: Math.random() * 0.5 + 0.1,
          }}
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          transition={{
            duration: Math.random() * 20 + 10,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'linear',
          }}
        />
      ))}
    </Box>
  );
};

// Loading component with enhanced animations
const EnhancedLoadingScreen: React.FC<{ theme: any }> = ({ theme }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: theme.palette.background.default,
    }}
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      style={{
        width: '60px',
        height: '60px',
        border: `4px solid ${theme.palette.divider}`,
        borderTop: `4px solid ${theme.palette.primary.main}`,
        borderRadius: '50%',
        marginBottom: '20px',
      }}
    />
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Typography variant="h6" color="textSecondary">
        Loading your workspace...
      </Typography>
    </motion.div>
  </motion.div>
);

export default function VisuallyEnhancedDashboardLayout({ 
  children, 
  title,
  subtitle,
  showBreadcrumbs = true,
  pageType = 'dashboard',
  showHeader = true,
  enableVisualEffects = true,
  enableParticles = false,
  customQuickActions = []
}: VisuallyEnhancedDashboardLayoutProps) {
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

  // Responsive breakpoints
  const theme = useMemo(() => createCleanTheme(isDarkMode, pageType), [isDarkMode, pageType]);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  // Mobile sidebar state - separate from desktop mini state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Desktop sidebar toggle state
  const [isSidebarMini, setIsSidebarMini] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('sidebar') === 'collapsed';
    }
    return false;
  });

  // Desktop sidebar visibility state (completely hide/show)
  const [isSidebarHidden, setIsSidebarHidden] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-hidden');
      return saved === 'true';
    }
    return false;
  });

  // Animation states
  const [isLoaded, setIsLoaded] = useState(false);

  const handleSidebarToggle = useCallback(() => {
    console.log('Sidebar toggle clicked. Is mobile:', isMobile, 'Current states - Hidden:', isSidebarHidden, 'Mini:', isSidebarMini);
    
    if (isMobile) {
      // On mobile, toggle the mobile sidebar drawer
      setIsMobileSidebarOpen(prev => {
        const next = !prev;
        console.log('Toggling mobile sidebar from', prev, 'to', next);
        return next;
      });
    } else {
      // On desktop, simple toggle between full and mini (not hidden)
      if (isSidebarHidden) {
        // If hidden, show as full
        setIsSidebarHidden(false);
        setIsSidebarMini(false);
        localStorage.setItem('sidebar-hidden', 'false');
        console.log('Hidden -> Full');
      } else {
        // Toggle between full and mini
        setIsSidebarMini(prev => {
          const next = !prev;
          console.log(next ? 'Full -> Mini' : 'Mini -> Full');
          return next;
        });
      }
    }
  }, [isMobile, isSidebarHidden, isSidebarMini]);

  // Handle sidebar visibility toggle (for keyboard shortcut)
  const handleSidebarVisibilityToggle = useCallback(() => {
    if (!isMobile) {
      setIsSidebarHidden(prev => {
        const next = !prev;
        localStorage.setItem('sidebar-hidden', next.toString());
        if (next) {
          setIsSidebarMini(false);
        }
        return next;
      });
    }
  }, [isMobile]);

  // Handle showing sidebar when it's hidden (for floating button)
  const handleShowSidebar = useCallback(() => {
    if (!isMobile && isSidebarHidden) {
      setIsSidebarHidden(false);
      setIsSidebarMini(false);
      localStorage.setItem('sidebar-hidden', 'false');
      console.log('Showing hidden sidebar');
    }
  }, [isMobile, isSidebarHidden]);

  // Handle mobile sidebar close
  const handleMobileSidebarClose = useCallback(() => {
    console.log('Mobile sidebar closing...');
    setIsMobileSidebarOpen(false);
  }, []);

  // Handle mobile sidebar open
  const handleMobileSidebarOpen = useCallback(() => {
    console.log('Mobile sidebar opening...');
    setIsMobileSidebarOpen(true);
  }, []);

  // Handle theme toggle
  const handleThemeToggle = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme-mode', newMode ? 'dark' : 'light');
  };

  // Close mobile sidebar on route change (use ref to compare previous pathname)
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (isMobile && isMobileSidebarOpen && prevPathnameRef.current !== pathname) {
      setIsMobileSidebarOpen(false);
    }
    prevPathnameRef.current = pathname;
  }, [pathname, isMobile]);

  // Close mobile sidebar when switching to desktop
  useEffect(() => {
    if (!isMobile && isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  }, [isMobile, isMobileSidebarOpen]);

  // Update URL when sidebar state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      
      if (isSidebarMini && !isSidebarHidden) {
        url.searchParams.set('sidebar', 'collapsed');
      } else {
        url.searchParams.delete('sidebar');
      }
      
      window.history.replaceState({}, '', url.toString());
    }
  }, [isSidebarMini, isSidebarHidden]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape key to close mobile sidebar
      if (event.key === 'Escape' && isMobileSidebarOpen && isMobile) {
        handleMobileSidebarClose();
        return;
      }

      // Ctrl+B or Cmd+B to toggle sidebar
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        handleSidebarToggle();
        return;
      }

      // Ctrl+Shift+B or Cmd+Shift+B to toggle sidebar visibility
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'B') {
        event.preventDefault();
        handleSidebarVisibilityToggle();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileSidebarOpen, isMobile, handleMobileSidebarClose, handleSidebarToggle, handleSidebarVisibilityToggle]);

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

  // Set loaded state after mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Default quick actions
  const defaultQuickActions = [
    { icon: <ReceiptIcon />, label: 'Invoice', onClick: () => router.push('/invoices/new'), color: '#2196F3' },
    { icon: <ShoppingCartIcon />, label: 'Order', onClick: () => router.push('/orders/new'), color: '#4CAF50' },
    { icon: <StoreIcon />, label: 'Product', onClick: () => router.push('/products/new'), color: '#FF9800' },
    { icon: <CategoryIcon />, label: 'Category', onClick: () => router.push('/categories/new'), color: '#9C27B0' },
    { icon: <PeopleIcon />, label: 'Party', onClick: () => router.push('/parties/new'), color: '#F44336' },
  ];

  const quickActions = customQuickActions.length > 0 ? customQuickActions : defaultQuickActions;

  // Loading state
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <EnhancedLoadingScreen theme={theme} />
      </ThemeProvider>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          height: '100dvh',
          '@supports not (height: 100dvh)': {
            height: '100vh',
          },
          background: '#ffffff', // Always white background
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Particle background */}
        <ParticleBackground enabled={enableParticles} pageType={pageType} />

        {/* Animated background elements removed for clean design */}

        {/* Desktop Sidebar */}
        {!isMobile && (
          <Box
            sx={{
              flexShrink: 0,
              width: isSidebarHidden ? 0 : (isSidebarMini ? 72 : 280),
              transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'hidden',
              visibility: isSidebarHidden ? 'hidden' : 'visible',
            }}
          >
            <ModernSidebar
              isOpen={true}
              isMini={isSidebarMini}
              onToggle={handleSidebarToggle}
              onMobileClose={handleMobileSidebarClose}
              showSearch={!isSidebarMini}
              showUserProfile={!isSidebarMini}
              userAvatar={currentUser?.photoURL || undefined}
              userName={currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
              userRole={currentUser?.uid ? 'Admin' : 'User'}
              userEmail={currentUser?.email || undefined}
              onThemeToggle={handleThemeToggle}
              darkMode={isDarkMode}
            />
          </Box>
        )}

        {/* Mobile Sidebar Overlay — rendered outside flex layout */}
        {isMobile && (
          <ModernSidebar
            isOpen={isMobileSidebarOpen}
            isMini={false}
            onToggle={handleSidebarToggle}
            onMobileClose={handleMobileSidebarClose}
            showSearch={true}
            showUserProfile={true}
            userAvatar={currentUser?.photoURL || undefined}
            userName={currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
            userRole={currentUser?.uid ? 'Admin' : 'User'}
            userEmail={currentUser?.email || undefined}
            onThemeToggle={handleThemeToggle}
            darkMode={isDarkMode}
          />
        )}

        {/* Floating Sidebar Toggle Button (when sidebar is hidden) */}
        {!isMobile && isSidebarHidden && (
          <Box
            sx={{
              position: 'fixed',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: theme.zIndex.drawer + 1,
            }}
          >
            <IconButton
              onClick={handleShowSidebar}
              sx={{
                background: theme.palette.primary.main,
                color: 'white',
                width: 48,
                height: 48,
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                  background: theme.palette.primary.dark,
                },
              }}
              title="Show sidebar (Ctrl+B)"
            >
              <MenuIcon />
            </IconButton>
          </Box>
        )}

        {/* Main content area */}
        <Box
          component="main"
          sx={{ 
            flex: 1, 
            minWidth: 0, 
            display: 'flex', 
            flexDirection: 'column',
            width: isMobile ? '100%' : 'auto',
            position: 'relative',
          }}
        >
          {/* Header */}
          {showHeader && (
            <Box
              sx={{
                position: 'sticky',
                top: 0,
                zIndex: theme.zIndex.appBar,
                width: '100%',
              }}
            >
              <ConfiguredSimpleModernHeader
                title={title}
                onThemeToggle={handleThemeToggle}
                isDarkMode={isDarkMode}
                onMenuClick={handleSidebarToggle}
              />
            </Box>
          )}

          {/* Enhanced mobile create FAB - DISABLED: Using unified SpeedDial system */}
          {false && isMobile && (
            <Box sx={{ 
              position: 'fixed', 
              right: 16, 
              bottom: 16, 
              zIndex: theme.zIndex.fab,
              // Adjust position when mobile sidebar is open to avoid overlap
              transform: isMobileSidebarOpen ? 'translateX(-20px)' : 'translateX(0)',
              opacity: isMobileSidebarOpen ? 0.7 : 1,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.8 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <SpeedDial 
                  ariaLabel="Create" 
                  icon={<SpeedDialIcon openIcon={<AddIcon />} />}
                  // Close speed dial when mobile sidebar is opened
                  open={!isMobileSidebarOpen}
                  sx={{
                    '& .MuiSpeedDial-fab': {
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      width: 56,
                      height: 56,
                      boxShadow: theme.shadows[6],
                      '&:hover': {
                        background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                        boxShadow: theme.shadows[8],
                      },
                    },
                    '& .MuiSpeedDialAction-fab': {
                      boxShadow: theme.shadows[4],
                    },
                  }}
                >
                  {quickActions.map((action, index) => (
                    <SpeedDialAction
                      key={action.label}
                      icon={action.icon}
                      tooltipTitle={action.label}
                      onClick={action.onClick}
                      sx={{
                        '& .MuiSpeedDialAction-fab': {
                          backgroundColor: action.color || theme.palette.primary.main,
                          '&:hover': {
                            backgroundColor: action.color || theme.palette.primary.dark,
                            transform: 'scale(1.1)',
                          },
                        },
                      }}
                    />
                  ))}
                </SpeedDial>
              </motion.div>
            </Box>
          )}

          {/* Page content */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Box 
              component="section" 
              sx={{ 
                p: { 
                  xs: isMobile ? 2 : 3, 
                  sm: 3, 
                  md: 3, 
                  lg: 4 
                }, 
                flex: 1, 
                minHeight: 1,
                position: 'relative',
                overflow: 'auto',
                maxWidth: '100%',
                // Enhanced smooth scrolling
                scrollBehavior: 'smooth',
                // Optimize scrolling performance
                WebkitOverflowScrolling: 'touch', // iOS momentum scrolling
                overscrollBehavior: 'contain',
                // Simple scrollbar styling
                '&::-webkit-scrollbar': {
                  width: 6,
                  height: 6,
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#f1f1f1',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#c1c1c1',
                  borderRadius: 3,
                  '&:hover': {
                    backgroundColor: '#a8a8a8',
                  },
                },
                // Firefox scrollbar
                scrollbarWidth: 'thin',
                scrollbarColor: '#c1c1c1 #f1f1f1',
              }}
            >
              {children}
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
