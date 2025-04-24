"use client";
import React from 'react';
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { Home as HomeIcon, Analytics as AnalyticsIcon } from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import EngagementDashboard from '@/components/Dashboard/EngagementDashboard';

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            underline="hover"
            color="inherit"
            href="/dashboard"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </Link>
          <Typography
            sx={{ display: 'flex', alignItems: 'center' }}
            color="text.primary"
          >
            <AnalyticsIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Analytics
          </Typography>
        </Breadcrumbs>
      </Box>
      
      <EngagementDashboard />
    </DashboardLayout>
  );
}