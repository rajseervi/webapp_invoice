import { useState, useEffect, useMemo } from 'react';
import { Category } from '@/types/inventory';
import { categoryService } from '@/services/categoryService';

type ViewMode = 'grid' | 'list';
type FilterOption = 'all' | 'active' | 'inactive' | 'with-products' | 'empty';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

export function useCategories() {
  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuCategory, setMenuCategory] = useState<Category | null>(null);

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Computed values
  const filteredCategories = useMemo(() => {
    return categories.filter(category => {
      // Search filter
      const matchesSearch = !searchTerm ||
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status filter
      let matchesFilter = true;
      switch (filterOption) {
        case 'active':
          matchesFilter = category.isActive;
          break;
        case 'inactive':
          matchesFilter = !category.isActive;
          break;
        case 'with-products':
          matchesFilter = (category.metadata?.totalProducts || 0) > 0;
          break;
        case 'empty':
          matchesFilter = (category.metadata?.totalProducts || 0) === 0;
          break;
      }

      return matchesSearch && matchesFilter;
    });
  }, [categories, searchTerm, filterOption]);

  const stats = useMemo(() => {
    const totalCategories = categories.length;
    const activeCategories = categories.filter(c => c.isActive).length;
    const categoriesWithProducts = categories.filter(c => (c.metadata?.totalProducts || 0) > 0).length;
    const totalProducts = categories.reduce((sum, c) => sum + (c.metadata?.totalProducts || 0), 0);
    const totalValue = categories.reduce((sum, c) => sum + (c.metadata?.totalValue || 0), 0);

    return {
      totalCategories,
      activeCategories,
      categoriesWithProducts,
      totalProducts,
      totalValue
    };
  }, [categories]);

  // Effects
  useEffect(() => {
    loadCategories();
  }, []);

  // Actions
  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const categoriesData = await categoryService.getCategories({ includeInactive: true });
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setOpenDialog(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setOpenDialog(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!category.id) return;

    const hasProducts = (category.metadata?.totalProducts || 0) > 0;

    if (hasProducts) {
      setSnackbar({
        open: true,
        message: `Cannot delete category "${category.name}" because it has ${category.metadata?.totalProducts} products. Move or delete the products first.`,
        severity: 'error'
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      try {
        setLoading(true);
        await categoryService.deleteCategory(category.id);
        setSnackbar({
          open: true,
          message: `Category "${category.name}" deleted successfully.`,
          severity: 'success'
        });
        await loadCategories();
      } catch (err) {
        console.error('Error deleting category:', err);
        setSnackbar({
          open: true,
          message: 'Failed to delete category. Please try again.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFormSubmit = async (data: Omit<Category, 'id'>) => {
    try {
      setFormLoading(true);

      if (selectedCategory?.id) {
        await categoryService.updateCategory(selectedCategory.id, data);
        setSnackbar({
          open: true,
          message: `Category "${data.name}" updated successfully.`,
          severity: 'success'
        });
      } else {
        await categoryService.createCategory(data);
        setSnackbar({
          open: true,
          message: `Category "${data.name}" created successfully.`,
          severity: 'success'
        });
      }

      setOpenDialog(false);
      await loadCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      setSnackbar({
        open: true,
        message: 'Failed to save category. Please try again.',
        severity: 'error'
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, category: Category) => {
    setAnchorEl(event.currentTarget);
    setMenuCategory(category);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuCategory(null);
  };

  const handleViewProducts = (category: Category) => {
    window.location.href = `/products?category=${category.id}`;
    handleMenuClose();
  };

  const handleAnalytics = (category: Category) => {
    window.location.href = `/categories/${category.id}/analytics`;
    handleMenuClose();
  };

  const handleExport = async () => {
    try {
      const exportData = await categoryService.exportCategories();
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `categories-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSnackbar({
        open: true,
        message: 'Categories exported successfully.',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to export categories.',
        severity: 'error'
      });
    }
  };

  return {
    // State
    categories,
    loading,
    error,
    searchTerm,
    filterOption,
    viewMode,
    openDialog,
    selectedCategory,
    formLoading,
    anchorEl,
    menuCategory,
    snackbar,

    // Computed
    filteredCategories,
    stats,

    // Actions
    setSearchTerm,
    setFilterOption,
    setViewMode,
    setOpenDialog,
    setSelectedCategory,
    setAnchorEl,
    setMenuCategory,
    setSnackbar,
    loadCategories,
    handleAddCategory,
    handleEditCategory,
    handleDeleteCategory,
    handleFormSubmit,
    handleMenuOpen,
    handleMenuClose,
    handleViewProducts,
    handleAnalytics,
    handleExport,
  };
}