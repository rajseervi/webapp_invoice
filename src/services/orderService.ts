import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  runTransaction,
  writeBatch,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { Order, OrderStatus, PaymentStatus, OrderStatusHistory, OrderPriority } from '@/types/order';
import { Product } from '@/types/inventory';

// Define OrderFormData interface if not already defined
interface OrderFormData extends Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'statusHistory'> {
  // Additional form-specific fields can be added here
}

// Helper function to generate order number
const generateOrderNumber = (date: Date): string => {
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}${month}${day}-${random}`;
};

// Helper function to clean undefined values from objects (Firestore doesn't accept undefined)
const cleanUndefinedValues = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefinedValues);
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanUndefinedValues(value);
      }
    }
    return cleaned;
  }
  
  return obj;
};

export const orderService = {
  async createOrder(data: Omit<OrderFormData, 'orderNumber'>): Promise<string> {
    try {
      const now = new Date();
      const orderNumber = generateOrderNumber(now);
      const timestamp = now.toISOString();

      // Create initial status history
      const statusHistory: OrderStatusHistory[] = [{
        status: data.status || OrderStatus.PENDING,
        timestamp,
        notes: 'Order created'
      }];

      // Create the order document and clean undefined values
      const orderData: Omit<Order, 'id'> = {
        ...data,
        orderNumber,
        statusHistory,
        createdAt: timestamp,
        updatedAt: timestamp,
        source: data.source || 'web',
        priority: data.priority || OrderPriority.NORMAL,
      };

      // Clean undefined values from the order data (Firestore doesn't accept undefined)
      const cleanOrderData = cleanUndefinedValues(orderData);
    
      // Use a transaction to update product quantities and create the order
      return await runTransaction(db, async (transaction) => {
        // First, perform all reads
        const productReads: { ref: any; doc: any; product: Product; item: any }[] = [];
        
        if (!data.isTemplate) {
          for (const item of data.items) {
            const productRef = doc(db, 'products', item.productId);
            const productDoc = await transaction.get(productRef);
                  
            if (!productDoc.exists()) {
              throw new Error(`Product ${item.productId} not found`);
            }
            
            const product = productDoc.data() as Product;
              
            if (product.quantity < item.quantity) {
              throw new Error(`Insufficient stock for product ${product.name}`);
            }
            
            productReads.push({ ref: productRef, doc: productDoc, product, item });
          }
        }
        
        // Now perform all writes
        // Update product quantities
        for (const { ref, product, item } of productReads) {
          transaction.update(ref, {
            quantity: product.quantity - item.quantity,
            updatedAt: timestamp
          });
        }
        
        // Create the order using doc() and set() instead of addDoc()
        const orderRef = doc(collection(db, 'orders'));
        transaction.set(orderRef, cleanOrderData);
        
        return orderRef.id;
      });
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  async getOrders(): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  async getRecentOrders(limitCount: number = 10): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      throw error;
    }
  },

  async getOrdersByParty(partyId: string): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'orders'),
        where('partyId', '==', partyId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
    } catch (error) {
      console.error('Error fetching orders by party:', error);
      throw error;
    }
  },

  async getOrder(orderId: string): Promise<Order> {
    try {
      const docRef = doc(db, 'orders', orderId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Order not found');
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Order;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },

  async updateOrder(orderId: string, data: Partial<OrderFormData>, notes?: string, updatedBy?: string): Promise<void> {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const timestamp = new Date().toISOString();
      
      // Get current order to update status history if status is being changed
      const orderDoc = await getDoc(orderRef);
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }
      
      const currentOrder = orderDoc.data() as Order;
      let statusHistory = currentOrder.statusHistory || [];
      
      // Add new status to history if status is being updated
      if (data.status && data.status !== currentOrder.status) {
        statusHistory.push({
          status: data.status,
          timestamp,
          notes,
          updatedBy
        });
      }
      
      const updateData = {
        ...data,
        ...(data.status && data.status !== currentOrder.status ? { statusHistory } : {}),
        updatedAt: timestamp
      };

      // Clean undefined values before updating
      const cleanUpdateData = cleanUndefinedValues(updateData);
      
      await updateDoc(orderRef, cleanUpdateData);
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string, updatedBy?: string): Promise<void> {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const timestamp = new Date().toISOString();
      
      // Get current order to update status history
      const orderDoc = await getDoc(orderRef);
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }
      
      const currentOrder = orderDoc.data() as Order;
      const statusHistory = currentOrder.statusHistory || [];
      
      // Add new status to history
      statusHistory.push({
        status,
        timestamp,
        notes,
        updatedBy
      });
      
      const updates: any = {
        status,
        statusHistory,
        updatedAt: timestamp
      };
      
      // If the order is completed, set the completedAt timestamp
      if (status === OrderStatus.COMPLETED || status === OrderStatus.DELIVERED) {
        updates.completedAt = timestamp;
      }
      
      // Clean undefined values before updating
      const cleanUpdates = cleanUndefinedValues(updates);
      
      await updateDoc(orderRef, cleanUpdates);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  async cancelOrder(orderId: string): Promise<void> {
    try {
      const orderDoc = await this.getOrder(orderId);
      
      // Use a transaction to restore product quantities and update the order
      await runTransaction(db, async (transaction) => {
        const timestamp = new Date().toISOString();
        
        // First, perform all reads
        const productReads: { ref: any; product: Product; item: any }[] = [];
        
        for (const item of orderDoc.items) {
          const productRef = doc(db, 'products', item.productId);
          const productDoc = await transaction.get(productRef);
          
          if (productDoc.exists()) {
            const product = productDoc.data() as Product;
            productReads.push({ ref: productRef, product, item });
          }
        }
        
        // Now perform all writes
        // Restore product quantities
        for (const { ref, product, item } of productReads) {
          transaction.update(ref, {
            quantity: product.quantity + item.quantity,
            updatedAt: timestamp
          });
        }
        
        // Update the order status
        const orderRef = doc(db, 'orders', orderId);
        const statusHistory = orderDoc.statusHistory || [];
        statusHistory.push({
          status: OrderStatus.CANCELLED,
          timestamp,
          notes: 'Order cancelled'
        });

        const updateData = {
          status: OrderStatus.CANCELLED,
          statusHistory,
          updatedAt: timestamp
        };

        // Clean undefined values before updating
        const cleanUpdateData = cleanUndefinedValues(updateData);

        transaction.update(orderRef, cleanUpdateData);
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  },

  async getOrdersPaginated(pageSize: number = 20, lastDoc?: QueryDocumentSnapshot<DocumentData>) {
    try {
      let q = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];

      return {
        orders,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: querySnapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error('Error fetching paginated orders:', error);
      throw error;
    }
  },

  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'orders'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
    } catch (error) {
      console.error('Error fetching orders by status:', error);
      throw error;
    }
  },

  async getOrdersByPriority(priority: OrderPriority): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'orders'),
        where('priority', '==', priority),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
    } catch (error) {
      console.error('Error fetching orders by priority:', error);
      throw error;
    }
  },

  async getOrderTemplates(): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'orders'),
        where('isTemplate', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
    } catch (error) {
      console.error('Error fetching order templates:', error);
      throw error;
    }
  },

  async bulkUpdateStatus(orderIds: string[], status: OrderStatus, notes?: string, updatedBy?: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      const timestamp = new Date().toISOString();

      for (const orderId of orderIds) {
        const orderRef = doc(db, 'orders', orderId);
        
        // Get current order to update status history
        const orderDoc = await getDoc(orderRef);
        if (orderDoc.exists()) {
          const currentOrder = orderDoc.data() as Order;
          const statusHistory = currentOrder.statusHistory || [];
          
          statusHistory.push({
            status,
            timestamp,
            notes,
            updatedBy
          });

          const updates: any = {
            status,
            statusHistory,
            updatedAt: timestamp
          };

          if (status === OrderStatus.COMPLETED || status === OrderStatus.DELIVERED) {
            updates.completedAt = timestamp;
          }

          // Clean undefined values before updating
          const cleanUpdates = cleanUndefinedValues(updates);

          batch.update(orderRef, cleanUpdates);
        }
      }

      await batch.commit();
    } catch (error) {
      console.error('Error bulk updating order status:', error);
      throw error;
    }
  },

  async bulkUpdatePaymentStatus(orderIds: string[], paymentStatus: PaymentStatus, paymentData?: any): Promise<void> {
    try {
      const batch = writeBatch(db);
      const timestamp = new Date().toISOString();

      for (const orderId of orderIds) {
        const orderRef = doc(db, 'orders', orderId);
        
        const updates: any = {
          paymentStatus,
          updatedAt: timestamp
        };

        if (paymentData) {
          updates.paymentDetails = {
            ...paymentData,
            ...(paymentStatus === PaymentStatus.PAID ? { paidAt: timestamp } : {})
          };
        }

        // Clean undefined values before updating
        const cleanUpdates = cleanUndefinedValues(updates);

        batch.update(orderRef, cleanUpdates);
      }

      await batch.commit();
    } catch (error) {
      console.error('Error bulk updating payment status:', error);
      throw error;
    }
  },

  async bulkCancelOrders(orderIds: string[]): Promise<void> {
    try {
      // For bulk operations with complex logic involving reads and writes,
      // use individual transactions to avoid read/write ordering issues
      const promises = orderIds.map(orderId => this.cancelOrder(orderId));
      await Promise.all(promises);
    } catch (error) {
      console.error('Error bulk cancelling orders:', error);
      throw error;
    }
  },

  async bulkDeleteOrders(orderIds: string[]): Promise<void> {
    try {
      const batch = writeBatch(db);

      for (const orderId of orderIds) {
        const orderRef = doc(db, 'orders', orderId);
        batch.delete(orderRef);
      }

      await batch.commit();
    } catch (error) {
      console.error('Error bulk deleting orders:', error);
      throw error;
    }
  },

  async searchOrders(searchTerm: string): Promise<Order[]> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation that searches by order number and customer name
      const orders = await this.getOrders();
      
      const filteredOrders = orders.filter(order => 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.partyName.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return filteredOrders;
    } catch (error) {
      console.error('Error searching orders:', error);
      throw error;
    }
  },

  async getOrdersRequiringApproval(): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'orders'),
        where('status', '==', OrderStatus.PENDING_APPROVAL),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
    } catch (error) {
      console.error('Error fetching orders requiring approval:', error);
      throw error;
    }
  },

  async approveOrder(orderId: string, approvedBy: string): Promise<void> {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const timestamp = new Date().toISOString();
      
      const orderDoc = await getDoc(orderRef);
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }
      
      const currentOrder = orderDoc.data() as Order;
      const statusHistory = currentOrder.statusHistory || [];
      
      statusHistory.push({
        status: OrderStatus.APPROVED,
        timestamp,
        notes: `Approved by ${approvedBy}`,
        updatedBy: approvedBy
      });

      const updateData = {
        status: OrderStatus.APPROVED,
        statusHistory,
        approvedBy,
        approvedAt: timestamp,
        updatedAt: timestamp
      };

      // Clean undefined values before updating
      const cleanUpdateData = cleanUndefinedValues(updateData);

      await updateDoc(orderRef, cleanUpdateData);
    } catch (error) {
      console.error('Error approving order:', error);
      throw error;
    }
  },

  async createOrderFromTemplate(templateId: string, customData?: Partial<Order>): Promise<string> {
    try {
      const template = await this.getOrder(templateId);
      
      if (!template.isTemplate) {
        throw new Error('Order is not a template');
      }

      const orderData = {
        ...template,
        ...customData,
        isTemplate: false,
        templateName: undefined,
        parentOrderId: templateId,
        status: OrderStatus.DRAFT,
        paymentStatus: PaymentStatus.PENDING,
        createdAt: undefined,
        updatedAt: undefined,
        id: undefined,
        orderNumber: undefined,
        statusHistory: undefined
      };

      return await this.createOrder(orderData as any);
    } catch (error) {
      console.error('Error creating order from template:', error);
      throw error;
    }
  },

  async updateTrackingInfo(orderId: string, trackingNumber: string, estimatedDelivery?: string): Promise<void> {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const timestamp = new Date().toISOString();

      const updates: any = {
        trackingNumber,
        updatedAt: timestamp
      };

      if (estimatedDelivery) {
        updates.estimatedDelivery = estimatedDelivery;
      }

      // Clean undefined values before updating
      const cleanUpdates = cleanUndefinedValues(updates);

      await updateDoc(orderRef, cleanUpdates);
    } catch (error) {
      console.error('Error updating tracking info:', error);
      throw error;
    }
  },

  async getOrderStatistics() {
    try {
      const orders = await this.getOrders();
      
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      const pendingOrders = orders.filter(order => order.status === OrderStatus.PENDING).length;
      const completedOrders = orders.filter(order => order.status === OrderStatus.COMPLETED).length;
      
      // Get orders from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentOrders = orders.filter(order => new Date(order.createdAt) >= thirtyDaysAgo);
      const recentRevenue = recentOrders.reduce((sum, order) => sum + order.total, 0);
      
      return {
        totalOrders,
        totalRevenue,
        pendingOrders,
        completedOrders,
        recentOrders: recentOrders.length,
        recentRevenue
      };
    } catch (error) {
      console.error('Error getting order statistics:', error);
      throw error;
    }
  }
};