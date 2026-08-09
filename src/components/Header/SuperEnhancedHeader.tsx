'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  ButtonGroup,
  Fab,
  Slide,
  Collapse,
  Stack,
  AvatarGroup,
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
  FilterList as FilterListIcon,
  Sort as SortIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationOnIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Category as CategoryIcon,
  LocalOffer as LocalOfferIcon,
  AttachMoney as AttachMoneyIcon,
  ShoppingCart as ShoppingCartIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
  Speed as SpeedIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  GetApp as GetAppIcon,
  CloudUpload as CloudUploadIcon,
  Print as PrintIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

import { useAuth } from '@/contexts/AuthContext';
import { handleLogout } from '@/utils/authRedirects';
import { partyService } from '@/services/partyService';
import { productService } from '@/services/productService';

// Enhanced Types
interface EnhancedSearchResult {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  type: 'party' | 'product' | 'invoice' | 'order' | 'page' | 'recent' | 'favorite';
  path: string;
  icon: React.ReactNode;
  badge?: string;
  avatar?: string;
  metadata?: {
    lastAccessed?: string;
    frequency?: number;
    category?: string;
    status?: string;
    amount?: number;
    tags?: string[];
  };
  actions?: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    action: () => void;
  }>;
}

interface QuickAction {
  id: string;
  title: string;
  icon: React.ReactNode;
  path: string;
  color?: string;
  badge?: number;
  isNew?: boolean;
  category?: 'primary' | 'secondary' | 'utility';
  shortcut?: string;
}

interface PartyQuickInfo {
  id: string;
  name: string;
  type: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'pending';
  lastTransaction?: string;
  outstandingAmount?: number;
  phone?: string;
  email?: string;
}

interface SuperEnhancedHeaderProps {
  onDrawerToggle?: () => void;
  isDrawerOpen?: boolean;
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
  title?: string;
  showSearch?: boolean;
  showQuickActions?: boolean;
  showPartyQuickAccess?: boolean;
  customQuickActions?: QuickAction[];
  enableAdvancedSearch?: boolean;
  enableVoiceSearch?: boolean;
  enableShortcuts?: boolean;
}

// Enhanced quick actions with categories
const enhancedQuickActions: QuickAction[] = [
  // Primary Actions
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
    color: '#2196F3',
    category: 'primary',
    shortcut: 'Ctrl+D',
  },
  {
    id: 'new-invoice',
    title: 'New Invoice',
    icon: <AddIcon />,
    path: '/invoices/new',
    color: '#4CAF50',
    isNew: true,
    category: 'primary',
    shortcut: 'Ctrl+N',
  },
  {
    id: 'new-party',
    title: 'Add Party',
    icon: <PersonIcon />,
    path: '/parties/new',
    color: '#9C27B0',
    category: 'primary',
    shortcut: 'Ctrl+P',
  },
  
  // Secondary Actions
  {
    id: 'products',
    title: 'Products',
    icon: <InventoryIcon />,
    path: '/products',
    color: '#FF9800',
    category: 'secondary',
  },
  {
    id: 'parties',
    title: 'Parties',
    icon: <PeopleIcon />,
    path: '/parties',
    color: '#9C27B0',
    category: 'secondary',
  },
  {
    id: 'invoices',
    title: 'Invoices',
    icon: <ReceiptIcon />,
    path: '/invoices',
    color: '#F44336',
    category: 'secondary',
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: <AnalyticsIcon />,
    path: '/reports',
    color: '#607D8B',
    category: 'secondary',
  },
  
  // Utility Actions
  {
    id: 'settings',
    title: 'Settings',
    icon: <SettingsIcon />,
    path: '/settings',
    color: '#795548',
    category: 'utility',
  },
  {
    id: 'help',
    title: 'Help Center',
    icon: <HelpIcon />,
    path: '/help',
    color: '#009688',
    category: 'utility',
  },
];

