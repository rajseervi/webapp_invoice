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

export default function ModernAddPartyPage() {
  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Add Party"
        pageType="parties"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <OriginalPageComponent />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}