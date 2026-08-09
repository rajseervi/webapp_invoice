export const AppRoutes = {
  DASHBOARD: '/dashboard',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ORDERS: '/orders',
  NEW_ORDER: '/orders/new',
  INVOICES: '/invoices',
  NEW_INVOICE: '/invoices/new',
  PRODUCTS: '/products',
  CATEGORIES: '/categories',
  PARTIES: '/parties',
  ADMIN: {
    USERS: '/admin/users',
    BUSINESS_SETTINGS: '/admin/business',
    SECURITY: '/admin/security',
  },
  REPORTS: {
    SALES: '/reports/sales',
    // Updated old period routes to new structure
    SALES_DAILY: '/reports/sales/summary',
    SALES_MONTHLY: '/reports/sales/period?granularity=monthly',
    SALES_YEARLY: '/reports/sales/period?granularity=yearly',
    INVENTORY: '/reports/inventory',
    FINANCIAL: '/reports/financial',
    USERS: '/reports/users',
  },
  // ... add other routes
};