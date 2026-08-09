export interface InvoiceItem {
  name: string;
  price: number;
  quantity: number;
  discount: number;
  discountType?: 'none' | 'category' | 'product';
  finalPrice: number;
  productId: string;
  productName?: string;
  category?: string;
  margin?: number; // Dealer Profit/Discount percent per item
  // GST fields
  gstRate?: number;
  hsnCode?: string;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  taxableAmount?: number;
  totalTaxAmount?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  partyId: string;
  partyName: string;
  partyAddress?: string;
  partyEmail?: string;
  partyPhone?: string;
  partyGstin?: string;
  partyStateCode?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  createdAt?: any;
  updatedAt?: any;
  roundOff?: number;
  transportCharges?: number;
  amountInWords?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLogoUrl?: string;
  companyGstin?: string;
  companyStateCode?: string;
  dp?: number; // Dealer Profit/Discount amount total
  // GST totals
  totalCgst?: number;
  totalSgst?: number;
  totalIgst?: number;
  totalTaxableAmount?: number;
  totalTaxAmount?: number;
  totalAmount?: number;
  isGstInvoice?: boolean;
  placeOfSupply?: string;
  type?: 'sales' | 'purchase';
  stockUpdated?: boolean;
  userId?: string;
}

export interface GstSettings {
  companyGstin: string;
  companyStateCode: string;
  companyStateName: string;
  enableGst: boolean;
  defaultGstRate: number;
}