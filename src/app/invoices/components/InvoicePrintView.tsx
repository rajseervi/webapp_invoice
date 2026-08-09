"use client";
import React from 'react';
import { useTemplate } from '@/contexts/TemplateContext';
import ModernInvoiceTemplate from './templates/ModernInvoiceTemplate';
import ClassicInvoiceTemplate from './templates/ClassicInvoiceTemplate';
import MinimalistInvoiceTemplate from './templates/MinimalistInvoiceTemplate';
import { Invoice } from '@/types/invoice';

interface InvoicePrintViewProps {
  invoice: Invoice;
}

const InvoicePrintView: React.FC<InvoicePrintViewProps> = ({ invoice }) => {
  const { template } = useTemplate();

  switch (template) {
    case 'classic':
      return <ClassicInvoiceTemplate invoice={invoice} />;
    case 'minimalist':
      return <MinimalistInvoiceTemplate invoice={invoice} />;
    case 'modern':
    default:
      return <ModernInvoiceTemplate invoice={invoice} />;
  }
};

export default InvoicePrintView;
