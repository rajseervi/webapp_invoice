'use client';

import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Container,
  Typography
} from '@mui/material';
import LedgerIntegrationTest from '@/components/Ledger/LedgerIntegrationTest';
import LedgerManagement from '@/components/Ledger/LedgerManagement';

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
      id={`ledger-tabpanel-${index}`}
      aria-labelledby={`ledger-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function LedgerTestPage() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Ledger System Test & Management
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Integration Test" />
          <Tab label="Ledger Management" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <LedgerIntegrationTest />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <LedgerManagement />
      </TabPanel>
    </Container>
  );
}