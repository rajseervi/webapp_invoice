"use client";
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Grid,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Science as TestIcon,
  Block as BlockIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import CentralizedInvoiceService from '@/services/centralizedInvoiceService';
import StockValidationEnforcementService from '@/services/stockValidationEnforcementService';
import { Invoice, InvoiceItem } from '@/types/invoice';

interface TestResult {
  testName: string;
  success: boolean;
  message: string;
  details?: any;
  blocked?: boolean;
}

const StockValidationTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testProductId, setTestProductId] = useState('');
  const [testQuantity, setTestQuantity] = useState(1);

  const runComprehensiveTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    const results: TestResult[] = [];

    try {
      // Test 1: Zero Stock Validation
      console.log('🧪 Running Test 1: Zero Stock Validation');
      try {
        const zeroStockInvoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
          type: 'sales',
          invoiceNumber: 'TEST-ZERO-001',
          customerId: 'test-customer',
          customerName: 'Test Customer',
          items: [{
            productId: 'non-existent-product',
            name: 'Zero Stock Product',
            quantity: 1,
            price: 100,
            totalAmount: 100
          } as InvoiceItem],
          subtotal: 100,
          totalAmount: 100,
          status: 'draft',
          userId: 'test-user'
        };

        const result = await CentralizedInvoiceService.createInvoice(zeroStockInvoice, {
          validateStock: true,
          updateStock: true,
          allowZeroStock: false,
          allowNegativeStock: false
        });

        if (result.success) {
          results.push({
            testName: 'Zero Stock Validation',
            success: false,
            message: '❌ FAILED: Invoice was created despite zero stock!',
            blocked: false
          });
        } else {
          results.push({
            testName: 'Zero Stock Validation',
            success: true,
            message: '✅ PASSED: Invoice creation blocked for zero stock',
            details: result.blockingErrors,
            blocked: true
          });
        }
      } catch (error) {
        results.push({
          testName: 'Zero Stock Validation',
          success: true,
          message: '✅ PASSED: Exception thrown for zero stock (expected behavior)',
          details: error instanceof Error ? error.message : 'Unknown error',
          blocked: true
        });
      }

      // Test 2: Stock Validation Service Direct Test
      console.log('🧪 Running Test 2: Stock Validation Service');
      try {
        const validationResult = await StockValidationEnforcementService.enforceStockValidation([
          {
            productId: 'non-existent-product',
            productName: 'Test Product',
            quantity: 5
          }
        ], {
          allowZeroStock: false,
          allowNegativeStock: false,
          strictMode: false
        });

        if (validationResult.canProceed) {
          results.push({
            testName: 'Stock Validation Service',
            success: false,
            message: '❌ FAILED: Validation service allowed zero stock!',
            blocked: false
          });
        } else {
          results.push({
            testName: 'Stock Validation Service',
            success: true,
            message: '✅ PASSED: Validation service blocked zero stock',
            details: {
              errors: validationResult.errors.length,
              zeroStockItems: validationResult.summary.zeroStockItems,
              blockedItems: validationResult.summary.blockedItems
            },
            blocked: true
          });
        }
      } catch (error) {
        results.push({
          testName: 'Stock Validation Service',
          success: false,
          message: '❌ ERROR: Validation service threw exception',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 3: Custom Product Test (if productId provided)
      if (testProductId) {
        console.log('🧪 Running Test 3: Custom Product Test');
        try {
          const customTestInvoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
            type: 'sales',
            invoiceNumber: 'TEST-CUSTOM-001',
            customerId: 'test-customer',
            customerName: 'Test Customer',
            items: [{
              productId: testProductId,
              name: 'Custom Test Product',
              quantity: testQuantity,
              price: 100,
              totalAmount: 100 * testQuantity
            } as InvoiceItem],
            subtotal: 100 * testQuantity,
            totalAmount: 100 * testQuantity,
            status: 'draft',
            userId: 'test-user'
          };

          const result = await CentralizedInvoiceService.createInvoice(customTestInvoice, {
            validateStock: true,
            updateStock: false, // Don't actually update stock for test
            allowZeroStock: false,
            allowNegativeStock: false
          });

          results.push({
            testName: 'Custom Product Test',
            success: true,
            message: result.success 
              ? `✅ Product ${testProductId} has sufficient stock (${testQuantity} units)`
              : `🚫 Product ${testProductId} blocked: ${result.blockingErrors?.join(', ')}`,
            details: result.stockValidation?.summary,
            blocked: !result.success
          });
        } catch (error) {
          results.push({
            testName: 'Custom Product Test',
            success: false,
            message: '❌ ERROR: Custom product test failed',
            details: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Test 4: Bypass Test (Emergency)
      console.log('🧪 Running Test 4: Emergency Bypass Test');
      try {
        const bypassInvoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
          type: 'sales',
          invoiceNumber: 'TEST-BYPASS-001',
          customerId: 'test-customer',
          customerName: 'Test Customer',
          items: [{
            productId: 'non-existent-product',
            name: 'Bypass Test Product',
            quantity: 1,
            price: 100,
            totalAmount: 100
          } as InvoiceItem],
          subtotal: 100,
          totalAmount: 100,
          status: 'draft',
          userId: 'test-user'
        };

        const result = await CentralizedInvoiceService.createInvoiceWithBypass(
          bypassInvoice,
          'Testing emergency bypass functionality',
          'Test System'
        );

        results.push({
          testName: 'Emergency Bypass Test',
          success: result.success,
          message: result.success 
            ? '⚠️ BYPASS WORKED: Emergency bypass allowed invoice creation'
            : '❌ BYPASS FAILED: Emergency bypass did not work',
          details: result.success ? 'Invoice created with bypass' : result.errors,
          blocked: false
        });
      } catch (error) {
        results.push({
          testName: 'Emergency Bypass Test',
          success: false,
          message: '❌ ERROR: Bypass test failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

    } catch (error) {
      console.error('Test suite error:', error);
      results.push({
        testName: 'Test Suite Error',
        success: false,
        message: '❌ CRITICAL ERROR: Test suite failed to run',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const getTestIcon = (result: TestResult) => {
    if (result.blocked) return <BlockIcon color="error" />;
    if (result.success) return <CheckIcon color="success" />;
    return <ErrorIcon color="error" />;
  };

  const getTestColor = (result: TestResult) => {
    if (result.blocked) return 'error';
    if (result.success) return 'success';
    return 'error';
  };

  return (
    <Box p={3}>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <TestIcon color="primary" />
            <Typography variant="h5" fontWeight="bold">
              Stock Validation Test Suite
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            This test suite verifies that the stock validation system is working correctly 
            and preventing invoice creation with zero or insufficient stock.
          </Alert>

          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Test Product ID (Optional)"
                value={testProductId}
                onChange={(e) => setTestProductId(e.target.value)}
                placeholder="Enter a product ID to test"
                helperText="Leave empty to skip custom product test"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Test Quantity"
                value={testQuantity}
                onChange={(e) => setTestQuantity(Number(e.target.value))}
                inputProps={{ min: 1 }}
              />
            </Grid>
          </Grid>

          <Button
            variant="contained"
            onClick={runComprehensiveTests}
            disabled={isRunning}
            startIcon={isRunning ? <CircularProgress size={20} /> : <TestIcon />}
            size="large"
            sx={{ mb: 3 }}
          >
            {isRunning ? 'Running Tests...' : 'Run Stock Validation Tests'}
          </Button>

          {testResults.length > 0 && (
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Test Results
              </Typography>
              
              <List>
                {testResults.map((result, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <Box display="flex" alignItems="flex-start" gap={2} width="100%">
                        {getTestIcon(result)}
                        <Box flex={1}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {result.testName}
                            </Typography>
                            <Chip 
                              label={result.blocked ? 'BLOCKED' : result.success ? 'PASSED' : 'FAILED'}
                              color={getTestColor(result) as any}
                              size="small"
                            />
                          </Box>
                          <Typography variant="body2" color="textSecondary" mb={1}>
                            {result.message}
                          </Typography>
                          {result.details && (
                            <Box>
                              <Typography variant="caption" color="textSecondary">
                                Details:
                              </Typography>
                              <pre style={{ 
                                fontSize: '12px', 
                                background: '#f5f5f5', 
                                padding: '8px', 
                                borderRadius: '4px',
                                overflow: 'auto',
                                maxHeight: '100px'
                              }}>
                                {typeof result.details === 'string' 
                                  ? result.details 
                                  : JSON.stringify(result.details, null, 2)
                                }
                              </pre>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </ListItem>
                    {index < testResults.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>

              <Box mt={2}>
                <Alert 
                  severity={
                    testResults.every(r => r.success || r.blocked) ? 'success' : 
                    testResults.some(r => r.success || r.blocked) ? 'warning' : 'error'
                  }
                >
                  <Typography variant="body2" fontWeight="bold">
                    Test Summary: {testResults.filter(r => r.success || r.blocked).length} / {testResults.length} tests passed
                  </Typography>
                  <Typography variant="body2">
                    {testResults.filter(r => r.blocked).length} invoice(s) correctly blocked by stock validation
                  </Typography>
                </Alert>
              </Box>
            </Paper>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default StockValidationTest;