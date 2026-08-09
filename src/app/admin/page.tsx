"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  IconButton,
  InputAdornment,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Stack,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  BarChart as BarChartIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  PictureAsPdf as PictureAsPdfIcon,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ChartTooltip, Legend);

// --- Types ---
interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  customer: string;
  customerId?: string;
  amount: number;
  status: string;
  date: string; // ISO yyyy-mm-dd
}

interface PartySearchResult {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  outstandingBalance?: number;
}

interface SummaryStats {
  total: number;
  totalAmount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
}

import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';

export default function AdminDashboardPage() {
  const router = useRouter();

  // Redirect to main dashboard
  React.useEffect(() => {
    router.push('/admin/dashboard');
  }, [router]);

  // Show loading while redirecting
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      flexDirection: 'column',
      gap: 2
    }}>
      <Typography variant="h6">Redirecting to Admin Dashboard...</Typography>
      <Box sx={{ width: 200, height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ 
          width: '100%', 
          height: '100%', 
          backgroundColor: '#1976d2', 
          animation: 'loading 1.5s ease-in-out infinite',
          '@keyframes loading': {
            '0%': { transform: 'translateX(-100%)' },
            '100%': { transform: 'translateX(100%)' }
          }
        }} />
      </Box>
    </Box>
  );

  // Old code below (kept for reference but won't execute due to return above)
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<PartySearchResult[]>([]);

  // Invoices pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryStats | null>(null);

  // Revenue charts data
  const [monthlyRevenue, setMonthlyRevenue] = useState<number[]>([]);
  const [quarterlyRevenue, setQuarterlyRevenue] = useState<number[]>([]);
  const [yearlyRevenue, setYearlyRevenue] = useState<number[]>([]);

  // --- Effects ---
  useEffect(() => {
    // Prefetch invoices and metrics on mount
    void fetchInvoices();
    void fetchDashboardMetrics();
  }, []);

  // --- API calls ---
  async function fetchInvoices() {
    try {
      setInvoiceLoading(true);
      const res = await fetch(`/api/invoices/recent?limit=${rowsPerPage * 5}`);
      const json = await res.json();
      if (json?.success) {
        setInvoices(json.data || []);
        setSummary(json.summary || null);
      }
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setInvoiceLoading(false);
    }
  }

  async function fetchDashboardMetrics() {
    try {
      const res = await fetch('/api/admin/dashboard?period=12months&section=sales');
      const json = await res.json();
      // Fallbacks in case API returns partial data
      const salesTrend: { label: string; value: number }[] = json?.data?.overview?.charts?.salesTrend || [];
      const monthly = salesTrend.slice(-12).map((d: any) => Math.round(d.value));
      setMonthlyRevenue(monthly);

      // Create synthetic quarterly/yearly from monthly when not present
      const quarterly = [] as number[];
      for (let i = 0; i < monthly.length; i += 3) {
        quarterly.push(Math.round(monthly.slice(i, i + 3).reduce((a, b) => a + b, 0)));
      }
      setQuarterlyRevenue(quarterly);

      const yearly = quarterly.length
        ? [Math.round(quarterly.reduce((a, b) => a + b, 0))]
        : monthly.length
        ? [Math.round(monthly.reduce((a, b) => a + b, 0))]
        : [];
      setYearlyRevenue(yearly);
    } catch (err) {
      console.error('Failed to load metrics', err);
    }
  }

  async function handleSearch() {
    try {
      if (!searchQuery || searchQuery.trim().length < 2) return;
      setSearchLoading(true);
      const res = await fetch('/api/admin/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search_parties', searchQuery: searchQuery.trim() })
      });
      const json = await res.json();
      if (json?.success) setSearchResults(json.data || []);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setSearchLoading(false);
    }
  }

  function viewLedger(partyId: string) {
    router.push(`/ledger?partyId=${encodeURIComponent(partyId)}`);
  }

  // Filtered + paginated invoices
  const filteredInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return invoices;
    return invoices.filter((inv) =>
      inv.customer?.toLowerCase().includes(q) || inv.invoiceNumber?.toLowerCase().includes(q)
    );
  }, [invoices, searchQuery]);

  const paginatedInvoices = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredInvoices.slice(start, start + rowsPerPage);
  }, [filteredInvoices, page, rowsPerPage]);

  // --- Charts config ---
  const monthLabels = useMemo(() => {
    const now = new Date();
    const labels: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleString('default', { month: 'short' }));
    }
    return labels;
  }, []);

  const monthlyRevenueData = useMemo(() => ({
    labels: monthLabels,
    datasets: [
      {
        label: 'Monthly Revenue',
        data: monthlyRevenue,
        backgroundColor: 'rgba(25, 118, 210, 0.5)',
        borderColor: 'rgba(25, 118, 210, 1)',
        borderWidth: 1
      }
    ]
  }), [monthLabels, monthlyRevenue]);

  const quarterlyRevenueData = useMemo(() => ({
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: 'Quarterly Revenue',
        data: quarterlyRevenue,
        backgroundColor: 'rgba(56, 142, 60, 0.5)',
        borderColor: 'rgba(56, 142, 60, 1)',
        borderWidth: 1
      }
    ]
  }), [quarterlyRevenue]);

  const yearlyRevenueData = useMemo(() => ({
    labels: ['Year'],
    datasets: [
      {
        label: 'Yearly Revenue',
        data: yearlyRevenue,
        backgroundColor: 'rgba(251, 140, 0, 0.5)',
        borderColor: 'rgba(251, 140, 0, 1)',
        borderWidth: 1
      }
    ]
  }), [yearlyRevenue]);

  // --- UI ---
  return (
    <ImprovedDashboardLayout title="Admin Dashboard">
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Admin Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">Overview, invoices, and ledgers</Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Navigation links */}
          <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', sm: 'flex' } }}>
            <Button onClick={() => router.push('/invoices')} variant="text">Invoices</Button>
            <Button onClick={() => router.push('/reports')} variant="text">Reports</Button>
            <Button onClick={() => router.push('/products')} variant="text">Products</Button>
            <Button onClick={() => router.push('/parties')} variant="text">Parties</Button>
          </Stack>
          {/* Quick actions */}
          <Stack direction="row" spacing={1}>
            <Button startIcon={<BarChartIcon />} variant="outlined" onClick={fetchDashboardMetrics}>Refresh Metrics</Button>
            <Button startIcon={<RefreshIcon />} variant="outlined" onClick={fetchInvoices}>Refresh Invoices</Button>
          </Stack>
        </Stack>
      </Stack>

      {/* Top search */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search parties by name, phone, email, GST..."
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleSearch} disabled={searchLoading} aria-label="search">
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack direction="column" spacing={1}>
              {searchResults.slice(0, 5).map((p) => (
                <Stack key={p.id} direction="row" spacing={1} alignItems="center">
                  <Chip label={p.name} variant="outlined" onClick={() => viewLedger(p.id)} />
                  <Button size="small" variant="outlined" onClick={() => viewLedger(p.id)}>
                    View Ledger
                  </Button>
                </Stack>
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Content grid: charts + invoices */}
      <Grid container spacing={3}>
        {/* Metrics charts */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper elevation={1} sx={{ p: 2, height: 360 }}>
            <Typography variant="h6">Monthly Revenue</Typography>
            <Bar data={monthlyRevenueData} options={{ plugins: { tooltip: { enabled: true } }, responsive: true, maintainAspectRatio: false }} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <Paper elevation={1} sx={{ p: 2, height: 360 }}>
            <Typography variant="h6">Quarterly Revenue</Typography>
            <Bar data={quarterlyRevenueData} options={{ plugins: { tooltip: { enabled: true } }, responsive: true, maintainAspectRatio: false }} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={12} lg={4}>
          <Paper elevation={1} sx={{ p: 2, height: 360 }}>
            <Typography variant="h6">Yearly Revenue</Typography>
            <Line data={yearlyRevenueData} options={{ plugins: { tooltip: { enabled: true } }, responsive: true, maintainAspectRatio: false }} />
          </Paper>
        </Grid>

        {/* Invoices table */}
        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="h6">Invoices</Typography>
              {summary && (
                <Stack direction="row" spacing={2} divider={<Divider orientation="vertical" flexItem />}>
                  <Typography variant="body2">Total: {summary.total}</Typography>
                  <Typography variant="body2">Paid: {summary.paidCount}</Typography>
                  <Typography variant="body2">Pending: {summary.pendingCount}</Typography>
                  <Typography variant="body2">Overdue: {summary.overdueCount}</Typography>
                </Stack>
              )}
            </Stack>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Date Issued</TableCell>
                    <TableCell align="right">Amount Due</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoiceLoading && (
                    <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow>
                  )}
                  {!invoiceLoading && paginatedInvoices.map((inv) => (
                    <TableRow key={inv.id} hover>
                      <TableCell>{inv.invoiceNumber}</TableCell>
                      <TableCell>{inv.customer}</TableCell>
                      <TableCell>{inv.date}</TableCell>
                      <TableCell align="right">{inv.amount.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}</TableCell>
                      <TableCell>
                        <Chip size="small" color={inv.status.toLowerCase() === 'paid' ? 'success' : inv.status.toLowerCase() === 'overdue' ? 'error' : 'warning'} label={inv.status} />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View"><IconButton onClick={() => router.push(`/invoices/${inv.id}`)}><VisibilityIcon /></IconButton></Tooltip>
                        <Tooltip title="Edit"><IconButton onClick={() => router.push(`/invoices/${inv.id}/edit`)}><EditIcon /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton color="error" onClick={() => alert('Delete confirmation TBD')}><DeleteIcon /></IconButton></Tooltip>
                        <Tooltip title="Download PDF"><IconButton onClick={() => router.push(`/invoices/${inv.id}?action=pdf`)}><PictureAsPdfIcon /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!invoiceLoading && paginatedInvoices.length === 0 && (
                    <TableRow><TableCell colSpan={6}>No invoices found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={invoices.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Paper>
        </Grid>
      </Grid>
    </ImprovedDashboardLayout>
  );
}
