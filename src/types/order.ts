export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'completed' | 'cancelled';

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  discount: number;
  discountType?: 'none' | 'category' | 'product';
  finalPrice: number;
  productId: string;
  category?: string;
}

export interface Order {
  id?: string;
  orderNumber: string;
  orderDate: string;
  dueDate?: string;
  partyName: string;
  partyId?: string;
  partyAddress?: string;
  partyPhone?: string;
  partyEmail?: string;
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  total: number;
  status: OrderStatus;
  notes?: string;
  terms?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  companyDetails?: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
  };
}
