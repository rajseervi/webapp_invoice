"use client";
import React from 'react';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
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

export default function ModernRegularInvoicesPage() {
  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Regular Invoices"
        pageType="invoices"
        enableVisualEffects={true}
        enableParticles={false}
        customQuickActions={[
          { icon: <DownloadIcon />, label: 'Export', onClick: () => {}, },
          { icon: <AddIcon />, label: 'Add New', onClick: () => {}, },
        ]}
      >
        <OriginalPageComponent />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}