'use client';
import React from 'react';
import { Container, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/Layout/Layout';
import CategoryForm from '@/components/CategoryForm';
import { categoryService } from '@/services/categoryService';
import type { Category } from '@/types/inventory';

export default function NewCategory() {
  const router = useRouter();

  const handleSubmit = async (data: Omit<Category, 'id'>) => {
    try {
      await categoryService.createCategory(data);
      router.push('/inventory/categories');
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 4 }}>Add New Category</Typography>
        <CategoryForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/inventory/categories')}
        />
      </Container>
    </DashboardLayout>
  );
}