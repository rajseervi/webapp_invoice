"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Skeleton,
  Paper,
  alpha,
  InputBase,
  Fade,
} from '@mui/material';

// Icons
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
  AttachMoney as AttachMoneyIcon,
  Payments as PaymentsIcon,
  Group as GroupIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Help as HelpIcon,
  Search as SearchIcon,
  Star as StarIcon,
  Notifications as NotificationsIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';

import Link from "next/link";

// Constants
const DRAWER_WIDTH = 280;
const MINI_DRAWER_WIDTH = 72;
const ANIMATION_DURATION = 300;
const MOBILE_BREAKPOINT = 'md';

// Enhanced Types
interface NavItem {
  id: string;
  title: string;
  path: string;
  icon: React.ReactNode;
  badge?: number | null;
  permission?: string;
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
  isCollapsible?: boolean;
  priority?: number;
  icon?: React.ReactNode;
}

interface ImprovedSidebarProps {
  onToggle?: () => void;
  isOpen?: boolean;
  onMobileClose?: () => void;
  userAvatar?: string;
  userName?: string;
  userRole?: string;
  isLoading?: boolean;
  customSections?: NavSection[];
  onNavigate?: (path: string) => void;
  variant?: 'permanent' | 'temporary' | 'persistent';
  showSearch?: boolean;
  showUserProfile?: boolean;
  compactMode?: boolean;
}

// Animation variants
const sidebarVariants = {
  open: {
    width: DRAWER_WIDTH,
    transition: {
      duration: ANIMATION_DURATION / 1000,
      ease: "easeInOut"
    }
  },
  closed: {
    width: MINI_DRAWER_WIDTH,
    transition: {
      duration: ANIMATION_DURATION / 1000,
      ease: "easeInOut"
    }
  }
};

const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.2 }
  }
};

