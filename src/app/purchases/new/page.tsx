"use client";
import React from 'react';
import ModernDashboardLayout from '@/components/ModernLayout/ModernDashboardLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import { Button, Stack } from '@mui/material';
import { 
  Add as AddIcon, 
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

// Import the original page component
import OriginalPageComponent from './original-page';

export default function ModernCreatePurchaseOrderPage() {
  return (
    <ModernThemeProvider>
      <ModernDashboardLayout
        title="Create Purchase Order"
        subtitle="Create a new purchase order"
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
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ borderRadius: 2 }}
            >
              New Order
            </Button>
          </Stack>
        }
      >
        <OriginalPageComponent />
      </ModernDashboardLayout>
    </ModernThemeProvider>
  );
}