export interface CompanyInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  gstin?: string;
  website?: string;
  logo?: string;
  bankDetails?: CompanyBankDetails;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyBankDetails {
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branch?: string;
  upiId?: string;
}

export interface UserPreferences {
  defaultInvoiceTemplate: 'modern' | 'classic' | 'minimalist';
  defaultCurrency: string;
  defaultTaxRate: number;
  showProductImages: boolean;
  enableStockAlerts: boolean;
  stockAlertThreshold: number;
  // Printing preferences
  printing: PrintingPreferences;
}

export interface PrintingPreferences {
  defaultCopies: number;
  paperSize: 'A4' | 'A5' | 'Letter' | 'Thermal';
  orientation: 'portrait' | 'landscape';
  colorMode: 'color' | 'grayscale' | 'blackwhite';
  includeHeader: boolean;
  includeFooter: boolean;
  showWatermark: boolean;
  template: 'modern' | 'classic' | 'minimal' | 'thermal' | 'dualapp';
}

export interface StatisticsSettings {
  showRevenueStats: boolean;
  showProfitStats: boolean;
  showInventoryStats: boolean;
  showCustomerStats: boolean;
  dashboardTimeRange: '7days' | '30days' | '90days' | 'year' | 'all';
}