import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc,
  writeBatch,
  query,
  where 
} from 'firebase/firestore';
import { SalesDataQuality, DataQualityReport } from '@/types/reports';
import { Invoice } from '@/types/invoice';
import { Product } from '@/types/inventory';
import { PurchaseEntry } from '@/types/purchase';
import HSNService from './hsnService';

export class DataQualityService {
  
  // Audit sales data quality
  static async auditSalesDataQuality(): Promise<SalesDataQuality[]> {
    try {
      const invoices = await this.getAllInvoices();
      const qualityIssues: SalesDataQuality[] = [];

      for (const invoice of invoices) {
        const issues: string[] = [];
        let severity: 'low' | 'medium' | 'high' = 'low';
        const suggestedActions: string[] = [];
        let autoFixable = true;

        // Check for missing HSN codes
        const itemsWithoutHSN = invoice.items?.filter(item => !item.hsnCode) || [];
        if (itemsWithoutHSN.length > 0) {
          issues.push(`${itemsWithoutHSN.length} items missing HSN codes`);
          severity = 'high';
          suggestedActions.push('Add HSN codes to all items');
          autoFixable = false;
        }

        // Check for incorrect GST calculations
        const incorrectGSTItems = this.validateGSTCalculations(invoice);
        if (incorrectGSTItems.length > 0) {
          issues.push(`${incorrectGSTItems.length} items with incorrect GST calculations`);
          severity = severity === 'high' ? 'high' : 'medium';
          suggestedActions.push('Recalculate GST amounts');
        }

        // Check for missing customer information
        if (!invoice.partyName || !invoice.partyGstin) {
          issues.push('Missing customer information');
          severity = severity === 'high' ? 'high' : 'medium';
          suggestedActions.push('Complete customer details');
          autoFixable = false;
        }

        // Check for inconsistent pricing
        const pricingIssues = await this.checkPricingConsistency(invoice);
        if (pricingIssues.length > 0) {
          issues.push(...pricingIssues);
          severity = 'medium';
          suggestedActions.push('Review and standardize pricing');
        }

        if (issues.length > 0) {
          qualityIssues.push({
            invoiceId: invoice.id || '',
            invoiceNumber: invoice.invoiceNumber,
            issues,
            severity,
            autoFixable,
            suggestedActions
          });
        }
      }

      return qualityIssues.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
    } catch (error) {
      console.error('Error auditing sales data quality:', error);
      throw error;
    }
  }

