"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  useTheme,
  alpha,
  Avatar,
  IconButton,
  Alert,
  Fade,
  Slide,
  Tooltip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Container,
  Grow,
} from '@mui/material';
import {
  AccountBalance as GstIcon,
  Description as RegularIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Calculate as CalculateIcon,
  Receipt as ReceiptIcon,
  ArrowForward as ArrowForwardIcon,
  Help as HelpIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  Lightbulb as LightbulbIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Assessment as AssessmentIcon,
  Verified as VerifiedIcon,
  AutoAwesome as AutoAwesomeIcon,
  Rocket as RocketIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface EnhancedInvoiceCreationProps {
  onCreateInvoice?: (type: 'gst' | 'regular', options?: any) => void;
}

// Optimized opacity constants for better performance and consistency
const OPACITY_CONFIG = {
  // Background opacities
  cardBackground: 0.08,
  gradientBackground: 0.12,
  paperBackground: 0.06,
  
  // Border opacities
  borderDefault: 0.15,
  borderHover: 0.4,
  borderActive: 1,
  
  // Shadow opacities
  shadowDefault: 0.2,
  shadowHover: 0.35,
  shadowActive: 0.5,
  
  // Overlay opacities
  overlayLight: 0.04,
  overlayMedium: 0.08,
  overlayStrong: 0.12,
} as const;

export default function EnhancedInvoiceCreationOptimized({ onCreateInvoice }: EnhancedInvoiceCreationProps) {
  const theme = useTheme();
  const router = useRouter();
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'gst' | 'regular' | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentActivity, setRecentActivity] = useState([
    { type: 'gst', count: 12, trend: '+15%' },
    { type: 'regular', count: 8, trend: '+8%' }
  ]);

  // Memoized opacity styles for better performance
  const opacityStyles = useMemo(() => ({
    primary: {
      background: alpha(theme.palette.primary.main, OPACITY_CONFIG.cardBackground),
      border: alpha(theme.palette.primary.main, OPACITY_CONFIG.borderDefault),
      borderHover: alpha(theme.palette.primary.main, OPACITY_CONFIG.borderHover),
      shadow: alpha(theme.palette.primary.main, OPACITY_CONFIG.shadowDefault),
      shadowHover: alpha(theme.palette.primary.main, OPACITY_CONFIG.shadowHover),
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, OPACITY_CONFIG.gradientBackground)} 0%, ${alpha(theme.palette.primary.dark, OPACITY_CONFIG.gradientBackground)} 100%)`,
    },
    secondary: {
      background: alpha(theme.palette.secondary.main, OPACITY_CONFIG.cardBackground),
      border: alpha(theme.palette.secondary.main, OPACITY_CONFIG.borderDefault),
      borderHover: alpha(theme.palette.secondary.main, OPACITY_CONFIG.borderHover),
      shadow: alpha(theme.palette.secondary.main, OPACITY_CONFIG.shadowDefault),
      shadowHover: alpha(theme.palette.secondary.main, OPACITY_CONFIG.shadowHover),
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, OPACITY_CONFIG.gradientBackground)} 0%, ${alpha(theme.palette.secondary.dark, OPACITY_CONFIG.gradientBackground)} 100%)`,
    },
    success: {
      background: alpha(theme.palette.success.main, OPACITY_CONFIG.paperBackground),
      border: alpha(theme.palette.success.main, OPACITY_CONFIG.borderDefault),
      shadow: alpha(theme.palette.success.main, OPACITY_CONFIG.shadowDefault),
    },
    info: {
      background: alpha(theme.palette.info.main, OPACITY_CONFIG.paperBackground),
      border: alpha(theme.palette.info.main, OPACITY_CONFIG.borderDefault),
      shadow: alpha(theme.palette.info.main, OPACITY_CONFIG.shadowDefault),
    },
    warning: {
      background: alpha(theme.palette.warning.main, OPACITY_CONFIG.paperBackground),
      border: alpha(theme.palette.warning.main, OPACITY_CONFIG.borderDefault),
      shadow: alpha(theme.palette.warning.main, OPACITY_CONFIG.shadowDefault),
    },
  }), [theme]);

  const handleCreateInvoice = async (type: 'gst' | 'regular', gstOnly = false) => {
    setLoading(true);
    
    // Simulate loading for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (onCreateInvoice) {
      onCreateInvoice(type, { gstOnly });
    } else {
      // Default routing
      if (type === 'gst') {
        if (gstOnly) {
          router.push('/invoices/gst-only');
        } else {
          router.push('/invoices/gst/new');
        }
      } else {
        router.push('/invoices/new');
      }
    }
    
    setLoading(false);
  };

  const invoiceTypes = useMemo(() => [
    {
      type: 'gst' as const,
      title: 'GST Invoice',
      subtitle: 'Professional tax-compliant invoicing',
      description: 'Create comprehensive GST-compliant invoices with automatic tax calculations, HSN codes, and professional formatting for business transactions.',
      icon: <GstIcon sx={{ fontSize: 48 }} />,
      color: theme.palette.primary.main,
      gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
      styles: opacityStyles.primary,
      features: [
        { text: 'Automatic GST calculation (CGST, SGST, IGST)', icon: <CalculateIcon /> },
        { text: 'HSN/SAC code support', icon: <VerifiedIcon /> },
        { text: 'GSTIN validation', icon: <SecurityIcon /> },
        { text: 'Tax-compliant format', icon: <CheckIcon /> },
        { text: 'Inter-state and intra-state handling', icon: <BusinessIcon /> },
        { text: 'Professional business format', icon: <StarIcon /> }
      ],
      benefits: [
        'Save 80% time on tax calculations',
        'Ensure 100% compliance',
        'Professional appearance',
        'Automatic validations'
      ],
      stats: { popularity: 85, timesSaved: '2.5 hrs/week', accuracy: '99.9%' },
      recommended: true
    },
    {
      type: 'regular' as const,
      title: 'Simple Invoice',
      subtitle: 'Quick and easy invoicing',
      description: 'Create clean, straightforward invoices perfect for individual customers and simple transactions without complex tax calculations.',
      icon: <RegularIcon sx={{ fontSize: 48 }} />,
      color: theme.palette.secondary.main,
      gradient: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
      styles: opacityStyles.secondary,
      features: [
        { text: 'Simple and clean format', icon: <SpeedIcon /> },
        { text: 'No tax calculations', icon: <CheckIcon /> },
        { text: 'Quick creation process', icon: <RocketIcon /> },
        { text: 'Customer-friendly layout', icon: <PersonIcon /> },
        { text: 'Basic item listing', icon: <ReceiptIcon /> },
        { text: 'Easy to understand', icon: <LightbulbIcon /> }
      ],
      benefits: [
        'Create invoices in 30 seconds',
        'Perfect for retail customers',
        'No complexity',
        'Instant generation'
      ],
      stats: { popularity: 65, timesSaved: '1.5 hrs/week', accuracy: '100%' },
      recommended: false
    }
  ], [theme, opacityStyles]);

  const quickActions = useMemo(() => [
    {
      title: 'Duplicate Last Invoice',
      description: 'Copy your most recent invoice',
      icon: <ReceiptIcon />,
      color: theme.palette.info.main,
      styles: opacityStyles.info,
      action: () => console.log('Duplicate last invoice')
    },
    {
      title: 'Bulk Invoice Creation',
      description: 'Create multiple invoices at once',
      icon: <GroupIcon />,
      color: theme.palette.warning.main,
      styles: opacityStyles.warning,
      action: () => console.log('Bulk creation')
    },
    {
      title: 'Invoice Templates',
      description: 'Use pre-made templates',
      icon: <AssessmentIcon />,
      color: theme.palette.success.main,
      styles: opacityStyles.success,
      action: () => console.log('Templates')
    }
  ], [theme, opacityStyles]);

  const renderOptimizedInvoiceCard = (invoiceType: typeof invoiceTypes[0]) => (
    <Grow in timeout={1000} key={invoiceType.type}>
      <Card
        sx={{
          height: '100%',
          minHeight: { xs: 650, sm: 700, md: 750, lg: 800 },
          maxWidth: { xs: '100%', sm: 480, md: 520, lg: 560 },
          mx: 'auto',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          border: `3px solid ${invoiceType.styles.border}`,
          borderRadius: 4,
          background: invoiceType.styles.background,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-12px) scale(1.02)',
            border: `3px solid ${invoiceType.styles.borderHover}`,
            boxShadow: `0 25px 50px ${invoiceType.styles.shadowHover}`,
            background: invoiceType.styles.gradient,
          }
        }}
        onClick={() => setSelectedType(invoiceType.type)}
      >
        {/* Optimized Recommended Badge */}
        {invoiceType.recommended && (
          <Chip
            label="Recommended"
            size="medium"
            sx={{
              position: 'absolute',
              top: 20,
              right: 20,
              zIndex: 2,
              bgcolor: theme.palette.warning.main,
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.875rem',
              height: 32,
              boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, OPACITY_CONFIG.shadowDefault)}`,
            }}
            icon={<StarIcon sx={{ fontSize: 18 }} />}
          />
        )}

        {/* Optimized Background Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 140,
            background: invoiceType.gradient,
            opacity: OPACITY_CONFIG.overlayLight,
            transition: 'opacity 0.3s ease',
          }}
        />

        <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
          {/* Optimized Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Avatar
              sx={{
                background: invoiceType.gradient,
                width: { xs: 90, sm: 100, md: 110 },
                height: { xs: 90, sm: 100, md: 110 },
                mx: 'auto',
                mb: 3,
                boxShadow: `0 12px 32px ${invoiceType.styles.shadow}`,
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'scale(1.1) rotate(5deg)'
                }
              }}
            >
              {invoiceType.icon}
            </Avatar>
            <Typography variant="h4" fontWeight="bold" color={invoiceType.color} gutterBottom>
              {invoiceType.title}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              {invoiceType.subtitle}
            </Typography>
          </Box>

          {/* Optimized Stats */}
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 2, 
                  bgcolor: invoiceType.styles.background, 
                  borderRadius: 2,
                  border: `1px solid ${invoiceType.styles.border}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: invoiceType.styles.gradient,
                  }
                }}>
                  <Typography variant="h5" color={invoiceType.color} fontWeight="bold">
                    {invoiceType.stats.popularity}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    Popular
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 2, 
                  bgcolor: invoiceType.styles.background, 
                  borderRadius: 2,
                  border: `1px solid ${invoiceType.styles.border}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: invoiceType.styles.gradient,
                  }
                }}>
                  <Typography variant="h5" color={invoiceType.color} fontWeight="bold">
                    {invoiceType.stats.timesSaved}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    Time Saved
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 2, 
                  bgcolor: invoiceType.styles.background, 
                  borderRadius: 2,
                  border: `1px solid ${invoiceType.styles.border}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: invoiceType.styles.gradient,
                  }
                }}>
                  <Typography variant="h5" color={invoiceType.color} fontWeight="bold">
                    {invoiceType.stats.accuracy}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    Accuracy
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Description */}
          <Typography variant="body1" sx={{ mb: 4, flexGrow: 1, lineHeight: 1.7, fontSize: '1.1rem' }}>
            {invoiceType.description}
          </Typography>

          {/* Optimized Benefits */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AutoAwesomeIcon color="success" />
              Key Benefits
            </Typography>
            <Stack spacing={1}>
              {invoiceType.benefits.map((benefit, index) => (
                <Chip
                  key={index}
                  label={benefit}
                  size="medium"
                  variant="outlined"
                  sx={{ 
                    justifyContent: 'flex-start',
                    height: 36,
                    '& .MuiChip-label': { fontSize: '0.875rem', fontWeight: 'medium' },
                    borderColor: invoiceType.styles.border,
                    color: invoiceType.color,
                    bgcolor: 'transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: invoiceType.styles.background,
                      borderColor: invoiceType.styles.borderHover,
                    }
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* Optimized Action Button */}
          <Button
            variant="contained"
            size="large"
            fullWidth
            sx={{
              background: invoiceType.gradient,
              boxShadow: `0 6px 20px ${invoiceType.styles.shadow}`,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              height: 56,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: `0 10px 30px ${invoiceType.styles.shadowHover}`,
              }
            }}
            endIcon={<ArrowForwardIcon sx={{ fontSize: 24 }} />}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedType(invoiceType.type);
            }}
          >
            Create {invoiceType.title}
          </Button>
        </CardContent>
      </Card>
    </Grow>
  );

  const renderOptimizedQuickActionCard = (action: typeof quickActions[0], index: number) => (
    <Fade in timeout={1000 + index * 200} key={action.title}>
      <Card
        sx={{
          cursor: 'pointer',
          border: `2px solid ${action.styles.border}`,
          borderRadius: 3,
          bgcolor: action.styles.background,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.02)',
            border: `2px solid ${action.color}`,
            boxShadow: `0 8px 24px ${action.styles.shadow}`,
            bgcolor: action.styles.gradient || action.styles.background,
          }
        }}
        onClick={action.action}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: action.color, width: 48, height: 48 }}>
              {action.icon}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" fontWeight="medium">
                {action.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {action.description}
              </Typography>
            </Box>
            <ArrowForwardIcon color="action" sx={{ fontSize: 28 }} />
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );

  const renderOptimizedSelectionDialog = () => {
    const selectedInvoiceType = invoiceTypes.find(type => type.type === selectedType);
    if (!selectedInvoiceType) return null;

    return (
      <Dialog
        open={!!selectedType}
        onClose={() => setSelectedType(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3,
            background: selectedInvoiceType.styles.gradient,
          }
        }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ background: selectedInvoiceType.gradient, width: 56, height: 56 }}>
              {selectedInvoiceType.icon}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Create {selectedInvoiceType.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedInvoiceType.subtitle}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setSelectedType(null)} size="large">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {/* Optimized Progress Indicator */}
          {loading && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress 
                sx={{ 
                  borderRadius: 1,
                  height: 6,
                  bgcolor: selectedInvoiceType.styles.background,
                  '& .MuiLinearProgress-bar': {
                    background: selectedInvoiceType.gradient
                  }
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                Setting up your invoice creation...
              </Typography>
            </Box>
          )}

          <Grid container spacing={3}>
            {/* Optimized Features */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ 
                p: 3, 
                background: selectedInvoiceType.styles.background, 
                borderRadius: 2,
                border: `1px solid ${selectedInvoiceType.styles.border}`,
              }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckIcon sx={{ color: selectedInvoiceType.color }} />
                  What's Included
                </Typography>
                <List dense>
                  {selectedInvoiceType.features.map((feature, index) => (
                    <Fade in timeout={300 + index * 100} key={index}>
                      <ListItem sx={{ py: 1, pl: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Avatar sx={{ width: 24, height: 24, bgcolor: selectedInvoiceType.color }}>
                            {React.cloneElement(feature.icon, { sx: { fontSize: 14, color: 'white' } })}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature.text}
                          primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                        />
                      </ListItem>
                    </Fade>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* Optimized Benefits & Stats */}
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Paper sx={{ 
                  p: 3, 
                  background: opacityStyles.success.background, 
                  borderRadius: 2,
                  border: `1px solid ${opacityStyles.success.border}`,
                }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon color="success" />
                    Performance Stats
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main" fontWeight="bold">
                          {selectedInvoiceType.stats.popularity}%
                        </Typography>
                        <Typography variant="caption">User Choice</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main" fontWeight="bold">
                          {selectedInvoiceType.stats.timesSaved}
                        </Typography>
                        <Typography variant="caption">Time Saved</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main" fontWeight="bold">
                          {selectedInvoiceType.stats.accuracy}
                        </Typography>
                        <Typography variant="caption">Accuracy</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>

                <Paper sx={{ 
                  p: 3, 
                  background: opacityStyles.info.background, 
                  borderRadius: 2,
                  border: `1px solid ${opacityStyles.info.border}`,
                }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesomeIcon color="info" />
                    Key Benefits
                  </Typography>
                  <Stack spacing={1}>
                    {selectedInvoiceType.benefits.map((benefit, index) => (
                      <Chip
                        key={index}
                        label={benefit}
                        variant="filled"
                        size="small"
                        sx={{ 
                          bgcolor: opacityStyles.info.background,
                          color: theme.palette.info.main,
                          fontWeight: 'medium',
                          border: `1px solid ${opacityStyles.info.border}`,
                        }}
                      />
                    ))}
                  </Stack>
                </Paper>
              </Stack>
            </Grid>
          </Grid>

          {/* Optimized GST Options */}
          {selectedType === 'gst' && (
            <Fade in timeout={500}>
              <Box sx={{ mt: 4 }}>
                <Alert 
                  severity="info" 
                  sx={{ 
                    mb: 3,
                    background: opacityStyles.info.background,
                    border: `1px solid ${opacityStyles.info.border}`,
                  }}
                  icon={<InfoIcon />}
                >
                  <Typography variant="body2" fontWeight="medium">
                    <strong>Choose your GST invoice type:</strong> Select based on your customer type and business requirements.
                  </Typography>
                </Alert>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: `2px solid ${opacityStyles.primary.border}`,
                        background: opacityStyles.primary.background,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          border: `2px solid ${theme.palette.primary.main}`,
                          background: opacityStyles.primary.gradient,
                          boxShadow: `0 8px 24px ${opacityStyles.primary.shadow}`,
                        }
                      }}
                      onClick={() => handleCreateInvoice('gst', false)}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48, mx: 'auto', mb: 2 }}>
                          <BusinessIcon />
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          All Customers
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          For both GST registered and non-registered customers. Most flexible option.
                        </Typography>
                        <Stack spacing={1} sx={{ mb: 3 }}>
                          <Chip label="GST + Non-GST Customers" size="small" color="primary" />
                          <Chip label="Maximum Flexibility" size="small" variant="outlined" />
                        </Stack>
                        <Button 
                          variant="contained" 
                          size="large" 
                          fullWidth
                          disabled={loading}
                          startIcon={loading ? <ScheduleIcon /> : <BusinessIcon />}
                        >
                          {loading ? 'Setting Up...' : 'Choose This'}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: `2px solid ${opacityStyles.success.border}`,
                        background: opacityStyles.success.background,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          border: `2px solid ${theme.palette.success.main}`,
                          boxShadow: `0 8px 24px ${opacityStyles.success.shadow}`,
                        }
                      }}
                      onClick={() => handleCreateInvoice('gst', true)}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Avatar sx={{ bgcolor: theme.palette.success.main, width: 48, height: 48, mx: 'auto', mb: 2 }}>
                          <GstIcon />
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          GST Registered Only
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          Exclusively for customers with GST registration. Streamlined for B2B.
                        </Typography>
                        <Stack spacing={1} sx={{ mb: 3 }}>
                          <Chip label="B2B Focused" size="small" color="success" />
                          <Chip label="Streamlined Process" size="small" variant="outlined" />
                        </Stack>
                        <Button 
                          variant="contained" 
                          color="success" 
                          size="large" 
                          fullWidth
                          disabled={loading}
                          startIcon={loading ? <ScheduleIcon /> : <GstIcon />}
                        >
                          {loading ? 'Setting Up...' : 'Choose This'}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </Fade>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setSelectedType(null)} size="large" disabled={loading}>
            Cancel
          </Button>
          {selectedType === 'regular' && (
            <Button
              variant="contained"
              size="large"
              onClick={() => handleCreateInvoice('regular')}
              startIcon={loading ? <ScheduleIcon /> : selectedInvoiceType.icon}
              sx={{ background: selectedInvoiceType.gradient }}
              disabled={loading}
            >
              {loading ? 'Setting Up...' : 'Create Simple Invoice'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Container maxWidth="xl">
      <Box>
        {/* Optimized Header */}
        <Fade in timeout={1000}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h3" 
              fontWeight="bold" 
              gutterBottom
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2
              }}
            >
              Create New Invoice
            </Typography>
            
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
              Choose the perfect invoice type for your business needs. Our intelligent system helps you create professional invoices in minutes.
            </Typography>
            
            <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<HelpIcon />}
                onClick={() => setHelpDialogOpen(true)}
                size="large"
              >
                Need Help Choosing?
              </Button>
              <Button
                variant="outlined"
                startIcon={<PlayIcon />}
                size="large"
              >
                Watch Demo
              </Button>
            </Stack>
          </Box>
        </Fade>

        {/* Optimized Quick Actions */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={3}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} md={4} key={action.title}>
                {renderOptimizedQuickActionCard(action, index)}
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Optimized Main Invoice Type Cards */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 4 }}>
            Choose Invoice Type
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            {invoiceTypes.map(invoiceType => (
              <Grid item xs={12} lg={6} key={invoiceType.type}>
                {renderOptimizedInvoiceCard(invoiceType)}
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Optimized Comparison Section */}
        <Fade in timeout={1500}>
          <Box sx={{ mb: 6 }}>
            <Card sx={{ 
              background: alpha(theme.palette.background.paper, 0.9), 
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, OPACITY_CONFIG.borderDefault)}`,
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
                  Side-by-Side Comparison
                </Typography>
                
                <Grid container spacing={4}>
                  {invoiceTypes.map((type, index) => (
                    <Grid item xs={12} md={6} key={type.type}>
                      <Box sx={{ 
                        textAlign: 'center', 
                        p: 3, 
                        background: type.styles.background, 
                        borderRadius: 2,
                        border: `1px solid ${type.styles.border}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          background: type.styles.gradient,
                        }
                      }}>
                        <Avatar sx={{ background: type.gradient, width: 56, height: 56, mx: 'auto', mb: 2 }}>
                          {type.icon}
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold" gutterBottom color={type.color}>
                          {type.title}
                        </Typography>
                        <Stack spacing={1} sx={{ mb: 3 }}>
                          {type.benefits.slice(0, 3).map((benefit, idx) => (
                            <Chip 
                              key={idx}
                              label={benefit} 
                              size="small" 
                              sx={{ 
                                bgcolor: type.styles.background, 
                                color: type.color,
                                border: `1px solid ${type.styles.border}`,
                              }}
                            />
                          ))}
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          Perfect for {type.type === 'gst' ? 'business customers' : 'individual customers'}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Box>
        </Fade>

        {/* Optimized Advanced Options */}
        <Fade in timeout={2000}>
          <Box>
            <Accordion sx={{
              background: alpha(theme.palette.background.paper, 0.8),
              border: `1px solid ${alpha(theme.palette.divider, OPACITY_CONFIG.borderDefault)}`,
            }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" fontWeight="medium">
                  Advanced Options & Settings
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={<Switch checked={showAdvanced} onChange={(e) => setShowAdvanced(e.target.checked)} />}
                      label="Enable advanced features"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Access additional customization options and advanced invoice features.
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Recent Activity
                    </Typography>
                    {recentActivity.map((activity, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          {activity.type.toUpperCase()} Invoices: {activity.count}
                        </Typography>
                        <Chip label={activity.trend} size="small" color="success" />
                      </Box>
                    ))}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Fade>

        {/* Optimized Selection Dialog */}
        {selectedType && renderOptimizedSelectionDialog()}

        {/* Optimized Help Dialog */}
        <Dialog
          open={helpDialogOpen}
          onClose={() => setHelpDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ 
            sx: { 
              borderRadius: 3,
              background: alpha(theme.palette.background.paper, 0.95),
              backdropFilter: 'blur(10px)',
            } 
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                <HelpIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">Invoice Type Selection Guide</Typography>
                <Typography variant="body2" color="text.secondary">
                  Let us help you choose the right invoice type
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ 
                  p: 3, 
                  background: opacityStyles.primary.background,
                  border: `1px solid ${opacityStyles.primary.border}`,
                }}>
                  <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GstIcon />
                    Choose GST Invoice When:
                  </Typography>
                  <List>
                    {[
                      { text: 'Selling to businesses or companies', icon: <BusinessIcon /> },
                      { text: 'You need automatic tax calculations', icon: <CalculateIcon /> },
                      { text: 'Customer has GST registration', icon: <VerifiedIcon /> },
                      { text: 'You want professional, tax-compliant invoices', icon: <CheckIcon /> }
                    ].map((item, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ 
                  p: 3, 
                  background: opacityStyles.secondary.background,
                  border: `1px solid ${opacityStyles.secondary.border}`,
                }}>
                  <Typography variant="h6" gutterBottom color="secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RegularIcon />
                    Choose Simple Invoice When:
                  </Typography>
                  <List>
                    {[
                      { text: 'Selling to individual customers', icon: <PersonIcon /> },
                      { text: 'You want simple, easy-to-understand invoices', icon: <SpeedIcon /> },
                      { text: 'Customer doesn\'t need GST calculations', icon: <CheckIcon /> },
                      { text: 'Quick transactions or small amounts', icon: <RocketIcon /> }
                    ].map((item, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ 
              mt: 3,
              background: opacityStyles.info.background,
              border: `1px solid ${opacityStyles.info.border}`,
            }}>
              <Typography variant="body2">
                <strong>Still confused?</strong> When in doubt, choose GST Invoice as it can handle both GST and non-GST customers, 
                while Simple Invoice is only for basic transactions without tax calculations.
              </Typography>
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setHelpDialogOpen(false)} size="large">
              Got It, Thanks!
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}