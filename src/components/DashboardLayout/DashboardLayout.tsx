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
  ChevronLeft as ChevronLeftIcon, // Icon for collapsing drawer
  ChevronRight as ChevronRightIcon, // Icon for expanding drawer
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
const COLLAPSED_DRAWER_WIDTH = 72; // Width when drawer is collapsed

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
  const isXs = useMediaQuery(theme.breakpoints.down('sm')); // Extra Small screens
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md')); // Small screens
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg')); // Medium screens
  const isLg = useMediaQuery(theme.breakpoints.up('lg')); // Large screens

  // Determine if the screen size suggests a mobile layout (temporary drawer)
  const isMobileLayout = isXs; // Use temporary drawer only on xs screens

  // Drawer states
  const [drawerOpen, setDrawerOpen] = useState(!isMobileLayout); // Drawer is open by default on non-mobile
  const [drawerCollapsed, setDrawerCollapsed] = useState(isSm || isMd); // Drawer is collapsed by default on sm and md screens

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
    // Avoid saving preferences when in mobile layout, as it's always closed initially
    if (isMobileLayout) return; 
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

  // Toggle drawer open/closed (for mobile) or expand/collapse (for desktop)
  const toggleDrawer = () => {
    if (isMobileLayout) {
      // On mobile, just toggle open/close
      setDrawerOpen(!drawerOpen);
    } else {
      // On desktop/tablet:
      if (!drawerOpen) {
        // If closed, open it (default to expanded)
        setDrawerOpen(true);
        setDrawerCollapsed(false); // Or set based on screen size preference if needed
      } else {
        // If open, toggle collapsed state
        setDrawerCollapsed(!drawerCollapsed);
      }
    }
    saveLayoutPreferences();
  };

  // Explicitly toggle drawer collapsed state (can be used by a button within the drawer)
  const toggleDrawerCollapsed = () => {
    if (!isMobileLayout && drawerOpen) { // Only makes sense if drawer is open and not mobile
      setDrawerCollapsed(!drawerCollapsed);
      saveLayoutPreferences();
    }
  };

  // Close drawer (used by navigation items on mobile)
  const closeDrawer = () => {
    if (isMobileLayout) {
      setDrawerOpen(false);
    }
  };
  
  // Handle view scale change
  const handleViewScaleChange = (
    event: React.MouseEvent<HTMLElement>,
    newScale: ViewScale | null,
  ) => {
    if (newScale !== null) {
      setViewScale(newScale);
      saveLayoutPreferences(); // Save view scale preference
    }
  };
  
  // --- Menu Handlers (Profile, Notifications, Quick Actions) ---
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => setProfileMenuAnchor(event.currentTarget);
  const handleProfileMenuClose = () => setProfileMenuAnchor(null);
  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => setNotificationsAnchor(event.currentTarget);
  const handleNotificationsClose = () => setNotificationsAnchor(null);
  const handleQuickActionsOpen = (event: React.MouseEvent<HTMLElement>) => setQuickActionsAnchor(event.currentTarget);
  const handleQuickActionsClose = () => setQuickActionsAnchor(null);
  
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
      return currentUser.displayName.split(' ').map(name => name[0]).join('').toUpperCase().substring(0, 2);
    } else if (currentUser?.email) {
      return currentUser.email[0].toUpperCase();
    }
    return 'U';
  };
  
  // Load saved layout preferences or set defaults on initial render & screen size change
  useEffect(() => {
    const savedPreferences = localStorage.getItem('layoutPreferences');
    let preferences = null;

    if (savedPreferences) {
      try {
        preferences = JSON.parse(savedPreferences);
      } catch (e) {
        console.error('Failed to parse layout preferences:', e);
        preferences = null; // Reset if parsing fails
      }
    }

    // Determine initial state based on screen size and preferences
    if (isMobileLayout) {
      setDrawerOpen(false); // Always closed on mobile initially
      setDrawerCollapsed(false); // Collapsed state irrelevant on mobile
    } else {
      // Use saved preferences if available, otherwise default
      const initialOpen = preferences?.drawerOpen ?? true; // Default open on desktop
      const initialCollapsed = preferences?.drawerCollapsed ?? (isSm || isMd); // Default collapsed on sm/md

      setDrawerOpen(initialOpen);
      setDrawerCollapsed(initialCollapsed);
    }

    // Always respect saved view scale preference if available
    if (preferences?.viewScale) {
      setViewScale(preferences.viewScale);
    } else {
      setViewScale('comfortable'); // Default view scale
    }
  }, [isMobileLayout, isSm, isMd]); // Rerun when screen size category changes

  // Calculate drawer width based on collapsed state
  const getDrawerWidth = () => {
    // On mobile, drawer width is fixed when open (temporary)
    // On desktop, width changes based on collapsed state
    return !isMobileLayout && drawerCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH;
  };
  
  // Calculate content margin based on drawer state (for persistent drawer)
  const getContentMargin = () => {
    if (isMobileLayout || !drawerOpen) {
      return { marginLeft: 0 }; // No margin if mobile or drawer closed
    }
    // Apply margin only for persistent drawer when open
    return { marginLeft: `${getDrawerWidth()}px` };
  };
  
  // Get content padding based on view scale
  const getContentSpacing = () => {
    switch (viewScale) {
      case 'compact': return { p: { xs: 1, sm: 1.5, md: 2 } };
      case 'spacious': return { p: { xs: 2, sm: 3, md: 4 } };
      case 'comfortable': default: return { p: { xs: 1.5, sm: 2.5, md: 3 } };
    }
  };

  const drawerVariant = isMobileLayout ? 'temporary' : 'persistent';

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          // Adjust AppBar position based on persistent drawer state
          zIndex: theme.zIndex.drawer + 1,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          // ...(drawerOpen && !isMobileLayout && { // Shift AppBar when persistent drawer is open
          //   width: `calc(100% - ${getDrawerWidth()}px)`,
          //   marginLeft: `${getDrawerWidth()}px`,
          //   transition: theme.transitions.create(['width', 'margin'], {
          //     easing: theme.transitions.easing.sharp,
          //     duration: theme.transitions.duration.enteringScreen,
          //   }),
          // }),
          // --- OR Keep AppBar full width ---
          width: '100%', 
          marginLeft: 0,
          // --- Styling ---
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
          {/* Left Side: Toggle Button & Title */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={drawerOpen && !drawerCollapsed ? "Collapse sidebar" : "Open sidebar"} arrow>
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
                {/* Choose icon based on state */}
                {drawerOpen && !drawerCollapsed && !isMobileLayout ? <ChevronLeftIcon /> : <MenuIcon />}
              </IconButton>
            </Tooltip>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                fontWeight: 600,
                letterSpacing: '0.5px',
                color: theme.palette.common.white, // Ensure text is visible
                display: { xs: 'none', sm: 'block' } // Hide title on very small screens if needed
              }}
            >
              Dashboard
            </Typography>
          </Box>
          
          {/* Center section - View Scale Toggle (Hidden on XS) */}
          <Box 
            sx={{ 
              display: { xs: 'none', md: 'flex' }, // Show on medium screens and up
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <Paper /* ... View Scale ToggleButton styling ... */ >
              <ToggleButtonGroup
                value={viewScale}
                exclusive
                onChange={handleViewScaleChange}
                aria-label="view density"
                size="small"
                sx={{ /* ... ToggleButton styling ... */ }}
              >
                <ToggleButton value="compact" aria-label="compact view">
                  <Tooltip title="Compact view"><ViewCompactIcon fontSize="small" /></Tooltip>
                </ToggleButton>
                <ToggleButton value="comfortable" aria-label="comfortable view">
                  <Tooltip title="Comfortable view"><ViewModuleIcon fontSize="small" /></Tooltip>
                </ToggleButton>
                <ToggleButton value="spacious" aria-label="spacious view">
                  <Tooltip title="Spacious view"><ViewListIcon fontSize="small" /></Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
            </Paper>
          </Box>
          
          {/* Right side: Actions, Notifications, Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Quick Actions Button (Mobile/Tablet) */}
            <Tooltip title="Quick actions">
              <IconButton /* ... Quick Actions Icon Button styling ... */
                color="inherit"
                onClick={handleQuickActionsOpen}
                size="medium"
                sx={{ mr: 1.5, display: { xs: 'flex', md: 'none' }, /* ... bgcolor ... */ }}
              >
                <SpeedIcon />
              </IconButton>
            </Tooltip>
            
            {/* Quick Actions (Desktop) */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, mr: 2 }}>
              <Button /* ... New Invoice Button styling ... */
                variant="contained" size="small" startIcon={<AddIcon />}
                onClick={() => router.push('/invoices/new')}
                sx={{ mr: 1.5, /* ... bgcolor ... */ }}
              > New Invoice </Button>
              <Button /* ... New Product Button styling ... */
                variant="contained" size="small" startIcon={<AddIcon />}
                onClick={() => router.push('/products/new')}
                sx={{ /* ... bgcolor ... */ }}
              > New Product </Button>
            </Box>
            
            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton /* ... Notifications Icon Button styling ... */
                color="inherit" onClick={handleNotificationsOpen} size="medium"
                sx={{ mr: 1.5, /* ... bgcolor ... */ }}
              >
                <Badge badgeContent={unreadNotificationsCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            {/* User Profile */}
            <Tooltip title="Account settings">
              <IconButton /* ... Profile Icon Button styling ... */
                onClick={handleProfileMenuOpen} size="medium"
                sx={{ /* ... bgcolor ... */ }}
              >
                <Avatar /* ... Avatar styling ... */
                  sx={{ width: 32, height: 32, /* ... bgcolor ... */ }}
                  src={currentUser?.photoURL || undefined}
                > {getUserInitials()} </Avatar>
              </IconButton>
            </Tooltip>
            
            {/* --- Menus (Quick Actions, Notifications, Profile) --- */}
            {/* Quick Actions Menu (Mobile) */}
            <Menu anchorEl={quickActionsAnchor} open={quickActionsOpen} onClose={handleQuickActionsClose} /* ... PaperProps & positioning ... */ >
              {/* ... MenuItems for quick actions ... */}
              {/* Include View Scale Toggle here for mobile */}
              <Divider sx={{ display: { md: 'none' } }} />
              <Box sx={{ px: 2, py: 1, display: { md: 'none' }, justifyContent: 'center' }}>
                <ToggleButtonGroup value={viewScale} exclusive onChange={handleViewScaleChange} size="small">
                  <ToggleButton value="compact"><ViewCompactIcon fontSize="small" /></ToggleButton>
                  <ToggleButton value="comfortable"><ViewModuleIcon fontSize="small" /></ToggleButton>
                  <ToggleButton value="spacious"><ViewListIcon fontSize="small" /></ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Menu>
            
            {/* Notifications Menu */}
            <Menu anchorEl={notificationsAnchor} open={notificationsOpen} onClose={handleNotificationsClose} /* ... PaperProps & positioning ... */ >
              {/* ... Notification items ... */}
            </Menu>
            
            {/* User Profile Menu */}
            <Menu anchorEl={profileMenuAnchor} open={profileMenuOpen} onClose={handleProfileMenuClose} /* ... PaperProps & positioning ... */ >
              {/* ... Profile items (Profile, Settings, Logout) ... */}
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Drawer */}
      <Drawer
        variant={drawerVariant} // 'temporary' on mobile, 'persistent' otherwise
        open={drawerOpen}
        onClose={isMobileLayout ? toggleDrawer : undefined} // Close on overlay click only for temporary drawer
        ModalProps={{ keepMounted: true }} // Better open performance on mobile.
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
            overflowX: 'hidden', // Prevent horizontal scroll
            bgcolor: theme.palette.background.paper, // Ensure drawer has background
          },
        }}
      >
        {/* Toolbar spacer to push content below AppBar */}
        <Toolbar /> 
        {/* Optional: Add a header or logo here */}
        <Box sx={{ overflow: 'auto', flexGrow: 1, mt: 1 }}>
          <ImprovedNavigation 
            collapsed={!isMobileLayout && drawerCollapsed} 
            closeDrawer={closeDrawer} 
            onToggleCollapsed={toggleDrawerCollapsed} 
          />
        </Box>
         {/* Optional: Add a collapse button at the bottom for persistent drawer */}
         {!isMobileLayout && drawerOpen && (
           <Box sx={{ p: 1, textAlign: 'right' }}>
             <Tooltip title={drawerCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
               <IconButton onClick={toggleDrawerCollapsed}>
                 {drawerCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
               </IconButton>
             </Tooltip>
           </Box>
         )}
      </Drawer>
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: `${APPBAR_HEIGHT}px`, // Padding top for AppBar
          height: '100vh', // Full viewport height
          overflow: 'auto', // Allow scrolling within content area
          bgcolor: theme.palette.background.default,
          transition: theme.transitions.create(['margin'], { // Transition margin for persistent drawer
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          ...getContentMargin(), // Apply margin based on drawer state
        }}
      >
        {/* Apply view scale padding */}
        <Box sx={{ ...getContentSpacing() }}> 
          {children}
        </Box>
      </Box>
    </Box>
  );
}