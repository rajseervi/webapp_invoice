export interface InvoiceItem {
  name: string;
  price: number;
  quantity: number;
  discount: number;
  discountType?: 'none' | 'category' | 'product';
  finalPrice: number;
  productId: string;
  category?: string;
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
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  createdAt?: any;
  roundOff?: number;
  amountInWords?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
}