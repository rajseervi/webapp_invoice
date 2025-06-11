"use client";

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Chip,
  Avatar,
  Tooltip,
  LinearProgress,
  Card,
  CardContent,
  Grid,
  Divider
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  LocalShipping as LocalShippingIcon,
  Inventory as InventoryIcon,
  Assignment as AssignmentIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  ThumbUp as ThumbUpIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { OrderStatus, OrderStatusHistory, Order } from '@/types/order';
import { formatDateTime } from '@/utils/dateUtils';

interface OrderStatusTimelineProps {
  order: Order;
  showProgress?: boolean;
  compact?: boolean;
}

const statusConfig = {
  [OrderStatus.DRAFT]: {
    icon: AssignmentIcon,
    color: 'grey',
    label: 'Draft',
    description: 'Order is being prepared'
  },
  [OrderStatus.PENDING_APPROVAL]: {
    icon: ThumbUpIcon,
    color: 'warning',
    label: 'Pending Approval',
    description: 'Waiting for approval'
  },
  [OrderStatus.APPROVED]: {
    icon: CheckCircleIcon,
    color: 'success',
    label: 'Approved',
    description: 'Order has been approved'
  },
  [OrderStatus.PENDING]: {
    icon: ScheduleIcon,
    color: 'info',
    label: 'Pending',
    description: 'Order received and pending processing'
  },
  [OrderStatus.CONFIRMED]: {
    icon: CheckCircleIcon,
    color: 'primary',
    label: 'Confirmed',
    description: 'Order confirmed and ready for processing'
  },
  [OrderStatus.PROCESSING]: {
    icon: RefreshIcon,
    color: 'info',
    label: 'Processing',
    description: 'Order is being processed'
  },
  [OrderStatus.PICKING]: {
    icon: InventoryIcon,
    color: 'info',
    label: 'Picking',
    description: 'Items are being picked from inventory'
  },
  [OrderStatus.PACKED]: {
    icon: AssignmentIcon,
    color: 'primary',
    label: 'Packed',
    description: 'Order has been packed and ready to ship'
  },
  [OrderStatus.SHIPPED]: {
    icon: LocalShippingIcon,
    color: 'primary',
    label: 'Shipped',
    description: 'Order has been shipped'
  },
  [OrderStatus.OUT_FOR_DELIVERY]: {
    icon: LocalShippingIcon,
    color: 'warning',
    label: 'Out for Delivery',
    description: 'Order is out for delivery'
  },
  [OrderStatus.DELIVERED]: {
    icon: CheckCircleIcon,
    color: 'success',
    label: 'Delivered',
    description: 'Order has been delivered'
  },
  [OrderStatus.COMPLETED]: {
    icon: CheckCircleIcon,
    color: 'success',
    label: 'Completed',
    description: 'Order completed successfully'
  },
  [OrderStatus.CANCELLED]: {
    icon: CancelIcon,
    color: 'error',
    label: 'Cancelled',
    description: 'Order has been cancelled'
  },
  [OrderStatus.RETURNED]: {
    icon: RefreshIcon,
    color: 'warning',
    label: 'Returned',
    description: 'Order has been returned'
  },
  [OrderStatus.REFUNDED]: {
    icon: PaymentIcon,
    color: 'info',
    label: 'Refunded',
    description: 'Order has been refunded'
  }
};

const statusOrder = [
  OrderStatus.DRAFT,
  OrderStatus.PENDING_APPROVAL,
  OrderStatus.APPROVED,
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.PICKING,
  OrderStatus.PACKED,
  OrderStatus.SHIPPED,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
  OrderStatus.COMPLETED
];

