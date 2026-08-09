"use client";
import React, { useState, useMemo, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
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
  ExpandLess,
  ExpandMore,
  Category as CategoryIcon,
  Store as StoreIcon,
  Help as HelpIcon,
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  Payments as PaymentsIcon,
  LocalShipping as LocalShippingIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  Security as SecurityIcon,
  Tune as TuneIcon,
  Palette as PaletteIcon,
  Notifications as NotificationsSettingsIcon,
  Language as LanguageIcon,
  Info as InfoIcon,
  ContactSupport as ContactSupportIcon,
  MenuBook as MenuBookIcon,
  Notifications as NotificationsMainIcon, // Renamed for clarity
} from '@mui/icons-material';
import { usePathname } from 'next/navigation'; // useRouter is not needed here if navigation is handled by DashboardLayout
import { useAuth } from '@/contexts/AuthContext';

interface NavigationProps {
  onItemClick?: (path: string) => void; // Pass path for DashboardLayout to handle navigation
  miniDrawer?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  badge?: number | null;
  permission?: string;
  children?: NavItem[];
  isNew?: boolean;
}

// Navigation data (can be moved to a separate file if large)
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
        title: "Settings", path: "/settings", icon: <SettingsIcon />,
        children: [
          { title: "General", path: "/settings/general", icon: <TuneIcon /> },
          { title: "Appearance", path: "/settings/appearance", icon: <PaletteIcon /> },
          { title: "Notifications", path: "/settings/notifications", icon: <NotificationsSettingsIcon /> },
          { title: "Language", path: "/settings/language", icon: <LanguageIcon /> }
        ]
      },
      {
        title: "Help & Support", path: "/help-desk", icon: <HelpIcon />, // Updated path
        children: [
          { title: "Documentation", path: "/help-desk/docs", icon: <MenuBookIcon /> },
          { title: "FAQs", path: "/help-desk/faqs", icon: <InfoIcon /> },
          { title: "Contact Support", path: "/help-desk/contact", icon: <ContactSupportIcon /> }
        ]
      },
      { title: "Notifications", path: "/notifications", icon: <NotificationsMainIcon />, badge: 3 }
    ]
  }
];