export default function SuperEnhancedHeader({
  onDrawerToggle,
  isDrawerOpen = false,
  onThemeToggle,
  isDarkMode = false,
  title,
  showSearch = true,
  showQuickActions = true,
  showPartyQuickAccess = true,
  customQuickActions,
  enableAdvancedSearch = true,
  enableVoiceSearch = false,
  enableShortcuts = true,
}: SuperEnhancedHeaderProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Enhanced State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EnhancedSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState<'all' | 'party' | 'product' | 'invoice' | 'recent'>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<string[]>([]);
  
  // Menu states
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const [quickActionsAnchor, setQuickActionsAnchor] = useState<null | HTMLElement>(null);
  const [partyQuickAccessAnchor, setPartyQuickAccessAnchor] = useState<null | HTMLElement>(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  
  // Party quick access
  const [recentParties, setRecentParties] = useState<PartyQuickInfo[]>([]);
  const [favoriteParties, setFavoriteParties] = useState<PartyQuickInfo[]>([]);
  const [partyQuickAccessTab, setPartyQuickAccessTab] = useState(0);

  // Memoized quick actions
  const quickActions = useMemo(() => {
    return customQuickActions || enhancedQuickActions;
  }, [customQuickActions]);

  // Enhanced search functionality
  const performEnhancedSearch = useCallback(async (query: string, filter: string = 'all') => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const results: EnhancedSearchResult[] = [];

      // Search parties with enhanced metadata
      if (filter === 'all' || filter === 'party') {
        const parties = await partyService.getAllParties();
        const matchingParties = parties
          .filter(party => 
            party.name?.toLowerCase().includes(query.toLowerCase()) ||
            party.email?.toLowerCase().includes(query.toLowerCase()) ||
            party.phone?.includes(query) ||
            party.contactPerson?.toLowerCase().includes(query.toLowerCase()) ||
            party.businessType?.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 5)
          .map(party => ({
            id: party.id!,
            title: party.name || 'Unnamed Party',
            subtitle: party.contactPerson || party.email || party.phone || '',
            description: `${party.businessType} • ${party.address || 'No address'}`,
            type: 'party' as const,
            path: `/parties/${party.id}`,
            icon: <PeopleIcon />,
            badge: party.businessType || 'Party',
            avatar: party.name?.charAt(0),
            metadata: {
              category: party.businessType,
              status: party.isActive ? 'Active' : 'Inactive',
              tags: party.tags || [],
            },
            actions: [
              {
                id: 'view',
                label: 'View Details',
                icon: <VisibilityIcon />,
                action: () => router.push(`/parties/${party.id}`),
              },
              {
                id: 'edit',
                label: 'Edit',
                icon: <EditIcon />,
                action: () => router.push(`/parties/${party.id}/edit`),
              },
              {
                id: 'invoice',
                label: 'New Invoice',
                icon: <ReceiptIcon />,
                action: () => router.push(`/invoices/new?party=${party.id}`),
              },
            ],
          }));

        results.push(...matchingParties);
      }

      // Search products with enhanced metadata
      if (filter === 'all' || filter === 'product') {
        try {
          const products = await productService.getAllProducts();
          const matchingProducts = products
            .filter(product => 
              product.name?.toLowerCase().includes(query.toLowerCase()) ||
              product.sku?.toLowerCase().includes(query.toLowerCase()) ||
              product.categoryName?.toLowerCase().includes(query.toLowerCase()) ||
              product.brand?.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 5)
            .map(product => ({
              id: product.id!,
              title: product.name || 'Unnamed Product',
              subtitle: `SKU: ${product.sku || 'N/A'} • Stock: ${product.quantity || 0}`,
              description: `${product.categoryName || 'No category'} • ₹${product.price || 0}`,
              type: 'product' as const,
              path: `/products/edit/${product.id}`,
              icon: <InventoryIcon />,
              badge: product.categoryName || 'Product',
              metadata: {
                category: product.categoryName,
                status: product.isActive ? 'Active' : 'Inactive',
                amount: product.price,
                tags: product.tags || [],
              },
              actions: [
                {
                  id: 'view',
                  label: 'View Details',
                  icon: <VisibilityIcon />,
                  action: () => router.push(`/products/${product.id}`),
                },
                {
                  id: 'edit',
                  label: 'Edit',
                  icon: <EditIcon />,
                  action: () => router.push(`/products/edit/${product.id}`),
                },
                {
                  id: 'add-to-invoice',
                  label: 'Add to Invoice',
                  icon: <AddIcon />,
                  action: () => router.push(`/invoices/new?product=${product.id}`),
                },
              ],
            }));

          results.push(...matchingProducts);
        } catch (error) {
          console.log('Product search not available:', error);
        }
      }

      // Add recent searches and favorites
      if (filter === 'all' || filter === 'recent') {
        const recentResults = recentSearches
          .filter(recent => recent.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 3)
          .map(recent => ({
            id: `recent-${recent}`,
            title: recent,
            subtitle: 'Recent search',
            type: 'recent' as const,
            path: '#',
            icon: <HistoryIcon />,
            badge: 'Recent',
            actions: [
              {
                id: 'search-again',
                label: 'Search Again',
                icon: <SearchIcon />,
                action: () => setSearchQuery(recent),
              },
            ],
          }));

        results.push(...recentResults);
      }

      // Add page/navigation results
      const pageResults = [
        { title: 'Dashboard', path: '/dashboard', icon: <DashboardIcon />, description: 'Main dashboard with overview' },
        { title: 'Invoices', path: '/invoices', icon: <ReceiptIcon />, description: 'Manage all invoices' },
        { title: 'Products', path: '/products', icon: <InventoryIcon />, description: 'Product inventory management' },
        { title: 'Parties', path: '/parties', icon: <PeopleIcon />, description: 'Customer and supplier management' },
        { title: 'Orders', path: '/orders', icon: <ShoppingCartIcon />, description: 'Order management' },
        { title: 'Reports', path: '/reports', icon: <AnalyticsIcon />, description: 'Business analytics and reports' },
        { title: 'Settings', path: '/settings', icon: <SettingsIcon />, description: 'Application settings' },
      ]
        .filter(page => page.title.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
        .map(page => ({
          id: `page-${page.path}`,
          title: page.title,
          subtitle: 'Navigate to page',
          description: page.description,
          type: 'page' as const,
          path: page.path,
          icon: page.icon,
          badge: 'Page',
          actions: [
            {
              id: 'navigate',
              label: 'Go to Page',
              icon: <ArrowDropDownIcon />,
              action: () => router.push(page.path),
            },
          ],
        }));

      results.push(...pageResults);

      setSearchResults(results.slice(0, 12)); // Limit to 12 results
      
      // Add to recent searches
      if (!recentSearches.includes(query)) {
        setRecentSearches(prev => [query, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error('Enhanced search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [recentSearches, router]);

  // Load recent and favorite parties
  useEffect(() => {
    const loadPartyQuickAccess = async () => {
      try {
        const parties = await partyService.getAllParties();
        
        // Mock recent parties (in real app, this would come from user activity)
        const recent = parties.slice(0, 5).map(party => ({
          id: party.id!,
          name: party.name || 'Unnamed Party',
          type: party.businessType || 'Party',
          status: party.isActive ? 'active' as const : 'inactive' as const,
          phone: party.phone,
          email: party.email,
          outstandingAmount: party.outstandingBalance,
          lastTransaction: '2 days ago', // Mock data
        }));

        setRecentParties(recent);
        
        // Mock favorite parties
        setFavoriteParties(recent.slice(0, 3));
      } catch (error) {
        console.error('Error loading party quick access:', error);
      }
    };

    if (showPartyQuickAccess) {
      loadPartyQuickAccess();
    }
  }, [showPartyQuickAccess]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        performEnhancedSearch(searchQuery, searchFilter);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchFilter, performEnhancedSearch]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Global search shortcut (Ctrl/Cmd + K)
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
      
      // Quick action shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'd':
            event.preventDefault();
            router.push('/dashboard');
            break;
          case 'n':
            event.preventDefault();
            router.push('/invoices/new');
            break;
          case 'p':
            event.preventDefault();
            router.push('/parties/new');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableShortcuts, router]);

  // Handle search result selection
  const handleSearchResultClick = (result: EnhancedSearchResult) => {
    if (result.path !== '#') {
      router.push(result.path);
    }
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Handle favorite toggle
  const handleFavoriteToggle = (itemId: string) => {
    setFavoriteItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Menu handlers
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

  const handlePartyQuickAccessOpen = (event: React.MouseEvent<HTMLElement>) => {
    setPartyQuickAccessAnchor(event.currentTarget);
  };

  const handlePartyQuickAccessClose = () => {
    setPartyQuickAccessAnchor(null);
  };

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
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.05)}`,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 2, sm: 3 } }}>
          {/* Mobile menu button */}
          <IconButton
            color="inherit"
            aria-label="open menu"
            data-testid="menu-toggle"
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

          {/* Page title with breadcrumb */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: { md: 3 } }}>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                color: theme.palette.text.primary,
                fontWeight: 600,
              }}
            >
              {getPageTitle()}
            </Typography>
            {pathname !== '/dashboard' && (
              <Chip
                label={pathname.split('/')[1]?.toUpperCase() || 'PAGE'}
                size="small"
                variant="outlined"
                sx={{ ml: 1, display: { xs: 'none', sm: 'inline-flex' } }}
              />
            )}
          </Box>

          {/* Enhanced Search bar */}
          {showSearch && !isMobile && (
            <Box sx={{ flexGrow: 1, maxWidth: 700, mx: 2, position: 'relative' }}>
              <Paper
                component="div"
                sx={{
                  p: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: alpha(theme.palette.background.paper, 0.9),
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  borderRadius: 3,
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
                <IconButton sx={{ p: '8px' }} aria-label="search">
                  <SearchIcon />
                </IconButton>
                
                <InputBase
                  ref={searchInputRef}
                  sx={{ ml: 1, flex: 1 }}
                  placeholder="Search parties, products, invoices... (Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                />

                {/* Search filters */}
                {enableAdvancedSearch && searchOpen && (
                  <Box sx={{ display: 'flex', gap: 0.5, mr: 1 }}>
                    <ButtonGroup size="small" variant="outlined">
                      {['all', 'party', 'product', 'recent'].map((filter) => (
                        <Button
                          key={filter}
                          variant={searchFilter === filter ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => setSearchFilter(filter as any)}
                          sx={{ textTransform: 'capitalize', minWidth: 'auto', px: 1 }}
                        >
                          {filter}
                        </Button>
                      ))}
                    </ButtonGroup>
                  </Box>
                )}

                {searchLoading && (
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                )}

                {enableShortcuts && (
                  <Chip
                    label="Ctrl+K"
                    size="small"
                    variant="outlined"
                    sx={{ 
                      mr: 1, 
                      fontSize: '0.7rem',
                      display: { xs: 'none', lg: 'inline-flex' }
                    }}
                  />
                )}
              </Paper>

              {/* Enhanced Search results dropdown */}
              {searchOpen && (searchResults.length > 0 || searchQuery) && (
                <ClickAwayListener onClickAway={() => setSearchOpen(false)}>
                  <Paper
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      mt: 1,
                      maxHeight: 500,
                      overflow: 'auto',
                      zIndex: theme.zIndex.modal,
                      boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      borderRadius: 2,
                    }}
                  >
                    {searchResults.length > 0 ? (
                      <List sx={{ py: 1 }}>
                        {searchResults.map((result) => (
                          <ListItem key={result.id} disablePadding>
                            <ListItemButton
                              onClick={() => handleSearchResultClick(result)}
                              sx={{
                                py: 2,
                                px: 2,
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                },
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 48 }}>
                                {result.avatar ? (
                                  <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                                    {result.avatar}
                                  </Avatar>
                                ) : (
                                  result.icon
                                )}
                              </ListItemIcon>
                              
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle2" fontWeight={600}>
                                      {result.title}
                                    </Typography>
                                    {result.badge && (
                                      <Chip
                                        label={result.badge}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontSize: '0.7rem' }}
                                      />
                                    )}
                                  </Box>
                                }
                                secondary={
                                  <Box>
                                    {result.subtitle && (
                                      <Typography variant="body2" color="text.secondary">
                                        {result.subtitle}
                                      </Typography>
                                    )}
                                    {result.description && (
                                      <Typography variant="caption" color="text.secondary">
                                        {result.description}
                                      </Typography>
                                    )}
                                    {result.metadata?.tags && result.metadata.tags.length > 0 && (
                                      <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                        {result.metadata.tags.slice(0, 3).map((tag) => (
                                          <Chip
                                            key={tag}
                                            label={tag}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontSize: '0.6rem', height: 20 }}
                                          />
                                        ))}
                                      </Box>
                                    )}
                                  </Box>
                                }
                              />

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {/* Favorite button */}
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFavoriteToggle(result.id);
                                  }}
                                >
                                  {favoriteItems.includes(result.id) ? (
                                    <FavoriteIcon color="error" fontSize="small" />
                                  ) : (
                                    <FavoriteBorderIcon fontSize="small" />
                                  )}
                                </IconButton>

                                {/* Quick actions */}
                                {result.actions && result.actions.length > 0 && (
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Show quick actions menu
                                    }}
                                  >
                                    <MoreVertIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Box>
                            </ListItemButton>
                          </ListItem>
                        ))}
                      </List>
                    ) : searchQuery ? (
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                          No results found for "{searchQuery}"
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          sx={{ mt: 1 }}
                          onClick={() => {
                            // Suggest creating new item based on search
                            if (searchFilter === 'party') {
                              router.push(`/parties/new?name=${encodeURIComponent(searchQuery)}`);
                            } else if (searchFilter === 'product') {
                              router.push(`/products/new?name=${encodeURIComponent(searchQuery)}`);
                            }
                            setSearchOpen(false);
                          }}
                        >
                          Create "{searchQuery}"
                        </Button>
                      </Box>
                    ) : null}
                  </Paper>
                </ClickAwayListener>
              )}
            </Box>
          )}

          {/* Spacer for mobile */}
          <Box sx={{ flexGrow: 1, display: { md: 'none' } }} />

          {/* Party Quick Access */}
          {showPartyQuickAccess && !isMobile && (
            <Box sx={{ mr: 2 }}>
              <Button
                onClick={handlePartyQuickAccessOpen}
                startIcon={<PeopleIcon />}
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
                Parties
                {recentParties.length > 0 && (
                  <Badge badgeContent={recentParties.length} color="primary" sx={{ ml: 1 }} />
                )}
              </Button>
            </Box>
          )}

          {/* Quick actions */}
          {showQuickActions && !isMobile && (
            <Box sx={{ mr: 2 }}>
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

      {/* Party Quick Access Menu */}
      <Menu
        anchorEl={partyQuickAccessAnchor}
        open={Boolean(partyQuickAccessAnchor)}
        onClose={handlePartyQuickAccessClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 400,
            maxWidth: 500,
            maxHeight: 600,
            boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6">Party Quick Access</Typography>
          <Tabs
            value={partyQuickAccessTab}
            onChange={(_, newValue) => setPartyQuickAccessTab(newValue)}
            sx={{ mt: 1 }}
          >
            <Tab label="Recent" />
            <Tab label="Favorites" />
          </Tabs>
        </Box>

        {partyQuickAccessTab === 0 && (
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {recentParties.map((party) => (
              <MenuItem
                key={party.id}
                onClick={() => {
                  router.push(`/parties/${party.id}`);
                  handlePartyQuickAccessClose();
                }}
                sx={{ py: 2, px: 3 }}
              >
                <ListItemIcon>
                  <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                    {party.name.charAt(0)}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2">{party.name}</Typography>
                      <Chip
                        label={party.status}
                        size="small"
                        color={party.status === 'active' ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {party.type} • {party.phone || party.email}
                      </Typography>
                      {party.outstandingAmount && (
                        <Typography variant="caption" color="warning.main">
                          Outstanding: ₹{party.outstandingAmount}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/invoices/new?party=${party.id}`);
                      handlePartyQuickAccessClose();
                    }}
                  >
                    <ReceiptIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="caption" color="text.secondary">
                    {party.lastTransaction}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Box>
        )}

        {partyQuickAccessTab === 1 && (
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {favoriteParties.map((party) => (
              <MenuItem
                key={party.id}
                onClick={() => {
                  router.push(`/parties/${party.id}`);
                  handlePartyQuickAccessClose();
                }}
                sx={{ py: 2, px: 3 }}
              >
                <ListItemIcon>
                  <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                    {party.name.charAt(0)}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={party.name}
                  secondary={`${party.type} • ${party.phone || party.email}`}
                />
                <IconButton size="small">
                  <FavoriteIcon color="error" fontSize="small" />
                </IconButton>
              </MenuItem>
            ))}
          </Box>
        )}

        <Divider />
        <MenuItem
          onClick={() => {
            router.push('/parties');
            handlePartyQuickAccessClose();
          }}
          sx={{ justifyContent: 'center', py: 1 }}
        >
          <Typography variant="body2" color="primary">
            View All Parties
          </Typography>
        </MenuItem>
      </Menu>

      {/* Enhanced Quick Actions Menu */}
      <Menu
        anchorEl={quickActionsAnchor}
        open={Boolean(quickActionsAnchor)}
        onClose={handleQuickActionsClose}
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
          <Typography variant="h6">Quick Actions</Typography>
        </Box>

        {/* Primary Actions */}
        <Box sx={{ p: 1 }}>
          <Typography variant="overline" color="text.secondary" sx={{ px: 2 }}>
            Primary
          </Typography>
          {quickActions
            .filter(action => action.category === 'primary')
            .map((action) => (
              <MenuItem
                key={action.id}
                onClick={() => {
                  router.push(action.path);
                  handleQuickActionsClose();
                }}
                sx={{
                  py: 1.5,
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  '&:hover': {
                    backgroundColor: alpha(action.color || theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <ListItemIcon sx={{ color: action.color }}>
                  {action.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={action.title}
                  secondary={action.shortcut}
                />
                {action.isNew && (
                  <Chip label="New" size="small" color="primary" />
                )}
                {action.badge && (
                  <Badge badgeContent={action.badge} color="error" />
                )}
              </MenuItem>
            ))}
        </Box>

        <Divider />

        {/* Secondary Actions */}
        <Box sx={{ p: 1 }}>
          <Typography variant="overline" color="text.secondary" sx={{ px: 2 }}>
            Navigation
          </Typography>
          {quickActions
            .filter(action => action.category === 'secondary')
            .map((action) => (
              <MenuItem
                key={action.id}
                onClick={() => {
                  router.push(action.path);
                  handleQuickActionsClose();
                }}
                sx={{
                  py: 1,
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  '&:hover': {
                    backgroundColor: alpha(action.color || theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <ListItemIcon sx={{ color: action.color, minWidth: 36 }}>
                  {action.icon}
                </ListItemIcon>
                <ListItemText primary={action.title} />
              </MenuItem>
            ))}
        </Box>
      </Menu>

      {/* Enhanced Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchor}
        open={Boolean(notificationsAnchor)}
        onClose={handleNotificationsClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 350,
            maxWidth: 450,
            maxHeight: 500,
            boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Notifications</Typography>
            <Button size="small" color="primary">
              Mark all read
            </Button>
          </Box>
        </Box>

        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {/* High priority notification */}
          <MenuItem sx={{ py: 2, px: 3, backgroundColor: alpha(theme.palette.error.main, 0.05) }}>
            <ListItemIcon>
              <Avatar sx={{ bgcolor: 'error.main', width: 32, height: 32 }}>
                <WarningIcon fontSize="small" />
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Payment Overdue
                  </Typography>
                  <Chip label="Urgent" size="small" color="error" />
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Invoice #INV-001 from ABC Corp is 15 days overdue
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    2 hours ago
                  </Typography>
                </Box>
              }
            />
          </MenuItem>

          {/* Regular notifications */}
          <MenuItem sx={{ py: 2, px: 3 }}>
            <ListItemIcon>
              <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                <CheckCircleIcon fontSize="small" />
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary="New invoice created"
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Invoice #INV-002 has been generated for XYZ Ltd
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    1 day ago
                  </Typography>
                </Box>
              }
            />
          </MenuItem>

          <MenuItem sx={{ py: 2, px: 3 }}>
            <ListItemIcon>
              <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}>
                <InventoryIcon fontSize="small" />
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary="Low stock alert"
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Product "Widget A" is running low (5 units remaining)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    2 days ago
                  </Typography>
                </Box>
              }
            />
          </MenuItem>

          <MenuItem sx={{ py: 2, px: 3 }}>
            <ListItemIcon>
              <Avatar sx={{ bgcolor: 'info.main', width: 32, height: 32 }}>
                <PeopleIcon fontSize="small" />
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary="New party added"
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Customer "New Customer Ltd" has been added to your database
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    3 days ago
                  </Typography>
                </Box>
              }
            />
          </MenuItem>
        </Box>

        <Divider />
        <MenuItem 
          sx={{ justifyContent: 'center', py: 1 }}
          onClick={() => {
            router.push('/notifications');
            handleNotificationsClose();
          }}
        >
          <Typography variant="body2" color="primary">
            View all notifications
          </Typography>
        </MenuItem>
      </Menu>

      {/* Profile menu - keeping the existing one */}
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

      {/* Mobile search overlay - enhanced */}
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
          
          {/* Mobile search filters */}
          <Box sx={{ px: 3, pb: 2 }}>
            <ButtonGroup fullWidth variant="outlined" size="small">
              {['all', 'party', 'product', 'recent'].map((filter) => (
                <Button
                  key={filter}
                  variant={searchFilter === filter ? 'contained' : 'outlined'}
                  onClick={() => setSearchFilter(filter as any)}
                  sx={{ textTransform: 'capitalize' }}
                >
                  {filter}
                </Button>
              ))}
            </ButtonGroup>
          </Box>

          <DialogContent>
            {searchResults.length > 0 ? (
              <List>
                {searchResults.map((result) => (
                  <ListItem key={result.id} disablePadding>
                    <ListItemButton
                      onClick={() => handleSearchResultClick(result)}
                      sx={{ py: 2 }}
                    >
                      <ListItemIcon>
                        {result.avatar ? (
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                            {result.avatar}
                          </Avatar>
                        ) : (
                          result.icon
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={result.title}
                        secondary={
                          <Box>
                            {result.subtitle && (
                              <Typography variant="body2" color="text.secondary">
                                {result.subtitle}
                              </Typography>
                            )}
                            {result.description && (
                              <Typography variant="caption" color="text.secondary">
                                {result.description}
                              </Typography>
                            )}
                          </Box>
                        }
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
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  sx={{ mt: 1 }}
                  onClick={() => {
                    if (searchFilter === 'party') {
                      router.push(`/parties/new?name=${encodeURIComponent(searchQuery)}`);
                    } else if (searchFilter === 'product') {
                      router.push(`/products/new?name=${encodeURIComponent(searchQuery)}`);
                    }
                    setSearchOpen(false);
                  }}
                >
                  Create "{searchQuery}"
                </Button>
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

      {/* Settings dialog - keeping the existing one */}
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
            <FormControlLabel
              control={
                <Switch
                  checked={enableShortcuts}
                  onChange={() => {}}
                />
              }
              label="Enable Keyboard Shortcuts"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={enableAdvancedSearch}
                  onChange={() => {}}
                />
              }
              label="Advanced Search Features"
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