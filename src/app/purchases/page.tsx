"use client";
import React, { useState, useEffect } from 'react';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import { Button, Stack } from '@mui/material';
import { Add as AddIcon, Download as DownloadIcon } from '@mui/icons-material';

import { useRouter } from 'next/navigation';

import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import PageHeader from '@/components/PageHeader/PageHeader';
import PurchaseOrdersList from './components/PurchaseOrdersList';
import SuppliersList from './components/SuppliersList';
import PurchaseStatistics from './components/PurchaseStatistics';
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
  ListItemText
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Inventory as InventoryIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  History as HistoryIcon
} from '@mui/icons-material';
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
        <Box sx={{ p: 3 }}>
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

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <PageHeader
          title="Purchase Management"
          subtitle="Manage purchase orders, suppliers, and inventory procurement"
          actions={
            <Box sx={{ display: 'flex', gap: 2 }}>
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
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Orders
                    </Typography>
                    <Typography variant="h4">
                      {stats.totalPurchases}
                    </Typography>
                  </Box>
                  <ShoppingCartIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Amount
                    </Typography>
                    <Typography variant="h4">
                      ₹{stats.totalAmount.toFixed(0)}
                    </Typography>
                  </Box>
                  <AssessmentIcon color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Pending Orders
                    </Typography>
                    <Typography variant="h4">
                      {stats.pendingOrders}
                    </Typography>
                  </Box>
                  <LocalShippingIcon color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Received Orders
                    </Typography>
                    <Typography variant="h4">
                      {stats.receivedOrders}
                    </Typography>
                  </Box>
                  <InventoryIcon color="info" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Suppliers
                    </Typography>
                    <Typography variant="h4">
                      {stats.totalSuppliers}
                    </Typography>
                  </Box>
                  <PeopleIcon color="secondary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper sx={{ p: 0 }}>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="purchases tabs">
              <Tab 
                label="Purchase Orders" 
                icon={<ShoppingCartIcon />} 
                iconPosition="start" 
                {...a11yProps(0)} 
              />
              <Tab 
                label="Suppliers" 
                icon={<PeopleIcon />} 
                iconPosition="start" 
                {...a11yProps(1)} 
              />
              <Tab 
                label="Analytics" 
                icon={<AssessmentIcon />} 
                iconPosition="start" 
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
        pageType="purchase"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <PurchasesPage />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}