import { Order, OrderFormData, OrderItem, OrderStatus, PaymentStatus } from '@/types/order';
import { Product } from '@/types/inventory';
import { Party } from '@/types/party';

// Validation error interface
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
}

// Order validation rules
export const ORDER_VALIDATION_RULES = {
  orderNumber: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[A-Z0-9-]+$/,
  },
  partyId: {
    required: true,
  },
  partyName: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  items: {
    required: true,
    minItems: 1,
    maxItems: 100,
  },
  subtotal: {
    required: true,
    min: 0,
  },
  discount: {
    min: 0,
    max: 100, // percentage
  },
  tax: {
    min: 0,
  },
  shipping: {
    min: 0,
  },
  total: {
    required: true,
    min: 0.01,
  },
  notes: {
    maxLength: 1000,
  },
  paymentMethod: {
    allowedValues: ['cash', 'credit_card', 'bank_transfer', 'upi', 'check', 'other'],
  },
  trackingNumber: {
    maxLength: 100,
  },
  shippingAddress: {
    maxLength: 500,
  },
  billingAddress: {
    maxLength: 500,
  },
};

// Item validation rules
export const ORDER_ITEM_VALIDATION_RULES = {
  productId: {
    required: true,
  },
  name: {
    required: true,
    minLength: 1,
    maxLength: 200,
  },
  sku: {
    required: true,
    minLength: 1,
    maxLength: 50,
  },
  quantity: {
    required: true,
    min: 1,
    max: 10000,
  },
  price: {
    required: true,
    min: 0,
  },
  total: {
    required: true,
    min: 0,
  },
};

