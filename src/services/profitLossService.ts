import { db } from '@/config/firebase';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import PurchaseInvoiceServiceNoGST from './purchaseInvoiceServiceNoGST';
import EnhancedInvoiceService from './enhancedInvoiceService';

export interface ProfitLossData {
  revenue: {
    totalSales: number;
    salesCount: number;
    averageSaleValue: number;
  };
  costs: {
    totalPurchases: number;
    purchaseCount: number;
    averagePurchaseValue: number;
    operatingExpenses: number;
  };
  profit: {
    grossProfit: number;
    grossProfitMargin: number;
    netProfit: number;
    netProfitMargin: number;
  };
  breakdown: {
    salesByMonth: Array<{
      month: string;
      sales: number;
      purchases: number;
      profit: number;
    }>;
    topProducts: Array<{
      productId: string;
      productName: string;
      salesAmount: number;
      purchaseAmount: number;
      profit: number;
      margin: number;
    }>;
    topSuppliers: Array<{
      supplierId: string;
      supplierName: string;
      totalPurchases: number;
      invoiceCount: number;
    }>;
    topCustomers: Array<{
      customerId: string;
      customerName: string;
      totalSales: number;
      invoiceCount: number;
    }>;
  };
}

export interface ProfitLossFilters {
  dateFrom: string;
  dateTo: string;
  productIds?: string[];
  supplierIds?: string[];
  customerIds?: string[];
}

export class ProfitLossService {
  /**
   * Generate comprehensive profit and loss report
   */
  static async generateProfitLossReport(filters: ProfitLossFilters): Promise<ProfitLossData> {
    try {
      const { dateFrom, dateTo } = filters;
      
      // Fetch sales data
      const salesData = await this.getSalesData(dateFrom, dateTo, filters);
      
      // Fetch purchase data
      const purchaseData = await this.getPurchaseData(dateFrom, dateTo, filters);
      
      // Calculate profit metrics
      const grossProfit = salesData.totalSales - purchaseData.totalPurchases;
      const grossProfitMargin = salesData.totalSales > 0 ? (grossProfit / salesData.totalSales) * 100 : 0;
      
      // For now, operating expenses are 0 - this can be enhanced later
      const operatingExpenses = 0;
      const netProfit = grossProfit - operatingExpenses;
      const netProfitMargin = salesData.totalSales > 0 ? (netProfit / salesData.totalSales) * 100 : 0;
      
      // Generate monthly breakdown
      const monthlyBreakdown = await this.getMonthlyBreakdown(dateFrom, dateTo);
      
      // Get top performing products
      const topProducts = await this.getTopProducts(dateFrom, dateTo);
      
      // Get top suppliers and customers
      const topSuppliers = await this.getTopSuppliers(dateFrom, dateTo);
      const topCustomers = await this.getTopCustomers(dateFrom, dateTo);
      
      return {
        revenue: {
          totalSales: salesData.totalSales,
          salesCount: salesData.salesCount,
          averageSaleValue: salesData.salesCount > 0 ? salesData.totalSales / salesData.salesCount : 0
        },
        costs: {
          totalPurchases: purchaseData.totalPurchases,
          purchaseCount: purchaseData.purchaseCount,
          averagePurchaseValue: purchaseData.purchaseCount > 0 ? purchaseData.totalPurchases / purchaseData.purchaseCount : 0,
          operatingExpenses
        },
        profit: {
          grossProfit,
          grossProfitMargin,
          netProfit,
          netProfitMargin
        },
        breakdown: {
          salesByMonth: monthlyBreakdown,
          topProducts,
          topSuppliers,
          topCustomers
        }
      };
    } catch (error) {
      console.error('Error generating profit and loss report:', error);
      throw new Error('Failed to generate profit and loss report');
    }
  }

