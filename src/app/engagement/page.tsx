"use client";
import React from 'react';
import { 
  Box, 
  Typography, 
  Breadcrumbs, 
  Link, 
  useMediaQuery, 
  useTheme,
  IconButton
} from '@mui/material';
import { 
  Home as HomeIcon, 
  BarChart as BarChartIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import EngagementDashboard from '@/components/Dashboard/EngagementDashboard';
import { useRouter } from 'next/navigation';

export default function EngagementPage() {
  const theme = useTheme();
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <DashboardLayout>
      {isMobile ? (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              edge="start" 
              onClick={() => router.push('/dashboard')}
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
              User Engagement
            </Typography>
          </Box>
        </Box>
      ) : (
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
              <BarChartIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              User Engagement
            </Typography>
          </Breadcrumbs>
        </Box>
      )}
      
      <EngagementDashboard />
    </DashboardLayout>
  );
}