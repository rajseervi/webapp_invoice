// Migration utility to update all layout imports
// This file documents the migration from old layouts to ImprovedDashboardLayout

export const layoutMigrationMap = {
  // Old imports to new import
  'DashboardLayout': 'ImprovedDashboardLayout',
  'EnhancedDashboardLayout': 'ImprovedDashboardLayout',
  'ResponsiveDashboardLayout': 'ImprovedDashboardLayout',
  
  // Import paths
  oldPaths: [
    '@/components/DashboardLayout/DashboardLayout',
    '@/components/DashboardLayout/EnhancedDashboardLayout',
    '@/app/components/Layout/Layout',
  ],
  newPath: '@/components/DashboardLayout/ImprovedDashboardLayout'
};

export const filesToMigrate = [
  // Reports
  '/src/app/reports/page.tsx',
  '/src/app/reports/hsn-analysis/page.tsx',
  '/src/app/reports/some-report/page.tsx',
  '/src/app/reports/users/page.tsx',
  '/src/app/reports/data-quality/page.tsx',
  '/src/app/reports/sales/page.tsx',
  '/src/app/reports/products/page.tsx',
  
  // Categories
  '/src/app/categories/page.tsx',
  '/src/app/categories/[id]/analytics/page.tsx',
  '/src/app/categories/new/page.tsx',
  '/src/app/categories/edit/[id]/page.tsx',
  '/src/app/categories/dashboard/page.tsx',
  
  // Orders
  '/src/app/orders/page.tsx',
  '/src/app/orders/[id]/page.tsx',
  '/src/app/orders/new/page.tsx',
  '/src/app/orders/[id]/edit/page.tsx',
  
  // Inventory
  '/src/app/inventory/purchase-invoices/page.tsx',
  '/src/app/inventory/purchase-invoices/[id]/page.tsx',
  '/src/app/inventory/purchase-invoices/new/page.tsx',
  '/src/app/inventory/alerts/page.tsx',
  
  // Admin
  '/src/app/admin/page.tsx',
  '/src/app/admin/users/page.tsx',
  '/src/app/admin/permissions/manage.tsx',
  '/src/app/admin/roles/page.tsx',
  '/src/app/admin/roles/assign/page.tsx',
  '/src/app/admin/permissions/page.tsx',
  
  // Products
  '/src/app/products/page.tsx',
  '/src/app/products/management/page.tsx',
  '/src/app/products/enhanced/page.tsx',
  '/src/app/products/enhanced/edit/[id]/page.tsx',
  '/src/app/products/edit/[id]/page.tsx',
  
  // Invoices
  '/src/app/invoices/[id]/page.tsx',
  '/src/app/invoices/[id]/edit/page.tsx',
  '/src/app/invoices/[id]/simple/page.tsx',
  '/src/app/invoices/new/page.tsx',
  '/src/app/invoices/gst/[id]/edit/page.tsx',
  
  // Other pages
  '/src/app/dashboard/page.tsx',
  '/src/app/stock-management/page.tsx',
  '/src/app/parties/page.tsx',
  '/src/app/parties/[id]/history/page.tsx',
  '/src/app/profile/page.tsx',
  '/src/app/quick-links/page.tsx',
  '/src/app/quick-links/enhanced-page.tsx',
  '/src/app/gst-ledger/page.tsx',
  '/src/app/ledger/page.tsx',
];

export const migrationInstructions = `
Migration Steps:
1. Replace import statements
2. Update component names
3. Add new props if needed
4. Test functionality

New Props Available:
- showSearch: boolean (default: true)
- showQuickActions: boolean (default: true)
- compactMode: boolean (default: false)
- showBackToTop: boolean (default: true)
- maxWidth: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false (default: false)
`;