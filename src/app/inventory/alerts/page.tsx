"use client";
import React from 'react';
import ModernDashboardLayout from '@/components/ModernLayout/ModernDashboardLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import { Button, Stack } from '@mui/material';
import { 
  Add as AddIcon, 
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  NotificationsActive as NotificationsActiveIcon
} from '@mui/icons-material';

import EnhancedStockAlertsDashboard from '@/components/Inventory/EnhancedStockAlertsDashboard';

export default function ModernInventoryAlertsPage() {
  return (
    <ModernThemeProvider>
      <ModernDashboardLayout
        title="Enhanced Stock Alerts"
        subtitle="Advanced inventory alerts and monitoring system"
        showBreadcrumbs={true}
        showSearch={true}
        showQuickActions={true}
        pageHeaderActions={
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{ borderRadius: 2 }}
            >
              Export Alerts
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              sx={{ borderRadius: 2 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<NotificationsActiveIcon />}
              sx={{ borderRadius: 2 }}
            >
              Generate Alerts
            </Button>
          </Stack>
        }
      >
        <EnhancedStockAlertsDashboard />
      </ModernDashboardLayout>
    </ModernThemeProvider>
  );
}