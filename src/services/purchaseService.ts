import { db } from '@/firebase/config';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  serverTimestamp,
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import { PurchaseOrder, PurchaseItem, PurchaseFilters, PurchaseStatistics, PurchaseReceipt } from '@/types/purchase';
import EnhancedStockService from './enhancedStockService';

export interface PurchaseResult {
  success: boolean;
  purchaseOrderId?: string;
  stockUpdateResult?: any;
  errors?: string[];
  warnings?: string[];
}

export class PurchaseService {
  private static readonly PURCHASE_ORDERS_COLLECTION = 'purchase_orders';
  private static readonly PURCHASE_RECEIPTS_COLLECTION = 'purchase_receipts';

  /**
   * Create a new purchase order
   */
  static async createPurchaseOrder(
    purchaseData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>,
    updateStock: boolean = false
  ): Promise<PurchaseResult> {
    const result: PurchaseResult = {
      success: false,
      errors: [],
      warnings: []
    };

    try {
      const now = new Date().toISOString();
      let purchaseOrderId: string;

      // First, create the purchase order
      await runTransaction(db, async (transaction) => {
        const purchaseRef = doc(collection(db, this.PURCHASE_ORDERS_COLLECTION));
        const purchaseOrderData = {
          ...purchaseData,
          id: purchaseRef.id,
          stockUpdated: false,
          createdAt: now,
          updatedAt: now
        };

        transaction.set(purchaseRef, purchaseOrderData);
        purchaseOrderId = purchaseRef.id;
        result.purchaseOrderId = purchaseRef.id;
      });

      // Then, update stock if requested and status is 'received'
      if (updateStock && purchaseData.status === 'received' && purchaseData.items.length > 0) {
        const stockUpdateResult = await EnhancedStockService.processInvoiceStockUpdates(
          {
            id: purchaseOrderId!,
            invoiceNumber: purchaseData.purchaseOrderNumber,
            items: purchaseData.items.map(item => ({
              productId: item.productId,
              name: item.productName,
              quantity: item.quantity,
              price: item.unitPrice
            })),
            userId: purchaseData.userId,
            type: 'purchase'
          },
          'purchase'
        );

        result.stockUpdateResult = stockUpdateResult;

        if (stockUpdateResult.success) {
          // Update the purchase order to mark stock as updated
          const purchaseRef = doc(db, this.PURCHASE_ORDERS_COLLECTION, purchaseOrderId!);
          await updateDoc(purchaseRef, { 
            stockUpdated: true,
            updatedAt: new Date().toISOString()
          });
        } else {
          result.warnings?.push('Purchase order created but stock update failed');
        }
      }

      result.success = true;
      return result;

    } catch (error) {
      console.error('Error creating purchase order:', error);
      result.errors?.push(error instanceof Error ? error.message : 'Unknown error occurred');
      return result;
    }
  }

  /**
   * Update purchase order
   */
  static async updatePurchaseOrder(
    purchaseOrderId: string,
    updates: Partial<PurchaseOrder>,
    adjustStock: boolean = true
  ): Promise<PurchaseResult> {
    const result: PurchaseResult = {
      success: false,
      errors: [],
      warnings: []
    };

    try {
      let currentPurchase: PurchaseOrder;
      const now = new Date().toISOString();

      // First, get the current purchase order data
      await runTransaction(db, async (transaction) => {
        const purchaseRef = doc(db, this.PURCHASE_ORDERS_COLLECTION, purchaseOrderId);
        const purchaseSnap = await transaction.get(purchaseRef);

        if (!purchaseSnap.exists()) {
          result.errors?.push('Purchase order not found');
          return;
        }

        currentPurchase = purchaseSnap.data() as PurchaseOrder;
      });

      if (result.errors && result.errors.length > 0) {
        return result;
      }

      // Handle stock adjustments if status changed to/from 'received'
      if (adjustStock && updates.status && updates.status !== currentPurchase!.status) {
        if (currentPurchase!.status === 'received' && currentPurchase!.stockUpdated) {
          // Revert previous stock changes
          const revertResult = await EnhancedStockService.revertInvoiceStockUpdates(
            {
              id: currentPurchase!.id,
              invoiceNumber: currentPurchase!.purchaseOrderNumber,
              items: currentPurchase!.items.map(item => ({
                productId: item.productId,
                name: item.productName,
                quantity: item.quantity,
                price: item.unitPrice
              })),
              userId: currentPurchase!.userId,
              type: 'purchase'
            } as any,
            'purchase'
          );

          if (!revertResult.success) {
            result.warnings?.push('Failed to revert previous stock changes');
          }
        }

        if (updates.status === 'received' && updates.items) {
          // Apply new stock changes
          const stockUpdateResult = await EnhancedStockService.processInvoiceStockUpdates(
            {
              id: purchaseOrderId,
              invoiceNumber: currentPurchase!.purchaseOrderNumber,
              items: updates.items.map(item => ({
                productId: item.productId,
                name: item.productName,
                quantity: item.quantity,
                price: item.unitPrice
              })),
              userId: currentPurchase!.userId,
              type: 'purchase'
            },
            'purchase'
          );

          result.stockUpdateResult = stockUpdateResult;
          updates.stockUpdated = stockUpdateResult.success;

          if (!stockUpdateResult.success) {
            result.warnings?.push('Purchase order updated but stock update failed');
          }
        }
      }

      // Finally, update the purchase order
      const purchaseRef = doc(db, this.PURCHASE_ORDERS_COLLECTION, purchaseOrderId);
      await updateDoc(purchaseRef, {
        ...updates,
        updatedAt: now
      });

      result.success = true;
      return result;

    } catch (error) {
      console.error('Error updating purchase order:', error);
      result.errors?.push(error instanceof Error ? error.message : 'Unknown error occurred');
      return result;
    }
  }

