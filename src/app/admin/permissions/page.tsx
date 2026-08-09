'use client';

import React from 'react';
import { Box, Typography, Stack, Tabs, Tab, Paper } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import PermissionManagementPanel from '@/components/PermissionManagement/PermissionManagementPanel';
import RoleOverviewPanel from '@/components/PermissionManagement/RoleOverviewPanel';
import PermissionGuard from '@/components/PermissionGuard';
import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';

function TabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function PermissionsManagementPage() {
  const { userRole } = useAuth();
  const router = useRouter();
  const [tabValue, setTabValue] = React.useState(0);

  if (userRole !== 'admin') {
    return (
      <ImprovedDashboardLayout title="Access Denied">
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="error">
            Only admins can access this page
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ cursor: 'pointer', mt: 2, color: 'primary.main' }}
            onClick={() => router.push('/dashboard')}
          >
            Return to Dashboard
          </Typography>
        </Box>
      </ImprovedDashboardLayout>
    );
  }

  return (
    <PermissionGuard
      pageId="permissions_management"
      fallback={
        <ImprovedDashboardLayout title="Access Denied">
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="error">
              You don't have permission to access this page
            </Typography>
          </Box>
        </ImprovedDashboardLayout>
      }
    >
      <ImprovedDashboardLayout title="Permissions Management">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
              User & Permission Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage user roles, status, and assign custom permissions
            </Typography>
          </Box>

          <Paper sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              aria-label="permission management tabs"
            >
              <Tab label="Users" id="tab-0" aria-controls="tabpanel-0" />
              <Tab label="Roles & Permissions" id="tab-1" aria-controls="tabpanel-1" />
            </Tabs>
          </Paper>

          <TabPanel value={tabValue} index={0}>
            <PermissionManagementPanel />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <RoleOverviewPanel />
          </TabPanel>
        </Stack>
      </ImprovedDashboardLayout>
    </PermissionGuard>
  );
}
