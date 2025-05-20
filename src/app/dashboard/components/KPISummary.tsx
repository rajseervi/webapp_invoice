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
import { motion } from 'framer-motion';
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
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        mb: 4,
        overflow: 'hidden',
        position: 'relative',
        background: theme => `linear-gradient(to right, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 1)})`,
      }}
    >
      <Box sx={{ 
        position: 'absolute', 
        top: -50, 
        right: -50, 
        width: 200, 
        height: 200, 
        borderRadius: '50%',
        background: theme => `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 70%)`,
        zIndex: 0
      }} />
      
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center',
            mb: 3
          }}
        >
          Key Performance Indicators
          <Box 
            component="span" 
            sx={{ 
              ml: 1, 
              height: 4, 
              width: 40, 
              borderRadius: 2, 
              bgcolor: theme.palette.primary.main,
              display: 'inline-block'
            }} 
          />
        </Typography>
        
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {kpiData.map((kpi, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  p: { xs: 2, md: 3 },
                  borderRadius: 3,
                  bgcolor: theme.palette.background.paper,
                  boxShadow: `0 4px 20px ${alpha(kpi.color, 0.15)}`,
                  border: `1px solid ${alpha(kpi.color, 0.1)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: `0 8px 25px ${alpha(kpi.color, 0.25)}`,
                  },
                  height: '100%',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 600,
                      color: alpha(theme.palette.text.primary, 0.8)
                    }}
                  >
                    {kpi.title}
                  </Typography>
                  <Box
                    component={motion.div}
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '12px',
                      bgcolor: alpha(kpi.color, 0.12),
                      color: kpi.color,
                    }}
                  >
                    {kpi.icon}
                  </Box>
                </Box>
                
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700, 
                    mb: 1,
                    color: theme.palette.text.primary
                  }}
                >
                  {kpi.value}
                </Typography>
                
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    mt: 'auto', 
                    pt: 1,
                    borderTop: `1px dashed ${alpha(theme.palette.divider, 0.5)}`
                  }}
                >
                  <Box
                    component={motion.div}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 10,
                      delay: index * 0.1
                    }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: kpi.isPositive ? alpha(theme.palette.success.main, 0.12) : alpha(theme.palette.error.main, 0.12),
                      color: kpi.isPositive ? theme.palette.success.main : theme.palette.error.main,
                      mr: 1
                    }}
                  >
                    {kpi.isPositive ? (
                      <TrendingUpIcon fontSize="small" />
                    ) : (
                      <TrendingDownIcon fontSize="small" />
                    )}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: kpi.isPositive ? theme.palette.success.main : theme.palette.error.main
                    }}
                  >
                    {kpi.change}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      ml: 1,
                      color: alpha(theme.palette.text.secondary, 0.7)
                    }}
                  >
                    vs last period
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Paper>
  );
};

export default KPISummary;