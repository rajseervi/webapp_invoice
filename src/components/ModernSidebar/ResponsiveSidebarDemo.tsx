"use client";
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  TouchApp as TouchAppIcon,
  Devices as DevicesIcon,
  Speed as SpeedIcon,
  Accessibility as AccessibilityIcon,
} from '@mui/icons-material';
import EnhancedDashboardLayout from '../DashboardLayout/EnhancedDashboardLayout';

const ResponsiveSidebarDemo: React.FC = () => {
  const theme = useTheme();
  const [demoSettings, setDemoSettings] = useState({
    showBackToTop: true,
    enableAnimations: true,
    compactMode: false,
  });

  const features = [
    {
      icon: <TouchAppIcon color="primary" />,
      title: "Touch-Friendly Design",
      description: "Optimized for both desktop and mobile interactions with proper touch targets and gestures."
    },
    {
      icon: <DevicesIcon color="primary" />,
      title: "Responsive Layout",
      description: "Automatically adapts to different screen sizes with mobile-first design principles."
    },
    {
      icon: <SpeedIcon color="primary" />,
      title: "Performance Optimized",
      description: "Smooth animations and efficient rendering with React.memo and optimized re-renders."
    },
    {
      icon: <AccessibilityIcon color="primary" />,
      title: "Accessibility First",
      description: "Full keyboard navigation, screen reader support, and ARIA compliance."
    },
  ];

  const improvements = [
    "Enhanced hover-to-expand functionality for mini sidebar",
    "Improved mobile navigation with backdrop and gestures",
    "Better keyboard shortcuts (Ctrl+B to toggle, Escape to close)",
    "Persistent state management with localStorage",
    "Smooth animations with Framer Motion",
    "Better responsive breakpoints and touch targets",
    "Enhanced notification system with badges",
    "Back-to-top functionality for long pages",
    "Improved accessibility with proper ARIA labels",
    "Better visual feedback and micro-interactions"
  ];

  return (
    <EnhancedDashboardLayout 
      title="Responsive Sidebar Demo"
      showBackToTop={demoSettings.showBackToTop}
      maxWidth="lg"
    >
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom fontWeight={700}>
            Enhanced Sidebar & Dashboard Layout
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            A modern, responsive, and accessible sidebar implementation with advanced features
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label="Responsive" color="primary" variant="outlined" />
            <Chip label="Accessible" color="secondary" variant="outlined" />
            <Chip label="Touch-Friendly" color="success" variant="outlined" />
            <Chip label="Keyboard Navigation" color="info" variant="outlined" />
          </Box>
        </Box>

        {/* Demo Controls */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Demo Controls
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={demoSettings.showBackToTop}
                    onChange={(e) => setDemoSettings(prev => ({ ...prev, showBackToTop: e.target.checked }))}
                  />
                }
                label="Show Back to Top"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={demoSettings.enableAnimations}
                    onChange={(e) => setDemoSettings(prev => ({ ...prev, enableAnimations: e.target.checked }))}
                  />
                }
                label="Enable Animations"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={demoSettings.compactMode}
                    onChange={(e) => setDemoSettings(prev => ({ ...prev, compactMode: e.target.checked }))}
                  />
                }
                label="Compact Mode"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Instructions */}
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Try these interactions:
          </Typography>
          <Typography variant="body2" component="div">
            • <strong>Desktop:</strong> Use Ctrl+B to toggle sidebar, hover over mini sidebar to expand
            <br />
            • <strong>Mobile:</strong> Tap the menu button to open/close sidebar, tap outside to close
            <br />
            • <strong>Keyboard:</strong> Use Tab to navigate, Enter to select, Escape to close mobile menu
          </Typography>
        </Alert>

        {/* Features Grid */}
        <Typography variant="h4" gutterBottom sx={{ mt: 4, mb: 3 }}>
          Key Features
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Improvements List */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Recent Improvements
          </Typography>
          <List>
            {improvements.map((improvement, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemIcon>
                    <DashboardIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={improvement} />
                </ListItem>
                {index < improvements.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>

        {/* Technical Details */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Technical Implementation
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Technologies Used
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="React 18 with TypeScript" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Material-UI v5 with custom theming" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Framer Motion for animations" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Next.js 14 with App Router" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="CSS-in-JS with emotion" />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Performance Features
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="React.memo for component optimization" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="useCallback for event handler memoization" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Lazy loading for better initial load" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Efficient state management" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Optimized re-renders" />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </Paper>

        {/* Usage Example */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Usage Example
          </Typography>
          <Box 
            component="pre" 
            sx={{ 
              bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
              p: 2,
              borderRadius: 1,
              overflow: 'auto',
              fontSize: '0.875rem',
              fontFamily: 'monospace',
            }}
          >
{`import EnhancedDashboardLayout from '@/components/DashboardLayout/EnhancedDashboardLayout';

export default function MyPage() {
  return (
    <EnhancedDashboardLayout 
      title="My Page Title"
      showBackToTop={true}
      maxWidth="lg"
    >
      <YourPageContent />
    </EnhancedDashboardLayout>
  );
}`}
          </Box>
        </Paper>

        {/* Call to Action */}
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h5" gutterBottom>
            Ready to use in your project!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            The enhanced sidebar and dashboard layout is production-ready and fully tested.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" size="large" startIcon={<SettingsIcon />}>
              View Settings
            </Button>
            <Button variant="outlined" size="large">
              Documentation
            </Button>
          </Box>
        </Box>

        {/* Spacer for back to top demo */}
        <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h4" color="text.secondary">
            Scroll up to test the "Back to Top" button
          </Typography>
        </Box>
      </Container>
    </EnhancedDashboardLayout>
  );
};

export default ResponsiveSidebarDemo;