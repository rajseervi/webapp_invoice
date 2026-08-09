import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  runTransaction,
  writeBatch,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { Invoice, InvoiceItem } from '@/types/invoice';
import EnhancedStockService from './enhancedStockService';
import { cleanInvoiceData } from '@/utils/firestoreUtils';

export interface OptimizedInvoiceOptions {
  // Stock management options
  allowInsufficientStock: boolean;
  validateStock: boolean;
  updateStock: boolean;
  
  // Performance options
  batchOperations: boolean;
  skipDuplicateChecks: boolean;
  preloadProducts: boolean;
  
  // Business logic options
  autoGenerateInvoiceNumber: boolean;
  createTransaction: boolean;
  
  // Notification options
  showStockWarnings: boolean;
  warnOnLowStock: boolean;
}

export interface InvoiceCreationResult {
  success: boolean;
  invoiceId?: string;
  invoiceNumber?: string;
  stockWarnings?: StockWarning[];
  stockErrors?: StockError[];
  errors?: string[];
  warnings?: string[];
  executionTime?: number;
}

export interface StockWarning {
  productId: string;
  productName: string;
  availableStock: number;
  requestedQuantity: number;
  shortfall: number;
  message: string;
  severity: 'low' | 'out-of-stock' | 'insufficient';
}

export interface StockError {
  productId: string;
  productName: string;
  message: string;
  canProceed: boolean;
}

export class OptimizedInvoiceService {
  private static readonly INVOICES_COLLECTION = 'invoices';
  private static readonly PRODUCTS_COLLECTION = 'products';
  private static readonly TRANSACTIONS_COLLECTION = 'transactions';

  /**
   * Create invoice with optimized performance and flexible stock handling
   */
  static async createOptimizedInvoice(
    invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>,
    options: Partial<OptimizedInvoiceOptions> = {}
  ): Promise<InvoiceCreationResult> {
    const startTime = Date.now();
    
    // Default options
    const opts: OptimizedInvoiceOptions = {
      allowInsufficientStock: true, // Allow by default
      validateStock: true,
      updateStock: true,
      batchOperations: true,
      skipDuplicateChecks: false,
      preloadProducts: true,
      autoGenerateInvoiceNumber: true,
      createTransaction: true,
      showStockWarnings: true,
      warnOnLowStock: true,
      ...options
    };

    const result: InvoiceCreationResult = {
      success: false,
      stockWarnings: [],
      stockErrors: [],
      errors: [],
      warnings: []
    };

    try {
      // Step 1: Generate invoice number if needed
      if (opts.autoGenerateInvoiceNumber && !invoiceData.invoiceNumber) {
        invoiceData.invoiceNumber = await this.generateInvoiceNumber();
      }

      // Step 2: Preload products if enabled (performance optimization)
      let productsMap: Map<string, any> = new Map();
      if (opts.preloadProducts && invoiceData.items) {
        productsMap = await this.preloadProducts(invoiceData.items);
      }

      // Step 3: Stock validation (flexible handling)
      if (opts.validateStock && invoiceData.items) {
        const stockValidation = await this.validateStockFlexible(
          invoiceData.items,
          productsMap,
          opts
        );
        
        result.stockWarnings = stockValidation.warnings;
        result.stockErrors = stockValidation.errors;

        // If not allowing insufficient stock and there are errors, return early
        if (!opts.allowInsufficientStock && stockValidation.errors.length > 0) {
          result.errors = stockValidation.errors.map(e => e.message);
          result.executionTime = Date.now() - startTime;
          return result;
        }

        // Add warnings to result
        if (stockValidation.warnings.length > 0) {
          result.warnings = stockValidation.warnings.map(w => w.message);
        }
      }

      // Step 4: Create invoice with optimized operations
      let invoiceId: string;
      
      if (opts.batchOperations) {
        invoiceId = await this.createInvoiceBatch(invoiceData, opts);
      } else {
        invoiceId = await this.createInvoiceSequential(invoiceData, opts);
      }

      result.success = true;
      result.invoiceId = invoiceId;
      result.invoiceNumber = invoiceData.invoiceNumber;
      result.executionTime = Date.now() - startTime;

      return result;

    } catch (error) {
      console.error('Error creating optimized invoice:', error);
      result.errors = [error instanceof Error ? error.message : 'Unknown error occurred'];
      result.executionTime = Date.now() - startTime;
      return result;
    }
  }

  /**
   * Flexible stock validation that allows insufficient stock
   */
  private static async validateStockFlexible(
    items: InvoiceItem[],
    productsMap: Map<string, any>,
    options: OptimizedInvoiceOptions
  ): Promise<{ warnings: StockWarning[], errors: StockError[] }> {
    const warnings: StockWarning[] = [];
    const errors: StockError[] = [];

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        continue;
      }

