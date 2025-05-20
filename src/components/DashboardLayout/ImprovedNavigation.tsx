"use client";
import React, { useState, useMemo } from 'react';
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
  Link
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
// import PermissionGuard from '@/components/PermissionGuard'; // Assuming this is used elsewhere or can be removed if not directly used here
interface NavigationProps {
  onItemClick?: () => void;
  miniDrawer?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  title: string;
  path: string; // Path for direct navigation or base path for sections
  icon: React.ReactNode;
  badge?: number | null;
  permission?: string;
  children?: NavItem[];
  isNew?: boolean;
  isExternal?: boolean; // Flag for external links
  description?: string; // Optional description for tooltips
  highlight?: boolean; // Flag to highlight important items
}

export default function ImprovedNavigation({ onItemClick, miniDrawer = false }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { userRole, hasPermission } = useAuth();
  const theme = useTheme();
  
  const initialExpandedState = useMemo(() => {
    const state: Record<string, boolean> = {};
    navigationSections.forEach(section => {
      section.items.forEach(item => {
                if (item.children) {
          const sectionKey = item.title.toLowerCase().replace(/\s+/g, '-');
          if (item.children.some(child => pathname === child.path) || pathname === item.path || pathname?.startsWith(item.path + '/')) {
            state[sectionKey] = true;
                } else {
            state[sectionKey] = false;
                }
        }
      });
    });
    return state;
  }, [pathname]); // Recalculate only if pathname changes

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(initialExpandedState);

  const isActive = (path: string) => pathname === path;

  const isActivePathOrChild = (itemPath: string, children?: NavItem[]): boolean => {
    if (isActive(itemPath)) return true;
    if (children?.some(child => isActive(child.path))) return true;
    // Check if current pathname starts with the item's path (for parent section highlighting)
    if (pathname?.startsWith(itemPath + (itemPath.endsWith('/') ? '' : '/'))) return true;
    return false;
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    if (onItemClick) onItemClick();
  };

  const handleSectionToggle = (sectionKey: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  // Define navigation sections (ensure this is defined before useMemo for initialExpandedState)
  const navigationSections: NavSection[] = [
    {
      title: "Main",
      items: [
        { 
          title: "Dashboard", 
          path: "/dashboard", 
          icon: <DashboardIcon />,
          description: "Overview of your business performance"
        },
        { 
          title: "Analytics", 
          path: "/analytics", 
          icon: <BarChartIcon />,
          highlight: true,
          description: "Detailed analytics and insights"
        }
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
          title: "Invoices", path: "/invoices", icon: <ReceiptIcon />, badge: 5,
          children: [
            { title: "All Invoices", path: "/invoices", icon: <ReceiptIcon /> },
            { title: "Create Invoice", path: "/invoices/new", icon: <ReceiptIcon /> },
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
        { title: "Suppliers", path: "/suppliers", icon: <LocalShippingIcon />, permission: "suppliers" }
      ]
    },
    {
      title: "Reports",
      items: [
        {
          title: "Sales Reports", path: "/reports/sales", icon: <BarChartIcon />, permission: "reports",
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
        { title: "Business Settings", path: "/admin/business", icon: <BusinessIcon />, permission: "admin" },
        { title: "Security", path: "/admin/security", icon: <SecurityIcon />, permission: "admin" }
      ]
    },
    {
      title: "Settings & Help",
      items: [
        {
          title: "Settings", 
          path: "/settings", 
          icon: <SettingsIcon />,
          description: "Configure your application settings",
          children: [
            { title: "General", path: "/settings/general", icon: <TuneIcon /> },
            { title: "Appearance", path: "/settings/appearance", icon: <PaletteIcon /> },
            { title: "Notifications", path: "/settings/notifications", icon: <NotificationsSettingsIcon /> },
            { title: "Language", path: "/settings/language", icon: <LanguageIcon /> }
          ]
        },
        {
          title: "Help & Support", 
          path: "/help", 
          icon: <HelpIcon />,
          description: "Get help and support",
          children: [
            { title: "Documentation", path: "/help/docs", icon: <MenuBookIcon /> },
            { title: "FAQs", path: "/help/faqs", icon: <InfoIcon /> },
            { 
              title: "Knowledge Base", 
              path: "https://example.com/knowledge-base", 
              icon: <MenuBookIcon />,
              isExternal: true,
              description: "Browse our external knowledge base"
            },
            { title: "Contact Support", path: "/help/contact", icon: <ContactSupportIcon /> }
          ]
        },
        { 
          title: "Notifications", 
          path: "/notifications", 
          icon: <NotificationsIcon />, 
          badge: 3,
          description: "View your notifications"
        },
        {
          title: "Visit Website",
          path: "https://example.com",
          icon: <LinkIcon />,
          isExternal: true,
          description: "Visit our main website"
        }
      ]
    }
  ];

  const menuItemStyles = {
    borderRadius: 1.5,
    mb: 0.5,
    py: 1.25,
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', // Smoother animation curve
    position: 'relative',
    overflow: 'hidden', // To contain the ::before pseudo-element
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: '50%',
      transform: 'translateY(-50%) scaleY(0.7)', // Initial scaled state
      height: '60%', // Make border slightly shorter than item height
      width: '4px',
      backgroundColor: 'transparent',
      borderRadius: '0 2px 2px 0', // Rounded end for the border
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: 0, // Start invisible
    },
    '& .MuiListItemIcon-root': {
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      color: alpha(theme.palette.text.primary, 0.7), // Slightly more prominent than secondary
      transform: 'scale(1)', // For hover animation
    },
    '& .MuiListItemText-primary': {
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      color: theme.palette.text.secondary, // Default text color
      letterSpacing: '0',
    },
    '&:hover': {
      backgroundColor: alpha(theme.palette.mode === 'dark' 
        ? theme.palette.background.default 
        : theme.palette.background.paper, 0.1),
      '&::before': {
        opacity: 0.5,
        transform: 'translateY(-50%) scaleY(0.8)',
        backgroundColor: theme.palette.primary.main,
      },
      '& .MuiListItemIcon-root': {
        color: theme.palette.primary.main,
        transform: 'scale(1.05)',
      },
      '& .MuiListItemText-primary': {
        color: theme.palette.mode === 'dark' 
          ? theme.palette.primary.light 
          : theme.palette.primary.dark,
      },
    },
    '&.Mui-selected': {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
      '&::before': {
        backgroundColor: theme.palette.primary.main,
        height: '80%', // Make active border more prominent
        opacity: 1,
        transform: 'translateY(-50%) scaleY(1)',
      },
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.12),
      },
      '& .MuiListItemIcon-root': {
        color: theme.palette.primary.main,
        transform: 'scale(1.1)',
      },
      '& .MuiListItemText-primary': {
                fontWeight: 600,
        color: theme.palette.primary.main,
      },
    },
    '&:hover': {
      backgroundColor: alpha(theme.palette.action.hover, 0.04), // Use theme's action hover
      // transform: 'translateX(2px)', // Subtle shift on hover
      '&::before': { // Show a hint of the border on hover for non-selected
        backgroundColor: alpha(theme.palette.primary.main, 0.3),
      },
      '& .MuiListItemIcon-root': {
        color: theme.palette.primary.main,
      },
      '& .MuiListItemText-primary': {
        color: theme.palette.text.primary, // Make text slightly more prominent on hover
      },
    },
  };

  const submenuItemStyles = {
    ...menuItemStyles,
    pl: miniDrawer ? 1 : 4, // Adjust padding for miniDrawer
    py: 1,
    borderRadius: 1.2, // Slightly smaller radius for sub-items
    '&::before': { // Adjust sub-item indicator
      left: miniDrawer ? '4px' : '16px', // Position based on miniDrawer
      width: '3px', // Slightly thinner indicator for sub-items
      height: '50%', // Shorter indicator for sub-items
      transform: 'translateY(-50%) scaleY(0.6)', // Initial scaled state
    },
    '& .MuiListItemIcon-root': {
      fontSize: '0.9rem', // Smaller icons for sub-items
      transform: 'scale(0.9)', // Start slightly smaller
    },
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.04), // Lighter hover for sub-items
      '& .MuiListItemIcon-root': {
        transform: 'scale(1)', // Grow to normal size on hover
      },
      '&::before': {
        opacity: 0.4,
        transform: 'translateY(-50%) scaleY(0.7)',
      },
    },
    '&.Mui-selected': {
      ...menuItemStyles['&.Mui-selected'],
      backgroundColor: alpha(theme.palette.primary.main, 0.06), // Slightly different active bg for sub-items
      '&::before': {
        backgroundColor: theme.palette.primary.main,
        height: '60%', // Shorter than parent items
        opacity: 1,
        transform: 'translateY(-50%) scaleY(1)',
      },
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.08), // Lighter than parent items
      },
      '& .MuiListItemIcon-root': {
        color: theme.palette.primary.main,
        transform: 'scale(1.05)', // Slightly smaller scale than parent items
      },
    },
    '& .MuiListItemText-primary': {
      fontSize: '0.9rem', // Keep sub-item text slightly smaller
      color: alpha(theme.palette.text.secondary, 0.9), // Slightly more prominent than default secondary
      letterSpacing: '-0.01em', // Tighter letter spacing for sub-items
    },
    '&.Mui-selected .MuiListItemText-primary': {
      color: theme.palette.primary.main, // Active sub-item text color
      fontWeight: 600,
    },
    '&:hover .MuiListItemText-primary': {
      color: theme.palette.mode === 'dark' 
        ? theme.palette.primary.light 
        : theme.palette.primary.main, // Hover sub-item text color
    },
  };

  const listStyles = {
    px: miniDrawer ? 0.5 : 1.5,
    '& .MuiListItemText-root': {
      opacity: miniDrawer ? 0 : 1,
      transition: theme.transitions.create(['opacity', 'width', 'max-width'], {
        duration: theme.transitions.duration.standard,
        easing: theme.transitions.easing.easeInOut,
      }),
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: miniDrawer ? 0 : '100%',
      width: miniDrawer ? 0 : 'auto',
    },
    '& .MuiListItemIcon-root': {
      minWidth: miniDrawer ? 0 : 36, // MUI default is 56, 36 gives more space for text
      mr: miniDrawer ? 'auto' : 1.5, // Reduced margin for tighter layout
      ml: miniDrawer ? 'auto' : 0,
      justifyContent: miniDrawer ? 'center' : 'flex-start',
      transition: theme.transitions.create(['margin', 'min-width', 'transform', 'color'], {
        duration: theme.transitions.duration.standard,
        easing: theme.transitions.easing.easeInOut,
      }),
    },
    '& .MuiListItemButton-root': {
      px: miniDrawer ? 1.5 : 2, // Adjusted padding
      justifyContent: miniDrawer ? 'center' : 'flex-start',
      transition: theme.transitions.create(['padding', 'background-color', 'transform'], {
        duration: theme.transitions.duration.standard,
        easing: theme.transitions.easing.easeInOut,
      }),
    },
    '& .MuiCollapse-root': {
      display: miniDrawer ? 'none' : 'block',
      transition: theme.transitions.create(['height', 'opacity'], {
        duration: theme.transitions.duration.standard,
        easing: theme.transitions.easing.easeInOut,
      }),
      // Add a subtle left border to visually group sub-items under their parent
      '& .MuiList-root': {
        position: 'relative',
        transition: theme.transitions.create(['padding', 'margin'], {
          duration: theme.transitions.duration.standard,
          easing: theme.transitions.easing.easeInOut,
        }),
        '&::before': {
          content: '""',
          position: 'absolute',
          left: miniDrawer ? '0' : '28px', // Align with icon center or text start
          top: 0,
          bottom: 0,
          width: '1px',
          backgroundColor: alpha(theme.palette.divider, 0.5), // Softer divider color
          display: miniDrawer ? 'none' : 'block',
          transition: theme.transitions.create(['opacity', 'background-color'], {
            duration: theme.transitions.duration.standard,
            easing: theme.transitions.easing.easeInOut,
          }),
        }
      }
    },
    '& .MuiBadge-root': {
      '& .MuiBadge-badge': {
        right: miniDrawer ? -2 : -8, // Adjusted badge position
        top: miniDrawer ? 8 : 10,
        transform: miniDrawer ? 'scale(0.8) translate(50%, -50%)' : 'scale(1) translate(50%, -50%)',
        transition: theme.transitions.create(['transform', 'background-color'], {
          duration: theme.transitions.duration.standard,
          easing: theme.transitions.easing.easeInOut,
        }),
        boxShadow: '0 0 0 2px ' + (theme.palette.mode === 'dark' 
          ? theme.palette.background.paper 
          : theme.palette.background.default),
      }
    },
    '& .MuiChip-root': {
      display: miniDrawer ? 'none' : 'inline-flex', // Use inline-flex for proper alignment
      height: '20px',
      fontSize: '0.65rem', // Smaller chip text
      padding: '0 6px',
      marginLeft: 1,
      flexShrink: 0, // Prevent chip from shrinking
    },
  };

  const renderNavItem = (item: NavItem) => {
    if (item.permission && !hasPermission('page', item.permission)) {
      return null;
    }

    const sectionKey = item.title.toLowerCase().replace(/\s+/g, '-');
    const isCurrentlyActive = isActivePathOrChild(item.path, item.children);
    const isExpanded = expandedSections[sectionKey] === undefined ? isCurrentlyActive : expandedSections[sectionKey]; // Default to active if not explicitly set

    const isDirectlyActivePage = isActive(item.path) && !item.children; // True if this item itself is the active page
    
    // Determine if this is an external link
    const isExternalLink = item.isExternal || item.path.startsWith('http');
    
    // Enhanced tooltip content with description
    const tooltipContent = item.description 
      ? <Box>
          <Typography variant="subtitle2">{item.title}</Typography>
          <Typography variant="caption">{item.description}</Typography>
        </Box>
      : miniDrawer ? item.title : "";

    return (
      <React.Fragment key={item.path + '-' + item.title}> {/* More unique key */}
        <ListItem 
          disablePadding 
          sx={{ 
            position: 'relative',
            mb: 0.5,
            // Add a subtle indicator for highlighted items
            ...(item.highlight && {
              '&::before': {
                content: '""',
                position: 'absolute',
                left: -8,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 4,
                height: 20,
                borderRadius: '0 4px 4px 0',
                backgroundColor: theme.palette.primary.main,
                opacity: 0.7,
                transition: 'all 0.2s ease',
              }
            })
          }}
        >
          <Tooltip 
            title={tooltipContent} 
            placement="right" 
            arrow
            enterDelay={700}
          >
            {isExternalLink ? (
              // External link
              <Link
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                underline="none"
                sx={{ width: '100%', color: 'inherit' }}
              >
                <ListItemButton
                  role="menuitem"
                  component="span"
                  sx={{
                    ...menuItemStyles,
                    justifyContent: miniDrawer ? 'center' : 'flex-start',
                    // Add subtle indicator for external links
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      right: 8,
                      top: 8,
                      width: 6,
                      height: 6,
                      borderTop: `2px solid ${theme.palette.text.secondary}`,
                      borderRight: `2px solid ${theme.palette.text.secondary}`,
                      opacity: 0.5,
                    }
                  }}
                >
                  <ListItemIcon aria-hidden="true">
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
                      <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                        <Typography 
                          variant="body2" 
                          component="span" 
                          noWrap 
                          sx={{ 
                            flexGrow: 1, 
                            fontWeight: 400,
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {item.title}
                        </Typography>
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
                  />
                  {!miniDrawer && <LinkIcon fontSize="small" sx={{ ml: 1, opacity: 0.5, fontSize: '0.9rem' }} />}
                </ListItemButton>
              </Link>
            ) : (
              // Internal link or section
              <ListItemButton
                role="menuitem"
                aria-current={isDirectlyActivePage ? "page" : undefined}
                aria-expanded={item.children ? isExpanded : undefined}
                onClick={() => {
                  if (item.children) {
                    handleSectionToggle(sectionKey);
                    // If parent itself is a link and no child is active, navigate
                    if (item.path && !item.children.some(child => isActive(child.path))) {
                      handleNavigation(item.path);
                    }
                  } else {
                    handleNavigation(item.path);
                  }
                }}
                selected={isCurrentlyActive}
                sx={{
                  ...menuItemStyles,
                  justifyContent: miniDrawer ? 'center' : 'flex-start',
                  // Enhanced active state with left border indicator
                  ...(isCurrentlyActive && {
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3,
                      height: '70%',
                      borderRadius: '0 4px 4px 0',
                      backgroundColor: theme.palette.primary.main,
                      transition: 'all 0.2s ease',
                    }
                  })
                }}
              >
                <ListItemIcon 
                  aria-hidden="true"
                  sx={{
                    transition: 'all 0.2s ease',
                    color: isCurrentlyActive ? theme.palette.primary.main : 'inherit',
                  }}
                >
                  {item.badge ? (
                    <Badge 
                      badgeContent={item.badge} 
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          transition: 'all 0.2s ease',
                        }
                      }}
                    >
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                      <Typography 
                        variant="body2" 
                        component="span" 
                        noWrap 
                        sx={{ 
                          flexGrow: 1, 
                          fontWeight: isCurrentlyActive ? 600 : 400,
                          transition: 'all 0.2s ease',
                          color: isCurrentlyActive ? theme.palette.primary.main : 'inherit',
                        }}
                      >
                        {item.title}
                      </Typography>
                      {!miniDrawer && (
                        <>
                          {item.isNew && (
                            <Chip
                              label="New"
                              size="small"
                              color="secondary"
                              sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                          {item.highlight && !item.isNew && (
                            <Chip
                              label="Featured"
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </>
                      )}
                    </Box>
                  }
                />
                {!miniDrawer && item.children && (
                  <Box 
                    component={isExpanded ? ExpandLess : ExpandMore} 
                    sx={{ 
                      transition: 'transform 0.3s ease',
                      transform: isExpanded ? 'rotate(0deg)' : 'rotate(0deg)',
                      color: isCurrentlyActive ? theme.palette.primary.main : 'inherit',
                    }} 
                  />
                )}
              </ListItemButton>
            )}
          </Tooltip>
        </ListItem>

        {item.children && (
          <Collapse 
            in={isExpanded && !miniDrawer} 
            timeout="auto" 
            unmountOnExit
            sx={{ 
              transition: 'all 0.3s ease-in-out',
            }}
          >
            <List 
              component="div" 
              disablePadding 
              sx={{ 
                pl: miniDrawer ? 0 : 1,
                ml: 1,
                borderLeft: `1px dashed ${alpha(theme.palette.divider, 0.5)}`,
                transition: 'all 0.2s ease',
              }}
            >
              {item.children.map(child => {
                const isChildActive = isActive(child.path);
                const isChildExternal = child.isExternal || child.path.startsWith('http');
                
                // Enhanced tooltip for child items
                const childTooltipContent = child.description 
                  ? <Box>
                      <Typography variant="subtitle2">{child.title}</Typography>
                      <Typography variant="caption">{child.description}</Typography>
                    </Box>
                  : miniDrawer ? child.title : "";
                
                return (
                  <ListItem key={child.path} disablePadding>
                    <Tooltip 
                      title={childTooltipContent} 
                      placement="right" 
                      arrow
                      enterDelay={700}
                    >
                      {isChildExternal ? (
                        // External child link
                        <Link
                          href={child.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="none"
                          sx={{ width: '100%', color: 'inherit' }}
                        >
                          <ListItemButton
                            component="span"
                            sx={{
                              ...submenuItemStyles,
                              position: 'relative',
                              '&::after': {
                                content: '""',
                                position: 'absolute',
                                right: 8,
                                top: 8,
                                width: 5,
                                height: 5,
                                borderTop: `2px solid ${theme.palette.text.secondary}`,
                                borderRight: `2px solid ${theme.palette.text.secondary}`,
                                opacity: 0.5,
                              }
                            }}
                          >
                            <ListItemIcon aria-hidden="true">
                              {React.cloneElement(child.icon as React.ReactElement, { 
                                sx: { fontSize: "1.25rem" } 
                              })}
                            </ListItemIcon>
                            <ListItemText
                              primary={child.title}
                              primaryTypographyProps={{
                                fontWeight: 400,
                                fontSize: '0.875rem',
                              }}
                            />
                            <LinkIcon fontSize="small" sx={{ ml: 1, opacity: 0.5, fontSize: '0.8rem' }} />
                          </ListItemButton>
                        </Link>
                      ) : (
                        // Internal child link
                        <ListItemButton
                          role="menuitem"
                          aria-current={isChildActive ? "page" : undefined}
                          onClick={() => handleNavigation(child.path)}
                          selected={isChildActive}
                          sx={{
                            ...submenuItemStyles,
                            position: 'relative',
                            '&::before': {
                              content: isChildActive ? '""' : 'none',
                              position: 'absolute',
                              left: 0,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: 3,
                              height: '50%',
                              borderRadius: '0 4px 4px 0',
                              backgroundColor: theme.palette.primary.main,
                              transition: 'all 0.2s ease',
                            }
                          }}
                        >
                          <ListItemIcon 
                            aria-hidden="true"
                            sx={{
                              transition: 'all 0.2s ease',
                              color: isChildActive ? theme.palette.primary.main : 'inherit',
                            }}
                          >
                            {React.cloneElement(child.icon as React.ReactElement, { 
                              sx: { 
                                fontSize: "1.25rem",
                                transition: 'all 0.2s ease',
                              } 
                            })}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography 
                                  variant="body2" 
                                  component="span" 
                                  noWrap 
                                  sx={{ 
                                    fontSize: '0.875rem',
                                    fontWeight: isChildActive ? 600 : 400,
                                    transition: 'all 0.2s ease',
                                    color: isChildActive ? theme.palette.primary.main : 'inherit',
                                  }}
                                >
                                  {child.title}
                                </Typography>
                                {child.isNew && (
                                  <Chip
                                    label="New"
                                    size="small"
                                    color="secondary"
                                    sx={{ ml: 1, height: 16, fontSize: '0.65rem' }}
                                  />
                                )}
                              </Box>
                            }
                          />
                        </ListItemButton>
                      )}
                    </Tooltip>
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
    <Box sx={{ py: 1, overflowY: 'auto', overflowX: 'hidden', height: '100%' }}> {/* Ensure vertical scroll if content overflows */}
      {navigationSections.map((section, index) => (
        <React.Fragment key={section.title + '-' + index}>
          {!miniDrawer && (
            <Typography
              variant="overline" // Changed to overline for a common section title style
              color="text.secondary"
              sx={{
                px: 3,
                pt: index > 0 ? 2.5 : 1.5, // Adjusted padding
                pb: 0.5,
                display: 'block',
                fontWeight: 600,
                // textTransform: 'uppercase', // overline is already uppercase
                letterSpacing: '0.5px',
              }}
            >
              {section.title}
            </Typography>
          )}

          <List component="nav" aria-label={`${section.title} navigation`} sx={listStyles}>
            {section.items.map(item => renderNavItem(item))}
          </List>

          {index < navigationSections.length - 1 && !miniDrawer && (
            <Divider sx={{ mx: 2, my: 1.5, borderColor: alpha(theme.palette.divider, 0.5) }} /> // Softer divider
          )}
        </React.Fragment>
      ))}
    </Box>
  );
}