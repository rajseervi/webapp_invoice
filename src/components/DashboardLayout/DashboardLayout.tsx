"use client"
import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Badge,
  Collapse,
  useTheme,
  alpha,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Inventory,
  ShoppingCart,
  Assessment,
  Settings,
  People,
  Notifications,
  ChevronLeft,
  ExpandLess,
  ExpandMore,
  Circle as CircleIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { handleLogout } from '@/utils/authRedirects';
import ThemeToggle from '../ThemeToggle';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { 
    text: 'Inventory', 
    icon: <Inventory />, 
    path: '/inventory',
    subItems: [
      { text: 'Overview', path: '/inventory' },
      { text: 'Alerts', path: '/inventory/alerts' },
      { text: 'Products', path: '/products' },
      { text: 'Categories', path: '/categories' }
    ]
  },
  { text: 'Sales', icon: <ShoppingCart />, path: '/sales' },
  { text: 'Reports', icon: <Assessment />, path: '/reports' },
  { text: 'Users', icon: <People />, path: '/users' },
  { text: 'Settings', icon: <Settings />, path: '/settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser } = useAuth();
  
  const [open, setOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({
    Inventory: true // Default expanded state
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New order received", read: false },
    { id: 2, message: "Low stock alert: Product XYZ", read: false },
    { id: 3, message: "Payment confirmed", read: true },
    { id: 4, message: "New user registered", read: true }
  ]);
  
  // Handle window resize to collapse sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 960) {
        setOpen(false);
      } else {
        setOpen(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleMenuToggle = (text: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [text]: !prev[text]
    }));
  };
  
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };
  
  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };
  
  const handleProfileClick = () => {
    router.push('/profile');
    handleProfileMenuClose();
  };
  
  const handleLogout = async () => {
    try {
      const { logout } = useAuth();
      
      // Use the utility function for logout
      await handleLogout(
        logout,
        router,
        handleProfileMenuClose
      );
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
  };
  
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: theme.palette.mode === 'light' 
            ? 'linear-gradient(90deg, rgba(67,97,238,1) 0%, rgba(72,149,239,1) 100%)' 
            : 'linear-gradient(90deg, rgba(30,41,59,1) 0%, rgba(44,55,74,1) 100%)',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setOpen(!open)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Inventory sx={{ display: { xs: 'none', sm: 'block' } }} />
            Inventory Management System
          </Typography>
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton 
              color="inherit"
              onClick={handleNotificationsOpen}
            >
              <Badge badgeContent={unreadNotificationsCount} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* User Profile */}
          <Tooltip title="Account">
            <IconButton 
              onClick={handleProfileMenuOpen}
              sx={{ ml: 1 }}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32,
                  bgcolor: theme.palette.secondary.main
                }}
              >
                P
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      
      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { 
            mt: 1.5,
            minWidth: 200,
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
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleProfileClick}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
      
      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchorEl}
        open={Boolean(notificationsAnchorEl)}
        onClose={handleNotificationsClose}
        PaperProps={{
          elevation: 3,
          sx: { 
            mt: 1.5,
            minWidth: 300,
            maxWidth: 360,
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
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight={600}>Notifications</Typography>
        </Box>
        {notifications.length > 0 ? (
          <>
            {notifications.map((notification) => (
              <MenuItem 
                key={notification.id} 
                onClick={handleNotificationsClose}
                sx={{ 
                  py: 1.5,
                  px: 2,
                  borderLeft: notification.read ? 'none' : `3px solid ${theme.palette.primary.main}`,
                  bgcolor: notification.read ? 'transparent' : alpha(theme.palette.primary.main, 0.08),
                }}
              >
                <Typography variant="body2">{notification.message}</Typography>
              </MenuItem>
            ))}
            <Box sx={{ p: 1, borderTop: `1px solid ${theme.palette.divider}`, textAlign: 'center' }}>
              <Typography 
                variant="body2" 
                color="primary" 
                sx={{ cursor: 'pointer', fontWeight: 500 }}
                onClick={() => {
                  router.push('/notifications');
                  handleNotificationsClose();
                }}
              >
                View All
              </Typography>
            </Box>
          </>
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">No notifications</Typography>
          </Box>
        )}
      </Menu>

      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            ...(open ? {
              transition: theme =>
                theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
            } : {
              width: theme => theme.spacing(7),
              transition: theme =>
                theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.leavingScreen,
                }),
              overflowX: 'hidden',
            }),
          },
        }}
      >
        <Toolbar 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-end',
            px: [1],
          }}
        >
          {open && (
            <IconButton onClick={() => setOpen(false)}>
              <ChevronLeft />
            </IconButton>
          )}
        </Toolbar>
        <Divider />
        
        {/* User Profile Summary */}
        {open && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Avatar 
              sx={{ 
                width: 64, 
                height: 64, 
                mx: 'auto',
                mb: 1,
                bgcolor: theme.palette.secondary.main,
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}
            >
              P
            </Avatar>
            <Typography variant="subtitle1" fontWeight={600}>
              Prakash Seervi
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Administrator
            </Typography>
          </Box>
        )}
        
        <Divider />
        
        <Box 
          sx={{ 
            overflow: 'auto',
            px: open ? 2 : 1,
            py: 2,
            height: '100%',
            backgroundColor: theme.palette.mode === 'light' 
              ? alpha(theme.palette.primary.main, 0.03)
              : 'transparent'
          }}
        >
          <List component="nav" disablePadding>
            {menuItems.map((item) => (
              <React.Fragment key={item.text}>
                <Tooltip 
                  title={!open ? item.text : ""}
                  placement="right"
                  arrow
                  disableHoverListener={open}
                >
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      selected={pathname === item.path || pathname?.startsWith(item.path + '/')}
                      onClick={() => {
                        if (item.subItems) {
                          handleMenuToggle(item.text);
                        } else {
                          router.push(item.path);
                        }
                      }}
                      sx={{
                        minHeight: 48,
                        justifyContent: open ? 'initial' : 'center',
                        px: 2.5,
                        borderRadius: '10px',
                        '&.Mui-selected': {
                          color: theme.palette.primary.main,
                        }
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: open ? 2 : 'auto',
                          justifyContent: 'center',
                          color: 'inherit'
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      {open && (
                        <ListItemText 
                          primary={item.text} 
                          primaryTypographyProps={{ 
                            fontWeight: pathname === item.path || pathname?.startsWith(item.path + '/') ? 600 : 500,
                            fontSize: '0.9rem'
                          }}
                        />
                      )}
                      {item.subItems && open && (
                        expandedMenus[item.text] ? <ExpandLess /> : <ExpandMore />
                      )}
                    </ListItemButton>
                  </ListItem>
                </Tooltip>
                
                {item.subItems && (
                  <Collapse in={open && expandedMenus[item.text]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.subItems.map((subItem) => (
                        <Tooltip 
                          key={subItem.text}
                          title={!open ? subItem.text : ""}
                          placement="right"
                          arrow
                          disableHoverListener={open}
                        >
                          <ListItemButton
                            selected={pathname === subItem.path}
                            onClick={() => router.push(subItem.path)}
                            sx={{
                              pl: 4,
                              minHeight: 40,
                              borderRadius: '10px',
                              mb: 0.5,
                              '&.Mui-selected': {
                                color: theme.palette.primary.main,
                              }
                            }}
                          >
                            <ListItemIcon 
                              sx={{ 
                                minWidth: 24, 
                                mr: open ? 2 : 'auto',
                                color: 'inherit'
                              }}
                            >
                              <CircleIcon sx={{ fontSize: 8 }} />
                            </ListItemIcon>
                            {open && (
                              <ListItemText 
                                primary={subItem.text} 
                                primaryTypographyProps={{ 
                                  fontWeight: pathname === subItem.path ? 600 : 400,
                                  fontSize: '0.85rem'
                                }}
                              />
                            )}
                          </ListItemButton>
                        </Tooltip>
                      ))}
                    </List>
                  </Collapse>
                )}
              </React.Fragment>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, sm: 3 },
          backgroundColor: theme.palette.mode === 'light' 
            ? alpha(theme.palette.primary.main, 0.02)
            : 'transparent',
          minHeight: '100vh',
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(open && {
            width: `calc(100% - ${drawerWidth}px)`,
            marginLeft: `${drawerWidth}px`,
            transition: theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}
      >
        <Toolbar />
        <Box 
          sx={{ 
            maxWidth: '100%',
            animation: 'fadeIn 0.5s',
            '@keyframes fadeIn': {
              '0%': {
                opacity: 0,
                transform: 'translateY(10px)'
              },
              '100%': {
                opacity: 1,
                transform: 'translateY(0)'
              },
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}