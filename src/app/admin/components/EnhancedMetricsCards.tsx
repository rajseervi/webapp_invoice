'use client';

import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  useTheme,
  alpha,
  Grow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider
} from '@mui/material';

import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  Timeline as TimelineIcon,
  Target as TargetIcon,
  Info as InfoIcon,
  MonetizationOn as MonetizationIcon,
  Receipt as ReceiptIcon,
  PendingActions as PendingIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as AttachMoneyIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

import { Line, Bar } from 'react-chartjs-2';

// Enhanced Metric Card Interface
interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: string;
  description?: string;
  target?: number;
  unit?: string;
  trend?: number[];
  period?: string;
  category?: 'financial' | 'operational' | 'customer' | 'inventory';
  priority?: 'high' | 'medium' | 'low';
  actionable?: boolean;
  benchmark?: number;
  forecast?: number;
}

interface EnhancedMetricsCardsProps {
  metrics: MetricCard[];
  loading?: boolean;
  onCardClick?: (metric: MetricCard) => void;
  onRefresh?: () => void;
  showTrends?: boolean;
  showTargets?: boolean;
  showComparisons?: boolean;
  layout?: 'grid' | 'list';
  columns?: 2 | 3 | 4 | 6;
}

export const EnhancedMetricsCards: React.FC<EnhancedMetricsCardsProps> = ({
  metrics,
  loading = false,
  onCardClick,
  onRefresh,
  showTrends = true,
  showTargets = true,
  showComparisons = true,
  layout = 'grid',
  columns = 4
}) => {
  const theme = useTheme();
  const [selectedMetric, setSelectedMetric] = useState<MetricCard | null>(null);
  const [anchorEl, setAnchorEl] = useState<{ [key: string]: HTMLElement | null }>({});
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, metricId: string) => {
    event.stopPropagation();
    setAnchorEl(prev => ({ ...prev, [metricId]: event.currentTarget }));
  };

  const handleMenuClose = (metricId: string) => {
    setAnchorEl(prev => ({ ...prev, [metricId]: null }));
  };

  const handleCardClick = (metric: MetricCard) => {
    setSelectedMetric(metric);
    if (onCardClick) {
      onCardClick(metric);
    } else {
      setDetailsOpen(true);
    }
  };

  const handleViewDetails = (metric: MetricCard) => {
    setSelectedMetric(metric);
    setDetailsOpen(true);
    handleMenuClose(metric.id);
  };

  const getProgressValue = (metric: MetricCard): number => {
    if (!metric.target) return 0;
    const numericValue = typeof metric.value === 'string' 
      ? parseFloat(metric.value.replace(/[^\d.-]/g, '')) 
      : metric.value;
    return Math.min((numericValue / metric.target) * 100, 100);
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase': return <TrendingUpIcon fontSize="small" />;
      case 'decrease': return <TrendingDownIcon fontSize="small" />;
      default: return null;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'increase': return theme.palette.success.main;
      case 'decrease': return theme.palette.error.main;
      default: return theme.palette.text.secondary;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return theme.palette.error.main;
      case 'medium': return theme.palette.warning.main;
      case 'low': return theme.palette.success.main;
      default: return theme.palette.primary.main;
    }
  };

  const generateTrendChart = (trend: number[], color: string) => ({
    labels: trend.map((_, index) => `${index + 1}`),
    datasets: [{
      data: trend,
      borderColor: color,
      backgroundColor: alpha(color, 0.1),
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4
    }]
  });

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    },
    elements: {
      point: { radius: 0 }
    }
  };

  const gridColumns = 12 / columns;

  return (
    <>
      <Grid container spacing={3}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={gridColumns} key={metric.id}>
            <Grow in timeout={600 + index * 100}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'visible',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    '& .metric-actions': {
                      opacity: 1
                    }
                  }
                }}
                onClick={() => handleCardClick(metric)}
              >
                {/* Priority Indicator */}
                {metric.priority && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 4,
                      height: '100%',
                      backgroundColor: getPriorityColor(metric.priority),
                      borderRadius: '4px 0 0 4px'
                    }}
                  />
                )}

                <CardContent sx={{ pb: 2, position: 'relative' }}>
                  {/* Header */}
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar
                        sx={{
                          backgroundColor: alpha(metric.color, 0.1),
                          color: metric.color,
                          width: 48,
                          height: 48
                        }}
                      >
                        {metric.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {metric.title}
                        </Typography>
                        {metric.category && (
                          <Chip
                            size="small"
                            label={metric.category}
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    </Stack>
                    
                    {/* Actions */}
                    <Box className="metric-actions" sx={{ opacity: 0, transition: 'opacity 0.2s' }}>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, metric.id)}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Stack>

                  {/* Value and Change */}
                  <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography variant="h4" fontWeight={700} color={metric.color}>
                      {metric.value}
                      {metric.unit && (
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                          {metric.unit}
                        </Typography>
                      )}
                    </Typography>
                    
                    <Chip
                      size="small"
                      label={`${metric.change > 0 ? '+' : ''}${metric.change}%`}
                      color={metric.changeType === 'increase' ? 'success' : metric.changeType === 'decrease' ? 'error' : 'default'}
                      icon={getChangeIcon(metric.changeType)}
                      sx={{ fontWeight: 600 }}
                    />
                  </Stack>

                  {/* Description */}
                  {metric.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {metric.description}
                    </Typography>
                  )}

                  {/* Target Progress */}
                  {showTargets && metric.target && (
                    <Box sx={{ mb: 2 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Target Progress
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>
                          {getProgressValue(metric).toFixed(1)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={getProgressValue(metric)}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: alpha(metric.color, 0.1),
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: metric.color,
                            borderRadius: 3
                          }
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        Target: {metric.target} {metric.unit || ''}
                      </Typography>
                    </Box>
                  )}

                  {/* Trend Chart */}
                  {showTrends && metric.trend && metric.trend.length > 0 && (
                    <Box sx={{ height: 60, mt: 2 }}>
                      <Line
                        data={generateTrendChart(metric.trend, metric.color)}
                        options={trendChartOptions}
                      />
                    </Box>
                  )}

                  {/* Benchmark Comparison */}
                  {showComparisons && metric.benchmark && (
                    <Box sx={{ mt: 2, p: 1, backgroundColor: alpha(metric.color, 0.05), borderRadius: 1 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">
                          vs Benchmark
                        </Typography>
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          color={Number(metric.value) > metric.benchmark ? 'success.main' : 'error.main'}
                        >
                          {Number(metric.value) > metric.benchmark ? '+' : ''}
                          {((Number(metric.value) - metric.benchmark) / metric.benchmark * 100).toFixed(1)}%
                        </Typography>
                      </Stack>
                    </Box>
                  )}

                  {/* Actionable Indicator */}
                  {metric.actionable && (
                    <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                      <Tooltip title="Action Required">
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: theme.palette.warning.main,
                            animation: 'pulse 2s infinite'
                          }}
                        />
                      </Tooltip>
                    </Box>
                  )}
                </CardContent>

                {/* Menu */}
                <Menu
                  anchorEl={anchorEl[metric.id]}
                  open={Boolean(anchorEl[metric.id])}
                  onClose={() => handleMenuClose(metric.id)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MenuItem onClick={() => handleViewDetails(metric)}>
                    <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="View Details" />
                  </MenuItem>
                  <MenuItem onClick={() => handleMenuClose(metric.id)}>
                    <ListItemIcon><TimelineIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="View Trend" />
                  </MenuItem>
                  <MenuItem onClick={() => handleMenuClose(metric.id)}>
                    <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Share" />
                  </MenuItem>
                  <MenuItem onClick={() => handleMenuClose(metric.id)}>
                    <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Export" />
                  </MenuItem>
                </Menu>
              </Card>
            </Grow>
          </Grid>
        ))}
      </Grid>

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        {selectedMetric && (
          <>
            <DialogTitle>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar
                  sx={{
                    backgroundColor: alpha(selectedMetric.color, 0.1),
                    color: selectedMetric.color
                  }}
                >
                  {selectedMetric.icon}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedMetric.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Detailed Analysis
                  </Typography>
                </Box>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="h3" fontWeight={700} color={selectedMetric.color}>
                        {selectedMetric.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Current Value
                      </Typography>
                    </Box>
                    
                    <Divider />
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Change from Previous Period
                      </Typography>
                      <Chip
                        label={`${selectedMetric.change > 0 ? '+' : ''}${selectedMetric.change}%`}
                        color={selectedMetric.changeType === 'increase' ? 'success' : 'error'}
                        icon={getChangeIcon(selectedMetric.changeType)}
                      />
                    </Box>

                    {selectedMetric.target && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Target Achievement
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={getProgressValue(selectedMetric)}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {getProgressValue(selectedMetric).toFixed(1)}% of target achieved
                        </Typography>
                      </Box>
                    )}

                    {selectedMetric.forecast && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Forecast
                        </Typography>
                        <Typography variant="h6" color="primary.main">
                          {selectedMetric.forecast} {selectedMetric.unit || ''}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  {selectedMetric.trend && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Trend Analysis
                      </Typography>
                      <Box sx={{ height: 200 }}>
                        <Line
                          data={generateTrendChart(selectedMetric.trend, selectedMetric.color)}
                          options={{
                            ...trendChartOptions,
                            plugins: {
                              ...trendChartOptions.plugins,
                              tooltip: { enabled: true }
                            },
                            scales: {
                              x: { display: true },
                              y: { display: true }
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
              <Button variant="contained" onClick={() => setDetailsOpen(false)}>
                Take Action
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Pulse Animation */}
      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default EnhancedMetricsCards;