'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Typography,
  Chip,
  Stack,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemButton,
  Divider,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  Collapse,
  useTheme,
  alpha,
  Fade,
  Skeleton,
  Grow,
  Paper,
  AvatarGroup
} from '@mui/material';

import {
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Timeline as TimelineIcon,
  Notifications as NotificationsIcon,
  Star as StarIcon,
  Flag as FlagIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  MonetizationOn as MonetizationIcon,
  LocalShipping as LocalShippingIcon,
  Category as CategoryIcon,
  Download as DownloadIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';

// Enhanced Activity Item Interface
interface ActivityItem {
  id: string;
  type: 'invoice' | 'payment' | 'order' | 'party' | 'product' | 'system' | 'user' | 'notification';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  status?: 'success' | 'warning' | 'error' | 'info' | 'pending';
  user?: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  priority?: 'high' | 'medium' | 'low';
  category?: string;
  tags?: string[];
  metadata?: {
    [key: string]: any;
  };
  actionable?: boolean;
  actionUrl?: string;
  actionText?: string;
  relatedItems?: {
    type: string;
    id: string;
    title: string;
  }[];
}

interface EnhancedActivityFeedProps {
  activities: ActivityItem[];
  loading?: boolean;
  onRefresh?: () => void;
  onActivityClick?: (activity: ActivityItem) => void;
  onActionClick?: (activity: ActivityItem) => void;
  showFilters?: boolean;
  showSearch?: boolean;
  showGrouping?: boolean;
  maxItems?: number;
  realTime?: boolean;
  compact?: boolean;
  title?: string;
}

export const EnhancedActivityFeed: React.FC<EnhancedActivityFeedProps> = ({
  activities,
  loading = false,
  onRefresh,
  onActivityClick,
  onActionClick,
  showFilters = true,
  showSearch = true,
  showGrouping = true,
  maxItems = 10,
  realTime = false,
  compact = false,
  title = "Recent Activity"
}) => {
  const theme = useTheme();
  
  // State Management
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>(activities);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<{ [key: string]: HTMLElement | null }>({});
  const [groupBy, setGroupBy] = useState<'none' | 'date' | 'type' | 'user'>('date');

  // Filter and Search Logic
  useEffect(() => {
    let filtered = activities;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.user?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(activity => activity.type === selectedFilter);
    }

    // Sort by timestamp (newest first)
    filtered = filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limit items
    if (maxItems > 0) {
      filtered = filtered.slice(0, maxItems);
    }

    setFilteredActivities(filtered);
  }, [activities, searchQuery, selectedFilter, maxItems]);

  // Utility Functions
  const getActivityIcon = (type: string, status?: string) => {
    const iconProps = { fontSize: 'small' as const };
    
    switch (type) {
      case 'invoice': return <ReceiptIcon {...iconProps} />;
      case 'payment': return <PaymentIcon {...iconProps} />;
      case 'order': return <ShoppingCartIcon {...iconProps} />;
      case 'party': return <PeopleIcon {...iconProps} />;
      case 'product': return <InventoryIcon {...iconProps} />;
      case 'system': return <SettingsIcon {...iconProps} />;
      case 'user': return <PersonIcon {...iconProps} />;
      case 'notification': return <NotificationsIcon {...iconProps} />;
      default: return <InfoIcon {...iconProps} />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return theme.palette.success.main;
      case 'warning': return theme.palette.warning.main;
      case 'error': return theme.palette.error.main;
      case 'info': return theme.palette.info.main;
      case 'pending': return theme.palette.grey[500];
      default: return theme.palette.primary.main;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return theme.palette.error.main;
      case 'medium': return theme.palette.warning.main;
      case 'low': return theme.palette.success.main;
      default: return theme.palette.grey[500];
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return time.toLocaleDateString();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, activityId: string) => {
    event.stopPropagation();
    setAnchorEl(prev => ({ ...prev, [activityId]: event.currentTarget }));
  };

  const handleMenuClose = (activityId: string) => {
    setAnchorEl(prev => ({ ...prev, [activityId]: null }));
  };

  const handleExpandToggle = (activityId: string) => {
    setExpandedItems(prev =>
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  const groupActivities = (activities: ActivityItem[]) => {
    if (groupBy === 'none') return { 'All Activities': activities };

    const grouped: { [key: string]: ActivityItem[] } = {};

    activities.forEach(activity => {
      let key = '';
      
      switch (groupBy) {
        case 'date':
          const date = new Date(activity.timestamp);
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (date.toDateString() === today.toDateString()) {
            key = 'Today';
          } else if (date.toDateString() === yesterday.toDateString()) {
            key = 'Yesterday';
          } else {
            key = date.toLocaleDateString();
          }
          break;
        case 'type':
          key = activity.type.charAt(0).toUpperCase() + activity.type.slice(1);
          break;
        case 'user':
          key = activity.user?.name || 'System';
          break;
        default:
          key = 'All Activities';
      }

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(activity);
    });

    return grouped;
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Time', 'Type', 'Title', 'Description', 'Status', 'Amount', 'User'],
      ...filteredActivities.map(activity => [
        new Date(activity.timestamp).toLocaleDateString(),
        new Date(activity.timestamp).toLocaleTimeString(),
        activity.type,
        activity.title,
        activity.description,
        activity.status || 'N/A',
        activity.amount || '',
        activity.user?.name || 'System'
      ])
    ];

    const csv = csvContent.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activities_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const groupedActivities = showGrouping ? groupActivities(filteredActivities) : { 'All Activities': filteredActivities };

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All Activities', count: activities.length },
    { value: 'invoice', label: 'Invoices', count: activities.filter(a => a.type === 'invoice').length },
    { value: 'payment', label: 'Payments', count: activities.filter(a => a.type === 'payment').length },
    { value: 'order', label: 'Orders', count: activities.filter(a => a.type === 'order').length },
    { value: 'party', label: 'Parties', count: activities.filter(a => a.type === 'party').length },
    { value: 'product', label: 'Products', count: activities.filter(a => a.type === 'product').length },
    { value: 'system', label: 'System', count: activities.filter(a => a.type === 'system').length }
  ];

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main'
              }}
            >
              <TimelineIcon />
            </Box>
            <Typography variant="h6" fontWeight={700}>
              {title}
            </Typography>
            {realTime && (
              <Chip
                size="small"
                label="Live"
                color="success"
                variant="filled"
                icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#fff', animation: 'pulse 2s infinite' }} />}
              />
            )}
          </Stack>
        }
        action={
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Export to CSV">
              <IconButton 
                onClick={exportToCSV} 
                disabled={loading || filteredActivities.length === 0}
                size="small"
              >
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
            {onRefresh && (
              <Tooltip title="Refresh">
                <IconButton onClick={onRefresh} disabled={loading} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Filter">
              <IconButton size="small">
                <FilterListIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        }
        sx={{ 
          pb: 2,
          background: alpha(theme.palette.primary.main, 0.02),
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      />

      <CardContent sx={{ flex: 1, pt: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Search and Filters */}
        {(showSearch || showFilters) && (
          <Box sx={{ mb: 2 }}>
            {showSearch && (
              <TextField
                fullWidth
                size="small"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
                sx={{ mb: showFilters ? 2 : 0 }}
              />
            )}

            {showFilters && (
              <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
                <Tabs
                  value={selectedFilter}
                  onChange={(_, newValue) => setSelectedFilter(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    minHeight: 'auto',
                    '& .MuiTab-root': {
                      minHeight: 'auto',
                      py: 0.5,
                      px: 2,
                      minWidth: 'auto',
                      textTransform: 'none'
                    }
                  }}
                >
                  {filterOptions.map(option => (
                    <Tab
                      key={option.value}
                      value={option.value}
                      label={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <span>{option.label}</span>
                          <Chip size="small" label={option.count} />
                        </Stack>
                      }
                    />
                  ))}
                </Tabs>
              </Stack>
            )}
          </Box>
        )}

        {/* Activity List */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <Stack spacing={2}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                  </Box>
                  <Skeleton variant="text" width={60} />
                </Box>
              ))}
            </Stack>
          ) : (
            <List sx={{ p: 0 }}>
              {Object.entries(groupedActivities).map(([groupName, groupActivities]) => (
                <Box key={groupName}>
                  {showGrouping && Object.keys(groupedActivities).length > 1 && (
                    <ListItem sx={{ py: 1, px: 0 }}>
                      <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                        {groupName}
                      </Typography>
                    </ListItem>
                  )}
                  
                  {groupActivities.map((activity, index) => (
                    <Fade in key={activity.id} timeout={300 + index * 50}>
                      <Box>
                        <ListItem
                          disablePadding
                          component={Paper}
                          sx={{
                            mb: 1,
                            borderRadius: 2,
                            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.06),
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
                              transform: 'translateY(-2px)'
                            }
                          }}
                        >
                          <ListItemButton
                            onClick={() => onActivityClick?.(activity)}
                            sx={{ borderRadius: 2, py: compact ? 1 : 1.5 }}
                          >
                            <ListItemIcon sx={{ minWidth: 48 }}>
                              <Avatar
                                sx={{
                                  width: compact ? 32 : 40,
                                  height: compact ? 32 : 40,
                                  backgroundColor: alpha(getStatusColor(activity.status), 0.1),
                                  color: getStatusColor(activity.status)
                                }}
                              >
                                {getActivityIcon(activity.type, activity.status)}
                              </Avatar>
                            </ListItemIcon>

                            <ListItemText
                              primary={
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                  <Typography variant="body2" fontWeight={600}>
                                    {activity.title}
                                  </Typography>
                                  {activity.priority && (
                                    <Box
                                      sx={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        backgroundColor: getPriorityColor(activity.priority)
                                      }}
                                    />
                                  )}
                                  {activity.actionable && (
                                    <FlagIcon fontSize="small" color="warning" />
                                  )}
                                </Stack>
                              }
                              secondary={
                                <Stack spacing={0.5}>
                                  <Typography variant="body2" color="text.secondary">
                                    {activity.description}
                                  </Typography>
                                  <Stack direction="row" alignItems="center" spacing={1}>
                                    {activity.user && (
                                      <Chip
                                        size="small"
                                        label={activity.user.name}
                                        variant="outlined"
                                        avatar={<Avatar sx={{ width: 16, height: 16 }}>{activity.user.name[0]}</Avatar>}
                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                      />
                                    )}
                                    {activity.tags?.map(tag => (
                                      <Chip
                                        key={tag}
                                        size="small"
                                        label={tag}
                                        variant="outlined"
                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                      />
                                    ))}
                                  </Stack>
                                </Stack>
                              }
                            />

                            <ListItemSecondaryAction>
                              <Stack alignItems="flex-end" spacing={0.5}>
                                <Typography variant="caption" color="text.secondary">
                                  {formatTimeAgo(activity.timestamp)}
                                </Typography>
                                {activity.amount && (
                                  <Typography
                                    variant="body2"
                                    fontWeight={600}
                                    color={activity.amount > 0 ? 'success.main' : 'error.main'}
                                  >
                                    {activity.amount > 0 ? '+' : ''}₹{Math.abs(activity.amount).toLocaleString()}
                                  </Typography>
                                )}
                                <Stack direction="row" spacing={0.5}>
                                  {activity.relatedItems && activity.relatedItems.length > 0 && (
                                    <Tooltip title="Has related items">
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleExpandToggle(activity.id);
                                        }}
                                      >
                                        {expandedItems.includes(activity.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  <IconButton
                                    size="small"
                                    onClick={(e) => handleMenuOpen(e, activity.id)}
                                  >
                                    <MoreVertIcon fontSize="small" />
                                  </IconButton>
                                </Stack>
                              </Stack>
                            </ListItemSecondaryAction>
                          </ListItemButton>
                        </ListItem>

                        {/* Expanded Content */}
                        {activity.relatedItems && (
                          <Collapse in={expandedItems.includes(activity.id)}>
                            <Box sx={{ ml: 6, mb: 2, p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.02), borderRadius: 2 }}>
                              <Typography variant="caption" color="text.secondary" gutterBottom>
                                Related Items:
                              </Typography>
                              <Stack spacing={1}>
                                {activity.relatedItems.map(item => (
                                  <Chip
                                    key={item.id}
                                    size="small"
                                    label={`${item.type}: ${item.title}`}
                                    variant="outlined"
                                    clickable
                                  />
                                ))}
                              </Stack>
                            </Box>
                          </Collapse>
                        )}

                        {/* Action Button */}
                        {activity.actionable && activity.actionText && (
                          <Box sx={{ ml: 6, mb: 2 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={(e) => {
                                e.stopPropagation();
                                onActionClick?.(activity);
                              }}
                            >
                              {activity.actionText}
                            </Button>
                          </Box>
                        )}

                        {/* Menu */}
                        <Menu
                          anchorEl={anchorEl[activity.id]}
                          open={Boolean(anchorEl[activity.id])}
                          onClose={() => handleMenuClose(activity.id)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MenuItem onClick={() => handleMenuClose(activity.id)}>
                            <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
                            View Details
                          </MenuItem>
                          {activity.actionUrl && (
                            <MenuItem onClick={() => handleMenuClose(activity.id)}>
                              <ListItemIcon><ReceiptIcon fontSize="small" /></ListItemIcon>
                              Go to Item
                            </MenuItem>
                          )}
                          <MenuItem onClick={() => handleMenuClose(activity.id)}>
                            <ListItemIcon><StarIcon fontSize="small" /></ListItemIcon>
                            Mark Important
                          </MenuItem>
                        </Menu>
                      </Box>
                    </Fade>
                  ))}
                </Box>
              ))}
            </List>
          )}

          {!loading && filteredActivities.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <TimelineIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                No activities found
              </Typography>
            </Box>
          )}
        </Box>

        {/* View All Button */}
        {filteredActivities.length >= maxItems && (
          <Box sx={{ pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Button fullWidth variant="outlined" size="small">
              View All Activities ({activities.length})
            </Button>
          </Box>
        )}
      </CardContent>

      {/* Pulse Animation */}
      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </Card>
  );
};

export default EnhancedActivityFeed;