"use client";
import React from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Skeleton, 
  Card, 
  CardContent, 
  CardHeader,
  Divider,
  useTheme,
  alpha
} from '@mui/material';

const DashboardSkeleton = () => {
  const theme = useTheme();
  
  // Stat Card Skeleton
  const StatCardSkeleton = () => (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        height: '100%',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: theme.palette.background.paper,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
        <Skeleton variant="text" width="70%" height={24} />
      </Box>
      <Skeleton variant="text" width="40%" height={40} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="60%" height={20} />
    </Paper>
  );
  
  // Chart Skeleton
  const ChartSkeleton = () => (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        height: '100%',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: theme.palette.background.paper,
      }}
    >
      <Skeleton variant="text" width="50%" height={32} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={250} sx={{ borderRadius: 1 }} />
    </Paper>
  );
  
  // Table Skeleton
  const TableSkeleton = () => (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        height: '100%',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: theme.palette.background.paper,
      }}
    >
      <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
      <Divider sx={{ mb: 2 }} />
      {[...Array(5)].map((_, index) => (
        <Box key={index} sx={{ display: 'flex', py: 1.5, alignItems: 'center' }}>
          <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
          <Box sx={{ width: '100%' }}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="40%" height={20} />
          </Box>
          <Skeleton variant="text" width={80} height={24} />
        </Box>
      ))}
    </Paper>
  );
  
  // Welcome Section Skeleton
  const WelcomeSectionSkeleton = () => (
    <Paper
      elevation={0}
      sx={{
        mb: 4,
        p: { xs: 3, md: 4 },
        borderRadius: 3,
        background: theme => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
        border: theme => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} md={7}>
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Skeleton variant="text" width="70%" height={48} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="90%" height={24} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="80%" height={24} sx={{ mb: 3 }} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 2 }} />
              <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 2 }} />
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Skeleton variant="rectangular" width="80%" height={160} sx={{ borderRadius: 2 }} />
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <Box sx={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
      <WelcomeSectionSkeleton />
      
      {/* Stats Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[...Array(4)].map((_, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCardSkeleton />
          </Grid>
        ))}
      </Grid>
      
      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <ChartSkeleton />
        </Grid>
        <Grid item xs={12} md={4}>
          <ChartSkeleton />
        </Grid>
      </Grid>
      
      {/* Tables Row */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TableSkeleton />
        </Grid>
        <Grid item xs={12} md={6}>
          <TableSkeleton />
        </Grid>
      </Grid>
      
      <style jsx global>{`
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </Box>
  );
};

export default DashboardSkeleton;