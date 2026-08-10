"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Tooltip,
  Badge,
  Divider,
  Typography,
  IconButton,
  Avatar,
  Chip,
  useMediaQuery,
  Paper,
  alpha,
  InputBase,
} from '@mui/material';

import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  ExpandLess,
  ExpandMore,
  Category as CategoryIcon,
  Store as StoreIcon,
  TrendingUp as TrendingUpIcon,
  Payments as PaymentsIcon,
  Group as GroupIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  AccountBalance as AccountBalanceIcon,
  Backup as BackupIcon,
  LocalShipping as LocalShippingIcon,
  Assignment as AssignmentIcon,
  Security as SecurityIcon,
  Help as HelpIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  FiberManualRecord as FiberManualRecordIcon,
  Menu as MenuIcon,
  Person as PersonIcon,
  Link as LinkIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 280;
const MINI_DRAWER_WIDTH = 72;

interface NavItem {
  id: string;
  title: string;
  path: string;
  icon: React.ReactNode;
  badge?: number | null;
  children?: NavItem[];
  isNew?: boolean;
  isDisabled?: boolean;
  description?: string;
  keywords?: string[];
  category?: 'primary' | 'secondary' | 'admin';
}

interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
  icon?: React.ReactNode;
  color?: string;
}

interface ModernSidebarProps {
  onToggle?: () => void;
  isOpen?: boolean;
  isMini?: boolean;
  onMobileClose?: () => void;
  userAvatar?: string;
  userName?: string;
  userRole?: string;
  userEmail?: string;
  isLoading?: boolean;
  customSections?: NavSection[];
  showSearch?: boolean;
  showUserProfile?: boolean;
  darkMode?: boolean;
  onThemeToggle?: () => void;
}

