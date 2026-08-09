"use client";
import React, { useState, useEffect, Suspense, lazy } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Stack,
  Container,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Chip,
  useTheme,
  alpha,
  Skeleton
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  DragIndicator as DragIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Restore as RestoreIcon
} from '@mui/icons-material';

// Lazy load all widget components
const QuickStatsWidget = lazy(() => import('./QuickStatsWidget'));
const RecentActivitiesWidget = lazy(() => import('./RecentActivitiesWidget'));
const PerformanceMetricsWidget = lazy(() => import('./PerformanceMetricsWidget'));
const AdvancedAnalyticsWidget = lazy(() => import('./AdvancedAnalyticsWidget'));
const RecentInvoicesWidget = lazy(() => import('./RecentInvoicesWidget'));
const NotificationSystemWidget = lazy(() => import('./NotificationSystemWidget'));
const LazyChart = lazy(() => import('./LazyChart'));

interface WidgetConfig {
  id: string;
  name: string;
  component: string;
  enabled: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  props?: any;
}

interface CustomizableDashboardProps {
  userId?: string;
}

const defaultWidgets: WidgetConfig[] = [
  {
    id: 'quick-stats',
    name: 'Quick Statistics',
    component: 'QuickStatsWidget',
    enabled: true,
    position: { x: 0, y: 0 },
    size: { width: 12, height: 2 }
  },
  {
    id: 'revenue-chart',
    name: 'Revenue Chart',
    component: 'RevenueChart',
    enabled: true,
    position: { x: 0, y: 2 },
    size: { width: 8, height: 4 }
  },
  {
    id: 'recent-activities',
    name: 'Recent Activities',
    component: 'RecentActivitiesWidget',
    enabled: true,
    position: { x: 8, y: 2 },
    size: { width: 4, height: 4 }
  },
  {
    id: 'recent-invoices',
    name: 'Recent Invoices',
    component: 'RecentInvoicesWidget',
    enabled: true,
    position: { x: 0, y: 6 },
    size: { width: 12, height: 6 }
  },
  {
    id: 'performance-metrics',
    name: 'Performance Metrics',
    component: 'PerformanceMetricsWidget',
    enabled: true,
    position: { x: 0, y: 12 },
    size: { width: 8, height: 4 }
  },
  {
    id: 'notifications',
    name: 'Notifications',
    component: 'NotificationSystemWidget',
    enabled: true,
    position: { x: 8, y: 12 },
    size: { width: 4, height: 4 }
  },
  {
    id: 'advanced-analytics',
    name: 'Advanced Analytics',
    component: 'AdvancedAnalyticsWidget',
    enabled: false,
    position: { x: 0, y: 16 },
    size: { width: 12, height: 6 }
  }
];

const WidgetSkeleton = ({ height = 300 }: { height?: number }) => (
  <Card sx={{ height }}>
    <CardContent>
      <Stack spacing={2}>
        <Skeleton variant="rectangular" height={40} />
        <Skeleton variant="rectangular" height={height - 120} />
        <Skeleton variant="rectangular" height={30} />
      </Stack>
    </CardContent>
  </Card>
);

