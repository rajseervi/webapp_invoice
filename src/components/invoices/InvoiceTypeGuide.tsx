"use client";
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  useTheme,
  alpha,
  IconButton,
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
  QuestionMark as QuestionIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface InvoiceTypeGuideProps {
  compact?: boolean;
  showTitle?: boolean;
}

export default function InvoiceTypeGuide({ compact = false, showTitle = true }: InvoiceTypeGuideProps) {
  const theme = useTheme();
  const router = useRouter();
  const [guideOpen, setGuideOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    'Choose Invoice Type',
    'Understand the Difference',
    'Make Your Decision'
  ];

  const comparisonData = [
    {
      feature: 'Tax Calculations',
      gst: 'Automatic CGST, SGST, IGST calculations',
      regular: 'No tax calculations',
      gstIcon: <CheckIcon color="success" />,
      regularIcon: <CloseIcon color="error" />
    },
    {
      feature: 'Customer Type',
      gst: 'Businesses, Companies, GST registered',
      regular: 'Individual customers, Small transactions',
      gstIcon: <BusinessIcon color="primary" />,
      regularIcon: <PersonIcon color="secondary" />
    },
    {
      feature: 'Format',
      gst: 'Professional, Tax-compliant format',
      regular: 'Simple, Easy-to-understand format',
      gstIcon: <ReceiptIcon color="primary" />,
      regularIcon: <RegularIcon color="secondary" />
    },
    {
      feature: 'Setup Time',
      gst: 'More detailed setup required',
      regular: 'Quick and simple setup',
      gstIcon: <InfoIcon color="warning" />,
      regularIcon: <CheckIcon color="success" />
    },
    {
      feature: 'Use Cases',
      gst: 'B2B sales, Professional services',
      regular: 'Retail sales, Personal services',
      gstIcon: <BusinessIcon color="primary" />,
      regularIcon: <PersonIcon color="secondary" />
    }
  ];

  const renderQuickGuide = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        {showTitle && (
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QuestionIcon color="primary" />
            Not Sure Which Invoice Type to Choose?
          </Typography>
        )}
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose the right invoice type based on your customer and business needs.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                icon={<GstIcon />}
                label="GST Bill - For businesses with tax calculations"
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<RegularIcon />}
                label="Regular Bill - For simple transactions"
                color="secondary"
                variant="outlined"
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Button
              variant="outlined"
              startIcon={<HelpIcon />}
              onClick={() => setGuideOpen(true)}
              size={compact ? 'small' : 'medium'}
            >
              Show Detailed Guide
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Two Types of Invoices Available
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <GstIcon color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="h6" color="primary">GST Bill</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Professional invoices with automatic tax calculations, perfect for business transactions.
                  </Typography>
                  <List dense>
                    <ListItem sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Automatic GST calculations" primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItem>
                    <ListItem sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="HSN/SAC codes" primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItem>
                    <ListItem sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Tax-compliant format" primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.secondary.main, 0.05), border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <RegularIcon color="secondary" sx={{ fontSize: 32 }} />
                    <Typography variant="h6" color="secondary">Regular Bill</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Simple, straightforward invoices for individual customers and small transactions.
                  </Typography>
                  <List dense>
                    <ListItem sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Simple format" primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItem>
                    <ListItem sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Quick creation" primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItem>
                    <ListItem sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Easy to understand" primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Detailed Comparison
            </Typography>
            <Paper sx={{ overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', bgcolor: 'grey.100' }}>
                <Box sx={{ flex: 1, p: 2, fontWeight: 'bold' }}>Feature</Box>
                <Box sx={{ flex: 1, p: 2, fontWeight: 'bold', textAlign: 'center', color: 'primary.main' }}>GST Bill</Box>
                <Box sx={{ flex: 1, p: 2, fontWeight: 'bold', textAlign: 'center', color: 'secondary.main' }}>Regular Bill</Box>
              </Box>
              {comparisonData.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ flex: 1, p: 2 }}>
                    <Typography variant="body2" fontWeight="medium">{item.feature}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {item.gstIcon}
                    <Typography variant="body2">{item.gst}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {item.regularIcon}
                    <Typography variant="body2">{item.regular}</Typography>
                  </Box>
                </Box>
              ))}
            </Paper>
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Decision Helper
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Quick Decision:</strong> If you're selling to businesses or need tax calculations, choose GST Bill. 
                For individual customers or simple transactions, choose Regular Bill.
              </Typography>
            </Alert>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Card sx={{ border: `2px solid ${theme.palette.primary.main}`, cursor: 'pointer' }} onClick={() => router.push('/invoices/gst/new')}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <GstIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" color="primary" gutterBottom>
                      Create GST Bill
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      For business customers with tax calculations
                    </Typography>
                    <Button variant="contained" fullWidth>
                      Choose GST Bill
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Card sx={{ border: `2px solid ${theme.palette.secondary.main}`, cursor: 'pointer' }} onClick={() => router.push('/invoices/new')}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <RegularIcon color="secondary" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" color="secondary" gutterBottom>
                      Create Regular Bill
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      For individual customers, simple format
                    </Typography>
                    <Button variant="contained" color="secondary" fullWidth>
                      Choose Regular Bill
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box>
      {renderQuickGuide()}
      
      <Dialog
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Invoice Type Selection Guide</Typography>
          <IconButton onClick={() => setGuideOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {renderStepContent(activeStep)}
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button
            disabled={activeStep === 0}
            onClick={() => setActiveStep(activeStep - 1)}
          >
            Back
          </Button>
          <Box sx={{ flex: 1 }} />
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={() => setActiveStep(activeStep + 1)}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => setGuideOpen(false)}
            >
              Got It!
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}