import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  ViewList as ViewIcon,
} from '@mui/icons-material';
import { Category } from '@/types/inventory';

type ViewMode = 'grid' | 'list';

interface CategoryListProps {
  categories: Category[];
  viewMode: ViewMode;
  loading: boolean;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onViewProducts: (category: Category) => void;
  onAnalytics: (category: Category) => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, category: Category) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  viewMode,
  loading,
  onEditCategory,
  onDeleteCategory,
  onViewProducts,
  onAnalytics,
  onMenuOpen,
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (viewMode === 'grid') {
    return (
      <Grid container spacing={3}>
        {categories.map((category) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={category.id}>
            <CategoryGridCard
              category={category}
              onEdit={onEditCategory}
              onDelete={onDeleteCategory}
              onViewProducts={onViewProducts}
              onAnalytics={onAnalytics}
              onMenuOpen={onMenuOpen}
            />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Box>
      {categories.map((category) => (
        <CategoryListItem
          key={category.id}
          category={category}
          onEdit={onEditCategory}
          onDelete={onDeleteCategory}
          onViewProducts={onViewProducts}
          onAnalytics={onAnalytics}
          onMenuOpen={onMenuOpen}
        />
      ))}
    </Box>
  );
};

interface CategoryGridCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onViewProducts: (category: Category) => void;
  onAnalytics: (category: Category) => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, category: Category) => void;
}

const CategoryGridCard: React.FC<CategoryGridCardProps> = ({
  category,
  onEdit,
  onDelete,
  onViewProducts,
  onAnalytics,
  onMenuOpen,
}) => (
  <Card
    sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: (theme) => theme.shadows[8],
      },
      opacity: category.isActive ? 1 : 0.7,
      border: category.isActive ? '1px solid' : '1px solid',
      borderColor: category.isActive ? 'divider' : 'warning.main'
    }}
  >
    <CardContent sx={{ flexGrow: 1, pb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
        <Box
          sx={{
            bgcolor: category.color || 'primary.main',
            width: 56,
            height: 56,
            mr: 2,
            boxShadow: 2,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <CategoryIcon />
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
            {category.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.3
          }}>
            {category.description || 'No description available'}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={(e) => onMenuOpen(e, category)}
          sx={{ ml: 1 }}
        >
          <MoreVertIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ textAlign: 'center', flex: 1 }}>
          <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
            {category.metadata?.totalProducts || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Products
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', flex: 1 }}>
          <Typography variant="h6" color="success.main" sx={{ fontWeight: 600 }}>
            ₹{((category.metadata?.totalValue || 0) / 1000).toFixed(1)}K
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Value
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', flex: 1 }}>
          <Typography variant="h6" color="info.main" sx={{ fontWeight: 600 }}>
            ₹{(category.metadata?.averagePrice || 0).toFixed(0)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Avg Price
          </Typography>
        </Box>
      </Box>

      {category.tags && category.tags.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {category.tags.slice(0, 3).map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
          ))}
          {category.tags.length > 3 && (
            <Chip label={`+${category.tags.length - 3}`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
          )}
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Chip
          label={category.isActive ? 'Active' : 'Inactive'}
          size="small"
          color={category.isActive ? 'success' : 'warning'}
          variant={category.isActive ? 'filled' : 'outlined'}
        />
        <Typography variant="caption" color="text.secondary">
          Created {new Date(category.createdAt).toLocaleDateString()}
        </Typography>
      </Box>
    </CardContent>

    <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
      <Button
        size="small"
        startIcon={<ViewIcon />}
        onClick={() => onViewProducts(category)}
        disabled={(category.metadata?.totalProducts || 0) === 0}
        sx={{ textTransform: 'none' }}
      >
        View Products
      </Button>
      <Box>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => onEdit(category)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Analytics">
          <IconButton size="small" onClick={() => onAnalytics(category)}>
            <TrendingUpIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            size="small"
            color="error"
            onClick={() => onDelete(category)}
            disabled={(category.metadata?.totalProducts || 0) > 0}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </CardActions>
  </Card>
);

interface CategoryListItemProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onViewProducts: (category: Category) => void;
  onAnalytics: (category: Category) => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, category: Category) => void;
}

const CategoryListItem: React.FC<CategoryListItemProps> = ({
  category,
  onEdit,
  onDelete,
  onViewProducts,
  onAnalytics,
  onMenuOpen,
}) => (
  <Box sx={{ mb: 1 }}>
    <Card
      sx={{
        p: 2,
        transition: 'all 0.2s',
        '&:hover': { boxShadow: 2 },
        opacity: category.isActive ? 1 : 0.7
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box
          sx={{
            bgcolor: category.color || 'primary.main',
            width: 48,
            height: 48,
            mr: 2,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <CategoryIcon />
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {category.name}
            </Typography>
            <Chip
              label={category.isActive ? 'Active' : 'Inactive'}
              size="small"
              color={category.isActive ? 'success' : 'warning'}
              variant={category.isActive ? 'filled' : 'outlined'}
            />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {category.description || 'No description'}
          </Typography>

          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <Typography variant="body2">
              <strong>{category.metadata?.totalProducts || 0}</strong> products
            </Typography>
            <Typography variant="body2">
              <strong>₹{((category.metadata?.totalValue || 0) / 1000).toFixed(1)}K</strong> value
            </Typography>
            <Typography variant="body2">
              <strong>₹{(category.metadata?.averagePrice || 0).toFixed(0)}</strong> avg price
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<ViewIcon />}
            onClick={() => onViewProducts(category)}
            disabled={(category.metadata?.totalProducts || 0) === 0}
            sx={{ textTransform: 'none' }}
          >
            View Products
          </Button>
          <Tooltip title="Edit">
            <IconButton onClick={() => onEdit(category)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Analytics">
            <IconButton onClick={() => onAnalytics(category)}>
              <TrendingUpIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              color="error"
              onClick={() => onDelete(category)}
              disabled={(category.metadata?.totalProducts || 0) > 0}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Card>
  </Box>
);

export default CategoryList;