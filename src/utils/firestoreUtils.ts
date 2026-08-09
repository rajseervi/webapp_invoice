/**
 * Utility functions for Firestore operations
 */

/**
 * Remove undefined fields from an object to prevent Firestore errors
 * Firestore doesn't allow undefined values, so we need to filter them out
 */
export function removeUndefinedFields(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedFields(item));
  }

  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedFields(value);
      }
    }
    
    return cleaned;
  }

  return obj;
}

/**
 * Sanitize data before sending to Firestore
 * This function removes undefined values and handles special cases
 */
export function sanitizeForFirestore(data: any): any {
  return removeUndefinedFields(data);
}

/**
 * Convert Firestore timestamps to ISO strings for JSON serialization
 */
export function convertTimestampsToStrings(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertTimestampsToStrings(item));
  }

  if (typeof obj === 'object') {
    // Check if it's a Firestore timestamp
    if (obj.toDate && typeof obj.toDate === 'function') {
      return obj.toDate().toISOString();
    }

    // Check if it's a Date object
    if (obj instanceof Date) {
      return obj.toISOString();
    }

    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertTimestampsToStrings(value);
    }
    return converted;
  }

  return obj;
}

/**
 * Convert ISO strings back to Date objects for Firestore
 */
export function convertStringsToTimestamps(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertStringsToTimestamps(item));
  }

  if (typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Convert common timestamp fields
      if ((key === 'createdAt' || key === 'updatedAt') && typeof value === 'string') {
        converted[key] = new Date(value);
      } else {
        converted[key] = convertStringsToTimestamps(value);
      }
    }
    return converted;
  }

  return obj;
}

/**
 * Validate that an object doesn't contain undefined values
 */
export function validateNoUndefinedFields(obj: any, path: string = ''): string[] {
  const errors: string[] = [];

  if (obj === undefined) {
    errors.push(`Undefined value at path: ${path}`);
    return errors;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      errors.push(...validateNoUndefinedFields(item, `${path}[${index}]`));
    });
  } else if (typeof obj === 'object' && obj !== null && !(obj instanceof Date)) {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      errors.push(...validateNoUndefinedFields(value, currentPath));
    }
  }

  return errors;
}

/**
 * Create a safe object for Firestore by removing undefined fields and converting timestamps
 */
export function createFirestoreSafeObject(obj: any): any {
  // First remove undefined fields
  const withoutUndefined = removeUndefinedFields(obj);
  
  // Then convert timestamps if needed
  return convertStringsToTimestamps(withoutUndefined);
}

/**
 * Prepare data for JSON export by converting timestamps to strings
 */
export function prepareForJsonExport(obj: any): any {
  // First convert timestamps to strings
  const withStringTimestamps = convertTimestampsToStrings(obj);
  
  // Then remove undefined fields
  return removeUndefinedFields(withStringTimestamps);
}

/**
 * Clean party data for Firestore operations
 */
export function cleanPartyData(data: any): any {
  return sanitizeForFirestore(data);
}

/**
 * Clean invoice data for Firestore operations
 * Removes undefined fields and ensures data is safe for Firestore
 */
export function cleanInvoiceData(data: any): any {
  if (!data || typeof data !== 'object') {
    return {};
  }

  // First pass: remove undefined values and handle special cases
  const cleaned = sanitizeForFirestore(data);
  
  // Second pass: validate and fix specific invoice fields
  const result: any = {};
  
  for (const [key, value] of Object.entries(cleaned)) {
    // Skip undefined values (should already be handled by sanitizeForFirestore)
    if (value === undefined) {
      continue;
    }
    
    // Handle specific field types
    switch (key) {
      case 'items':
        // Ensure items is an array and clean each item
        if (Array.isArray(value)) {
          result[key] = value.map(item => {
            if (!item || typeof item !== 'object') return null;
            
            const cleanedItem = sanitizeForFirestore(item);
            
            // Handle specific item fields
            const itemResult: any = {};
            
            for (const [itemKey, itemValue] of Object.entries(cleanedItem)) {
              if (itemValue === undefined) continue;
              
              switch (itemKey) {
                case 'price':
                case 'quantity':
                case 'discount':
                case 'finalPrice':
                case 'margin': // Dealer Profit/Discount percent per item
                case 'gstRate':
                case 'cgstAmount':
                case 'sgstAmount':
                case 'igstAmount':
                case 'taxableAmount':
                case 'totalTaxAmount':
                  // Ensure numeric values are valid numbers
                  const numVal = Number(itemValue);
                  if (!isNaN(numVal) && isFinite(numVal)) {
                    itemResult[itemKey] = numVal;
                  } else {
                    itemResult[itemKey] = 0;
                  }
                  break;
                  
                case 'name':
                case 'productId':
                case 'productName':
                case 'category':
                case 'hsnCode':
                case 'discountType':
                  // Ensure string values
                  if (itemValue !== null && itemValue !== undefined) {
                    itemResult[itemKey] = String(itemValue);
                  }
                  break;
                  
                default:
                  // For all other fields, include if not undefined
                  if (itemValue !== undefined) {
                    itemResult[itemKey] = itemValue;
                  }
                  break;
              }
            }
            
            return itemResult;
          }).filter(item => item !== null && item !== undefined);
        } else {
          result[key] = [];
        }
        break;
        
      case 'date':
      case 'invoiceDate':
        // Ensure date is a string
        if (value && typeof value === 'string') {
          result[key] = value;
        } else if (value && value.toDate && typeof value.toDate === 'function') {
          result[key] = value.toDate().toISOString().split('T')[0];
        } else if (value instanceof Date) {
          result[key] = value.toISOString().split('T')[0];
        }
        break;
        
      case 'total':
      case 'subtotal':
      case 'discount':
      case 'totalTaxAmount':
      case 'totalTaxableAmount':
      case 'totalCgst':
      case 'totalSgst':
      case 'totalIgst':
      case 'transportCharges':
      case 'roundOff':
      case 'dp': // Dealer Profit/Discount amount total
        // Ensure numeric values are valid numbers
        const numValue = Number(value);
        if (!isNaN(numValue) && isFinite(numValue)) {
          result[key] = numValue;
        } else {
          result[key] = 0;
        }
        break;
        
      case 'isGstInvoice':
        // Ensure boolean values
        result[key] = Boolean(value);
        break;
        
      case 'partyName':
      case 'partyAddress':
      case 'partyEmail':
      case 'partyPhone':
      case 'partyGstin':
      case 'companyName':
      case 'companyAddress':
      case 'companyGstin':
      case 'invoiceNumber':
      case 'notes':
      case 'placeOfSupply':
        // Ensure string values
        if (value !== null && value !== undefined) {
          result[key] = String(value);
        }
        break;
        
      case 'partyStateCode':
      case 'companyStateCode':
        // Ensure state codes are valid strings
        if (value && typeof value === 'string') {
          result[key] = value;
        }
        break;
        
      case 'updatedAt':
      case 'createdAt':
        // Handle timestamp fields - keep as-is if it's serverTimestamp()
        if (value && (value._methodName === 'serverTimestamp' || typeof value === 'object')) {
          result[key] = value;
        } else if (value && typeof value === 'string') {
          // Convert string to Date if needed
          result[key] = new Date(value);
        } else if (value instanceof Date) {
          result[key] = value;
        }
        break;
        
      default:
        // For all other fields, include if not undefined
        if (value !== undefined) {
          result[key] = value;
        }
        break;
    }
  }
  
  return result;
}

