import { db } from '@/firebase/config';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { Product } from '@/types/inventory';

export interface ReorderRule {
  id?: string;
  productId: string;
  productName: string;
  reorderPoint: number;
  maxStockLevel: number;
  reorderQuantity: number;
  leadTimeDays: number;
  supplierId?: string;
  supplierName?: string;
  isActive: boolean;
  autoReorder: boolean;
  seasonalAdjustment?: {
    enabled: boolean;
    peakMonths: number[];
    adjustmentFactor: number;
  };
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface ReorderSuggestion {
  id?: string;
  productId: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  suggestedQuantity: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  estimatedStockoutDate: string;
  leadTime: number;
  estimatedDeliveryDate: string;
  costEstimate?: number;
  supplierId?: string;
  supplierName?: string;
  reason: string;
  status: 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled';
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  orderReference?: string;
}

export interface PurchaseOrder {
  id?: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  supplierContact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    reorderSuggestionId?: string;
  }>;
  totalQuantity: number;
  totalCost: number;
  status: 'draft' | 'sent' | 'confirmed' | 'partially_received' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  notes?: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  totalOrders: number;
  completedOrders: number;
  averageLeadTime: number;
  onTimeDeliveryRate: number;
  qualityRating: number;
  costCompetitiveness: number;
  overallScore: number;
  lastOrderDate?: string;
  totalSpent: number;
  preferredSupplier: boolean;
}

export class StockReorderService {
  private static readonly REORDER_RULES_COLLECTION = 'reorder_rules';
  private static readonly REORDER_SUGGESTIONS_COLLECTION = 'reorder_suggestions';
  private static readonly PURCHASE_ORDERS_COLLECTION = 'purchase_orders';
  private static readonly PRODUCTS_COLLECTION = 'products';

