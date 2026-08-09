'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  Button,
  Chip,
  Divider,
  Alert,
  AlertTitle,
  Stack,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';
import {
  Palette as PaletteIcon,
  AutoAwesome as AutoAwesomeIcon,
  Speed as SpeedIcon,
  Visibility as VisibilityIcon,
  Settings as SettingsIcon,
  Code as CodeIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';

import { ConfiguredVisuallyEnhancedHeader } from '../components/Header/ConfiguredVisuallyEnhancedHeader';
import { VisuallyEnhancedDashboardLayout } from '../components/ModernLayout/VisuallyEnhancedDashboardLayout';

const VisuallyEnhancedHeaderExamples: React.FC = () => {
  const theme = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [enableVisualEffects, setEnableVisualEffects] = useState(true);
  const [enableVoiceSearch, setEnableVoiceSearch] = useState(false);
  const [enableParticles, setEnableParticles] = useState(false);
  const [currentPageType, setCurrentPageType] = useState('dashboard');
  const [demoRunning, setDemoRunning] = useState(false);

  // Demo page types
  const pageTypes = [
    { id: 'dashboard', name: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'products', name: 'Products', icon: <InventoryIcon /> },
    { id: 'invoices', name: 'Invoices', icon: <ReceiptIcon /> },
    { id: 'parties', name: 'Parties', icon: <PeopleIcon /> },
    { id: 'orders', name: 'Orders', icon: <ShoppingCartIcon /> },
    { id: 'reports', name: 'Reports', icon: <AnalyticsIcon /> },
  ];

  // Custom quick actions for demo
  const customQuickActions = [
    {
      id: 'demo-action-1',
      title: 'Demo Action 1',
      icon: <AutoAwesomeIcon />,
      path: '/demo/1',
      color: '#FF6B6B',
      isNew: true,
    },
    {
      id: 'demo-action-2',
      title: 'Demo Action 2',
      icon: <SpeedIcon />,
      path: '/demo/2',
      color: '#4ECDC4',
      badge: 3,
    },
    {
      id: 'demo-action-3',
      title: 'Demo Action 3',
      icon: <PaletteIcon />,
      path: '/demo/3',
      color: '#45B7D1',
    },
  ];

  // Visual effects features
  const visualFeatures = [
    {
      title: 'Glass Morphism AppBar',
      description: 'Translucent header with backdrop blur and gradient borders',
      enabled: enableVisualEffects,
    },
    {
      title: 'Animated Search Container',
      description: 'Glowing search box with hover effects and gradient borders',
      enabled: enableVisualEffects,
    },
    {
      title: 'Neon Button Effects',
      description: 'Icon buttons with rotating gradient borders and glow effects',
      enabled: enableVisualEffects,
    },
    {
      title: 'Floating Quick Actions',
      description: 'Gradient buttons with shimmer effects and smooth animations',
      enabled: enableVisualEffects,
    },
    {
      title: 'Pulsing Notifications',
      description: 'Animated badges with gradient backgrounds and pulse effects',
      enabled: enableVisualEffects,
    },
    {
      title: 'Morphing Avatar',
      description: 'Profile avatar with rotating glow effects and smooth transitions',
      enabled: enableVisualEffects,
    },
    {
      title: 'Glass Card Menus',
      description: 'Dropdown menus with glass morphism and backdrop blur',
      enabled: enableVisualEffects,
    },
    {
      title: 'Animated Menu Items',
      description: 'Menu items with slide animations and gradient hover effects',
      enabled: enableVisualEffects,
    },
  ];

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  const startDemo = () => {
    setDemoRunning(true);
    let currentIndex = 0;
    
    const demoInterval = setInterval(() => {
      setCurrentPageType(pageTypes[currentIndex].id);
      currentIndex = (currentIndex + 1) % pageTypes.length;
    }, 2000);

    setTimeout(() => {
      clearInterval(demoInterval);
      setDemoRunning(false);
      setCurrentPageType('dashboard');
    }, 12000);
  };

  return (
    <VisuallyEnhancedDashboardLayout
      pageType={currentPageType}
      title="Visual Enhancement Demo"
      enableVisualEffects={enableVisualEffects}
      enableParticles={enableParticles}
      customQuickActions={customQuickActions}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 700,
                background: `linear-gradient(135deg, 
                  ${theme.palette.primary.main} 0%, 
                  ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
              }}
            >
              Visually Enhanced Header
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              Experience the next generation of header design with modern visual effects,
              animations, and glass morphism.
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              <AlertTitle>🎨 Visual Enhancement Features</AlertTitle>
              This enhanced header includes glass morphism, gradient animations, neon effects,
              floating elements, and smooth transitions for a modern user experience.
            </Alert>
          </Box>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card sx={{ mb: 4, background: alpha(theme.palette.background.paper, 0.8), backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <SettingsIcon sx={{ mr: 1 }} />
                Demo Controls
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={enableVisualEffects}
                          onChange={(e) => setEnableVisualEffects(e.target.checked)}
                        />
                      }
                      label="Enable Visual Effects"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={enableVoiceSearch}
                          onChange={(e) => setEnableVoiceSearch(e.target.checked)}
                        />
                      }
                      label="Enable Voice Search"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={enableParticles}
                          onChange={(e) => setEnableParticles(e.target.checked)}
                        />
                      }
                      label="Enable Particle Effects"
                    />
                  </Stack>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <Button
                      variant="contained"
                      onClick={startDemo}
                      disabled={demoRunning}
                      startIcon={demoRunning ? <StopIcon /> : <PlayArrowIcon />}
                      sx={{
                        background: `linear-gradient(135deg, 
                          ${theme.palette.primary.main} 0%, 
                          ${theme.palette.secondary.main} 100%)`,
                        '&:hover': {
                          background: `linear-gradient(135deg, 
                            ${theme.palette.primary.dark} 0%, 
                            ${theme.palette.secondary.dark} 100%)`,
                        },
                      }}
                    >
                      {demoRunning ? 'Demo Running...' : 'Start Page Type Demo'}
                    </Button>
                    
                    <Button
                      variant="outlined"
                      onClick={handleThemeToggle}
                      startIcon={<RefreshIcon />}
                    >
                      Toggle Theme
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>

        {/* Page Type Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card sx={{ mb: 4, background: alpha(theme.palette.background.paper, 0.8), backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Page Type Configuration
              </Typography>
              
              <Grid container spacing={2}>
                {pageTypes.map((pageType) => (
                  <Grid item xs={6} sm={4} md={2} key={pageType.id}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant={currentPageType === pageType.id ? 'contained' : 'outlined'}
                        fullWidth
                        onClick={() => setCurrentPageType(pageType.id)}
                        startIcon={pageType.icon}
                        sx={{
                          py: 1.5,
                          ...(currentPageType === pageType.id && {
                            background: `linear-gradient(135deg, 
                              ${theme.palette.primary.main} 0%, 
                              ${theme.palette.secondary.main} 100%)`,
                          }),
                        }}
                      >
                        {pageType.name}
                      </Button>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
              
              {demoRunning && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Chip
                    label={`Demo Active - Current: ${pageTypes.find(p => p.id === currentPageType)?.name}`}
                    color="primary"
                    sx={{
                      background: `linear-gradient(135deg, 
                        ${theme.palette.primary.main} 0%, 
                        ${theme.palette.secondary.main} 100%)`,
                      animation: 'pulse 2s ease-in-out infinite',
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.7 },
                      },
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Visual Features List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card sx={{ mb: 4, background: alpha(theme.palette.background.paper, 0.8), backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <AutoAwesomeIcon sx={{ mr: 1 }} />
                Visual Enhancement Features
              </Typography>
              
              <List>
                {visualFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <ListItem
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        background: feature.enabled 
                          ? alpha(theme.palette.success.main, 0.1)
                          : alpha(theme.palette.grey[500], 0.1),
                        border: `1px solid ${feature.enabled 
                          ? alpha(theme.palette.success.main, 0.3)
                          : alpha(theme.palette.grey[500], 0.3)}`,
                      }}
                    >
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: feature.enabled
                              ? `linear-gradient(135deg, 
                                  ${theme.palette.success.main} 0%, 
                                  ${theme.palette.success.dark} 100%)`
                              : alpha(theme.palette.grey[500], 0.3),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: feature.enabled ? 'white' : 'text.secondary',
                          }}
                        >
                          {feature.enabled ? <VisibilityIcon /> : <VisibilityIcon />}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={feature.title}
                        secondary={feature.description}
                        primaryTypographyProps={{
                          fontWeight: 600,
                          color: feature.enabled ? 'success.main' : 'text.secondary',
                        }}
                      />
                      <Chip
                        label={feature.enabled ? 'Active' : 'Disabled'}
                        size="small"
                        color={feature.enabled ? 'success' : 'default'}
                        variant={feature.enabled ? 'filled' : 'outlined'}
                      />
                    </ListItem>
                  </motion.div>
                ))}
              </List>
            </CardContent>
          </Card>
        </motion.div>

        {/* Code Example */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card sx={{ background: alpha(theme.palette.background.paper, 0.8), backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <CodeIcon sx={{ mr: 1 }} />
                Usage Example
              </Typography>
              
              <Paper
                sx={{
                  p: 3,
                  background: alpha(theme.palette.grey[900], 0.9),
                  color: theme.palette.common.white,
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  overflow: 'auto',
                }}
              >
                <pre>{`import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';

export default function MyPage() {
  return (
    <VisuallyEnhancedDashboardLayout
      pageType="dashboard"
      title="My Dashboard"
      enableVisualEffects={true}
      enableParticles={false}
      customQuickActions={[
        {
          id: 'custom-action',
          title: 'Custom Action',
          icon: <CustomIcon />,
          path: '/custom',
          color: '#FF6B6B',
          isNew: true,
        },
      ]}
    >
      {/* Your page content */}
    </VisuallyEnhancedDashboardLayout>
  );
}`}</pre>
              </Paper>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
    </VisuallyEnhancedDashboardLayout>
  );
};

export default VisuallyEnhancedHeaderExamples;