/**
 * Clean order data for Firestore operations
 * Removes undefined fields and ensures data is safe for Firestore
 */
export function cleanOrderData(data: any): any {
  return sanitizeForFirestore(data);
}

/**
 * Clean product data for Firestore operations
 * Removes undefined fields and ensures data is safe for Firestore
 */
export function cleanProductData(data: any): any {
  return sanitizeForFirestore(data);
}

/**
 * Clean category data for Firestore operations
 * Removes undefined fields and ensures data is safe for Firestore
 */
export function cleanCategoryData(data: any): any {
  return sanitizeForFirestore(data);
}

/**
 * Validate Firestore data to ensure it doesn't contain undefined values
 */
export function validateFirestoreData(data: any, objectName: string = 'object'): void {
  const errors = validateNoUndefinedFields(data);
  if (errors.length > 0) {
    throw new Error(`Invalid ${objectName} data: ${errors.join(', ')}`);
  }
}

/**
 * Generic data cleaner for any Firestore document
 * Removes undefined fields and ensures data is safe for Firestore
 */
export function cleanFirestoreData(data: any): any {
  return sanitizeForFirestore(data);
}

/**
 * Validate data before sending to Firestore updateDoc
 * Returns detailed information about any problematic fields
 */
export function validateUpdateDocData(data: any, documentType: string = 'document'): { isValid: boolean; errors: string[]; cleanedData: any } {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: [`${documentType} data must be a valid object`],
      cleanedData: {}
    };
  }

  // Check for undefined values
  const undefinedFields = validateNoUndefinedFields(data);
  if (undefinedFields.length > 0) {
    errors.push(`Undefined fields found: ${undefinedFields.join(', ')}`);
  }

  // Check for invalid data types
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      errors.push(`Field '${key}' is undefined`);
      continue;
    }

    // Check for functions (not allowed in Firestore)
    if (typeof value === 'function') {
      errors.push(`Field '${key}' contains a function, which is not allowed in Firestore`);
      continue;
    }

    // Check for symbols (not allowed in Firestore)
    if (typeof value === 'symbol') {
      errors.push(`Field '${key}' contains a symbol, which is not allowed in Firestore`);
      continue;
    }

    // Check for circular references in objects
    if (typeof value === 'object' && value !== null) {
      try {
        JSON.stringify(value);
      } catch (e) {
        errors.push(`Field '${key}' contains circular references or non-serializable data`);
        continue;
      }
    }

    // Validate specific field patterns for invoices
    if (documentType === 'invoice') {
      if (key.includes('total') || key.includes('amount') || key.includes('price') || key === 'dp' || key === 'margin') {
        const numValue = Number(value);
        if (isNaN(numValue) || !isFinite(numValue)) {
          errors.push(`Field '${key}' must be a valid number, got: ${typeof value} (${value})`);
        }
      }
    }
  }

  // Clean the data
  let cleanedData;
  try {
    if (documentType === 'invoice') {
      cleanedData = cleanInvoiceData(data);
    } else {
      cleanedData = sanitizeForFirestore(data);
    }
  } catch (e) {
    errors.push(`Error cleaning data: ${e instanceof Error ? e.message : String(e)}`);
    cleanedData = {};
  }

  return {
    isValid: errors.length === 0,
    errors,
    cleanedData
  };
}