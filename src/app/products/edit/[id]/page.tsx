'use client';
import React, { useEffect, useState } from 'react';
import { Container, Typography, CircularProgress, Box, Snackbar, Alert } from '@mui/material';
import { useRouter } from 'next/navigation'; 
import DashboardLayout from '@/app/components/Layout/Layout';
import ProductForm from '@/components/ProductForm';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import { productService } from '@/services/productService';
import type { Product } from '@/types/inventory';

export default function EditProduct({ params }: { params: { id: string } }) {
  const router = useRouter();
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
      const data = await productService.getProduct(params.id);
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
      await productService.updateProduct(params.id, pendingData);
      router.push('/inventory/products');
    } catch (error) {
      setError('Error updating product');
    }
    setShowConfirmation(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 4 }}>Edit Product</Typography>
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
    </DashboardLayout>
  );
}