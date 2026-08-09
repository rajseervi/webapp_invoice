/**
 * Layout Migration Utility
 * 
 * This utility helps migrate pages from old layouts to the new VisuallyEnhancedDashboardLayout
 */

export interface PageConfig {
  pageType: string;
  title: string;
  enableVisualEffects?: boolean;
  enableParticles?: boolean;
  customQuickActions?: Array<{
    id: string;
    title: string;
    icon: React.ReactNode;
    path: string;
    color: string;
    isNew?: boolean;
    badge?: number;
  }>;
}

export const pageConfigurations: Record<string, PageConfig> = {
  // Dashboard
  '/dashboard': {
    pageType: 'dashboard',
    title: 'Dashboard',
    enableVisualEffects: true,
    enableParticles: false,
  },
  
  // Products
  '/products': {
    pageType: 'products',
    title: 'Products',
    enableVisualEffects: true,
    enableParticles: false,
  },
  '/products/new': {
    pageType: 'products',
    title: 'New Product',
    enableVisualEffects: true,
  },
  '/products/management': {
    pageType: 'products',
    title: 'Product Management',
    enableVisualEffects: true,
  },
  '/products/import': {
    pageType: 'products',
    title: 'Import Products',
    enableVisualEffects: true,
  },
  
  // Invoices
  '/invoices': {
    pageType: 'invoices',
    title: 'Invoices',
    enableVisualEffects: true,
    enableParticles: false,
  },
  '/invoices/new': {
    pageType: 'invoices',
    title: 'New Invoice',
    enableVisualEffects: true,
  },
  '/invoices/gst': {
    pageType: 'invoices',
    title: 'GST Invoices',
    enableVisualEffects: true,
  },
  '/invoices/regular': {
    pageType: 'invoices',
    title: 'Regular Invoices',
    enableVisualEffects: true,
  },
  
  // Parties
  '/parties': {
    pageType: 'parties',
    title: 'Parties',
    enableVisualEffects: true,
    enableParticles: false,
  },
  '/parties/new': {
    pageType: 'parties',
    title: 'New Party',
    enableVisualEffects: true,
  },
  
  // Orders
  '/orders': {
    pageType: 'orders',
    title: 'Orders',
    enableVisualEffects: true,
    enableParticles: false,
  },
  '/orders/new': {
    pageType: 'orders',
    title: 'New Order',
    enableVisualEffects: true,
  },
  
  // Reports
  '/reports': {
    pageType: 'reports',
    title: 'Reports',
    enableVisualEffects: true,
    enableParticles: false,
  },
  '/reports/sales': {
    pageType: 'reports',
    title: 'Sales Reports',
    enableVisualEffects: true,
  },
  '/reports/profit-loss': {
    pageType: 'reports',
    title: 'Profit & Loss',
    enableVisualEffects: true,
  },
  '/reports/products': {
    pageType: 'reports',
    title: 'Product Reports',
    enableVisualEffects: true,
  },
  
  // Purchases
  '/purchases': {
    pageType: 'orders',
    title: 'Purchases',
    enableVisualEffects: true,
  },
  '/purchases/new': {
    pageType: 'orders',
    title: 'New Purchase',
    enableVisualEffects: true,
  },
  
  // Categories
  '/categories': {
    pageType: 'products',
    title: 'Categories',
    enableVisualEffects: true,
  },
  
  // Settings
  '/settings': {
    pageType: 'dashboard',
    title: 'Settings',
    enableVisualEffects: true,
  },
  
  // Profile
  '/profile': {
    pageType: 'dashboard',
    title: 'Profile',
    enableVisualEffects: true,
  },
  
  // Admin
  '/admin/dashboard': {
    pageType: 'dashboard',
    title: 'Admin Dashboard',
    enableVisualEffects: true,
    enableParticles: true,
  },
  
  // Inventory
  '/inventory': {
    pageType: 'products',
    title: 'Inventory',
    enableVisualEffects: true,
  },
  
  // Stock Management
  '/stock-management': {
    pageType: 'products',
    title: 'Stock Management',
    enableVisualEffects: true,
  },
  
  // Ledger
  '/ledger': {
    pageType: 'reports',
    title: 'Ledger',
    enableVisualEffects: true,
  },
  
  // Accounting
  '/accounting': {
    pageType: 'reports',
    title: 'Accounting',
    enableVisualEffects: true,
  },
  
  // Help Desk
  '/help-desk': {
    pageType: 'dashboard',
    title: 'Help Desk',
    enableVisualEffects: true,
  },
  
  // Quick Links
  '/quick-links': {
    pageType: 'dashboard',
    title: 'Quick Links',
    enableVisualEffects: true,
  },
  
  // Pending Approval
  '/pending-approval': {
    pageType: 'dashboard',
    title: 'Pending Approvals',
    enableVisualEffects: true,
  },
};

/**
 * Get page configuration based on pathname
 */
export function getPageConfig(pathname: string): PageConfig {
  // Try exact match first
  if (pageConfigurations[pathname]) {
    return pageConfigurations[pathname];
  }
  
  // Try to find the best match for dynamic routes
  const segments = pathname.split('/');
  
  // For routes like /products/edit/123, try /products
  if (segments.length > 2) {
    const baseRoute = `/${segments[1]}`;
    if (pageConfigurations[baseRoute]) {
      return {
        ...pageConfigurations[baseRoute],
        title: `${pageConfigurations[baseRoute].title} - ${segments[2]}`,
      };
    }
  }
  
  // Default configuration
  return {
    pageType: 'dashboard',
    title: 'Page',
    enableVisualEffects: true,
    enableParticles: false,
  };
}

/**
 * Generate import statement for the new layout
 */
export function generateLayoutImport(): string {
  return `import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';`;
}

/**
 * Generate layout wrapper JSX
 */
export function generateLayoutWrapper(pathname: string, children: string): string {
  const config = getPageConfig(pathname);
  
  return `<VisuallyEnhancedDashboardLayout
  pageType="${config.pageType}"
  title="${config.title}"
  enableVisualEffects={${config.enableVisualEffects}}
  enableParticles={${config.enableParticles || false}}
>
  ${children}
</VisuallyEnhancedDashboardLayout>`;
}

/**
 * List of old layout imports to replace
 */
export const oldLayoutImports = [
  'ModernDashboardLayout',
  'EnhancedModernDashboardLayout',
  'ImprovedDashboardLayout',
  'ModernLayout',
];

/**
 * Migration instructions for common patterns
 */
export const migrationPatterns = {
  // Old pattern -> New pattern
  'ModernDashboardLayout': 'VisuallyEnhancedDashboardLayout',
  'EnhancedModernDashboardLayout': 'VisuallyEnhancedDashboardLayout',
  'ImprovedDashboardLayout': 'VisuallyEnhancedDashboardLayout',
  'ModernLayout': 'VisuallyEnhancedDashboardLayout',
};

export default {
  pageConfigurations,
  getPageConfig,
  generateLayoutImport,
  generateLayoutWrapper,
  oldLayoutImports,
  migrationPatterns,
};