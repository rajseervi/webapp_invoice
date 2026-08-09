"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  LocalShipping as LocalShippingIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassEmptyIcon,
} from '@mui/icons-material';
import { OrderService } from '@/services/orderService';
import { Order } from '@/types/order';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import { invoiceService } from '@/services/invoiceService';
import { Invoice } from '@/types/invoice';

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [converting, setConverting] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      if (!id) {
        setError('Order ID is missing');
        setLoading(false);
        return;
      }
      const fetchedOrder = await OrderService.getOrderById(id as string);
      if (!fetchedOrder) {
        setError('Order not found');
      }
      setOrder(fetchedOrder);
    } catch (err: any) {
      console.error("Error fetching order:", err);
      setError(err.message || "Failed to fetch order.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleDeleteClick = () => {
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (order) {
      try {
        await OrderService.deleteOrder(order.id!);
        setSuccessMessage("Order deleted successfully!");
        setTimeout(() => {
          router.push('/orders');
        }, 2000);
      } catch (err: any) {
        console.error("Error deleting order:", err);
        setError(err.message || "Failed to delete order.");
      }
 finally {
        setDeleteConfirmOpen(false);
      }
    }
  };

  const handleConvertOrderToInvoice = async () => {
    if (!order) return;

    setConverting(true);
    try {
      const invoiceData: Partial<Invoice> = {
        invoiceNumber: `INV-${order.orderNumber.split('-')[1]}`,
        date: new Date().toISOString().split('T')[0],
        partyName: order.partyName ?? null,
        partyId: order.partyId ?? null,
        partyGstin: order.partyGstin ?? null,
        partyAddress: order.partyAddress ?? null,
        partyPhone: order.partyPhone ?? null,
        partyEmail: order.partyEmail ?? null,
        items: order.items.map(item => ({
          productId: item.productId ?? null,
          name: item.name ?? null,
          quantity: item.quantity ?? 0,
          price: item.price ?? 0,
          discount: item.discount ?? 0,
          finalPrice: item.finalPrice ?? 0,
          category: item.category ?? null,
          gstRate: item.gstRate ?? 0,
          hsnCode: item.hsnCode ?? null,
          cgstAmount: item.cgstAmount ?? 0,
          sgstAmount: item.sgstAmount ?? 0,
          igstAmount: item.igstAmount ?? 0,
          taxableAmount: item.taxableAmount ?? 0,
          totalTaxAmount: item.totalTaxAmount ?? 0,
        })),
        subtotal: order.subtotal ?? 0,
        discount: order.discount ?? 0,
        tax: order.tax ?? 0,
        cgst: order.cgst ?? 0,
        sgst: order.sgst ?? 0,
        igst: order.igst ?? 0,
        total: order.total ?? 0,
        status: 'draft', // Default status for new invoice
        type: order.type ?? null, // Inherit type from order
        notes: `Converted from Order ${order.orderNumber}.\n\n${order.notes ?? ''}`,
        terms: order.terms ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: order.createdBy ?? null,
        isGstInvoice: order.type === 'gst',
        saleDate: order.orderDate ?? null,
        companyDetails: order.companyDetails ?? null,
      };

      const newInvoice = await invoiceService.createInvoice(invoiceData as Invoice);
      setSuccessMessage(`Order ${order.orderNumber} converted to Invoice ${newInvoice} successfully!`);
      // Optionally update order status to 'converted' or similar
      await OrderService.updateOrder(order.id!, { status: 'completed' });
      setTimeout(() => router.push(`/invoices/${newInvoice}`), 2000);

    } catch (err: any) {
      console.error("Error converting order to invoice:", err);
      setError(err.message || "Failed to convert order to invoice.");
    } finally {
      setConverting(false);
    }
  };

  const getStatusChipColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'default';
      case 'confirmed': return 'info';
      case 'shipped': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <HourglassEmptyIcon />;
      case 'confirmed': return <CheckCircleIcon />;
      case 'shipped': return <LocalShippingIcon />;
      case 'completed': return <ReceiptIcon />;
      case 'cancelled': return <CancelIcon />;
      default: return <HourglassEmptyIcon />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Order Details...</Typography>
      </Box>
    );
  }

  if (error && !order) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!order) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        Order not found.
      </Alert>
    );
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

        <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid xs={12} md={6} component="div">
              <Typography variant="h6" gutterBottom>Order Information</Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1"><strong>Order Number:</strong> {order.orderNumber}</Typography>
              <Typography variant="body1"><strong>Order Date:</strong> {formatDate(order.orderDate)}</Typography>
              {order.dueDate && <Typography variant="body1"><strong>Due Date:</strong> {formatDate(order.dueDate)}</Typography>}
              <Typography variant="body1"><strong>Status:</strong> 
                <Chip
                  label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  color={getStatusChipColor(order.status)}
                  icon={getStatusIcon(order.status)}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>
              <Typography variant="body1"><strong>Total Amount:</strong> {formatCurrency(order.total)}</Typography>
            </Grid>
            <Grid xs={12} md={6} component="div">
              <Typography variant="h6" gutterBottom>Party Details</Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1"><strong>Name:</strong> {order.partyName}</Typography>
              {order.partyGstin && <Typography variant="body1"><strong>GSTIN:</strong> {order.partyGstin}</Typography>}
              {order.partyAddress && <Typography variant="body1"><strong>Address:</strong> {order.partyAddress}</Typography>}
              {order.partyPhone && <Typography variant="body1"><strong>Phone:</strong> {order.partyPhone}</Typography>}
              {order.partyEmail && <Typography variant="body1"><strong>Email:</strong> {order.partyEmail}</Typography>}
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>Order Items</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Rate</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    {order.type === 'gst' && <TableCell align="right">HSN</TableCell>}
                    {order.type === 'gst' && <TableCell align="right">GST</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.finalPrice)}</TableCell>
                      {order.type === 'gst' && <TableCell align="right">{item.hsnCode || 'N/A'}</TableCell>}
                      {order.type === 'gst' && <TableCell align="right">{item.gstRate ? `${item.gstRate}%` : 'N/A'}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {order.notes && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>Notes</Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>{order.notes}</Typography>
            </Box>
          )}

          {order.terms && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>Terms and Conditions</Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>{order.terms}</Typography>
            </Box>
          )}

          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => router.push(`/orders/${order.id}/edit`)}
            >
              Edit Order
            </Button>
            <Button
              variant="outlined"
              startIcon={<DeleteIcon />}
              color="error"
              onClick={handleDeleteClick}
            >
              Delete Order
            </Button>
            {order.status !== 'completed' && (
              <Button
                variant="contained"
                startIcon={converting ? <CircularProgress size={20} color="inherit" /> : <ReceiptIcon />}
                onClick={handleConvertOrderToInvoice}
                disabled={converting}
              >
                {converting ? 'Converting...' : 'Convert to Invoice'}
              </Button>
            )}
          </Box>
        </Paper>

        <ConfirmationDialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Confirm Deletion"
          message={`Are you sure you want to delete order ${order.orderNumber}? This action cannot be undone.`}
          confirmText="Delete"
          confirmColor="error"
        />
    </Box>
  );
}
