'use client';

import React, { ReactNode } from 'react';
import { Box } from '@mui/material';

interface NoLayoutProps {
  children: ReactNode;
}

/**
 * A simple wrapper component for pages that should not have any dashboard layout
 * Use this for login, register, landing pages, etc.
 */
export const NoLayout: React.FC<NoLayoutProps> = ({ children }) => {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {children}
    </Box>
  );
};

export default NoLayout;