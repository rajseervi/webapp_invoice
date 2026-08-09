export interface Product {
  id?: string;
  name: string;
  description?: string;
  categoryId: string;
  categoryName?: string;
  price: number; // Keep for backward compatibility (will be same as salePrice)
  purchasePrice: number; // Cost price at which product is bought
  salePrice: number; // Price at which product is sold
  quantity: number;
  unitOfMeasurement: string;
  isService: boolean;
  isActive: boolean;
  reorderPoint?: number;
  maxStockLevel?: number;
  minStockLevel?: number;
  barcode?: string;
  sku?: string;
  brand?: string;
  model?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  images?: string[];
  tags?: string[];
  discountedPrice?: number;
  // Profit calculation fields
  profitAmount?: number; // Calculated: salePrice - purchasePrice
  profitPercentage?: number; // Calculated: (profitAmount / purchasePrice) * 100
  marginPercentage?: number; // Calculated: (profitAmount / salePrice) * 100
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  userId?: string;
}

export interface Category {
  id?: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder?: number;
  image?: string;
  defaultDiscount?: number;
  defaultGstRate?: number;
  color?: string;
  icon?: string;
  tags?: string[];
  metadata?: {
    totalProducts?: number;
    totalValue?: number;
    averagePrice?: number;
    lastUpdated?: string;
  };
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  userId?: string;
}

export interface CategoryDiscount {
  id?: string;
  categoryId: string;
  categoryName?: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  isActive: boolean;
  startDate: string;
  endDate: string;
  description?: string;
  minQuantity?: number;
  maxQuantity?: number;
  applicableProducts?: string[];
  createdAt: string;
  createdBy?: string;
}

export interface CategoryHierarchy {
  id: string;
  name: string;
  level: number;
  path: string[];
  children: CategoryHierarchy[];
  productCount: number;
  totalValue: number;
}

export interface CategoryAnalytics {
  categoryId: string;
  categoryName: string;
  totalProducts: number;
  totalValue: number;
  averagePrice: number;
  topSellingProducts: Product[];
  salesTrend: {
    period: string;
    sales: number;
    quantity: number;
  }[];
  profitMargin: number;
  turnoverRate: number;
  seasonalTrends?: {
    month: string;
    sales: number;
  }[];
}

export interface StockMovement {
  id?: string;
  productId: string;
  productName: string;
  movementType: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  referenceType?: 'purchase' | 'sale' | 'adjustment' | 'return';
  referenceId?: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

export interface Supplier {
  id?: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  panNumber?: string;
  isActive: boolean;
  paymentTerms?: string;
  creditLimit?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id?: string;
  orderNumber: string;
  supplierId?: string;
  supplierName: string;
  supplierAddress?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  totalAmount: number;
  status: 'draft' | 'pending' | 'approved' | 'received' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface PurchaseOrderItem {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  unitOfMeasurement?: string;
}

export interface InventoryReport {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  topSellingProducts: Product[];
  categoryWiseStock: Array<{
    categoryId: string;
    categoryName: string;
    productCount: number;
    totalValue: number;
  }>;
  recentMovements: StockMovement[];
}