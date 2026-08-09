"use client";
import React, { useState, useMemo, memo } from 'react';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  IconButton,
  Paper,
  Fade,
  Grow,
  Stack,
  Badge,
  Tooltip,
  Fab,
  Skeleton,
  Checkbox,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  ViewList as ListIcon,
  ViewModule as GridIcon,
  Refresh as RefreshIcon,
  SelectAll as SelectAllIcon,
  Clear as ClearIcon,
  GetApp as ExportIcon,
} from '@mui/icons-material';

import { useCategories } from '@/hooks/useCategories';
import SimplifiedCategoryDialog from '@/components/categories/SimplifiedCategoryDialog';
import CategoryStatsCards from '@/components/categories/CategoryStatsCards';

const CategoriesPage = memo(function CategoriesPage() {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'products' | 'value'>('name');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);

  const {
    categories,
    loading,
    searchTerm,
    openDialog,
    selectedCategory,
    formLoading,
    snackbar,
    filteredCategories,
    setSearchTerm,
    setOpenDialog,
    setSnackbar,
    handleAddCategory,
    handleEditCategory,
    handleDeleteCategory,
    handleFormSubmit,
    handleMenuOpen,
  } = useCategories();

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCategories.length === sortedCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(sortedCategories.map(c => c.id));
    }
  };

  const handleBulkDelete = async () => {
    for (const categoryId of selectedCategories) {
      await handleDeleteCategory({ id: categoryId } as any);
    }
    setSelectedCategories([]);
    setBulkMode(false);
  };

  const handleBulkActivate = async () => {
    // This would need to be implemented in the hook
    // For now, just clear selection
    setSelectedCategories([]);
    setBulkMode(false);
  };

  const handleBulkDeactivate = async () => {
    // This would need to be implemented in the hook
    // For now, just clear selection
    setSelectedCategories([]);
    setBulkMode(false);
  };

  const sortedCategories = useMemo(() => {
    return [...filteredCategories].sort((a, b) => {
      switch (sortBy) {
        case 'products':
          return (b.metadata?.totalProducts || 0) - (a.metadata?.totalProducts || 0);
        case 'value':
          return (b.metadata?.totalValue || 0) - (a.metadata?.totalValue || 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [filteredCategories, sortBy]);

  const stats = useMemo(() => ({
    total: categories.length,
    active: categories.filter(c => c.isActive).length,
    products: categories.reduce((sum, c) => sum + (c.metadata?.totalProducts || 0), 0),
    value: categories.reduce((sum, c) => sum + (c.metadata?.totalValue || 0), 0),
  }), [categories]);

  return (
    <VisuallyEnhancedDashboardLayout>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header Section */}
        <Box sx={{ mb: 5 }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 800,
                  mb: 1,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.02em',
                }}
              >
                Product Categories
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, maxWidth: 600 }}>
                Organize your inventory with smart categories. Track performance, manage visibility, and optimize your product structure.
              </Typography>
            </Box>

            <Stack direction="row" spacing={2}>
              <Tooltip title="Refresh Data">
                <IconButton
                  onClick={() => { }} // Add refresh logic if needed
                  sx={{
                    bgcolor: 'background.paper',
                    boxShadow: theme.shadows[2],
                    '&:hover': { bgcolor: 'background.paper', transform: 'rotate(180deg)', transition: 'transform 0.5s' }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={handleAddCategory}
                sx={{
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.25)}`,
                  '&:hover': {
                    boxShadow: `0 12px 20px ${alpha(theme.palette.primary.main, 0.35)}`,
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                New Category
              </Button>
            </Stack>
          </Paper>
        </Box>

        {/* Stats Cards */}
        <Box aria-label="Category statistics overview">
          <CategoryStatsCards stats={stats} loading={loading} />
        </Box>

        {/* Controls */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[1],
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search categories by name, description or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'background.paper',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.05)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                    }
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.divider, 0.5),
                  }
                }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1.5, color: 'primary.main' }} />,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                <Box sx={{
                  display: 'flex',
                  gap: 1,
                  p: 0.5,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`
                }}>
                  <Tooltip title={selectedCategories.length === sortedCategories.length ? "Deselect All" : "Select All"}>
                    <IconButton
                      size="small"
                      onClick={handleSelectAll}
                      color={selectedCategories.length > 0 ? 'primary' : 'default'}
                    >
                      <SelectAllIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Sort by name">
                    <IconButton
                      size="small"
                      onClick={() => setSortBy('name')}
                      color={sortBy === 'name' ? 'primary' : 'default'}
                      sx={{ bgcolor: sortBy === 'name' ? alpha(theme.palette.primary.main, 0.1) : 'transparent' }}
                    >
                      <SortIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                  <Tooltip title="Grid View">
                    <IconButton
                      size="small"
                      onClick={() => setViewMode('grid')}
                      color={viewMode === 'grid' ? 'primary' : 'default'}
                      sx={{ bgcolor: viewMode === 'grid' ? alpha(theme.palette.primary.main, 0.1) : 'transparent' }}
                    >
                      <GridIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="List View">
                    <IconButton
                      size="small"
                      onClick={() => setViewMode('list')}
                      color={viewMode === 'list' ? 'primary' : 'default'}
                      sx={{ bgcolor: viewMode === 'list' ? alpha(theme.palette.primary.main, 0.1) : 'transparent' }}
                    >
                      <ListIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Bulk Actions Toolbar */}
        {selectedCategories.length > 0 && (
          <Paper
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              border: `1px solid ${theme.palette.primary.main}`,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {selectedCategories.length} category(ies) selected
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleBulkActivate}
                  startIcon={<CategoryIcon />}
                >
                  Activate
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleBulkDeactivate}
                  startIcon={<ClearIcon />}
                >
                  Deactivate
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={handleBulkDelete}
                  startIcon={<DeleteIcon />}
                >
                  Delete
                </Button>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setSelectedCategories([])}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        {/* Categories Display */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
            Categories
          </Typography>
          {loading ? (
            viewMode === 'grid' ? (
              <Grid container spacing={3}>
                {Array.from({ length: 8 }).map((_, index) => (
                  <Grid item xs={12} sm={6} lg={4} key={index}>
                    <Card
                      sx={{
                        borderRadius: 3,
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <Skeleton variant="circular" width={60} height={60} sx={{ mr: 2 }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Skeleton variant="text" width="60%" height={28} sx={{ mb: 0.5 }} />
                              <Skeleton variant="text" width="80%" height={20} />
                            </Box>
                          </Box>
                          <Skeleton variant="circular" width={32} height={32} />
                        </Box>
                        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                          <Skeleton variant="text" width={60} height={20} />
                          <Skeleton variant="text" width={80} height={20} />
                        </Stack>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          <Skeleton variant="rounded" width={50} height={24} />
                          <Skeleton variant="rounded" width={40} height={24} />
                          <Skeleton variant="rounded" width={60} height={24} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Stack spacing={2}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card
                    key={index}
                    sx={{
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} sm={6} md={4}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
                            <Box>
                              <Skeleton variant="text" width={120} height={28} sx={{ mb: 1 }} />
                              <Skeleton variant="text" width={100} height={20} />
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3} md={2}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Skeleton variant="text" width={40} height={28} />
                            <Skeleton variant="text" width={50} height={16} />
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3} md={2}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Skeleton variant="text" width={50} height={28} />
                            <Skeleton variant="text" width={30} height={16} />
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={12} md={4}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Skeleton variant="rounded" width={60} height={24} />
                              <Skeleton variant="rounded" width={50} height={24} />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Skeleton variant="circular" width={32} height={32} />
                              <Skeleton variant="circular" width={32} height={32} />
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )
          ) : viewMode === 'grid' ? (
            <Grid container spacing={3}>
              {sortedCategories.map((category, index) => (
                <Grid item xs={12} sm={6} lg={4} key={category.id}>
                  <Fade in timeout={300 + index * 50}>
                    <Card
                      sx={{
                        height: '100%',
                        borderRadius: 4,
                        border: '1px solid transparent',
                        borderColor: alpha(theme.palette.divider, 0.5),
                        background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'visible',
                        '&:before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 20,
                          right: 20,
                          height: 4,
                          borderRadius: '0 0 4px 4px',
                          bgcolor: category.color || theme.palette.primary.main,
                          opacity: 0.8,
                          transition: 'all 0.3s',
                        },
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: `0 12px 30px ${alpha(theme.palette.common.black, 0.1)}`,
                          borderColor: alpha(category.color || theme.palette.primary.main, 0.3),
                          '&:before': {
                            height: 6,
                            opacity: 1,
                            boxShadow: `0 4px 12px ${alpha(category.color || theme.palette.primary.main, 0.4)}`,
                          }
                        },
                      }}
                      tabIndex={0}
                      role="button"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleEditCategory(category);
                        }
                      }}
                      onClick={() => handleEditCategory(category)}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <Box sx={{ position: 'relative', mr: 2 }}>
                              <Avatar
                                sx={{
                                  width: 64,
                                  height: 64,
                                  bgcolor: alpha(category.color || theme.palette.primary.main, 0.1),
                                  color: category.color || theme.palette.primary.main,
                                  boxShadow: `0 8px 16px ${alpha(category.color || theme.palette.primary.main, 0.15)}`,
                                  border: `2px solid ${theme.palette.background.paper}`,
                                }}
                              >
                                <CategoryIcon sx={{ fontSize: 32 }} />
                              </Avatar>
                              {category.isActive && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    bottom: 2,
                                    right: 2,
                                    width: 14,
                                    height: 14,
                                    borderRadius: '50%',
                                    bgcolor: 'success.main',
                                    border: `2px solid ${theme.palette.background.paper}`,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                  }}
                                />
                              )}
                            </Box>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1.1rem', lineHeight: 1.2 }}>
                                {category.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                fontSize: '0.875rem',
                                lineHeight: 1.5
                              }}>
                                {category.description || 'No description provided'}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Checkbox
                              checked={selectedCategories.includes(category.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleSelectCategory(category.id);
                              }}
                              size="small"
                              sx={{ p: 0.5 }}
                            />
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, category)}
                              sx={{ p: 0.5, opacity: 0.6, '&:hover': { opacity: 1 } }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>

                        <Divider sx={{ my: 2, borderColor: alpha(theme.palette.divider, 0.5) }} />

                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={6}>
                            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                                Products
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <InventoryIcon sx={{ fontSize: 18, color: 'info.main' }} />
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {category.metadata?.totalProducts || 0}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                                Total Value
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <MoneyIcon sx={{ fontSize: 18, color: 'success.main' }} />
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {category.metadata?.totalValue ? `₹${(category.metadata.totalValue / 1000).toFixed(1)}K` : '₹0'}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                        </Grid>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, minHeight: 26 }}>
                          {category.tags && category.tags.length > 0 ? (
                            <>
                              {category.tags.slice(0, 3).map((tag, index) => (
                                <Chip
                                  key={index}
                                  label={tag}
                                  size="small"
                                  sx={{
                                    fontSize: '0.7rem',
                                    height: 24,
                                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                                    color: 'primary.main',
                                    fontWeight: 500,
                                  }}
                                />
                              ))}
                              {category.tags.length > 3 && (
                                <Chip
                                  label={`+${category.tags.length - 3}`}
                                  size="small"
                                  sx={{
                                    fontSize: '0.7rem',
                                    height: 24,
                                    bgcolor: 'transparent',
                                    border: `1px solid ${theme.palette.divider}`,
                                  }}
                                />
                              )}
                            </>
                          ) : (
                            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                              No tags
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Fade>
                </Grid>
              ))}
            </Grid>
          ) : (
            // List View
            <Stack spacing={2}>
              {sortedCategories.map((category, index) => (
                <Fade in timeout={300 + index * 50} key={category.id}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: theme.shadows[4],
                        borderColor: theme.palette.primary.main,
                      },
                      '&:focus': {
                        outline: `2px solid ${theme.palette.primary.main}`,
                        outlineOffset: 2,
                      },
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Category: ${category.name}. ${category.description || 'No description'}. ${category.metadata?.totalProducts || 0} products. Value: ₹${(category.metadata?.totalValue || 0) / 1000}K`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleEditCategory(category);
                      }
                    }}
                    onClick={() => handleEditCategory(category)}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} sm={6} md={4}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Checkbox
                              checked={selectedCategories.includes(category.id)}
                              onChange={() => handleSelectCategory(category.id)}
                              sx={{ mr: 1, p: 0 }}
                              aria-label={`Select ${category.name}`}
                            />
                            <Avatar
                              sx={{
                                width: 48,
                                height: 48,
                                bgcolor: category.color || theme.palette.primary.main,
                                mr: 2,
                              }}
                            >
                              <CategoryIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {category.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {category.description || 'No description'}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={6} sm={3} md={2}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" color="info.main">
                              {category.metadata?.totalProducts || 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Products
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid item xs={6} sm={3} md={2}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" color="success.main">
                              {category.metadata?.totalValue ? `₹${(category.metadata.totalValue / 1000).toFixed(1)}K` : '₹0'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Value
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={12} md={4}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Chip
                                label={category.isActive ? 'Active' : 'Inactive'}
                                size="small"
                                color={category.isActive ? 'success' : 'default'}
                                variant="outlined"
                              />
                              {category.tags && category.tags.length > 0 && (
                                <Chip
                                  label={`${category.tags.length} tags`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>

                            <Box>
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => handleEditCategory(category)} aria-label={`Edit ${category.name}`}>
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={() => handleDeleteCategory(category)} aria-label={`Delete ${category.name}`}>
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Fade>
              ))}
            </Stack>
          )}

          {/* Empty State */}
          {!loading && sortedCategories.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 12 }}>
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <CategoryIcon sx={{ fontSize: 60, color: theme.palette.primary.main }} />
              </Box>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
                {searchTerm ? 'No categories found' : 'No categories yet'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
                {searchTerm
                  ? 'Try adjusting your search terms or create a new category.'
                  : 'Start organizing your products by creating your first category.'
                }
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={handleAddCategory}
                sx={{
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  boxShadow: theme.shadows[4],
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                Create Category
              </Button>
            </Box>
          )}
        </Box>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add category"
          onClick={handleAddCategory}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 64,
            height: 64,
            boxShadow: theme.shadows[8],
            '&:hover': {
              boxShadow: theme.shadows[12],
            },
          }}
        >
          <AddIcon sx={{ fontSize: 28 }} />
        </Fab>

        {/* Category Dialog */}
        <SimplifiedCategoryDialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          category={selectedCategory}
          onSubmit={handleFormSubmit}
          loading={formLoading}
        />

        {/* Snackbar */}
        {snackbar.open && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 24,
              left: 24,
              right: 24,
              zIndex: 1400,
            }}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <Grow in>
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: snackbar.severity === 'success' ? 'success.main' :
                    snackbar.severity === 'error' ? 'error.main' : 'info.main',
                  color: 'white',
                  boxShadow: theme.shadows[8],
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {snackbar.message}
                </Typography>
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={handleCloseSnackbar}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>×</Typography>
                </IconButton>
              </Paper>
            </Grow>
          </Box>
        )}
      </Container>
    </VisuallyEnhancedDashboardLayout>
  );
});

export default CategoriesPage;