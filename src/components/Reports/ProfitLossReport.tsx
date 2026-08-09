"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Stack,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as SalesIcon,
  Inventory as PurchaseIcon,
  AccountBalance as ProfitIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  DateRange as DateIcon,
  Assessment as ReportIcon,
  CompareArrows as CompareIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, subDays, subMonths } from 'date-fns';
import { ProfitLossService } from '@/services/profitLossService';
import type { ProfitLossData, ProfitLossFilters } from '@/services/profitLossService';

interface ProfitLossReportProps {
  onExport?: (data: ProfitLossData) => void;
}

const ProfitLossReport: React.FC<ProfitLossReportProps> = ({ onExport }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ProfitLossData | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [previousPeriodData, setPreviousPeriodData] = useState<ProfitLossData | null>(null);

  const [filters, setFilters] = useState<ProfitLossFilters>({
    dateFrom: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    dateTo: format(new Date(), 'yyyy-MM-dd')
  });

  const [quickFilters] = useState([
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'Last 3 Months', value: '3months' },
    { label: 'This Year', value: 'year' }
  ]);

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await ProfitLossService.generateProfitLossReport(filters);
      setReportData(data);

      // If comparison mode is enabled, get previous period data
      if (comparisonMode) {
        const startDate = new Date(filters.dateFrom);
        const endDate = new Date(filters.dateTo);
        const periodLength = endDate.getTime() - startDate.getTime();
        
        const previousEndDate = new Date(startDate.getTime() - 1);
        const previousStartDate = new Date(previousEndDate.getTime() - periodLength);
        
        const previousFilters: ProfitLossFilters = {
          dateFrom: format(previousStartDate, 'yyyy-MM-dd'),
          dateTo: format(previousEndDate, 'yyyy-MM-dd')
        };
        
        const previousData = await ProfitLossService.generateProfitLossReport(previousFilters);
        setPreviousPeriodData(previousData);
      }
    } catch (err) {
      console.error('Error generating profit & loss report:', err);
      setError('Failed to generate profit & loss report');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFilter = (value: string) => {
    const now = new Date();
    let dateFrom: string;
    let dateTo: string = format(now, 'yyyy-MM-dd');

    switch (value) {
      case 'today':
        dateFrom = dateTo;
        break;
      case 'week':
        dateFrom = format(subDays(now, 7), 'yyyy-MM-dd');
        break;
      case 'month':
        dateFrom = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
        break;
      case '3months':
        dateFrom = format(subMonths(now, 3), 'yyyy-MM-dd');
        break;
      case 'year':
        dateFrom = format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd');
        break;
      default:
        return;
    }

    setFilters(prev => ({ ...prev, dateFrom, dateTo }));
  };

  const handleExport = () => {
    if (reportData && onExport) {
      onExport(reportData);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getGrowthColor = (value: number) => {
    if (value > 0) return theme.palette.success.main;
    if (value < 0) return theme.palette.error.main;
    return theme.palette.text.secondary;
  };

  const getGrowthIcon = (value: number) => {
    return value >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />;
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const chartColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
        <Button onClick={generateReport} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  if (!reportData) {
    return (
      <Alert severity="info">
        No data available for the selected period.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReportIcon />
            Profit & Loss Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {format(new Date(filters.dateFrom), 'MMM dd, yyyy')} - {format(new Date(filters.dateTo), 'MMM dd, yyyy')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Toggle Comparison">
            <IconButton
              onClick={() => setComparisonMode(!comparisonMode)}
              color={comparisonMode ? 'primary' : 'default'}
            >
              <CompareIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh Report">
            <IconButton onClick={generateReport}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            Print
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2} alignItems="center">
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
              variant="contained"
              onClick={generateReport}
              fullWidth
            >
              Generate Report
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {quickFilters.map((filter) => (
                <Chip
                  key={filter.value}
                  label={filter.label}
                  onClick={() => handleQuickFilter(filter.value)}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(reportData.revenue.totalSales)}
                  </Typography>
                  {comparisonMode && previousPeriodData && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                      {getGrowthIcon(calculateGrowth(reportData.revenue.totalSales, previousPeriodData.revenue.totalSales))}
                      <Typography 
                        variant="caption" 
                        sx={{ color: getGrowthColor(calculateGrowth(reportData.revenue.totalSales, previousPeriodData.revenue.totalSales)) }}
                      >
                        {formatPercentage(calculateGrowth(reportData.revenue.totalSales, previousPeriodData.revenue.totalSales))}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <SalesIcon sx={{ fontSize: 40, color: theme.palette.primary.main, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Costs
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(reportData.costs.totalPurchases)}
                  </Typography>
                  {comparisonMode && previousPeriodData && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                      {getGrowthIcon(calculateGrowth(reportData.costs.totalPurchases, previousPeriodData.costs.totalPurchases))}
                      <Typography 
                        variant="caption" 
                        sx={{ color: getGrowthColor(calculateGrowth(reportData.costs.totalPurchases, previousPeriodData.costs.totalPurchases)) }}
                      >
                        {formatPercentage(calculateGrowth(reportData.costs.totalPurchases, previousPeriodData.costs.totalPurchases))}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <PurchaseIcon sx={{ fontSize: 40, color: theme.palette.warning.main, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Gross Profit
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(reportData.profit.grossProfit)}
                  </Typography>
                  {comparisonMode && previousPeriodData && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                      {getGrowthIcon(calculateGrowth(reportData.profit.grossProfit, previousPeriodData.profit.grossProfit))}
                      <Typography 
                        variant="caption" 
                        sx={{ color: getGrowthColor(calculateGrowth(reportData.profit.grossProfit, previousPeriodData.profit.grossProfit)) }}
                      >
                        {formatPercentage(calculateGrowth(reportData.profit.grossProfit, previousPeriodData.profit.grossProfit))}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <ProfitIcon sx={{ fontSize: 40, color: theme.palette.success.main, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Profit Margin
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatPercentage(reportData.profit.grossProfitMargin)}
                  </Typography>
                  {comparisonMode && previousPeriodData && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                      {getGrowthIcon(reportData.profit.grossProfitMargin - previousPeriodData.profit.grossProfitMargin)}
                      <Typography 
                        variant="caption" 
                        sx={{ color: getGrowthColor(reportData.profit.grossProfitMargin - previousPeriodData.profit.grossProfitMargin) }}
                      >
                        {(reportData.profit.grossProfitMargin - previousPeriodData.profit.grossProfitMargin).toFixed(2)}pp
                      </Typography>
                    </Box>
                  )}
                </Box>
                <MoneyIcon sx={{ fontSize: 40, color: theme.palette.info.main, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Monthly Trend */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardHeader title="Monthly Trend" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.breakdown.salesByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke={theme.palette.primary.main} 
                    strokeWidth={2}
                    name="Sales"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="purchases" 
                    stroke={theme.palette.warning.main} 
                    strokeWidth={2}
                    name="Purchases"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke={theme.palette.success.main} 
                    strokeWidth={2}
                    name="Profit"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue vs Costs */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardHeader title="Revenue vs Costs" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Revenue', value: reportData.revenue.totalSales, color: theme.palette.primary.main },
                      { name: 'Costs', value: reportData.costs.totalPurchases, color: theme.palette.warning.main }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {[
                      { name: 'Revenue', value: reportData.revenue.totalSales, color: theme.palette.primary.main },
                      { name: 'Costs', value: reportData.costs.totalPurchases, color: theme.palette.warning.main }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Tables */}
      <Grid container spacing={3}>
        {/* Top Products */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardHeader title="Top Performing Products" />
            <CardContent>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Sales</TableCell>
                      <TableCell align="right">Profit</TableCell>
                      <TableCell align="right">Margin</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.breakdown.topProducts.slice(0, 5).map((product, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {product.productName}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(product.salesAmount)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            sx={{ color: product.profit >= 0 ? 'success.main' : 'error.main' }}
                          >
                            {formatCurrency(product.profit)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={formatPercentage(product.margin)}
                            size="small"
                            color={product.margin >= 20 ? 'success' : product.margin >= 10 ? 'warning' : 'error'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Suppliers */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardHeader title="Top Suppliers" />
            <CardContent>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Supplier</TableCell>
                      <TableCell align="right">Purchases</TableCell>
                      <TableCell align="right">Invoices</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.breakdown.topSuppliers.slice(0, 5).map((supplier, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {supplier.supplierName}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(supplier.totalPurchases)}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={supplier.invoiceCount}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfitLossReport;