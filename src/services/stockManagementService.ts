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
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { Product, StockMovement } from '@/types/inventory';

export interface StockUpdateRequest {
  productId: string;
  quantity: number;
  movementType: 'in' | 'out' | 'adjustment';
  reason: string;
  referenceType?: 'purchase' | 'sale' | 'adjustment' | 'return' | 'transfer';
  referenceId?: string;
  notes?: string;
  userId?: string;
}

export interface StockValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  availableStock?: number;
  requestedQuantity?: number;
}

export interface StockAlert {
  id?: string;
  productId: string;
  productName: string;
  alertType: 'low_stock' | 'out_of_stock' | 'overstock' | 'negative_stock';
  currentQuantity: number;
  threshold?: number;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

export interface StockSummary {
  totalProducts: number;
  totalStockValue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  overstockProducts: number;
  negativeStockProducts: number;
  recentMovements: StockMovement[];
  topMovingProducts: Array<{
    productId: string;
    productName: string;
    totalMovements: number;
    netMovement: number;
  }>;
}

export interface BulkStockUpdate {
  productId: string;
  newQuantity: number;
  reason?: string;
}

export class StockManagementService {
  private static readonly STOCK_MOVEMENTS_COLLECTION = 'stock_movements';
  private static readonly STOCK_ALERTS_COLLECTION = 'stock_alerts';
  private static readonly PRODUCTS_COLLECTION = 'products';

  /**
   * Update stock for a single product with validation and movement tracking
   */
  static async updateStock(request: StockUpdateRequest): Promise<{
    success: boolean;
    newQuantity?: number;
    movementId?: string;
    errors?: string[];
  }> {
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      // Get current product data
      const productRef = doc(db, this.PRODUCTS_COLLECTION, request.productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        return {
          success: false,
          errors: ['Product not found']
        };
      }

      const product = productSnap.data() as Product;
      const previousQuantity = product.quantity || 0;
      
      // Calculate new quantity based on movement type
      let newQuantity: number;
      switch (request.movementType) {
        case 'in':
          newQuantity = previousQuantity + request.quantity;
          break;
        case 'out':
          newQuantity = previousQuantity - request.quantity;
          break;
        case 'adjustment':
          newQuantity = request.quantity; // Direct set to new quantity
          break;
        default:
          return {
            success: false,
            errors: ['Invalid movement type']
          };
      }

      // Validate stock levels
      const validation = this.validateStockUpdate(product, newQuantity, request.quantity, request.movementType);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // Ensure quantity doesn't go negative (unless it's an adjustment)
      if (newQuantity < 0 && request.movementType !== 'adjustment') {
        return {
          success: false,
          errors: [`Insufficient stock. Available: ${previousQuantity}, Requested: ${request.quantity}`]
        };
      }

      // Create stock movement record
      const movementData: Omit<StockMovement, 'id'> = {
        productId: request.productId,
        productName: product.name,
        movementType: request.movementType,
        quantity: Math.abs(request.quantity),
        previousQuantity,
        newQuantity,
        reason: request.reason,
        referenceType: request.referenceType,
        referenceId: request.referenceId,
        notes: request.notes,
        createdAt: now,
        createdBy: request.userId
      };

      const movementRef = doc(collection(db, this.STOCK_MOVEMENTS_COLLECTION));
      batch.set(movementRef, movementData);

      // Update product quantity
      batch.update(productRef, {
        quantity: newQuantity,
        updatedAt: now
      });

      // Check for stock alerts
      await this.checkAndCreateStockAlerts(product, newQuantity, batch);

      await batch.commit();

      return {
        success: true,
        newQuantity,
        movementId: movementRef.id
      };

    } catch (error) {
      console.error('Error updating stock:', error);
      return {
        success: false,
        errors: ['Failed to update stock']
      };
    }
  }

