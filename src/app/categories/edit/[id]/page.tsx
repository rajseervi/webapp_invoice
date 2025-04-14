'use client';
import React, { useEffect, useState } from 'react';
import { Container, Typography, CircularProgress, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/Layout/Layout';
import CategoryForm from '@/components/CategoryForm';
import { categoryService } from '@/services/categoryService';
import type { Category } from '@/types/inventory';

export default function EditCategory({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategory();
  }, []);

  const loadCategory = async () => {
    try {
      const data = await categoryService.getCategory(params.id);
      setCategory(data);
    } catch (error) {
      console.error('Error loading category:', error);
      router.push('/inventory/categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: Omit<Category, 'id'>) => {
    try {
      await categoryService.updateCategory(params.id, data);
      router.push('/inventory/categories');
    } catch (error) {
      console.error('Error updating category:', error);
    }
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
        <Typography variant="h4" sx={{ mb: 4 }}>Edit Category</Typography>
        {category && (
          <CategoryForm
            initialData={category}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/inventory/categories')}
          />
        )}
      </Container>
    </DashboardLayout>
  );
}