import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  endBefore,
  Timestamp 
} from 'firebase/firestore';
import { 
 
  StockReport, 
  DataQualityReport, 
  SalesDataQuality,
  GSTReportSummary,
  ReportFilters 
} from '@/types/reports';
import { Product } from '@/types/inventory';
import { Invoice } from '@/types/invoice';
import { PurchaseEntry } from '@/types/purchase';


export class ReportService {
  


  // Generate stock report
  static async generateStockReport(filters: ReportFilters = {}): Promise<StockReport[]> {
    try {
      const products = await this.getProductsData(filters);
      const salesData = await this.getSalesDataByProduct(filters);
      const purchaseData = await this.getPurchaseDataByProduct(filters);

      return products.map(product => {
        const sales = salesData.get(product.id || '') || { quantity: 0, value: 0 };
        const purchases = purchaseData.get(product.id || '') || { quantity: 0, value: 0 };
        
        const averageSalesPerDay = sales.quantity / 30; // Assuming 30 days
        const daysOfStock = averageSalesPerDay > 0 ? (product.quantity || 0) / averageSalesPerDay : 0;
        const turnoverRatio = (product.quantity || 0) > 0 ? sales.quantity / (product.quantity || 0) : 0;

        let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock' = 'in_stock';
        
        if ((product.quantity || 0) === 0) {
          stockStatus = 'out_of_stock';
        } else if ((product.quantity || 0) <= (product.reorderPoint || 0)) {
          stockStatus = 'low_stock';
        } else if ((product.quantity || 0) > (product.maxStockLevel || Infinity)) {
          stockStatus = 'overstock';
        }

        return {
          productId: product.id || '',
          productName: product.name,
          hsnCode: product.hsnCode || '',
          category: product.category || 'Uncategorized',
          currentStock: product.quantity || 0,
          stockValue: (product.quantity || 0) * (product.price || 0),
          reorderPoint: product.reorderPoint || 0,
          maxStockLevel: product.maxStockLevel || 0,
          minStockLevel: product.minStockLevel || 0,
          averageCost: purchases.quantity > 0 ? purchases.value / purchases.quantity : product.price || 0,
          lastPurchasePrice: product.price || 0, // This should come from last purchase
          lastSalePrice: product.price || 0, // This should come from last sale
          stockStatus,
          daysOfStock: Math.round(daysOfStock),
          turnoverRatio: Number(turnoverRatio.toFixed(2)),
          totalSales: sales.value,
          totalPurchases: purchases.value
        };
      }).sort((a, b) => b.stockValue - a.stockValue);
    } catch (error) {
      console.error('Error generating stock report:', error);
      throw error;
    }
  }

  // Generate data quality report
  static async generateDataQualityReport(): Promise<DataQualityReport> {
    try {
      const [invoices, products] = await Promise.all([
        this.getAllInvoices(),
        this.getAllProducts()
      ]);

      const issues: DataQualityReport['issues'] = [];
      let incompleteProductInfo = 0;

      // Check invoices for basic data quality
      invoices.forEach(invoice => {
        if (!invoice.invoiceNumber || !invoice.customerName) {
          issues.push({
            type: 'incomplete_invoice',
            record: `Invoice ${invoice.invoiceNumber || 'Unknown'}`,
            description: 'Missing essential invoice information',
            suggestedFix: 'Complete invoice number and customer information'
          });
        }

        invoice.items?.forEach(item => {
          if (!item.name || !item.quantity || !item.price) {
            issues.push({
              type: 'incomplete_item',
              record: `Invoice ${invoice.invoiceNumber} - Item ${item.name || 'Unknown'}`,
              description: 'Missing essential item information',
              suggestedFix: 'Complete item name, quantity, and price information'
            });
          }
        });
      });

      // Check products
      products.forEach(product => {
        if (!product.name || !product.description || !product.categoryId) {
          incompleteProductInfo++;
          issues.push({
            type: 'incomplete_product',
            record: `Product ${product.name}`,
            description: 'Missing essential product information',
            suggestedFix: 'Complete product name, description, and category information'
          });
        }
      });

      const totalRecords = invoices.length + products.length;
      const invalidRecords = issues.length;
      const validRecords = totalRecords - invalidRecords;

      return {
        totalRecords,
        validRecords,
        invalidRecords,
        incompleteProductInfo,
        dataInconsistencies: issues.filter(i => i.type === 'data_inconsistency').length,
        issues: issues.slice(0, 100) // Limit to first 100 issues
      };
    } catch (error) {
      console.error('Error generating data quality report:', error);
      throw error;
    }
  }

