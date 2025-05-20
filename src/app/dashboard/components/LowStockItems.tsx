import React, { memo } from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  Divider,
  Grid,
  Card,
  CardContent,
  Chip,
  Skeleton,
  useTheme
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

// Define interfaces
interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  category: string;
}

interface LowStockItemsProps {
  lowStockItems: LowStockItem[];
  loading: boolean;
}

// Memoized component to prevent unnecessary re-renders
const LowStockItems = memo(({ lowStockItems, loading }: LowStockItemsProps) => {
  const router = useRouter();
  const theme = useTheme();

  // Render skeleton when loading
  if (loading) {
    return (
      <Paper sx={{ 
        p: 3, 
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        mt: 3
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="text" width={150} height={32} />
          <Skeleton variant="text" width={150} height={32} />
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ width: '70%' }}>
                      <Skeleton variant="text" width="80%" height={24} />
                      <Skeleton variant="text" width="60%" height={20} />
                    </Box>
                    <Skeleton variant="rectangular" width={60} height={24} />
                  </Box>
                  <Skeleton variant="text" width={100} height={36} sx={{ mt: 1 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  }

  return (
    <Paper sx={{ 
      p: 3, 
      borderRadius: 2,
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      mt: 3
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Low Stock Items</Typography>
        <Button 
          size="small" 
          endIcon={<ArrowForwardIcon />}
          onClick={() => router.push('/products')}
        >
          View All Products
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }} />
      
      {lowStockItems.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No low stock items found
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {lowStockItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card 
                variant="outlined" 
                sx={{ 
                  borderRadius: 2,
                  borderColor: item.stock < 5 ? theme.palette.error.light : theme.palette.warning.light,
                  '&:hover': { 
                    borderColor: item.stock < 5 ? theme.palette.error.main : theme.palette.warning.main,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={500}>
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Category: {item.category}
                      </Typography>
                    </Box>
                    <Chip 
                      label={`${item.stock} left`} 
                      color={item.stock < 5 ? 'error' : 'warning'} 
                      size="small"
                    />
                  </Box>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => router.push(`/products?id=${item.id}`)}
                    sx={{ mt: 1 }}
                  >
                    Update Stock
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
  );
});

LowStockItems.displayName = 'LowStockItems';

export default LowStockItems;