// Validate order number format
export const validateOrderNumber = (orderNumber: string): ValidationResult => {
  const errors: ValidationError[] = [];
  
  if (!orderNumber) {
    errors.push({
      field: 'orderNumber',
      message: 'Order number is required',
      code: 'REQUIRED'
    });
  } else {
    if (orderNumber.length < ORDER_VALIDATION_RULES.orderNumber.minLength) {
      errors.push({
        field: 'orderNumber',
        message: `Order number must be at least ${ORDER_VALIDATION_RULES.orderNumber.minLength} characters`,
        code: 'MIN_LENGTH'
      });
    }
    
    if (orderNumber.length > ORDER_VALIDATION_RULES.orderNumber.maxLength) {
      errors.push({
        field: 'orderNumber',
        message: `Order number must not exceed ${ORDER_VALIDATION_RULES.orderNumber.maxLength} characters`,
        code: 'MAX_LENGTH'
      });
    }
    
    if (!ORDER_VALIDATION_RULES.orderNumber.pattern.test(orderNumber)) {
      errors.push({
        field: 'orderNumber',
        message: 'Order number can only contain uppercase letters, numbers, and hyphens',
        code: 'INVALID_FORMAT'
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate party selection
export const validateParty = (partyId: string, partyName: string, party?: Party): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  if (!partyId) {
    errors.push({
      field: 'partyId',
      message: 'Customer selection is required',
      code: 'REQUIRED'
    });
  }
  
  if (!partyName || partyName.trim().length === 0) {
    errors.push({
      field: 'partyName',
      message: 'Customer name is required',
      code: 'REQUIRED'
    });
  } else {
    if (partyName.length < ORDER_VALIDATION_RULES.partyName.minLength) {
      errors.push({
        field: 'partyName',
        message: `Customer name must be at least ${ORDER_VALIDATION_RULES.partyName.minLength} characters`,
        code: 'MIN_LENGTH'
      });
    }
    
    if (partyName.length > ORDER_VALIDATION_RULES.partyName.maxLength) {
      errors.push({
        field: 'partyName',
        message: `Customer name must not exceed ${ORDER_VALIDATION_RULES.partyName.maxLength} characters`,
        code: 'MAX_LENGTH'
      });
    }
  }
  
  // Check party-specific warnings
  if (party) {
    if (party.outstandingBalance && party.outstandingBalance > 10000) {
      warnings.push({
        field: 'partyId',
        message: `Customer has high outstanding balance: ${party.outstandingBalance.toLocaleString()}`,
        code: 'HIGH_OUTSTANDING_BALANCE'
      });
    }
    
    if (party.creditLimit && party.outstandingBalance && party.outstandingBalance > party.creditLimit * 0.9) {
      warnings.push({
        field: 'partyId',
        message: 'Customer is approaching credit limit',
        code: 'APPROACHING_CREDIT_LIMIT'
      });
    }
    
    if (!party.isActive) {
      errors.push({
        field: 'partyId',
        message: 'Selected customer is inactive',
        code: 'INACTIVE_CUSTOMER'
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Validate order item
export const validateOrderItem = (item: OrderItem, product?: Product): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  // Validate required fields
  if (!item.productId) {
    errors.push({
      field: 'productId',
      message: 'Product ID is required',
      code: 'REQUIRED'
    });
  }
  
  if (!item.name || item.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Product name is required',
      code: 'REQUIRED'
    });
  } else {
    if (item.name.length > ORDER_ITEM_VALIDATION_RULES.name.maxLength) {
      errors.push({
        field: 'name',
        message: `Product name must not exceed ${ORDER_ITEM_VALIDATION_RULES.name.maxLength} characters`,
        code: 'MAX_LENGTH'
      });
    }
  }
  
  if (!item.sku || item.sku.trim().length === 0) {
    errors.push({
      field: 'sku',
      message: 'Product SKU is required',
      code: 'REQUIRED'
    });
  } else {
    if (item.sku.length > ORDER_ITEM_VALIDATION_RULES.sku.maxLength) {
      errors.push({
        field: 'sku',
        message: `Product SKU must not exceed ${ORDER_ITEM_VALIDATION_RULES.sku.maxLength} characters`,
        code: 'MAX_LENGTH'
      });
    }
  }
  
  // Validate quantity
  if (!item.quantity || item.quantity <= 0) {
    errors.push({
      field: 'quantity',
      message: 'Quantity must be greater than 0',
      code: 'INVALID_QUANTITY'
    });
  } else {
    if (item.quantity > ORDER_ITEM_VALIDATION_RULES.quantity.max) {
      errors.push({
        field: 'quantity',
        message: `Quantity cannot exceed ${ORDER_ITEM_VALIDATION_RULES.quantity.max}`,
        code: 'MAX_QUANTITY'
      });
    }
    
    if (!Number.isInteger(item.quantity)) {
      errors.push({
        field: 'quantity',
        message: 'Quantity must be a whole number',
        code: 'INVALID_QUANTITY_FORMAT'
      });
    }
  }
  
  // Validate price
  if (item.price === undefined || item.price < 0) {
    errors.push({
      field: 'price',
      message: 'Price must be 0 or greater',
      code: 'INVALID_PRICE'
    });
  }
  
  // Validate total
  if (item.total === undefined || item.total < 0) {
    errors.push({
      field: 'total',
      message: 'Total must be 0 or greater',
      code: 'INVALID_TOTAL'
    });
  } else {
    // Check if total matches quantity * price
    const expectedTotal = item.quantity * (item.discountedPrice || item.price);
    if (Math.abs(item.total - expectedTotal) > 0.01) {
      errors.push({
        field: 'total',
        message: 'Total does not match quantity × price',
        code: 'TOTAL_MISMATCH'
      });
    }
  }
  
  // Product-specific validations
  if (product) {
    // Check stock availability
    if (product.quantity < item.quantity) {
      errors.push({
        field: 'quantity',
        message: `Insufficient stock. Available: ${product.quantity}, Requested: ${item.quantity}`,
        code: 'INSUFFICIENT_STOCK'
      });
    } else if (product.quantity < item.quantity * 2) {
      warnings.push({
        field: 'quantity',
        message: `Low stock warning. Available: ${product.quantity}`,
        code: 'LOW_STOCK'
      });
    }
    
    // Check if product is active
    if (!product.isActive) {
      errors.push({
        field: 'productId',
        message: 'Selected product is inactive',
        code: 'INACTIVE_PRODUCT'
      });
    }
    
    // Check price consistency
    if (item.price !== product.price && item.price !== product.discountedPrice) {
      warnings.push({
        field: 'price',
        message: 'Price differs from current product price',
        code: 'PRICE_MISMATCH'
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Validate order items collection
export const validateOrderItems = (items: OrderItem[], products?: Product[]): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  if (!items || items.length === 0) {
    errors.push({
      field: 'items',
      message: 'At least one item is required',
      code: 'REQUIRED'
    });
    return { isValid: false, errors };
  }
  
  if (items.length > ORDER_VALIDATION_RULES.items.maxItems) {
    errors.push({
      field: 'items',
      message: `Cannot exceed ${ORDER_VALIDATION_RULES.items.maxItems} items per order`,
      code: 'MAX_ITEMS'
    });
  }
  
  // Check for duplicate products
  const productIds = items.map(item => item.productId);
  const duplicateIds = productIds.filter((id, index) => productIds.indexOf(id) !== index);
  
  if (duplicateIds.length > 0) {
    errors.push({
      field: 'items',
      message: 'Duplicate products found in order',
      code: 'DUPLICATE_PRODUCTS'
    });
  }
  
  // Validate each item
  items.forEach((item, index) => {
    const product = products?.find(p => p.id === item.productId);
    const itemValidation = validateOrderItem(item, product);
    
    // Add field prefix to distinguish items
    itemValidation.errors.forEach(error => {
      errors.push({
        ...error,
        field: `items[${index}].${error.field}`,
        message: `Item ${index + 1}: ${error.message}`
      });
    });
    
    itemValidation.warnings?.forEach(warning => {
      warnings.push({
        ...warning,
        field: `items[${index}].${warning.field}`,
        message: `Item ${index + 1}: ${warning.message}`
      });
    });
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Validate financial calculations
export const validateFinancials = (order: Partial<OrderFormData>): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  const { subtotal = 0, discount = 0, tax = 0, shipping = 0, total = 0, items = [] } = order;
  
  // Validate subtotal
  if (subtotal < 0) {
    errors.push({
      field: 'subtotal',
      message: 'Subtotal cannot be negative',
      code: 'INVALID_SUBTOTAL'
    });
  }
  
  // Calculate expected subtotal from items
  const expectedSubtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  if (Math.abs(subtotal - expectedSubtotal) > 0.01) {
    errors.push({
      field: 'subtotal',
      message: 'Subtotal does not match sum of item totals',
      code: 'SUBTOTAL_MISMATCH'
    });
  }
  
  // Validate discount
  if (discount < 0) {
    errors.push({
      field: 'discount',
      message: 'Discount cannot be negative',
      code: 'INVALID_DISCOUNT'
    });
  }
  
  if (discount > subtotal) {
    errors.push({
      field: 'discount',
      message: 'Discount cannot exceed subtotal',
      code: 'EXCESSIVE_DISCOUNT'
    });
  }
  
  // Validate tax
  if (tax < 0) {
    errors.push({
      field: 'tax',
      message: 'Tax cannot be negative',
      code: 'INVALID_TAX'
    });
  }
  
  // Validate shipping
  if (shipping < 0) {
    errors.push({
      field: 'shipping',
      message: 'Shipping cost cannot be negative',
      code: 'INVALID_SHIPPING'
    });
  }
  
  // Validate total
  if (total <= 0) {
    errors.push({
      field: 'total',
      message: 'Total must be greater than 0',
      code: 'INVALID_TOTAL'
    });
  }
  
  // Calculate expected total
  const expectedTotal = subtotal - discount + tax + shipping;
  if (Math.abs(total - expectedTotal) > 0.01) {
    errors.push({
      field: 'total',
      message: 'Total calculation is incorrect',
      code: 'TOTAL_CALCULATION_ERROR'
    });
  }
  
  // Warnings for unusual values
  if (discount > subtotal * 0.5) {
    warnings.push({
      field: 'discount',
      message: 'Large discount applied (>50% of subtotal)',
      code: 'LARGE_DISCOUNT'
    });
  }
  
  if (tax > subtotal * 0.3) {
    warnings.push({
      field: 'tax',
      message: 'High tax amount (>30% of subtotal)',
      code: 'HIGH_TAX'
    });
  }
  
  if (shipping > subtotal * 0.2) {
    warnings.push({
      field: 'shipping',
      message: 'High shipping cost (>20% of subtotal)',
      code: 'HIGH_SHIPPING'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Validate order status transitions
export const validateStatusTransition = (
  currentStatus: OrderStatus, 
  newStatus: OrderStatus, 
  order: Partial<Order> = {}
): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  // Define valid status transitions
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
    [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED, OrderStatus.RETURNED],
    [OrderStatus.COMPLETED]: [], // Final state
    [OrderStatus.CANCELLED]: [], // Final state
    [OrderStatus.RETURNED]: [OrderStatus.PROCESSING], // Can be reprocessed
  };
  
  // Status transition-specific requirements
  const statusRequirements: Record<OrderStatus, (order: Partial<Order>) => ValidationError[]> = {
    [OrderStatus.PROCESSING]: (order) => {
      const errors: ValidationError[] = [];
      
      // Additional requirements for processing
      if (order.paymentStatus === PaymentStatus.PENDING && !order.paymentMethod) {
        warnings.push({
          field: 'paymentMethod',
          message: 'Orders in processing should have a payment method specified',
          code: 'MISSING_PAYMENT_METHOD'
        });
      }
      
      return errors;
    },
    [OrderStatus.SHIPPED]: (order) => {
      const errors: ValidationError[] = [];
      
      // Require tracking number for shipped orders
      if (!order.trackingNumber) {
        errors.push({
          field: 'trackingNumber',
          message: 'Tracking number is required for shipped orders',
          code: 'TRACKING_NUMBER_REQUIRED'
        });
      }
      
      // Require shipping address
      if (!order.shippingAddress) {
        errors.push({
          field: 'shippingAddress',
          message: 'Shipping address is required for shipped orders',
          code: 'SHIPPING_ADDRESS_REQUIRED'
        });
      }
      
      return errors;
    },
    [OrderStatus.DELIVERED]: (order) => {
      const errors: ValidationError[] = [];
      
      // Add delivered-specific requirements
      if (order.paymentStatus !== PaymentStatus.PAID && order.paymentStatus !== PaymentStatus.PARTIAL) {
        warnings.push({
          field: 'paymentStatus',
          message: 'Order is delivered but payment is not complete',
          code: 'PAYMENT_INCOMPLETE'
        });
      }
      
      return errors;
    },
    [OrderStatus.COMPLETED]: (order) => {
      const errors: ValidationError[] = [];
      
      // Completed orders should be fully paid
      if (order.paymentStatus !== PaymentStatus.PAID) {
        errors.push({
          field: 'paymentStatus',
          message: 'Order cannot be marked as completed until fully paid',
          code: 'PAYMENT_REQUIRED'
        });
      }
      
      return errors;
    },
    [OrderStatus.CANCELLED]: (order) => {
      const errors: ValidationError[] = [];
      
      // No specific requirements for cancelled status
      return errors;
    },
    [OrderStatus.RETURNED]: (order) => {
      const errors: ValidationError[] = [];
      
      // Returned status requires previously being delivered
      if (currentStatus !== OrderStatus.DELIVERED && currentStatus !== OrderStatus.COMPLETED) {
        errors.push({
          field: 'status',
          message: 'Only delivered or completed orders can be returned',
          code: 'INVALID_RETURN'
        });
      }
      
      return errors;
    },
    [OrderStatus.PENDING]: (order) => {
      // No specific requirements for pending status
      return [];
    }
  };
  
  if (currentStatus === newStatus) {
    return { isValid: true, errors: [], warnings: [] }; // No change is valid
  }
  
  const allowedTransitions = validTransitions[currentStatus] || [];
  
  if (!allowedTransitions.includes(newStatus)) {
    errors.push({
      field: 'status',
      message: `Cannot change status from ${currentStatus} to ${newStatus}. Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`,
      code: 'INVALID_STATUS_TRANSITION'
    });
  } else {
    // Check requirements for the new status
    const statusErrors = statusRequirements[newStatus](order);
    errors.push(...statusErrors);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Validate payment status
export const validatePaymentStatus = (paymentStatus: PaymentStatus, orderTotal: number, paidAmount?: number, paymentMethod?: string): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  // Validate payment method if provided
  if (paymentMethod) {
    if (!ORDER_VALIDATION_RULES.paymentMethod.allowedValues.includes(paymentMethod)) {
      errors.push({
        field: 'paymentMethod',
        message: `Invalid payment method. Allowed: ${ORDER_VALIDATION_RULES.paymentMethod.allowedValues.join(', ')}`,
        code: 'INVALID_PAYMENT_METHOD'
      });
    }
    
    // Additional validation: if payment status is PAID or PARTIAL, payment method is required
    if ((paymentStatus === PaymentStatus.PAID || paymentStatus === PaymentStatus.PARTIAL) && !paymentMethod) {
      errors.push({
        field: 'paymentMethod',
        message: 'Payment method is required for paid or partially paid orders',
        code: 'PAYMENT_METHOD_REQUIRED'
      });
    }
  }
  
  if (paidAmount !== undefined) {
    if (paidAmount < 0) {
      errors.push({
        field: 'paidAmount',
        message: 'Paid amount cannot be negative',
        code: 'INVALID_PAID_AMOUNT'
      });
    }
    
    // Validate payment status consistency
    if (paymentStatus === PaymentStatus.PAID && Math.abs(paidAmount - orderTotal) > 0.01) {
      errors.push({
        field: 'paymentStatus',
        message: 'Payment status is "Paid" but paid amount does not match order total',
        code: 'PAYMENT_STATUS_MISMATCH'
      });
    }
    
    if (paymentStatus === PaymentStatus.PARTIAL && (paidAmount <= 0 || paidAmount >= orderTotal)) {
      errors.push({
        field: 'paymentStatus',
        message: 'Payment status is "Partial" but paid amount is not between 0 and total',
        code: 'PARTIAL_PAYMENT_MISMATCH'
      });
    }
    
    if (paymentStatus === PaymentStatus.PENDING && paidAmount > 0) {
      warnings.push({
        field: 'paymentStatus',
        message: 'Payment status is "Pending" but some amount has been paid',
        code: 'PENDING_WITH_PAYMENT'
      });
    }
    
    // Validate for refunded status
    if (paymentStatus === PaymentStatus.REFUNDED && paidAmount > orderTotal) {
      errors.push({
        field: 'paidAmount',
        message: 'Refunded amount cannot be greater than order total',
        code: 'EXCESSIVE_REFUND'
      });
    }
  } else if (paymentStatus === PaymentStatus.PAID || paymentStatus === PaymentStatus.PARTIAL) {
    warnings.push({
      field: 'paidAmount',
      message: 'Paid amount should be specified for paid or partially paid orders',
      code: 'MISSING_PAID_AMOUNT'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Validate address fields
export const validateAddresses = (order: Partial<OrderFormData>): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  // Shipping address validation
  if (order.shippingAddress) {
    if (order.shippingAddress.length > ORDER_VALIDATION_RULES.shippingAddress.maxLength) {
      errors.push({
        field: 'shippingAddress',
        message: `Shipping address must not exceed ${ORDER_VALIDATION_RULES.shippingAddress.maxLength} characters`,
        code: 'MAX_LENGTH'
      });
    }
    
    // Basic format validation - check for minimum required info
    if (!order.shippingAddress.includes(',')) {
      warnings.push({
        field: 'shippingAddress',
        message: 'Shipping address may be incomplete. Please include street, city, state, and zip code',
        code: 'INCOMPLETE_ADDRESS'
      });
    }
  } else if (order.shipping && order.shipping > 0) {
    // If shipping cost is added but no address is provided
    errors.push({
      field: 'shippingAddress',
      message: 'Shipping address is required when shipping charges are applied',
      code: 'REQUIRED'
    });
  }
  
  // Billing address validation
  if (order.billingAddress) {
    if (order.billingAddress.length > ORDER_VALIDATION_RULES.billingAddress.maxLength) {
      errors.push({
        field: 'billingAddress',
        message: `Billing address must not exceed ${ORDER_VALIDATION_RULES.billingAddress.maxLength} characters`,
        code: 'MAX_LENGTH'
      });
    }
    
    // Basic format validation
    if (!order.billingAddress.includes(',')) {
      warnings.push({
        field: 'billingAddress',
        message: 'Billing address may be incomplete. Please include street, city, state, and zip code',
        code: 'INCOMPLETE_ADDRESS'
      });
    }
  }
  
  // Check if shipping and billing are the same when both are provided
  if (order.shippingAddress && order.billingAddress && 
      order.shippingAddress === order.billingAddress) {
    warnings.push({
      field: 'billingAddress',
      message: 'Billing address is identical to shipping address',
      code: 'DUPLICATE_ADDRESS'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Validate tracking number
export const validateTrackingNumber = (trackingNumber?: string): ValidationResult => {
  const errors: ValidationError[] = [];
  
  if (trackingNumber) {
    if (trackingNumber.length > ORDER_VALIDATION_RULES.trackingNumber.maxLength) {
      errors.push({
        field: 'trackingNumber',
        message: `Tracking number must not exceed ${ORDER_VALIDATION_RULES.trackingNumber.maxLength} characters`,
        code: 'MAX_LENGTH'
      });
    }
    
    // Common tracking number formats often contain letters and numbers
    // This is a simple pattern check that could be expanded based on shipping carriers
    const validTrackingPattern = /^[A-Za-z0-9\-\s]+$/;
    if (!validTrackingPattern.test(trackingNumber)) {
      errors.push({
        field: 'trackingNumber',
        message: 'Tracking number contains invalid characters',
        code: 'INVALID_FORMAT'
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Comprehensive order validation
export const validateOrder = (
  order: Partial<OrderFormData>, 
  products?: Product[], 
  party?: Party,
  isUpdate: boolean = false,
  currentStatus?: OrderStatus
): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  // Validate order number if provided
  if (order.orderNumber) {
    const orderNumberValidation = validateOrderNumber(order.orderNumber);
    errors.push(...orderNumberValidation.errors);
  }
  
  // Validate party
  if (order.partyId && order.partyName) {
    const partyValidation = validateParty(order.partyId, order.partyName, party);
    errors.push(...partyValidation.errors);
    warnings.push(...(partyValidation.warnings || []));
  }
  
  // Validate items
  if (order.items) {
    const itemsValidation = validateOrderItems(order.items, products);
    errors.push(...itemsValidation.errors);
    warnings.push(...(itemsValidation.warnings || []));
  }
  
  // Validate financials
  const financialValidation = validateFinancials(order);
  errors.push(...financialValidation.errors);
  warnings.push(...(financialValidation.warnings || []));
  
  // Validate payment status and method
  if (order.paymentStatus && order.total !== undefined) {
    const paymentValidation = validatePaymentStatus(
      order.paymentStatus, 
      order.total, 
      undefined, // Paid amount would be provided in a real implementation
      order.paymentMethod
    );
    errors.push(...paymentValidation.errors);
    warnings.push(...(paymentValidation.warnings || []));
  }
  
  // Validate addresses
  const addressValidation = validateAddresses(order);
  errors.push(...addressValidation.errors);
  warnings.push(...(addressValidation.warnings || []));
  
  // Validate tracking number if provided
  if (order.trackingNumber) {
    const trackingValidation = validateTrackingNumber(order.trackingNumber);
    errors.push(...trackingValidation.errors);
  }
  
  // Validate status transition for updates
  if (isUpdate && currentStatus && order.status && currentStatus !== order.status) {
    const statusValidation = validateStatusTransition(currentStatus, order.status, order as Partial<Order>);
    errors.push(...statusValidation.errors);
    warnings.push(...(statusValidation.warnings || []));
  }
  
  // Validate notes if provided
  if (order.notes && order.notes.length > ORDER_VALIDATION_RULES.notes.maxLength) {
    errors.push({
      field: 'notes',
      message: `Notes must not exceed ${ORDER_VALIDATION_RULES.notes.maxLength} characters`,
      code: 'MAX_LENGTH'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Utility function to format validation errors for display
export const formatValidationErrors = (errors: ValidationError[]): string[] => {
  return errors.map(error => error.message);
};

// Utility function to group validation errors by field
export const groupValidationErrorsByField = (errors: ValidationError[]): Record<string, ValidationError[]> => {
  return errors.reduce((groups, error) => {
    const field = error.field;
    if (!groups[field]) {
      groups[field] = [];
    }
    groups[field].push(error);
    return groups;
  }, {} as Record<string, ValidationError[]>);
};