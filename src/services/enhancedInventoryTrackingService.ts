import { db } from '@/firebase/config';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  writeBatch, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { Product, StockMovement } from '@/types/inventory';

export interface EnhancedStockMovement extends StockMovement {
  batchNumber?: string;
  expiryDate?: string;
  location?: string;
  binLocation?: string;
  costPerUnit?: number;
  totalCost?: number;
  supplierInfo?: {
    supplierId?: string;
    supplierName?: string;
    purchaseOrderId?: string;
  };
  customerInfo?: {
    customerId?: string;
    customerName?: string;
    invoiceId?: string;
  };
  adjustmentReason?: string;
  approvedBy?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface InventoryTransaction {
  id?: string;
  transactionType: 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'return' | 'damage' | 'theft';
  referenceNumber: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitCost?: number;
    totalCost?: number;
    batchNumber?: string;
    expiryDate?: string;
    location?: string;
  }>;
  totalQuantity: number;
  totalValue: number;
  status: 'pending' | 'completed' | 'cancelled' | 'partially_completed';
  notes?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface StockLevel {
  productId: string;
  productName: string;
  currentQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  inTransitQuantity: number;
  damagedQuantity: number;
  locations: Array<{
    locationId: string;
    locationName: string;
    quantity: number;
    binLocations?: Array<{
      binId: string;
      binName: string;
      quantity: number;
    }>;
  }>;
  batches?: Array<{
    batchNumber: string;
    quantity: number;
    expiryDate?: string;
    costPerUnit?: number;
  }>;
  lastMovementDate: string;
  lastCountDate?: string;
  variance?: number; // Difference between expected and actual count
}

export interface InventoryAnalytics {
  totalProducts: number;
  totalStockValue: number;
  totalMovements: number;
  movementsByType: Record<string, number>;
  topMovingProducts: Array<{
    productId: string;
    productName: string;
    totalMovements: number;
    netMovement: number;
    movementValue: number;
  }>;
  slowMovingProducts: Array<{
    productId: string;
    productName: string;
    daysSinceLastMovement: number;
    currentQuantity: number;
    stockValue: number;
  }>;
  stockTurnoverRates: Array<{
    productId: string;
    productName: string;
    turnoverRate: number;
    averageStockLevel: number;
    salesVelocity: number;
  }>;
  locationAnalytics: Array<{
    locationId: string;
    locationName: string;
    totalProducts: number;
    totalValue: number;
    utilizationRate: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    totalMovements: number;
    inboundQuantity: number;
    outboundQuantity: number;
    adjustments: number;
    stockValue: number;
  }>;
}

export interface StockAdjustment {
  id?: string;
  adjustmentNumber: string;
  adjustmentType: 'physical_count' | 'damage' | 'theft' | 'expiry' | 'correction' | 'write_off';
  items: Array<{
    productId: string;
    productName: string;
    expectedQuantity: number;
    actualQuantity: number;
    variance: number;
    reason: string;
    costImpact: number;
  }>;
  totalVariance: number;
  totalCostImpact: number;
  reason: string;
  notes?: string;
  countedBy?: string;
  verifiedBy?: string;
  approvedBy?: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
}

export class EnhancedInventoryTrackingService {
  private static readonly ENHANCED_MOVEMENTS_COLLECTION = 'enhanced_stock_movements';
  private static readonly INVENTORY_TRANSACTIONS_COLLECTION = 'inventory_transactions';
  private static readonly STOCK_ADJUSTMENTS_COLLECTION = 'stock_adjustments';
  private static readonly PRODUCTS_COLLECTION = 'products';
  private static readonly STOCK_LEVELS_COLLECTION = 'stock_levels';

