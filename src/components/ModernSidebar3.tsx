"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion'; // AnimatePresence removed as it was not used
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Typography,
  Tooltip,
  Divider,
  Chip,
  Badge,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  // Receipt as ReceiptIcon, // Unused
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  ExpandLess,
  ExpandMore,
  Category as CategoryIcon,
  Store as StoreIcon,
  // Notifications as NotificationsIcon, // Unused
  // Help as HelpIcon, // Unused
  // BarChart as BarChartIcon, // Unused
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  Payments as PaymentsIcon,
  // LocalShipping as LocalShippingIcon, // Unused
  // Business as BusinessIcon, // Unused
  Group as GroupIcon,
  // Security as SecurityIcon, // Unused
  // Tune as TuneIcon, // Unused
  // Palette as PaletteIcon, // Unused
  // Language as LanguageIcon, // Unused
  // Info as InfoIcon, // Unused
  // ContactSupport as ContactSupportIcon, // Unused
  // MenuBook as MenuBookIcon, // Unused
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon, // Added for collapsed toggle
  // Menu as MenuIcon, // Unused
  Notifications as NotificationsMainIcon, // Assuming this is for the main notifications link
  Help as HelpMainIcon, // Assuming this is for the main help link
} from '@mui/icons-material';

import { useAuth } from '@/contexts/AuthContext'; // Assuming you have this

// Sidebar props
interface ModernSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onItemClick: (path: string) => void; // Callback to handle navigation
  drawerWidth?: number;
  collapsedDrawerWidth?: number;
}

// Navigation item structure
interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  badge?: number | null;
  permission?: string;
  children?: NavItem[];
  isNew?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// Sample navigation data (can be moved to a separate file)
const navigationSectionsData: NavSection[] = [
    {
      title: "Main",
      items: [
        { title: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> }
      ]
    },
    {
      title: "Sales",
      items: [
        {
          title: "Orders", path: "/orders", icon: <ShoppingCartIcon />, isNew: true,
          children: [
            { title: "All Orders", path: "/orders", icon: <ShoppingCartIcon /> },
            { title: "Create Order", path: "/orders/new", icon: <ShoppingCartIcon /> }
          ]
        },
        {
          title: "Invoices", path: "/invoices", icon: <InventoryIcon />, badge: 5, // Using InventoryIcon as ReceiptIcon was removed
          children: [
            { title: "All Invoices", path: "/invoices", icon: <InventoryIcon /> },
            { title: "Create Invoice", path: "/invoices/new", icon: <InventoryIcon /> },
          ]
        },
        { title: "Payments", path: "/payments", icon: <PaymentsIcon />, permission: "payments" },
        { title: "Customers", path: "/parties", icon: <PeopleIcon /> },
      ]
    },
    {
      title: "Inventory",
      items: [
        { title: "Products", path: "/products", icon: <StoreIcon /> },
        { title: "Categories", path: "/categories", icon: <CategoryIcon /> },
        { title: "Purchase Orders", path: "/purchase-orders", icon: <ShoppingCartIcon />, permission: "purchase-orders" },
        { title: "Suppliers", path: "/suppliers", icon: <PeopleIcon /> } // Using PeopleIcon as LocalShippingIcon was removed
      ]
    },
    {
      title: "Reports",
      items: [
        {
          title: "Sales Reports", path: "/reports/sales", icon: <TrendingUpIcon />, permission: "reports", // Using TrendingUpIcon as BarChartIcon was removed
          children: [
            { title: "Daily Sales", path: "/reports/sales/daily", icon: <TrendingUpIcon /> },
            { title: "Monthly Sales", path: "/reports/sales/monthly", icon: <TrendingUpIcon /> },
            { title: "Yearly Sales", path: "/reports/sales/yearly", icon: <TrendingUpIcon /> }
          ]
        },
        { title: "Inventory Reports", path: "/reports/inventory", icon: <AssessmentIcon />, permission: "reports" },
        { title: "Financial Reports", path: "/reports/financial", icon: <AttachMoneyIcon />, permission: "reports" }
      ]
    },
    {
      title: "Administration",
      items: [
        { title: "User Management", path: "/admin/users", icon: <GroupIcon />, permission: "admin" },
        { title: "Business Settings", path: "/admin/business", icon: <SettingsIcon />, permission: "admin" }, // Using SettingsIcon as BusinessIcon was removed
        { title: "Security", path: "/admin/security", icon: <SettingsIcon />, permission: "admin" } // Using SettingsIcon as SecurityIcon was removed
      ]
    },
    {
      title: "Settings & Help",
      items: [
        {
          title: "Settings", path: "/settings", icon: <SettingsIcon />,
          children: [
            { title: "General", path: "/settings/general", icon: <SettingsIcon /> }, // Using SettingsIcon as TuneIcon was removed
            { title: "Appearance", path: "/settings/appearance", icon: <SettingsIcon /> }, // Using SettingsIcon as PaletteIcon was removed
            { title: "Notifications", path: "/settings/notifications", icon: <NotificationsMainIcon /> }, // Using NotificationsMainIcon as NotificationsSettingsIcon was removed
            { title: "Language", path: "/settings/language", icon: <SettingsIcon /> } // Using SettingsIcon as LanguageIcon was removed
          ]
        },
        {
          title: "Help & Support", path: "/help-desk", icon: <HelpMainIcon />,
          children: [
            { title: "Documentation", path: "/help-desk/docs", icon: <HelpMainIcon /> }, // Using HelpMainIcon as MenuBookIcon was removed
            { title: "FAQs", path: "/help-desk/faqs", icon: <HelpMainIcon /> }, // Using HelpMainIcon as InfoIcon was removed
            { title: "Contact Support", path: "/help-desk/contact", icon: <HelpMainIcon /> } // Using HelpMainIcon as ContactSupportIcon was removed
          ]
        },
        { title: "Notifications", path: "/notifications", icon: <NotificationsMainIcon />, badge: 3 }
      ]
    }
];


