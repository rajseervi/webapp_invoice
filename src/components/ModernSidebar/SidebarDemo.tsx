"use client";
import React, { useState } from 'react';
import { Box, IconButton, AppBar, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ModernSidebar from './ModernSidebar';

export default function SidebarDemo() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <ModernSidebar 
        isOpen={sidebarOpen}
        onToggle={handleToggleSidebar}
        onMobileClose={() => setSidebarOpen(false)}
        userName="John Doe"
        userRole="Administrator"
      />
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* App Bar */}
        <AppBar 
          position="static" 
          color="default" 
          elevation={0}
          sx={{ 
            borderBottom: `1px solid ${theme.palette.divider}`,
            zIndex: theme.zIndex.drawer - 1,
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleToggleSidebar}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Modern Sidebar Demo
            </Typography>
          </Toolbar>
        </AppBar>
        
        {/* Page content */}
        <Box
          sx={{
            flexGrow: 1,
            p: 3,
            overflow: 'auto',
            bgcolor: theme.palette.mode === 'dark' 
              ? theme.palette.background.default 
              : '#f5f5f5',
          }}
        >
          <Box
            sx={{
              bgcolor: theme.palette.background.paper,
              p: 4,
              borderRadius: 2,
              boxShadow: theme.shadows[1],
              mb: 4,
            }}
          >
            <Typography variant="h4" gutterBottom>
              Welcome to the Modern Sidebar Demo
            </Typography>
            <Typography variant="body1" paragraph>
              This is a demonstration of the modern, responsive sidebar component for Next.js.
              The sidebar is fully responsive and adapts to different screen sizes.
            </Typography>
            <Typography variant="body1" paragraph>
              Key features:
            </Typography>
            <ul>
              <li>Collapsible/expandable functionality</li>
              <li>Multi-level navigation menu</li>
              <li>User profile section</li>
              <li>Responsive design for mobile and desktop</li>
              <li>Smooth animations with Framer Motion</li>
              <li>Material UI integration</li>
              <li>Dark/light mode compatible</li>
            </ul>
          </Box>
          
          {/* Additional content for demonstration */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: 3,
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Box
                key={item}
                sx={{
                  bgcolor: theme.palette.background.paper,
                  p: 3,
                  borderRadius: 2,
                  boxShadow: theme.shadows[1],
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h6">Content Card {item}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}