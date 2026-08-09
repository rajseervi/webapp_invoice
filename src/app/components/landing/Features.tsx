'use client';

import React from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  alpha,
  useTheme,
  Stack,
  Chip,
} from '@mui/material';
import {
  Inventory,
  ShoppingCart,
  LocalShipping,
  Assessment,
  Security,
  CloudSync,
  SmartToy,
  Receipt,
  TrendingUp,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const features = [
  {
    icon: <Inventory sx={{ fontSize: 40 }} />,
    title: 'Smart Inventory Tracking',
    description: 'AI-powered stock monitoring with predictive analytics and automated reorder points.',
    badge: 'AI-Powered',
    color: '#1976d2',
  },
  {
    icon: <Receipt sx={{ fontSize: 40 }} />,
    title: 'GST Compliance',
    description: 'Automated GST calculations, filing, and compliance with real-time tax updates.',
    badge: 'Compliant',
    color: '#2e7d32',
  },
  {
    icon: <TrendingUp sx={{ fontSize: 40 }} />,
    title: 'Advanced Analytics',
    description: 'Deep insights with customizable dashboards, forecasting, and performance metrics.',
    badge: 'Insights',
    color: '#ed6c02',
  },
  {
    icon: <CloudSync sx={{ fontSize: 40 }} />,
    title: 'Cloud Synchronization',
    description: 'Real-time data sync across all devices with 99.9% uptime guarantee.',
    badge: 'Real-time',
    color: '#9c27b0',
  },
  {
    icon: <Security sx={{ fontSize: 40 }} />,
    title: 'Enterprise Security',
    description: 'Bank-level encryption, role-based access, and comprehensive audit trails.',
    badge: 'Secure',
    color: '#d32f2f',
  },
  {
    icon: <SmartToy sx={{ fontSize: 40 }} />,
    title: 'AI Assistant',
    description: 'Intelligent chatbot for instant support, queries, and automated task management.',
    badge: 'Smart',
    color: '#7b1fa2',
  },
];

const stats = [
  { value: '50%', label: 'Faster Processing' },
  { value: '99.9%', label: 'Accuracy Rate' },
  { value: '24/7', label: 'Support Available' },
  { value: '500+', label: 'Integrations' },
];

export default function Features() {
  const theme = useTheme();

  return (
    <Box 
      component="section" 
      id="features" 
      sx={{ 
        py: { xs: 8, md: 12 },
        background: `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
        position: 'relative',
      }}
    >
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box textAlign="center" sx={{ mb: 8 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Chip 
              label="✨ Powerful Features" 
              variant="outlined"
              sx={{ 
                mb: 3,
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                fontWeight: 500
              }}
            />
            <Typography 
              variant="h3" 
              component="h2" 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                mb: 2,
                background: `linear-gradient(135deg, ${theme.palette.text.primary}, ${theme.palette.primary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Everything You Need to Succeed
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ maxWidth: '600px', mx: 'auto', lineHeight: 1.6 }}
            >
              Comprehensive tools designed to streamline your inventory management 
              and boost your business efficiency.
            </Typography>
          </motion.div>
        </Box>

        {/* Stats Section */}
        <Box sx={{ mb: 8 }}>
          <Grid container spacing={3}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Box textAlign="center">
                    <Typography 
                      variant="h4" 
                      fontWeight="bold" 
                      color="primary.main"
                      sx={{ mb: 1 }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Features Grid */}
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} lg={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    height: '100%',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    background: theme.palette.background.paper,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme.shadows[12],
                      borderColor: feature.color,
                      '& .feature-icon': {
                        transform: 'scale(1.1) rotate(5deg)',
                        color: feature.color,
                      },
                      '& .feature-badge': {
                        transform: 'scale(1.05)',
                      }
                    }
                  }}
                >
                  {/* Background decoration */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -20,
                      right: -20,
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${alpha(feature.color, 0.1)}, ${alpha(feature.color, 0.05)})`,
                      zIndex: 0,
                    }}
                  />

                  <Stack spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Box
                        className="feature-icon"
                        sx={{
                          color: feature.color,
                          transition: 'all 0.3s ease',
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: alpha(feature.color, 0.1),
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Chip
                        className="feature-badge"
                        label={feature.badge}
                        size="small"
                        sx={{
                          bgcolor: alpha(feature.color, 0.1),
                          color: feature.color,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          transition: 'all 0.3s ease',
                        }}
                      />
                    </Box>

                    <Box>
                      <Typography 
                        variant="h6" 
                        gutterBottom 
                        sx={{ 
                          fontWeight: 600,
                          mb: 1.5,
                          color: theme.palette.text.primary
                        }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ lineHeight: 1.6 }}
                      >
                        {feature.description}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Bottom CTA */}
        <Box textAlign="center" sx={{ mt: 8 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Typography variant="h5" gutterBottom fontWeight="600">
              Ready to transform your business?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Join thousands of businesses already using our platform
            </Typography>
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
}