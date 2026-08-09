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
  Divider,
  Card,
  CardContent,
  Autocomplete,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  AccountBalance as BankIcon,
  Receipt as GstIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { PartyFormData } from '@/types/party';
import { partyService } from '@/services/partyService';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';

interface EnhancedPartyFormProps {
  initialData?: Partial<PartyFormData>;
  onSubmit: (data: PartyFormData) => void;
  onCancel: () => void;
}

const BUSINESS_TYPES = [
  { value: 'B2B', label: 'Business to Business (B2B)' },
  { value: 'B2C', label: 'Business to Consumer (B2C)' },
  { value: 'Export', label: 'Export Business' },
  { value: 'Import', label: 'Import Business' }
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

export default function EnhancedPartyForm({ initialData, onSubmit, onCancel }: EnhancedPartyFormProps) {
  const { userId } = useCurrentUser();
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
    isGstRegistered: initialData?.isGstRegistered || false,
    businessType: initialData?.businessType || 'B2B',
    placeOfSupply: initialData?.placeOfSupply || ''
  });

  const [gstinValidation, setGstinValidation] = useState<{
    isValid: boolean;
    isUnique: boolean;
    message: string;
    checking: boolean;
  }>({ isValid: true, isUnique: true, message: '', checking: false });

  const [panValidation, setPanValidation] = useState<{
    isValid: boolean;
    message: string;
  }>({ isValid: true, message: '' });

  // Debounce timer for GSTIN validation
  const [gstinTimer, setGstinTimer] = useState<NodeJS.Timeout | null>(null);

  // Validate GSTIN when it changes
  useEffect(() => {
    if (formData.gstin) {
      const isFormatValid = validateGstin(formData.gstin);
      
      if (isFormatValid) {
        const stateCode = getStateCodeFromGstin(formData.gstin);
        const stateName = getStateName(stateCode);
        setFormData(prev => ({
          ...prev,
          stateCode,
          stateName,
          placeOfSupply: stateName,
          isGstRegistered: true
        }));

        // Check uniqueness with debounce
        if (gstinTimer) {
          clearTimeout(gstinTimer);
        }

        setGstinValidation(prev => ({ ...prev, checking: true, isValid: true }));

        const timer = setTimeout(async () => {
          if (userId) {
            try {
              const uniqueCheck = await partyService.validateUniqueGstin(
                formData.gstin, 
                userId, 
                initialData?.id // Exclude current party if editing
              );
              
              setGstinValidation({
                isValid: true,
                isUnique: uniqueCheck.isUnique,
                message: uniqueCheck.isUnique 
                  ? `Valid GSTIN for ${stateName}` 
                  : uniqueCheck.message,
                checking: false
              });
            } catch (error) {
              setGstinValidation({
                isValid: true,
                isUnique: true,
                message: `Valid GSTIN for ${stateName}`,
                checking: false
              });
            }
          } else {
            setGstinValidation({
              isValid: true,
              isUnique: true,
              message: `Valid GSTIN for ${stateName}`,
              checking: false
            });
          }
        }, 1000); // 1 second debounce

        setGstinTimer(timer);
      } else {
        setGstinValidation({
          isValid: false,
          isUnique: true,
          message: 'Invalid GSTIN format. Should be 15 characters (e.g., 27AABCU9603R1ZX)',
          checking: false
        });
      }
    } else {
      setGstinValidation({ isValid: true, isUnique: true, message: '', checking: false });
    }

    // Cleanup timer on unmount
    return () => {
      if (gstinTimer) {
        clearTimeout(gstinTimer);
      }
    };
  }, [formData.gstin, userId, initialData?.id]);

  // Validate PAN when it changes
  useEffect(() => {
    if (formData.panNumber) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      const isValid = panRegex.test(formData.panNumber);
      setPanValidation({
        isValid,
        message: isValid ? 'Valid PAN format' : 'Invalid PAN format. Should be 10 characters (e.g., AABCU9603R)'
      });
    } else {
      setPanValidation({ isValid: true, message: '' });
    }
  }, [formData.panNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation
    if (formData.gstin && (!gstinValidation.isValid || !gstinValidation.isUnique)) {
      return;
    }
    if (formData.panNumber && !panValidation.isValid) {
      return;
    }

    onSubmit(formData);
  };

  const handleGstRegistrationToggle = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      isGstRegistered: checked,
      ...(checked ? {} : { gstin: '', stateCode: '', stateName: '' })
    }));
  };

  const handleStateChange = (stateCode: string) => {
    const stateName = getStateName(stateCode);
    setFormData(prev => ({
      ...prev,
      stateCode,
      stateName,
      placeOfSupply: stateName
    }));
  };

  const getGstinEndAdornment = () => {
    if (gstinValidation.checking) {
      return <CircularProgress size={20} />;
    }
    
    if (formData.gstin && gstinValidation.message) {
      if (!gstinValidation.isValid) {
        return <ErrorIcon color="error" />;
      }
      if (!gstinValidation.isUnique) {
        return <WarningIcon color="warning" />;
      }
      return <CheckIcon color="success" />;
    }
    
    return null;
  };

  const getGstinHelperText = () => {
    if (gstinValidation.checking) {
      return 'Checking GSTIN uniqueness...';
    }
    return gstinValidation.message;
  };

  const getGstinError = () => {
    return formData.gstin !== '' && (!gstinValidation.isValid || !gstinValidation.isUnique);
  };

  return (
    <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <BusinessIcon color="primary" />
        Party Information
      </Typography>

      {/* Basic Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon fontSize="small" />
            Basic Details
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Party Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <FormControl fullWidth>
                <InputLabel>Business Type</InputLabel>
                <Select
                  value={formData.businessType}
                  label="Business Type"
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value as any })}
                >
                  {BUSINESS_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
        </CardContent>
      </Card>

      {/* Financial Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BankIcon fontSize="small" />
            Financial Details
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Credit Limit"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                helperText="Maximum credit amount allowed for this party"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Outstanding Balance"
                value={formData.outstandingBalance}
                onChange={(e) => setFormData({ ...formData, outstandingBalance: Number(e.target.value) })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                helperText="Current outstanding amount"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Summary */}
      {(formData.name || formData.gstin) && (
        <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Party Name:</Typography>
                <Typography variant="body1" fontWeight="medium">{formData.name || 'Not specified'}</Typography>
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
              {formData.isGstRegistered && formData.stateName && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">State:</Typography>
                  <Typography variant="body1" fontWeight="medium">{formData.stateName}</Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" onClick={onCancel} size="large">
          Cancel
        </Button>
        <Button 
          variant="contained" 
          type="submit" 
          size="large"
          disabled={
            !formData.name || 
            !formData.phone || 
            (formData.gstin && (!gstinValidation.isValid || !gstinValidation.isUnique)) ||
            (formData.panNumber && !panValidation.isValid) ||
            gstinValidation.checking
          }
        >
          Save Party
        </Button>
      </Box>
    </Paper>
  );
}