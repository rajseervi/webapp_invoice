"use client";
import React from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import EnhancedInvoiceDetailPage from './enhanced-page';
import MobileInvoiceDetail from './MobileInvoiceDetail';

export default function InvoiceDetailPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isMobile) {
    return <MobileInvoiceDetail />;
  }

  return <EnhancedInvoiceDetailPage />;
}
