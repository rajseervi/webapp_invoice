'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, alpha } from '@mui/material/styles';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Typography,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Button,
  InputBase,
  Chip,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  Collapse,
  Paper,
  Backdrop,
  Fab,
  Zoom,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';

// Icons
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Help as HelpIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  ShoppingCart as ShoppingCartIcon,
  Category as CategoryIcon,
  Store as StoreIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  Payments as PaymentsIcon,
  Group as GroupIcon,
  ExpandLess,
  ExpandMore,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Close as CloseIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  Star as StarIcon,
  Language as LanguageIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';

import { useAuth } from '@/contexts/AuthContext';
import { handleLogout } from '@/utils/authRedirects';

// Constants
const APPBAR_HEIGHT = 64;
const APPBAR_HEIGHT_MOBILE = 56;
const DRAWER_WIDTH = 280;
const MINI_DRAWER_WIDTH = 72;
const MOBILE_BREAKPOINT = 'md';

// Types
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
  color?: string;
  permission?: string;
}

interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
  color?: string;
  icon?: React.ReactNode;
}

interface QuickAction {
  id: string;
  title: string;
  icon: React.ReactNode;
  action: () => void;
  color?: string;
  shortcut?: string;
}

interface EnhancedNavigationProps {
  children: React.ReactNode;
  title?: string;
  showBreadcrumbs?: boolean;
  quickActions?: QuickAction[];
  customSections?: NavSection[];
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
}

// Navigation sections configuration
const defaultNavigationSections: NavSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    color: '#2196F3',
    icon: <DashboardIcon />,
    items: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        path: '/dashboard',
        icon: <DashboardIcon />,
        description: 'Business overview and analytics',
        color: '#2196F3',
      },
      {
        id: 'analytics',
        title: 'Analytics',
        path: '/analytics',
        icon: <AnalyticsIcon />,
        description: 'Advanced business analytics',
        color: '#9C27B0',
        isNew: true,
      },
    ],
  },
  {
    id: 'sales',
    title: 'Sales & Revenue',
    color: '#4CAF50',
    icon: <TrendingUpIcon />,
    items: [
      {
        id: 'invoices',
        title: 'Invoices',
        path: '/invoices',
        icon: <ReceiptIcon />,
        description: 'Manage sales and purchase invoices',
        color: '#4CAF50',
        children: [
          {
            id: 'regular-invoices',
            title: 'Regular Invoices',
            path: '/invoices/regular',
            icon: <TrendingUpIcon />,
            description: 'Regular invoice management',
          },

          {
            id: 'new-invoice',
            title: 'Create Invoice',
            path: '/invoices/new',
            icon: <AddIcon />,
            description: 'Create new invoice',
            isNew: true,
          },
        ],
      },
      {
        id: 'orders',
        title: 'Orders',
        path: '/orders',
        icon: <ShoppingCartIcon />,
        description: 'Order management and tracking',
        color: '#FF9800',
        badge: 5,
      },
      {
        id: 'payments',
        title: 'Payments',
        path: '/payments',
        icon: <PaymentsIcon />,
        description: 'Payment tracking and management',
        color: '#00BCD4',
      },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory & Products',
    color: '#FF5722',
    icon: <InventoryIcon />,
    items: [
      {
        id: 'products',
        title: 'Products',
        path: '/products',
        icon: <StoreIcon />,
        description: 'Product catalog management',
        color: '#FF5722',
        children: [
          {
            id: 'product-dashboard',
            title: 'Product Dashboard',
            path: '/products/dashboard',
            icon: <DashboardIcon />,
            description: 'Product overview and analytics',
          },
          {
            id: 'enhanced-products',
            title: 'Enhanced Management',
            path: '/products/enhanced-management',
            icon: <ViewModuleIcon />,
            description: 'Advanced product management',
            isNew: true,
          },
          {
            id: 'product-list',
            title: 'All Products',
            path: '/products',
            icon: <ViewListIcon />,
            description: 'View all products',
          },
          {
            id: 'product-import',
            title: 'Import Products',
            path: '/products/import',
            icon: <UploadIcon />,
            description: 'Bulk import products using templates',
          },
        ],
      },
      {
        id: 'categories',
        title: 'Categories',
        path: '/categories',
        icon: <CategoryIcon />,
        description: 'Product category management',
        color: '#9C27B0',
        children: [
          {
            id: 'category-dashboard',
            title: 'Category Dashboard',
            path: '/categories/dashboard',
            icon: <DashboardIcon />,
            description: 'Category overview and analytics',
          },
          {
            id: 'category-list',
            title: 'All Categories',
            path: '/categories',
            icon: <CategoryIcon />,
            description: 'View and manage categories',
          },
        ],
      },
      {
        id: 'inventory-management',
        title: 'Stock Management',
        path: '/inventory',
        icon: <InventoryIcon />,
        description: 'Inventory and stock management',
        color: '#607D8B',
      },
    ],
  },
  {
    id: 'parties',
    title: 'Parties & Accounting',
    color: '#3F51B5',
    icon: <PeopleIcon />,
    items: [
      {
        id: 'parties',
        title: 'Parties',
        path: '/parties',
        icon: <PeopleIcon />,
        description: 'Customer and supplier management',
        color: '#3F51B5',
      },
      {
        id: 'accounting',
        title: 'Accounting',
        path: '/accounting',
        icon: <AccountBalanceIcon />,
        description: 'Financial accounting and ledgers',
        color: '#795548',
      },
      {
        id: 'ledger',
        title: 'Ledger',
        path: '/ledger',
        icon: <TimelineIcon />,
        description: 'Account ledger management',
        color: '#009688',
      },
    ],
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    color: '#E91E63',
    icon: <AssessmentIcon />,
    items: [
      {
        id: 'reports',
        title: 'Reports',
        path: '/reports',
        icon: <AssessmentIcon />,
        description: 'Business reports and analytics',
        color: '#E91E63',
        children: [
          {
            id: 'sales-reports',
            title: 'Sales Reports',
            path: '/reports/sales',
            icon: <TrendingUpIcon />,
            description: 'Sales performance reports',
          },
          {
            id: 'product-reports',
            title: 'Product Reports',
            path: '/reports/products',
            icon: <StoreIcon />,
            description: 'Product analysis reports',
          },
          {
            id: 'profit-loss',
            title: 'Profit & Loss',
            path: '/reports/profit-loss',
            icon: <AttachMoneyIcon />,
            description: 'Financial performance reports',
          },
          {
            id: 'gst-reports',
            title: 'GST Reports',
            path: '/reports/gst',
            icon: <ReceiptIcon />,
            description: 'GST compliance reports',
          },
        ],
      },
    ],
  },
  {
    id: 'admin',
    title: 'Administration',
    color: '#FF9800',
    icon: <SecurityIcon />,
    items: [
      {
        id: 'users',
        title: 'User Management',
        path: '/users',
        icon: <GroupIcon />,
        description: 'Manage system users',
        color: '#FF9800',
      },
      {
        id: 'settings',
        title: 'Settings',
        path: '/settings',
        icon: <SettingsIcon />,
        description: 'Application settings',
        color: '#607D8B',
      },
      {
        id: 'help',
        title: 'Help & Support',
        path: '/help',
        icon: <HelpIcon />,
        description: 'Get help and support',
        color: '#009688',
      },
    ],
  },
];

