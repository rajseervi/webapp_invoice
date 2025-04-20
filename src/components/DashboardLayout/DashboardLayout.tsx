"use client";
import React, { useState, ReactNode, useEffect } from 'react';
import { 
  Box, 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Drawer, 
  useMediaQuery,
  useTheme,
  Tooltip,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { alpha } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import Navigation from './FixedNavigation';

// Constants
const DRAWER_WIDTH = 260;
const APPBAR_HEIGHT = 64;

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, userRole } = useAuth();
  
  // Use strict breakpoint to ensure proper detection of mobile devices
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), {
    defaultMatches: false,
    noSsr: true,
  });
  
  // Simple drawer state - just open or closed
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  
  // Save drawer state to localStorage
  const saveDrawerState = (isOpen: boolean) => {
    try {
      localStorage.setItem('drawerState', JSON.stringify({ open: isOpen }));
    } catch (e) {
      console.error('Failed to save drawer state:', e);
    }
  };
  
  // Toggle drawer open/closed
  const toggleDrawer = () => {
    const newState = !drawerOpen;
    setDrawerOpen(newState);
    saveDrawerState(newState);
  };
  
  // Close drawer (for both mobile and desktop)
  const closeDrawer = () => {
    setDrawerOpen(false);
    saveDrawerState(false);
  };
  
  // Handle navigation item click - always close drawer
  const handleNavItemClick = () => {
    // Always close drawer after navigation
    closeDrawer();
  };
  
  // Listen for route changes to close drawer
  useEffect(() => {
    // Close drawer on route change
    const handleRouteChange = () => {
      closeDrawer();
    };
    
    // Add event listener for route changes
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
  
  // Load saved drawer state on initial render
  useEffect(() => {
    const savedDrawerState = localStorage.getItem('drawerState');
    
    if (savedDrawerState) {
      try {
        const state = JSON.parse(savedDrawerState);
        // On mobile, always start with closed drawer regardless of saved state
        if (isMobile) {
          closeDrawer();
        } else {
          // On desktop, respect saved state
          setDrawerOpen(state.open);
        }
      } catch (e) {
        // If parsing fails, set default state
        setDrawerOpen(!isMobile);
        saveDrawerState(!isMobile);
      }
    } else {
      // Default state if nothing is saved
      setDrawerOpen(!isMobile);
      saveDrawerState(!isMobile);
    }
  }, [isMobile]);
  
  // Handle window resize events
  useEffect(() => {
    const handleResize = () => {
      // Close drawer on mobile
      if (window.innerWidth < theme.breakpoints.values.md) {
        closeDrawer();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [theme.breakpoints.values.md]);

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          backdropFilter: 'blur(10px)',
          bgcolor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.background.paper, 0.75) 
            : alpha(theme.palette.primary.main, 0.97),
          borderBottom: '1px solid',
          borderColor: theme.palette.mode === 'dark'
            ? alpha(theme.palette.divider, 0.6)
            : alpha(theme.palette.primary.dark, 0.15),
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0,0,0,0.15)'
            : '0 4px 20px rgba(0,0,0,0.08)',
          height: APPBAR_HEIGHT,
        }}
      >
        <Toolbar sx={{ 
          minHeight: APPBAR_HEIGHT, 
          px: { xs: 1.5, sm: 2 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Toggle sidebar" arrow>
              <IconButton
                color="inherit"
                aria-label="toggle drawer"
                onClick={toggleDrawer}
                edge="start"
                size="medium"
                sx={{
                  mr: 1.5,
                  bgcolor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.background.paper, 0.15) 
                    : alpha(theme.palette.common.white, 0.15),
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.background.paper, 0.25) 
                      : alpha(theme.palette.common.white, 0.25),
                  },
                }}
              >
                <MenuIcon />
              </IconButton>
            </Tooltip>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                fontWeight: 600,
                letterSpacing: '0.5px',
                color: theme.palette.common.white,
              }}
            >
              Dashboard
            </Typography>
          </Box>
          
          {/* Right side of AppBar - intentionally left empty */}
          <Box></Box>
        </Toolbar>
      </AppBar>
      
      {/* Drawer */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={drawerOpen}
        onClose={closeDrawer}
        ModalProps={{
          keepMounted: true, // Better mobile performance for temporary drawer
        }}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 11,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
            boxShadow: isMobile ? '0 8px 10px -5px rgba(0,0,0,0.2)' : 'none',
            bgcolor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.background.paper, 0.9) 
              : alpha(theme.palette.background.paper, 0.98),
            top: isMobile ? 0 : APPBAR_HEIGHT,
            height: isMobile ? '100%' : `calc(100% - ${APPBAR_HEIGHT}px)`,
          },
        }}
      >
        {/* Drawer Header - only for mobile */}
        {isMobile && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: theme.spacing(0, 2),
            height: APPBAR_HEIGHT,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Menu</Typography>
            <IconButton onClick={closeDrawer} edge="end">
              <CloseIcon />
            </IconButton>
          </Box>
        )}
        
        {/* Navigation */}
        <Box sx={{ 
          overflow: 'auto',
          height: isMobile ? `calc(100% - ${APPBAR_HEIGHT}px)` : '100%',
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: alpha(theme.palette.divider, 0.3),
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: alpha(theme.palette.divider, 0.5),
          },
        }}>
          <Navigation 
            onItemClick={handleNavItemClick}
            miniDrawer={false}
          />
        </Box>
      </Drawer>
      
      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          pt: `${APPBAR_HEIGHT}px`,
          height: '100vh',
          overflow: 'auto',
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: '-220px',
          ...(drawerOpen && !isMobile && {
            transition: theme.transitions.create('margin', {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
            marginLeft: `${DRAWER_WIDTH}px`,
          }),
          bgcolor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.background.default, 0.97) 
            : '#f8f9fa',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark'
              ? alpha(theme.palette.primary.dark, 0.3)
              : alpha(theme.palette.primary.main, 0.2),
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: theme.palette.mode === 'dark'
              ? alpha(theme.palette.primary.dark, 0.5)
              : alpha(theme.palette.primary.main, 0.3),
          },
        }}
      >
        {/* Content container */}
        <Box 
          sx={{ 
            maxWidth: '1600px', 
            width: '100%',
            mx: '0',
            px: { xs: 1.5, sm: 2, md: 3 },
            // py: { xs: 2, sm: 3 },
            display: 'flex',
            flexDirection: 'column',
            minHeight: `calc(100% - ${APPBAR_HEIGHT}px)`,
          }}
        >
          {/* Content */}
          <Box
            sx={{
              flexGrow: 1,
              width: '100%',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}