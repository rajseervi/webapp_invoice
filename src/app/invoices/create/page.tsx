"use client";
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import React from 'react';
import { Box } from '@mui/material';
import EnhancedInvoiceCreationImproved from '@/components/invoices/EnhancedInvoiceCreationImproved';

function CreateInvoicePage() {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mt: 2, mb: 4 }}>
        <EnhancedInvoiceCreationImproved />
      </Box>
    </Container>
  );
}

export default function ModernPagePage() {
  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Page"
        pageType="invoice"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <CreateInvoicePage />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}