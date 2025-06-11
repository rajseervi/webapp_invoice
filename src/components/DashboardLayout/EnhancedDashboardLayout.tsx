"use client";
import React, { useState, ReactNode, useEffect, useCallback } from 'react';
import { 
  Box, 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
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
  Drawer,
  Backdrop,
  Fab,
  Zoom,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { CircularProgress } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help';
import LogoutIcon from '@mui/icons-material/Logout';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { ModernSidebar } from '@/components/ModernSidebar';
import { handleLogout } from '@/utils/authRedirects';

// Define constants for layout dimensions
const APPBAR_HEIGHT = 64;
const APPBAR_HEIGHT_MOBILE = 56;
const DRAWER_WIDTH = 280;
const MINI_DRAWER_WIDTH = 72;
const MOBILE_BREAKPOINT = 'md';

interface EnhancedDashboardLayoutProps {
  children: ReactNode;
  title?: string;
  showBackToTop?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

export default function EnhancedDashboardLayout({ 
  children, 
  title,
  showBackToTop = true,
  maxWidth = false
}: EnhancedDashboardLayoutProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, userRole, loadingAuth, logout } = useAuth();
  
  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down(MOBILE_BREAKPOINT));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State management
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [miniSidebar, setMiniSidebar] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const [showBackToTopButton, setShowBackToTopButton] = useState(false);
  
  // Mock notifications data
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New invoice created', read: false, time: '10 minutes ago' },
    { id: 2, message: 'Low stock alert: Laptop XPS 15', read: false, time: '1 hour ago' },
    { id: 3, message: 'Payment received from Acme Corp', read: true, time: '3 hours ago' },
  ]);
  
  // Computed values
  const profileMenuOpen = Boolean(profileMenuAnchor);
  const notificationsOpen = Boolean(notificationsAnchor);
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  const currentAppBarHeight = isMobile ? APPBAR_HEIGHT_MOBILE : APPBAR_HEIGHT;
  
  // Authentication check
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
  
  // Drawer state management
  useEffect(() => {
    const savedDrawerState = localStorage.getItem('drawerState');
    const savedMiniState = localStorage.getItem('miniSidebarState');
    
    if (isMobile) {
      setDrawerOpen(false);
      setMiniSidebar(false);
    } else {
      if (savedDrawerState) {
        try {
          const state = JSON.parse(savedDrawerState);
          setDrawerOpen(state.open);
        } catch (e) {
          setDrawerOpen(true);
        }
      }
      
      if (savedMiniState) {
        try {
          const state = JSON.parse(savedMiniState);
          setMiniSidebar(state.mini);
        } catch (e) {
          setMiniSidebar(false);
        }
      }
    }
  }, [isMobile]);
  
  // Save states to localStorage
  const saveDrawerState = useCallback((isOpen: boolean) => {
    try {
      localStorage.setItem('drawerState', JSON.stringify({ open: isOpen }));
    } catch (e) {
      console.error('Failed to save drawer state:', e);
    }
  }, []);
  
  const saveMiniState = useCallback((isMini: boolean) => {
    try {
      localStorage.setItem('miniSidebarState', JSON.stringify({ mini: isMini }));
    } catch (e) {
      console.error('Failed to save mini sidebar state:', e);
    }
  }, []);
  
  // Event handlers
  const toggleDrawer = useCallback(() => {
    if (isMobile) {
      const newState = !drawerOpen;
      setDrawerOpen(newState);
      saveDrawerState(newState);
    } else {
      const newMiniState = !miniSidebar;
      setMiniSidebar(newMiniState);
      saveMiniState(newMiniState);
    }
  }, [isMobile, drawerOpen, miniSidebar, saveDrawerState, saveMiniState]);
  
  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    saveDrawerState(false);
  }, [saveDrawerState]);
  
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };
  
  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };
  
  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchor(event.currentTarget);
  };
  
  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };
  
  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    handleNotificationsClose();
  };
  
  const handleUserLogout = () => {
    handleProfileMenuClose();
    handleLogout(logout, router);
  };
  
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
  
  // Back to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTopButton(window.pageYOffset > 300);
    };
    
    if (showBackToTop) {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [showBackToTop]);
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // Route change handler
  useEffect(() => {
    if (isMobile) {
      closeDrawer();
    }
  }, [pathname, isMobile, closeDrawer]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'b') {
        event.preventDefault();
        toggleDrawer();
      }
      if (event.key === 'Escape' && isMobile && drawerOpen) {
        closeDrawer();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleDrawer, isMobile, drawerOpen, closeDrawer]);
  
  // Loading state
  if (loadingAuth) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: theme.palette.background.default
      }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }
  
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      
      {/* Enhanced App Bar */}
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          backdropFilter: 'blur(20px)',
          bgcolor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.background.paper, 0.8) 
            : alpha(theme.palette.primary.main, 0.95),
          borderBottom: '1px solid',
          borderColor: theme.palette.mode === 'dark'
            ? alpha(theme.palette.divider, 0.6)
            : alpha(theme.palette.primary.dark, 0.15),
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0,0,0,0.2)'
            : '0 8px 32px rgba(0,0,0,0.1)',
          height: currentAppBarHeight,
          transition: theme.transitions.create(['background-color', 'box-shadow'], {
            duration: theme.transitions.duration.short,
          }),
        }}
      >
        <Toolbar sx={{ 
          minHeight: currentAppBarHeight,
          px: { xs: 1, sm: 2 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={`${isMobile ? 'Toggle menu' : 'Toggle sidebar'} (Ctrl+B)`} arrow>
              <IconButton
                color="inherit"
                aria-label="toggle drawer"
                onClick={toggleDrawer}
                edge="start"
                size={isSmallScreen ? "small" : "medium"}
                sx={{
                  mr: { xs: 1, sm: 2 },
                  bgcolor: alpha(theme.palette.common.white, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.2),
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <MenuIcon />
              </IconButton>
            </Tooltip>
            
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography 
                variant={isSmallScreen ? "h6" : "h5"} 
                noWrap 
                component="div" 
                sx={{ 
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: theme.palette.common.white,
                  background: 'linear-gradient(45deg, #fff 30%, #f0f0f0 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2,
                }}
              >
                MASTERMIND
              </Typography>
              {title && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: alpha(theme.palette.common.white, 0.8),
                    fontWeight: 500,
                    display: { xs: 'none', sm: 'block' }
                  }}
                >
                  {title}
                </Typography>
              )}
            </Box>
          </Box>
          
          {/* Right side of AppBar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Quick Actions */}
            {(userRole === 'admin' || userRole === 'manager') && (
              <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                <Button 
                  variant="contained" 
                  size="small"
                  onClick={() => router.push('/invoices/new')}
                  sx={{ 
                    bgcolor: alpha(theme.palette.common.white, 0.15),
                    color: 'white',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.common.white, 0.25),
                      transform: 'translateY(-1px)',
                    },
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    transition: 'all 0.2s ease-in-out',
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
                size={isSmallScreen ? "small" : "medium"}
                sx={{
                  bgcolor: alpha(theme.palette.common.white, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.2),
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <Badge 
                  badgeContent={unreadNotificationsCount} 
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.7rem',
                      minWidth: '18px',
                      height: '18px',
                    }
                  }}
                >
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            {/* User Profile */}
            <Tooltip title="Account settings">
              <IconButton
                onClick={handleProfileMenuOpen}
                size={isSmallScreen ? "small" : "medium"}
                sx={{
                  bgcolor: alpha(theme.palette.common.white, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.2),
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <Avatar 
                  sx={{ 
                    width: isSmallScreen ? 28 : 32, 
                    height: isSmallScreen ? 28 : 32, 
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
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Enhanced Sidebar */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          anchor="left"
          open={drawerOpen}
          onClose={closeDrawer}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          PaperProps={{
            sx: {
              width: DRAWER_WIDTH,
              border: 'none',
              boxShadow: theme.shadows[8],
            }
          }}
          sx={{
            display: { xs: 'block', [MOBILE_BREAKPOINT]: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          <ModernSidebar 
            isOpen={true}
            onMobileClose={closeDrawer}
            userName={currentUser?.displayName || currentUser?.email || 'User'}
            userRole={userRole || 'User'}
            userAvatar={currentUser?.photoURL || undefined}
            variant="temporary"
          />
        </Drawer>
      ) : (
        <Box
          sx={{
            width: miniSidebar ? MINI_DRAWER_WIDTH : DRAWER_WIDTH,
            flexShrink: 0,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          <ModernSidebar 
            isOpen={!miniSidebar}
            onToggle={() => setMiniSidebar(!miniSidebar)}
            userName={currentUser?.displayName || currentUser?.email || 'User'}
            userRole={userRole || 'User'}
            userAvatar={currentUser?.photoURL || undefined}
            variant="permanent"
          />
        </Box>
      )}
      
      {/* Mobile backdrop */}
      {isMobile && (
        <Backdrop
          open={drawerOpen}
          onClick={closeDrawer}
          sx={{ 
            zIndex: theme.zIndex.drawer - 1,
            bgcolor: alpha(theme.palette.common.black, 0.5),
          }}
        />
      )}
      
      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          pt: `${currentAppBarHeight}px`,
          height: '100vh',
          overflow: 'auto',
          bgcolor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.background.default, 0.95) 
            : '#f8f9fa',
          position: 'relative',
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
            '&:hover': {
              background: theme.palette.mode === 'dark'
                ? alpha(theme.palette.primary.dark, 0.5)
                : alpha(theme.palette.primary.main, 0.3),
            },
          },
        }}
      >
        {/* Content container */}
        <Box 
          sx={{ 
            maxWidth: maxWidth ? `${theme.breakpoints.values[maxWidth]}px` : 'none',
            width: '100%',
            mx: maxWidth ? 'auto' : 0,
            px: { xs: 1, sm: 2, md: 3 },
            py: { xs: 1, sm: 2 },
            minHeight: `calc(100vh - ${currentAppBarHeight}px)`,
          }}
        >
          {children}
        </Box>
        
        {/* Back to Top Button */}
        {showBackToTop && (
          <Zoom in={showBackToTopButton}>
            <Fab
              color="primary"
              size="small"
              aria-label="scroll back to top"
              onClick={scrollToTop}
              sx={{
                position: 'fixed',
                bottom: { xs: 16, sm: 24 },
                right: { xs: 16, sm: 24 },
                zIndex: theme.zIndex.speedDial,
                boxShadow: theme.shadows[6],
                '&:hover': {
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <KeyboardArrowUpIcon />
            </Fab>
          </Zoom>
        )}
      </Box>
      
      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchor}
        open={notificationsOpen}
        onClose={handleNotificationsClose}
        PaperProps={{
          elevation: 8,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.15))',
            mt: 1.5,
            width: { xs: 300, sm: 360 },
            maxHeight: 400,
            borderRadius: 2,
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
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={600}>Notifications</Typography>
          <Button 
            size="small" 
            onClick={handleMarkAllAsRead}
            disabled={unreadNotificationsCount === 0}
            sx={{ textTransform: 'none' }}
          >
            Mark all as read
          </Button>
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <Box sx={{ py: 3, px: 2, textAlign: 'center' }}>
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
                '&:hover': {
                  bgcolor: notification.read 
                    ? alpha(theme.palette.action.hover, 0.5)
                    : alpha(theme.palette.primary.main, 0.1),
                },
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
          <Typography variant="body2" color="primary" sx={{ width: '100%', textAlign: 'center', fontWeight: 500 }}>
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
          elevation: 8,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.15))',
            mt: 1.5,
            width: 240,
            borderRadius: 2,
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
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {currentUser?.displayName || currentUser?.email || 'User'}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
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
  );
}