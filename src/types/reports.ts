

export interface StockReport {
  productId: string;
  productName: string;
  hsnCode: string;
  category: string;
  currentStock: number;
  stockValue: number;
  reorderPoint: number;
  maxStockLevel: number;
  minStockLevel: number;
  averageCost: number;
  lastPurchasePrice: number;
  lastSalePrice: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
  daysOfStock: number;
  turnoverRatio: number;
  totalSales: number;
  totalPurchases: number;
}

export interface DataQualityReport {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  incompleteProductInfo: number;
  dataInconsistencies: number;
  issues: Array<{
    type: 'incomplete_invoice' | 'incomplete_item' | 'incomplete_product' | 'data_inconsistency';
    record: string;
    description: string;
    suggestedFix: string;
  }>;
}

export interface SalesDataQuality {
  invoiceId: string;
  invoiceNumber: string;
  issues: string[];
  severity: 'low' | 'medium' | 'high';
  autoFixable: boolean;
  suggestedActions: string[];
}

export interface GSTReportSummary {
  period: string;
  totalSales: number;
  totalPurchases: number;
  outputTax: {
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
  };
  inputTax: {
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
  };
  netTaxLiability: number;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  hsnCodes?: string[];
  categories?: string[];
  productIds?: string[];
  minAmount?: number;
  maxAmount?: number;
  gstRates?: number[];
  includeServices?: boolean;
  includeProducts?: boolean;
}

// Profit & Loss Report Types
export interface ProfitLossReportData {
  revenue: {
    totalSales: number;
    salesCount: number;
    averageOrderValue: number;
    salesByMonth: MonthlyData[];
    topSellingProducts: ProductSalesData[];
  };
  
  costs: {
    totalPurchases: number;
    purchaseCount: number;
    averagePurchaseValue: number;
    purchasesByMonth: MonthlyData[];
    costOfGoodsSold: number;
  };
  
  expenses: {
    operatingExpenses: number;
    otherExpenses: number;
    totalExpenses: number;
    expensesByCategory: ExpenseCategory[];
  };
  
  profitability: {
    grossProfit: number;
    grossProfitMargin: number;
    netProfit: number;
    netProfitMargin: number;
    operatingProfit: number;
    operatingProfitMargin: number;
  };
  
  summary: {
    totalRevenue: number;
    totalCosts: number;
    totalExpenses: number;
    netIncome: number;
    profitMargin: number;
  };
}

export interface MonthlyData {
  month: string;
  year: number;
  amount: number;
  count: number;
}

export interface ProductSalesData {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
}

export interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface ProfitLossFilters {
  startDate: string;
  endDate: string;
  includeExpenses?: boolean;
  groupBy?: 'month' | 'quarter' | 'year';
  compareWithPrevious?: boolean;
}

export interface ProfitLossComparison {
  current: ProfitLossReportData;
  previous: ProfitLossReportData;
  growth: {
    revenueGrowth: number;
    profitGrowth: number;
    marginImprovement: number;
  };
}

export interface CashFlowData {
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  cashFlowByMonth: MonthlyData[];
}

export interface FinancialRatios {
  profitability: {
    grossProfitMargin: number;
    netProfitMargin: number;
    returnOnAssets: number;
    returnOnEquity: number;
  };
  
  efficiency: {
    assetTurnover: number;
    inventoryTurnover: number;
    receivablesTurnover: number;
  };
  
  liquidity: {
    currentRatio: number;
    quickRatio: number;
    cashRatio: number;
  };
}