  /**
   * Create or update reorder rule for a product
   */
  static async createReorderRule(rule: Omit<ReorderRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
      const now = new Date().toISOString();
      
      // Check if rule already exists for this product
      const existingQuery = query(
        collection(db, this.REORDER_RULES_COLLECTION),
        where('productId', '==', rule.productId)
      );
      
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        // Update existing rule
        const existingDoc = existingSnapshot.docs[0];
        await updateDoc(existingDoc.ref, {
          ...rule,
          updatedAt: now
        });
        return existingDoc.id;
      } else {
        // Create new rule
        const docRef = await addDoc(collection(db, this.REORDER_RULES_COLLECTION), {
          ...rule,
          createdAt: now,
          updatedAt: now
        });
        return docRef.id;
      }
    } catch (error) {
      console.error('Error creating reorder rule:', error);
      return null;
    }
  }

  /**
   * Generate reorder suggestions based on current stock levels and rules
   */
  static async generateReorderSuggestions(userId?: string): Promise<ReorderSuggestion[]> {
    try {
      const suggestions: ReorderSuggestion[] = [];
      
      // Get all active reorder rules
      const rulesQuery = query(
        collection(db, this.REORDER_RULES_COLLECTION),
        where('isActive', '==', true)
      );
      
      const rulesSnapshot = await getDocs(rulesQuery);
      const rules = rulesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ReorderRule[];

      // Get current stock levels for products with rules
      const productIds = rules.map(rule => rule.productId);
      
      for (const rule of rules) {
        const productDoc = await getDoc(doc(db, this.PRODUCTS_COLLECTION, rule.productId));
        
        if (productDoc.exists()) {
          const product = { id: productDoc.id, ...productDoc.data() } as Product;
          const currentStock = product.quantity || 0;
          
          // Check if reorder is needed
          if (currentStock <= rule.reorderPoint) {
            const urgencyLevel = this.calculateUrgencyLevel(currentStock, rule.reorderPoint);
            const estimatedStockoutDate = this.calculateStockoutDate(currentStock, product);
            const estimatedDeliveryDate = new Date(Date.now() + rule.leadTimeDays * 24 * 60 * 60 * 1000).toISOString();
            
            // Apply seasonal adjustment if enabled
            let adjustedQuantity = rule.reorderQuantity;
            if (rule.seasonalAdjustment?.enabled) {
              const currentMonth = new Date().getMonth() + 1;
              if (rule.seasonalAdjustment.peakMonths.includes(currentMonth)) {
                adjustedQuantity = Math.round(rule.reorderQuantity * rule.seasonalAdjustment.adjustmentFactor);
              }
            }

            const suggestion: ReorderSuggestion = {
              productId: rule.productId,
              productName: rule.productName,
              currentStock,
              reorderPoint: rule.reorderPoint,
              suggestedQuantity: adjustedQuantity,
              urgencyLevel,
              estimatedStockoutDate,
              leadTime: rule.leadTimeDays,
              estimatedDeliveryDate,
              costEstimate: adjustedQuantity * (product.purchasePrice || product.price || 0),
              supplierId: rule.supplierId,
              supplierName: rule.supplierName,
              reason: `Stock level (${currentStock}) below reorder point (${rule.reorderPoint})`,
              status: 'pending',
              createdAt: new Date().toISOString()
            };

            suggestions.push(suggestion);
          }
        }
      }

      // Save suggestions to database
      const batch = writeBatch(db);
      const savedSuggestions: ReorderSuggestion[] = [];

      for (const suggestion of suggestions) {
        // Check if suggestion already exists for this product
        const existingQuery = query(
          collection(db, this.REORDER_SUGGESTIONS_COLLECTION),
          where('productId', '==', suggestion.productId),
          where('status', '==', 'pending')
        );
        
        const existingSnapshot = await getDocs(existingQuery);
        
        if (existingSnapshot.empty) {
          const docRef = doc(collection(db, this.REORDER_SUGGESTIONS_COLLECTION));
          batch.set(docRef, suggestion);
          savedSuggestions.push({ ...suggestion, id: docRef.id });
        }
      }

      await batch.commit();
      return savedSuggestions;

    } catch (error) {
      console.error('Error generating reorder suggestions:', error);
      return [];
    }
  }

  /**
   * Get all reorder suggestions with optional filtering
   */
  static async getReorderSuggestions(filters?: {
    status?: ReorderSuggestion['status'][];
    urgencyLevel?: ReorderSuggestion['urgencyLevel'][];
    supplierId?: string;
  }): Promise<ReorderSuggestion[]> {
    try {
      let q = collection(db, this.REORDER_SUGGESTIONS_COLLECTION);

      if (filters?.status && filters.status.length > 0) {
        q = query(q, where('status', 'in', filters.status)) as any;
      }

      q = query(q, orderBy('createdAt', 'desc')) as any;

      const snapshot = await getDocs(q);
      let suggestions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ReorderSuggestion[];

      // Apply client-side filters
      if (filters?.urgencyLevel && filters.urgencyLevel.length > 0) {
        suggestions = suggestions.filter(s => filters.urgencyLevel!.includes(s.urgencyLevel));
      }

      if (filters?.supplierId) {
        suggestions = suggestions.filter(s => s.supplierId === filters.supplierId);
      }

      return suggestions;

    } catch (error) {
      console.error('Error getting reorder suggestions:', error);
      return [];
    }
  }

  /**
   * Create purchase order from reorder suggestions
   */
  static async createPurchaseOrder(
    supplierInfo: {
      supplierId: string;
      supplierName: string;
      supplierContact?: PurchaseOrder['supplierContact'];
    },
    suggestionIds: string[],
    additionalInfo?: {
      priority?: PurchaseOrder['priority'];
      expectedDeliveryDate?: string;
      notes?: string;
      terms?: string;
    },
    userId?: string
  ): Promise<string | null> {
    try {
      // Get suggestions
      const suggestions: ReorderSuggestion[] = [];
      for (const id of suggestionIds) {
        const doc = await getDoc(doc(db, this.REORDER_SUGGESTIONS_COLLECTION, id));
        if (doc.exists()) {
          suggestions.push({ id: doc.id, ...doc.data() } as ReorderSuggestion);
        }
      }

      if (suggestions.length === 0) {
        throw new Error('No valid suggestions found');
      }

      // Create purchase order
      const orderNumber = `PO-${Date.now()}`;
      const now = new Date().toISOString();

      const purchaseOrder: Omit<PurchaseOrder, 'id'> = {
        orderNumber,
        supplierId: supplierInfo.supplierId,
        supplierName: supplierInfo.supplierName,
        supplierContact: supplierInfo.supplierContact,
        items: suggestions.map(suggestion => ({
          productId: suggestion.productId,
          productName: suggestion.productName,
          quantity: suggestion.suggestedQuantity,
          unitCost: (suggestion.costEstimate || 0) / suggestion.suggestedQuantity,
          totalCost: suggestion.costEstimate || 0,
          reorderSuggestionId: suggestion.id
        })),
        totalQuantity: suggestions.reduce((sum, s) => sum + s.suggestedQuantity, 0),
        totalCost: suggestions.reduce((sum, s) => sum + (s.costEstimate || 0), 0),
        status: 'draft',
        priority: additionalInfo?.priority || 'medium',
        expectedDeliveryDate: additionalInfo?.expectedDeliveryDate,
        notes: additionalInfo?.notes,
        terms: additionalInfo?.terms,
        createdAt: now,
        updatedAt: now,
        createdBy: userId
      };

      const docRef = await addDoc(collection(db, this.PURCHASE_ORDERS_COLLECTION), purchaseOrder);

      // Update suggestion statuses
      const batch = writeBatch(db);
      for (const suggestion of suggestions) {
        if (suggestion.id) {
          batch.update(doc(db, this.REORDER_SUGGESTIONS_COLLECTION, suggestion.id), {
            status: 'approved',
            approvedAt: now,
            approvedBy: userId,
            orderReference: orderNumber
          });
        }
      }
      await batch.commit();

      return docRef.id;

    } catch (error) {
      console.error('Error creating purchase order:', error);
      return null;
    }
  }

  /**
   * Get purchase orders with optional filtering
   */
  static async getPurchaseOrders(filters?: {
    status?: PurchaseOrder['status'][];
    supplierId?: string;
    dateRange?: { startDate: string; endDate: string };
  }): Promise<PurchaseOrder[]> {
    try {
      let q = collection(db, this.PURCHASE_ORDERS_COLLECTION);

      if (filters?.status && filters.status.length > 0) {
        q = query(q, where('status', 'in', filters.status)) as any;
      }

      if (filters?.supplierId) {
        q = query(q, where('supplierId', '==', filters.supplierId)) as any;
      }

      if (filters?.dateRange) {
        q = query(q, 
          where('createdAt', '>=', filters.dateRange.startDate),
          where('createdAt', '<=', filters.dateRange.endDate)
        ) as any;
      }

      q = query(q, orderBy('createdAt', 'desc')) as any;

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PurchaseOrder[];

    } catch (error) {
      console.error('Error getting purchase orders:', error);
      return [];
    }
  }

  /**
   * Update purchase order status
   */
  static async updatePurchaseOrderStatus(
    orderId: string, 
    status: PurchaseOrder['status'],
    additionalData?: {
      actualDeliveryDate?: string;
      notes?: string;
    },
    userId?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date().toISOString()
      };

      if (additionalData?.actualDeliveryDate) {
        updateData.actualDeliveryDate = additionalData.actualDeliveryDate;
      }

      if (additionalData?.notes) {
        updateData.notes = additionalData.notes;
      }

      if (status === 'confirmed' && userId) {
        updateData.approvedBy = userId;
        updateData.approvedAt = new Date().toISOString();
      }

      await updateDoc(doc(db, this.PURCHASE_ORDERS_COLLECTION, orderId), updateData);

      // If order is completed, update stock levels
      if (status === 'completed') {
        await this.processCompletedOrder(orderId);
      }

      return true;

    } catch (error) {
      console.error('Error updating purchase order status:', error);
      return false;
    }
  }

  /**
   * Calculate supplier performance metrics
   */
  static async calculateSupplierPerformance(): Promise<SupplierPerformance[]> {
    try {
      const ordersSnapshot = await getDocs(collection(db, this.PURCHASE_ORDERS_COLLECTION));
      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PurchaseOrder[];

      const supplierMetrics = new Map<string, {
        orders: PurchaseOrder[];
        totalSpent: number;
        completedOrders: number;
        onTimeDeliveries: number;
        totalLeadTime: number;
      }>();

      // Group orders by supplier
      orders.forEach(order => {
        if (!supplierMetrics.has(order.supplierId)) {
          supplierMetrics.set(order.supplierId, {
            orders: [],
            totalSpent: 0,
            completedOrders: 0,
            onTimeDeliveries: 0,
            totalLeadTime: 0
          });
        }

        const metrics = supplierMetrics.get(order.supplierId)!;
        metrics.orders.push(order);
        metrics.totalSpent += order.totalCost;

        if (order.status === 'completed') {
          metrics.completedOrders++;

          // Calculate lead time and on-time delivery
          if (order.expectedDeliveryDate && order.actualDeliveryDate) {
            const expectedDate = new Date(order.expectedDeliveryDate);
            const actualDate = new Date(order.actualDeliveryDate);
            const leadTime = Math.ceil((actualDate.getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            
            metrics.totalLeadTime += leadTime;

            if (actualDate <= expectedDate) {
              metrics.onTimeDeliveries++;
            }
          }
        }
      });

      // Calculate performance scores
      const performance: SupplierPerformance[] = [];

      supplierMetrics.forEach((metrics, supplierId) => {
        const firstOrder = metrics.orders[0];
        const averageLeadTime = metrics.completedOrders > 0 ? metrics.totalLeadTime / metrics.completedOrders : 0;
        const onTimeDeliveryRate = metrics.completedOrders > 0 ? metrics.onTimeDeliveries / metrics.completedOrders : 0;
        
        // Simple scoring algorithm (can be enhanced)
        const qualityRating = 4.0; // Default, would come from quality assessments
        const costCompetitiveness = 3.5; // Default, would come from price comparisons
        const overallScore = (onTimeDeliveryRate * 0.4 + qualityRating / 5 * 0.3 + costCompetitiveness / 5 * 0.3) * 100;

        performance.push({
          supplierId,
          supplierName: firstOrder.supplierName,
          totalOrders: metrics.orders.length,
          completedOrders: metrics.completedOrders,
          averageLeadTime,
          onTimeDeliveryRate,
          qualityRating,
          costCompetitiveness,
          overallScore,
          lastOrderDate: metrics.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.createdAt,
          totalSpent: metrics.totalSpent,
          preferredSupplier: overallScore >= 80
        });
      });

      return performance.sort((a, b) => b.overallScore - a.overallScore);

    } catch (error) {
      console.error('Error calculating supplier performance:', error);
      return [];
    }
  }

  // Private helper methods

  private static calculateUrgencyLevel(currentStock: number, reorderPoint: number): ReorderSuggestion['urgencyLevel'] {
    const ratio = currentStock / reorderPoint;
    
    if (ratio <= 0) return 'critical';
    if (ratio <= 0.5) return 'high';
    if (ratio <= 0.8) return 'medium';
    return 'low';
  }

  private static calculateStockoutDate(currentStock: number, product: Product): string {
    // Simple calculation based on average daily usage
    // In a real system, this would use historical data
    const averageDailyUsage = 1; // Default assumption
    const daysUntilStockout = currentStock / averageDailyUsage;
    
    return new Date(Date.now() + daysUntilStockout * 24 * 60 * 60 * 1000).toISOString();
  }

  private static async processCompletedOrder(orderId: string): Promise<void> {
    try {
      const orderDoc = await getDoc(doc(db, this.PURCHASE_ORDERS_COLLECTION, orderId));
      if (!orderDoc.exists()) return;

      const order = { id: orderDoc.id, ...orderDoc.data() } as PurchaseOrder;
      const batch = writeBatch(db);

      // Update stock levels for each item
      for (const item of order.items) {
        const productDoc = await getDoc(doc(db, this.PRODUCTS_COLLECTION, item.productId));
        if (productDoc.exists()) {
          const product = productDoc.data() as Product;
          const newQuantity = (product.quantity || 0) + item.quantity;
          
          batch.update(doc(db, this.PRODUCTS_COLLECTION, item.productId), {
            quantity: newQuantity,
            updatedAt: new Date().toISOString()
          });
        }
      }

      await batch.commit();

    } catch (error) {
      console.error('Error processing completed order:', error);
    }
  }
}