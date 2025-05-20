"use client";
import React, { useState, useEffect, ReactNode } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  useMediaQuery,
  Tooltip,
  Divider,
  Container,
  alpha,
  Button
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import Sidebar from './Sidebar';
import { useRouter } from 'next/navigation';

// Define sidebar width for layout calculations
const DRAWER_WIDTH = 240;

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const theme = useTheme();
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State for sidebar and menus
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const [sidebarVariant, setSidebarVariant] = useState<'permanent' | 'temporary'>(isMobile ? 'temporary' : 'permanent');

  // Handle menu openings
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  // Handle menu closings
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsMenuClose = () => {
    setNotificationsAnchorEl(null);
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Effect to handle responsive changes
  useEffect(() => {
    setSidebarVariant(isMobile ? 'temporary' : 'permanent');
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  // Handle navigation from menus
  const handleNavigate = (path: string) => {
    router.push(path);
    handleMenuClose();
  };

  // Mock notifications
  const notifications = [
    { id: 1, message: 'New invoice created', time: '5 minutes ago' },
    { id: 2, message: 'Payment received', time: '1 hour ago' },
    { id: 3, message: 'Low stock alert', time: '3 hours ago' },
  ];

const sidebarItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: &lt;DashboardIcon /&gt;
    },
    {
      title: 'Invoices',
      path: '/invoices',
      icon: &lt;ReceiptIcon /&gt;
    },
    {
      title: 'Inventory',
      path: '/inventory',
      icon: &lt;InventoryIcon /&gt;
    },
    {
      title: 'Parties',
      path: '/parties',
      icon: &lt;PeopleIcon /&gt;
    },
    {
      title: 'Settings',
      path: '/settings',
      icon: &lt;SettingsIcon /&gt;
    }
  ];
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          boxShadow: '0 1px 10px rgba(0,0,0,0.08)',
          bgcolor: 'background.paper',
          color: 'text.primary',
          backdropFilter: 'blur(8px)',
          background: theme => `rgba(${theme.palette.mode === 'dark' ? '18, 18, 18' : '255, 255, 255'}, 0.95)`,
        }}
      >
        <Container maxWidth="xl" disableGutters>
          <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={toggleSidebar}
              sx={{ 
                mr: 2,
                color: theme.palette.primary.main,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08)
                }
              }}
            >
              <MenuIcon />
            </IconButton>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: theme.palette.primary.main,
                  display: { xs: 'none', sm: 'flex' },
                  mr: 1.5
                }}
              >
                M
              </Avatar>
              <Typography 
                variant="h6" 
                noWrap 
                component="div" 
                sx={{ 
                  flexGrow: 1, 
                  fontWeight: 700,
                  background: theme => `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textFillColor: 'transparent'
                }}
              >
                Mastermind
              </Typography>
            </Box>
            
            <Box sx={{ flexGrow: 1 }} />
            
            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton 
                color="inherit" 
                onClick={handleNotificationsMenuOpen}
                sx={{ 
                  mx: 1,
                  bgcolor: notifications.length > 0 ? alpha(theme.palette.error.main, 0.08) : 'transparent',
                  '&:hover': {
                    bgcolor: notifications.length > 0 ? alpha(theme.palette.error.main, 0.12) : alpha(theme.palette.action.hover, 0.8)
                  }
                }}
              >
                <Badge 
                  badgeContent={notifications.length} 
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.65rem',
                      height: 18,
                      minWidth: 18,
                      padding: '0 4px'
                    }
                  }}
                >
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            {/* Profile */}
            <Tooltip title="Account">
              <IconButton
                edge="end"
                aria-label="account of current user"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
                sx={{ 
                  ml: 1,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.08)
                  }
                }}
              >
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    bgcolor: theme.palette.primary.main,
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                  }}
                >
                  JD
                </Avatar>
              </IconButton>
            </Tooltip>
          </Toolbar>
        </Container>
      </AppBar>
      
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        variant={sidebarVariant}
        sidebarItems={sidebarItems}
      />
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { md: `calc(100% - ${sidebarOpen && !isMobile ? DRAWER_WIDTH : 0}px)` },
          ml: { md: sidebarOpen && !isMobile ? `${DRAWER_WIDTH}px` : 0 },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          mt: '64px', // Toolbar height
          maxWidth: '100vw',
          overflow: 'hidden',
        }}
      >
        <Box 
          sx={{ 
            maxWidth: '1600px', 
            mx: 'auto',
            pb: 4
          }}
        >
          {children}
        </Box>
      </Box>
      
      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
            borderRadius: 2,
            minWidth: 250,
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
          }
        }}
      >
        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center' }}>
          <Avatar 
            sx={{ 
              width: 48, 
              height: 48, 
              bgcolor: theme.palette.primary.main,
              mr: 2,
              boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`
            }}
          >
            JD
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">John Doe</Typography>
            <Typography variant="body2" color="text.secondary">admin@example.com</Typography>
          </Box>
        </Box>
        <Divider />
        <Box sx={{ px: 1, py: 1 }}>
          <MenuItem 
            onClick={() => handleNavigate('/profile')}
            sx={{ 
              borderRadius: 1,
              py: 1,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.08)
              }
            }}
          >
            <PersonIcon fontSize="small" sx={{ mr: 2, color: theme.palette.primary.main }} />
            <Typography variant="body2">Profile</Typography>
          </MenuItem>
          <MenuItem 
            onClick={() => handleNavigate('/settings')}
            sx={{ 
              borderRadius: 1,
              py: 1,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.08)
              }
            }}
          >
            <SettingsIcon fontSize="small" sx={{ mr: 2, color: theme.palette.primary.main }} />
            <Typography variant="body2">Settings</Typography>
          </MenuItem>
        </Box>
        <Divider />
        <Box sx={{ px: 1, py: 1 }}>
          <MenuItem 
            onClick={handleMenuClose}
            sx={{ 
              borderRadius: 1,
              py: 1,
              color: theme.palette.error.main,
              '&:hover': {
                bgcolor: alpha(theme.palette.error.main, 0.08)
              }
            }}
          >
            <LogoutIcon fontSize="small" sx={{ mr: 2 }} />
            <Typography variant="body2">Logout</Typography>
          </MenuItem>
        </Box>
      </Menu>
      
      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(notificationsAnchorEl)}
        onClose={handleNotificationsMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { 
            width: 320, 
            maxHeight: 450,
            mt: 1.5,
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
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
          }
        }}
      >
        <Box sx={{ 
          px: 3, 
          py: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Typography variant="subtitle1" fontWeight="bold">Notifications</Typography>
          <Badge 
            badgeContent={notifications.length} 
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.65rem',
                height: 18,
                minWidth: 18,
                padding: '0 4px'
              }
            }}
          >
            <NotificationsIcon color="action" fontSize="small" />
          </Badge>
        </Box>
        
        <Box sx={{ maxHeight: 320, overflowY: 'auto' }}>
          {notifications.map((notification) => (
            <MenuItem 
              key={notification.id} 
              onClick={handleNotificationsMenuClose}
              sx={{ 
                py: 1.5, 
                px: 2,
                borderLeft: '4px solid transparent',
                '&:hover': {
                  borderLeft: `4px solid ${theme.palette.primary.main}`,
                  bgcolor: alpha(theme.palette.primary.main, 0.05)
                }
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography 
                    variant="body2" 
                    fontWeight={600}
                    sx={{ color: theme.palette.text.primary }}
                  >
                    {notification.message}
                  </Typography>
                  <Box 
                    sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      bgcolor: theme.palette.primary.main,
                      ml: 1,
                      flexShrink: 0
                    }} 
                  />
                </Box>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ display: 'block' }}
                >
                  {notification.time}
                </Typography>
              </Box>
            </MenuItem>
          ))}
          
          {notifications.length === 0 && (
            <Box sx={{ 
              py: 6, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.palette.text.secondary
            }}>
              <NotificationsIcon sx={{ fontSize: 48, color: alpha(theme.palette.text.secondary, 0.2), mb: 2 }} />
              <Typography variant="body2" color="text.secondary">No new notifications</Typography>
            </Box>
          )}
        </Box>
        
        <Box sx={{ 
          p: 2, 
          borderTop: `1px solid ${theme.palette.divider}`,
          textAlign: 'center'
        }}>
          <Button 
            variant="text" 
            color="primary" 
            size="small"
            onClick={handleNotificationsMenuClose}
            sx={{ 
              borderRadius: 2,
              px: 3,
              fontWeight: 600
            }}
          >
            View all notifications
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default DashboardLayout;