'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  InputAdornment,
  Divider,
  Chip,
  Button,
  Alert,
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { 
  calculateProfit, 
  calculateSalePriceFromProfitPercentage,
  calculateSalePriceFromMarginPercentage,
  formatCurrency, 
  formatPercentage, 
  getProfitStatus 
} from '@/utils/profitCalculations';

export default function ProfitCalculator() {
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [desiredProfitPercentage, setDesiredProfitPercentage] = useState<number>(0);
  const [desiredMarginPercentage, setDesiredMarginPercentage] = useState<number>(0);

  const profitMetrics = React.useMemo(() => {
    if (purchasePrice > 0 && salePrice > 0) {
      return calculateProfit(purchasePrice, salePrice);
    }
    return { profitAmount: 0, profitPercentage: 0, marginPercentage: 0 };
  }, [purchasePrice, salePrice]);

  const handleCalculateSalePriceFromProfit = () => {
    if (purchasePrice > 0 && desiredProfitPercentage > 0) {
      const calculatedSalePrice = calculateSalePriceFromProfitPercentage(purchasePrice, desiredProfitPercentage);
      setSalePrice(calculatedSalePrice);
    }
  };

  const handleCalculateSalePriceFromMargin = () => {
    if (purchasePrice > 0 && desiredMarginPercentage > 0 && desiredMarginPercentage < 100) {
      const calculatedSalePrice = calculateSalePriceFromMarginPercentage(purchasePrice, desiredMarginPercentage);
      setSalePrice(calculatedSalePrice);
    }
  };

  const handleReset = () => {
    setPurchasePrice(0);
    setSalePrice(0);
    setDesiredProfitPercentage(0);
    setDesiredMarginPercentage(0);
  };

  const profitStatus = getProfitStatus(profitMetrics.profitPercentage);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CalculateIcon />
        Profit Calculator
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>💡 Quick Profit Calculator:</strong> Calculate profit margins, determine optimal sale prices, 
          and analyze profitability for better pricing decisions.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Input Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Price Input
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Purchase Price"
                    type="number"
                    value={purchasePrice || ''}
                    onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      inputProps: { min: 0, step: 0.01 }
                    }}
                    helperText="Cost price at which you buy the product"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Sale Price"
                    type="number"
                    value={salePrice || ''}
                    onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      inputProps: { min: 0, step: 0.01 }
                    }}
                    helperText="Price at which you sell the product"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Auto-calculation Section */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Auto-Calculate Sale Price
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    label="Desired Profit %"
                    type="number"
                    value={desiredProfitPercentage || ''}
                    onChange={(e) => setDesiredProfitPercentage(parseFloat(e.target.value) || 0)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      inputProps: { min: 0, step: 1 }
                    }}
                    helperText="Target profit percentage"
                  />
                </Grid>
                <Grid item xs={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleCalculateSalePriceFromProfit}
                    disabled={!purchasePrice || !desiredProfitPercentage}
                    sx={{ height: '56px' }}
                  >
                    Calculate
                  </Button>
                </Grid>
                
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    label="Desired Margin %"
                    type="number"
                    value={desiredMarginPercentage || ''}
                    onChange={(e) => setDesiredMarginPercentage(parseFloat(e.target.value) || 0)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      inputProps: { min: 0, max: 99, step: 1 }
                    }}
                    helperText="Target margin percentage"
                  />
                </Grid>
                <Grid item xs={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleCalculateSalePriceFromMargin}
                    disabled={!purchasePrice || !desiredMarginPercentage || desiredMarginPercentage >= 100}
                    sx={{ height: '56px' }}
                  >
                    Calculate
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Results Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon />
                Profit Analysis
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {purchasePrice > 0 && salePrice > 0 ? (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Profit Amount
                      </Typography>
                      <Typography variant="h4" color={profitMetrics.profitAmount >= 0 ? 'success.main' : 'error.main'}>
                        {formatCurrency(profitMetrics.profitAmount)}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Profit %
                      </Typography>
                      <Typography variant="h5" color={profitMetrics.profitPercentage >= 0 ? 'success.main' : 'error.main'}>
                        {formatPercentage(profitMetrics.profitPercentage)}
                      </Typography>
                      <Chip 
                        label={profitStatus.label}
                        color={profitStatus.color}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Margin %
                      </Typography>
                      <Typography variant="h5" color={profitMetrics.marginPercentage >= 0 ? 'success.main' : 'error.main'}>
                        {formatPercentage(profitMetrics.marginPercentage)}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Alert severity={profitStatus.status === 'loss' ? 'error' : profitStatus.status === 'excellent' ? 'success' : 'info'}>
                      <Typography variant="body2">
                        {profitStatus.status === 'loss' && 'You will incur a loss with this pricing. Consider increasing the sale price.'}
                        {profitStatus.status === 'poor' && 'Low profit margin. Consider optimizing costs or increasing sale price.'}
                        {profitStatus.status === 'fair' && 'Decent profit margin. Room for improvement in pricing strategy.'}
                        {profitStatus.status === 'good' && 'Good profit margin. Well-balanced pricing.'}
                        {profitStatus.status === 'excellent' && 'Excellent profit margin! Great pricing strategy.'}
                      </Typography>
                    </Alert>
                  </Grid>
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    Enter purchase and sale prices to see profit analysis
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleReset}
              fullWidth
            >
              Reset Calculator
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}