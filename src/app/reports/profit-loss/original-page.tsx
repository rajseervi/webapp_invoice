  import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp as ProfitIcon,
  TrendingDown as LossIcon,
  Assessment as ReportIcon,
  Download as DownloadIcon,
  DateRange as DateIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as PurchaseIcon,
  Receipt as SalesIcon
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';
import PageHeader from '@/components/PageHeader/PageHeader';
import { ProfitLossService, ProfitLossData, ProfitLossFilters } from '@/services/profitLossService';

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
      id={`profit-loss-tabpanel-${index}`}
      aria-labelledby={`profit-loss-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function OriginalPageComponent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ProfitLossData | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  
  const [filters, setFilters] = useState<ProfitLossFilters>({
    dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0]
  });

  const [quickPeriod, setQuickPeriod] = useState('month');

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ProfitLossService.generateProfitLossReport(filters);
      setReportData(data);
    } catch (err) {
      console.error('Error loading profit and loss report:', err);
      setError('Failed to load profit and loss report');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPeriodChange = (period: string) => {
    setQuickPeriod(period);
    const now = new Date();
    let dateFrom: string;
    const dateTo = now.toISOString().split('T')[0];

    switch (period) {
      case 'today':
        dateFrom = dateTo;
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        dateFrom = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFrom = monthStart.toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        dateFrom = quarterStart.toISOString().split('T')[0];
        break;
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        dateFrom = yearStart.toISOString().split('T')[0];
        break;
      default:
        const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFrom = defaultStart.toISOString().split('T')[0];
    }

    setFilters(prev => ({ ...prev, dateFrom, dateTo }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const exportReport = () => {
    if (!reportData) return;

    const csvContent = [
      ['Profit & Loss Report'],
      [`Period: ${filters.dateFrom} to ${filters.dateTo}`],
      [''],
      ['REVENUE'],
      ['Total Sales', formatCurrency(reportData.revenue.totalSales)],
      ['Sales Count', reportData.revenue.salesCount.toString()],
      ['Average Sale Value', formatCurrency(reportData.revenue.averageSaleValue)],
      [''],
      ['COSTS'],
      ['Total Purchases', formatCurrency(reportData.costs.totalPurchases)],
      ['Purchase Count', reportData.costs.purchaseCount.toString()],
      ['Average Purchase Value', formatCurrency(reportData.costs.averagePurchaseValue)],
      ['Operating Expenses', formatCurrency(reportData.costs.operatingExpenses)],
      [''],
      ['PROFIT'],
      ['Gross Profit', formatCurrency(reportData.profit.grossProfit)],
      ['Gross Profit Margin', formatPercentage(reportData.profit.grossProfitMargin)],
      ['Net Profit', formatCurrency(reportData.profit.netProfit)],
      ['Net Profit Margin', formatPercentage(reportData.profit.netProfitMargin)]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit-loss-report-${filters.dateFrom}-to-${filters.dateTo}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <ImprovedDashboardLayout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <PageHeader
          title="Profit & Loss Report"
          subtitle="Comprehensive financial performance analysis"
          icon={<ReportIcon />}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={exportReport}
                disabled={!reportData}
              >
                Export CSV
              </Button>
              <LoadingButton
                variant="contained"
                loading={loading}
                onClick={loadReport}
              >
                Generate Report
              </LoadingButton>
            </Box>
          }
        />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Report Filters
            </Typography>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Quick Period</InputLabel>
                  <Select
                    value={quickPeriod}
                    label="Quick Period"
                    onChange={(e) => handleQuickPeriodChange(e.target.value)}
                  >
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="week">Last 7 Days</MenuItem>
                    <MenuItem value="month">This Month</MenuItem>
                    <MenuItem value="quarter">This Quarter</MenuItem>
                    <MenuItem value="year">This Year</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="From Date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="To Date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={loadReport}
                  disabled={loading}
                  sx={{ height: 56 }}
                >
                  Apply Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {loading && <LinearProgress sx={{ mb: 3 }} />}

        {reportData && (
          <>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <SalesIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" color="primary.main">
                        Revenue
                      </Typography>
                    </Box>
                    <Typography variant="h4" gutterBottom>
                      {formatCurrency(reportData.revenue.totalSales)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {reportData.revenue.salesCount} sales • Avg: {formatCurrency(reportData.revenue.averageSaleValue)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PurchaseIcon sx={{ mr: 1, color: 'warning.main' }} />
                      <Typography variant="h6" color="warning.main">
                        Costs
                      </Typography>
                    </Box>
                    <Typography variant="h4" gutterBottom>
                      {formatCurrency(reportData.costs.totalPurchases)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {reportData.costs.purchaseCount} purchases • Avg: {formatCurrency(reportData.costs.averagePurchaseValue)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {reportData.profit.grossProfit >= 0 ? (
                        <ProfitIcon sx={{ mr: 1, color: 'success.main' }} />
                      ) : (
                        <LossIcon sx={{ mr: 1, color: 'error.main' }} />
                      )}
                      <Typography variant="h6" color={reportData.profit.grossProfit >= 0 ? 'success.main' : 'error.main'}>
                        Gross Profit
                      </Typography>
                    </Box>
                    <Typography variant="h4" gutterBottom color={reportData.profit.grossProfit >= 0 ? 'success.main' : 'error.main'}>
                      {formatCurrency(reportData.profit.grossProfit)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Margin: {formatPercentage(reportData.profit.grossProfitMargin)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <MoneyIcon sx={{ mr: 1, color: reportData.profit.netProfit >= 0 ? 'success.main' : 'error.main' }} />
                      <Typography variant="h6" color={reportData.profit.netProfit >= 0 ? 'success.main' : 'error.main'}>
                        Net Profit
                      </Typography>
                    </Box>
                    <Typography variant="h4" gutterBottom color={reportData.profit.netProfit >= 0 ? 'success.main' : 'error.main'}>
                      {formatCurrency(reportData.profit.netProfit)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Margin: {formatPercentage(reportData.profit.netProfitMargin)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Detailed Analysis Tabs */}
            <Card>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                  <Tab label="Monthly Trends" />
                  <Tab label="Top Products" />
                  <Tab label="Top Suppliers" />
                  <Tab label="Top Customers" />
                </Tabs>
              </Box>

              <TabPanel value={activeTab} index={0}>
                <Typography variant="h6" gutterBottom>
                  Monthly Sales, Purchases & Profit Trends
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportData.breakdown.salesByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Line type="monotone" dataKey="sales" stroke="#8884d8" name="Sales" strokeWidth={2} />
                      <Line type="monotone" dataKey="purchases" stroke="#82ca9d" name="Purchases" strokeWidth={2} />
                      <Line type="monotone" dataKey="profit" stroke="#ffc658" name="Profit" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <Typography variant="h6" gutterBottom>
                  Top Performing Products by Profit
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product Name</TableCell>
                        <TableCell align="right">Sales Amount</TableCell>
                        <TableCell align="right">Purchase Amount</TableCell>
                        <TableCell align="right">Profit</TableCell>
                        <TableCell align="right">Margin</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.breakdown.topProducts.map((product, index) => (
                        <TableRow key={product.productId}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Chip
                                label={index + 1}
                                size="small"
                                color="primary"
                                sx={{ mr: 1, minWidth: 24 }}
                              />
                              {product.productName}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{formatCurrency(product.salesAmount)}</TableCell>
                          <TableCell align="right">{formatCurrency(product.purchaseAmount)}</TableCell>
                          <TableCell align="right">
                            <Typography color={product.profit >= 0 ? 'success.main' : 'error.main'}>
                              {formatCurrency(product.profit)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography color={product.margin >= 0 ? 'success.main' : 'error.main'}>
                              {formatPercentage(product.margin)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                <Typography variant="h6" gutterBottom>
                  Top Suppliers by Purchase Volume
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Supplier Name</TableCell>
                        <TableCell align="right">Total Purchases</TableCell>
                        <TableCell align="right">Invoice Count</TableCell>
                        <TableCell align="right">Average Invoice</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.breakdown.topSuppliers.map((supplier, index) => (
                        <TableRow key={supplier.supplierId}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Chip
                                label={index + 1}
                                size="small"
                                color="secondary"
                                sx={{ mr: 1, minWidth: 24 }}
                              />
                              {supplier.supplierName}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{formatCurrency(supplier.totalPurchases)}</TableCell>
                          <TableCell align="right">{supplier.invoiceCount}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(supplier.totalPurchases / supplier.invoiceCount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>

              <TabPanel value={activeTab} index={3}>
                <Typography variant="h6" gutterBottom>
                  Top Customers by Sales Volume
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Customer Name</TableCell>
                        <TableCell align="right">Total Sales</TableCell>
                        <TableCell align="right">Invoice Count</TableCell>
                        <TableCell align="right">Average Invoice</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.breakdown.topCustomers.map((customer, index) => (
                        <TableRow key={customer.customerId}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Chip
                                label={index + 1}
                                size="small"
                                color="primary"
                                sx={{ mr: 1, minWidth: 24 }}
                              />
                              {customer.customerName}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{formatCurrency(customer.totalSales)}</TableCell>
                          <TableCell align="right">{customer.invoiceCount}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(customer.totalSales / customer.invoiceCount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
            </Card>
          </>
        )}
      </Container>
    </ImprovedDashboardLayout>
  );
}