export default function ImprovedNavigation({ onItemClick, miniDrawer = false }: NavigationProps) {
  const pathname = usePathname();
  const { hasPermission } = useAuth(); // Assuming useAuth provides hasPermission
  const theme = useTheme();

  const isActivePath = (path: string) => pathname === path;

  const isActivePathOrChild = useMemo(() => (itemPath: string, children?: NavItem[]): boolean => {
    if (isActivePath(itemPath) && !children) return true; // Exact match for non-parent items
    if (children?.some(child => isActivePath(child.path))) return true; // Any child is active
    // Check if current pathname starts with the item's path (for parent section highlighting when parent itself is a page)
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

  // Effect to update expanded state if pathname changes and initial state needs re-evaluation
   useEffect(() => {
    setExpandedSections(initialExpandedState);
  }, [initialExpandedState]);


  const handleLocalItemClick = (path: string) => {
    if (onItemClick) {
      onItemClick(path); // Notify DashboardLayout to handle navigation and potentially close mobile drawer
    }
  };

  const handleSectionToggle = (sectionKey: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };


  const renderNavItem = (item: NavItem, isSubItem: boolean = false) => {
    if (item.permission && !hasPermission('page', item.permission)) { // Ensure hasPermission is correctly implemented
      return null;
    }

    const sectionKey = item.title.toLowerCase().replace(/\s+/g, '-');
    const isCurrentlyActive = isActivePathOrChild(item.path, item.children);
    // A section is expanded if explicitly toggled OR if it's active (and has children, and not in mini mode)
    const isEffectivelyExpanded = !miniDrawer && item.children && (expandedSections[sectionKey] || (isCurrentlyActive && !isActivePath(item.path)));


    const itemStyle = {
      borderRadius: theme.shape.borderRadius * 1.5,
      mb: 0.5,
      py: miniDrawer && !isSubItem ? 1.5 : (isSubItem ? 1 : 1.25),
      px: miniDrawer && !isSubItem ? 1.5 : (isSubItem ? 2 : 2), // Subitems get normal padding, parent items in mini mode get less
      pl: isSubItem ? (miniDrawer ? 2 : 4) : (miniDrawer ? 1.5 : 2), // Indent subitems
      transition: theme.transitions.create(['background-color', 'color', 'transform', 'opacity'], {
        duration: theme.transitions.duration.short,
      }),
      position: 'relative', // For the active indicator ::before
      overflow: 'hidden',
      color: theme.palette.text.secondary,

      '&:hover': {
        backgroundColor: alpha(theme.palette.action.hover, 0.08),
        color: theme.palette.primary.main,
        transform: miniDrawer ? 'scale(1.05)' : 'translateX(3px)',
        '& .MuiListItemIcon-root': {
          color: theme.palette.primary.main,
        },
      },
      '&.Mui-selected': {
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        color: theme.palette.primary.main,
        '& .MuiListItemIcon-root': {
          color: theme.palette.primary.main,
        },
        '& .MuiListItemText-primary': {
          fontWeight: theme.typography.fontWeightMedium,
          color: theme.palette.primary.main,
        },
        // Active indicator bar
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: '15%',
          bottom: '15%',
          width: '4px',
          backgroundColor: theme.palette.primary.main,
          borderTopRightRadius: '4px',
          borderBottomRightRadius: '4px',
        },
      },
    };

    return (
      <React.Fragment key={item.path + '-' + item.title}>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            selected={isCurrentlyActive}
            onClick={() => {
              if (item.children) {
                if (!miniDrawer) handleSectionToggle(sectionKey);
                // If parent itself is a navigable link and not just a toggle, handle click
                // For now, clicking parent only toggles. If it should also navigate:
                // if (item.path && (isActivePath(item.path) || !item.children.some(c => isActivePath(c.path)))) {
                //   handleLocalItemClick(item.path);
                // }
              } else {
                handleLocalItemClick(item.path);
              }
            }}
            sx={itemStyle}
            aria-current={isActivePath(item.path) && !item.children ? "page" : undefined}
            aria-expanded={!miniDrawer && item.children ? isEffectivelyExpanded : undefined}
          >
            <ListItemIcon
              aria-hidden="true"
              sx={{
                minWidth: 0,
                mr: miniDrawer ? 'auto' : 2, // Center icon in mini mode, else provide space
                ml: miniDrawer ? 'auto' : 0,
                justifyContent: 'center',
                color: 'inherit', // Inherit color from ListItemButton
                fontSize: isSubItem ? '1.25rem' : '1.5rem', // Smaller icons for sub-items
              }}
            >
              {item.badge && !miniDrawer ? ( // Badge only if not miniDrawer
                <Badge badgeContent={item.badge} color="error" overlap="circular">
                  {React.cloneElement(item.icon as React.ReactElement, { sx: { fontSize: 'inherit' }})}
                </Badge>
              ) : (
                 React.cloneElement(item.icon as React.ReactElement, { sx: { fontSize: 'inherit' }})
              )}
            </ListItemIcon>
            <ListItemText
              primary={item.title}
              sx={{
                opacity: miniDrawer ? 0 : 1,
                width: miniDrawer ? 0 : 'auto',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: 'inherit', // Inherit color
                '& .MuiListItemText-primary': {
                   fontWeight: isCurrentlyActive ? theme.typography.fontWeightMedium : theme.typography.fontWeightRegular,
                   fontSize: isSubItem ? '0.875rem' : '0.95rem',
                }
              }}
              primaryTypographyProps={{
                component: 'div', // To allow Box inside for chip
                sx: { display: 'flex', alignItems: 'center' }
              }}
            >
              <Box component="span" sx={{ flexGrow: 1 }}>{item.title}</Box>
              {!miniDrawer && item.isNew && (
                <Chip
                  label="New"
                  size="small"
                  color="secondary"
                  sx={{ ml: 1, height: 18, fontSize: '0.65rem', flexShrink: 0 }}
                />
              )}
            </ListItemText>
            {!miniDrawer && item.children && (
              isEffectivelyExpanded ? <ExpandLess sx={{ color: 'inherit' }} /> : <ExpandMore sx={{ color: 'inherit' }} />
            )}
          </ListItemButton>
        </ListItem>

        {!miniDrawer && item.children && (
          <Collapse in={isEffectivelyExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 2 }}> {/* Indent sub-list container */}
              {item.children.map(child => renderNavItem(child, true))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      {navigationSectionsData.map((section, index) => (
        <React.Fragment key={section.title + '-' + index}>
          {!miniDrawer && (
            <Typography
              variant="overline"
              sx={{
                px: 2,
                pt: index === 0 ? 1.5 : 2.5,
                pb: 0.5,
                display: 'block',
                color: theme.palette.text.secondary,
                fontWeight: 600,
                fontSize: '0.7rem',
                letterSpacing: '0.5px',
              }}
            >
              {section.title}
            </Typography>
          )}
          <List
            component="nav"
            aria-label={`${section.title} navigation links`}
            sx={{
              px: miniDrawer ? 0.5 : 1, // Padding for the list itself
              pb: 1,
            }}
          >
            {section.items.map(item => renderNavItem(item))}
          </List>
          {!miniDrawer && index < navigationSectionsData.length - 1 && (
            <Divider sx={{ mx: 2, my: 1, borderColor: alpha(theme.palette.divider, 0.6) }} />
          )}
        </React.Fragment>
      ))}
    </Box>
  );
}