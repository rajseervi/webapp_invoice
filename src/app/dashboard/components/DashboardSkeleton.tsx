import React from 'react';
import { Box, Skeleton, Grid, Paper, Container } from '@mui/material';

/**
 * Loading skeleton for the Dashboard page
 * Displays placeholder UI while data is being fetched
 */
const DashboardSkeleton = () => {
  return (
    <Box sx={{ width: '100%' }}>
      {/* Welcome section skeleton */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: { xs: 3, md: 4 },
          borderRadius: 3,
          bgcolor: 'background.paper',
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Skeleton variant="text" sx={{ fontSize: '2.5rem', width: '80%', mb: 1 }} />
            <Skeleton variant="text" sx={{ fontSize: '1rem', width: '60%', mb: 3 }} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Skeleton variant="rounded" width={140} height={48} />
              <Skeleton variant="rounded" width={140} height={48} />
            </Box>
          </Grid>
          <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
            <Skeleton variant="rounded" width={200} height={180} />
          </Grid>
        </Grid>
      </Paper>

      <Container maxWidth="xl" disableGutters sx={{ px: { xs: 0, sm: 2 } }}>
        {/* Stats cards skeleton */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  height: '100%',
                  bgcolor: 'background.paper',
                }}
              >
                <Skeleton variant="circular" width={40} height={40} sx={{ mb: 2 }} />
                <Skeleton variant="text" sx={{ fontSize: '1.25rem', width: '60%', mb: 1 }} />
                <Skeleton variant="text" sx={{ fontSize: '2rem', width: '40%', mb: 1 }} />
                <Skeleton variant="text" sx={{ fontSize: '0.875rem', width: '30%' }} />
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Main content skeleton */}
        <Grid container spacing={3}>
          {/* Quick actions skeleton */}
          <Grid item xs={12} md={6} lg={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                height: '100%',
                minHeight: 200,
                bgcolor: 'background.paper',
              }}
            >
              <Skeleton variant="text" sx={{ fontSize: '1.25rem', width: '50%', mb: 2 }} />
              <Grid container spacing={2}>
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <Grid item xs={4} key={item}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Skeleton variant="circular" width={48} height={48} sx={{ mb: 1 }} />
                      <Skeleton variant="text" sx={{ fontSize: '0.875rem', width: '80%' }} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          {/* Analytics preview skeleton */}
          <Grid item xs={12} md={6} lg={8}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                height: '100%',
                minHeight: 200,
                bgcolor: 'background.paper',
              }}
            >
              <Skeleton variant="text" sx={{ fontSize: '1.25rem', width: '40%', mb: 2 }} />
              <Skeleton variant="rectangular" width="100%" height={180} sx={{ borderRadius: 2 }} />
            </Paper>
          </Grid>

          {/* Recent invoices skeleton */}
          <Grid item xs={12} lg={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                height: '100%',
                bgcolor: 'background.paper',
              }}
            >
              <Skeleton variant="text" sx={{ fontSize: '1.25rem', width: '50%', mb: 2 }} />
              {[1, 2, 3, 4].map((item) => (
                <Box key={item} sx={{ display: 'flex', alignItems: 'center', mb: 2, py: 1 }}>
                  <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" sx={{ fontSize: '1rem', width: '60%', mb: 0.5 }} />
                    <Skeleton variant="text" sx={{ fontSize: '0.875rem', width: '40%' }} />
                  </Box>
                  <Skeleton variant="text" sx={{ fontSize: '1rem', width: 80 }} />
                </Box>
              ))}
            </Paper>
          </Grid>

          {/* Low stock items skeleton */}
          <Grid item xs={12} md={6} lg={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                height: '100%',
                bgcolor: 'background.paper',
              }}
            >
              <Skeleton variant="text" sx={{ fontSize: '1.25rem', width: '50%', mb: 2 }} />
              {[1, 2, 3, 4].map((item) => (
                <Box key={item} sx={{ display: 'flex', alignItems: 'center', mb: 2, py: 1 }}>
                  <Skeleton variant="rectangular" width={48} height={48} sx={{ mr: 2, borderRadius: 1 }} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" sx={{ fontSize: '1rem', width: '70%', mb: 0.5 }} />
                    <Skeleton variant="text" sx={{ fontSize: '0.875rem', width: '40%' }} />
                  </Box>
                  <Skeleton variant="rounded" width={60} height={24} />
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default DashboardSkeleton;