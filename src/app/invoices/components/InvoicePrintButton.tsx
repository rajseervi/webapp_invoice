"use client";
import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { PictureAsPdf as PdfIcon } from '@mui/icons-material';
import EnhancedPdfButton from '@/components/invoices/EnhancedPdfButton';

interface InvoicePrintButtonProps {
  invoiceId: string;
  invoiceNumber: string;
  invoiceData?: any;
  variant?: 'icon' | 'button';
}

const InvoicePrintButton: React.FC<InvoicePrintButtonProps> = ({ 
  invoiceId, 
  invoiceNumber, 
  invoiceData,
  variant = 'icon'
}) => {
  // If we have full invoice data, use the enhanced PDF button
  if (invoiceData && variant === 'button') {
    return (
      <EnhancedPdfButton
        invoiceData={invoiceData}
        variant="outlined"
        size="small"
        color="primary"
        showDropdown={false}
        defaultAction="download"
        buttonText="PDF"
      />
    );
  }

  // Fallback to simple icon button that opens print page
  const handlePrint = () => {
    window.open(`/invoices/${invoiceId}/print`, '_blank');
  };

  return (
    <Tooltip title={`Download PDF for invoice #${invoiceNumber}`}>
      <IconButton
        size="small"
        color="primary"
        onClick={handlePrint}
      >
        <PdfIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};

export default InvoicePrintButton;