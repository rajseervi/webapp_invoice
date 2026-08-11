"use client";
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Stack,
  Divider,
  Collapse,
  TablePagination,
  InputAdornment,
  Skeleton,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  CurrencyRupee as RupeeIcon,
  ShoppingCart as CartIcon,
  Refresh as RefreshIcon,
  DateRange as DateRangeIcon,
  LocalShipping as TransportIcon,
  Percent as DiscountIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  SwapVert as SwapVertIcon,
  GridOn as GridOnIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts';
import * as XLSX from 'xlsx';
import {
  AdvancedReportService,
  NormalizedInvoice,
  NormalizedProduct,
  ReportDateRange,
  dateInRange,
  exportToCSV,
  formatINR,
  formatNumber,
} from '@/services/advancedReportService';
import {
  StyledCard,
  StatDisplay,
  EmptyState,
  FilterPanel,
  FilterToggleHeader,
  TabPanel,
  RangePresetButtons,
  TableHeaderCell,
  ReportTooltip,
  ChartEmptyState,
  COLORS,
  fadeIn,
} from '@/components/Reports/ReportUi';
import { useProducts } from '@/app/hooks/useProducts';

interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

// Compact currency for axis ticks: 1.2L / 45K / 900
const compactINR = (value: number) => {
  if (Math.abs(value) >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
  if (Math.abs(value) >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return String(Math.round(value));
};

export default function OriginalPageComponent() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<NormalizedInvoice[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sort, setSort] = useState<SortState>({ key: 'date', direction: 'desc' });

  const { products: hookProducts } = useProducts();
  const normalizedProducts = useMemo<NormalizedProduct[]>(
    () =>
      hookProducts.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category || 'Uncategorized',
        price: p.price || 0,
        purchasePrice: p.purchasePrice || 0,
        salePrice: p.price || 0,
        quantity: p.stock ?? p.quantity ?? 0,
        reorderPoint: p.reorderPoint || 5,
        minStockLevel: p.minStockLevel || 5,
        maxStockLevel: p.maxStockLevel || 100,
      })),
    [hookProducts]
  );

  // ── Filters ──
  const [dateRange, setDateRange] = useState<ReportDateRange | null>(null);
  const [partyFilter, setPartyFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [productFilter, setProductFilter] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState(true);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const invoiceData = await AdvancedReportService.fetchInvoices();
      setInvoices(invoiceData);
    } catch (err) {
      console.error('Error loading sales data:', err);
      setError('Failed to load sales data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Derived lists for filters ──
  const partyOptions = useMemo(() => {
    const set = new Set(invoices.map((inv) => inv.partyName).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [invoices]);

  const categoryOptions = useMemo(() => {
    const set = new Set(invoices.flatMap((inv) => inv.items.map((item) => item.category)).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [invoices]);

  const productOptions = useMemo(() => {
    const set = new Set(invoices.flatMap((inv) => inv.items.map((item) => item.productName)).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [invoices]);

  // ── Filtering ──
  const filteredInvoices = useMemo(() => {
    let result = invoices.filter((invoice) => dateInRange(invoice.dateTime, dateRange));

    if (partyFilter) result = result.filter((inv) => inv.partyName === partyFilter);
    if (categoryFilter) result = result.filter((inv) => inv.items.some((item) => item.category === categoryFilter));
    if (productFilter) result = result.filter((inv) => inv.items.some((item) => item.productName === productFilter));
    if (minAmount) {
      const min = parseFloat(minAmount);
      if (!isNaN(min)) result = result.filter((inv) => inv.total >= min);
    }
    if (maxAmount) {
      const max = parseFloat(maxAmount);
      if (!isNaN(max)) result = result.filter((inv) => inv.total <= max);
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.partyName.toLowerCase().includes(q) ||
          inv.items.some((item) => item.productName.toLowerCase().includes(q))
      );
    }

    const sorted = [...result].sort((a, b) => {
      const av = a[sort.key as keyof NormalizedInvoice] as any;
      const bv = b[sort.key as keyof NormalizedInvoice] as any;
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sort.direction === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [invoices, dateRange, partyFilter, categoryFilter, productFilter, minAmount, maxAmount, searchTerm, sort]);

  // ── Aggregations ──
  const stats = useMemo(() => {
    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalDiscount = filteredInvoices.reduce((sum, inv) => sum + inv.discount, 0);
    const totalTransport = filteredInvoices.reduce((sum, inv) => sum + inv.transportCharges, 0);
    const totalTax = filteredInvoices.reduce((sum, inv) => sum + inv.totalTaxAmount, 0);
    const totalQuantity = filteredInvoices.reduce((sum, inv) => sum + inv.totalQuantity, 0);
    const avgInvoice = filteredInvoices.length > 0 ? totalRevenue / filteredInvoices.length : 0;
    return { totalRevenue, totalDiscount, totalTransport, totalTax, totalQuantity, avgInvoice };
  }, [filteredInvoices]);

  const salesByMonth = useMemo(() => AdvancedReportService.salesByMonth(filteredInvoices), [filteredInvoices]);
  const salesByDay = useMemo(() => AdvancedReportService.salesByDay(filteredInvoices), [filteredInvoices]);
  const revenueByCategory = useMemo(() => AdvancedReportService.revenueByCategory(filteredInvoices), [filteredInvoices]);
  const topProducts = useMemo(
    () => AdvancedReportService.topProducts(filteredInvoices, normalizedProducts).slice(0, 10),
    [filteredInvoices, normalizedProducts]
  );
  const topParties = useMemo(() => AdvancedReportService.topParties(filteredInvoices).slice(0, 10), [filteredInvoices]);

  // ── Trend vs previous period (same length, immediately before the selected range) ──
  const trend = useMemo(() => {
    const pct = (curr: number, base: number) => (base > 0 ? ((curr - base) / base) * 100 : 0);
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    try {
      let prev = invoices;
      if (dateRange && dateRange.startDate && dateRange.endDate) {
        const start = new Date(`${dateRange.startDate}T00:00:00`);
        const end = new Date(`${dateRange.endDate}T00:00:00`);
        const spanMs = end.getTime() - start.getTime() + 86400000;
        prev = invoices.filter((inv) =>
          dateInRange(inv.dateTime, {
            startDate: fmt(new Date(start.getTime() - spanMs)),
            endDate: fmt(new Date(start.getTime() - 86400000)),
          })
        );
      }
      if (partyFilter) prev = prev.filter((inv) => inv.partyName === partyFilter);
      if (categoryFilter) prev = prev.filter((inv) => inv.items.some((item) => item.category === categoryFilter));
      if (productFilter) prev = prev.filter((inv) => inv.items.some((item) => item.productName === productFilter));
      if (minAmount) {
        const min = parseFloat(minAmount);
        if (!isNaN(min)) prev = prev.filter((inv) => inv.total >= min);
      }
      if (maxAmount) {
        const max = parseFloat(maxAmount);
        if (!isNaN(max)) prev = prev.filter((inv) => inv.total <= max);
      }

      const prevRevenue = prev.reduce((sum, inv) => sum + inv.total, 0);
      const prevQty = prev.reduce((sum, inv) => sum + inv.totalQuantity, 0);
      const prevDiscount = prev.reduce((sum, inv) => sum + inv.discount, 0);
      const prevAvg = prev.length > 0 ? prevRevenue / prev.length : 0;

      return {
        revenue: pct(stats.totalRevenue, prevRevenue),
        quantity: pct(stats.totalQuantity, prevQty),
        avgInvoice: pct(stats.avgInvoice, prevAvg),
        discount: pct(stats.totalDiscount, prevDiscount),
      };
    } catch {
      return { revenue: 0, quantity: 0, avgInvoice: 0, discount: 0 };
    }
  }, [invoices, stats, dateRange, partyFilter, categoryFilter, productFilter, minAmount, maxAmount]);

  const activeFilterCount = [
    dateRange ? 1 : 0,
    partyFilter,
    categoryFilter,
    productFilter,
    minAmount,
    maxAmount,
    searchTerm,
  ].filter(Boolean).length;

  // ── CSV export ──
  const handleExport = () => {
    const rows = filteredInvoices.map((inv) => ({
      'Invoice #': inv.invoiceNumber,
      Date: inv.date,
      Party: inv.partyName,
      Items: inv.items.length,
      Quantity: inv.totalQuantity,
      Subtotal: inv.subtotal,
      Discount: inv.discount,
      Transport: inv.transportCharges,
      Tax: inv.totalTaxAmount,
      Total: inv.total,
    }));
    exportToCSV(`sales-report-${new Date().toISOString().split('T')[0]}.csv`, rows);
  };

  // ── Excel export (respects current date range + filters) ──
  const handleExportExcel = () => {
    if (filteredInvoices.length === 0) return;

    const rows = filteredInvoices.map((inv, index) => ({
      '#': index + 1,
      'Invoice #': inv.invoiceNumber,
      Date: inv.date,
      Party: inv.partyName,
      Items: inv.items.length,
      Quantity: inv.totalQuantity,
      Subtotal: inv.subtotal,
      Discount: inv.discount,
      Transport: inv.transportCharges,
      Tax: inv.totalTaxAmount,
      Total: inv.total,
    }));

    const rangeLabel = dateRange ? `${dateRange.startDate} to ${dateRange.endDate}` : 'All Time';
    const summary = [
      { Metric: 'Date Range', Value: rangeLabel },
      { Metric: 'Invoices', Value: filteredInvoices.length },
      { Metric: 'Total Revenue', Value: stats.totalRevenue },
      { Metric: 'Units Sold', Value: stats.totalQuantity },
      { Metric: 'Avg / Invoice', Value: stats.avgInvoice },
      { Metric: 'Discounts', Value: stats.totalDiscount },
      { Metric: 'Tax Collected', Value: stats.totalTax },
      { Metric: 'Transport', Value: stats.totalTransport },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 5 }, { wch: 14 }, { wch: 12 }, { wch: 24 }, { wch: 7 },
      { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 11 }, { wch: 10 }, { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Data');

    // Per-product detail sheet: how many units of each product were sold
    const productRows = topProducts.map((product, index) => ({
      '#': index + 1,
      Product: product.productName,
      Category: product.category,
      'Qty Sold': product.quantitySold,
      Revenue: product.revenue,
      Cost: product.cost,
      Profit: product.profit,
      'Margin %': Number(product.margin.toFixed(1)),
    }));
    const wsProducts = XLSX.utils.json_to_sheet(productRows);
    wsProducts['!cols'] = [
      { wch: 5 }, { wch: 32 }, { wch: 20 }, { wch: 10 },
      { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Products');

    const wsSummary = XLSX.utils.json_to_sheet(summary);
    wsSummary['!cols'] = [{ wch: 22 }, { wch: 32 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    const fileStart = dateRange?.startDate ?? 'all';
    const fileEnd = dateRange?.endDate ?? 'all';
    XLSX.writeFile(wb, `sales-report-${fileStart}-to-${fileEnd}.xlsx`);
  };

  const handleClearFilters = () => {
    setDateRange(null);
    setPartyFilter('');
    setCategoryFilter('');
    setProductFilter('');
    setMinAmount('');
    setMaxAmount('');
    setSearchTerm('');
  };

  const handleSort = (key: string) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
    setPage(0);
  };

  // ── Loading skeletons ──
  if (loading) {
    return (
      <Box sx={{ animation: `${fadeIn} 0.3s ease-out` }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="rounded" height={110} sx={{ borderRadius: 4 }} />
        </Box>
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid key={index} size={{ xs: 6, md: 2 }}>
              <Skeleton variant="rounded" height={110} sx={{ borderRadius: 4 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={60} sx={{ borderRadius: 3, mb: 3 }} />
        <Skeleton variant="rounded" height={340} sx={{ borderRadius: 4 }} />
      </Box>
    );
  }

  const sortIcon = (key: string) => {
    if (sort.key !== key) return <SwapVertIcon sx={{ fontSize: 13, opacity: 0.45, ml: 0.5, verticalAlign: 'middle' }} />;
    return sort.direction === 'asc' ? (
      <ArrowUpwardIcon sx={{ fontSize: 13, color: 'primary.main', ml: 0.5, verticalAlign: 'middle' }} />
    ) : (
      <ArrowDownwardIcon sx={{ fontSize: 13, color: 'primary.main', ml: 0.5, verticalAlign: 'middle' }} />
    );
  };

  const hasData = filteredInvoices.length > 0;

  return (
    <Box sx={{ animation: `${fadeIn} 0.4s ease-out` }}>
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 3, border: `2px solid ${alpha(theme.palette.error.main, 0.3)}` }}
          action={
            <Button size="small" color="inherit" onClick={() => loadData()}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* ── Header ── */}
      <Box
        sx={{
          mb: 3,
          p: { xs: 2.5, md: 3 },
          borderRadius: 4,
          border: `2px solid ${alpha(theme.palette.common.black, 0.12)}`,
          boxShadow: `6px 6px 0px ${alpha(theme.palette.common.black, 0.08)}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, letterSpacing: '-0.5px' }}>
              📈 Sales Tracking Report
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
              Track sales by date range with party, category, product & amount filters
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<GridOnIcon />}
              onClick={handleExportExcel}
              disabled={!hasData}
              sx={{ borderRadius: 3, fontWeight: 700, boxShadow: `3px 3px 0px ${alpha(theme.palette.common.black, 0.15)}` }}
            >
              Excel
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={!hasData}
              sx={{ borderRadius: 3, borderWidth: 2, fontWeight: 700 }}
            >
              CSV
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={refreshing ? undefined : <RefreshIcon />}
              onClick={() => loadData(true)}
              disabled={refreshing}
              sx={{ borderRadius: 3, borderWidth: 2, fontWeight: 700 }}
            >
              {refreshing ? <CircularProgress size={16} sx={{ mr: 0.5 }} /> : null}
              Refresh
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* ── KPIs ── */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, md: 2 }}>
          <StatDisplay
            label="Total Revenue"
            value={formatINR(stats.totalRevenue)}
            sub={`${filteredInvoices.length} invoices`}
            icon={<RupeeIcon />}
            color={theme.palette.primary.main}
            trend={{ value: trend.revenue, label: 'vs prev. period' }}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <StatDisplay
            label="Units Sold"
            value={formatNumber(stats.totalQuantity)}
            sub="quantity"
            icon={<CartIcon />}
            color={theme.palette.success.main}
            trend={{ value: trend.quantity, label: 'vs prev. period' }}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <StatDisplay
            label="Avg / Invoice"
            value={formatINR(stats.avgInvoice)}
            sub="per invoice"
            icon={<TrendingUpIcon />}
            color={theme.palette.secondary.main}
            trend={{ value: trend.avgInvoice, label: 'vs prev. period' }}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <StatDisplay
            label="Discounts"
            value={formatINR(stats.totalDiscount)}
            sub="given"
            icon={<DiscountIcon />}
            color={theme.palette.error.main}
            trend={{ value: trend.discount, label: 'vs prev. period', invert: true }}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <StatDisplay label="Tax Collected" value={formatINR(stats.totalTax)} sub="GST total" icon={<ReceiptIcon />} color={theme.palette.warning.main} />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <StatDisplay label="Transport" value={formatINR(stats.totalTransport)} sub="charges" icon={<TransportIcon />} color={theme.palette.info.main} />
        </Grid>
      </Grid>

      {/* ── Filters ── */}
      <FilterPanel sx={{ mb: 3 }}>
        <FilterToggleHeader
          title={
            <>
              <FilterIcon sx={{ fontSize: 20 }} />
              Date Range & Filters
            </>
          }
          chip={
            <Chip
              label={`${filteredInvoices.length} results • ${activeFilterCount} active`}
              size="small"
              color={activeFilterCount > 0 ? 'primary' : 'default'}
              sx={{ fontWeight: 700, height: 22, fontSize: '0.65rem' }}
            />
          }
          open={showFilters}
          onToggle={() => setShowFilters((prev) => !prev)}
        />
        <Collapse in={showFilters}>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid size={12}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <DateRangeIcon sx={{ fontSize: 14 }} /> Quick Range
                  </Typography>
                  <RangePresetButtons value={dateRange} onChange={setDateRange} />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Start Date"
                  type="date"
                  value={dateRange?.startDate || ''}
                  onChange={(e) => setDateRange((prev) => ({ startDate: e.target.value, endDate: prev?.endDate || e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="End Date"
                  type="date"
                  value={dateRange?.endDate || ''}
                  onChange={(e) => setDateRange((prev) => ({ startDate: prev?.startDate || e.target.value, endDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Invoice #, Party, Product…"
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Party</InputLabel>
                  <Select value={partyFilter} label="Party" onChange={(e) => setPartyFilter(e.target.value)}>
                    <MenuItem value="">All Parties</MenuItem>
                    {partyOptions.map((name) => (
                      <MenuItem key={name} value={name}>{name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select value={categoryFilter} label="Category" onChange={(e) => setCategoryFilter(e.target.value)}>
                    <MenuItem value="">All Categories</MenuItem>
                    {categoryOptions.map((name) => (
                      <MenuItem key={name} value={name}>{name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Product</InputLabel>
                  <Select value={productFilter} label="Product" onChange={(e) => setProductFilter(e.target.value)}>
                    <MenuItem value="">All Products</MenuItem>
                    {productOptions.map((name) => (
                      <MenuItem key={name} value={name}>{name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, md: 2 }}>
                <TextField fullWidth size="small" label="Min Amount (₹)" type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 6, md: 2 }}>
                <TextField fullWidth size="small" label="Max Amount (₹)" type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleClearFilters}
                  startIcon={<ClearIcon />}
                  sx={{ height: '100%', borderRadius: 2, borderWidth: 2, fontWeight: 700 }}
                >
                  Clear All
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </FilterPanel>

      {/* ── Charts & Tables ── */}
      <StyledCard sx={{ mb: 3 }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Box sx={{ px: 3, pt: 2 }}>
            <Tabs value={tabValue} onChange={(_, v) => { setTabValue(v); setPage(0); }} variant="scrollable" scrollButtons="auto">
              <Tab
                icon={<AssessmentIcon />}
                label={
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                    Trends
                    <Chip
                      label={filteredInvoices.length}
                      size="small"
                      sx={{ height: 18, minWidth: 18, fontSize: '0.6rem', fontWeight: 800, '& .MuiChip-label': { px: 0.5 } }}
                    />
                  </Box>
                }
                iconPosition="start"
              />
              <Tab
                icon={<InventoryIcon />}
                label={
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                    Products
                    <Chip
                      label={topProducts.length}
                      size="small"
                      sx={{ height: 18, minWidth: 18, fontSize: '0.6rem', fontWeight: 800, '& .MuiChip-label': { px: 0.5 } }}
                    />
                  </Box>
                }
                iconPosition="start"
              />
              <Tab
                icon={<PeopleIcon />}
                label={
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                    Parties
                    <Chip
                      label={topParties.length}
                      size="small"
                      sx={{ height: 18, minWidth: 18, fontSize: '0.6rem', fontWeight: 800, '& .MuiChip-label': { px: 0.5 } }}
                    />
                  </Box>
                }
                iconPosition="start"
              />
              <Tab
                icon={<ReceiptIcon />}
                label={
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                    Invoices
                    <Chip
                      label={filteredInvoices.length}
                      size="small"
                      sx={{ height: 18, minWidth: 18, fontSize: '0.6rem', fontWeight: 800, '& .MuiChip-label': { px: 0.5 } }}
                    />
                  </Box>
                }
                iconPosition="start"
              />
            </Tabs>
          </Box>

          {/* TRENDS */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ px: 3, pb: 3 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <StyledCard>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                        📈 Monthly Revenue Trend
                      </Typography>
                      <Box sx={{ height: 300 }}>
                        {salesByMonth.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesByMonth}>
                              <defs>
                                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.25} />
                                  <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.4)} />
                              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => compactINR(value as number)} width={70} />
                              <RechartsTooltip content={<ReportTooltip format={(v) => formatINR(Number(v))} />} />
                              <Area type="monotone" dataKey="value" stroke={theme.palette.primary.main} fill="url(#salesGrad)" strokeWidth={3} name="Revenue" />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <ChartEmptyState />
                        )}
                      </Box>
                    </CardContent>
                  </StyledCard>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <StyledCard>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                        🥧 Revenue by Category
                      </Typography>
                      <Box sx={{ height: 300 }}>
                        {revenueByCategory.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={revenueByCategory.slice(0, 6)}
                                cx="50%"
                                cy="50%"
                                outerRadius={90}
                                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                dataKey="value"
                              >
                                {revenueByCategory.slice(0, 6).map((_, i) => (
                                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke={alpha(theme.palette.common.black, 0.1)} strokeWidth={2} />
                                ))}
                              </Pie>
                              <RechartsTooltip content={<ReportTooltip format={(v) => formatINR(Number(v))} />} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <ChartEmptyState />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                        {revenueByCategory.slice(0, 6).map((cat, i) => (
                          <Chip
                            key={cat.name}
                            label={`${cat.name}: ${(cat.value / (stats.totalRevenue || 1) * 100).toFixed(0)}%`}
                            size="small"
                            sx={{ bgcolor: alpha(COLORS[i % COLORS.length], 0.12), color: COLORS[i % COLORS.length], fontWeight: 700, fontSize: '0.6rem' }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </StyledCard>
                </Grid>
                <Grid size={12}>
                  <StyledCard>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                        📅 Daily Sales
                      </Typography>
                      <Box sx={{ height: 260 }}>
                        {salesByDay.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={salesByDay}>
                              <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.4)} />
                              <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={30} />
                              <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => compactINR(value as number)} width={70} />
                              <RechartsTooltip content={<ReportTooltip format={(v) => formatINR(Number(v))} />} />
                              <Line type="monotone" dataKey="value" stroke={theme.palette.success.main} strokeWidth={2.5} dot={{ r: 2 }} name="Sales" />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <ChartEmptyState />
                        )}
                      </Box>
                    </CardContent>
                  </StyledCard>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>

          {/* PRODUCTS */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ px: 3, pb: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                🏆 Top Products by Revenue (with profit)
              </Typography>
              <Box sx={{ height: 280, mb: 3 }}>
                {topProducts.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts.slice(0, 8)} layout="vertical" margin={{ left: 140 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.4)} />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(value) => compactINR(value as number)} />
                      <YAxis type="category" dataKey="productName" width={150} tick={{ fontSize: 10, fontWeight: 600 }} />
                      <RechartsTooltip content={<ReportTooltip format={(v) => formatINR(Number(v))} />} />
                      <Bar dataKey="revenue" radius={[0, 8, 8, 0]}>
                        {topProducts.slice(0, 8).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartEmptyState message="No product sales found for the selected filters" />
                )}
              </Box>
              <TableContainer>
                <Table size="small" sx={{ '& .MuiTableRow-root:nth-of-type(even)': { bgcolor: alpha(theme.palette.action.hover, 0.35) } }}>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Product</TableHeaderCell>
                      <TableHeaderCell align="right">Qty Sold</TableHeaderCell>
                      <TableHeaderCell align="right">Revenue</TableHeaderCell>
                      <TableHeaderCell align="right">Cost</TableHeaderCell>
                      <TableHeaderCell align="right">Profit</TableHeaderCell>
                      <TableHeaderCell align="right">Margin</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topProducts.length === 0 ? (
                      <EmptyState colSpan={6} message="No product sales found for the selected filters" icon={<InventoryIcon />} />
                    ) : (
                      topProducts.map((product) => (
                        <TableRow key={product.productId} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>{product.productName}</Typography>
                            <Typography variant="caption" color="text.secondary">{product.category}</Typography>
                          </TableCell>
                          <TableCell align="right"><Typography variant="body2" fontWeight={600}>{formatNumber(product.quantitySold)}</Typography></TableCell>
                          <TableCell align="right"><Typography variant="body2" fontWeight={600}>{formatINR(product.revenue)}</Typography></TableCell>
                          <TableCell align="right"><Typography variant="body2">{formatINR(product.cost)}</Typography></TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={700} color={product.profit >= 0 ? 'success.main' : 'error.main'}>
                              {product.profit >= 0 ? '+' : ''}{formatINR(product.profit)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${product.margin.toFixed(1)}%`}
                              size="small"
                              color={product.margin >= 20 ? 'success' : product.margin >= 10 ? 'warning' : 'error'}
                              sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </TabPanel>

          {/* PARTIES */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ px: 3, pb: 3 }}>
              <TableContainer>
                <Table size="small" sx={{ '& .MuiTableRow-root:nth-of-type(even)': { bgcolor: alpha(theme.palette.action.hover, 0.35) } }}>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Party</TableHeaderCell>
                      <TableHeaderCell align="right">Invoices</TableHeaderCell>
                      <TableHeaderCell align="right">Quantity</TableHeaderCell>
                      <TableHeaderCell align="right">Revenue</TableHeaderCell>
                      <TableHeaderCell align="right">Avg / Invoice</TableHeaderCell>
                      <TableHeaderCell>Last Invoice</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topParties.length === 0 ? (
                      <EmptyState colSpan={6} message="No party sales found for the selected filters" icon={<PeopleIcon />} />
                    ) : (
                      topParties.map((party) => (
                        <TableRow key={party.partyId || party.partyName} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>{party.partyName}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip label={party.invoiceCount} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem', minWidth: 36 }} />
                          </TableCell>
                          <TableCell align="right"><Typography variant="body2">{formatNumber(party.quantity)}</Typography></TableCell>
                          <TableCell align="right"><Typography variant="body2" fontWeight={800} color="primary.main">{formatINR(party.revenue)}</Typography></TableCell>
                          <TableCell align="right"><Typography variant="body2">{formatINR(party.invoiceCount > 0 ? party.revenue / party.invoiceCount : 0)}</Typography></TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>{party.lastInvoiceDate}</Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </TabPanel>

          {/* INVOICES */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ px: 0, pb: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, pt: 2.5, pb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  📄 Invoice Details <Chip label={filteredInvoices.length} size="small" color="primary" sx={{ ml: 1, fontWeight: 700 }} />
                </Typography>
                <TablePagination
                  component="div"
                  count={filteredInvoices.length}
                  page={page}
                  onPageChange={(_, p) => setPage(p)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                  rowsPerPageOptions={[10, 25, 50]}
                  sx={{ '.MuiTablePagination-toolbar': { pl: 0 }, '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: '0.75rem', fontWeight: 600 } }}
                />
              </Box>
              <TableContainer>
                <Table size="small" sx={{ '& .MuiTableRow-root:nth-of-type(even)': { bgcolor: alpha(theme.palette.action.hover, 0.35) } }}>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell sx={{ cursor: 'pointer' }} onClick={() => handleSort('invoiceNumber')}>
                        Invoice #{sortIcon('invoiceNumber')}
                      </TableHeaderCell>
                      <TableHeaderCell sx={{ cursor: 'pointer' }} onClick={() => handleSort('date')}>
                        Date{sortIcon('date')}
                      </TableHeaderCell>
                      <TableHeaderCell sx={{ cursor: 'pointer' }} onClick={() => handleSort('partyName')}>
                        Party{sortIcon('partyName')}
                      </TableHeaderCell>
                      <TableHeaderCell align="right">Items</TableHeaderCell>
                      <TableHeaderCell align="right" sx={{ cursor: 'pointer' }} onClick={() => handleSort('subtotal')}>
                        Subtotal{sortIcon('subtotal')}
                      </TableHeaderCell>
                      <TableHeaderCell align="right" sx={{ cursor: 'pointer' }} onClick={() => handleSort('discount')}>
                        Discount{sortIcon('discount')}
                      </TableHeaderCell>
                      <TableHeaderCell align="right" sx={{ cursor: 'pointer' }} onClick={() => handleSort('total')}>
                        Total{sortIcon('total')}
                      </TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredInvoices.length === 0 ? (
                      <EmptyState colSpan={7} message="No invoices match your filters" icon={<ReceiptIcon />} />
                    ) : (
                      filteredInvoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((inv) => (
                        <TableRow key={inv.id} hover>
                          <TableCell>
                            <Typography fontWeight={700} variant="body2">{inv.invoiceNumber}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{inv.date}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{inv.partyName}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip label={inv.items.length} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                          </TableCell>
                          <TableCell align="right"><Typography variant="body2" fontWeight={600}>{formatINR(inv.subtotal)}</Typography></TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ color: inv.discount > 0 ? theme.palette.error.main : 'inherit', fontWeight: inv.discount > 0 ? 700 : 400 }}>
                              {inv.discount > 0 ? `-${formatINR(inv.discount)}` : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={800} color="primary.main">{formatINR(inv.total)}</Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </TabPanel>
        </CardContent>
      </StyledCard>
    </Box>
  );
}