// Default quick actions
const defaultQuickActions: QuickAction[] = [
  {
    id: 'new-invoice',
    title: 'New Invoice',
    icon: <AddIcon />,
    action: () => {},
    color: '#4CAF50',
    shortcut: 'Ctrl+N',
  },
  {
    id: 'create-order',
    title: 'Create Order',
    icon: <ShoppingCartIcon />,
    action: () => {},
    color: '#FF9800',
    shortcut: 'Ctrl+O',
  },
  {
    id: 'add-product',
    title: 'Add Product',
    icon: <StoreIcon />,
    action: () => {},
    color: '#FF5722',
    shortcut: 'Ctrl+P',
  },
  {
    id: 'add-party',
    title: 'Add Party',
    icon: <PeopleIcon />,
    action: () => {},
    color: '#3F51B5',
    shortcut: 'Ctrl+U',
  },
];

export default function EnhancedNavigation({
  children,
  title,
  showBreadcrumbs = true,
  quickActions = defaultQuickActions,
  customSections,
  onThemeToggle,
  isDarkMode = false,
}: EnhancedNavigationProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, userRole, logout } = useAuth();

  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down(MOBILE_BREAKPOINT));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // State management
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [miniSidebar, setMiniSidebar] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  // Mock data
  const [notifications] = useState([
    { id: 1, title: 'New order received', message: 'Order #12345 from Acme Corp', time: '5 min ago', read: false },
    { id: 2, title: 'Low stock alert', message: 'Product XYZ is running low', time: '1 hour ago', read: false },
    { id: 3, title: 'Payment received', message: '₹50,000 payment confirmed', time: '2 hours ago', read: true },
  ]);

  const navigationSections = customSections || defaultNavigationSections;
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  const currentAppBarHeight = isMobile ? APPBAR_HEIGHT_MOBILE : APPBAR_HEIGHT;

  // Utility functions
  const isActive = useCallback((path: string) => pathname === path, [pathname]);
  const isActiveSection = useCallback((path: string) => pathname?.startsWith(path), [pathname]);

  const getUserInitials = useCallback(() => {
    if (currentUser?.displayName) {
      return currentUser.displayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    } else if (currentUser?.email) {
      return currentUser.email[0].toUpperCase();
    }
    return 'U';
  }, [currentUser]);

  // Generate breadcrumbs
  const breadcrumbs = useMemo(() => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const crumbs = [{ title: 'Home', path: '/dashboard' }];
    
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      // Find the navigation item for this path
      let navItem: NavItem | undefined;
      navigationSections.forEach(section => {
        section.items.forEach(item => {
          if (item.path === currentPath) {
            navItem = item;
          }
          if (item.children) {
            item.children.forEach(child => {
              if (child.path === currentPath) {
                navItem = child;
              }
            });
          }
        });
      });
      
      crumbs.push({
        title: navItem?.title || segment.charAt(0).toUpperCase() + segment.slice(1),
        path: isLast ? '' : currentPath,
      });
    });
    
    return crumbs;
  }, [pathname, navigationSections]);

  // Event handlers
  const toggleDrawer = useCallback(() => {
    if (isMobile) {
      setDrawerOpen(!drawerOpen);
    } else {
      setMiniSidebar(!miniSidebar);
    }
  }, [isMobile, drawerOpen, miniSidebar]);

  const handleNavigation = useCallback((path: string) => {
    router.push(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  }, [router, isMobile]);

  const handleSectionToggle = useCallback((sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleUserLogout = async () => {
    setProfileMenuAnchor(null);
    await handleLogout(logout, router);
  };

  const handleQuickAction = (action: QuickAction) => {
    switch (action.id) {
      case 'new-invoice':
        router.push('/invoices/new');
        break;
      case 'create-order':
        router.push('/orders/new');
        break;
      case 'add-product':
        router.push('/products/new');
        break;
      case 'add-party':
        router.push('/parties/new');
        break;
      default:
        action.action();
    }
  };

  // Effects
  useEffect(() => {
    if (isMobile) {
      setDrawerOpen(false);
      setMiniSidebar(false);
    }
  }, [isMobile]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.pageYOffset > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey) {
        switch (event.key) {
          case 'b':
            event.preventDefault();
            toggleDrawer();
            break;
          case 'k':
            event.preventDefault();
            setSearchDialogOpen(true);
            break;
          case 'n':
            event.preventDefault();
            router.push('/invoices/new');
            break;
          case 'o':
            event.preventDefault();
            router.push('/orders/new');
            break;
          case 'p':
            event.preventDefault();
            router.push('/products/new');
            break;
          case 'u':
            event.preventDefault();
            router.push('/parties/new');
            break;
        }
      }
      if (event.key === 'Escape') {
        setSearchDialogOpen(false);
        if (isMobile && drawerOpen) {
          setDrawerOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleDrawer, router, isMobile, drawerOpen]);

  // Auto-expand active sections
  useEffect(() => {
    navigationSections.forEach(section => {
      section.items.forEach(item => {
        if (item.children) {
          const hasActiveChild = item.children.some(child => isActive(child.path));
          if (hasActiveChild) {
            setExpandedSections(prev => ({
              ...prev,
              [item.id]: true,
            }));
          }
        }
      });
    });
  }, [pathname, navigationSections, isActive]);

  // Render navigation item
  const renderNavItem = (item: NavItem, level = 0) => {
    const isItemActive = isActive(item.path);
    const isItemSectionActive = item.children ? 
      item.children.some(child => isActive(child.path)) || isActiveSection(item.path) : 
      false;
    const isExpanded = expandedSections[item.id];
    const shouldExpand = !miniSidebar || (miniSidebar && level === 0);

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: level * 0.05 }}
      >
        <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
          <Tooltip 
            title={!shouldExpand ? `${item.title}${item.description ? ` - ${item.description}` : ''}` : ""} 
            placement="right" 
            arrow
          >
            <ListItemButton
              onClick={() => {
                if (item.children && shouldExpand) {
                  handleSectionToggle(item.id);
                } else if (item.path && item.path !== '#' && !item.isDisabled) {
                  handleNavigation(item.path);
                }
              }}
              selected={isItemActive || isItemSectionActive}
              disabled={item.isDisabled}
              sx={{
                minHeight: 48,
                px: level === 0 ? 2.5 : 4,
                py: 1,
                borderRadius: '12px',
                mx: level === 0 ? 1 : 2,
                justifyContent: shouldExpand ? 'initial' : 'center',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&.Mui-selected': {
                  bgcolor: item.color ? alpha(item.color, 0.1) : alpha(theme.palette.primary.main, 0.1),
                  borderLeft: `4px solid ${item.color || theme.palette.primary.main}`,
                  '&:hover': {
                    bgcolor: item.color ? alpha(item.color, 0.15) : alpha(theme.palette.primary.main, 0.15),
                  },
                  '& .MuiListItemIcon-root': {
                    color: item.color || theme.palette.primary.main,
                  },
                  '& .MuiListItemText-primary': {
                    fontWeight: 600,
                    color: item.color || theme.palette.primary.main,
                  },
                },
                '&:hover': {
                  bgcolor: alpha(theme.palette.action.hover, 0.8),
                  transform: 'translateX(4px)',
                },
                '&.Mui-disabled': {
                  opacity: 0.5,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: shouldExpand ? 2 : 0,
                  justifyContent: 'center',
                  color: isItemActive || isItemSectionActive
                    ? item.color || theme.palette.primary.main
                    : theme.palette.text.secondary,
                  transition: 'color 0.2s',
                }}
              >
                {item.badge ? (
                  <Badge 
                    badgeContent={item.badge} 
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.7rem',
                        minWidth: '16px',
                        height: '16px',
                      }
                    }}
                  >
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              
              <AnimatePresence>
                {shouldExpand && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden', flex: 1 }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: isItemActive || isItemSectionActive ? 600 : 400,
                              fontSize: level === 0 ? '0.875rem' : '0.8rem',
                            }}
                          >
                            {item.title}
                          </Typography>
                          {item.isNew && (
                            <Chip 
                              label="New" 
                              size="small" 
                              color="secondary" 
                              sx={{ 
                                ml: 1, 
                                height: 18, 
                                fontSize: '0.65rem',
                                '& .MuiChip-label': { px: 0.5 }
                              }} 
                            />
                          )}
                        </Box>
                      }
                      secondary={shouldExpand && item.description && level === 0 ? (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: 'block',
                            mt: 0.5,
                            lineHeight: 1.2,
                          }}
                        >
                          {item.description}
                        </Typography>
                      ) : null}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {shouldExpand && item.children && (
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </motion.div>
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
        
        {item.children && shouldExpand && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map(child => renderNavItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </motion.div>
    );
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Enhanced App Bar */}
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          backdropFilter: 'blur(20px)',
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          height: currentAppBarHeight,
        }}
      >
        <Toolbar 
          disableGutters
          sx={{ 
            minHeight: currentAppBarHeight,
            px: { xs: 1, sm: 2 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left side */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={`Toggle sidebar (Ctrl+B)`} arrow>
              <IconButton
                color="inherit"
                onClick={toggleDrawer}
                edge="start"
                sx={{
                  mr: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <MenuIcon />
              </IconButton>
            </Tooltip>
            
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography 
                variant="h6" 
                noWrap 
                sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                }}
              >
                MASTERMIND GST
              </Typography>
              {title && (
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ display: { xs: 'none', sm: 'block' } }}
                >
                  {title}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Center - Search */}
          <Box sx={{ 
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            borderRadius: 3,
            px: 2,
            py: 0.5,
            minWidth: 300,
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            '&:hover': {
              bgcolor: alpha(theme.palette.background.paper, 0.9),
            },
          }}>
            <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
            <InputBase
              placeholder="Search... (Ctrl+K)"
              onClick={() => setSearchDialogOpen(true)}
              sx={{ 
                flex: 1,
                '& input': {
                  cursor: 'pointer',
                },
              }}
              readOnly
            />
            <Chip 
              label="⌘K" 
              size="small" 
              variant="outlined" 
              sx={{ 
                height: 20, 
                fontSize: '0.7rem',
                borderColor: alpha(theme.palette.divider, 0.3),
              }} 
            />
          </Box>

          {/* Right side */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Quick Actions */}
            <Box sx={{ 
              display: { xs: 'none', lg: 'flex' }, 
              gap: 1,
              mr: 1,
            }}>
              {quickActions.slice(0, 2).map((action) => (
                <Tooltip key={action.id} title={`${action.title} (${action.shortcut})`} arrow>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleQuickAction(action)}
                    startIcon={action.icon}
                    sx={{
                      bgcolor: action.color || theme.palette.primary.main,
                      '&:hover': {
                        bgcolor: action.color ? alpha(action.color, 0.8) : alpha(theme.palette.primary.main, 0.8),
                        transform: 'translateY(-1px)',
                      },
                      textTransform: 'none',
                      borderRadius: 2,
                      px: 1.5,
                      py: 0.5,
                    }}
                  >
                    {action.title}
                  </Button>
                </Tooltip>
              ))}
            </Box>

            {/* Search Icon - Mobile */}
            <Tooltip title="Search">
              <IconButton
                color="inherit"
                onClick={() => setSearchDialogOpen(true)}
                sx={{ display: { xs: 'flex', md: 'none' } }}
              >
                <SearchIcon />
              </IconButton>
            </Tooltip>

            {/* Theme Toggle */}
            <Tooltip title="Toggle theme">
              <IconButton
                color="inherit"
                onClick={onThemeToggle}
                sx={{
                  bgcolor: alpha(theme.palette.action.hover, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.action.hover, 0.2),
                  },
                }}
              >
                {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton
                color="inherit"
                onClick={handleNotificationsOpen}
                sx={{
                  bgcolor: alpha(theme.palette.action.hover, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.action.hover, 0.2),
                  },
                }}
              >
                <Badge badgeContent={unreadNotificationsCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* User Profile */}
            <Tooltip title="Account">
              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{
                  bgcolor: alpha(theme.palette.action.hover, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.action.hover, 0.2),
                  },
                }}
              >
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: theme.palette.primary.main,
                    fontSize: '0.875rem',
                  }}
                  src={currentUser?.photoURL || undefined}
                >
                  {getUserInitials()}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Enhanced Sidebar */}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        anchor="left"
        open={isMobile ? drawerOpen : true}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{
          keepMounted: true,
        }}
        PaperProps={{
          sx: {
            width: isMobile ? DRAWER_WIDTH : (miniSidebar ? MINI_DRAWER_WIDTH : DRAWER_WIDTH),
            border: 'none',
            boxShadow: theme.shadows[8],
            bgcolor: theme.palette.background.paper,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: isMobile ? DRAWER_WIDTH : (miniSidebar ? MINI_DRAWER_WIDTH : DRAWER_WIDTH),
          },
        }}
      >
        {/* Sidebar Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: miniSidebar && !isMobile ? 'center' : 'space-between',
            padding: 2,
            height: currentAppBarHeight,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <AnimatePresence>
            {(!miniSidebar || isMobile) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  MASTERMIND
                </Typography>
              </motion.div>
            )}
          </AnimatePresence>
          
          {!isMobile && (
            <Tooltip title={`${miniSidebar ? 'Expand' : 'Collapse'} sidebar`} arrow>
              <IconButton 
                onClick={toggleDrawer} 
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.action.hover, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.action.hover, 0.2),
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <motion.div
                  animate={{ rotate: miniSidebar ? 0 : 180 }}
                  transition={{ duration: 0.3 }}
                >
                  {miniSidebar ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                </motion.div>
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* User Profile Section */}
        <AnimatePresence>
          {(!miniSidebar || isMobile) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Box
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                }}
              >
                <Avatar
                  src={currentUser?.photoURL || undefined}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: theme.palette.primary.main,
                    mr: 2,
                  }}
                >
                  {getUserInitials()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap>
                    {currentUser?.displayName || currentUser?.email || 'User'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {userRole?.charAt(0).toUpperCase() + userRole?.slice(1) || 'User'}
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <Box
          sx={{
            overflowY: 'auto',
            overflowX: 'hidden',
            height: `calc(100vh - ${currentAppBarHeight}px - ${(!miniSidebar || isMobile) ? '73px' : '0px'})`,
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: alpha(theme.palette.text.primary, 0.2),
              borderRadius: '6px',
            },
          }}
        >
          <List sx={{ pt: 1 }}>
            {navigationSections.map((section, index) => (
              <React.Fragment key={section.id}>
                {index > 0 && (
                  <Divider sx={{ my: 1.5, mx: 2 }} />
                )}
                
                <AnimatePresence>
                  {(!miniSidebar || isMobile) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center' }}>
                        {section.icon && (
                          <Box sx={{ 
                            mr: 1, 
                            color: section.color || theme.palette.text.secondary,
                            display: 'flex',
                            alignItems: 'center',
                          }}>
                            {React.cloneElement(section.icon as React.ReactElement, { 
                              fontSize: "small" 
                            })}
                          </Box>
                        )}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            textTransform: 'uppercase',
                            fontWeight: 600,
                            letterSpacing: '0.5px',
                          }}
                        >
                          {section.title}
                        </Typography>
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {section.items.map(item => renderNavItem(item))}
              </React.Fragment>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Mobile backdrop */}
      {isMobile && (
        <Backdrop
          open={drawerOpen}
          onClick={() => setDrawerOpen(false)}
          sx={{ 
            zIndex: theme.zIndex.drawer - 1,
            bgcolor: alpha(theme.palette.common.black, 0.5),
          }}
        />
      )}

      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          pt: `${currentAppBarHeight}px`,
          minHeight: '100dvh',
          overflow: 'auto',
          bgcolor: theme.palette.background.default,
          position: 'relative',
          pb: { xs: 2, sm: 3, md: 4 },
        }}
      >
        {/* Breadcrumbs */}
        {showBreadcrumbs && breadcrumbs.length > 1 && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              mx: { xs: 2, sm: 3, md: 4, lg: 5 },
              bgcolor: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(10px)',
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Breadcrumbs>
              {breadcrumbs.map((crumb, index) => (
                <MuiLink
                  key={index}
                  color={index === breadcrumbs.length - 1 ? 'text.primary' : 'inherit'}
                  href={crumb.path || undefined}
                  onClick={crumb.path ? (e) => {
                    e.preventDefault();
                    handleNavigation(crumb.path);
                  } : undefined}
                  sx={{
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: crumb.path ? 'underline' : 'none',
                    },
                    cursor: crumb.path ? 'pointer' : 'default',
                  }}
                >
                  {crumb.title}
                </MuiLink>
              ))}
            </Breadcrumbs>
          </Paper>
        )}

        {/* Content */}
        <Box sx={{
          p: { xs: 2, sm: 3, md: 4, lg: 5 },
          mx: 'auto',
          width: '100%',
          maxWidth: { xs: '100%', sm: 1200, md: 1400, lg: 1600 },
        }}>
          {children}
        </Box>

        {/* Back to Top Button */}
        <Zoom in={showBackToTop}>
          <Fab
            color="primary"
            size="small"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: theme.zIndex.speedDial,
            }}
          >
            <KeyboardArrowUpIcon />
          </Fab>
        </Zoom>
      </Box>

      {/* Search Dialog */}
      <Dialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(20px)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SearchIcon color="primary" />
            <Typography variant="h6">Search</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            placeholder="Search for pages, features, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          
          {/* Search suggestions */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {quickActions.map((action) => (
                <Chip
                  key={action.id}
                  label={action.title}
                  icon={action.icon}
                  onClick={() => {
                    handleQuickAction(action);
                    setSearchDialogOpen(false);
                  }}
                  sx={{ 
                    bgcolor: alpha(action.color || theme.palette.primary.main, 0.1),
                    '&:hover': {
                      bgcolor: alpha(action.color || theme.palette.primary.main, 0.2),
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSearchDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchor}
        open={Boolean(notificationsAnchor)}
        onClose={() => setNotificationsAnchor(null)}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 400,
            borderRadius: 2,
            boxShadow: theme.shadows[8],
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6">Notifications</Typography>
        </Box>
        {notifications.map((notification) => (
          <MenuItem 
            key={notification.id}
            sx={{ 
              py: 1.5,
              borderLeft: notification.read ? 'none' : `4px solid ${theme.palette.primary.main}`,
            }}
          >
            <Box>
              <Typography variant="body2" fontWeight={notification.read ? 400 : 600}>
                {notification.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {notification.message}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {notification.time}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>

      {/* Profile Menu */}
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={() => setProfileMenuAnchor(null)}
        PaperProps={{
          sx: {
            width: 240,
            borderRadius: 2,
            boxShadow: theme.shadows[8],
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {currentUser?.displayName || currentUser?.email || 'User'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {userRole?.charAt(0).toUpperCase() + userRole?.slice(1) || 'User'}
          </Typography>
        </Box>
        
        <MenuItem onClick={() => {
          setProfileMenuAnchor(null);
          router.push('/profile');
        }}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          setProfileMenuAnchor(null);
          setSettingsDialogOpen(true);
        }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          setProfileMenuAnchor(null);
          router.push('/help');
        }}>
          <ListItemIcon>
            <HelpIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Help</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleUserLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}