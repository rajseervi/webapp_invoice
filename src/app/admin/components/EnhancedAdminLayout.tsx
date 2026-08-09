'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  Collapse,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  Paper,
  Card,
  CardContent,
  Button,
  Switch,
  FormControlLabel,
  useTheme,
  alpha,
  Breadcrumbs,
  Link,
  Tooltip,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Backdrop,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Grid
} from '@mui/material';

import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  ShoppingCart as ShoppingCartIcon,
  Store as StoreIcon,
  Category as CategoryIcon,
  LocalShipping as LocalShippingIcon,
  AccountBalance as AccountBalanceIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  ExpandLess,
  ExpandMore,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Add as AddIcon,
  Speed as SpeedIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  MoreVert as MoreVertIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Help as HelpIcon,
  Feedback as FeedbackIcon
} from '@mui/icons-material';

import { adminThemeConfig } from '../config/theme';

// Enhanced Types
interface NavigationItem {
  id: string;
  title: string;
  icon: ReactNode;
  path?: string;
  children?: NavigationItem[];
  badge?: number;
  isNew?: boolean;
  color?: string;
  description?: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  color: string;
  path: string;
  badge?: number;
  isNew?: boolean;
  category: 'create' | 'manage' | 'view' | 'analytics';
}

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'page' | 'party' | 'product' | 'invoice' | 'order';
  path: string;
  icon: ReactNode;
}

interface EnhancedAdminLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  showQuickActions?: boolean;
  showNotifications?: boolean;
  showBreadcrumbs?: boolean;
  customQuickActions?: QuickAction[];
  pageActions?: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

const DRAWER_WIDTH = 280;
const MINI_DRAWER_WIDTH = 64;

// Navigation Configuration
const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/admin/dashboard',
    color: '#1976D2'
  },
  {
    id: 'sales',
    title: 'Sales',
    icon: <ReceiptIcon />,
    color: '#4CAF50',
    children: [
      { id: 'invoices', title: 'Invoices', icon: <ReceiptIcon />, path: '/invoices', badge: 12 },
      { id: 'orders', title: 'Orders', icon: <ShoppingCartIcon />, path: '/orders', badge: 5 },
      { id: 'quotes', title: 'Quotes', icon: <EditIcon />, path: '/quotes' }
    ]
  },
  {
    id: 'inventory',
    title: 'Inventory',
    icon: <InventoryIcon />,
    color: '#FF9800',
    children: [
      { id: 'products', title: 'Products', icon: <InventoryIcon />, path: '/products', badge: 8 },
      { id: 'categories', title: 'Categories', icon: <CategoryIcon />, path: '/categories' },
      { id: 'stock', title: 'Stock Management', icon: <LocalShippingIcon />, path: '/stock-management' }
    ]
  },
  {
    id: 'customers',
    title: 'Customers',
    icon: <PeopleIcon />,
    path: '/parties',
    color: '#9C27B0',
    badge: 3
  },
  {
    id: 'purchases',
    title: 'Purchases',
    icon: <LocalShippingIcon />,
    color: '#00BCD4',
    children: [
      { id: 'purchase-orders', title: 'Purchase Orders', icon: <ShoppingCartIcon />, path: '/purchases' },
      { id: 'suppliers', title: 'Suppliers', icon: <StoreIcon />, path: '/purchases/suppliers' }
    ]
  },
  {
    id: 'accounting',
    title: 'Accounting',
    icon: <AccountBalanceIcon />,
    color: '#795548',
    children: [
      { id: 'ledger', title: 'Ledger', icon: <AccountBalanceIcon />, path: '/ledger' },
      { id: 'reports', title: 'Reports', icon: <AssessmentIcon />, path: '/reports' }
    ]
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: <SettingsIcon />,
    path: '/settings',
    color: '#607D8B'
  }
];

// Default Quick Actions
const defaultQuickActions: QuickAction[] = [
  {
    id: 'new-invoice',
    title: 'New Invoice',
    description: 'Create a new invoice',
    icon: <AddIcon />,
    color: '#4CAF50',
    path: '/invoices/new',
    category: 'create',
    isNew: true
  },
  {
    id: 'quick-order',
    title: 'Quick Order',
    description: 'Fast order creation',
    icon: <SpeedIcon />,
    color: '#FF9800',
    path: '/orders/new',
    category: 'create'
  },
  {
    id: 'add-customer',
    title: 'Add Customer',
    description: 'Add new customer',
    icon: <PeopleIcon />,
    color: '#9C27B0',
    path: '/parties/new',
    category: 'create'
  },
  {
    id: 'add-product',
    title: 'Add Product',
    description: 'Add new product',
    icon: <InventoryIcon />,
    color: '#2196F3',
    path: '/products/new',
    category: 'create'
  }
];

