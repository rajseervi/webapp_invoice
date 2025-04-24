"use client";
import React, { useState } from 'react';
import { 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  Collapse,
  Tooltip,
  Badge,
  alpha,
  useTheme,
  Chip,
  Typography,
  Box,
  useMediaQuery
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  AccountBalance as AccountBalanceIcon,
  ExpandLess,
  ExpandMore,
  Category as CategoryIcon,
  Store as StoreIcon,
  Link as LinkIcon,
  Notifications as NotificationsIcon,
  Help as HelpIcon,
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  Payments as PaymentsIcon,
  Storefront as StorefrontIcon,
  LocalShipping as LocalShippingIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Security as SecurityIcon,
  Tune as TuneIcon,
  Palette as PaletteIcon,
  Notifications as NotificationsSettingsIcon,
  Language as LanguageIcon,
  TouchApp as TouchAppIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Define navigation item type
interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  badge?: number | string;
  badgeColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  children?: NavItem[];
  roles?: string[];
  divider?: boolean;
  beta?: boolean;
}

interface ImprovedNavigationProps {
  closeDrawer?: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export default function ImprovedNavigation({ 
  closeDrawer, 
  collapsed = false,
  onToggleCollapsed 
}: ImprovedNavigationProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { userRole } = useAuth();
  
  // Check if on mobile
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State for expanded menu items
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    inventory: false,
    finance: false,
    reports: false,
    settings: false,
  });
  
  // Toggle expanded state for a menu item
  const toggleExpanded = (key: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  
  // Check if a path is active
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };
  
  // Check if a menu item should be visible based on user role
  const isVisible = (item: NavItem) => {
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    return userRole && item.roles.includes(userRole);
  };
  
  // Handle navigation
  const handleNavigation = (path: string) => {
    router.push(path);
    if (closeDrawer && isMobile) {
      closeDrawer();
    }
  };
  
  // Define navigation items
  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: <DashboardIcon />,
    },
    {
      title: 'Invoices',
      path: '/invoices',
      icon: <ReceiptIcon />,
      badge: 5,
      badgeColor: 'error',
    },
    {
      title: 'Inventory',
      path: '/inventory',
      icon: <InventoryIcon />,
      children: [
        {
          title: 'Products',
          path: '/products',
          icon: <InventoryIcon />,
        },
        {
          title: 'Categories',
          path: '/categories',
          icon: <CategoryIcon />,
        },
        {
          title: 'Stock Management',
          path: '/stock',
          icon: <StorefrontIcon />,
          badge: 'Low',
          badgeColor: 'warning',
        },
        // {
        //   title: 'Suppliers',
        //   path: '/suppliers',
        //   icon: <LocalShippingIcon />,
        // },
      ],
    },
    {
      title: 'Parties',
      path: '/parties',
      icon: <PeopleIcon />,
      children: [
        {
          title: 'Customers',
          path: '/parties/',
          icon: <PersonIcon />,
        },
        // {
        //   title: 'Vendors',
        //   path: '/parties/vendors',
        //   icon: <BusinessIcon />,
        // },
        {
          title: 'Staff',
          path: '/parties/staff',
          icon: <GroupIcon />,
          roles: ['admin'],
        },
      ],
    },
    {
      title: 'Purchases',
      path: '/purchases', 
      roles: ['admin'],
      icon: <ShoppingCartIcon />,
    },
    {
      title: 'Finance',
      path: '/finance',
      icon: <AccountBalanceIcon />,
      children: [
        {
          title: 'Payments',
          path: '/finance/payments',
          icon: <PaymentsIcon />,
        },
        {
          title: 'Expenses',
          path: '/finance/expenses',
          icon: <AttachMoneyIcon />,
        },
        {
          title: 'Banking',
          path: '/finance/banking',
          icon: <AccountBalanceIcon />,
          roles: ['admin', 'manager'],
        },
      ],
    },
    {
      title: 'Reports',
      path: '/reports',
      icon: <AssessmentIcon />,
      children: [
        {
          title: 'Sales Reports',
          path: '/reports/sales',
          icon: <BarChartIcon />,
        },
        {
          title: 'Inventory Reports',
          path: '/reports/inventory',
          icon: <InventoryIcon />,
        },
        {
          title: 'Financial Reports',
          path: '/reports/financial',
          icon: <TrendingUpIcon />,
          roles: ['admin', 'manager'],
        },
      ],
    },
    {
      title: 'Analytics',
      path: '/analytics',
      icon: <BarChartIcon />,
    },
    {
      title: 'User Engagement',
      path: '/engagement',
      icon: <TouchAppIcon />,
    },
    {
      divider: true,
      title: '',
      path: '',
      icon: <></>,
    },
    {
      title: 'Settings',
      path: '/settings',
      icon: <SettingsIcon />,
      
    },
    {
      title: 'Help & Support',
      path: '/help',
      icon: <HelpIcon />,
    },
    {
      title: 'About',
      path: '/about',
      icon: <InfoIcon />,
    },
  ];
  
  // Render a navigation item with support for collapsed state
  const renderNavItem = (item: NavItem, level: number = 0) => {
    // Skip if not visible based on role
    if (!isVisible(item)) {
      return null;
    }
    
    // Render divider
    if (item.divider) {
      return <Divider key={`divider-${level}`} sx={{ my: 1.5 }} />;
    }
    
    const active = isActive(item.path);
    const hasChildren = item.children && item.children.length > 0;
    const expanded = hasChildren && expandedItems[item.title.toLowerCase()];
    
    // Determine if any child is active
    const isChildActive = hasChildren && item.children?.some(child => isActive(child.path));
    
    return (
      <React.Fragment key={item.path}>
        <ListItem 
          disablePadding 
          sx={{ 
            display: 'block',
            mb: 0.5,
          }}
        >
          <ListItemButton
            onClick={() => {
              if (hasChildren) {
                toggleExpanded(item.title.toLowerCase());
              } else {
                handleNavigation(item.path);
              }
            }}
            sx={{
              minHeight: { xs: 44, sm: 48 },
              px: collapsed ? 2 : 2.5,
              py: { xs: 0.75, sm: 1 },
              borderRadius: 1.5,
              mx: collapsed ? 0.5 : 1,
              justifyContent: collapsed ? 'center' : 'flex-start',
              ...(active && !hasChildren && {
                bgcolor: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.primary.main, 0.2) 
                  : alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.primary.main, 0.3) 
                    : alpha(theme.palette.primary.main, 0.2),
                },
                '& .MuiListItemIcon-root': {
                  color: theme.palette.primary.main,
                },
              }),
              ...(isChildActive && {
                color: theme.palette.mode === 'dark' 
                  ? theme.palette.primary.light 
                  : theme.palette.primary.main,
                '& .MuiListItemIcon-root': {
                  color: theme.palette.mode === 'dark' 
                    ? theme.palette.primary.light 
                    : theme.palette.primary.main,
                },
              }),
            }}
          >
            <Tooltip title={collapsed ? item.title : ""} placement="right" arrow>
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: collapsed ? 0 : 2,
                  justifyContent: 'center',
                  color: active || isChildActive 
                    ? theme.palette.primary.main 
                    : theme.palette.text.secondary,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                }}
              >
                {item.icon}
              </ListItemIcon>
            </Tooltip>
            {!collapsed && (
              <ListItemText 
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: active || isChildActive ? 600 : 400,
                        fontSize: { xs: '0.875rem', sm: '0.875rem' }
                      }}
                    >
                      {item.title}
                    </Typography>
                    {item.beta && (
                      <Chip 
                        label="Beta" 
                        size="small" 
                        color="secondary" 
                        sx={{ 
                          ml: 1, 
                          height: 20, 
                          fontSize: '0.625rem',
                          '& .MuiChip-label': {
                            px: 0.75,
                          }
                        }} 
                      />
                    )}
                  </Box>
                }
                sx={{ 
                  opacity: 1,
                  '& .MuiTypography-root': {
                    fontWeight: active || isChildActive ? 600 : 400,
                  },
                }}
              />
            )}
            {!collapsed && item.badge && (
              <Badge 
                badgeContent={item.badge} 
                color={item.badgeColor || 'primary'} 
                sx={{ ml: 1 }}
              />
            )}
            {!collapsed && hasChildren && (expanded ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>
        
        {/* Render children if expanded and not collapsed */}
        {hasChildren && !collapsed && (
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map(child => {
                // Skip if not visible based on role
                if (!isVisible(child)) {
                  return null;
                }
                
                const childActive = isActive(child.path);
                
                return (
                  <ListItem 
                    key={child.path} 
                    disablePadding 
                    sx={{ 
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    <ListItemButton
                      onClick={() => handleNavigation(child.path)}
                      sx={{
                        minHeight: { xs: 36, sm: 40 },
                        px: 2.5,
                        py: { xs: 0.5, sm: 0.75 },
                        borderRadius: 1.5,
                        ml: 3,
                        mr: 1,
                        ...(childActive && {
                          bgcolor: theme.palette.mode === 'dark' 
                            ? alpha(theme.palette.primary.main, 0.2) 
                            : alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' 
                              ? alpha(theme.palette.primary.main, 0.3) 
                              : alpha(theme.palette.primary.main, 0.2),
                          },
                          '& .MuiListItemIcon-root': {
                            color: theme.palette.primary.main,
                          },
                        }),
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: 2,
                          justifyContent: 'center',
                          color: childActive 
                            ? theme.palette.primary.main 
                            : theme.palette.text.secondary,
                          fontSize: { xs: '1.125rem', sm: '1.25rem' },
                        }}
                      >
                        {child.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: childActive ? 600 : 400,
                              fontSize: { xs: '0.8125rem', sm: '0.8125rem' }
                            }}
                          >
                            {child.title}
                          </Typography>
                        }
                        sx={{ 
                          opacity: 1,
                          '& .MuiTypography-root': {
                            fontWeight: childActive ? 600 : 400,
                          },
                        }}
                      />
                      {child.badge && (
                        <Badge 
                          badgeContent={child.badge} 
                          color={child.badgeColor || 'primary'} 
                          sx={{ ml: 1 }}
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };
  
  return (
    <List
      sx={{
        width: '100%',
        pt: 1,
        pb: 2,
      }}
    >
      {navItems.map(item => renderNavItem(item))}
    </List>
  );
}