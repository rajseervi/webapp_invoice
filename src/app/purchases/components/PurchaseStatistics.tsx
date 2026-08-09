"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { PurchaseStatistics as PurchaseStatsType } from '@/types/purchase';
import PurchaseService from '@/services/purchaseService';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';

export default function PurchaseStatistics() {
  const { userId } = useCurrentUser();
  const [stats, setStats] = useState<PurchaseStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const statistics = await PurchaseService.getPurchaseStatistics(userId);
        setStats(statistics);
      } catch (err) {
        console.error('Error fetching purchase statistics:', err);
        setError('Failed to load purchase statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [userId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!stats) {
    return (
      <Typography variant="body2" color="text.secondary" align="center" sx={{ p: 3 }}>
        No statistics available
      </Typography>
    );
  }

  return (
    <Box>
      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Purchases
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalPurchases}
                  </Typography>
                </Box>
                <ShoppingCartIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Amount
                  </Typography>
                  <Typography variant="h4">
                    ₹{stats.totalAmount.toLocaleString()}
                  </Typography>
                </Box>
                <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Average Order Value
                  </Typography>
                  <Typography variant="h4">
                    ₹{stats.averageOrderValue.toLocaleString()}
                  </Typography>
                </Box>
                <AssessmentIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Suppliers
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalSuppliers}
                  </Typography>
                </Box>
                <PeopleIcon color="secondary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Monthly Purchases */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Purchases
              </Typography>
              {stats.monthlyPurchases.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Month</TableCell>
                        <TableCell align="right">Orders</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.monthlyPurchases.slice(0, 6).map((month) => (
                        <TableRow key={month.month}>
                          <TableCell>
                            {new Date(month.month + '-01').toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long'
                            })}
                          </TableCell>
                          <TableCell align="right">{month.orders}</TableCell>
                          <TableCell align="right">₹{month.amount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                  No monthly data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Suppliers */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Suppliers
              </Typography>
              {stats.topSuppliers.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Supplier</TableCell>
                        <TableCell align="right">Orders</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.topSuppliers.slice(0, 5).map((supplier) => (
                        <TableRow key={supplier.supplierId}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {supplier.supplierName}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{supplier.orderCount}</TableCell>
                          <TableCell align="right">₹{supplier.totalAmount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                  No supplier data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Order Status Summary */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Status Summary
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Pending Orders</Typography>
                  <Typography variant="h6" color="warning.main">
                    {stats.pendingOrders}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Received Orders</Typography>
                  <Typography variant="h6" color="success.main">
                    {stats.receivedOrders}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Completion Rate</Typography>
                  <Typography variant="h6" color="primary.main">
                    {stats.totalPurchases > 0 
                      ? ((stats.receivedOrders / stats.totalPurchases) * 100).toFixed(1)
                      : 0}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}