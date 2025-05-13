"use client"
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Card,
  CardContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Download as DownloadIcon,
  Print as PrintIcon,
  FilterList as FilterListIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';

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
      id={`statement-tabpanel-${index}`}
      aria-labelledby={`statement-tab-${index}`}
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

export default function FinancialStatementsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('current-month');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Mock data for financial statements
  const balanceSheetData = {
    assets: [
      { name: 'Current Assets', amount: 0, isHeader: true },
      { name: 'Cash and Cash Equivalents', amount: 250000 },
      { name: 'Accounts Receivable', amount: 175000 },
      { name: 'Inventory', amount: 320000 },
      { name: 'Prepaid Expenses', amount: 45000 },
      { name: 'Total Current Assets', amount: 790000, isTotal: true },
      
      { name: 'Non-Current Assets', amount: 0, isHeader: true },
      { name: 'Property, Plant and Equipment', amount: 1200000 },
      { name: 'Less: Accumulated Depreciation', amount: -350000 },
      { name: 'Intangible Assets', amount: 180000 },
      { name: 'Long-term Investments', amount: 300000 },
      { name: 'Total Non-Current Assets', amount: 1330000, isTotal: true },
      
      { name: 'Total Assets', amount: 2120000, isGrandTotal: true }
    ],
    liabilities: [
      { name: 'Current Liabilities', amount: 0, isHeader: true },
      { name: 'Accounts Payable', amount: 120000 },
      { name: 'Short-term Loans', amount: 80000 },
      { name: 'Accrued Expenses', amount: 35000 },
      { name: 'Taxes Payable', amount: 45000 },
      { name: 'Total Current Liabilities', amount: 280000, isTotal: true },
      
      { name: 'Non-Current Liabilities', amount: 0, isHeader: true },
      { name: 'Long-term Loans', amount: 500000 },
      { name: 'Deferred Tax Liabilities', amount: 75000 },
      { name: 'Total Non-Current Liabilities', amount: 575000, isTotal: true },
      
      { name: 'Total Liabilities', amount: 855000, isGrandTotal: true }
    ],
    equity: [
      { name: "Owner's Equity", amount: 0, isHeader: true },
      { name: 'Capital', amount: 1000000 },
      { name: 'Retained Earnings', amount: 265000 },
      { name: 'Total Equity', amount: 1265000, isGrandTotal: true },
      
      { name: 'Total Liabilities and Equity', amount: 2120000, isGrandTotal: true }
    ]
  };

  const incomeStatementData = {
    revenue: [
      { name: 'Revenue', amount: 0, isHeader: true },
      { name: 'Sales Revenue', amount: 1500000 },
      { name: 'Service Revenue', amount: 350000 },
      { name: 'Other Revenue', amount: 50000 },
      { name: 'Total Revenue', amount: 1900000, isTotal: true }
    ],
    expenses: [
      { name: 'Expenses', amount: 0, isHeader: true },
      { name: 'Cost of Goods Sold', amount: 850000 },
      { name: 'Salaries and Wages', amount: 350000 },
      { name: 'Rent Expense', amount: 120000 },
      { name: 'Utilities Expense', amount: 45000 },
      { name: 'Depreciation Expense', amount: 75000 },
      { name: 'Marketing and Advertising', amount: 65000 },
      { name: 'Office Supplies', amount: 25000 },
      { name: 'Insurance', amount: 35000 },
      { name: 'Other Expenses', amount: 30000 },
      { name: 'Total Expenses', amount: 1595000, isTotal: true }
    ],
    netIncome: [
      { name: 'Net Income Before Tax', amount: 305000, isTotal: true },
      { name: 'Income Tax (20%)', amount: 61000 },
      { name: 'Net Income', amount: 244000, isGrandTotal: true }
    ]
  };

  const cashFlowData = {
    operating: [
      { name: 'Cash Flow from Operating Activities', amount: 0, isHeader: true },
      { name: 'Net Income', amount: 244000 },
      { name: 'Adjustments for Non-cash Items:', amount: 0, isSubHeader: true },
      { name: 'Depreciation', amount: 75000 },
      { name: 'Changes in Working Capital:', amount: 0, isSubHeader: true },
      { name: 'Increase in Accounts Receivable', amount: -45000 },
      { name: 'Decrease in Inventory', amount: 30000 },
      { name: 'Increase in Accounts Payable', amount: 25000 },
      { name: 'Net Cash from Operating Activities', amount: 329000, isTotal: true }
    ],
    investing: [
      { name: 'Cash Flow from Investing Activities', amount: 0, isHeader: true },
      { name: 'Purchase of Equipment', amount: -150000 },
      { name: 'Sale of Investments', amount: 50000 },
      { name: 'Net Cash used in Investing Activities', amount: -100000, isTotal: true }
    ],
    financing: [
      { name: 'Cash Flow from Financing Activities', amount: 0, isHeader: true },
      { name: 'Repayment of Loans', amount: -80000 },
      { name: 'Dividends Paid', amount: -50000 },
      { name: 'Net Cash used in Financing Activities', amount: -130000, isTotal: true }
    ],
    summary: [
      { name: 'Net Increase in Cash', amount: 99000, isTotal: true },
      { name: 'Cash at Beginning of Period', amount: 151000 },
      { name: 'Cash at End of Period', amount: 250000, isGrandTotal: true }
    ]
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePeriodChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setPeriod(event.target.value as string);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert('Download functionality will be implemented here');
  };

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Financial Statements</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{ mr: 1 }}
            >
              Print
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
            >
              Download
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Period</InputLabel>
                <Select
                  value={period}
                  label="Period"
                  onChange={handlePeriodChange}
                >
                  <MenuItem value="current-month">Current Month</MenuItem>
                  <MenuItem value="last-month">Last Month</MenuItem>
                  <MenuItem value="current-quarter">Current Quarter</MenuItem>
                  <MenuItem value="last-quarter">Last Quarter</MenuItem>
                  <MenuItem value="current-year">Current Financial Year</MenuItem>
                  <MenuItem value="last-year">Last Financial Year</MenuItem>
                  <MenuItem value="custom">Custom Date Range</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {period === 'custom' && (
              <>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    size="small"
                    value={customDateRange.startDate}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, startDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    size="small"
                    value={customDateRange.endDate}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, endDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Paper>

        <Paper sx={{ width: '100%' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Balance Sheet" />
            <Tab label="Income Statement" />
            <Tab label="Cash Flow Statement" />
            <Tab label="Party-wise Bills" onClick={() => window.location.href = '/accounting/statements/party-bills'} />
          </Tabs>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Balance Sheet */}
              <TabPanel value={tabValue} index={0}>
                <Typography variant="h5" gutterBottom align="center">
                  Balance Sheet
                </Typography>
                <Typography variant="subtitle1" gutterBottom align="center" color="text.secondary">
                  As of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </Typography>
                
                <Grid container spacing={3} sx={{ mt: 2 }}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Assets
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableBody>
                          {balanceSheetData.assets.map((item, index) => (
                            <TableRow 
                              key={index}
                              sx={{ 
                                backgroundColor: item.isHeader ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                                '& td': { 
                                  fontWeight: item.isHeader || item.isTotal || item.isGrandTotal ? 'bold' : 'normal',
                                  borderTop: item.isTotal ? '1px solid rgba(224, 224, 224, 1)' : 'none',
                                  borderBottom: item.isGrandTotal ? '2px solid rgba(0, 0, 0, 0.2)' : '1px solid rgba(224, 224, 224, 1)'
                                }
                              }}
                            >
                              <TableCell 
                                sx={{ 
                                  pl: item.isSubHeader ? 4 : item.isHeader ? 2 : 3,
                                }}
                              >
                                {item.name}
                              </TableCell>
                              <TableCell align="right">
                                {item.isHeader || item.isSubHeader ? '' : 
                                  `₹${item.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Liabilities and Equity
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableBody>
                          {balanceSheetData.liabilities.map((item, index) => (
                            <TableRow 
                              key={index}
                              sx={{ 
                                backgroundColor: item.isHeader ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                                '& td': { 
                                  fontWeight: item.isHeader || item.isTotal || item.isGrandTotal ? 'bold' : 'normal',
                                  borderTop: item.isTotal ? '1px solid rgba(224, 224, 224, 1)' : 'none',
                                  borderBottom: item.isGrandTotal ? '2px solid rgba(0, 0, 0, 0.2)' : '1px solid rgba(224, 224, 224, 1)'
                                }
                              }}
                            >
                              <TableCell 
                                sx={{ 
                                  pl: item.isSubHeader ? 4 : item.isHeader ? 2 : 3,
                                }}
                              >
                                {item.name}
                              </TableCell>
                              <TableCell align="right">
                                {item.isHeader || item.isSubHeader ? '' : 
                                  `₹${item.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                              </TableCell>
                            </TableRow>
                          ))}
                          
                          <TableRow><TableCell colSpan={2}>&nbsp;</TableCell></TableRow>
                          
                          {balanceSheetData.equity.map((item, index) => (
                            <TableRow 
                              key={`equity-${index}`}
                              sx={{ 
                                backgroundColor: item.isHeader ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                                '& td': { 
                                  fontWeight: item.isHeader || item.isTotal || item.isGrandTotal ? 'bold' : 'normal',
                                  borderTop: item.isTotal ? '1px solid rgba(224, 224, 224, 1)' : 'none',
                                  borderBottom: item.isGrandTotal ? '2px solid rgba(0, 0, 0, 0.2)' : '1px solid rgba(224, 224, 224, 1)'
                                }
                              }}
                            >
                              <TableCell 
                                sx={{ 
                                  pl: item.isSubHeader ? 4 : item.isHeader ? 2 : 3,
                                }}
                              >
                                {item.name}
                              </TableCell>
                              <TableCell align="right">
                                {item.isHeader || item.isSubHeader ? '' : 
                                  `₹${item.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              </TabPanel>
              
              {/* Income Statement */}
              <TabPanel value={tabValue} index={1}>
                <Typography variant="h5" gutterBottom align="center">
                  Income Statement
                </Typography>
                <Typography variant="subtitle1" gutterBottom align="center" color="text.secondary">
                  For the period ending {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </Typography>
                
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                  <Table>
                    <TableBody>
                      {/* Revenue Section */}
                      {incomeStatementData.revenue.map((item, index) => (
                        <TableRow 
                          key={`revenue-${index}`}
                          sx={{ 
                            backgroundColor: item.isHeader ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                            '& td': { 
                              fontWeight: item.isHeader || item.isTotal || item.isGrandTotal ? 'bold' : 'normal',
                              borderTop: item.isTotal ? '1px solid rgba(224, 224, 224, 1)' : 'none',
                              borderBottom: item.isGrandTotal ? '2px solid rgba(0, 0, 0, 0.2)' : '1px solid rgba(224, 224, 224, 1)'
                            }
                          }}
                        >
                          <TableCell 
                            sx={{ 
                              pl: item.isSubHeader ? 4 : item.isHeader ? 2 : 3,
                              width: '70%'
                            }}
                          >
                            {item.name}
                          </TableCell>
                          <TableCell align="right">
                            {item.isHeader || item.isSubHeader ? '' : 
                              `₹${item.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      <TableRow><TableCell colSpan={2}>&nbsp;</TableCell></TableRow>
                      
                      {/* Expenses Section */}
                      {incomeStatementData.expenses.map((item, index) => (
                        <TableRow 
                          key={`expenses-${index}`}
                          sx={{ 
                            backgroundColor: item.isHeader ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                            '& td': { 
                              fontWeight: item.isHeader || item.isTotal || item.isGrandTotal ? 'bold' : 'normal',
                              borderTop: item.isTotal ? '1px solid rgba(224, 224, 224, 1)' : 'none',
                              borderBottom: item.isGrandTotal ? '2px solid rgba(0, 0, 0, 0.2)' : '1px solid rgba(224, 224, 224, 1)'
                            }
                          }}
                        >
                          <TableCell 
                            sx={{ 
                              pl: item.isSubHeader ? 4 : item.isHeader ? 2 : 3,
                            }}
                          >
                            {item.name}
                          </TableCell>
                          <TableCell align="right">
                            {item.isHeader || item.isSubHeader ? '' : 
                              `₹${item.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      <TableRow><TableCell colSpan={2}>&nbsp;</TableCell></TableRow>
                      
                      {/* Net Income Section */}
                      {incomeStatementData.netIncome.map((item, index) => (
                        <TableRow 
                          key={`netIncome-${index}`}
                          sx={{ 
                            backgroundColor: item.isGrandTotal ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                            '& td': { 
                              fontWeight: item.isTotal || item.isGrandTotal ? 'bold' : 'normal',
                              borderTop: item.isTotal ? '1px solid rgba(224, 224, 224, 1)' : 'none',
                              borderBottom: item.isGrandTotal ? '2px solid rgba(0, 0, 0, 0.2)' : '1px solid rgba(224, 224, 224, 1)'
                            }
                          }}
                        >
                          <TableCell>
                            {item.name}
                          </TableCell>
                          <TableCell align="right">
                            {`₹${item.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
              
              {/* Cash Flow Statement */}
              <TabPanel value={tabValue} index={2}>
                <Typography variant="h5" gutterBottom align="center">
                  Cash Flow Statement
                </Typography>
                <Typography variant="subtitle1" gutterBottom align="center" color="text.secondary">
                  For the period ending {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </Typography>
                
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                  <Table>
                    <TableBody>
                      {/* Operating Activities */}
                      {cashFlowData.operating.map((item, index) => (
                        <TableRow 
                          key={`operating-${index}`}
                          sx={{ 
                            backgroundColor: item.isHeader ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                            '& td': { 
                              fontWeight: item.isHeader || item.isTotal || item.isGrandTotal ? 'bold' : 'normal',
                              fontStyle: item.isSubHeader ? 'italic' : 'normal',
                              borderTop: item.isTotal ? '1px solid rgba(224, 224, 224, 1)' : 'none',
                              borderBottom: item.isGrandTotal ? '2px solid rgba(0, 0, 0, 0.2)' : '1px solid rgba(224, 224, 224, 1)'
                            }
                          }}
                        >
                          <TableCell 
                            sx={{ 
                              pl: item.isSubHeader ? 4 : item.isHeader ? 2 : 3,
                              width: '70%'
                            }}
                          >
                            {item.name}
                          </TableCell>
                          <TableCell align="right">
                            {item.isHeader || item.isSubHeader ? '' : 
                              `₹${item.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      <TableRow><TableCell colSpan={2}>&nbsp;</TableCell></TableRow>
                      
                      {/* Investing Activities */}
                      {cashFlowData.investing.map((item, index) => (
                        <TableRow 
                          key={`investing-${index}`}
                          sx={{ 
                            backgroundColor: item.isHeader ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                            '& td': { 
                              fontWeight: item.isHeader || item.isTotal || item.isGrandTotal ? 'bold' : 'normal',
                              fontStyle: item.isSubHeader ? 'italic' : 'normal',
                              borderTop: item.isTotal ? '1px solid rgba(224, 224, 224, 1)' : 'none',
                              borderBottom: item.isGrandTotal ? '2px solid rgba(0, 0, 0, 0.2)' : '1px solid rgba(224, 224, 224, 1)'
                            }
                          }}
                        >
                          <TableCell 
                            sx={{ 
                              pl: item.isSubHeader ? 4 : item.isHeader ? 2 : 3,
                            }}
                          >
                            {item.name}
                          </TableCell>
                          <TableCell align="right">
                            {item.isHeader || item.isSubHeader ? '' : 
                              `₹${item.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      <TableRow><TableCell colSpan={2}>&nbsp;</TableCell></TableRow>
                      
                      {/* Financing Activities */}
                      {cashFlowData.financing.map((item, index) => (
                        <TableRow 
                          key={`financing-${index}`}
                          sx={{ 
                            backgroundColor: item.isHeader ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                            '& td': { 
                              fontWeight: item.isHeader || item.isTotal || item.isGrandTotal ? 'bold' : 'normal',
                              fontStyle: item.isSubHeader ? 'italic' : 'normal',
                              borderTop: item.isTotal ? '1px solid rgba(224, 224, 224, 1)' : 'none',
                              borderBottom: item.isGrandTotal ? '2px solid rgba(0, 0, 0, 0.2)' : '1px solid rgba(224, 224, 224, 1)'
                            }
                          }}
                        >
                          <TableCell 
                            sx={{ 
                              pl: item.isSubHeader ? 4 : item.isHeader ? 2 : 3,
                            }}
                          >
                            {item.name}
                          </TableCell>
                          <TableCell align="right">
                            {item.isHeader || item.isSubHeader ? '' : 
                              `₹${item.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      <TableRow><TableCell colSpan={2}>&nbsp;</TableCell></TableRow>
                      
                      {/* Summary */}
                      {cashFlowData.summary.map((item, index) => (
                        <TableRow 
                          key={`summary-${index}`}
                          sx={{ 
                            backgroundColor: item.isGrandTotal ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                            '& td': { 
                              fontWeight: item.isTotal || item.isGrandTotal ? 'bold' : 'normal',
                              borderTop: item.isTotal ? '1px solid rgba(224, 224, 224, 1)' : 'none',
                              borderBottom: item.isGrandTotal ? '2px solid rgba(0, 0, 0, 0.2)' : '1px solid rgba(224, 224, 224, 1)'
                            }
                          }}
                        >
                          <TableCell>
                            {item.name}
                          </TableCell>
                          <TableCell align="right">
                            {`₹${item.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
            </>
          )}
        </Paper>
      </Container>
    </DashboardLayout>
  );
}