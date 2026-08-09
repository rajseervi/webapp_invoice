"use client";
import React, { useState } from 'react';
import ModernDashboardLayout from '@/components/ModernLayout/ModernDashboardLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import { 
  Button, 
  Stack, 
  Tabs, 
  Tab, 
  Box, 
  Badge,
  Tooltip 
} from '@mui/material';
import { 
  Add as AddIcon, 
  Download as DownloadIcon,
  Dashboard as DashboardIcon,
  Warning as WarningIcon,
  Analytics as AnalyticsIcon,
  SwapHoriz as SwapHorizIcon,
  Notifications as NotificationsIcon,
  ShoppingCart as ShoppingCartIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';

import ImprovedInventoryManager from '@/components/Inventory/ImprovedInventoryManager';
import EnhancedStockAlertsDashboard from '@/components/Inventory/EnhancedStockAlertsDashboard';
import AdvancedInventoryAnalytics from '@/components/Inventory/AdvancedInventoryAnalytics';
import BulkStockOperations from '@/components/Inventory/BulkStockOperations';
import ReorderManagementDashboard from '@/components/Inventory/ReorderManagementDashboard';
import InventoryReportsDashboard from '@/components/Inventory/InventoryReportsDashboard';

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
      id={`inventory-tabpanel-${index}`}
      aria-labelledby={`inventory-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function EnhancedInventoryPage() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      {/* Enhanced Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            icon={<DashboardIcon />} 
            label="Inventory Dashboard" 
            iconPosition="start"
          />
          <Tab 
            icon={
              <Badge badgeContent={0} color="error">
                <NotificationsIcon />
              </Badge>
            } 
            label="Stock Alerts" 
            iconPosition="start"
          />
          <Tab 
            icon={<AnalyticsIcon />} 
            label="Analytics" 
            iconPosition="start"
          />
          <Tab 
            icon={<SwapHorizIcon />} 
            label="Bulk Operations" 
            iconPosition="start"
          />
          <Tab 
            icon={<ShoppingCartIcon />} 
            label="Reorder Management" 
            iconPosition="start"
          />
          <Tab 
            icon={<AssessmentIcon />} 
            label="Reports" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <ImprovedInventoryManager />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <EnhancedStockAlertsDashboard />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <AdvancedInventoryAnalytics />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <BulkStockOperations />
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <ReorderManagementDashboard />
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        <InventoryReportsDashboard />
      </TabPanel>
    </Box>
  );
}

export default function ModernInventoryPage() {
  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Enhanced Inventory Management"
        subtitle="Advanced stock tracking, alerts, and analytics"
        showBreadcrumbs={true}
        showSearch={true}
        showQuickActions={true}
        pageHeaderActions={
          <Stack direction="row" spacing={2}>
            <Tooltip title="Export inventory data">
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                sx={{ borderRadius: 2 }}
              >
                Export
              </Button>
            </Tooltip>
            <Tooltip title="Add new product">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ borderRadius: 2 }}
                href="/products/new"
              >
                Add Product
              </Button>
            </Tooltip>
          </Stack>
        }
      >
        <EnhancedInventoryPage />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}