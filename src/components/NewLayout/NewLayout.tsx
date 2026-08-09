'use client';

import React, { useState } from 'react';
import {
  Box,
  CssBaseline,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';

interface NewLayoutProps {
  children: React.ReactNode;
}

export default function NewLayout({ children }: NewLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isDrawerOpen, setIsDrawerOpen] = useState(!isMobile);

  const handleDrawerToggle = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Header onDrawerToggle={handleDrawerToggle} isDrawerOpen={isDrawerOpen} />
      <Sidebar open={isDrawerOpen} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${isDrawerOpen ? 280 : 72}px)` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          marginTop: '64px',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}