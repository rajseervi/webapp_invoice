import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  CircularProgress,
  Divider,
  useTheme
} from '@mui/material';
import { 
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useRouter } from 'next/navigation';

// Define threshold for low stock
const LOW_STOCK_THRESHOLD = 10;
const CRITICAL_STOCK_THRESHOLD = 5;

// Interface for product data
interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
}

export default function InventoryAlertsWidget() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [criticalCount, setCriticalCount] = useState(0);
  const [lowCount, setLowCount] = useState(0);
  
  // Fetch low stock products
  const fetchLowStockProducts = async () => {
    try {
      setLoading(true);
      const productsRef = collection(db, 'products');
      const productsQuery = query(
        productsRef,
        orderBy('stock', 'asc'),
        limit(5)
      );
      
      const productsSnapshot = await getDocs(productsQuery);
      
      const productsData = productsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          category: data.category || 'Uncategorized',
          stock: data.stock || 0
        };
      });
      
      // Filter low stock products
      const lowStock = productsData.filter(product => product.stock <= LOW_STOCK_THRESHOLD);
      setLowStockProducts(lowStock);
      
      // Count critical and low stock products
      const criticalStockCount = productsData.filter(p => p.stock <= CRITICAL_STOCK_THRESHOLD).length;
      const lowStockCount = productsData.filter(p => p.stock > CRITICAL_STOCK_THRESHOLD && p.stock <= LOW_STOCK_THRESHOLD).length;
      
      setCriticalCount(criticalStockCount);
      setLowCount(lowStockCount);
    } catch (err) {
      console.error('Error fetching low stock products:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchLowStockProducts();
  }, []);
  
  return (
    <Card>
      <CardHeader
        title="Inventory Alerts"
        titleTypographyProps={{ variant: 'h6' }}
        avatar={<WarningIcon color="warning" />}
        action={
          <Button
            size="small"
            endIcon={<ArrowForwardIcon />}
            onClick={() => router.push('/inventory/alerts')}
          >
            View All
          </Button>
        }
      />
      <Divider />
      <CardContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Critical Stock
                </Typography>
                <Typography variant="h5" color="error.main">
                  {criticalCount}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Low Stock
                </Typography>
                <Typography variant="h5" color="warning.main">
                  {lowCount}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Alerts
                </Typography>
                <Typography variant="h5">
                  {criticalCount + lowCount}
                </Typography>
              </Box>
            </Box>
            
            <Divider sx={{ my: 1 }} />
            
            {lowStockProducts.length > 0 ? (
              <List disablePadding>
                {lowStockProducts.map((product) => (
                  <ListItem key={product.id} disablePadding sx={{ py: 1 }}>
                    <ListItemText
                      primary={product.name}
                      secondary={`Category: ${product.category}`}
                      primaryTypographyProps={{ 
                        variant: 'body2',
                        fontWeight: 'medium',
                        noWrap: true
                      }}
                      secondaryTypographyProps={{ 
                        variant: 'caption',
                        noWrap: true
                      }}
                    />
                    <Chip
                      size="small"
                      label={`Stock: ${product.stock}`}
                      color={product.stock <= CRITICAL_STOCK_THRESHOLD ? "error" : "warning"}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No low stock products found
                </Typography>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}