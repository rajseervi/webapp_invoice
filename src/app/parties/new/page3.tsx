'use client';
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Alert, 
  Snackbar, 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Stepper, 
  Step, 
  StepLabel, 
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import EnhancedDashboardLayout from '@/components/DashboardLayout/EnhancedDashboardLayout';
import PageHeader from '@/components/PageHeader/PageHeader';
import EnhancedPartyForm from '@/components/EnhancedPartyForm';
import { partyService } from '@/services/partyService';
import { GstSettingsService } from '@/services/gstService';
import type { PartyFormData } from '@/types/party';
import type { GstSettings } from '@/types/invoice';
import { 
  Business as BusinessIcon,
  Receipt as InvoiceIcon,
  CheckCircle as CheckIcon,
  ArrowForward as ArrowIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const steps = ['Party Details', 'GST Information', 'Review & Save'];

export default function NewParty() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [gstSettings, setGstSettings] = useState<GstSettings | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdPartyId, setCreatedPartyId] = useState<string | null>(null);
  
  // Check if coming from invoice creation
  const fromInvoice = searchParams?.get('from') === 'invoice';
  const returnTo = searchParams?.get('returnTo') || '/parties';

  useEffect(() => {
    loadGstSettings();
  }, []);

  const loadGstSettings = async () => {
    try {
      const settings = await GstSettingsService.getGstSettings();
      setGstSettings(settings);
    } catch (error) {
      console.error('Error loading GST settings:', error);
    }
  };

  const handleSubmit = async (data: PartyFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Add default values for new party
      const partyData: PartyFormData = {
        ...data,
        isActive: true,
        outstandingBalance: data.outstandingBalance || 0,
        creditLimit: data.creditLimit || 0,
        // Set default business type based on GST registration
        businessType: data.businessType || (data.isGstRegistered ? 'B2B' : 'B2C')
      };

      const partyId = await partyService.createParty(partyData);
      setCreatedPartyId(partyId);
      setSuccess('Party created successfully!');
      
      if (fromInvoice) {
        setShowSuccessDialog(true);
      } else {
        // Redirect after a short delay for normal flow
        setTimeout(() => {
          router.push(returnTo);
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating party:', error);
      setError('Failed to create party. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToInvoice = () => {
    if (createdPartyId) {
      router.push(`/invoices/gst/new?partyId=${createdPartyId}`);
    }
  };

  const handleGoToParties = () => {
    router.push('/parties');
  };

  return (
    <EnhancedDashboardLayout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Enhanced Page Header */}
        <PageHeader
          title={fromInvoice ? "Add New Party for Invoice" : "Add New Party"}
          subtitle={
            fromInvoice 
              ? "Create a new party and continue with GST invoice creation"
              : "Create a new business party with comprehensive GST and business details"
          }
          icon={<BusinessIcon />}
        />

        {/* Context Alert for Invoice Flow */}
        {fromInvoice && (
          <Alert 
            severity="info" 
            sx={{ mb: 3 }}
            icon={<InfoIcon />}
            action={
              <Chip 
                label="From Invoice" 
                color="primary" 
                size="small"
                icon={<InvoiceIcon />}
              />
            }
          >
            <Typography variant="body2">
              You're creating a new party from the invoice creation process. 
              After saving, you can continue creating your GST invoice with this party.
            </Typography>
          </Alert>
        )}

        {/* GST Settings Status */}
        {gstSettings && (
          <Card sx={{ mb: 3, bgcolor: gstSettings.enableGst ? 'success.50' : 'warning.50' }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckIcon color={gstSettings.enableGst ? 'success' : 'warning'} />
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    GST Status: {gstSettings.enableGst ? 'Enabled' : 'Disabled'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Company State: {gstSettings.companyStateName} | 
                    Default GST Rate: {gstSettings.defaultGstRate}%
                    {gstSettings.companyGstin && ` | GSTIN: ${gstSettings.companyGstin}`}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Progress Indicator for Invoice Flow */}
        {fromInvoice && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InvoiceIcon color="primary" />
                Invoice Creation Progress
              </Typography>
              <Stepper activeStep={0} alternativeLabel sx={{ mt: 2 }}>
                <Step>
                  <StepLabel>Create Party</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Add Invoice Items</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Review & Generate</StepLabel>
                </Step>
              </Stepper>
            </CardContent>
          </Card>
        )}

        {/* Loading Progress */}
        {loading && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              Creating party...
            </Typography>
          </Box>
        )}

        {/* Enhanced Party Form */}
        <EnhancedPartyForm
          onSubmit={handleSubmit}
          onCancel={() => router.push(returnTo)}
          initialData={{
            businessType: 'B2B', // Default for GST invoices
            isGstRegistered: true // Default for GST invoices
          }}
        />

        {/* Success Dialog for Invoice Flow */}
        <Dialog 
          open={showSuccessDialog} 
          onClose={() => setShowSuccessDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
            <CheckIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h5">Party Created Successfully!</Typography>
          </DialogTitle>
          <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Your new party has been created and is ready to use.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              What would you like to do next?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
            <Button
              variant="outlined"
              onClick={handleGoToParties}
              startIcon={<BusinessIcon />}
            >
              View All Parties
            </Button>
            <Button
              variant="contained"
              onClick={handleContinueToInvoice}
              endIcon={<ArrowIcon />}
              size="large"
            >
              Continue to Invoice
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success Message for Normal Flow */}
        <Snackbar
          open={!!success && !fromInvoice}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
        >
          <Alert
            onClose={() => setSuccess(null)}
            severity="success"
            sx={{ width: '100%' }}
          >
            {success}
          </Alert>
        </Snackbar>

        {/* Error Message */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert
            onClose={() => setError(null)}
            severity="error"
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </EnhancedDashboardLayout>
  );
}