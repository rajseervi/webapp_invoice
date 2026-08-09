import { db } from '../firebase/config';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { GstCalculator } from './gstService';
import { productService } from './productService';
import { ledgerService, LedgerAccount, LedgerTransaction } from './ledgerService';

export interface EnhancedPurchaseOrderItem {
  id?: string;
  productId: string;
  productName: string;
  hsnCode?: string;
  quantity: number;
  unitPrice: number; // Price excluding GST
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  totalAmount: number; // Including GST
  unitOfMeasurement?: string;
  description?: string;
  discount?: number;
  discountType?: 'percentage' | 'amount';
}

export interface EnhancedPurchaseOrder {
  id?: string;
  orderNumber: string;
  supplierId?: string;
  supplierName: string;
  supplierGstin?: string;
  supplierAddress?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  supplierLedgerAccountId?: string; // Link to ledger account
  orderDate: string;
  expectedDeliveryDate?: string;
  items: EnhancedPurchaseOrderItem[];
  subtotal: number; // Total excluding GST
  totalDiscount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTaxAmount: number;
  totalAmount: number; // Including GST
  status: 'draft' | 'pending' | 'approved' | 'received' | 'cancelled' | 'partially_received';
  notes?: string;
  terms?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  companyStateCode?: string;
  supplierStateCode?: string;
  isInterState?: boolean;
  // Ledger integration fields
  ledgerTransactionId?: string;
  isLedgerPosted: boolean;
  paymentStatus: 'pending' | 'partial' | 'paid';
  paidAmount: number;
  balanceAmount: number;
}

export interface EnhancedPurchaseEntry {
  id?: string;
  purchaseOrderId: string;
  entryNumber: string;
  entryDate: string;
  items: EnhancedPurchaseOrderItem[];
  totalAmount: number;
  status: 'completed' | 'partial';
  stockUpdated: boolean;
  ledgerTransactionId?: string;
  isLedgerPosted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface SupplierLedgerAccount extends LedgerAccount {
  supplierId?: string;
  supplierDetails: {
    contactPerson?: string;
    businessType?: string;
    paymentTerms?: string;
    creditLimit?: number;
    creditDays?: number;
  };
}

export class EnhancedPurchaseOrderService {
  private static readonly COLLECTION_NAME = 'enhanced_purchase_orders';
  private static readonly ENTRIES_COLLECTION_NAME = 'enhanced_purchase_entries';

