"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Alert,
  Button
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';
import PurchaseInvoiceServiceNoGST from '@/services/purchaseInvoiceServiceNoGST';
import type { PurchaseInvoice, PurchasePayment } from '@/types/purchase_no_gst';
import PurchaseInvoiceDetailsNoGST from '@/components/invoices/PurchaseInvoiceDetailsNoGST';

export default function PurchaseInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<PurchaseInvoice | null>(null);
  const [payments, setPayments] = useState<PurchasePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (invoiceId) {
      loadInvoiceData();
    }
  }, [invoiceId]);

  const loadInvoiceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [invoiceData, paymentsData] = await Promise.all([
        PurchaseInvoiceServiceNoGST.getPurchaseInvoiceById(invoiceId),
        PurchaseInvoiceServiceNoGST.getPaymentsByInvoiceId(invoiceId)
      ]);

      if (!invoiceData) {
        setError('Purchase invoice not found');
        return;
      }

      setInvoice(invoiceData);
      setPayments(paymentsData);
    } catch (err) {
      console.error('Error loading invoice data:', err);
      setError('Failed to load purchase invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await PurchaseInvoiceServiceNoGST.deletePurchaseInvoice(invoiceId, true);
      router.push('/inventory/purchase-invoices');
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError('Failed to delete invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (payment: Omit<PurchasePayment, 'id' | 'createdAt'>) => {
    try {
      setLoading(true);
      await PurchaseInvoiceServiceNoGST.addPayment(payment);
      await loadInvoiceData();
    } catch (err) {
      console.error('Error adding payment:', err);
      setError('Failed to add payment');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ImprovedDashboardLayout>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Typography>Loading...</Typography>
        </Container>
      </ImprovedDashboardLayout>
    );
  }

  if (error || !invoice) {
    return (
      <ImprovedDashboardLayout>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Invoice not found'}
          </Alert>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/inventory/purchase-invoices')}
          >
            Back to Purchase Invoices
          </Button>
        </Container>
      </ImprovedDashboardLayout>
    );
  }

  return (
    <ImprovedDashboardLayout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <PurchaseInvoiceDetailsNoGST
          invoice={invoice}
          payments={payments}
          onEdit={() => router.push(`/inventory/purchase-invoices/${invoiceId}/edit`)}
          onDelete={handleDelete}
          onAddPayment={handleAddPayment}
          onPrint={() => window.print()}
          readOnly={false}
        />
      </Container>
    </ImprovedDashboardLayout>
  );
}