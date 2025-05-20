"use client";
import React, { useState, ReactNode, useEffect, useRef } from 'react';
import { 
  Box, 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Drawer, 
  useMediaQuery, 
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Button,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from  'next/navigation'; // Ensure both are imported
import { CircularProgress } from '@mui/material'; // Import necessary components
import { useTheme, alpha } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help';
import LogoutIcon from '@mui/icons-material/Logout';
import CloseIcon from '@mui/icons-material/Close';
// import Navigation from './ImprovedNavigation';
import { ModernSidebar } from '@/components/ModernSidebar';
import { handleLogout } from '@/utils/authRedirects';

// Define constants for layout dimensions
const APPBAR_HEIGHT = 64; // Height of the app bar
const DRAWER_WIDTH = 240; // Width of the sidebar - matches ModernSidebar's width

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  // Ensure `hasPermission` is available from your AuthContext if you prefer permission-based checks
  // For this example, we'll use userRole directly.
  const { currentUser, userRole, loadingAuth, logout } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loadingAuth) {
      if (!currentUser) {
        router.push('/login');
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
      }
    }
  }, [currentUser, loadingAuth, router]);

  // Use strict breakpoint to ensure proper detection of mobile devices
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), {
    defaultMatches: false,
    noSsr: true,
  });
  
  // Simple drawer state - just open or closed
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  
  // User profile menu state
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const profileMenuOpen = Boolean(profileMenuAnchor);
  
  // Notifications menu state
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const notificationsOpen = Boolean(notificationsAnchor);
  
  // Mock notifications data
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New invoice created', read: false, time: '10 minutes ago' },
    { id: 2, message: 'Low stock alert: Laptop XPS 15', read: false, time: '1 hour ago' },
    { id: 3, message: 'Payment received from Acme Corp', read: true, time: '3 hours ago' },
  ]);
  
  // Get unread notifications count
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  
  // Save drawer state to localStorage
  const saveDrawerState = (isOpen: boolean) => {
    try {
      localStorage.setItem('drawerState', JSON.stringify({ open: isOpen }));
    } catch (e) {
      console.error('Failed to save drawer state:', e);
    }
  };
  
  // Toggle drawer open/closed
  const toggleDrawer = () => {
    const newState = !drawerOpen;
    setDrawerOpen(newState);
    saveDrawerState(newState);
  };
  
  // Close drawer (for both mobile and desktop)
  const closeDrawer = () => {
    setDrawerOpen(false);
    saveDrawerState(false);
  };
  
  // Handle navigation item click - always close drawer
  const handleNavItemClick = () => {
    // Always close drawer after navigation
    closeDrawer();
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
  
  // Listen for route changes to close drawer
  useEffect(() => {
    // Close drawer on route change
    const handleRouteChange = () => {
      closeDrawer();
    };
    
    // Add event listener for route changes
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
  
  // Load saved drawer state on initial render
  useEffect(() => {
    const savedDrawerState = localStorage.getItem('drawerState');
    
    if (savedDrawerState) {
      try {
        const state = JSON.parse(savedDrawerState);
        // On mobile, always start with closed drawer regardless of saved state
        if (isMobile) {
          closeDrawer();
        } else {
          // On desktop, respect saved state
          setDrawerOpen(state.open);
        }
      } catch (e) {
        // If parsing fails, set default state
        setDrawerOpen(!isMobile);
        saveDrawerState(!isMobile);
      }
    } else {
      // Default state if nothing is saved
      setDrawerOpen(!isMobile);
      saveDrawerState(!isMobile);
    }
  }, [isMobile]);
  
  // Handle window resize events
  useEffect(() => {
    const handleResize = () => {
      // Close drawer on mobile
      if (window.innerWidth < theme.breakpoints.values.md) {
        closeDrawer();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [theme.breakpoints.values.md]);

  // Render loading state
  const renderLoading = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );

  // Render the main layout
  const renderLayout = () => (
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
            <Tooltip title="Toggle sidebar" arrow>
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
                <MenuIcon />
              </IconButton>
            </Tooltip>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                fontWeight: 700,
                letterSpacing: '0.5px',
                color: theme.palette.common.white,
                background: 'linear-gradient(45deg, #fff 30%, #f0f0f0 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              MASTERMIND
            </Typography>
          </Box>
          
          {/* Right side of AppBar - User profile and notifications */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Quick Actions - Role Based */}
            {(userRole === 'admin' || userRole === 'manager') && (
              <Box sx={{ display: { xs: 'none', md: 'flex' }, mr: 2 }}>
                <Button 
                  variant="contained" 
                  size="small"
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
              </Box>
            )}
            
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
                      bgcolor: notification.read ? 'transparent' : alpha(theme.palette.primary.main, 0.05),
                    }}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="body2" fontWeight={notification.read ? 400 : 600}>
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {notification.time}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))
              )}
              <Divider />
              <MenuItem onClick={() => {
                handleNotificationsClose();
                router.push('/notifications');
              }}>
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
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {currentUser?.displayName || currentUser?.email || 'User'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userRole?.charAt(0).toUpperCase() + userRole?.slice(1) || 'User'}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => {
                handleProfileMenuClose();
                router.push('/profile');
              }}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>My Profile</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => {
                handleProfileMenuClose();
                router.push('/settings');
              }}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Settings</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => {
                handleProfileMenuClose();
                router.push('/help');
              }}>
                <ListItemIcon>
                  <HelpIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Help & Support</ListItemText>
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
      
      {/* Modern Sidebar */}
      <ModernSidebar 
        isOpen={drawerOpen}
        onToggle={toggleDrawer}
        onMobileClose={closeDrawer}
        userName={currentUser?.displayName || currentUser?.email || 'User'}
        userRole={userRole || 'User'}
        userAvatar={currentUser?.photoURL || undefined}
      />
      
      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          pt: `${APPBAR_HEIGHT}px`, // Use constant
          height: '100vh',
          overflow: 'auto',
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          width: '100%',
          ...(drawerOpen && !isMobile && {
            transition: theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
            width: `calc(100% - ${DRAWER_WIDTH}px)`,
          }),
          bgcolor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.background.default, 0.97) 
            : '#f8f9fa',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark'
              ? alpha(theme.palette.primary.dark, 0.3)
              : alpha(theme.palette.primary.main, 0.2),
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: theme.palette.mode === 'dark'
              ? alpha(theme.palette.primary.dark, 0.5)
              : alpha(theme.palette.primary.main, 0.3),
          },
        }}
      >
        {/* Content container */}
        <Box 
          sx={{ 
            maxWidth: '1600px', 
            width: '100%',
            mx: '0',
            px: { xs: 1.5, sm: 2, md: 3 },
            // py: { xs: 2, sm: 3 },
            display: 'flex',
            flexDirection: 'column',
            minHeight: `calc(100% - ${APPBAR_HEIGHT}px)`,
          }}
        >
          {/* Content */}
          <Box
            sx={{
              flexGrow: 1,
              width: '100%',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
  
  // Final return statement - conditionally render based on auth state
  return loadingAuth ? renderLoading() : renderLayout();
}
// Add this at the top of your file, after imports
// const APPBAR_HEIGHT = 64; // desktop
const APPBAR_HEIGHT_MOBILE = 56; // mobile
// const DRAWER_WIDTH = 240;