'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme, alpha } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import InteractiveSidebar from './InteractiveSidebar';
import InteractiveHeader from './InteractiveHeader';
import CommandPalette from './CommandPalette';
import type { AppNotification } from './types';
import { navSections } from './navConfig';
import { useAuth } from '@/contexts/AuthContext';

export interface InteractiveShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const shellTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563eb' },
    secondary: { main: '#dc004e' },
    background: { default: '#f6f8fb', paper: '#ffffff' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: { styleOverrides: { root: { boxShadow: 'none' } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
});

// Seed notifications shown until real ones arrive via props/events
const seedNotifications: AppNotification[] = [
  {
    id: 'seed-1',
    title: 'Payment received',
    message: '₹50,000 confirmed for invoice #1042',
    minutesAgo: 25,
    read: false,
    tone: 'success',
  },
  {
    id: 'seed-2',
    title: 'Low stock warning',
    message: '2 products have fallen below the reorder level',
    minutesAgo: 90,
    read: false,
    tone: 'warning',
  },
  {
    id: 'seed-3',
    title: 'Weekly report ready',
    message: 'Your sales summary is available in Reports',
    minutesAgo: 300,
    read: true,
    tone: 'info',
  },
];

export default function InteractiveShell({ title, subtitle, children }: InteractiveShellProps) {
  const router = useRouter();
  const { currentUser, userRole, loading } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(seedNotifications);

  // Persist collapse preference
  useEffect(() => {
    const saved = localStorage.getItem('shell-sidebar-collapsed');
    if (saved === 'true') setCollapsed(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      localStorage.setItem('shell-sidebar-collapsed', String(!prev));
      return !prev;
    });
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [title]);

  // Auth guard
  useEffect(() => {
    if (!loading && !currentUser) router.push('/login');
  }, [currentUser, loading, router]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const userName = useMemo(
    () => currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User',
    [currentUser],
  );
  const roleLabel = userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'User';

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              border: `3px solid ${alpha('#2563eb', 0.15)}`,
              borderTopColor: '#2563eb',
              borderRadius: '50%',
              mx: 'auto',
              animation: 'spin 0.9s linear infinite',
              '@keyframes spin': { to: { transform: 'rotate(360deg)' } },
            }}
          />
        </Box>
      </Box>
    );
  }

  if (!currentUser) return null;

  return (
    <ThemeProvider theme={shellTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100dvh', overflow: 'hidden', bgcolor: 'background.default' }}>
        <InteractiveSidebar
          sections={navSections}
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          isMobile={isMobile}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          userName={userName}
          userRole={roleLabel}
        />

        <Box component="main" sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <InteractiveHeader
            title={title}
            subtitle={subtitle}
            isMobile={isMobile}
            onMenuClick={() => setMobileOpen(true)}
            notifications={notifications}
            onMarkAllRead={markAllRead}
            userName={userName}
            userRole={roleLabel}
          />

          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              px: { xs: 1.75, sm: 2.5, md: 3 },
              py: { xs: 2, md: 2.5 },
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {children}
          </Box>
        </Box>

        {/* Global command palette (Ctrl+K / header search) */}
        <CommandPalette />
      </Box>
    </ThemeProvider>
  );
}
