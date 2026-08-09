'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  ViewModule as ViewModuleIcon,
  CheckCircle as CheckIcon,
  AccessTime as TimeIcon,
  Visibility as VisibilityIcon,
  TouchApp as TouchIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material';

export default function InvoiceFormComparison() {
  const streamlinedFeatures = [
    {
      icon: <SpeedIcon color="success" />,
      title: 'Faster Creation',
      description: 'Complete invoice in 2 steps instead of 3'
    },
    {
      icon: <VisibilityIcon color="success" />,
      title: 'Better Overview',
      description: 'See invoice details and products simultaneously'
    },
    {
      icon: <TouchIcon color="success" />,
      title: 'Fewer Clicks',
      description: 'Reduced navigation between tabs'
    },
    {
      icon: <PsychologyIcon color="success" />,
      title: 'Improved UX',
      description: 'More intuitive workflow for experienced users'
    }
  ];

  const traditionalFeatures = [
    {
      icon: <ViewModuleIcon color="primary" />,
      title: 'Step-by-Step',
      description: 'Guided process with clear progression'
    },
    {
      icon: <CheckIcon color="primary" />,
      title: 'Validation',
      description: 'Each step validated before proceeding'
    },
    {
      icon: <TimeIcon color="primary" />,
      title: 'Familiar',
      description: 'Traditional tabbed interface'
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom align="center">
        Invoice Creation Methods
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Streamlined Mode */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', border: '2px solid', borderColor: 'success.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <SpeedIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" color="success.main">
                    Streamlined Mode
                  </Typography>
                  <Chip label="Recommended" color="success" size="small" />
                </Box>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Modern, efficient approach that combines invoice details and product selection in one view.
              </Typography>
              
              <List dense>
                {streamlinedFeatures.map((feature, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {feature.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={feature.title}
                      secondary={feature.description}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                <Typography variant="caption" color="success.contrastText">
                  <strong>Best for:</strong> Experienced users who want to create invoices quickly
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Traditional Mode */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', border: '2px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <ViewModuleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" color="primary.main">
                    Step-by-Step Mode
                  </Typography>
                  <Chip label="Traditional" color="primary" size="small" />
                </Box>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Classic tabbed interface with guided steps for methodical invoice creation.
              </Typography>
              
              <List dense>
                {traditionalFeatures.map((feature, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {feature.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={feature.title}
                      secondary={feature.description}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                <Typography variant="caption" color="primary.contrastText">
                  <strong>Best for:</strong> New users or those who prefer guided workflows
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          You can switch between modes anytime using the buttons above. Your preference will be remembered.
        </Typography>
      </Box>
    </Box>
  );
}