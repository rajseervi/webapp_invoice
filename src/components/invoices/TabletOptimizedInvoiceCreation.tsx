"use client";
import React, { useState, useEffect } from 'react';
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
  Divider,
  Paper,
  useTheme,
  alpha,
  Avatar,
  IconButton,
  Alert,
  Fade,
  Slide,
  Tooltip,
  Badge,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Container,
  Grow,
  useMediaQuery,
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
  TouchApp as TouchIcon,
  Tablet as TabletIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface TabletOptimizedInvoiceCreationProps {
  onCreateInvoice?: (type: 'gst' | 'regular', options?: any) => void;
}

export default function TabletOptimizedInvoiceCreation({ onCreateInvoice }: TabletOptimizedInvoiceCreationProps) {
  const theme = useTheme();
  const router = useRouter();
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'gst' | 'regular' | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Tablet-specific breakpoints
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const isSmallTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isLargeTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

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

  const invoiceTypes = [
    {
      type: 'gst' as const,
      title: 'GST Invoice',
      subtitle: 'Professional tax-compliant invoicing',
      description: 'Create comprehensive GST-compliant invoices with automatic tax calculations, HSN codes, and professional formatting for business transactions.',
      icon: <GstIcon sx={{ fontSize: { xs: 40, sm: 48, md: 56 } }} />,
      color: theme.palette.primary.main,
      gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
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
      icon: <RegularIcon sx={{ fontSize: { xs: 40, sm: 48, md: 56 } }} />,
      color: theme.palette.secondary.main,
      gradient: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
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
  ];

  const quickActions = [
    {
      title: 'Duplicate Last Invoice',
      description: 'Copy your most recent invoice',
      icon: <ReceiptIcon />,
      color: theme.palette.info.main,
      action: () => console.log('Duplicate last invoice')
    },
    {
      title: 'Bulk Invoice Creation',
      description: 'Create multiple invoices at once',
      icon: <GroupIcon />,
      color: theme.palette.warning.main,
      action: () => console.log('Bulk creation')
    },
    {
      title: 'Invoice Templates',
      description: 'Use pre-made templates',
      icon: <AssessmentIcon />,
      color: theme.palette.success.main,
      action: () => console.log('Templates')
    }
  ];

  // Tablet-optimized card dimensions
  const getCardDimensions = () => {
    if (isMobile) {
      return {
        minHeight: 600,
        maxWidth: '100%',
        avatarSize: 80,
        padding: 3,
        spacing: 2
      };
    } else if (isSmallTablet) {
      return {
        minHeight: 720,
        maxWidth: 420,
        avatarSize: 100,
        padding: 4,
        spacing: 3
      };
    } else if (isLargeTablet) {
      return {
        minHeight: 780,
        maxWidth: 480,
        avatarSize: 120,
        padding: 5,
        spacing: 4
      };
    } else {
      return {
        minHeight: 800,
        maxWidth: 520,
        avatarSize: 130,
        padding: 5,
        spacing: 4
      };
    }
  };

  const cardDimensions = getCardDimensions();

  const renderTabletOptimizedInvoiceCard = (invoiceType: typeof invoiceTypes[0]) => (
    <Grow in timeout={1000} key={invoiceType.type}>
      <Card
        sx={{
          height: '100%',
          minHeight: cardDimensions.minHeight,
          maxWidth: cardDimensions.maxWidth,
          mx: 'auto',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          border: `3px solid ${alpha(invoiceType.color, 0.2)}`,
          borderRadius: { xs: 2, sm: 3, md: 4 },
          transition: 'all 0.3s ease-in-out',
          // Tablet-specific touch optimizations
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          '&:hover, &:focus': {
            transform: isTablet ? 'translateY(-8px) scale(1.01)' : 'translateY(-12px) scale(1.02)',
            border: `3px solid ${invoiceType.color}`,
            boxShadow: isTablet 
              ? `0 20px 40px ${alpha(invoiceType.color, 0.3)}` 
              : `0 25px 50px ${alpha(invoiceType.color, 0.4)}`,
          },
          '&:active': {
            transform: 'translateY(-4px) scale(0.99)',
            transition: 'all 0.1s ease-in-out',
          }
        }}
        onClick={() => setSelectedType(invoiceType.type)}
      >
        {/* Recommended Badge - Tablet optimized */}
        {invoiceType.recommended && (
          <Chip
            label="Recommended"
            size={isTablet ? "medium" : "small"}
            sx={{
              position: 'absolute',
              top: { xs: 16, sm: 20, md: 24 },
              right: { xs: 16, sm: 20, md: 24 },
              zIndex: 1,
              bgcolor: theme.palette.warning.main,
              color: 'white',
              fontWeight: 'bold',
              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
              height: { xs: 28, sm: 32, md: 36 },
              '& .MuiChip-icon': {
                fontSize: { xs: 16, sm: 18, md: 20 }
              }
            }}
            icon={<StarIcon />}
          />
        )}

        {/* Background Gradient - Tablet optimized */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: { xs: 120, sm: 140, md: 160 },
            background: invoiceType.gradient,
            opacity: 0.1
          }}
        />

        <CardContent sx={{ 
          p: cardDimensions.padding, 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          position: 'relative' 
        }}>
          {/* Header - Tablet optimized */}
          <Box sx={{ textAlign: 'center', mb: cardDimensions.spacing }}>
            <Avatar
              sx={{
                background: invoiceType.gradient,
                width: cardDimensions.avatarSize,
                height: cardDimensions.avatarSize,
                mx: 'auto',
                mb: { xs: 2, sm: 3, md: 4 },
                boxShadow: `0 ${isTablet ? 8 : 12}px ${isTablet ? 24 : 32}px ${alpha(invoiceType.color, 0.3)}`,
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: isTablet ? 'scale(1.05) rotate(3deg)' : 'scale(1.1) rotate(5deg)'
                }
              }}
            >
              {invoiceType.icon}
            </Avatar>
            <Typography 
              variant={isTablet ? "h4" : "h3"} 
              fontWeight="bold" 
              color={invoiceType.color} 
              gutterBottom
              sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' } }}
            >
              {invoiceType.title}
            </Typography>
            <Typography 
              variant={isTablet ? "h6" : "h5"} 
              color="text.secondary" 
              sx={{ 
                mb: 2,
                fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                lineHeight: 1.4
              }}
            >
              {invoiceType.subtitle}
            </Typography>
          </Box>

          {/* Stats - Tablet optimized grid */}
          <Box sx={{ mb: cardDimensions.spacing }}>
            <Grid container spacing={{ xs: 1, sm: 2, md: 2 }}>
              <Grid item xs={4}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: { xs: 1.5, sm: 2, md: 2.5 }, 
                  bgcolor: alpha(invoiceType.color, 0.05), 
                  borderRadius: { xs: 1, sm: 2, md: 2 },
                  minHeight: { xs: 60, sm: 80, md: 90 },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <Typography 
                    variant={isTablet ? "h4" : "h5"} 
                    color={invoiceType.color} 
                    fontWeight="bold"
                    sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }}
                  >
                    {invoiceType.stats.popularity}%
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    fontWeight="medium"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' } }}
                  >
                    Popular
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: { xs: 1.5, sm: 2, md: 2.5 }, 
                  bgcolor: alpha(invoiceType.color, 0.05), 
                  borderRadius: { xs: 1, sm: 2, md: 2 },
                  minHeight: { xs: 60, sm: 80, md: 90 },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <Typography 
                    variant={isTablet ? "h4" : "h5"} 
                    color={invoiceType.color} 
                    fontWeight="bold"
                    sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }}
                  >
                    {invoiceType.stats.timesSaved}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    fontWeight="medium"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' } }}
                  >
                    Time Saved
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: { xs: 1.5, sm: 2, md: 2.5 }, 
                  bgcolor: alpha(invoiceType.color, 0.05), 
                  borderRadius: { xs: 1, sm: 2, md: 2 },
                  minHeight: { xs: 60, sm: 80, md: 90 },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <Typography 
                    variant={isTablet ? "h4" : "h5"} 
                    color={invoiceType.color} 
                    fontWeight="bold"
                    sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }}
                  >
                    {invoiceType.stats.accuracy}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    fontWeight="medium"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' } }}
                  >
                    Accuracy
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Description - Tablet optimized */}
          <Typography 
            variant="body1" 
            sx={{ 
              mb: cardDimensions.spacing, 
              flexGrow: 1, 
              lineHeight: 1.6,
              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
              textAlign: { xs: 'left', sm: 'center', md: 'left' }
            }}
          >
            {invoiceType.description}
          </Typography>

          {/* Benefits - Tablet optimized */}
          <Box sx={{ mb: cardDimensions.spacing }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mb: 2,
                fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.375rem' }
              }}
            >
              <AutoAwesomeIcon color="success" sx={{ fontSize: { xs: 20, sm: 24, md: 28 } }} />
              Key Benefits
            </Typography>
            <Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }}>
              {invoiceType.benefits.map((benefit, index) => (
                <Grid item xs={12} sm={6} md={12} key={index}>
                  <Chip
                    label={benefit}
                    size={isTablet ? "medium" : "small"}
                    variant="outlined"
                    sx={{ 
                      width: '100%',
                      justifyContent: 'flex-start',
                      height: { xs: 32, sm: 40, md: 44 },
                      '& .MuiChip-label': { 
                        fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                        fontWeight: 'medium',
                        padding: { xs: '0 8px', sm: '0 12px', md: '0 16px' }
                      },
                      borderColor: alpha(invoiceType.color, 0.3),
                      color: invoiceType.color,
                      '&:hover': {
                        bgcolor: alpha(invoiceType.color, 0.05),
                        borderColor: invoiceType.color
                      }
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Action Button - Tablet optimized */}
          <Button
            variant="contained"
            size="large"
            fullWidth
            sx={{
              background: invoiceType.gradient,
              boxShadow: `0 6px 20px ${alpha(invoiceType.color, 0.4)}`,
              transition: 'all 0.2s ease-in-out',
              height: { xs: 48, sm: 56, md: 64 },
              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
              fontWeight: 'bold',
              borderRadius: { xs: 2, sm: 3, md: 3 },
              // Tablet touch optimizations
              minHeight: 44, // Minimum touch target size
              '&:hover': {
                transform: isTablet ? 'scale(1.01)' : 'scale(1.02)',
                boxShadow: `0 8px 24px ${alpha(invoiceType.color, 0.5)}`,
              },
              '&:active': {
                transform: 'scale(0.98)',
                transition: 'all 0.1s ease-in-out',
              }
            }}
            endIcon={<ArrowForwardIcon sx={{ fontSize: { xs: 20, sm: 24, md: 28 } }} />}
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

  const renderTabletOptimizedQuickActionCard = (action: typeof quickActions[0], index: number) => (
    <Fade in timeout={1000 + index * 200} key={action.title}>
      <Card
        sx={{
          cursor: 'pointer',
          border: `2px solid ${alpha(action.color, 0.3)}`,
          borderRadius: { xs: 2, sm: 3, md: 3 },
          transition: 'all 0.2s ease-in-out',
          minHeight: { xs: 80, sm: 100, md: 120 },
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          '&:hover': {
            transform: isTablet ? 'scale(1.01)' : 'scale(1.02)',
            border: `2px solid ${action.color}`,
            boxShadow: `0 8px 24px ${alpha(action.color, 0.2)}`
          },
          '&:active': {
            transform: 'scale(0.98)',
            transition: 'all 0.1s ease-in-out',
          }
        }}
        onClick={action.action}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 3, md: 3 } }}>
            <Avatar sx={{ 
              bgcolor: action.color, 
              width: { xs: 40, sm: 48, md: 56 }, 
              height: { xs: 40, sm: 48, md: 56 } 
            }}>
              {action.icon}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography 
                variant="h6" 
                fontWeight="medium"
                sx={{ fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}
              >
                {action.title}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' } }}
              >
                {action.description}
              </Typography>
            </Box>
            <ArrowForwardIcon 
              color="action" 
              sx={{ fontSize: { xs: 24, sm: 28, md: 32 } }} 
            />
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );

  return (
    <Container 
      maxWidth={isTablet ? "lg" : "xl"} 
      sx={{ 
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, sm: 3, md: 4 }
      }}
    >
      <Box>
        {/* Enhanced Header - Tablet optimized */}
        <Fade in timeout={1000}>
          <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 6, md: 8 } }}>
            {/* Tablet indicator */}
            {isTablet && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Chip
                  icon={<TabletIcon />}
                  label="Optimized for Tablet"
                  color="primary"
                  variant="outlined"
                  sx={{ fontSize: '0.875rem' }}
                />
              </Box>
            )}
            
            <Typography 
              variant={isTablet ? "h2" : "h3"}
              fontWeight="bold" 
              gutterBottom
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: { xs: 2, sm: 3, md: 4 },
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
              }}
            >
              Create New Invoice
            </Typography>
            
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                mb: { xs: 3, sm: 4, md: 5 }, 
                maxWidth: { xs: '100%', sm: 600, md: 700 }, 
                mx: 'auto',
                fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.375rem' },
                lineHeight: 1.5,
                px: { xs: 1, sm: 2, md: 0 }
              }}
            >
              Choose the perfect invoice type for your business needs. Our intelligent system helps you create professional invoices in minutes.
            </Typography>
            
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={{ xs: 2, sm: 3, md: 4 }} 
              justifyContent="center" 
              alignItems="center"
            >
              <Button
                variant="outlined"
                startIcon={<HelpIcon />}
                onClick={() => setHelpDialogOpen(true)}
                size={isTablet ? "large" : "medium"}
                sx={{ 
                  minWidth: { xs: 200, sm: 220, md: 240 },
                  height: { xs: 44, sm: 48, md: 52 },
                  fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
                }}
              >
                Need Help Choosing?
              </Button>
              <Button
                variant="outlined"
                startIcon={<PlayIcon />}
                size={isTablet ? "large" : "medium"}
                sx={{ 
                  minWidth: { xs: 200, sm: 220, md: 240 },
                  height: { xs: 44, sm: 48, md: 52 },
                  fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
                }}
              >
                Watch Demo
              </Button>
            </Stack>
          </Box>
        </Fade>

        {/* Quick Actions - Tablet optimized */}
        <Box sx={{ mb: { xs: 4, sm: 6, md: 8 } }}>
          <Typography 
            variant="h4" 
            fontWeight="bold" 
            gutterBottom 
            sx={{ 
              mb: { xs: 2, sm: 3, md: 4 },
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' }
            }}
          >
            Quick Actions
          </Typography>
          <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={4} key={action.title}>
                {renderTabletOptimizedQuickActionCard(action, index)}
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Main Invoice Type Cards - Tablet optimized layout */}
        <Box sx={{ mb: { xs: 4, sm: 6, md: 8 } }}>
          <Typography 
            variant="h4" 
            fontWeight="bold" 
            gutterBottom 
            sx={{ 
              mb: { xs: 3, sm: 4, md: 5 },
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' }
            }}
          >
            Choose Invoice Type
          </Typography>
          
          {/* Tablet-specific layout */}
          {isTablet ? (
            <Grid container spacing={{ xs: 3, sm: 4, md: 5 }} justifyContent="center">
              {invoiceTypes.map(invoiceType => (
                <Grid item xs={12} sm={6} key={invoiceType.type}>
                  {renderTabletOptimizedInvoiceCard(invoiceType)}
                </Grid>
              ))}
            </Grid>
          ) : (
            <Grid container spacing={4} justifyContent="center">
              {invoiceTypes.map(invoiceType => (
                <Grid item xs={12} lg={6} key={invoiceType.type}>
                  {renderTabletOptimizedInvoiceCard(invoiceType)}
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Enhanced Comparison Section - Tablet optimized */}
        <Fade in timeout={1500}>
          <Box sx={{ mb: { xs: 4, sm: 6, md: 8 } }}>
            <Card sx={{ 
              background: alpha(theme.palette.background.paper, 0.8), 
              backdropFilter: 'blur(10px)',
              borderRadius: { xs: 2, sm: 3, md: 4 }
            }}>
              <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                <Typography 
                  variant="h4" 
                  fontWeight="bold" 
                  gutterBottom 
                  sx={{ 
                    textAlign: 'center', 
                    mb: { xs: 3, sm: 4, md: 5 },
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' }
                  }}
                >
                  Side-by-Side Comparison
                </Typography>
                
                <Grid container spacing={{ xs: 3, sm: 4, md: 5 }}>
                  {invoiceTypes.map((type, index) => (
                    <Grid item xs={12} md={6} key={type.type}>
                      <Box sx={{ 
                        textAlign: 'center', 
                        p: { xs: 3, sm: 4, md: 5 }, 
                        background: alpha(type.color, 0.05), 
                        borderRadius: { xs: 2, sm: 3, md: 3 },
                        border: `2px solid ${alpha(type.color, 0.2)}`,
                        minHeight: { xs: 200, sm: 250, md: 280 }
                      }}>
                        <Avatar sx={{ 
                          background: type.gradient, 
                          width: { xs: 48, sm: 64, md: 72 }, 
                          height: { xs: 48, sm: 64, md: 72 }, 
                          mx: 'auto', 
                          mb: { xs: 2, sm: 3, md: 3 } 
                        }}>
                          {type.icon}
                        </Avatar>
                        <Typography 
                          variant="h5" 
                          fontWeight="bold" 
                          gutterBottom 
                          color={type.color}
                          sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }}
                        >
                          {type.title}
                        </Typography>
                        <Stack spacing={{ xs: 1, sm: 1.5, md: 2 }} sx={{ mb: { xs: 2, sm: 3, md: 3 } }}>
                          {type.benefits.slice(0, 3).map((benefit, idx) => (
                            <Chip 
                              key={idx}
                              label={benefit} 
                              size={isTablet ? "medium" : "small"}
                              sx={{ 
                                bgcolor: alpha(type.color, 0.1), 
                                color: type.color,
                                fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                                height: { xs: 28, sm: 32, md: 36 }
                              }}
                            />
                          ))}
                        </Stack>
                        <Typography 
                          variant="body1" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}
                        >
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

        {/* Touch-friendly help text for tablets */}
        {isTablet && (
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Alert 
              severity="info" 
              sx={{ 
                maxWidth: 600, 
                mx: 'auto',
                '& .MuiAlert-message': {
                  fontSize: '1rem'
                }
              }}
              icon={<TouchIcon />}
            >
              <Typography variant="body1">
                <strong>Tablet Optimized:</strong> Tap any card to select your invoice type. All buttons are sized for comfortable touch interaction.
              </Typography>
            </Alert>
          </Box>
        )}

        {/* Selection Dialog - Tablet optimized */}
        {selectedType && (
          <Dialog
            open={!!selectedType}
            onClose={() => setSelectedType(null)}
            maxWidth={isTablet ? "md" : "lg"}
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
              sx: { 
                borderRadius: { xs: 0, sm: 3, md: 4 },
                maxHeight: { xs: '100%', sm: '90vh', md: '85vh' }
              }
            }}
            TransitionComponent={Slide}
            TransitionProps={{ direction: 'up' }}
          >
            {/* Dialog content would go here - simplified for brevity */}
            <DialogTitle sx={{ 
              p: { xs: 2, sm: 3, md: 4 },
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" fontWeight="bold">
                  Create {invoiceTypes.find(t => t.type === selectedType)?.title}
                </Typography>
                <IconButton 
                  onClick={() => setSelectedType(null)} 
                  size={isTablet ? "large" : "medium"}
                  sx={{ 
                    width: { xs: 40, sm: 48, md: 56 },
                    height: { xs: 40, sm: 48, md: 56 }
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              <Typography variant="body1" sx={{ fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}>
                Dialog content for {selectedType} invoice creation...
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              <Button 
                onClick={() => setSelectedType(null)} 
                size={isTablet ? "large" : "medium"}
                sx={{ minHeight: 44 }}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                size={isTablet ? "large" : "medium"}
                sx={{ minHeight: 44 }}
                onClick={() => handleCreateInvoice(selectedType)}
              >
                Create Invoice
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Box>
    </Container>
  );
}