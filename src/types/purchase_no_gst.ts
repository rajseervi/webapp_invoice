export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  paymentTerms?: string;
  creditLimit?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface PurchaseInvoiceItem {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountType?: 'percentage' | 'amount';
  discountValue?: number;
  discountAmount?: number;
  unitOfMeasurement: string;
  totalAmount: number;
}

export interface PurchaseInvoice {
  id?: string;
  invoiceNumber: string;
  supplierInvoiceNumber: string;
  supplierId?: string;
  supplierName: string;
  supplierAddress?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  purchaseDate: string;
  dueDate?: string;
  items: PurchaseInvoiceItem[];
  subtotal: number;
  totalDiscountAmount: number;
  totalAmount: number;
  roundOffAmount: number;
  finalAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  paidAmount: number;
  balanceAmount: number;
  paymentMethod?: string;
  notes?: string;
  stockUpdated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PurchasePayment {
  id?: string;
  purchaseInvoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'bank' | 'cheque' | 'upi' | 'card';
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface PurchaseInvoiceFilters {
  supplierId?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  amountFrom?: number;
  amountTo?: number;
  searchTerm?: string;
}

export interface PurchaseInvoiceStatistics {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  thisMonthInvoices: number;
  thisMonthAmount: number;
  averageInvoiceValue: number;
  topSuppliers: Array<{
    supplierId: string;
    supplierName: string;
    totalAmount: number;
    invoiceCount: number;
  }>;
  paymentStatusBreakdown: {
    pending: number;
    partial: number;
    paid: number;
    overdue: number;
  };
  pendingInvoices?: number;
}

export interface PurchaseItem {
  id?: string;
  productId: string;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  finalAmount: number;
  category?: string;
  unit?: string;
}

export interface PurchaseOrder {
  id: string;
  purchaseOrderNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierAddress?: string;
  items: PurchaseItem[];
  subtotal: number;
  totalAmount: number;
  discount?: number;
  shippingCharges?: number;
  otherCharges?: number;
  notes?: string;
  terms?: string;
  status: 'draft' | 'pending' | 'approved' | 'received' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid';
  receivedDate?: string;
  stockUpdated: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  userId: string;
}

export interface PurchaseReceipt {
  id: string;
  purchaseOrderId: string;
  receiptNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  items: Array<{
    productId: string;
    productName: string;
    orderedQuantity: number;
    receivedQuantity: number;
    unitPrice: number;
    totalPrice: number;
    condition: 'good' | 'damaged' | 'partial';
    notes?: string;
  }>;
  totalAmount: number;
  status: 'complete' | 'partial' | 'pending';
  stockUpdated: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  userId: string;
}

export interface PurchaseFilters {
  status?: 'all' | 'draft' | 'pending' | 'approved' | 'received' | 'cancelled';
  paymentStatus?: 'all' | 'pending' | 'partial' | 'paid';
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

export interface PurchaseStatistics {
  totalPurchases: number;
  totalAmount: number;
  pendingOrders: number;
  receivedOrders: number;
  totalSuppliers: number;
  averageOrderValue: number;
  monthlyPurchases: Array<{
    month: string;
    amount: number;
    orders: number;
  }>;
  topSuppliers: Array<{
    supplierId: string;
    supplierName: string;
    totalAmount: number;
    orderCount: number;
  }>;
}