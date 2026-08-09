'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { SimplePartyService } from '@/services/simplePartyService';
import { transactionService } from '@/services/transactionService';
import { LedgerIntegrationService } from '@/services/ledgerIntegrationService';
import { seedTestData } from '@/utils/seedTestData';

export default function LedgerIntegrationTest() {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    parties: any[];
    transactions: any[];
    invoices: any[];
    integrationResult?: any;
    seedResult?: any;
  }>({
    parties: [],
    transactions: [],
    invoices: []
  });

  const runDataCheck = async () => {
    setLoading(true);
    try {
      console.log('🔍 Checking existing data...');

      // Check parties
      const parties = await SimplePartyService.getParties();
      console.log(`Found ${parties.length} parties:`, parties);

      // Check transactions
      const transactions = await transactionService.getTransactions();
      console.log(`Found ${transactions.length} transactions:`, transactions);

      // Check invoices (we'll try to get them from the invoices collection)
      const { getDocs, collection } = await import('firebase/firestore');
      const { db } = await import('@/firebase/config');
      
      const invoicesSnapshot = await getDocs(collection(db, 'invoices'));
      const invoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log(`Found ${invoices.length} invoices:`, invoices);

      setTestResults({
        parties,
        transactions,
        invoices
      });

    } catch (error) {
      console.error('Error checking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runIntegration = async () => {
    setLoading(true);
    try {
      console.log('🚀 Starting integration test...');
      
      const integrationService = LedgerIntegrationService.getInstance();
      const result = await integrationService.integrateAllBusinessData();
      
      console.log('Integration result:', result);
      
      setTestResults(prev => ({
        ...prev,
        integrationResult: result
      }));

    } catch (error) {
      console.error('Error during integration:', error);
    } finally {
      setLoading(false);
    }
  };

  const runSeedData = async () => {
    setLoading(true);
    try {
      console.log('🌱 Seeding test data...');
      
      const result = await seedTestData();
      
      console.log('Seed result:', result);
      
      setTestResults(prev => ({
        ...prev,
        seedResult: result
      }));

      // Refresh data after seeding
      if (result.success) {
        await runDataCheck();
      }

    } catch (error) {
      console.error('Error seeding data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDataCheck();
  }, []);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Ledger Integration Test
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button 
          variant="outlined" 
          onClick={runDataCheck}
          disabled={loading}
        >
          Check Existing Data
        </Button>
        <Button 
          variant="outlined" 
          onClick={runSeedData}
          disabled={loading}
          color="secondary"
        >
          Seed Test Data
        </Button>
        <Button 
          variant="contained" 
          onClick={runIntegration}
          disabled={loading}
        >
          Run Integration
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Parties */}
        <Card sx={{ minWidth: 300, flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Parties ({testResults.parties.length})
            </Typography>
            <List dense>
              {testResults.parties.slice(0, 5).map((party, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={party.name}
                    secondary={`${party.businessType} - Balance: ₹${party.outstandingBalance || 0}`}
                  />
                </ListItem>
              ))}
              {testResults.parties.length > 5 && (
                <ListItem>
                  <ListItemText secondary={`... and ${testResults.parties.length - 5} more`} />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card sx={{ minWidth: 300, flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Transactions ({testResults.transactions.length})
            </Typography>
            <List dense>
              {testResults.transactions.slice(0, 5).map((transaction, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`₹${transaction.amount}`}
                    secondary={`${transaction.type} - ${transaction.description || transaction.category}`}
                  />
                </ListItem>
              ))}
              {testResults.transactions.length > 5 && (
                <ListItem>
                  <ListItemText secondary={`... and ${testResults.transactions.length - 5} more`} />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card sx={{ minWidth: 300, flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Invoices ({testResults.invoices.length})
            </Typography>
            <List dense>
              {testResults.invoices.slice(0, 5).map((invoice, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`₹${invoice.totalAmount || invoice.total || 0}`}
                    secondary={`${invoice.type || 'Unknown'} - ${invoice.invoiceNumber || invoice.id}`}
                  />
                </ListItem>
              ))}
              {testResults.invoices.length > 5 && (
                <ListItem>
                  <ListItemText secondary={`... and ${testResults.invoices.length - 5} more`} />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      </Box>

      {/* Seed Results */}
      {testResults.seedResult && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Seed Results
            </Typography>
            
            {testResults.seedResult.success ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                Test data seeded successfully!
              </Alert>
            ) : (
              <Alert severity="error" sx={{ mb: 2 }}>
                Failed to seed test data: {testResults.seedResult.error}
              </Alert>
            )}

            {testResults.seedResult.success && (
              <>
                <Typography variant="body2" gutterBottom>
                  <strong>Parties Created:</strong> {testResults.seedResult.partiesCreated}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Transactions Created:</strong> {testResults.seedResult.transactionsCreated}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Invoices Created:</strong> {testResults.seedResult.invoicesCreated}
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Integration Results */}
      {testResults.integrationResult && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Integration Results
            </Typography>
            
            {testResults.integrationResult.success ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                Integration completed successfully!
              </Alert>
            ) : (
              <Alert severity="error" sx={{ mb: 2 }}>
                Integration completed with errors.
              </Alert>
            )}

            <Typography variant="body2" gutterBottom>
              <strong>Accounts Created:</strong> {testResults.integrationResult.accountsCreated}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Transactions Created:</strong> {testResults.integrationResult.transactionsCreated}
            </Typography>

            {testResults.integrationResult.errors.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="error">
                  Errors:
                </Typography>
                <List dense>
                  {testResults.integrationResult.errors.map((error: string, index: number) => (
                    <ListItem key={index}>
                      <ListItemText primary={error} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {testResults.integrationResult.warnings.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="warning.main">
                  Warnings:
                </Typography>
                <List dense>
                  {testResults.integrationResult.warnings.map((warning: string, index: number) => (
                    <ListItem key={index}>
                      <ListItemText primary={warning} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}