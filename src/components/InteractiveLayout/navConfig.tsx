import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Receipt as ReceiptIcon,
  ShoppingCart as ShoppingCartIcon,
  Store as StoreIcon,
  Category as CategoryIcon,
  People as PeopleIcon,
  AccountBalance as AccountBalanceIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Inventory as InventoryIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Group as GroupIcon,
} from '@mui/icons-material';

import type { NavSection } from './types';

export const navSections: NavSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    icon: <DashboardIcon fontSize="small" />,
    items: [
      { id: 'admin-dashboard', label: 'Admin Dashboard', path: '/admin/dashboard', icon: <DashboardIcon fontSize="small" /> },
      { id: 'analytics', label: 'Analytics', path: '/reports', icon: <AnalyticsIcon fontSize="small" />, isNew: true },
    ],
  },
  {
    id: 'sales',
    title: 'Sales',
    icon: <ReceiptIcon fontSize="small" />,
    items: [
      { id: 'invoices', label: 'Invoices', path: '/invoices', icon: <ReceiptIcon fontSize="small" /> },
      { id: 'orders', label: 'Orders', path: '/orders', icon: <ShoppingCartIcon fontSize="small" />, badge: 5 },
      { id: 'purchases', label: 'Purchases', path: '/purchases', icon: <AccountBalanceIcon fontSize="small" /> },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory',
    icon: <InventoryIcon fontSize="small" />,
    items: [
      { id: 'products', label: 'Products', path: '/products', icon: <StoreIcon fontSize="small" /> },
      { id: 'categories', label: 'Categories', path: '/categories', icon: <CategoryIcon fontSize="small" /> },
      { id: 'stock', label: 'Stock Management', path: '/stock-management', icon: <InventoryIcon fontSize="small" /> },
    ],
  },
  {
    id: 'business',
    title: 'Business',
    icon: <PeopleIcon fontSize="small" />,
    items: [
      { id: 'parties', label: 'Parties', path: '/parties', icon: <PeopleIcon fontSize="small" /> },
      { id: 'suppliers', label: 'Suppliers', path: '/suppliers', icon: <GroupIcon fontSize="small" /> },
      { id: 'accounting', label: 'Accounting', path: '/accounting', icon: <AccountBalanceIcon fontSize="small" /> },
      { id: 'ledger', label: 'Ledger', path: '/ledger', icon: <TimelineIcon fontSize="small" /> },
    ],
  },
  {
    id: 'insights',
    title: 'Insights',
    icon: <AssessmentIcon fontSize="small" />,
    items: [
      { id: 'reports', label: 'Reports', path: '/reports', icon: <AssessmentIcon fontSize="small" /> },
      { id: 'settings', label: 'Settings', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
      { id: 'help', label: 'Help Desk', path: '/help-desk', icon: <HelpIcon fontSize="small" /> },
    ],
  },
];

export const quickActionItems = [
  { id: 'new-invoice', label: 'New Invoice', path: '/invoices/new' },
  { id: 'new-order', label: 'New Order', path: '/orders/new' },
  { id: 'new-product', label: 'New Product', path: '/products/new' },
  { id: 'new-party', label: 'New Party', path: '/parties/new' },
] as const;
