"use client";
import React, { useState, useEffect } from 'react';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Button,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Inventory as InventoryIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  History as HistoryIcon,
  Add as AddIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Store as StoreIcon
} from '@mui/icons-material';

import { useRouter } from 'next/navigation';

import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import PageHeader from '@/components/PageHeader/PageHeader';
import PurchaseOrdersList from './components/PurchaseOrdersList';
import SuppliersList from './components/SuppliersList';
import PurchaseStatistics from './components/PurchaseStatistics';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`purchases-tabpanel-${index}`}
      aria-labelledby={`purchases-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 1.5, md: 3 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `purchases-tab-${index}`,
    'aria-controls': `purchases-tabpanel-${index}`,
  };
}

function PurchasesPage() {
  const theme = useTheme();
  const router = useRouter();
  const { userId, userRole } = useCurrentUser();
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalAmount: 0,
    pendingOrders: 0,
    receivedOrders: 0,
    totalSuppliers: 0
  });

  // Menu states
  const [purchaseAnchorEl, setPurchaseAnchorEl] = useState<null | HTMLElement>(null);
  const [supplierAnchorEl, setSupplierAnchorEl] = useState<null | HTMLElement>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreatePurchaseOrder = () => {
    router.push('/purchases/enhanced-entry');
  };

  const handleCreateSupplier = () => {
    router.push('/purchases/suppliers/enhanced');
  };

  const handleCreateLegacyPurchaseOrder = () => {
    router.push('/purchases/new');
  };

  const handleCreateLegacySupplier = () => {
    router.push('/purchases/suppliers/new');
  };

  const createStatCard = (
    label: string,
    value: string,
    icon: React.ReactNode,
    accent: 'primary' | 'success' | 'warning' | 'info' | 'secondary'
  ) => {
    const accentColors: Record<string, { bg: string; color: string }> = {
      primary: { bg: alpha(theme.palette.primary.main, 0.12), color: theme.palette.primary.main },
      success: { bg: alpha(theme.palette.success.main, 0.12), color: theme.palette.success.main },
      warning: { bg: alpha(theme.palette.warning.main, 0.14), color: theme.palette.warning.dark },
      info: { bg: alpha(theme.palette.info.main, 0.12), color: theme.palette.info.main },
      secondary: { bg: alpha(theme.palette.secondary.main, 0.12), color: theme.palette.secondary.main }
    };
    const accentStyle = accentColors[accent];

    return (
      <Card
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
          height: '100%',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: `0 6px 20px ${alpha(theme.palette.common.black, 0.08)}`,
            transform: 'translateY(-2px)'
          }
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.02em' }}>
                {label}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, fontSize: { xs: '1.5rem', md: '1.75rem' }, lineHeight: 1.2, wordBreak: 'break-word' }}>
                {value}
              </Typography>
            </Box>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                bgcolor: accentStyle.bg,
                color: accentStyle.color
              }}
            >
              {icon}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <PageHeader
        title="Purchase Management"
        subtitle="Manage purchase orders, suppliers, and inventory procurement"
        action={
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<PeopleIcon />}
              endIcon={<ExpandMoreIcon />}
              onClick={(e) => setSupplierAnchorEl(e.currentTarget)}
            >
              Add Supplier
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              endIcon={<ExpandMoreIcon />}
              onClick={(e) => setPurchaseAnchorEl(e.currentTarget)}
            >
              New Purchase Order
            </Button>

            {/* Purchase Order Menu */}
            <Menu
              anchorEl={purchaseAnchorEl}
              open={Boolean(purchaseAnchorEl)}
              onClose={() => setPurchaseAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => {
                handleCreatePurchaseOrder();
                setPurchaseAnchorEl(null);
              }}>
                <ListItemIcon>
                  <StarIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Enhanced Purchase Entry"
                  secondary="Modern interface with auto stock updates"
                />
              </MenuItem>
              <MenuItem onClick={() => {
                handleCreateLegacyPurchaseOrder();
                setPurchaseAnchorEl(null);
              }}>
                <ListItemIcon>
                  <HistoryIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Legacy Purchase Order"
                  secondary="Classic purchase order form"
                />
              </MenuItem>
            </Menu>

            {/* Supplier Menu */}
            <Menu
              anchorEl={supplierAnchorEl}
              open={Boolean(supplierAnchorEl)}
              onClose={() => setSupplierAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => {
                handleCreateSupplier();
                setSupplierAnchorEl(null);
              }}>
                <ListItemIcon>
                  <StarIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Enhanced Supplier"
                  secondary="Advanced supplier with all features"
                />
              </MenuItem>
              <MenuItem onClick={() => {
                handleCreateLegacySupplier();
                setSupplierAnchorEl(null);
              }}>
                <ListItemIcon>
                  <HistoryIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Legacy Supplier"
                  secondary="Basic supplier form"
                />
              </MenuItem>
            </Menu>
          </Box>
        }
      />

      {/* Statistics Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          {createStatCard('Total Orders', String(stats.totalPurchases), <ShoppingCartIcon />, 'primary')}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          {createStatCard('Total Amount', `₹${(stats.totalAmount || 0).toLocaleString('en-IN')}`, <MoneyIcon />, 'success')}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          {createStatCard('Pending Orders', String(stats.pendingOrders), <ScheduleIcon />, 'warning')}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          {createStatCard('Received Orders', String(stats.receivedOrders), <CheckCircleIcon />, 'info')}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          {createStatCard('Suppliers', String(stats.totalSuppliers), <StoreIcon />, 'secondary')}
        </Grid>
      </Grid>

      <Paper
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
          overflow: 'hidden'
        }}
      >
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: { xs: 1, md: 2 }, bgcolor: alpha(theme.palette.background.default, 0.4) }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="purchases tabs" variant="scrollable" scrollButtons="auto">
            <Tab
              label="Purchase Orders"
              icon={<ShoppingCartIcon />}
              iconPosition="start"
              sx={{ minHeight: 56 }}
              {...a11yProps(0)}
            />
            <Tab
              label="Suppliers"
              icon={<PeopleIcon />}
              iconPosition="start"
              sx={{ minHeight: 56 }}
              {...a11yProps(1)}
            />
            <Tab
              label="Analytics"
              icon={<AssessmentIcon />}
              iconPosition="start"
              sx={{ minHeight: 56 }}
              {...a11yProps(2)}
            />
          </Tabs>
        </Box>

        {/* Purchase Orders Tab */}
        <TabPanel value={tabValue} index={0}>
          <PurchaseOrdersList onStatsUpdate={setStats} />
        </TabPanel>

        {/* Suppliers Tab */}
        <TabPanel value={tabValue} index={1}>
          <SuppliersList />
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={2}>
          <PurchaseStatistics />
        </TabPanel>
      </Paper>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add purchase order"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={handleCreatePurchaseOrder}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
}

export default function ModernPurchasesPage() {
  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Purchase Management"
        pageType="orders"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <PurchasesPage />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}
