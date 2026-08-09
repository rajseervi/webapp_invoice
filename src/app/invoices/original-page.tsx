import React from 'react';
import { Typography, Box } from '@mui/material';

export default function OriginalPageComponent() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Page Content
      </Typography>
      <Typography variant="body1" color="text.secondary">
        This page is being migrated to the modern layout.
        Original content will be restored soon.
      </Typography>
    </Box>
  );
}