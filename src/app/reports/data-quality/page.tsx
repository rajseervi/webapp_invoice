"use client";
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import DataQualityDashboard from '@/components/Reports/DataQualityDashboard';

function DataQualityPage() {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <DataQualityDashboard />
    </Container>
  );
}

export default function ModernPagePage() {
  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Page"
        pageType="reports"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <DataQualityPage />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}