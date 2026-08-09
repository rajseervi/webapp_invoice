"use client";
import React from 'react';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import EnhancedSupplierForm from '@/components/Suppliers/EnhancedSupplierForm';
import { useRouter } from 'next/navigation';

export default function NewSupplierPage() {
  const router = useRouter();

  const handleSave = (supplierId: string) => {
    router.push('/suppliers');
  };

  const handleCancel = () => {
    router.push('/suppliers');
  };

  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Add New Supplier"
        pageType="supplier"
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