  /**
   * Record enhanced stock movement with detailed tracking
   */
  static async recordMovement(movement: Omit<EnhancedStockMovement, 'id' | 'createdAt'>): Promise<string | null> {
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      // Create movement record
      const movementRef = doc(collection(db, this.ENHANCED_MOVEMENTS_COLLECTION));
      batch.set(movementRef, {
        ...movement,
        createdAt: now
      });

      // Update product quantity
      const productRef = doc(db, this.PRODUCTS_COLLECTION, movement.productId);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        const product = productSnap.data() as Product;
        const currentQuantity = product.quantity || 0;
        
        let newQuantity: number;
        switch (movement.movementType) {
          case 'in':
            newQuantity = currentQuantity + movement.quantity;
            break;
          case 'out':
            newQuantity = currentQuantity - movement.quantity;
            break;
          case 'adjustment':
            newQuantity = movement.newQuantity;
            break;
          default:
            newQuantity = currentQuantity;
        }

        batch.update(productRef, {
          quantity: newQuantity,
          updatedAt: now
        });

        // Update stock levels if location tracking is enabled
        if (movement.location) {
          await this.updateStockLevels(movement.productId, movement.location, movement.quantity, movement.movementType, batch);
        }
      }

      await batch.commit();
      return movementRef.id;

    } catch (error) {
      console.error('Error recording enhanced movement:', error);
      return null;
    }
  }

  /**
   * Create inventory transaction
   */
  static async createTransaction(transaction: Omit<InventoryTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
      const now = new Date().toISOString();
      
      const transactionDoc = await addDoc(collection(db, this.INVENTORY_TRANSACTIONS_COLLECTION), {
        ...transaction,
        createdAt: now,
        updatedAt: now
      });

      // If transaction is completed, record individual movements
      if (transaction.status === 'completed') {
        await this.processTransactionMovements(transactionDoc.id, transaction);
      }

      return transactionDoc.id;

    } catch (error) {
      console.error('Error creating inventory transaction:', error);
      return null;
    }
  }

  /**
   * Process stock adjustment
   */
  static async processStockAdjustment(adjustment: Omit<StockAdjustment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
      const now = new Date().toISOString();
      
      const adjustmentDoc = await addDoc(collection(db, this.STOCK_ADJUSTMENTS_COLLECTION), {
        ...adjustment,
        createdAt: now,
        updatedAt: now
      });

      // If adjustment is approved, apply the changes
      if (adjustment.status === 'approved') {
        await this.applyStockAdjustment(adjustmentDoc.id, adjustment);
      }

      return adjustmentDoc.id;

    } catch (error) {
      console.error('Error processing stock adjustment:', error);
      return null;
    }
  }

  /**
   * Get detailed stock levels for all products or specific products
   */
  static async getDetailedStockLevels(productIds?: string[]): Promise<StockLevel[]> {
    try {
      let productsQuery = collection(db, this.PRODUCTS_COLLECTION);
      if (productIds && productIds.length > 0) {
        productsQuery = query(productsQuery, where('__name__', 'in', productIds)) as any;
      }

      const productsSnapshot = await getDocs(productsQuery);
      const stockLevels: StockLevel[] = [];

      for (const productDoc of productsSnapshot.docs) {
        const product = { id: productDoc.id, ...productDoc.data() } as Product;
        
        // Get recent movements for this product
        const movementsQuery = query(
          collection(db, this.ENHANCED_MOVEMENTS_COLLECTION),
          where('productId', '==', product.id),
          orderBy('createdAt', 'desc'),
          limit(1)
        );

        const movementsSnapshot = await getDocs(movementsQuery);
        const lastMovement = movementsSnapshot.docs[0]?.data();

        // Calculate stock levels
        const stockLevel: StockLevel = {
          productId: product.id!,
          productName: product.name,
          currentQuantity: product.quantity || 0,
          reservedQuantity: 0, // TODO: Calculate from pending orders
          availableQuantity: product.quantity || 0,
          inTransitQuantity: 0, // TODO: Calculate from pending purchases
          damagedQuantity: 0, // TODO: Calculate from damage records
          locations: [], // TODO: Implement location tracking
          lastMovementDate: lastMovement?.createdAt || product.updatedAt,
          variance: 0
        };

        stockLevels.push(stockLevel);
      }

      return stockLevels;

    } catch (error) {
      console.error('Error getting detailed stock levels:', error);
      return [];
    }
  }

  /**
   * Get comprehensive inventory analytics
   */
  static async getInventoryAnalytics(
    dateRange?: { startDate: string; endDate: string }
  ): Promise<InventoryAnalytics> {
    try {
      const now = new Date();
      const defaultStartDate = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString();
      const defaultEndDate = now.toISOString();

      const startDate = dateRange?.startDate || defaultStartDate;
      const endDate = dateRange?.endDate || defaultEndDate;

      // Get all products
      const productsSnapshot = await getDocs(collection(db, this.PRODUCTS_COLLECTION));
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      // Get movements in date range
      const movementsQuery = query(
        collection(db, this.ENHANCED_MOVEMENTS_COLLECTION),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate),
        orderBy('createdAt', 'desc')
      );

      const movementsSnapshot = await getDocs(movementsQuery);
      const movements = movementsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EnhancedStockMovement[];

      // Calculate analytics
      const analytics: InventoryAnalytics = {
        totalProducts: products.length,
        totalStockValue: products.reduce((sum, p) => sum + (p.quantity || 0) * (p.price || 0), 0),
        totalMovements: movements.length,
        movementsByType: {},
        topMovingProducts: [],
        slowMovingProducts: [],
        stockTurnoverRates: [],
        locationAnalytics: [],
        monthlyTrends: []
      };

      // Count movements by type
      movements.forEach(movement => {
        const key = `${movement.movementType}_${movement.referenceType || 'other'}`;
        analytics.movementsByType[key] = (analytics.movementsByType[key] || 0) + 1;
      });

      // Calculate top moving products
      const productMovements = new Map<string, {
        productName: string;
        totalMovements: number;
        netMovement: number;
        movementValue: number;
      }>();

      movements.forEach(movement => {
        const existing = productMovements.get(movement.productId) || {
          productName: movement.productName,
          totalMovements: 0,
          netMovement: 0,
          movementValue: 0
        };

        existing.totalMovements += movement.quantity;
        existing.netMovement += movement.movementType === 'in' ? movement.quantity : -movement.quantity;
        existing.movementValue += (movement.totalCost || 0);

        productMovements.set(movement.productId, existing);
      });

      analytics.topMovingProducts = Array.from(productMovements.entries())
        .map(([productId, data]) => ({ productId, ...data }))
        .sort((a, b) => b.totalMovements - a.totalMovements)
        .slice(0, 20);

      // Calculate slow moving products
      const productLastMovement = new Map<string, string>();
      movements.forEach(movement => {
        if (!productLastMovement.has(movement.productId)) {
          productLastMovement.set(movement.productId, movement.createdAt);
        }
      });

      analytics.slowMovingProducts = products
        .filter(product => product.quantity && product.quantity > 0)
        .map(product => {
          const lastMovementDate = productLastMovement.get(product.id!) || product.updatedAt;
          const daysSinceLastMovement = Math.floor(
            (now.getTime() - new Date(lastMovementDate).getTime()) / (1000 * 60 * 60 * 24)
          );

          return {
            productId: product.id!,
            productName: product.name,
            daysSinceLastMovement,
            currentQuantity: product.quantity || 0,
            stockValue: (product.quantity || 0) * (product.price || 0)
          };
        })
        .filter(item => item.daysSinceLastMovement > 30)
        .sort((a, b) => b.daysSinceLastMovement - a.daysSinceLastMovement)
        .slice(0, 20);

      // Calculate monthly trends
      const monthlyData = new Map<string, {
        totalMovements: number;
        inboundQuantity: number;
        outboundQuantity: number;
        adjustments: number;
        stockValue: number;
      }>();

      movements.forEach(movement => {
        const monthKey = new Date(movement.createdAt).toISOString().substring(0, 7); // YYYY-MM
        const existing = monthlyData.get(monthKey) || {
          totalMovements: 0,
          inboundQuantity: 0,
          outboundQuantity: 0,
          adjustments: 0,
          stockValue: 0
        };

        existing.totalMovements += movement.quantity;
        if (movement.movementType === 'in') {
          existing.inboundQuantity += movement.quantity;
        } else if (movement.movementType === 'out') {
          existing.outboundQuantity += movement.quantity;
        } else {
          existing.adjustments += movement.quantity;
        }
        existing.stockValue += movement.totalCost || 0;

        monthlyData.set(monthKey, existing);
      });

      analytics.monthlyTrends = Array.from(monthlyData.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return analytics;

    } catch (error) {
      console.error('Error getting inventory analytics:', error);
      return {
        totalProducts: 0,
        totalStockValue: 0,
        totalMovements: 0,
        movementsByType: {},
        topMovingProducts: [],
        slowMovingProducts: [],
        stockTurnoverRates: [],
        locationAnalytics: [],
        monthlyTrends: []
      };
    }
  }

  /**
   * Get stock movement history with advanced filtering
   */
  static async getMovementHistory(
    filters: {
      productIds?: string[];
      movementTypes?: string[];
      referenceTypes?: string[];
      dateRange?: { startDate: string; endDate: string };
      locations?: string[];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    movements: EnhancedStockMovement[];
    totalCount: number;
    hasMore: boolean;
  }> {
    try {
      let q = collection(db, this.ENHANCED_MOVEMENTS_COLLECTION);

      // Apply filters
      if (filters.productIds && filters.productIds.length > 0) {
        q = query(q, where('productId', 'in', filters.productIds)) as any;
      }

      if (filters.movementTypes && filters.movementTypes.length > 0) {
        q = query(q, where('movementType', 'in', filters.movementTypes)) as any;
      }

      if (filters.dateRange) {
        q = query(q, 
          where('createdAt', '>=', filters.dateRange.startDate),
          where('createdAt', '<=', filters.dateRange.endDate)
        ) as any;
      }

      q = query(q, orderBy('createdAt', 'desc')) as any;

      if (filters.limit) {
        q = query(q, limit(filters.limit)) as any;
      }

      const snapshot = await getDocs(q);
      const movements = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EnhancedStockMovement[];

      // Apply client-side filters that can't be done in Firestore
      let filteredMovements = movements;

      if (filters.referenceTypes && filters.referenceTypes.length > 0) {
        filteredMovements = movements.filter(m => 
          filters.referenceTypes!.includes(m.referenceType || '')
        );
      }

      if (filters.locations && filters.locations.length > 0) {
        filteredMovements = movements.filter(m => 
          filters.locations!.includes(m.location || '')
        );
      }

      // Apply pagination
      const offset = filters.offset || 0;
      const limit = filters.limit || 50;
      const paginatedMovements = filteredMovements.slice(offset, offset + limit);

      return {
        movements: paginatedMovements,
        totalCount: filteredMovements.length,
        hasMore: filteredMovements.length > offset + limit
      };

    } catch (error) {
      console.error('Error getting movement history:', error);
      return {
        movements: [],
        totalCount: 0,
        hasMore: false
      };
    }
  }

  /**
   * Perform cycle count for specific products
   */
  static async performCycleCount(
    countData: {
      productId: string;
      expectedQuantity: number;
      actualQuantity: number;
      location?: string;
      notes?: string;
      countedBy?: string;
    }[]
  ): Promise<{
    adjustmentId: string | null;
    variances: Array<{
      productId: string;
      variance: number;
      costImpact: number;
    }>;
  }> {
    try {
      const variances: Array<{
        productId: string;
        variance: number;
        costImpact: number;
      }> = [];

      const adjustmentItems = [];
      let totalVariance = 0;
      let totalCostImpact = 0;

      for (const count of countData) {
        const variance = count.actualQuantity - count.expectedQuantity;
        
        if (variance !== 0) {
          // Get product to calculate cost impact
          const productDoc = await getDoc(doc(db, this.PRODUCTS_COLLECTION, count.productId));
          const product = productDoc.data() as Product;
          const costImpact = variance * (product.purchasePrice || product.price || 0);

          variances.push({
            productId: count.productId,
            variance,
            costImpact
          });

          adjustmentItems.push({
            productId: count.productId,
            productName: product.name,
            expectedQuantity: count.expectedQuantity,
            actualQuantity: count.actualQuantity,
            variance,
            reason: 'Cycle count adjustment',
            costImpact
          });

          totalVariance += Math.abs(variance);
          totalCostImpact += costImpact;
        }
      }

      let adjustmentId: string | null = null;

      if (adjustmentItems.length > 0) {
        // Create stock adjustment
        const adjustment: Omit<StockAdjustment, 'id' | 'createdAt' | 'updatedAt'> = {
          adjustmentNumber: `ADJ-${Date.now()}`,
          adjustmentType: 'physical_count',
          items: adjustmentItems,
          totalVariance,
          totalCostImpact,
          reason: 'Cycle count discrepancies',
          status: 'approved', // Auto-approve cycle count adjustments
          countedBy: countData[0]?.countedBy
        };

        adjustmentId = await this.processStockAdjustment(adjustment);
      }

      return { adjustmentId, variances };

    } catch (error) {
      console.error('Error performing cycle count:', error);
      return { adjustmentId: null, variances: [] };
    }
  }

  // Private helper methods

  private static async updateStockLevels(
    productId: string,
    location: string,
    quantity: number,
    movementType: string,
    batch: any
  ): Promise<void> {
    // Implementation for location-based stock level tracking
    // This would update a separate stock_levels collection
    // For now, we'll skip this as it requires additional setup
  }

  private static async processTransactionMovements(
    transactionId: string,
    transaction: Omit<InventoryTransaction, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      for (const item of transaction.items) {
        const movementType = transaction.transactionType === 'purchase' ? 'in' : 'out';
        
        const movement: Omit<EnhancedStockMovement, 'id' | 'createdAt'> = {
          productId: item.productId,
          productName: item.productName,
          movementType,
          quantity: item.quantity,
          previousQuantity: 0, // Will be calculated
          newQuantity: 0, // Will be calculated
          reason: `${transaction.transactionType} - ${transaction.referenceNumber}`,
          referenceType: transaction.transactionType as any,
          referenceId: transactionId,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          location: item.location,
          costPerUnit: item.unitCost,
          totalCost: item.totalCost
        };

        // Get current product quantity
        const productDoc = await getDoc(doc(db, this.PRODUCTS_COLLECTION, item.productId));
        if (productDoc.exists()) {
          const product = productDoc.data() as Product;
          movement.previousQuantity = product.quantity || 0;
          movement.newQuantity = movementType === 'in' 
            ? movement.previousQuantity + item.quantity
            : movement.previousQuantity - item.quantity;

          // Update product quantity
          batch.update(doc(db, this.PRODUCTS_COLLECTION, item.productId), {
            quantity: movement.newQuantity,
            updatedAt: now
          });

          // Create movement record
          const movementRef = doc(collection(db, this.ENHANCED_MOVEMENTS_COLLECTION));
          batch.set(movementRef, {
            ...movement,
            createdAt: now
          });
        }
      }

      await batch.commit();

    } catch (error) {
      console.error('Error processing transaction movements:', error);
    }
  }

  private static async applyStockAdjustment(
    adjustmentId: string,
    adjustment: Omit<StockAdjustment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      for (const item of adjustment.items) {
        if (item.variance !== 0) {
          // Create adjustment movement
          const movement: Omit<EnhancedStockMovement, 'id' | 'createdAt'> = {
            productId: item.productId,
            productName: item.productName,
            movementType: 'adjustment',
            quantity: Math.abs(item.variance),
            previousQuantity: item.expectedQuantity,
            newQuantity: item.actualQuantity,
            reason: `Stock adjustment - ${adjustment.adjustmentType}`,
            referenceType: 'adjustment',
            referenceId: adjustmentId,
            adjustmentReason: item.reason,
            totalCost: item.costImpact
          };

          // Update product quantity
          batch.update(doc(db, this.PRODUCTS_COLLECTION, item.productId), {
            quantity: item.actualQuantity,
            updatedAt: now
          });

          // Create movement record
          const movementRef = doc(collection(db, this.ENHANCED_MOVEMENTS_COLLECTION));
          batch.set(movementRef, {
            ...movement,
            createdAt: now
          });
        }
      }

      await batch.commit();

    } catch (error) {
      console.error('Error applying stock adjustment:', error);
    }
  }
}