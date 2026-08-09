"use client";
import React from 'react';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';

// Import the original page component
import OriginalPageComponent from './original-page';

export default function CombinedReportPage() {
  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Invoice, Product & Party Reports"
        subtitle="Comprehensive analytics with advanced filters"
        pageType="reports"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <OriginalPageComponent />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}
