import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Order } from '@/types/order';
import { executeWithRetry, getFirestoreErrorMessage } from '@/utils/firestoreHelpers';
import { cleanInvoiceData } from '@/utils/firestoreUtils'; // Re-using for cleaning order data

export const OrderService = {
  async createOrder(orderData: Order): Promise<Order | null> {
    try {
      const cleanedData = cleanInvoiceData(orderData); // Re-using cleaning utility
      const docRef = await executeWithRetry(() => addDoc(collection(db, 'orders'), cleanedData));
      return { ...orderData, id: docRef.id };
    } catch (error) {
      console.error("Error creating order:", error);
      throw new Error(getFirestoreErrorMessage(error));
    }
  },

  async getOrderById(id: string): Promise<Order | null> {
    try {
      let order: Order | null = null;
      await executeWithRetry(async () => {
        const docRef = doc(db, 'orders', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          order = { id: docSnap.id, ...docSnap.data() } as Order;
        }
      });
      return order;
    } catch (error) {
      console.error("Error getting order by ID:", error);
      throw new Error(getFirestoreErrorMessage(error));
    }
  },

  async getAllOrders(): Promise<Order[]> {
    try {
      let orders: Order[] = [];
      await executeWithRetry(async () => {
        const querySnapshot = await getDocs(collection(db, 'orders'));
        orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      });
      return orders;
    } catch (error) {
      console.error("Error getting all orders:", error);
      throw new Error(getFirestoreErrorMessage(error));
    }
  },

  async updateOrder(id: string, orderData: Partial<Order>): Promise<void> {
    try {
      const cleanedData = cleanInvoiceData(orderData); // Re-using cleaning utility
      const docRef = doc(db, 'orders', id);
      await executeWithRetry(() => updateDoc(docRef, cleanedData));
    } catch (error) {
      console.error("Error updating order:", error);
      throw new Error(getFirestoreErrorMessage(error));
    }
  },

  async deleteOrder(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'orders', id);
      await executeWithRetry(() => deleteDoc(docRef));
    } catch (error) {
      console.error("Error deleting order:", error);
      throw new Error(getFirestoreErrorMessage(error));
    }
  },

  async updateOrderStatus(id: string, status: string): Promise<void> {
    try {
      const docRef = doc(db, 'orders', id);
      await executeWithRetry(() => updateDoc(docRef, { 
        status,
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error("Error updating order status:", error);
      throw new Error(getFirestoreErrorMessage(error));
    }
  },

  async getLatestOrderNumber(): Promise<string> {
    try {
      let latestNumber = 0;
      await executeWithRetry(async () => {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const lastOrder = querySnapshot.docs[0].data();
          const lastOrderNumber = lastOrder.orderNumber;
          const match = lastOrderNumber.match(/\d+$/);
          if (match) {
            latestNumber = parseInt(match[0]);
          }
        }
      });
      return `ORD-${(latestNumber + 1).toString().padStart(4, '0')}`;
    } catch (error) {
      console.error("Error getting latest order number:", error);
      return `ORD-0001`; // Fallback
    }
  }
};
