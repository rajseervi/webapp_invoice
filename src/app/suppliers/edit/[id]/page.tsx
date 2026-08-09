"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import EnhancedSupplierForm from '@/components/Suppliers/EnhancedSupplierForm';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { EnhancedSupplier } from '@/types/enhancedPurchase';
import EnhancedSupplierService from '@/services/enhancedSupplierService';

export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const { userId } = useCurrentUser();
  const [supplier, setSupplier] = useState<EnhancedSupplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supplierId = params.id as string;

  useEffect(() => {
    if (supplierId && userId) {
      loadSupplier();
    }
  }, [supplierId, userId]);

  const loadSupplier = async () => {
    try {
      setLoading(true);
      const supplierData = await EnhancedSupplierService.getSupplier(supplierId);
      setSupplier(supplierData);
    } catch (err) {
      console.error('Error loading supplier:', err);
      setError('Failed to load supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (supplierId: string) => {
    router.push('/suppliers');
  };

  const handleCancel = () => {
    router.push('/suppliers');
  };

  if (loading) {
    return (
      <ModernThemeProvider>
        <VisuallyEnhancedDashboardLayout
          title="Edit Supplier"
          pageType="supplier"
          enableVisualEffects={true}
          enableParticles={false}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Loading supplier...
            </Typography>
          </Box>
        </VisuallyEnhancedDashboardLayout>
      </ModernThemeProvider>
    );
  }

  if (error || !supplier) {
    return (
      <ModernThemeProvider>
        <VisuallyEnhancedDashboardLayout
          title="Edit Supplier"
          pageType="supplier"
          enableVisualEffects={true}
          enableParticles={false}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <Typography color="error">
              {error || 'Supplier not found'}
            </Typography>
          </Box>
        </VisuallyEnhancedDashboardLayout>
      </ModernThemeProvider>
    );
  }

  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Edit Supplier"
        pageType="supplier"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <EnhancedSupplierForm
          supplier={supplier}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}