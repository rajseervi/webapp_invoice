"use client";
import React from 'react';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import { useMediaQuery, useTheme } from '@mui/material';
import MobileInvoiceForm from '../components/MobileInvoiceForm';
import OriginalPageComponent from './original-page';

export default function ModernCreateInvoicePage() {
  const router = require('next/navigation').useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSuccess = (invoiceId?: string) => {
    if (invoiceId) {
      router.push(`/invoices/${invoiceId}`);
    } else {
      router.push('/invoices');
    }
  };

  return (
    <VisuallyEnhancedDashboardLayout
      title="Create Invoice"
      pageType="invoices"
      enableVisualEffects={!isMobile}
      enableParticles={false}
      maxWidth={isMobile ? false : undefined}
      disableGutters={isMobile ? true : false}
    >
      {isMobile ? (
        <MobileInvoiceForm onSuccess={handleSuccess} />
      ) : (
        <OriginalPageComponent />
      )}
    </VisuallyEnhancedDashboardLayout>
  );
}
