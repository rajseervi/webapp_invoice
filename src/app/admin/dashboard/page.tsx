'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import RefreshIcon from '@mui/icons-material/Refresh';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VerifiedIcon from '@mui/icons-material/Verified';

import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import StatCard from '@/components/InteractiveLayout/StatCard';
import RevenueTrendCard from '@/components/InteractiveLayout/dashboard/RevenueTrendCard';
import StatusDonutCard from '@/components/InteractiveLayout/dashboard/StatusDonutCard';
import ActivityFeedCard from '@/components/InteractiveLayout/dashboard/ActivityFeedCard';
import RecentInvoicesCard from '@/components/InteractiveLayout/dashboard/RecentInvoicesCard';
import { useDashboardData } from '@/components/InteractiveLayout/dashboard/useDashboardData';

export default function AdminDashboardPage() {
  const router = useRouter();
  const theme = useTheme();
  const { stats, trend, statusSlices, activity, invoices, loading, refreshing, refresh, isDemo } =
    useDashboardData();

  return (
    <VisuallyEnhancedDashboardLayout title="Dashboard" pageType="dashboard">
      <Stack spacing={3}>
        {/* ── Welcome Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Box
            sx={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 4,
              p: { xs: 3, md: 4 },
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${alpha(theme.palette.secondary.main, 0.6)} 100%)`,
              color: '#fff',
              boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.35)}`,
            }}
          >
            {/* Decorative circles */}
            <Box
              sx={{
                position: 'absolute',
                top: -60,
                right: -40,
                width: 220,
                height: 220,
                borderRadius: '50%',
                background: alpha('#fff', 0.08),
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -80,
                right: 80,
                width: 180,
                height: 180,
                borderRadius: '50%',
                background: alpha('#fff', 0.06),
              }}
            />

            <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2.5}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: alpha('#fff', 0.2),
                  backdropFilter: 'blur(8px)',
                  border: '2px solid alpha(#fff, 0.3)',
                }}
              >
                <VerifiedIcon />
              </Avatar>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.4rem', md: '1.75rem' }, mb: 0.5 }}>
                  Welcome back! 👋
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 480 }}>
                  Here's what's happening with your business today.
                </Typography>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  variant="contained"
                  startIcon={<ReceiptIcon />}
                  onClick={() => router.push('/invoices/new')}
                  sx={{
                    bgcolor: '#fff',
                    color: theme.palette.primary.main,
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 3,
                    '&:hover': {
                      bgcolor: alpha('#fff', 0.9),
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                    },
                  }}
                >
                  Create Invoice
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<TrendingUpIcon />}
                  onClick={() => router.push('/reports')}
                  sx={{
                    color: '#fff',
                    borderColor: alpha('#fff', 0.5),
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 3,
                    '&:hover': {
                      borderColor: '#fff',
                      bgcolor: alpha('#fff', 0.1),
                    },
                  }}
                >
                  View Reports
                </Button>
              </Stack>
            </Stack>
          </Box>
        </motion.div>

        {/* ── Toolbar ── */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            {isDemo && !loading && (
              <Tooltip title="Live data unavailable — showing sample data">
                <Chip label="Demo data" size="small" color="warning" variant="outlined" sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700 }} />
              </Tooltip>
            )}
          </Stack>
          <Tooltip title="Refresh data">
            <span>
              <IconButton
                onClick={refresh}
                disabled={refreshing || loading}
                size="small"
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: alpha('#2563eb', 0.06) },
                }}
              >
                <RefreshIcon
                  sx={{
                    fontSize: 18,
                    animation: refreshing ? 'spin 0.9s linear infinite' : 'none',
                    '@keyframes spin': { to: { transform: 'rotate(360deg)' } },
                  }}
                />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        {/* ── KPI Cards ── */}
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 6, sm: 6, md: 3 }}>
            <StatCard
              label="Total Sales"
              value={stats?.totalSales ?? 0}
              format="currency"
              icon={<MonetizationOnIcon />}
              color="#2563eb"
              trend={stats?.monthlyGrowth}
              trendLabel="vs last month"
              href="/reports"
              loading={loading}
              delay={0}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 6, md: 3 }}>
            <StatCard
              label="Invoices"
              value={stats?.totalInvoices ?? 0}
              format="number"
              icon={<ReceiptIcon />}
              color="#16a34a"
              href="/invoices"
              loading={loading}
              delay={70}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 6, md: 3 }}>
            <StatCard
              label="Pending Payments"
              value={stats?.pendingPayments ?? 0}
              format="currency"
              icon={<PendingActionsIcon />}
              color="#d97706"
              href="/invoices"
              loading={loading}
              delay={140}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 6, md: 3 }}>
            <StatCard
              label="Active Parties"
              value={stats?.totalParties ?? 0}
              format="number"
              icon={<PeopleIcon />}
              color="#7c3aed"
              href="/parties"
              loading={loading}
              delay={210}
            />
          </Grid>
        </Grid>

        {/* ── Secondary Stats Row ── */}
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Total Products"
              value={stats?.totalProducts ?? 0}
              format="number"
              icon={<InventoryIcon />}
              color="#0891b2"
              href="/products"
              loading={loading}
              delay={0}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Low Stock Items"
              value={stats?.lowStock ?? 0}
              format="number"
              icon={<InventoryIcon />}
              color="#d97706"
              href="/stock-management"
              loading={loading}
              delay={70}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Out of Stock"
              value={stats?.outOfStock ?? 0}
              format="number"
              icon={<InventoryIcon />}
              color="#dc2626"
              href="/stock-management"
              loading={loading}
              delay={140}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Avg Order Value"
              value={stats?.avgOrderValue ?? 0}
              format="currency"
              icon={<TrendingUpIcon />}
              color="#7c3aed"
              href="/reports"
              loading={loading}
              delay={210}
            />
          </Grid>
        </Grid>

        {/* ── Charts Row ── */}
        <Grid container spacing={2.5} alignItems="stretch">
          <Grid size={{ xs: 12, lg: 7 }}>
            <RevenueTrendCard data={trend} loading={loading} />
          </Grid>
          <Grid size={{ xs: 12, md: 7, lg: 5 }}>
            <StatusDonutCard data={statusSlices} loading={loading} />
          </Grid>
        </Grid>

        {/* ── Activity + Invoices Row ── */}
        <Grid container spacing={2.5} alignItems="stretch">
          <Grid size={{ xs: 12, md: 5 }}>
            <ActivityFeedCard entries={activity} loading={loading} />
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <RecentInvoicesCard invoices={invoices} loading={loading} />
          </Grid>
        </Grid>

        {/* ── Quick Access CTA ── */}
        {!loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 }}>
            <Box
              sx={{
                mt: 1,
                p: { xs: 2.5, md: 3 },
                textAlign: 'center',
                borderRadius: 3,
                border: `1px solid ${alpha('#2563eb', 0.12)}`,
                bgcolor: alpha('#2563eb', 0.03),
              }}
            >
              <Typography fontWeight={700} gutterBottom>
                Boost your productivity
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 480, mx: 'auto' }}>
                Create invoices, manage inventory, and track performance — all from one dashboard.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
                <Button
                  variant="contained"
                  startIcon={<ReceiptIcon />}
                  onClick={() => router.push('/invoices/new')}
                  sx={{ borderRadius: 2, textTransform: 'none', px: 3, fontWeight: 600 }}
                >
                  Create Invoice
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/reports')}
                  sx={{ borderRadius: 2, textTransform: 'none', px: 3, fontWeight: 600 }}
                >
                  View Reports
                </Button>
              </Stack>
            </Box>
          </motion.div>
        )}
      </Stack>
    </VisuallyEnhancedDashboardLayout>
  );
}
