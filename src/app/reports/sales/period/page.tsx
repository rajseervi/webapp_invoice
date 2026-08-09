"use client";
import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  DatePicker,
} from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';

interface PeriodData {
  period: string;
  revenue: number;
  invoices: number;
  averageValue: number;
  customers: number;
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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
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

export default function SalesPeriodPage() {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 6)),
    end: new Date(),
  });
  const [periodType, setPeriodType] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [periodData, setPeriodData] = useState<PeriodData[]>([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchPeriodData();
  }, [dateRange, periodType]);

  const fetchPeriodData = async () => {
    try {
      setLoading(true);
      
      const invoicesRef = collection(db, 'invoices');
      const q = query(
        invoicesRef,
        where('createdAt', '>=', dateRange.start),
        where('createdAt', '<=', dateRange.end),
        orderBy('createdAt', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const invoices = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));

      // Group invoices by period
      const groupedData: Record<string, any[]> = {};
      
      invoices.forEach(invoice => {
        let periodKey = '';
        const date = new Date(invoice.createdAt);

        switch (periodType) {
          case 'daily':
            periodKey = date.toLocaleDateString('en-IN');
            break;
          case 'weekly':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            periodKey = `Week of ${weekStart.toLocaleDateString('en-IN')}`;
            break;
          case 'monthly':
            periodKey = date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
            break;
          case 'quarterly':
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            periodKey = `Q${quarter} ${date.getFullYear()}`;
            break;
        }

        if (!groupedData[periodKey]) {
          groupedData[periodKey] = [];
        }
        groupedData[periodKey].push(invoice);
      });

      // Convert to chart data
      const chartData = Object.entries(groupedData).map(([period, periodInvoices]) => {
        const revenue = periodInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
        const invoiceCount = periodInvoices.length;
        const uniqueCustomers = new Set(
          periodInvoices.map(inv => inv.customer?.name || inv.partyName)
        ).size;
        const averageValue = invoiceCount > 0 ? revenue / invoiceCount : 0;

        return {
          period,
          revenue,
          invoices: invoiceCount,
          customers: uniqueCustomers,
          averageValue
        };
      });

      setPeriodData(chartData);

    } catch (error) {
      console.error('Error fetching period data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // TODO: Implement CSV/PDF download
    console.log('Download period report');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalRevenue = periodData.reduce((sum, period) => sum + period.revenue, 0);
  const totalInvoices = periodData.reduce((sum, period) => sum + period.invoices, 0);
  const averagePeriodRevenue = periodData.length > 0 ? totalRevenue / periodData.length : 0;

  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Sales Period Analysis"
        subtitle="Analyze sales performance across different time periods"
        pageType="reports"
        enableVisualEffects={true}
        enableParticles={false}
        customQuickActions={[
          { icon: <RefreshIcon />, label: 'Refresh', onClick: fetchPeriodData },
          { icon: <DownloadIcon />, label: 'Export', onClick: handleDownload },
          { icon: <PrintIcon />, label: 'Print', onClick: handlePrint },
        ]}
      >
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          {/* Filters */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
              Period Selection
            </Typography>
            
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={dateRange.start}
                    onChange={(newValue) => newValue && setDateRange(prev => ({ ...prev, start: newValue }))}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={dateRange.end}
                    onChange={(newValue) => newValue && setDateRange(prev => ({ ...prev, end: newValue }))}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Period Type</InputLabel>
                  <Select
                    value={periodType}
                    label="Period Type"
                    onChange={(e) => setPeriodType(e.target.value as any)}
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="quarterly">Quarterly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <Button
                  variant="contained"
                  onClick={fetchPeriodData}
                  fullWidth
                  disabled={loading}
                  startIcon={<RefreshIcon />}
                >
                  Update Report
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Total Revenue</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(totalRevenue)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Across {periodData.length} periods
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Total Invoices</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {totalInvoices}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    {periodData.length > 0 ? Math.round(totalInvoices / periodData.length) : 0} avg per period
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Avg Period Revenue</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(averagePeriodRevenue)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Per {periodType.slice(0, -2)} period
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts and Tables */}
          <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="period analysis tabs">
                <Tab icon={<BarChart />} label="Revenue Chart" iconPosition="start" />
                <Tab icon={<TrendingUpIcon />} label="Trend Analysis" iconPosition="start" />
                <Tab icon={<AssessmentIcon />} label="Detailed Table" iconPosition="start" />
              </Tabs>
            </Box>

            {/* Revenue Chart */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer>
                  <BarChart data={periodData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="period" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(value as number) : value,
                        name === 'revenue' ? 'Revenue' : 'Invoices'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                    <Bar dataKey="invoices" fill="#82ca9d" name="Invoices" yAxisId="right" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </TabPanel>

            {/* Trend Analysis */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer>
                  <AreaChart data={periodData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="period" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value, name) => [
                        formatCurrency(value as number),
                        name === 'revenue' ? 'Revenue' : 'Average Order Value'
                      ]}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stackId="1" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.6}
                      name="Revenue"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="averageValue" 
                      stackId="2" 
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      fillOpacity={0.6}
                      name="Avg Order Value"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </TabPanel>

            {/* Detailed Table */}
            <TabPanel value={tabValue} index={2}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Period</strong></TableCell>
                      <TableCell align="right"><strong>Revenue</strong></TableCell>
                      <TableCell align="right"><strong>Invoices</strong></TableCell>
                      <TableCell align="right"><strong>Customers</strong></TableCell>
                      <TableCell align="right"><strong>Avg Order Value</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {periodData.map((period, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{period.period}</TableCell>
                        <TableCell align="right">{formatCurrency(period.revenue)}</TableCell>
                        <TableCell align="right">{period.invoices}</TableCell>
                        <TableCell align="right">{period.customers}</TableCell>
                        <TableCell align="right">{formatCurrency(period.averageValue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
          </Paper>
        </Container>
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}