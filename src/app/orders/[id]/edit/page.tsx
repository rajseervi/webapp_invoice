"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
  Snackbar,
  Button
} from '@mui/material';
import { OrderForm } from '@/components/Orders/OrderForm';
import { OrderService } from '@/services/orderService';
import { Order } from '@/types/order';

export default function EditOrderPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
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
    fetchOrder();
  }, [id]);

  const handleSubmit = async (orderData: Order) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await OrderService.updateOrder(id as string, orderData);
      setSuccess(`Order ${orderData.orderNumber} updated successfully!`);
      // Optionally, re-fetch the order to ensure UI is up-to-date
      // fetchOrder();
      setTimeout(() => {
        router.push(`/orders/${id}`);
      }, 2000);
    } catch (err: any) {
      console.error("Error updating order:", err);
      setError(err.message || "Failed to update order.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Order for Edit...</Typography>
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
        Order not found for editing.
      </Alert>
    );
  }

  return (
    <Box>
      <OrderForm
        initialOrder={order}
        onSubmit={handleSubmit}
        loading={submitting}
        error={error}
        success={success}
        onCloseSnackbar={handleCloseSnackbar}
      />

      <Snackbar open={!!success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
