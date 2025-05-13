'use client';
import React from 'react';
import { Container, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/Layout/Layout';
 
import ProductForm from '@/components/ProductForm';
import { productService } from '@/services/productService';
import type { Product } from '@/types/inventory';

export default function NewProduct() {
  const router = useRouter();

  const handleSubmit = async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await productService.createProduct(data);
      router.push('/inventory/products');
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 4 }}>Add New Product</Typography>
        <ProductForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/inventory/products')}
        />
      </Container>
    </DashboardLayout>
  );
}