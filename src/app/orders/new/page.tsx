"use client";
import React, { useState } from 'react';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import { Button, Stack, Chip, Snackbar, Alert } from '@mui/material';
import { 
  Add as AddIcon, 
  Download as DownloadIcon,
  History as HistoryIcon,
  AutoAwesome as AutoAwesomeIcon,
  Speed as SpeedIcon,
  Bookmark as BookmarkIcon
} from '@mui/icons-material';

// Import components
import EnhancedNewOrderPage from './enhanced-page';
import QuickOrderForm from '@/components/Orders/QuickOrderForm';
import OrderTemplates from '@/components/Orders/OrderTemplates';
import { Order } from '@/types/order';

export default function ModernCreateOrderPage() {
  const [showQuickOrder, setShowQuickOrder] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleQuickOrderSuccess = (order: Order) => {
    setSuccessMessage(`Quick order ${order.orderNumber} created successfully!`);
    setTimeout(() => {
      window.location.href = `/orders/${order.id}`;
    }, 2000);
  };

  const handleTemplateSelect = (template: any) => {
    // Handle template selection - could populate the main form
    console.log('Selected template:', template);
    setShowTemplates(false);
    // You could emit an event or use context to populate the main form
  };

  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Create New Order"
        pageType="orders"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <EnhancedNewOrderPage />
        
        {/* Quick Order Dialog */}
        <QuickOrderForm
          open={showQuickOrder}
          onClose={() => setShowQuickOrder(false)}
          onSuccess={handleQuickOrderSuccess}
        />
        
        {/* Order Templates Dialog */}
        <OrderTemplates
          open={showTemplates}
          onClose={() => setShowTemplates(false)}
          onSelectTemplate={handleTemplateSelect}
        />
        
        {/* Success Snackbar */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={6000}
          onClose={() => setSuccessMessage(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="success" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        </Snackbar>
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}