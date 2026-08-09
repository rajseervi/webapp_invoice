"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Checkbox,
  IconButton,
  Chip,
  Box,
  Typography,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Tooltip,
  Avatar,
  TableSortLabel,
  Card,
  CardContent,
  Grid,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  useTheme,
  useMediaQuery,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  FileCopy as DuplicateIcon,
  Inventory as StockIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Add as AddIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { Product } from '@/types/inventory';
import { productService } from '@/services/productService';

interface ProductListProps {
  products: Product[];
  loading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onView: (product: Product) => void;
  onSelectionChange: (selectedIds: string[]) => void;
  selectedProducts: string[];
  onRefresh: () => void;
}

type SortField = keyof Product;
type SortDirection = 'asc' | 'desc';
type ViewMode = 'table' | 'card' | 'compact';

export default function EnhancedProductList({
  products,
  loading,
  onEdit,
  onDelete,
  onView,
  onSelectionChange,
  selectedProducts,
  onRefresh
}: ProductListProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : 10);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>(isMobile ? 'card' : 'table');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  // Menu and dialog states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockDialog, setStockDialog] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [duplicateDialog, setDuplicateDialog] = useState(false);
  const [duplicateName, setDuplicateName] = useState('');

  // Sort products
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [products, sortField, sortDirection]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return sortedProducts.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedProducts, page, rowsPerPage]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allIds = products.map(product => product.id!);
      onSelectionChange(allIds);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectProduct = (productId: string) => {
    const newSelection = selectedProducts.includes(productId)
      ? selectedProducts.filter(id => id !== productId)
      : [...selectedProducts, productId];
    onSelectionChange(newSelection);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, product: Product) => {
    setAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProduct(null);
  };

  const handleCardExpand = (productId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedCards(newExpanded);
  };

  const handleStockAdjustment = async () => {
    if (!selectedProduct || stockAdjustment === 0) return;

    try {
      await productService.adjustStock(selectedProduct.id!, stockAdjustment);
      setStockDialog(false);
      setStockAdjustment(0);
      onRefresh();
    } catch (error) {
      console.error('Error adjusting stock:', error);
    }
  };

  const handleDuplicate = async () => {
    if (!selectedProduct) return;

    try {
      await productService.duplicateProduct(selectedProduct.id!, duplicateName);
      setDuplicateDialog(false);
      setDuplicateName('');
      onRefresh();
    } catch (error) {
      console.error('Error duplicating product:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      await onDelete(selectedProduct.id!);
      setDeleteDialog(false);
      onRefresh();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.quantity === 0) {
      return { label: 'Out of Stock', color: 'error' as const };
    } else if (product.quantity <= (product.reorderPoint || 10)) {
      return { label: 'Low Stock', color: 'warning' as const };
    } else {
      return { label: 'In Stock', color: 'success' as const };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getProductImage = (product: Product) => {
    return product.name.charAt(0).toUpperCase();
  };

  const renderTableView = () => (
    <TableContainer component={Paper}>
      <Table size={isMobile ? 'small' : 'medium'}>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={selectedProducts.length > 0 && selectedProducts.length < products.length}
                checked={products.length > 0 && selectedProducts.length === products.length}
                onChange={handleSelectAll}
              />
            </TableCell>
            <TableCell>Product</TableCell>
            {!isMobile && (
              <TableCell>
                <TableSortLabel
                  active={sortField === 'categoryId'}
                  direction={sortField === 'categoryId' ? sortDirection : 'asc'}
                  onClick={() => handleSort('categoryId')}
                >
                  Category
                </TableSortLabel>
              </TableCell>
            )}
            <TableCell>
              <TableSortLabel
                active={sortField === 'price'}
                direction={sortField === 'price' ? sortDirection : 'asc'}
                onClick={() => handleSort('price')}
              >
                Price
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortField === 'quantity'}
                direction={sortField === 'quantity' ? sortDirection : 'asc'}
                onClick={() => handleSort('quantity')}
              >
                Stock
              </TableSortLabel>
            </TableCell>
            {!isMobile && <TableCell>Status</TableCell>}
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={isMobile ? 5 : 7} align="center">
                Loading products...
              </TableCell>
            </TableRow>
          ) : paginatedProducts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isMobile ? 5 : 7} align="center">
                No products found
              </TableCell>
            </TableRow>
          ) : (
            paginatedProducts.map((product) => {
              const stockStatus = getStockStatus(product);
              return (
                <TableRow key={product.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedProducts.includes(product.id!)}
                      onChange={() => handleSelectProduct(product.id!)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {getProductImage(product)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {product.name}
                        </Typography>
                        {isMobile && (
                          <Typography variant="caption" color="text.secondary">
                            {product.categoryId}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      <Typography variant="body2">
                        {product.categoryId}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell>
                    <Typography variant="body2">
                      {formatCurrency(product.price)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        {product.quantity}
                      </Typography>
                      {isMobile && (
                        <Chip
                          label={stockStatus.label}
                          color={stockStatus.color}
                          size="small"
                        />
                      )}
                    </Box>
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={stockStatus.label}
                          color={stockStatus.color}
                          size="small"
                        />
                        {!product.isActive && (
                          <Chip
                            label="Inactive"
                            color="default"
                            size="small"
                          />
                        )}
                      </Box>
                    </TableCell>
                  )}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {!isMobile && (
                        <>
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => onView(product)}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => onEdit(product)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="More actions">
                        <IconButton 
                          size="small" 
                          onClick={(e) => handleMenuOpen(e, product)}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderCardView = () => (
    <Grid container spacing={2}>
      {loading ? (
        <Grid item xs={12}>
          <Typography align="center">Loading products...</Typography>
        </Grid>
      ) : paginatedProducts.length === 0 ? (
        <Grid item xs={12}>
          <Typography align="center">No products found</Typography>
        </Grid>
      ) : (
        paginatedProducts.map((product) => {
          const stockStatus = getStockStatus(product);
          const isExpanded = expandedCards.has(product.id!);
          
          return (
            <Grid item xs={12} sm={6} md={4} key={product.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Checkbox
                        checked={selectedProducts.includes(product.id!)}
                        onChange={() => handleSelectProduct(product.id!)}
                        size="small"
                      />
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {getProductImage(product)}
                      </Avatar>
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleMenuOpen(e, product)}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {product.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(product.price)}
                    </Typography>
                    <Chip
                      label={stockStatus.label}
                      color={stockStatus.color}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Stock: {product.quantity} {product.unitOfMeasurement}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      {product.categoryId}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleCardExpand(product.id!)}
                    >
                      {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                  
                  <Collapse in={isExpanded}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {product.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={`GST: ${product.gstExempt ? 'Exempt' : `${product.gstRate}%`}`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={product.isService ? 'Service' : 'Goods'}
                        size="small"
                        variant="outlined"
                      />
                      {!product.isActive && (
                        <Chip
                          label="Inactive"
                          size="small"
                          color="default"
                        />
                      )}
                    </Box>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => onView(product)}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => onEdit(product)}
                      >
                        Edit
                      </Button>
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            </Grid>
          );
        })
      )}
    </Grid>
  );

  const renderCompactView = () => (
    <Paper>
      <List>
        {loading ? (
          <ListItem>
            <ListItemText primary="Loading products..." />
          </ListItem>
        ) : paginatedProducts.length === 0 ? (
          <ListItem>
            <ListItemText primary="No products found" />
          </ListItem>
        ) : (
          paginatedProducts.map((product, index) => {
            const stockStatus = getStockStatus(product);
            
            return (
              <React.Fragment key={product.id}>
                <ListItem>
                  <ListItemIcon>
                    <Checkbox
                      checked={selectedProducts.includes(product.id!)}
                      onChange={() => handleSelectProduct(product.id!)}
                    />
                  </ListItemIcon>
                  <Avatar sx={{ mr: 2 }}>
                    {getProductImage(product)}
                  </Avatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight="medium">
                          {product.name}
                        </Typography>
                        <Chip
                          label={stockStatus.label}
                          color={stockStatus.color}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="primary">
                          {formatCurrency(product.price)} • Stock: {product.quantity}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product.categoryId}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      onClick={(e) => handleMenuOpen(e, product)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < paginatedProducts.length - 1 && <Divider />}
              </React.Fragment>
            );
          })
        )}
      </List>
    </Paper>
  );

  return (
    <>
      {/* View Mode Controls */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {products.length} products • {selectedProducts.length} selected
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Table View">
            <IconButton
              size="small"
              color={viewMode === 'table' ? 'primary' : 'default'}
              onClick={() => setViewMode('table')}
            >
              <ViewListIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Card View">
            <IconButton
              size="small"
              color={viewMode === 'card' ? 'primary' : 'default'}
              onClick={() => setViewMode('card')}
            >
              <ViewModuleIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Compact View">
            <IconButton
              size="small"
              color={viewMode === 'compact' ? 'primary' : 'default'}
              onClick={() => setViewMode('compact')}
            >
              <ViewListIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Product List */}
      {viewMode === 'table' && renderTableView()}
      {viewMode === 'card' && renderCardView()}
      {viewMode === 'compact' && renderCompactView()}

      {/* Pagination */}
      <TablePagination
        component="div"
        count={products.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={isMobile ? [5, 10, 25] : [5, 10, 25, 50]}
      />

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedProduct) onView(selectedProduct);
          handleMenuClose();
        }}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedProduct) onEdit(selectedProduct);
          handleMenuClose();
        }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Product
        </MenuItem>
        <MenuItem onClick={() => {
          setStockDialog(true);
          handleMenuClose();
        }}>
          <StockIcon fontSize="small" sx={{ mr: 1 }} />
          Adjust Stock
        </MenuItem>
        <MenuItem onClick={() => {
          setDuplicateName(selectedProduct ? `${selectedProduct.name} (Copy)` : '');
          setDuplicateDialog(true);
          handleMenuClose();
        }}>
          <DuplicateIcon fontSize="small" sx={{ mr: 1 }} />
          Duplicate
        </MenuItem>
        <MenuItem 
          onClick={() => {
            setDeleteDialog(true);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Stock Adjustment Dialog */}
      <Dialog open={stockDialog} onClose={() => setStockDialog(false)}>
        <DialogTitle>Adjust Stock</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Current stock: {selectedProduct?.quantity} {selectedProduct?.unitOfMeasurement}
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="Stock Adjustment"
            value={stockAdjustment}
            onChange={(e) => setStockAdjustment(Number(e.target.value))}
            helperText="Enter positive number to add stock, negative to reduce"
            InputProps={{
              startAdornment: stockAdjustment >= 0 ? 
                <TrendingUpIcon color="success" sx={{ mr: 1 }} /> : 
                <TrendingDownIcon color="error" sx={{ mr: 1 }} />
            }}
          />
          <Typography variant="body2" sx={{ mt: 1 }}>
            New stock will be: {(selectedProduct?.quantity || 0) + stockAdjustment}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStockDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleStockAdjustment} 
            variant="contained"
            disabled={stockAdjustment === 0}
          >
            Adjust Stock
          </Button>
        </DialogActions>
      </Dialog>

      {/* Duplicate Dialog */}
      <Dialog open={duplicateDialog} onClose={() => setDuplicateDialog(false)}>
        <DialogTitle>Duplicate Product</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="New Product Name"
            value={duplicateName}
            onChange={(e) => setDuplicateName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDuplicateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDuplicate} 
            variant="contained"
            disabled={!duplicateName.trim()}
          >
            Duplicate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone.
          </Alert>
          <Typography>
            Are you sure you want to delete "{selectedProduct?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDelete} 
            variant="contained" 
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}