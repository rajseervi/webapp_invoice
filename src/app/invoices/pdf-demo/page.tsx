"use client";
import React from 'react';
import { Container } from '@mui/material';
import PdfFunctionalityDemo from '@/components/invoices/PdfFunctionalityDemo';

export default function PdfDemoPage() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PdfFunctionalityDemo />
    </Container>
  );
}