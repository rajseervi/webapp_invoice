"use client";
import React from 'react';
import { Box, useTheme, alpha, Typography, Paper, Tooltip } from '@mui/material';
import ModernInvoiceTemplate from './templates/ModernInvoiceTemplate';
import ClassicInvoiceTemplate from './templates/ClassicInvoiceTemplate';
import MinimalistInvoiceTemplate from './templates/MinimalistInvoiceTemplate';
import TemplateSwitcher, { TemplateType } from './TemplateSwitcher';
import { useTemplate } from '@/contexts/TemplateContext';
import { PictureAsPdf as PdfIcon, Print as PrintIcon } from '@mui/icons-material';

import { Invoice } from '@/types/invoice';

interface InvoiceTemplateSelectorProps {
  invoice: Invoice;
}

const InvoiceTemplateSelector: React.FC<InvoiceTemplateSelectorProps> = ({ invoice }) => {
  const theme = useTheme();
  const { template, setTemplate } = useTemplate();
  
  const handleTemplateChange = (newTemplate: TemplateType) => {
    setTemplate(newTemplate);
  };
  
  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        mb: 3,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        bgcolor: alpha(theme.palette.background.default, 0.9),
        backdropFilter: 'blur(8px)',
        py: 2,
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <TemplateSwitcher 
          selectedTemplate={template}
          onTemplateChange={handleTemplateChange}
          showLabels={true}
        />
        
        <Paper 
          elevation={0}
          sx={{ 
            mt: 2, 
            p: 1, 
            display: 'flex', 
            alignItems: 'center', 
            bgcolor: alpha(theme.palette.info.light, 0.1),
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            borderRadius: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="PDF download will use this template">
              <PdfIcon fontSize="small" color="info" sx={{ mr: 1 }} />
            </Tooltip>
            <Tooltip title="Print will use this template">
              <PrintIcon fontSize="small" color="info" sx={{ mr: 1 }} />
            </Tooltip>
            <Typography variant="caption" color="info.main">
              Selected template will be used for PDF download and printing
            </Typography>
          </Box>
        </Paper>
      </Box>
      
      {template === 'modern' && <ModernInvoiceTemplate invoice={invoice} />}
      {template === 'classic' && <ClassicInvoiceTemplate invoice={invoice} />}
      {template === 'minimalist' && <MinimalistInvoiceTemplate invoice={invoice} />}
    </Box>
  );
};

export default InvoiceTemplateSelector;