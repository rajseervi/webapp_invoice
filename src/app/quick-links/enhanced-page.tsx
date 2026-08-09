"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  Tooltip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Menu,
  Badge,
  Switch,
  FormControlLabel,
  Autocomplete,
  Stack,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Category as CategoryIcon,
  Public as WebIcon,
  Business as BusinessIcon,
  School as EducationIcon,
  ShoppingCart as ShoppingIcon,
  Entertainment as EntertainmentIcon,
  Work as WorkIcon,
  Home as HomeIcon,
  Favorite as FavoriteIcon,
  Star as StarIcon,
  Launch as LaunchIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  Upload as ImportIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  List as ListViewIcon,
  ViewModule as GridViewIcon,
  Sort as SortIcon,
  FilterList as FilterIcon,
  Bookmark as BookmarkIcon
} from '@mui/icons-material';
import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';
import PageHeader from '@/components/PageHeader/PageHeader';
import { RemoveQuickLinkDuplicatesButton } from '@/components/Common/RemoveQuickLinkDuplicatesButton';
import { findQuickLinkDuplicates } from '@/utils/quickLinkUtils';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase/config';

interface QuickLink {
  id: string;
  title: string;
  url: string;
  category?: string;
  description?: string;
  icon?: string;
  color?: string;
  order?: number;
  favorite?: boolean;
  clicks?: number;
  createdAt?: any;
  updatedAt?: any;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`quicklinks-tabpanel-${index}`}
      aria-labelledby={`quicklinks-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const categoryOptions = [
  { value: 'work', label: 'Work', icon: <WorkIcon />, color: '#1976d2' },
  { value: 'business', label: 'Business', icon: <BusinessIcon />, color: '#388e3c' },
  { value: 'education', label: 'Education', icon: <EducationIcon />, color: '#f57c00' },
  { value: 'shopping', label: 'Shopping', icon: <ShoppingIcon />, color: '#e91e63' },
  { value: 'entertainment', label: 'Entertainment', icon: <EntertainmentIcon />, color: '#9c27b0' },
  { value: 'social', label: 'Social', icon: <ShareIcon />, color: '#00bcd4' },
  { value: 'tools', label: 'Tools', icon: <SettingsIcon />, color: '#607d8b' },
  { value: 'other', label: 'Other', icon: <WebIcon />, color: '#795548' }
];

const sortOptions = [
  { value: 'title', label: 'Title' },
  { value: 'category', label: 'Category' },
  { value: 'clicks', label: 'Most Used' },
  { value: 'createdAt', label: 'Date Added' },
  { value: 'updatedAt', label: 'Last Modified' }
];

export default function EnhancedQuickLinksPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  const [newLink, setNewLink] = useState({
    title: '',
    url: '',
    category: '',
    description: '',
    color: '#1976d2'
  });

  // Menu states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedLink, setSelectedLink] = useState<QuickLink | null>(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Statistics
  const stats = useMemo(() => {
    const totalLinks = quickLinks.length;
    const favoriteLinks = quickLinks.filter(link => link.favorite).length;
    const categoryCounts = quickLinks.reduce((acc, link) => {
      const category = link.category || 'other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topCategory = Object.entries(categoryCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';
    const totalClicks = quickLinks.reduce((sum, link) => sum + (link.clicks || 0), 0);

    return {
      totalLinks,
      favoriteLinks,
      topCategory,
      totalClicks,
      categoryCounts
    };
  }, [quickLinks]);

  // Fetch quick links
  const fetchQuickLinks = async () => {
    try {
      setLoading(true);
      const quickLinksRef = collection(db, 'quickLinks');
      const q = query(quickLinksRef, orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      
      const links = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QuickLink[];
      
      setQuickLinks(links);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching quick links:', err);
      setError('Failed to fetch quick links. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort links
  useEffect(() => {
    let filtered = [...quickLinks];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(link =>
        link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (link.description && link.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(link => link.category === categoryFilter);
    }

    // Apply favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(link => link.favorite);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof QuickLink];
      let bValue: any = b[sortBy as keyof QuickLink];

      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = aValue ? new Date(aValue.seconds * 1000) : new Date(0);
        bValue = bValue ? new Date(bValue.seconds * 1000) : new Date(0);
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredLinks(filtered);
  }, [quickLinks, searchTerm, categoryFilter, sortBy, sortOrder, showFavoritesOnly]);

  useEffect(() => {
    fetchQuickLinks();
    const savedViewMode = localStorage.getItem('quickLinksViewMode') as 'grid' | 'list';
    if (savedViewMode) setViewMode(savedViewMode);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('quickLinksViewMode', mode);
  };

  const handleAddLink = async () => {
    try {
      if (!newLink.title || !newLink.url) {
        setSnackbar({
          open: true,
          message: 'Title and URL are required',
          severity: 'error'
        });
        return;
      }

      // Ensure URL has protocol
      let url = newLink.url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const quickLinksRef = collection(db, 'quickLinks');
      await addDoc(quickLinksRef, {
        ...newLink,
        url,
        order: quickLinks.length + 1,
        clicks: 0,
        favorite: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      setNewLink({
        title: '',
        url: '',
        category: '',
        description: '',
        color: '#1976d2'
      });

      setSnackbar({
        open: true,
        message: 'Quick link added successfully',
        severity: 'success'
      });

      setDialogOpen(false);
      fetchQuickLinks();
    } catch (err) {
      console.error('Error adding quick link:', err);
      setSnackbar({
        open: true,
        message: 'Failed to add quick link',
        severity: 'error'
      });
    }
  };

  const handleUpdateLink = async () => {
    if (!editingLink) return;

    try {
      const linkRef = doc(db, 'quickLinks', editingLink.id);
      await updateDoc(linkRef, {
        title: editingLink.title,
        url: editingLink.url,
        category: editingLink.category || '',
        description: editingLink.description || '',
        color: editingLink.color || '#1976d2',
        updatedAt: Timestamp.now()
      });

      setSnackbar({
        open: true,
        message: 'Quick link updated successfully',
        severity: 'success'
      });

      setEditingLink(null);
      setDialogOpen(false);
      fetchQuickLinks();
    } catch (err) {
      console.error('Error updating quick link:', err);
      setSnackbar({
        open: true,
        message: 'Failed to update quick link',
        severity: 'error'
      });
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this quick link?')) {
      return;
    }

    try {
      const linkRef = doc(db, 'quickLinks', id);
      await deleteDoc(linkRef);

      setSnackbar({
        open: true,
        message: 'Quick link deleted successfully',
        severity: 'success'
      });

      fetchQuickLinks();
    } catch (err) {
      console.error('Error deleting quick link:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete quick link',
        severity: 'error'
      });
    }
  };

  const handleToggleFavorite = async (link: QuickLink) => {
    try {
      const linkRef = doc(db, 'quickLinks', link.id);
      await updateDoc(linkRef, {
        favorite: !link.favorite,
        updatedAt: Timestamp.now()
      });

      fetchQuickLinks();
    } catch (err) {
      console.error('Error updating favorite:', err);
    }
  };

  const handleLinkClick = async (link: QuickLink) => {
    try {
      // Increment click count
      const linkRef = doc(db, 'quickLinks', link.id);
      await updateDoc(linkRef, {
        clicks: (link.clicks || 0) + 1,
        updatedAt: Timestamp.now()
      });

      // Open link
      window.open(link.url, '_blank');
      
      // Update local state
      setQuickLinks(prev => prev.map(l => 
        l.id === link.id ? { ...l, clicks: (l.clicks || 0) + 1 } : l
      ));
    } catch (err) {
      console.error('Error updating click count:', err);
      // Still open the link even if count update fails
      window.open(link.url, '_blank');
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryOption = categoryOptions.find(opt => opt.value === category);
    return categoryOption?.icon || <WebIcon />;
  };

  const getCategoryColor = (category: string) => {
    const categoryOption = categoryOptions.find(opt => opt.value === category);
    return categoryOption?.color || '#1976d2';
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, link: QuickLink) => {
    setAnchorEl(event.currentTarget);
    setSelectedLink(link);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedLink(null);
  };

  const handleEdit = (link: QuickLink) => {
    setEditingLink(link);
    setDialogOpen(true);
    handleMenuClose();
  };

  const StatCard = ({ title, value, icon, color = 'primary' }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <ImprovedDashboardLayout>
      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        <PageHeader
          title="Quick Links Manager"
          subtitle="Organize and access your favorite websites and tools"
          icon={<BookmarkIcon />}
          actions={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchQuickLinks}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingLink(null);
                  setNewLink({
                    title: '',
                    url: '',
                    category: '',
                    description: '',
                    color: '#1976d2'
                  });
                  setDialogOpen(true);
                }}
              >
                Add Link
              </Button>
            </Box>
          }
        />

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab icon={<DashboardIcon />} label="Dashboard" />
            <Tab icon={<BookmarkIcon />} label="All Links" />
            <Tab icon={<StarIcon />} label="Favorites" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          {/* Dashboard Tab */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Links"
                value={stats.totalLinks}
                icon={<BookmarkIcon />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Favorites"
                value={stats.favoriteLinks}
                icon={<StarIcon />}
                color="warning"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Clicks"
                value={stats.totalClicks}
                icon={<LaunchIcon />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Top Category"
                value={categoryOptions.find(c => c.value === stats.topCategory)?.label || 'None'}
                icon={<CategoryIcon />}
                color="info"
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setEditingLink(null);
                          setDialogOpen(true);
                        }}
                      >
                        Add Link
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<StarIcon />}
                        onClick={() => {
                          setActiveTab(2);
                          setShowFavoritesOnly(true);
                        }}
                      >
                        View Favorites
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<ExportIcon />}
                        disabled
                      >
                        Export Links
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <RemoveQuickLinkDuplicatesButton onComplete={fetchQuickLinks} />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Categories
                  </Typography>
                  <List dense>
                    {categoryOptions.map((category) => (
                      <ListItem key={category.value}>
                        <ListItemIcon>
                          {category.icon}
                        </ListItemIcon>
                        <ListItemText primary={category.label} />
                        <ListItemSecondaryAction>
                          <Chip 
                            label={stats.categoryCounts[category.value] || 0} 
                            size="small" 
                            color="primary"
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {/* All Links Tab */}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  label="Search Links"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearchTerm('')}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl variant="outlined" size="small" fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    label="Category"
                  >
                    <MenuItem value=""><em>All Categories</em></MenuItem>
                    {categoryOptions.map((category) => (
                      <MenuItem key={category.value} value={category.value}>
                        {category.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl variant="outlined" size="small" fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    label="Sort By"
                  >
                    {sortOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="List View">
                    <IconButton
                      onClick={() => handleViewModeChange('list')}
                      color={viewMode === 'list' ? 'primary' : 'default'}
                    >
                      <ListViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Grid View">
                    <IconButton
                      onClick={() => handleViewModeChange('grid')}
                      color={viewMode === 'grid' ? 'primary' : 'default'}
                    >
                      <GridViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Sort Order">
                    <IconButton
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      <SortIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showFavoritesOnly}
                      onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                    />
                  }
                  label="Favorites Only"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Links Display */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredLinks.length === 0 ? (
            <Alert severity="info">
              {quickLinks.length === 0 
                ? "No quick links found. Add your first link above."
                : "No links match your current filters."
              }
            </Alert>
          ) : viewMode === 'grid' ? (
            <Grid container spacing={2}>
              {filteredLinks.map((link) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={link.id}>
                  <Card sx={{ height: '100%', position: 'relative' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Avatar
                          sx={{ 
                            bgcolor: getCategoryColor(link.category || 'other'),
                            width: 40,
                            height: 40
                          }}
                        >
                          {getCategoryIcon(link.category || 'other')}
                        </Avatar>
                        <Box>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleFavorite(link)}
                            color={link.favorite ? 'warning' : 'default'}
                          >
                            <StarIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, link)}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      <Typography variant="h6" noWrap gutterBottom>
                        {link.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {categoryOptions.find(c => c.value === link.category)?.label || 'Other'}
                      </Typography>
                      {link.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {link.description.substring(0, 80)}...
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {link.clicks || 0} clicks
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<LaunchIcon />}
                        onClick={() => handleLinkClick(link)}
                        fullWidth
                      >
                        Open
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper>
              <List>
                {filteredLinks.map((link, index) => (
                  <React.Fragment key={link.id}>
                    <ListItem>
                      <ListItemIcon>
                        <Avatar
                          sx={{ 
                            bgcolor: getCategoryColor(link.category || 'other'),
                            width: 32,
                            height: 32
                          }}
                        >
                          {getCategoryIcon(link.category || 'other')}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1">{link.title}</Typography>
                            {link.favorite && <StarIcon color="warning" fontSize="small" />}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {link.url}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                              <Chip 
                                label={categoryOptions.find(c => c.value === link.category)?.label || 'Other'} 
                                size="small" 
                                variant="outlined"
                              />
                              <Chip 
                                label={`${link.clicks || 0} clicks`} 
                                size="small" 
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Open Link">
                            <IconButton onClick={() => handleLinkClick(link)}>
                              <LaunchIcon />
                            </IconButton>
                          </Tooltip>
                          <IconButton onClick={(e) => handleMenuOpen(e, link)}>
                            <MoreVertIcon />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < filteredLinks.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {/* Favorites Tab */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Your Favorite Links
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quick access to your most important links
            </Typography>
          </Box>

          {quickLinks.filter(link => link.favorite).length === 0 ? (
            <Alert severity="info">
              No favorite links yet. Click the star icon on any link to add it to favorites.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {quickLinks.filter(link => link.favorite).map((link) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={link.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          sx={{ 
                            bgcolor: getCategoryColor(link.category || 'other'),
                            width: 40,
                            height: 40,
                            mr: 2
                          }}
                        >
                          {getCategoryIcon(link.category || 'other')}
                        </Avatar>
                        <StarIcon color="warning" />
                      </Box>
                      <Typography variant="h6" noWrap gutterBottom>
                        {link.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {link.clicks || 0} clicks
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<LaunchIcon />}
                        onClick={() => handleLinkClick(link)}
                        fullWidth
                      >
                        Open
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => selectedLink && handleLinkClick(selectedLink)}>
            <ListItemIcon><LaunchIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Open Link</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => selectedLink && handleEdit(selectedLink)}>
            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => selectedLink && handleToggleFavorite(selectedLink)}>
            <ListItemIcon>
              <StarIcon fontSize="small" color={selectedLink?.favorite ? 'warning' : 'inherit'} />
            </ListItemIcon>
            <ListItemText>
              {selectedLink?.favorite ? 'Remove from Favorites' : 'Add to Favorites'}
            </ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem 
            onClick={() => {
              if (selectedLink) {
                handleDeleteLink(selectedLink.id);
                handleMenuClose();
              }
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingLink ? 'Edit Quick Link' : 'Add New Quick Link'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  autoFocus
                  label="Title"
                  fullWidth
                  value={editingLink ? editingLink.title : newLink.title}
                  onChange={(e) => {
                    if (editingLink) {
                      setEditingLink({ ...editingLink, title: e.target.value });
                    } else {
                      setNewLink({ ...newLink, title: e.target.value });
                    }
                  }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="URL"
                  fullWidth
                  value={editingLink ? editingLink.url : newLink.url}
                  onChange={(e) => {
                    if (editingLink) {
                      setEditingLink({ ...editingLink, url: e.target.value });
                    } else {
                      setNewLink({ ...newLink, url: e.target.value });
                    }
                  }}
                  placeholder="https://example.com"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={editingLink ? editingLink.category || '' : newLink.category}
                    label="Category"
                    onChange={(e) => {
                      if (editingLink) {
                        setEditingLink({ ...editingLink, category: e.target.value });
                      } else {
                        setNewLink({ ...newLink, category: e.target.value });
                      }
                    }}
                  >
                    {categoryOptions.map((category) => (
                      <MenuItem key={category.value} value={category.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {category.icon}
                          {category.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Color"
                  type="color"
                  fullWidth
                  value={editingLink ? editingLink.color || '#1976d2' : newLink.color}
                  onChange={(e) => {
                    if (editingLink) {
                      setEditingLink({ ...editingLink, color: e.target.value });
                    } else {
                      setNewLink({ ...newLink, color: e.target.value });
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description (optional)"
                  multiline
                  rows={3}
                  fullWidth
                  value={editingLink ? editingLink.description || '' : newLink.description}
                  onChange={(e) => {
                    if (editingLink) {
                      setEditingLink({ ...editingLink, description: e.target.value });
                    } else {
                      setNewLink({ ...newLink, description: e.target.value });
                    }
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={editingLink ? handleUpdateLink : handleAddLink} 
              variant="contained"
            >
              {editingLink ? 'Update' : 'Add'} Link
            </Button>
          </DialogActions>
        </Dialog>

        {/* Speed Dial */}
        <SpeedDial
          ariaLabel="Quick Links Actions"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
        >
          <SpeedDialAction
            icon={<AddIcon />}
            tooltipTitle="Add Link"
            onClick={() => {
              setEditingLink(null);
              setDialogOpen(true);
            }}
          />
          <SpeedDialAction
            icon={<StarIcon />}
            tooltipTitle="View Favorites"
            onClick={() => setActiveTab(2)}
          />
          <SpeedDialAction
            icon={<RefreshIcon />}
            tooltipTitle="Refresh"
            onClick={fetchQuickLinks}
          />
        </SpeedDial>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </ImprovedDashboardLayout>
  );
}