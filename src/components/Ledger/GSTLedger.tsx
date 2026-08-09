"use client";
import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  IconButton,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  GetApp as ExportIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { ledgerService, GSTLedgerEntry, LedgerAccount } from '@/services/ledgerService';

interface GSTSummary {
  totalInputGST: number;
  totalOutputGST: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  netGSTLiability: number;
  inputTaxCredit: number;
  gstPayable: number;
}

interface ReturnPeriodData {
  period: string;
  inputGST: number;
  outputGST: number;
  netLiability: number;
  isReconciled: boolean;
}

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
      id={`gst-tabpanel-${index}`}
      aria-labelledby={`gst-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function GSTLedger() {
  const [activeTab, setActiveTab] = useState(0);
  const [gstEntries, setGstEntries] = useState<GSTLedgerEntry[]>([]);
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<GSTSummary | null>(null);
  const [returnPeriods, setReturnPeriods] = useState<ReturnPeriodData[]>([]);

  // Filters
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedGSTType, setSelectedGSTType] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState('all');

  // Dialog states
  const [showReconciliationDialog, setShowReconciliationDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (gstEntries.length > 0) {
      calculateSummary();
      calculateReturnPeriods();
    }
  }, [gstEntries, selectedPeriod, selectedGSTType, selectedAccount]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [entriesData, accountsData] = await Promise.all([
        ledgerService.getGSTLedger(),
        ledgerService.getAccounts({ isActive: true })
      ]);

      setGstEntries(entriesData);
      setAccounts(accountsData.filter(a => a.isGstApplicable));

      // Set default period to current month
      const currentDate = new Date();
      const defaultPeriod = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
      setSelectedPeriod(defaultPeriod);
    } catch (error) {
      console.error('Error loading GST ledger data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = () => {
    let filteredEntries = gstEntries;

    // Apply filters
    if (selectedPeriod && selectedPeriod !== 'all') {
      filteredEntries = filteredEntries.filter(entry => entry.returnPeriod === selectedPeriod);
    }

    if (selectedGSTType !== 'all') {
      filteredEntries = filteredEntries.filter(entry => entry.gstType === selectedGSTType);
    }

    if (selectedAccount !== 'all') {
      filteredEntries = filteredEntries.filter(entry => entry.accountId === selectedAccount);
    }

    const totalInputGST = filteredEntries
      .filter(entry => entry.gstType === 'input' && !entry.isReversed)
      .reduce((sum, entry) => sum + entry.gstAmount, 0);

    const totalOutputGST = filteredEntries
      .filter(entry => entry.gstType === 'output' && !entry.isReversed)
      .reduce((sum, entry) => sum + entry.gstAmount, 0);

    const totalCGST = filteredEntries
      .filter(entry => entry.gstComponent === 'cgst' && !entry.isReversed)
      .reduce((sum, entry) => sum + entry.gstAmount, 0);

    const totalSGST = filteredEntries
      .filter(entry => entry.gstComponent === 'sgst' && !entry.isReversed)
      .reduce((sum, entry) => sum + entry.gstAmount, 0);

    const totalIGST = filteredEntries
      .filter(entry => entry.gstComponent === 'igst' && !entry.isReversed)
      .reduce((sum, entry) => sum + entry.gstAmount, 0);

    const netGSTLiability = totalOutputGST - totalInputGST;
    const inputTaxCredit = totalInputGST;
    const gstPayable = Math.max(netGSTLiability, 0);

    setSummary({
      totalInputGST,
      totalOutputGST,
      totalCGST,
      totalSGST,
      totalIGST,
      netGSTLiability,
      inputTaxCredit,
      gstPayable
    });
  };

  const calculateReturnPeriods = () => {
    const periodsMap = new Map<string, ReturnPeriodData>();

    gstEntries.forEach(entry => {
      if (!periodsMap.has(entry.returnPeriod)) {
        periodsMap.set(entry.returnPeriod, {
          period: entry.returnPeriod,
          inputGST: 0,
          outputGST: 0,
          netLiability: 0,
          isReconciled: true
        });
      }

      const periodData = periodsMap.get(entry.returnPeriod)!;
      
      if (entry.gstType === 'input' && !entry.isReversed) {
        periodData.inputGST += entry.gstAmount;
      } else if (entry.gstType === 'output' && !entry.isReversed) {
        periodData.outputGST += entry.gstAmount;
      }

      if (!entry.isReconciled) {
        periodData.isReconciled = false;
      }
    });

    // Calculate net liability for each period
    periodsMap.forEach((data, period) => {
      data.netLiability = data.outputGST - data.inputGST;
    });

    const periods = Array.from(periodsMap.values()).sort((a, b) => b.period.localeCompare(a.period));
    setReturnPeriods(periods);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getFilteredEntries = () => {
    let filtered = gstEntries;

    if (selectedPeriod && selectedPeriod !== 'all') {
      filtered = filtered.filter(entry => entry.returnPeriod === selectedPeriod);
    }

    if (selectedGSTType !== 'all') {
      filtered = filtered.filter(entry => entry.gstType === selectedGSTType);
    }

    if (selectedAccount !== 'all') {
      filtered = filtered.filter(entry => entry.accountId === selectedAccount);
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const renderSummaryCards = () => {
    if (!summary) return null;

    const cards = [
      {
        title: 'Input GST',
        value: formatCurrency(summary.totalInputGST),
        icon: <TrendingDownIcon />,
        color: 'success',
        subtitle: 'Tax Credit Available'
      },
      {
        title: 'Output GST',
        value: formatCurrency(summary.totalOutputGST),
        icon: <TrendingUpIcon />,
        color: 'error',
        subtitle: 'Tax Collected'
      },
      {
        title: 'Net GST Liability',
        value: formatCurrency(summary.netGSTLiability),
        icon: <AccountBalanceIcon />,
        color: summary.netGSTLiability >= 0 ? 'warning' : 'success',
        subtitle: summary.netGSTLiability >= 0 ? 'Payable' : 'Refundable'
      },
      {
        title: 'CGST',
        value: formatCurrency(summary.totalCGST),
        icon: <AssessmentIcon />,
        color: 'info',
        subtitle: 'Central GST'
      },
      {
        title: 'SGST',
        value: formatCurrency(summary.totalSGST),
        icon: <AssessmentIcon />,
        color: 'info',
        subtitle: 'State GST'
      },
      {
        title: 'IGST',
        value: formatCurrency(summary.totalIGST),
        icon: <AssessmentIcon />,
        color: 'primary',
        subtitle: 'Integrated GST'
      }
    ];

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="textSecondary">
                      {card.title}
                    </Typography>
                    <Box sx={{ color: `${card.color}.main` }}>
                      {card.icon}
                    </Box>
                  </Box>
                  <Typography variant="h6" component="div" color={`${card.color}.main`}>
                    {card.value}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {card.subtitle}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderFilters = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Return Period</InputLabel>
              <Select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                label="Return Period"
              >
                <MenuItem value="all">All Periods</MenuItem>
                {returnPeriods.map(period => (
                  <MenuItem key={period.period} value={period.period}>
                    {period.period} {!period.isReconciled && <WarningIcon fontSize="small" sx={{ ml: 1, color: 'warning.main' }} />}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>GST Type</InputLabel>
              <Select
                value={selectedGSTType}
                onChange={(e) => setSelectedGSTType(e.target.value)}
                label="GST Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="input">Input GST</MenuItem>
                <MenuItem value="output">Output GST</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Account</InputLabel>
              <Select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                label="Account"
              >
                <MenuItem value="all">All Accounts</MenuItem>
                {accounts.map(account => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.accountName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadData}
                disabled={loading}
                size="small"
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                onClick={() => setShowExportDialog(true)}
                size="small"
              >
                Export
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderGSTEntriesTable = () => {
    const filteredEntries = getFilteredEntries();

    return (
      <Card>
        <CardHeader
          title="GST Ledger Entries"
          subheader={`${filteredEntries.length} entries found`}
        />
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell>GST Type</TableCell>
                  <TableCell>Component</TableCell>
                  <TableCell align="right">Taxable Amount</TableCell>
                  <TableCell align="right">GST Rate</TableCell>
                  <TableCell align="right">GST Amount</TableCell>
                  <TableCell>Return Period</TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEntries.map((entry, index) => {
                  const account = accounts.find(a => a.id === entry.accountId);
                  return (
                    <motion.tr
                      key={entry.id}
                      component={TableRow}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      hover
                    >
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {account?.accountName || 'Unknown Account'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={entry.gstType.toUpperCase()}
                          color={entry.gstType === 'input' ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={entry.gstComponent.toUpperCase()}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatCurrency(entry.taxableAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {entry.gstRate}%
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight="medium"
                          color={entry.gstType === 'input' ? 'success.main' : 'error.main'}
                        >
                          {formatCurrency(entry.gstAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {entry.returnPeriod}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={entry.isReconciled ? 'Reconciled' : 'Pending'}
                            color={entry.isReconciled ? 'success' : 'warning'}
                            size="small"
                          />
                          {entry.isReversed && (
                            <Tooltip title="Entry Reversed">
                              <WarningIcon fontSize="small" color="error" />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredEntries.length === 0 && (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <Typography variant="body2" color="textSecondary">
                No GST entries found for the selected criteria
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderReturnPeriodsSummary = () => (
    <Card>
      <CardHeader
        title="Return Periods Summary"
        subheader="GST liability by return period"
      />
      <CardContent sx={{ p: 0 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Return Period</TableCell>
                <TableCell align="right">Input GST</TableCell>
                <TableCell align="right">Output GST</TableCell>
                <TableCell align="right">Net Liability</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {returnPeriods.map((period, index) => (
                <motion.tr
                  key={period.period}
                  component={TableRow}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  hover
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {period.period}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="success.main">
                      {formatCurrency(period.inputGST)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="error.main">
                      {formatCurrency(period.outputGST)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      color={period.netLiability >= 0 ? 'warning.main' : 'success.main'}
                    >
                      {formatCurrency(period.netLiability)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={period.isReconciled ? 'Reconciled' : 'Pending'}
                      color={period.isReconciled ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setSelectedPeriod(period.period)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentIcon color="primary" />
            GST Ledger
          </Typography>
          <Button
            variant="contained"
            startIcon={<CheckCircleIcon />}
            onClick={() => setShowReconciliationDialog(true)}
          >
            Reconcile
          </Button>
        </Box>

        {/* Summary Cards */}
        {renderSummaryCards()}

        {/* Filters */}
        {renderFilters()}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab label="GST Entries" />
            <Tab label="Return Periods" />
            <Tab label="Reports" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          {renderGSTEntriesTable()}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {renderReturnPeriodsSummary()}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Alert severity="info">
            GST reports and analytics will be implemented here.
          </Alert>
        </TabPanel>
      </motion.div>
    </Container>
  );
}