"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Invoice } from '@/types/invoice';
import PrintableInvoices from '../components/PrintableInvoice';
import { TemplateProvider } from '@/contexts/TemplateContext';
import { Box, CircularProgress, Typography, Container, Button } from '@mui/material';

export default function PrintMultipleInvoicesPage() {
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      const ids = searchParams.getAll('id');
      if (ids.length === 0) {
        setError('No invoices selected');
        setLoading(false);
        return;
      }

      try {
        const invoicePromises = ids.map(id => getDoc(doc(db, 'invoices', id)));
        const invoiceSnaps = await Promise.all(invoicePromises);
        const fetchedInvoices = invoiceSnaps.map(snap => ({ id: snap.id, ...snap.data() } as Invoice));
        setInvoices(fetchedInvoices.filter(inv => inv.id)); // Filter out any not found
      } catch (err) {
        setError('Failed to fetch invoices');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [searchParams]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Typography color="error">{error}</Typography></Box>;
  }

  return (
    <TemplateProvider>
        <Container sx={{my: 2}}>
            <Button variant="contained" onClick={() => window.print()} sx={{mb: 2}}>Print All</Button>
            {invoices.length > 0 && <PrintableInvoices invoices={invoices} />}
        </Container>
    </TemplateProvider>
  );
}
