"use client";
import React from 'react';
import { Box, useTheme, alpha } from '@mui/material';
import ModernInvoiceTemplate from './templates/ModernInvoiceTemplate';
import ClassicInvoiceTemplate from './templates/ClassicInvoiceTemplate';
import MinimalistInvoiceTemplate from './templates/MinimalistInvoiceTemplate';
import TemplateSwitcher, { TemplateType } from './TemplateSwitcher';
import { useTemplate } from '@/contexts/TemplateContext';

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
        justifyContent: 'center', 
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
      </Box>
      
      {template === 'modern' && <ModernInvoiceTemplate invoice={invoice} />}
      {template === 'classic' && <ClassicInvoiceTemplate invoice={invoice} />}
      {template === 'minimalist' && <MinimalistInvoiceTemplate invoice={invoice} />}
    </Box>
  );
};

export default InvoiceTemplateSelector;