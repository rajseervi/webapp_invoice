"use client"
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  Box,
  Typography,
  Chip,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';

interface ExtractedProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category?: string;
  confidence: number;
  rawText?: string;
}

interface ExtractedProductsEditorProps {
  open: boolean;
  onClose: () => void;
  products: ExtractedProduct[];
  onSave: (products: ExtractedProduct[]) => void;
}

const ExtractedProductsEditor: React.FC<ExtractedProductsEditorProps> = ({
  open,
  onClose,
  products,
  onSave
}) => {
  const [editedProducts, setEditedProducts] = useState<ExtractedProduct[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    quantity: 0,
    price: 0
  });

  // Initialize edited products when dialog opens
  React.useEffect(() => {
    if (open) {
      setEditedProducts([...products]);
    }
  }, [open, products]);

  // Start editing a product
  const startEdit = (product: ExtractedProduct) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      quantity: product.quantity,
      price: product.price
    });
  };

  // Save edit
  const saveEdit = () => {
    if (!editingId) return;

    setEditedProducts(prev =>
      prev.map(product =>
        product.id === editingId
          ? {
              ...product,
              name: editForm.name,
              quantity: editForm.quantity,
              price: editForm.price,
              confidence: 100 // Manual edit gets 100% confidence
            }
          : product
      )
    );
    setEditingId(null);
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', quantity: 0, price: 0 });
  };

  // Delete product
  const deleteProduct = (id: string) => {
    setEditedProducts(prev => prev.filter(product => product.id !== id));
  };

  // Add new product
  const addNewProduct = () => {
    const newProduct: ExtractedProduct = {
      id: `manual_${Date.now()}`,
      name: 'New Product',
      quantity: 1,
      price: 0,
      confidence: 100,
      rawText: 'Manually added'
    };
    setEditedProducts(prev => [...prev, newProduct]);
    startEdit(newProduct);
  };

  // Handle form changes
  const handleFormChange = (field: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save all changes
  const handleSave = () => {
    onSave(editedProducts);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Edit Extracted Products</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addNewProduct}
            size="small"
          >
            Add Product
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          Review and correct the extracted product data. You can edit names, quantities, and prices.
          Products with low confidence scores may need manual correction.
        </Alert>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product Name</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="center">Confidence</TableCell>
                <TableCell>Raw Text</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {editedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {editingId === product.id ? (
                      <TextField
                        value={editForm.name}
                        onChange={(e) => handleFormChange('name', e.target.value)}
                        size="small"
                        fullWidth
                      />
                    ) : (
                      <Typography variant="body2">{product.name}</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {editingId === product.id ? (
                      <TextField
                        type="number"
                        value={editForm.quantity}
                        onChange={(e) => handleFormChange('quantity', parseFloat(e.target.value) || 0)}
                        size="small"
                        inputProps={{ min: 0, step: 0.1 }}
                        sx={{ width: 80 }}
                      />
                    ) : (
                      <Typography variant="body2">{product.quantity}</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {editingId === product.id ? (
                      <TextField
                        type="number"
                        value={editForm.price}
                        onChange={(e) => handleFormChange('price', parseFloat(e.target.value) || 0)}
                        size="small"
                        inputProps={{ min: 0, step: 0.01 }}
                        sx={{ width: 100 }}
                      />
                    ) : (
                      <Typography variant="body2">${product.price}</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${product.confidence}%`}
                      size="small"
                      color={
                        product.confidence > 90 ? 'success' :
                        product.confidence > 70 ? 'warning' : 'error'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'monospace',
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block'
                      }}
                    >
                      {product.rawText || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {editingId === product.id ? (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={saveEdit}
                          color="primary"
                        >
                          <SaveIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={cancelEdit}
                          color="secondary"
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => startEdit(product)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => deleteProduct(product.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {editedProducts.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No products to edit. Add some products or go back to extract data from PDF.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={editedProducts.length === 0}
        >
          Save Changes ({editedProducts.length} products)
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExtractedProductsEditor;