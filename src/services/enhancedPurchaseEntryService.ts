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
import { EnhancedPurchaseOrder, EnhancedPurchaseItem, PurchaseEntry, EnhancedSupplier } from '@/types/enhancedPurchase';
import EnhancedStockService from './enhancedStockService';

export interface PurchaseEntryResult {
  success: boolean;
  purchaseEntryId?: string;
  purchaseOrderId?: string;
  stockUpdateResult?: any;
  errors?: string[];
  warnings?: string[];
}

export class EnhancedPurchaseEntryService {
  private static readonly PURCHASE_ORDERS_COLLECTION = 'enhanced_purchase_orders';
  private static readonly PURCHASE_ENTRIES_COLLECTION = 'purchase_entries';
  private static readonly SUPPLIERS_COLLECTION = 'enhanced_suppliers';
  private static readonly PRODUCTS_COLLECTION = 'products';

  /**
   * Create a comprehensive purchase entry with supplier and stock integration
   */
  static async createPurchaseEntry(
    purchaseData: Omit<EnhancedPurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>,
    autoUpdateStock: boolean = true
  ): Promise<PurchaseEntryResult> {
    const result: PurchaseEntryResult = {
      success: false,
      errors: [],
      warnings: []
    };

    try {
      // Validate supplier exists and is active
      const supplierValidation = await this.validateSupplier(purchaseData.supplierId);
      if (!supplierValidation.valid) {
        result.errors?.push(`Supplier validation failed: ${supplierValidation.error}`);
        return result;
      }

      // Validate all products exist and have sufficient details
      const productValidation = await this.validateProducts(purchaseData.items);
      if (!productValidation.valid) {
        result.errors?.push(`Product validation failed: ${productValidation.errors?.join(', ')}`);
        return result;
      }

      // Calculate totals and validate amounts
      const calculatedTotals = this.calculateTotals(purchaseData.items, {
        discount: purchaseData.discount || 0,
        discountType: purchaseData.discountType || 'amount',
        shippingCharges: purchaseData.shippingCharges || 0,
        otherCharges: purchaseData.otherCharges || 0
      });

      // Start transaction for data consistency
      const purchaseOrderId = await runTransaction(db, async (transaction) => {
        const now = new Date().toISOString();
        
        // Create enhanced purchase order
        const purchaseOrderRef = doc(collection(db, this.PURCHASE_ORDERS_COLLECTION));
        const enhancedPurchaseData: EnhancedPurchaseOrder = {
          ...purchaseData,
          id: purchaseOrderRef.id,
          ...calculatedTotals,
          createdAt: now,
          updatedAt: now,
          stockUpdated: false,
          autoUpdateStock
        };

        transaction.set(purchaseOrderRef, enhancedPurchaseData);

        // Update supplier's last order date and purchase count
        const supplierRef = doc(db, this.SUPPLIERS_COLLECTION, purchaseData.supplierId);
        transaction.update(supplierRef, {
          lastOrderDate: now,
          totalOrders: (supplierValidation.supplier?.totalOrders || 0) + 1,
          totalOrderValue: (supplierValidation.supplier?.totalOrderValue || 0) + calculatedTotals.totalAmount,
          updatedAt: now
        });

        // Update product purchase history
        for (const item of purchaseData.items) {
          const productRef = doc(db, this.PRODUCTS_COLLECTION, item.productId);
          transaction.update(productRef, {
            lastPurchasePrice: item.unitPrice,
            lastPurchaseDate: now,
            lastSupplierId: purchaseData.supplierId,
            lastSupplierName: purchaseData.supplierName,
            totalPurchaseValue: (item.totalPurchaseValue || 0) + item.totalPrice,
            purchaseCount: (item.purchaseCount || 0) + 1,
            updatedAt: now
          });
        }

        return purchaseOrderRef.id;
      });

      result.purchaseOrderId = purchaseOrderId;

      // If status is 'received', create purchase entry and update stock
      if (purchaseData.status === 'received' && autoUpdateStock) {
        const stockUpdateResult = await this.createPurchaseEntryAndUpdateStock(
          purchaseOrderId, 
          purchaseData
        );
        
        if (!stockUpdateResult.success) {
          result.warnings?.push('Purchase order created but stock update failed');
          result.warnings?.push(...(stockUpdateResult.errors || []));
        } else {
          result.stockUpdateResult = stockUpdateResult;
        }
      }

      result.success = true;
      result.purchaseEntryId = result.stockUpdateResult?.purchaseEntryId;

    } catch (error) {
      console.error('Error creating purchase entry:', error);
      result.errors?.push(`Failed to create purchase entry: ${error}`);
    }

    return result;
  }

