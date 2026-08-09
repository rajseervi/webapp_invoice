import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { productService } from './productService';
import { partyService } from './partyService';

export interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'format' | 'business_rule' | 'stock_validation' | 'credit_limit' | 'gst_validation';
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface InvoiceValidationData {
  id?: string;
  invoiceNumber: string;
  date: string;
  customerId?: string;
  supplierId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    gstRate: number;
    discountPercent?: number;
  }>;
  totalAmount: number;
  gstAmount: number;
  subtotal: number;
  type: 'sales' | 'purchase';
}

export class EnhancedValidationService {
  
  /**
   * Main validation method for invoices
   */
  static async validateInvoice(invoice: InvoiceValidationData): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      // Basic field validation
      errors.push(...this.validateRequiredFields(invoice));
      
      // Format validation
      errors.push(...this.validateFormats(invoice));
      
      // Business logic validation
      const businessValidation = await this.validateBusinessLogic(invoice);
      errors.push(...businessValidation.errors);
      warnings.push(...businessValidation.warnings);
      
      // GST compliance validation
      errors.push(...this.validateGSTCompliance(invoice));
      
      // Stock validation for regular invoices
      if (invoice.type === 'sales') {
        const stockValidation = await this.validateStockAvailability(invoice);
        errors.push(...stockValidation.errors);
        warnings.push(...stockValidation.warnings);
      }
      
