import React from 'react';
import {
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  Assessment as AssessmentIcon,
  Add as AddIcon,
  Store as StoreIcon,
  Category as CategoryIcon,
  AccountBalance as AccountBalanceIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Payments as PaymentsIcon,
  LocalShipping as LocalShippingIcon,
  Business as BusinessIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';

export interface QuickAction {
  id: string;
  title: string;
  icon: React.ReactNode;
  path: string;
  color?: string;
  badge?: number;
  isNew?: boolean;
}

export interface HeaderConfiguration {
  title: string;
  showSearch: boolean;
  showQuickActions: boolean;
  showNotifications: boolean;
  customQuickActions?: QuickAction[];
  searchPlaceholder?: string;
}

// Common quick actions that can be reused
export const commonQuickActions = {
  dashboard: {
    id: 'dashboard',
    title: 'Dashboard',
    icon: React.createElement(DashboardIcon),
    path: '/dashboard',
    color: '#2196F3',
  },
  newInvoice: {
    id: 'new-invoice',
    title: 'New Invoice',
    icon: React.createElement(AddIcon),
    path: '/invoices/new',
    color: '#4CAF50',
    isNew: true,
  },
  newProduct: {
    id: 'new-product',
    title: 'New Product',
    icon: React.createElement(AddIcon),
    path: '/products/new',
    color: '#FF9800',
  },
  newParty: {
    id: 'new-party',
    title: 'New Party',
    icon: React.createElement(AddIcon),
    path: '/parties/new',
    color: '#9C27B0',
  },
  newOrder: {
    id: 'new-order',
    title: 'New Order',
    icon: React.createElement(AddIcon),
    path: '/orders/new',
    color: '#00BCD4',
  },
  products: {
    id: 'products',
    title: 'Products',
    icon: React.createElement(InventoryIcon),
    path: '/products',
    color: '#FF9800',
  },
  parties: {
    id: 'parties',
    title: 'Parties',
    icon: React.createElement(PeopleIcon),
    path: '/parties',
    color: '#9C27B0',
  },
  invoices: {
    id: 'invoices',
    title: 'Invoices',
    icon: React.createElement(ReceiptIcon),
    path: '/invoices',
    color: '#4CAF50',
  },
  orders: {
    id: 'orders',
    title: 'Orders',
    icon: React.createElement(ShoppingCartIcon),
    path: '/orders',
    color: '#00BCD4',
  },
  reports: {
    id: 'reports',
    title: 'Reports',
    icon: React.createElement(AssessmentIcon),
    path: '/reports',
    color: '#F44336',
  },
  inventory: {
    id: 'inventory',
    title: 'Inventory',
    icon: React.createElement(StoreIcon),
    path: '/inventory',
    color: '#795548',
  },
  settings: {
    id: 'settings',
    title: 'Settings',
    icon: React.createElement(SettingsIcon),
    path: '/settings',
    color: '#607D8B',
  },
};

// Page-specific header configurations
export const headerConfigurations: Record<string, HeaderConfiguration> = {
  // Dashboard
  dashboard: {
    title: 'Dashboard',
    showSearch: true,
    showQuickActions: true,
    showNotifications: true,
    searchPlaceholder: 'Search dashboard, quick stats...',
    customQuickActions: [
      commonQuickActions.newInvoice,
      commonQuickActions.newProduct,
      commonQuickActions.newParty,
      commonQuickActions.newOrder,
      commonQuickActions.reports,
    ],
  },

  // Admin Dashboard
  adminDashboard: {
    title: 'Admin Dashboard',
    showSearch: true,
    showQuickActions: true,
    showNotifications: true,
    searchPlaceholder: 'Search admin panel, users, settings...',
    customQuickActions: [
      {
        id: 'user-management',
        title: 'User Management',
        icon: React.createElement(PeopleIcon),
        path: '/admin/users',
        color: '#2196F3',
      },
      {
        id: 'system-settings',
        title: 'System Settings',
        icon: React.createElement(SettingsIcon),
        path: '/admin/settings',
        color: '#607D8B',
      },
      {
        id: 'analytics',
        title: 'Analytics',
        icon: React.createElement(AnalyticsIcon),
        path: '/admin/analytics',
        color: '#FF5722',
      },
      commonQuickActions.reports,
    ],
  },

  // Products
  products: {
    title: 'Product Management',
    showSearch: true,
    showQuickActions: true,
    showNotifications: true,
    searchPlaceholder: 'Search products, categories, SKU...',
    customQuickActions: [
      commonQuickActions.newProduct,
      {
        id: 'categories',
        title: 'Categories',
        icon: React.createElement(CategoryIcon),
        path: '/categories',
        color: '#673AB7',
      },
      {
        id: 'bulk-import',
        title: 'Bulk Import',
        icon: React.createElement(LocalShippingIcon),
        path: '/products/import',
        color: '#009688',
      },
      commonQuickActions.inventory,
      commonQuickActions.dashboard,
    ],
  },

  // Invoices
  invoices: {
    title: 'Invoice Management',
    showSearch: true,
    showQuickActions: true,
    showNotifications: true,
    searchPlaceholder: 'Search invoices, parties, amounts...',
    customQuickActions: [
      commonQuickActions.newInvoice,
      {
        id: 'gst-invoices',
        title: 'GST Invoices',
        icon: React.createElement(BusinessIcon),
        path: '/invoices/gst',
        color: '#3F51B5',
      },
      {
        id: 'regular-invoices',
        title: 'Regular Invoices',
        icon: React.createElement(ReceiptIcon),
        path: '/invoices/regular',
        color: '#4CAF50',
      },
      commonQuickActions.parties,
      commonQuickActions.dashboard,
    ],
  },

  // Parties
  parties: {
    title: 'Party Management',
    showSearch: true,
    showQuickActions: true,
    showNotifications: true,
    searchPlaceholder: 'Search parties, contacts, GST numbers...',
    customQuickActions: [
      commonQuickActions.newParty,
      {
        id: 'party-ledger',
        title: 'Party Ledger',
        icon: React.createElement(AccountBalanceIcon),
        path: '/ledger',
        color: '#795548',
      },
      commonQuickActions.invoices,
      commonQuickActions.orders,
      commonQuickActions.dashboard,
    ],
  },

  // Orders
  orders: {
    title: 'Order Management',
    showSearch: true,
    showQuickActions: true,
    showNotifications: true,
    searchPlaceholder: 'Search orders, order numbers, parties...',
    customQuickActions: [
      commonQuickActions.newOrder,
      {
        id: 'pending-orders',
        title: 'Pending Orders',
        icon: React.createElement(TimelineIcon),
        path: '/orders?status=pending',
        color: '#FF9800',
        badge: 5,
      },
      commonQuickActions.parties,
      commonQuickActions.products,
      commonQuickActions.dashboard,
    ],
  },

  // Reports
  reports: {
    title: 'Reports & Analytics',
    showSearch: true,
    showQuickActions: true,
    showNotifications: true,
    searchPlaceholder: 'Search reports, analytics, data...',
    customQuickActions: [
      {
        id: 'sales-report',
        title: 'Sales Report',
        icon: React.createElement(TrendingUpIcon),
        path: '/reports/sales',
        color: '#4CAF50',
      },
      {
        id: 'profit-loss',
        title: 'Profit & Loss',
        icon: React.createElement(AnalyticsIcon),
        path: '/reports/profit-loss',
        color: '#F44336',
      },
      {
        id: 'product-report',
        title: 'Product Report',
        icon: React.createElement(InventoryIcon),
        path: '/reports/products',
        color: '#FF9800',
      },
      commonQuickActions.dashboard,
    ],
  },

  // Inventory
  inventory: {
    title: 'Inventory Management',
    showSearch: true,
    showQuickActions: true,
    showNotifications: true,
    searchPlaceholder: 'Search inventory, stock levels, alerts...',
    customQuickActions: [
      {
        id: 'stock-alerts',
        title: 'Stock Alerts',
        icon: React.createElement(LocalShippingIcon),
        path: '/inventory/alerts',
        color: '#FF5722',
        badge: 3,
      },
      commonQuickActions.products,
      {
        id: 'purchases',
        title: 'Purchases',
        icon: React.createElement(ShoppingCartIcon),
        path: '/purchases',
        color: '#00BCD4',
      },
      commonQuickActions.dashboard,
    ],
  },

  // Purchases
  purchases: {
    title: 'Purchase Management',
    showSearch: true,
    showQuickActions: true,
    showNotifications: true,
    searchPlaceholder: 'Search purchases, suppliers, PO numbers...',
    customQuickActions: [
      {
        id: 'new-purchase',
        title: 'New Purchase',
        icon: React.createElement(AddIcon),
        path: '/purchases/new',
        color: '#00BCD4',
      },
      {
        id: 'suppliers',
        title: 'Suppliers',
        icon: React.createElement(BusinessIcon),
        path: '/purchases/suppliers',
        color: '#795548',
      },
      commonQuickActions.inventory,
      commonQuickActions.dashboard,
    ],
  },

  // Settings
  settings: {
    title: 'Settings',
    showSearch: true,
    showQuickActions: false,
    showNotifications: true,
    searchPlaceholder: 'Search settings, preferences...',
  },

  // Profile
  profile: {
    title: 'Profile',
    showSearch: false,
    showQuickActions: true,
    showNotifications: true,
    customQuickActions: [
      commonQuickActions.dashboard,
      commonQuickActions.settings,
    ],
  },

  // Help/Support
  help: {
    title: 'Help & Support',
    showSearch: true,
    showQuickActions: true,
    showNotifications: false,
    searchPlaceholder: 'Search help articles, FAQs...',
    customQuickActions: [
      {
        id: 'documentation',
        title: 'Documentation',
        icon: React.createElement(HelpIcon),
        path: '/help/docs',
        color: '#2196F3',
      },
      commonQuickActions.dashboard,
      commonQuickActions.settings,
    ],
  },

  // Default configuration
  default: {
    title: 'Dashboard',
    showSearch: true,
    showQuickActions: true,
    showNotifications: true,
    searchPlaceholder: 'Search...',
    customQuickActions: [
      commonQuickActions.dashboard,
      commonQuickActions.newInvoice,
      commonQuickActions.products,
      commonQuickActions.parties,
    ],
  },
};

// Helper function to get configuration by page type
export const getHeaderConfiguration = (pageType: string): HeaderConfiguration => {
  return headerConfigurations[pageType] || headerConfigurations.default;
};

// Helper function to get configuration by pathname
export const getHeaderConfigurationByPath = (pathname: string): HeaderConfiguration => {
  // Remove leading slash and get first segment
  const pathSegments = pathname.replace(/^\//, '').split('/');
  const firstSegment = pathSegments[0];
  
  // Handle admin routes
  if (firstSegment === 'admin') {
    return headerConfigurations.adminDashboard;
  }
  
  // Handle specific routes
  const routeMap: Record<string, string> = {
    '': 'dashboard',
    'dashboard': 'dashboard',
    'products': 'products',
    'invoices': 'invoices',
    'parties': 'parties',
    'orders': 'orders',
    'reports': 'reports',
    'inventory': 'inventory',
    'purchases': 'purchases',
    'settings': 'settings',
    'profile': 'profile',
    'help': 'help',
    'help-desk': 'help',
  };
  
  const configKey = routeMap[firstSegment] || 'default';
  return headerConfigurations[configKey];
};