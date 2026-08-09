"use client";
import React from 'react';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Paper
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

function CustomersPage() {
  const router = useRouter();

  const analyticsOptions = [
    {
      title: 'Top Customers Analytics',
      description: 'Comprehensive analysis of your highest-value customers with revenue, profitability, and behavior insights.',
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: 'primary',
      path: '/customers/analytics/top',
      features: [
        'Customer performance rankings',
        'Revenue & profit analysis', 
        'Customer segmentation',
        'Risk assessment',
        'Growth trend analysis'
      ]
    },
    {
      title: 'Customer Segments',
      description: 'Analyze customer segments and understand different customer groups for targeted marketing.',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: 'secondary',
      path: '/customers/segments',
      features: [
        'Behavioral segmentation',
        'Revenue-based tiers',
        'Geographic analysis',
        'Purchase patterns'
      ],
      comingSoon: true
    },
    {
      title: 'Customer Lifetime Value',
      description: 'Calculate and track customer lifetime value to optimize acquisition and retention strategies.',
      icon: <AssessmentIcon sx={{ fontSize: 40 }} />,
      color: 'success',
      path: '/customers/lifetime-value',
      features: [
        'CLV calculations',
        'Retention analysis',
        'Churn prediction',
        'Value optimization'
      ],
      comingSoon: true
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          👥 Customer Analytics Hub
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Comprehensive customer insights and analytics to drive business growth
        </Typography>

        <Paper sx={{ p: 3, mb: 4, bgcolor: 'primary.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AnalyticsIcon color="primary" sx={{ mr: 2 }} />
            <Typography variant="h5" color="primary">
              Customer Intelligence Platform
            </Typography>
          </Box>
          <Typography variant="body1">
            Get deep insights into your customer base with advanced analytics, segmentation, and performance tracking. 
            Make data-driven decisions to improve customer relationships and maximize revenue.
          </Typography>
        </Paper>
      </Box>

      <Grid container spacing={4}>
        {analyticsOptions.map((option, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: option.comingSoon ? 'default' : 'pointer',
                opacity: option.comingSoon ? 0.7 : 1,
                '&:hover': option.comingSoon ? {} : {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                  transition: 'all 0.3s ease-in-out'
                }
              }}
              onClick={() => !option.comingSoon && router.push(option.path)}
            >
              <CardContent sx={{ flex: 1, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: `${option.color}.main`, mr: 2 }}>
                    {option.icon}
                  </Box>
                  {option.comingSoon && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        bgcolor: 'warning.light', 
                        color: 'warning.contrastText',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontWeight: 'bold'
                      }}
                    >
                      COMING SOON
                    </Typography>
                  )}
                </Box>

                <Typography variant="h5" gutterBottom color={`${option.color}.main`}>
                  {option.title}
                </Typography>

                <Typography variant="body1" paragraph>
                  {option.description}
                </Typography>

                <Typography variant="subtitle2" gutterBottom>
                  Key Features:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {option.features.map((feature, idx) => (
                    <li key={idx}>
                      <Typography variant="body2" color="text.secondary">
                        {feature}
                      </Typography>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <Box sx={{ p: 3, pt: 0 }}>
                <Button
                  variant={option.comingSoon ? 'outlined' : 'contained'}
                  color={option.color as any}
                  fullWidth
                  disabled={option.comingSoon}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!option.comingSoon) router.push(option.path);
                  }}
                >
                  {option.comingSoon ? 'Coming Soon' : 'Open Analytics'}
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Stats Section */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom>
          📈 Available Analytics
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <TrendingUpIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h4" color="primary">15+</Typography>
              <Typography variant="body1">Analytics Metrics</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <PeopleIcon color="secondary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h4" color="secondary">5</Typography>
              <Typography variant="body1">Customer Segments</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <AssessmentIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h4" color="success">Real-time</Typography>
              <Typography variant="body1">Data Processing</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default function ModernCustomersPage() {
  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Customer Analytics"
        pageType="analytics"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <CustomersPage />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}