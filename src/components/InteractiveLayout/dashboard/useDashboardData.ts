'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ActivityEntry,
  DashboardStats,
  InvoiceRow,
  StatusSlice,
  TrendPoint,
} from '../types';

export interface UseDashboardDataResult {
  stats: DashboardStats | null;
  trend: TrendPoint[];
  statusSlices: StatusSlice[];
  activity: ActivityEntry[];
  invoices: InvoiceRow[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => void;
  isDemo: boolean;
}

// ── Demo fallback data (used when API fails or returns empty) ──

const DEMO_STATS: DashboardStats = {
  totalSales: 2450000,
  totalInvoices: 324,
  pendingPayments: 450000,
  totalParties: 118,
  totalProducts: 245,
  monthlyGrowth: 12.5,
  avgOrderValue: 7562,
  lowStock: 5,
  outOfStock: 2,
};

function buildDemoTrend(): TrendPoint[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return {
      label: d.toLocaleString('en-IN', { month: 'short' }),
      value: Math.round(120000 + i * 18000 + Math.sin(i * 1.4) * 35000 + Math.random() * 12000),
    };
  });
}

function buildDemoStatus(): StatusSlice[] {
  return [
    { id: 'paid', label: 'Paid', value: 218, color: '#16a34a' },
    { id: 'pending', label: 'Pending', value: 78, color: '#d97706' },
    { id: 'overdue', label: 'Overdue', value: 28, color: '#dc2626' },
  ];
}

function buildDemoActivity(): ActivityEntry[] {
  const kinds: ActivityEntry['kind'][] = ['invoice', 'payment', 'party', 'product'];
  const titles: Record<ActivityEntry['kind'], string> = {
    invoice: 'Invoice created',
    payment: 'Payment received',
    party: 'New party added',
    product: 'Product updated',
  };
  const details: Record<ActivityEntry['kind'], string> = {
    invoice: 'INV-1042 · Sharma Traders',
    payment: '₹50,000 confirmed for INV-1042',
    party: 'Gupta Enterprises registered',
    product: 'Stock level updated for Steel Rods',
  };
  return Array.from({ length: 6 }, (_, i) => {
    const kind = kinds[i % kinds.length];
    return {
      id: `demo-act-${i}`,
      kind,
      title: titles[kind],
      detail: details[kind],
      minutesAgo: (i + 1) * 17 + 5,
      amount: kind === 'payment' || kind === 'invoice' ? 25000 + i * 7500 : undefined,
      tone: (kind === 'payment' ? 'success' : kind === 'invoice' ? 'info' : 'warning') as ActivityEntry['tone'],
    };
  });
}

function buildDemoInvoices(): InvoiceRow[] {
  const customers = ['Sharma Traders', 'Gupta Enterprises', 'Verma & Co', 'Patel Industries', 'Mehta Supplies', 'Kumar Exports'];
  const statuses = ['Paid', 'Pending', 'Paid', 'Overdue', 'Paid', 'Pending'];
  return Array.from({ length: 6 }, (_, i) => ({
    id: `demo-inv-${i}`,
    invoiceNumber: `INV-${1042 - i}`,
    customer: customers[i % customers.length],
    amount: 12500 + i * 9250,
    status: statuses[i % statuses.length],
    date: new Date(Date.now() - (i + 1) * 26 * 3600 * 1000).toISOString().split('T')[0],
  }));
}

// ── Helpers ──

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function monthLabel(offsetFromNow: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - offsetFromNow);
  return d.toLocaleString('en-IN', { month: 'short' });
}

/** Build a 12-month trend from the salesTrend API shape, falling back to zeros. */
function mapTrend(charts: Record<string, any> | undefined, totalSales: number): TrendPoint[] {
  const raw: any[] = Array.isArray(charts?.salesTrend) && charts.salesTrend.length > 0
    ? charts.salesTrend
    : Array.isArray(charts?.revenueTrend)
      ? charts.revenueTrend
      : [];

  if (raw.length > 0) {
    return raw.slice(-12).map((d, i) => ({
      label: String(d.label ?? d.month ?? monthLabel(11 - i)),
      value: toNum(d.value ?? d.sales ?? d.amount ?? d.revenue),
    }));
  }

  // No chart data: distribute totalSales evenly so the chart still renders
  const months = 12;
  const even = Math.round(totalSales / months);
  return Array.from({ length: months }, (_, i) => ({
    label: monthLabel(11 - i),
    value: i === months - 1 ? totalSales - even * (months - 1) : even,
  }));
}

function mapStatusSlices(metrics: Record<string, any>): StatusSlice[] {
  const paid = toNum(metrics?.invoices?.paid);
  const pending = toNum(metrics?.invoices?.pending);
  const overdue = toNum(metrics?.invoices?.overdue);
  return [
    { id: 'paid', label: 'Paid', value: paid, color: '#16a34a' },
    { id: 'pending', label: 'Pending', value: pending, color: '#d97706' },
    { id: 'overdue', label: 'Overdue', value: overdue, color: '#dc2626' },
  ];
}

