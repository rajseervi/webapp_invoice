import React, { ReactNode } from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import Breadcrumbs from '../Breadcrumbs/Breadcrumbs';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  breadcrumbs?: { path: string; label: string }[];
  showBreadcrumbs?: boolean;
}

export default function PageHeader({
  title,
  subtitle,
  action,
  breadcrumbs,
  showBreadcrumbs = true
}: PageHeaderProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        backgroundColor: 'transparent',
        borderRadius: 0,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      {showBreadcrumbs && (
        <Breadcrumbs customPaths={breadcrumbs} />
      )}
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mt: showBreadcrumbs ? 1 : 0
      }}>
        <Box>
          <Typography variant="h5" component="h1" fontWeight="bold">
            {title}
          </Typography>
          
          {subtitle && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        
        {action && (
          <Box>
            {action}
          </Box>
        )}
      </Box>
    </Paper>
  );
}