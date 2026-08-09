import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Typography, Box, Alert, Snackbar } from '@mui/material';
import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';
import PageHeader from '@/components/PageHeader/PageHeader';
import { OrderForm } from '@/components/Orders/OrderForm';
import { OrderService } from '@/services/orderService';
import { Order } from '@/types/order';
import { Add as AddIcon } from '@mui/icons-material';

export default function OriginalPageComponent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (orderData: Order) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const newOrder = await OrderService.createOrder(orderData);
      setSuccess(`Order ${newOrder?.orderNumber} created successfully!`);
      setTimeout(() => {
        router.push(`/orders/${newOrder?.id}`);
      }, 2000);
    } catch (err: any) {
      console.error("Error creating order:", err);
      setError(err.message || "Failed to create order.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <ImprovedDashboardLayout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <PageHeader
          title="Create New Order"
          subtitle="Fill in the details to create a new sales order"
          icon={<AddIcon />}
          buttonText="Back to Orders"
          onButtonClick={() => router.push('/orders')}
        />

        <OrderForm
          onSubmit={handleSubmit}
          loading={loading}
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
      </Container>
    </ImprovedDashboardLayout>
  );
}
