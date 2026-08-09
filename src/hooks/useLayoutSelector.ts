'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export type LayoutType = 'none' | 'modern' | 'admin' | 'simple';

/**
 * Hook to determine which layout should be used based on the current route and user role
 */
export const useLayoutSelector = (): LayoutType => {
  const pathname = usePathname();
  const { currentUser, userRole } = useAuth();

  // Pages that should have no layout
  const noLayoutPages = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/pending-approval',
    '/account-inactive',
    '/unauthorized',
    '/' // Landing page
  ];

  // Admin pages
  const adminPages = ['/admin'];

  // Check if current page should have no layout
  if (noLayoutPages.includes(pathname) || pathname.startsWith('/api/')) {
    return 'none';
  }

  // Check if current page is admin
  if (adminPages.some(page => pathname.startsWith(page))) {
    return 'admin';
  }

  // Default to modern layout for authenticated users
  if (currentUser) {
    return 'modern';
  }

  // Default to no layout for unauthenticated users
  return 'none';
};

/**
 * Get layout configuration based on layout type
 */
export const getLayoutConfig = (layoutType: LayoutType) => {
  switch (layoutType) {
    case 'none':
      return {
        showSidebar: false,
        showHeader: false,
        showFooter: false,
      };
    case 'modern':
      return {
        showSidebar: true,
        showHeader: true,
        showFooter: false,
      };
    case 'admin':
      return {
        showSidebar: true,
        showHeader: true,
        showFooter: false,
        adminMode: true,
      };
    case 'simple':
      return {
        showSidebar: false,
        showHeader: true,
        showFooter: true,
      };
    default:
      return {
        showSidebar: false,
        showHeader: false,
        showFooter: false,
      };
  }
};