const ImprovedSidebar: React.FC<ImprovedSidebarProps> = React.memo(({
  onToggle,
  isOpen = true,
  onMobileClose,
  userAvatar,
  userName = "John Doe",
  userRole = "Admin",
  isLoading = false,
  customSections,
  onNavigate,
  variant = 'permanent',
  showSearch = true,
  showUserProfile = true,
  compactMode = false,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down(MOBILE_BREAKPOINT));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // State management
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [miniSidebar, setMiniSidebar] = useState(compactMode);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NavItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Enhanced navigation sections with better organization
  const defaultNavigationSections: NavSection[] = useMemo(() => [
    {
      id: 'overview',
      title: "Overview",
      priority: 1,
      icon: <HomeIcon />,
      items: [
        {
          id: 'dashboard',
          title: "Dashboard",
          path: "/admin/dashboard",
          icon: <DashboardIcon />,
          description: "Main dashboard with key metrics",
          keywords: ['dashboard', 'overview', 'metrics', 'analytics'],
          category: 'primary'
        },
         
      ]
    },
    {
      id: 'sales',
      title: "Sales & Billing",
      priority: 2,
      icon: <ReceiptIcon />,
      items: [
        {
          id: 'invoices',
          title: "Invoices",
          path: "/invoices",
          icon: <ReceiptIcon />,
          description: "Manage all your invoices",
          keywords: ['invoices', 'bills', 'billing', 'sales'],
          category: 'primary',
          children: [
            {
              id: 'create-invoice',
              title: "Create Invoice",
              path: "/invoices/create",
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
              description: "Create new invoice",
              keywords: ['create', 'new', 'invoice'],
              category: 'primary'
            },

            {
              id: 'regular-invoices',
              title: "Regular Invoices",
              path: "/invoices/regular",
              icon: <TrendingUpIcon />,
              description: "Regular invoice management",
              keywords: ['sales', 'revenue'],
              category: 'primary'
            }
          ]
        },
        {
          id: 'orders',
          title: "Orders",
          path: "/orders",
          icon: <ShoppingCartIcon />,
          description: "Order management and tracking",
          keywords: ['orders', 'purchases', 'tracking'],
          category: 'primary'
        },
        {
          id: 'purchases',
          title: "Purchases",
          path: "/purchases",
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>,
          description: "Purchase orders and supplier management",
          keywords: ['purchases', 'suppliers', 'procurement', 'stock'],
          category: 'primary',
          children: [
            {
              id: 'new-purchase',
              title: "New Purchase Order",
              path: "/purchases/new",
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
              description: "Create new purchase order",
              keywords: ['create', 'new', 'purchase'],
              category: 'primary'
            },
            {
              id: 'suppliers',
              title: "Suppliers",
              path: "/purchases/suppliers",
              icon: <PeopleIcon />,
              description: "Manage suppliers",
              keywords: ['suppliers', 'vendors'],
              category: 'primary'
            }
          ]
        }
      ]
    },
    {
      id: 'inventory',
      title: "Inventory",
      priority: 3,
      icon: <InventoryIcon />,
      items: [
        {
          id: 'products',
          title: "Products", 
          path: "/products",
          icon: <StoreIcon />,
          description: "Product catalog management",
          keywords: ['products', 'catalog', 'items'],
          category: 'primary',
          children: [
            {
              id: 'product-dashboard',
              title: "Product Dashboard",
              path: "/products/dashboard",
              icon: <DashboardIcon />,
              description: "Product analytics",
              keywords: ['product', 'analytics'],
              category: 'primary'
            },
            {
              id: 'enhanced-products',
              title: "Enhanced Management",
              path: "/products/enhanced-management",
              icon: <StarIcon />,
              description: "Advanced product management",
              keywords: ['enhanced', 'advanced'],
              category: 'primary',
              isNew: true
            }
          ]
        },
        {
          id: 'categories',
          title: "Categories",
          path: "/categories",
          icon: <CategoryIcon />,
          description: "Product category management",
          keywords: ['categories', 'classification'],
          category: 'primary',
          children: [
            {
              id: 'category-dashboard',
              title: "Category Dashboard",
              path: "/categories/dashboard",
              icon: <DashboardIcon />,
              description: "Category analytics",
              keywords: ['category', 'analytics'],
              category: 'primary'
            }
          ]
        },
        {
          id: 'inventory-management',
          title: "Stock Management",
          path: "/inventory",
          icon: <InventoryIcon />,
          description: "Inventory and stock control",
          keywords: ['inventory', 'stock', 'warehouse'],
          category: 'primary'
        },
        {
          id: 'purchase-invoices',
          title: "Purchase Invoices",
          path: "/inventory/purchase-invoices",
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>,
          description: "Purchase invoice management",
          keywords: ['purchase', 'procurement'],
          category: 'primary'
        }
      ]
    },
    {
      id: 'parties',
      title: "Parties & Finance",
      priority: 4,
      icon: <PeopleIcon />,
      items: [
        {
          id: 'parties',
          title: "Parties",
          path: "/parties",
          icon: <PeopleIcon />,
          description: "Customer and supplier management",
          keywords: ['parties', 'customers', 'suppliers'],
          category: 'primary'
        },
        {
          id: 'accounting',
          title: "Accounting",
          path: "/accounting",
          icon: <PaymentsIcon />,
          description: "Financial accounting",
          keywords: ['accounting', 'finance', 'ledger'],
          category: 'primary'
        },
        {
          id: 'ledger',
          title: "Ledger",
          path: "/ledger",
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
          description: "General ledger management",
          keywords: ['ledger', 'accounts'],
          category: 'primary'
        }
      ]
    },
    {
      id: 'reports',
      title: "Reports & Analytics",
      priority: 5,
      icon: <AssessmentIcon />,
      items: [
        {
          id: 'reports',
          title: "Reports",
          path: "/reports",
          icon: <AssessmentIcon />,
          description: "Business reports and analytics",
          keywords: ['reports', 'analytics', 'insights'],
          category: 'secondary',
          children: [
            {
              id: 'sales-reports',
              title: "Sales Reports",
              path: "/reports/sales",
              icon: <TrendingUpIcon />,
              description: "Sales performance reports",
              keywords: ['sales', 'performance'],
              category: 'secondary'
            },
            {
              id: 'product-reports',
              title: "Product Reports",
              path: "/reports/products",
              icon: <StoreIcon />,
              description: "Product analysis reports",
              keywords: ['product', 'analysis'],
              category: 'secondary'
            },
            {
              id: 'hsn-analysis',
              title: "HSN Analysis",
              path: "/reports/hsn-analysis",
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path></svg>,
              description: "HSN code analysis",
              keywords: ['hsn', 'tax', 'analysis'],
              category: 'secondary',
              isNew: true
            }
          ]
        }
      ]
    },
    {
      id: 'admin',
      title: "Administration",
      priority: 6,
      icon: <SettingsIcon />,
      items: [
        {
          id: 'users',
          title: "User Management",
          path: "/users",
          icon: <GroupIcon />,
          description: "Manage system users",
          keywords: ['users', 'management', 'admin'],
          category: 'admin'
        },
        {
          id: 'pending-approval',
          title: "Pending Approvals",
          path: "/pending-approval",
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12,6 12,12 16,14"></polyline></svg>,
          description: "Items awaiting approval",
          keywords: ['approval', 'pending', 'review'],
          category: 'admin',
          badge: 3
        },
        {
          id: 'settings',
          title: "Settings",
          path: "/settings",
          icon: <SettingsIcon />,
          description: "Application settings",
          keywords: ['settings', 'configuration'],
          category: 'admin'
        }
      ]
    },
    {
      id: 'help',
      title: "Help & Support",
      priority: 7,
      icon: <HelpIcon />,
      items: [
        {
          id: 'help-desk',
          title: "Help Desk",
          path: "/help-desk",
          icon: <HelpIcon />,
          description: "Get help and support",
          keywords: ['help', 'support', 'assistance'],
          category: 'secondary'
        },
        {
          id: 'sidebar-demo',
          title: "Sidebar Demo",
          path: "/sidebar-demo",
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>,
          description: "Sidebar component demo",
          keywords: ['demo', 'sidebar', 'example'],
          category: 'secondary',
          isNew: true
        }
      ]
    }
  ], []);

  const navigationSections = customSections || defaultNavigationSections;

  // Search functionality
  const allNavItems = useMemo(() => {
    const items: NavItem[] = [];
    navigationSections.forEach(section => {
      section.items.forEach(item => {
        items.push(item);
        if (item.children) {
          items.push(...item.children);
        }
      });
    });
    return items;
  }, [navigationSections]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const results = allNavItems.filter(item => {
      const searchTerms = [
        item.title.toLowerCase(),
        item.description?.toLowerCase() || '',
        ...(item.keywords || [])
      ];
      return searchTerms.some(term => term.includes(query.toLowerCase()));
    });

    setSearchResults(results.slice(0, 8)); // Limit to 8 results
    setShowSearchResults(true);
  }, [allNavItems]);

  // Memoized handlers
  const handleToggleSidebar = useCallback(() => {
    if (onToggle) {
      onToggle();
    } else {
      setMiniSidebar(prev => !prev);
    }
  }, [onToggle]);

  const handleNavigation = useCallback((path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      router.push(path);
    }
    
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
    
    // Clear search when navigating
    setSearchQuery('');
    setShowSearchResults(false);
  }, [router, isMobile, onMobileClose, onNavigate]);

  const handleSectionToggle = useCallback((sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);

  // Utility functions
  const isActive = useCallback((path: string) => pathname === path, [pathname]);
  
  const isActiveSection = useCallback((path: string) => {
    return pathname?.startsWith(path) && pathname !== path;
  }, [pathname]);

  const getUserInitials = useCallback(() => {
    return userName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }, [userName]);

  // Effects
  useEffect(() => {
    if (isMobile) {
      setMiniSidebar(false);
    }
  }, [isMobile]);

  // Handle hover expand for mini sidebar
  const handleMouseEnter = useCallback(() => {
    if (miniSidebar && !isMobile) {
      setIsHovering(true);
    }
  }, [miniSidebar, isMobile]);

  const handleMouseLeave = useCallback(() => {
    if (miniSidebar && !isMobile) {
      setIsHovering(false);
    }
  }, [miniSidebar, isMobile]);

  // Determine if sidebar should be expanded
  const shouldExpand = !miniSidebar || (miniSidebar && isHovering);

  // Auto-expand active sections
  useEffect(() => {
    navigationSections.forEach(section => {
      section.items.forEach(item => {
        if (item.children) {
          const hasActiveChild = item.children.some(child => isActive(child.path));
          if (hasActiveChild) {
            setExpandedSections(prev => ({
              ...prev,
              [item.id]: true
            }));
          }
        }
      });
    });
  }, [pathname, navigationSections, isActive]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle sidebar with Ctrl+B
      if (event.ctrlKey && event.key === 'b') {
        event.preventDefault();
        handleToggleSidebar();
      }
      
      // Close sidebar with Escape key in mobile view
      if (event.key === 'Escape' && isMobile && isOpen && onMobileClose) {
        event.preventDefault();
        onMobileClose();
      }
      
      // Focus search with Ctrl+K
      if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        const searchInput = document.getElementById('sidebar-search');
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleSidebar, isMobile, isOpen, onMobileClose]);

  // Render navigation item
  const renderNavItem = useCallback((item: NavItem, level = 0) => {
    const isItemActive = isActive(item.path);
    const isItemSectionActive = item.children ? 
      item.children.some(child => isActive(child.path)) || isActiveSection(item.path) : 
      false;
    
    const isExpanded = expandedSections[item.id];
    const shouldExpandSection = isExpanded || isItemSectionActive;
    const isClickableLink = item.path && item.path !== '#' && (!item.children || !shouldExpand);
    const isHovered = hoveredItem === item.id;

    const getCategoryColor = (category?: string) => {
      switch (category) {
        case 'primary': return theme.palette.primary.main;
        case 'secondary': return theme.palette.secondary.main;
        case 'admin': return theme.palette.warning.main;
        default: return theme.palette.text.secondary;
      }
    };

    const listItemButton = (
      <ListItemButton
        onClick={() => {
          if (item.children && shouldExpand) {
            handleSectionToggle(item.id);
          } else if (isClickableLink && !item.isDisabled) {
            handleNavigation(item.path);
          }
        }}
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
        selected={isItemActive || isItemSectionActive}
        disabled={item.isDisabled}
        sx={{
          minHeight: 48,
          px: 2.5,
          py: 1,
          borderRadius: '12px',
          justifyContent: shouldExpand ? 'initial' : 'center',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isHovered && shouldExpand ? 'translateX(4px)' : 'translateX(0)',
          ml: level * 1,
          '&.Mui-selected': {
            bgcolor: alpha(getCategoryColor(item.category), 0.1),
            '&:hover': {
              bgcolor: alpha(getCategoryColor(item.category), 0.15),
            },
            '& .MuiListItemIcon-root': {
              color: getCategoryColor(item.category),
            },
            '& .MuiListItemText-primary': {
              fontWeight: 600,
              color: getCategoryColor(item.category),
            },
          },
          '&:hover': {
            bgcolor: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.04)',
          },
          '&.Mui-disabled': {
            opacity: 0.5,
          },
        }}
        aria-label={`Navigate to ${item.title}`}
        role="menuitem"
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: shouldExpand ? 2 : 0,
            justifyContent: 'center',
            color: isItemActive || isItemSectionActive
              ? getCategoryColor(item.category)
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
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
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
                          height: 20, 
                          fontSize: '0.7rem',
                          '& .MuiChip-label': {
                            px: 1,
                          }
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
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      mt: 0.5,
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
            animate={{ rotate: shouldExpandSection ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {shouldExpandSection ? <ExpandLess /> : <ExpandMore />}
          </motion.div>
        )}
      </ListItemButton>
    );

    return (
      <motion.div
        key={item.id}
        variants={listItemVariants}
        initial="hidden"
        animate="visible"
      >
        <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
          <Tooltip 
            title={!shouldExpand ? `${item.title}${item.description ? ` - ${item.description}` : ''}` : ""} 
            placement="right" 
            arrow
            enterDelay={500}
          >
            {isClickableLink ? (
              <Link href={item.path} passHref legacyBehavior>
                <Box component="a" sx={{ textDecoration: 'none', color: 'inherit' }}>
                  {listItemButton}
                </Box>
              </Link>
            ) : (
              listItemButton
            )}
          </Tooltip>
        </ListItem>
        
        {item.children && shouldExpand && (
          <Collapse in={shouldExpandSection} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map(child => renderNavItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </motion.div>
    );
  }, [
    isActive, 
    isActiveSection, 
    expandedSections, 
    miniSidebar, 
    hoveredItem, 
    theme, 
    handleSectionToggle, 
    handleNavigation,
    shouldExpand
  ]);

  // Loading skeleton
  if (isLoading) {
    return (
      <Box
        sx={{
          width: { xs: isOpen ? '100%' : 0, md: DRAWER_WIDTH },
          height: '100vh',
          bgcolor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
          p: 2,
        }}
      >
        <Skeleton variant="rectangular" height={64} sx={{ mb: 2 }} />
        {showUserProfile && <Skeleton variant="rectangular" height={73} sx={{ mb: 2 }} />}
        {showSearch && <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />}
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} variant="rectangular" height={48} sx={{ mb: 1, borderRadius: 1 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box
      component={motion.div}
      variants={sidebarVariants}
      animate={shouldExpand ? "open" : "closed"}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        width: {
          xs: isOpen ? '100%' : 0,
          [MOBILE_BREAKPOINT]: shouldExpand ? DRAWER_WIDTH : MINI_DRAWER_WIDTH,
        },
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        height: '100vh',
        overflow: 'hidden',
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 0 20px rgba(0, 0, 0, 0.5)'
          : '0 0 20px rgba(0, 0, 0, 0.08)',
        bgcolor: theme.palette.mode === 'dark' 
          ? theme.palette.background.default
          : theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
        display: { xs: isOpen ? 'block' : 'none', [MOBILE_BREAKPOINT]: 'block' },
        position: { xs: 'fixed', [MOBILE_BREAKPOINT]: 'relative' },
        zIndex: { xs: theme.zIndex.drawer, [MOBILE_BREAKPOINT]: 'auto' },
        transition: theme.transitions.create(['width'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Header with logo and toggle button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: shouldExpand ? 'space-between' : 'center',
          padding: shouldExpand ? 2 : 1,
          height: 64,
          borderBottom: `1px solid ${theme.palette.divider}`,
          position: 'relative',
        }}
      >
        <AnimatePresence>
          {shouldExpand && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{
                  fontWeight: 700,
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                    : 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                MASTERMIND
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Tooltip title={`${miniSidebar ? 'Expand' : 'Collapse'} sidebar (Ctrl+B)`} arrow>
          <IconButton 
            onClick={handleToggleSidebar} 
            size="small"
            sx={{
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(0, 0, 0, 0.04)',
              '&:hover': {
                transform: 'scale(1.1)',
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.08)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
              borderRadius: '8px',
              padding: '8px',
            }}
            aria-label={`${miniSidebar ? 'Expand' : 'Collapse'} sidebar`}
          >
            <motion.div
              animate={{ 
                rotate: miniSidebar ? 0 : 180,
                scale: [1, 1.2, 1],
              }}
              transition={{ 
                duration: 0.3,
                times: [0, 0.5, 1],
                ease: "easeInOut" 
              }}
            >
              {miniSidebar ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </motion.div>
          </IconButton>
        </Tooltip>
      </Box>

      {/* User profile section */}
      {showUserProfile && (
        <AnimatePresence>
          {shouldExpand && (
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
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
                role="button"
                tabIndex={0}
                aria-label="User profile"
              >
                <Avatar
                  src={userAvatar}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: theme.palette.primary.main,
                    mr: 2,
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  {getUserInitials()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap>
                    {userName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {userRole}
                  </Typography>
                </Box>
                <IconButton size="small">
                  <NotificationsIcon fontSize="small" />
                </IconButton>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Search section */}
      {showSearch && (
        <AnimatePresence>
          {shouldExpand && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Paper
                  component="form"
                  sx={{
                    p: '2px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.04)',
                    boxShadow: 'none',
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <IconButton sx={{ p: '10px' }} aria-label="search">
                    <SearchIcon />
                  </IconButton>
                  <InputBase
                    id="sidebar-search"
                    sx={{ ml: 1, flex: 1 }}
                    placeholder="Search... (Ctrl+K)"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => setShowSearchResults(searchQuery.length > 0)}
                    onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                  />
                </Paper>
                
                {/* Search Results */}
                <AnimatePresence>
                  {showSearchResults && searchResults.length > 0 && (
                    <Fade in={showSearchResults}>
                      <Paper
                        sx={{
                          mt: 1,
                          maxHeight: 200,
                          overflow: 'auto',
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        <List dense>
                          {searchResults.map((item) => (
                            <ListItem key={item.id} disablePadding>
                              <ListItemButton
                                onClick={() => handleNavigation(item.path)}
                                sx={{
                                  '&:hover': {
                                    bgcolor: theme.palette.action.hover,
                                  },
                                }}
                              >
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                  primary={item.title}
                                  secondary={item.description}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                  secondaryTypographyProps={{ variant: 'caption' }}
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Fade>
                  )}
                </AnimatePresence>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Navigation */}
      <Box
        sx={{
          overflowY: 'auto',
          overflowX: 'hidden',
          height: `calc(100vh - 64px${showUserProfile && shouldExpand ? ' - 73px' : ''}${showSearch && shouldExpand ? ' - 73px' : ''})`,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.2)' 
              : 'rgba(0, 0, 0, 0.2)',
            borderRadius: '6px',
            '&:hover': {
              background: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.3)' 
                : 'rgba(0, 0, 0, 0.3)',
            },
          },
        }}
        role="menu"
      >
        <List sx={{ px: 2, pt: 1 }}>
          {navigationSections
            .sort((a, b) => (a.priority || 999) - (b.priority || 999))
            .map((section, index) => (
            <React.Fragment key={section.id}>
              {index > 0 && (
                <Divider 
                  sx={{ 
                    my: 1.5,
                    opacity: miniSidebar ? 0 : 0.6,
                  }} 
                />
              )}
              
              <AnimatePresence>
                {shouldExpand && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {section.icon && (
                        <Box sx={{ mr: 1, color: 'text.secondary' }}>
                          {React.cloneElement(section.icon as React.ReactElement, { fontSize: "small" })}
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
    </Box>
  );
});

ImprovedSidebar.displayName = 'ImprovedSidebar';

export default ImprovedSidebar;