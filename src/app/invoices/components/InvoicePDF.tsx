"use client";
import React from 'react';
import { Button, Box, Tooltip } from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

import { Invoice } from '@/types/invoice';
import { useTemplate } from '@/contexts/TemplateContext';

interface InvoicePDFProps {
  invoice: Invoice;
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice }) => {
  // Get the current template from context
  const { template } = useTemplate();
  const router = useRouter();
  
  const navigateToPrintPage = () => {
    // Navigate to the print page for this invoice
    router.push(`/invoices/${invoice.id}/print`);
  };

  // Get template name for display
  const getTemplateDisplayName = () => {
    switch(template) {
      case 'modern': return 'Modern';
      case 'classic': return 'Classic';
      case 'minimalist': return 'Minimalist';
      default: return 'Selected';
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Tooltip title={`Print invoice using ${getTemplateDisplayName()} template style`}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PrintIcon />}
          onClick={navigateToPrintPage}
          size="small"
        >
          Print
        </Button>
      </Tooltip>
    </Box>
  );
};

export default InvoicePDF;