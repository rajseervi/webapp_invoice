'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Typography,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Button,
  InputBase,
  useMediaQuery,
  alpha,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Add as AddIcon,
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

interface SimpleModernHeaderProps {
  title?: string;
  showSearch?: boolean;
  showQuickActions?: boolean;
  showNotifications?: boolean;
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
  onMenuClick?: () => void;
  customQuickActions?: Array<{
    id: string;
    title: string;
    icon: React.ReactNode;
    path: string;
    color?: string;
    badge?: number;
    isNew?: boolean;
  }>;
}

export const SimpleModernHeader: React.FC<SimpleModernHeaderProps> = ({
  title = 'Admin Dashboard',
  showSearch = true,
  showQuickActions = true,
  showNotifications = true,
  onThemeToggle,
  isDarkMode = false,
  onMenuClick,
  customQuickActions,
}) => {
  const theme = useTheme();
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State for menus
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [quickActionsAnchorEl, setQuickActionsAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const [searchValue, setSearchValue] = useState('');

  // Menu handlers
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };

  const handleQuickActionsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setQuickActionsAnchorEl(event.currentTarget);
  };

  const handleQuickActionsClose = () => {
    setQuickActionsAnchorEl(null);
  };

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
    router.push('/login');
  };

  const handleQuickActionClick = (path: string) => {
    handleQuickActionsClose();
    router.push(path);
  };

  // Default quick actions
  const defaultQuickActions = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/admin/dashboard',
      color: theme.palette.primary.main,
    },
    {
      id: 'new-invoice',
      title: 'New Invoice',
      icon: <AddIcon />,
      path: '/invoices/new',
      color: theme.palette.success.main,
      isNew: true,
    },
    {
      id: 'products',
      title: 'Products',
      icon: <InventoryIcon />,
      path: '/products',
      color: theme.palette.warning.main,
    },
    {
      id: 'parties',
      title: 'Parties',
      icon: <PeopleIcon />,
      path: '/parties',
      color: theme.palette.secondary.main,
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: <AssessmentIcon />,
      path: '/reports',
      color: theme.palette.error.main,
    },
  ];

  const quickActions = customQuickActions || defaultQuickActions;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary,
      }}
    >
      <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
        {/* Menu button for mobile */}
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Title */}
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: { xs: 1, md: 0 },
            mr: { md: 4 },
            fontWeight: 700,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {title}
        </Typography>

        {/* Search */}
        {showSearch && !isMobile && (
          <Box
            sx={{
              position: 'relative',
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.common.white, 0.15),
              '&:hover': {
                backgroundColor: alpha(theme.palette.common.white, 0.25),
              },
              marginLeft: 0,
              width: '100%',
              maxWidth: 400,
              mr: 2,
            }}
          >
            <Box
              sx={{
                padding: theme.spacing(0, 2),
                height: '100%',
                position: 'absolute',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SearchIcon />
            </Box>
            <InputBase
              placeholder="Search parties, products, invoices..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              sx={{
                color: 'inherit',
                '& .MuiInputBase-input': {
                  padding: theme.spacing(1, 1, 1, 0),
                  paddingLeft: `calc(1em + ${theme.spacing(4)})`,
                  transition: theme.transitions.create('width'),
                  width: '100%',
                },
              }}
            />
          </Box>
        )}

        <Box sx={{ flexGrow: 1 }} />

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Search button for mobile */}
          {showSearch && isMobile && (
            <IconButton color="inherit">
              <SearchIcon />
            </IconButton>
          )}

          {/* Quick Actions */}
          {showQuickActions && (
            <>
              <Button
                color="inherit"
                startIcon={<AddIcon />}
                onClick={handleQuickActionsOpen}
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Quick Actions
              </Button>
              <Menu
                anchorEl={quickActionsAnchorEl}
                open={Boolean(quickActionsAnchorEl)}
                onClose={handleQuickActionsClose}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 200,
                    borderRadius: 2,
                  },
                }}
              >
                {quickActions.map((action) => (
                  <MenuItem
                    key={action.id}
                    onClick={() => handleQuickActionClick(action.path)}
                    sx={{
                      py: 1.5,
                      '&:hover': {
                        backgroundColor: alpha(action.color || theme.palette.primary.main, 0.1),
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: action.color }}>
                      {action.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={action.title}
                      secondary={action.isNew ? 'New!' : undefined}
                    />
                    {action.badge && (
                      <Badge badgeContent={action.badge} color="error" />
                    )}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}

          {/* Theme Toggle */}
          {onThemeToggle && (
            <Tooltip title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
              <IconButton color="inherit" onClick={onThemeToggle}>
                {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
          )}

          {/* Notifications */}
          {showNotifications && (
            <>
              <Tooltip title="Notifications">
                <IconButton color="inherit" onClick={handleNotificationsOpen}>
                  <Badge badgeContent={3} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={notificationsAnchorEl}
                open={Boolean(notificationsAnchorEl)}
                onClose={handleNotificationsClose}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 300,
                    borderRadius: 2,
                  },
                }}
              >
                <MenuItem>
                  <ListItemText
                    primary="New invoice created"
                    secondary="2 minutes ago"
                  />
                </MenuItem>
                <MenuItem>
                  <ListItemText
                    primary="Payment received"
                    secondary="1 hour ago"
                  />
                </MenuItem>
                <MenuItem>
                  <ListItemText
                    primary="Low stock alert"
                    secondary="3 hours ago"
                  />
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleNotificationsClose}>
                  <ListItemText primary="View all notifications" />
                </MenuItem>
              </Menu>
            </>
          )}

          {/* Profile */}
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleProfileMenuOpen}
              size="small"
              sx={{ ml: 1 }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: theme.palette.primary.main,
                  fontSize: '0.875rem',
                }}
              >
                {currentUser?.name?.charAt(0) || 'A'}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={profileAnchorEl}
            open={Boolean(profileAnchorEl)}
            onClose={handleProfileMenuClose}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 200,
                borderRadius: 2,
              },
            }}
          >
            <MenuItem onClick={handleProfileMenuClose}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleProfileMenuClose}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default SimpleModernHeader;