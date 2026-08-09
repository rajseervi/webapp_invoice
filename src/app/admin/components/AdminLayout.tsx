'use client';

import React, { ReactNode } from 'react';
import { EnhancedModernDashboardLayout } from '@/components/ModernLayout';
import { adminThemeConfig, adminQuickActionsConfig } from '../config/theme';
import {
  Dashboard as DashboardIcon,
  Add as AddIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
  ShoppingCart as ShoppingCartIcon,
  Store as StoreIcon,
} from '@mui/icons-material';

// Icon mapping for quick actions
const iconMap = {
  dashboard: <DashboardIcon />,
  add: <AddIcon />,
  inventory: <InventoryIcon />,
  people: <PeopleIcon />,
  receipt: <ReceiptIcon />,
  assessment: <AssessmentIcon />,
  shopping_cart: <ShoppingCartIcon />,
  store: <StoreIcon />,
};

// Admin layout props
interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  showSearch?: boolean;
  showQuickActions?: boolean;
  showNotifications?: boolean;
  showBreadcrumbs?: boolean;
  customQuickActions?: Array<{
    id: string;
    title: string;
    icon: ReactNode;
    path: string;
    color?: string;
    badge?: number;
    isNew?: boolean;
  }>;
}

// Default admin quick actions with proper icons
const defaultAdminQuickActions = [
  {
    id: 'admin-dashboard',
    title: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/admin/dashboard',
    color: adminThemeConfig.colors.info,
  },
  {
    id: 'create-invoice',
    title: 'New Invoice',
    icon: <AddIcon />,
    path: '/invoices/new',
    color: adminThemeConfig.colors.success,
    isNew: true,
  },
  {
    id: 'manage-products',
    title: 'Products',
    icon: <InventoryIcon />,
    path: '/products',
    color: adminThemeConfig.colors.warning,
    badge: 12,
  },
  {
    id: 'manage-parties',
    title: 'Parties',
    icon: <PeopleIcon />,
    path: '/parties',
    color: adminThemeConfig.colors.parties,
  },
  {
    id: 'view-invoices',
    title: 'Invoices',
    icon: <ReceiptIcon />,
    path: '/invoices',
    color: adminThemeConfig.colors.invoices,
  },
  {
    id: 'view-reports',
    title: 'Reports',
    icon: <AssessmentIcon />,
    path: '/reports',
    color: adminThemeConfig.colors.error,
  },
];

// Admin layout component
export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title = 'Admin Panel',
  showSearch = true,
  showQuickActions = true,
  showNotifications = true,
  showBreadcrumbs = true,
  customQuickActions,
}) => {
  // Use custom quick actions or default admin quick actions
  const quickActions = customQuickActions || defaultAdminQuickActions;

  return (
    <EnhancedModernDashboardLayout
      title={title}
      showSearch={showSearch}
      showQuickActions={showQuickActions}
      showNotifications={showNotifications}
      showBreadcrumbs={showBreadcrumbs}
      customQuickActions={quickActions}
    >
      {children}
    </EnhancedModernDashboardLayout>
  );
};

export default AdminLayout;