import React, { useState, useEffect } from 'react';
import { 
  Autocomplete, 
  TextField, 
  CircularProgress,
  Box
} from '@mui/material';
import { productService } from '@/services/productService';

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  taxRate?: number;
  // Add other relevant fields
}

interface ProductSelectorProps {
  onProductSelect: (product: Product) => void;
  selectedProductId?: string;
}

export default function ProductSelector({ onProductSelect, selectedProductId }: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsData = await productService.getProducts();
        setProducts(productsData);
        
        // If there's a selected product ID, find and set it
        if (selectedProductId) {
          const product = productsData.find(p => p.id === selectedProductId);
          if (product) {
            setSelectedProduct(product);
          }
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedProductId]);

  const handleChange = (event, newValue) => {
    setSelectedProduct(newValue);
    if (newValue) {
      onProductSelect(newValue);
    }
  };

  return (
    <Autocomplete
      options={products}
      getOptionLabel={(option) => option.name}
      value={selectedProduct}
      onChange={handleChange}
      loading={loading}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Select Product"
          variant="outlined"
          fullWidth
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Box>
            <strong>{option.name}</strong>
            <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
              Price: {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR'
              }).format(option.price)}
            </Box>
          </Box>
        </Box>
      )}
    />
  );
}