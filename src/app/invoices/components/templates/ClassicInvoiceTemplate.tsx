"use client";
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha,
  Stack // Import Stack
} from '@mui/material';

import { Invoice } from '@/types/invoice';
import CompanyInfoDisplay from '@/components/CompanyInfoDisplay';

interface InvoiceTemplateProps {
  invoice: Invoice;
}

const ClassicInvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ invoice }) => {
  const theme = useTheme();

  return (
    <Paper 
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        mb: 3,
        borderRadius: 1,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
        // Print-specific styles
        '@media print': {
          width: '210mm',
          minHeight: '297mm',
          margin: '10mm auto',
          padding: '15mm',
          boxShadow: 'none',
          borderRadius: 0,
          border: 'none',
          pageBreakAfter: 'always',
          pageBreakInside: 'avoid'
        }
      }}
    >
      {/* Header - Reduced size for print */}
      <Box sx={{ 
        '@media print': { 
          mb: 2,
          '& .MuiTypography-h4': { fontSize: '1.5rem' }
        }
      }}>
        // ... existing header code ...
      </Box>

      {/* Table - Adjusted for print */}
      <TableContainer sx={{
        mb: 4,
        '@media print': {
          '& .MuiTableCell-root': { 
            padding: '4px',
            fontSize: '0.75rem'
          }
        }
      }}>
        // ... existing table code ...
      </TableContainer>

      {/* Footer - Simplified for print */}
      <Box sx={{ 
        '@media print': { 
          position: 'absolute',
          bottom: '15mm',
          left: '15mm',
          right: '15mm'
        }
      }}>
        // ... existing footer code ...
      </Box>
    </Paper>
  );
};

export default ClassicInvoiceTemplate;