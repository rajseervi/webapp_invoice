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
  Drawer,
  Backdrop,
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
}

interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
  isCollapsible?: boolean;
}

interface ModernSidebarProps {
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
  anchor?: 'left' | 'right';
  elevation?: number;
  PaperProps?: object;
  // Controlled mini state from parent (desktop/tablet only)
  isMini?: boolean;
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

const ModernSidebar: React.FC<ModernSidebarProps> = React.memo(({
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
  anchor = 'left',
  elevation = 0,
  PaperProps = {},
  isMini,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  // Responsive breakpoints
  // Define mobile and tablet ranges explicitly to match design/tests
  const isMobile = useMediaQuery('(max-width:767px)');
  const isTablet = useMediaQuery('(min-width:768px) and (max-width:1023px)');
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // State management
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    // Initialize expanded sections from URL if available
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const expandedParam = urlParams.get('expanded');
      if (expandedParam) {
        try {
          return expandedParam.split(',').reduce((acc, sectionId) => {
            acc[sectionId] = true;
            return acc;
          }, {} as Record<string, boolean>);
        } catch (e) {
          console.error('Error parsing expanded sections from URL', e);
        }
      }
    }
    return {};
  });
  
  const [miniSidebar, setMiniSidebar] = useState(() => {
    // Initialize from URL if available
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const sidebarState = urlParams.get('sidebar');
      return sidebarState === 'collapsed';
    }
    return false;
  });
  
  // Sync controlled isMini from parent when provided (desktop/tablet only)
  useEffect(() => {
    if (typeof isMini === 'boolean' && !isMobile) {
      setMiniSidebar(isMini);
    }
  }, [isMini, isMobile]);
  
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Default navigation sections
  const defaultNavigationSections: NavSection[] = useMemo(() => [
    {
      id: 'main',
      title: "Main",
      items: [
        {
          id: 'dashboard',
          title: "Dashboard",
          path: "/dashboard",
          icon: <DashboardIcon />,
          description: "Overview and analytics"
        },
        {
          id: 'modern-dashboard',
          title: "Modern Dashboard",
          path: "/modern-dashboard",
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect></svg>,
          description: "Enhanced dashboard view",
          isNew: true
        }
      ]
    },
    {
      id: 'sales',
      title: "Sales & Orders",
      items: [
        {
          id: 'invoices',
          title: "Invoices",
          path: "/invoices",
          icon: <ReceiptIcon />,
          description: "Sales and purchase invoices",
          children: [
            {
              id: 'regular-invoices',
              title: "Regular Invoices",
              path: "/invoices/regular",
              icon: <TrendingUpIcon />,
              description: "Regular invoice management"
            },

            {
              id: 'new-invoice',
              title: "New Invoice",
              path: "/invoices/new",
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
              description: "Create new invoice",
              isNew: true
            }
          ]
        },
        {
          id: 'orders',
          title: "Orders",
          path: "/orders",
          icon: <ShoppingCartIcon />,
          description: "Order management and tracking"
        },
        {
          id: 'enhanced-orders',
          title: "Enhanced Orders Demo",
          path: "/demo/enhanced-orders",
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"></path><path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path><path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path></svg>,
          description: "🚀 Enhanced orders with advanced search & pagination",
          isNew: true
        },
        {
          id: 'purchase',
          title: "Purchase Invoices",
          path: "/inventory/purchase-invoices",
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>,
          description: "Purchase invoice management"
        }
      ]
    },
    {
      id: 'inventory',
      title: "Inventory & Products",
      items: [
        {
          id: 'inventory',
          title: "Inventory",
          path: "/inventory",
          icon: <InventoryIcon />,
          description: "Stock and inventory management"
        },
        {
          id: 'stock-management',
          title: "Stock Management",
          path: "/stock-management",
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>,
          description: "Advanced stock management"
        },
        {
          id: 'products',
          title: "Products",
          path: "/products",
          icon: <StoreIcon />,
          description: "Product catalog management",
          children: [
            {
              id: 'product-dashboard',
              title: "Product Dashboard",
              path: "/products/dashboard",
              icon: <DashboardIcon />,
              description: "Product overview and analytics"
            },
            {
              id: 'product-list',
              title: "All Products",
              path: "/products",
              icon: <StoreIcon />,
              description: "View all products"
            }
          ]
        },
        {
          id: 'categories',
          title: "Categories",
          path: "/categories",
          icon: <CategoryIcon />,
          description: "Product category management",
          children: [
            {
              id: 'category-dashboard',
              title: "Category Dashboard",
              path: "/categories/dashboard",
              icon: <DashboardIcon />,
              description: "Category overview and analytics"
            },
            {
              id: 'category-list',
              title: "All Categories",
              path: "/categories",
              icon: <CategoryIcon />,
              description: "View and manage all categories"
            }
          ]
        }
      ]
    },
    {
      id: 'parties',
      title: "Parties & Accounting",
      items: [
        {
          id: 'parties',
          title: "Parties",
          path: "/parties",
          icon: <PeopleIcon />,
          description: "Customer and supplier management"
        },
        {
          id: 'accounting',
          title: "Accounting",
          path: "/accounting",
          icon: <PaymentsIcon />,
          description: "Financial accounting and ledgers"
        },
        {
          id: 'gst-ledger',
          title: "GST Ledger",
          path: "/gst-ledger",
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline></svg>,
          description: "GST transaction ledger",
          isNew: true
        },
        {
          id: 'ledger',
          title: "General Ledger",
          path: "/ledger",
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
          description: "General accounting ledger"
        }
      ]
    },
    {
      id: 'reports',
      title: "Reports & Analytics",
      items: [
        {
          id: 'reports',
          title: "Reports",
          path: "/reports",
          icon: <AssessmentIcon />,
          description: "Business reports and analytics",
          children: [
            {
              id: 'sales-reports',
              title: "Sales Reports",
              path: "/reports/sales",
              icon: <TrendingUpIcon />,
              description: "Sales performance reports"
            },
            {
              id: 'product-reports',
              title: "Product Reports",
              path: "/reports/products",
              icon: <StoreIcon />,
              description: "Product analysis reports"
            },
            {
              id: 'user-reports',
              title: "User Reports",
              path: "/reports/users",
              icon: <GroupIcon />,
              description: "User activity reports"
            },
            {
              id: 'hsn-analysis',
              title: "HSN Analysis",
              path: "/reports/hsn-analysis",
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path></svg>,
              description: "HSN code analysis and reports"
            },
            {
              id: 'data-quality',
              title: "Data Quality",
              path: "/reports/data-quality",
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"></path><path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path><path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path><path d="M13 12h3"></path><path d="M8 12H5"></path></svg>,
              description: "Data quality monitoring",
              isNew: true
            }
          ]
        }
      ]
    },
    {
      id: 'admin',
      title: "Administration",
      items: [
        {
          id: 'admin',
          title: "Admin Panel",
          path: "/admin",
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"></path></svg>,
          description: "Administrative functions",
          children: [
            {
              id: 'admin-dashboard',
              title: "Admin Dashboard",
              path: "/admin/dashboard",
              icon: <DashboardIcon />,
              description: "Administrative overview"
            },
            {
              id: 'users',
              title: "User Management",
              path: "/users",
              icon: <GroupIcon />,
              description: "Manage system users"
            },
            {
              id: 'pending-approval',
              title: "Pending Approvals",
              path: "/pending-approval",
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12,6 12,12 16,14"></polyline></svg>,
              description: "Items awaiting approval",
              badge: 3
            }
          ]
        },
        {
          id: 'settings',
          title: "Settings",
          path: "/settings",
          icon: <SettingsIcon />,
          description: "Application settings and configuration"
        }
      ]
    },
    {
      id: 'support',
      title: "Support & Help",
      items: [
        {
          id: 'help-desk',
          title: "Help Desk",
          path: "/help-desk",
          icon: <HelpIcon />,
          description: "Get help and support"
        },
        {
          id: 'quick-links',
          title: "Quick Links",
          path: "/quick-links",
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>,
          description: "Frequently used shortcuts"
        },
        {
          id: 'navigation-demo',
          title: "Navigation Demo",
          path: "/navigation-demo",
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10,8 16,12 10,16 10,8"></polygon></svg>,
          description: "Navigation component demo",
          isNew: true
        },
        {
          id: 'sidebar-demo',
          title: "Sidebar Demo",
          path: "/sidebar-demo",
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>,
          description: "Sidebar component demo",
          isNew: true
        }
      ]
    }
  ], []);

  const navigationSections = customSections || defaultNavigationSections;

  // Memoized handlers
  const handleToggleSidebar = useCallback(() => {
    // If parent provides isMini (controlled), delegate toggle to parent
    if (onToggle && typeof isMini === 'boolean') {
      onToggle();
      return;
    }

    // Uncontrolled (e.g., tablet) or no onToggle: toggle internally
    setMiniSidebar(prev => {
      const newState = !prev;

      // Update URL with sidebar state
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (newState) {
          url.searchParams.set('sidebar', 'collapsed');
        } else {
          url.searchParams.delete('sidebar');
        }
        window.history.replaceState({}, '', url.toString());
      }

      // Still inform parent if provided
      if (onToggle) onToggle();

      return newState;
    });
  }, [onToggle, isMini]);

  const handleNavigation = useCallback((path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      // Preserve sidebar state in URL when navigating
      const url = new URL(path, window.location.origin);
      
      // Add sidebar state if collapsed
      if (miniSidebar) {
        url.searchParams.set('sidebar', 'collapsed');
      }
      
      // Add expanded sections if any
      const expandedSectionIds = Object.entries(expandedSections)
        .filter(([_, isExpanded]) => isExpanded)
        .map(([id]) => id);
      
      if (expandedSectionIds.length > 0) {
        url.searchParams.set('expanded', expandedSectionIds.join(','));
      }
      
      router.push(url.toString());
    }
    
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  }, [router, isMobile, onMobileClose, onNavigate, miniSidebar, expandedSections]);

  const handleSectionToggle = useCallback((sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const expandedSectionIds = Object.entries(expandedSections)
        .filter(([_, isExpanded]) => isExpanded)
        .map(([id]) => id);
      
      if (expandedSectionIds.length > 0) {
        url.searchParams.set('expanded', expandedSectionIds.join(','));
      } else {
        url.searchParams.delete('expanded');
      }
      
      window.history.replaceState({}, '', url.toString());
    }
  }, [expandedSections]);

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
    // If parent controls mini state, do not override here on desktop/tablet
    if (typeof isMini === 'boolean' && !isMobile) return;

    if (isMobile) {
      // Mobile: drawer UX, no mini state
      setMiniSidebar(false);
    } else if (isTablet) {
      // Tablet: auto-collapse to mini by default
      setMiniSidebar(true);
    } else {
      // Desktop: expanded by default
      setMiniSidebar(false);
    }
  }, [isMobile, isTablet, isMini]);

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
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleSidebar, isMobile, isOpen, onMobileClose]);

  // Render navigation item
  const renderNavItem = useCallback((item: NavItem) => {
    const isItemActive = isActive(item.path);
    const isItemSectionActive = item.children ? 
      item.children.some(child => isActive(child.path)) || isActiveSection(item.path) : 
      false;
    
    const isExpanded = expandedSections[item.id];
    const shouldExpandSection = isExpanded || isItemSectionActive;
    const isClickableLink = item.path && item.path !== '#' && (!item.children || !shouldExpand);
    const isHovered = hoveredItem === item.id;

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
          borderRadius: '12px',
          justifyContent: shouldExpand ? 'initial' : 'center',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isHovered && shouldExpand ? 'translateX(4px)' : 'translateX(0)',
          '&.Mui-selected': {
            bgcolor: theme.palette.mode === 'dark'
              ? `rgba(255, 255, 255, 0.08)`
              : `rgba(25, 118, 210, 0.08)`,
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark'
                ? `rgba(255, 255, 255, 0.12)`
                : `rgba(25, 118, 210, 0.12)`,
            },
            '& .MuiListItemIcon-root': {
              color: theme.palette.primary.main,
            },
            '& .MuiListItemText-primary': {
              fontWeight: 600,
              color: theme.palette.primary.main,
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
              ? theme.palette.primary.main
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
                secondary={shouldExpand && item.description ? (
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
              <Link 
                href={{
                  pathname: item.path,
                  query: {
                    ...(miniSidebar ? { sidebar: 'collapsed' } : {}),
                    ...(Object.entries(expandedSections).some(([_, v]) => v) ? {
                      expanded: Object.entries(expandedSections)
                        .filter(([_, isExpanded]) => isExpanded)
                        .map(([id]) => id)
                        .join(',')
                    } : {})
                  }
                }} 
                passHref 
                legacyBehavior
              >
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
              {item.children.map(child => (
                <motion.div
                  key={child.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                >
                  <ListItem disablePadding sx={{ display: 'block' }}>
                    <Link 
                      href={{
                        pathname: child.path,
                        query: {
                          ...(miniSidebar ? { sidebar: 'collapsed' } : {}),
                          ...(Object.entries(expandedSections).some(([_, v]) => v) ? {
                            expanded: Object.entries(expandedSections)
                              .filter(([_, isExpanded]) => isExpanded)
                              .map(([id]) => id)
                              .join(',')
                          } : {})
                        }
                      }}
                      passHref 
                      legacyBehavior
                    >
                      <Box component="a" sx={{ textDecoration: 'none', color: 'inherit' }}>
                        <ListItemButton 
                          onClick={() => handleNavigation(child.path)}
                          selected={isActive(child.path)}
                          disabled={child.isDisabled}
                          sx={{
                            minHeight: 40,
                            pl: 4,
                            pr: 2.5,
                            py: 0.75,
                            borderRadius: '10px',
                            ml: 2,
                            transition: 'all 0.2s',
                            '&.Mui-selected': {
                              bgcolor: theme.palette.mode === 'dark'
                                ? `rgba(255, 255, 255, 0.08)`
                                : `rgba(25, 118, 210, 0.08)`,
                              '& .MuiListItemIcon-root': {
                                color: theme.palette.primary.main,
                              },
                              '& .MuiListItemText-primary': {
                                fontWeight: 600,
                                color: theme.palette.primary.main,
                              },
                            },
                            '&:hover': {
                              bgcolor: theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.05)'
                                : 'rgba(0, 0, 0, 0.04)',
                              transform: 'translateX(4px)',
                            },
                          }}
                          aria-label={`Navigate to ${child.title}`}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 0,
                              mr: 2,
                              justifyContent: 'center',
                              color: isActive(child.path)
                                ? theme.palette.primary.main
                                : theme.palette.text.secondary,
                            }}
                          >
                            {React.cloneElement(child.icon as React.ReactElement, { 
                              fontSize: "small" 
                            })}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: isActive(child.path) ? 600 : 400,
                                  fontSize: '0.875rem',
                                }}
                              >
                                {child.title}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </Box>
                    </Link>
                  </ListItem>
                </motion.div>
              ))}
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
    handleNavigation
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
        <Skeleton variant="rectangular" height={73} sx={{ mb: 2 }} />
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} variant="rectangular" height={48} sx={{ mb: 1, borderRadius: 1 }} />
        ))}
      </Box>
    );
  }

  // Sidebar content component
  const SidebarContent = () => (
    <Box
      component={motion.div}
      variants={sidebarVariants}
      animate={shouldExpand ? "open" : "closed"}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        width: shouldExpand ? DRAWER_WIDTH : MINI_DRAWER_WIDTH,
        height: '100vh',
        overflow: 'hidden',
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 0 20px rgba(0, 0, 0, 0.5)'
          : '0 0 20px rgba(0, 0, 0, 0.08)',
        bgcolor: theme.palette.mode === 'dark' 
          ? theme.palette.background.default
          : theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
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
        {/* URL state indicator dot */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: theme.palette.primary.main,
            opacity: 0.7,
            transition: 'all 0.3s ease',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': {
                transform: 'scale(0.95)',
                boxShadow: '0 0 0 0 rgba(33, 150, 243, 0.7)',
              },
              '70%': {
                transform: 'scale(1)',
                boxShadow: '0 0 0 5px rgba(33, 150, 243, 0)',
              },
              '100%': {
                transform: 'scale(0.95)',
                boxShadow: '0 0 0 0 rgba(33, 150, 243, 0)',
              },
            },
          }}
          title="Sidebar state is saved in URL"
        />
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
            aria-pressed={!miniSidebar}
            data-sidebar-state={miniSidebar ? 'collapsed' : 'expanded'}
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
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <Box
        sx={{
          overflowY: 'auto',
          overflowX: 'hidden',
          height: shouldExpand 
            ? 'calc(100vh - 64px - 73px)'
            : 'calc(100vh - 64px)',
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
          {navigationSections.map((section, index) => (
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
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        px: 1,
                        mt: index > 0 ? 2 : 0,
                        mb: 1,
                        display: 'block',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        letterSpacing: '0.5px',
                      }}
                    >
                      {section.title}
                    </Typography>
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

  // Mobile drawer implementation
  if (isMobile) {
    return (
      <>
        <Drawer
          variant="temporary"
          anchor={anchor}
          open={isOpen}
          onClose={onMobileClose}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          PaperProps={{
            sx: {
              width: DRAWER_WIDTH,
              border: 'none',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 16px 32px rgba(0, 0, 0, 0.4)'
                : '0 16px 32px rgba(0, 0, 0, 0.12)',
              ...PaperProps,
            },
          }}
          sx={{
            display: { xs: 'block', [MOBILE_BREAKPOINT]: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          <SidebarContent />
        </Drawer>
      </>
    );
  }

  // Desktop sidebar implementation
  return (
    <Box
      sx={{
        width: shouldExpand ? DRAWER_WIDTH : MINI_DRAWER_WIDTH,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        display: 'block',
        '@media (max-width:767px)': {
          display: 'none',
        },
        transition: theme.transitions.create(['width'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}
    >
      <SidebarContent />
    </Box>
  );
});

ModernSidebar.displayName = 'ModernSidebar';

export default ModernSidebar;