export interface CompanyInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  gstin?: string;
  website?: string;
  logo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserPreferences {
  defaultInvoiceTemplate: 'modern' | 'classic' | 'minimalist';
  defaultCurrency: string;
  defaultTaxRate: number;
  showProductImages: boolean;
  enableStockAlerts: boolean;
  stockAlertThreshold: number;
}

export interface StatisticsSettings {
  showRevenueStats: boolean;
  showProfitStats: boolean;
  showInventoryStats: boolean;
  showCustomerStats: boolean;
  dashboardTimeRange: '7days' | '30days' | '90days' | 'year' | 'all';
}