function mapStats(overview: Record<string, any>): DashboardStats {
  const m = overview?.metrics ?? {};
  const totalSales = toNum(m?.revenue?.total);
  const totalInvoices = toNum(m?.invoices?.total);
  const avg = toNum(m?.invoices?.averageValue) || (totalInvoices > 0 ? Math.round(totalSales / totalInvoices) : 0);
  return {
    totalSales,
    totalInvoices,
    pendingPayments: toNum(m?.invoices?.pending) * avg || toNum(m?.invoices?.pending),
    totalParties: toNum(m?.customers?.total),
    totalProducts: toNum(m?.products?.total),
    monthlyGrowth: toNum(m?.revenue?.growth),
    avgOrderValue: avg,
    lowStock: toNum(m?.products?.lowStock),
    outOfStock: toNum(m?.products?.outOfStock),
  };
}

/** Derive activity feed from real API data (top spenders + insights), not random noise. */
function mapActivity(overview: Record<string, any>): ActivityEntry[] {
  const entries: ActivityEntry[] = [];

  const alerts: any[] = Array.isArray(overview?.alerts) ? overview.alerts : [];
  alerts.slice(0, 3).forEach((a, i) => {
    entries.push({
      id: `alert-${a.id ?? i}`,
      kind: a.id === 'out-of-stock' || a.id === 'low-stock' ? 'product' : 'invoice',
      title: a.title ?? 'Alert',
      detail: a.message ?? '',
      minutesAgo: 30 * (i + 1),
      tone: a.type === 'error' ? 'warning' : a.type === 'positive' ? 'success' : 'info',
    });
  });

  const topSpenders: any[] = Array.isArray(overview?.metrics?.customers?.topSpenders)
    ? overview.metrics.customers.topSpenders
    : [];
  topSpenders.slice(0, 3).forEach((c, i) => {
    entries.push({
      id: `spender-${c.id ?? i}`,
      kind: 'party',
      title: c.name ?? 'Top customer',
      detail: 'Top spender this period',
      minutesAgo: 120 * (i + 1),
      amount: toNum(c.revenue ?? c.totalSpent),
      tone: 'success',
    });
  });

  if (entries.length === 0) return buildDemoActivity();
  return entries.slice(0, 6);
}

function mapInvoices(payload: Record<string, any>): InvoiceRow[] {
  const rows: any[] = Array.isArray(payload?.data) ? payload.data : [];
  return rows.slice(0, 10).map((inv) => ({
    id: String(inv.id ?? inv.invoiceNumber),
    invoiceNumber: String(inv.invoiceNumber ?? `INV-${String(inv.id ?? '').slice(-4)}`),
    customer: String(inv.customer ?? 'Unknown'),
    amount: toNum(inv.amount),
    status: String(inv.status ?? 'Pending'),
    date: String(inv.date ?? ''),
  }));
}

// ── Hook ──

export function useDashboardData(): UseDashboardDataResult {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [statusSlices, setStatusSlices] = useState<StatusSlice[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Overview (stats + trend + status + activity) and recent invoices in parallel
      const [overviewRes, invoicesRes] = await Promise.all([
        fetch('/api/admin/dashboard?period=12months&section=overview'),
        fetch('/api/invoices/recent?limit=10'),
      ]);

      const overviewJson = await overviewRes.json();
      const invoicesJson = await invoicesRes.json();

      const overview = overviewJson?.data?.overview ?? {};
      const mappedStats = mapStats(overview);
      const mappedTrend = mapTrend(overview?.charts, mappedStats.totalSales);
      const mappedStatus = mapStatusSlices(overview?.metrics ?? {});
      const mappedActivity = mapActivity(overview);
      const mappedInvoices = mapInvoices(invoicesJson);

      if (!mountedRef.current) return;

      const overviewFailed = !overviewRes.ok || overviewJson?.fallback;
      const hasRealStats = mappedStats.totalInvoices > 0 || mappedStats.totalSales > 0;

      if (overviewFailed || !hasRealStats) {
        setStats(DEMO_STATS);
        setTrend(buildDemoTrend());
        setStatusSlices(buildDemoStatus());
        setActivity(buildDemoActivity());
        setIsDemo(true);
      } else {
        setStats(mappedStats);
        setTrend(mappedTrend);
        setStatusSlices(mappedStatus);
        setActivity(mappedActivity);
        setIsDemo(false);
      }

      setInvoices(mappedInvoices.length > 0 ? mappedInvoices : buildDemoInvoices());
    } catch (e: any) {
      if (!mountedRef.current) return;
      console.error('[useDashboardData] fetch failed:', e);
      setError(e?.message ?? 'Failed to load dashboard data');
      setStats(DEMO_STATS);
      setTrend(buildDemoTrend());
      setStatusSlices(buildDemoStatus());
      setActivity(buildDemoActivity());
      setInvoices(buildDemoInvoices());
      setIsDemo(true);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  return useMemo(
    () => ({ stats, trend, statusSlices, activity, invoices, loading, refreshing, error, refresh, isDemo }),
    [stats, trend, statusSlices, activity, invoices, loading, refreshing, error, refresh, isDemo],
  );
}
