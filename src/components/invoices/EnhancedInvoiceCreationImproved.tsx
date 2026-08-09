"use client";
import React, { useState } from 'react';
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
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Container,
} from '@mui/material';
import {
  Description as InvoiceIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  ArrowForward as ArrowForwardIcon,
  Help as HelpIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  Lightbulb as LightbulbIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Assessment as AssessmentIcon,
  AutoAwesome as AutoAwesomeIcon,
  Rocket as RocketIcon,
  FileCopy as FileCopyIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedInvoiceCreationProps {
  onCreateInvoice?: (type: 'regular', options?: any) => void;
}

const MotionCard = motion(Card);
const MotionBox = motion(Box);

export default function EnhancedInvoiceCreationImproved({ onCreateInvoice }: EnhancedInvoiceCreationProps) {
  const theme = useTheme();
  const router = useRouter();
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'regular' | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateInvoice = async () => {
    setLoading(true);
    
    // Simulate loading for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (onCreateInvoice) {
      onCreateInvoice('regular');
    } else {
      // Default routing
      router.push('/invoices/new');
    }
    
    setLoading(false);
  };

  const invoiceType = {
    type: 'regular' as const,
    title: 'Create Invoice',
    subtitle: 'Professional invoicing made simple',
    description: 'Create clean, professional invoices perfect for all your customers and business transactions. Simple, fast, and effective.',
    icon: <InvoiceIcon sx={{ fontSize: 40 }} />,
    color: theme.palette.primary.main,
    gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
    features: [
      { text: 'Professional and clean format', icon: <SpeedIcon /> },
      { text: 'Quick creation process', icon: <RocketIcon /> },
      { text: 'Customer-friendly layout', icon: <PersonIcon /> },
      { text: 'Detailed item listing', icon: <ReceiptIcon /> },
      { text: 'Easy to understand', icon: <LightbulbIcon /> },
      { text: 'Multiple payment options', icon: <CheckIcon /> }
    ],
    benefits: [
      'Create invoices in 30 seconds',
      'Perfect for all customers',
      'Professional appearance',
      'Instant generation'
    ],
    stats: { popularity: 95, timesSaved: '2 hrs/week', accuracy: '100%' },
    recommended: true
  };

  const quickActions = [
    {
      title: 'Duplicate Last Invoice',
      description: 'Copy your most recent invoice',
      icon: <FileCopyIcon />,
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

  const renderQuickActionCard = (action: typeof quickActions[0], index: number) => (
    <MotionCard
      key={action.title}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      sx={{
        cursor: 'pointer',
        border: `1px solid ${alpha(action.color, 0.3)}`,
        '&:hover': {
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
    </MotionCard>
  );

  return (
    <Container maxWidth="xl">
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Enhanced Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <MotionBox
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
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
          </MotionBox>
          
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            Create professional invoices for your business needs. Our streamlined system helps you generate invoices quickly and efficiently.
          </Typography>
          
          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<HelpIcon />}
              onClick={() => setHelpDialogOpen(true)}
              size="large"
            >
              Need Help?
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

        {/* Quick Actions */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          sx={{ mb: 6 }}
        >
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
        </MotionBox>

        {/* Main Invoice Creation Card */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          sx={{ mb: 6 }}
        >
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            Create Your Invoice
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} lg={8}>
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                whileHover={{ 
                  y: -8,
                  transition: { duration: 0.2 }
                }}
                sx={{
                  height: '100%',
                  minHeight: 520,
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  border: `2px solid ${alpha(invoiceType.color, 0.2)}`,
                  '&:hover': {
                    border: `2px solid ${invoiceType.color}`,
                    boxShadow: `0 20px 40px ${alpha(invoiceType.color, 0.3)}`,
                  }
                }}
                onClick={() => setSelectedType('regular')}
              >
                {/* Recommended Badge */}
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
                    <MotionBox
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Avatar
                        sx={{
                          background: invoiceType.gradient,
                          width: 80,
                          height: 80,
                          mx: 'auto',
                          mb: 2,
                          boxShadow: `0 8px 24px ${alpha(invoiceType.color, 0.3)}`
                        }}
                      >
                        {invoiceType.icon}
                      </Avatar>
                    </MotionBox>
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
                  <MotionBox
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      sx={{
                        background: invoiceType.gradient,
                        boxShadow: `0 4px 16px ${alpha(invoiceType.color, 0.4)}`,
                        '&:hover': {
                          boxShadow: `0 8px 24px ${alpha(invoiceType.color, 0.5)}`,
                        }
                      }}
                      endIcon={<ArrowForwardIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateInvoice();
                      }}
                      disabled={loading}
                    >
                      {loading ? 'Creating...' : `Create ${invoiceType.title}`}
                    </Button>
                  </MotionBox>
                </CardContent>
              </MotionCard>
            </Grid>
          </Grid>
        </MotionBox>

        {/* Enhanced Help Dialog */}
        <Dialog
          open={helpDialogOpen}
          onClose={() => setHelpDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ 
            sx: { 
              borderRadius: 3,
              backdropFilter: 'blur(10px)',
              boxShadow: `0 24px 48px ${alpha(theme.palette.primary.main, 0.15)}`,
            } 
          }}
          BackdropProps={{
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
            }
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                <HelpIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">Invoice Creation Guide</Typography>
                <Typography variant="body2" color="text.secondary">
                  Learn how to create professional invoices
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Paper sx={{ p: 3, background: alpha(theme.palette.primary.main, 0.05) }}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InvoiceIcon />
                Creating Professional Invoices:
              </Typography>
              <List>
                {[
                  { text: 'Add your business information and logo', icon: <CheckIcon /> },
                  { text: 'Include detailed item descriptions and pricing', icon: <CheckIcon /> },
                  { text: 'Set clear payment terms and due dates', icon: <CheckIcon /> },
                  { text: 'Review all information before sending', icon: <CheckIcon /> }
                ].map((item, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItem>
                ))}
              </List>
            </Paper>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Pro Tip:</strong> Keep your invoice format consistent and professional. 
                Include all necessary business details and make payment instructions clear for faster processing.
              </Typography>
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setHelpDialogOpen(false)} size="large">
              Got It, Thanks!
            </Button>
          </DialogActions>
        </Dialog>
      </MotionBox>
    </Container>
  );
}