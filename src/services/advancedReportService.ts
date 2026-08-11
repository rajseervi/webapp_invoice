import { db } from '@/firebase/config';
import { collection, getDocs } from 'firebase/firestore';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ReportDateRange {
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
}

export interface NormalizedInvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  finalPrice: number;
  category: string;
  gstRate?: number;
  hsnCode?: string;
}

export interface NormalizedInvoice {
  id: string;
  invoiceNumber: string;
  date: string; // yyyy-MM-dd
  dateTime: number;
  partyId: string;
  partyName: string;
  items: NormalizedInvoiceItem[];
  subtotal: number;
  discount: number;
  transportCharges: number;
  total: number;
  totalTaxAmount: number;
  totalQuantity: number;
}

export type MovementType = 'in' | 'out' | 'adjustment';

export interface NormalizedStockMovement {
  id: string;
  productId: string;
  productName: string;
  movementType: MovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  referenceType?: string;
  referenceId?: string;
  createdAt: string;
  dateTime: number;
  createdBy?: string;
}

export interface NormalizedProduct {
  id: string;
  name: string;
  category: string;
  categoryId?: string;
  price: number;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  reorderPoint: number;
  minStockLevel: number;
  maxStockLevel: number;
  isService?: boolean;
  isActive?: boolean;
}

export interface NormalizedPurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
}

export interface NormalizedPurchaseOrder {
  id: string;
  purchaseOrderNumber: string;
  date: string;
  dateTime: number;
  supplierId: string;
  supplierName: string;
  items: NormalizedPurchaseItem[];
  subtotal: number;
  totalGstAmount: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
}

export interface DailyValue {
  date: string;
  value: number;
}

export interface MonthlyValue {
  month: string; // yyyy-MM
  label: string; // Mon yy
  value: number;
  count: number;
}

export interface CategoryValue {
  name: string;
  value: number;
}

export interface ProductSalesSummary {
  productId: string;
  productName: string;
  category: string;
  quantitySold: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

export interface PartySalesSummary {
  partyId: string;
  partyName: string;
  invoiceCount: number;
  revenue: number;
  quantity: number;
  lastInvoiceDate: string;
}

// ─── Date helpers ────────────────────────────────────────────────────────────

/** Converts Firestore Timestamp / Date / string / number to epoch ms. */
export function toTime(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value.getTime();
  if (typeof value === 'object' && typeof (value as any).toDate === 'function') {
    const d = (value as any).toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d.getTime() : null;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value as any);
    return isNaN(d.getTime()) ? null : d.getTime();
  }
  return null;
}

/** Converts any date-ish value to a yyyy-MM-dd string ('' when invalid). */
export function toISODateString(value: unknown): string {
  const time = toTime(value);
  if (time === null) return '';
  const d = new Date(time);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

/** True when dateTime falls inside range (inclusive). Undated records are excluded when a range is set. */
export function dateInRange(dateTime: number | null, range: ReportDateRange | null): boolean {
  if (!range || !range.startDate || !range.endDate) return true;
  if (dateTime === null) return false;
  const start = new Date(range.startDate + 'T00:00:00').getTime();
  const end = new Date(range.endDate + 'T23:59:59.999').getTime();
  return dateTime >= start && dateTime <= end;
}

/** Number of days spanned by a range (inclusive). */
export function rangeDays(range: ReportDateRange): number {
  const start = Date.parse(range.startDate + 'T00:00:00');
  const end = Date.parse(range.endDate + 'T00:00:00');
  if (isNaN(start) || isNaN(end) || end < start) return 0;
  return Math.round((end - start) / 86400000) + 1;
}

/** Returns the period of equal length immediately before the given range. */
export function previousPeriodRange(range: ReportDateRange): ReportDateRange {
  const days = rangeDays(range);
  const start = new Date(range.startDate + 'T00:00:00');
  const prevStart = new Date(start.getTime() - days * 86400000);
  const prevEnd = new Date(start.getTime() - 86400000);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
  return { startDate: fmt(prevStart), endDate: fmt(prevEnd) };
}

/** Percentage growth; returns 100 for current>0 & previous=0, 0 when both are 0. */
export function growthPercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(value || 0);
}

// ─── CSV export ──────────────────────────────────────────────────────────────

export function exportToCSV(filename: string, rows: Record<string, string | number | undefined>[]) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escapeCell = (value: string | number | undefined) => {
    const str = value === undefined || value === null ? '' : String(value);
    return `"${str.replace(/"/g, '""')}"`;
  };
  const lines = [headers.join(','), ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(','))];
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Safe number coercion ────────────────────────────────────────────────────

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

// ─── Fetchers & aggregations ─────────────────────────────────────────────────

