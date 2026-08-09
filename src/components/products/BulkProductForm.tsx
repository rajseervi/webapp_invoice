import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  MenuItem,
  Autocomplete,
  Paper,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  UploadFile as UploadFileIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { Product } from '@/types/inventory';
import { categoryService } from '@/services/categoryService';
import { Category } from '@/types/category';

interface BulkProductFormProps {
  onSubmit: (products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: string | null;
  onCloseSnackbar: () => void;
}

interface ProductInput extends Omit<Product, 'id' | 'createdAt' | 'updatedAt'> {
  tempId: number; // Temporary ID for keying in lists
}

export const BulkProductForm: React.FC<BulkProductFormProps> = ({
  onSubmit,
  loading,
  error,
  success,
  onCloseSnackbar,
}) => {
  const [products, setProducts] = useState<ProductInput[]>([
    { tempId: 1, name: '', description: '', price: 0, quantity: 0, categoryId: '', isActive: true, unitOfMeasurement: 'PCS' }
  ]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [nextTempId, setNextTempId] = useState(2);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await categoryService.getCategories();
        setCategories(fetchedCategories);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const addProductRow = () => {
    setProducts(prevProducts => [
      ...prevProducts,
      { tempId: nextTempId, name: '', description: '', price: 0, quantity: 0, categoryId: '', isActive: true, unitOfMeasurement: 'PCS' }
    ]);
    setNextTempId(prevId => prevId + 1);
  };

  const removeProductRow = (tempId: number) => {
    setProducts(prevProducts => prevProducts.filter(product => product.tempId !== tempId));
  };

  const updateProductField = (tempId: number, field: keyof ProductInput, value: any) => {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product.tempId === tempId ? { ...product, [field]: value } : product
      )
    );
  };

  const handleCategoryChange = (tempId: number, category: Category | null) => {
    updateProductField(tempId, 'categoryId', category ? category.id : '');
  };

  const validateForm = (): string | null => {
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      if (!product.name.trim()) return `Product ${i + 1}: Name is required.`;
      if (!product.categoryId) return `Product ${i + 1}: Category is required.`;
      if (product.price <= 0) return `Product ${i + 1}: Price must be greater than 0.`;
      if (product.quantity < 0) return `Product ${i + 1}: Quantity cannot be negative.`;

    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      onCloseSnackbar();
      // Assuming parent handles setting error
      return;
    }

    const productsToSubmit = products.map(({ tempId, ...rest }) => rest);
    onSubmit(productsToSubmit);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Product Details</Typography>
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Quantity</TableCell>

                <TableCell>Unit</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product, index) => (
                <TableRow key={product.tempId}>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      value={product.name}
                      onChange={(e) => updateProductField(product.tempId, 'name', e.target.value)}
                      required
                      error={!product.name.trim()}
                      helperText={!product.name.trim() && 'Required'}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      value={product.description}
                      onChange={(e) => updateProductField(product.tempId, 'description', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Autocomplete
                      options={categories}
                      getOptionLabel={(option) => option.name}
                      value={categories.find(cat => cat.id === product.categoryId) || null}
                      onChange={(_, newValue) => handleCategoryChange(product.tempId, newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          size="small"
                          label="Category"
                          required
                          error={!product.categoryId}
                          helperText={!product.categoryId && 'Required'}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={product.price}
                      onChange={(e) => updateProductField(product.tempId, 'price', Number(e.target.value))}
                      required
                      error={product.price <= 0}
                      helperText={product.price <= 0 && 'Must be > 0'}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={product.quantity}
                      onChange={(e) => updateProductField(product.tempId, 'quantity', Number(e.target.value))}
                      required
                      error={product.quantity < 0}
                      helperText={product.quantity < 0 && 'Cannot be negative'}
                    />
                  </TableCell>

                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      value={product.unitOfMeasurement}
                      onChange={(e) => updateProductField(product.tempId, 'unitOfMeasurement', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => removeProductRow(product.tempId)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addProductRow}
          >
            Add Another Product
          </Button>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save All Products'}
          </Button>
        </Box>
      </CardContent>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={onCloseSnackbar}>
        <Alert onClose={onCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={onCloseSnackbar}>
        <Alert onClose={onCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Card>
  );
};
