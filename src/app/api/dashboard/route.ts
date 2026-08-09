import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  getCountFromServer 
} from 'firebase/firestore';

// Aggregation imports — use dynamic import to avoid client/server conflicts
interface AggregatedStats {
  products: { total: number; active: number; inactive: number; lowStock: number; totalValue: number; lastUpdated: string; };
  parties: { total: number; active: number; totalOutstanding: number; totalCreditLimit: number; lastUpdated: string; };
  invoices: { total: number; totalRevenue: number; thisMonthRevenue: number; thisMonthCount: number; lastUpdated: string; };
  metadata: { updatedAt: string; version: number; };
}

interface DashboardStats {
  monthlyRevenue: {
    current: number;
    previous: number;
    growth: number;
  };
  totalOrders: {
    count: number;
    growth: number;
  };
  activeProducts: {
    count: number;
    lowStock: number;
  };
  activeParties: {
    count: number;
    recent: number;
  };
  averageOrderValue: number;
  conversionRate: number;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  topProducts: Array<{ id: string; name: string; sales: number; revenue: number }>;
  topParties: Array<{ id: string; name: string; orders: number; totalSpent: number }>;
}

/**
 * OPTIMIZED Dashboard API — uses parallel reads + limits to reduce Firestore costs.
 * 
 * BEFORE (expensive): Read 1000+ invoices, all products, all parties = 1500+ doc reads
 * AFTER (optimized):  Read 200 recent invoices + counted stats = ~200 doc reads
 * SAVINGS: ~85% reduction in reads per dashboard load
 */

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Dashboard API: Fetching optimized dashboard data...');
    
    // Calculate date ranges
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // --- OPTIMIZATION: Parallel queries with limits ---
    // Instead of reading 1000 invoices, only fetch recent ones for computation
    // Counts use getCountFromServer (free) instead of reading documents

    const [
      recentInvoicesResult,
      prevMonthInvoicesResult,
      totalsResult,
    ] = await Promise.allSettled([
      // Recent invoices for current month + display (limit 200 instead of 1000)
      getDocs(query(
        collection(db, 'invoices'),
        orderBy('createdAt', 'desc'),
        limit(200)
      )),
      // Previous month invoices for comparison
      getDocs(query(
        collection(db, 'invoices'),
        where('createdAt', '>=', previousMonthStart.toISOString()),
        where('createdAt', '<=', previousMonthEnd.toISOString()),
        limit(200)
      )),
      // Use getCountFromServer for counts (free operation!)
      Promise.all([
        getCountFromServer(query(collection(db, 'invoices'))),
        getCountFromServer(query(collection(db, 'products'), where('isActive', '==', true))),
        getCountFromServer(query(
          collection(db, 'products'),
          where('isActive', '==', true),
          where('quantity', '<=', 10)
        )),
        getCountFromServer(query(collection(db, 'parties'), where('isActive', '==', true))),
        getDocs(query(
          collection(db, 'parties'),
          where('createdAt', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
          limit(100)
        )),
      ]),
    ]);

    // Extract data with fallbacks
    const recentInvoices = recentInvoicesResult.status === 'fulfilled' 
      ? recentInvoicesResult.value.docs 
      : [];
    
    const prevMonthInvoices = prevMonthInvoicesResult.status === 'fulfilled'
      ? prevMonthInvoicesResult.value.docs
      : [];

    // Parse totals (each uses getCountFromServer = 0 document reads)
    let totalInvoiceCount = 0;
    let activeProductCount = 0;
    let lowStockProductCount = 0;
    let activePartyCount = 0;
    let recentPartyCount = 0;

    if (totalsResult.status === 'fulfilled') {
      const [invoiceCountSnap, activeProductSnap, lowStockSnap, activePartySnap, recentPartySnap] = totalsResult.value;
      totalInvoiceCount = invoiceCountSnap.data().count;
      activeProductCount = activeProductSnap.data().count;
      lowStockProductCount = lowStockSnap.data().count;
      activePartyCount = activePartySnap.data().count;
      recentPartyCount = recentPartySnap.docs.length;
    }

    console.log('Counts:', {
      invoices: totalInvoiceCount,
      activeProducts: activeProductCount,
      lowStock: lowStockProductCount,
      activeParties: activePartyCount,
      recentParties: recentPartyCount,
    });

    // Filter current month invoices (client-side from limited set)
    const currentInvoices = recentInvoices.filter(doc => {
      const data = doc.data();
      const createdAt = data.createdAt;
      if (!createdAt) return false;
      const date = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
      return date >= currentMonthStart;
    });

    console.log('Invoices found:', {
      current: currentInvoices.length,
      previous: prevMonthInvoices.length,
      recentTotal: recentInvoices.length,
    });

    // Calculate revenue
    const getAmount = (doc: any): number => {
      const data = doc.data?.() || doc;
      const amount = data.totalAmount || data.total || data.amount || data.grandTotal || 0;
      return typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    };

    const currentMonthRevenue = currentInvoices.reduce((sum, doc) => sum + getAmount(doc), 0);
    const previousMonthRevenue = prevMonthInvoices.reduce((sum, doc) => sum + getAmount(doc), 0);

    // Calculate growth
    const revenueGrowth = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : currentMonthRevenue > 0 ? 100 : 0;

    const ordersGrowth = prevMonthInvoices.length > 0 
      ? ((currentInvoices.length - prevMonthInvoices.length) / prevMonthInvoices.length) * 100 
      : currentInvoices.length > 0 ? 100 : 0;

    const averageOrderValue = currentInvoices.length > 0 
      ? Math.round(currentMonthRevenue / currentInvoices.length)
      : 0;

    // Revenue by month (last 6 months from the limited dataset)
    const revenueByMonth: Array<{ month: string; revenue: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthRevenue = recentInvoices
        .filter(doc => {
          const data = doc.data();
          const createdAt = data.createdAt;
          if (!createdAt) return false;
          const date = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
          return date >= monthDate && date <= monthEnd;
        })
        .reduce((sum, doc) => sum + getAmount(doc), 0);
      
      revenueByMonth.push({
        month: monthDate.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        revenue: Math.round(monthRevenue)
      });
    }

    // Top products by revenue (from current month invoices only)
    const productMap = new Map<string, { name: string; sales: number; revenue: number }>();
    currentInvoices.forEach(doc => {
      const items = doc.data().items || [];
      items.forEach((item: any) => {
        const productId = item.productId || item.id || 'unknown';
        const productName = item.productName || item.name || 'Unknown';
        const quantity = item.quantity || 0;
        const price = item.price || item.rate || 0;
        const itemRevenue = quantity * price;
        
        if (productMap.has(productId)) {
          const existing = productMap.get(productId)!;
          existing.sales += quantity;
          existing.revenue += itemRevenue;
        } else {
          productMap.set(productId, { name: productName, sales: quantity, revenue: itemRevenue });
        }
      });
    });

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((p, i) => ({ id: `product-${i}`, ...p, revenue: Math.round(p.revenue) }));

    // Top parties by spending
    const partiesMap = new Map<string, { name: string; orders: number; totalSpent: number }>();
    currentInvoices.forEach(doc => {
      const data = doc.data();
      const partyName = data.partyName || data.customerName || 'Unknown';
      const partyId = data.partyId || partyName;
      const amount = getAmount(doc);
      
      if (partiesMap.has(partyId)) {
        const existing = partiesMap.get(partyId)!;
        existing.orders += 1;
        existing.totalSpent += amount;
      } else {
        partiesMap.set(partyId, { name: partyName, orders: 1, totalSpent: amount });
      }
    });

    const topParties = Array.from(partiesMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)
      .map((p, i) => ({ id: `party-${i}`, ...p, totalSpent: Math.round(p.totalSpent) }));

    const stats: DashboardStats = {
      monthlyRevenue: {
        current: Math.round(currentMonthRevenue),
        previous: Math.round(previousMonthRevenue),
        growth: Math.round(revenueGrowth * 100) / 100
      },
      totalOrders: {
        count: currentInvoices.length,
        growth: Math.round(ordersGrowth * 100) / 100
      },
      activeProducts: {
        count: activeProductCount,
        lowStock: lowStockProductCount
      },
      activeParties: {
        count: activePartyCount,
        recent: recentPartyCount
      },
      averageOrderValue,
      conversionRate: 0,
      revenueByMonth,
      topProducts,
      topParties
    };

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
      metadata: {
        ops: 'optimized-v2',
        readsSaved: `${totalInvoiceCount - recentInvoices.length}+ documents skipped`,
      }
    });

  } catch (error: any) {
    console.error('❌ Dashboard API Error:', error);
    
    const fallbackStats: DashboardStats = {
      monthlyRevenue: { current: 0, previous: 0, growth: 0 },
      totalOrders: { count: 0, growth: 0 },
      activeProducts: { count: 0, lowStock: 0 },
      activeParties: { count: 0, recent: 0 },
      averageOrderValue: 0,
      conversionRate: 0,
      revenueByMonth: [],
      topProducts: [],
      topParties: []
    };

    return NextResponse.json({
      success: false,
      data: fallbackStats,
      error: 'Failed to fetch dashboard data',
      details: error.message,
      fallback: true
    }, { status: 200 });
  }
}
