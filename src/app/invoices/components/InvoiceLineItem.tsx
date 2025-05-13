import React from 'react';
import { 
  Grid, 
  TextField, 
  IconButton,
  Box
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import ProductSelector from './ProductSelector';

interface LineItemProps {
  item: {
    id: string;
    productId?: string;
    productName?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    taxRate: number;
  };
  index: number;
  onChange: (index: number, updatedItem: any) => void;
  onRemove: (index: number) => void;
}

export default function InvoiceLineItem({ item, index, onChange, onRemove }: LineItemProps) {
  const handleProductSelect = (selectedProduct) => {
    onChange(index, {
      ...item,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      description: selectedProduct.description || item.description,
      unitPrice: selectedProduct.price,
      taxRate: selectedProduct.taxRate || item.taxRate,
      amount: selectedProduct.price * item.quantity
    });
  };

  const handleQuantityChange = (e) => {
    const quantity = parseFloat(e.target.value) || 0;
    onChange(index, {
      ...item,
      quantity,
      amount: quantity * item.unitPrice
    });
  };

  const handleUnitPriceChange = (e) => {
    const unitPrice = parseFloat(e.target.value) || 0;
    onChange(index, {
      ...item,
      unitPrice,
      amount: item.quantity * unitPrice
    });
  };

  const handleDescriptionChange = (e) => {
    onChange(index, {
      ...item,
      description: e.target.value
    });
  };

  return (
    <Box sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <ProductSelector 
            onProductSelect={handleProductSelect}
            selectedProductId={item.productId}
          />
        </Grid>
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            label="Description"
            value={item.description}
            onChange={handleDescriptionChange}
            multiline
            rows={2}
          />
        </Grid>
        <Grid item xs={4} md={2}>
          <TextField
            fullWidth
            label="Quantity"
            type="number"
            value={item.quantity}
            onChange={handleQuantityChange}
            inputProps={{ min: 1, step: 1 }}
          />
        </Grid>
        <Grid item xs={4} md={3}>
          <TextField
            fullWidth
            label="Unit Price"
            type="number"
            value={item.unitPrice}
            onChange={handleUnitPriceChange}
            inputProps={{ min: 0, step: 0.01 }}
          />
        </Grid>
        <Grid item xs={4} md={3}>
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={item.amount}
            InputProps={{
              readOnly: true,
            }}
          />
        </Grid>
        <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            color="error" 
            onClick={() => onRemove(index)}
            aria-label="remove item"
          >
            <DeleteIcon />
          </IconButton>
        </Grid>
      </Grid>
    </Box>
  );
}