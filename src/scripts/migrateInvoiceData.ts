import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  writeBatch, 
  doc, 
  query, 
  limit,
  startAfter,
  orderBy
} from 'firebase/firestore';
import EnhancedInvoiceService, { EnhancedInvoice, EnhancedInvoiceItem } from '@/services/enhancedInvoiceService';
import { Invoice } from '@/services/invoiceService';

interface MigrationResult {
  success: boolean;
  migratedCount: number;
  failedCount: number;
  errors: string[];
}

export class InvoiceDataMigration {
  private static readonly BATCH_SIZE = 50;
  private static readonly OLD_COLLECTION = 'invoices';
  private static readonly NEW_COLLECTION = 'invoices_enhanced';

  /**
   * Migrate all invoices from old structure to new enhanced structure
   */
  static async migrateAllInvoices(): Promise<MigrationResult> {
    console.log('Starting invoice data migration...');
    
    const result: MigrationResult = {
      success: true,
      migratedCount: 0,
      failedCount: 0,
      errors: []
    };

    try {
      let lastDoc: any = null;
      let hasMore = true;

      while (hasMore) {
        const batchResult = await this.migrateBatch(lastDoc);
        
        result.migratedCount += batchResult.migratedCount;
        result.failedCount += batchResult.failedCount;
        result.errors.push(...batchResult.errors);

        hasMore = batchResult.hasMore;
        lastDoc = batchResult.lastDoc;

        console.log(`Migrated batch: ${batchResult.migratedCount} successful, ${batchResult.failedCount} failed`);
      }

      console.log(`Migration completed: ${result.migratedCount} successful, ${result.failedCount} failed`);
      
      if (result.failedCount > 0) {
        result.success = false;
        console.error('Migration completed with errors:', result.errors);
      }

    } catch (error) {
      console.error('Migration failed:', error);
      result.success = false;
      result.errors.push(`Migration failed: ${error}`);
    }

    return result;
  }

  /**
   * Migrate a batch of invoices
   */
  private static async migrateBatch(lastDoc: any): Promise<{
    migratedCount: number;
    failedCount: number;
    errors: string[];
    hasMore: boolean;
    lastDoc: any;
  }> {
    let q = query(
      collection(db, this.OLD_COLLECTION),
      orderBy('createdAt', 'asc'),
      limit(this.BATCH_SIZE)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs;
    
    if (docs.length === 0) {
      return {
        migratedCount: 0,
        failedCount: 0,
        errors: [],
        hasMore: false,
        lastDoc: null
      };
    }

    const batch = writeBatch(db);
    let migratedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const docSnapshot of docs) {
      try {
        const oldInvoice = { id: docSnapshot.id, ...docSnapshot.data() } as Invoice & { id: string };
        const enhancedInvoice = await this.transformInvoice(oldInvoice);
        
        const newDocRef = doc(collection(db, this.NEW_COLLECTION));
        batch.set(newDocRef, enhancedInvoice);
        
        migratedCount++;
      } catch (error) {
        console.error(`Failed to migrate invoice ${docSnapshot.id}:`, error);
        errors.push(`Invoice ${docSnapshot.id}: ${error}`);
        failedCount++;
      }
    }

    // Commit the batch
    if (migratedCount > 0) {
      await batch.commit();
    }

    return {
      migratedCount,
      failedCount,
      errors,
      hasMore: docs.length === this.BATCH_SIZE,
      lastDoc: docs[docs.length - 1]
    };
  }

