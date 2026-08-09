"use client";
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Alert,
  Snackbar,
  CircularProgress,
  Button
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import PageHeader from '@/components/PageHeader/PageHeader';
import { BulkProductForm } from '@/components/products/BulkProductForm';
import { productService } from '@/services/productService';
import { Product } from '@/types/inventory';

function NewMultipleProductsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (productsData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await productService.importProducts(productsData);
      if (result.failed > 0) {
        setError(`Successfully added ${result.success} products, but ${result.failed} failed: ${result.errors.join(', ')}`);
      } else {
        setSuccess(`Successfully added ${result.success} products!`);
      }
      setTimeout(() => {
        router.push('/products');
      }, 2000);
    } catch (err: any) {
      console.error("Error adding multiple products:", err);
      setError(err.message || "Failed to add multiple products.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <PageHeader
          title="Add Multiple Products"
          subtitle="Quickly add several products at once"
          icon={<AddIcon />}
          buttonText="Back to Products"
          onButtonClick={() => router.push('/products')}
        />

        <BulkProductForm
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
          success={success}
          onCloseSnackbar={handleCloseSnackbar}
        />

        <Snackbar open={!!success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>
        <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </Container>
  );
}


export default function ModernNewmultiplePage() {
  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Newmultiple"
        pageType="product"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <NewMultipleProductsPage />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}