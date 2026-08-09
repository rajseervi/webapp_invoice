export interface SimplifiedInvoice {
  id?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  
  // Customer/Supplier Information
  customerId?: string;
  customerName?: string;
  customerAddress?: string;
  customerEmail?: string;
  customerPhone?: string;
  supplierId?: string;
  supplierName?: string;
  supplierAddress?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  
  // Invoice Items
  items: SimplifiedInvoiceItem[];
  
  // Financial Details
  subtotal: number;
  totalDiscount: number;
  transportCharges?: number;
  roundOffAmount: number;
  grandTotal: number;
  
  // Payment Information
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  paidAmount: number;
  balanceAmount: number;
  paymentTerms?: string;
  
  // Additional Information
  notes?: string;
  attachments?: string[];
  
  // System Fields
  type: 'sales' | 'purchase';
  status: 'draft' | 'confirmed' | 'cancelled';
  stockUpdated: boolean;
  
  // Audit Fields
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  
  // Validation Status
  validationStatus: 'pending' | 'validated' | 'failed';
  validationErrors?: string[];
  
  // Integration Fields
  transactionId?: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  
  // Analytics Fields
  customerCategory?: string;
  productCategories?: string[];
  salesChannel?: string;
  region?: string;
}

export interface SimplifiedInvoiceItem {
  id?: string;
  productId: string;
  productName: string;
  productCode?: string;
  description?: string;
  
  // Quantity and Pricing
  quantity: number;
  unitOfMeasurement: string;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  totalAmount: number;
  
  // Additional Fields
  isService: boolean;
  batchNumber?: string;
  expiryDate?: string;
  serialNumbers?: string[];
}

export interface InvoiceStatistics {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  thisMonthInvoices: number;
  thisMonthAmount: number;
  averageInvoiceValue: number;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalAmount: number;
    invoiceCount: number;
  }>;
  statusBreakdown: {
    draft: number;
    confirmed: number;
    cancelled: number;
  };
  paymentStatusBreakdown: {
    pending: number;
    partial: number;
    paid: number;
    overdue: number;
  };
}

export interface InvoiceFilters {
  type?: 'sales' | 'purchase';
  status?: string;
  paymentStatus?: string;
  customerId?: string;
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountFrom?: number;
  amountTo?: number;
  searchTerm?: string;
}