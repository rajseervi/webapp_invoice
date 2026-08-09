'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  Autocomplete,
  TextField,
  Popper,
  ClickAwayListener,
  Grow,
  MenuList,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  CircularProgress,
} from '@mui/material';

// Icons
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
  Business as BusinessIcon,
  Language as LanguageIcon,
  Security as SecurityIcon,
  Bookmark as BookmarkIcon,
  Close as CloseIcon,
  ArrowDropDown as ArrowDropDownIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  AccountCircle as AccountCircleIcon,
  ExitToApp as ExitToAppIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';

import { useAuth } from '@/contexts/AuthContext';
import { handleLogout } from '@/utils/authRedirects';
import { partyService } from '@/services/partyService';
import { productService } from '@/services/productService';

// Types
interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'party' | 'product' | 'invoice' | 'order' | 'page';
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

interface QuickAction {
  id: string;
  title: string;
  icon: React.ReactNode;
  path: string;
  color?: string;
  badge?: number;
  isNew?: boolean;
}

interface EnhancedHeaderProps {
  onDrawerToggle?: () => void;
  isDrawerOpen?: boolean;
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
  title?: string;
  showSearch?: boolean;
  showQuickActions?: boolean;
  customQuickActions?: QuickAction[];
}

// Default quick actions
const defaultQuickActions: QuickAction[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
    color: '#2196F3',
  },
  {
    id: 'new-invoice',
    title: 'New Invoice',
    icon: <AddIcon />,
    path: '/invoices/new',
    color: '#4CAF50',
    isNew: true,
  },
  {
    id: 'products',
    title: 'Products',
    icon: <InventoryIcon />,
    path: '/products',
    color: '#FF9800',
  },
  {
    id: 'parties',
    title: 'Parties',
    icon: <PeopleIcon />,
    path: '/parties',
    color: '#9C27B0',
  },
  {
    id: 'invoices',
    title: 'Invoices',
    icon: <ReceiptIcon />,
    path: '/invoices',
    color: '#F44336',
  },
];