const modernNavigationSections: NavSection[] = [
  {
    id: 'main', title: 'Main', color: '#3b82f6',
    items: [{ id: 'dashboard', title: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon />, keywords: ['dashboard', 'home', 'overview'], category: 'primary' }],
  },
  {
    id: 'sales', title: 'Sales & Billing', color: '#10b981',
    items: [
      { id: 'invoices', title: 'Invoices', path: '/invoices', icon: <ReceiptIcon />, keywords: ['invoices', 'billing', 'sales'], category: 'primary', children: [
        { id: 'invoices-new', title: 'Create Invoice', path: '/invoices/new', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'secondary' },
        { id: 'invoices-list', title: 'All Invoices', path: '/invoices', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'secondary' },
        // { id: 'invoices-regular', title: 'Regular Invoices', path: '/invoices/regular', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'secondary' },
      ]},
      // { id: 'orders', title: 'Orders', path: '/orders', icon: <ShoppingCartIcon />, category: 'primary' },
       
    ],
  },
  {
    id: 'inventory', title: 'Inventory & Products', color: '#f59e0b',
    items: [
      { id: 'products', title: 'Products', path: '/products', icon: <InventoryIcon />, category: 'primary', children: [
        { id: 'products-list', title: 'All Products', path: '/products', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'secondary' },
        { id: 'products-new', title: 'Add Product', path: '/products/new', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'secondary' },
        { id: 'products-dashboard', title: 'Product Dashboard', path: '/products/dashboard', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'secondary' },
      ]},
      { id: 'categories', title: 'Categories', path: '/categories', icon: <CategoryIcon />, category: 'primary', children: [
        { id: 'categories-list', title: 'All Categories', path: '/categories', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'secondary' },
        { id: 'categories-new', title: 'Add Category', path: '/categories/new', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'secondary' },
        { id: 'categories-dashboard', title: 'Category Dashboard', path: '/categories/dashboard', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'secondary' },
      ]},
      // { id: 'stock-management', title: 'Stock Control', path: '/stock-management', icon: <StoreIcon />, category: 'primary' },
      { id: 'purchase-invoices', title: 'Purchase Invoices', path: '/inventory/purchase-invoices', icon: <DescriptionIcon />, category: 'primary', children: [
        { id: 'purchase-invoices-list', title: 'All Purchase Invoices', path: '/inventory/purchase-invoices', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'secondary' },
        { id: 'purchase-invoices-new', title: 'Record Invoice', path: '/inventory/purchase-invoices/new', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'secondary' },
      ]},
      { id: 'suppliers', title: 'Suppliers', path: '/suppliers', icon: <BusinessIcon />, category: 'primary', children: [
        { id: 'suppliers-list', title: 'All Suppliers', path: '/suppliers', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'secondary' },
        { id: 'suppliers-new', title: 'Add Supplier', path: '/suppliers/new', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'secondary' },
      ]},
    ],
  },
  {
    id: 'customers', title: 'Customers & Parties', color: '#06b6d4',
    items: [
      { id: 'parties', title: 'Parties', path: '/parties', icon: <PeopleIcon />, category: 'primary', children: [
        { id: 'parties-list', title: 'All Parties', path: '/parties', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'secondary' },
        { id: 'parties-new', title: 'Add Party', path: '/parties/new', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'secondary' },
      ]},
      // { id: 'customers-page', title: 'Customers', path: '/customers', icon: <GroupIcon />, category: 'primary', children: [
      //   { id: 'customers-list', title: 'All Customers', path: '/customers', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'secondary' },
      //   { id: 'customers-analytics', title: 'Customer Analytics', path: '/customers/analytics', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'secondary', isNew: true },
      // ]},
      { id: 'ledger', title: 'Party Ledger', path: '/ledger', icon: <AccountBalanceIcon />, category: 'primary' },
    ],
  },
  // {
  //   id: 'accounting', title: 'Accounting & Finance', color: '#8b5cf6',
  //   items: [
  //     { id: 'accounting', title: 'Accounting Dashboard', path: '/accounting', icon: <PaymentsIcon />, category: 'primary', children: [
  //       { id: 'accounting-ledger', title: 'General Ledger', path: '/accounting/ledger', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'secondary' },
  //       { id: 'accounting-journal', title: 'Journal Entries', path: '/accounting/journal', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'secondary' },
  //       { id: 'accounting-statements', title: 'Statements', path: '/accounting/statements', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'secondary' },
  //       { id: 'accounting-transactions', title: 'Transactions', path: '/accounting/transactions', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'secondary' },
  //     ]},
  //   ],
  // },
  // {
  //   id: 'reports', title: 'Reports & Analytics', color: '#ef4444',
  //   items: [
  //     { id: 'reports-page', title: 'Reports', path: '/reports', icon: <AssessmentIcon />, category: 'primary', children: [
  //       { id: 'reports-sales', title: 'Sales Reports', path: '/reports/sales', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'secondary' },
  //       { id: 'reports-products', title: 'Product Reports', path: '/reports/products', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'secondary' },
  //       { id: 'reports-hsn', title: 'HSN Analysis', path: '/reports/hsn-analysis', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'secondary' },
  //       { id: 'reports-data-quality', title: 'Data Quality', path: '/reports/data-quality', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'secondary' },
  //     ]},
  //   ],
  // },
  // {
  //   id: 'tools', title: 'Tools & Utilities', color: '#ec4899',
  //   items: [
  //     { id: 'quick-links', title: 'Quick Links', path: '/quick-links', icon: <LinkIcon />, category: 'secondary' },
  //     { id: 'backup', title: 'Backup & Restore', path: '/backup', icon: <BackupIcon />, category: 'secondary', isNew: true },
  //     { id: 'pending-approval', title: 'Pending Approvals', path: '/pending-approval', icon: <ScheduleIcon />, category: 'secondary', badge: 3 },
  //   ],
  // },
  {
    id: 'administration', title: 'Administration', color: '#6b7280',
    items: [
      { id: 'admin-panel', title: 'Admin Panel', path: '/admin', icon: <SecurityIcon />, category: 'admin', children: [
        { id: 'admin-dashboard-overview', title: 'Admin Dashboard', path: '/admin/dashboard', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'admin' },
        { id: 'admin-users', title: 'User Management', path: '/users', icon: <FiberManualRecordIcon sx={{ fontSize: 8 }} />, category: 'admin' },
      ]},
      { id: 'settings', title: 'Settings', path: '/settings', icon: <SettingsIcon />, category: 'admin' },
      { id: 'profile', title: 'Profile', path: '/profile', icon: <PersonIcon />, category: 'admin' },
    ],
  },
  {
    id: 'support', title: 'Support & Help', color: '#14b8a6',
    items: [{ id: 'help-desk', title: 'Help Desk', path: '/help-desk', icon: <HelpIcon />, category: 'admin' }],
  },
];

function pathMatches(currentPath: string, itemPath: string): boolean {
  return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
}

