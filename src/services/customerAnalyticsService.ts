import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { Party } from '@/types/party';
import { Invoice } from '@/types/invoice';

export interface TopCustomerAnalytics {
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  businessType: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  lastOrderDate: string;
  firstOrderDate: string;
  customerLifetime: number; // days
  totalProfit: number;
  profitMargin: number;
  orderFrequency: number; // orders per month
  paymentReliability: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  outstandingBalance: number;
  topProducts: Array<{
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    orders: number;
    revenue: number;
  }>;
  customerStatus: 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'New';
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface CustomerAnalyticsFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  businessType?: string;
  minRevenue?: number;
  maxRevenue?: number;
  customerStatus?: string;
  limit?: number;
}

export class CustomerAnalyticsService {
  
  static async getTopCustomers(filters: CustomerAnalyticsFilters = {}): Promise<TopCustomerAnalytics[]> {
    try {
      const [customers, invoices] = await Promise.all([
        this.getCustomers(filters),
        this.getInvoices(filters)
      ]);

      // Group invoices by customer
      const customerInvoiceMap = new Map<string, Invoice[]>();
      invoices.forEach(invoice => {
        const customerId = invoice.partyId || 'unknown';
        if (!customerInvoiceMap.has(customerId)) {
          customerInvoiceMap.set(customerId, []);
        }
        customerInvoiceMap.get(customerId)!.push(invoice);
      });

      // Calculate analytics for each customer
      const customerAnalytics: TopCustomerAnalytics[] = [];

      for (const customer of customers) {
        const customerInvoices = customerInvoiceMap.get(customer.id || '') || [];
        
        if (customerInvoices.length === 0) continue;

        const analytics = await this.calculateCustomerAnalytics(customer, customerInvoices);
        customerAnalytics.push(analytics);
      }

      // Sort by total revenue (descending) and apply limit
      return customerAnalytics
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, filters.limit || 50);

    } catch (error) {
      console.error('Error getting top customers:', error);
      throw error;
    }
  }

  private static async getCustomers(filters: CustomerAnalyticsFilters): Promise<Party[]> {
    try {
      const constraints = [
        where('businessType', 'in', ['Customer', 'B2C', 'B2B']),
        where('isActive', '==', true)
      ];

      if (filters.businessType) {
        constraints.push(where('businessType', '==', filters.businessType));
      }

      const q = query(
        collection(db, 'parties'),
        ...constraints,
        orderBy('name', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Party[];
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  }

  private static async getInvoices(filters: CustomerAnalyticsFilters): Promise<Invoice[]> {
    try {
      const constraints = [];

      if (filters.dateRange) {
        constraints.push(
          where('date', '>=', Timestamp.fromDate(filters.dateRange.start)),
          where('date', '<=', Timestamp.fromDate(filters.dateRange.end))
        );
      }

      const q = query(
        collection(db, 'invoices'),
        ...constraints,
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invoice[];
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  private static async calculateCustomerAnalytics(
    customer: Party, 
    invoices: Invoice[]
  ): Promise<TopCustomerAnalytics> {
    
    // Basic calculations
    const totalOrders = invoices.length;
    const totalRevenue = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    const totalProfit = invoices.reduce((sum, invoice) => {
      // Estimate profit as 30% of revenue (can be adjusted based on actual cost data)
      const estimatedProfit = (invoice.total || 0) * 0.3;
      return sum + estimatedProfit;
    }, 0);
    const averageOrderValue = totalRevenue / totalOrders || 0;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Date calculations
    const sortedInvoices = invoices.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const firstOrderDate = sortedInvoices[0]?.date || new Date().toISOString();
    const lastOrderDate = sortedInvoices[sortedInvoices.length - 1]?.date || new Date().toISOString();
    
    const customerLifetime = Math.ceil(
      (new Date(lastOrderDate).getTime() - new Date(firstOrderDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const orderFrequency = customerLifetime > 0 ? (totalOrders / (customerLifetime / 30)) : 0;

    // Product analysis
    const productMap = new Map<string, { quantity: number; revenue: number }>();
    invoices.forEach(invoice => {
      invoice.items?.forEach(item => {
        const productName = item.name || 'Unknown Product';
        if (!productMap.has(productName)) {
          productMap.set(productName, { quantity: 0, revenue: 0 });
        }
        const product = productMap.get(productName)!;
        product.quantity += item.quantity || 0;
        product.revenue += (item.quantity || 0) * (item.price || 0);
      });
    });

    const topProducts = Array.from(productMap.entries())
      .map(([productName, data]) => ({ productName, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Monthly trend analysis
    const monthlyMap = new Map<string, { orders: number; revenue: number }>();
    invoices.forEach(invoice => {
      const month = new Date(invoice.date).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { orders: 0, revenue: 0 });
      }
      const monthly = monthlyMap.get(month)!;
      monthly.orders += 1;
      monthly.revenue += invoice.total || 0;
    });

    const monthlyTrend = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months

    // Customer status determination
    let customerStatus: TopCustomerAnalytics['customerStatus'] = 'New';
    if (totalRevenue > 500000) customerStatus = 'Platinum';
    else if (totalRevenue > 200000) customerStatus = 'Gold';
    else if (totalRevenue > 50000) customerStatus = 'Silver';
    else if (totalRevenue > 10000) customerStatus = 'Bronze';

    // Payment reliability assessment
    const outstandingBalance = customer.outstandingBalance || 0;
    let paymentReliability: TopCustomerAnalytics['paymentReliability'] = 'Excellent';
    if (outstandingBalance > totalRevenue * 0.3) paymentReliability = 'Poor';
    else if (outstandingBalance > totalRevenue * 0.15) paymentReliability = 'Fair';
    else if (outstandingBalance > totalRevenue * 0.05) paymentReliability = 'Good';

    // Risk level assessment
    let riskLevel: TopCustomerAnalytics['riskLevel'] = 'Low';
    if (outstandingBalance > 100000 || paymentReliability === 'Poor') riskLevel = 'High';
    else if (outstandingBalance > 50000 || paymentReliability === 'Fair') riskLevel = 'Medium';

    return {
      customerId: customer.id || '',
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      businessType: customer.businessType,
      totalOrders,
      totalRevenue,
      averageOrderValue,
      lastOrderDate,
      firstOrderDate,
      customerLifetime,
      totalProfit,
      profitMargin,
      orderFrequency,
      paymentReliability,
      outstandingBalance,
      topProducts,
      monthlyTrend,
      customerStatus,
      riskLevel
    };
  }

  static async getCustomerGrowthTrend(): Promise<Array<{ month: string; newCustomers: number; totalRevenue: number }>> {
    try {
      const customers = await this.getCustomers({});
      const monthlyGrowth = new Map<string, { newCustomers: number; totalRevenue: number }>();

      customers.forEach(customer => {
        const month = customer.createdAt?.slice(0, 7) || new Date().toISOString().slice(0, 7);
        if (!monthlyGrowth.has(month)) {
          monthlyGrowth.set(month, { newCustomers: 0, totalRevenue: 0 });
        }
        monthlyGrowth.get(month)!.newCustomers += 1;
      });

      return Array.from(monthlyGrowth.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12);
    } catch (error) {
      console.error('Error getting customer growth trend:', error);
      return [];
    }
  }

  static async getCustomerSegmentAnalysis(): Promise<Array<{
    segment: string;
    count: number;
    totalRevenue: number;
    averageRevenue: number;
  }>> {
    try {
      const customers = await this.getTopCustomers({ limit: 1000 });
      
      const segments = {
        'Platinum (₹5L+)': customers.filter(c => c.totalRevenue >= 500000),
        'Gold (₹2L-5L)': customers.filter(c => c.totalRevenue >= 200000 && c.totalRevenue < 500000),
        'Silver (₹50K-2L)': customers.filter(c => c.totalRevenue >= 50000 && c.totalRevenue < 200000),
        'Bronze (₹10K-50K)': customers.filter(c => c.totalRevenue >= 10000 && c.totalRevenue < 50000),
        'New (<₹10K)': customers.filter(c => c.totalRevenue < 10000),
      };

      return Object.entries(segments).map(([segment, segmentCustomers]) => ({
        segment,
        count: segmentCustomers.length,
        totalRevenue: segmentCustomers.reduce((sum, c) => sum + c.totalRevenue, 0),
        averageRevenue: segmentCustomers.length > 0 
          ? segmentCustomers.reduce((sum, c) => sum + c.totalRevenue, 0) / segmentCustomers.length 
          : 0
      }));
    } catch (error) {
      console.error('Error getting customer segment analysis:', error);
      return [];
    }
  }
}