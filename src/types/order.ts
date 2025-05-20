export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  COMPLETED = 'completed'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  REFUNDED = 'refunded'
}

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  discountedPrice?: number;
  discount?: number;
  total: number;
}

export interface Order {
  id?: string;
  orderNumber: string;
  partyId: string;
  partyName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  notes?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  shippingAddress?: string;
  billingAddress?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type OrderFormData = Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>;