'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  CssBaseline,
  useMediaQuery,
  Fab,
  Zoom,
  Backdrop,
} from '@mui/material';
import {
  KeyboardArrowUp as KeyboardArrowUpIcon,
} from '@mui/icons-material';

import { EnhancedHeader } from '../Header';

interface EnhancedLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBreadcrumbs?: boolean;
  showBackToTop?: boolean;
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
  showSidebar?: boolean;
  sidebarComponent?: React.ReactNode;
}

export default function EnhancedLayout({
  children,
  title,
  showBreadcrumbs = true,
  showBackToTop = true,
  onThemeToggle,
  isDarkMode = false,
  showSidebar = false,
  sidebarComponent,
}: EnhancedLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State
  const [drawerOpen, setDrawerOpen] = useState(!isMobile && showSidebar);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Handle scroll to top
  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Monitor scroll position for back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close drawer on mobile when route changes
  useEffect(() => {
    if (isMobile && showSidebar) {
      setDrawerOpen(false);
    }
  }, [isMobile, showSidebar]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Enhanced Header */}
      <EnhancedHeader
        onDrawerToggle={showSidebar ? handleDrawerToggle : undefined}
        isDrawerOpen={drawerOpen}
        onThemeToggle={onThemeToggle}
        isDarkMode={isDarkMode}
        title={title}
        showSearch={true}
        showQuickActions={true}
      />

      {/* Sidebar (if provided) */}
      {showSidebar && sidebarComponent}

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: showSidebar && !isMobile ? { 
            md: drawerOpen ? `calc(100% - 280px)` : `calc(100% - 72px)` 
          } : '100%',
          ml: showSidebar && !isMobile ? { 
            md: drawerOpen ? '280px' : '72px' 
          } : 0,
          mt: { xs: '56px', sm: '64px' },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          backgroundColor: theme.palette.background.default,
          minHeight: 'calc(100vh - 64px)',
          position: 'relative',
        }}
      >
        {/* Content wrapper with padding */}
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            maxWidth: '100%',
            mx: 'auto',
          }}
        >
          {children}
        </Box>

        {/* Back to top button */}
        {showBackToTop && (
          <Zoom in={showScrollTop}>
            <Fab
              color="primary"
              size="small"
              aria-label="scroll back to top"
              onClick={handleScrollToTop}
              sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: theme.zIndex.speedDial,
                boxShadow: `0 4px 20px ${theme.palette.primary.main}40`,
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: `0 6px 24px ${theme.palette.primary.main}60`,
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <KeyboardArrowUpIcon />
            </Fab>
          </Zoom>
        )}
      </Box>

      {/* Mobile backdrop */}
      {isMobile && showSidebar && (
        <Backdrop
          open={drawerOpen}
          onClick={() => setDrawerOpen(false)}
          sx={{
            zIndex: theme.zIndex.drawer - 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        />
      )}
    </Box>
  );
}