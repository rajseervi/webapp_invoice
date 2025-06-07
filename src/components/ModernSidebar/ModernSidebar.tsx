"use client";
import React, { useState, useEffect } from 'react';
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
  Notifications as NotificationsIcon,
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
  Language as LanguageIcon,
  Info as InfoIcon,
  ContactSupport as ContactSupportIcon,
  MenuBook as MenuBookIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';

// Optional: Import auth context if available
import Link from "next/link"

// import { useAuth } from '@/contexts/AuthContext';

// Constants
const DRAWER_WIDTH = 280;
const MINI_DRAWER_WIDTH = 80;

// Types
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

interface ModernSidebarProps {
  onToggle?: () => void;
  isOpen?: boolean;
  onMobileClose?: () => void;
  userAvatar?: string;
  userName?: string;
  userRole?: string;
}

const ModernSidebar: React.FC<ModernSidebarProps> = ({
  onToggle,
  isOpen = true,
  onMobileClose,
  userAvatar,
  userName = "John Doe",
  userRole = "Admin",
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  // Check if screen is mobile
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // State for mini sidebar (collapsed state)
  const [miniSidebar, setMiniSidebar] = useState(false);

  // Handle sidebar toggle
  const handleToggleSidebar = () => {
    console.log('handleToggleSidebar called'); // Log when the function is called
    if (onToggle) {
      console.log('Calling onToggle prop'); // Log if using the prop
      onToggle();
    } else {
      console.log('Toggling miniSidebar state. Current:', miniSidebar, 'New:', !miniSidebar); // Log state change if using internal state
      setMiniSidebar(!miniSidebar);
    }
  };

  // Effect to handle mobile view
  useEffect(() => {
    console.log('isMobile changed:', isMobile); // Log when isMobile changes
    if (isMobile) {
      console.log('Setting miniSidebar to false on mobile');
      setMiniSidebar(false);
    }
  }, [isMobile]);

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
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };
  
  // Toggle section expansion
  const handleSectionToggle = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    return userName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Navigation sections
  const navigationSections: NavSection[] = [
    {
      title: "Main",
      items: [
        {
          title: "Dashboardss",
          path: "/admin/dashboard", // Updated path
          icon: <DashboardIcon />
        },
        {
          title: "Sales",
          path: "/invoices",
          icon: <TrendingUpIcon /> // Added a relevant icon
        },
        {
          title: "Order", // Changed from "Orders" to "Order"
          path: "/orders",
          icon: <ShoppingCartIcon />
        },
        {
          title: "Inventory",
          path: "/inventory",
          icon: <InventoryIcon />
        },
        {
          title: "Parties",
          path: "/parties",
          icon: <PeopleIcon />
        },
        {
          title: "Reports",
          path: "/reports",
          icon: <AssessmentIcon />
        },
        {
          title: "Users",
          path: "/users",
          icon: <GroupIcon /> // Added a relevant icon
        },
    
        {
          title: "Products",
          path: "/products",
          icon: <StoreIcon />
        },
        {
          title: "Categories",
          path: "/categories",
          icon: <CategoryIcon />
        },  {
          title: "Payments",
          path: "/accounting",
          icon: <PaymentsIcon />,
        },
        {
          title: "Financial Reports",
          path: "/reports/financial",
          icon: <AttachMoneyIcon />
        },  
        {
           title: "Settings",
            path: "/settings",
            icon: <SettingsIcon />
        },

      ]
    }
    // ... You might have other sections here, I'm keeping the existing structure for "Sales" as an example if it was more complex
    // If the original "Sales" section had children, you'd integrate the new "Sales" link appropriately or remove the old one.
    // For this example, I'm assuming a simple list of items under "Main" as per your request.
    // {
    //   title: "Sales", // This is the original Sales section, adjust if needed or remove if the new "Sales" link covers it.
    //   items: [
    //     {
    //       title: "Orders", // This was under the original "Sales" section
    //       path: "/orders", // Note: This path is duplicated by the new "Order" link above. You'll likely want to consolidate.
    //       icon: <ShoppingCartIcon />,
    //       isNew: true,
    //       children: [
    //         {
    //           title: "All Orders",
    //           path: "/orders",
    //           icon: <ShoppingCartIcon />
    //         },
    //         {
    //           title: "Create Order",
    //           path: "/orders/new",
    //           icon: <ShoppingCartIcon />
    //         }
    //       ]
    //     },
    //     {
    //       title: "Invoices",
    //       path: "/invoices",
    //       icon: <ReceiptIcon />,
    //       badge: 5,
    //       children: [
    //         {
    //           title: "All Invoices",
    //           path: "/invoices",
    //           icon: <ReceiptIcon />
    //         },
    //         {
    //           title: "Create Invoice",
    //           path: "/invoices/new",
    //           icon: <ReceiptIcon />
    //         }
    //       ]
    //     },
    //     {
    //       title: "Payments",
    //       path: "/accounting",
    //       icon: <PaymentsIcon />
    //     },
    //     {
    //       title: "Customers",
    //       path: "/parties",
    //       icon: <PeopleIcon />
    //     }
    //   ]
    // },
    // {
    //   title: "Inventory",
    //   items: [
    //     {
    //       title: "Products",
    //       path: "/products",
    //       icon: <StoreIcon />
    //     },
    //     {
    //       title: "Categories",
    //       path: "/categories",
    //       icon: <CategoryIcon />
    //     },
    //     // {
    //     //   title: "Purchase Orders",
    //     //   path: "/purchase-orders",
    //     //   icon: <ShoppingCartIcon />
    //     // },
    //     // {
    //     //   title: "Suppliers",
    //     //   path: "/suppliers",
    //     //   icon: <LocalShippingIcon />
    //     // }
    //   ]
    // },
    // {
    //   title: "Setting",
    //   items: [
    //     {
    //       title: "Settings",
    //       path: "/settings",
    //       icon: <SettingsIcon />,
    //       children: [
    //         {
    //           title: "Settings",
    //           path: "/settings",
    //           icon: <SettingsIcon />
    //         },
            
    //       ]
    //     },
    //     // {
    //     //   title: "Inventory Reports",
    //     //   path: "/reports/inventory",
    //     //   icon: <AssessmentIcon />
    //     // },
    //     // {
    //     //   title: "Financial Reports",
    //     //   path: "/reports/financial",
    //     //   icon: <AttachMoneyIcon />
    //     // }
    //   ]
    // }
  ];

  // Render a navigation item
  const renderNavItem = (item: NavItem) => {
    // Optional: Check permissions
    // if (item.permission && !hasPermission(item.permission)) {
    //   return null;
    // }

    const isItemActive = isActive(item.path);
    const isItemSectionActive = item.children ? 
      item.children.some(child => isActive(child.path)) || isActiveSection(item.path) : 
      false;
    
    const sectionKey = item.title.toLowerCase().replace(/\s+/g, '-');
    const isExpanded = expandedSections[sectionKey];
    const shouldExpand = isExpanded || isItemSectionActive;

    // Determine if this item should be a clickable link
    const isClickableLink = item.path && item.path !== '#' && (!item.children || miniSidebar);

    const listItemButton = (
      <ListItemButton
        onClick={() => {
          console.log('NavItem clicked:', item.title); // Log item clicks
          if (item.children && !miniSidebar) {
            handleSectionToggle(sectionKey);
          } else if (isClickableLink) {
            // Navigation is handled by the Link component, but we still need to close mobile sidebar
            if (isMobile && onMobileClose) {
              console.log('Closing mobile sidebar on navigation'); // Log mobile close
              onMobileClose();
            }
          }
        }}
        selected={isItemActive || isItemSectionActive}
        sx={{
          minHeight: 48,
          px: 2.5,
          borderRadius: '10px',
          justifyContent: miniSidebar ? 'center' : 'initial',
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
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: miniSidebar ? 0 : 2,
            justifyContent: 'center',
            color: isItemActive || isItemSectionActive
              ? theme.palette.primary.main
              : theme.palette.text.secondary,
          }}
        >
          {item.badge ? (
            <Badge badgeContent={item.badge} color="error">
              {item.icon}
            </Badge>
          ) : (
            item.icon
          )}
        </ListItemIcon>
        
        {!miniSidebar && (
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
                    sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                  />
                )}
              </Box>
            }
          />
        )}
        
        {!miniSidebar && item.children && (
          shouldExpand ? <ExpandLess /> : <ExpandMore />
        )}
      </ListItemButton>
    );
  
    return (
      <React.Fragment key={item.path}>
        <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
          <Tooltip title={miniSidebar ? item.title : ""} placement="right" arrow>
            <Link href={item.path} passHref legacyBehavior>
              {listItemButton}
            </Link>
          </Tooltip>
        </ListItem>
        
        {item.children && !miniSidebar && (
          <Collapse in={shouldExpand} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map(child => (
                <ListItem key={child.path} disablePadding sx={{ display: 'block' }}>
                  <ListItemButton 
                    onClick={() => {
                      // Close mobile sidebar on navigation
                      if (isMobile && onMobileClose) {
                        onMobileClose();
                      }
                    }}
                    selected={isActive(child.path)}
                    sx={{
                      minHeight: 40,
                      pl: 4,
                      pr: 2.5,
                      py: 0.75,
                      borderRadius: '10px',
                      ml: 2,
                      '&.Mui-selected': {
                        bgcolor: theme.palette.mode === 'dark'
                          ? `rgba(255, 255, 255, 0.08)`
                          : `rgba(25, 118, 210, 0.08)`,
                        '& .MuiListItemIcon-root': {
                          color: theme.palette.primary.main,
                        },
                      },
                    }}
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
                      {React.cloneElement(child.icon as React.ReactElement, { fontSize: "medium" })}
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
                </ListItem>
              ))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Box
      component={motion.div}
      layout
      sx={{
        width: {
          xs: isOpen ? '100%' : 0,
          md: miniSidebar ? MINI_DRAWER_WIDTH : DRAWER_WIDTH,
        },
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        height: '100vh',
        overflow: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 0 15px rgba(0, 0, 0, 0.5)'
          : '0 0 15px rgba(0, 0, 0, 0.05)',
        bgcolor: theme.palette.mode === 'dark' 
          ? theme.palette.background.default
          : theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
        display: { xs: isOpen ? 'block' : 'none', md: 'block' },
        position: { xs: 'fixed', md: 'relative' },
        zIndex: { xs: theme.zIndex.drawer, md: 'auto' },
      }}
    >
      {/* Header with logo and toggle button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: miniSidebar ? 'center' : 'space-between',
          padding: miniSidebar ? 1 : 2,
          height: 64,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        {!miniSidebar && (
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
            }}
          >
            MASTERMIND
          </Typography>
        )}
        
        <IconButton onClick={handleToggleSidebar} size="small">
          {miniSidebar ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      {/* User profile section */}
      {!miniSidebar && (
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Avatar
            src={userAvatar}
            sx={{
              width: 40,
              height: 40,
              bgcolor: theme.palette.primary.main,
              mr: 2,
            }}
          >
            {getUserInitials()}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" noWrap>
              {userName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {userRole}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Navigation */}
      <Box
        sx={{
          overflowY: 'auto',
          overflowX: 'hidden',
          height: miniSidebar 
            ? 'calc(100vh - 64px)' 
            : 'calc(100vh - 64px - 73px)', // Adjust based on header and profile heights
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.2)' 
              : 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.3)' 
              : 'rgba(0, 0, 0, 0.3)',
          },
        }}
      >
        <List sx={{ px: 2, pt: 1 }}>
          {navigationSections.map((section, index) => (
            <React.Fragment key={section.title}>
              {index > 0 && (
                <Divider 
                  sx={{ 
                    my: 1.5,
                    opacity: miniSidebar ? 0 : 0.6,
                  }} 
                />
              )}
              
              {!miniSidebar && (
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
              )}
              
              {section.items.map(item => renderNavItem(item))}
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default ModernSidebar;