export const AdvancedReportService = {
  /** Fetch and normalize products from the products collection. */
  async fetchProducts(): Promise<NormalizedProduct[]> {
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Unknown Product',
          category: data.categoryName || data.category || 'Uncategorized',
          categoryId: data.categoryId || '',
          price: toNumber(data.price ?? data.salePrice),
          purchasePrice: toNumber(data.purchasePrice),
          salePrice: toNumber(data.salePrice ?? data.price),
          quantity: toNumber(data.quantity ?? data.stock),
          reorderPoint: toNumber(data.reorderPoint, 5),
          minStockLevel: toNumber(data.minStockLevel, 5),
          maxStockLevel: toNumber(data.maxStockLevel, 100),
          isService: Boolean(data.isService),
          isActive: data.isActive !== false,
        };
      });
    } catch (error) {
      console.error('Error fetching products for reports:', error);
      return [];
    }
  },

  /** Fetch and normalize sales invoices. */
  async fetchInvoices(): Promise<NormalizedInvoice[]> {
    try {
      const snapshot = await getDocs(collection(db, 'invoices'));
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        const items: NormalizedInvoiceItem[] = (data.items || []).map((item: any) => ({
          productId: item.productId || '',
          productName: item.productName || item.name || item.description || 'Unknown',
          quantity: toNumber(item.quantity),
          price: toNumber(item.price),
          finalPrice: toNumber(item.finalPrice ?? (item.quantity || 0) * (item.price || 0)),
          category: item.category || 'Uncategorized',
          gstRate: item.gstRate,
          hsnCode: item.hsnCode || '',
        }));
        const dateTime = toTime(data.date ?? data.createdAt);
        return {
          id: doc.id,
          invoiceNumber: data.invoiceNumber || doc.id,
          date: toISODateString(data.date ?? data.createdAt),
          dateTime: dateTime ?? 0,
          partyId: data.partyId || '',
          partyName: data.partyName || data.customerName || 'Unknown',
          items,
          subtotal: toNumber(data.subtotal),
          discount: toNumber(data.discount),
          transportCharges: toNumber(data.transportCharges),
          total: toNumber(data.total ?? data.totalAmount),
          totalTaxAmount: toNumber(data.totalTaxAmount ?? data.totalTax),
          totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
        };
      });
    } catch (error) {
      console.error('Error fetching invoices for reports:', error);
      return [];
    }
  },

  /**
   * Fetch stock movements. Falls back to deriving movements from invoices
   * (sales => OUT) and purchase entries/orders (=> IN) when the
   * stock_movements collection is empty or unavailable.
   */
  async fetchStockMovements(): Promise<NormalizedStockMovement[]> {
    try {
      const snapshot = await getDocs(collection(db, 'stock_movements'));
      const direct: NormalizedStockMovement[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        const rawType = String(data.movementType || data.type || 'adjustment').toLowerCase();
        const movementType: MovementType =
          rawType === 'in' ? 'in' : rawType === 'out' ? 'out' : 'adjustment';
        const dateTime = toTime(data.createdAt ?? data.date ?? data.entryDate);
        return {
          id: doc.id,
          productId: data.productId || '',
          productName: data.productName || 'Unknown',
          movementType,
          quantity: Math.abs(toNumber(data.quantity)),
          previousQuantity: toNumber(data.previousQuantity ?? data.previousStock),
          newQuantity: toNumber(data.newQuantity ?? data.newStock),
          reason: data.reason || data.notes || '',
          referenceType: data.referenceType || data.type || '',
          referenceId: data.referenceId || data.referenceNumber || '',
          createdAt: dateTime ? new Date(dateTime).toISOString() : '',
          dateTime: dateTime ?? 0,
          createdBy: data.createdBy || data.userId || data.user || '',
        };
      });

      if (direct.length > 0) return direct;

      // Fallback: derive from invoices + purchases
      const derived: NormalizedStockMovement[] = [];
      const [invoices, entriesSnapshot, ordersSnapshot] = await Promise.all([
        this.fetchInvoices(),
        getDocs(collection(db, 'purchase_entries')).catch(() => null),
        getDocs(collection(db, 'enhanced_purchase_orders')).catch(() => null),
      ]);

      invoices.forEach((invoice) => {
        invoice.items.forEach((item) => {
          derived.push({
            id: `sale-${invoice.id}-${item.productId}`,
            productId: item.productId,
            productName: item.productName,
            movementType: 'out',
            quantity: item.quantity,
            previousQuantity: 0,
            newQuantity: 0,
            reason: `Sale to ${invoice.partyName}`,
            referenceType: 'sale',
            referenceId: invoice.invoiceNumber,
            createdAt: invoice.date,
            dateTime: invoice.dateTime,
            createdBy: '',
          });
        });
      });

      const pushEntries = (items: any[], tag: string) => {
        (items || []).forEach((item: any) => {
          const name = item.productName || item.name || 'Unknown';
          const qty = toNumber(
            item.receivedQuantity ?? item.acceptedQuantity ?? item.quantity
          );
          const dateTime = toTime(item.createdAt);
          if (qty > 0) {
            derived.push({
              id: `${tag}-${name}-${dateTime ?? Math.random()}`,
              productId: item.productId || '',
              productName: name,
              movementType: 'in',
              quantity: qty,
              previousQuantity: 0,
              newQuantity: 0,
              reason: `Purchase - ${tag}`,
              referenceType: 'purchase',
              referenceId: '',
              createdAt: dateTime ? new Date(dateTime).toISOString() : '',
              dateTime: dateTime ?? 0,
              createdBy: '',
            });
          }
        });
      };

      if (entriesSnapshot) {
        entriesSnapshot.docs.forEach((doc) => pushEntries(doc.data().items, doc.id));
      }
      if (ordersSnapshot) {
        ordersSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'received' || data.stockUpdated) {
            data.items?.forEach((item: any) => {
              const qty = toNumber(item.receivedQuantity ?? item.quantity);
              const dateTime = toTime(data.date ?? data.receivedDate ?? data.createdAt);
              if (qty > 0) {
                derived.push({
                  id: `${doc.id}-${item.productId || item.productName || ''}`,
                  productId: item.productId || '',
                  productName: item.productName || item.name || 'Unknown',
                  movementType: 'in',
                  quantity: qty,
                  previousQuantity: 0,
                  newQuantity: 0,
                  reason: `Purchase - ${data.purchaseOrderNumber || doc.id}`,
                  referenceType: 'purchase',
                  referenceId: data.purchaseOrderNumber || doc.id,
                  createdAt: dateTime ? new Date(dateTime).toISOString() : '',
                  dateTime: dateTime ?? 0,
                  createdBy: '',
                });
              }
            });
          }
        });
      }

      return derived;
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      return [];
    }
  },

  /** Fetch purchase orders from both purchase_orders and enhanced_purchase_orders. */
  async fetchPurchaseOrders(): Promise<NormalizedPurchaseOrder[]> {
    const collections = ['purchase_orders', 'enhanced_purchase_orders'];
    const results: NormalizedPurchaseOrder[] = [];

    await Promise.all(
      collections.map(async (name) => {
        try {
          const snapshot = await getDocs(collection(db, name));
          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const items: NormalizedPurchaseItem[] = (data.items || []).map((item: any) => ({
              productId: item.productId || '',
              productName: item.productName || item.name || 'Unknown',
              quantity: toNumber(item.quantity ?? item.receivedQuantity),
              unitPrice: toNumber(item.unitPrice ?? item.price),
              totalPrice: toNumber(item.totalPrice ?? item.totalAmount),
              category: item.category || '',
            }));
            const dateTime = toTime(data.date ?? data.createdAt);
            results.push({
              id: doc.id,
              purchaseOrderNumber: data.purchaseOrderNumber || data.orderNumber || doc.id,
              date: toISODateString(data.date ?? data.createdAt),
              dateTime: dateTime ?? 0,
              supplierId: data.supplierId || '',
              supplierName: data.supplierName || 'Unknown',
              items,
              subtotal: toNumber(data.subtotal),
              totalGstAmount: toNumber(data.totalGstAmount ?? data.taxAmount),
              totalAmount: toNumber(data.totalAmount, data.subtotal || 0),
              status: data.status || 'unknown',
              paymentStatus: data.paymentStatus || 'unknown',
            });
          });
        } catch (error) {
          console.error(`Error fetching ${name} for reports:`, error);
        }
      })
    );

    return results;
  },

  // ── Aggregations ──────────────────────────────────────────────────────────

  /** Daily revenue series from invoices (sorted ascending). */
  salesByDay(invoices: NormalizedInvoice[]): DailyValue[] {
    const map = new Map<string, number>();
    invoices.forEach((invoice) => {
      const key = invoice.date || 'N/A';
      map.set(key, (map.get(key) || 0) + invoice.total);
    });
    return Array.from(map.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  /** Monthly revenue + count series (last 12 months of available data). */
  salesByMonth(invoices: NormalizedInvoice[]): MonthlyValue[] {
    const map = new Map<string, { value: number; count: number }>();
    invoices.forEach((invoice) => {
      const key = invoice.date.substring(0, 7) || 'N/A';
      const existing = map.get(key) || { value: 0, count: 0 };
      existing.value += invoice.total;
      existing.count += 1;
      map.set(key, existing);
    });
    return Array.from(map.entries())
      .map(([month, data]) => ({
        month,
        label: formatMonthLabel(month),
        value: data.value,
        count: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  },

  /** Revenue grouped by product category. */
  revenueByCategory(invoices: NormalizedInvoice[]): CategoryValue[] {
    const map = new Map<string, number>();
    invoices.forEach((invoice) =>
      invoice.items.forEach((item) => {
        const category = item.category || 'Uncategorized';
        map.set(category, (map.get(category) || 0) + item.finalPrice);
      })
    );
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  },

  /** Products ranked by revenue with cost/profit/margin. */
  topProducts(invoices: NormalizedInvoice[], products: NormalizedProduct[]): ProductSalesSummary[] {
    const costMap = new Map<string, number>();
    products.forEach((product) => costMap.set(product.id, product.purchasePrice || product.price));

    const map = new Map<
      string,
      { productName: string; category: string; quantity: number; revenue: number }
    >();
    invoices.forEach((invoice) =>
      invoice.items.forEach((item) => {
        const existing = map.get(item.productId) || {
          productName: item.productName,
          category: item.category || 'Uncategorized',
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += item.quantity;
        existing.revenue += item.finalPrice;
        map.set(item.productId, existing);
      })
    );

    return Array.from(map.entries())
      .map(([productId, data]) => {
        const unitCost = costMap.get(productId) ?? 0;
        const cost = unitCost * data.quantity;
        const profit = data.revenue - cost;
        return {
          productId,
          productName: data.productName,
          category: data.category,
          quantitySold: data.quantity,
          revenue: data.revenue,
          cost,
          profit,
          margin: data.revenue > 0 ? (profit / data.revenue) * 100 : 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  },

  /** Parties ranked by revenue. */
  topParties(invoices: NormalizedInvoice[]): PartySalesSummary[] {
    const map = new Map<
      string,
      { partyName: string; invoiceCount: number; revenue: number; quantity: number; lastDate: string }
    >();
    invoices.forEach((invoice) => {
      const existing = map.get(invoice.partyId) || {
        partyName: invoice.partyName,
        invoiceCount: 0,
        revenue: 0,
        quantity: 0,
        lastDate: '',
      };
      existing.invoiceCount += 1;
      existing.revenue += invoice.total;
      existing.quantity += invoice.totalQuantity;
      if (invoice.date > existing.lastDate) existing.lastDate = invoice.date;
      map.set(invoice.partyId, existing);
    });
    return Array.from(map.entries())
      .map(([partyId, data]) => ({
        partyId,
        partyName: data.partyName,
        invoiceCount: data.invoiceCount,
        revenue: data.revenue,
        quantity: data.quantity,
        lastInvoiceDate: data.lastDate || 'Never',
      }))
      .sort((a, b) => b.revenue - a.revenue);
  },

  /** Daily in/out/adjustment quantity series. */
  stockMovementsByDay(movements: NormalizedStockMovement[]): Array<{
    date: string;
    in: number;
    out: number;
    adjustment: number;
  }> {
    const map = new Map<string, { in: number; out: number; adjustment: number }>();
    movements.forEach((movement) => {
      const key = movement.createdAt ? movement.createdAt.substring(0, 10) : 'N/A';
      const existing = map.get(key) || { in: 0, out: 0, adjustment: 0 };
      if (movement.movementType === 'in') existing.in += movement.quantity;
      else if (movement.movementType === 'out') existing.out += movement.quantity;
      else existing.adjustment += movement.quantity;
      map.set(key, existing);
    });
    return Array.from(map.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  /** Monthly purchase spend series. */
  purchasesByMonth(orders: NormalizedPurchaseOrder[]): MonthlyValue[] {
    const map = new Map<string, { value: number; count: number }>();
    orders.forEach((order) => {
      const key = order.date.substring(0, 7) || 'N/A';
      const existing = map.get(key) || { value: 0, count: 0 };
      existing.value += order.totalAmount;
      existing.count += 1;
      map.set(key, existing);
    });
    return Array.from(map.entries())
      .map(([month, data]) => ({
        month,
        label: formatMonthLabel(month),
        value: data.value,
        count: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  },

  /** Returns one of: current, previous, all (when previous == current). */
  sumByCategory(orders: NormalizedPurchaseOrder[]): CategoryValue[] {
    const map = new Map<string, number>();
    orders.forEach((order) =>
      order.items.forEach((item) => {
        const category = item.category || 'Uncategorized';
        map.set(category, (map.get(category) || 0) + item.totalPrice);
      })
    );
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  },
};

function formatMonthLabel(month: string): string {
  if (!month || month === 'N/A') return month;
  const [year, mon] = month.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const m = parseInt(mon, 10);
  return `${months[(m || 1) - 1]} ${year.slice(2)}`;
}

export default AdvancedReportService;