  /**
   * Bulk update stock for multiple products (useful for purchase orders)
   */
  static async bulkUpdateStock(
    updates: BulkStockUpdate[],
    reason: string,
    referenceType?: string,
    referenceId?: string,
    userId?: string
  ): Promise<{
    success: boolean;
    successCount: number;
    failedUpdates: Array<{ productId: string; error: string }>;
  }> {
    const results = {
      success: true,
      successCount: 0,
      failedUpdates: [] as Array<{ productId: string; error: string }>
    };

    for (const update of updates) {
      try {
        const result = await this.updateStock({
          productId: update.productId,
          quantity: update.newQuantity,
          movementType: 'adjustment',
          reason: update.reason || reason,
          referenceType: referenceType as any,
          referenceId,
          userId
        });

        if (result.success) {
          results.successCount++;
        } else {
          results.failedUpdates.push({
            productId: update.productId,
            error: result.errors?.join(', ') || 'Unknown error'
          });
        }
      } catch (error) {
        results.failedUpdates.push({
          productId: update.productId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    results.success = results.failedUpdates.length === 0;
    return results;
  }

  /**
   * Process stock updates for invoice items
   */
  static async processInvoiceStockUpdates(
    invoiceItems: Array<{
      productId: string;
      quantity: number;
      productName?: string;
    }>,
    invoiceType: 'sales' | 'purchase',
    invoiceNumber: string,
    userId?: string
  ): Promise<{
    success: boolean;
    processedItems: number;
    errors: Array<{ productId: string; error: string }>;
  }> {
    const results = {
      success: true,
      processedItems: 0,
      errors: [] as Array<{ productId: string; error: string }>
    };

    const movementType = invoiceType === 'sales' ? 'out' : 'in';
    const reason = `${invoiceType === 'sales' ? 'Sale' : 'Purchase'} - Invoice ${invoiceNumber}`;

    for (const item of invoiceItems) {
      try {
        const result = await this.updateStock({
          productId: item.productId,
          quantity: item.quantity,
          movementType,
          reason,
          referenceType: invoiceType === 'sales' ? 'sale' : 'purchase',
          referenceId: invoiceNumber,
          userId
        });

        if (result.success) {
          results.processedItems++;
        } else {
          results.errors.push({
            productId: item.productId,
            error: result.errors?.join(', ') || 'Unknown error'
          });
        }
      } catch (error) {
        results.errors.push({
          productId: item.productId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    results.success = results.errors.length === 0;
    return results;
  }

  /**
   * Validate stock availability before creating sales invoice
   */
  static async validateStockForSale(
    items: Array<{ productId: string; quantity: number }>
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    itemValidations: Array<{
      productId: string;
      isValid: boolean;
      availableStock: number;
      requestedQuantity: number;
      error?: string;
      warning?: string;
    }>;
  }> {
    const result = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      itemValidations: [] as Array<{
        productId: string;
        isValid: boolean;
        availableStock: number;
        requestedQuantity: number;
        error?: string;
        warning?: string;
      }>
    };

    for (const item of items) {
      try {
        const productRef = doc(db, this.PRODUCTS_COLLECTION, item.productId);
        const productSnap = await getDoc(productRef);
        
        if (!productSnap.exists()) {
          result.isValid = false;
          result.errors.push(`Product ${item.productId} not found`);
          result.itemValidations.push({
            productId: item.productId,
            isValid: false,
            availableStock: 0,
            requestedQuantity: item.quantity,
            error: 'Product not found'
          });
          continue;
        }

        const product = productSnap.data() as Product;
        const availableStock = product.quantity || 0;
        const itemValidation = {
          productId: item.productId,
          isValid: true,
          availableStock,
          requestedQuantity: item.quantity
        };

        // Check if sufficient stock is available
        if (availableStock < item.quantity) {
          result.isValid = false;
          itemValidation.isValid = false;
          itemValidation.error = `Insufficient stock. Available: ${availableStock}, Requested: ${item.quantity}`;
          result.errors.push(`${product.name}: ${itemValidation.error}`);
        }

        // Check for low stock warning
        const minStockLevel = product.minStockLevel || product.reorderPoint || 5;
        if (availableStock - item.quantity <= minStockLevel && availableStock >= item.quantity) {
          itemValidation.warning = `Stock will be low after this sale. Remaining: ${availableStock - item.quantity}`;
          result.warnings.push(`${product.name}: ${itemValidation.warning}`);
        }

        result.itemValidations.push(itemValidation);

      } catch (error) {
        result.isValid = false;
        result.errors.push(`Error validating stock for product ${item.productId}`);
        result.itemValidations.push({
          productId: item.productId,
          isValid: false,
          availableStock: 0,
          requestedQuantity: item.quantity,
          error: 'Validation error'
        });
      }
    }

    return result;
  }

  /**
   * Get stock movements for a product
   */
  static async getProductStockMovements(
    productId: string,
    limitCount: number = 50
  ): Promise<StockMovement[]> {
    try {
      const q = query(
        collection(db, this.STOCK_MOVEMENTS_COLLECTION),
        where('productId', '==', productId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StockMovement[];

    } catch (error) {
      console.error('Error fetching stock movements:', error);
      return [];
    }
  }

  /**
   * Get recent stock movements across all products
   */
  static async getRecentStockMovements(limitCount: number = 100): Promise<StockMovement[]> {
    try {
      const q = query(
        collection(db, this.STOCK_MOVEMENTS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StockMovement[];

    } catch (error) {
      console.error('Error fetching recent stock movements:', error);
      return [];
    }
  }

  /**
   * Get all stock movements with pagination
   */
  static async getAllStockMovements(limitCount: number = 1000): Promise<StockMovement[]> {
    try {
      const q = query(
        collection(db, this.STOCK_MOVEMENTS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StockMovement[];

    } catch (error) {
      console.error('Error fetching all stock movements:', error);
      return [];
    }
  }

  /**
   * Get stock alerts
   */
  static async getStockAlerts(activeOnly: boolean = true): Promise<StockAlert[]> {
    try {
      let q = query(collection(db, this.STOCK_ALERTS_COLLECTION));
      
      if (activeOnly) {
        q = query(q, where('isActive', '==', true));
      }
      
      q = query(q, orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StockAlert[];

    } catch (error) {
      console.error('Error fetching stock alerts:', error);
      return [];
    }
  }

  /**
   * Acknowledge stock alert
   */
  static async acknowledgeStockAlert(alertId: string, userId?: string): Promise<boolean> {
    try {
      const alertRef = doc(db, this.STOCK_ALERTS_COLLECTION, alertId);
      await updateDoc(alertRef, {
        isActive: false,
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy: userId
      });
      return true;
    } catch (error) {
      console.error('Error acknowledging stock alert:', error);
      return false;
    }
  }

  /**
   * Get stock summary and analytics
   */
  static async getStockSummary(): Promise<StockSummary> {
    try {
      // Get all products
      const productsSnapshot = await getDocs(collection(db, this.PRODUCTS_COLLECTION));
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      // Calculate summary statistics
      const totalProducts = products.length;
      const totalStockValue = products.reduce((sum, product) => 
        sum + (product.quantity || 0) * (product.price || 0), 0
      );

      const lowStockProducts = products.filter(product => {
        const minLevel = product.minStockLevel || product.reorderPoint || 5;
        return (product.quantity || 0) <= minLevel && (product.quantity || 0) > 0;
      }).length;

      const outOfStockProducts = products.filter(product => 
        (product.quantity || 0) === 0
      ).length;

      const overstockProducts = products.filter(product => {
        const maxLevel = product.maxStockLevel;
        return maxLevel && (product.quantity || 0) > maxLevel;
      }).length;

      const negativeStockProducts = products.filter(product => 
        (product.quantity || 0) < 0
      ).length;

      // Get recent movements
      const recentMovements = await this.getRecentStockMovements(20);

      // Calculate top moving products
      const movementMap = new Map<string, { totalMovements: number; netMovement: number; productName: string }>();
      
      recentMovements.forEach(movement => {
        const existing = movementMap.get(movement.productId) || {
          totalMovements: 0,
          netMovement: 0,
          productName: movement.productName
        };
        
        existing.totalMovements += movement.quantity;
        existing.netMovement += movement.movementType === 'in' ? movement.quantity : -movement.quantity;
        movementMap.set(movement.productId, existing);
      });

      const topMovingProducts = Array.from(movementMap.entries())
        .map(([productId, data]) => ({
          productId,
          productName: data.productName,
          totalMovements: data.totalMovements,
          netMovement: data.netMovement
        }))
        .sort((a, b) => b.totalMovements - a.totalMovements)
        .slice(0, 10);

      return {
        totalProducts,
        totalStockValue,
        lowStockProducts,
        outOfStockProducts,
        overstockProducts,
        negativeStockProducts,
        recentMovements,
        topMovingProducts
      };

    } catch (error) {
      console.error('Error getting stock summary:', error);
      return {
        totalProducts: 0,
        totalStockValue: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        overstockProducts: 0,
        negativeStockProducts: 0,
        recentMovements: [],
        topMovingProducts: []
      };
    }
  }

  /**
   * Private method to validate stock update
   */
  private static validateStockUpdate(
    product: Product,
    newQuantity: number,
    requestedQuantity: number,
    movementType: string
  ): StockValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for negative stock (except for adjustments)
    if (newQuantity < 0 && movementType !== 'adjustment') {
      errors.push(`Stock cannot go negative. Current: ${product.quantity}, Requested: ${requestedQuantity}`);
    }

    // Check against maximum stock level
    if (product.maxStockLevel && newQuantity > product.maxStockLevel) {
      warnings.push(`Stock will exceed maximum level (${product.maxStockLevel}). New quantity: ${newQuantity}`);
    }

    // Check against minimum stock level
    const minLevel = product.minStockLevel || product.reorderPoint || 0;
    if (newQuantity <= minLevel && newQuantity > 0) {
      warnings.push(`Stock will be below minimum level (${minLevel}). New quantity: ${newQuantity}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      availableStock: product.quantity,
      requestedQuantity
    };
  }

  /**
   * Private method to check and create stock alerts
   */
  private static async checkAndCreateStockAlerts(
    product: Product,
    newQuantity: number,
    batch: any
  ): Promise<void> {
    const alerts: Omit<StockAlert, 'id'>[] = [];
    const now = new Date().toISOString();

    // Check for out of stock
    if (newQuantity === 0) {
      alerts.push({
        productId: product.id!,
        productName: product.name,
        alertType: 'out_of_stock',
        currentQuantity: newQuantity,
        message: `${product.name} is out of stock`,
        severity: 'critical',
        isActive: true,
        createdAt: now
      });
    }
    // Check for low stock
    else if (newQuantity <= (product.minStockLevel || product.reorderPoint || 5)) {
      alerts.push({
        productId: product.id!,
        productName: product.name,
        alertType: 'low_stock',
        currentQuantity: newQuantity,
        threshold: product.minStockLevel || product.reorderPoint || 5,
        message: `${product.name} is running low on stock`,
        severity: 'high',
        isActive: true,
        createdAt: now
      });
    }

    // Check for overstock
    if (product.maxStockLevel && newQuantity > product.maxStockLevel) {
      alerts.push({
        productId: product.id!,
        productName: product.name,
        alertType: 'overstock',
        currentQuantity: newQuantity,
        threshold: product.maxStockLevel,
        message: `${product.name} stock exceeds maximum level`,
        severity: 'medium',
        isActive: true,
        createdAt: now
      });
    }

    // Check for negative stock
    if (newQuantity < 0) {
      alerts.push({
        productId: product.id!,
        productName: product.name,
        alertType: 'negative_stock',
        currentQuantity: newQuantity,
        message: `${product.name} has negative stock`,
        severity: 'critical',
        isActive: true,
        createdAt: now
      });
    }

    // Add alerts to batch
    for (const alert of alerts) {
      const alertRef = doc(collection(db, this.STOCK_ALERTS_COLLECTION));
      batch.set(alertRef, alert);
    }
  }

  /**
   * Revert stock changes (useful when canceling invoices)
   */
  static async revertInvoiceStockUpdates(
    invoiceItems: Array<{
      productId: string;
      quantity: number;
      productName?: string;
    }>,
    originalInvoiceType: 'sales' | 'purchase',
    invoiceNumber: string,
    userId?: string
  ): Promise<{
    success: boolean;
    revertedItems: number;
    errors: Array<{ productId: string; error: string }>;
  }> {
    // Reverse the movement type for reversion
    const movementType = originalInvoiceType === 'sales' ? 'in' : 'out';
    const reason = `Revert ${originalInvoiceType === 'sales' ? 'Sale' : 'Purchase'} - Invoice ${invoiceNumber}`;

    return this.processInvoiceStockUpdates(
      invoiceItems,
      originalInvoiceType === 'sales' ? 'purchase' : 'sales', // Reverse the type
      invoiceNumber,
      userId
    );
  }
}

export default StockManagementService;