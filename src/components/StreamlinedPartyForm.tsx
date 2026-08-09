'use client';
import React, { useState, useEffect } from 'react';
import {
  Paper,
  Grid,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  Chip,
  Card,
  CardContent,
  Autocomplete,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  Collapse
} from '@mui/material';
import {
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Receipt as GstIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon
} from '@mui/icons-material';
import { PartyFormData } from '@/types/party';
 
interface StreamlinedPartyFormProps {
  initialData?: Partial<PartyFormData>;
  onSubmit: (data: PartyFormData) => void;
  onCancel: () => void;
  isInvoiceFlow?: boolean;
  compactMode?: boolean;
}

const BUSINESS_TYPES = [
  { value: 'B2B', label: 'Business to Business (B2B)', description: 'For companies and businesses' },
  { value: 'B2C', label: 'Business to Consumer (B2C)', description: 'For individual customers' },
  { value: 'Export', label: 'Export Business', description: 'For international sales' },
  { value: 'Import', label: 'Import Business', description: 'For international purchases' }
];

const INDIAN_STATES = [
  { code: '01', name: 'Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '25', name: 'Daman and Diu' },
  { code: '26', name: 'Dadra and Nagar Haveli' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman and Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '38', name: 'Ladakh' }
];

const STATE_OPTIONS = INDIAN_STATES.map(state => ({
  value: state.code,
  label: `${state.name} (${state.code})`
}));

const steps = ['Basic Info', 'Contact Details', 'Review'];

// Simple GSTIN validation
const validateGstin = (gstin: string): boolean => {
  if (!gstin || gstin.length !== 15) return false;
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
};

const getStateCodeFromGstin = (gstin: string): string => {
  if (!gstin || gstin.length < 2) return '';
  return gstin.substring(0, 2);
};

const getStateName = (stateCode: string): string => {
  const state = INDIAN_STATES.find(s => s.code === stateCode);
  return state?.name || '';
};

export default function StreamlinedPartyForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isInvoiceFlow = false,
  compactMode = false 
}: StreamlinedPartyFormProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [formData, setFormData] = useState<PartyFormData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    gstin: initialData?.gstin || '',
    stateCode: initialData?.stateCode || '',
    stateName: initialData?.stateName || '',
    panNumber: initialData?.panNumber || '',
    creditLimit: initialData?.creditLimit || 0,
    outstandingBalance: initialData?.outstandingBalance || 0,
    isGstRegistered: initialData?.isGstRegistered ?? false,
    businessType: initialData?.businessType || 'B2B',
    placeOfSupply: initialData?.placeOfSupply || ''
  });

  const [gstinValidation, setGstinValidation] = useState<{
    isValid: boolean;
    message: string;
  }>({ isValid: true, message: '' });

  // Validate GSTIN when it changes
  useEffect(() => {
    if (formData.gstin) {
      const isValid = validateGstin(formData.gstin);
      if (isValid) {
        const stateCode = getStateCodeFromGstin(formData.gstin);
        const stateName = getStateName(stateCode);
        setFormData(prev => ({
          ...prev,
          stateCode,
          stateName,
          placeOfSupply: stateName,
          isGstRegistered: true
        }));
        setGstinValidation({
          isValid: true,
          message: `✓ Valid GSTIN for ${stateName}`
        });
      } else {
        setGstinValidation({
          isValid: false,
          message: 'Invalid GSTIN format (15 characters required)'
        });
      }
    } else {
      setGstinValidation({ isValid: true, message: '' });
    }
  }, [formData.gstin]);

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation
    if (formData.gstin && !gstinValidation.isValid) {
      return;
    }

    onSubmit(formData);
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0: // Basic Info
        return formData.name.trim() !== '' && formData.phone.trim() !== '';
      case 1: // Contact Details
        return !formData.isGstRegistered || (formData.gstin && gstinValidation.isValid);
      case 2: // Review
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Party Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter company or person name"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91-9876543210"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Business Type</InputLabel>
                <Select
                  value={formData.businessType}
                  label="Business Type"
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value as any })}
                >
                  {BUSINESS_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box>
                        <Typography variant="body2">{type.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {type.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email (Optional)"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@company.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Address (Optional)"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Business address"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isGstRegistered}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      isGstRegistered: e.target.checked,
                      ...(e.target.checked ? {} : { gstin: '', stateCode: '', stateName: '' })
                    }))}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">GST Registered Party</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Enable if this party is registered under GST
                    </Typography>
                  </Box>
                }
              />
            </Grid>

            {formData.isGstRegistered && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="GSTIN"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    error={formData.gstin !== '' && !gstinValidation.isValid}
                    helperText={gstinValidation.message}
                    placeholder="27AABCU9603R1ZX"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <GstIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: gstinValidation.message && (
                        <InputAdornment position="end">
                          {gstinValidation.isValid ? (
                            <CheckIcon color="success" />
                          ) : (
                            <ErrorIcon color="error" />
                          )}
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {formData.gstin && gstinValidation.isValid && (
                  <Grid item xs={12}>
                    <Alert severity="success">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2">
                          GST Registration Verified:
                        </Typography>
                        <Chip 
                          label={`${formData.stateName} (${formData.stateCode})`} 
                          color="primary" 
                          size="small" 
                        />
                      </Box>
                    </Alert>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Button
                    variant="text"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    endIcon={showAdvanced ? <CollapseIcon /> : <ExpandIcon />}
                    size="small"
                  >
                    {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                  </Button>
                </Grid>

                <Collapse in={showAdvanced} timeout="auto" unmountOnExit>
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        options={STATE_OPTIONS}
                        getOptionLabel={(option) => option.label}
                        value={STATE_OPTIONS.find(option => option.value === formData.stateCode) || null}
                        onChange={(_, newValue) => {
                          if (newValue) {
                            const stateName = getStateName(newValue.value);
                            setFormData(prev => ({
                              ...prev,
                              stateCode: newValue.value,
                              stateName,
                              placeOfSupply: stateName
                            }));
                          }
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="State (Auto-detected)"
                            placeholder="Select state"
                          />
                        )}
                        disabled={formData.gstin !== '' && gstinValidation.isValid}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="PAN Number (Optional)"
                        value={formData.panNumber}
                        onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                        placeholder="AABCU9603R"
                      />
                    </Grid>
                  </Grid>
                </Collapse>
              </>
            )}
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card sx={{ bgcolor: 'grey.50' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Party Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Name:</Typography>
                      <Typography variant="body1" fontWeight="medium">{formData.name}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Phone:</Typography>
                      <Typography variant="body1" fontWeight="medium">{formData.phone}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Business Type:</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {BUSINESS_TYPES.find(t => t.value === formData.businessType)?.label}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">GST Status:</Typography>
                      <Chip 
                        label={formData.isGstRegistered ? 'GST Registered' : 'Not GST Registered'} 
                        color={formData.isGstRegistered ? 'success' : 'default'}
                        size="small"
                      />
                    </Grid>
                    {formData.isGstRegistered && formData.gstin && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">GSTIN:</Typography>
                          <Typography variant="body1" fontWeight="medium">{formData.gstin}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">State:</Typography>
                          <Typography variant="body1" fontWeight="medium">{formData.stateName}</Typography>
                        </Grid>
                      </>
                    )}
                    {formData.email && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Email:</Typography>
                        <Typography variant="body1" fontWeight="medium">{formData.email}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {isInvoiceFlow && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    After creating this party, you'll be able to continue with your invoice creation.
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Paper component="form" onSubmit={handleSubmit} sx={{ p: compactMode ? 2 : 4 }}>
      {!compactMode && (
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <BusinessIcon color="primary" />
          {isInvoiceFlow ? 'Quick Party Creation' : 'New Party'}
        </Typography>
      )}

      {/* Stepper for multi-step flow */}
      {!compactMode && (
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel 
                error={index < activeStep && !isStepValid(index)}
                completed={index < activeStep && isStepValid(index)}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      )}

      {/* Step Content */}
      <Box sx={{ mb: 4 }}>
        {renderStepContent(activeStep)}
      </Box>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button 
          variant="outlined" 
          onClick={activeStep === 0 ? onCancel : handleBack}
          size="large"
        >
          {activeStep === 0 ? 'Cancel' : 'Back'}
        </Button>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!isStepValid(activeStep)}
              size="large"
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              type="submit"
              disabled={!isStepValid(activeStep)}
              size="large"
            >
              {isInvoiceFlow ? 'Create & Continue' : 'Save Party'}
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
}