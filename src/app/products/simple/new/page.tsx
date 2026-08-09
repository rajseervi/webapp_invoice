"use client";
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import React from 'react';
import SimpleProductForm from '@/components/products/SimpleProductForm';

function NewSimpleProductPage() {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <SimpleProductForm />
    </Container>
  );
}

export default function ModernNewPage() {
  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="New"
        pageType="product"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <NewSimpleProductPage />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}