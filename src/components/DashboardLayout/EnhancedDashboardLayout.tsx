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
  Fab,
  Zoom,
  Backdrop,
  Switch,
  FormControlLabel,
  Slide,
  Paper,
  Stack,
  Chip
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { CircularProgress } from '@mui/material';
import { useTheme, alpha, styled } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Logout as LogoutIcon,
  Close as CloseIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Search as SearchIcon,
  Add as AddIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { ModernSidebar } from '@/components/ModernSidebar';
import { handleLogout } from '@/utils/authRedirects';

// Enhanced constants for layout dimensions
const APPBAR_HEIGHT = 64;
const APPBAR_HEIGHT_MOBILE = 56;
const DRAWER_WIDTH = 280;
const MINI_DRAWER_WIDTH = 80;

// Styled components for enhanced design
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  backdropFilter: 'blur(20px)',
  background: theme.palette.mode === 'dark' 
    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.95)} 0%, ${alpha(theme.palette.primary.dark, 0.98)} 100%)`,
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: theme.palette.mode === 'dark'
    ? '0 8px 32px rgba(0,0,0,0.3)'
    : '0 8px 32px rgba(0,0,0,0.1)',
  transition: theme.transitions.create(['background', 'box-shadow'], {
    duration: theme.transitions.duration.standard,
  }),
}));

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  minHeight: APPBAR_HEIGHT,
  [theme.breakpoints.down('sm')]: {
    minHeight: APPBAR_HEIGHT_MOBILE,
  },
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const MainContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'drawerOpen' && prop !== 'isMobile' && prop !== 'miniSidebar',
})<{ drawerOpen: boolean; isMobile: boolean; miniSidebar: boolean }>(({ theme, drawerOpen, isMobile, miniSidebar }) => ({
  flexGrow: 1,
  paddingTop: APPBAR_HEIGHT,
  [theme.breakpoints.down('sm')]: {
    paddingTop: APPBAR_HEIGHT_MOBILE,
  },
  height: '100vh',
  overflow: 'auto',
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  width: '100%',
  background: theme.palette.mode === 'dark' 
    ? `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`
    : `linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)`,
  ...(drawerOpen && !isMobile && {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    width: `calc(100% - ${miniSidebar ? MINI_DRAWER_WIDTH : DRAWER_WIDTH}px)`,
  }),
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
}));

const ScrollToTopFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  zIndex: theme.zIndex.speedDial,
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
  '&:hover': {
    background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
  },
}));

interface EnhancedDashboardLayoutProps {
  children: ReactNode;
}

export default function EnhancedDashboardLayout({ children }: EnhancedDashboardLayoutProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, userRole, loadingAuth, logout } = useAuth();
  
  // State management
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [miniSidebar, setMiniSidebar] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
  // Mock notifications data with enhanced structure
  const [notifications, setNotifications] = useState([
    { 
      id: 1, 
      message: 'New invoice #INV-001 created', 
      read: false, 
      time: '2 minutes ago',
      type: 'invoice',
      priority: 'high'
    },
    { 
      id: 2, 
      message: 'Low stock alert: Laptop XPS 15', 
      read: false, 
      time: '15 minutes ago',
      type: 'inventory',
      priority: 'medium'
    },
    { 
      id: 3, 
      message: 'Payment received from Acme Corp', 
      read: true, 
      time: '1 hour ago',
      type: 'payment',
      priority: 'low'
    },
    { 
      id: 4, 
      message: 'Monthly report is ready', 
      read: false, 
      time: '2 hours ago',
      type: 'report',
      priority: 'medium'
    },
  ]);

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

  // Handle responsive drawer behavior
  useEffect(() => {
    if (isMobile) {
      setDrawerOpen(false);
      setMiniSidebar(false);
    } else {
      const savedState = localStorage.getItem('drawerState');
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          setDrawerOpen(state.open);
          setMiniSidebar(state.mini || false);
        } catch (e) {
          setDrawerOpen(true);
          setMiniSidebar(false);
        }
      }
    }
  }, [isMobile]);

  // Handle scroll to top visibility
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Save drawer state
  const saveDrawerState = useCallback((open: boolean, mini: boolean = false) => {
    try {
      localStorage.setItem('drawerState', JSON.stringify({ open, mini }));
    } catch (e) {
      console.error('Failed to save drawer state:', e);
    }
  }, []);

  // Toggle drawer
  const toggleDrawer = useCallback(() => {
    if (isMobile) {
      setDrawerOpen(!drawerOpen);
    } else {
      const newMiniState = !miniSidebar;
      setMiniSidebar(newMiniState);
      setDrawerOpen(true);
      saveDrawerState(true, newMiniState);
    }
  }, [drawerOpen, miniSidebar, isMobile, saveDrawerState]);

  // Close drawer (mobile)
  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    if (!isMobile) {
      saveDrawerState(false, miniSidebar);
    }
  }, [isMobile, miniSidebar, saveDrawerState]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Get user initials
  const getUserInitials = useCallback(() => {
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
  }, [currentUser]);

  // Get unread notifications count
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // Handle notifications
  const handleMarkAllAsRead = useCallback(() => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setNotificationsAnchor(null);
  }, [notifications]);

  // Handle logout
  const handleUserLogout = useCallback(() => {
    setProfileMenuAnchor(null);
    handleLogout(logout, router);
  }, [logout, router]);

  // Quick actions based on user role
  const getQuickActions = useCallback(() => {
    const actions = [];
    
    if (userRole === 'admin' || userRole === 'manager') {
      actions.push(
        <Button
          key="new-invoice"
          variant="contained"
          size="small"
          onClick={() => router.push('/invoices/new')}
          sx={{
            bgcolor: alpha(theme.palette.common.white, 0.15),
            color: 'white',
            '&:hover': {
              bgcolor: alpha(theme.palette.common.white, 0.25),
            },
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: 2,
          }}
        >
          New Invoice
        </Button>
      );
    }
    
    return actions;
  }, [userRole, router, theme]);

  // Render loading state
  if (loadingAuth) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
      }}>
        <Paper elevation={8} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Loading Dashboard...
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      
      {/* Enhanced App Bar */}
      <StyledAppBar position="fixed" elevation={0}>
        <StyledToolbar>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={miniSidebar ? "Expand sidebar" : "Toggle sidebar"} arrow>
              <IconButton
                color="inherit"
                aria-label="toggle drawer"
                onClick={toggleDrawer}
                edge="start"
                size="medium"
                sx={{
                  mr: 2,
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
            
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                fontWeight: 700,
                letterSpacing: '0.5px',
                background: 'linear-gradient(45deg, #fff 30%, #f0f0f0 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              MASTERMIND
            </Typography>
          </Box>
          
          {/* Center section - Search or breadcrumbs could go here */}
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
            {/* You can add a search bar or breadcrumbs here */}
          </Box>
          
          {/* Right side actions */}
          <Stack direction="row" spacing={1} alignItems="center">
            {/* Quick Actions */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              {getQuickActions()}
            </Box>
            
            {/* Fullscreen Toggle */}
            <Tooltip title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
              <IconButton
                color="inherit"
                onClick={toggleFullscreen}
                sx={{
                  bgcolor: alpha(theme.palette.common.white, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.2),
                  },
                  display: { xs: 'none', sm: 'flex' },
                }}
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
            
            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton
                color="inherit"
                onClick={(e) => setNotificationsAnchor(e.currentTarget)}
                sx={{
                  bgcolor: alpha(theme.palette.common.white, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.2),
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
                onClick={(e) => setProfileMenuAnchor(e.currentTarget)}
                sx={{
                  bgcolor: alpha(theme.palette.common.white, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.2),
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
          </Stack>
        </StyledToolbar>
      </StyledAppBar>

      {/* Mobile Backdrop */}
      {isMobile && (
        <Backdrop
          open={drawerOpen}
          onClick={closeDrawer}
          sx={{ zIndex: theme.zIndex.drawer - 1 }}
        />
      )}
      
      {/* Enhanced Sidebar */}
      <ModernSidebar 
        isOpen={drawerOpen}
        onToggle={toggleDrawer}
        onMobileClose={closeDrawer}
        userName={currentUser?.displayName || currentUser?.email || 'User'}
        userRole={userRole || 'User'}
        userAvatar={currentUser?.photoURL || undefined}
      />
      
      {/* Main Content Area */}
      <MainContent 
        drawerOpen={drawerOpen} 
        isMobile={isMobile} 
        miniSidebar={miniSidebar}
      >
        <Box 
          sx={{ 
            maxWidth: '1600px', 
            width: '100%',
            mx: 'auto',
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 2, sm: 3 },
            display: 'flex',
            flexDirection: 'column',
            minHeight: `calc(100vh - ${APPBAR_HEIGHT}px)`,
          }}
        >
          {children}
        </Box>
      </MainContent>

      {/* Scroll to Top FAB */}
      <Zoom in={showScrollTop}>
        <ScrollToTopFab
          size="medium"
          onClick={scrollToTop}
          aria-label="scroll to top"
        >
          <KeyboardArrowUpIcon />
        </ScrollToTopFab>
      </Zoom>

      {/* Enhanced Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchor}
        open={Boolean(notificationsAnchor)}
        onClose={() => setNotificationsAnchor(null)}
        PaperProps={{
          elevation: 8,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.15))',
            mt: 1.5,
            width: 360,
            maxHeight: 480,
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
        <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={600}>
            Notifications
          </Typography>
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
          <Box sx={{ py: 4, px: 3, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          notifications.map((notification) => (
            <MenuItem 
              key={notification.id} 
              onClick={() => setNotificationsAnchor(null)}
              sx={{ 
                py: 2, 
                px: 3,
                borderLeft: notification.read ? 'none' : `4px solid ${theme.palette.primary.main}`,
                bgcolor: notification.read ? 'transparent' : alpha(theme.palette.primary.main, 0.05),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                  <Typography 
                    variant="body2" 
                    fontWeight={notification.read ? 400 : 600}
                    sx={{ flexGrow: 1, mr: 1 }}
                  >
                    {notification.message}
                  </Typography>
                  <Chip 
                    label={notification.priority} 
                    size="small" 
                    color={
                      notification.priority === 'high' ? 'error' :
                      notification.priority === 'medium' ? 'warning' : 'default'
                    }
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {notification.time}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
        
        <Divider />
        <MenuItem onClick={() => {
          setNotificationsAnchor(null);
          router.push('/notifications');
        }}>
          <Typography variant="body2" color="primary" sx={{ width: '100%', textAlign: 'center', py: 1 }}>
            View all notifications
          </Typography>
        </MenuItem>
      </Menu>
      
      {/* Enhanced User Profile Menu */}
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={() => setProfileMenuAnchor(null)}
        PaperProps={{
          elevation: 8,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.15))',
            mt: 1.5,
            width: 280,
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
        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center' }}>
          <Avatar 
            sx={{ 
              width: 48, 
              height: 48, 
              bgcolor: theme.palette.primary.main,
              mr: 2
            }}
            src={currentUser?.photoURL || undefined}
          >
            {getUserInitials()}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {currentUser?.displayName || currentUser?.email || 'User'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userRole?.charAt(0).toUpperCase() + userRole?.slice(1) || 'User'}
            </Typography>
          </Box>
        </Box>
        <Divider />
        
        <MenuItem onClick={() => {
          setProfileMenuAnchor(null);
          router.push('/profile');
        }}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>My Profile</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          setProfileMenuAnchor(null);
          router.push('/settings');
        }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          setProfileMenuAnchor(null);
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