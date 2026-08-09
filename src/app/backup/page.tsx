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

export default function ModernBackupRestorePage() {
  return (
    <ModernThemeProvider>
      <ModernDashboardLayout
        title="Backup & Restore"
        subtitle="Backup and restore your data"
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
              variant="outlined"
              startIcon={<SettingsIcon />}
              sx={{ borderRadius: 2 }}
            >
              Settings
            </Button>
          </Stack>
        }
      >
        <OriginalPageComponent />
      </ModernDashboardLayout>
    </ModernThemeProvider>
  );
}