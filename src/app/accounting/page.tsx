"use client";
import React from 'react';
import ModernDashboardLayout from '@/components/ModernLayout/ModernDashboardLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import { Button, Stack } from '@mui/material';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import { 
  Add as AddIcon, 
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

// Import the original page component
import OriginalPageComponent from './original-page';

export default function ModernAccountingPage() {
  return (
    <ModernThemeProvider>
     <VisuallyEnhancedDashboardLayout
        title="Accounting"
        pageType="reports"
        enableVisualEffects={true}
        enableParticles={false}
        customQuickActions={[
          { icon: <DownloadIcon />, label: 'Export', onClick: () => {} },
          { icon: <PrintIcon />, label: 'Print', onClick: () => {} },
        ]}
      >
        <OriginalPageComponent />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}