export default function EnhancedHeader({
  onDrawerToggle,
  isDrawerOpen = false,
  onThemeToggle,
  isDarkMode = false,
  title,
  showSearch = true,
  showQuickActions = true,
  customQuickActions,
}: EnhancedHeaderProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const [quickActionsAnchor, setQuickActionsAnchor] = useState<null | HTMLElement>(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  // Memoized quick actions
  const quickActions = useMemo(() => {
    return customQuickActions || defaultQuickActions;
  }, [customQuickActions]);

  // Search functionality
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const results: SearchResult[] = [];

      // Search parties
      const parties = await partyService.getAllParties();
      const matchingParties = parties
        .filter(party => 
          party.name?.toLowerCase().includes(query.toLowerCase()) ||
          party.email?.toLowerCase().includes(query.toLowerCase()) ||
          party.phone?.includes(query)
        )
        .slice(0, 3)
        .map(party => ({
          id: party.id,
          title: party.name || 'Unnamed Party',
          subtitle: party.email || party.phone || '',
          type: 'party' as const,
          path: `/parties/${party.id}`,
          icon: <PeopleIcon />,
          badge: party.type || 'Party',
        }));

      results.push(...matchingParties);

      // Search products (if productService is available)
      try {
        const products = await productService.getAllProducts();
        const matchingProducts = products
          .filter(product => 
            product.name?.toLowerCase().includes(query.toLowerCase()) ||
            product.code?.toLowerCase().includes(query.toLowerCase()) ||
            product.category?.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 3)
          .map(product => ({
            id: product.id,
            title: product.name || 'Unnamed Product',
            subtitle: `Code: ${product.code || 'N/A'} | Category: ${product.category || 'N/A'}`,
            type: 'product' as const,
            path: `/products/edit/${product.id}`,
            icon: <InventoryIcon />,
            badge: product.category || 'Product',
          }));

        results.push(...matchingProducts);
      } catch (error) {
        console.log('Product search not available:', error);
      }

      // Add page/navigation results
      const pageResults = [
        { title: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
        { title: 'Invoices', path: '/invoices', icon: <ReceiptIcon /> },
        { title: 'Products', path: '/products', icon: <InventoryIcon /> },
        { title: 'Parties', path: '/parties', icon: <PeopleIcon /> },
        { title: 'Orders', path: '/orders', icon: <ReceiptIcon /> },
        { title: 'Reports', path: '/reports', icon: <ReceiptIcon /> },
        { title: 'Settings', path: '/settings', icon: <SettingsIcon /> },
      ]
        .filter(page => page.title.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 2)
        .map(page => ({
          id: `page-${page.path}`,
          title: page.title,
          subtitle: 'Navigate to page',
          type: 'page' as const,
          path: page.path,
          icon: page.icon,
          badge: 'Page',
        }));

      results.push(...pageResults);

      setSearchResults(results.slice(0, 8)); // Limit to 8 results
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // Handle search result selection
  const handleSearchResultClick = (result: SearchResult) => {
    router.push(result.path);
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Handle profile menu
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  // Handle notifications
  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  // Handle quick actions
  const handleQuickActionsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setQuickActionsAnchor(event.currentTarget);
  };

  const handleQuickActionsClose = () => {
    setQuickActionsAnchor(null);
  };

  // Handle logout
  const handleLogoutClick = async () => {
    handleProfileMenuClose();
    await handleLogout(logout, router);
  };

  // Get page title
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
        position="fixed"
        elevation={0}
        sx={{
          width: { md: isDrawerOpen ? `calc(100% - 280px)` : `calc(100% - 72px)` },
          ml: { md: isDrawerOpen ? '280px' : '72px' },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          backdropFilter: 'blur(20px)',
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.05)}`,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 2, sm: 3 } }}>
          {/* Mobile menu button */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              color: theme.palette.text.primary,
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Page title */}
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: { xs: 1, md: 0 },
              mr: { md: 3 },
              color: theme.palette.text.primary,
              fontWeight: 600,
            }}
          >
            {getPageTitle()}
          </Typography>

          {/* Search bar */}
          {showSearch && !isMobile && (
            <Box sx={{ flexGrow: 1, maxWidth: 600, mx: 2, position: 'relative' }}>
              <Paper
                component="div"
                sx={{
                  p: '2px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  borderRadius: 2,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`,
                  },
                  '&:focus-within': {
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                    borderColor: theme.palette.primary.main,
                  },
                }}
              >
                <IconButton sx={{ p: '10px' }} aria-label="search">
                  <SearchIcon />
                </IconButton>
                <InputBase
                  sx={{ ml: 1, flex: 1 }}
                  placeholder="Search parties, products, invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                />
                {searchLoading && (
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                )}
              </Paper>

              {/* Search results dropdown */}
              {searchOpen && (searchResults.length > 0 || searchQuery) && (
                <ClickAwayListener onClickAway={() => setSearchOpen(false)}>
                  <Paper
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      mt: 1,
                      maxHeight: 400,
                      overflow: 'auto',
                      zIndex: theme.zIndex.modal,
                      boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                  >
                    {searchResults.length > 0 ? (
                      <List sx={{ py: 1 }}>
                        {searchResults.map((result) => (
                          <ListItem key={result.id} disablePadding>
                            <ListItemButton
                              onClick={() => handleSearchResultClick(result)}
                              sx={{
                                py: 1.5,
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                },
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                {result.icon}
                              </ListItemIcon>
                              <ListItemText
                                primary={result.title}
                                secondary={result.subtitle}
                                primaryTypographyProps={{ fontWeight: 500 }}
                              />
                              {result.badge && (
                                <Chip
                                  label={result.badge}
                                  size="small"
                                  variant="outlined"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </ListItemButton>
                          </ListItem>
                        ))}
                      </List>
                    ) : searchQuery ? (
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                          No results found for "{searchQuery}"
                        </Typography>
                      </Box>
                    ) : null}
                  </Paper>
                </ClickAwayListener>
              )}
            </Box>
          )}

          {/* Spacer for mobile */}
          <Box sx={{ flexGrow: 1, display: { md: 'none' } }} />

          {/* Quick actions */}
          {showQuickActions && !isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <Button
                onClick={handleQuickActionsOpen}
                startIcon={<StarIcon />}
                endIcon={<KeyboardArrowDownIcon />}
                sx={{
                  color: theme.palette.text.primary,
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 2,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                Quick Actions
              </Button>
              <Menu
                anchorEl={quickActionsAnchor}
                open={Boolean(quickActionsAnchor)}
                onClose={handleQuickActionsClose}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 200,
                    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
                  },
                }}
              >
                {quickActions.map((action) => (
                  <MenuItem
                    key={action.id}
                    onClick={() => {
                      router.push(action.path);
                      handleQuickActionsClose();
                    }}
                    sx={{
                      py: 1.5,
                      '&:hover': {
                        backgroundColor: alpha(action.color || theme.palette.primary.main, 0.08),
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: action.color }}>
                      {action.icon}
                    </ListItemIcon>
                    <ListItemText primary={action.title} />
                    {action.isNew && (
                      <Chip label="New" size="small" color="primary" sx={{ ml: 1 }} />
                    )}
                    {action.badge && (
                      <Badge badgeContent={action.badge} color="error" sx={{ ml: 1 }} />
                    )}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          )}

          {/* Action buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Mobile search */}
            {showSearch && isMobile && (
              <IconButton
                color="inherit"
                onClick={() => setSearchOpen(!searchOpen)}
                sx={{ color: theme.palette.text.primary }}
              >
                <SearchIcon />
              </IconButton>
            )}

            {/* Notifications */}
            <IconButton
              color="inherit"
              onClick={handleNotificationsOpen}
              sx={{ color: theme.palette.text.primary }}
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {/* Theme toggle */}
            {onThemeToggle && (
              <IconButton
                color="inherit"
                onClick={onThemeToggle}
                sx={{ color: theme.palette.text.primary }}
              >
                {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            )}

            {/* Profile menu */}
            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{
                p: 0.5,
                ml: 1,
                border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              <Avatar
                alt={currentUser?.displayName || 'User'}
                src={currentUser?.photoURL || undefined}
                sx={{ width: 32, height: 32 }}
              >
                {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile search overlay */}
      {showSearch && isMobile && searchOpen && (
        <Dialog
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          fullScreen
          sx={{ zIndex: theme.zIndex.appBar + 1 }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              autoFocus
              fullWidth
              placeholder="Search parties, products, invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <IconButton onClick={() => setSearchOpen(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {searchResults.length > 0 ? (
              <List>
                {searchResults.map((result) => (
                  <ListItem key={result.id} disablePadding>
                    <ListItemButton
                      onClick={() => handleSearchResultClick(result)}
                      sx={{ py: 2 }}
                    >
                      <ListItemIcon>{result.icon}</ListItemIcon>
                      <ListItemText
                        primary={result.title}
                        secondary={result.subtitle}
                      />
                      {result.badge && (
                        <Chip label={result.badge} size="small" variant="outlined" />
                      )}
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            ) : searchQuery ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No results found for "{searchQuery}"
                </Typography>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  Start typing to search...
                </Typography>
              </Box>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Notifications menu */}
      <Menu
        anchorEl={notificationsAnchor}
        open={Boolean(notificationsAnchor)}
        onClose={handleNotificationsClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 300,
            maxWidth: 400,
            boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6">Notifications</Typography>
        </Box>
        <MenuItem sx={{ py: 2 }}>
          <ListItemIcon>
            <ReceiptIcon color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="New invoice created"
            secondary="Invoice #INV-001 has been generated"
          />
        </MenuItem>
        <MenuItem sx={{ py: 2 }}>
          <ListItemIcon>
            <InventoryIcon color="warning" />
          </ListItemIcon>
          <ListItemText
            primary="Low stock alert"
            secondary="Product ABC is running low"
          />
        </MenuItem>
        <MenuItem sx={{ py: 2 }}>
          <ListItemIcon>
            <PeopleIcon color="success" />
          </ListItemIcon>
          <ListItemText
            primary="New party added"
            secondary="Customer XYZ has been added"
          />
        </MenuItem>
        <Divider />
        <MenuItem sx={{ justifyContent: 'center', py: 1 }}>
          <Typography variant="body2" color="primary">
            View all notifications
          </Typography>
        </MenuItem>
      </Menu>

      {/* Profile menu */}
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={handleProfileMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 250,
            boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              alt={currentUser?.displayName || 'User'}
              src={currentUser?.photoURL || undefined}
              sx={{ width: 40, height: 40 }}
            >
              {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {currentUser?.displayName || 'User'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentUser?.email}
              </Typography>
            </Box>
          </Box>
        </Box>

        <MenuItem onClick={() => { router.push('/profile'); handleProfileMenuClose(); }}>
          <ListItemIcon>
            <AccountCircleIcon />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </MenuItem>

        <MenuItem onClick={() => { router.push('/settings'); handleProfileMenuClose(); }}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>

        <MenuItem onClick={() => { setSettingsDialogOpen(true); handleProfileMenuClose(); }}>
          <ListItemIcon>
            <PaletteIcon />
          </ListItemIcon>
          <ListItemText primary="Preferences" />
        </MenuItem>

        <MenuItem onClick={() => { router.push('/help-desk'); handleProfileMenuClose(); }}>
          <ListItemIcon>
            <HelpIcon />
          </ListItemIcon>
          <ListItemText primary="Help & Support" />
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogoutClick}>
          <ListItemIcon>
            <ExitToAppIcon color="error" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>

      {/* Settings dialog */}
      <Dialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Preferences</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isDarkMode}
                  onChange={onThemeToggle}
                />
              }
              label="Dark Mode"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}