"use client";

import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  useTheme,
  alpha,
  Divider,
  IconButton
} from '@mui/material';
import {
  ShoppingCart,
  Inventory,
  Notifications,
  CheckCircle,
  Warning,
  Info,
  Error,
  Refresh
} from '@mui/icons-material';
import { WidgetConfig } from '@/types/dashboard';
import BaseWidget from './BaseWidget';

interface ContentWidgetProps {
  widget: WidgetConfig;
  onConfigure?: (widget: WidgetConfig) => void;
  onDelete?: (widgetId: string) => void;
  onDuplicate?: (widget: WidgetConfig) => void;
  isSelected?: boolean;
  onSelect?: (widgetId: string) => void;
}

// Sample data
const sampleOrders = [
  { id: 'ORD-001', customer: 'John Doe', amount: '₹1,250', status: 'completed', time: '2 min ago' },
  { id: 'ORD-002', customer: 'Jane Smith', amount: '₹890', status: 'pending', time: '5 min ago' },
  { id: 'ORD-003', customer: 'Bob Johnson', amount: '₹2,100', status: 'processing', time: '10 min ago' },
  { id: 'ORD-004', customer: 'Alice Brown', amount: '₹750', status: 'completed', time: '15 min ago' },
];

const sampleProducts = [
  { name: 'iPhone 14 Pro', sales: 45, revenue: '₹67,500', trend: 'up' },
  { name: 'Samsung Galaxy S23', sales: 32, revenue: '₹48,000', trend: 'up' },
  { name: 'MacBook Air M2', sales: 18, revenue: '₹1,35,000', trend: 'down' },
  { name: 'iPad Pro', sales: 25, revenue: '₹75,000', trend: 'stable' },
];

const sampleNotifications = [
  { type: 'success', title: 'Order Completed', message: 'Order #ORD-001 has been delivered', time: '5 min ago' },
  { type: 'warning', title: 'Low Stock Alert', message: 'iPhone 14 Pro stock is running low', time: '10 min ago' },
  { type: 'info', title: 'New Customer', message: 'Alice Brown registered as new customer', time: '15 min ago' },
  { type: 'error', title: 'Payment Failed', message: 'Payment for Order #ORD-005 failed', time: '20 min ago' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'processing':
      return 'info';
    default:
      return 'default';
  }
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircle color="success" />;
    case 'warning':
      return <Warning color="warning" />;
    case 'info':
      return <Info color="info" />;
    case 'error':
      return <Error color="error" />;
    default:
      return <Info />;
  }
};

export default function ContentWidget({
  widget,
  onConfigure,
  onDelete,
  onDuplicate,
  isSelected,
  onSelect
}: ContentWidgetProps) {
  const theme = useTheme();
  
  const config = {
    title: 'Content',
    showRefresh: true,
    maxItems: 5,
    ...widget.config
  };

  const renderContent = () => {
    switch (widget.type) {
      case 'recent-orders':
        return (
          <List sx={{ p: 0 }}>
            {sampleOrders.slice(0, config.maxItems).map((order, index) => (
              <React.Fragment key={order.id}>
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                      <ShoppingCart />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {order.id}
                        </Typography>
                        <Chip 
                          label={order.status} 
                          size="small" 
                          color={getStatusColor(order.status) as any}
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {order.customer}
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {order.amount}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < sampleOrders.slice(0, config.maxItems).length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        );

      case 'top-products':
        return (
          <List sx={{ p: 0 }}>
            {sampleProducts.slice(0, config.maxItems).map((product, index) => (
              <React.Fragment key={product.name}>
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main' }}>
                      <Inventory />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" fontWeight={600}>
                        {product.name}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {product.sales} sales
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {product.revenue}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < sampleProducts.slice(0, config.maxItems).length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        );

      case 'notifications':
        return (
          <List sx={{ p: 0 }}>
            {sampleNotifications.slice(0, config.maxItems).map((notification, index) => (
              <React.Fragment key={index}>
                <ListItem sx={{ px: 0, py: 1, alignItems: 'flex-start' }}>
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'transparent' }}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" fontWeight={600}>
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          {notification.time}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < sampleNotifications.slice(0, config.maxItems).length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        );

      default:
        return (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: 'text.secondary'
          }}>
            <Typography>No content available</Typography>
          </Box>
        );
    }
  };

  return (
    <BaseWidget
      widget={widget}
      onConfigure={onConfigure}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      isSelected={isSelected}
      onSelect={onSelect}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              fontSize: widget.position.height < 250 ? '1rem' : '1.25rem'
            }}
          >
            {config.title}
          </Typography>
          {config.showRefresh && (
            <IconButton size="small" sx={{ color: 'text.secondary' }}>
              <Refresh fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {renderContent()}
        </Box>
      </Box>
    </BaseWidget>
  );
}