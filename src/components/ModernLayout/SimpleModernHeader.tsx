'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, alpha } from '@mui/material/styles';
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
  Chip,
  useMediaQuery,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ClickAwayListener,
  CircularProgress,
  ButtonGroup,
} from '@mui/material';

import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Help as HelpIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  Add as AddIcon,
  Star as StarIcon,
  History as HistoryIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  AccountCircle as AccountCircleIcon,
  ShoppingCart as ShoppingCartIcon,
  Analytics as AnalyticsIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  MoreVert as MoreVertIcon,
  Store as StoreIcon,
  Category as CategoryIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
} from '@mui/icons-material';

import { useAuth } from '@/contexts/AuthContext';
import { handleLogout } from '@/utils/authRedirects';

interface SuperEnhancedHeaderProps {
  onDrawerToggle?: () => void;
  onMenuClick?: () => void;
  isDrawerOpen?: boolean;
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
  title?: string;
  showSearch?: boolean;
  showQuickActions?: boolean;
  showPartyQuickAccess?: boolean;
  showNotifications?: boolean;
  enableVoiceSearch?: boolean;
  enableShortcuts?: boolean;
  showSpeedDial?: boolean;
}

export default function SuperEnhancedHeader({
  onDrawerToggle,
  onMenuClick,
  isDrawerOpen = false,
  onThemeToggle,
  isDarkMode = false,
  title,
  showSearch = true,
  showQuickActions = true,
  showPartyQuickAccess = true,
  showNotifications = true,
  enableVoiceSearch = false,
  enableShortcuts = true,
  showSpeedDial = true,
}: SuperEnhancedHeaderProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentUser, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const [quickActionsAnchor, setQuickActionsAnchor] = useState<null | HTMLElement>(null);

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

  const handleQuickActionsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setQuickActionsAnchor(event.currentTarget);
  };

  const handleQuickActionsClose = () => {
    setQuickActionsAnchor(null);
  };

  const handleLogoutClick = async () => {
    handleProfileMenuClose();
    await handleLogout(logout, router);
  };

  const getPageTitle = () => {
    if (title) return title;
    
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length === 0) return 'Dashboard';
    
    const lastSegment = pathSegments[pathSegments.length - 1];
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace('-', ' ');
  };

  return (
    <>
      <AppBar
        position="absolute"
        elevation={0}
        sx={{
          position: 'sticky',
          backdropFilter: 'blur(20px)',
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.05)}`,
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 1.5, sm: 2, md: 3 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => {
              if (onMenuClick) {
                onMenuClick();
              } else if (onDrawerToggle) {
                onDrawerToggle();
              }
            }}
            sx={{
              mr: { xs: 1, sm: 2 },
              display: { md: 'none' },
              color: theme.palette.text.primary,
            }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', mr: { xs: 0.5, sm: 1, md: 2 }, minWidth: 0 }}>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              {getPageTitle()}
            </Typography>
          </Box>

          {showSearch && (
            <Box sx={{ flexGrow: 1, maxWidth: { sm: 280, md: 400, lg: 500 }, mx: { xs: 0.5, sm: 1, md: 1.5 }, display: { xs: 'none', sm: 'block' } }}>
              <Paper
                component="div"
                sx={{
                  p: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: alpha(theme.palette.background.paper, 0.9),
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  borderRadius: 3,
                }}
              >
                <IconButton sx={{ p: '8px' }}>
                  <SearchIcon />
                </IconButton>
                <InputBase
                  ref={searchInputRef}
                  sx={{ ml: 1, flex: 1, fontSize: { xs: '0.875rem', sm: '1rem' } }}
                  placeholder={isMobile ? "Search..." : "Search... (Ctrl+K)"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                />
              </Paper>
            </Box>
          )}

          <Box sx={{ flexGrow: 1, display: { md: 'none' } }} />

          {showQuickActions && (
            <Box sx={{ mr: { xs: 0.5, sm: 1, md: 2 }, display: { xs: 'none', lg: 'block' } }}>
              <Button
                onClick={handleQuickActionsOpen}
                startIcon={<StarIcon />}
                endIcon={<KeyboardArrowDownIcon />}
                sx={{ color: theme.palette.text.primary, textTransform: 'none', borderRadius: 2, px: 2 }}
              >
                Quick Actions
              </Button>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
            {showQuickActions && (
              <IconButton color="inherit" onClick={handleQuickActionsOpen} sx={{ color: theme.palette.text.primary, display: { xs: 'flex', lg: 'none' } }}>
                <AddIcon />
              </IconButton>
            )}

            {showNotifications && (
              <IconButton
                color="inherit"
                onClick={handleNotificationsOpen}
                sx={{ color: theme.palette.text.primary, display: { xs: 'none', sm: 'flex' } }}
              >
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            )}

            {onThemeToggle && (
              <IconButton
                color="inherit"
                onClick={onThemeToggle}
                sx={{ color: theme.palette.text.primary, display: { xs: 'none', md: 'flex' } }}
              >
                {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            )}

            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{
                p: 0.5,
                ml: { xs: 0.5, sm: 1 },
                border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                display: { xs: 'none', sm: 'flex' },
              }}
            >
              <Avatar
                alt={currentUser?.displayName || 'User'}
                src={currentUser?.photoURL || undefined}
                sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 } }}
              >
                {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => { handleProfileMenuClose(); router.push('/profile'); }}>
          <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleProfileMenuClose(); router.push('/settings'); }}>
          <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogoutClick}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
