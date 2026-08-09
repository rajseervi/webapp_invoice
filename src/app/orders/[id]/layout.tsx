"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import {
  Box,
  Container,
  Breadcrumbs,
  Link,
  Typography,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
  Edit as EditIcon,
  Home as HomeIcon,
  ShoppingCart as ShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
  LocalShipping as LocalShippingIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassEmptyIcon,
} from '@mui/icons-material';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import { OrderService } from '@/services/orderService';
import { Order } from '@/types/order';
import NextLink from 'next/link';

interface OrderLayoutProps {
  children: React.ReactNode;
}

export default function OrderLayout({ children }: OrderLayoutProps) {
  const { id } = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine current tab based on pathname
  const getCurrentTab = () => {
    if (pathname?.includes('/edit')) return 1;
    return 0; // default to details tab
  };

  const [tabValue, setTabValue] = useState(getCurrentTab());

  useEffect(() => {
    setTabValue(getCurrentTab());
  }, [pathname]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        if (!id) {
          setError('Order ID is missing');
          return;
        }
        const fetchedOrder = await OrderService.getOrderById(id as string);
        if (!fetchedOrder) {
          setError('Order not found');
        } else {
          setOrder(fetchedOrder);
        }
      } catch (err: any) {
        console.error("Error fetching order:", err);
        setError(err.message || "Failed to fetch order.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    switch (newValue) {
      case 0:
        router.push(`/orders/${id}`);
        break;
      case 1:
        router.push(`/orders/${id}/edit`);
        break;
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
    return new Date(dateString).toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <VisuallyEnhancedDashboardLayout
        title="Loading Order"
        pageType="order"
      >
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress />
            <Typography variant="h6" sx={{ ml: 2 }}>Loading Order...</Typography>
          </Box>
        </Container>
      </VisuallyEnhancedDashboardLayout>
    );
  }

  if (error && !order) {
    return (
      <VisuallyEnhancedDashboardLayout
        title="Order Error"
        pageType="order"
      >
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <IconButton onClick={() => router.push('/orders')} color="primary">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="body1">Back to Orders</Typography>
          </Box>
        </Container>
      </VisuallyEnhancedDashboardLayout>
    );
  }

  return (
    <VisuallyEnhancedDashboardLayout
      title={order ? `Order #${order.orderNumber}` : 'Order Details'}
      subtitle={order ? `${order.partyName} • ${formatCurrency(order.total)}` : undefined}
      pageType="order"
      showBreadcrumbs={false}
    >
      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        {/* Breadcrumbs */}
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs aria-label="breadcrumb">
            <Link
              component={NextLink}
              href="/dashboard"
              color="inherit"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Dashboard
            </Link>
            <Link
              component={NextLink}
              href="/orders"
              color="inherit"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <ShoppingCartIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Orders
            </Link>
            <Typography
              color="text.primary"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <ReceiptIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              {order ? `Order #${order.orderNumber}` : 'Order Details'}
            </Typography>
          </Breadcrumbs>
        </Box>

        {/* Header with Order Info */}
        {order && (
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  Order #{order.orderNumber}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  {order.partyName} • {formatDate(order.orderDate)} • {formatCurrency(order.total)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  color={getStatusChipColor(order.status)}
                  icon={getStatusIcon(order.status)}
                  size="medium"
                />
                <Tooltip title="Back to Orders">
                  <IconButton onClick={() => router.push('/orders')} color="primary">
                    <ArrowBackIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Navigation Tabs */}
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="order navigation tabs"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab
                icon={<ReceiptIcon />}
                label="Order Details"
                iconPosition="start"
              />
              <Tab
                icon={<EditIcon />}
                label="Edit Order"
                iconPosition="start"
                disabled={order.status === 'completed' || order.status === 'cancelled'}
              />
            </Tabs>
          </Paper>
        )}

        {/* Page Content */}
        <Box>
          {children}
        </Box>
      </Container>
    </VisuallyEnhancedDashboardLayout>
  );
}