  // Fix missing product information automatically
  static async autoFixProductInfo(): Promise<{ fixed: number; failed: number; errors: string[] }> {
    try {
      const products = await this.getAllProducts();
      
      const batch = writeBatch(db);
      let fixed = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const product of products) {
        let productUpdated = false;
        const updates: any = {};

        // Fix missing descriptions
        if (!product.description && product.name) {
          updates.description = `${product.name} - Auto-generated description`;
          productUpdated = true;
          fixed++;
        }

        // Fix missing categories
        if (!product.categoryId) {
          updates.categoryId = 'default-category';
          productUpdated = true;
          fixed++;
        }

        if (productUpdated && product.id) {
          const productRef = doc(db, 'products', product.id);
          batch.update(productRef, updates);
        }
      }

      await batch.commit();
      return { fixed, failed, errors };
    } catch (error) {
      console.error('Error auto-fixing product info:', error);
      throw error;
    }
  }

  // Fix GST calculations
  static async fixGSTCalculations(invoiceId: string): Promise<boolean> {
    try {
      const invoiceRef = doc(db, 'invoices', invoiceId);
      const invoiceDoc = await getDocs(query(collection(db, 'invoices'), where('__name__', '==', invoiceId)));
      
      if (invoiceDoc.empty) {
        throw new Error('Invoice not found');
      }

      const invoice = { id: invoiceDoc.docs[0].id, ...invoiceDoc.docs[0].data() } as Invoice;
      const updatedItems = invoice.items?.map(item => {
        if (item.hsnCode && item.gstRate) {
          const taxableAmount = item.price * item.quantity - (item.discount || 0);
          const gstAmount = (taxableAmount * item.gstRate) / 100;
          
          // For inter-state transactions, use IGST
          if (invoice.companyStateCode !== invoice.partyStateCode) {
            item.igstAmount = gstAmount;
            item.cgstAmount = 0;
            item.sgstAmount = 0;
          } else {
            // For intra-state transactions, split between CGST and SGST
            item.cgstAmount = gstAmount / 2;
            item.sgstAmount = gstAmount / 2;
            item.igstAmount = 0;
          }
          
          item.taxableAmount = taxableAmount;
          item.totalTaxAmount = gstAmount;
          item.finalPrice = taxableAmount + gstAmount;
        }
        return item;
      });

      // Recalculate invoice totals
      const subtotal = updatedItems?.reduce((sum, item) => sum + (item.taxableAmount || 0), 0) || 0;
      const totalCgst = updatedItems?.reduce((sum, item) => sum + (item.cgstAmount || 0), 0) || 0;
      const totalSgst = updatedItems?.reduce((sum, item) => sum + (item.sgstAmount || 0), 0) || 0;
      const totalIgst = updatedItems?.reduce((sum, item) => sum + (item.igstAmount || 0), 0) || 0;
      const totalTaxAmount = totalCgst + totalSgst + totalIgst;
      const total = subtotal + totalTaxAmount;

      await updateDoc(invoiceRef, {
        items: updatedItems,
        subtotal,
        totalCgst,
        totalSgst,
        totalIgst,
        totalTaxAmount,
        total
      });

      return true;
    } catch (error) {
      console.error('Error fixing GST calculations:', error);
      return false;
    }
  }

  // Standardize product information
  static async standardizeProductInformation(): Promise<{ updated: number; errors: string[] }> {
    try {
      const products = await this.getAllProducts();
      const batch = writeBatch(db);
      let updated = 0;
      const errors: string[] = [];

      for (const product of products) {
        let needsUpdate = false;
        const updates: Partial<Product> = {};

        // Fix missing HSN codes
        if (!product.hsnCode && product.name) {
          const suggestions = HSNService.suggestCodesForProduct(product.name);
          if (suggestions.length > 0) {
            updates.hsnCode = suggestions[0].code;
            updates.gstRate = suggestions[0].gstRate;
            needsUpdate = true;
          }
        }

        // Validate existing HSN codes
        if (product.hsnCode && !HSNService.validateCode(product.hsnCode, product.isService)) {
          const validCodes = HSNService.searchHSN(product.hsnCode.substring(0, 4));
          if (validCodes.length > 0) {
            updates.hsnCode = validCodes[0].code;
            updates.gstRate = validCodes[0].gstRate;
            needsUpdate = true;
          }
        }

        // Standardize naming
        if (product.name) {
          const standardizedName = this.standardizeProductName(product.name);
          if (standardizedName !== product.name) {
            updates.name = standardizedName;
            needsUpdate = true;
          }
        }

        // Ensure required fields
        if (!product.unitOfMeasurement) {
          updates.unitOfMeasurement = 'PCS'; // Default unit
          needsUpdate = true;
        }

        if (needsUpdate && product.id) {
          const productRef = doc(db, 'products', product.id);
          batch.update(productRef, updates);
          updated++;
        }
      }

      if (updated > 0) {
        await batch.commit();
      }

      return { updated, errors };
    } catch (error) {
      console.error('Error standardizing product information:', error);
      throw error;
    }
  }

  // Generate comprehensive data quality report
  static async generateComprehensiveQualityReport(): Promise<DataQualityReport> {
    try {
      const [invoices, products, purchases] = await Promise.all([
        this.getAllInvoices(),
        this.getAllProducts(),
        this.getAllPurchases()
      ]);

      const issues: DataQualityReport['issues'] = [];
      let missingHsnCodes = 0;
      let incorrectGstRates = 0;
      let incompleteProductInfo = 0;
      let dataInconsistencies = 0;

      // Analyze invoices
      invoices.forEach(invoice => {
        invoice.items?.forEach(item => {
          if (!item.hsnCode) {
            missingHsnCodes++;
            issues.push({
              type: 'missing_hsn',
              record: `Invoice ${invoice.invoiceNumber} - ${item.name}`,
              description: 'Missing HSN code for invoice item',
              suggestedFix: 'Add appropriate HSN code based on product category'
            });
          }

          if (item.hsnCode && item.gstRate) {
            const suggestedRate = HSNService.getSuggestedGSTRate(item.hsnCode);
            if (Math.abs(item.gstRate - suggestedRate) > 0.1) {
              incorrectGstRates++;
              issues.push({
                type: 'incorrect_gst',
                record: `Invoice ${invoice.invoiceNumber} - ${item.name}`,
                description: `GST rate mismatch: ${item.gstRate}% vs suggested ${suggestedRate}%`,
                suggestedFix: `Update GST rate to ${suggestedRate}%`
              });
            }
          }
        });

        // Check for data inconsistencies
        if (invoice.total !== (invoice.subtotal || 0) + (invoice.totalTaxAmount || 0)) {
          dataInconsistencies++;
          issues.push({
            type: 'data_inconsistency',
            record: `Invoice ${invoice.invoiceNumber}`,
            description: 'Invoice total does not match subtotal + tax amount',
            suggestedFix: 'Recalculate invoice totals'
          });
        }
      });

      // Analyze products
      products.forEach(product => {
        const missingFields = [];
        if (!product.hsnCode) missingFields.push('HSN code');
        if (!product.description) missingFields.push('description');
        if (!product.categoryId) missingFields.push('category');
        if (!product.unitOfMeasurement) missingFields.push('unit of measurement');

        if (missingFields.length > 0) {
          incompleteProductInfo++;
          issues.push({
            type: 'incomplete_product',
            record: `Product ${product.name}`,
            description: `Missing: ${missingFields.join(', ')}`,
            suggestedFix: 'Complete all required product information'
          });
        }
      });

      const totalRecords = invoices.length + products.length + purchases.length;
      const validRecords = totalRecords - issues.length;

      return {
        totalRecords,
        validRecords,
        invalidRecords: issues.length,
        missingHsnCodes,
        incorrectGstRates,
        incompleteProductInfo,
        dataInconsistencies,
        issues: issues.slice(0, 100) // Limit to first 100 issues for performance
      };
    } catch (error) {
      console.error('Error generating comprehensive quality report:', error);
      throw error;
    }
  }

  // Helper methods
  private static async getAllInvoices(): Promise<Invoice[]> {
    const snapshot = await getDocs(collection(db, 'invoices'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
  }

  private static async getAllProducts(): Promise<Product[]> {
    const snapshot = await getDocs(collection(db, 'products'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  }

  private static async getAllPurchases(): Promise<PurchaseEntry[]> {
    const snapshot = await getDocs(collection(db, 'purchaseEntries'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseEntry));
  }

  private static validateGSTCalculations(invoice: Invoice): string[] {
    const incorrectItems: string[] = [];
    
    invoice.items?.forEach(item => {
      if (item.taxableAmount && item.gstRate && item.totalTaxAmount) {
        const expectedTax = (item.taxableAmount * item.gstRate) / 100;
        if (Math.abs(item.totalTaxAmount - expectedTax) > 0.01) {
          incorrectItems.push(item.name || 'Unknown item');
        }
      }
    });

    return incorrectItems;
  }

  private static async checkPricingConsistency(invoice: Invoice): Promise<string[]> {
    const issues: string[] = [];
    const products = await this.getAllProducts();
    const productMap = new Map(products.map(p => [p.id, p]));

    invoice.items?.forEach(item => {
      const product = productMap.get(item.productId);
      if (product && item.price && Math.abs(item.price - product.price) > product.price * 0.1) {
        issues.push(`Price variance for ${item.name}: invoice ${item.price} vs product ${product.price}`);
      }
    });

    return issues;
  }

  private static standardizeProductName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/^\w/, c => c.toUpperCase()); // Capitalize first letter
  }
}

export default DataQualityService;