export const EnhancedAdminLayout: React.FC<EnhancedAdminLayoutProps> = ({
  children,
  title = 'Admin Dashboard',
  subtitle,
  showSearch = true,
  showQuickActions = true,
  showNotifications = true,
  showBreadcrumbs = true,
  customQuickActions,
  pageActions,
  maxWidth = 'xl'
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  // State Management
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [miniDrawer, setMiniDrawer] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>(['sales', 'inventory']);

  // Quick Actions
  const quickActions = customQuickActions || defaultQuickActions;

  // Navigation Functions
  const handleDrawerToggle = () => {
    if (miniDrawer) {
      setMiniDrawer(false);
      setDrawerOpen(true);
    } else {
      setDrawerOpen(!drawerOpen);
    }
  };

  const handleMiniDrawerToggle = () => {
    setMiniDrawer(!miniDrawer);
    if (!miniDrawer) {
      setDrawerOpen(true);
    }
  };

  const handleNavItemClick = (item: NavigationItem) => {
    if (item.children) {
      const isExpanded = expandedItems.includes(item.id);
      setExpandedItems(prev => 
        isExpanded 
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      );
    } else if (item.path) {
      router.push(item.path);
    }
  };

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    // Mock search results - replace with actual API call
    const mockResults: SearchResult[] = [
      {
        id: '1',
        title: 'ABC Corporation',
        description: 'Customer - Phone: +91 9876543210',
        type: 'party',
        path: '/parties/1',
        icon: <PeopleIcon />
      },
      {
        id: '2',
        title: 'Product XYZ',
        description: 'Electronics - Stock: 25 units',
        type: 'product',
        path: '/products/2',
        icon: <InventoryIcon />
      },
      {
        id: '3',
        title: 'Invoice #INV-2024-001',
        description: 'Amount: ₹25,000 - Status: Paid',
        type: 'invoice',
        path: '/invoices/3',
        icon: <ReceiptIcon />
      }
    ].filter(result => 
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.description.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults(mockResults);
  };

  const handleQuickAction = (action: QuickAction) => {
    router.push(action.path);
    setQuickActionsOpen(false);
  };

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  // Generate Breadcrumbs
  const generateBreadcrumbs = () => {
    const pathSegments = pathname.split('/').filter(segment => segment);
    const breadcrumbs = [
      { title: 'Home', path: '/admin/dashboard' }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' ');
      breadcrumbs.push({
        title,
        path: currentPath
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Drawer Content
  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: miniDrawer ? 32 : 40,
              height: miniDrawer ? 32 : 40
            }}
          >
            <DashboardIcon />
          </Avatar>
          {!miniDrawer && (
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Admin Panel
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Business Management
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ p: 1 }}>
          {navigationItems.map((item) => (
            <Box key={item.id}>
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavItemClick(item)}
                  selected={pathname === item.path}
                  sx={{
                    borderRadius: 2,
                    minHeight: 48,
                    px: 2,
                    '&.Mui-selected': {
                      backgroundColor: alpha(item.color || theme.palette.primary.main, 0.1),
                      color: item.color || theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: alpha(item.color || theme.palette.primary.main, 0.15),
                      }
                    }
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: miniDrawer ? 0 : 40,
                      color: pathname === item.path ? (item.color || 'primary.main') : 'inherit'
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!miniDrawer && (
                    <>
                      <ListItemText
                        primary={item.title}
                        sx={{ ml: 1 }}
                      />
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {item.badge && (
                          <Chip
                            size="small"
                            label={item.badge}
                            color="primary"
                            sx={{ height: 20, fontSize: '0.75rem' }}
                          />
                        )}
                        {item.isNew && (
                          <Chip
                            size="small"
                            label="New"
                            color="success"
                            sx={{ height: 20, fontSize: '0.75rem' }}
                          />
                        )}
                        {item.children && (
                          expandedItems.includes(item.id) ? <ExpandLess /> : <ExpandMore />
                        )}
                      </Stack>
                    </>
                  )}
                </ListItemButton>
              </ListItem>
              {item.children && !miniDrawer && (
                <Collapse in={expandedItems.includes(item.id)} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ pl: 2 }}>
                    {item.children.map((child) => (
                      <ListItem key={child.id} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                          onClick={() => child.path && router.push(child.path)}
                          selected={pathname === child.path}
                          sx={{
                            borderRadius: 2,
                            minHeight: 40,
                            px: 2,
                            '&.Mui-selected': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              color: 'primary.main'
                            }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            {child.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={child.title}
                            sx={{ ml: 0.5 }}
                          />
                          {child.badge && (
                            <Chip
                              size="small"
                              label={child.badge}
                              color="primary"
                              sx={{ height: 18, fontSize: '0.7rem' }}
                            />
                          )}
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}
            </Box>
          ))}
        </List>
      </Box> 
      
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Toolbar sx={{ px: 3 }}>
          <IconButton
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          {/* Title Section */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>

          {/* Header Actions */}
          <Stack direction="row" alignItems="center" spacing={1}>
            {/* Search */}
            {showSearch && (
              <Tooltip title="Search">
                <IconButton onClick={() => setSearchOpen(true)}>
                  <SearchIcon />
                </IconButton>
              </Tooltip>
            )}

            {/* Fullscreen Toggle */}
            <Tooltip title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}>
              <IconButton onClick={handleFullscreenToggle}>
                {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>

            {/* Dark Mode Toggle */}
            <Tooltip title="Toggle Dark Mode">
              <IconButton onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            {showNotifications && (
              <Tooltip title="Notifications">
                <IconButton
                  onClick={(e) => setNotificationAnchor(e.currentTarget)}
                >
                  <Badge badgeContent={5} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
            )}

            {/* Profile Menu */}
            <Tooltip title="Profile">
              <IconButton
                onClick={(e) => setProfileAnchor(e.currentTarget)}
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  <AccountCircleIcon />
                </Avatar>
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant="permanent"
        open={drawerOpen}
        sx={{
          width: miniDrawer ? MINI_DRAWER_WIDTH : DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: miniDrawer ? MINI_DRAWER_WIDTH : DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: `1px solid ${theme.palette.divider}`,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        <Toolbar />
        {drawerContent}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: `calc(100% - ${miniDrawer ? MINI_DRAWER_WIDTH : DRAWER_WIDTH}px)`,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar />

        {/* Breadcrumbs */}
        {showBreadcrumbs && (
          <Box sx={{ mb: 2 }}>
            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
              {breadcrumbs.map((crumb, index) => (
                <Link
                  key={crumb.path}
                  color={index === breadcrumbs.length - 1 ? "text.primary" : "inherit"}
                  href={crumb.path}
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(crumb.path);
                  }}
                  sx={{
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  {crumb.title}
                </Link>
              ))}
            </Breadcrumbs>
          </Box>
        )}

        {/* Page Actions */}
        {pageActions && (
          <Box sx={{ mb: 3 }}>
            {pageActions}
          </Box>
        )}

        {/* Main Content */}
        <Box sx={{ maxWidth: maxWidth === false ? 'none' : `${theme.breakpoints.values[maxWidth]}px`, mx: 'auto' }}>
          {children}
        </Box>
      </Box>

      {/* Quick Actions Speed Dial */}
      {showQuickActions && (
        <SpeedDial
          ariaLabel="Quick Actions"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          icon={<SpeedDialIcon />}
          open={quickActionsOpen}
          onClose={() => setQuickActionsOpen(false)}
          onOpen={() => setQuickActionsOpen(true)}
        >
          {quickActions.map((action) => (
            <SpeedDialAction
              key={action.id}
              icon={action.icon}
              tooltipTitle={action.title}
              onClick={() => handleQuickAction(action)}
              sx={{
                '& .MuiSpeedDialAction-fab': {
                  backgroundColor: action.color,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: alpha(action.color, 0.8)
                  }
                }
              }}
            />
          ))}
        </SpeedDial>
      )}

      {/* Search Dialog */}
      <Dialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Search</Typography>
            <IconButton onClick={() => setSearchOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Search for customers, products, invoices..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{ mb: 2 }}
          />
          {searchResults.length > 0 && (
            <List>
              {searchResults.map((result) => (
                <ListItem
                  key={result.id}
                  button
                  onClick={() => {
                    router.push(result.path);
                    setSearchOpen(false);
                  }}
                >
                  <ListItemIcon>{result.icon}</ListItemIcon>
                  <ListItemText
                    primary={result.title}
                    secondary={result.description}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>

      {/* Notification Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={() => setNotificationAnchor(null)}
        PaperProps={{
          sx: { width: 320, maxHeight: 400 }
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6">Notifications</Typography>
        </Box>
        <MenuItem>
          <ListItemIcon><ReceiptIcon /></ListItemIcon>
          <ListItemText
            primary="New Invoice"
            secondary="Invoice #INV-2024-001 created"
          />
        </MenuItem>
        <MenuItem>
          <ListItemIcon><InventoryIcon /></ListItemIcon>
          <ListItemText
            primary="Low Stock Alert"
            secondary="Product ABC is running low"
          />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setNotificationAnchor(null)}>
          <ListItemText primary="View All Notifications" />
        </MenuItem>
      </Menu>

      {/* Profile Menu */}
      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={() => setProfileAnchor(null)}
      >
        <MenuItem onClick={() => setProfileAnchor(null)}>
          <ListItemIcon><AccountCircleIcon /></ListItemIcon>
          <ListItemText primary="Profile" />
        </MenuItem>
        <MenuItem onClick={() => setProfileAnchor(null)}>
          <ListItemIcon><SettingsIcon /></ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setProfileAnchor(null)}>
          <ListItemIcon><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>

      {/* Mini Drawer Toggle Button */}
      <Fab
        size="small"
        sx={{
          position: 'fixed',
          top: theme.spacing(10),
          left: miniDrawer ? MINI_DRAWER_WIDTH - 16 : DRAWER_WIDTH - 16,
          zIndex: theme.zIndex.drawer + 2,
          transition: theme.transitions.create('left', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
        onClick={handleMiniDrawerToggle}
      >
        {miniDrawer ? <NavigateNextIcon /> : <MenuIcon />}
      </Fab>
    </Box>
  );
};

export default EnhancedAdminLayout;