import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
  LocalOffer as PriceIcon,
  Category as CategoryIcon,
  QrCode as QrCodeIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { Product } from '@/types/inventory';
import { EnhancedProductSelector } from './EnhancedProductSelector';

// Mock data for demonstration
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'MacBook Pro 16" M3',
    sku: 'MBP-16-M3-512',
    price: 249900,
    costPrice: 200000,
    quantity: 15,
    minStockLevel: 5,
    hsnCode: '8471',
    gstRate: 18,
    categoryId: 'electronics',
    description: 'Latest MacBook Pro with M3 chip, 16GB RAM, 512GB SSD',
    imageUrl: '/images/macbook-pro.jpg',
    barcode: '1234567890123',
    isActive: true,
    weight: 2.1,
    weightUnit: 'kg',
  },
  {
    id: '2',
    name: 'iPhone 15 Pro',
    sku: 'IP15-PRO-128',
    price: 134900,
    costPrice: 110000,
    quantity: 3,
    minStockLevel: 10,
    hsnCode: '8517',
    gstRate: 18,
    categoryId: 'electronics',
    description: 'iPhone 15 Pro with A17 Pro chip, 128GB storage',
    barcode: '2345678901234',
    isActive: true,
    weight: 0.187,
    weightUnit: 'kg',
  },
  {
    id: '3',
    name: 'Dell Monitor 27" 4K',
    sku: 'DELL-MON-27-4K',
    price: 45000,
    costPrice: 35000,
    quantity: 0,
    minStockLevel: 5,
    hsnCode: '8528',
    gstRate: 18,
    categoryId: 'electronics',
    description: 'Dell UltraSharp 27" 4K USB-C Monitor',
    barcode: '3456789012345',
    isActive: true,
    weight: 6.2,
    weightUnit: 'kg',
  },
  {
    id: '4',
    name: 'Wireless Mouse',
    sku: 'WM-001',
    price: 2500,
    costPrice: 1800,
    quantity: 50,
    minStockLevel: 20,
    hsnCode: '8471',
    gstRate: 18,
    categoryId: 'accessories',
    description: 'Ergonomic wireless mouse with USB-C charging',
    barcode: '4567890123456',
    isActive: true,
    weight: 0.1,
    weightUnit: 'kg',
  },
  {
    id: '5',
    name: 'Office Chair Premium',
    sku: 'OC-PREM-001',
    price: 25000,
    costPrice: 18000,
    quantity: 8,
    minStockLevel: 3,
    hsnCode: '9401',
    gstRate: 18,
    categoryId: 'furniture',
    description: 'Ergonomic office chair with lumbar support and adjustable height',
    barcode: '5678901234567',
    isActive: true,
    weight: 15,
    weightUnit: 'kg',
  },
];

const mockCategories = [
  { id: 'electronics', name: 'Electronics', color: '#2196f3' },
  { id: 'accessories', name: 'Accessories', color: '#4caf50' },
  { id: 'furniture', name: 'Furniture', color: '#ff9800' },
  { id: 'software', name: 'Software', color: '#9c27b0' },
];

export const ProductSelectorDemo: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const features = [
    {
      icon: <SearchIcon color="primary" />,
      title: 'Advanced Search',
      description: 'Search by product name, SKU, HSN code, barcode, or description with fuzzy matching and typo tolerance.',
    },
    {
      icon: <TrendingUpIcon color="primary" />,
      title: 'Smart Suggestions',
      description: 'Get recent and popular products, with relevance scoring and matched field highlighting.',
    },
    {
      icon: <InventoryIcon color="primary" />,
      title: 'Stock Information',
      description: 'Real-time stock levels, low stock warnings, and stock status indicators.',
    },
    {
      icon: <PriceIcon color="primary" />,
      title: 'Pricing Details',
      description: 'Base price, cost price, profit margins, and GST rate information at a glance.',
    },
    {
      icon: <CategoryIcon color="primary" />,
      title: 'Category Filtering',
      description: 'Filter products by categories with color-coded chips for easy identification.',
    },
    {
      icon: <QrCodeIcon color="primary" />,
      title: 'Barcode Support',
      description: 'Search and select products using barcode scanning or manual entry.',
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Enhanced Product Selector Demo
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Experience the advanced product selection capabilities with intelligent search, 
        detailed product information, and comprehensive filtering options.
      </Typography>

      <Grid container spacing={3}>
        {/* Demo Section */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Try the Enhanced Product Selector
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Start typing to search products by name, SKU, HSN, or barcode. 
                Try searching for "MacBook", "8471", or "WM-001".
              </Typography>
              
              <EnhancedProductSelector
                value={selectedProduct}
                onChange={setSelectedProduct}
                categories={mockCategories}
                placeholder="Search products by name, SKU, HSN, or barcode..."
                showRecentProducts={true}
                showPopularProducts={true}
                onCreateNew={() => alert('Create new product functionality would be triggered here')}
              />

              {selectedProduct && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Selected:</strong> {selectedProduct.name} (SKU: {selectedProduct.sku})
                    <br />
                    <strong>Price:</strong> ₹{selectedProduct.price.toLocaleString()}
                    <br />
                    <strong>Stock:</strong> {selectedProduct.quantity} units
                    <br />
                    <strong>HSN:</strong> {selectedProduct.hsnCode} | <strong>GST:</strong> {selectedProduct.gstRate}%
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Features Section */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Key Features
              </Typography>
              <List dense>
                {features.map((feature, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {feature.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight="medium">
                          {feature.title}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {feature.description}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Sample Data Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sample Product Data
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                The demo includes the following sample products to test various search scenarios:
              </Typography>
              
              <Grid container spacing={2}>
                {mockProducts.map((product) => (
                  <Grid item xs={12} sm={6} md={4} key={product.id}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="body2" fontWeight="medium" gutterBottom>
                        {product.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                        <Chip label={`SKU: ${product.sku}`} size="small" variant="outlined" />
                        <Chip label={`HSN: ${product.hsnCode}`} size="small" color="primary" />
                        <Chip 
                          label={product.quantity > 0 ? 'In Stock' : 'Out of Stock'} 
                          size="small" 
                          color={product.quantity > 0 ? 'success' : 'error'} 
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Price: ₹{product.price.toLocaleString()} | Stock: {product.quantity} units
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Search Tips */}
        <Grid item xs={12}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Search Tips:</strong>
              <br />
              • Type "MacBook" to see name-based search
              <br />
              • Try "8471" to search by HSN code
              <br />
              • Search "WM-001" for SKU-based results
              <br />
              • Use partial terms like "Dell" or "Chair"
              <br />
              • Switch between Search, Recent, and Popular tabs
              <br />
              • Filter by categories using the chips at the bottom
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProductSelectorDemo;