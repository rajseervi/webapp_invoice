export enum OrderStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  PICKING = 'picking',
  PACKED = 'packed',
  SHIPPED = 'shipped',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  REFUNDED = 'refunded',
  COMPLETED = 'completed'
}

export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  PARTIAL = 'partial',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed'
}

export enum OrderPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum DeliveryMethod {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OVERNIGHT = 'overnight',
  PICKUP = 'pickup',
  SAME_DAY = 'same_day'
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
  notes?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  notes?: string;
  updatedBy?: string;
}

export interface DeliverySchedule {
  preferredDate?: string;
  preferredTimeSlot?: string;
  deliveryInstructions?: string;
  method: DeliveryMethod;
}

export interface PaymentDetails {
  method?: string;
  transactionId?: string;
  gateway?: string;
  paidAmount?: number;
  paidAt?: string;
  dueDate?: string;
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
  priority: OrderPriority;
  
  // Address information
  shippingAddress?: Address;
  billingAddress?: Address;
  sameAsBilling?: boolean;
  
  // Payment information
  paymentDetails?: PaymentDetails;
  
  // Delivery information
  deliverySchedule?: DeliverySchedule;
  trackingNumber?: string;
  estimatedDelivery?: string;
  
  // Workflow
  requiresApproval?: boolean;
  approvedBy?: string;
  approvedAt?: string;
  
  // Timestamps and history
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  statusHistory?: OrderStatusHistory[];
  
  // Template and recurring
  isTemplate?: boolean;
  templateName?: string;
  parentOrderId?: string;
  
  // Additional metadata
  source?: string; // web, mobile, api, etc.
  tags?: string[];
  internalNotes?: string;
}

export type OrderFormData = Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>;