"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
import SimpleInvoiceView from '@/app/invoices/components/SimpleInvoiceView';
import GstInvoiceView from '@/app/invoices/components/GstInvoiceView';
import { executeWithRetry, getFirestoreErrorMessage } from '@/utils/firestoreHelpers';

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  partyName: string;
  items: any[];
  subtotal: number;
  total: number;
  isGstInvoice?: boolean;
  // Add other necessary invoice fields
}

export default function PrintInvoicePage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const template = searchParams.get('template');

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        if (!id) {
          setError('Invoice ID is missing');
          setLoading(false);
          return;
        }

        await executeWithRetry(async () => {
          const invoiceRef = doc(db, 'invoices', id as string);
          const invoiceSnap = await getDoc(invoiceRef);

          if (!invoiceSnap.exists()) {
            setError('Invoice not found');
            return;
          }

          setInvoice({
            id: invoiceSnap.id,
            ...invoiceSnap.data(),
          } as Invoice);
          setError(null);
        }, 3, (attempt, maxRetries) => {
          setError(`Connection error while loading invoice. Retrying... (Attempt ${attempt}/${maxRetries})`);
        });
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError(getFirestoreErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  useEffect(() => {
    if (!loading && invoice) {
      // Give a small delay to ensure content is rendered before printing
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, invoice]);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading invoice for printing...</Typography>
      </Container>
    );
  }

  if (error || !invoice) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Invoice not found or could not be loaded.'}</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {template === 'gst' || invoice.isGstInvoice ? (
        <GstInvoiceView invoice={invoice} />
      ) : (
        <SimpleInvoiceView invoice={invoice} />
      )}
    </Box>
  );
}