  /**
   * Get sales data for the specified period
   */
  private static async getSalesData(dateFrom: string, dateTo: string, filters: ProfitLossFilters) {
    try {
      // Get all sales invoices using EnhancedInvoiceService
      const salesResult = await EnhancedInvoiceService.getInvoices({
        type: 'sales',
        status: 'confirmed',
        dateFrom: dateFrom,
        dateTo: dateTo
      }, 1000);

      let totalSales = 0;
      let salesCount = 0;

      salesResult.invoices.forEach(invoice => {
        if (invoice.status === 'confirmed') {
          totalSales += invoice.grandTotal || 0;
          salesCount++;
        }
      });

      return {
        totalSales,
        salesCount
      };
    } catch (error) {
      console.error('Error fetching sales data:', error);
      return { totalSales: 0, salesCount: 0 };
    }
  }

  /**
   * Get purchase data for the specified period
   */
  private static async getPurchaseData(dateFrom: string, dateTo: string, filters: ProfitLossFilters) {
    try {
      const purchaseInvoices = await PurchaseInvoiceServiceNoGST.getPurchaseInvoices(
        { startDate: dateFrom, endDate: dateTo },
        { field: 'purchaseDate', direction: 'desc' },
        { page: 0, limit: 1000 }
      );

      let totalPurchases = 0;
      let purchaseCount = 0;

      purchaseInvoices.invoices.forEach(invoice => {
        totalPurchases += invoice.finalAmount || 0;
        purchaseCount++;
      });

      return {
        totalPurchases,
        purchaseCount
      };
    } catch (error) {
      console.error('Error fetching purchase data:', error);
      return { totalPurchases: 0, purchaseCount: 0 };
    }
  }

  /**
   * Get monthly breakdown of sales, purchases, and profit
   */
  private static async getMonthlyBreakdown(dateFrom: string, dateTo: string) {
    try {
      const startDate = new Date(dateFrom);
      const endDate = new Date(dateTo);
      const monthlyData: Array<{
        month: string;
        sales: number;
        purchases: number;
        profit: number;
      }> = [];

      // Generate monthly data
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        // Get sales for this month
        const salesData = await this.getSalesData(
          monthStart.toISOString().split('T')[0],
          monthEnd.toISOString().split('T')[0],
          { dateFrom: '', dateTo: '' }
        );
        
        // Get purchases for this month
        const purchaseData = await this.getPurchaseData(
          monthStart.toISOString().split('T')[0],
          monthEnd.toISOString().split('T')[0],
          { dateFrom: '', dateTo: '' }
        );
        
        monthlyData.push({
          month: monthKey,
          sales: salesData.totalSales,
          purchases: purchaseData.totalPurchases,
          profit: salesData.totalSales - purchaseData.totalPurchases
        });
        
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      return monthlyData;
    } catch (error) {
      console.error('Error generating monthly breakdown:', error);
      return [];
    }
  }

