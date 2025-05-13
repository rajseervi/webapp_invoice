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
  Box
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
  Info as InfoIcon,
  ContactSupport as ContactSupportIcon,
  MenuBook as MenuBookIcon
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import PermissionGuard from '@/components/PermissionGuard';

interface NavigationProps {
  onItemClick?: () => void;
  miniDrawer?: boolean;
}

// Define section interface
interface NavSection {
  title: string;
  items: NavItem[];
}

// Define navigation item interface
// Update your NavItem interface
interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  badge?: number | null;
  permission?: string;
  children?: NavItem[];
  isNew?: boolean; // Add this property
}



// Update your renderNavItem function to show "New" chip
const renderNavItem = (item: NavItem) => {
  // Check if user has permission for this item
  if (item.permission && !hasPermission('page', item.permission)) {
    return null;
  }

  const isItemActive = isActive(item.path);
  const isItemSectionActive = item.children ? 
    item.children.some(child => isActive(child.path)) || isActiveSection(item.path) : 
    false;
  
  const sectionKey = item.title.toLowerCase().replace(/\s+/g, '-');
  const isExpanded = expandedSections[sectionKey];
  const shouldExpand = isExpanded || isItemSectionActive;

  return (
    <React.Fragment key={item.path}>
      <ListItem disablePadding>
        <Tooltip title={miniDrawer ? item.title : ""} placement="right" arrow>
          <ListItemButton 
            onClick={() => {
              if (item.children) {
                handleSectionToggle(sectionKey);
              } else {
                handleNavigation(item.path);
              }
            }}
            selected={isItemActive || isItemSectionActive}
            sx={{
              ...menuItemStyles,
              justifyContent: miniDrawer ? 'center' : 'flex-start',
            }}
          >
            <ListItemIcon>
              {item.badge ? (
                <Badge badgeContent={item.badge} color="error">
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )}
            </ListItemIcon>
            <ListItemText 
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {item.title}
                  {!miniDrawer && item.isNew && (
                    <Chip 
                      label="New" 
                      size="small" 
                      color="secondary" 
                      sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                    />
                  )}
                </Box>
              } 
              primaryTypographyProps={{ 
                fontWeight: isItemActive || isItemSectionActive ? 600 : 400 
              }}
            />
            {!miniDrawer && item.children && (
              shouldExpand ? <ExpandLess /> : <ExpandMore />
            )}
          </ListItemButton>
        </Tooltip>
      </ListItem>
      
        {item.children && (
          <Collapse in={shouldExpand && !miniDrawer} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map(child => (
                <ListItem key={child.path} disablePadding>
                  <ListItemButton 
                    onClick={() => handleNavigation(child.path)}
                    selected={isActive(child.path)}
                    sx={submenuItemStyles}
                  >
                    <ListItemIcon>
                      {React.cloneElement(child.icon as React.ReactElement, { fontSize: "small" })}
                    </ListItemIcon>
                    <ListItemText 
                      primary={child.title} 
                      primaryTypographyProps={{ 
                        fontWeight: isActive(child.path) ? 600 : 400,
                        fontSize: '0.9rem'
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
};

// Then mark some items as new in your navigation sections
// For example:


export default function ImprovedNavigation({ onItemClick, miniDrawer = false }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { userRole, hasPermission } = useAuth();
  const theme = useTheme();
  
  // State for expandable sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    inventory: false,
    reports: false,
    settings: false,
    help: false
  });
  
  // Check if current path is active
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  // Check if current path is in a section
  const isActiveSection = (path: string) => {
    return pathname?.startsWith(path);
  };
  
  // Handle navigation
  const handleNavigation = (path: string) => {
    router.push(path);
    if (onItemClick) {
      onItemClick();
    }
  };
  
  // Toggle section expansion
  const handleSectionToggle = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Define navigation sections
  const navigationSections: NavSection[] = [
    {
      title: "Main",
      items: [
        {
          title: "Dashboard",
          path: "/dashboard",
          icon: <DashboardIcon />
        }
      ]
    },
    {
      title: "Sales",
      items: [
        {
          title: "Orders",
          path: "/orders",
          icon: <ShoppingCartIcon />,
          isNew: true,
          children: [
            {
              title: "All Orders",
              path: "/orders",
              icon: <ShoppingCartIcon />
            },
            {
              title: "Create Order",
              path: "/orders/new",
              icon: <ShoppingCartIcon />
            }
          ]
        },
        {
          title: "Invoices",
          path: "/invoices",
          icon: <ReceiptIcon />,
          badge: 5,
          // permission: "invoices",
          children: [
            {
              title: "All Invoices",
              path: "/invoices",
              icon: <ReceiptIcon />
            },
            {
              title: "Create Invoice",
              path: "/invoices/new",
              icon: <ReceiptIcon />
            },
            
          ]
        },
        {
          title: "Payments",
          path: "/payments",
          icon: <PaymentsIcon />,
          permission: "payments"
        },
        {
          title: "Customers",
          path: "/parties",
          icon: <PeopleIcon />
        },
      ]
    },
    {
      title: "Inventory",
      items: [
        {
          title: "Products",
          path: "/products",
          icon: <StoreIcon />
        },
        {
          title: "Categories",
          path: "/categories",
          icon: <CategoryIcon />
        },
        {
          title: "Purchase Orders",
          path: "/purchase-orders",
          icon: <ShoppingCartIcon />,
          permission: "purchase-orders"
        },
        {
          title: "Suppliers",
          path: "/suppliers",
          icon: <LocalShippingIcon />,
          permission: "suppliers"
        }
      ]
    },
    {
      title: "Reports",
      items: [
        {
          title: "Sales Reports",
          path: "/reports/sales",
          icon: <BarChartIcon />,
          permission: "reports",
          children: [
            {
              title: "Daily Sales",
              path: "/reports/sales/daily",
              icon: <TrendingUpIcon />
            },
            {
              title: "Monthly Sales",
              path: "/reports/sales/monthly",
              icon: <TrendingUpIcon />
            },
            {
              title: "Yearly Sales",
              path: "/reports/sales/yearly",
              icon: <TrendingUpIcon />
            }
          ]
        },
        {
          title: "Inventory Reports",
          path: "/reports/inventory",
          icon: <AssessmentIcon />,
          permission: "reports"
        },
        {
          title: "Financial Reports",
          path: "/reports/financial",
          icon: <AttachMoneyIcon />,
          permission: "reports"
        }
      ]
    },
    {
      title: "Administration",
      items: [
        {
          title: "User Management",
          path: "/admin/users",
          icon: <GroupIcon />,
          permission: "admin"
        },
        {
          title: "Business Settings",
          path: "/admin/business",
          icon: <BusinessIcon />,
          permission: "admin"
        },
        {
          title: "Security",
          path: "/admin/security",
          icon: <SecurityIcon />,
          permission: "admin"
        }
      ]
    },
    {
      title: "Settings & Help",
      items: [
        {
          title: "Settings",
          path: "/settings",
          icon: <SettingsIcon />,
          children: [
            {
              title: "General",
              path: "/settings/general",
              icon: <TuneIcon />
            },
            {
              title: "Appearance",
              path: "/settings/appearance",
              icon: <PaletteIcon />
            },
            {
              title: "Notifications",
              path: "/settings/notifications",
              icon: <NotificationsSettingsIcon />
            },
            {
              title: "Language",
              path: "/settings/language",
              icon: <LanguageIcon />
            }
          ]
        },
        {
          title: "Help & Support",
          path: "/help",
          icon: <HelpIcon />,
          children: [
            {
              title: "Documentation",
              path: "/help/docs",
              icon: <MenuBookIcon />
            },
            {
              title: "FAQs",
              path: "/help/faqs",
              icon: <InfoIcon />
            },
            {
              title: "Contact Support",
              path: "/help/contact",
              icon: <ContactSupportIcon />
            }
          ]
        },
        {
          title: "Notifications",
          path: "/notifications",
          icon: <NotificationsIcon />,
          badge: 3
        }
      ]
    }
  ];

  // Common styles for menu items
  const menuItemStyles = {
    borderRadius: 1.5,
    mb: 0.5,
    py: 1.25, // Increased vertical padding
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      height: '100%',
      width: '4px',
      backgroundColor: 'transparent',
      transition: 'all 0.2s ease',
    },
    '& .MuiListItemIcon-root': { // Added transition for icon color
      transition: 'color 0.2s ease',
    },
    '&.Mui-selected': {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
      '&::before': {
        backgroundColor: theme.palette.primary.main,
      },
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.12),
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
      backgroundColor: alpha(theme.palette.primary.main, 0.04),
      transform: 'translateX(4px)',
      '&::before': {
        backgroundColor: alpha(theme.palette.primary.main, 0.5),
      },
      '& .MuiListItemIcon-root': { // Icon color change on hover for non-selected items
        color: theme.palette.primary.main,
      },
    },
  };

  // Submenu item styles
  const submenuItemStyles = {
    ...menuItemStyles,
    pl: 4,
    py: 1, // Increased vertical padding for submenu items
    '&.Mui-selected': {
      ...menuItemStyles['&.Mui-selected'],
      backgroundColor: alpha(theme.palette.primary.main, 0.05),
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
      },
    },
    '&::before': {
      left: '12px',
      width: '2px',
    },
  };

  const listStyles = { 
    px: miniDrawer ? 0.5 : 1.5,
    '& .MuiListItemText-root': {
      opacity: miniDrawer ? 0 : 1,
      transition: theme.transitions.create('opacity', {
        duration: theme.transitions.duration.shorter,
      }),
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: miniDrawer ? 0 : '100%',
      width: miniDrawer ? 0 : 'auto',
    },
    '& .MuiListItemIcon-root': {
      minWidth: miniDrawer ? 0 : 36,
      mr: miniDrawer ? 'auto' : 2,
      ml: miniDrawer ? 'auto' : 0,
      justifyContent: miniDrawer ? 'center' : 'flex-start',
    },
    '& .MuiListItemButton-root': {
      px: miniDrawer ? 1 : 2,
      justifyContent: miniDrawer ? 'center' : 'flex-start',
    },
    '& .MuiCollapse-root': {
      display: miniDrawer ? 'none' : 'block',
    },
    '& .MuiBadge-root': {
      '& .MuiBadge-badge': {
        right: miniDrawer ? -3 : -10,
      }
    },
    '& .MuiChip-root': {
      display: miniDrawer ? 'none' : 'flex',
    },
  };

  // Render a navigation item
  const renderNavItem = (item: NavItem) => {
    // Check if user has permission for this item
    if (item.permission && !hasPermission('page', item.permission)) {
      return null;
    }

    const isItemActive = isActive(item.path);
    const isItemSectionActive = item.children ? 
      item.children.some(child => isActive(child.path)) || isActiveSection(item.path) : 
      false;
    
    const sectionKey = item.title.toLowerCase().replace(/\s+/g, '-');
    const isExpanded = expandedSections[sectionKey];
    const shouldExpand = isExpanded || isItemSectionActive;

    return (
      <React.Fragment key={item.path}>
        <ListItem disablePadding>
          <Tooltip title={miniDrawer ? item.title : ""} placement="right" arrow>
            <ListItemButton 
              onClick={() => {
                if (item.children) {
                  handleSectionToggle(sectionKey);
                } else {
                  handleNavigation(item.path);
                }
              }}
              selected={isItemActive || isItemSectionActive}
              sx={{
                ...menuItemStyles,
                justifyContent: miniDrawer ? 'center' : 'flex-start',
              }}
            >
              <ListItemIcon>
                {item.badge ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText 
                primary={item.title} 
                primaryTypographyProps={{ 
                  fontWeight: isItemActive || isItemSectionActive ? 600 : 400 
                }}
              />
              {!miniDrawer && item.children && (
                shouldExpand ? <ExpandLess /> : <ExpandMore />
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
        
        {item.children && (
          <Collapse in={shouldExpand && !miniDrawer} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map(child => (
                <ListItem key={child.path} disablePadding>
                  <ListItemButton 
                    onClick={() => handleNavigation(child.path)}
                    selected={isActive(child.path)}
                    sx={submenuItemStyles}
                  >
                    <ListItemIcon>
                      {React.cloneElement(child.icon as React.ReactElement, { fontSize: "small" })}
                    </ListItemIcon>
                    <ListItemText 
                      primary={child.title} 
                      primaryTypographyProps={{ 
                        fontWeight: isActive(child.path) ? 600 : 400,
                        fontSize: '0.9rem'
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Box sx={{ py: 1 }}>
      {navigationSections.map((section, index) => (
        <React.Fragment key={section.title}>
          {/* Section Title */}
          {!miniDrawer && (
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                px: 3, 
                py: 1, 
                display: 'block', 
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                mt: index > 0 ? 2 : 0
              }}
            >
              {section.title}
            </Typography>
          )}
          
          {/* Section Items */}
          <List component="nav" sx={listStyles}>
            {section.items.map(item => renderNavItem(item))}
          </List>
          
          {/* Divider after each section except the last one */}
          {index < navigationSections.length - 1 && !miniDrawer && (
            <Divider sx={{ mx: 2, my: 1 }} />
          )}
        </React.Fragment>
      ))}
    </Box>
  );
}