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
  Stepper,
  Step,
  StepLabel,
  Fade,
  Slide,
  Zoom,
  Tooltip,
  Badge,
  LinearProgress,
  Skeleton,
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
  CloudDone as CloudIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  Lightbulb as LightbulbIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Assessment as AssessmentIcon,
  LocalOffer as OfferIcon,
  Verified as VerifiedIcon,
  AutoAwesome as AutoAwesomeIcon,
  Rocket as RocketIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface EnhancedInvoiceCreationProps {
  onCreateInvoice?: (type: 'gst' | 'regular', options?: any) => void;
}

export default function EnhancedInvoiceCreationFallback({ onCreateInvoice }: EnhancedInvoiceCreationProps) {
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
      icon: <GstIcon sx={{ fontSize: 40 }} />,
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
      icon: <RegularIcon sx={{ fontSize: 40 }} />,
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

  const renderEnhancedInvoiceCard = (invoiceType: typeof invoiceTypes[0]) => (
    <Grow in timeout={1000} key={invoiceType.type}>
      <Card
        sx={{
          height: '100%',
          minHeight: 520,
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          border: `2px solid ${alpha(invoiceType.color, 0.2)}`,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-8px)',
            border: `2px solid ${invoiceType.color}`,
            boxShadow: `0 20px 40px ${alpha(invoiceType.color, 0.3)}`,
          }
        }}
        onClick={() => setSelectedType(invoiceType.type)}
      >
        {/* Recommended Badge */}
        {invoiceType.recommended && (
          <Chip
            label="Recommended"
            size="small"
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 1,
              bgcolor: theme.palette.warning.main,
              color: 'white',
              fontWeight: 'bold'
            }}
            icon={<StarIcon sx={{ fontSize: 16 }} />}
          />
        )}

        {/* Background Gradient */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 120,
            background: invoiceType.gradient,
            opacity: 0.1
          }}
        />

        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar
              sx={{
                background: invoiceType.gradient,
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 2,
                boxShadow: `0 8px 24px ${alpha(invoiceType.color, 0.3)}`,
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.1) rotate(5deg)'
                }
              }}
            >
              {invoiceType.icon}
            </Avatar>
            <Typography variant="h5" fontWeight="bold" color={invoiceType.color} gutterBottom>
              {invoiceType.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {invoiceType.subtitle}
            </Typography>
          </Box>

          {/* Stats */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color={invoiceType.color} fontWeight="bold">
                    {invoiceType.stats.popularity}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Popular
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color={invoiceType.color} fontWeight="bold">
                    {invoiceType.stats.timesSaved}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Time Saved
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color={invoiceType.color} fontWeight="bold">
                    {invoiceType.stats.accuracy}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Accuracy
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Description */}
          <Typography variant="body2" sx={{ mb: 3, flexGrow: 1, lineHeight: 1.6 }}>
            {invoiceType.description}
          </Typography>

          {/* Benefits */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesomeIcon color="success" fontSize="small" />
              Key Benefits
            </Typography>
            <Stack spacing={0.5}>
              {invoiceType.benefits.map((benefit, index) => (
                <Chip
                  key={index}
                  label={benefit}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    justifyContent: 'flex-start',
                    '& .MuiChip-label': { fontSize: '0.75rem' }
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* Action Button */}
          <Button
            variant="contained"
            size="large"
            fullWidth
            sx={{
              background: invoiceType.gradient,
              boxShadow: `0 4px 16px ${alpha(invoiceType.color, 0.4)}`,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: `0 8px 24px ${alpha(invoiceType.color, 0.5)}`,
              }
            }}
            endIcon={<ArrowForwardIcon />}
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

  const renderQuickActionCard = (action: typeof quickActions[0], index: number) => (
    <Fade in timeout={1000 + index * 200} key={action.title}>
      <Card
        sx={{
          cursor: 'pointer',
          border: `1px solid ${alpha(action.color, 0.3)}`,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.02)',
            border: `1px solid ${action.color}`,
            boxShadow: `0 8px 24px ${alpha(action.color, 0.2)}`
          }
        }}
        onClick={action.action}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: action.color, width: 40, height: 40 }}>
              {action.icon}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" fontWeight="medium">
                {action.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {action.description}
              </Typography>
            </Box>
            <ArrowForwardIcon color="action" />
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );

  const renderEnhancedSelectionDialog = () => {
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
            background: `linear-gradient(135deg, ${alpha(selectedInvoiceType.color, 0.05)} 0%, ${alpha(selectedInvoiceType.color, 0.02)} 100%)`
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
          {/* Progress Indicator */}
          {loading && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress 
                sx={{ 
                  borderRadius: 1,
                  height: 6,
                  bgcolor: alpha(selectedInvoiceType.color, 0.1),
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
            {/* Features */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, background: alpha(selectedInvoiceType.color, 0.05), borderRadius: 2 }}>
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

            {/* Benefits & Stats */}
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Paper sx={{ p: 3, background: alpha(theme.palette.success.main, 0.05), borderRadius: 2 }}>
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

                <Paper sx={{ p: 3, background: alpha(theme.palette.info.main, 0.05), borderRadius: 2 }}>
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
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                          color: theme.palette.info.main,
                          fontWeight: 'medium'
                        }}
                      />
                    ))}
                  </Stack>
                </Paper>
              </Stack>
            </Grid>
          </Grid>

          {/* GST Options */}
          {selectedType === 'gst' && (
            <Fade in timeout={500}>
              <Box sx={{ mt: 4 }}>
                <Alert 
                  severity="info" 
                  sx={{ 
                    mb: 3,
                    background: alpha(theme.palette.info.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
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
                        border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                        background: alpha(theme.palette.primary.main, 0.02),
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          border: `2px solid ${theme.palette.primary.main}`,
                          background: alpha(theme.palette.primary.main, 0.05),
                          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`
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
                        border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`,
                        background: alpha(theme.palette.success.main, 0.02),
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          border: `2px solid ${theme.palette.success.main}`,
                          background: alpha(theme.palette.success.main, 0.05),
                          boxShadow: `0 8px 24px ${alpha(theme.palette.success.main, 0.2)}`
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
        {/* Enhanced Header */}
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
             4 Choose the perfect invoice type for your business needs. Our intelligent system helps you create professional invoices in minutes.
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

        {/* Quick Actions */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} md={4} key={action.title}>
                {renderQuickActionCard(action, index)}
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Main Invoice Type Cards */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            Choose Invoice Type
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            {invoiceTypes.map(invoiceType => (
              <Grid item xs={12} lg={6} key={invoiceType.type}>
                {renderEnhancedInvoiceCard(invoiceType)}
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Enhanced Comparison Section */}
        <Fade in timeout={1500}>
          <Box sx={{ mb: 6 }}>
            <Card sx={{ background: alpha(theme.palette.background.paper, 0.8), backdropFilter: 'blur(10px)' }}>
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
                        background: alpha(type.color, 0.05), 
                        borderRadius: 2,
                        border: `1px solid ${alpha(type.color, 0.2)}`
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
                              sx={{ bgcolor: alpha(type.color, 0.1), color: type.color }}
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

        {/* Advanced Options */}
        <Fade in timeout={2000}>
          <Box>
            <Accordion>
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

        {/* Selection Dialog */}
        {selectedType && renderEnhancedSelectionDialog()}

        {/* Enhanced Help Dialog */}
        <Dialog
          open={helpDialogOpen}
          onClose={() => setHelpDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
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
                <Paper sx={{ p: 3, background: alpha(theme.palette.primary.main, 0.05) }}>
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
                <Paper sx={{ p: 3, background: alpha(theme.palette.secondary.main, 0.05) }}>
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

            <Alert severity="info" sx={{ mt: 3 }}>
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