"use client";
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import React from 'react';
import SimpleInvoiceForm from '@/components/invoices/SimpleInvoiceForm';

function NewSimpleInvoicePage() {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <SimpleInvoiceForm />
    </Container>
  );
}

export default function ModernNewPage() {
  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="New"
        pageType="invoice"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <NewSimpleInvoicePage />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}