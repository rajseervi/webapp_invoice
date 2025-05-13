"use client";
import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as AttachMoneyIcon,
  Receipt as ReceiptIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
} from '@mui/icons-material';

const KPISummary = () => {
  const theme = useTheme();

  // Sample KPI data - replace with actual data from your API or context
  const kpiData = [
    {
      title: 'Total Revenue',
      value: '$24,500',
      change: '+12.5%',
      isPositive: true,
      icon: <AttachMoneyIcon />,
      color: theme.palette.success.main,
    },
    {
      title: 'Total Orders',
      value: '145',
      change: '+8.2%',
      isPositive: true,
      icon: <ReceiptIcon />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Inventory Items',
      value: '1,250',
      change: '-2.4%',
      isPositive: false,
      icon: <InventoryIcon />,
      color: theme.palette.warning.main,
    },
    {
      title: 'Active Customers',
      value: '324',
      change: '+5.7%',
      isPositive: true,
      icon: <PeopleIcon />,
      color: theme.palette.info.main,
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        mb: 3,
      }}
    >
      <Typography variant="h6" gutterBottom>
        Key Performance Indicators
      </Typography>
      <Grid container spacing={3}>
        {kpiData.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                p: 2,
                borderRadius: 1,
                bgcolor: alpha(kpi.color, 0.05),
                border: `1px solid ${alpha(kpi.color, 0.1)}`,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {kpi.title}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    bgcolor: alpha(kpi.color, 0.12),
                    color: kpi.color,
                  }}
                >
                  {kpi.icon}
                </Box>
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
                {kpi.value}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {kpi.isPositive ? (
                  <TrendingUpIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                ) : (
                  <TrendingDownIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                )}
                <Typography
                  variant="body2"
                  color={kpi.isPositive ? 'success.main' : 'error.main'}
                >
                  {kpi.change}
                </Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default KPISummary;