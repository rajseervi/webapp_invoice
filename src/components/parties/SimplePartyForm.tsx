"use client";
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { Party, PartyFormData } from '@/types/party_no_gst';
import SimplePartyService from '@/services/simplePartyService';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';

interface SimplePartyFormProps {
  onSuccess?: (partyId?: string) => void;
  initialData?: Partial<Party>;
  mode?: 'create' | 'edit';
}

const BUSINESS_TYPES = [
  { value: 'B2B', label: 'Business to Business (B2B)' },
  { value: 'B2C', label: 'Business to Consumer (B2C)' },
  { value: 'Supplier', label: 'Supplier' },
  { value: 'Customer', label: 'Customer' },
];

export default function SimplePartyForm({ 
  onSuccess, 
  initialData, 
  mode = 'create' 
}: SimplePartyFormProps) {
  const router = useRouter();
  const { userId } = useCurrentUser();
  
  // Form state
  const [formData, setFormData] = useState<PartyFormData>({
    name: initialData?.name || '',
    contactPerson: initialData?.contactPerson || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    panNumber: initialData?.panNumber || '',
    businessType: initialData?.businessType || 'B2B',
    isActive: initialData?.isActive ?? true,
    creditLimit: initialData?.creditLimit || 0,
    outstandingBalance: initialData?.outstandingBalance || 0,
    paymentTerms: initialData?.paymentTerms || '',
    notes: initialData?.notes || '',
    tags: initialData?.tags || [],
    preferredCategories: initialData?.preferredCategories || [],
    userId: userId || ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  // Handle form field changes
  const handleChange = (field: keyof PartyFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle tag addition
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Validate form
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Party name is required');
      return false;
    }
    
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (formData.creditLimit < 0) {
      setError('Credit limit cannot be negative');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm() || !userId) return;

    setLoading(true);
    setError(null);

    try {
      if (mode === 'edit' && initialData?.id) {
        await SimplePartyService.updateParty(initialData.id, formData);
        if (onSuccess) {
          onSuccess(initialData.id);
        } else {
          router.push(`/parties`);
        }
      } else {
        const partyId = await SimplePartyService.createParty(formData);
        if (onSuccess) {
          onSuccess(partyId);
        } else {
          router.push(`/parties`);
        }
      }
    } catch (error) {
      console.error('Error saving party:', error);
      setError('Failed to save party. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BusinessIcon />
        {mode === 'edit' ? 'Edit Party' : 'Add New Party'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Basic Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon fontSize="small" />
            Basic Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Party Name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                error={!formData.name.trim()}
                helperText={!formData.name.trim() ? 'Party name is required' : ''}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Person"
                value={formData.contactPerson}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
                placeholder="Primary contact person"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                required
                error={!formData.phone.trim()}
                helperText={!formData.phone.trim() ? 'Phone number is required' : ''}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@example.com"
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
                label="Address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                multiline
                rows={3}
                placeholder="Complete address..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                      <LocationIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Typography variant="body2" sx={{ mb: 1 }}>Business Type</Typography>
                <Select
                  value={formData.businessType}
                  onChange={(e) => handleChange('businessType', e.target.value as any)}
                >
                  {BUSINESS_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="PAN Number"
                value={formData.panNumber}
                onChange={(e) => handleChange('panNumber', e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                inputProps={{ maxLength: 10 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => handleChange('isActive', e.target.checked)}
                  />
                }
                label="Active Party"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Financial Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Financial Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Credit Limit"
                type="number"
                value={formData.creditLimit}
                onChange={(e) => handleChange('creditLimit', parseFloat(e.target.value) || 0)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 }
                }}
                helperText="Maximum credit allowed"
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Outstanding Balance"
                type="number"
                value={formData.outstandingBalance}
                onChange={(e) => handleChange('outstandingBalance', parseFloat(e.target.value) || 0)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  inputProps: { step: 0.01 }
                }}
                helperText="Current outstanding amount"
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Payment Terms"
                value={formData.paymentTerms}
                onChange={(e) => handleChange('paymentTerms', e.target.value)}
                placeholder="e.g., Net 30 days"
                helperText="Default payment terms"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Additional Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                multiline
                rows={3}
                placeholder="Additional notes about this party..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>Tags</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                  {formData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Add tag (e.g., VIP, Local, Wholesale)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    sx={{ flexGrow: 1 }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                  >
                    Add
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Summary */}
      {formData.name && (
        <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Party Name:</Typography>
                <Typography variant="body1" fontWeight="medium">{formData.name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Business Type:</Typography>
                <Chip
                  label={BUSINESS_TYPES.find(t => t.value === formData.businessType)?.label}
                  color="primary"
                  size="small"
                />
              </Grid>
              {formData.phone && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Phone:</Typography>
                  <Typography variant="body1">{formData.phone}</Typography>
                </Grid>
              )}
              {formData.email && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Email:</Typography>
                  <Typography variant="body1">{formData.email}</Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSubmit}
          disabled={
            loading || 
            !formData.name.trim() || 
            !formData.phone.trim()
          }
        >
          {loading ? 'Saving...' : (mode === 'edit' ? 'Update Party' : 'Create Party')}
        </Button>
      </Box>
    </Box>
  );
}