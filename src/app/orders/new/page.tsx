"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import MultiStepOrderForm from '@/components/Orders/MultiStepOrderForm';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  alpha
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  ShoppingCart as ShoppingCartIcon,
  Add as AddIcon,
  Bookmark as BookmarkIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import { orderService } from '@/services/orderService';
import type { Order } from '@/types/order';

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Order[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Order | null>(null);
  
  // Check if creating from template
  const templateId = searchParams?.get('template');
  const [initialData, setInitialData] = useState<Partial<Order> | undefined>(undefined);

  // Load initial data and templates
  useEffect(() => {
    const loadData = async () => {
      try {
        setTemplatesLoading(true);
        
        // Load templates
        const templatesData = await orderService.getOrderTemplates();
        setTemplates(templatesData);
        
        // If template ID is provided, load template data
        if (templateId) {
          const template = await orderService.getOrder(templateId);
          if (template.isTemplate) {
            setInitialData({
              ...template,
              isTemplate: false,
              status: undefined,
              paymentStatus: undefined,
              createdAt: undefined,
              updatedAt: undefined,
              id: undefined,
              orderNumber: undefined
            });
          }
        }
        
        setTemplatesLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please try again.');
        setTemplatesLoading(false);
      }
    };

    loadData();
  }, [templateId]);

  const handleOrderComplete = (orderId: string) => {
    setSuccess('Order created successfully!');
    setTimeout(() => {
      router.push(`/orders/${orderId}`);
    }, 1500);
  };

  const handleCancel = () => {
    router.push('/orders');
  };

  const handleUseTemplate = (template: Order) => {
    setSelectedTemplate(template);
    setInitialData({
      ...template,
      isTemplate: false,
      status: undefined,
      paymentStatus: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      id: undefined,
      orderNumber: undefined
    });
    setTemplateDialogOpen(false);
  };

  if (templatesLoading) {
    return (
      <DashboardLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
          </Box>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
        {/* Header */}
        <Box 
          sx={{ 
            mb: 4, 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2
          }}
        >
          <Box>
            <Typography 
              variant="h4" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                background: theme => `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Create New Order
            </Typography>
            <Breadcrumbs aria-label="breadcrumb">
              <MuiLink
                underline="hover"
                color="inherit"
                component={Link}
                href="/dashboard"
                sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Dashboard
              </MuiLink>
              <MuiLink
                underline="hover"
                color="inherit"
                component={Link}
                href="/orders"
                sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <ShoppingCartIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Orders
              </MuiLink>
              <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
                <AddIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                New Order
              </Typography>
            </Breadcrumbs>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {templates.length > 0 && (
              <Button
                variant="outlined"
                startIcon={<BookmarkIcon />}
                onClick={() => setTemplateDialogOpen(true)}
                sx={{ borderRadius: 2 }}
              >
                Use Template
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleCancel}
              sx={{ borderRadius: 2 }}
            >
              Back to Orders
            </Button>
          </Box>
        </Box>

        {/* Quick Stats */}
        {templates.length > 0 && (
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  background: theme => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.05)})`,
                  border: '1px solid',
                  borderColor: 'primary.light'
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary.main" fontWeight="bold">
                    {templates.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available Templates
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  background: theme => `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.main, 0.05)})`,
                  border: '1px solid',
                  borderColor: 'success.light'
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="success.main" fontWeight="bold">
                    5 Steps
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Order Creation Process
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Status Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {/* Main Form */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            background: theme => alpha(theme.palette.background.paper, 0.8)
          }}
        >
          <MultiStepOrderForm
            initialData={initialData}
            onComplete={handleOrderComplete}
            onCancel={handleCancel}
            loading={loading}
            setLoading={setLoading}
            setError={setError}
          />
        </Paper>

        {/* Template Selection Dialog */}
        <Dialog 
          open={templateDialogOpen} 
          onClose={() => setTemplateDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BookmarkIcon color="primary" />
              Choose Order Template
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select a template to pre-fill the order form with saved data.
            </Typography>
            <List>
              {templates.map((template) => (
                <React.Fragment key={template.id}>
                  <ListItemButton
                    onClick={() => handleUseTemplate(template)}
                    sx={{ 
                      borderRadius: 2, 
                      mb: 1,
                      '&:hover': {
                        backgroundColor: theme => alpha(theme.palette.primary.main, 0.08)
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {template.customerName}
                          </Typography>
                          <Chip 
                            label="Template" 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Items: {template.items?.length || 0} • 
                            Total: ${template.totalAmount?.toFixed(2) || '0.00'}
                          </Typography>
                          {template.notes && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {template.notes.length > 100 
                                ? `${template.notes.substring(0, 100)}...` 
                                : template.notes
                              }
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ContentCopyIcon color="action" />
                  </ListItemButton>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTemplateDialogOpen(false)}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </DashboardLayout>
  );
}