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
  increment,
  runTransaction
} from 'firebase/firestore';
import { Product } from '@/types/inventory';
import { Invoice, InvoiceItem } from '@/types/invoice';

export interface StockMovement {
  id?: string;
  productId: string;
  productName: string;
  movementType: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  referenceType: 'invoice' | 'purchase' | 'adjustment' | 'return' | 'transfer';
  referenceId: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
  userId?: string;
}

export interface StockValidationResult {
  isValid: boolean;
  errors: Array<{
    productId: string;
    productName: string;
    availableStock: number;
    requestedQuantity: number;
    shortfall: number;
    message: string;
  }>;
  warnings: Array<{
    productId: string;
    productName: string;
    message: string;
  }>;
}

export interface StockUpdateResult {
  success: boolean;
  processedItems: number;
  errors: Array<{
    productId: string;
    productName: string;
    error: string;
  }>;
  movements: StockMovement[];
}

export class EnhancedStockService {
  private static readonly PRODUCTS_COLLECTION = 'products';
  private static readonly STOCK_MOVEMENTS_COLLECTION = 'stock_movements';
  private static readonly INVOICES_COLLECTION = 'invoices';

  /**
   * Validate stock availability for invoice items
   */
  static async validateStockForInvoice(
    items: InvoiceItem[],
    invoiceType: 'sales' | 'purchase' = 'sales'
  ): Promise<StockValidationResult> {
    const result: StockValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Only validate stock for sales invoices
    if (invoiceType !== 'sales') {
      return result;
    }

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        continue;
      }

      try {
        const productRef = doc(db, this.PRODUCTS_COLLECTION, item.productId);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
          result.isValid = false;
          result.errors.push({
            productId: item.productId,
            productName: item.name || 'Unknown Product',
            availableStock: 0,
            requestedQuantity: item.quantity,
            shortfall: item.quantity,
            message: `Product not found`
          });
          continue;
        }

        const product = productSnap.data() as Product;
        const availableStock = product.quantity || product.stock || 0;
        const requestedQuantity = item.quantity;

