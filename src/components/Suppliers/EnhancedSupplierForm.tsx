"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Chip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete
} from '@mui/material';
import {
  Save as SaveIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Payment as PaymentIcon,
  LocalShipping as LocalShippingIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { EnhancedSupplier } from '@/types/enhancedPurchase';
import { Product } from '@/types/inventory';
import EnhancedSupplierService from '@/services/enhancedSupplierService';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';

interface SupplierFormProps {
  supplier?: EnhancedSupplier;
  onSave?: (supplierId: string) => void;
  onCancel?: () => void;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  address: string;
  gstin: string;
  contactPerson: string;
  paymentTerms: string;
  creditLimit: number;
  leadTime: number;
  minimumOrderValue: number;
  discountPercentage: number;
  bankAccountNumber: string;
  bankName: string;
  bankIfscCode: string;
  bankAccountHolderName: string;
  notes: string;
  isActive: boolean;
  preferredProducts: string[];
}

const defaultPaymentTerms = [
  'Cash on Delivery',
  'Net 15 days',
  'Net 30 days',
  'Net 45 days',
  'Net 60 days',
  '2/10 Net 30',
  'Advance Payment'
];

export default function EnhancedSupplierForm({
  supplier,
  onSave,
  onCancel
}: SupplierFormProps) {
  const { userId } = useCurrentUser();
  
  const [formState, setFormState] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    address: '',
    gstin: '',
    contactPerson: '',
    paymentTerms: 'Net 30 days',
    creditLimit: 0,
    leadTime: 7,
    minimumOrderValue: 0,
    discountPercentage: 0,
    bankAccountNumber: '',
    bankName: '',
    bankIfscCode: '',
    bankAccountHolderName: '',
    notes: '',
    isActive: true,
    preferredProducts: []
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize form with supplier data if editing
  useEffect(() => {
    if (supplier) {
      setFormState({
        name: supplier.name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        gstin: supplier.gstin || '',
        contactPerson: supplier.contactPerson || '',
        paymentTerms: supplier.paymentTerms || 'Net 30 days',
        creditLimit: supplier.creditLimit || 0,
        leadTime: supplier.leadTime || 7,
        minimumOrderValue: supplier.minimumOrderValue || 0,
        discountPercentage: supplier.discountPercentage || 0,
        bankAccountNumber: supplier.bankDetails?.accountNumber || '',
        bankName: supplier.bankDetails?.bankName || '',
        bankIfscCode: supplier.bankDetails?.ifscCode || '',
        bankAccountHolderName: supplier.bankDetails?.accountHolderName || '',
        notes: supplier.notes || '',
        isActive: supplier.isActive ?? true,
        preferredProducts: supplier.preferredProducts || []
      });
    }
    
    // Load products for preferred products selection
    loadProducts();
  }, [supplier]);

  const loadProducts = async () => {
    try {
      // You'll need to implement this method in your product service
      // For now, returning empty array
      const productsData: Product[] = [];
      setProducts(productsData);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  // Handle form field changes
  const handleInputChange = (field: keyof FormState, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formState.name.trim()) {
      errors.name = 'Supplier name is required';
    }

    if (formState.email && !isValidEmail(formState.email)) {
      errors.email = 'Invalid email format';
    }

    if (formState.phone && !isValidPhone(formState.phone)) {
      errors.phone = 'Invalid phone format';
    }

    if (formState.gstin && !isValidGSTIN(formState.gstin)) {
      errors.gstin = 'Invalid GSTIN format';
    }

    if (formState.creditLimit < 0) {
      errors.creditLimit = 'Credit limit cannot be negative';
    }

    if (formState.leadTime < 0) {
      errors.leadTime = 'Lead time cannot be negative';
    }

    if (formState.discountPercentage < 0 || formState.discountPercentage > 100) {
      errors.discountPercentage = 'Discount must be between 0 and 100';
    }

    if (formState.bankIfscCode && !isValidIFSC(formState.bankIfscCode)) {
      errors.bankIfscCode = 'Invalid IFSC code format';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validation helpers
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const isValidGSTIN = (gstin: string): boolean => {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  };

  const isValidIFSC = (ifsc: string): boolean => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifsc);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      setError('Please fix the validation errors');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare supplier data, removing undefined values
      const supplierData: any = {
        name: formState.name.trim(),
        leadTime: formState.leadTime,
        minimumOrderValue: formState.minimumOrderValue,
        discountPercentage: formState.discountPercentage,
        isActive: formState.isActive,
        preferredProducts: formState.preferredProducts,
        currentBalance: supplier?.currentBalance || 0,
        userId: userId || 'system'
      };

      // Only add fields if they have values
      if (formState.email.trim()) supplierData.email = formState.email.trim();
      if (formState.phone.trim()) supplierData.phone = formState.phone.trim();
      if (formState.address.trim()) supplierData.address = formState.address.trim();
      if (formState.gstin.trim()) supplierData.gstin = formState.gstin.trim();
      if (formState.contactPerson.trim()) supplierData.contactPerson = formState.contactPerson.trim();
      if (formState.paymentTerms) supplierData.paymentTerms = formState.paymentTerms;
      if (formState.creditLimit > 0) supplierData.creditLimit = formState.creditLimit;
      if (formState.notes.trim()) supplierData.notes = formState.notes.trim();

      // Handle bank details - only add if at least one field is present
      const bankDetails: any = {};
      if (formState.bankAccountNumber.trim()) bankDetails.accountNumber = formState.bankAccountNumber.trim();
      if (formState.bankName.trim()) bankDetails.bankName = formState.bankName.trim();
      if (formState.bankIfscCode.trim()) bankDetails.ifscCode = formState.bankIfscCode.trim();
      if (formState.bankAccountHolderName.trim()) bankDetails.accountHolderName = formState.bankAccountHolderName.trim();
      
      if (Object.keys(bankDetails).length > 0) {
        supplierData.bankDetails = bankDetails;
      }

      let supplierId: string;

      if (supplier) {
        // Update existing supplier
        await EnhancedSupplierService.updateSupplier(supplier.id, supplierData);
        supplierId = supplier.id;
        setSuccess('Supplier updated successfully');
      } else {
        // Create new supplier
        supplierId = await EnhancedSupplierService.createSupplier(supplierData);
        setSuccess('Supplier created successfully');
      }

      if (onSave) {
        setTimeout(() => onSave(supplierId), 1000);
      }

    } catch (err) {
      console.error('Error saving supplier:', err);
      setError('Failed to save supplier. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon />
              {supplier ? 'Edit Supplier' : 'Add New Supplier'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {onCancel && (
                <Button variant="outlined" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Saving...' : supplier ? 'Update Supplier' : 'Create Supplier'}
              </Button>
            </Box>
          </Box>

          {/* Basic Information */}
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon />
            Basic Information
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Supplier Name"
                value={formState.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={!!validationErrors.name}
                helperText={validationErrors.name}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Person"
                value={formState.contactPerson}
                onChange={(e) => handleInputChange('contactPerson', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formState.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={!!validationErrors.email}
                helperText={validationErrors.email}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formState.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                error={!!validationErrors.phone}
                helperText={validationErrors.phone}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Address"
                value={formState.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="GSTIN"
                value={formState.gstin}
                onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
                error={!!validationErrors.gstin}
                helperText={validationErrors.gstin || 'Format: 22AAAAA0000A1Z5'}
                inputProps={{ maxLength: 15 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formState.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  />
                }
                label="Active Supplier"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Business Terms */}
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaymentIcon />
            Business Terms
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Autocomplete
                freeSolo
                options={defaultPaymentTerms}
                value={formState.paymentTerms}
                onChange={(_, newValue) => handleInputChange('paymentTerms', newValue || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Payment Terms"
                    placeholder="Enter or select payment terms"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Credit Limit"
                type="number"
                value={formState.creditLimit}
                onChange={(e) => handleInputChange('creditLimit', parseFloat(e.target.value) || 0)}
                error={!!validationErrors.creditLimit}
                helperText={validationErrors.creditLimit}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Lead Time (Days)"
                type="number"
                value={formState.leadTime}
                onChange={(e) => handleInputChange('leadTime', parseInt(e.target.value) || 0)}
                error={!!validationErrors.leadTime}
                helperText={validationErrors.leadTime}
                InputProps={{
                  endAdornment: <InputAdornment position="end">days</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Minimum Order Value"
                type="number"
                value={formState.minimumOrderValue}
                onChange={(e) => handleInputChange('minimumOrderValue', parseFloat(e.target.value) || 0)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Discount Percentage"
                type="number"
                value={formState.discountPercentage}
                onChange={(e) => handleInputChange('discountPercentage', parseFloat(e.target.value) || 0)}
                error={!!validationErrors.discountPercentage}
                helperText={validationErrors.discountPercentage}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>
                }}
                inputProps={{ min: 0, max: 100, step: 0.01 }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Bank Details */}
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaymentIcon />
            Bank Details
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Account Holder Name"
                value={formState.bankAccountHolderName}
                onChange={(e) => handleInputChange('bankAccountHolderName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Account Number"
                value={formState.bankAccountNumber}
                onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Bank Name"
                value={formState.bankName}
                onChange={(e) => handleInputChange('bankName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="IFSC Code"
                value={formState.bankIfscCode}
                onChange={(e) => handleInputChange('bankIfscCode', e.target.value.toUpperCase())}
                error={!!validationErrors.bankIfscCode}
                helperText={validationErrors.bankIfscCode || 'Format: ABCD0123456'}
                inputProps={{ maxLength: 11 }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Preferred Products */}
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <StarIcon />
            Preferred Products
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={products}
                getOptionLabel={(option) => option.name}
                value={products.filter(p => formState.preferredProducts.includes(p.id))}
                onChange={(_, newValue) => {
                  handleInputChange('preferredProducts', newValue.map(p => p.id));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Preferred Products"
                    placeholder="Select products this supplier commonly provides"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      key={option.id}
                      label={option.name}
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />
            </Grid>
          </Grid>

          {/* Notes */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={formState.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about this supplier..."
              />
            </Grid>
          </Grid>

          {/* Display current balance if editing */}
          {supplier && supplier.currentBalance !== undefined && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Current Balance
              </Typography>
              <Chip
                label={`₹${supplier.currentBalance.toFixed(2)}`}
                color={supplier.currentBalance > 0 ? 'warning' : 'default'}
                size="small"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Snackbar for messages */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}