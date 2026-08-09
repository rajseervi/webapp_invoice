'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Percent as PercentIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { Product } from '@/types/inventory';
import { calculateProfit, formatCurrency, formatPercentage, getProfitStatus } from '@/utils/profitCalculations';

interface ProfitAnalyticsDashboardProps {
  products: Product[];
}

interface ProfitSummary {
  totalProducts: number;
  profitableProducts: number;
  lossProducts: number;
  totalProfitAmount: number;
  averageProfitPercentage: number;
  topProfitableProducts: Array<Product & { profitMetrics: ReturnType<typeof calculateProfit> }>;
  lowProfitProducts: Array<Product & { profitMetrics: ReturnType<typeof calculateProfit> }>;
}

export default function ProfitAnalyticsDashboard({ products }: ProfitAnalyticsDashboardProps) {
  const profitSummary: ProfitSummary = React.useMemo(() => {
    const productsWithProfit = products
      .filter(p => p.purchasePrice > 0 && p.salePrice > 0)
      .map(product => ({
        ...product,
        profitMetrics: calculateProfit(product.purchasePrice, product.salePrice)
      }));

    const totalProfitAmount = productsWithProfit.reduce((sum, p) => sum + p.profitMetrics.profitAmount, 0);
    const averageProfitPercentage = productsWithProfit.length > 0 
      ? productsWithProfit.reduce((sum, p) => sum + p.profitMetrics.profitPercentage, 0) / productsWithProfit.length 
      : 0;

    const profitableProducts = productsWithProfit.filter(p => p.profitMetrics.profitAmount > 0);
    const lossProducts = productsWithProfit.filter(p => p.profitMetrics.profitAmount < 0);

    const topProfitableProducts = [...productsWithProfit]
      .sort((a, b) => b.profitMetrics.profitPercentage - a.profitMetrics.profitPercentage)
      .slice(0, 5);

    const lowProfitProducts = [...productsWithProfit]
      .sort((a, b) => a.profitMetrics.profitPercentage - b.profitMetrics.profitPercentage)
      .slice(0, 5);

    return {
      totalProducts: productsWithProfit.length,
      profitableProducts: profitableProducts.length,
      lossProducts: lossProducts.length,
      totalProfitAmount,
      averageProfitPercentage,
      topProfitableProducts,
      lowProfitProducts
    };
  }, [products]);

  const profitabilityRate = profitSummary.totalProducts > 0 
    ? (profitSummary.profitableProducts / profitSummary.totalProducts) * 100 
    : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AssessmentIcon />
        Profit Analytics Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Products
                  </Typography>
                  <Typography variant="h4">
                    {profitSummary.totalProducts}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <AssessmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Profit
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {formatCurrency(profitSummary.totalProfitAmount)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <MoneyIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Avg. Profit %
                  </Typography>
                  <Typography variant="h4" color={profitSummary.averageProfitPercentage >= 0 ? 'success.main' : 'error.main'}>
                    {formatPercentage(profitSummary.averageProfitPercentage)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <PercentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Profitability Rate
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {formatPercentage(profitabilityRate)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
              <Box sx={{ mt: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={profitabilityRate} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {profitSummary.profitableProducts} of {profitSummary.totalProducts} products profitable
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Top Profitable Products */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon color="success" />
                Top Profitable Products
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                {profitSummary.topProfitableProducts.map((product, index) => (
                  <ListItem key={product.id} divider={index < profitSummary.topProfitableProducts.length - 1}>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'success.light', color: 'success.contrastText', width: 32, height: 32 }}>
                        {index + 1}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={product.name}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography variant="body2" color="success.main">
                            {formatCurrency(product.profitMetrics.profitAmount)}
                          </Typography>
                          <Chip
                            label={formatPercentage(product.profitMetrics.profitPercentage)}
                            color={getProfitStatus(product.profitMetrics.profitPercentage).color}
                            size="small"
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
                {profitSummary.topProfitableProducts.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No profitable products found"
                      secondary="Add purchase and sale prices to see profit analysis"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Low Profit Products */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingDownIcon color="warning" />
                Products Needing Attention
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                {profitSummary.lowProfitProducts.map((product, index) => (
                  <ListItem key={product.id} divider={index < profitSummary.lowProfitProducts.length - 1}>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.contrastText', width: 32, height: 32 }}>
                        {index + 1}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={product.name}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography 
                            variant="body2" 
                            color={product.profitMetrics.profitAmount >= 0 ? 'success.main' : 'error.main'}
                          >
                            {formatCurrency(product.profitMetrics.profitAmount)}
                          </Typography>
                          <Chip
                            label={formatPercentage(product.profitMetrics.profitPercentage)}
                            color={getProfitStatus(product.profitMetrics.profitPercentage).color}
                            size="small"
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
                {profitSummary.lowProfitProducts.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No products found"
                      secondary="Add more products to see analysis"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}