  // Generate GST compliance report
  static async generateGSTReport(period: string, filters: ReportFilters = {}): Promise<GSTReportSummary> {
    try {
      const hsnData = await this.generateHSNSummaryReport(filters);
      
      const totalSales = hsnData.reduce((sum, item) => sum + item.totalSales, 0);
      const totalPurchases = hsnData.reduce((sum, item) => sum + item.totalPurchases, 0);
      
      const outputTax = {
        cgst: hsnData.reduce((sum, item) => sum + item.totalCgst, 0),
        sgst: hsnData.reduce((sum, item) => sum + item.totalSgst, 0),
        igst: hsnData.reduce((sum, item) => sum + item.totalIgst, 0),
        total: 0
      };
      outputTax.total = outputTax.cgst + outputTax.sgst + outputTax.igst;

      // For input tax, we'd need purchase data with similar structure
      const inputTax = {
        cgst: 0, // This should come from purchase data
        sgst: 0,
        igst: 0,
        total: 0
      };

      const netTaxLiability = outputTax.total - inputTax.total;

      return {
        period,
        totalSales,
        totalPurchases,
        outputTax,
        inputTax,
        netTaxLiability,
        hsnWiseData: hsnData
      };
    } catch (error) {
      console.error('Error generating GST report:', error);
      throw error;
    }
  }

  // Helper methods


  private static async getInvoicesData(filters: ReportFilters): Promise<Invoice[]> {
    try {
      let q = query(collection(db, 'invoices'));
      
      if (filters.startDate || filters.endDate) {
        if (filters.startDate) {
          q = query(q, where('date', '>=', filters.startDate));
        }
        if (filters.endDate) {
          q = query(q, where('date', '<=', filters.endDate));
        }
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  private static async getPurchasesData(filters: ReportFilters): Promise<PurchaseEntry[]> {
    try {
      let q = query(collection(db, 'purchaseEntries'));
      
      if (filters.startDate || filters.endDate) {
        if (filters.startDate) {
          q = query(q, where('purchaseDate', '>=', filters.startDate));
        }
        if (filters.endDate) {
          q = query(q, where('purchaseDate', '<=', filters.endDate));
        }
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseEntry));
    } catch (error) {
      console.error('Error fetching purchases:', error);
      return [];
    }
  }

  private static async getProductsData(filters: ReportFilters): Promise<Product[]> {
    try {
      let q = query(collection(db, 'products'));
      
      if (filters.categories?.length) {
        q = query(q, where('categoryId', 'in', filters.categories));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  private static async getAllInvoices(): Promise<Invoice[]> {
    return this.getInvoicesData({});
  }

  private static async getAllProducts(): Promise<Product[]> {
    return this.getProductsData({});
  }

  private static async getSalesDataByProduct(filters: ReportFilters): Promise<Map<string, { quantity: number; value: number }>> {
    const invoices = await this.getInvoicesData(filters);
    const salesMap = new Map<string, { quantity: number; value: number }>();

    invoices.forEach(invoice => {
      invoice.items?.forEach(item => {
        const existing = salesMap.get(item.productId) || { quantity: 0, value: 0 };
        existing.quantity += item.quantity || 0;
        existing.value += item.finalPrice || 0;
        salesMap.set(item.productId, existing);
      });
    });

    return salesMap;
  }

  private static async getPurchaseDataByProduct(filters: ReportFilters): Promise<Map<string, { quantity: number; value: number }>> {
    const purchases = await this.getPurchasesData(filters);
    const purchaseMap = new Map<string, { quantity: number; value: number }>();

    purchases.forEach(purchase => {
      purchase.items?.forEach(item => {
        const existing = purchaseMap.get(item.productId) || { quantity: 0, value: 0 };
        existing.quantity += item.quantity || 0;
        existing.value += item.totalAmount || 0;
        purchaseMap.set(item.productId, existing);
      });
    });

    return purchaseMap;
  }
}

export default ReportService;