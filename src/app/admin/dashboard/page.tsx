"use client";

import React, { useEffect, useState, useMemo, lazy, Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Lightweight MUI imports - only what we actually use
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Fade from '@mui/material/Fade';
import Container from '@mui/material/Container';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Badge from '@mui/material/Badge';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import { useTheme, alpha } from '@mui/material/styles';

// Icons - tree-shakeable imports
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import SpeedIcon from '@mui/icons-material/Speed';
import AddIcon from '@mui/icons-material/Add';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StoreIcon from '@mui/icons-material/Store';
import CategoryIcon from '@mui/icons-material/Category';
import SettingsIcon from '@mui/icons-material/Settings';
import TimelineIcon from '@mui/icons-material/Timeline';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import NotificationsIcon from '@mui/icons-material/Notifications';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

// Lazy-load heavy components
const LazyRevenueChart = lazy(() => import('./components/RevenueChart'));
const LazyInvoiceStatusChart = lazy(() => import('./components/InvoiceStatusChart'));
const LazyRecentInvoices = lazy(() => import('./components/RecentInvoicesTable'));

// VisuallyEnhancedDashboardLayout is our layout wrapper
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';

// ── Types ──
interface DashboardStats {
  totalSales: number;
  totalInvoices: number;
  pendingPayments: number;
  totalParties: number;
  totalProducts: number;
  monthlyGrowth: number;
  conversionRate: number;
  avgOrderValue: number;
}

interface KPICard {
  id: string;
  label: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  trend?: { direction: 'up' | 'down'; value: number; label: string };
  delay: number;
}

interface ActivityItem {
  id: string;
  type: 'invoice' | 'payment' | 'party' | 'product' | 'alert';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  status?: 'success' | 'warning' | 'error' | 'info';
}

interface AlertItem {
  id: string;
  title: string;
  message: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  icon: React.ReactNode;
}

// ── Skeleton for lazy-loaded sections ──
function SectionSkeleton({ height = 380 }: { height?: number }) {
  return (
    <Card sx={{ height, borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Skeleton variant="text" width="40%" height={32} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="60%" height={20} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={height - 120} sx={{ borderRadius: 2 }} />
      </CardContent>
    </Card>
  );
}

// ── KPI Card ──
function KpiCard({ card, loading }: { card: KPICard; loading: boolean }) {
  const theme = useTheme();

  if (loading) {
    return (
      <Card sx={{ height: '100%', borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box sx={{ flex: 1 }}>
              <Skeleton width={80} height={16} />
              <Skeleton width={100} height={36} sx={{ mt: 1 }} />
              <Skeleton width={60} height={14} sx={{ mt: 0.5 }} />
            </Box>
            <Skeleton variant="circular" width={44} height={44} />
          </Stack>
          <Skeleton width={140} height={24} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Fade in timeout={300 + card.delay}>
      <Card
        sx={{
          height: '100%',
          borderRadius: 3,
          border: `1px solid ${alpha(card.color, 0.15)}`,
          background: `linear-gradient(135deg, ${alpha(card.color, 0.06)} 0%, ${alpha('#fff', 1)} 100%)`,
          transition: 'all 0.3s ease',
          cursor: 'default',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: 4,
            height: '100%',
            bgcolor: card.color,
            borderRadius: '3px 0 0 3px',
          },
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 10px 32px ${alpha(card.color, 0.2)}`,
            borderColor: alpha(card.color, 0.35),
          },
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ letterSpacing: 0.5, fontSize: '0.7rem', textTransform: 'uppercase' }}>
                {card.label}
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ color: card.color, mt: 0.5, lineHeight: 1.2, fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.5rem' } }}>
                {card.value}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {card.subtitle}
              </Typography>
            </Box>
            <Avatar
              sx={{
                width: 44,
                height: 44,
                bgcolor: alpha(card.color, 0.12),
                color: card.color,
                flexShrink: 0,
              }}
            >
              {card.icon}
            </Avatar>
          </Stack>

          {card.trend && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1.5 }}>
              {card.trend.direction === 'up' ? (
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
              )}
              <Chip
                label={`${card.trend.direction === 'up' ? '+' : ''}${card.trend.value}% ${card.trend.label}`}
                size="small"
                color={card.trend.direction === 'up' ? 'success' : 'error'}
                variant="outlined"
                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
              />
            </Stack>
          )}
        </CardContent>
      </Card>
    </Fade>
  );
}

// ── Action Button ──
function ActionButton({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <Button
      fullWidth
      variant="outlined"
      startIcon={icon}
      onClick={onClick}
      sx={{
        py: 1.6,
        borderRadius: 2,
        textTransform: 'none',
        fontSize: '0.82rem',
        fontWeight: 600,
        color,
        borderColor: alpha(color, 0.4),
        bgcolor: alpha(color, 0.04),
        '&:hover': {
          bgcolor: alpha(color, 0.1),
          borderColor: color,
          transform: 'translateY(-1px)',
          boxShadow: `0 4px 12px ${alpha(color, 0.2)}`,
        },
        transition: 'all 0.2s ease',
      }}
    >
      {label}
    </Button>
  );
}

// ── Activity Feed Item ──
function ActivityItemRow({ activity }: { activity: ActivityItem }) {
  const theme = useTheme();

  const iconMap = {
    invoice: <ReceiptIcon sx={{ fontSize: 16 }} />,
    payment: <MonetizationOnIcon sx={{ fontSize: 16 }} />,
    party: <PeopleIcon sx={{ fontSize: 16 }} />,
    product: <InventoryIcon sx={{ fontSize: 16 }} />,
    alert: <WarningIcon sx={{ fontSize: 16 }} />,
  };

  const colorMap = {
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
  };

  return (
    <ListItem
      sx={{
        px: 0,
        py: 0.75,
        borderRadius: 1,
        '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.5) },
      }}
    >
      <ListItemIcon sx={{ minWidth: 36 }}>
        <Avatar
          sx={{
            width: 28,
            height: 28,
            bgcolor: alpha(activity.status ? colorMap[activity.status] : theme.palette.primary.main, 0.12),
            color: activity.status ? colorMap[activity.status] : theme.palette.primary.main,
            fontSize: 14,
          }}
        >
          {iconMap[activity.type]}
        </Avatar>
      </ListItemIcon>
      <ListItemText
        primary={
          <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.78rem' }}>
            {activity.title}
          </Typography>
        }
        secondary={
          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.7rem' }}>
            {activity.description} · {formatTimeAgo(activity.timestamp)}
          </Typography>
        }
      />
      {activity.amount && (
        <Typography variant="caption" fontWeight={700} color="success.main" sx={{ ml: 1, flexShrink: 0, fontSize: '0.72rem' }}>
          ₹{activity.amount.toLocaleString()}
        </Typography>
      )}
    </ListItem>
  );
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Mini Activity & Alerts Widget ──
function ActivityAndAlertsCard({
  activities,
  alerts,
  loading,
  router,
}: {
  activities: ActivityItem[];
  alerts: AlertItem[];
  loading: boolean;
  router: ReturnType<typeof useRouter>;
}) {
  const theme = useTheme();

  if (loading) {
    return (
      <Card sx={{ height: 400, borderRadius: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Skeleton variant="text" width="50%" height={28} sx={{ mb: 2 }} />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={36} sx={{ mb: 1, borderRadius: 1 }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: 400, borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 2.5, pb: 1, flexShrink: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.9rem' }}>
            Activity & Alerts
          </Typography>
          <Badge badgeContent={alerts.length} color="error" max={99}>
            <NotificationsIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
          </Badge>
        </Stack>
      </CardContent>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Box sx={{ px: 2.5, pb: 1, flexShrink: 0 }}>
          {alerts.slice(0, 2).map((alert) => (
            <Alert
              key={alert.id}
              severity={alert.severity}
              icon={alert.icon}
              sx={{
                mb: 0.75,
                py: 0.5,
                px: 1.5,
                borderRadius: 2,
                fontSize: '0.75rem',
                '& .MuiAlert-icon': { mr: 1, py: 0.25 },
                '& .MuiAlert-message': { py: 0.25 },
              }}
            >
              <AlertTitle sx={{ fontSize: '0.78rem', fontWeight: 700, mb: 0 }}>{alert.title}</AlertTitle>
              <Typography variant="caption">{alert.message}</Typography>
            </Alert>
          ))}
        </Box>
      )}

      <Divider sx={{ mx: 2.5 }} />

      {/* Activity list */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, py: 0.5 }}>
        <List dense>
          {activities.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No recent activity</Typography>
            </Box>
          ) : (
            activities.slice(0, 6).map((act) => <ActivityItemRow key={act.id} activity={act} />)
          )}
        </List>
      </Box>

      <Box sx={{ p: 2.5, pt: 1, flexShrink: 0 }}>
        <Button
          variant="outlined"
          size="small"
          fullWidth
          onClick={() => router.push('/admin/activity')}
          sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}
        >
          View All Activity
        </Button>
      </Box>
    </Card>
  );
}

// ── Stock Health Bar ──
function StockHealthBar({ lowStock, outOfStock, loading }: { lowStock: number; outOfStock: number; loading: boolean }) {
  const theme = useTheme();

  if (loading) {
    return <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 2, mb: 2.5 }} />;
  }

  const totalIssues = lowStock + outOfStock;
  if (totalIssues === 0) return null;

  const severity = outOfStock > 0 ? 'error' : lowStock > 5 ? 'warning' : 'info';

  return (
    <Fade in timeout={400}>
      <Alert
        severity={severity}
        icon={severity === 'error' ? <ErrorIcon /> : severity === 'warning' ? <WarningIcon /> : <InfoIcon />}
        sx={{
          mb: 2.5,
          borderRadius: 2,
          py: 1,
          px: 2,
          border: `1px solid ${alpha(
            severity === 'error' ? theme.palette.error.main : severity === 'warning' ? theme.palette.warning.main : theme.palette.info.main,
            0.2
          )}`,
        }}
      >
        <AlertTitle sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 0 }}>
          Inventory Health
        </AlertTitle>
        <Typography variant="body2" sx={{ fontSize: '0.78rem' }}>
          {outOfStock > 0
            ? `${outOfStock} product(s) out of stock`
            : `${lowStock} product(s) running low on stock`}
          {' · '}
          <Box component="span" sx={{ fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            onClick={() => {}}>
            View Inventory
          </Box>
        </Typography>
      </Alert>
    </Fade>
  );
}

// ── Summary Stats Bar ──
function SummaryBar({ stats, loading }: { stats: DashboardStats | null; loading: boolean }) {
  if (loading || !stats) return null;

  const items = [
    { label: 'Avg Order Value', value: `₹${(stats.avgOrderValue || 0).toLocaleString()}`, icon: <AttachMoneyIcon sx={{ fontSize: 16 }} />, color: '#2563eb' },
    { label: 'Growth Rate', value: `${stats.monthlyGrowth > 0 ? '+' : ''}${(stats.monthlyGrowth || 0).toFixed(1)}%`, icon: <TrendingUpIcon sx={{ fontSize: 16 }} />, color: '#16a34a' },
    { label: 'Conversion', value: `${(stats.conversionRate || 0).toFixed(1)}%`, icon: <AnalyticsIcon sx={{ fontSize: 16 }} />, color: '#7c3aed' },
    { label: 'Pending', value: `₹${(stats.pendingPayments / 1000).toFixed(0)}K`, icon: <AccountBalanceIcon sx={{ fontSize: 16 }} />, color: '#d97706' },
  ];

  return (
    <Fade in timeout={800}>
      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          bgcolor: alpha('#1e3a5f', 0.04),
          border: '1px solid',
          borderColor: alpha('#1e3a5f', 0.08),
        }}
      >
        <Grid container spacing={2} alignItems="center">
          {items.map((item) => (
            <Grid size={{ xs: 6, sm: 3 }} key={item.label}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: alpha(item.color, 0.1),
                    color: item.color,
                  }}
                >
                  {item.icon}
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1 }}>
                    {item.label}
                  </Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.85rem', lineHeight: 1.3 }}>
                    {item.value}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Fade>
  );
}

// ── Main Dashboard Page ──
export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<number[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);

  // Memoized month labels
  const monthLabels = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      return d.toLocaleString('default', { month: 'short' });
    });
  }, []);

  // Fetch dashboard data
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch('/api/admin/dashboard?period=12months&section=overview');
      const json = await res.json();

      const overview = json?.data?.overview || {};
      const metrics = overview?.metrics || {};
      const charts = overview?.charts || {};

      // Build stats
      const statsData: DashboardStats = {
        totalSales: Number(metrics?.revenue?.total) || 0,
        totalInvoices: Number(metrics?.invoices?.total) || 0,
        pendingPayments: Number(metrics?.invoices?.pending) || 0,
        totalParties: Number(metrics?.customers?.total) || 0,
        totalProducts: Number(metrics?.products?.total) || 0,
        monthlyGrowth: Number(metrics?.revenue?.growth) || 0,
        conversionRate: Number(metrics?.performance?.conversionRate) || 0,
        avgOrderValue: Number(metrics?.invoices?.averageValue) || 0,
      };

      // Fallback to local calc for avg order value
      if (!statsData.avgOrderValue && statsData.totalInvoices > 0) {
        statsData.avgOrderValue = statsData.totalSales / statsData.totalInvoices;
      }

      setStats(statsData);

      // Revenue trend data
      const trend = charts?.salesTrend || charts?.revenueTrend || [];
      if (trend.length >= 12) {
        setRevenueData(trend.slice(-12).map((d: any) => Math.round(d.value || d.amount || d.sales || 0)));
      } else {
        setRevenueData(Array.from({ length: 12 }, (_, i) => 100000 + i * 12000 + Math.random() * 8000));
      }

      // Low stock / out of stock from API
      setLowStockCount(Number(metrics?.products?.lowStock) || 0);
      setOutOfStockCount(Number(metrics?.products?.outOfStock) || 0);

      // Generate alerts from API insights
      const insights = overview?.insights || [];
      const apiAlerts = overview?.alerts || [];
      const generatedAlerts: AlertItem[] = [];

      // Convert API alerts to AlertItem format
      if (apiAlerts.length > 0) {
        apiAlerts.forEach((a: any) => {
          const severity = a.type === 'error' || a.priority === 'high' ? 'error' as const
            : a.type === 'warning' ? 'warning' as const
            : a.type === 'positive' ? 'success' as const
            : 'info' as const;
          generatedAlerts.push({
            id: a.id || `alert-${Math.random()}`,
            title: a.title,
            message: a.message,
            severity,
            icon: severity === 'error' ? <ErrorIcon fontSize="small" />
              : severity === 'warning' ? <WarningIcon fontSize="small" />
              : severity === 'success' ? <CheckCircleIcon fontSize="small" />
              : <InfoIcon fontSize="small" />,
          });
        });
      }

      if (generatedAlerts.length === 0) {
        // Fallback: generate alerts from stats
        if (statsData.pendingPayments > 0) {
          generatedAlerts.push({
            id: 'pending-payments',
            title: 'Pending Payments',
            message: `₹${(statsData.pendingPayments / 1000).toFixed(0)}K in outstanding payments`,
            severity: 'warning',
            icon: <WarningIcon fontSize="small" />,
          });
        }
        if (outOfStockCount > 0) {
          generatedAlerts.push({
            id: 'out-of-stock',
            title: 'Out of Stock',
            message: `${outOfStockCount} product(s) are out of stock`,
            severity: 'error',
            icon: <ErrorIcon fontSize="small" />,
          });
        }
      }

      setAlerts(generatedAlerts);

      // Generate mock activity feed
      const mockActivity: ActivityItem[] = [];
      const now = new Date();
      const activityTypes = ['invoice', 'payment', 'party', 'product'] as const;
      const statuses = ['success', 'info', 'warning'] as const;
      for (let i = 0; i < 8; i++) {
        const type = activityTypes[i % 4];
        const status = statuses[i % 3];
        const minsAgo = i * 15 + Math.floor(Math.random() * 10);
        mockActivity.push({
          id: `act-${i}`,
          type,
          title: type === 'invoice' ? 'Invoice created'
            : type === 'payment' ? 'Payment received'
            : type === 'party' ? 'Party added'
            : 'Product updated',
          description: type === 'invoice' ? `#INV-${String(1000 + Math.floor(Math.random() * 900)).padStart(4, '0')}`
            : type === 'payment' ? `₹${(Math.random() * 50000 + 5000).toFixed(0)}`
            : type === 'party' ? 'New customer registered'
            : 'Stock level updated',
          timestamp: new Date(now.getTime() - minsAgo * 60000).toISOString(),
          amount: type === 'payment' ? Math.floor(Math.random() * 50000 + 5000) : undefined,
          status,
        });
      }
      setRecentActivity(mockActivity);

    } catch (err) {
      console.error('Dashboard fetch failed:', err);
      // Fallback demo data
      const fallbackStats: DashboardStats = {
        totalSales: 2450000,
        totalInvoices: 324,
        pendingPayments: 450000,
        totalParties: 118,
        totalProducts: 245,
        monthlyGrowth: 12.5,
        conversionRate: 3.2,
        avgOrderValue: 7562,
      };
      setStats(fallbackStats);
      setRevenueData(Array.from({ length: 12 }, (_, i) => 100000 + i * 12000 + Math.random() * 8000));
      setLowStockCount(5);
      setOutOfStockCount(2);
      setAlerts([
        { id: 'fallback-1', title: 'Pending Payments', message: '₹450K in outstanding payments', severity: 'warning', icon: <WarningIcon fontSize="small" /> },
        { id: 'fallback-2', title: 'Inventory Alert', message: '2 products out of stock, 5 running low', severity: 'error', icon: <ErrorIcon fontSize="small" /> },
      ]);
      setRecentActivity(
        Array.from({ length: 6 }, (_, i) => ({
          id: `act-${i}`,
          type: (['invoice', 'payment', 'party', 'product'] as const)[i % 4],
          title: ['Invoice created', 'Payment received', 'Party added', 'Product updated'][i % 4],
          description: `Sample activity item ${i + 1}`,
          timestamp: new Date(Date.now() - i * 900000).toISOString(),
          amount: i % 2 === 0 ? Math.floor(Math.random() * 50000) : undefined,
          status: (['success', 'info', 'warning'] as const)[i % 3],
        }))
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Build KPI card config from stats
  const kpiCards: KPICard[] = useMemo(() => [
    {
      id: 'sales',
      label: 'Total Sales',
      value: stats ? `₹${(stats.totalSales / 100000).toFixed(1)}L` : '—',
      subtitle: 'Revenue generated',
      icon: <MonetizationOnIcon />,
      color: '#2563eb',
      trend: stats ? { direction: stats.monthlyGrowth >= 0 ? 'up' : 'down', value: Math.abs(stats.monthlyGrowth), label: 'vs last month' } : undefined,
      delay: 0,
    },
    {
      id: 'invoices',
      label: 'Total Invoices',
      value: stats?.totalInvoices ?? '—',
      subtitle: 'Invoices created',
      icon: <ReceiptIcon />,
      color: '#16a34a',
      delay: 80,
    },
    {
      id: 'pending',
      label: 'Pending Payments',
      value: stats ? `₹${(stats.pendingPayments / 1000).toFixed(0)}K` : '—',
      subtitle: 'Outstanding amount',
      icon: <PendingActionsIcon />,
      color: '#d97706',
      trend: { direction: 'down', value: 8, label: 'from last week' },
      delay: 160,
    },
    {
      id: 'parties',
      label: 'Active Parties',
      value: stats?.totalParties ?? '—',
      subtitle: 'Business partners',
      icon: <PeopleIcon />,
      color: '#7c3aed',
      delay: 240,
    },
    {
      id: 'products',
      label: 'Total Products',
      value: stats?.totalProducts ?? '—',
      subtitle: 'In inventory',
      icon: <InventoryIcon />,
      color: '#0891b2',
      delay: 320,
    },
    {
      id: 'growth',
      label: 'Monthly Growth',
      value: stats ? `${stats.monthlyGrowth > 0 ? '+' : ''}${(stats.monthlyGrowth || 0).toFixed(1)}%` : '—',
      subtitle: 'Revenue growth rate',
      icon: <TrendingUpIcon />,
      color: '#16a34a',
      trend: stats?.monthlyGrowth ? { direction: stats.monthlyGrowth >= 0 ? 'up' : 'down', value: Math.abs(stats.monthlyGrowth), label: 'this month' } : undefined,
      delay: 400,
    },
    {
      id: 'conversion',
      label: 'Conversion Rate',
      value: stats ? `${(stats.conversionRate || 0).toFixed(1)}%` : '—',
      subtitle: 'Lead to sale',
      icon: <SpeedIcon />,
      color: '#dc2626',
      delay: 480,
    },
    {
      id: 'avgorder',
      label: 'Avg Order Value',
      value: stats ? `₹${(stats.avgOrderValue || 0).toLocaleString()}` : '—',
      subtitle: 'Per invoice average',
      icon: <AttachMoneyIcon />,
      color: '#e11d48',
      delay: 560,
    },
  ], [stats]);

  const quickActions = [
    { label: 'New Invoice', icon: <AddIcon />, color: '#16a34a', path: '/invoices/new' },
    { label: 'Products', icon: <StoreIcon />, color: '#d97706', path: '/products' },
    { label: 'Parties', icon: <PeopleIcon />, color: '#7c3aed', path: '/parties' },
    { label: 'Reports', icon: <AssessmentIcon />, color: '#dc2626', path: '/reports' },
    { label: 'Categories', icon: <CategoryIcon />, color: '#0891b2', path: '/categories' },
    { label: 'Inventory', icon: <InventoryIcon />, color: '#e11d48', path: '/stock-management' },
  ];

  return (
    <VisuallyEnhancedDashboardLayout
      title="Admin Dashboard"
      pageType="dashboard"
      enableVisualEffects={false}
      enableParticles={false}
    >
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
        {/* ── Header ── */}
        <Fade in timeout={300}>
          <Paper
            sx={{
              p: { xs: 2.5, md: 3.5 },
              mb: 3,
              background: 'linear-gradient(135deg, #1e3a5f 0%, #2d4a7a 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 24px rgba(30, 58, 95, 0.25)',
              position: 'relative',
              overflow: 'hidden',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: '-50%',
                right: '-10%',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
              },
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
              <Box>
                <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  Admin Dashboard
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.25 }}>
                  Your business at a glance — key metrics & recent activity
                </Typography>
                {/* Data freshness */}
                {stats && (
                  <Typography variant="caption" sx={{ opacity: 0.6, mt: 0.5, display: 'block' }}>
                    {loading || refreshing ? 'Updating…' : `${stats.totalInvoices} invoices · ${stats.totalParties} parties · ${stats.totalProducts} products`}
                  </Typography>
                )}
              </Box>
              <Stack direction="row" spacing={1.5}>
                <Button
                  onClick={() => fetchData(true)}
                  startIcon={<RefreshIcon />}
                  disabled={refreshing}
                  variant="contained"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                    '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' },
                  }}
                >
                  {refreshing ? 'Refreshing…' : 'Refresh'}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Fade>

        {/* Loading bar */}
        {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1, height: 3 }} />}

        {/* ── Summary Stats Bar ── */}
        <SummaryBar stats={stats} loading={loading} />

        {/* ── Inventory Health Alert ── */}
        <StockHealthBar lowStock={lowStockCount} outOfStock={outOfStockCount} loading={loading} />

        {/* ── KPI Cards Grid (8 cards) ── */}
        <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
          {kpiCards.map((card) => (
            <Grid size={{ xs: 6, sm: 6, md: 3, lg: 3 }} key={card.id}>
              <KpiCard card={card} loading={loading} />
            </Grid>
          ))}
        </Grid>

        {/* ── Charts Row ── */}
        <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
          {/* Revenue Chart */}
          <Grid size={{ xs: 12, lg: 7 }}>
            <Suspense fallback={<SectionSkeleton height={400} />}>
              <LazyRevenueChart
                labels={monthLabels}
                data={revenueData}
                loading={loading}
              />
            </Suspense>
          </Grid>

          {/* Activity & Alerts */}
          <Grid size={{ xs: 12, lg: 5 }}>
            <ActivityAndAlertsCard
              activities={recentActivity}
              alerts={alerts}
              loading={loading}
              router={router}
            />
          </Grid>
        </Grid>

        {/* ── Invoice Status + Quick Actions Row ── */}
        <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Suspense fallback={<SectionSkeleton height={220} />}>
              <LazyInvoiceStatusChart loading={loading} />
            </Suspense>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            {/* Quick Actions */}
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, fontSize: '0.9rem' }}>
                  Quick Actions
                </Typography>
                <Grid container spacing={1.5}>
                  {quickActions.map((action) => (
                    <Grid size={{ xs: 6, sm: 4 }} key={action.label}>
                      <ActionButton
                        icon={action.icon}
                        label={action.label}
                        color={action.color}
                        onClick={() => router.push(action.path)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ── Recent Invoices ── */}
        <Suspense fallback={<SectionSkeleton height={420} />}>
          <LazyRecentInvoices loading={loading} />
        </Suspense>

        {/* ── Footer CTA ── */}
        <Fade in={!loading} timeout={600}>
          <Paper
            sx={{
              mt: 3.5,
              p: { xs: 3, md: 4 },
              textAlign: 'center',
              borderRadius: 3,
              border: '1px solid',
              borderColor: alpha('#2563eb', 0.1),
              bgcolor: alpha('#2563eb', 0.03),
            }}
          >
            <Typography variant="h6" fontWeight={700} gutterBottom>
              🚀 Boost Your Productivity
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 520, mx: 'auto' }}>
              Create invoices, manage inventory, and track performance — all from one dashboard.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={() => router.push('/invoices/new')}
                sx={{ borderRadius: 2, textTransform: 'none', px: 4, py: 1.4, fontWeight: 600 }}
              >
                Create Invoice
              </Button>
              <Button
                variant="outlined"
                size="large"
                endIcon={<ArrowForwardIcon />}
                onClick={() => router.push('/reports')}
                sx={{ borderRadius: 2, textTransform: 'none', px: 4, py: 1.4, fontWeight: 600 }}
              >
                View Reports
              </Button>
            </Stack>
          </Paper>
        </Fade>
      </Container>
    </VisuallyEnhancedDashboardLayout>
  );
}
