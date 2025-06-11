"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Divider,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Person as PersonIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationOnIcon,
  CreditCard as CreditCardIcon,
  Receipt as ReceiptIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  ContentCopy as ContentCopyIcon,
  Bookmark as BookmarkIcon
} from '@mui/icons-material';
import { orderService } from '@/services/orderService';
import { productService } from '@/services/productService';
import { partyService } from '@/services/partyService';
import type { Order, OrderFormData, OrderItem, Address, DeliverySchedule, PaymentDetails } from '@/types/order';
import { OrderStatus, PaymentStatus, OrderPriority, DeliveryMethod } from '@/types/order';
import type { Product } from '@/types/inventory';
import type { Party } from '@/types/party';
import { formatCurrency } from '@/utils/numberUtils';

interface MultiStepOrderFormProps {
  initialData?: Partial<Order>;
  isTemplate?: boolean;
  onComplete?: (orderId: string) => void;
  onCancel?: () => void;
}

const steps = [
  { label: 'Customer', icon: PersonIcon },
  { label: 'Products', icon: ShoppingCartIcon },
  { label: 'Shipping', icon: LocalShippingIcon },
  { label: 'Payment', icon: PaymentIcon },
  { label: 'Review', icon: CheckCircleIcon }
];

export default function MultiStepOrderForm({ 
  initialData, 
  isTemplate = false, 
  onComplete, 
  onCancel 
}: MultiStepOrderFormProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form data state
  const [formData, setFormData] = useState<Partial<Order>>({
    partyId: '',
    partyName: '',
    items: [],
    subtotal: 0,
    discount: 0,
    tax: 0,
    shipping: 0,
    total: 0,
    status: OrderStatus.DRAFT,
    paymentStatus: PaymentStatus.PENDING,
    priority: OrderPriority.NORMAL,
    sameAsBilling: true,
    requiresApproval: false,
    source: 'web',
    tags: [],
    ...initialData
  });

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [currentQuantity, setCurrentQuantity] = useState(1);
  
  // Form validation
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Template and save options
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, partiesData] = await Promise.all([
          productService.getProductsWithDiscounts(),
          partyService.getParties()
        ]);
        
        setProducts(productsData);
        setParties(partiesData);
        
        // Set selected party if initialData has partyId
        if (initialData?.partyId) {
          const party = partiesData.find(p => p.id === initialData.partyId);
          if (party) setSelectedParty(party);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      }
    };

    fetchData();
  }, [initialData]);

  // Calculate totals
  useEffect(() => {
    const subtotal = formData.items?.reduce((sum, item) => sum + item.total, 0) || 0;
    let discount = 0;

    if (selectedParty) {
      const isFirstOrder = selectedParty.orderCount === 0;
      const discountPercentage = isFirstOrder && selectedParty.firstOrderDiscountPercentage
        ? selectedParty.firstOrderDiscountPercentage
        : selectedParty.discountPercentage || 0;
      discount = subtotal * discountPercentage / 100;
    }

    const total = subtotal - discount + (formData.tax || 0) + (formData.shipping || 0);

    setFormData(prev => ({
      ...prev,
      subtotal,
      discount,
      total
    }));
  }, [formData.items, formData.tax, formData.shipping, selectedParty]);

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 0: // Customer
        if (!formData.partyId) {
          errors.partyId = 'Customer is required';
        }
        break;
      case 1: // Products
        if (!formData.items?.length) {
          errors.items = 'At least one product is required';
        }
        break;
      case 2: // Shipping
        if (!formData.shippingAddress?.street) {
          errors.shippingAddress = 'Shipping address is required';
        }
        if (!formData.deliverySchedule?.method) {
          errors.deliveryMethod = 'Delivery method is required';
        }
        break;
      case 3: // Payment
        if (!formData.paymentDetails?.method) {
          errors.paymentMethod = 'Payment method is required';
        }
        break;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePartyChange = (event: any, newValue: Party | null) => {
    setSelectedParty(newValue);
    setFormData(prev => ({
      ...prev,
      partyId: newValue?.id || '',
      partyName: newValue?.name || '',
      shippingAddress: newValue?.address ? {
        street: newValue.address,
        city: '',
        state: '',
        zipCode: '',
        country: 'India'
      } : undefined
    }));
  };

  const handleAddProduct = () => {
    if (!currentProduct) return;

    const existingItemIndex = formData.items?.findIndex(item => item.productId === currentProduct.id) ?? -1;
    const price = currentProduct.discountedPrice || currentProduct.price || 0;
    const total = price * currentQuantity;

    if (existingItemIndex >= 0) {
      const updatedItems = [...(formData.items || [])];
      const existingItem = updatedItems[existingItemIndex];
      const newQuantity = existingItem.quantity + currentQuantity;

      if (currentProduct.quantity < newQuantity) {
        setError(`Only ${currentProduct.quantity} units available for ${currentProduct.name}`);
        return;
      }

      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        total: price * newQuantity
      };

      setFormData(prev => ({ ...prev, items: updatedItems }));
    } else {
      if (currentProduct.quantity < currentQuantity) {
        setError(`Only ${currentProduct.quantity} units available for ${currentProduct.name}`);
        return;
      }

      const newItem: OrderItem = {
        productId: currentProduct.id || '',
        name: currentProduct.name || '',
        sku: currentProduct.sku || '',
        quantity: currentQuantity,
        price: currentProduct.price || 0,
        discountedPrice: currentProduct.discountedPrice,
        total
      };

      setFormData(prev => ({
        ...prev,
        items: [...(prev.items || []), newItem]
      }));
    }

    setCurrentProduct(null);
    setCurrentQuantity(1);
  };

  const handleRemoveProduct = (index: number) => {
    const updatedItems = [...(formData.items || [])];
    updatedItems.splice(index, 1);
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleAddressChange = (field: string, value: string, isShipping = true) => {
    const addressType = isShipping ? 'shippingAddress' : 'billingAddress';
    setFormData(prev => ({
      ...prev,
      [addressType]: {
        ...prev[addressType],
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    try {
      setLoading(true);
      setError(null);

      const orderData = {
        ...formData,
        status: formData.requiresApproval ? OrderStatus.PENDING_APPROVAL : OrderStatus.PENDING,
        isTemplate: saveAsTemplate,
        templateName: saveAsTemplate ? templateName : undefined,
        statusHistory: [{
          status: formData.requiresApproval ? OrderStatus.PENDING_APPROVAL : OrderStatus.PENDING,
          timestamp: new Date().toISOString(),
          notes: 'Order created'
        }]
      };

      const orderId = await orderService.createOrder(orderData as any);
      
      setSuccess(saveAsTemplate ? 'Order template saved successfully!' : 'Order created successfully!');
      
      if (onComplete) {
        onComplete(orderId);
      } else {
        setTimeout(() => {
          router.push(`/orders/${orderId}`);
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error creating order:', err);
      setError(err.message || 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderCustomerStep();
      case 1:
        return renderProductsStep();
      case 2:
        return renderShippingStep();
      case 3:
        return renderPaymentStep();
      case 4:
        return renderReviewStep();
      default:
        return null;
    }
  };

  const renderCustomerStep = () => (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <PersonIcon sx={{ mr: 2, color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h6" fontWeight="bold">
          Select Customer
        </Typography>
      </Box>
      
      <Autocomplete
        options={parties}
        loading={!parties.length}
        getOptionLabel={(option) => option.name}
        value={selectedParty}
        onChange={handlePartyChange}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select Customer"
            placeholder="Search for a customer..."
            error={!!formErrors.partyId}
            helperText={formErrors.partyId}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="primary" />
                </InputAdornment>
              )
            }}
          />
        )}
        renderOption={(props, option) => (
          <li {...props}>
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <Typography variant="body1" fontWeight="medium">
                {option.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {option.email || 'No email'} • {option.phone || 'No phone'}
              </Typography>
              {option.discountPercentage > 0 && (
                <Chip 
                  label={`${option.discountPercentage}% discount`}
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ mt: 1, alignSelf: 'flex-start' }}
                />
              )}
            </Box>
          </li>
        )}
      />

      {selectedParty && (
        <Card variant="outlined" sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Customer Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Name: <Typography component="span" fontWeight="medium">{selectedParty.name}</Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Email: <Typography component="span" fontWeight="medium">{selectedParty.email || 'N/A'}</Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Phone: <Typography component="span" fontWeight="medium">{selectedParty.phone || 'N/A'}</Typography>
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Previous Orders: <Typography component="span" fontWeight="medium">{selectedParty.orderCount || 0}</Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Discount: <Typography component="span" fontWeight="medium" color="success.main">
                    {selectedParty.discountPercentage || 0}%
                  </Typography>
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Paper>
  );

  const renderProductsStep = () => (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <ShoppingCartIcon sx={{ mr: 2, color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h6" fontWeight="bold">
          Add Products
        </Typography>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Autocomplete
          options={products}
          getOptionLabel={(option) => `${option.name} (${option.sku})`}
          value={currentProduct}
          onChange={(event, newValue) => setCurrentProduct(newValue)}
          sx={{ flexGrow: 1 }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Product"
              placeholder="Search by name or SKU..."
            />
          )}
          renderOption={(props, option) => (
            <li {...props}>
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" fontWeight="medium">{option.name}</Typography>
                  <Chip 
                    label={option.quantity > 10 ? 'In Stock' : option.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                    size="small"
                    color={option.quantity > 10 ? 'success' : option.quantity > 0 ? 'warning' : 'error'}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  SKU: {option.sku} | Available: {option.quantity} | Price: {formatCurrency(option.price)}
                </Typography>
              </Box>
            </li>
          )}
        />

        <TextField
          label="Quantity"
          type="number"
          value={currentQuantity}
          onChange={(e) => setCurrentQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          sx={{ width: 120 }}
          inputProps={{ min: 1 }}
        />

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddProduct}
          disabled={!currentProduct}
          sx={{ height: 56 }}
        >
          Add
        </Button>
      </Box>

      {formErrors.items && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {formErrors.items}
        </Alert>
      )}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {formData.items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No items added yet
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              formData.items?.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      SKU: {item.sku}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {item.discountedPrice ? (
                      <Box>
                        <Typography variant="body2" fontWeight="medium" color="primary.main">
                          {formatCurrency(item.discountedPrice)}
                        </Typography>
                        <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                          {formatCurrency(item.price)}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2">
                        {formatCurrency(item.price)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Chip label={item.quantity} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(item.total)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveProduct(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  const renderShippingStep = () => (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <LocalShippingIcon sx={{ mr: 2, color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h6" fontWeight="bold">
          Shipping & Delivery
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Shipping Address
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={formData.shippingAddress?.street || ''}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                error={!!formErrors.shippingAddress}
                helperText={formErrors.shippingAddress}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={formData.shippingAddress?.city || ''}
                onChange={(e) => handleAddressChange('city', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State"
                value={formData.shippingAddress?.state || ''}
                onChange={(e) => handleAddressChange('state', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ZIP Code"
                value={formData.shippingAddress?.zipCode || ''}
                onChange={(e) => handleAddressChange('zipCode', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                value={formData.shippingAddress?.country || 'India'}
                onChange={(e) => handleAddressChange('country', e.target.value)}
              />
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.sameAsBilling || false}
                onChange={(e) => setFormData(prev => ({ ...prev, sameAsBilling: e.target.checked }))}
              />
            }
            label="Billing address same as shipping"
          />
        </Grid>

        {!formData.sameAsBilling && (
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Billing Address
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Street Address"
                  value={formData.billingAddress?.street || ''}
                  onChange={(e) => handleAddressChange('street', e.target.value, false)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={formData.billingAddress?.city || ''}
                  onChange={(e) => handleAddressChange('city', e.target.value, false)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="State"
                  value={formData.billingAddress?.state || ''}
                  onChange={(e) => handleAddressChange('state', e.target.value, false)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ZIP Code"
                  value={formData.billingAddress?.zipCode || ''}
                  onChange={(e) => handleAddressChange('zipCode', e.target.value, false)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Country"
                  value={formData.billingAddress?.country || 'India'}
                  onChange={(e) => handleAddressChange('country', e.target.value, false)}
                />
              </Grid>
            </Grid>
          </Grid>
        )}

        <Grid item xs={12}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Delivery Options
          </Typography>
          <FormControl fullWidth error={!!formErrors.deliveryMethod}>
            <InputLabel>Delivery Method</InputLabel>
            <Select
              value={formData.deliverySchedule?.method || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                deliverySchedule: {
                  ...prev.deliverySchedule,
                  method: e.target.value as DeliveryMethod
                }
              }))}
              label="Delivery Method"
            >
              <MenuItem value={DeliveryMethod.STANDARD}>Standard Delivery (3-5 days)</MenuItem>
              <MenuItem value={DeliveryMethod.EXPRESS}>Express Delivery (1-2 days)</MenuItem>
              <MenuItem value={DeliveryMethod.OVERNIGHT}>Overnight Delivery</MenuItem>
              <MenuItem value={DeliveryMethod.SAME_DAY}>Same Day Delivery</MenuItem>
              <MenuItem value={DeliveryMethod.PICKUP}>Store Pickup</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Preferred Delivery Date"
            type="date"
            value={formData.deliverySchedule?.preferredDate || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              deliverySchedule: {
                ...prev.deliverySchedule,
                preferredDate: e.target.value
              }
            }))}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Preferred Time Slot</InputLabel>
            <Select
              value={formData.deliverySchedule?.preferredTimeSlot || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                deliverySchedule: {
                  ...prev.deliverySchedule,
                  preferredTimeSlot: e.target.value
                }
              }))}
              label="Preferred Time Slot"
            >
              <MenuItem value="morning">Morning (9 AM - 12 PM)</MenuItem>
              <MenuItem value="afternoon">Afternoon (12 PM - 5 PM)</MenuItem>
              <MenuItem value="evening">Evening (5 PM - 8 PM)</MenuItem>
              <MenuItem value="anytime">Anytime</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Delivery Instructions"
            multiline
            rows={3}
            value={formData.deliverySchedule?.deliveryInstructions || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              deliverySchedule: {
                ...prev.deliverySchedule,
                deliveryInstructions: e.target.value
              }
            }))}
            placeholder="Any special instructions for delivery..."
          />
        </Grid>
      </Grid>
    </Paper>
  );

  const renderPaymentStep = () => (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <PaymentIcon sx={{ mr: 2, color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h6" fontWeight="bold">
          Payment Information
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControl fullWidth error={!!formErrors.paymentMethod}>
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={formData.paymentDetails?.method || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                paymentDetails: {
                  ...prev.paymentDetails,
                  method: e.target.value
                }
              }))}
              label="Payment Method"
            >
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="credit_card">Credit Card</MenuItem>
              <MenuItem value="debit_card">Debit Card</MenuItem>
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              <MenuItem value="upi">UPI</MenuItem>
              <MenuItem value="check">Check</MenuItem>
              <MenuItem value="net_banking">Net Banking</MenuItem>
              <MenuItem value="wallet">Digital Wallet</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Payment Status</InputLabel>
            <Select
              value={formData.paymentStatus}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value as PaymentStatus }))}
              label="Payment Status"
            >
              <MenuItem value={PaymentStatus.PENDING}>Pending</MenuItem>
              <MenuItem value={PaymentStatus.AUTHORIZED}>Authorized</MenuItem>
              <MenuItem value={PaymentStatus.PARTIAL}>Partial</MenuItem>
              <MenuItem value={PaymentStatus.PAID}>Paid</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Due Date"
            type="date"
            value={formData.paymentDetails?.dueDate || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              paymentDetails: {
                ...prev.paymentDetails,
                dueDate: e.target.value
              }
            }))}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {formData.paymentStatus === PaymentStatus.PARTIAL && (
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Paid Amount"
              type="number"
              value={formData.paymentDetails?.paidAmount || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                paymentDetails: {
                  ...prev.paymentDetails,
                  paidAmount: parseFloat(e.target.value) || 0
                }
              }))}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>
              }}
            />
          </Grid>
        )}

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Transaction ID"
            value={formData.paymentDetails?.transactionId || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              paymentDetails: {
                ...prev.paymentDetails,
                transactionId: e.target.value
              }
            }))}
            placeholder="Enter transaction ID if payment is completed"
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Order Settings
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as OrderPriority }))}
                  label="Priority"
                >
                  <MenuItem value={OrderPriority.LOW}>Low</MenuItem>
                  <MenuItem value={OrderPriority.NORMAL}>Normal</MenuItem>
                  <MenuItem value={OrderPriority.HIGH}>High</MenuItem>
                  <MenuItem value={OrderPriority.URGENT}>Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.requiresApproval || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, requiresApproval: e.target.checked }))}
                  />
                }
                label="Requires Approval"
              />
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Internal Notes"
            multiline
            rows={3}
            value={formData.internalNotes || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, internalNotes: e.target.value }))}
            placeholder="Internal notes (not visible to customer)..."
          />
        </Grid>
      </Grid>
    </Paper>
  );

  const renderReviewStep = () => (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CheckCircleIcon sx={{ mr: 2, color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h6" fontWeight="bold">
            Order Review
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {/* Customer Information */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight="medium">
                  Customer Information
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" fontWeight="medium">{formData.partyName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedParty?.email} • {selectedParty?.phone}
                </Typography>
              </AccordionDetails>
            </Accordion>

            {/* Order Items */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight="medium">
                  Order Items ({formData.items?.length || 0})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.items?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.discountedPrice || item.price)}
                          </TableCell>
                          <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>

            {/* Shipping Information */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight="medium">
                  Shipping & Delivery
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" gutterBottom>
                  <strong>Address:</strong> {formData.shippingAddress?.street}, {formData.shippingAddress?.city}, {formData.shippingAddress?.state} {formData.shippingAddress?.zipCode}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Method:</strong> {formData.deliverySchedule?.method?.replace('_', ' ').toUpperCase()}
                </Typography>
                {formData.deliverySchedule?.preferredDate && (
                  <Typography variant="body2" gutterBottom>
                    <strong>Preferred Date:</strong> {formData.deliverySchedule.preferredDate}
                  </Typography>
                )}
                {formData.deliverySchedule?.deliveryInstructions && (
                  <Typography variant="body2">
                    <strong>Instructions:</strong> {formData.deliverySchedule.deliveryInstructions}
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Payment Information */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight="medium">
                  Payment Information
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" gutterBottom>
                  <strong>Method:</strong> {formData.paymentDetails?.method?.replace('_', ' ').toUpperCase()}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Status:</strong> {formData.paymentStatus?.toUpperCase()}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Priority:</strong> {formData.priority?.toUpperCase()}
                </Typography>
                {formData.requiresApproval && (
                  <Chip label="Requires Approval" color="warning" size="small" />
                )}
              </AccordionDetails>
            </Accordion>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Order Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2">{formatCurrency(formData.subtotal || 0)}</Typography>
                </Box>
                {formData.discount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="success.main">Discount:</Typography>
                    <Typography variant="body2" color="success.main">
                      -{formatCurrency(formData.discount)}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Tax:</Typography>
                  <Typography variant="body2">{formatCurrency(formData.tax || 0)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Shipping:</Typography>
                  <Typography variant="body2">{formatCurrency(formData.shipping || 0)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight="bold">Total:</Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary.main">
                    {formatCurrency(formData.total || 0)}
                  </Typography>
                </Box>
              </Box>

              {!isTemplate && (
                <Box sx={{ mt: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={saveAsTemplate}
                        onChange={(e) => setSaveAsTemplate(e.target.checked)}
                      />
                    }
                    label="Save as template"
                  />
                  {saveAsTemplate && (
                    <TextField
                      fullWidth
                      label="Template Name"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      sx={{ mt: 2 }}
                      placeholder="Enter template name..."
                    />
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );

  return (
    <Box>
      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                StepIconComponent={({ active, completed }) => (
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: completed ? 'success.main' : active ? 'primary.main' : 'grey.300',
                      color: 'white'
                    }}
                  >
                    <step.icon fontSize="small" />
                  </Box>
                )}
              >
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Step Content */}
      {renderStepContent(activeStep)}

      {/* Navigation */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            onClick={activeStep === 0 ? onCancel : handleBack}
            startIcon={<ArrowBackIcon />}
            disabled={loading}
          >
            {activeStep === 0 ? 'Cancel' : 'Back'}
          </Button>

          <Button
            variant="contained"
            onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
            endIcon={activeStep === steps.length - 1 ? <SaveIcon /> : <ArrowForwardIcon />}
            disabled={loading}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                {activeStep === steps.length - 1 ? 'Creating...' : 'Processing...'}
              </>
            ) : (
              activeStep === steps.length - 1 ? 'Complete Order' : 'Next'
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

