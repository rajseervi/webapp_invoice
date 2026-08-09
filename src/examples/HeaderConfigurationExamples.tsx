// Example implementations showing how to use SimpleModernHeader configurations

import React from 'react';
import ModernDashboardLayout from '@/components/ModernLayout/ModernDashboardLayout';
import { ConfiguredSimpleModernHeader } from '@/components/ModernLayout';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';

// Example 1: Dashboard Page with Auto Configuration
export function DashboardPageExample() {
  return (
    <ModernDashboardLayout pageType="dashboard">
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard Overview
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Sales Today</Typography>
                <Typography variant="h3">₹45,000</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Orders Pending</Typography>
                <Typography variant="h3">12</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </ModernDashboardLayout>
  );
}

// Example 2: Products Page with Custom Title
export function ProductsPageExample() {
  return (
    <ModernDashboardLayout 
      pageType="products"
      title="Product Catalog"
    >
      <Box>
        <Typography variant="h4" gutterBottom>
          Product Management
        </Typography>
        {/* Product list content */}
      </Box>
    </ModernDashboardLayout>
  );
}

// Example 3: Invoices Page with Custom Quick Actions
export function InvoicesPageExample() {
  const customQuickActions = [
    {
      id: 'new-gst-invoice',
      title: 'New GST Invoice',
      icon: <span>📄</span>,
      path: '/invoices/gst/new',
      color: '#4CAF50',
      isNew: true,
    },
    {
      id: 'bulk-print',
      title: 'Bulk Print',
      icon: <span>🖨️</span>,
      path: '/invoices/bulk-print',
      color: '#FF9800',
    },
  ];

  return (
    <ModernDashboardLayout pageType="invoices">
      <ConfiguredSimpleModernHeader
        pageType="invoices"
        customQuickActions={customQuickActions}
      />
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Invoice Management
        </Typography>
        {/* Invoice list content */}
      </Box>
    </ModernDashboardLayout>
  );
}

// Example 4: Admin Dashboard
export function AdminDashboardExample() {
  return (
    <ModernDashboardLayout pageType="adminDashboard">
      <Box>
        <Typography variant="h4" gutterBottom>
          Admin Control Panel
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total Users</Typography>
                <Typography variant="h3">1,234</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Active Sessions</Typography>
                <Typography variant="h3">89</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">System Health</Typography>
                <Typography variant="h3" color="success.main">Good</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </ModernDashboardLayout>
  );
}

// Example 5: Settings Page (No Quick Actions)
export function SettingsPageExample() {
  return (
    <ModernDashboardLayout pageType="settings">
      <Box>
        <Typography variant="h4" gutterBottom>
          Application Settings
        </Typography>
        {/* Settings form content */}
      </Box>
    </ModernDashboardLayout>
  );
}

// Example 6: Custom Configuration Override
export function CustomConfigurationExample() {
  return (
    <ModernDashboardLayout 
      pageType="products"
      title="Special Product View"
    >
      <ConfiguredSimpleModernHeader
        pageType="products"
        overrideConfig={{
          title: "Custom Product Manager",
          showSearch: false,
          showNotifications: false,
        }}
      />
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Custom Product View
        </Typography>
        {/* Custom content */}
      </Box>
    </ModernDashboardLayout>
  );
}

// Example 7: Standalone Header Usage
export function StandaloneHeaderExample() {
  return (
    <Box>
      <ConfiguredSimpleModernHeader 
        pageType="reports"
        title="Analytics Dashboard"
      />
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Standalone Header Example
        </Typography>
        {/* Page content without layout wrapper */}
      </Box>
    </Box>
  );
}

// Example 8: Theme Integration
export function ThemeIntegrationExample() {
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  return (
    <Box>
      <ConfiguredSimpleModernHeader
        pageType="dashboard"
        isDarkMode={isDarkMode}
        onThemeToggle={() => setIsDarkMode(!isDarkMode)}
      />
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Theme Integration Example
        </Typography>
        <Typography>
          Current theme: {isDarkMode ? 'Dark' : 'Light'}
        </Typography>
      </Box>
    </Box>
  );
}

// Example 9: Mobile-Optimized Header
export function MobileOptimizedExample() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <Box>
      <ConfiguredSimpleModernHeader
        pageType="orders"
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Mobile-Optimized Header
        </Typography>
        <Typography>
          Sidebar is {sidebarOpen ? 'open' : 'closed'}
        </Typography>
      </Box>
    </Box>
  );
}

// Example 10: Route-Based Auto Configuration
export function RouteBasedExample() {
  // This will automatically detect the current route and apply the right configuration
  return (
    <Box>
      <ConfiguredSimpleModernHeader />
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Route-Based Auto Configuration
        </Typography>
        <Typography>
          The header automatically configures itself based on the current route.
        </Typography>
      </Box>
    </Box>
  );
}