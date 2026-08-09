'use client';
import React, { useEffect, useState, use } from 'react';
import { Container, Typography, CircularProgress, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';
import CategoryForm from '@/components/CategoryForm';
import { categoryService } from '@/services/categoryService';
import type { Category } from '@/types/inventory';

// Update the interface to match Next.js PageProps expectations
interface EditCategoryProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function EditCategory({ params }: EditCategoryProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategory();
  }, []);

  const loadCategory = async () => {
    try {
      const data = await categoryService.getCategory(resolvedParams.id);
      setCategory(data);
    } catch (error) {
      console.error('Error loading category:', error);
      router.push('/categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: Omit<Category, 'id'>) => {
    try {
      await categoryService.updateCategory(resolvedParams.id, data);
      router.push('/categories');
    } catch (error) {
      console.error('Error updating category:', error);
    }
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
        <Typography variant="h4" sx={{ mb: 4 }}>Edit Category</Typography>
        {category && (
          <CategoryForm
            initialData={category}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/categories')}
          />
        )}
      </Container>
    </ImprovedDashboardLayout>
  );
}