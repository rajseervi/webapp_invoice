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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  People as PeopleIcon,
  MonetizationOn as MoneyIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

function CustomerAnalyticsPage() {
  const router = useRouter();

  const analyticsModules = [
    {
      title: '🏆 Top Customers Analytics',
      description: 'Comprehensive analysis of your highest-performing customers with detailed metrics.',
      path: '/customers/analytics/top',
      status: 'available',
      features: [
        'Customer performance rankings',
        'Revenue & profitability analysis',
        'Customer tier classification (Platinum, Gold, Silver, Bronze)',
        'Payment reliability scoring',
        'Risk assessment and management',
        'Purchase behavior analysis',
        'Monthly trend tracking',
        'Export & print capabilities'
      ],
      metrics: [
        'Total Revenue per Customer',
        'Average Order Value (AOV)',
        'Order Frequency',
        'Customer Lifetime Value',
        'Profit Margins',
        'Outstanding Balance Tracking'
      ]
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          📊 Customer Analytics Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Advanced customer intelligence and business insights
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {analyticsModules.map((module, index) => (
          <Grid item xs={12} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography variant="h4" gutterBottom color="primary">
                      {module.title}
                    </Typography>
                    <Typography variant="h6" color="text.secondary" paragraph>
                      {module.description}
                    </Typography>
                    <Chip 
                      label="AVAILABLE NOW" 
                      color="success" 
                      icon={<CheckIcon />}
                      sx={{ mb: 2 }}
                    />
                  </Box>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => router.push(module.path)}
                    sx={{ minWidth: 200 }}
                  >
                    Open Analytics
                  </Button>
                </Box>

                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      🎯 Key Features
                    </Typography>
                    <List dense>
                      {module.features.map((feature, idx) => (
                        <ListItem key={idx} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <StarIcon color="primary" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={feature}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      📈 Analytics Metrics
                    </Typography>
                    <List dense>
                      {module.metrics.map((metric, idx) => (
                        <ListItem key={idx} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <AssessmentIcon color="secondary" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={metric}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    💡 Business Impact
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Identify your most valuable customers, optimize pricing strategies, manage credit risks, 
                    and make data-driven decisions to increase customer retention and profitability.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Access Section */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom>
          🚀 Quick Actions
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { 
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                  transition: 'all 0.2s ease-in-out'
                }
              }}
              onClick={() => router.push('/customers/analytics/top')}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <TrendingUpIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  View Top Customers
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Access the complete customer analytics dashboard
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                opacity: 0.6,
                cursor: 'not-allowed'
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <PeopleIcon color="secondary" sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Customer Segments
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Advanced segmentation analysis (Coming Soon)
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                opacity: 0.6,
                cursor: 'not-allowed'
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <TimelineIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Predictive Analytics
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  AI-powered customer insights (Coming Soon)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default function ModernCustomerAnalyticsPage() {
  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Customer Analytics"
        pageType="analytics"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <CustomerAnalyticsPage />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}