"use client"
import React, { useState, useEffect } from 'react';
import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';


import {
  Box,
  Container,
  Tab,
  Tabs,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  useTheme
} from '@mui/material';
import { 
  Add as AddIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  MoreVert as MoreVertIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import PartyFinder from '@/components/Ledger/PartyFinder';
import PartyLedger from '@/components/Ledger/PartyLedger';
import TransactionForm from '@/components/Ledger/TransactionForm';
import { Party } from '@/types/party';
import { PartyBalance, Transaction } from '@/types/transaction';
import { partyService } from '@/services/partyService';
import { transactionService } from '@/services/transactionService';

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
      id={`accounting-tabpanel-${index}`}
      aria-labelledby={`accounting-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ 
          py: { xs: 3, md: 4 }, 
          px: { xs: 2, md: 3 },
          minHeight: '400px'
        }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function OriginalPageComponent() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [openTransactionForm, setOpenTransactionForm] = useState(false);
  const [financialSummary, setFinancialSummary] = useState<{
    totalReceivable: number;
    totalPayable: number;
    netBalance: number;
    recentTransactions: Transaction[];
    topDebtors: PartyBalance[];
    topCreditors: PartyBalance[];
  }>({
    totalReceivable: 0,
    totalPayable: 0,
    netBalance: 0,
    recentTransactions: [],
    topDebtors: [],
    topCreditors: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching accounting data...');
      
      // Fetch parties
      const partiesData = await partyService.getAllParties();
      if (!partiesData || partiesData.length === 0) {
        console.log('No parties found');
        setParties([]);
        setError('No parties found. Please add parties first.');
        setLoading(false);
        return;
      }
      
      console.log(`Loaded ${partiesData.length} parties`);
      setParties(partiesData);
      
      // Fetch financial summary data
      const balances = await transactionService.getPartyBalances();
      console.log(`Loaded balances for ${balances.length} parties`);
      
      // Calculate summary statistics
      const totalReceivable = balances.reduce((sum, balance) => 
        sum + (balance.balance > 0 ? balance.balance : 0), 0);
      
      const totalPayable = balances.reduce((sum, balance) => 
        sum + (balance.balance < 0 ? Math.abs(balance.balance) : 0), 0);
      
      const netBalance = totalReceivable - totalPayable;
      
      // Get top debtors (parties who owe us the most)
      const topDebtors = [...balances]
        .filter(b => b.balance > 0)
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 5);
      
      // Get top creditors (parties we owe the most to)
      const topCreditors = [...balances]
        .filter(b => b.balance < 0)
        .sort((a, b) => a.balance - b.balance)
        .slice(0, 5);
      
      console.log(`Summary: Receivable=${totalReceivable}, Payable=${totalPayable}, Net=${netBalance}`);
      console.log(`Top debtors: ${topDebtors.length}, Top creditors: ${topCreditors.length}`);
      
      setFinancialSummary({
        totalReceivable,
        totalPayable,
        netBalance,
        recentTransactions: [], // We'll fetch these separately if needed
        topDebtors,
        topCreditors
      });
      
      setError(null);
    } catch (err) {
      console.error('Error fetching accounting data:', err);
      setError('Failed to load accounting data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Reset selected party when switching away from ledger tab
    if (newValue !== 2) {
      setSelectedParty(null);
    }
  };

  const handleSelectParty = (partyId: string, party: Party) => {
    setSelectedParty(party);
    setTabValue(2); // Switch to ledger tab add
  };

  const handleAddTransaction = () => {
    setOpenTransactionForm(true);
  };
  
  const handleTransactionSaved = () => {
    setOpenTransactionForm(false);
    // Refresh data
    fetchData();
  };

  return (
    <ImprovedDashboardLayout>
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: { xs: 3, md: 4 },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 }
        }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Accounting</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddTransaction}
            size="large"
            sx={{ 
              borderRadius: 2,
              px: 3,
              py: 1.5,
              minWidth: { xs: '100%', sm: 'auto' }
            }}
          >
            Add Transaction
          </Button>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: { xs: 3, md: 4 }, borderRadius: 2 }}
            action={
              <Button 
                color="inherit" 
                size="small"
                onClick={fetchData}
              >
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        <Paper sx={{ 
          width: '100%', 
          mb: { xs: 3, md: 4 },
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: theme.shadows[3]
        }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              px: { xs: 1, md: 2 },
              '& .MuiTab-root': {
                minHeight: 64,
                fontSize: '0.95rem',
                fontWeight: 500,
                textTransform: 'none',
                px: { xs: 2, md: 3 }
              }
            }}
          >
            <Tab 
              label="Dashboard" 
              icon={<AccountBalanceIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Party Finder" 
              icon={<PeopleIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Party Ledger" 
              icon={<ReceiptIcon />} 
              iconPosition="start"
              disabled={!selectedParty} 
            />
            <Tab 
              label="Financial Reports" 
              icon={<TrendingUpIcon />} 
              iconPosition="start"
            />
          </Tabs>

          {/* Dashboard Tab */}
          <TabPanel value={tabValue} index={0}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {/* Financial Summary Cards */}
                <Grid container spacing={{ xs: 2, md: 3, lg: 4 }} sx={{ mb: { xs: 4, md: 6 } }}>
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Card 
                      elevation={2}
                      sx={{ 
                        height: '100%',
                        borderLeft: `4px solid ${theme.palette.error.main}`,
                        borderRadius: 3,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: theme.shadows[8]
                        }
                      }}
                    >
                      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Total Receivable
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.error.main }}>
                              ₹{financialSummary.totalReceivable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Amount customers owe you
                            </Typography>
                          </Box>
                          <Box sx={{ 
                            p: 1, 
                            borderRadius: '50%', 
                            bgcolor: theme.palette.error.light,
                            color: theme.palette.error.main
                          }}>
                            <ArrowUpwardIcon />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Card 
                      elevation={2}
                      sx={{ 
                        height: '100%',
                        borderLeft: `4px solid ${theme.palette.success.main}`,
                        borderRadius: 3,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: theme.shadows[8]
                        }
                      }}
                    >
                      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Total Payable
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                              ₹{financialSummary.totalPayable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Amount you owe to suppliers
                            </Typography>
                          </Box>
                          <Box sx={{ 
                            p: 1, 
                            borderRadius: '50%', 
                            bgcolor: theme.palette.success.light,
                            color: theme.palette.success.main
                          }}>
                            <ArrowDownwardIcon />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 12, lg: 4 }}>
                    <Card 
                      elevation={2}
                      sx={{ 
                        height: '100%',
                        borderLeft: `4px solid ${financialSummary.netBalance > 0 
                          ? theme.palette.info.main 
                          : theme.palette.warning.main}`,
                        borderRadius: 3,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: theme.shadows[8]
                        }
                      }}
                    >
                      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Net Balance
                            </Typography>
                            <Typography 
                              variant="h4" 
                              sx={{ 
                                fontWeight: 600, 
                                color: financialSummary.netBalance > 0 
                                  ? theme.palette.info.main 
                                  : theme.palette.warning.main
                              }}
                            >
                              ₹{Math.abs(financialSummary.netBalance).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {financialSummary.netBalance > 0 
                                ? 'Net receivable amount' 
                                : 'Net payable amount'}
                            </Typography>
                          </Box>
                          <Box sx={{ 
                            p: 1, 
                            borderRadius: '50%', 
                            bgcolor: financialSummary.netBalance > 0 
                              ? theme.palette.info.light 
                              : theme.palette.warning.light,
                            color: financialSummary.netBalance > 0 
                              ? theme.palette.info.main 
                              : theme.palette.warning.main
                          }}>
                            {financialSummary.netBalance > 0 
                              ? <ArrowUpwardIcon /> 
                              : <ArrowDownwardIcon />}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                {/* Top Debtors and Creditors */}
                <Grid container spacing={{ xs: 2, md: 3, lg: 4 }} sx={{ mt: { xs: 2, md: 4 } }}>
                  <Grid size={{ xs: 12, lg: 6 }}>
                    <Card 
                      elevation={2}
                      sx={{ 
                        borderRadius: 3,
                        height: '100%',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          boxShadow: theme.shadows[6]
                        }
                      }}
                    >
                      <CardHeader 
                        title="Top Debtors" 
                        subheader="Parties who owe you the most"
                        action={
                          <IconButton onClick={() => setTabValue(1)}>
                            <MoreVertIcon />
                          </IconButton>
                        }
                        sx={{ 
                          '& .MuiCardHeader-title': { 
                            fontSize: '1.1rem',
                            fontWeight: 600
                          }
                        }}
                      />
                      <Divider />
                      <CardContent sx={{ p: 0 }}>
                        {financialSummary.topDebtors.length > 0 ? (
                          <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                            {financialSummary.topDebtors.map((debtor, index) => (
                              <Box 
                                component="li" 
                                key={debtor.partyId}
                                sx={{ 
                                  p: 2, 
                                  display: 'flex', 
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  borderBottom: index < financialSummary.topDebtors.length - 1 
                                    ? `1px solid ${theme.palette.divider}` 
                                    : 'none',
                                  '&:hover': {
                                    bgcolor: theme.palette.action.hover,
                                    cursor: 'pointer'
                                  }
                                }}
                                onClick={() => {
                                  const party = parties.find(p => p.id === debtor.partyId);
                                  if (party) handleSelectParty(party.id!, party);
                                }}
                              >
                                <Box>
                                  <Typography variant="body1" fontWeight={500}>
                                    {debtor.partyName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {debtor.lastTransactionDate 
                                      ? `Last transaction: ${new Date(debtor.lastTransactionDate).toLocaleDateString()}` 
                                      : 'No recent transactions'}
                                  </Typography>
                                </Box>
                                <Typography 
                                  variant="body1" 
                                  fontWeight={600}
                                  color="error.main"
                                >
                                  ₹{debtor.balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography color="text.secondary">No debtors found</Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid size={{ xs: 12, lg: 6 }}>
                    <Card 
                      elevation={2}
                      sx={{ 
                        borderRadius: 3,
                        height: '100%',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          boxShadow: theme.shadows[6]
                        }
                      }}
                    >
                      <CardHeader 
                        title="Top Creditors" 
                        subheader="Parties you owe the most to"
                        action={
                          <IconButton onClick={() => setTabValue(1)}>
                            <MoreVertIcon />
                          </IconButton>
                        }
                        sx={{ 
                          '& .MuiCardHeader-title': { 
                            fontSize: '1.1rem',
                            fontWeight: 600
                          }
                        }}
                      />
                      <Divider />
                      <CardContent sx={{ p: 0 }}>
                        {financialSummary.topCreditors.length > 0 ? (
                          <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                            {financialSummary.topCreditors.map((creditor, index) => (
                              <Box 
                                component="li" 
                                key={creditor.partyId}
                                sx={{ 
                                  p: 2, 
                                  display: 'flex', 
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  borderBottom: index < financialSummary.topCreditors.length - 1 
                                    ? `1px solid ${theme.palette.divider}` 
                                    : 'none',
                                  '&:hover': {
                                    bgcolor: theme.palette.action.hover,
                                    cursor: 'pointer'
                                  }
                                }}
                                onClick={() => {
                                  const party = parties.find(p => p.id === creditor.partyId);
                                  if (party) handleSelectParty(party.id!, party);
                                }}
                              >
                                <Box>
                                  <Typography variant="body1" fontWeight={500}>
                                    {creditor.partyName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {creditor.lastTransactionDate 
                                      ? `Last transaction: ${new Date(creditor.lastTransactionDate).toLocaleDateString()}` 
                                      : 'No recent transactions'}
                                  </Typography>
                                </Box>
                                <Typography 
                                  variant="body1" 
                                  fontWeight={600}
                                  color="success.main"
                                >
                                  ₹{Math.abs(creditor.balance).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography color="text.secondary">No creditors found</Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </>
            )}
          </TabPanel>

          {/* Party Finder Tab */}
          <TabPanel value={tabValue} index={1}>
            <PartyFinder onSelectParty={handleSelectParty} />
          </TabPanel>

          {/* Party Ledger Tab */}
          <TabPanel value={tabValue} index={2}>
            {selectedParty ? (
              <PartyLedger partyId={selectedParty.id!} party={selectedParty} />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <Typography>Please select a party to view their ledger</Typography>
              </Box>
            )}
          </TabPanel>
          
          {/* Financial Reports Tab */}
          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={{ xs: 2, md: 3, lg: 4 }}>
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Card 
                      elevation={3}
                      sx={{ 
                        height: '100%',
                        borderRadius: 3,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: theme.shadows[12]
                        },
                        cursor: 'pointer'
                      }}
                      onClick={() => window.location.href = '/accounting/statements'}
                >
                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.5, md: 2 } }}>
                      <TrendingUpIcon color="primary" sx={{ fontSize: { xs: 28, md: 32 }, mr: 2 }} />
                      <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                        Financial Statements
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      View balance sheet, income statement, and cash flow statement to understand your financial position.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Card 
                      elevation={3}
                      sx={{ 
                        height: '100%',
                        borderRadius: 3,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: theme.shadows[12]
                        },
                        cursor: 'pointer'
                      }}
                      onClick={() => window.location.href = '/accounting/statements/party-bills'}
                >
                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.5, md: 2 } }}>
                      <PeopleIcon color="secondary" sx={{ fontSize: { xs: 28, md: 32 }, mr: 2 }} />
                      <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                        Party-wise Bill Statements
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      View detailed bill statements organized by party, including outstanding balances and transaction history.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Card 
                      elevation={3}
                      sx={{ 
                        height: '100%',
                        borderRadius: 3,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: theme.shadows[12]
                        },
                        cursor: 'pointer'
                      }}
                      onClick={() => window.location.href = '/accounting/transactions'}
                >
                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.5, md: 2 } }}>
                      <ReceiptIcon color="info" sx={{ fontSize: { xs: 28, md: 32 }, mr: 2 }} />
                      <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                        Transaction History
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      View and manage all financial transactions, including credits and debits across all parties.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>
      </Container>

      {/* Global Transaction Form */}
      {openTransactionForm && (
        <TransactionForm
          open={openTransactionForm}
          onClose={() => setOpenTransactionForm(false)}
          onSave={handleTransactionSaved}
          parties={parties}
          initialData={selectedParty ? {
            partyId: selectedParty.id!,
            userId: '',
            amount: 0,
            type: 'debit',
            description: '',
            reference: '',
            date: new Date().toISOString().split('T')[0]
          } : undefined}
        />
      )}
    </ImprovedDashboardLayout>
  );
}