  /**
   * Delete purchase order
   */
  static async deletePurchaseOrder(
    purchaseOrderId: string,
    revertStock: boolean = true
  ): Promise<{ success: boolean; errors?: string[] }> {
    try {
      const purchaseRef = doc(db, this.PURCHASE_ORDERS_COLLECTION, purchaseOrderId);
      const purchaseSnap = await getDoc(purchaseRef);

      if (!purchaseSnap.exists()) {
        return { success: false, errors: ['Purchase order not found'] };
      }

      const purchaseOrder = purchaseSnap.data() as PurchaseOrder;

      // Revert stock changes if needed
      if (revertStock && purchaseOrder.stockUpdated && purchaseOrder.status === 'received') {
        const revertResult = await EnhancedStockService.revertInvoiceStockUpdates(
          {
            id: purchaseOrder.id,
            invoiceNumber: purchaseOrder.purchaseOrderNumber,
            items: purchaseOrder.items.map(item => ({
              productId: item.productId,
              name: item.productName,
              quantity: item.quantity,
              price: item.unitPrice
            })),
            userId: purchaseOrder.userId,
            type: 'purchase'
          } as any,
          'purchase'
        );

        if (!revertResult.success) {
          return { 
            success: false, 
            errors: ['Failed to revert stock changes: ' + revertResult.errors.map(e => e.error).join(', ')] 
          };
        }
      }

      // Delete purchase order
      await deleteDoc(purchaseRef);

      return { success: true };

    } catch (error) {
      console.error('Error deleting purchase order:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  /**
   * Get purchase order by ID
   */
  static async getPurchaseOrderById(purchaseOrderId: string): Promise<PurchaseOrder | null> {
    try {
      const purchaseRef = doc(db, this.PURCHASE_ORDERS_COLLECTION, purchaseOrderId);
      const purchaseSnap = await getDoc(purchaseRef);

      if (!purchaseSnap.exists()) {
        return null;
      }

      return { id: purchaseSnap.id, ...purchaseSnap.data() } as PurchaseOrder;

    } catch (error) {
      console.error('Error fetching purchase order:', error);
      return null;
    }
  }

  /**
   * Get purchase orders with filters
   */
  static async getPurchaseOrders(
    filters: PurchaseFilters = {},
    limitCount: number = 50,
    lastDoc?: any
  ): Promise<{ orders: PurchaseOrder[]; lastDoc: any }> {
    try {
      let q = query(collection(db, this.PURCHASE_ORDERS_COLLECTION));

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters.paymentStatus && filters.paymentStatus !== 'all') {
        q = query(q, where('paymentStatus', '==', filters.paymentStatus));
      }

      if (filters.supplierId) {
        q = query(q, where('supplierId', '==', filters.supplierId));
      }

      if (filters.dateFrom) {
        q = query(q, where('date', '>=', filters.dateFrom));
      }

      if (filters.dateTo) {
        q = query(q, where('date', '<=', filters.dateTo));
      }

      // Add ordering and pagination
      q = query(q, orderBy('createdAt', 'desc'), limit(limitCount));

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PurchaseOrder[];

      // Apply search filter (client-side for now)
      let filteredOrders = orders;
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        filteredOrders = orders.filter(order =>
          order.purchaseOrderNumber.toLowerCase().includes(searchTerm) ||
          order.supplierName.toLowerCase().includes(searchTerm) ||
          order.items.some(item => item.productName.toLowerCase().includes(searchTerm))
        );
      }

      const lastDocument = querySnapshot.docs[querySnapshot.docs.length - 1];

      return {
        orders: filteredOrders,
        lastDoc: lastDocument
      };

    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      return { orders: [], lastDoc: null };
    }
  }

  /**
   * Generate purchase order number
   */
  static async generatePurchaseOrderNumber(): Promise<string> {
    try {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');

      // Get the latest purchase order for the current month
      const q = query(
        collection(db, this.PURCHASE_ORDERS_COLLECTION),
        where('purchaseOrderNumber', '>=', `PO-${year}${month}-000`),
        where('purchaseOrderNumber', '<=', `PO-${year}${month}-999`),
        orderBy('purchaseOrderNumber', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);
      let sequence = 1;

      if (!snapshot.empty) {
        const latestOrder = snapshot.docs[0].data();
        const latestNumber = latestOrder.purchaseOrderNumber;
        const currentSequence = parseInt(latestNumber.split('-')[2]);
        sequence = currentSequence + 1;
      }

      const sequenceStr = sequence.toString().padStart(3, '0');
      return `PO-${year}${month}-${sequenceStr}`;

    } catch (error) {
      console.error('Error generating purchase order number:', error);
      const timestamp = Date.now();
      return `PO-${timestamp}`;
    }
  }

  /**
   * Receive purchase order (mark as received and update stock)
   */
  static async receivePurchaseOrder(
    purchaseOrderId: string,
    receivedItems: Array<{
      productId: string;
      receivedQuantity: number;
      condition: 'good' | 'damaged' | 'partial';
      notes?: string;
    }>,
    userId: string
  ): Promise<PurchaseResult> {
    const result: PurchaseResult = {
      success: false,
      errors: [],
      warnings: []
    };

    try {
      let purchaseOrder: PurchaseOrder;
      const now = new Date().toISOString();

      // First, get the purchase order and update its status
      await runTransaction(db, async (transaction) => {
        const purchaseRef = doc(db, this.PURCHASE_ORDERS_COLLECTION, purchaseOrderId);
        const purchaseSnap = await transaction.get(purchaseRef);

        if (!purchaseSnap.exists()) {
          result.errors?.push('Purchase order not found');
          return;
        }

        purchaseOrder = purchaseSnap.data() as PurchaseOrder;

        // Update purchase order status
        transaction.update(purchaseRef, {
          status: 'received',
          receivedDate: now,
          stockUpdated: false, // Will be updated after stock processing
          updatedAt: now
        });

        // Create purchase receipt
        const receiptRef = doc(collection(db, this.PURCHASE_RECEIPTS_COLLECTION));
        const receiptData: Omit<PurchaseReceipt, 'id'> = {
          purchaseOrderId,
          receiptNumber: `REC-${Date.now()}`,
          date: now.split('T')[0],
          supplierId: purchaseOrder.supplierId,
          supplierName: purchaseOrder.supplierName,
          items: receivedItems.map(item => {
            const originalItem = purchaseOrder.items.find(oi => oi.productId === item.productId);
            return {
              productId: item.productId,
              productName: originalItem?.productName || 'Unknown Product',
              orderedQuantity: originalItem?.quantity || 0,
              receivedQuantity: item.receivedQuantity,
              unitPrice: originalItem?.unitPrice || 0,
              totalPrice: (originalItem?.unitPrice || 0) * item.receivedQuantity,
              condition: item.condition,
              notes: item.notes
            };
          }),
          totalAmount: receivedItems.reduce((sum, item) => {
            const originalItem = purchaseOrder.items.find(oi => oi.productId === item.productId);
            return sum + ((originalItem?.unitPrice || 0) * item.receivedQuantity);
          }, 0),
          status: 'complete',
          stockUpdated: false, // Will be updated after stock processing
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          userId: userId
        };

        transaction.set(receiptRef, receiptData);
      });

      if (result.errors && result.errors.length > 0) {
        return result;
      }

      // Then, update stock for received items
      const stockItems = receivedItems
        .filter(item => item.condition === 'good' && item.receivedQuantity > 0)
        .map(item => {
          const originalItem = purchaseOrder!.items.find(oi => oi.productId === item.productId);
          return {
            productId: item.productId,
            name: originalItem?.productName || 'Unknown Product',
            quantity: item.receivedQuantity,
            price: originalItem?.unitPrice || 0
          };
        });

      if (stockItems.length > 0) {
        const stockUpdateResult = await EnhancedStockService.processInvoiceStockUpdates(
          {
            id: purchaseOrderId,
            invoiceNumber: purchaseOrder!.purchaseOrderNumber,
            items: stockItems,
            userId: userId,
            type: 'purchase'
          },
          'purchase'
        );

        result.stockUpdateResult = stockUpdateResult;

        if (stockUpdateResult.success) {
          // Update the purchase order to mark stock as updated
          const purchaseRef = doc(db, this.PURCHASE_ORDERS_COLLECTION, purchaseOrderId);
          await updateDoc(purchaseRef, { 
            stockUpdated: true,
            updatedAt: new Date().toISOString()
          });
        } else {
          result.warnings?.push('Purchase order received but stock update failed: ' + stockUpdateResult.errors.map(e => e.error).join(', '));
        }
      }

      result.success = true;
      return result;

    } catch (error) {
      console.error('Error receiving purchase order:', error);
      result.errors?.push(error instanceof Error ? error.message : 'Unknown error occurred');
      return result;
    }
  }

  /**
   * Get purchase statistics
   */
  static async getPurchaseStatistics(
    userId?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<PurchaseStatistics> {
    try {
      let q = query(collection(db, this.PURCHASE_ORDERS_COLLECTION));

      if (userId) {
        q = query(q, where('userId', '==', userId));
      }

      if (dateFrom) {
        q = query(q, where('date', '>=', dateFrom));
      }

      if (dateTo) {
        q = query(q, where('date', '<=', dateTo));
      }

      const querySnapshot = await getDocs(q);
      const orders = querySnapshot.docs.map(doc => doc.data()) as PurchaseOrder[];

      const totalPurchases = orders.length;
      const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const pendingOrders = orders.filter(order => order.status === 'pending').length;
      const receivedOrders = orders.filter(order => order.status === 'received').length;
      const averageOrderValue = totalPurchases > 0 ? totalAmount / totalPurchases : 0;

      // Get unique suppliers
      const supplierIds = [...new Set(orders.map(order => order.supplierId))];
      const totalSuppliers = supplierIds.length;

      // Calculate monthly purchases
      const monthlyMap = new Map<string, { amount: number; orders: number }>();
      orders.forEach(order => {
        const month = order.date.substring(0, 7); // YYYY-MM
        const existing = monthlyMap.get(month) || { amount: 0, orders: 0 };
        existing.amount += order.totalAmount;
        existing.orders += 1;
        monthlyMap.set(month, existing);
      });

      const monthlyPurchases = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        amount: data.amount,
        orders: data.orders
      }));

      // Calculate top suppliers
      const supplierMap = new Map<string, { name: string; amount: number; orders: number }>();
      orders.forEach(order => {
        const existing = supplierMap.get(order.supplierId) || { 
          name: order.supplierName, 
          amount: 0, 
          orders: 0 
        };
        existing.amount += order.totalAmount;
        existing.orders += 1;
        supplierMap.set(order.supplierId, existing);
      });

      const topSuppliers = Array.from(supplierMap.entries())
        .map(([supplierId, data]) => ({
          supplierId,
          supplierName: data.name,
          totalAmount: data.amount,
          orderCount: data.orders
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 10);

      return {
        totalPurchases,
        totalAmount,
        pendingOrders,
        receivedOrders,
        totalSuppliers,
        averageOrderValue,
        monthlyPurchases,
        topSuppliers
      };

    } catch (error) {
      console.error('Error getting purchase statistics:', error);
      return {
        totalPurchases: 0,
        totalAmount: 0,
        pendingOrders: 0,
        receivedOrders: 0,
        totalSuppliers: 0,
        averageOrderValue: 0,
        monthlyPurchases: [],
        topSuppliers: []
      };
    }
  }
}

export default PurchaseService;