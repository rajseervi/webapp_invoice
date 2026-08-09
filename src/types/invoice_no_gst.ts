export interface Invoice {
  id?: string;
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  
  // Customer Information
  partyId?: string;
  partyName?: string;
  partyAddress?: string;
  partyEmail?: string;
  partyPhone?: string;
  
  // Invoice Items
  items: InvoiceItem[];
  
  // Financial Details
  subtotal: number;
  totalDiscount: number;
  totalAmount: number;
  
  // Payment Information
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  paidAmount: number;
  balanceAmount: number;
  paymentTerms?: string;
  
  // Additional Information
  notes?: string;
  attachments?: string[];
  dp?: number; // Dealer Profit/Discount amount total
  transportCharges?: number;
  roundOff?: number;
  
  // System Fields
  type: 'sales' | 'purchase';
  status: 'draft' | 'confirmed' | 'cancelled';
  stockUpdated?: boolean;
  
  // Audit Fields
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  userId?: string;
  
  // Integration Fields
  transactionId?: string;
}

export interface InvoiceItem {
  id?: string;
  productId: string | number;
  productName?: string;
  name: string;
  description?: string;
  
  // Quantity and Pricing
  quantity: number;
  unitOfMeasurement?: string;
  price: number;
  discount: number;
  discountType?: 'percentage' | 'fixed' | 'none';
  finalPrice: number;
  totalAmount: number;
  
  // Product Details
  category?: string;
  isService?: boolean;
  margin?: number; // Dealer Profit/Discount percent per item
  
  // Additional Fields
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