  /**
   * Transform old invoice structure to new enhanced structure
   */
  private static async transformInvoice(oldInvoice: Invoice & { id: string }): Promise<Omit<EnhancedInvoice, 'id'>> {
    // Determine invoice type based on available fields
    const type: 'sales' | 'purchase' = oldInvoice.partyId ? 'sales' : 'purchase';
    
    // Transform items
    const enhancedItems: EnhancedInvoiceItem[] = await Promise.all(
      (oldInvoice.items || []).map(async (item, index) => {
        return await this.transformInvoiceItem(item, index, type === 'sales');
      })
    );

    // Calculate totals using the new service
    const totals = EnhancedInvoiceService.calculateInvoiceTotals(enhancedItems);

    // Determine inter-state status (default to false if not determinable)
    const isInterState = false; // This would need to be calculated based on party state

    // Map old fields to new structure
    const enhancedInvoice: Omit<EnhancedInvoice, 'id'> = {
      invoiceNumber: oldInvoice.invoiceNumber || this.generateFallbackInvoiceNumber(oldInvoice.id),
      invoiceDate: oldInvoice.saleDate || oldInvoice.date || oldInvoice.createdAt.split('T')[0],
      dueDate: undefined, // Not available in old structure
      
      // Customer/Supplier Information
      customerId: type === 'sales' ? oldInvoice.partyId : undefined,
      customerName: type === 'sales' ? oldInvoice.partyName : undefined,
      customerGstin: undefined, // Not available in old structure
      supplierId: type === 'purchase' ? oldInvoice.partyId : undefined,
      supplierName: type === 'purchase' ? oldInvoice.partyName : undefined,
      supplierGstin: undefined, // Not available in old structure
      
      // Invoice Items
      items: enhancedItems,
      
      // Financial Details
      ...totals,
      
      // Payment Information
      paymentStatus: this.determinePaymentStatus(oldInvoice),
      paidAmount: 0, // Not available in old structure
      balanceAmount: totals.grandTotal,
      paymentTerms: undefined,
      
      // Additional Information
      notes: oldInvoice.notes,
      attachments: [],
      placeOfSupply: undefined,
      reverseCharge: false,
      
      // System Fields
      type,
      status: 'confirmed', // Assume old invoices are confirmed
      isInterState,
      stockUpdated: false, // Assume stock was not updated in old system
      
      // Audit Fields
      createdAt: oldInvoice.createdAt,
      updatedAt: new Date().toISOString(),
      createdBy: oldInvoice.userId || 'migrated',
      updatedBy: 'migration-script',
      
      // Validation Status
      validationStatus: 'pending',
      validationErrors: [],
      
      // Integration Fields
      transactionId: oldInvoice.transactionId,
      syncStatus: oldInvoice.transactionId ? 'synced' : 'pending',
      
      // Analytics Fields
      customerCategory: undefined,
      productCategories: this.extractProductCategories(enhancedItems),
      salesChannel: 'direct',
      region: undefined
    };

    return enhancedInvoice;
  }

  /**
   * Transform old invoice item to new enhanced structure
   */
  private static async transformInvoiceItem(
    oldItem: any, 
    index: number, 
    isSales: boolean
  ): Promise<EnhancedInvoiceItem> {
    // Extract basic item information
    const productId = oldItem.productId?.toString() || `migrated-${index}`;
    const productName = oldItem.name || `Product ${index + 1}`;
    const quantity = oldItem.quantity || 1;
    const unitPrice = oldItem.price || oldItem.finalPrice || 0;
    const discountPercent = this.calculateDiscountPercent(oldItem);
    
    // Default GST rate if not available
    const gstRate = this.extractGstRate(oldItem) || 18;
    
    // Calculate item totals
    const baseAmount = unitPrice * quantity;
    const discountAmount = (baseAmount * discountPercent) / 100;
    const taxableAmount = baseAmount - discountAmount;
    
    // Calculate GST amounts (assuming intra-state for migration)
    const gstAmount = (taxableAmount * gstRate) / 100;
    const cgstAmount = gstAmount / 2;
    const sgstAmount = gstAmount / 2;
    const igstAmount = 0; // Will be recalculated based on actual state
    
    const totalTaxAmount = cgstAmount + sgstAmount + igstAmount;
    const totalAmount = taxableAmount + totalTaxAmount;

    const enhancedItem: EnhancedInvoiceItem = {
      id: `migrated-${productId}-${index}`,
      productId,
      productName,
      productCode: oldItem.code,
      hsnCode: this.extractHsnCode(oldItem) || '99999999',
      sacCode: undefined,
      description: oldItem.description,
      
      // Quantity and Pricing
      quantity,
      unitOfMeasurement: 'PCS',
      unitPrice,
      discountPercent,
      discountAmount: Math.round(discountAmount * 100) / 100,
      
      // Tax Information
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      gstRate,
      cgstAmount: Math.round(cgstAmount * 100) / 100,
      sgstAmount: Math.round(sgstAmount * 100) / 100,
      igstAmount: Math.round(igstAmount * 100) / 100,
      cessAmount: 0,
      totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      
      // Additional Fields
      isService: false,
      batchNumber: undefined,
      expiryDate: undefined,
      serialNumbers: []
    };

    return enhancedItem;
  }

  /**
   * Helper methods for data transformation
   */
  private static generateFallbackInvoiceNumber(id: string): string {
    return `MIG-${id.slice(-8).toUpperCase()}`;
  }

