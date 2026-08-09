import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  LocalOffer as DiscountIcon,
  Category as CategoryIcon,
  Speed as SpeedIcon,
  Visibility as VisibilityIcon,
  AutoAwesome as AutoAwesomeIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';

const EnhancedInvoiceDemo: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<string>('overview');

  const features = [
    {
      id: 'discounts',
      title: 'Party-wise Category Discounts',
      description: 'Automatic discount application based on party and product category',
      icon: <DiscountIcon />,
      color: 'success',
      benefits: [
        'Automatic discount calculation',
        'Category-specific rules',
        'Visual discount indicators',
        'Real-time savings display'
      ]
    },
    {
      id: 'bulk',
      title: 'Bulk Discount System',
      description: 'Quantity-based tiered discounts with progressive rates',
      icon: <TrendingUpIcon />,
      color: 'warning',
      benefits: [
        'Quantity-based tiers',
        'Progressive discount rates',
        'Automatic application',
        'Bulk action support'
      ]
    },
    {
      id: 'search',
      title: 'Enhanced Product Selection',
      description: 'Advanced search with visual product cards and stock validation',
      icon: <CategoryIcon />,
      color: 'primary',
      benefits: [
        'Multi-field search',
        'Visual product cards',
        'Stock validation',
        'Category filtering'
      ]
    },
    {
      id: 'ui',
      title: 'Professional Interface',
      description: 'Modern, responsive design with intelligent workflows',
      icon: <VisibilityIcon />,
      color: 'info',
      benefits: [
        'Responsive design',
        'Expandable details',
        'Visual feedback',
        'Mobile optimized'
      ]
    },
    {
      id: 'automation',
      title: 'Smart Automation',
      description: 'Intelligent discount management and calculation engine',
      icon: <AutoAwesomeIcon />,
      color: 'secondary',
      benefits: [
        'Auto-apply discounts',
        'Smart calculations',
        'Error prevention',
        'Workflow optimization'
      ]
    },
    {
      id: 'analytics',
      title: 'Real-time Analytics',
      description: 'Comprehensive reporting and discount analysis',
      icon: <AnalyticsIcon />,
      color: 'error',
      benefits: [
        'Discount analytics',
        'Profit margins',
        'Savings tracking',
        'Performance metrics'
      ]
    }
  ];

  const demoData = {
    overview: {
      title: 'Enhanced GST Invoice System',
      content: (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            The enhanced GST invoice system provides advanced discount management, 
            intelligent product selection, and professional invoice creation capabilities.
          </Alert>
          
          <Grid container spacing={2}>
            {features.map((feature) => (
              <Grid item xs={12} sm={6} md={4} key={feature.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    cursor: 'pointer',
                    '&:hover': { elevation: 4 }
                  }}
                  onClick={() => setActiveDemo(feature.id)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ color: `${feature.color}.main`, mr: 1 }}>
                        {feature.icon}
                      </Box>
                      <Typography variant="h6" component="div">
                        {feature.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Chip 
                        label="View Demo" 
                        color={feature.color as any} 
                        size="small" 
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )
    },
    discounts: {
      title: 'Party-wise Category Discounts',
      content: (
        <Box>
          <Alert severity="success" sx={{ mb: 3 }}>
            Automatic discount application based on party configuration and product categories.
          </Alert>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Example Configuration
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Party: "ABC Electronics Ltd."
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  <Chip label="Electronics: 10%" color="success" size="small" />
                  <Chip label="Accessories: 5%" color="success" size="small" />
                  <Chip label="Cables: 15%" color="success" size="small" />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Automatic Application
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Discounts applied automatically" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Visual indicators for applied discounts" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Real-time savings calculation" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )
    },
    bulk: {
      title: 'Bulk Discount System',
      content: (
        <Box>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Quantity-based tiered discounts with progressive rates for bulk orders.
          </Alert>
          
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Default Bulk Discount Tiers
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                  <Typography variant="h4" color="warning.dark">5%</Typography>
                  <Typography variant="body2">10-49 items</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.main', borderRadius: 1 }}>
                  <Typography variant="h4" color="white">10%</Typography>
                  <Typography variant="body2" color="white">50-99 items</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.dark', borderRadius: 1 }}>
                  <Typography variant="h4" color="white">15%</Typography>
                  <Typography variant="body2" color="white">100+ items</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      )
    },
    search: {
      title: 'Enhanced Product Selection',
      content: (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Advanced product search with visual cards, stock validation, and category filtering.
          </Alert>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Search Features
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Multi-field search (name, SKU, HSN)" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Real-time filtering" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Fuzzy matching for typos" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Category-based filtering" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Visual Enhancements
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Product images and avatars" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Stock status indicators" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Category color coding" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Pricing and margin display" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )
    },
    ui: {
      title: 'Professional Interface',
      content: (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Modern, responsive design with intelligent workflows and visual feedback.
          </Alert>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Design Features
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label="Responsive Design" color="info" size="small" />
                  <Chip label="Material-UI Components" color="info" size="small" />
                  <Chip label="Dark/Light Theme" color="info" size="small" />
                  <Chip label="Mobile Optimized" color="info" size="small" />
                  <Chip label="Accessibility Ready" color="info" size="small" />
                  <Chip label="Print Friendly" color="info" size="small" />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  User Experience
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label="Intuitive Navigation" color="info" size="small" />
                  <Chip label="Visual Feedback" color="info" size="small" />
                  <Chip label="Error Prevention" color="info" size="small" />
                  <Chip label="Quick Actions" color="info" size="small" />
                  <Chip label="Keyboard Shortcuts" color="info" size="small" />
                  <Chip label="Touch Gestures" color="info" size="small" />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )
    },
    automation: {
      title: 'Smart Automation',
      content: (
        <Box>
          <Alert severity="secondary" sx={{ mb: 3 }}>
            Intelligent automation reduces manual work and prevents errors.
          </Alert>
          
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Automation Features
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: 'secondary.light', borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Auto-calculations
                  </Typography>
                  <Typography variant="body2">
                    Automatic GST, discount, and total calculations with real-time updates.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: 'secondary.light', borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Smart Defaults
                  </Typography>
                  <Typography variant="body2">
                    Intelligent default values based on product and party configuration.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: 'secondary.light', borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Error Prevention
                  </Typography>
                  <Typography variant="body2">
                    Real-time validation prevents common errors and data inconsistencies.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: 'secondary.light', borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Workflow Optimization
                  </Typography>
                  <Typography variant="body2">
                    Streamlined processes reduce clicks and improve efficiency.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      )
    },
    analytics: {
      title: 'Real-time Analytics',
      content: (
        <Box>
          <Alert severity="error" sx={{ mb: 3 }}>
            Comprehensive analytics and reporting for better business insights.
          </Alert>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Discount Analytics
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Total Savings:</Typography>
                  <Typography variant="body2" color="success.main">₹2,450</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Category Discounts:</Typography>
                  <Typography variant="body2" color="success.main">₹1,200</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Bulk Discounts:</Typography>
                  <Typography variant="body2" color="warning.main">₹800</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Party Discounts:</Typography>
                  <Typography variant="body2" color="info.main">₹450</Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Performance Metrics
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Average Discount:</Typography>
                  <Typography variant="body2">12.5%</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Profit Margin:</Typography>
                  <Typography variant="body2" color="success.main">28.3%</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Items Count:</Typography>
                  <Typography variant="body2">15</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Total Quantity:</Typography>
                  <Typography variant="body2">125</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Enhanced GST Invoice Features Demo
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Button
            variant={activeDemo === 'overview' ? 'contained' : 'outlined'}
            onClick={() => setActiveDemo('overview')}
            startIcon={<SpeedIcon />}
          >
            Overview
          </Button>
          {features.map((feature) => (
            <Button
              key={feature.id}
              variant={activeDemo === feature.id ? 'contained' : 'outlined'}
              onClick={() => setActiveDemo(feature.id)}
              startIcon={feature.icon}
              color={feature.color as any}
            >
              {feature.title}
            </Button>
          ))}
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {demoData[activeDemo as keyof typeof demoData]?.title}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {demoData[activeDemo as keyof typeof demoData]?.content}
        </CardContent>
      </Card>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => window.open('/invoices/gst/new', '_blank')}
          startIcon={<AutoAwesomeIcon />}
        >
          Try Enhanced Invoice Creation
        </Button>
      </Box>
    </Box>
  );
};

export default EnhancedInvoiceDemo;