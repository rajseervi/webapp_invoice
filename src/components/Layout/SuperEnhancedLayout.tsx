'use client';

import React, { useState, ReactNode } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import SuperEnhancedHeader from '@/components/Header/SuperEnhancedHeader';
import { HeaderProvider } from '@/contexts/HeaderContext';

interface SuperEnhancedLayoutProps {
  children: ReactNode;
  title?: string;
  showSearch?: boolean;
  showQuickActions?: boolean;
  showPartyQuickAccess?: boolean;
  enableAdvancedSearch?: boolean;
  enableShortcuts?: boolean;
}

export default function SuperEnhancedLayout({
  children,
  title,
  showSearch = true,
  showQuickActions = true,
  showPartyQuickAccess = true,
  enableAdvancedSearch = true,
  enableShortcuts = true,
}: SuperEnhancedLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Layout state
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(!isMobile);

  const handleDrawerToggle = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
    // You can integrate with your theme provider here
  };

  return (
    <HeaderProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* Enhanced Header */}
        <SuperEnhancedHeader
          onDrawerToggle={handleDrawerToggle}
          isDrawerOpen={isDrawerOpen}
          onThemeToggle={handleThemeToggle}
          isDarkMode={isDarkMode}
          title={title}
          showSearch={showSearch}
          showQuickActions={showQuickActions}
          showPartyQuickAccess={showPartyQuickAccess}
          enableAdvancedSearch={enableAdvancedSearch}
          enableShortcuts={enableShortcuts}
        />

        {/* Sidebar/Drawer (if you have one) */}
        {/* You can add your existing sidebar component here */}

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            pt: { xs: 7, sm: 8 }, // Account for header height
            pl: { md: isDrawerOpen ? '280px' : '72px' }, // Account for drawer width
            transition: theme.transitions.create(['margin', 'padding'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          {children}
        </Box>
      </Box>
    </HeaderProvider>
  );
}

// Example usage component
export function ExamplePage() {
  return (
    <SuperEnhancedLayout 
      title="Dashboard"
      showSearch={true}
      showQuickActions={true}
      showPartyQuickAccess={true}
    >
      <Box sx={{ p: 3 }}>
        <h1>Your Page Content Here</h1>
        <p>The enhanced header is now active with all features enabled.</p>
        
        {/* Try these features: */}
        <ul>
          <li>Press Ctrl+K to open search</li>
          <li>Click on "Parties" to see quick access</li>
          <li>Click on "Quick Actions" for shortcuts</li>
          <li>Check notifications bell for alerts</li>
          <li>Use the profile menu for settings</li>
        </ul>
      </Box>
    </SuperEnhancedLayout>
  );
}