import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Box,
  Typography,
  useTheme,
  Skeleton
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
} from '@mui/icons-material';

// Define interfaces
interface SalesStat {
  name: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

interface StatsCardsProps {
  stats: SalesStat[];
  loading: boolean;
  formatCurrency: (amount: number) => string;
}

export default function StatsCards({ stats, loading, formatCurrency }: StatsCardsProps) {
  const theme = useTheme();

  // If loading, show skeleton
  if (loading) {
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item}>
            <Card sx={{ 
              height: '100%', 
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}>
              <CardContent>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="40%" height={40} sx={{ my: 1 }} />
                <Skeleton variant="text" width="80%" height={24} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  // Generate mock stats if none provided
  const defaultStats: SalesStat[] = stats.length ? stats : [
    { 
      name: 'Today\'s Sales', 
      value: 4250, 
      change: 12, 
      icon: <TrendingUpIcon />, 
      color: theme.palette.primary.main 
    },
    { 
      name: 'Products', 
      value: 156, 
      change: 8, 
      icon: <InventoryIcon />, 
      color: theme.palette.success.main 
    },
    { 
      name: 'Invoices', 
      value: 89, 
      change: 23, 
      icon: <ReceiptIcon />, 
      color: theme.palette.info.main 
    },
    { 
      name: 'Customers', 
      value: 42, 
      change: 15, 
      icon: <PeopleIcon />, 
      color: theme.palette.warning.main 
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {defaultStats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card sx={{ 
            height: '100%', 
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 20px rgba(0,0,0,0.1)'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    {stat.name}
                  </Typography>
                  <Typography variant="h4" sx={{ my: 1, fontWeight: 600 }}>
                    {stat.name === 'Today\'s Sales' ? formatCurrency(stat.value) : stat.value.toLocaleString()}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography 
                      variant="body2" 
                      color={stat.change >= 0 ? 'success.main' : 'error.main'}
                      sx={{ display: 'flex', alignItems: 'center', fontWeight: 500 }}
                    >
                      {stat.change >= 0 ? '+' : ''}{stat.change}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      vs last month
                    </Typography>
                  </Box>
                </Box>
                <Box 
                  sx={{ 
                    p: 1.5, 
                    borderRadius: '50%', 
                    bgcolor: `${stat.color}20`
                  }}
                >
                  <Box sx={{ color: stat.color }}>
                    {stat.icon}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}