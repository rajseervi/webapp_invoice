"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  LinearProgress,
  Alert,
  Divider,
  Avatar,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  PieChart as PieChartIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import {
  InventoryReportsService,
  StockValuationReport,
  MovementSummaryReport,
  ABCAnalysisReport,
  AgingReport
} from '@/services/inventoryReportsService';

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
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function InventoryReportsDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Report data states
  const [stockValuationReport, setStockValuationReport] = useState<StockValuationReport | null>(null);
  const [movementSummaryReport, setMovementSummaryReport] = useState<MovementSummaryReport | null>(null);
  const [abcAnalysisReport, setABCAnalysisReport] = useState<ABCAnalysisReport | null>(null);
  const [agingReport, setAgingReport] = useState<AgingReport | null>(null);
  
  // Filter states
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1),
    endDate: new Date()
  });
  const [reportFilters, setReportFilters] = useState({
    categories: [] as string[],
    locations: [] as string[],
    includeInactive: false
  });

  // Dialog states
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<string>('');

  // Load reports
  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const [valuation, movements, abc, aging] = await Promise.all([
        InventoryReportsService.generateStockValuationReport({
          dateRange: {
            startDate: dateRange.startDate.toISOString(),
            endDate: dateRange.endDate.toISOString()
          },
          ...reportFilters
        }),
        InventoryReportsService.generateMovementSummaryReport({
          dateRange: {
            startDate: dateRange.startDate.toISOString(),
            endDate: dateRange.endDate.toISOString()
          },
          groupBy: 'day'
        }),
        InventoryReportsService.generateABCAnalysisReport({
          analysisType: 'value',
          periodMonths: 6
        }),
        InventoryReportsService.generateAgingReport()
      ]);

      setStockValuationReport(valuation);
      setMovementSummaryReport(movements);
      setABCAnalysisReport(abc);
      setAgingReport(aging);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, reportFilters]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  const exportReport = (reportType: string) => {
    // TODO: Implement export functionality
    console.log(`Exporting ${reportType} report`);
  };

  if (loading && !stockValuationReport) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Generating reports...</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold">
            Inventory Reports
          </Typography>
          <Stack direction="row" spacing={2}>
            <DatePicker
              label="Start Date"
              value={dateRange.startDate}
              onChange={(date) => date && setDateRange(prev => ({ ...prev, startDate: date }))}
              slotProps={{ textField: { size: 'small' } }}
            />
            <DatePicker
              label="End Date"
              value={dateRange.endDate}
              onChange={(date) => date && setDateRange(prev => ({ ...prev, endDate: date }))}
              slotProps={{ textField: { size: 'small' } }}
            />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadReports}
              disabled={loading}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>

        {/* Summary Cards */}
        {stockValuationReport && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <AssessmentIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {formatNumber(stockValuationReport.summary.totalProducts)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Products
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <TrendingUpIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {formatCurrency(stockValuationReport.summary.totalValue)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Stock Value
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'info.main' }}>
                      <PieChartIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {formatNumber(stockValuationReport.summary.totalQuantity)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Quantity
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                      <ScheduleIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {agingReport ? agingReport.summary.riskAnalysis.criticalRisk.count : 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Critical Aging Items
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab label="Stock Valuation" />
              <Tab label="Movement Analysis" />
              <Tab label="ABC Analysis" />
              <Tab label="Aging Report" />
            </Tabs>
          </Box>

          {/* Stock Valuation Tab */}
          <TabPanel value={tabValue} index={0}>
            {stockValuationReport && (
              <Grid container spacing={3}>
                {/* Category Distribution Chart */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="h6">Value by Category</Typography>
                        <IconButton size="small" onClick={() => exportReport('category-distribution')}>
                          <DownloadIcon />
                        </IconButton>
                      </Stack>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={Object.entries(stockValuationReport.summary.byCategory).map(([category, data]) => ({
                              name: category,
                              value: data.value
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {Object.entries(stockValuationReport.summary.byCategory).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Top Products by Value */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="h6">Top Products by Value</Typography>
                        <IconButton size="small" onClick={() => exportReport('top-products')}>
                          <DownloadIcon />
                        </IconButton>
                      </Stack>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={stockValuationReport.products
                            .sort((a, b) => b.totalValue - a.totalValue)
                            .slice(0, 10)
                            .map(product => ({
                              name: product.productName.length > 15 
                                ? product.productName.substring(0, 15) + '...' 
                                : product.productName,
                              value: product.totalValue
                            }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Detailed Product Table */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="h6">Stock Valuation Details</Typography>
                        <Button
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          onClick={() => exportReport('stock-valuation')}
                        >
                          Export
                        </Button>
                      </Stack>
                      <TableContainer sx={{ maxHeight: 400 }}>
                        <Table stickyHeader size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Product</TableCell>
                              <TableCell>SKU</TableCell>
                              <TableCell>Category</TableCell>
                              <TableCell align="right">Quantity</TableCell>
                              <TableCell align="right">Unit Cost</TableCell>
                              <TableCell align="right">Total Value</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {stockValuationReport.products
                              .sort((a, b) => b.totalValue - a.totalValue)
                              .map((product) => (
                                <TableRow key={product.productId} hover>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight="medium">
                                      {product.productName}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>{product.sku || '-'}</TableCell>
                                  <TableCell>{product.category || 'Uncategorized'}</TableCell>
                                  <TableCell align="right">{formatNumber(product.currentQuantity)}</TableCell>
                                  <TableCell align="right">{formatCurrency(product.unitCost)}</TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" fontWeight="medium">
                                      {formatCurrency(product.totalValue)}
                                    </Typography>
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
            )}
          </TabPanel>

          {/* Movement Analysis Tab */}
          <TabPanel value={tabValue} index={1}>
            {movementSummaryReport && (
              <Grid container spacing={3}>
                {/* Movement Trends Chart */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="h6">Daily Movement Trends</Typography>
                        <IconButton size="small" onClick={() => exportReport('movement-trends')}>
                          <DownloadIcon />
                        </IconButton>
                      </Stack>
                      <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={movementSummaryReport.movements}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="inboundQuantity"
                            stackId="1"
                            stroke="#00C49F"
                            fill="#00C49F"
                            name="Inbound"
                          />
                          <Area
                            type="monotone"
                            dataKey="outboundQuantity"
                            stackId="1"
                            stroke="#FF8042"
                            fill="#FF8042"
                            name="Outbound"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Most Active Products */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Most Active Products
                      </Typography>
                      <TableContainer sx={{ maxHeight: 300 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Product</TableCell>
                              <TableCell align="right">Movements</TableCell>
                              <TableCell align="right">Net Change</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {movementSummaryReport.summary.mostActiveProducts.map((product) => (
                              <TableRow key={product.productId}>
                                <TableCell>
                                  <Typography variant="body2" fontWeight="medium">
                                    {product.productName}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">{product.movementCount}</TableCell>
                                <TableCell align="right">
                                  <Chip
                                    label={formatNumber(
                                      movementSummaryReport.productMovements.find(p => p.productId === product.productId)?.netMovement || 0
                                    )}
                                    color="info"
                                    size="small"
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

                {/* Movement Summary */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Movement Summary
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2">Total Movements</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {formatNumber(movementSummaryReport.summary.totalMovements)}
                            </Typography>
                          </Stack>
                        </Box>
                        <Box>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2">Total Inbound</Typography>
                            <Typography variant="body2" fontWeight="bold" color="success.main">
                              +{formatNumber(movementSummaryReport.summary.totalInbound)}
                            </Typography>
                          </Stack>
                        </Box>
                        <Box>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2">Total Outbound</Typography>
                            <Typography variant="body2" fontWeight="bold" color="error.main">
                              -{formatNumber(movementSummaryReport.summary.totalOutbound)}
                            </Typography>
                          </Stack>
                        </Box>
                        <Box>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2">Net Movement</Typography>
                            <Typography 
                              variant="body2" 
                              fontWeight="bold"
                              color={movementSummaryReport.summary.netMovement >= 0 ? 'success.main' : 'error.main'}
                            >
                              {movementSummaryReport.summary.netMovement >= 0 ? '+' : ''}
                              {formatNumber(movementSummaryReport.summary.netMovement)}
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </TabPanel>

          {/* ABC Analysis Tab */}
          <TabPanel value={tabValue} index={2}>
            {abcAnalysisReport && (
              <Grid container spacing={3}>
                {/* ABC Distribution Chart */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        ABC Classification Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Class A', value: abcAnalysisReport.summary.classA.count, color: '#FF8042' },
                              { name: 'Class B', value: abcAnalysisReport.summary.classB.count, color: '#FFBB28' },
                              { name: 'Class C', value: abcAnalysisReport.summary.classC.count, color: '#00C49F' }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[abcAnalysisReport.summary.classA, abcAnalysisReport.summary.classB, abcAnalysisReport.summary.classC].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#FF8042', '#FFBB28', '#00C49F'][index]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* ABC Summary */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        ABC Analysis Summary
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2">Class A Items</Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip label={`${abcAnalysisReport.summary.classA.count} items`} color="error" size="small" />
                              <Typography variant="body2" fontWeight="bold">
                                {abcAnalysisReport.summary.classA.valuePercentage.toFixed(1)}% value
                              </Typography>
                            </Stack>
                          </Stack>
                        </Box>
                        <Box>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2">Class B Items</Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip label={`${abcAnalysisReport.summary.classB.count} items`} color="warning" size="small" />
                              <Typography variant="body2" fontWeight="bold">
                                {abcAnalysisReport.summary.classB.valuePercentage.toFixed(1)}% value
                              </Typography>
                            </Stack>
                          </Stack>
                        </Box>
                        <Box>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2">Class C Items</Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip label={`${abcAnalysisReport.summary.classC.count} items`} color="success" size="small" />
                              <Typography variant="body2" fontWeight="bold">
                                {abcAnalysisReport.summary.classC.valuePercentage.toFixed(1)}% value
                              </Typography>
                            </Stack>
                          </Stack>
                        </Box>
                      </Stack>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Recommendations
                      </Typography>
                      {abcAnalysisReport.summary.recommendations.map((rec, index) => (
                        <Alert key={index} severity="info" sx={{ mb: 1 }}>
                          <Typography variant="body2">{rec}</Typography>
                        </Alert>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>

                {/* ABC Products Table */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="h6">ABC Classification Details</Typography>
                        <Button
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          onClick={() => exportReport('abc-analysis')}
                        >
                          Export
                        </Button>
                      </Stack>
                      <TableContainer sx={{ maxHeight: 400 }}>
                        <Table stickyHeader size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Product</TableCell>
                              <TableCell>Class</TableCell>
                              <TableCell align="right">Annual Usage</TableCell>
                              <TableCell align="right">Annual Value</TableCell>
                              <TableCell align="right">Cumulative %</TableCell>
                              <TableCell align="right">Current Stock</TableCell>
                              <TableCell>Stock Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {abcAnalysisReport.products.slice(0, 50).map((product) => (
                              <TableRow key={product.productId} hover>
                                <TableCell>
                                  <Typography variant="body2" fontWeight="medium">
                                    {product.productName}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={`Class ${product.classification}`}
                                    color={
                                      product.classification === 'A' ? 'error' :
                                      product.classification === 'B' ? 'warning' : 'success'
                                    }
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="right">{formatNumber(product.annualUsage)}</TableCell>
                                <TableCell align="right">{formatCurrency(product.annualValue)}</TableCell>
                                <TableCell align="right">{product.cumulativePercentage.toFixed(1)}%</TableCell>
                                <TableCell align="right">{formatNumber(product.currentStockLevel)}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={product.stockStatus.toUpperCase()}
                                    color={
                                      product.stockStatus === 'optimal' ? 'success' :
                                      product.stockStatus === 'understock' ? 'error' : 'warning'
                                    }
                                    size="small"
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
            )}
          </TabPanel>

          {/* Aging Report Tab */}
          <TabPanel value={tabValue} index={3}>
            {agingReport && (
              <Grid container spacing={3}>
                {/* Aging Distribution Chart */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Inventory Aging Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={Object.entries(agingReport.summary.byAgingCategory).map(([category, data]) => ({
                            category,
                            count: data.count,
                            value: data.value
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" />
                          <YAxis />
                          <RechartsTooltip formatter={(value, name) => 
                            name === 'value' ? formatCurrency(Number(value)) : formatNumber(Number(value))
                          } />
                          <Legend />
                          <Bar dataKey="count" fill="#8884d8" name="Item Count" />
                          <Bar dataKey="value" fill="#82ca9d" name="Value" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Risk Analysis */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Risk Analysis
                      </Typography>
                      <Stack spacing={2}>
                        {Object.entries(agingReport.summary.riskAnalysis).map(([risk, data]) => (
                          <Box key={risk}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                {risk.replace('Risk', ' Risk')}
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip 
                                  label={`${data.count} items`} 
                                  color={
                                    risk === 'criticalRisk' ? 'error' :
                                    risk === 'highRisk' ? 'warning' :
                                    risk === 'mediumRisk' ? 'info' : 'success'
                                  }
                                  size="small" 
                                />
                                <Typography variant="body2" fontWeight="bold">
                                  {formatCurrency(data.value)}
                                </Typography>
                              </Stack>
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Recommendations
                      </Typography>
                      {agingReport.summary.recommendations.map((rec, index) => (
                        <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                          <Typography variant="body2">{rec}</Typography>
                        </Alert>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Aging Details Table */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="h6">Aging Report Details</Typography>
                        <Button
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          onClick={() => exportReport('aging-report')}
                        >
                          Export
                        </Button>
                      </Stack>
                      <TableContainer sx={{ maxHeight: 400 }}>
                        <Table stickyHeader size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Product</TableCell>
                              <TableCell align="right">Quantity</TableCell>
                              <TableCell align="right">Value</TableCell>
                              <TableCell align="right">Days Since Movement</TableCell>
                              <TableCell>Aging Category</TableCell>
                              <TableCell>Risk Level</TableCell>
                              <TableCell>Recommended Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {agingReport.products
                              .sort((a, b) => b.daysSinceLastMovement - a.daysSinceLastMovement)
                              .map((product) => (
                                <TableRow key={product.productId} hover>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight="medium">
                                      {product.productName}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">{formatNumber(product.currentQuantity)}</TableCell>
                                  <TableCell align="right">{formatCurrency(product.totalValue)}</TableCell>
                                  <TableCell align="right">{product.daysSinceLastMovement}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={product.agingCategory}
                                      color={
                                        product.agingCategory === '180+' ? 'error' :
                                        product.agingCategory === '91-180' ? 'warning' :
                                        product.agingCategory === '61-90' ? 'info' : 'success'
                                      }
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={product.riskLevel.toUpperCase()}
                                      color={
                                        product.riskLevel === 'critical' ? 'error' :
                                        product.riskLevel === 'high' ? 'warning' :
                                        product.riskLevel === 'medium' ? 'info' : 'success'
                                      }
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {product.recommendedAction}
                                    </Typography>
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
            )}
          </TabPanel>
        </Card>

        {loading && (
          <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
            <LinearProgress />
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
}