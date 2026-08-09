"use client";
import React, { memo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar,
  Chip,
  Box,
  useTheme,
  alpha,
  Skeleton,
  Grow
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';

interface QuickStatProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: number;
    label: string;
  };
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  delay?: number;
}

const QuickStatCard = memo(function QuickStatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  color,
  loading = false,
  delay = 0
}: QuickStatProps) {
  const theme = useTheme();

  if (loading) {
    return (
      <Card 
        sx={{ 
          height: '100%',
          background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
          border: `1px solid ${alpha(color, 0.1)}`,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Box>
              <Skeleton width={100} height={20} />
              <Skeleton width={80} height={32} sx={{ mt: 1 }} />
            </Box>
            <Skeleton variant="circular" width={56} height={56} />
          </Stack>
          <Skeleton width={120} height={24} />
        </CardContent>
      </Card>
    );
  }

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      }
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case 'up':
        return <TrendingUpIcon fontSize="small" color="success" />;
      case 'down':
        return <TrendingDownIcon fontSize="small" color="error" />;
      case 'neutral':
        return <RemoveIcon fontSize="small" color="disabled" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    if (!trend) return 'default';
    
    switch (trend.direction) {
      case 'up':
        return 'success';
      case 'down':
        return 'error';
      case 'neutral':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Grow in timeout={300 + delay}>
      <Card 
        sx={{ 
          height: '100%',
          background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
          transition: 'all 0.3s ease-in-out',
          border: `1px solid ${alpha(color, 0.1)}`,
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 32px ${alpha(color, 0.2)}`,
            borderColor: color,
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="overline" color="text.secondary" fontWeight={600}>
                {title}
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color }}>
                {formatValue(value)}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                backgroundColor: color,
                color: 'white',
              }}
            >
              {icon}
            </Avatar>
          </Stack>
          
          {trend && (
            <Stack direction="row" alignItems="center" spacing={1}>
              {getTrendIcon()}
              <Chip 
                label={`${trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}${trend.value}% ${trend.label}`} 
                size="small" 
                color={getTrendColor() as any}
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            </Stack>
          )}
        </CardContent>
      </Card>
    </Grow>
  );
});

interface QuickStatsWidgetProps {
  stats: {
    totalSales: number;
    totalInvoices: number;
    pendingPayments: number;
    totalParties: number;
    totalProducts: number;
    monthlyGrowth: number;
  } | null;
  loading?: boolean;
}

export default function QuickStatsWidget({ stats, loading = false }: QuickStatsWidgetProps) {
  const theme = useTheme();

  const statsConfig = [
    {
      title: 'Total Sales',
      value: stats?.totalSales ? `₹${(stats.totalSales / 100000).toFixed(1)}L` : '₹0',
      subtitle: 'This month',
      trend: {
        direction: 'up' as const,
        value: stats?.monthlyGrowth || 0,
        label: 'from last month'
      },
      icon: '💰',
      color: theme.palette.primary.main,
    },
    {
      title: 'Total Invoices',
      value: stats?.totalInvoices || 0,
      subtitle: 'Generated',
      trend: {
        direction: 'up' as const,
        value: 5,
        label: 'this week'
      },
      icon: '📄',
      color: theme.palette.success.main,
    },
    {
      title: 'Pending Payments',
      value: stats?.pendingPayments ? `₹${(stats.pendingPayments / 1000).toFixed(0)}K` : '₹0',
      subtitle: 'Outstanding',
      trend: {
        direction: 'down' as const,
        value: 8,
        label: 'from last week'
      },
      icon: '⏳',
      color: theme.palette.warning.main,
    },
    {
      title: 'Total Parties',
      value: stats?.totalParties || 0,
      subtitle: 'Active customers',
      trend: {
        direction: 'up' as const,
        value: 12,
        label: 'new this month'
      },
      icon: '👥',
      color: theme.palette.info.main,
    },
    {
      title: 'Total Products',
      value: stats?.totalProducts || 0,
      subtitle: 'In catalog',
      trend: {
        direction: 'neutral' as const,
        value: 0,
        label: 'no change'
      },
      icon: '📦',
      color: theme.palette.secondary.main,
    },
    {
      title: 'Conversion Rate',
      value: '3.2%',
      subtitle: 'Lead to sale',
      trend: {
        direction: 'up' as const,
        value: 0.5,
        label: 'improvement'
      },
      icon: '📈',
      color: '#FF6B35',
    },
  ];

  return (
    <>
      {statsConfig.map((stat, index) => (
        <QuickStatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          subtitle={stat.subtitle}
          trend={stat.trend}
          icon={stat.icon}
          color={stat.color}
          loading={loading}
          delay={index * 100}
        />
      ))}
    </>
  );
}