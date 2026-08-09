export interface EnhancedSupplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  contactPerson?: string;
  paymentTerms?: string;
  creditLimit?: number;
  currentBalance?: number;
  isActive: boolean;
  preferredProducts?: string[]; // Product IDs this supplier commonly supplies
  leadTime?: number; // Days
  minimumOrderValue?: number;
  discountPercentage?: number;
  bankDetails?: {
    accountNumber?: string;
    bankName?: string;
    ifscCode?: string;
    accountHolderName?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface EnhancedPurchaseItem {
  id?: string;
  productId: string;
  productName: string;
  productCode?: string;
  description?: string;
  category?: string;
  unit?: string;
  currentStock?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  
  // Purchase details
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  
  // Tax details
  gstRate?: number;
  gstAmount?: number;
  cessRate?: number;
  cessAmount?: number;
  finalAmount: number;
  
  // Purchase specific
  receivedQuantity?: number;
  pendingQuantity?: number;
  damageQuantity?: number;
  
  // Cost tracking
  lastPurchasePrice?: number;
  averagePurchasePrice?: number;
  
  // Quality control
  qualityStatus?: 'pending' | 'approved' | 'rejected' | 'partial';
  qualityNotes?: string;
  
  // Supplier specific
  supplierProductCode?: string;
  supplierMinOrderQty?: number;
  supplierLeadTime?: number;
}

export interface EnhancedPurchaseOrder {
  id: string;
  purchaseOrderNumber: string;
  referenceNumber?: string; // External PO reference
  date: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  
  // Supplier information
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierAddress?: string;
  supplierGstin?: string;
  supplierContactPerson?: string;
  
  // Items and pricing
  items: EnhancedPurchaseItem[];
  subtotal: number;
  totalGstAmount: number;
  totalCessAmount?: number;
  totalAmount: number;
  
  // Additional charges
  discount?: number;
  discountType?: 'amount' | 'percentage';
  shippingCharges?: number;
  otherCharges?: number;
  otherChargesDescription?: string;
  
  // Terms and conditions
  notes?: string;
  terms?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  
  // Status management
  status: 'draft' | 'pending' | 'approved' | 'partially_received' | 'received' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  
  // Workflow tracking
  approvedBy?: string;
  approvedDate?: string;
  receivedDate?: string;
  completedDate?: string;
  
  // Stock management
  stockUpdated: boolean;
  autoUpdateStock: boolean;
  
  // Financial tracking
  paidAmount?: number;
  dueAmount?: number;
  
  // System fields
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  userId: string;
  
  // Advanced features
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  department?: string;
  project?: string;
  costCenter?: string;
}

export interface PurchaseEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  type: 'purchase' | 'return' | 'adjustment';
  
  // Purchase order reference
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  
  // Supplier information
  supplierId: string;
  supplierName: string;
  supplierInvoiceNumber?: string;
  supplierInvoiceDate?: string;
  
  // Items received/entered
  items: Array<{
    productId: string;
    productName: string;
    orderedQuantity?: number;
    receivedQuantity: number;
    acceptedQuantity: number;
    rejectedQuantity: number;
    unitPrice: number;
    totalPrice: number;
    condition: 'good' | 'damaged' | 'partial';
    batchNumber?: string;
    expiryDate?: string;
    location?: string;
    notes?: string;
  }>;
  
  // Financial details
  totalAmount: number;
  taxAmount: number;
  
  // Quality control
  qualityChecked: boolean;
  qualityCheckedBy?: string;
  qualityCheckDate?: string;
  
  // Stock impact
  stockUpdated: boolean;
  stockUpdateDate?: string;
  stockUpdateBy?: string;
  
  // Status
  status: 'pending' | 'approved' | 'rejected';
  
  // System fields
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  userId: string;
}

export interface PurchaseEntryFilters {
  status?: 'all' | 'draft' | 'pending' | 'approved' | 'partially_received' | 'received' | 'cancelled';
  paymentStatus?: 'all' | 'pending' | 'partial' | 'paid' | 'overdue';
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
  priority?: string;
  department?: string;
  entryType?: 'all' | 'purchase' | 'return' | 'adjustment';
}

export interface EnhancedPurchaseStatistics {
  totalPurchases: number;
  totalAmount: number;
  pendingOrders: number;
  receivedOrders: number;
  totalSuppliers: number;
  averageOrderValue: number;
  
  // Enhanced statistics
  monthlyTrends: Array<{
    month: string;
    amount: number;
    orders: number;
    avgOrderValue: number;
  }>;
  
  supplierPerformance: Array<{
    supplierId: string;
    supplierName: string;
    totalAmount: number;
    orderCount: number;
    onTimeDelivery: number;
    qualityScore: number;
    avgLeadTime: number;
  }>;
  
  categoryWisePurchases: Array<{
    category: string;
    amount: number;
    quantity: number;
    percentage: number;
  }>;
  
  stockImpact: {
    totalItemsAdded: number;
    totalValueAdded: number;
    lowStockItemsReplenished: number;
    overStockItems: number;
  };
  
  financialMetrics: {
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    avgPaymentDays: number;
  };
}

// Configuration interfaces
export interface PurchaseWorkflowConfig {
  requireApproval: boolean;
  approvalThreshold: number;
  autoUpdateStock: boolean;
  requireQualityCheck: boolean;
  enableBarcodeScanning: boolean;
  enableBatchTracking: boolean;
  enableLocationTracking: boolean;
}

export interface PurchaseValidationRules {
  maxOrderValue?: number;
  requirePOForAmount?: number;
  validateSupplierCredit: boolean;
  checkStockLevels: boolean;
  enforceMinOrderQuantity: boolean;
}