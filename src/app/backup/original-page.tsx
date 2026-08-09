import React from 'react';
import { Container, Box } from '@mui/material';
import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';
import BackupRestoreManager from '@/components/backup/BackupRestoreManager';

export default function OriginalPageComponent() {
  return (
    <ImprovedDashboardLayout>
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <BackupRestoreManager />
        </Box>
      </Container>
    </ImprovedDashboardLayout>
  );
}