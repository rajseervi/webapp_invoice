'use client';
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Fade,
  Grow,
  Slide
} from '@mui/material';
import {
  Category as CategoryIcon,
  Palette as PaletteIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

const benefits = [
  {
    icon: <TrendingUpIcon />,
    title: 'Better Organization',
    description: 'Organize products efficiently with hierarchical categories',
    color: '#4caf50'
  },
  {
    icon: <SpeedIcon />,
    title: 'Faster Processing',
    description: 'Quick product entry with pre-configured defaults',
    color: '#2196f3'
  },
  {
    icon: <SecurityIcon />,
    title: 'GST Compliance',
    description: 'Automatic HSN codes and GST rate suggestions',
    color: '#ff9800'
  }
];

const features = [
  {
    icon: <CategoryIcon />,
    title: 'Smart Categorization',
    description: 'Create nested categories with parent-child relationships'
  },
  {
    icon: <PaletteIcon />,
    title: 'Visual Customization',
    description: 'Choose colors and icons to make categories easily recognizable'
  },
  {
    icon: <SettingsIcon />,
    title: 'Default Settings',
    description: 'Set default discounts, GST rates, and HSN codes for efficiency'
  }
];

export default function CategoryCreationWelcome() {
  return (
    <Box sx={{ mb: 6 }}>
      {/* Hero Section */}
      <Fade in={true} timeout={1000}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2
            }}
          >
            Create New Category
          </Typography>
          
          <Typography 
            variant="h5" 
            color="text.secondary" 
            sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
          >
            Streamline your inventory management with smart, customizable product categories
          </Typography>
        </Box>
      </Fade>

      {/* Benefits Cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {benefits.map((benefit, index) => (
          <Grid item xs={12} md={4} key={benefit.title}>
            <Grow in={true} timeout={1000 + (index * 200)}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Avatar
                    sx={{
                      bgcolor: benefit.color,
                      width: 64,
                      height: 64,
                      mx: 'auto',
                      mb: 2,
                      fontSize: '28px'
                    }}
                  >
                    {benefit.icon}
                  </Avatar>
                  
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    {benefit.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    {benefit.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grow>
          </Grid>
        ))}
      </Grid>

      {/* Features Section */}
      <Card sx={{ p: 4, bgcolor: 'grey.50', borderRadius: 3 }}>
        <Typography 
          variant="h5" 
          gutterBottom 
          sx={{ textAlign: 'center', mb: 4, fontWeight: 600 }}
        >
          What You Can Configure
        </Typography>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={feature.title}>
              <Slide 
                direction="up" 
                in={true} 
                timeout={800 + (index * 200)}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      width: 56,
                      height: 56,
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Box>
              </Slide>
            </Grid>
          ))}
        </Grid>
      </Card>

      {/* Quick Tips */}
      <Fade in={true} timeout={1500}>
        <Card sx={{ mt: 4, p: 3, bgcolor: 'primary.50', borderLeft: 4, borderColor: 'primary.main' }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
            💡 Quick Tips
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • Use descriptive names for easy identification
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • Set up parent categories for better organization
              </Typography>
              <Typography variant="body2">
                • Choose distinct colors for visual differentiation
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • Configure default GST rates to save time
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • Add relevant tags for better searchability
              </Typography>
              <Typography variant="body2">
                • Use HSN codes for GST compliance
              </Typography>
            </Grid>
          </Grid>
        </Card>
      </Fade>
    </Box>
  );
}