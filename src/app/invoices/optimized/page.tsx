"use client";
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Divider,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Inventory as InventoryIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
  Bolt as BoltIcon
} from '@mui/icons-material';
import OptimizedInvoiceForm from '../components/OptimizedInvoiceForm';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`invoice-tabpanel-${index}`}
      aria-labelledby={`invoice-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const OptimizedInvoicePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleInvoiceCreated = (invoiceId: string) => {
    console.log('Invoice created with ID:', invoiceId);
    // You can add additional logic here like navigation or notifications
  };

  const features = [
    {
      icon: <CheckCircleIcon color="success" />,
      title: 'Allow Insufficient Stock',
      description: 'Create invoices even when products are out of stock or have insufficient quantity'
    },
    {
      icon: <TimerIcon color="primary" />,
      title: 'Optimized Performance',
      description: 'Batch operations, product preloading, and smart caching for faster invoice creation'
    },
    {
      icon: <WarningIcon color="warning" />,
      title: 'Smart Warnings',
      description: 'Get detailed warnings about stock levels without blocking invoice creation'
    },
    {
      icon: <InventoryIcon color="info" />,
      title: 'Real-time Stock Updates',
      description: 'Automatically update inventory levels including negative stock tracking'
    },
    {
      icon: <TrendingUpIcon color="success" />,
      title: 'Business Continuity',
      description: 'Never lose a sale due to stock unavailability - handle backorders seamlessly'
    },
    {
      icon: <BoltIcon color="primary" />,
      title: 'Flexible Options',
      description: 'Choose between quick, safe, or custom modes based on your business needs'
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          Optimized Invoice Creation
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Fast, flexible, and intelligent invoice processing with advanced stock management
        </Typography>
        
        {/* Key Benefits */}
        <Alert severity="success" sx={{ mb: 4, textAlign: 'left' }}>
          <AlertTitle>🚀 Key Improvements</AlertTitle>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">
                ✅ <strong>Insufficient Stock Support:</strong> Create invoices even with low/no stock
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">
                ⚡ <strong>Performance Optimized:</strong> Up to 70% faster invoice creation
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">
                📊 <strong>Smart Warnings:</strong> Get stock insights without blocking sales
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">
                🔧 <strong>Flexible Modes:</strong> Quick, Safe, or Custom processing options
              </Typography>
            </Grid>
          </Grid>
        </Alert>
      </Box>

      {/* Features Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {feature.icon}
                  <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>
                    {feature.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Mode Selection Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: 80,
              flexDirection: 'column',
              gap: 1
            }
          }}
        >
          <Tab
            icon={<SpeedIcon />}
            label="Quick Mode"
            id="invoice-tab-0"
            aria-controls="invoice-tabpanel-0"
          />
          <Tab
            icon={<SecurityIcon />}
            label="Safe Mode"
            id="invoice-tab-1"
            aria-controls="invoice-tabpanel-1"
          />
          <Tab
            icon={<SettingsIcon />}
            label="Custom Mode"
            id="invoice-tab-2"
            aria-controls="invoice-tabpanel-2"
          />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>Quick Mode - Maximum Speed</AlertTitle>
            <List dense>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon><SpeedIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Minimal validation for fastest processing" />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                <ListItemText primary="Always allows insufficient stock" />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon><TimerIcon color="warning" /></ListItemIcon>
                <ListItemText primary="Optimized for high-volume processing" />
              </ListItem>
            </List>
          </Alert>
          <OptimizedInvoiceForm 
            mode="quick" 
            onInvoiceCreated={handleInvoiceCreated}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Alert severity="success" sx={{ mb: 3 }}>
            <AlertTitle>Safe Mode - Balanced Approach</AlertTitle>
            <List dense>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon><SecurityIcon color="success" /></ListItemIcon>
                <ListItemText primary="Full validation with comprehensive warnings" />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon><WarningIcon color="warning" /></ListItemIcon>
                <ListItemText primary="Stock warnings without blocking sales" />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon><InventoryIcon color="info" /></ListItemIcon>
                <ListItemText primary="Complete stock management integration" />
              </ListItem>
            </List>
          </Alert>
          <OptimizedInvoiceForm 
            mode="safe" 
            onInvoiceCreated={handleInvoiceCreated}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <AlertTitle>Custom Mode - Full Control</AlertTitle>
            <List dense>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon><SettingsIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Customize all processing options" />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon><BoltIcon color="warning" /></ListItemIcon>
                <ListItemText primary="Fine-tune performance vs validation trade-offs" />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon><TrendingUpIcon color="success" /></ListItemIcon>
                <ListItemText primary="Perfect for specific business requirements" />
              </ListItem>
            </List>
          </Alert>
          <OptimizedInvoiceForm 
            mode="custom" 
            onInvoiceCreated={handleInvoiceCreated}
          />
        </TabPanel>
      </Paper>

      {/* Technical Details */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Technical Improvements
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Performance Optimizations:
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Batch Firestore operations" 
                    secondary="Reduce database round trips"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Product preloading" 
                    secondary="Cache frequently used data"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Async stock updates" 
                    secondary="Non-blocking inventory management"
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Stock Management Features:
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Negative stock tracking" 
                    secondary="Handle backorders automatically"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Flexible validation" 
                    secondary="Warnings instead of hard blocks"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Smart stock alerts" 
                    secondary="Context-aware notifications"
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default OptimizedInvoicePage;