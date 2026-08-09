"use client";
import React from 'react';
import { Box } from '@mui/material';
import { Invoice } from '@/types/invoice';
import { useTemplate } from '@/contexts/TemplateContext';
import EnhancedPdfButton from '@/components/invoices/EnhancedPdfButton';

interface InvoicePDFProps {
  invoice: Invoice;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  showDropdown?: boolean;
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ 
  invoice, 
  variant = 'contained',
  size = 'small',
  showDropdown = true
}) => {
  const { template } = useTemplate();

  // Transform invoice data to match the expected format
  const invoiceData = {
    ...invoice,
    company: {
      name: invoice.companyName || 'Company Name',
      address: invoice.companyAddress || 'Company Address',
      gstin: invoice.companyGstin,
      phone: invoice.companyPhone,
      email: invoice.companyEmail
    },
    customer: {
      name: invoice.partyName || invoice.customerName || 'Customer Name',
      address: invoice.partyAddress || invoice.customerAddress || 'Customer Address',
      gstin: invoice.partyGstin || invoice.customerGstin,
      phone: invoice.partyPhone || invoice.customerPhone,
      email: invoice.partyEmail || invoice.customerEmail
    },
    invoiceNumber: invoice.invoiceNumber,
    date: invoice.date || invoice.invoiceDate,
    dueDate: invoice.dueDate,
    items: invoice.items || [],
    subtotal: invoice.subtotal || 0,
    total: invoice.total || invoice.grandTotal || 0,
    grandTotal: invoice.grandTotal || invoice.total || 0,
    totalTaxAmount: invoice.totalTaxAmount || 0,
    balanceAmount: invoice.balanceAmount,
    discount: invoice.discount || 0,
    notes: invoice.notes,
    terms: invoice.terms,
    isGstInvoice: invoice.isGstInvoice || false,
    type: invoice.type,
    status: invoice.status,
    paymentStatus: invoice.paymentStatus,
    paymentDetails: invoice.paymentDetails
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <EnhancedPdfButton
        invoiceData={invoiceData}
        variant={variant}
        size={size}
        color="primary"
        showDropdown={showDropdown}
        defaultAction="preview"
        buttonText="PDF"
      />
    </Box>
  );
};

export default InvoicePDF;