      try {
        let product;
        
        // Use preloaded product if available
        if (productsMap.has(item.productId)) {
          product = productsMap.get(item.productId);
        } else {
          const productRef = doc(db, this.PRODUCTS_COLLECTION, item.productId);
          const productSnap = await getDoc(productRef);
          
          if (!productSnap.exists()) {
            errors.push({
              productId: item.productId,
              productName: item.name || 'Unknown Product',
              message: `Product not found`,
              canProceed: false
            });
            continue;
          }
          
          product = productSnap.data();
        }

        const availableStock = product.quantity || product.stock || 0;
        const requestedQuantity = item.quantity;

        // Handle different stock scenarios
        if (availableStock < requestedQuantity) {
          const shortfall = requestedQuantity - availableStock;
          
          if (options.allowInsufficientStock) {
            // Create warning instead of error
            warnings.push({
              productId: item.productId,
              productName: product.name,
              availableStock,
              requestedQuantity,
              shortfall,
              message: `Insufficient stock. Available: ${availableStock}, Required: ${requestedQuantity}. Invoice will create negative stock.`,
              severity: availableStock === 0 ? 'out-of-stock' : 'insufficient'
            });
          } else {
            // Create error (traditional behavior)
            errors.push({
              productId: item.productId,
              productName: product.name,
              message: `Insufficient stock. Available: ${availableStock}, Required: ${requestedQuantity}`,
              canProceed: false
            });
          }
        } else if (options.warnOnLowStock) {
          // Check for low stock warnings
          const minStockLevel = product.minStockLevel || product.reorderPoint || 5;
          const remainingStock = availableStock - requestedQuantity;
          
          if (remainingStock <= minStockLevel && remainingStock > 0) {
            warnings.push({
              productId: item.productId,
              productName: product.name,
              availableStock,
              requestedQuantity,
              shortfall: 0,
              message: `Stock will be low after this sale. Remaining: ${remainingStock}, Min Level: ${minStockLevel}`,
              severity: 'low'
            });
          } else if (remainingStock === 0) {
            warnings.push({
              productId: item.productId,
              productName: product.name,
              availableStock,
              requestedQuantity,
              shortfall: 0,
              message: `Product will be out of stock after this sale`,
              severity: 'out-of-stock'
            });
          }
        }
      } catch (error) {
        console.error(`Error validating stock for product ${item.productId}:`, error);
        errors.push({
          productId: item.productId,
          productName: item.name || 'Unknown Product',
          message: `Error validating stock: ${error instanceof Error ? error.message : 'Unknown error'}`,
          canProceed: true // Can still proceed with invoice creation
        });
      }
    }

    return { warnings, errors };
  }

  /**
   * Preload products for better performance
   */
  private static async preloadProducts(items: InvoiceItem[]): Promise<Map<string, any>> {
    const productIds = [...new Set(items.map(item => item.productId).filter(Boolean))];
    const productsMap = new Map();

    if (productIds.length === 0) {
      return productsMap;
    }

    try {
      // Batch get products (more efficient than individual gets)
      const batch = writeBatch(db);
      const productPromises = productIds.map(async (productId) => {
        const productRef = doc(db, this.PRODUCTS_COLLECTION, productId);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          productsMap.set(productId, productSnap.data());
        }
      });

      await Promise.all(productPromises);
    } catch (error) {
      console.error('Error preloading products:', error);
      // Continue without preloaded products
    }

    return productsMap;
  }

  /**
   * Create invoice using batch operations for better performance
   */
  private static async createInvoiceBatch(
    invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>,
    options: OptimizedInvoiceOptions
  ): Promise<string> {
    const batch = writeBatch(db);
    
    // Create invoice
    const invoiceRef = doc(collection(db, this.INVOICES_COLLECTION));
    batch.set(invoiceRef, {
      ...invoiceData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      stockUpdated: false,
      allowedInsufficientStock: options.allowInsufficientStock
    });

    // Update stock if enabled
    if (options.updateStock && invoiceData.items) {
      for (const item of invoiceData.items) {
        if (item.productId && item.quantity) {
          const productRef = doc(db, this.PRODUCTS_COLLECTION, item.productId);
          
          // Get current stock
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const product = productSnap.data();
            const currentStock = product.quantity || product.stock || 0;
            const newStock = currentStock - item.quantity;
            
            // Update stock (allow negative values if insufficient stock is allowed)
            batch.update(productRef, {
              quantity: newStock,
              stock: newStock,
              lastSaleDate: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
        }
      }
    }

    // Create transaction if enabled
    if (options.createTransaction && invoiceData.totalAmount) {
      const transactionRef = doc(collection(db, this.TRANSACTIONS_COLLECTION));
      batch.set(transactionRef, {
        invoiceId: invoiceRef.id,
        invoiceNumber: invoiceData.invoiceNumber,
        partyId: invoiceData.partyId,
        partyName: invoiceData.partyName,
        amount: invoiceData.totalAmount,
        type: 'debit', // Customer owes us money
        description: `Sale invoice ${invoiceData.invoiceNumber}`,
        createdAt: serverTimestamp(),
        date: invoiceData.date || new Date().toISOString()
      });
    }

    // Commit all operations
    await batch.commit();
    
    return invoiceRef.id;
  }

  /**
   * Create invoice using sequential operations
   */
  private static async createInvoiceSequential(
    invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> & { type?: 'sales' | 'purchase' },
    options: OptimizedInvoiceOptions
  ): Promise<string> {
    // Create invoice first
    const invoiceData2 = {
      ...invoiceData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      stockUpdated: false,
      allowedInsufficientStock: options.allowInsufficientStock
    };
    
    // Clean invoice data to remove undefined values
    const cleanedData = cleanInvoiceData(invoiceData2);
    
    const invoiceRef = await addDoc(collection(db, this.INVOICES_COLLECTION), cleanedData);

    // Update stock if enabled
    if (options.updateStock && invoiceData.items) {
      await this.updateStockForInvoice(invoiceData.items, options.allowInsufficientStock);
      
      // Mark invoice as stock updated
      await updateDoc(invoiceRef, {
        stockUpdated: true,
        updatedAt: serverTimestamp()
      });
    }

    return invoiceRef.id;
  }

  /**
   * Update stock for invoice items
   */
  private static async updateStockForInvoice(items: InvoiceItem[], allowNegative: boolean = true): Promise<void> {
    for (const item of items) {
      if (!item.productId || !item.quantity) continue;

      try {
        const productRef = doc(db, this.PRODUCTS_COLLECTION, item.productId);
        
        await runTransaction(db, async (transaction) => {
          const productSnap = await transaction.get(productRef);
          
          if (productSnap.exists()) {
            const product = productSnap.data();
            const currentStock = product.quantity || product.stock || 0;
            const newStock = currentStock - item.quantity;
            
            // Only update if stock won't go negative (unless allowed)
            if (allowNegative || newStock >= 0) {
              transaction.update(productRef, {
                quantity: newStock,
                stock: newStock,
                lastSaleDate: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            }
          }
        });
      } catch (error) {
        console.error(`Error updating stock for product ${item.productId}:`, error);
        // Continue with other items even if one fails
      }
    }
  }

  /**
   * Generate unique invoice number
   */
  private static async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const prefix = `INV-${year}${month}`;
    
    // Find the highest existing invoice number for this month
    const q = query(
      collection(db, this.INVOICES_COLLECTION),
      where('invoiceNumber', '>=', prefix),
      where('invoiceNumber', '<', prefix + 'Z')
    );
    
    const snapshot = await getDocs(q);
    let maxNumber = 0;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.invoiceNumber && data.invoiceNumber.startsWith(prefix)) {
        const numberPart = data.invoiceNumber.split('-')[3];
        if (numberPart) {
          const num = parseInt(numberPart, 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    });
    
    const nextNumber = String(maxNumber + 1).padStart(4, '0');
    return `${prefix}-${nextNumber}`;
  }

  /**
   * Quick invoice creation with minimal validation (for speed)
   */
  static async createQuickInvoice(
    invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<InvoiceCreationResult> {
    return this.createOptimizedInvoice(invoiceData, {
      allowInsufficientStock: true,
      validateStock: false, // Skip validation for speed
      updateStock: true,
      batchOperations: true,
      skipDuplicateChecks: true,
      preloadProducts: false,
      autoGenerateInvoiceNumber: true,
      createTransaction: false, // Skip transaction for speed
      showStockWarnings: false,
      warnOnLowStock: false
    });
  }

  /**
   * Safe invoice creation with full validation but allowing insufficient stock
   */
  static async createSafeInvoice(
    invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<InvoiceCreationResult> {
    return this.createOptimizedInvoice(invoiceData, {
      allowInsufficientStock: true,
      validateStock: true,
      updateStock: true,
      batchOperations: true,
      skipDuplicateChecks: false,
      preloadProducts: true,
      autoGenerateInvoiceNumber: true,
      createTransaction: true,
      showStockWarnings: true,
      warnOnLowStock: true
    });
  }
}

export default OptimizedInvoiceService;