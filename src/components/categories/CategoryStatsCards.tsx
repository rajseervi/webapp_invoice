import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Grid,
} from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InventoryIcon from '@mui/icons-material/Inventory';
import MoneyIcon from '@mui/icons-material/AttachMoney';

interface CategoryStats {
  total: number;
  active: number;
  products: number;
  value: number;
}

interface CategoryStatsCardsProps {
  stats: CategoryStats;
  loading: boolean;
}

const CategoryStatsCards: React.FC<CategoryStatsCardsProps> = ({ stats, loading }) => {
  const statCards = [
    {
      title: 'Total Categories',
      value: stats.total,
      icon: <CategoryIcon />,
      color: 'primary.main',
      bgColor: 'primary',
    },
    {
      title: 'Active Categories',
      value: stats.active,
      icon: <TrendingUpIcon />,
      color: 'success.main',
      bgColor: 'success',
    },
    {
      title: 'Total Products',
      value: stats.products,
      icon: <InventoryIcon />,
      color: 'info.main',
      bgColor: 'info',
    },
    {
      title: 'Total Value',
      value: `₹${(stats.value / 1000).toFixed(1)}K`,
      icon: <MoneyIcon />,
      color: 'warning.main',
      bgColor: 'warning',
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {statCards.map((card, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card sx={{ bgcolor: `${card.bgColor}.main`, color: `${card.bgColor}.contrastText` }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 1
                }}
              >
                {card.icon}
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : card.value}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {card.title}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default CategoryStatsCards;