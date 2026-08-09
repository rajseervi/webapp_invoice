"use client";
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Grid,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
  useTheme,
  alpha,
  Avatar,
  Fab,
  Zoom
} from '@mui/material';
import {
  Add as AddIcon,
  AccountBalance as GstIcon,
  Description as RegularIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Star as StarIcon,
  ArrowForward as ArrowForwardIcon,
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  Schedule as ScheduleIcon,
  AttachMoney as AttachMoneyIcon,
  Business as BusinessIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  type: 'gst' | 'regular';
  icon: React.ReactNode;
  features: string[];
  recommended?: boolean;
  popular?: boolean;
}

interface InvoiceCreationPanelProps {
  onCreateGstInvoice?: () => void;
  onCreateRegularInvoice?: () => void;
  onCreateFromTemplate?: (templateId: string) => void;
  showTemplates?: boolean;
  compact?: boolean;
}

export default function InvoiceCreationPanel({
  onCreateGstInvoice,
  onCreateRegularInvoice,
  onCreateFromTemplate,
  showTemplates = true,
  compact = false
}: InvoiceCreationPanelProps) {
  const theme = useTheme();
  const router = useRouter();
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);

  const invoiceTemplates: InvoiceTemplate[] = [
    {
      id: 'gst-standard',
      name: 'Standard GST Invoice',
      description: 'Complete GST invoice with CGST, SGST, and IGST calculations',
      type: 'gst',
      icon: <GstIcon />,
      features: ['GST Compliance', 'Tax Calculations', 'HSN Codes', 'GSTIN Validation'],
      recommended: true
    },
    {
      id: 'gst-inclusive',
      name: 'GST Inclusive Invoice',
      description: 'GST invoice with tax-inclusive pricing',
      type: 'gst',
      icon: <AttachMoneyIcon />,
      features: ['Inclusive Pricing', 'Auto Tax Calculation', 'Customer Friendly'],
      popular: true
    },
    {
      id: 'regular-simple',
      name: 'Simple Invoice',
      description: 'Basic invoice without GST calculations',
      type: 'regular',
      icon: <RegularIcon />,
      features: ['Simple Format', 'Quick Creation', 'No Tax Complexity']
    },
    {
      id: 'regular-detailed',
      name: 'Detailed Regular Invoice',
      description: 'Comprehensive invoice with detailed item descriptions',
      type: 'regular',
      icon: <ReceiptIcon />,
      features: ['Detailed Items', 'Custom Fields', 'Professional Layout']
    },
    {
      id: 'service-invoice',
      name: 'Service Invoice',
      description: 'Specialized invoice for service-based businesses',
      type: 'gst',
      icon: <BusinessIcon />,
      features: ['Service Categories', 'Time Tracking', 'GST for Services']
    },
    {
      id: 'retail-invoice',
      name: 'Retail Invoice',
      description: 'Quick invoice for retail transactions',
      type: 'gst',
      icon: <SpeedIcon />,
      features: ['Quick Entry', 'Barcode Support', 'Retail Focused']
    }
  ];

  const handleCreateInvoice = (type: 'gst' | 'regular') => {
    if (type === 'gst') {
      onCreateGstInvoice?.() || router.push('/invoices/gst/new');
    } else {
      onCreateRegularInvoice?.() || router.push('/invoices/new');
    }
  };

  const handleTemplateSelect = (template: InvoiceTemplate) => {
    setSelectedTemplate(template);
    setTemplateDialogOpen(true);
  };

  const handleCreateFromTemplate = () => {
    if (selectedTemplate) {
      onCreateFromTemplate?.(selectedTemplate.id);
      
      // Default routing based on template type
      if (selectedTemplate.type === 'gst') {
        router.push(`/invoices/gst/new?template=${selectedTemplate.id}`);
      } else {
        router.push(`/invoices/new?template=${selectedTemplate.id}`);
      }
    }
    setTemplateDialogOpen(false);
  };

  const renderQuickActions = () => (
    <Card sx={{ mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon color="primary" />
          Create New Invoice
        </Typography>
        
        <Grid container spacing={2}>
          {/* GST Invoice Button */}
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                border: `2px solid ${theme.palette.primary.main}`,
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8],
                  bgcolor: alpha(theme.palette.primary.main, 0.05)
                }
              }}
              onClick={() => handleCreateInvoice('gst')}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    width: 64,
                    height: 64,
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  <GstIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography variant="h6" gutterBottom color="primary">
                  GST Invoice
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Create GST compliant invoice with automatic tax calculations
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                  <Chip label="GST Compliant" size="small" color="primary" />
                  <Chip label="Tax Calculation" size="small" variant="outlined" />
                </Stack>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<GstIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateInvoice('gst');
                  }}
                >
                  Create GST Invoice
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* GST Invoice (GST Parties Only) Button */}
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                border: `2px solid ${theme.palette.success.main}`,
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8],
                  bgcolor: alpha(theme.palette.success.main, 0.05)
                }
              }}
              onClick={() => router.push('/invoices/gst-only')}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: theme.palette.success.main,
                    width: 64,
                    height: 64,
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  <BusinessIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography variant="h6" gutterBottom color="success.main">
                  GST Invoice (GST Only)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Create GST invoice for parties with GST registration only
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                  <Chip label="GST Registered" size="small" color="success" />
                  <Chip label="Filtered Parties" size="small" variant="outlined" />
                </Stack>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<BusinessIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push('/invoices/gst-only');
                  }}
                >
                  GST Parties Only
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Regular Invoice Button */}
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                border: `2px solid ${theme.palette.secondary.main}`,
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8],
                  bgcolor: alpha(theme.palette.secondary.main, 0.05)
                }
              }}
              onClick={() => handleCreateInvoice('regular')}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: theme.palette.secondary.main,
                    width: 64,
                    height: 64,
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  <RegularIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography variant="h6" gutterBottom color="secondary">
                  Regular Invoice
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Create simple invoice without GST calculations
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                  <Chip label="Simple" size="small" color="secondary" />
                  <Chip label="Quick Setup" size="small" variant="outlined" />
                </Stack>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<RegularIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateInvoice('regular');
                  }}
                >
                  Create Regular Invoice
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Stats */}
        <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.background.paper, 0.7), borderRadius: 1 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon color="success" />
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    Fast Creation
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Create invoices in under 2 minutes
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon color="primary" />
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    GST Compliant
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Automatic tax calculations
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SpeedIcon color="info" />
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    Templates Available
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Pre-built invoice formats
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );

  const renderTemplates = () => (
    showTemplates && (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptIcon color="primary" />
              Invoice Templates
            </Typography>
            <Chip label={`${invoiceTemplates.length} Templates`} variant="outlined" />
          </Box>
          
          <Grid container spacing={2}>
            {invoiceTemplates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4]
                    }
                  }}
                  onClick={() => handleTemplateSelect(template)}
                >
                  {/* Template Badges */}
                  {(template.recommended || template.popular) && (
                    <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
                      {template.recommended && (
                        <Chip
                          label="Recommended"
                          size="small"
                          color="success"
                          icon={<StarIcon />}
                          sx={{ mb: 0.5 }}
                        />
                      )}
                      {template.popular && (
                        <Chip
                          label="Popular"
                          size="small"
                          color="warning"
                          icon={<TrendingUpIcon />}
                        />
                      )}
                    </Box>
                  )}

                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Avatar
                        sx={{
                          bgcolor: template.type === 'gst' ? theme.palette.primary.main : theme.palette.secondary.main,
                          width: 40,
                          height: 40
                        }}
                      >
                        {template.icon}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold" noWrap>
                          {template.name}
                        </Typography>
                        <Chip
                          label={template.type.toUpperCase()}
                          size="small"
                          color={template.type === 'gst' ? 'primary' : 'secondary'}
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                      {template.description}
                    </Typography>
                    
                    <Box>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Features:
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {template.features.slice(0, 2).map((feature, index) => (
                          <Chip
                            key={index}
                            label={feature}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        ))}
                        {template.features.length > 2 && (
                          <Chip
                            label={`+${template.features.length - 2} more`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        )}
                      </Stack>
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ pt: 0 }}>
                    <Button
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTemplateSelect(template);
                      }}
                    >
                      Use Template
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    )
  );

  const renderFloatingActionButton = () => (
    <Zoom in={true}>
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000
        }}
        onClick={() => handleCreateInvoice('gst')}
      >
        <AddIcon />
      </Fab>
    </Zoom>
  );

  return (
    <Box>
      {/* Quick Actions */}
      {renderQuickActions()}
      
      {/* Templates */}
      {renderTemplates()}
      
      {/* Floating Action Button */}
      {compact && renderFloatingActionButton()}
      
      {/* Template Selection Dialog */}
      <Dialog
        open={templateDialogOpen}
        onClose={() => setTemplateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedTemplate?.icon}
            <Typography variant="h6">
              {selectedTemplate?.name}
            </Typography>
          </Box>
          <IconButton onClick={() => setTemplateDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {selectedTemplate && (
            <Box>
              <Typography variant="body1" paragraph>
                {selectedTemplate.description}
              </Typography>
              
              <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.background.paper, 0.5) }}>
                <Typography variant="subtitle2" gutterBottom>
                  Template Features:
                </Typography>
                <List dense>
                  {selectedTemplate.features.map((feature, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircleIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <InfoIcon color="info" fontSize="small" />
                  <Typography variant="subtitle2" color="info.main">
                    Template Information
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  This template will pre-fill your invoice with the appropriate fields and formatting. 
                  You can customize all details after creation.
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setTemplateDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateFromTemplate}
            startIcon={selectedTemplate?.icon}
          >
            Create Invoice
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}