export default function OrderStatusTimeline({ 
  order, 
  showProgress = true, 
  compact = false 
}: OrderStatusTimelineProps) {
  const currentStatusIndex = statusOrder.indexOf(order.status);
  const progressPercentage = currentStatusIndex >= 0 
    ? ((currentStatusIndex + 1) / statusOrder.length) * 100 
    : 0;

  const getStatusIcon = (status: OrderStatus, isActive: boolean, isCompleted: boolean) => {
    const config = statusConfig[status];
    const IconComponent = config.icon;
    
    return (
      <TimelineDot 
        color={isCompleted ? 'success' : isActive ? config.color as any : 'grey'}
        variant={isCompleted || isActive ? 'filled' : 'outlined'}
        sx={{ 
          p: 1,
          border: isActive ? 2 : 1,
          borderColor: isActive ? `${config.color}.main` : 'divider'
        }}
      >
        <IconComponent fontSize="small" />
      </TimelineDot>
    );
  };

  const isStatusCompleted = (status: OrderStatus) => {
    const statusIndex = statusOrder.indexOf(status);
    return statusIndex >= 0 && statusIndex < currentStatusIndex;
  };

  const isStatusActive = (status: OrderStatus) => {
    return status === order.status;
  };

  if (compact) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1 }}>
              Order Status
            </Typography>
            <Chip 
              label={statusConfig[order.status].label}
              color={statusConfig[order.status].color as any}
              size="small"
            />
          </Box>
          
          {showProgress && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(progressPercentage)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progressPercentage}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}
          
          <Typography variant="body2" color="text.secondary">
            {statusConfig[order.status].description}
          </Typography>
          
          {order.statusHistory && order.statusHistory.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Last updated: {formatDateTime(order.statusHistory[order.statusHistory.length - 1].timestamp)}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          Order Status Timeline
        </Typography>
        <Chip 
          label={statusConfig[order.status].label}
          color={statusConfig[order.status].color as any}
          size="medium"
        />
      </Box>

      {showProgress && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Order Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(progressPercentage)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progressPercentage}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>
      )}

      <Timeline position="left">
        {order.statusHistory && order.statusHistory.length > 0 ? (
          // Show actual status history
          order.statusHistory.map((historyItem, index) => {
            const config = statusConfig[historyItem.status];
            const isLast = index === order.statusHistory!.length - 1;
            
            return (
              <TimelineItem key={index}>
                <TimelineOppositeContent sx={{ flex: 0.3 }}>
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTime(historyItem.timestamp)}
                  </Typography>
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot 
                    color={config.color as any}
                    variant="filled"
                    sx={{ p: 1 }}
                  >
                    <config.icon fontSize="small" />
                  </TimelineDot>
                  {!isLast && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="subtitle2" fontWeight="medium">
                    {config.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {historyItem.notes || config.description}
                  </Typography>
                  {historyItem.updatedBy && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        Updated by {historyItem.updatedBy}
                      </Typography>
                    </Box>
                  )}
                </TimelineContent>
              </TimelineItem>
            );
          })
        ) : (
          // Show expected status flow
          statusOrder.map((status, index) => {
            const config = statusConfig[status];
            const isCompleted = isStatusCompleted(status);
            const isActive = isStatusActive(status);
            const isLast = index === statusOrder.length - 1;
            
            // Skip statuses that don't apply to this order
            if (order.status === OrderStatus.CANCELLED && 
                ![OrderStatus.DRAFT, OrderStatus.PENDING, OrderStatus.CANCELLED].includes(status)) {
              return null;
            }
            
            if (order.status === OrderStatus.RETURNED && 
                ![OrderStatus.DRAFT, OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.RETURNED].includes(status)) {
              return null;
            }

            return (
              <TimelineItem key={status}>
                <TimelineOppositeContent sx={{ flex: 0.3 }}>
                  {isActive && (
                    <Typography variant="caption" color="primary.main" fontWeight="medium">
                      Current Status
                    </Typography>
                  )}
                  {isCompleted && (
                    <Typography variant="caption" color="success.main">
                      Completed
                    </Typography>
                  )}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  {getStatusIcon(status, isActive, isCompleted)}
                  {!isLast && (
                    <TimelineConnector 
                      sx={{ 
                        bgcolor: isCompleted ? 'success.main' : 'grey.300',
                        opacity: isCompleted ? 1 : 0.3
                      }} 
                    />
                  )}
                </TimelineSeparator>
                <TimelineContent>
                  <Typography 
                    variant="subtitle2" 
                    fontWeight={isActive ? 'bold' : 'medium'}
                    color={isActive ? 'primary.main' : isCompleted ? 'success.main' : 'text.primary'}
                  >
                    {config.label}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ opacity: isCompleted || isActive ? 1 : 0.6 }}
                  >
                    {config.description}
                  </Typography>
                  
                  {isActive && order.trackingNumber && (
                    <Box sx={{ mt: 1 }}>
                      <Chip 
                        label={`Tracking: ${order.trackingNumber}`}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    </Box>
                  )}
                  
                  {isActive && order.estimatedDelivery && (
                    <Typography variant="caption" color="primary.main" sx={{ mt: 1, display: 'block' }}>
                      Estimated delivery: {formatDateTime(order.estimatedDelivery)}
                    </Typography>
                  )}
                </TimelineContent>
              </TimelineItem>
            );
          }).filter(Boolean)
        )}
      </Timeline>

      {/* Additional Information */}
      {(order.trackingNumber || order.estimatedDelivery) && (
        <>
          <Divider sx={{ my: 3 }} />
          <Grid container spacing={2}>
            {order.trackingNumber && (
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocalShippingIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Tracking Number
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {order.trackingNumber}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
            
            {order.estimatedDelivery && (
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Estimated Delivery
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatDateTime(order.estimatedDelivery)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </Paper>
  );
}"use client";

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Chip,
  Avatar,
  Tooltip,
  LinearProgress,
  Card,
  CardContent,
  Grid,
  Divider
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  LocalShipping as LocalShippingIcon,
  Inventory as InventoryIcon,
  Assignment as AssignmentIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  ThumbUp as ThumbUpIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { OrderStatus, OrderStatusHistory, Order } from '@/types/order';
import { formatDateTime } from '@/utils/dateUtils';

interface OrderStatusTimelineProps {
  order: Order;
  showProgress?: boolean;
  compact?: boolean;
}

const statusConfig = {
  [OrderStatus.DRAFT]: {
    icon: AssignmentIcon,
    color: 'grey',
    label: 'Draft',
    description: 'Order is being prepared'
  },
  [OrderStatus.PENDING_APPROVAL]: {
    icon: ThumbUpIcon,
    color: 'warning',
    label: 'Pending Approval',
    description: 'Waiting for approval'
  },
  [OrderStatus.APPROVED]: {
    icon: CheckCircleIcon,
    color: 'success',
    label: 'Approved',
    description: 'Order has been approved'
  },
  [OrderStatus.PENDING]: {
    icon: ScheduleIcon,
    color: 'info',
    label: 'Pending',
    description: 'Order received and pending processing'
  },
  [OrderStatus.CONFIRMED]: {
    icon: CheckCircleIcon,
    color: 'primary',
    label: 'Confirmed',
    description: 'Order confirmed and ready for processing'
  },
  [OrderStatus.PROCESSING]: {
    icon: RefreshIcon,
    color: 'info',
    label: 'Processing',
    description: 'Order is being processed'
  },
  [OrderStatus.PICKING]: {
    icon: InventoryIcon,
    color: 'info',
    label: 'Picking',
    description: 'Items are being picked from inventory'
  },
  [OrderStatus.PACKED]: {
    icon: AssignmentIcon,
    color: 'primary',
    label: 'Packed',
    description: 'Order has been packed and ready to ship'
  },
  [OrderStatus.SHIPPED]: {
    icon: LocalShippingIcon,
    color: 'primary',
    label: 'Shipped',
    description: 'Order has been shipped'
  },
  [OrderStatus.OUT_FOR_DELIVERY]: {
    icon: LocalShippingIcon,
    color: 'warning',
    label: 'Out for Delivery',
    description: 'Order is out for delivery'
  },
  [OrderStatus.DELIVERED]: {
    icon: CheckCircleIcon,
    color: 'success',
    label: 'Delivered',
    description: 'Order has been delivered'
  },
  [OrderStatus.COMPLETED]: {
    icon: CheckCircleIcon,
    color: 'success',
    label: 'Completed',
    description: 'Order completed successfully'
  },
  [OrderStatus.CANCELLED]: {
    icon: CancelIcon,
    color: 'error',
    label: 'Cancelled',
    description: 'Order has been cancelled'
  },
  [OrderStatus.RETURNED]: {
    icon: RefreshIcon,
    color: 'warning',
    label: 'Returned',
    description: 'Order has been returned'
  },
  [OrderStatus.REFUNDED]: {
    icon: PaymentIcon,
    color: 'info',
    label: 'Refunded',
    description: 'Order has been refunded'
  }
};

const statusOrder = [
  OrderStatus.DRAFT,
  OrderStatus.PENDING_APPROVAL,
  OrderStatus.APPROVED,
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.PICKING,
  OrderStatus.PACKED,
  OrderStatus.SHIPPED,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
  OrderStatus.COMPLETED
];

export default function OrderStatusTimeline({ 
  order, 
  showProgress = true, 
  compact = false 
}: OrderStatusTimelineProps) {
  const currentStatusIndex = statusOrder.indexOf(order.status);
  const progressPercentage = currentStatusIndex >= 0 
    ? ((currentStatusIndex + 1) / statusOrder.length) * 100 
    : 0;

  const getStatusIcon = (status: OrderStatus, isActive: boolean, isCompleted: boolean) => {
    const config = statusConfig[status];
    const IconComponent = config.icon;
    
    return (
      <TimelineDot 
        color={isCompleted ? 'success' : isActive ? config.color as any : 'grey'}
        variant={isCompleted || isActive ? 'filled' : 'outlined'}
        sx={{ 
          p: 1,
          border: isActive ? 2 : 1,
          borderColor: isActive ? `${config.color}.main` : 'divider'
        }}
      >
        <IconComponent fontSize="small" />
      </TimelineDot>
    );
  };

  const isStatusCompleted = (status: OrderStatus) => {
    const statusIndex = statusOrder.indexOf(status);
    return statusIndex >= 0 && statusIndex < currentStatusIndex;
  };

  const isStatusActive = (status: OrderStatus) => {
    return status === order.status;
  };

  if (compact) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1 }}>
              Order Status
            </Typography>
            <Chip 
              label={statusConfig[order.status].label}
              color={statusConfig[order.status].color as any}
              size="small"
            />
          </Box>
          
          {showProgress && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(progressPercentage)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progressPercentage}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}
          
          <Typography variant="body2" color="text.secondary">
            {statusConfig[order.status].description}
          </Typography>
          
          {order.statusHistory && order.statusHistory.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Last updated: {formatDateTime(order.statusHistory[order.statusHistory.length - 1].timestamp)}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          Order Status Timeline
        </Typography>
        <Chip 
          label={statusConfig[order.status].label}
          color={statusConfig[order.status].color as any}
          size="medium"
        />
      </Box>

      {showProgress && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Order Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(progressPercentage)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progressPercentage}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>
      )}

      <Timeline position="left">
        {order.statusHistory && order.statusHistory.length > 0 ? (
          // Show actual status history
          order.statusHistory.map((historyItem, index) => {
            const config = statusConfig[historyItem.status];
            const isLast = index === order.statusHistory!.length - 1;
            
            return (
              <TimelineItem key={index}>
                <TimelineOppositeContent sx={{ flex: 0.3 }}>
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTime(historyItem.timestamp)}
                  </Typography>
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot 
                    color={config.color as any}
                    variant="filled"
                    sx={{ p: 1 }}
                  >
                    <config.icon fontSize="small" />
                  </TimelineDot>
                  {!isLast && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="subtitle2" fontWeight="medium">
                    {config.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {historyItem.notes || config.description}
                  </Typography>
                  {historyItem.updatedBy && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        Updated by {historyItem.updatedBy}
                      </Typography>
                    </Box>
                  )}
                </TimelineContent>
              </TimelineItem>
            );
          })
        ) : (
          // Show expected status flow
          statusOrder.map((status, index) => {
            const config = statusConfig[status];
            const isCompleted = isStatusCompleted(status);
            const isActive = isStatusActive(status);
            const isLast = index === statusOrder.length - 1;
            
            // Skip statuses that don't apply to this order
            if (order.status === OrderStatus.CANCELLED && 
                ![OrderStatus.DRAFT, OrderStatus.PENDING, OrderStatus.CANCELLED].includes(status)) {
              return null;
            }
            
            if (order.status === OrderStatus.RETURNED && 
                ![OrderStatus.DRAFT, OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.RETURNED].includes(status)) {
              return null;
            }

            return (
              <TimelineItem key={status}>
                <TimelineOppositeContent sx={{ flex: 0.3 }}>
                  {isActive && (
                    <Typography variant="caption" color="primary.main" fontWeight="medium">
                      Current Status
                    </Typography>
                  )}
                  {isCompleted && (
                    <Typography variant="caption" color="success.main">
                      Completed
                    </Typography>
                  )}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  {getStatusIcon(status, isActive, isCompleted)}
                  {!isLast && (
                    <TimelineConnector 
                      sx={{ 
                        bgcolor: isCompleted ? 'success.main' : 'grey.300',
                        opacity: isCompleted ? 1 : 0.3
                      }} 
                    />
                  )}
                </TimelineSeparator>
                <TimelineContent>
                  <Typography 
                    variant="subtitle2" 
                    fontWeight={isActive ? 'bold' : 'medium'}
                    color={isActive ? 'primary.main' : isCompleted ? 'success.main' : 'text.primary'}
                  >
                    {config.label}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ opacity: isCompleted || isActive ? 1 : 0.6 }}
                  >
                    {config.description}
                  </Typography>
                  
                  {isActive && order.trackingNumber && (
                    <Box sx={{ mt: 1 }}>
                      <Chip 
                        label={`Tracking: ${order.trackingNumber}`}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    </Box>
                  )}
                  
                  {isActive && order.estimatedDelivery && (
                    <Typography variant="caption" color="primary.main" sx={{ mt: 1, display: 'block' }}>
                      Estimated delivery: {formatDateTime(order.estimatedDelivery)}
                    </Typography>
                  )}
                </TimelineContent>
              </TimelineItem>
            );
          }).filter(Boolean)
        )}
      </Timeline>

      {/* Additional Information */}
      {(order.trackingNumber || order.estimatedDelivery) && (
        <>
          <Divider sx={{ my: 3 }} />
          <Grid container spacing={2}>
            {order.trackingNumber && (
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocalShippingIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Tracking Number
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {order.trackingNumber}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
            
            {order.estimatedDelivery && (
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Estimated Delivery
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatDateTime(order.estimatedDelivery)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </Paper>
  );
}