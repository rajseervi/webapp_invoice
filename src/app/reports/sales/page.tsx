"use client";
import React from 'react';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';

// Import the original page component
import OriginalPageComponent from './original-page';

export default function ModernSalesReportsPage() {
  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Sales Reports"
        pageType="reports"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <OriginalPageComponent />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}
