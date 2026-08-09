"use client";
import React from 'react';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import { 
  Download as DownloadIcon,
  Print as PrintIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

// Import the enhanced page component
import EnhancedPageComponent from './enhanced-page';

export default function ModernProductManagementPage() {
  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Product Management"
        pageType="Advanced product management with analytics and bulk operations"
        enableVisualEffects={true}
        enableParticles={false}
        customQuickActions={[
          { icon: <AnalyticsIcon />, label: 'Analytics', onClick: () => {} },
          { icon: <DownloadIcon />, label: 'Export', onClick: () => {} },
          { icon: <PrintIcon />, label: 'Print', onClick: () => {} },
          { icon: <SettingsIcon />, label: 'Settings', onClick: () => {} },
        ]}
      >
        <EnhancedPageComponent />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}