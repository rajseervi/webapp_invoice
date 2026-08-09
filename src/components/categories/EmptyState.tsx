import React from 'react';
import {
  Paper,
  Typography,
  Button,
  Box,
} from '@mui/material';
import {
  Category as CategoryIcon,
  Add as AddIcon,
} from '@mui/icons-material';

type FilterOption = 'all' | 'active' | 'inactive' | 'with-products' | 'empty';

interface EmptyStateProps {
  searchTerm: string;
  filterOption: FilterOption;
  onCreateCategory: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  searchTerm,
  filterOption,
  onCreateCategory,
}) => {
  const getMessage = () => {
    if (searchTerm) {
      return {
        title: 'No categories found',
        description: 'Try adjusting your search terms to find what you\'re looking for.',
        showButton: false,
      };
    }

    switch (filterOption) {
      case 'active':
        return {
          title: 'No active categories',
          description: 'All your categories are currently inactive. Create a new category or activate existing ones.',
          showButton: true,
        };
      case 'inactive':
        return {
          title: 'No inactive categories',
          description: 'All your categories are currently active. Great job keeping them organized!',
          showButton: false,
        };
      case 'with-products':
        return {
          title: 'No categories with products',
          description: 'None of your categories contain products yet. Add products to your categories to see them here.',
          showButton: false,
        };
      case 'empty':
        return {
          title: 'No empty categories',
          description: 'All your categories have products. Consider creating more categories for better organization.',
          showButton: true,
        };
      default:
        return {
          title: 'No categories found',
          description: 'Get started by creating your first category to organize your products.',
          showButton: true,
        };
    }
  };

  const { title, description, showButton } = getMessage();

  return (
    <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
      <Box
        sx={{
          bgcolor: 'primary.main',
          width: 80,
          height: 80,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 3
        }}
      >
        <CategoryIcon sx={{ fontSize: 40, color: 'primary.contrastText' }} />
      </Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {description}
      </Typography>
      {showButton && (
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={onCreateCategory}
          sx={{ px: 4, py: 1.5 }}
        >
          Create First Category
        </Button>
      )}
    </Paper>
  );
};

export default EmptyState;