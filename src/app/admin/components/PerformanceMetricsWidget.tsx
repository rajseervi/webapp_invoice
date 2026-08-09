"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Stack,
  LinearProgress,
  Chip,
  Avatar,
  Grid,
  Tooltip,
  IconButton,
  useTheme,
  alpha,
  Skeleton
} from '@mui/material';
import {
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Timer as TimerIcon
} from '@mui/icons-material';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  target: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  icon: React.ReactNode;
}

interface PerformanceMetricsWidgetProps {
  showHeader?: boolean;
  compact?: boolean;
  refreshInterval?: number;
}

export default function PerformanceMetricsWidget({
  showHeader = true,
  compact = false,
  refreshInterval = 10000 // 10 seconds
}: PerformanceMetricsWidgetProps) {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Simulate API call - replace with actual performance monitoring API
      const mockMetrics: PerformanceMetric[] = [
        {
          id: 'response_time',
          name: 'Avg Response Time',
          value: 245,
          unit: 'ms',
          target: 300,
          trend: 'down',
          trendValue: 12,
          status: 'good',
          icon: <TimerIcon />
        },
        {
          id: 'cpu_usage',
          name: 'CPU Usage',
          value: 68,
          unit: '%',
          target: 80,
          trend: 'up',
          trendValue: 5,
          status: 'warning',
          icon: <SpeedIcon />
        },
        {
          id: 'memory_usage',
          name: 'Memory Usage',
          value: 42,
          unit: '%',
          target: 70,
          trend: 'stable',
          trendValue: 0,
          status: 'excellent',
          icon: <MemoryIcon />
        },
        {
          id: 'disk_usage',
          name: 'Disk Usage',
          value: 78,
          unit: '%',
          target: 85,
          trend: 'up',
          trendValue: 3,
          status: 'good',
          icon: <StorageIcon />
        },
        {
          id: 'network_latency',
          name: 'Network Latency',
          value: 23,
          unit: 'ms',
          target: 50,
          trend: 'down',
          trendValue: 8,
          status: 'excellent',
          icon: <NetworkIcon />
        },
        {
          id: 'throughput',
          name: 'Throughput',
          value: 1250,
          unit: 'req/min',
          target: 1000,
          trend: 'up',
          trendValue: 15,
          status: 'excellent',
          icon: <TimelineIcon />
        }
      ];

      // Add some randomness to simulate real-time data
      const updatedMetrics = mockMetrics.map(metric => ({
        ...metric,
        value: Math.max(0, metric.value + (Math.random() - 0.5) * 10),
        trendValue: Math.max(0, metric.trendValue + (Math.random() - 0.5) * 5)
      }));

      await new Promise(resolve => setTimeout(resolve, 300));
      setMetrics(updatedMetrics);
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
      setMetrics([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    const interval = setInterval(() => {
      fetchMetrics(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return theme.palette.success.main;
      case 'good': return theme.palette.info.main;
      case 'warning': return theme.palette.warning.main;
      case 'critical': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getProgressColor = (value: number, target: number, status: string) => {
    const percentage = (value / target) * 100;
    if (status === 'critical') return 'error';
    if (status === 'warning') return 'warning';
    if (percentage > 90) return 'success';
    return 'primary';
  };

  const overallHealth = useMemo(() => {
    if (metrics.length === 0) return 'unknown';
    
    const criticalCount = metrics.filter(m => m.status === 'critical').length;
    const warningCount = metrics.filter(m => m.status === 'warning').length;
    
    if (criticalCount > 0) return 'critical';
    if (warningCount > metrics.length / 2) return 'warning';
    if (warningCount > 0) return 'good';
    return 'excellent';
  }, [metrics]);

  if (loading && metrics.length === 0) {
    return (
      <Card sx={{ height: '100%' }}>
        {showHeader && (
          <CardHeader
            title={<Skeleton width={180} />}
            action={<Skeleton variant="circular" width={40} height={40} />}
          />
        )}
        <CardContent>
          <Grid container spacing={2}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                    <Skeleton variant="circular" width={32} height={32} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="70%" />
                      <Skeleton width="40%" />
                    </Box>
                  </Stack>
                  <Skeleton variant="rectangular" height={6} sx={{ borderRadius: 1 }} />
                </Box>
              </Grid>
            ))}
          </Grid>
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
                backgroundColor: alpha(getStatusColor(overallHealth), 0.1),
                color: getStatusColor(overallHealth),
              }}
            >
              <SpeedIcon />
            </Avatar>
          }
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6" fontWeight={600}>
                System Performance
              </Typography>
              <Chip 
                label={overallHealth.charAt(0).toUpperCase() + overallHealth.slice(1)} 
                size="small" 
                color={
                  overallHealth === 'excellent' ? 'success' :
                  overallHealth === 'good' ? 'info' :
                  overallHealth === 'warning' ? 'warning' : 'error'
                }
                variant="outlined"
              />
            </Stack>
          }
          action={
            <Tooltip title="Refresh">
              <IconButton 
                onClick={() => fetchMetrics(true)}
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
      
      <CardContent sx={{ pt: showHeader ? 0 : 2 }}>
        {metrics.length === 0 ? (
          <Box 
            sx={{ 
              textAlign: 'center', 
              py: 4,
              color: 'text.secondary'
            }}
          >
            <SpeedIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="body2">
              No performance data available
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={compact ? 1 : 2}>
            {metrics.map((metric) => (
              <Grid item xs={12} sm={6} key={metric.id}>
                <Box
                  sx={{
                    p: compact ? 1.5 : 2,
                    border: 1,
                    borderColor: alpha(getStatusColor(metric.status), 0.2),
                    borderRadius: 2,
                    backgroundColor: alpha(getStatusColor(metric.status), 0.02),
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: getStatusColor(metric.status),
                      backgroundColor: alpha(getStatusColor(metric.status), 0.05),
                    }
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: alpha(getStatusColor(metric.status), 0.1),
                        color: getStatusColor(metric.status),
                      }}
                    >
                      {metric.icon}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body2" 
                        fontWeight={600}
                        sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {metric.name}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="h6" fontWeight={700}>
                          {metric.value.toFixed(metric.unit === 'ms' ? 0 : 1)}
                          <Typography component="span" variant="caption" color="text.secondary">
                            {metric.unit}
                          </Typography>
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          {metric.trend === 'up' ? (
                            <TrendingUpIcon 
                              fontSize="small" 
                              color={metric.status === 'critical' || metric.status === 'warning' ? 'error' : 'success'} 
                            />
                          ) : metric.trend === 'down' ? (
                            <TrendingDownIcon 
                              fontSize="small" 
                              color="success" 
                            />
                          ) : null}
                          {metric.trend !== 'stable' && (
                            <Typography 
                              variant="caption" 
                              color={
                                metric.trend === 'up' && (metric.status === 'critical' || metric.status === 'warning') 
                                  ? 'error.main' 
                                  : 'success.main'
                              }
                              fontWeight={600}
                            >
                              {metric.trendValue.toFixed(1)}%
                            </Typography>
                          )}
                        </Stack>
                      </Stack>
                    </Box>
                  </Stack>
                  
                  <Box sx={{ mb: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((metric.value / metric.target) * 100, 100)}
                      color={getProgressColor(metric.value, metric.target, metric.status)}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: alpha(getStatusColor(metric.status), 0.1),
                      }}
                    />
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary">
                    Target: {metric.target}{metric.unit}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}