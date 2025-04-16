'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { handleLogout } from '@/utils/authRedirects'; 
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  IconButton, 
  ListItemIcon,
  ListItemText,
  Collapse,
  ListItemButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  alpha,
  Badge,
  Tooltip,
  useMediaQuery,
  Paper,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  ShoppingCart,
  Inventory,
  People,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  Category,
  AddShoppingCart,
  Receipt,
  Person as PersonIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  Notifications as NotificationsIcon,
  ChevronLeft as ChevronLeftIcon,
  BarChart as BarChartIcon,
  Assessment as AssessmentIcon,
  Storefront as StorefrontIcon,
  LocalShipping as LocalShippingIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
} from '@mui/icons-material';
import CompanyInfoDisplay from './CompanyInfoDisplay'; 

const drawerWidth = 280;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const { currentUser, userRole, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State for drawer and menu items
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  
  // State for profile menu
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const profileMenuOpen = Boolean(profileAnchorEl);
  
  // State for notifications
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const notificationsMenuOpen = Boolean(notificationsAnchorEl);
  const [notificationCount, setNotificationCount] = useState(3);
  
  // Check if path is active and expand parent menu if needed
  useEffect(() => {
    if (pathname.startsWith('/sales') || pathname.startsWith('/invoices')) {
      setSalesOpen(true);
    } else if (pathname.startsWith('/products') || pathname.startsWith('/categories') || pathname.startsWith('/inventory')) {
      setInventoryOpen(true);
    } else if (pathname.startsWith('/reports')) {
      setReportsOpen(true);
    } else if (pathname.startsWith('/admin') || pathname.startsWith('/users')) {
      setAdminOpen(true);
    }
  }, [pathname]);
  
  // Handle drawer toggle
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  // Menu items with improved icons and organization
  const allMenuItems = [
    { 
      text: 'Dashboard', 
      icon: <Dashboard color={pathname === '/dashboard' ? 'primary' : 'inherit'} />, 
      path: '/dashboard',
      badge: null,
      roles: ['admin', 'manager', 'user'] // Available to all roles
    },
    {
      text: 'Sales',
      icon: <StorefrontIcon color={pathname.includes('/sales') || pathname.includes('/invoices') ? 'primary' : 'inherit'} />,
      roles: ['admin', 'manager', 'user'], // Available to all roles
      children: [
        { text: 'New Invoice', icon: <AddShoppingCart />, path: '/invoices/new', badge: null, roles: ['admin', 'manager', 'user'] },
        { text: 'Invoices', icon: <Receipt />, path: '/invoices', badge: null, roles: ['admin', 'manager', 'user'] },
        { text: 'Sales Report', icon: <BarChartIcon />, path: '/reports/sales', badge: null, roles: ['admin', 'manager'] },
      ]
    },
    {
      text: 'Inventory',
      icon: <Inventory color={pathname.includes('/products') || pathname.includes('/categories') || pathname.includes('/inventory') ? 'primary' : 'inherit'} />,
      roles: ['admin', 'manager'], // Only admin and manager can access inventory
      children: [
        { text: 'Products', icon: <Inventory />, path: '/products', badge: null, roles: ['admin', 'manager', 'user'] },
        { text: 'Categories', icon: <Category />, path: '/categories', badge: null, roles: ['admin', 'manager'] },
        { text: 'Stock Alerts', icon: <Inventory />, path: '/inventory/alerts', badge: { count: 5, color: 'error' }, roles: ['admin', 'manager'] },
        { text: 'Import/Export', icon: <LocalShippingIcon />, path: '/products/import-export', badge: null, roles: ['admin', 'manager'] },
      ]
    },
    { 
      text: 'Parties', 
      icon: <People color={pathname.includes('/parties') ? 'primary' : 'inherit'} />, 
      path: '/parties',
      badge: null,
      roles: ['admin', 'manager', 'user'] // Available to all roles
    },
    {
      text: 'Reports',
      icon: <AssessmentIcon color={pathname.includes('/reports') ? 'primary' : 'inherit'} />,
      roles: ['admin', 'manager'], // Only admin and manager can access reports
      children: [
        { text: 'Sales Report', icon: <BarChartIcon />, path: '/reports/sales', badge: null, roles: ['admin', 'manager'] },
        { text: 'Inventory Report', icon: <BarChartIcon />, path: '/reports/inventory', badge: null, roles: ['admin', 'manager'] },
        { text: 'User Activity', icon: <BarChartIcon />, path: '/reports/users', badge: null, roles: ['admin'] },
        { text: 'Financial Summary', icon: <BarChartIcon />, path: '/reports/financial', badge: null, roles: ['admin', 'manager'] },
      ]
    },
    {
      text: 'Administration',
      icon: <SettingsIcon color={pathname.includes('/admin') ? 'primary' : 'inherit'} />,
      roles: ['admin'], // Only admin can access administration
      children: [
        { text: 'Users', icon: <People />, path: '/users', badge: null, roles: ['admin'] },
        { text: 'Roles & Permissions', icon: <People />, path: '/admin/roles', badge: null, roles: ['admin'] },
        { text: 'System Logs', icon: <AssessmentIcon />, path: '/admin/logs', badge: null, roles: ['admin'] },
      ]
    },
  ];
  
  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => 
    item.roles && item.roles.includes(userRole || 'user')
  ).map(item => {
    // If the item has children, filter those too
    if (item.children) {
      return {
        ...item,
        children: item.children.filter(child => 
          child.roles && child.roles.includes(userRole || 'user')
        )
      };
    }
    return item;
  });
  
  // Settings is separated for visual distinction
  const settingsItem = { 
    text: 'Settings', 
    icon: <SettingsIcon color={pathname.includes('/settings') ? 'primary' : 'inherit'} />, 
    path: '/settings',
    badge: null,
    roles: ['admin', 'manager', 'user'] // Available to all roles
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const isSelected = (path: string) => pathname === path || pathname === path + '/';

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };
  
  const handleNotificationsClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };
  
  const handleClearNotifications = () => {
    setNotificationCount(0);
    handleNotificationsClose();
  };

  const handleLogoutClick = async () => {
    setLoading(true);
    
    try {
      // Use the utility function for logout
      await handleLogout(
        logout,
        router,
        () => {
          // Actions to perform before logout
          setAnchorEl(null);
          setMobileOpen(false);
        }
      );
    } finally {
      setLoading(false);
    }
  };
  
  const handleThemeToggle = () => {
    const newThemeMode = theme.palette.mode === 'dark' ? 'light' : 'dark';
    localStorage.setItem('themeMode', newThemeMode);
    window.dispatchEvent(new CustomEvent('themeChange', { detail: newThemeMode }));
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        elevation={1}
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              color="inherit" 
              edge="start" 
              onClick={toggleDrawer}
              sx={{ mr: 2 }}
            >
              {drawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
            </IconButton>
            <CompanyInfoDisplay variant="header" />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Theme Toggle */}
            <Tooltip title={`Switch to ${theme.palette.mode === 'dark' ? 'light' : 'dark'} mode`}>
              <IconButton color="inherit" onClick={handleThemeToggle}>
                {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
            
            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton
                color="inherit"
                onClick={handleNotificationsClick}
                aria-controls={notificationsMenuOpen ? 'notifications-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={notificationsMenuOpen ? 'true' : undefined}
              >
                <Badge badgeContent={notificationCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            {/* Profile Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
              <Tooltip title="Account settings">
                <IconButton
                  onClick={handleProfileClick}
                  aria-controls={profileMenuOpen ? 'profile-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={profileMenuOpen ? 'true' : undefined}
                  sx={{ 
                    p: 0.5,
                    border: `2px solid ${theme.palette.primary.main}`,
                    borderRadius: '50%',
                  }}
                >
                  <Avatar 
                    alt={currentUser?.displayName || 'User'} 
                    src={currentUser?.photoURL || undefined}
                    sx={{ width: 32, height: 32 }}
                  />
                </IconButton>
              </Tooltip>
              {currentUser?.displayName && (
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    ml: 1, 
                    display: { xs: 'none', sm: 'block' },
                    fontWeight: 'medium'
                  }}
                >
                  {currentUser.displayName}
                </Typography>
              )}
            </Box>
            
            {/* Profile Menu Dropdown */}
            <Menu
              id="profile-menu"
              anchorEl={profileAnchorEl}
              open={profileMenuOpen}
              onClose={handleProfileClose}
              MenuListProps={{
                'aria-labelledby': 'profile-button',
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                elevation: 2,
                sx: {
                  mt: 1.5,
                  minWidth: 180,
                  borderRadius: 2,
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {currentUser?.displayName || 'User'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentUser?.email || ''}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => {
                handleProfileClose();
                handleNavigation('/profile');
              }}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={() => {
                handleProfileClose();
                handleNavigation('/settings');
              }}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" color="error" />
                </ListItemIcon>
                <Typography color="error">Logout</Typography>
              </MenuItem>
            </Menu>
            
            {/* Notifications Menu */}
            {/* <Menu
              id="notifications-menu"
              anchorEl={notificationsAnchorEl}
              open={notificationsMenuOpen}
              onClose={handleNotificationsClose}
              MenuListProps={{
                'aria-labelledby': 'notifications-button',
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                elevation: 2,
                sx: {
                  mt: 1.5,
                  width: 320,
                  maxHeight: 400,
                  borderRadius: 2,
                  overflow: 'auto',
                },
              }}
            >
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Notifications
                </Typography>
                {notificationCount > 0 && (
                  <Button 
                    size="small" 
                    onClick={handleClearNotifications}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Clear all
                  </Button>
                )}
              </Box>
              <Divider />
              {notificationCount > 0 ? (
                <>
                  <MenuItem>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="subtitle2">Low stock alert</Typography>
                      <Typography variant="body2" color="text.secondary">
                        5 products are below the stock threshold
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        2 hours ago
                      </Typography>
                    </Box>
                  </MenuItem>
                  <Divider />
                  <MenuItem>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="subtitle2">New order received</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Order #1234 has been placed
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        5 hours ago
                      </Typography>
                    </Box>
                  </MenuItem>
                  <Divider />
                  <MenuItem>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="subtitle2">Payment received</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Payment for invoice #INV-2023-001 received
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        Yesterday
                      </Typography>
                    </Box>
                  </MenuItem>
                </>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No new notifications
                  </Typography>
                </Box>
              )}
            </Menu> */}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={drawerOpen}
        onClose={toggleDrawer}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            borderRight: `1px solid ${theme.palette.divider}`,
            background: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.background.paper, 0.9)
              : alpha(theme.palette.background.paper, 0.98),
            boxShadow: drawerOpen && isMobile ? '0px 8px 10px -5px rgba(0,0,0,0.1)' : 'none',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ 
          overflow: 'auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          py: 2
        }}>
          {/* Main Menu Items */}
          <List component="nav" sx={{ px: 1 }}>
            {menuItems.map((item) => (
              item.children ? (
                <React.Fragment key={item.text}>
                  <ListItemButton 
                    onClick={() => {
                      if (item.text === 'Inventory') setInventoryOpen(!inventoryOpen);
                      if (item.text === 'Sales') setSalesOpen(!salesOpen);
                      if (item.text === 'Reports') setReportsOpen(!reportsOpen);
                      if (item.text === 'Administration') setAdminOpen(!adminOpen);
                    }}
                    sx={{ 
                      borderRadius: 2,
                      mb: 0.5,
                      color: (
                        (item.text === 'Inventory' && (pathname.includes('/products') || pathname.includes('/categories') || pathname.includes('/inventory'))) ||
                        (item.text === 'Sales' && (pathname.includes('/sales') || pathname.includes('/invoices'))) ||
                        (item.text === 'Reports' && pathname.includes('/reports')) ||
                        (item.text === 'Administration' && (pathname.includes('/admin') || pathname.includes('/users')))
                      ) ? theme.palette.primary.main : 'inherit',
                    }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{ 
                        fontWeight: (
                          (item.text === 'Inventory' && (pathname.includes('/products') || pathname.includes('/categories') || pathname.includes('/inventory'))) ||
                          (item.text === 'Sales' && (pathname.includes('/sales') || pathname.includes('/invoices'))) ||
                          (item.text === 'Reports' && pathname.includes('/reports')) ||
                          (item.text === 'Administration' && (pathname.includes('/admin') || pathname.includes('/users')))
                        ) ? 'bold' : 'medium'
                      }} 
                    />
                    {(
                      (item.text === 'Inventory' && inventoryOpen) || 
                      (item.text === 'Sales' && salesOpen) ||
                      (item.text === 'Reports' && reportsOpen) ||
                      (item.text === 'Administration' && adminOpen)
                    ) ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                  <Collapse 
                    in={
                      (item.text === 'Inventory' && inventoryOpen) || 
                      (item.text === 'Sales' && salesOpen) ||
                      (item.text === 'Reports' && reportsOpen) ||
                      (item.text === 'Administration' && adminOpen)
                    } 
                    timeout="auto" 
                    unmountOnExit
                  >
                    <List component="div" disablePadding sx={{ pl: 1 }}>
                      {item.children.map((child) => (
                        <ListItemButton
                          key={child.text}
                          sx={{ 
                            pl: 3,
                            py: 0.75,
                            borderRadius: 2,
                            mb: 0.5,
                            bgcolor: isSelected(child.path) 
                              ? alpha(theme.palette.primary.main, 0.1)
                              : 'transparent',
                            '&:hover': {
                              bgcolor: isSelected(child.path) 
                                ? alpha(theme.palette.primary.main, 0.15)
                                : alpha(theme.palette.action.hover, 0.1),
                            }
                          }}
                          selected={isSelected(child.path)}
                          onClick={() => handleNavigation(child.path)}
                        >
                          <ListItemIcon sx={{ 
                            minWidth: 36,
                            color: isSelected(child.path) ? theme.palette.primary.main : 'inherit'
                          }}>
                            {child.icon}
                          </ListItemIcon>
                          <ListItemText 
                            primary={child.text} 
                            primaryTypographyProps={{ 
                              fontSize: '0.9rem',
                              fontWeight: isSelected(child.path) ? 'bold' : 'regular'
                            }} 
                          />
                          {child.badge && (
                            <Badge 
                              badgeContent={child.badge.count} 
                              color={child.badge.color as 'error' | 'warning' | 'info' | 'success'} 
                              sx={{ ml: 1 }}
                            />
                          )}
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                </React.Fragment>
              ) : (
                <ListItemButton
                  key={item.text}
                  selected={isSelected(item.path)}
                  onClick={() => handleNavigation(item.path)}
                  sx={{ 
                    borderRadius: 2,
                    mb: 0.5,
                    bgcolor: isSelected(item.path) 
                      ? alpha(theme.palette.primary.main, 0.1)
                      : 'transparent',
                    '&:hover': {
                      bgcolor: isSelected(item.path) 
                        ? alpha(theme.palette.primary.main, 0.15)
                        : alpha(theme.palette.action.hover, 0.1),
                    }
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: isSelected(item.path) ? theme.palette.primary.main : 'inherit'
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontWeight: isSelected(item.path) ? 'bold' : 'medium'
                    }} 
                  />
                  {item.badge && (
                    <Badge 
                      badgeContent={item.badge.count} 
                      color={item.badge.color as 'error' | 'warning' | 'info' | 'success'} 
                      sx={{ ml: 1 }}
                    />
                  )}
                </ListItemButton>
              )
            ))}
          </List>
          
          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Settings at bottom */}
          <Divider sx={{ my: 2 }} />
          <List component="nav" sx={{ px: 1 }}>
            <ListItemButton
              selected={isSelected(settingsItem.path)}
              onClick={() => handleNavigation(settingsItem.path)}
              sx={{ 
                borderRadius: 2,
                bgcolor: isSelected(settingsItem.path) 
                  ? alpha(theme.palette.primary.main, 0.1)
                  : 'transparent',
                '&:hover': {
                  bgcolor: isSelected(settingsItem.path) 
                    ? alpha(theme.palette.primary.main, 0.15)
                    : alpha(theme.palette.action.hover, 0.1),
                }
              }}
            >
              <ListItemIcon sx={{ 
                color: isSelected(settingsItem.path) ? theme.palette.primary.main : 'inherit'
              }}>
                {settingsItem.icon}
              </ListItemIcon>
              <ListItemText 
                primary={settingsItem.text} 
                primaryTypographyProps={{ 
                  fontWeight: isSelected(settingsItem.path) ? 'bold' : 'medium'
                }} 
              />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3,
          pt: { xs: 2, sm: 3 },
          pb: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3 },
          backgroundColor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.background.default, 0.98)
            : alpha(theme.palette.background.default, 0.98),
          minHeight: '100vh',
          overflow: 'auto'
        }}
      >
        <Toolbar />
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: 3,
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`,
            minHeight: 'calc(100vh - 88px)',
          }}
        >
          {children}
        </Paper>
      </Box>
    </Box>
  );
}