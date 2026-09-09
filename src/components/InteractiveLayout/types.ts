import type { ReactNode } from 'react';

// ── Navigation ──
export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: ReactNode;
  badge?: number;
  isNew?: boolean;
}

export interface NavSection {
  id: string;
  title: string;
  icon: ReactNode;
  items: NavItem[];
}

// ── Command palette ──
export interface CommandItem {
  id: string;
  label: string;
  group: 'Pages' | 'Actions';
  keywords: string[];
  icon: ReactNode;
  run: () => void;
}

// ── Dashboard data ──
export interface DashboardStats {
  totalSales: number;
  totalInvoices: number;
  pendingPayments: number;
  totalParties: number;
  totalProducts: number;
  monthlyGrowth: number;
  avgOrderValue: number;
  lowStock: number;
  outOfStock: number;
}

export interface TrendPoint {
  label: string;
  value: number;
}

export interface StatusSlice {
  id: string;
  label: string;
  value: number;
  color: string;
}

export interface ActivityEntry {
  id: string;
  kind: 'invoice' | 'payment' | 'party' | 'product';
  title: string;
  detail: string;
  minutesAgo: number;
  amount?: number;
  tone: 'success' | 'info' | 'warning';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  minutesAgo: number;
  read: boolean;
  tone: 'info' | 'success' | 'warning' | 'error';
}

export interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
}
