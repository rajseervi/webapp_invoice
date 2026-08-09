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
  Skeleton,
  Stack,
  Divider,
  Button,
  useTheme,
  alpha,
  Fade,
  Badge
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface ActivityItem {
  id: string;
  type: 'invoice' | 'payment' | 'order' | 'party' | 'product' | 'stock' | 'system';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  status?: 'success' | 'warning' | 'error' | 'info';
  metadata?: {
    invoiceNumber?: string;
    customerName?: string;
    productName?: string;
    quantity?: number;
  };
}

interface RecentActivitiesWidgetProps {
  limit?: number;
  showHeader?: boolean;
  compact?: boolean;
  refreshInterval?: number;
}

export default function RecentActivitiesWidget({
  limit = 10,
  showHeader = true,
  compact = false,
  refreshInterval = 30000 // 30 seconds
}: RecentActivitiesWidgetProps) {
  const theme = useTheme();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch activities from API
  const fetchActivities = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // For now, using mock data - replace with actual API call
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'invoice',
          title: 'New Invoice Created',
          description: 'Invoice #INV-2024-001 created for ABC Corp',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          amount: 25000,
          status: 'success',
          metadata: {
            invoiceNumber: 'INV-2024-001',
            customerName: 'ABC Corp'
          }
        },
        {
          id: '2',
          type: 'payment',
          title: 'Payment Received',
          description: 'Payment of ₹15,000 received from XYZ Ltd',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          amount: 15000,
          status: 'success',
          metadata: {
            customerName: 'XYZ Ltd'
          }
        },
        {
          id: '3',
          type: 'order',
          title: 'New Order Placed',
          description: 'Order #ORD-2024-045 for 50 units of Product A',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          status: 'info',
          metadata: {
            quantity: 50,
            productName: 'Product A'
          }
        },
        {
          id: '4',
          type: 'party',
          title: 'New Customer Added',
          description: 'New customer "Tech Solutions Pvt Ltd" added to system',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          status: 'info',
          metadata: {
            customerName: 'Tech Solutions Pvt Ltd'
          }
        },
        {
          id: '5',
          type: 'stock',
          title: 'Low Stock Alert',
          description: 'Product "Widget Pro" is running low (5 units remaining)',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          status: 'warning',
          metadata: {
            productName: 'Widget Pro',
            quantity: 5
          }
        },
        {
          id: '6',
          type: 'product',
          title: 'Product Updated',
          description: 'Price updated for "Premium Widget" from ₹500 to ₹550',
          timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          status: 'info',
          metadata: {
            productName: 'Premium Widget'
          }
        },
        {
          id: '7',
          type: 'system',
          title: 'Backup Completed',
          description: 'Daily system backup completed successfully',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          status: 'success'
        },
        {
          id: '8',
          type: 'invoice',
          title: 'Invoice Overdue',
          description: 'Invoice #INV-2024-002 is 3 days overdue',
          timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
          status: 'error',
          metadata: {
            invoiceNumber: 'INV-2024-002'
          }
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setActivities(mockActivities.slice(0, limit));
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    
    // Set up auto-refresh
    const interval = setInterval(() => {
      fetchActivities(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [limit, refreshInterval]);

  const getActivityIcon = (type: string, status?: string) => {
    const iconProps = { fontSize: 'small' as const };
    
    switch (type) {
      case 'invoice':
        return <ReceiptIcon {...iconProps} />;
      case 'payment':
        return <PaymentIcon {...iconProps} />;
      case 'order':
        return <ShoppingCartIcon {...iconProps} />;
      case 'party':
        return <PeopleIcon {...iconProps} />;
      case 'product':
        return <InventoryIcon {...iconProps} />;
      case 'stock':
        return status === 'warning' ? <WarningIcon {...iconProps} /> : <InventoryIcon {...iconProps} />;
      case 'system':
        return status === 'success' ? <CheckCircleIcon {...iconProps} /> : <InfoIcon {...iconProps} />;
      default:
        return <InfoIcon {...iconProps} />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return theme.palette.success.main;
      case 'warning': return theme.palette.warning.main;
      case 'error': return theme.palette.error.main;
      case 'info': return theme.palette.info.main;
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

  const formatAmount = (amount?: number) => {
    if (!amount) return null;
    return amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    });
  };

  const recentCount = useMemo(() => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return activities.filter(activity => 
      new Date(activity.timestamp).getTime() > fiveMinutesAgo
    ).length;
  }, [activities]);

  if (loading && activities.length === 0) {
    return (
      <Card sx={{ height: '100%' }}>
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
                  <Skeleton width="60%" />
                  <Skeleton width="40%" />
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
    <Card 
      sx={{ 
        height: '100%',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          boxShadow: theme.shadows[8],
        }
      }}
    >
      {showHeader && (
        <CardHeader
          avatar={
            <Avatar
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}
            >
              <TimelineIcon />
            </Avatar>
          }
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6" fontWeight={600}>
                Recent Activities
              </Typography>
              {recentCount > 0 && (
                <Badge badgeContent={recentCount} color="primary">
                  <Chip 
                    label="Live" 
                    size="small" 
                    color="success" 
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                </Badge>
              )}
            </Stack>
          }
          action={
            <Tooltip title="Refresh">
              <IconButton 
                onClick={() => fetchActivities(true)}
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
          }
        />
      )}
      
      <CardContent sx={{ pt: showHeader ? 0 : 2, pb: 2 }}>
        {activities.length === 0 ? (
          <Box 
            sx={{ 
              textAlign: 'center', 
              py: 4,
              color: 'text.secondary'
            }}
          >
            <TimelineIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="body2">
              No recent activities found
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {activities.map((activity, index) => (
              <Fade in key={activity.id} timeout={300 + index * 100}>
                <Box>
                  <ListItem
                    sx={{
                      px: 0,
                      py: compact ? 1 : 1.5,
                      borderRadius: 1,
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
                          backgroundColor: alpha(getStatusColor(activity.status), 0.1),
                          color: getStatusColor(activity.status),
                        }}
                      >
                        {getActivityIcon(activity.type, activity.status)}
                      </Avatar>
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Typography 
                          variant="body2" 
                          fontWeight={600}
                          sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {activity.title}
                        </Typography>
                      }
                      secondary={
                        <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span 
                            style={{ 
                              fontSize: '0.75rem',
                              color: 'rgba(0, 0, 0, 0.6)',
                              display: '-webkit-box',
                              WebkitLineClamp: compact ? 1 : 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {activity.description}
                          </span>
                          {activity.amount && (
                            <span 
                              style={{ 
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: '#2e7d32'
                              }}
                            >
                              {formatAmount(activity.amount)}
                            </span>
                          )}
                        </span>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ fontSize: '0.7rem' }}
                      >
                        {formatTimeAgo(activity.timestamp)}
                      </Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  {index < activities.length - 1 && (
                    <Divider sx={{ my: 0.5, opacity: 0.5 }} />
                  )}
                </Box>
              </Fade>
            ))}
          </List>
        )}
        
        {activities.length > 0 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button 
              size="small" 
              variant="outlined"
              onClick={() => {/* Navigate to full activities page */}}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '0.8rem'
              }}
            >
              View All Activities
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}