export default function ModernSidebar({
  onToggle,
  isOpen = true,
  isMini = false,
  onMobileClose,
  userAvatar,
  userName = 'User',
  userRole = 'Admin',
  userEmail,
  isLoading = false,
  customSections,
  showSearch = true,
  showUserProfile = true,
  darkMode = false,
  onThemeToggle,
}: ModernSidebarProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set(['main', 'sales']));
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navigationSections = customSections || modernNavigationSections;

  useEffect(() => {
    for (const section of navigationSections) {
      for (const item of section.items) {
        if (item.children?.some(c => pathMatches(pathname, c.path))) {
          setExpandedSections(prev => { if (prev.has(item.id)) return prev; const n = new Set(prev); n.add(item.id); return n; });
        }
      }
    }
  }, [pathname, navigationSections]);

  useEffect(() => { setSearchFocused(searchQuery.trim().length > 0); }, [searchQuery]);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return navigationSections;
    const q = searchQuery.toLowerCase();
    return navigationSections.map(s => ({ ...s, items: s.items.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.keywords?.some(k => k.includes(q)) ||
      i.children?.some(c => c.title.toLowerCase().includes(q))
    )})).filter(s => s.items.length > 0);
  }, [searchQuery, navigationSections]);

  const isActive = useCallback((path: string) => pathMatches(pathname, path), [pathname]);

  const toggleSection = useCallback((id: string) => {
    setExpandedSections(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }, []);

  const handleNav = useCallback((path: string) => {
    setSearchQuery('');
    router.push(path);
    if (isMobile && onMobileClose) onMobileClose();
  }, [router, isMobile, onMobileClose]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); searchInputRef.current?.focus(); }};
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  const showContent = !isMini || isMobile;

  const renderNavItem = (item: NavItem, level = 0) => {
    const active = isActive(item.path);
    const hasChildren = !!item.children?.length;
    const expanded = expandedSections.has(item.id);

    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => hasChildren ? toggleSection(item.id) : handleNav(item.path)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            selected={active}
            sx={{
              minHeight: 42, pl: level === 0 ? 2 : 3.5, pr: 1.5, mx: 0.75, mb: 0.25, borderRadius: 1.5,
              '&.Mui-selected': {
                bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main,
                '&::before': { content: '""', position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', height: 16, width: 2.5, bgcolor: theme.palette.primary.main, borderRadius: '0 2px 2px 0' },
              },
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: active ? theme.palette.primary.main : alpha(theme.palette.text.secondary, 0.6), '& > .MuiSvgIcon-root': { fontSize: level === 0 ? 20 : 16 } }}>
              <Badge badgeContent={item.badge} color="error" variant="dot" invisible={!item.badge}>{item.icon}</Badge>
            </ListItemIcon>
            {showContent && (
              <>
                <ListItemText
                  disableTypography
                  primary={
                    <Box component="span" sx={{ fontWeight: active ? 600 : 450, fontSize: level === 0 ? '0.85rem' : '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                      {item.isNew && <Chip label="NEW" size="small" color="primary" sx={{ ml: 0.5, height: 14, fontSize: '0.5rem', '& .MuiChip-label': { px: 0.4 } }} />}
                    </Box>
                  }
                />
                {hasChildren && <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}><ExpandMore sx={{ fontSize: 18, color: alpha(theme.palette.text.secondary, 0.4) }} /></motion.div>}
              </>
            )}
            {hasChildren && !showContent && <KeyboardArrowRightIcon sx={{ fontSize: 16, color: alpha(theme.palette.text.secondary, 0.3) }} />}
          </ListItemButton>
        </ListItem>
        {hasChildren && showContent && (
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <List disablePadding>{item.children!.map(c => renderNavItem(c, level + 1))}</List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const renderSection = (section: NavSection) => (
    <Box key={section.id} sx={{ mb: 1 }}>
      {showContent && (
        <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 0.5, userSelect: 'none' }}>
          {section.icon && <Box sx={{ width: 16, height: 16, borderRadius: 0.75, bgcolor: section.color || theme.palette.primary.main, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1, color: 'white', '& > .MuiSvgIcon-root': { fontSize: 10 } }}>{section.icon}</Box>}
          <Typography variant="overline" sx={{ fontWeight: 700, fontSize: '0.65rem', color: alpha(theme.palette.text.secondary, 0.7), letterSpacing: '0.08em', lineHeight: 1.2 }}>{section.title}</Typography>
        </Box>
      )}
      <List disablePadding sx={{ pt: 0 }}>{section.items.map(item => renderNavItem(item))}</List>
    </Box>
  );

  if (isLoading) {
    return (
      <Box sx={{ width: DRAWER_WIDTH, height: '100%', p: 2 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: alpha(theme.palette.text.disabled, 0.08) }} />
            <Box sx={{ flex: 1, height: 12, borderRadius: 1, bgcolor: alpha(theme.palette.text.disabled, 0.08) }} />
          </Box>
        ))}
      </Box>
    );
  }

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', width: DRAWER_WIDTH, bgcolor: theme.palette.background.paper }}>
      <Box sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}`, display: 'flex', alignItems: 'center', minHeight: 56 }}>
        {showContent && (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.15rem', background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px', lineHeight: 1.2 }}>MASTERMIND</Typography>
            <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.6), fontWeight: 500, fontSize: '0.6rem', display: 'block', letterSpacing: '0.3px' }}>Business Management</Typography>
          </Box>
        )}
        {!isMobile && onToggle && (
          <IconButton onClick={onToggle} size="small" sx={{ color: alpha(theme.palette.text.secondary, 0.5), '&:hover': { color: theme.palette.primary.main } }}>
            <MenuIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
        {isMobile && onMobileClose && (
          <IconButton onClick={onMobileClose} size="small" sx={{ color: alpha(theme.palette.text.secondary, 0.5) }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Box>

      {showSearch && showContent && (
        <Box sx={{ px: 1.5, pt: 1, pb: 0.5 }}>
          <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', bgcolor: alpha(theme.palette.primary.main, 0.04), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`, borderRadius: 1.5, px: 1.25, py: 0.1 }}>
            <SearchIcon sx={{ color: alpha(theme.palette.text.secondary, 0.4), fontSize: 16, mr: 0.75 }} />
            <InputBase inputRef={searchInputRef} placeholder="Search…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} sx={{ flex: 1, fontSize: '0.8rem', '& input': { py: 0.5 } }} />
          </Paper>
        </Box>
      )}

      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 0.5,
        '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: alpha(theme.palette.text.secondary, 0.15), borderRadius: 2 } }}>
        {searchFocused && filteredSections.length === 0 ? (
          <Box sx={{ px: 3, py: 4, textAlign: 'center' }}><Typography variant="body2" color="text.secondary">No results</Typography></Box>
        ) : filteredSections.map(renderSection)}
      </Box>

      {showUserProfile && (
        <Box sx={{ px: 1.5, py: 1, borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
          {showContent ? (
            <Paper elevation={0} sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.03), border: `1px solid ${alpha(theme.palette.primary.main, 0.06)}`, cursor: 'pointer' }} onClick={() => handleNav('/profile')}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} badgeContent={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4caf50', border: `1.5px solid ${theme.palette.background.paper}` }} />}>
                  <Avatar src={userAvatar} sx={{ width: 34, height: 34, bgcolor: theme.palette.primary.main, fontSize: '0.85rem', fontWeight: 700 }}>{userName?.charAt(0)?.toUpperCase()}</Avatar>
                </Badge>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.8rem' }}>{userName}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.65rem' }}>{userRole}</Typography>
                </Box>
              </Box>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Avatar src={userAvatar} sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main, fontSize: '0.8rem', cursor: 'pointer' }} onClick={() => handleNav('/profile')}>{userName?.charAt(0)?.toUpperCase()}</Avatar>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );

  // ─── MOBILE: Simple overlay ───
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <Box
          onClick={onMobileClose}
          sx={{
            position: 'fixed', inset: 0, zIndex: 1299,
            bgcolor: alpha('#000', 0.5),
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none',
            transition: 'opacity 0.25s ease',
          }}
        />
        {/* Drawer panel */}
        <Box
          sx={{
            position: 'fixed', top: 0, left: 0, bottom: 0,
            width: DRAWER_WIDTH, zIndex: 1300,
            transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: isOpen ? theme.shadows[8] : 'none',
          }}
        >
          {sidebarContent}
        </Box>
      </>
    );
  }

  // ─── DESKTOP ───
  return (
    <motion.div
      initial={false}
      animate={isMini ? 'mini' : 'open'}
      variants={{
        open: { width: DRAWER_WIDTH, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
        mini: { width: MINI_DRAWER_WIDTH, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
      }}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      {sidebarContent}
    </motion.div>
  );
}

export { modernNavigationSections };
export type { NavItem, NavSection, ModernSidebarProps };
