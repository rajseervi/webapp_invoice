'use client';

import React from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  alpha,
  useTheme,
  Stack,
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import { 
  Inventory, 
  TrendingUp, 
  Speed, 
  Security,
  PlayArrow,
  Star
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

export default function Hero() {
  const theme = useTheme();
  const router = useRouter();

  const stats = [
    { label: 'Active Users', value: '10K+', icon: <TrendingUp /> },
    { label: 'Uptime', value: '99.9%', icon: <Speed /> },
    { label: 'Security', value: 'Bank-level', icon: <Security /> },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: `
          radial-gradient(circle at 20% 80%, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.main, 0.15)} 0%, transparent 50%),
          linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)
        `,
        position: 'relative',
        overflow: 'hidden',
        pt: 8,
      }}
    >
      {/* Animated background elements */}
      <Box
        component={motion.div}
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        sx={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
          zIndex: 0,
        }}
      />
      
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Stack spacing={3}>
                <Box>
                  <Chip 
                    label="🚀 New: AI-Powered Analytics" 
                    variant="outlined"
                    sx={{ 
                      mb: 2,
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      fontWeight: 500
                    }}
                  />
                  <Typography 
                    variant="h1" 
                    sx={{ 
                      fontWeight: 800,
                      fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                      lineHeight: 1.1,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 2
                    }}
                  >
                    Smart Inventory
                    <br />
                    Management
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontWeight: 400,
                      lineHeight: 1.6,
                      maxWidth: '500px'
                    }}
                  >
                    Transform your business with intelligent inventory tracking, 
                    real-time analytics, and seamless GST compliance.
                  </Typography>
                </Box>

                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<PlayArrow />}
                    onClick={() => router.push('/dashboard')}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      textTransform: 'none',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[8],
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Start Free Trial
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      textTransform: 'none',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Watch Demo
                  </Button>
                </Stack>

                <Stack direction="row" spacing={4} sx={{ mt: 4 }}>
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ color: theme.palette.primary.main }}>
                          {stat.icon}
                        </Box>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {stat.value}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {stat.label}
                          </Typography>
                        </Box>
                      </Stack>
                    </motion.div>
                  ))}
                </Stack>
              </Stack>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box
              component={motion.div}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                height: { xs: '300px', md: '500px' },
              }}
            >
              {/* Main dashboard mockup */}
              <Box
                component={motion.div}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                sx={{
                  width: '100%',
                  maxWidth: '450px',
                  height: '350px',
                  bgcolor: theme.palette.background.paper,
                  borderRadius: 4,
                  p: 3,
                  boxShadow: theme.shadows[20],
                  border: `1px solid ${theme.palette.divider}`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}
                  >
                    <Inventory />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Dashboard
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Real-time overview
                    </Typography>
                  </Box>
                </Box>

                {/* Stats cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {[
                    { label: 'Total Products', value: '1,247', color: theme.palette.primary.main },
                    { label: 'Low Stock', value: '23', color: theme.palette.warning.main },
                    { label: 'Orders Today', value: '156', color: theme.palette.success.main },
                    { label: 'Revenue', value: '₹2.4L', color: theme.palette.info.main },
                  ].map((item, index) => (
                    <Grid item xs={6} key={index}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 + index * 0.1 }}
                      >
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: alpha(item.color, 0.1),
                            border: `1px solid ${alpha(item.color, 0.2)}`,
                          }}
                        >
                          <Typography variant="h6" fontWeight="bold" color={item.color}>
                            {item.value}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.label}
                          </Typography>
                        </Box>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>

                {/* Chart placeholder */}
                <Box
                  sx={{
                    height: 80,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    display: 'flex',
                    alignItems: 'end',
                    justifyContent: 'space-around',
                    p: 1,
                  }}
                >
                  {[40, 65, 45, 80, 55, 70, 60].map((height, index) => (
                    <motion.div
                      key={index}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: 1.5 + index * 0.1, duration: 0.5 }}
                      style={{
                        width: '8px',
                        backgroundColor: theme.palette.primary.main,
                        borderRadius: '4px',
                        opacity: 0.7,
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Floating elements */}
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  position: 'absolute',
                  top: '10%',
                  right: '10%',
                  zIndex: 2,
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: theme.palette.background.paper,
                    boxShadow: theme.shadows[8],
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Star sx={{ color: theme.palette.warning.main, fontSize: 20 }} />
                  <Typography variant="caption" fontWeight="bold">
                    4.9/5 Rating
                  </Typography>
                </Box>
              </motion.div>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}