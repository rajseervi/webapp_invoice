export interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  category: string;
  description?: string;
  sku?: string;
  reorderPoint?: number;
}

export interface Category {
  id?: string;
  name: string;
  description?: string;
  defaultDiscount: number;
  isActive: boolean;
}

export interface Product {
  id?: string;
  name: string;
  sku: string;
  categoryId: string;
  price: number;
  quantity: number;
  description?: string;
  reorderPoint: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryDiscount {
  categoryId: string;
  discount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}