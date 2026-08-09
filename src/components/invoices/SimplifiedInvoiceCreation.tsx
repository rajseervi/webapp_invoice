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
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface SimplifiedInvoiceCreationProps {
  onCreateInvoice?: (type: 'gst' | 'regular', options?: any) => void;
}

export default function SimplifiedInvoiceCreation({ onCreateInvoice }: SimplifiedInvoiceCreationProps) {
  const theme = useTheme();
  const router = useRouter();
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'gst' | 'regular' | null>(null);

  const handleCreateInvoice = (type: 'gst' | 'regular', gstOnly = false) => {
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
  };

  const invoiceTypes = [
    {
      type: 'gst' as const,
      title: 'GST Bill',
      subtitle: 'For business transactions with tax calculations',
      description: 'Create professional GST-compliant invoices with automatic tax calculations, HSN codes, and GSTIN validation.',
      icon: <GstIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.primary.main,
      features: [
        'Automatic GST calculation (CGST, SGST, IGST)',
        'HSN/SAC code support',
        'GSTIN validation',
        'Tax-compliant format',
        'Inter-state and intra-state handling',
        'Professional business format'
      ],
      whenToUse: [
        'Selling to businesses with GST registration',
        'Need tax-compliant invoices',
        'Require automatic tax calculations',
        'Business-to-business transactions'
      ],
      examples: [
        'B2B regular invoices',
        'Service invoices to companies',
        'Product sales with GST',
        'Professional service billing'
      ]
    },
    {
      type: 'regular' as const,
      title: 'Regular Bill',
      subtitle: 'Simple invoices without GST calculations',
      description: 'Create simple, straightforward invoices for customers who don\'t need GST calculations or for small transactions.',
      icon: <RegularIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.secondary.main,
      features: [
        'Simple and clean format',
        'No tax calculations',
        'Quick creation process',
        'Customer-friendly layout',
        'Basic item listing',
        'Easy to understand'
      ],
      whenToUse: [
        'Selling to individual customers',
        'Small transactions',
        'Non-GST registered customers',
        'Simple service billing'
      ],
      examples: [
        'Retail customer sales',
        'Small service charges',
        'Personal transactions',
        'Simple product sales'
      ]
    }
  ];

  const renderInvoiceTypeCard = (invoiceType: typeof invoiceTypes[0]) => (
    <Card
      key={invoiceType.type}
      sx={{
        height: '100%',
        minHeight: 420,
        maxWidth: 380,
        cursor: 'pointer',
        transition: 'all 0.3s ease-in-out',
        border: `2px solid ${alpha(invoiceType.color, 0.3)}`,
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: theme.shadows[12],
          border: `2px solid ${invoiceType.color}`,
          bgcolor: alpha(invoiceType.color, 0.02)
        }
      }}
      onClick={() => setSelectedType(invoiceType.type)}
    >
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Avatar
            sx={{
              bgcolor: invoiceType.color,
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 2
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

        {/* Description */}
        <Typography variant="body1" sx={{ mb: 3, flexGrow: 1 }}>
          {invoiceType.description}
        </Typography>

        {/* Key Features */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckIcon color="success" fontSize="small" />
            Key Features
          </Typography>
          <Stack spacing={0.5}>
            {invoiceType.features.slice(0, 3).map((feature, index) => (
              <Typography key={index} variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                • {feature}
              </Typography>
            ))}
            {invoiceType.features.length > 3 && (
              <Typography variant="body2" color="primary" sx={{ pl: 2, fontStyle: 'italic' }}>
                +{invoiceType.features.length - 3} more features
              </Typography>
            )}
          </Stack>
        </Box>

        {/* Action Button */}
        <Button
          variant="contained"
          size="large"
          fullWidth
          sx={{
            bgcolor: invoiceType.color,
            '&:hover': {
              bgcolor: alpha(invoiceType.color, 0.8)
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
  );

  const renderSelectionDialog = () => {
    const selectedInvoiceType = invoiceTypes.find(type => type.type === selectedType);
    if (!selectedInvoiceType) return null;

    return (
      <Dialog
        open={!!selectedType}
        onClose={() => setSelectedType(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: selectedInvoiceType.color }}>
              {selectedInvoiceType.icon}
            </Avatar>
            <Box>
              <Typography variant="h6">
                Create {selectedInvoiceType.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedInvoiceType.subtitle}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setSelectedType(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            {/* Features */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: alpha(selectedInvoiceType.color, 0.05) }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckIcon color="success" />
                  What's Includedr
                </Typography>
                <List dense>
                  {selectedInvoiceType.features.map((feature, index) => (
                    <ListItem key={index} sx={{ py: 0.5, pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={feature}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* When to Use */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon color="info" />
                  When to Use
                </Typography>
                <List dense>
                  {selectedInvoiceType.whenToUse.map((use, index) => (
                    <ListItem key={index} sx={{ py: 0.5, pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        <ArrowForwardIcon color="info" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={use}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* Examples */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReceiptIcon color="warning" />
                  Examples
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {selectedInvoiceType.examples.map((example, index) => (
                    <Chip
                      key={index}
                      label={example}
                      variant="outlined"
                      size="small"
                      sx={{ bgcolor: 'background.paper' }}
                    />
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* GST Options */}
          {selectedType === 'gst' && (
            <Box sx={{ mt: 3 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Choose your GST invoice type:</strong> Select based on your customer type and requirements.
                </Typography>
              </Alert>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                      '&:hover': {
                        border: `1px solid ${theme.palette.primary.main}`,
                        bgcolor: alpha(theme.palette.primary.main, 0.02)
                      }
                    }}
                    onClick={() => handleCreateInvoice('gst', false)}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <BusinessIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        All Customers
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        For both GST registered and non-registered customers
                      </Typography>
                      <Button variant="outlined" size="small" fullWidth>
                        Choose This
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                      '&:hover': {
                        border: `1px solid ${theme.palette.success.main}`,
                        bgcolor: alpha(theme.palette.success.main, 0.02)
                      }
                    }}
                    onClick={() => handleCreateInvoice('gst', true)}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <GstIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        GST Registered Only
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Only for customers with GST registration
                      </Typography>
                      <Button variant="outlined" color="success" size="small" fullWidth>
                        Choose This
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setSelectedType(null)}>
            Cancel
          </Button>
          {selectedType === 'regular' && (
            <Button
              variant="contained"
              onClick={() => handleCreateInvoice('regular')}
              startIcon={selectedInvoiceType.icon}
              sx={{ bgcolor: selectedInvoiceType.color }}
            >
              Create Regular Bill
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Create New Invoice
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Choose the type of invoice you want to create
        </Typography>
        <Button
          variant="outlined"
          startIcon={<HelpIcon />}
          onClick={() => setHelpDialogOpen(true)}
          size="small"
        >
          Need Help Choosing?
        </Button>
      </Box>

      {/* Invoice Type Cards */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {invoiceTypes.map(invoiceType => (
          <Grid item xs={12} md={6} key={invoiceType.type}>
            {renderInvoiceTypeCard(invoiceType)}
          </Grid>
        ))}
      </Grid>

      {/* Quick Comparison */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
            Quick Comparison
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
                <GstIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  GST Bill
                </Typography>
                <Stack spacing={1}>
                  <Chip label="Tax Calculations" size="small" color="primary" />
                  <Chip label="Business Customers" size="small" variant="outlined" />
                  <Chip label="Professional Format" size="small" variant="outlined" />
                </Stack>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.secondary.main, 0.05), borderRadius: 1 }}>
                <RegularIcon color="secondary" sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Regular Bill
                </Typography>
                <Stack spacing={1}>
                  <Chip label="Simple Format" size="small" color="secondary" />
                  <Chip label="Individual Customers" size="small" variant="outlined" />
                  <Chip label="Quick Creation" size="small" variant="outlined" />
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Selection Dialog */}
      {renderSelectionDialog()}

      {/* Help Dialog */}
      <Dialog
        open={helpDialogOpen}
        onClose={() => setHelpDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HelpIcon color="primary" />
            Which Invoice Type Should I Choose?
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Choose GST Bill When:
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon><BusinessIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Selling to businesses or companies" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CalculateIcon color="primary" /></ListItemIcon>
                <ListItemText primary="You need automatic tax calculations" />
              </ListItem>
              <ListItem>
                <ListItemIcon><ReceiptIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Customer has GST registration" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                <ListItemText primary="You want professional, tax-compliant invoices" />
              </ListItem>
            </List>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="h6" gutterBottom color="secondary">
              Choose Regular Bill When:
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon><PersonIcon color="secondary" /></ListItemIcon>
                <ListItemText primary="Selling to individual customers" />
              </ListItem>
              <ListItem>
                <ListItemIcon><RegularIcon color="secondary" /></ListItemIcon>
                <ListItemText primary="You want simple, easy-to-understand invoices" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon color="secondary" /></ListItemIcon>
                <ListItemText primary="Customer doesn't need GST calculations" />
              </ListItem>
              <ListItem>
                <ListItemIcon><ArrowForwardIcon color="secondary" /></ListItemIcon>
                <ListItemText primary="Quick transactions or small amounts" />
              </ListItem>
            </List>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Still confused?</strong> When in doubt, choose GST Bill as it can handle both GST and non-GST customers, 
              while Regular Bill is only for simple transactions without tax calculations.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpDialogOpen(false)}>
            Got It
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}