  // Generate order number with better format
  static generateOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getTime()).slice(-6);
    return `PO-${year}${month}${day}-${time}`;
  }

  // Generate entry number
  static generateEntryNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getTime()).slice(-6);
    return `PE-${year}${month}${day}-${time}`;
  }

  // Create or get supplier ledger account
  static async createOrGetSupplierLedgerAccount(supplierData: {
    supplierName: string;
    supplierGstin?: string;
    supplierAddress?: string;
    supplierPhone?: string;
    supplierEmail?: string;
    supplierStateCode?: string;
    creditLimit?: number;
    creditDays?: number;
  }): Promise<string> {
    try {
      // Check if supplier ledger account already exists
      const existingAccounts = await ledgerService.getAccounts({
        accountType: 'supplier',
        search: supplierData.supplierName
      });

      const existingAccount = existingAccounts.find(
        account => account.accountName.toLowerCase() === supplierData.supplierName.toLowerCase()
      );

      if (existingAccount) {
        return existingAccount.id!;
      }

      // Create new supplier ledger account
      const accountData: Omit<LedgerAccount, 'id' | 'createdAt' | 'updatedAt'> = {
        accountCode: '', // Will be auto-generated
        accountName: supplierData.supplierName,
        accountType: 'supplier',
        isGstApplicable: !!supplierData.supplierGstin,
        gstNumber: supplierData.supplierGstin,
        address: supplierData.supplierAddress,
        phone: supplierData.supplierPhone,
        email: supplierData.supplierEmail,
        creditLimit: supplierData.creditLimit || 0,
        creditDays: supplierData.creditDays || 30,
        openingBalance: 0,
        currentBalance: 0,
        debitBalance: 0,
        creditBalance: 0,
        isActive: true
      };

      return await ledgerService.createAccount(accountData);
    } catch (error) {
      console.error('Error creating supplier ledger account:', error);
      throw error;
    }
  }

  // Calculate GST for purchase order items with discount
  static calculateItemGst(
    item: Omit<EnhancedPurchaseOrderItem, 'cgstAmount' | 'sgstAmount' | 'igstAmount' | 'totalTaxAmount' | 'totalAmount'>,
    isInterState: boolean
  ): EnhancedPurchaseOrderItem {
    let taxableAmount = item.unitPrice * item.quantity;
    
    // Apply discount
    if (item.discount && item.discount > 0) {
      if (item.discountType === 'percentage') {
        taxableAmount = taxableAmount * (1 - item.discount / 100);
      } else {
        taxableAmount = taxableAmount - item.discount;
      }
    }

    const gstCalc = GstCalculator.calculateGst(taxableAmount, item.gstRate, isInterState);

    return {
      ...item,
      cgstAmount: gstCalc.cgstAmount,
      sgstAmount: gstCalc.sgstAmount,
      igstAmount: gstCalc.igstAmount,
      totalTaxAmount: gstCalc.totalTaxAmount,
      totalAmount: taxableAmount + gstCalc.totalTaxAmount
    };
  }

  // Calculate purchase order totals with discount
  static calculateOrderTotals(items: EnhancedPurchaseOrderItem[]): {
    subtotal: number;
    totalDiscount: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalTaxAmount: number;
    totalAmount: number;
  } {
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const totalDiscount = items.reduce((sum, item) => {
      if (item.discount && item.discount > 0) {
        if (item.discountType === 'percentage') {
          return sum + (item.unitPrice * item.quantity * item.discount / 100);
        } else {
          return sum + item.discount;
        }
      }
      return sum;
    }, 0);
    
    const totalCgst = items.reduce((sum, item) => sum + item.cgstAmount, 0);
    const totalSgst = items.reduce((sum, item) => sum + item.sgstAmount, 0);
    const totalIgst = items.reduce((sum, item) => sum + item.igstAmount, 0);
    const totalTaxAmount = totalCgst + totalSgst + totalIgst;
    const totalAmount = subtotal - totalDiscount + totalTaxAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      totalCgst: Math.round(totalCgst * 100) / 100,
      totalSgst: Math.round(totalSgst * 100) / 100,
      totalIgst: Math.round(totalIgst * 100) / 100,
      totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100
    };
  }

  // Create purchase order with ledger integration
  static async createPurchaseOrder(orderData: Omit<EnhancedPurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date().toISOString();
      
      // Create or get supplier ledger account
      const supplierLedgerAccountId = await this.createOrGetSupplierLedgerAccount({
        supplierName: orderData.supplierName,
        supplierGstin: orderData.supplierGstin,
        supplierAddress: orderData.supplierAddress,
        supplierPhone: orderData.supplierPhone,
        supplierEmail: orderData.supplierEmail,
        supplierStateCode: orderData.supplierStateCode
      });
      
      // Determine if inter-state transaction
      const isInterState = orderData.companyStateCode !== orderData.supplierStateCode;
      
      // Calculate GST for each item
      const itemsWithGst = orderData.items.map(item => 
        this.calculateItemGst(item, isInterState)
      );
      
      // Calculate totals
      const totals = this.calculateOrderTotals(itemsWithGst);
      
      const purchaseOrder: Omit<EnhancedPurchaseOrder, 'id'> = {
        ...orderData,
        items: itemsWithGst,
        ...totals,
        supplierLedgerAccountId,
        isInterState,
        isLedgerPosted: false,
        paymentStatus: 'pending',
        paidAmount: 0,
        balanceAmount: totals.totalAmount,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), purchaseOrder);
      
      // Create ledger transaction if order is approved
      if (orderData.status === 'approved') {
        await this.createLedgerTransaction(docRef.id, purchaseOrder);
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating enhanced purchase order:', error);
      throw error;
    }
  }

  // Create ledger transaction for purchase order
  private static async createLedgerTransaction(
    orderId: string,
    orderData: Omit<EnhancedPurchaseOrder, 'id'>
  ): Promise<string> {
    try {
      if (!orderData.supplierLedgerAccountId) {
        throw new Error('Supplier ledger account not found');
      }

      const transactionData: Omit<LedgerTransaction, 'id'> = {
        transactionNumber: await this.generateTransactionNumber(),
        transactionDate: orderData.orderDate,
        accountId: orderData.supplierLedgerAccountId,
        accountName: orderData.supplierName,
        description: `Purchase Order - ${orderData.orderNumber}`,
        referenceNumber: orderData.orderNumber,
        referenceType: 'purchase_order',
        referenceId: orderId,
        debitAmount: 0,
        creditAmount: orderData.totalAmount, // Credit to supplier (liability)
        runningBalance: 0, // Will be calculated by ledger service
        gstDetails: {
          gstAmount: orderData.totalTaxAmount,
          cgstAmount: orderData.totalCgst,
          sgstAmount: orderData.totalSgst,
          igstAmount: orderData.totalIgst,
          gstRate: this.calculateAverageGstRate(orderData.items),
          isInterState: orderData.isInterState || false
        },
        isReconciled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const transactionId = await ledgerService.createTransaction(transactionData);
      
      // Update purchase order with ledger transaction ID
      await updateDoc(doc(db, this.COLLECTION_NAME, orderId), {
        ledgerTransactionId: transactionId,
        isLedgerPosted: true,
        updatedAt: new Date().toISOString()
      });

      return transactionId;
    } catch (error) {
      console.error('Error creating ledger transaction:', error);
      throw error;
    }
  }

  // Calculate average GST rate for the order
  private static calculateAverageGstRate(items: EnhancedPurchaseOrderItem[]): number {
    if (items.length === 0) return 0;
    
    const totalTaxableAmount = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const totalGstAmount = items.reduce((sum, item) => sum + item.totalTaxAmount, 0);
    
    return totalTaxableAmount > 0 ? (totalGstAmount / totalTaxableAmount) * 100 : 0;
  }

  // Generate transaction number
  private static async generateTransactionNumber(): Promise<string> {
    const now = new Date();
    const datePrefix = `TXN${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const time = String(now.getTime()).slice(-6);
    return `${datePrefix}${time}`;
  }

  // Get all purchase orders
  static async getPurchaseOrders(filters?: {
    status?: string;
    supplierId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<EnhancedPurchaseOrder[]> {
    try {
      let q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      let orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EnhancedPurchaseOrder[];

      // Apply filters
      if (filters?.status) {
        orders = orders.filter(order => order.status === filters.status);
      }

      if (filters?.supplierId) {
        orders = orders.filter(order => order.supplierId === filters.supplierId);
      }

      if (filters?.startDate) {
        orders = orders.filter(order => order.orderDate >= filters.startDate!);
      }

      if (filters?.endDate) {
        orders = orders.filter(order => order.orderDate <= filters.endDate!);
      }

      return orders;
    } catch (error) {
      console.error('Error fetching enhanced purchase orders:', error);
      return [];
    }
  }

  // Get purchase order by ID
  static async getPurchaseOrderById(orderId: string): Promise<EnhancedPurchaseOrder | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, orderId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as EnhancedPurchaseOrder;
    } catch (error) {
      console.error('Error fetching enhanced purchase order:', error);
      return null;
    }
  }

  // Update purchase order
  static async updatePurchaseOrder(orderId: string, updates: Partial<EnhancedPurchaseOrder>): Promise<void> {
    try {
      const now = new Date().toISOString();
      const orderRef = doc(db, this.COLLECTION_NAME, orderId);
      
      // If items are being updated, recalculate totals
      if (updates.items) {
        const order = await this.getPurchaseOrderById(orderId);
        if (order) {
          const isInterState = order.isInterState || false;
          const itemsWithGst = updates.items.map(item => 
            this.calculateItemGst(item, isInterState)
          );
          const totals = this.calculateOrderTotals(itemsWithGst);
          
          updates = {
            ...updates,
            items: itemsWithGst,
            ...totals,
            balanceAmount: totals.totalAmount - (order.paidAmount || 0)
          };
        }
      }
      
      // If status is being changed to approved, create ledger transaction
      if (updates.status === 'approved') {
        const order = await this.getPurchaseOrderById(orderId);
        if (order && !order.isLedgerPosted) {
          await this.createLedgerTransaction(orderId, order);
        }
      }
      
      await updateDoc(orderRef, {
        ...updates,
        updatedAt: now
      });
    } catch (error) {
      console.error('Error updating enhanced purchase order:', error);
      throw error;
    }
  }

  // Record payment against purchase order
  static async recordPayment(
    orderId: string,
    paymentAmount: number,
    paymentDate: string,
    paymentMethod: string,
    notes?: string
  ): Promise<void> {
    try {
      const order = await this.getPurchaseOrderById(orderId);
      if (!order) {
        throw new Error('Purchase order not found');
      }

      if (!order.supplierLedgerAccountId) {
        throw new Error('Supplier ledger account not found');
      }

      const newPaidAmount = (order.paidAmount || 0) + paymentAmount;
      const newBalanceAmount = order.totalAmount - newPaidAmount;
      
      let paymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
      if (newPaidAmount >= order.totalAmount) {
        paymentStatus = 'paid';
      } else if (newPaidAmount > 0) {
        paymentStatus = 'partial';
      }

      // Create payment ledger transaction
      const paymentTransaction: Omit<LedgerTransaction, 'id'> = {
        transactionNumber: await this.generateTransactionNumber(),
        transactionDate: paymentDate,
        accountId: order.supplierLedgerAccountId,
        accountName: order.supplierName,
        description: `Payment for PO ${order.orderNumber} - ${paymentMethod}`,
        referenceNumber: order.orderNumber,
        referenceType: 'payment',
        referenceId: orderId,
        debitAmount: paymentAmount, // Debit to supplier (reducing liability)
        creditAmount: 0,
        runningBalance: 0, // Will be calculated by ledger service
        isReconciled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await ledgerService.createTransaction(paymentTransaction);

      // Update purchase order
      await updateDoc(doc(db, this.COLLECTION_NAME, orderId), {
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        paymentStatus,
        updatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  }

  // Get supplier ledger accounts
  static async getSupplierLedgerAccounts(): Promise<LedgerAccount[]> {
    try {
      return await ledgerService.getAccounts({
        accountType: 'supplier',
        isActive: true
      });
    } catch (error) {
      console.error('Error fetching supplier ledger accounts:', error);
      return [];
    }
  }

  // Get purchase order summary
  static async getPurchaseOrderSummary(): Promise<{
    totalOrders: number;
    totalAmount: number;
    pendingOrders: number;
    pendingAmount: number;
    receivedOrders: number;
    receivedAmount: number;
    outstandingPayments: number;
  }> {
    try {
      const orders = await this.getPurchaseOrders();
      
      const totalOrders = orders.length;
      const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      const pendingOrders = orders.filter(order => 
        ['draft', 'pending', 'approved'].includes(order.status)
      );
      const pendingAmount = pendingOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      const receivedOrders = orders.filter(order => 
        ['received', 'partially_received'].includes(order.status)
      );
      const receivedAmount = receivedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      const outstandingPayments = orders.reduce((sum, order) => sum + (order.balanceAmount || 0), 0);

      return {
        totalOrders,
        totalAmount,
        pendingOrders: pendingOrders.length,
        pendingAmount,
        receivedOrders: receivedOrders.length,
        receivedAmount,
        outstandingPayments
      };
    } catch (error) {
      console.error('Error fetching purchase order summary:', error);
      return {
        totalOrders: 0,
        totalAmount: 0,
        pendingOrders: 0,
        pendingAmount: 0,
        receivedOrders: 0,
        receivedAmount: 0,
        outstandingPayments: 0
      };
    }
  }

  // Delete purchase order
  static async deletePurchaseOrder(orderId: string): Promise<void> {
    try {
      const order = await this.getPurchaseOrderById(orderId);
      if (!order) {
        throw new Error('Purchase order not found');
      }

      // Check if order has been received or has payments
      if (order.status === 'received' || (order.paidAmount && order.paidAmount > 0)) {
        throw new Error('Cannot delete received orders or orders with payments');
      }

      const orderRef = doc(db, this.COLLECTION_NAME, orderId);
      await deleteDoc(orderRef);
    } catch (error) {
      console.error('Error deleting enhanced purchase order:', error);
      throw error;
    }
  }
}

export default EnhancedPurchaseOrderService;