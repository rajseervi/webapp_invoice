// Admin-specific theme configuration
export const adminThemeConfig = {
  primaryColor: '#1976D2', // Professional blue
  secondaryColor: '#DC004E', // Accent red
  borderRadius: 12,
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  
  // Admin-specific color palette
  colors: {
    success: '#2E7D32', // Dark green for success states
    warning: '#F57C00', // Orange for warnings
    error: '#D32F2F',   // Red for errors
    info: '#1976D2',    // Blue for info
    
    // Dashboard specific colors
    sales: '#4CAF50',     // Green for sales metrics
    invoices: '#2196F3',  // Blue for invoices
    pending: '#FF9800',   // Orange for pending items
    parties: '#9C27B0',   // Purple for parties
  },
  
  // Admin dashboard specific settings
  dashboard: {
    cardElevation: 2,
    chartHeight: 400,
    tableRowHeight: 56,
    sidebarWidth: 280,
    sidebarMiniWidth: 64,
    headerHeight: 80,
  },
  
  // Animation settings
  animations: {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    hover: {
      scale: 1.02,
      shadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    },
  },
  
  // Responsive breakpoints
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1200,
  },
};

// Admin quick actions configuration
export const adminQuickActionsConfig = [
  {
    id: 'admin-dashboard',
    title: 'Dashboard',
    description: 'View admin dashboard',
    path: '/admin/dashboard',
    color: '#1976D2',
    category: 'navigation',
  },
  {
    id: 'create-invoice',
    title: 'New Invoice',
    description: 'Create a new invoice',
    path: '/invoices/new',
    color: '#4CAF50',
    isNew: true,
    category: 'create',
  },
  {
    id: 'manage-products',
    title: 'Products',
    description: 'Manage product inventory',
    path: '/products',
    color: '#FF9800',
    badge: 'inventory',
    category: 'manage',
  },
  {
    id: 'manage-parties',
    title: 'Parties',
    description: 'Manage customers and suppliers',
    path: '/parties',
    color: '#9C27B0',
    category: 'manage',
  },
  {
    id: 'view-invoices',
    title: 'Invoices',
    description: 'View all invoices',
    path: '/invoices',
    color: '#2196F3',
    category: 'view',
  },
  {
    id: 'view-reports',
    title: 'Reports',
    description: 'View analytics and reports',
    path: '/reports',
    color: '#F44336',
    category: 'analytics',
  },
  {
    id: 'manage-orders',
    title: 'Orders',
    description: 'Manage customer orders',
    path: '/orders',
    color: '#00BCD4',
    category: 'manage',
  },
  {
    id: 'inventory-management',
    title: 'Inventory',
    description: 'Manage stock levels',
    path: '/inventory',
    color: '#795548',
    category: 'manage',
  },
];

// Admin notification settings
export const adminNotificationConfig = {
  types: {
    invoice: {
      color: '#2196F3',
      priority: 'medium',
    },
    payment: {
      color: '#4CAF50',
      priority: 'high',
    },
    stock: {
      color: '#FF9800',
      priority: 'medium',
    },
    order: {
      color: '#9C27B0',
      priority: 'low',
    },
    system: {
      color: '#F44336',
      priority: 'high',
    },
  },
  
  // Default notification count for demo
  defaultCount: 5,
  
  // Auto-refresh interval (in milliseconds)
  refreshInterval: 30000, // 30 seconds
};

// Admin search configuration
export const adminSearchConfig = {
  categories: [
    {
      id: 'parties',
      title: 'Parties',
      placeholder: 'Search parties by name, email, or phone...',
      endpoint: '/api/parties/search',
      icon: 'people',
      color: '#9C27B0',
    },
    {
      id: 'products',
      title: 'Products',
      placeholder: 'Search products by name, code, or category...',
      endpoint: '/api/products/search',
      icon: 'inventory',
      color: '#FF9800',
    },
    {
      id: 'invoices',
      title: 'Invoices',
      placeholder: 'Search invoices by number or party...',
      endpoint: '/api/invoices/search',
      icon: 'receipt',
      color: '#2196F3',
    },
    {
      id: 'orders',
      title: 'Orders',
      placeholder: 'Search orders by number or party...',
      endpoint: '/api/orders/search',
      icon: 'shopping_cart',
      color: '#00BCD4',
    },
    {
      id: 'pages',
      title: 'Pages',
      placeholder: 'Navigate to pages...',
      icon: 'pages',
      color: '#607D8B',
    },
  ],
  
  // Search settings
  debounceDelay: 300,
  maxResults: 8,
  minQueryLength: 2,
};

export default {
  theme: adminThemeConfig,
  quickActions: adminQuickActionsConfig,
  notifications: adminNotificationConfig,
  search: adminSearchConfig,
};