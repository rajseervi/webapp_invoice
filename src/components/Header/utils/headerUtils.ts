import { SearchResult, QuickAction } from '../EnhancedHeader';

/**
 * Utility functions for the Enhanced Header component
 */

/**
 * Generates page title from pathname
 */
export const generatePageTitle = (pathname: string): string => {
  if (!pathname || pathname === '/') return 'Dashboard';
  
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return 'Dashboard';
  
  const lastSegment = segments[segments.length - 1];
  
  // Handle special cases
  const specialCases: Record<string, string> = {
    'new': 'New',
    'edit': 'Edit',
    'view': 'View',
    'settings': 'Settings',
    'profile': 'Profile',
    'dashboard': 'Dashboard',
    'invoices': 'Invoices',
    'products': 'Products',
    'parties': 'Parties',
    'orders': 'Orders',
    'reports': 'Reports',
    'inventory': 'Inventory',
    'purchases': 'Purchases',
    'categories': 'Categories',
    'suppliers': 'Suppliers',
    'customers': 'Customers',
  };
  
  if (specialCases[lastSegment]) {
    return specialCases[lastSegment];
  }
  
  // Convert kebab-case to Title Case
  return lastSegment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Filters search results based on query and type
 */
export const filterSearchResults = (
  results: SearchResult[],
  query: string,
  maxResults: number = 8
): SearchResult[] => {
  if (!query.trim()) return [];
  
  const lowerQuery = query.toLowerCase();
  
  // Score results based on relevance
  const scoredResults = results.map(result => {
    let score = 0;
    
    // Exact title match gets highest score
    if (result.title.toLowerCase() === lowerQuery) {
      score += 100;
    }
    // Title starts with query
    else if (result.title.toLowerCase().startsWith(lowerQuery)) {
      score += 50;
    }
    // Title contains query
    else if (result.title.toLowerCase().includes(lowerQuery)) {
      score += 25;
    }
    
    // Subtitle matches
    if (result.subtitle?.toLowerCase().includes(lowerQuery)) {
      score += 10;
    }
    
    // Badge matches
    if (result.badge?.toLowerCase().includes(lowerQuery)) {
      score += 5;
    }
    
    return { ...result, score };
  });
  
  // Sort by score and return top results
  return scoredResults
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
};

/**
 * Debounce function for search input
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Get user initials from name or email
 */
export const getUserInitials = (user: { displayName?: string | null; email?: string | null }): string => {
  if (user.displayName) {
    const names = user.displayName.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
    }
    return user.displayName.charAt(0).toUpperCase();
  }
  
  if (user.email) {
    return user.email.charAt(0).toUpperCase();
  }
  
  return 'U';
};

/**
 * Format notification count for display
 */
export const formatNotificationCount = (count: number): string | number => {
  if (count === 0) return '';
  if (count <= 99) return count;
  return '99+';
};

/**
 * Get quick action color with fallback
 */
export const getQuickActionColor = (action: QuickAction, theme: any): string => {
  if (action.color) return action.color;
  
  // Default colors based on action type
  const colorMap: Record<string, string> = {
    'dashboard': theme.palette.primary.main,
    'invoice': theme.palette.success.main,
    'product': theme.palette.info.main,
    'party': theme.palette.secondary.main,
    'order': theme.palette.warning.main,
    'report': theme.palette.error.main,
  };
  
  const actionType = action.id.split('-')[0];
  return colorMap[actionType] || theme.palette.primary.main;
};

/**
 * Check if device is mobile based on user agent
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Check if device supports touch
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Get appropriate search placeholder based on context
 */
export const getSearchPlaceholder = (pathname: string): string => {
  const basePlaceholder = 'Search parties, products, invoices...';
  
  const contextualPlaceholders: Record<string, string> = {
    '/parties': 'Search parties by name, email, or phone...',
    '/products': 'Search products by name, code, or category...',
    '/invoices': 'Search invoices by number or party...',
    '/orders': 'Search orders by number or party...',
    '/reports': 'Search reports and analytics...',
  };
  
  return contextualPlaceholders[pathname] || basePlaceholder;
};

/**
 * Validate search query
 */
export const isValidSearchQuery = (query: string): boolean => {
  if (!query || typeof query !== 'string') return false;
  
  const trimmed = query.trim();
  
  // Minimum length check
  if (trimmed.length < 1) return false;
  
  // Maximum length check
  if (trimmed.length > 100) return false;
  
  // Basic sanitization - no special characters that could cause issues
  const invalidChars = /[<>{}[\]\\]/;
  if (invalidChars.test(trimmed)) return false;
  
  return true;
};

/**
 * Generate breadcrumbs from pathname
 */
export const generateBreadcrumbs = (pathname: string): Array<{ label: string; path: string }> => {
  if (!pathname || pathname === '/') {
    return [{ label: 'Dashboard', path: '/' }];
  }
  
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ label: 'Dashboard', path: '/' }];
  
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Skip ID segments (typically UUIDs or numeric IDs)
    if (segment.match(/^[a-f0-9-]{36}$/) || segment.match(/^\d+$/)) {
      return;
    }
    
    const label = generatePageTitle(`/${segment}`);
    breadcrumbs.push({ label, path: currentPath });
  });
  
  return breadcrumbs;
};

/**
 * Get theme-appropriate colors
 */
export const getThemeColors = (isDarkMode: boolean) => {
  return {
    background: isDarkMode ? 'rgba(18, 18, 18, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    text: isDarkMode ? '#ffffff' : '#000000',
    border: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    hover: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
  };
};

/**
 * Performance monitoring utilities
 */
export const performanceUtils = {
  /**
   * Measure search performance
   */
  measureSearchTime: (startTime: number): number => {
    return performance.now() - startTime;
  },
  
  /**
   * Log performance metrics
   */
  logPerformance: (operation: string, duration: number): void => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Header Performance] ${operation}: ${duration.toFixed(2)}ms`);
    }
  },
  
  /**
   * Check if performance API is available
   */
  isPerformanceAvailable: (): boolean => {
    return typeof performance !== 'undefined' && 'now' in performance;
  },
};

/**
 * Accessibility utilities
 */
export const a11yUtils = {
  /**
   * Generate ARIA label for search results
   */
  getSearchResultAriaLabel: (result: SearchResult): string => {
    return `${result.title}, ${result.type}${result.subtitle ? `, ${result.subtitle}` : ''}`;
  },
  
  /**
   * Generate ARIA label for quick actions
   */
  getQuickActionAriaLabel: (action: QuickAction): string => {
    return `${action.title}${action.badge ? `, ${action.badge} notifications` : ''}`;
  },
  
  /**
   * Check if reduced motion is preferred
   */
  prefersReducedMotion: (): boolean => {
    if (typeof window === 'undefined') return false;
    
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
};

export default {
  generatePageTitle,
  filterSearchResults,
  debounce,
  getUserInitials,
  formatNotificationCount,
  getQuickActionColor,
  isMobileDevice,
  isTouchDevice,
  getSearchPlaceholder,
  isValidSearchQuery,
  generateBreadcrumbs,
  getThemeColors,
  performanceUtils,
  a11yUtils,
};