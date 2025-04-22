"use client";
import React, { useState, ReactNode, useEffect } from 'react';
import { 
  Box, 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Drawer, 
  useMediaQuery,
  useTheme,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Button,
  ListItemIcon,
  ListItemText,
  ToggleButtonGroup,
  ToggleButton,
  Zoom,
  Fade,
  Paper,
  alpha,
  Chip,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Help as HelpIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  ViewCompact as ViewCompactIcon,
  Dashboard as DashboardIcon,
  Speed as SpeedIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import ImprovedNavigation from './ImprovedNavigation';
import { handleLogout } from '@/utils/authRedirects';

// Constants
const DRAWER_WIDTH = 260;
const APPBAR_HEIGHT = 64;
const COLLAPSED_DRAWER_WIDTH = 72;

// Define view scale options
type ViewScale = 'compact' | 'comfortable' | 'spacious';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function ResponsiveDashboardLayout({ children }: DashboardLayoutProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, userRole, logout } = useAuth();
  
  // Responsive breakpoints
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isLg = useMediaQuery(theme.breakpoints.up('lg'));
  
  // Drawer states
  const [drawerOpen, setDrawerOpen] = useState(!isXs && !isSm);
  const [drawerCollapsed, setDrawerCollapsed] = useState(isSm || isMd);
  
  // View scale state
  const [viewScale, setViewScale] = useState<ViewScale>('comfortable');
  
  // User profile menu state
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const profileMenuOpen = Boolean(profileMenuAnchor);
  
  // Notifications menu state
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const notificationsOpen = Boolean(notificationsAnchor);
  
  // Quick actions menu state
  const [quickActionsAnchor, setQuickActionsAnchor] = useState<null | HTMLElement>(null);
  const quickActionsOpen = Boolean(quickActionsAnchor);
  
  // Mock notifications data
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New invoice created', read: false, time: '10 minutes ago' },
    { id: 2, message: 'Low stock alert: Laptop XPS 15', read: false, time: '1 hour ago' },
    { id: 3, message: 'Payment received from Acme Corp', read: true, time: '3 hours ago' },
  ]);
  
  // Get unread notifications count
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  
  // Save layout preferences to localStorage
  const saveLayoutPreferences = () => {
    try {
      localStorage.setItem('layoutPreferences', JSON.stringify({ 
        drawerOpen, 
        drawerCollapsed,
        viewScale
      }));
    } catch (e) {
      console.error('Failed to save layout preferences:', e);
    }
  };
  
  // Toggle drawer open/closed
  const toggleDrawer = () => {
    // If drawer is collapsed and we're toggling, expand it first
    if (drawerCollapsed && drawerOpen) {
      setDrawerCollapsed(false);
    } else {
      // Otherwise toggle open/closed state
      const newState = !drawerOpen;
      setDrawerOpen(newState);
    }
    saveLayoutPreferences();
  };
  
  // Toggle drawer collapsed/expanded
  const toggleDrawerCollapsed = () => {
    // Only toggle if drawer is open
    if (drawerOpen) {
      const newState = !drawerCollapsed;
      setDrawerCollapsed(newState);
      saveLayoutPreferences();
    }
  };
  
  // Handle view scale change
  const handleViewScaleChange = (
    event: React.MouseEvent<HTMLElement>,
    newScale: ViewScale | null,
  ) => {
    if (newScale !== null) {
      setViewScale(newScale);
      saveLayoutPreferences();
    }
  };
  
  // Handle profile menu open
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };
  
  // Handle profile menu close
  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };
  
  // Handle notifications menu open
  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchor(event.currentTarget);
  };
  
  // Handle notifications menu close
  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };
  
  // Handle quick actions menu open
  const handleQuickActionsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setQuickActionsAnchor(event.currentTarget);
  };
  
  // Handle quick actions menu close
  const handleQuickActionsClose = () => {
    setQuickActionsAnchor(null);
  };
  
  // Handle mark all notifications as read
  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    handleNotificationsClose();
  };
  
  // Handle logout
  const handleUserLogout = () => {
    handleProfileMenuClose();
    handleLogout(logout, router);
  };
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (currentUser?.displayName) {
      return currentUser.displayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    } else if (currentUser?.email) {
      return currentUser.email[0].toUpperCase();
    }
    return 'U';
  };
  
  // Load saved layout preferences on initial render
  useEffect(() => {
    const savedPreferences = localStorage.getItem('layoutPreferences');
    
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        
        // On mobile, always start with closed drawer regardless of saved preferences
        if (isXs) {
          setDrawerOpen(false);
          setDrawerCollapsed(false);
        } else if (isSm) {
          // On small screens, use collapsed drawer if open
          setDrawerOpen(preferences.drawerOpen);
          setDrawerCollapsed(true);
        } else {
          // On larger screens, respect saved preferences
          setDrawerOpen(preferences.drawerOpen);
          setDrawerCollapsed(preferences.drawerCollapsed);
        }
        
        // Always respect view scale preference
        if (preferences.viewScale) {
          setViewScale(preferences.viewScale);
        }
      } catch (e) {
        // If parsing fails, set default state
        setDrawerOpen(!isXs && !isSm);
        setDrawerCollapsed(isSm || isMd);
        setViewScale('comfortable');
      }
    } else {
      // Default state if nothing is saved
      setDrawerOpen(!isXs && !isSm);
      setDrawerCollapsed(isSm || isMd);
      setViewScale('comfortable');
    }
  }, [isXs, isSm, isMd]);
  
  // Handle window resize events
  useEffect(() => {
    const handleResize = () => {
      // Adjust drawer state based on screen size
      if (window.innerWidth < theme.breakpoints.values.sm) {
        // Mobile: closed drawer
        setDrawerOpen(false);
        setDrawerCollapsed(false);
      } else if (window.innerWidth < theme.breakpoints.values.md) {
        // Small tablet: collapsed drawer if open
        setDrawerCollapsed(true);
      } else if (window.innerWidth < theme.breakpoints.values.lg) {
        // Large tablet: collapsed drawer if open
        if (drawerOpen) {
          setDrawerCollapsed(true);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [theme.breakpoints.values, drawerOpen]);

  // Calculate content padding based on drawer state
  const getContentPadding = () => {
    if (!drawerOpen) {
      return { paddingLeft: 0 };
    }
    
    if (drawerCollapsed) {
      return { paddingLeft: `${COLLAPSED_DRAWER_WIDTH}px` };
    }
    
    return { paddingLeft: `${DRAWER_WIDTH}px` };
  };
  
  // Calculate drawer width based on collapsed state
  const getDrawerWidth = () => {
    return drawerCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH;
  };
  
  // Get content padding based on view scale
  const getContentSpacing = () => {
    switch (viewScale) {
      case 'compact':
        return { p: { xs: 1, sm: 2 } };
      case 'spacious':
        return { p: { xs: 2, sm: 3, md: 4 } };
      case 'comfortable':
      default:
        return { p: { xs: 1.5, sm: 2.5, md: 3 } };
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          backdropFilter: 'blur(10px)',
          bgcolor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.background.paper, 0.75) 
            : alpha(theme.palette.primary.main, 0.97),
          borderBottom: '1px solid',
          borderColor: theme.palette.mode === 'dark'
            ? alpha(theme.palette.divider, 0.6)
            : alpha(theme.palette.primary.dark, 0.15),
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0,0,0,0.15)'
            : '0 4px 20px rgba(0,0,0,0.08)',
          height: APPBAR_HEIGHT,
        }}
      >
        <Toolbar sx={{ 
          minHeight: APPBAR_HEIGHT, 
          px: { xs: 1.5, sm: 2 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={drawerOpen ? "Toggle sidebar" : "Open sidebar"} arrow>
              <IconButton
                color="inherit"
                aria-label="toggle drawer"
                onClick={toggleDrawer}
                edge="start"
                size="medium"
                sx={{
                  mr: 1.5,
                  bgcolor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.background.paper, 0.15) 
                    : alpha(theme.palette.common.white, 0.15),
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.background.paper, 0.25) 
                      : alpha(theme.palette.common.white, 0.25),
                  },
                }}
              >
                {drawerOpen ? <MenuIcon /> : <DashboardIcon />}
              </IconButton>
            </Tooltip>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                fontWeight: 600,
                letterSpacing: '0.5px',
                color: theme.palette.common.white,
              }}
            >
              Dashboard
            </Typography>
          </Box>
          
          {/* Center section - View Scale Toggle */}
          <Box 
            sx={{ 
              display: { xs: 'none', md: 'flex' },
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <Paper
              elevation={0}
              sx={{
                bgcolor: alpha(theme.palette.common.white, 0.15),
                borderRadius: '20px',
                p: 0.5,
              }}
            >
              <ToggleButtonGroup
                value={viewScale}
                exclusive
                onChange={handleViewScaleChange}
                aria-label="view density"
                size="small"
                sx={{
                  '& .MuiToggleButtonGroup-grouped': {
                    border: 0,
                    borderRadius: '16px !important',
                    mx: 0.5,
                    color: 'white',
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.common.white, 0.25),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.common.white, 0.35),
                      },
                    },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.common.white, 0.15),
                    },
                  },
                }}
              >
                <ToggleButton value="compact" aria-label="compact view">
                  <Tooltip title="Compact view">
                    <ViewCompactIcon fontSize="small" />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="comfortable" aria-label="comfortable view">
                  <Tooltip title="Comfortable view">
                    <ViewModuleIcon fontSize="small" />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="spacious" aria-label="spacious view">
                  <Tooltip title="Spacious view">
                    <ViewListIcon fontSize="small" />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
            </Paper>
          </Box>
          
          {/* Right side of AppBar - User profile and notifications */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Quick Actions Button */}
            <Tooltip title="Quick actions">
              <IconButton
                color="inherit"
                onClick={handleQuickActionsOpen}
                size="medium"
                sx={{
                  mr: 1.5,
                  display: { xs: 'flex', md: 'none' },
                  bgcolor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.background.paper, 0.15) 
                    : alpha(theme.palette.common.white, 0.15),
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.background.paper, 0.25) 
                      : alpha(theme.palette.common.white, 0.25),
                  },
                }}
              >
                <SpeedIcon />
              </IconButton>
            </Tooltip>
            
            {/* Quick Actions - Visible on larger screens */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, mr: 2 }}>
              <Button 
                variant="contained" 
                size="small"
                startIcon={<AddIcon />}
                onClick={() => router.push('/invoices/new')}
                sx={{ 
                  mr: 1.5, 
                  bgcolor: alpha(theme.palette.common.white, 0.15),
                  color: 'white',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.25),
                  },
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                New Invoice
              </Button>
              
              <Button 
                variant="contained" 
                size="small"
                startIcon={<AddIcon />}
                onClick={() => router.push('/products/new')}
                sx={{ 
                  bgcolor: alpha(theme.palette.common.white, 0.15),
                  color: 'white',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.25),
                  },
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                New Product
              </Button>
            </Box>
            
            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton
                color="inherit"
                onClick={handleNotificationsOpen}
                size="medium"
                sx={{
                  mr: 1.5,
                  bgcolor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.background.paper, 0.15) 
                    : alpha(theme.palette.common.white, 0.15),
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.background.paper, 0.25) 
                      : alpha(theme.palette.common.white, 0.25),
                  },
                }}
              >
                <Badge badgeContent={unreadNotificationsCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            {/* User Profile */}
            <Tooltip title="Account settings">
              <IconButton
                onClick={handleProfileMenuOpen}
                size="medium"
                sx={{
                  bgcolor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.background.paper, 0.15) 
                    : alpha(theme.palette.common.white, 0.15),
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.background.paper, 0.25) 
                      : alpha(theme.palette.common.white, 0.25),
                  },
                }}
              >
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: theme.palette.secondary.main,
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}
                  src={currentUser?.photoURL || undefined}
                >
                  {getUserInitials()}
                </Avatar>
              </IconButton>
            </Tooltip>
            
            {/* Quick Actions Menu (Mobile) */}
            <Menu
              anchorEl={quickActionsAnchor}
              open={quickActionsOpen}
              onClose={handleQuickActionsClose}
              PaperProps={{
                elevation: 3,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                  mt: 1.5,
                  width: 200,
                  '& .MuiMenuItem-root': {
                    px: 2,
                    py: 1.5,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle1" fontWeight={600}>Quick Actions</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => {
                router.push('/invoices/new');
                handleQuickActionsClose();
              }}>
                <ListItemIcon>
                  <AddIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>New Invoice</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => {
                router.push('/products/new');
                handleQuickActionsClose();
              }}>
                <ListItemIcon>
                  <AddIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>New Product</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => {
                router.push('/parties/new');
                handleQuickActionsClose();
              }}>
                <ListItemIcon>
                  <AddIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>New Customer</ListItemText>
              </MenuItem>
              <Divider />
              <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'center' }}>
                <ToggleButtonGroup
                  value={viewScale}
                  exclusive
                  onChange={handleViewScaleChange}
                  aria-label="view density"
                  size="small"
                  sx={{
                    '& .MuiToggleButtonGroup-grouped': {
                      border: 0,
                      borderRadius: '8px !important',
                      mx: 0.5,
                    },
                  }}
                >
                  <ToggleButton value="compact" aria-label="compact view">
                    <ViewCompactIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="comfortable" aria-label="comfortable view">
                    <ViewModuleIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="spacious" aria-label="spacious view">
                    <ViewListIcon fontSize="small" />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Menu>
            
            {/* Notifications Menu */}
            <Menu
              anchorEl={notificationsAnchor}
              open={notificationsOpen}
              onClose={handleNotificationsClose}
              PaperProps={{
                elevation: 3,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                  mt: 1.5,
                  width: 320,
                  maxHeight: 400,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight={600}>Notifications</Typography>
                <Button 
                  size="small" 
                  onClick={handleMarkAllAsRead}
                  disabled={unreadNotificationsCount === 0}
                >
                  Mark all as read
                </Button>
              </Box>
              <Divider />
              {notifications.length === 0 ? (
                <Box sx={{ py: 2, px: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No notifications</Typography>
                </Box>
              ) : (
                notifications.map((notification) => (
                  <MenuItem 
                    key={notification.id} 
                    onClick={handleNotificationsClose}
                    sx={{ 
                      py: 1.5, 
                      px: 2,
                      borderLeft: notification.read ? 'none' : `4px solid ${theme.palette.primary.main}`,
                      bgcolor: notification.read ? 'transparent' : alpha(theme.palette.primary.main, 0.08),
                    }}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={notification.read ? 400 : 600}>
                          {notification.message}
                        </Typography>
                        {!notification.read && (
                          <Chip 
                            label="New" 
                            size="small" 
                            color="primary" 
                            sx={{ height: 20, fontSize: '0.625rem' }} 
                          />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {notification.time}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))
              )}
              <Divider />
              <MenuItem onClick={() => router.push('/notifications')}>
                <Typography variant="body2" color="primary" sx={{ width: '100%', textAlign: 'center' }}>
                  View all notifications
                </Typography>
              </MenuItem>
            </Menu>
            
            {/* User Profile Menu */}
            <Menu
              anchorEl={profileMenuAnchor}
              open={profileMenuOpen}
              onClose={handleProfileMenuClose}
              PaperProps={{
                elevation: 3,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                  mt: 1.5,
                  width: 220,
                  '& .MuiMenuItem-root': {
                    px: 2,
                    py: 1.5,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {currentUser?.displayName || currentUser?.email || 'User'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userRole || 'User'}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => {
                router.push('/profile');
                handleProfileMenuClose();
              }}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Profile</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => {
                router.push('/settings');
                handleProfileMenuClose();
              }}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Settings</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => {
                router.push('/help-desk');
                handleProfileMenuClose();
              }}>
                <ListItemIcon>
                  <HelpIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Help</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleUserLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Logout</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Drawer */}
      <Drawer
        variant="persistent"
        open={drawerOpen}
        sx={{
          width: getDrawerWidth(),
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: getDrawerWidth(),
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: theme.palette.divider,
            transition: theme.transitions.create(['width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 1 }}>
          <ImprovedNavigation 
            collapsed={drawerCollapsed} 
            onToggleCollapsed={toggleDrawerCollapsed}
          />
        </Box>
      </Drawer>
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: `${APPBAR_HEIGHT}px`,
          height: '100vh',
          overflow: 'auto',
          bgcolor: theme.palette.background.default,
          transition: theme.transitions.create(['padding'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          ...getContentPadding(),
        }}
      >
        <Box sx={{ ...getContentSpacing() }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}