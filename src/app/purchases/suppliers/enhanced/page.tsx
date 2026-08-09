"use client";
import React, { useState } from 'react';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import EnhancedSupplierForm from '@/components/Suppliers/EnhancedSupplierForm';
import { useRouter } from 'next/navigation';

export default function EnhancedSupplierPage() {
  const router = useRouter();

  const handleSave = (supplierId: string) => {
    router.push('/purchases');
  };

  const handleCancel = () => {
    router.push('/purchases');
  };

  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Add Enhanced Supplier"
        pageType="purchase"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <EnhancedSupplierForm
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}