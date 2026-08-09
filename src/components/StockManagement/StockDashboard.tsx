"use client";
import React from 'react';
import { Box, Grid, Card, CardContent, Typography, Stack, Button } from '@mui/material';
import { Inventory as InventoryIcon, TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon, Refresh as RefreshIcon } from '@mui/icons-material';

export default function StockDashboard() {
  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Stock Management Overview</Typography>
        <Button variant="outlined" size="small" startIcon={<RefreshIcon />}>Refresh</Button>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center">
                <InventoryIcon color="primary" />
                <Typography variant="body2" color="text.secondary">Tracked Products</Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>0</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center">
                <TrendingUpIcon color="success" />
                <Typography variant="body2" color="text.secondary">Incoming Stock</Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>0</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center">
                <TrendingDownIcon color="error" />
                <Typography variant="body2" color="text.secondary">Outgoing Stock</Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>0</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