  /**
   * Create purchase entry and update stock levels
   */
  static async createPurchaseEntryAndUpdateStock(
    purchaseOrderId: string,
    purchaseData: EnhancedPurchaseOrder
  ): Promise<PurchaseEntryResult> {
    const result: PurchaseEntryResult = {
      success: false,
      errors: [],
      warnings: []
    };

    try {
      const now = new Date().toISOString();
      
      // Generate purchase entry number
      const entryNumber = await this.generatePurchaseEntryNumber();

      const purchaseEntry: PurchaseEntry = {
        id: '', // Will be set by Firestore
        entryNumber,
        entryDate: now,
        type: 'purchase',
        purchaseOrderId,
        purchaseOrderNumber: purchaseData.purchaseOrderNumber,
        supplierId: purchaseData.supplierId,
        supplierName: purchaseData.supplierName,
        items: purchaseData.items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          orderedQuantity: item.quantity,
          receivedQuantity: item.quantity,
          acceptedQuantity: item.quantity,
          rejectedQuantity: 0,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          condition: 'good' as const,
          batchNumber: `BATCH-${Date.now()}`,
          location: 'MAIN-WAREHOUSE'
        })),
        totalAmount: purchaseData.totalAmount,
        taxAmount: purchaseData.totalGstAmount,
        qualityChecked: true,
        qualityCheckedBy: purchaseData.createdBy,
        qualityCheckDate: now,
        stockUpdated: false,
        status: 'approved',
        createdAt: now,
        updatedAt: now,
        createdBy: purchaseData.createdBy,
        userId: purchaseData.userId
      };

      // Start transaction for purchase entry and stock update
      const entryId = await runTransaction(db, async (transaction) => {
        // Create purchase entry
        const entryRef = doc(collection(db, this.PURCHASE_ENTRIES_COLLECTION));
        purchaseEntry.id = entryRef.id;
        transaction.set(entryRef, purchaseEntry);

        // Update stock for each item
        for (const item of purchaseData.items) {
          const productRef = doc(db, this.PRODUCTS_COLLECTION, item.productId);
          const productDoc = await transaction.get(productRef);
          
          if (productDoc.exists()) {
            const currentProduct = productDoc.data();
            const currentStock = currentProduct.stock || 0;
            const newStock = currentStock + item.quantity;
            
            // Update product stock and purchase price
            transaction.update(productRef, {
              stock: newStock,
              purchasePrice: item.unitPrice,
              lastPurchasePrice: item.unitPrice,
              lastPurchaseDate: now,
              lastStockUpdate: now,
              averagePurchasePrice: this.calculateAveragePurchasePrice(
                currentProduct.averagePurchasePrice || item.unitPrice,
                currentProduct.purchaseCount || 0,
                item.unitPrice,
                item.quantity
              ),
              totalPurchaseValue: (currentProduct.totalPurchaseValue || 0) + item.totalPrice,
              purchaseCount: (currentProduct.purchaseCount || 0) + 1,
              updatedAt: now
            });

            // Create stock movement entry
            const stockMovementRef = doc(collection(db, 'stock_movements'));
            transaction.set(stockMovementRef, {
              productId: item.productId,
              productName: item.productName,
              type: 'purchase',
              quantity: item.quantity,
              previousStock: currentStock,
              newStock: newStock,
              unitPrice: item.unitPrice,
              totalValue: item.totalPrice,
              referenceId: entryRef.id,
              referenceType: 'purchase_entry',
              referenceNumber: entryNumber,
              supplierId: purchaseData.supplierId,
              supplierName: purchaseData.supplierName,
              notes: `Purchase entry: ${entryNumber}`,
              createdAt: now,
              createdBy: purchaseData.createdBy,
              userId: purchaseData.userId
            });
          }
        }

        // Update purchase order status
        const purchaseOrderRef = doc(db, this.PURCHASE_ORDERS_COLLECTION, purchaseOrderId);
        transaction.update(purchaseOrderRef, {
          status: 'received',
          stockUpdated: true,
          receivedDate: now,
          completedDate: now,
          updatedAt: now
        });

        // Update purchase entry to mark stock as updated
        transaction.update(entryRef, {
          stockUpdated: true,
          stockUpdateDate: now,
          stockUpdateBy: purchaseData.createdBy
        });

        return entryRef.id;
      });

      result.success = true;
      result.purchaseEntryId = entryId;

    } catch (error) {
      console.error('Error creating purchase entry and updating stock:', error);
      result.errors?.push(`Failed to update stock: ${error}`);
    }

    return result;
  }

  /**
   * Validate supplier exists and is active
   */
  private static async validateSupplier(supplierId: string): Promise<{
    valid: boolean;
    supplier?: any;
    error?: string;
  }> {
    try {
      const supplierDoc = await getDoc(doc(db, this.SUPPLIERS_COLLECTION, supplierId));
      
      if (!supplierDoc.exists()) {
        return { valid: false, error: 'Supplier not found' };
      }

      const supplier = supplierDoc.data();
      if (!supplier.isActive) {
        return { valid: false, error: 'Supplier is not active' };
      }

      return { valid: true, supplier };
    } catch (error) {
      return { valid: false, error: `Validation error: ${error}` };
    }
  }

  /**
   * Validate all products exist and have valid details
   */
  private static async validateProducts(items: EnhancedPurchaseItem[]): Promise<{
    valid: boolean;
    errors?: string[];
  }> {
    const errors: string[] = [];

    try {
      for (const item of items) {
        // Check if product exists
        const productDoc = await getDoc(doc(db, this.PRODUCTS_COLLECTION, item.productId));
        
        if (!productDoc.exists()) {
          errors.push(`Product ${item.productName} not found`);
          continue;
        }

        const product = productDoc.data();
        if (!product.isActive) {
          errors.push(`Product ${item.productName} is not active`);
        }

        // Validate quantities and prices
        if (item.quantity <= 0) {
          errors.push(`Invalid quantity for product ${item.productName}`);
        }

        if (item.unitPrice <= 0) {
          errors.push(`Invalid unit price for product ${item.productName}`);
        }
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      return { valid: false, errors: [`Product validation error: ${error}`] };
    }
  }

  /**
   * Calculate totals including taxes and charges
   */
  private static calculateTotals(
    items: EnhancedPurchaseItem[],
    charges: {
      discount: number;
      discountType: 'amount' | 'percentage';
      shippingCharges: number;
      otherCharges: number;
    }
  ) {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalGstAmount = items.reduce((sum, item) => sum + (item.gstAmount || 0), 0);
    const totalCessAmount = items.reduce((sum, item) => sum + (item.cessAmount || 0), 0);

    let discountAmount = 0;
    if (charges.discountType === 'percentage') {
      discountAmount = (subtotal * charges.discount) / 100;
    } else {
      discountAmount = charges.discount;
    }

    const totalAmount = subtotal + totalGstAmount + totalCessAmount + 
                       charges.shippingCharges + charges.otherCharges - discountAmount;

    return {
      subtotal,
      totalGstAmount,
      totalCessAmount,
      totalAmount: Math.max(0, totalAmount) // Ensure non-negative
    };
  }

  /**
   * Calculate average purchase price
   */
  private static calculateAveragePurchasePrice(
    currentAverage: number,
    currentCount: number,
    newPrice: number,
    newQuantity: number
  ): number {
    const totalValue = (currentAverage * currentCount) + (newPrice * newQuantity);
    const totalCount = currentCount + newQuantity;
    return totalValue / totalCount;
  }

  /**
   * Generate unique purchase entry number
   */
  static async generatePurchaseEntryNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    const prefix = `PE-${year}${month}-`;
    
    try {
      // Get the latest purchase entry for this month
      const q = query(
        collection(db, this.PURCHASE_ENTRIES_COLLECTION),
        where('entryNumber', '>=', prefix),
        where('entryNumber', '<', prefix + 'Z'),
        orderBy('entryNumber', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      let nextNumber = 1;
      
      if (!snapshot.empty) {
        const lastEntry = snapshot.docs[0].data();
        const lastNumber = parseInt(lastEntry.entryNumber.split('-').pop() || '0');
        nextNumber = lastNumber + 1;
      }
      
      return `${prefix}${String(nextNumber).padStart(4, '0')}`;
      
    } catch (error) {
      console.error('Error generating entry number:', error);
      // Fallback to timestamp-based number
      return `PE-${Date.now()}`;
    }
  }

  /**
   * Get purchase entries with filtering
   */
  static async getPurchaseEntries(
    userId: string,
    filters?: {
      status?: string;
      supplierId?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
    }
  ): Promise<PurchaseEntry[]> {
    try {
      let q = query(
        collection(db, this.PURCHASE_ENTRIES_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      if (filters?.status && filters.status !== 'all') {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters?.supplierId) {
        q = query(q, where('supplierId', '==', filters.supplierId));
      }

      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseEntry));

    } catch (error) {
      console.error('Error fetching purchase entries:', error);
      throw error;
    }
  }

  /**
   * Get enhanced purchase orders
   */
  static async getPurchaseOrders(
    userId: string,
    filters?: {
      status?: string;
      supplierId?: string;
      limit?: number;
    }
  ): Promise<EnhancedPurchaseOrder[]> {
    try {
      let q = query(
        collection(db, this.PURCHASE_ORDERS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      if (filters?.status && filters.status !== 'all') {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters?.supplierId) {
        q = query(q, where('supplierId', '==', filters.supplierId));
      }

      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EnhancedPurchaseOrder));

    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      throw error;
    }
  }

  /**
   * Update purchase order status
   */
  static async updatePurchaseOrderStatus(
    purchaseOrderId: string,
    status: EnhancedPurchaseOrder['status'],
    userId: string
  ): Promise<boolean> {
    try {
      const purchaseOrderRef = doc(db, this.PURCHASE_ORDERS_COLLECTION, purchaseOrderId);
      
      await updateDoc(purchaseOrderRef, {
        status,
        updatedAt: new Date().toISOString(),
        ...(status === 'received' && { receivedDate: new Date().toISOString() }),
        ...(status === 'cancelled' && { cancelledDate: new Date().toISOString() })
      });

      return true;
    } catch (error) {
      console.error('Error updating purchase order status:', error);
      return false;
    }
  }

  /**
   * Get purchase orders by supplier
   */
  static async getPurchaseOrdersBySupplier(supplierId: string, userId: string): Promise<EnhancedPurchaseOrder[]> {
    try {
      const q = query(
        collection(db, this.PURCHASE_ORDERS_COLLECTION),
        where('userId', '==', userId),
        where('supplierId', '==', supplierId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as EnhancedPurchaseOrder));
    } catch (error) {
      console.error('Error getting purchase orders by supplier:', error);
      throw error;
    }
  }
}

export default EnhancedPurchaseEntryService;