  private static determinePaymentStatus(oldInvoice: Invoice): 'pending' | 'partial' | 'paid' | 'overdue' {
    // Since old structure doesn't have payment info, default to pending
    return 'pending';
  }

  private static calculateDiscountPercent(oldItem: any): number {
    if (oldItem.discount && oldItem.price) {
      return (oldItem.discount / oldItem.price) * 100;
    }
    return 0;
  }

  private static extractGstRate(oldItem: any): number | null {
    // Try to extract GST rate from various possible fields
    if (oldItem.gstRate) return oldItem.gstRate;
    if (oldItem.taxRate) return oldItem.taxRate;
    if (oldItem.tax) return oldItem.tax;
    
    // Try to calculate from category or product type
    const category = oldItem.category?.toLowerCase();
    if (category) {
      if (category.includes('food') || category.includes('essential')) return 5;
      if (category.includes('luxury') || category.includes('electronics')) return 28;
      if (category.includes('service')) return 18;
    }
    
    return null;
  }

  private static extractHsnCode(oldItem: any): string | null {
    if (oldItem.hsnCode) return oldItem.hsnCode;
    if (oldItem.hsn) return oldItem.hsn;
    if (oldItem.productCode) return oldItem.productCode;
    
    // Generate HSN based on category
    const category = oldItem.category?.toLowerCase();
    if (category) {
      if (category.includes('food')) return '21069099';
      if (category.includes('textile')) return '63079099';
      if (category.includes('electronics')) return '85444999';
      if (category.includes('service')) return '99999999';
    }
    
    return null;
  }

  private static extractProductCategories(items: EnhancedInvoiceItem[]): string[] {
    const categories = new Set<string>();
    
    items.forEach(item => {
      // Extract category from HSN code or product name
      const hsnPrefix = item.hsnCode.substring(0, 2);
      switch (hsnPrefix) {
        case '21': categories.add('Food Products'); break;
        case '63': categories.add('Textiles'); break;
        case '85': categories.add('Electronics'); break;
        case '99': categories.add('Services'); break;
        default: categories.add('General'); break;
      }
    });
    
    return Array.from(categories);
  }

  /**
   * Validate migrated data
   */
  static async validateMigratedData(): Promise<{
    totalOld: number;
    totalNew: number;
    validationResults: any[];
  }> {
    console.log('Validating migrated data...');
    
    const [oldSnapshot, newSnapshot] = await Promise.all([
      getDocs(collection(db, this.OLD_COLLECTION)),
      getDocs(collection(db, this.NEW_COLLECTION))
    ]);
    
    const totalOld = oldSnapshot.size;
    const totalNew = newSnapshot.size;
    
    console.log(`Old collection: ${totalOld} documents`);
    console.log(`New collection: ${totalNew} documents`);
    
    // Sample validation of a few records
    const validationResults = [];
    const sampleSize = Math.min(10, newSnapshot.size);
    
    for (let i = 0; i < sampleSize; i++) {
      const doc = newSnapshot.docs[i];
      const invoice = doc.data() as EnhancedInvoice;
      
      // Basic validation
      const isValid = !!(
        invoice.invoiceNumber &&
        invoice.invoiceDate &&
        invoice.type &&
        invoice.items &&
        invoice.items.length > 0 &&
        invoice.grandTotal > 0
      );
      
      validationResults.push({
        id: doc.id,
        invoiceNumber: invoice.invoiceNumber,
        isValid,
        itemCount: invoice.items?.length || 0,
        grandTotal: invoice.grandTotal
      });
    }
    
    return {
      totalOld,
      totalNew,
      validationResults
    };
  }

  /**
   * Rollback migration (delete all migrated data)
   */
  static async rollbackMigration(): Promise<boolean> {
    console.log('Rolling back migration...');
    
    try {
      const querySnapshot = await getDocs(collection(db, this.NEW_COLLECTION));
      const batch = writeBatch(db);
      
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`Rolled back ${querySnapshot.size} documents`);
      
      return true;
    } catch (error) {
      console.error('Rollback failed:', error);
      return false;
    }
  }
}

// Export migration functions for use in scripts or admin interface
export const migrateInvoiceData = InvoiceDataMigration.migrateAllInvoices;
export const validateMigratedData = InvoiceDataMigration.validateMigratedData;
export const rollbackMigration = InvoiceDataMigration.rollbackMigration;