'use client';
import React, { useEffect, useState, use } from 'react';
import { Container, Typography, CircularProgress, Box, Snackbar, Alert } from '@mui/material';
import { useRouter } from 'next/navigation'; 
import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';
import EnhancedProductForm from '@/app/products/components/EnhancedProductForm';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import { enhancedProductService } from '@/services/enhancedProductService';
import type { EnhancedProduct } from '@/app/products/components/EnhancedProductList';

export default function EditEnhancedProduct({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [product, setProduct] = useState<EnhancedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProduct();
  }, []);

  const loadProduct = async () => {
    try {
      // Replace with a service call to get an enhanced product
      const data = await enhancedProductService.getEnhancedProduct(resolvedParams.id);
      setProduct(data as any);
    } catch (error) {
      setError('Error loading product');
      setTimeout(() => router.push('/products/enhanced'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: Omit<EnhancedProduct, 'id' | 'createdAt' | 'updatedAt'>) => {
    setPendingData(data);
    setShowConfirmation(true);
  };

  const handleConfirmUpdate = async () => {
    try {
      // Replace with a service call to update an enhanced product
      await enhancedProductService.updateEnhancedProduct(resolvedParams.id, pendingData);
      router.push('/products/enhanced');
    } catch (error) {
      setError('Error updating product');
    }
    setShowConfirmation(false);
  };

  if (loading) {
    return (
      <ImprovedDashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </ImprovedDashboardLayout>
    );
  }

  return (
    <ImprovedDashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 4 }}>Edit Enhanced Product</Typography>
        {product && (
          <EnhancedProductForm
            initialData={product}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/products/enhanced')}
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
    </ImprovedDashboardLayout>
  );
}