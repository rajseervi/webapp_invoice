"use client";
import React from 'react';
import {
  Grid,
  Paper,
  Box,
  Typography,
  useTheme,
  LinearProgress,
  Divider,
  Chip,
  Card,
  CardContent,
  alpha,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  AttachMoney as AttachMoneyIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { DashboardStat } from '@/app/dashboard/hooks/dashboardData';

interface KPISummaryProps {
  stats: DashboardStat[];
  formatCurrency: (amount: number) => string;
}

const KPISummary: React.FC<KPISummaryProps> = ({ stats, formatCurrency }) => {
  const theme = useTheme();

  // Function to get icon based on stat name
  const getStatIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "today's sales":
      case "sales":
      case "revenue":
        return <AttachMoneyIcon fontSize="large" />;
      case "customers":
        return <PeopleIcon fontSize="large" />;
      case "products":
        return <InventoryIcon fontSize="large" />;
      case "invoices":
        return <ReceiptIcon fontSize="large" />;
      default:
        return <TrendingUpIcon fontSize="large" />;
    }
  };

  // Function to format value based on stat name
  const formatValue = (name: string, value: number) => {
    if (name.toLowerCase().includes('sales') || name.toLowerCase().includes('revenue')) {
      return formatCurrency(value);
    }
    return value.toLocaleString();
  };

  // Function to get progress color based on change
  const getProgressColor = (change: number) => {
    if (change > 10) return 'success';
    if (change > 0) return 'primary';
    if (change > -10) return 'warning';
    return 'error';
  };

  // Function to calculate progress percentage (for visual purposes)
  const getProgressPercentage = (change: number) => {
    // Convert change percentage to a progress value between 0-100
    // Negative changes will be below 50, positive above 50
    return Math.min(Math.max(50 + change, 10), 90);
  };

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card 
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '4px',
                backgroundColor: stat.color || theme.palette.primary.main
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {stat.name}
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {formatValue(stat.name, stat.value)}
                  </Typography>
                </Box>
                <Box 
                  sx={{ 
                    p: 1.5, 
                    borderRadius: '50%', 
                    backgroundColor: alpha(stat.color || theme.palette.primary.main, 0.1),
                    color: stat.color || theme.palette.primary.main
                  }}
                >
                  {getStatIcon(stat.name)}
                </Box>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box 
                      component="span" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        color: stat.change >= 0 ? theme.palette.success.main : theme.palette.error.main,
                        mr: 1
                      }}
                    >
                      {stat.change >= 0 ? (
                        <ArrowUpwardIcon fontSize="small" />
                      ) : (
                        <ArrowDownwardIcon fontSize="small" />
                      )}
                      <Typography 
                        variant="body2" 
                        component="span" 
                        sx={{ fontWeight: 'bold' }}
                      >
                        {Math.abs(stat.change)}%
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      vs last period
                    </Typography>
                  </Box>
                  <Tooltip title="Performance indicator">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={getProgressPercentage(stat.change)} 
                  color={getProgressColor(stat.change) as 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    backgroundColor: theme.palette.grey[200]
                  }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
      
      {/* Summary Card */}
      <Grid item xs={12}>
        <Paper 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            background: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.1)})`
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Performance Summary
              </Typography>
              <Typography variant="body2" paragraph>
                Your business is showing {stats.reduce((acc, stat) => acc + stat.change, 0) > 0 ? 'positive' : 'negative'} growth overall. 
                {stats.reduce((acc, stat) => acc + stat.change, 0) > 0 
                  ? ' Keep up the good work and focus on areas with potential for improvement.'
                  : ' Focus on improving key metrics to drive better results.'}
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {stats.map((stat, index) => (
                  <Chip 
                    key={index}
                    label={`${stat.name}: ${stat.change >= 0 ? '+' : ''}${stat.change}%`}
                    color={stat.change >= 0 ? 'success' : 'error'}
                    size="small"
                    icon={stat.change >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: 'background.paper',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Overall Performance
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mr: 1 }}>
                    {(stats.reduce((acc, stat) => acc + stat.change, 0) / stats.length).toFixed(1)}%
                  </Typography>
                  {stats.reduce((acc, stat) => acc + stat.change, 0) > 0 ? (
                    <ArrowUpwardIcon color="success" />
                  ) : (
                    <ArrowDownwardIcon color="error" />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Average change across all metrics
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(Math.max(50 + (stats.reduce((acc, stat) => acc + stat.change, 0) / stats.length), 10), 90)} 
                  color={stats.reduce((acc, stat) => acc + stat.change, 0) > 0 ? 'success' : 'error'}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    mt: 1
                  }} 
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default KPISummary;