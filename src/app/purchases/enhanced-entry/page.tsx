"use client";
import React from 'react';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import EnhancedPurchaseEntryForm from '@/components/PurchaseEntry/EnhancedPurchaseEntryForm';
import { useRouter } from 'next/navigation';

export default function EnhancedPurchaseEntryPage() {
  const router = useRouter();

  const handleSuccess = (purchaseOrderId: string) => {
    router.push(`/purchases/${purchaseOrderId}`);
  };

  const handleCancel = () => {
    router.push('/purchases');
  };

  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Enhanced Purchase Entry"
        pageType="purchase"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <EnhancedPurchaseEntryForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}