  /**
   * Get top performing products by profit
   */
  private static async getTopProducts(dateFrom: string, dateTo: string) {
    try {
      // This is a simplified version - in a real implementation,
      // you would need to track product-level sales and purchases
      const productMap = new Map();
      
      // Get sales invoices and aggregate by product
      const salesResult = await EnhancedInvoiceService.getInvoices({
        type: 'sales',
        status: 'confirmed',
        dateFrom: dateFrom,
        dateTo: dateTo
      }, 1000);

      salesResult.invoices.forEach(invoice => {
        invoice.items?.forEach(item => {
          const existing = productMap.get(item.productId) || {
            productId: item.productId,
            productName: item.productName,
            salesAmount: 0,
            purchaseAmount: 0,
            profit: 0,
            margin: 0
          };
          existing.salesAmount += item.totalAmount || 0;
          productMap.set(item.productId, existing);
        });
      });

      // Get purchase invoices and aggregate by product
      const purchaseInvoices = await PurchaseInvoiceServiceNoGST.getPurchaseInvoices(
        { startDate: dateFrom, endDate: dateTo },
        { field: 'purchaseDate', direction: 'desc' },
        { page: 0, limit: 1000 }
      );

      purchaseInvoices.invoices.forEach(invoice => {
        invoice.items?.forEach(item => {
          const existing = productMap.get(item.productId) || {
            productId: item.productId,
            productName: item.productName,
            salesAmount: 0,
            purchaseAmount: 0,
            profit: 0,
            margin: 0
          };
          existing.purchaseAmount += item.totalAmount || 0;
          productMap.set(item.productId, existing);
        });
      });

      // Calculate profit and margin for each product
      const topProducts = Array.from(productMap.values()).map(product => ({
        ...product,
        profit: product.salesAmount - product.purchaseAmount,
        margin: product.salesAmount > 0 ? ((product.salesAmount - product.purchaseAmount) / product.salesAmount) * 100 : 0
      }));

      return topProducts
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 10);
    } catch (error) {
      console.error('Error getting top products:', error);
      return [];
    }
  }

  /**
   * Get top suppliers by purchase volume
   */
  private static async getTopSuppliers(dateFrom: string, dateTo: string) {
    try {
      const purchaseInvoices = await PurchaseInvoiceServiceNoGST.getPurchaseInvoices(
        { startDate: dateFrom, endDate: dateTo },
        { field: 'purchaseDate', direction: 'desc' },
        { page: 0, limit: 1000 }
      );

      const supplierMap = new Map();
      
      purchaseInvoices.invoices.forEach(invoice => {
        const supplierId = invoice.supplierId || invoice.supplierName;
        const existing = supplierMap.get(supplierId) || {
          supplierId,
          supplierName: invoice.supplierName,
          totalPurchases: 0,
          invoiceCount: 0
        };
        existing.totalPurchases += invoice.finalAmount;
        existing.invoiceCount++;
        supplierMap.set(supplierId, existing);
      });

      return Array.from(supplierMap.values())
        .sort((a, b) => b.totalPurchases - a.totalPurchases)
        .slice(0, 10);
    } catch (error) {
      console.error('Error getting top suppliers:', error);
      return [];
    }
  }

  /**
   * Get top customers by sales volume
   */
  private static async getTopCustomers(dateFrom: string, dateTo: string) {
    try {
      const salesResult = await EnhancedInvoiceService.getInvoices({
        type: 'sales',
        status: 'confirmed',
        dateFrom: dateFrom,
        dateTo: dateTo
      }, 1000);

      const customerMap = new Map();
      
      salesResult.invoices.forEach(invoice => {
        const customerId = invoice.customerId || invoice.customerName || 'Unknown';
        const existing = customerMap.get(customerId) || {
          customerId,
          customerName: invoice.customerName || 'Unknown Customer',
          totalSales: 0,
          invoiceCount: 0
        };
        existing.totalSales += invoice.grandTotal || 0;
        existing.invoiceCount++;
        customerMap.set(customerId, existing);
      });

      return Array.from(customerMap.values())
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 10);
    } catch (error) {
      console.error('Error getting top customers:', error);
      return [];
    }
  }

  /**
   * Get profit and loss summary for dashboard
   */
  static async getProfitLossSummary(period: 'today' | 'week' | 'month' | 'year' = 'month') {
    try {
      const now = new Date();
      let dateFrom: string;
      let dateTo: string = now.toISOString().split('T')[0];

      switch (period) {
        case 'today':
          dateFrom = dateTo;
          break;
        case 'week':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - 7);
          dateFrom = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFrom = monthStart.toISOString().split('T')[0];
          break;
        case 'year':
          const yearStart = new Date(now.getFullYear(), 0, 1);
          dateFrom = yearStart.toISOString().split('T')[0];
          break;
        default:
          const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFrom = defaultStart.toISOString().split('T')[0];
      }

      const report = await this.generateProfitLossReport({ dateFrom, dateTo });
      
      return {
        totalRevenue: report.revenue.totalSales,
        totalCosts: report.costs.totalPurchases,
        grossProfit: report.profit.grossProfit,
        grossProfitMargin: report.profit.grossProfitMargin,
        netProfit: report.profit.netProfit,
        netProfitMargin: report.profit.netProfitMargin,
        period
      };
    } catch (error) {
      console.error('Error getting profit and loss summary:', error);
      return {
        totalRevenue: 0,
        totalCosts: 0,
        grossProfit: 0,
        grossProfitMargin: 0,
        netProfit: 0,
        netProfitMargin: 0,
        period
      };
    }
  }
}