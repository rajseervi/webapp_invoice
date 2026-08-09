'use client';

import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import React, { useEffect, useState, use } from 'react';
import { Container, Typography, CircularProgress, Box, Snackbar, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import ProductForm from '@/components/ProductForm';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import { productService } from '@/services/productService';
import type { Product } from '@/types/inventory';

function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProduct();
  }, []);

  const loadProduct = async () => {
    try {
      const data = await productService.getProduct(resolvedParams.id);
      setProduct(data);
    } catch (error) {
      setError('Error loading product');
      setTimeout(() => router.push('/inventory/products'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const validateProduct = (data: any) => {
    if (data.price < 0) return 'Price cannot be negative';
    if (data.quantity < 0) return 'Quantity cannot be negative';
    if (data.reorderPoint < 0) return 'Reorder point cannot be negative';
    if (!data.sku.trim()) return 'SKU is required';
    if (!data.name.trim()) return 'Name is required';
    if (!data.categoryId) return 'Category is required';
    return null;
  };

  const handleSubmit = async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const validationError = validateProduct(data);
    if (validationError) {
      setError(validationError);
      return;
    }

    setPendingData(data);
    setShowConfirmation(true);
  };

  const handleConfirmUpdate = async () => {
    try {
      await productService.updateProduct(resolvedParams.id, pendingData);
      router.push('/inventory/products');
    } catch (error) {
      setError('Error updating product');
    }
    setShowConfirmation(false);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>Edit Product</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Update your product information. GST and tax calculations are handled automatically.
        </Typography>
        {product && (
          <ProductForm
            initialData={product}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/inventory/products')}
          />
        )}

        <ConfirmationDialog
          open={showConfirmation}
          title="Confirm Update"
          message="Are you sure you want to update this product?"
          onConfirm={handleConfirmUpdate}
          onCancel={() => setShowConfirmation(false)}
        />

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </Container>
  );
}

export default function ModernIdPage() {
  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Id"
        pageType="product"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <EditProduct />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}