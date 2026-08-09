export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  contactPerson?: string;
  paymentTerms?: string;
  creditLimit?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface PurchaseItem {
  id?: string;
  productId: string;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  gstRate?: number;
  gstAmount?: number;
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
  supplierGstin?: string;
  items: PurchaseItem[];
  subtotal: number;
  totalGstAmount: number;
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