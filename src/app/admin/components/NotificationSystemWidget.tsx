"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Badge,
  Stack,
  Divider,
  Button,
  Menu,
  MenuItem,
  Switch,
  FormControlLabel,
  useTheme,
  alpha,
  Skeleton,
  Fade,
  Collapse
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Payment as PaymentIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  Settings as SettingsIcon,
  MoreVert as MoreVertIcon,
  Clear as ClearIcon,
  DoneAll as DoneAllIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface Notification {
  id: string;
  type: 'payment_due' | 'low_stock' | 'new_order' | 'system' | 'achievement' | 'alert' | 'reminder';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionable: boolean;
  metadata?: {
    invoiceId?: string;
    productId?: string;
    orderId?: string;
    amount?: number;
    quantity?: number;
  };
}

interface NotificationSystemWidgetProps {
  showHeader?: boolean;
  compact?: boolean;
  maxHeight?: number;
  refreshInterval?: number;
}

export default function NotificationSystemWidget({
  showHeader = true,
  compact = false,
  maxHeight = 500,
  refreshInterval = 30000
}: NotificationSystemWidgetProps) {
  const theme = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high' | 'actionable'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const fetchNotifications = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Mock notifications data
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'payment_due',
          priority: 'high',
          title: 'Payment Overdue',
          message: 'Invoice #INV-2024-001 payment is 5 days overdue. Amount: ₹25,000',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          read: false,
          actionable: true,
          metadata: {
            invoiceId: 'INV-2024-001',
            amount: 25000
          }
        },
        {
          id: '2',
          type: 'low_stock',
          priority: 'medium',
          title: 'Low Stock Alert',
          message: 'Product "Premium Widget" has only 5 units remaining in stock',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          read: false,
          actionable: true,
          metadata: {
            productId: 'PROD-001',
            quantity: 5
          }
        },
        {
          id: '3',
          type: 'new_order',
          priority: 'medium',
          title: 'New Order Received',
          message: 'Order #ORD-2024-046 received from ABC Corp for ₹15,000',
          timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          read: true,
          actionable: true,
          metadata: {
            orderId: 'ORD-2024-046',
            amount: 15000
          }
        },
        {
          id: '4',
          type: 'achievement',
          priority: 'low',
          title: 'Monthly Target Achieved',
          message: 'Congratulations! You have achieved 105% of monthly sales target',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          read: true,
          actionable: false
        },
        {
          id: '5',
          type: 'system',
          priority: 'low',
          title: 'System Backup Completed',
          message: 'Daily system backup completed successfully at 2:00 AM',
          timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
          read: true,
          actionable: false
        },
        {
          id: '6',
          type: 'alert',
          priority: 'high',
          title: 'Multiple Failed Login Attempts',
          message: 'Security alert: 5 failed login attempts detected from IP 192.168.1.100',
          timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
          read: false,
          actionable: true
        },
        {
          id: '7',
          type: 'reminder',
          priority: 'medium',
          title: 'Invoice Due Tomorrow',
          message: 'Invoice #INV-2024-003 for XYZ Ltd is due tomorrow (₹45,000)',
          timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
          read: false,
          actionable: true,
          metadata: {
            invoiceId: 'INV-2024-003',
            amount: 45000
          }
        },
        {
          id: '8',
          type: 'low_stock',
          priority: 'high',
          title: 'Out of Stock',
          message: 'Product "Standard Kit" is completely out of stock',
          timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
          read: false,
          actionable: true,
          metadata: {
            productId: 'PROD-002',
            quantity: 0
          }
        }
      ];

      await new Promise(resolve => setTimeout(resolve, 500));
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const filteredNotifications = useMemo(() => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'high':
        return notifications.filter(n => n.priority === 'high');
      case 'actionable':
        return notifications.filter(n => n.actionable);
      default:
        return notifications;
    }
  }, [notifications, filter]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const highPriorityCount = notifications.filter(n => n.priority === 'high' && !n.read).length;

  const getNotificationIcon = (type: string, priority: string) => {
    const iconProps = { fontSize: 'small' as const };
    
    switch (type) {
      case 'payment_due':
        return <PaymentIcon {...iconProps} />;
      case 'low_stock':
        return <InventoryIcon {...iconProps} />;
      case 'new_order':
        return <TrendingUpIcon {...iconProps} />;
      case 'achievement':
        return <CheckCircleIcon {...iconProps} />;
      case 'system':
        return <InfoIcon {...iconProps} />;
      case 'alert':
        return <ErrorIcon {...iconProps} />;
      case 'reminder':
        return <ScheduleIcon {...iconProps} />;
      default:
        return <InfoIcon {...iconProps} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return theme.palette.error.main;
      case 'medium': return theme.palette.warning.main;
      case 'low': return theme.palette.info.main;
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
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (loading && notifications.length === 0) {
    return (
      <Card sx={{ maxHeight }}>
        {showHeader && (
          <CardHeader
            title={<Skeleton width={150} />}
            action={<Skeleton variant="circular" width={40} height={40} />}
          />
        )}
        <CardContent>
          <Stack spacing={2}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="80%" />
                  <Skeleton width="60%" />
                </Box>
                <Skeleton width={60} />
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ maxHeight, display: 'flex', flexDirection: 'column' }}>
      {showHeader && (
        <CardHeader
          avatar={
            <Badge badgeContent={unreadCount} color="error">
              <Avatar
                sx={{
                  backgroundColor: alpha(
                    highPriorityCount > 0 ? theme.palette.error.main : theme.palette.primary.main, 
                    0.1
                  ),
                  color: highPriorityCount > 0 ? theme.palette.error.main : theme.palette.primary.main,
                }}
              >
                {highPriorityCount > 0 ? <NotificationsActiveIcon /> : <NotificationsIcon />}
              </Avatar>
            </Badge>
          }
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6" fontWeight={600}>
                Notifications
              </Typography>
              {unreadCount > 0 && (
                <Chip 
                  label={`${unreadCount} unread`} 
                  size="small" 
                  color="error" 
                  variant="outlined"
                />
              )}
            </Stack>
          }
          action={
            <Stack direction="row" spacing={1}>
              <Tooltip title="Filter">
                <IconButton
                  size="small"
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                >
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh">
                <IconButton
                  onClick={() => fetchNotifications(true)}
                  disabled={refreshing}
                  size="small"
                >
                  <RefreshIcon
                    sx={{
                      animation: refreshing ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      }
                    }}
                  />
                </IconButton>
              </Tooltip>
              <Tooltip title="Settings">
                <IconButton size="small">
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          }
        />
      )}

      <CardContent sx={{ flex: 1, overflow: 'hidden', pt: showHeader ? 0 : 2 }}>
        {/* Quick Actions */}
        {unreadCount > 0 && (
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Button
              size="small"
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAllAsRead}
              variant="outlined"
            >
              Mark All Read
            </Button>
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={handleClearAll}
              variant="outlined"
              color="error"
            >
              Clear All
            </Button>
          </Stack>
        )}

        {/* Notifications List */}
        <Box sx={{ height: maxHeight - 200, overflow: 'auto' }}>
          {filteredNotifications.length === 0 ? (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 4,
                color: 'text.secondary'
              }}
            >
              <NotificationsIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant="body2">
                {filter === 'all' ? 'No notifications' : `No ${filter} notifications`}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredNotifications.map((notification, index) => (
                <Fade in key={notification.id} timeout={300 + index * 50}>
                  <Box>
                    <ListItem
                      sx={{
                        px: 0,
                        py: compact ? 1 : 1.5,
                        borderRadius: 1,
                        backgroundColor: notification.read 
                          ? 'transparent' 
                          : alpha(theme.palette.primary.main, 0.02),
                        border: notification.read 
                          ? 'none' 
                          : `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: alpha(getPriorityColor(notification.priority), 0.1),
                            color: getPriorityColor(notification.priority),
                          }}
                        >
                          {getNotificationIcon(notification.type, notification.priority)}
                        </Avatar>
                      </ListItemIcon>

                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography 
                              variant="body2" 
                              fontWeight={notification.read ? 400 : 600}
                              sx={{ flex: 1 }}
                            >
                              {notification.title}
                            </Typography>
                            <Chip
                              label={notification.priority}
                              size="small"
                              color={
                                notification.priority === 'high' ? 'error' :
                                notification.priority === 'medium' ? 'warning' : 'default'
                              }
                              variant="outlined"
                              sx={{ fontSize: '0.6rem', height: 20 }}
                            />
                          </Stack>
                        }
                        secondary={
                          <Box>
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: expandedItems.has(notification.id) ? 'none' : 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                cursor: 'pointer'
                              }}
                              onClick={() => toggleExpanded(notification.id)}
                            >
                              {notification.message}
                            </Typography>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.5 }}>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ fontSize: '0.7rem' }}
                              >
                                {formatTimeAgo(notification.timestamp)}
                              </Typography>
                              {notification.actionable && (
                                <Chip
                                  label="Action Required"
                                  size="small"
                                  color="warning"
                                  variant="filled"
                                  sx={{ fontSize: '0.6rem', height: 18 }}
                                />
                              )}
                            </Stack>
                          </Box>
                        }
                      />

                      <ListItemSecondaryAction>
                        <Stack direction="row" spacing={0.5}>
                          {!notification.read && (
                            <Tooltip title="Mark as read">
                              <IconButton
                                size="small"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="More actions">
                            <IconButton size="small">
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>

                    {/* Expanded Content */}
                    <Collapse in={expandedItems.has(notification.id)}>
                      <Box sx={{ pl: 5, pr: 2, pb: 1 }}>
                        {notification.actionable && (
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Button size="small" variant="contained" color="primary">
                              Take Action
                            </Button>
                            <Button size="small" variant="outlined">
                              Dismiss
                            </Button>
                          </Stack>
                        )}
                      </Box>
                    </Collapse>

                    {index < filteredNotifications.length - 1 && (
                      <Divider sx={{ my: 0.5, opacity: 0.5 }} />
                    )}
                  </Box>
                </Fade>
              ))}
            </List>
          )}
        </Box>

        {/* Settings Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem onClick={() => { setFilter('all'); setAnchorEl(null); }}>
            All Notifications
          </MenuItem>
          <MenuItem onClick={() => { setFilter('unread'); setAnchorEl(null); }}>
            Unread Only
          </MenuItem>
          <MenuItem onClick={() => { setFilter('high'); setAnchorEl(null); }}>
            High Priority
          </MenuItem>
          <MenuItem onClick={() => { setFilter('actionable'); setAnchorEl(null); }}>
            Action Required
          </MenuItem>
          <Divider />
          <MenuItem>
            <FormControlLabel
              control={
                <Switch
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  size="small"
                />
              }
              label="Sound Notifications"
            />
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
}