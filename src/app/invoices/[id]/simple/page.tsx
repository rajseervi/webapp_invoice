"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  Box,
  Button,
  CircularProgress,
  Alert,
  Typography
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { executeWithRetry, getFirestoreErrorMessage } from '@/utils/firestoreHelpers';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout'; // Assuming you use this layout
import Link from 'next/link';
import { Invoice } from '@/types/invoice';
import SimpleInvoiceView from '../../components/SimpleInvoiceView'; // Import the new component

export default function SimpleInvoicePage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        setError(null); // Reset error on new fetch

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

          const invoiceData = {
            id: invoiceSnap.id,
            ...invoiceSnap.data()
          } as Invoice; // Ensure type assertion

          setInvoice(invoiceData);
        }, 3, (attempt, maxRetries) => {
          setError(`Connection error. Retrying... (${attempt}/${maxRetries})`);
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

  // Simple Header for this page
  const PageHeader = () => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h6">Invoice View</Typography>
      <Button
        component={Link}
        href={`/invoices/${id}`} // Link back to the main detail page
        startIcon={<ArrowBackIcon />}
        variant="outlined"
        size="small"
      >
        Back to Full View
      </Button>
    </Box>
  );

  return (
    <DashboardLayout>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}> {/* Using md for potentially narrower view */}
        <PageHeader />

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && invoice && (
          <SimpleInvoiceView invoice={invoice} />
        )}

        {!loading && !error && !invoice && (
           <Alert severity="warning">Invoice data could not be loaded.</Alert>
        )}
      </Container>
    </DashboardLayout>
  );
}