const sidebarVariants = {
  expanded: (width: number) => ({
    width: width,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  }),
  collapsed: (width: number) => ({
    width: width,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  }),
};

const itemTextVariants = {
  expanded: { opacity: 1, x: 0, display: 'block', transition: { delay: 0.1, duration: 0.2 } },
  collapsed: { opacity: 0, x: -10, display: 'none', transition: { duration: 0.1 } },
};

const iconVariants = {
  expanded: { rotate: 0 },
  collapsed: { rotate: 180 }, // Example for toggle icon, not used for nav icons
};


export const ModernSidebar: React.FC<ModernSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  onItemClick,
  drawerWidth = 260,
  collapsedDrawerWidth = 80,
}) => {
  const router = useRouter(); // Keep for potential direct use if needed, though onItemClick is primary
  const pathname = usePathname();
  const theme = useTheme();
  const { hasPermission } = useAuth() || { hasPermission: () => true }; // Provide default if useAuth is optional

  const isActivePath = (path: string) => pathname === path;

  const isActivePathOrChild = useMemo(() => (itemPath: string, children?: NavItem[]): boolean => {
    if (isActivePath(itemPath) && !children) return true;
    if (children?.some(child => isActivePath(child.path))) return true;
    if (pathname?.startsWith(itemPath + (itemPath.endsWith('/') ? '' : '/'))) return true;
    return false;
  }, [pathname]);

  const initialExpandedState = useMemo(() => {
    const state: Record<string, boolean> = {};
    navigationSectionsData.forEach(section => {
      section.items.forEach(item => {
        if (item.children) {
          const sectionKey = item.title.toLowerCase().replace(/\s+/g, '-');
          if (isActivePathOrChild(item.path, item.children)) {
            state[sectionKey] = true;
          }
        }
      });
    });
    return state;
  }, [isActivePathOrChild]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(initialExpandedState);

  useEffect(() => {
    setExpandedSections(initialExpandedState);
  }, [initialExpandedState]);

  const handleSectionToggle = (sectionKey: string) => {
    if (!isCollapsed) {
      setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
    }
  };

  const renderNavItem = (item: NavItem, isSubItem: boolean = false) => {
    if (item.permission && !hasPermission('page', item.permission)) {
      return null;
    }

    const sectionKey = item.title.toLowerCase().replace(/\s+/g, '-');
    const isCurrentlyActive = isActivePathOrChild(item.path, item.children);
    const isEffectivelyExpanded = !isCollapsed && item.children && (expandedSections[sectionKey] || (isCurrentlyActive && !isActivePath(item.path)));

    const itemStyle = {
        borderRadius: theme.shape.borderRadius,
        mb: 0.5,
        py: isCollapsed && !isSubItem ? 1.5 : (isSubItem ? 0.75 : 1),
        px: isCollapsed && !isSubItem ? 0 : (isSubItem ? 1.5 : 1.5),
        mx: isCollapsed && !isSubItem ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        transition: theme.transitions.create(['background-color', 'color', 'padding', 'margin'], {
          duration: theme.transitions.duration.short,
        }),
        color: theme.palette.text.secondary,
        '&:hover': {
          backgroundColor: alpha(theme.palette.action.hover, 0.08),
          color: theme.palette.primary.main,
        },
        '&.Mui-selected': {
          backgroundColor: alpha(theme.palette.primary.main, 0.12),
          color: theme.palette.primary.main,
          '& .MuiListItemIcon-root': {
            color: theme.palette.primary.main,
          },
          '& .MuiListItemText-primary': {
            fontWeight: theme.typography.fontWeightBold, // Bolder for active
            color: theme.palette.primary.main,
          },
        },
      };

    const navItemContent = (
        <>
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: isCollapsed ? 0 : 1.5,
              justifyContent: 'center',
              color: 'inherit',
              fontSize: isSubItem ? '1.1rem' : '1.3rem', // Slightly smaller for subitems
            }}
          >
            {item.badge && !isCollapsed ? (
              <Badge badgeContent={item.badge} color="error" overlap="circular">
                {React.cloneElement(item.icon as React.ReactElement, { sx: { fontSize: 'inherit' }})}
              </Badge>
            ) : (
              React.cloneElement(item.icon as React.ReactElement, { sx: { fontSize: 'inherit' }})
            )}
          </ListItemIcon>
          <motion.div
            variants={itemTextVariants}
            animate={isCollapsed ? 'collapsed' : 'expanded'}
            style={{ flexGrow: 1, overflow: 'hidden', display: isCollapsed ? 'none' : 'flex', alignItems: 'center' }}
          >
            <ListItemText
              primary={item.title}
              primaryTypographyProps={{
                noWrap: true,
                sx: {
                  fontWeight: isCurrentlyActive ? theme.typography.fontWeightMedium : theme.typography.fontWeightRegular,
                  fontSize: isSubItem ? '0.8rem' : '0.875rem',
                  color: 'inherit',
                },
              }}
            />
            {item.isNew && (
              <Chip label="New" size="small" color="secondary" sx={{ ml: 1, height: 18, fontSize: '0.6rem' }} />
            )}
          </motion.div>
          {!isCollapsed && item.children && (
            isEffectivelyExpanded ? <ExpandLess sx={{ color: 'inherit', ml: 'auto' }} /> : <ExpandMore sx={{ color: 'inherit', ml: 'auto' }} />
          )}
        </>
      );


    return (
      <React.Fragment key={item.path + '-' + item.title}>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <Tooltip title={isCollapsed || isSubItem ? item.title : ""} placement="right" arrow disableHoverListener={!isCollapsed && !isSubItem}>
            <ListItemButton
              selected={isCurrentlyActive}
              onClick={() => {
                if (item.children) {
                  handleSectionToggle(sectionKey);
                } else {
                  onItemClick(item.path);
                }
              }}
              sx={itemStyle}
              aria-current={isActivePath(item.path) && !item.children ? "page" : undefined}
              aria-expanded={!isCollapsed && item.children ? isEffectivelyExpanded : undefined}
            >
              {navItemContent}
            </ListItemButton>
          </Tooltip>
        </ListItem>

        {!isCollapsed && item.children && (
          <Collapse in={isEffectivelyExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 2 }}>
              {item.children.map(child => renderNavItem(child, true))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <motion.div
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      variants={sidebarVariants}
      custom={isCollapsed ? collapsedDrawerWidth : drawerWidth}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden', // Important for framer-motion width animation
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          p: isCollapsed ? 1.5 : 2, // Adjust padding
          height: '64px', // Match AppBar height typically
          flexShrink: 0,
        }}
      >
        {!isCollapsed && (
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
            MyBrand
          </Typography>
        )}
        <IconButton onClick={onToggleCollapse} size="small">
          {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
      <Divider />
      <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', p: isCollapsed ? 0.5 : 1 }}>
        {navigationSectionsData.map((section, index) => (
          <React.Fragment key={section.title + '-' + index}>
            {!isCollapsed && (
              <Typography
                variant="caption"
                sx={{
                  px: 2,
                  pt: index === 0 ? 1 : 2,
                  pb: 0.5,
                  display: 'block',
                  color: theme.palette.text.disabled,
                  fontWeight: theme.typography.fontWeightMedium,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                }}
              >
                {section.title}
              </Typography>
            )}
            <List component="nav" disablePadding>
              {section.items.map(item => renderNavItem(item))}
            </List>
          </React.Fragment>
        ))}
      </Box>
      {/* Optional Footer */}
      {!isCollapsed && (
        <>
          <Divider />
          <Box sx={{ p: 2, textAlign: 'center', flexShrink: 0 }}>
            <Typography variant="caption" color="text.secondary">
              © App {new Date().getFullYear()}
            </Typography>
          </Box>
        </>
      )}
    </motion.div>
  );
};