export default function CustomizableDashboard({ userId = 'default' }: CustomizableDashboardProps) {
  const theme = useTheme();
  const [widgets, setWidgets] = useState<WidgetConfig[]>(defaultWidgets);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadUserLayout();
    fetchDashboardData();
  }, [userId]);

  const loadUserLayout = () => {
    try {
      const savedLayout = localStorage.getItem(`dashboard-layout-${userId}`);
      if (savedLayout) {
        const parsedLayout = JSON.parse(savedLayout);
        setWidgets(parsedLayout);
      }
    } catch (error) {
      console.error('Failed to load user layout:', error);
    }
  };

  const saveUserLayout = () => {
    try {
      localStorage.setItem(`dashboard-layout-${userId}`, JSON.stringify(widgets));
    } catch (error) {
      console.error('Failed to save user layout:', error);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockStats = {
        totalSales: 2450000,
        totalInvoices: 324,
        pendingPayments: 450000,
        totalParties: 118,
        totalProducts: 245,
        totalOrders: 324,
        monthlyGrowth: 12.5,
        conversionRate: 3.2
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWidget = (widgetId: string) => {
    setWidgets(prev => 
      prev.map(widget => 
        widget.id === widgetId 
          ? { ...widget, enabled: !widget.enabled }
          : widget
      )
    );
  };

  const resetToDefault = () => {
    setWidgets(defaultWidgets);
    localStorage.removeItem(`dashboard-layout-${userId}`);
  };

  const renderWidget = (widget: WidgetConfig) => {
    if (!widget.enabled) return null;

    const widgetProps = {
      showHeader: true,
      ...widget.props
    };

    switch (widget.component) {
      case 'QuickStatsWidget':
        return (
          <Suspense fallback={<WidgetSkeleton height={160} />}>
            <QuickStatsWidget stats={stats} loading={loading} {...widgetProps} />
          </Suspense>
        );
      
      case 'RecentActivitiesWidget':
        return (
          <Suspense fallback={<WidgetSkeleton height={400} />}>
            <RecentActivitiesWidget 
              limit={8} 
              compact={true}
              refreshInterval={30000}
              {...widgetProps}
            />
          </Suspense>
        );
      
      case 'PerformanceMetricsWidget':
        return (
          <Suspense fallback={<WidgetSkeleton height={350} />}>
            <PerformanceMetricsWidget 
              compact={true}
              refreshInterval={15000}
              {...widgetProps}
            />
          </Suspense>
        );
      
      case 'AdvancedAnalyticsWidget':
        return (
          <Suspense fallback={<WidgetSkeleton height={500} />}>
            <AdvancedAnalyticsWidget height={500} {...widgetProps} />
          </Suspense>
        );
      
      case 'RecentInvoicesWidget':
        return (
          <Suspense fallback={<WidgetSkeleton height={500} />}>
            <RecentInvoicesWidget 
              limit={10}
              fullWidth={true}
              showPagination={true}
              showSearch={true}
              refreshInterval={60000}
              {...widgetProps}
            />
          </Suspense>
        );
      
      case 'NotificationSystemWidget':
        return (
          <Suspense fallback={<WidgetSkeleton height={400} />}>
            <NotificationSystemWidget 
              compact={true}
              maxHeight={400}
              refreshInterval={30000}
              {...widgetProps}
            />
          </Suspense>
        );
      
      case 'RevenueChart':
        const revenueData = Array.from({ length: 12 }, (_, i) => 
          120000 + (i % 3) * 15000 + Math.random() * 10000
        );
        const monthLabels = Array.from({ length: 12 }, (_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - 11 + i);
          return d.toLocaleString('default', { month: 'short' });
        });

        const chartData = {
          labels: monthLabels,
          datasets: [{
            label: 'Revenue',
            data: revenueData,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            borderColor: theme.palette.primary.main,
            fill: true,
            tension: 0.4,
          }]
        };

        return (
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Revenue Trend (Last 12 Months)
              </Typography>
              <Box sx={{ height: 300 }}>
                <Suspense fallback={<Skeleton variant="rectangular" height={300} />}>
                  <LazyChart 
                    type="line" 
                    data={chartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value: any) {
                              return '₹' + (value / 1000).toFixed(0) + 'K';
                            }
                          }
                        }
                      }
                    }}
                  />
                </Suspense>
              </Box>
            </CardContent>
          </Card>
        );
      
      default:
        return (
          <Card>
            <CardContent>
              <Typography>Unknown widget: {widget.component}</Typography>
            </CardContent>
          </Card>
        );
    }
  };

  const enabledWidgets = widgets.filter(w => w.enabled);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Customizable Dashboard 🎛️
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Personalize your dashboard with drag-and-drop widgets and custom layouts
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Chip 
                label={`${enabledWidgets.length} Active Widgets`} 
                size="small" 
                sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
              <Chip 
                label="Auto-Save Enabled" 
                size="small" 
                sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
            </Stack>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button 
              onClick={() => setSettingsOpen(true)}
              startIcon={<SettingsIcon />} 
              variant="contained"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            >
              Customize
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Widget Grid */}
      <Grid container spacing={3}>
        {widgets
          .filter(widget => widget.enabled)
          .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x)
          .map((widget) => (
            <Grid 
              item 
              xs={12} 
              md={widget.size.width} 
              key={widget.id}
              sx={{
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                }
              }}
            >
              {widget.component === 'QuickStatsWidget' ? (
                <Grid container spacing={2}>
                  {renderWidget(widget)}
                </Grid>
              ) : (
                renderWidget(widget)
              )}
            </Grid>
          ))}
      </Grid>

      {/* Settings Dialog */}
      <Dialog 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <SettingsIcon />
            <Typography variant="h6">Dashboard Settings</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enable or disable widgets to customize your dashboard experience. Changes are saved automatically.
          </Typography>
          
          <List>
            {widgets.map((widget) => (
              <ListItem key={widget.id} divider>
                <ListItemIcon>
                  <DragIcon color="action" />
                </ListItemIcon>
                <ListItemText
                  primary={widget.name}
                  secondary={`Component: ${widget.component}`}
                />
                <ListItemSecondaryAction>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Chip
                      label={widget.enabled ? 'Enabled' : 'Disabled'}
                      size="small"
                      color={widget.enabled ? 'success' : 'default'}
                      variant="outlined"
                    />
                    <Switch
                      checked={widget.enabled}
                      onChange={() => toggleWidget(widget.id)}
                      color="primary"
                    />
                  </Stack>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetToDefault} startIcon={<RestoreIcon />} color="warning">
            Reset to Default
          </Button>
          <Button onClick={() => setSettingsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              saveUserLayout();
              setSettingsOpen(false);
            }}
            startIcon={<SaveIcon />}
            variant="contained"
          >
            Save Layout
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}