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
} from '@mui/icons-material';

import Link from "next/link";

// Constants
const DRAWER_WIDTH = 280;
const MINI_DRAWER_WIDTH = 80;
const ANIMATION_DURATION = 300;

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
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // State management
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [miniSidebar, setMiniSidebar] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Default navigation sections
  const defaultNavigationSections: NavSection[] = useMemo(() => [
    {
      id: 'main',
      title: "Main",
      items: [
        {
          id: 'dashboard',
          title: "Dashboard",
          path: "/admin/dashboard",
          icon: <DashboardIcon />,
          description: "Overview and analytics"
        },
        {
          id: 'sales',
          title: "Sales",
          path: "/invoices",
          icon: <TrendingUpIcon />,
          description: "Sales management and tracking"
        },
        {
          id: 'orders',
          title: "Orders",
          path: "/orders",
          icon: <ShoppingCartIcon />,
          badge: 5,
          description: "Order management"
        },
        {
          id: 'inventory',
          title: "Inventory",
          path: "/inventory",
          icon: <InventoryIcon />,
          description: "Stock and inventory management"
        },
        {
          id: 'parties',
          title: "Parties",
          path: "/parties",
          icon: <PeopleIcon />,
          description: "Customer and supplier management"
        },
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
              id: 'financial-reports',
              title: "Financial Reports",
              path: "/reports/financial",
              icon: <AttachMoneyIcon />,
              description: "Financial analysis and reports"
            }
          ]
        },
        {
          id: 'users',
          title: "Users",
          path: "/users",
          icon: <GroupIcon />,
          description: "User management"
        },
        {
          id: 'products',
          title: "Products",
          path: "/products",
          icon: <StoreIcon />,
          description: "Product catalog management"
        },
        {
          id: 'categories',
          title: "Categories",
          path: "/categories",
          icon: <CategoryIcon />,
          description: "Product category management"
        },
        {
          id: 'payments',
          title: "Payments",
          path: "/accounting",
          icon: <PaymentsIcon />,
          description: "Payment and accounting"
        },
        {
          id: 'settings',
          title: "Settings",
          path: "/settings",
          icon: <SettingsIcon />,
          description: "Application settings"
        }
      ]
    }
  ], []);

  const navigationSections = customSections || defaultNavigationSections;

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
      if (event.ctrlKey && event.key === 'b') {
        event.preventDefault();
        handleToggleSidebar();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleSidebar]);

  // Render navigation item
  const renderNavItem = useCallback((item: NavItem) => {
    const isItemActive = isActive(item.path);
    const isItemSectionActive = item.children ? 
      item.children.some(child => isActive(child.path)) || isActiveSection(item.path) : 
      false;
    
    const isExpanded = expandedSections[item.id];
    const shouldExpand = isExpanded || isItemSectionActive;
    const isClickableLink = item.path && item.path !== '#' && (!item.children || miniSidebar);
    const isHovered = hoveredItem === item.id;

    const listItemButton = (
      <ListItemButton
        onClick={() => {
          if (item.children && !miniSidebar) {
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
          justifyContent: miniSidebar ? 'center' : 'initial',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isHovered && !miniSidebar ? 'translateX(4px)' : 'translateX(0)',
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
            mr: miniSidebar ? 0 : 2,
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
          {!miniSidebar && (
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
                secondary={!miniSidebar && item.description ? (
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
        
        {!miniSidebar && item.children && (
          <motion.div
            animate={{ rotate: shouldExpand ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {shouldExpand ? <ExpandLess /> : <ExpandMore />}
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
            title={miniSidebar ? `${item.title}${item.description ? ` - ${item.description}` : ''}` : ""} 
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
        
        {item.children && !miniSidebar && (
          <Collapse in={shouldExpand} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map(child => (
                <motion.div
                  key={child.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                >
                  <ListItem disablePadding sx={{ display: 'block' }}>
                    <Link href={child.path} passHref legacyBehavior>
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

  return (
    <Box
      component={motion.div}
      variants={sidebarVariants}
      animate={miniSidebar ? "closed" : "open"}
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
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 0 20px rgba(0, 0, 0, 0.5)'
          : '0 0 20px rgba(0, 0, 0, 0.08)',
        bgcolor: theme.palette.mode === 'dark' 
          ? theme.palette.background.default
          : theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
        display: { xs: isOpen ? 'block' : 'none', md: 'block' },
        position: { xs: 'fixed', md: 'relative' },
        zIndex: { xs: theme.zIndex.drawer, md: 'auto' },
      }}
      role="navigation"
      aria-label="Main navigation"
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
        <AnimatePresence>
          {!miniSidebar && (
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
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.1)',
              },
            }}
            aria-label={`${miniSidebar ? 'Expand' : 'Collapse'} sidebar`}
          >
            <motion.div
              animate={{ rotate: miniSidebar ? 0 : 180 }}
              transition={{ duration: 0.2 }}
            >
              {miniSidebar ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </motion.div>
          </IconButton>
        </Tooltip>
      </Box>

      {/* User profile section */}
      <AnimatePresence>
        {!miniSidebar && (
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
          height: miniSidebar 
            ? 'calc(100vh - 64px)' 
            : 'calc(100vh - 64px - 73px)',
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
                {!miniSidebar && (
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
});

ModernSidebar.displayName = 'ModernSidebar';

export default ModernSidebar;