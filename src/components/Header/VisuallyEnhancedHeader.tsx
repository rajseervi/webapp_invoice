'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, alpha, styled } from '@mui/material/styles';
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
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  LinearProgress,
  Backdrop,
} from '@mui/material';
import MobileOptimizedSpeedDial from '../Common/MobileOptimizedSpeedDial';
import { useSpeedDialCategory } from '@/contexts/SpeedDialContext';

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
  Store as StoreIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  AutoAwesome as AutoAwesomeIcon,
  Gradient as GradientIcon,
  Flare as FlareIcon,
  Waves as WavesIcon,
} from '@mui/icons-material';

import { useAuth } from '@/contexts/AuthContext';
import { handleLogout } from '@/utils/authRedirects';
import { partyService } from '@/services/partyService';
import { productService } from '@/services/productService';

// Enhanced Styled Components with Modern Visual Effects
const GlassAppBar = styled(AppBar)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
  position: 'relative',
  color: theme.palette.text.primary,
}));

const AnimatedToolbar = styled(Toolbar)(({ theme }) => ({
  minHeight: '72px !important',
  padding: theme.spacing(0, 3),
  position: 'relative',
  zIndex: 2,
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(0, 2),
    minHeight: '64px !important',
  },
}));

const GlowingSearchContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: '50px',
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  marginLeft: theme.spacing(2),
  marginRight: theme.spacing(2),
  width: '100%',
  maxWidth: '500px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    border: `1px solid ${theme.palette.primary.main}`,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
  },
  '&:focus-within': {
    border: `1px solid ${theme.palette.primary.main}`,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
  },
}));

const NeonButton = styled(IconButton)(({ theme }) => ({
  borderRadius: '50%',
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: theme.palette.action.hover,
    border: `1px solid ${theme.palette.primary.main}`,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
  },
}));

const FloatingQuickActionsButton = styled(Button)(({ theme }) => ({
  borderRadius: '25px',
  background: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(1, 3),
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: theme.palette.primary.dark,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
  },
}));

const PulsingBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    background: `linear-gradient(135deg, 
      ${theme.palette.error.main} 0%, 
      ${theme.palette.warning.main} 100%)`,
    color: theme.palette.error.contrastText,
    fontWeight: 'bold',
    animation: 'pulse 2s ease-in-out infinite',
    boxShadow: `0 0 10px ${alpha(theme.palette.error.main, 0.6)}`,
  },
  '@keyframes pulse': {
    '0%, 100%': { 
      transform: 'scale(1)',
      boxShadow: `0 0 10px ${alpha(theme.palette.error.main, 0.6)}`,
    },
    '50%': { 
      transform: 'scale(1.1)',
      boxShadow: `0 0 20px ${alpha(theme.palette.error.main, 0.8)}`,
    },
  },
}));

const GlassCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.background.paper, 0.95)} 0%, 
    ${alpha(theme.palette.background.default, 0.9)} 100%)`,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  borderRadius: '16px',
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
}));

const AnimatedMenuItem = styled(MenuItem)(({ theme }) => ({
  borderRadius: '8px',
  margin: theme.spacing(0.5, 1),
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    background: `linear-gradient(135deg, 
      ${alpha(theme.palette.primary.main, 0.1)} 0%, 
      ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
    transform: 'translateX(4px)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, 
      transparent, 
      ${alpha(theme.palette.primary.main, 0.1)}, 
      transparent)`,
    transition: 'left 0.3s ease',
  },
  '&:hover::before': {
    left: '100%',
  },
}));

const MorphingAvatar = styled(Avatar)(({ theme }) => ({
  background: theme.palette.primary.main,
  border: `2px solid ${alpha(theme.palette.common.white, 0.3)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  '&:hover': {
    transform: 'scale(1.1) rotate(5deg)',
    boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.6)}`,
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: '50%',
    background: theme.palette.primary.main,
    animation: 'avatarGlow 3s linear infinite',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    zIndex: -1,
  },
  '&:hover::before': {
    opacity: 0.7,
  },
  '@keyframes avatarGlow': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
}));

const FloatingSearchResults = styled(Paper)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.background.paper, 0.98)} 0%, 
    ${alpha(theme.palette.background.default, 0.95)} 100%)`,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  borderRadius: '16px',
  boxShadow: `0 20px 60px ${alpha(theme.palette.common.black, 0.15)}`,
  maxHeight: '400px',
  overflow: 'auto',
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: alpha(theme.palette.divider, 0.1),
    borderRadius: '3px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: `linear-gradient(135deg, 
      ${theme.palette.primary.main} 0%, 
      ${theme.palette.secondary.main} 100%)`,
    borderRadius: '3px',
  },
}));

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

interface VisuallyEnhancedHeaderProps {
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
  customQuickActions?: QuickAction[];
  enableAdvancedSearch?: boolean;
  enableVoiceSearch?: boolean;
  enableShortcuts?: boolean;
  showSpeedDial?: boolean;
  enableVisualEffects?: boolean;
}

// Enhanced quick actions with visual indicators
const enhancedQuickActions: QuickAction[] = [
  {
    id: 'new-invoice',
    title: 'New Invoice',
    icon: <ReceiptIcon />,
    path: '/invoices/new',
    color: '#4CAF50',
    isNew: true,
    category: 'primary',
    shortcut: 'Ctrl+N',
  },
  {
    id: 'add-product',
    title: 'Add Product',
    icon: <StoreIcon />,
    path: '/products/new',
    color: '#FF9800',
    category: 'primary',
  },
  {
    id: 'add-party',
    title: 'Add Party',
    icon: <PeopleIcon />,
    path: '/parties/new',
    color: '#9C27B0',
    category: 'primary',
    shortcut: 'Ctrl+P',
  },
  {
    id: 'add-category',
    title: 'Add Category',
    icon: <CategoryIcon />,
    path: '/categories/new',
    color: '#607D8B',
    category: 'primary',
  },
  {
    id: 'new-order',
    title: 'New Order',
    icon: <ShoppingCartIcon />,
    path: '/orders/new',
    color: '#2196F3',
    category: 'primary',
  },
];

export default function VisuallyEnhancedHeader({
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
  customQuickActions,
  enableAdvancedSearch = true,
  enableVoiceSearch = false,
  enableShortcuts = true,
  showSpeedDial = true,
  enableVisualEffects = true,
}: VisuallyEnhancedHeaderProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sidebarParam = searchParams.get('sidebar');
  const isMiniByParam = sidebarParam === 'collapsed';
  const effectiveIsDrawerOpen = typeof isDrawerOpen === 'boolean' ? isDrawerOpen : !isMiniByParam;
  const { currentUser, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const searchInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Enhanced State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EnhancedSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
  const [voiceListening, setVoiceListening] = useState(false);
  const [searchFilter, setSearchFilter] = useState<'all' | 'party' | 'product' | 'invoice' | 'recent'>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<string[]>([]);
  
  // Menu states
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const [quickActionsAnchor, setQuickActionsAnchor] = useState<null | HTMLElement>(null);
  const [partyQuickAccessAnchor, setPartyQuickAccessAnchor] = useState<null | HTMLElement>(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  
  // Visual effects state
  const [headerHovered, setHeaderHovered] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Party quick access
  const [recentParties, setRecentParties] = useState<PartyQuickInfo[]>([]);
  const [favoriteParties, setFavoriteParties] = useState<PartyQuickInfo[]>([]);
  const [partyQuickAccessTab, setPartyQuickAccessTab] = useState(0);

  // Memoized quick actions
  const quickActions = useMemo(() => {
    return customQuickActions || enhancedQuickActions;
  }, [customQuickActions]);

  // Enhanced search functionality with visual feedback
  const performEnhancedSearch = useCallback(async (query: string, filter: string = 'all') => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setLoadingProgress(0);
    
    // Reduced loading animation frequency for better performance
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => Math.min(prev + 20, 90));
    }, 100);

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
      
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setTimeout(() => setLoadingProgress(0), 500);
    } catch (error) {
      console.error('Enhanced search error:', error);
      setSearchResults([]);
      clearInterval(progressInterval);
      setLoadingProgress(0);
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

  // Debounced search with visual feedback
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
        setSearchFocused(true);
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
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Voice search functionality
  const startVoiceSearch = useCallback(() => {
    if (!enableVoiceSearch || !('webkitSpeechRecognition' in window)) return;

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setVoiceListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setSearchOpen(true);
    };

    recognition.onerror = () => {
      setVoiceListening(false);
    };

    recognition.onend = () => {
      setVoiceListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [enableVoiceSearch]);

  // Handle menu clicks
  const handleProfileMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleNotificationsClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleQuickActionsClick = (event: React.MouseEvent<HTMLElement>) => {
    setQuickActionsAnchor(event.currentTarget);
  };

  const handlePartyQuickAccessClick = (event: React.MouseEvent<HTMLElement>) => {
    setPartyQuickAccessAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setProfileMenuAnchor(null);
    setNotificationsAnchor(null);
    setQuickActionsAnchor(null);
    setPartyQuickAccessAnchor(null);
  };

  const handleLogoutClick = async () => {
    try {
      await handleLogout(logout, router);
      handleMenuClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Enhanced Speed dial actions with more functionality
  const closeSpeedDialAfter = useCallback((fn: () => void) => () => {
    fn();
  }, []);

  const speedDialActions = useMemo(() => [
    {
      id: 'header-quick-add',
      icon: <AddIcon />,
      name: 'Quick Add',
      onClick: closeSpeedDialAfter(() => setQuickActionsAnchor(document.body)), // Open quick actions menu
      color: theme.palette.primary.main,
      priority: 90,
    },
    {
      id: 'header-search',
      icon: <SearchIcon />,
      name: 'Search',
      onClick: closeSpeedDialAfter(() => setSearchOpen(true)),
      color: theme.palette.info.main,
      priority: 85,
    },
    {
      id: 'header-notifications',
      icon: <NotificationsIcon />,
      name: 'Notifications',
      onClick: closeSpeedDialAfter(() => setNotificationsAnchor(document.body)),
      color: theme.palette.warning.main,
      badge: 3,
      priority: 80,
    },
    {
      id: 'header-profile',
      icon: <PersonIcon />,
      name: 'Profile',
      onClick: closeSpeedDialAfter(() => setProfileMenuAnchor(document.body)),
      color: theme.palette.success.main,
      priority: 75,
    },
    ...quickActions.slice(0, 3).map((action, index) => ({
      id: `header-quick-${index}`,
      icon: action.icon,
      name: action.title,
      onClick: closeSpeedDialAfter(() => router.push(action.path)),
      color: action.color || theme.palette.secondary.main,
      priority: 70 - index,
    })),
  ], [closeSpeedDialAfter, theme.palette.primary.main, theme.palette.info.main, theme.palette.warning.main, theme.palette.success.main, theme.palette.secondary.main, quickActions, router]);

  // Register header actions in SpeedDial context
  useSpeedDialCategory('header', speedDialActions, showSpeedDial && isMobile);

  return (
    <>
      <GlassAppBar 
        position="fixed" 
        elevation={0}
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
      >
        {loadingProgress > 0 && (
          <LinearProgress 
            variant="determinate" 
            value={loadingProgress}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'transparent',
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(90deg, 
                  ${theme.palette.primary.main} 0%, 
                  ${theme.palette.secondary.main} 100%)`,
              },
            }}
          />
        )}
        
        <AnimatedToolbar>
          {/* Menu Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <NeonButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => {
                console.log('VisuallyEnhancedHeader: Menu button clicked');
                console.log('onMenuClick:', !!onMenuClick, 'onDrawerToggle:', !!onDrawerToggle);
                if (onMenuClick) {
                  console.log('Calling onMenuClick');
                  onMenuClick();
                } else if (onDrawerToggle) {
                  console.log('Calling onDrawerToggle');
                  onDrawerToggle();
                } else {
                  console.log('No toggle function provided to VisuallyEnhancedHeader');
                }
              }}
              sx={{
                display: { xs: 'flex', md: 'none' }, // Only show on mobile
                mr: 1,
              }}
            >
              <MenuIcon />
            </NeonButton>
          </motion.div>

          {/* Title with gradient text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                ml: 2,
                background: `linear-gradient(135deg, 
                  ${theme.palette.primary.dark} 0%, 
                  ${theme.palette.secondary.dark} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700,
                fontSize: '1.25rem',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              {title || 'Dashboard'}
            </Typography>
          </motion.div>

          <Box sx={{ flexGrow: 1 }} />

          {/* Enhanced Search */}
          {showSearch && !isMobile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{ position: 'relative', width: '100%', maxWidth: '500px' }}
            >
              <GlowingSearchContainer>
                <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1 }}>
                  <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                  <InputBase
                    ref={searchInputRef}
                    placeholder="Search anything... (Ctrl+K)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      setSearchOpen(true);
                      setSearchFocused(true);
                    }}
                    onBlur={() => setSearchFocused(false)}
                    sx={{
                      flex: 1,
                      color: 'inherit',
                      '& .MuiInputBase-input': {
                        padding: 0,
                        fontSize: '0.95rem',
                      },
                    }}
                  />
                  {enableVoiceSearch && (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <IconButton
                        size="small"
                        onClick={startVoiceSearch}
                        sx={{
                          ml: 1,
                          color: voiceListening ? 'error.main' : 'text.secondary',
                        }}
                      >
                        {voiceListening ? <MicIcon /> : <MicOffIcon />}
                      </IconButton>
                    </motion.div>
                  )}
                </Box>
              </GlowingSearchContainer>

              {/* Enhanced Search Results */}
              <AnimatePresence>
                {searchOpen && (searchResults.length > 0 || searchLoading) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Popper
                      open={searchOpen}
                      anchorEl={searchInputRef.current}
                      placement="bottom-start"
                      style={{ zIndex: 1300, width: '100%', maxWidth: '500px' }}
                    >
                      <ClickAwayListener onClickAway={() => setSearchOpen(false)}>
                        <FloatingSearchResults elevation={8}>
                          {searchLoading ? (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                              <CircularProgress size={24} />
                              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                                Searching...
                              </Typography>
                            </Box>
                          ) : (
                            <List sx={{ p: 1 }}>
                              {searchResults.map((result, index) => (
                                <motion.div
                                  key={result.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.2, delay: index * 0.05 }}
                                >
                                  <ListItemButton
                                    onClick={() => handleSearchResultClick(result)}
                                    sx={{
                                      borderRadius: '8px',
                                      mb: 0.5,
                                      background: highlightIndex === index 
                                        ? alpha(theme.palette.primary.main, 0.1) 
                                        : 'transparent',
                                      '&:hover': {
                                        background: `linear-gradient(135deg, 
                                          ${alpha(theme.palette.primary.main, 0.1)} 0%, 
                                          ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                                      },
                                    }}
                                  >
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                      {result.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={result.title}
                                      secondary={result.subtitle}
                                      primaryTypographyProps={{
                                        fontWeight: 500,
                                        fontSize: '0.9rem',
                                      }}
                                      secondaryTypographyProps={{
                                        fontSize: '0.8rem',
                                      }}
                                    />
                                    {result.badge && (
                                      <Chip
                                        label={result.badge}
                                        size="small"
                                        sx={{
                                          height: 20,
                                          fontSize: '0.7rem',
                                          background: `linear-gradient(135deg, 
                                            ${theme.palette.primary.main} 0%, 
                                            ${theme.palette.secondary.main} 100%)`,
                                          color: theme.palette.primary.contrastText,
                                        }}
                                      />
                                    )}
                                  </ListItemButton>
                                </motion.div>
                              ))}
                            </List>
                          )}
                        </FloatingSearchResults>
                      </ClickAwayListener>
                    </Popper>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          <Box sx={{ flexGrow: 1 }} />

          {/* Quick Actions Button */}
          {showQuickActions && !isMobile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ marginRight: '16px' }}
            >
              <FloatingQuickActionsButton
                onClick={handleQuickActionsClick}
                startIcon={<AutoAwesomeIcon />}
                endIcon={<KeyboardArrowDownIcon />}
              >
                Quick Actions
              </FloatingQuickActionsButton>
            </motion.div>
          )}

          {/* Mobile Search Button */}
          {showSearch && isMobile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ marginRight: '8px' }}
            >
              <NeonButton
                color="inherit"
                onClick={() => setSearchOpen(true)}
              >
                <SearchIcon />
              </NeonButton>
            </motion.div>
          )}

          {/* Mobile Quick Actions Button */}
          {showQuickActions && isMobile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ marginRight: '8px' }}
            >
              <NeonButton
                color="inherit"
                onClick={handleQuickActionsClick}
              >
                <AddIcon />
              </NeonButton>
            </motion.div>
          )}

          {/* Profile Avatar - Hidden on mobile */}
          {!isMobile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconButton
                onClick={handleProfileMenuClick}
                sx={{ ml: 1 }}
              >
                <MorphingAvatar>
                  {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                </MorphingAvatar>
              </IconButton>
            </motion.div>
          )}
        </AnimatedToolbar>
      </GlassAppBar>

      {/* Quick Actions Menu */}
      <Menu
        anchorEl={quickActionsAnchor}
        open={Boolean(quickActionsAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, 
              ${alpha(theme.palette.background.paper, 0.95)} 0%, 
              ${alpha(theme.palette.background.default, 0.9)} 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            borderRadius: '12px',
            minWidth: 250,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {quickActions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
          >
            <AnimatedMenuItem
              onClick={() => {
                router.push(action.path);
                handleMenuClose();
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
                <Chip
                  label="New!"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.6rem',
                    background: `linear-gradient(135deg, 
                      ${theme.palette.success.main} 0%, 
                      ${theme.palette.success.dark} 100%)`,
                    color: theme.palette.success.contrastText,
                  }}
                />
              )}
              {action.badge && (
                <PulsingBadge badgeContent={action.badge} color="error" />
              )}
            </AnimatedMenuItem>
          </motion.div>
        ))}
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchor}
        open={Boolean(notificationsAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, 
              ${alpha(theme.palette.background.paper, 0.95)} 0%, 
              ${alpha(theme.palette.background.default, 0.9)} 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            borderRadius: '12px',
            minWidth: 300,
            maxHeight: 400,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Notifications
          </Typography>
          <Divider />
        </Box>
        
        {/* Mock notifications with visual enhancements */}
        {[
          { id: 1, title: 'New Order Received', message: 'Order #1234 from ABC Corp', time: '2 min ago', type: 'success' },
          { id: 2, title: 'Low Stock Alert', message: 'Product XYZ is running low', time: '1 hour ago', type: 'warning' },
          { id: 3, title: 'Payment Received', message: '₹50,000 received from DEF Ltd', time: '3 hours ago', type: 'info' },
          { id: 4, title: 'Invoice Overdue', message: 'Invoice #5678 is overdue', time: '1 day ago', type: 'error' },
        ].map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.1 }}
          >
            <AnimatedMenuItem>
              <ListItemIcon>
                {notification.type === 'success' && <CheckCircleIcon color="success" />}
                {notification.type === 'warning' && <WarningIcon color="warning" />}
                {notification.type === 'info' && <InfoIcon color="info" />}
                {notification.type === 'error' && <ErrorIcon color="error" />}
              </ListItemIcon>
              <ListItemText
                primary={notification.title}
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {notification.time}
                    </Typography>
                  </Box>
                }
              />
            </AnimatedMenuItem>
          </motion.div>
        ))}
        
        <Divider sx={{ my: 1 }} />
        <Box sx={{ p: 1 }}>
          <Button
            fullWidth
            variant="text"
            size="small"
            sx={{
              background: `linear-gradient(135deg, 
                ${alpha(theme.palette.primary.main, 0.1)} 0%, 
                ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
              '&:hover': {
                background: `linear-gradient(135deg, 
                  ${alpha(theme.palette.primary.main, 0.2)} 0%, 
                  ${alpha(theme.palette.secondary.main, 0.2)} 100%)`,
              },
            }}
          >
            View All Notifications
          </Button>
        </Box>
      </Menu>

      {/* Profile Menu */}
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, 
              ${alpha(theme.palette.background.paper, 0.95)} 0%, 
              ${alpha(theme.palette.background.default, 0.9)} 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            borderRadius: '12px',
            minWidth: 220,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ 
          p: 2.5, 
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          background: `linear-gradient(135deg, 
            ${alpha(theme.palette.primary.main, 0.02)} 0%, 
            ${alpha(theme.palette.background.paper, 0.95)} 100%)`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: '#4caf50',
                    border: `2px solid ${theme.palette.background.paper}`,
                  }}
                />
              }
            >
              <MorphingAvatar sx={{
                width: 44,
                height: 44,
                mr: 2,
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                border: `2px solid ${alpha(theme.palette.background.paper, 0.8)}`,
              }}>
                {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
              </MorphingAvatar>
            </Badge>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.25 }}>
                {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {currentUser?.email}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                <Chip
                  label="Admin"
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    color: theme.palette.primary.main,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: '#4caf50',
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.success.main,
                      fontSize: '0.65rem',
                      fontWeight: 600,
                    }}
                  >
                    Online
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>
          
          {/* Quick Stats */}
          <Box sx={{
            display: 'flex',
            gap: 1,
            mt: 1,
            p: 1,
            borderRadius: 1.5,
            bgcolor: alpha(theme.palette.background.default, 0.3),
          }}>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                Session
              </Typography>
              <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.75rem' }}>
                2h 15m
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                Role
              </Typography>
              <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.75rem', color: theme.palette.primary.main }}>
                Admin
              </Typography>
            </Box>
          </Box>
        </Box>

        <AnimatedMenuItem onClick={() => router.push('/profile')}>
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </AnimatedMenuItem>

        <AnimatedMenuItem onClick={() => router.push('/settings')}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </AnimatedMenuItem>

        <AnimatedMenuItem onClick={() => router.push('/help')}>
          <ListItemIcon>
            <HelpIcon />
          </ListItemIcon>
          <ListItemText primary="Help & Support" />
        </AnimatedMenuItem>

        <Divider sx={{ my: 1 }} />

        <AnimatedMenuItem onClick={handleLogoutClick}>
          <ListItemIcon>
            <LogoutIcon color="error" />
          </ListItemIcon>
          <ListItemText 
            primary="Logout" 
            primaryTypographyProps={{ color: 'error.main' }}
          />
        </AnimatedMenuItem>
      </Menu>

      {/* Speed Dial is now managed by SpeedDialContext */}

      {/* Mobile Search Dialog */}
      {isMobile && (
        <Dialog
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          fullScreen
          TransitionComponent={Slide}
          TransitionProps={{ direction: 'up' }}
          PaperProps={{
            sx: {
              background: `linear-gradient(135deg, 
                ${alpha(theme.palette.background.default, 0.95)} 0%, 
                ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
              backdropFilter: 'blur(20px)',
            },
          }}
        >
          <AppBar 
            position="static" 
            elevation={0}
            sx={{
              background: `linear-gradient(135deg, 
                ${alpha(theme.palette.primary.main, 0.1)} 0%, 
                ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
              backdropFilter: 'blur(20px)',
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Toolbar>
              <TextField
                autoFocus
                fullWidth
                placeholder="Search parties, products, invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  sx: {
                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                    borderRadius: 3,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'transparent',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
                sx={{ mr: 1 }}
              />
              <IconButton 
                onClick={() => setSearchOpen(false)}
                sx={{ 
                  color: theme.palette.text.primary,
                  backgroundColor: alpha(theme.palette.action.hover, 0.5),
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Toolbar>
          </AppBar>

          <DialogContent sx={{ p: 0 }}>
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
                <Typography variant="body2" color="text.secondary">
                  No results found for "{searchQuery}"
                </Typography>
              </Box>
            ) : (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Recent Searches
                </Typography>
                {recentSearches.length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {recentSearches.map((search, index) => (
                      <Chip
                        key={index}
                        label={search}
                        variant="outlined"
                        size="small"
                        onClick={() => setSearchQuery(search)}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Start typing to search...
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Visual Effects Backdrop */}
      {enableVisualEffects && headerHovered && (
        <Backdrop
          open={headerHovered}
          sx={{
            zIndex: -1,
            background: `radial-gradient(circle at 50% 0%, 
              ${alpha(theme.palette.primary.main, 0.1)} 0%, 
              transparent 50%)`,
          }}
        />
      )}
    </>
  );
}