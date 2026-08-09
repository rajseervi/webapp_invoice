"use client";
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Snackbar,
  Chip,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import PageHeader from '@/components/PageHeader/PageHeader';
import { PurchaseOrder } from '@/types/purchase';
import PurchaseService from '@/services/purchaseService';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';

interface ReceivedItem {
  productId: string;
  productName: string;
  orderedQuantity: number;
  receivedQuantity: number;
  condition: 'good' | 'damaged' | 'partial';
  notes: string;
}

function ReceivePurchaseOrderPage() {
  const router = useRouter();
  const params = useParams();
  const { userId } = useCurrentUser();
  const purchaseOrderId = params.id as string;
  
  // State
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [receivedItems, setReceivedItems] = useState<ReceivedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch purchase order
  useEffect(() => {
    const fetchPurchaseOrder = async () => {
      try {
        setLoading(true);
        const order = await PurchaseService.getPurchaseOrderById(purchaseOrderId);
        
        if (!order) {
          setError('Purchase order not found');
          return;
        }

        if (order.status === 'received') {
          setError('This purchase order has already been received');
          return;
        }

        setPurchaseOrder(order);
        
        // Initialize received items
        const initialReceivedItems: ReceivedItem[] = order.items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          orderedQuantity: item.quantity,
          receivedQuantity: item.quantity, // Default to ordered quantity
          condition: 'good',
          notes: ''
        }));
        
        setReceivedItems(initialReceivedItems);

      } catch (err) {
        console.error('Error fetching purchase order:', err);
        setError('Failed to load purchase order');
      } finally {
        setLoading(false);
      }
    };

    if (purchaseOrderId) {
      fetchPurchaseOrder();
    }
  }, [purchaseOrderId]);

  // Update received item
  const handleUpdateReceivedItem = (index: number, field: keyof ReceivedItem, value: any) => {
    const updatedItems = [...receivedItems];
    (updatedItems[index] as any)[field] = value;
    setReceivedItems(updatedItems);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!purchaseOrder) return;

    // Validate received quantities
    const hasInvalidQuantities = receivedItems.some(item => 
      item.receivedQuantity < 0 || item.receivedQuantity > item.orderedQuantity
    );

    if (hasInvalidQuantities) {
      setError('Received quantities cannot be negative or exceed ordered quantities');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const result = await PurchaseService.receivePurchaseOrder(
        purchaseOrderId,
        receivedItems.map(item => ({
          productId: item.productId,
          receivedQuantity: item.receivedQuantity,
          condition: item.condition,
          notes: item.notes
        })),
        userId || 'system'
      );

      if (result.success) {
        setSuccessMessage('Purchase order received successfully and stock updated');
        setTimeout(() => {
          router.push('/purchases');
        }, 2000);
      } else {
        setError(result.errors?.join(', ') || 'Failed to receive purchase order');
      }

    } catch (err) {
      console.error('Error receiving purchase order:', err);
      setError('Failed to receive purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        </Container>
      </Container>
    );
  }

  if (!purchaseOrder) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">
            Purchase order not found or already received
          </Alert>
        </Container>
      </Container>
    );
  }

  const totalOrderedValue = receivedItems.reduce((sum, item) => {
    const originalItem = purchaseOrder.items.find(oi => oi.productId === item.productId);
    return sum + (originalItem?.totalPrice || 0);
  }, 0);

  const totalReceivedValue = receivedItems.reduce((sum, item) => {
    const originalItem = purchaseOrder.items.find(oi => oi.productId === item.productId);
    const unitPrice = originalItem?.unitPrice || 0;
    return sum + (unitPrice * item.receivedQuantity);
  }, 0);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <PageHeader
          title="Receive Purchase Order"
          subtitle={`Receive items for PO: ${purchaseOrder.purchaseOrderNumber}`}
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
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          {/* Purchase Order Info */}
          <Typography variant="h6" gutterBottom>
            Purchase Order Details
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 4, mb: 3, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="body2" color="text.secondary">PO Number</Typography>
              <Typography variant="body1" fontWeight="medium">
                {purchaseOrder.purchaseOrderNumber}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Date</Typography>
              <Typography variant="body1">{purchaseOrder.date}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Supplier</Typography>
              <Typography variant="body1">{purchaseOrder.supplierName}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <Chip 
                label={purchaseOrder.status} 
                size="small" 
                color="primary" 
                variant="filled" 
              />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Total Amount</Typography>
              <Typography variant="body1" fontWeight="medium">
                ₹{purchaseOrder.totalAmount.toFixed(2)}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Receiving Items */}
          <Typography variant="h6" gutterBottom>
            Receive Items
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Ordered Qty</TableCell>
                  <TableCell align="right">Received Qty</TableCell>
                  <TableCell>Condition</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Received Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {receivedItems.map((item, index) => {
                  const originalItem = purchaseOrder.items.find(oi => oi.productId === item.productId);
                  const unitPrice = originalItem?.unitPrice || 0;
                  const receivedValue = unitPrice * item.receivedQuantity;

                  return (
                    <TableRow key={item.productId}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {item.productName}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {item.orderedQuantity}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          size="small"
                          value={item.receivedQuantity}
                          onChange={(e) => 
                            handleUpdateReceivedItem(index, 'receivedQuantity', parseFloat(e.target.value) || 0)
                          }
                          inputProps={{ 
                            min: 0, 
                            max: item.orderedQuantity,
                            step: 1 
                          }}
                          sx={{ width: 100 }}
                          error={item.receivedQuantity > item.orderedQuantity}
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={item.condition}
                            onChange={(e) => 
                              handleUpdateReceivedItem(index, 'condition', e.target.value)
                            }
                          >
                            <MenuItem value="good">Good</MenuItem>
                            <MenuItem value="damaged">Damaged</MenuItem>
                            <MenuItem value="partial">Partial</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={item.notes}
                          onChange={(e) => 
                            handleUpdateReceivedItem(index, 'notes', e.target.value)
                          }
                          placeholder="Add notes..."
                          sx={{ minWidth: 150 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          ₹{unitPrice.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          color={item.condition === 'good' ? 'text.primary' : 'warning.main'}
                        >
                          ₹{receivedValue.toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Summary */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <Box sx={{ minWidth: 300 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Total Ordered Value:</Typography>
                <Typography>₹{totalOrderedValue.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Total Received Value:</Typography>
                <Typography fontWeight="medium">₹{totalReceivedValue.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Variance:</Typography>
                <Typography 
                  color={totalReceivedValue < totalOrderedValue ? 'warning.main' : 'success.main'}
                  fontWeight="medium"
                >
                  ₹{(totalReceivedValue - totalOrderedValue).toFixed(2)}
                </Typography>
              </Box>
            </Box>
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
              startIcon={submitting ? <CircularProgress size={20} /> : <CheckCircleIcon />}
              onClick={handleSubmit}
              disabled={submitting}
              color="success"
            >
              Receive & Update Stock
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
    </Container>
  );
}

export default function ModernReceivePage() {
  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Receive"
        pageType="purchase"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <ReceivePurchaseOrderPage />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}