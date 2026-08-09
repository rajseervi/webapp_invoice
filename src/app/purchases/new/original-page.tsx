import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Snackbar,
  Divider,
  Card,
  CardContent,
  Grid,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';
import PageHeader from '@/components/PageHeader/PageHeader';
import EnhancedPurchaseItemsManager from '@/components/purchases/EnhancedPurchaseItemsManager';
import { PurchaseOrder, PurchaseItem, Supplier } from '@/types/purchase';
import { Product } from '@/types/inventory';
import PurchaseService from '@/services/purchaseService';
import SupplierService from '@/services/supplierService';
import { useProducts } from '@/app/hooks/useProducts';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';

export default function OriginalPageComponent() {
  const router = useRouter();
  const { userId } = useCurrentUser();
  const { products, loading: loadingProducts } = useProducts();
  
  // Form state
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [shippingCharges, setShippingCharges] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [status, setStatus] = useState<'draft' | 'pending' | 'approved'>('draft');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);

  // Fetch suppliers and generate PO number
  useEffect(() => {
    const initializeForm = async () => {
      try {
        setLoadingSuppliers(true);
        
        // Fetch suppliers
        const suppliersData = await SupplierService.getActiveSuppliers(userId);
        setSuppliers(suppliersData);
        
        // Generate PO number
        const poNumber = await PurchaseService.generatePurchaseOrderNumber();
        setPurchaseOrderNumber(poNumber);
        
      } catch (err) {
        console.error('Error initializing form:', err);
        setError('Failed to initialize form');
      } finally {
        setLoadingSuppliers(false);
      }
    };

    initializeForm();
  }, [userId]);

  // Item management is now handled by EnhancedPurchaseItemsManager

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalGstAmount = items.reduce((sum, item) => sum + item.gstAmount, 0);
  const totalAmount = subtotal + totalGstAmount + shippingCharges + otherCharges - discount;

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedSupplier) {
      setError('Please select a supplier');
      return;
    }

    if (items.length === 0) {
      setError('Please add at least one item');
      return;
    }

    if (items.some(item => !item.productId || item.quantity <= 0 || item.unitPrice <= 0)) {
      setError('Please fill in all item details correctly');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const purchaseOrderData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'> = {
        purchaseOrderNumber,
        date,
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
        supplierEmail: selectedSupplier.email,
        supplierPhone: selectedSupplier.phone,
        supplierAddress: selectedSupplier.address,
        supplierGstin: selectedSupplier.gstin,
        items,
        subtotal,
        totalGstAmount,
        totalAmount,
        discount,
        shippingCharges,
        otherCharges,
        notes,
        terms,
        status,
        paymentStatus: 'pending',
        stockUpdated: false,
        createdBy: userId || 'system',
        userId: userId || 'system'
      };

      const result = await PurchaseService.createPurchaseOrder(
        purchaseOrderData,
        status === 'received' // Update stock only if status is 'received'
      );

      if (result.success) {
        setSuccessMessage('Purchase order created successfully');
        setTimeout(() => {
          router.push('/purchases');
        }, 1500);
      } else {
        setError(result.errors?.join(', ') || 'Failed to create purchase order');
      }

    } catch (err) {
      console.error('Error creating purchase order:', err);
      setError('Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };

  if (loadingSuppliers) {
    return (
      <ImprovedDashboardLayout>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        </Container>
      </ImprovedDashboardLayout>
    );
  }

  return (
    <ImprovedDashboardLayout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <PageHeader
          title="New Purchase Order"
          subtitle="Create a new purchase order to procure inventory"
          actions={
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/purchases')}
            >
              Back to Purchases
            </Button>
          }
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {items.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Getting Started:</strong> Select a supplier above, then use the enhanced item manager below to add products to your purchase order.
              You can search, filter, and quickly add items with advanced features like bulk operations and favorites.
            </Typography>
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          {/* Basic Information */}
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              label="PO Number"
              value={purchaseOrderNumber}
              onChange={(e) => setPurchaseOrderNumber(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
              required
            />
            
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
              required
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                label="Status"
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Supplier Selection */}
          <Typography variant="h6" gutterBottom>
            Supplier Information
          </Typography>
          
          <Autocomplete
            options={suppliers}
            getOptionLabel={(option) => option.name}
            value={selectedSupplier}
            onChange={(_, newValue) => setSelectedSupplier(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Supplier"
                size="small"
                required
                error={!selectedSupplier}
                helperText={!selectedSupplier ? "Please select a supplier" : ""}
              />
            )}
            sx={{ mb: 3 }}
          />

          {selectedSupplier && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                {selectedSupplier.name}
              </Typography>
              {selectedSupplier.contactPerson && (
                <Typography variant="body2">Contact: {selectedSupplier.contactPerson}</Typography>
              )}
              {selectedSupplier.email && (
                <Typography variant="body2">Email: {selectedSupplier.email}</Typography>
              )}
              {selectedSupplier.phone && (
                <Typography variant="body2">Phone: {selectedSupplier.phone}</Typography>
              )}
              {selectedSupplier.address && (
                <Typography variant="body2">Address: {selectedSupplier.address}</Typography>
              )}
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Enhanced Items Manager */}
          <EnhancedPurchaseItemsManager
            items={items}
            onItemsChange={setItems}
            products={products}
            loading={loadingProducts}
            supplierId={selectedSupplier?.id}
            supplierName={selectedSupplier?.name}
          />

          {/* Additional Charges */}
          {items.length > 0 && (
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Additional Charges & Summary
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        label="Shipping Charges"
                        type="number"
                        size="small"
                        value={shippingCharges}
                        onChange={(e) => setShippingCharges(parseFloat(e.target.value) || 0)}
                        inputProps={{ min: 0, step: 0.01 }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }}
                      />
                      <TextField
                        label="Other Charges"
                        type="number"
                        size="small"
                        value={otherCharges}
                        onChange={(e) => setOtherCharges(parseFloat(e.target.value) || 0)}
                        inputProps={{ min: 0, step: 0.01 }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }}
                      />
                      <TextField
                        label="Discount"
                        type="number"
                        size="small"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        inputProps={{ min: 0, step: 0.01 }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Order Summary
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Items Subtotal:</Typography>
                        <Typography variant="body2">₹{subtotal.toFixed(2)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">GST Amount:</Typography>
                        <Typography variant="body2">₹{totalGstAmount.toFixed(2)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Shipping:</Typography>
                        <Typography variant="body2">₹{shippingCharges.toFixed(2)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Other Charges:</Typography>
                        <Typography variant="body2">₹{otherCharges.toFixed(2)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Discount:</Typography>
                        <Typography variant="body2" color="error">-₹{discount.toFixed(2)}</Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" fontWeight="bold">Total Amount:</Typography>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                          ₹{totalAmount.toFixed(2)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {items.length} item{items.length !== 1 ? 's' : ''} • Total Qty: {items.reduce((sum, item) => sum + item.quantity, 0)}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Notes and Terms */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              label="Notes"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Terms & Conditions"
              multiline
              rows={3}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              sx={{ flex: 1 }}
            />
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => router.push('/purchases')}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSubmit}
              disabled={loading}
            >
              Create Purchase Order
            </Button>
          </Box>
        </Paper>

        {/* Success Message */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={6000}
          onClose={() => setSuccessMessage(null)}
          message={successMessage}
        />
      </Container>
    </ImprovedDashboardLayout>
  );
}