        // Check if sufficient stock is available
        if (availableStock < requestedQuantity) {
          result.isValid = false;
          result.errors.push({
            productId: item.productId,
            productName: product.name,
            availableStock,
            requestedQuantity,
            shortfall: requestedQuantity - availableStock,
            message: `Insufficient stock. Available: ${availableStock}, Required: ${requestedQuantity}`
          });
        } else {
          // Check for low stock warning
          const minStockLevel = product.minStockLevel || product.reorderPoint || 5;
          const remainingStock = availableStock - requestedQuantity;
          
          if (remainingStock <= minStockLevel && remainingStock > 0) {
            result.warnings.push({
              productId: item.productId,
              productName: product.name,
              message: `Stock will be low after this sale. Remaining: ${remainingStock}, Min Level: ${minStockLevel}`
            });
          } else if (remainingStock === 0) {
            result.warnings.push({
              productId: item.productId,
              productName: product.name,
              message: `Product will be out of stock after this sale`
            });
          }
        }
      } catch (error) {
        console.error(`Error validating stock for product ${item.productId}:`, error);
        result.isValid = false;
        result.errors.push({
          productId: item.productId,
          productName: item.name || 'Unknown Product',
          availableStock: 0,
          requestedQuantity: item.quantity,
          shortfall: item.quantity,
          message: 'Error checking stock availability'
        });
      }
    }

    return result;
  }

  /**
   * Process stock updates for invoice creation
   */
  static async processInvoiceStockUpdates(
    invoice: Partial<Invoice>,
    invoiceType: 'sales' | 'purchase' = 'sales'
  ): Promise<StockUpdateResult> {
    const result: StockUpdateResult = {
      success: true,
      processedItems: 0,
      errors: [],
      movements: []
    };

    if (!invoice.items || invoice.items.length === 0) {
      return result;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const movements: StockMovement[] = [];
        const now = new Date().toISOString();

        for (const item of invoice.items!) {
          if (!item.productId || !item.quantity || item.quantity <= 0) {
            continue;
          }

          const productRef = doc(db, this.PRODUCTS_COLLECTION, item.productId);
          const productSnap = await transaction.get(productRef);

          if (!productSnap.exists()) {
            result.errors.push({
              productId: item.productId,
              productName: item.name || 'Unknown Product',
              error: 'Product not found'
            });
            continue;
          }

          const product = productSnap.data() as Product;
          const currentStock = product.quantity || product.stock || 0;
          const movementType = invoiceType === 'sales' ? 'out' : 'in';
          const newStock = invoiceType === 'sales' 
            ? currentStock - item.quantity 
            : currentStock + item.quantity;

          // For sales, check if we have enough stock
          if (invoiceType === 'sales' && currentStock < item.quantity) {
            result.errors.push({
              productId: item.productId,
              productName: product.name,
              error: `Insufficient stock. Available: ${currentStock}, Required: ${item.quantity}`
            });
            continue;
          }

          // Update product stock
          transaction.update(productRef, {
            quantity: newStock,
            stock: newStock, // Update both fields for compatibility
            updatedAt: now
          });

          // Create stock movement record
          const movement: StockMovement = {
            productId: item.productId,
            productName: product.name,
            movementType,
            quantity: item.quantity,
            previousQuantity: currentStock,
            newQuantity: newStock,
            reason: `${invoiceType === 'sales' ? 'Sale' : 'Purchase'} - Invoice ${invoice.invoiceNumber}`,
            referenceType: 'invoice',
            referenceId: invoice.id || '',
            referenceNumber: invoice.invoiceNumber,
            notes: `${invoiceType === 'sales' ? 'Stock reduced' : 'Stock increased'} due to invoice`,
            createdAt: now,
            createdBy: invoice.userId,
            userId: invoice.userId
          };

          const movementRef = doc(collection(db, this.STOCK_MOVEMENTS_COLLECTION));
          transaction.set(movementRef, movement);

          movements.push({ ...movement, id: movementRef.id });
          result.processedItems++;
        }

        result.movements = movements;
        
        if (result.errors.length > 0) {
          result.success = false;
          throw new Error(`Stock update failed for ${result.errors.length} items`);
        }
      });

    } catch (error) {
      console.error('Error processing stock updates:', error);
      result.success = false;
      if (result.errors.length === 0) {
        result.errors.push({
          productId: 'general',
          productName: 'General Error',
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    }

    return result;
  }

  /**
   * Revert stock changes when invoice is edited or deleted
   */
  static async revertInvoiceStockUpdates(
    originalInvoice: Invoice,
    invoiceType: 'sales' | 'purchase' = 'sales'
  ): Promise<StockUpdateResult> {
    const result: StockUpdateResult = {
      success: true,
      processedItems: 0,
      errors: [],
      movements: []
    };

    if (!originalInvoice.items || originalInvoice.items.length === 0) {
      return result;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const movements: StockMovement[] = [];
        const now = new Date().toISOString();

        for (const item of originalInvoice.items) {
          if (!item.productId || !item.quantity || item.quantity <= 0) {
            continue;
          }

          const productRef = doc(db, this.PRODUCTS_COLLECTION, item.productId);
          const productSnap = await transaction.get(productRef);

          if (!productSnap.exists()) {
            result.errors.push({
              productId: item.productId,
              productName: item.name || 'Unknown Product',
              error: 'Product not found during revert'
            });
            continue;
          }

          const product = productSnap.data() as Product;
          const currentStock = product.quantity || product.stock || 0;
          
          // Reverse the original movement
          const movementType = invoiceType === 'sales' ? 'in' : 'out';
          const newStock = invoiceType === 'sales' 
            ? currentStock + item.quantity  // Add back stock for sales
            : currentStock - item.quantity; // Remove stock for purchase

          // Ensure stock doesn't go negative
          const finalStock = Math.max(0, newStock);

          // Update product stock
          transaction.update(productRef, {
            quantity: finalStock,
            stock: finalStock,
            updatedAt: now
          });

          // Create stock movement record for revert
          const movement: StockMovement = {
            productId: item.productId,
            productName: product.name,
            movementType,
            quantity: item.quantity,
            previousQuantity: currentStock,
            newQuantity: finalStock,
            reason: `Revert ${invoiceType === 'sales' ? 'Sale' : 'Purchase'} - Invoice ${originalInvoice.invoiceNumber}`,
            referenceType: 'invoice',
            referenceId: originalInvoice.id || '',
            referenceNumber: originalInvoice.invoiceNumber,
            notes: `Stock reverted due to invoice ${originalInvoice.id ? 'update' : 'deletion'}`,
            createdAt: now,
            createdBy: originalInvoice.userId,
            userId: originalInvoice.userId
          };

          const movementRef = doc(collection(db, this.STOCK_MOVEMENTS_COLLECTION));
          transaction.set(movementRef, movement);

          movements.push({ ...movement, id: movementRef.id });
          result.processedItems++;
        }

        result.movements = movements;
      });

    } catch (error) {
      console.error('Error reverting stock updates:', error);
      result.success = false;
      result.errors.push({
        productId: 'general',
        productName: 'General Error',
        error: error instanceof Error ? error.message : 'Unknown error occurred during revert'
      });
    }

    return result;
  }

  /**
   * Get stock movements for a specific invoice
   */
  static async getInvoiceStockMovements(invoiceId: string): Promise<StockMovement[]> {
    try {
      const q = query(
        collection(db, this.STOCK_MOVEMENTS_COLLECTION),
        where('referenceId', '==', invoiceId),
        where('referenceType', '==', 'invoice'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StockMovement[];

    } catch (error) {
      console.error('Error fetching invoice stock movements:', error);
      return [];
    }
  }

  /**
   * Get stock movements for a specific product
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
      console.error('Error fetching product stock movements:', error);
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
   * Manual stock adjustment
   */
  static async adjustStock(
    productId: string,
    newQuantity: number,
    reason: string,
    userId?: string,
    notes?: string
  ): Promise<StockUpdateResult> {
    const result: StockUpdateResult = {
      success: true,
      processedItems: 0,
      errors: [],
      movements: []
    };

    try {
      await runTransaction(db, async (transaction) => {
        const productRef = doc(db, this.PRODUCTS_COLLECTION, productId);
        const productSnap = await transaction.get(productRef);

        if (!productSnap.exists()) {
          result.success = false;
          result.errors.push({
            productId,
            productName: 'Unknown Product',
            error: 'Product not found'
          });
          return;
        }

        const product = productSnap.data() as Product;
        const currentStock = product.quantity || product.stock || 0;
        const now = new Date().toISOString();

        // Ensure new quantity is not negative
        const finalQuantity = Math.max(0, newQuantity);

        // Update product stock
        transaction.update(productRef, {
          quantity: finalQuantity,
          stock: finalQuantity,
          updatedAt: now
        });

        // Create stock movement record
        const movement: StockMovement = {
          productId,
          productName: product.name,
          movementType: 'adjustment',
          quantity: Math.abs(finalQuantity - currentStock),
          previousQuantity: currentStock,
          newQuantity: finalQuantity,
          reason,
          referenceType: 'adjustment',
          referenceId: `ADJ-${Date.now()}`,
          notes: notes || 'Manual stock adjustment',
          createdAt: now,
          createdBy: userId,
          userId
        };

        const movementRef = doc(collection(db, this.STOCK_MOVEMENTS_COLLECTION));
        transaction.set(movementRef, movement);

        result.movements.push({ ...movement, id: movementRef.id });
        result.processedItems = 1;
      });

    } catch (error) {
      console.error('Error adjusting stock:', error);
      result.success = false;
      result.errors.push({
        productId,
        productName: 'Unknown Product',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }

    return result;
  }

  /**
   * Get low stock products
   */
  static async getLowStockProducts(threshold?: number): Promise<Product[]> {
    try {
      const productsSnapshot = await getDocs(collection(db, this.PRODUCTS_COLLECTION));
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      return products.filter(product => {
        const currentStock = product.quantity || product.stock || 0;
        const minLevel = threshold || product.minStockLevel || product.reorderPoint || 5;
        return currentStock <= minLevel && currentStock >= 0;
      });

    } catch (error) {
      console.error('Error fetching low stock products:', error);
      return [];
    }
  }

  /**
   * Get out of stock products
   */
  static async getOutOfStockProducts(): Promise<Product[]> {
    try {
      const productsSnapshot = await getDocs(collection(db, this.PRODUCTS_COLLECTION));
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      return products.filter(product => {
        const currentStock = product.quantity || product.stock || 0;
        return currentStock <= 0;
      });

    } catch (error) {
      console.error('Error fetching out of stock products:', error);
      return [];
    }
  }

  /**
   * Get stock summary
   */
  static async getStockSummary(): Promise<{
    totalProducts: number;
    totalStockValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    recentMovements: StockMovement[];
  }> {
    try {
      const [products, recentMovements] = await Promise.all([
        getDocs(collection(db, this.PRODUCTS_COLLECTION)),
        this.getRecentStockMovements(10)
      ]);

      const productList = products.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      const totalProducts = productList.length;
      const totalStockValue = productList.reduce((sum, product) => {
        const stock = product.quantity || product.stock || 0;
        const price = product.price || 0;
        return sum + (stock * price);
      }, 0);

      const lowStockCount = productList.filter(product => {
        const currentStock = product.quantity || product.stock || 0;
        const minLevel = product.minStockLevel || product.reorderPoint || 5;
        return currentStock <= minLevel && currentStock > 0;
      }).length;

      const outOfStockCount = productList.filter(product => {
        const currentStock = product.quantity || product.stock || 0;
        return currentStock <= 0;
      }).length;

      return {
        totalProducts,
        totalStockValue,
        lowStockCount,
        outOfStockCount,
        recentMovements
      };

    } catch (error) {
      console.error('Error getting stock summary:', error);
      return {
        totalProducts: 0,
        totalStockValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        recentMovements: []
      };
    }
  }
}

export default EnhancedStockService;