      // Credit limit validation for regular invoices
      if (invoice.type === 'sales' && invoice.customerId) {
        const creditValidation = await this.validateCreditLimit(invoice);
        errors.push(...creditValidation.errors);
        warnings.push(...creditValidation.warnings);
      }

    } catch (error) {
      console.error('Validation error:', error);
      errors.push({
        field: 'general',
        message: 'An error occurred during validation',
        type: 'business_rule',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate required fields
   */
  private static validateRequiredFields(invoice: InvoiceValidationData): ValidationError[] {
    const errors: ValidationError[] = [];
    const requiredFields = this.getRequiredFields(invoice.type);

    requiredFields.forEach(field => {
      const value = this.getNestedValue(invoice, field);
      if (value === null || value === undefined || value === '') {
        errors.push({
          field,
          message: `${this.getFieldDisplayName(field)} is required`,
          type: 'required',
          severity: 'error'
        });
      }
    });

    // Validate items array
    if (!invoice.items || invoice.items.length === 0) {
      errors.push({
        field: 'items',
        message: 'At least one item is required',
        type: 'required',
        severity: 'error'
      });
    }

    return errors;
  }

  /**
   * Validate data formats
   */
  private static validateFormats(invoice: InvoiceValidationData): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate invoice number format
    if (invoice.invoiceNumber && !this.isValidInvoiceNumber(invoice.invoiceNumber)) {
      errors.push({
        field: 'invoiceNumber',
        message: 'Invalid invoice number format',
        type: 'format',
        severity: 'error'
      });
    }

    // Validate date format
    if (invoice.date && !this.isValidDate(invoice.date)) {
      errors.push({
        field: 'date',
        message: 'Invalid date format',
        type: 'format',
        severity: 'error'
      });
    }

    // Validate amounts
    if (invoice.totalAmount < 0) {
      errors.push({
        field: 'totalAmount',
        message: 'Total amount cannot be negative',
        type: 'format',
        severity: 'error'
      });
    }

    // Validate item quantities and prices
    invoice.items?.forEach((item, index) => {
      if (item.quantity <= 0) {
        errors.push({
          field: `items[${index}].quantity`,
          message: 'Quantity must be greater than 0',
          type: 'format',
          severity: 'error'
        });
      }

      if (item.unitPrice < 0) {
        errors.push({
          field: `items[${index}].unitPrice`,
          message: 'Unit price cannot be negative',
          type: 'format',
          severity: 'error'
        });
      }

      if (item.gstRate < 0 || item.gstRate > 100) {
        errors.push({
          field: `items[${index}].gstRate`,
          message: 'GST rate must be between 0 and 100',
          type: 'format',
          severity: 'error'
        });
      }
    });

    return errors;
  }

  /**
   * Validate business logic
   */
  private static async validateBusinessLogic(invoice: InvoiceValidationData): Promise<{errors: ValidationError[], warnings: ValidationError[]}> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      // Check for duplicate invoice numbers
      const duplicateCheck = await this.checkDuplicateInvoiceNumber(invoice.invoiceNumber, invoice.id);
      if (duplicateCheck) {
        errors.push({
          field: 'invoiceNumber',
          message: 'Invoice number already exists',
          type: 'business_rule',
          severity: 'error'
        });
      }

      // Validate customer/supplier exists
      if (invoice.type === 'sales' && invoice.customerId) {
        const customerExists = await this.validateEntityExists(invoice.customerId, 'customer');
        if (!customerExists) {
          errors.push({
            field: 'customerId',
            message: 'Selected customer does not exist',
            type: 'business_rule',
            severity: 'error'
          });
        }
      }

      if (invoice.type === 'purchase' && invoice.supplierId) {
        const supplierExists = await this.validateEntityExists(invoice.supplierId, 'supplier');
        if (!supplierExists) {
          errors.push({
            field: 'supplierId',
            message: 'Selected supplier does not exist',
            type: 'business_rule',
            severity: 'error'
          });
        }
      }

      // Validate products exist
      for (let i = 0; i < invoice.items.length; i++) {
        const item = invoice.items[i];
        const productExists = await this.validateProductExists(item.productId);
        if (!productExists) {
          errors.push({
            field: `items[${i}].productId`,
            message: 'Selected product does not exist',
            type: 'business_rule',
            severity: 'error'
          });
        }
      }

      // Validate calculation accuracy
      const calculationValidation = this.validateCalculations(invoice);
      errors.push(...calculationValidation.errors);
      warnings.push(...calculationValidation.warnings);

    } catch (error) {
      console.error('Business logic validation error:', error);
      errors.push({
        field: 'general',
        message: 'Error validating business logic',
        type: 'business_rule',
        severity: 'error'
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate GST compliance
   */
  private static validateGSTCompliance(invoice: InvoiceValidationData): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate GST calculation accuracy
    let calculatedGST = 0;
    let calculatedSubtotal = 0;

    invoice.items.forEach((item, index) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const discountAmount = (itemSubtotal * (item.discountPercent || 0)) / 100;
      const taxableAmount = itemSubtotal - discountAmount;
      const itemGST = (taxableAmount * item.gstRate) / 100;

      calculatedSubtotal += taxableAmount;
      calculatedGST += itemGST;

      // Validate individual item GST rates
      if (!this.isValidGSTRate(item.gstRate)) {
        errors.push({
          field: `items[${index}].gstRate`,
          message: `Invalid GST rate: ${item.gstRate}%. Must be one of: 0%, 5%, 12%, 18%, 28%`,
          type: 'gst_validation',
          severity: 'error'
        });
      }
    });

    // Check if calculated values match provided values (with tolerance for rounding)
    const tolerance = 0.01;
    
    if (Math.abs(calculatedSubtotal - invoice.subtotal) > tolerance) {
      errors.push({
        field: 'subtotal',
        message: `Subtotal mismatch. Expected: ${calculatedSubtotal.toFixed(2)}, Got: ${invoice.subtotal.toFixed(2)}`,
        type: 'gst_validation',
        severity: 'error'
      });
    }

    if (Math.abs(calculatedGST - invoice.gstAmount) > tolerance) {
      errors.push({
        field: 'gstAmount',
        message: `GST amount mismatch. Expected: ${calculatedGST.toFixed(2)}, Got: ${invoice.gstAmount.toFixed(2)}`,
        type: 'gst_validation',
        severity: 'error'
      });
    }

    const expectedTotal = calculatedSubtotal + calculatedGST;
    if (Math.abs(expectedTotal - invoice.totalAmount) > tolerance) {
      errors.push({
        field: 'totalAmount',
        message: `Total amount mismatch. Expected: ${expectedTotal.toFixed(2)}, Got: ${invoice.totalAmount.toFixed(2)}`,
        type: 'gst_validation',
        severity: 'error'
      });
    }

    return errors;
  }

  /**
   * Validate stock availability for regular invoices
   */
  private static async validateStockAvailability(invoice: InvoiceValidationData): Promise<{errors: ValidationError[], warnings: ValidationError[]}> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      for (let i = 0; i < invoice.items.length; i++) {
        const item = invoice.items[i];
        const product = await productService.getProductById(item.productId);
        
        if (product) {
          if (product.quantity < item.quantity) {
            errors.push({
              field: `items[${i}].quantity`,
              message: `Insufficient stock for ${product.name}. Available: ${product.quantity}, Required: ${item.quantity}`,
              type: 'stock_validation',
              severity: 'error'
            });
          } else if (product.quantity - item.quantity < product.minStockLevel) {
            warnings.push({
              field: `items[${i}].quantity`,
              message: `Stock will fall below minimum level for ${product.name} after this sale`,
              type: 'stock_validation',
              severity: 'warning'
            });
          }
        }
      }
    } catch (error) {
      console.error('Stock validation error:', error);
      errors.push({
        field: 'items',
        message: 'Error validating stock availability',
        type: 'stock_validation',
        severity: 'error'
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate credit limit for regular invoices
   */
  private static async validateCreditLimit(invoice: InvoiceValidationData): Promise<{errors: ValidationError[], warnings: ValidationError[]}> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      if (!invoice.customerId) return { errors, warnings };

      // Get customer details
      const customer = await partyService.getPartyById(invoice.customerId);
      if (!customer || !customer.creditLimit || customer.creditLimit <= 0) {
        return { errors, warnings };
      }

      // Calculate current outstanding
      const outstanding = await this.getCustomerOutstanding(invoice.customerId);
      const newOutstanding = outstanding + invoice.totalAmount;

      if (newOutstanding > customer.creditLimit) {
        errors.push({
          field: 'totalAmount',
          message: `Invoice amount exceeds customer credit limit. Credit Limit: ₹${customer.creditLimit}, Current Outstanding: ₹${outstanding}, New Outstanding: ₹${newOutstanding}`,
          type: 'credit_limit',
          severity: 'error'
        });
      } else if (newOutstanding > customer.creditLimit * 0.9) {
        warnings.push({
          field: 'totalAmount',
          message: `Customer approaching credit limit. Credit Limit: ₹${customer.creditLimit}, New Outstanding: ₹${newOutstanding}`,
          type: 'credit_limit',
          severity: 'warning'
        });
      }
    } catch (error) {
      console.error('Credit limit validation error:', error);
      warnings.push({
        field: 'customerId',
        message: 'Could not validate credit limit',
        type: 'credit_limit',
        severity: 'warning'
      });
    }

    return { errors, warnings };
  }

  // Helper methods

  private static getRequiredFields(type: 'sales' | 'purchase'): string[] {
    const commonFields = ['invoiceNumber', 'date', 'items', 'totalAmount'];
    
    if (type === 'sales') {
      return [...commonFields, 'customerId'];
    } else {
      return [...commonFields, 'supplierId'];
    }
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private static getFieldDisplayName(field: string): string {
    const displayNames: Record<string, string> = {
      'invoiceNumber': 'Invoice Number',
      'date': 'Date',
      'customerId': 'Customer',
      'supplierId': 'Supplier',
      'items': 'Items',
      'totalAmount': 'Total Amount',
      'subtotal': 'Subtotal',
      'gstAmount': 'GST Amount'
    };
    
    return displayNames[field] || field;
  }

  private static isValidInvoiceNumber(invoiceNumber: string): boolean {
    // Basic invoice number validation - can be customized
    return /^[A-Z0-9\-\/]+$/i.test(invoiceNumber) && invoiceNumber.length >= 3;
  }

  private static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  private static isValidGSTRate(rate: number): boolean {
    const validRates = [0, 5, 12, 18, 28];
    return validRates.includes(rate);
  }

  private static async checkDuplicateInvoiceNumber(invoiceNumber: string, excludeId?: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, 'invoices'),
        where('invoiceNumber', '==', invoiceNumber)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (excludeId) {
        return querySnapshot.docs.some(doc => doc.id !== excludeId);
      }
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking duplicate invoice number:', error);
      return false;
    }
  }

  private static async validateEntityExists(entityId: string, type: 'customer' | 'supplier'): Promise<boolean> {
    try {
      const entity = await partyService.getPartyById(entityId);
      return entity !== null;
    } catch (error) {
      console.error(`Error validating ${type} existence:`, error);
      return false;
    }
  }

  private static async validateProductExists(productId: string): Promise<boolean> {
    try {
      const product = await productService.getProductById(productId);
      return product !== null;
    } catch (error) {
      console.error('Error validating product existence:', error);
      return false;
    }
  }

  private static validateCalculations(invoice: InvoiceValidationData): {errors: ValidationError[], warnings: ValidationError[]} {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate that item calculations are reasonable
    invoice.items.forEach((item, index) => {
      const itemTotal = item.quantity * item.unitPrice;
      const maxDiscount = itemTotal * 0.5; // 50% max discount warning
      const discountAmount = (itemTotal * (item.discountPercent || 0)) / 100;

      if (discountAmount > maxDiscount) {
        warnings.push({
          field: `items[${index}].discountPercent`,
          message: `High discount percentage (${item.discountPercent}%) for item ${index + 1}`,
          type: 'business_rule',
          severity: 'warning'
        });
      }
    });

    return { errors, warnings };
  }

  private static async getCustomerOutstanding(customerId: string): Promise<number> {
    try {
      // This would typically query the accounting/transaction system
      // For now, we'll return 0 as a placeholder
      // In a real implementation, this would sum up all unpaid invoices for the customer
      
      const q = query(
        collection(db, 'invoices'),
        where('customerId', '==', customerId),
        where('paymentStatus', 'in', ['pending', 'partial'])
      );
      
      const querySnapshot = await getDocs(q);
      let outstanding = 0;
      
      querySnapshot.docs.forEach(doc => {
        const invoice = doc.data();
        outstanding += (invoice.totalAmount || 0) - (invoice.paidAmount || 0);
      });
      
      return outstanding;
    } catch (error) {
      console.error('Error calculating customer outstanding:', error);
      return 0;
    }
  }

  /**
   * Validate invoice before saving
   */
  static async validateBeforeSave(invoice: InvoiceValidationData): Promise<ValidationResult> {
    return await this.validateInvoice(invoice);
  }

  /**
   * Quick validation for form fields
   */
  static validateField(fieldName: string, value: any, invoice: InvoiceValidationData): ValidationError[] {
    const errors: ValidationError[] = [];

    switch (fieldName) {
      case 'invoiceNumber':
        if (!value || value === '') {
          errors.push({
            field: fieldName,
            message: 'Invoice number is required',
            type: 'required',
            severity: 'error'
          });
        } else if (!this.isValidInvoiceNumber(value)) {
          errors.push({
            field: fieldName,
            message: 'Invalid invoice number format',
            type: 'format',
            severity: 'error'
          });
        }
        break;

      case 'date':
        if (!value || value === '') {
          errors.push({
            field: fieldName,
            message: 'Date is required',
            type: 'required',
            severity: 'error'
          });
        } else if (!this.isValidDate(value)) {
          errors.push({
            field: fieldName,
            message: 'Invalid date format',
            type: 'format',
            severity: 'error'
          });
        }
        break;

      case 'totalAmount':
        if (value < 0) {
          errors.push({
            field: fieldName,
            message: 'Total amount cannot be negative',
            type: 'format',
            severity: 'error'
          });
        }
        break;
    }

    return errors;
  }
}

export default EnhancedValidationService;