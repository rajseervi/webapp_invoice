"use client";
import React from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Stack, Chip } from '@mui/material';
import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Speed as SpeedIcon,
  MonetizationOn as MoneyIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

// Props expected by ImprovedInventoryManager usage
export interface ImprovedInventoryDashboardProps {
  onStatsUpdate?: () => void;
  viewMode?: 'grid' | 'list' | string;
  stats: {
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalValue: number;
    pendingPurchases: number;
    pendingSales: number;
    recentMovements: number;
    criticalAlerts: number;
    monthlyGrowth: number;
    profitMargin: number;
    turnoverRate: number;
  };
}

const StatCard = ({
  title,
  value,
  icon,
  color = 'primary',
  trend,
}: {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  trend?: number;
}) => (
  <Card>
    <CardContent>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center">
          {icon}
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Stack>
        {typeof trend === 'number' && (
          <Chip
            size="small"
            icon={trend >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
            label={`${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`}
            color={trend >= 0 ? 'success' : 'error'}
            variant="outlined"
          />
        )}
      </Stack>
      <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }} color={`${color}.main`}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

export default function ImprovedInventoryDashboard({ onStatsUpdate, stats, viewMode }: ImprovedInventoryDashboardProps) {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          Overview
        </Typography>
        {onStatsUpdate && (
          <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={onStatsUpdate}>
            Refresh
          </Button>
        )}
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard title="Total Products" value={stats.totalProducts.toLocaleString()} icon={<InventoryIcon color="primary" />} color="primary" trend={stats.monthlyGrowth} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard title="Active Products" value={stats.activeProducts.toLocaleString()} icon={<CheckCircleIcon color="success" />} color="success" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard title="Low Stock" value={stats.lowStockProducts.toLocaleString()} icon={<WarningIcon color="warning" />} color="warning" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard title="Out of Stock" value={stats.outOfStockProducts.toLocaleString()} icon={<TrendingDownIcon color="error" />} color="error" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard title="Total Value" value={`₹${(stats.totalValue / 100000).toFixed(1)}L`} icon={<MoneyIcon color="info" />} color="info" trend={stats.profitMargin} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard title="Turnover Rate" value={`${stats.turnoverRate.toFixed(1)}x`} icon={<SpeedIcon color="secondary" />} color="secondary" />
        </Grid>
      </Grid>

      {/* Basic placeholder for view mode to avoid type errors */}
      {viewMode && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          View mode: {String(viewMode)}
        </Typography>
      )}
    </Box>
  );
}
