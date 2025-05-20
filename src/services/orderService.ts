import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { Order, OrderFormData, OrderStatus } from '@/types/order';
import { Product } from '@/types/inventory';

// Helper function to generate order number
const generateOrderNumber = (date: Date): string => {
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}${month}${day}-${random}`;
};

export const orderService = {
  async createOrder(data: Omit<OrderFormData, 'orderNumber'>): Promise<string> {
    try {
      const now = new Date();
      const orderNumber = generateOrderNumber(now);
      const timestamp = now.toISOString();

      // Create the order document
      const orderData: Omit<Order, 'id'> = {
        ...data,
        orderNumber,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      // Use a transaction to update product quantities and create the order
      return await runTransaction(db, async (transaction) => {
        // Update product quantities
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
          
          transaction.update(productRef, {
            quantity: product.quantity - item.quantity,
            updatedAt: timestamp
          });
        }
        
        // Create the order
        const orderRef = await addDoc(collection(db, 'orders'), orderData);
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

  async getRecentOrders(limit: number = 10): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc'),
        limit(limit)
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

  async updateOrder(orderId: string, data: Partial<OrderFormData>): Promise<void> {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const timestamp = new Date().toISOString();
      
      await updateDoc(orderRef, {
        ...data,
        updatedAt: timestamp
      });
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const timestamp = new Date().toISOString();
      
      const updates: any = {
        status,
        updatedAt: timestamp
      };
      
      // If the order is completed, set the completedAt timestamp
      if (status === OrderStatus.COMPLETED) {
        updates.completedAt = timestamp;
      }
      
      await updateDoc(orderRef, updates);
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
        // Restore product quantities
        for (const item of orderDoc.items) {
          const productRef = doc(db, 'products', item.productId);
          const productDoc = await transaction.get(productRef);
          
          if (productDoc.exists()) {
            const product = productDoc.data() as Product;
            
            transaction.update(productRef, {
              quantity: product.quantity + item.quantity,
              updatedAt: new Date().toISOString()
            });
          }
        }
        
        // Update the order status
        const orderRef = doc(db, 'orders', orderId);
        transaction.update(orderRef, {
          status: OrderStatus.CANCELLED,
          updatedAt: new Date().toISOString()
        });
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
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