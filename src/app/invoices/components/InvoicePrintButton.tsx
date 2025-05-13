"use client";
import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface InvoicePrintButtonProps {
  invoiceId: string;
  invoiceNumber: string;
}

const InvoicePrintButton: React.FC<InvoicePrintButtonProps> = ({ invoiceId, invoiceNumber }) => {
  const router = useRouter();

  const handlePrint = () => {
    // Navigate to the print page for this invoice
    router.push(`/invoices/${invoiceId}/print`);
  };

  return (
    <Tooltip title={`Print invoice #${invoiceNumber}`}>
      <IconButton
        size="small"
        color="primary"
        onClick={handlePrint}
      >
        <PrintIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};

export default InvoicePrintButton;