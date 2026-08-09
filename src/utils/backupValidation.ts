import { BackupData, BackupCollection, BACKUP_COLLECTIONS } from '@/services/backupService';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalCollections: number;
    totalDocuments: number;
    missingCollections: string[];
    extraCollections: string[];
    emptyCollections: string[];
  };
}

export interface CollectionValidation {
  collection: string;
  isValid: boolean;
  documentCount: number;
  errors: string[];
  warnings: string[];
  sampleDocument?: any;
}

/**
 * Validate backup data structure and content
 */
export function validateBackupData(backupData: BackupData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate metadata
  if (!backupData.metadata) {
    errors.push('Missing backup metadata');
  } else {
    if (!backupData.metadata.id) errors.push('Missing backup ID');
    if (!backupData.metadata.name) errors.push('Missing backup name');
    if (!backupData.metadata.createdAt) errors.push('Missing creation date');
    if (!backupData.metadata.createdBy) errors.push('Missing creator information');
    if (!Array.isArray(backupData.metadata.collections)) {
      errors.push('Invalid collections list in metadata');
    }
  }
  
  // Validate data structure
  if (!backupData.data || typeof backupData.data !== 'object') {
    errors.push('Missing or invalid backup data');
    return {
      isValid: false,
      errors,
      warnings,
      summary: {
        totalCollections: 0,
        totalDocuments: 0,
        missingCollections: [...BACKUP_COLLECTIONS],
        extraCollections: [],
        emptyCollections: []
      }
    };
  }
  
  // Analyze collections
  const dataCollections = Object.keys(backupData.data);
  const metadataCollections = backupData.metadata?.collections || [];
  const missingCollections = BACKUP_COLLECTIONS.filter(col => !dataCollections.includes(col));
  const extraCollections = dataCollections.filter(col => !BACKUP_COLLECTIONS.includes(col as BackupCollection));
  const emptyCollections = dataCollections.filter(col => 
    !Array.isArray(backupData.data[col as BackupCollection]) || 
    backupData.data[col as BackupCollection].length === 0
  );
  
  // Check for missing expected collections
  if (missingCollections.length > 0) {
    warnings.push(`Missing collections: ${missingCollections.join(', ')}`);
  }
  
  // Check for unexpected collections
  if (extraCollections.length > 0) {
    warnings.push(`Unexpected collections: ${extraCollections.join(', ')}`);
  }
  
  // Check for empty collections
  if (emptyCollections.length > 0) {
    warnings.push(`Empty collections: ${emptyCollections.join(', ')}`);
  }
  
  // Validate each collection
  let totalDocuments = 0;
  for (const collection of dataCollections) {
    const collectionData = backupData.data[collection as BackupCollection];
    
    if (!Array.isArray(collectionData)) {
      errors.push(`Collection '${collection}' is not an array`);
      continue;
    }
    
    totalDocuments += collectionData.length;
    
    // Validate collection documents
    const collectionValidation = validateCollection(collection, collectionData);
    errors.push(...collectionValidation.errors.map(err => `${collection}: ${err}`));
    warnings.push(...collectionValidation.warnings.map(warn => `${collection}: ${warn}`));
  }
  
  // Check metadata consistency
  if (backupData.metadata?.totalDocuments !== undefined && 
      backupData.metadata.totalDocuments !== totalDocuments) {
    warnings.push(`Document count mismatch: metadata says ${backupData.metadata.totalDocuments}, found ${totalDocuments}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalCollections: dataCollections.length,
      totalDocuments,
      missingCollections,
      extraCollections,
      emptyCollections
    }
  };
}

/**
 * Validate a specific collection
 */
export function validateCollection(collectionName: string, documents: any[]): CollectionValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!Array.isArray(documents)) {
    return {
      collection: collectionName,
      isValid: false,
      documentCount: 0,
      errors: ['Collection data is not an array'],
      warnings: []
    };
  }
  
  if (documents.length === 0) {
    warnings.push('Collection is empty');
  }
  
  // Validate document structure
  const requiredFields = getRequiredFields(collectionName);
  const documentErrors: string[] = [];
  
  documents.forEach((doc, index) => {
    if (!doc || typeof doc !== 'object') {
      documentErrors.push(`Document ${index} is not an object`);
      return;
    }
    
    // Check for required fields
    for (const field of requiredFields) {
      if (!(field in doc)) {
        documentErrors.push(`Document ${index} missing required field: ${field}`);
      }
    }
    
    // Validate ID field
    if (!doc.id || typeof doc.id !== 'string') {
      documentErrors.push(`Document ${index} has invalid or missing ID`);
    }
  });
  
  // Only report first few errors to avoid spam
  if (documentErrors.length > 0) {
    errors.push(...documentErrors.slice(0, 5));
    if (documentErrors.length > 5) {
      errors.push(`... and ${documentErrors.length - 5} more document errors`);
    }
  }
  
  // Check for duplicate IDs
  const ids = documents.map(doc => doc.id).filter(Boolean);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    errors.push('Duplicate document IDs found');
  }
  
  return {
    collection: collectionName,
    isValid: errors.length === 0,
    documentCount: documents.length,
    errors,
    warnings,
    sampleDocument: documents.length > 0 ? documents[0] : undefined
  };
}

/**
 * Get required fields for each collection
 */
function getRequiredFields(collectionName: string): string[] {
  const commonFields = ['id'];
  
  switch (collectionName) {
    case 'categories':
      return [...commonFields, 'name'];
    case 'gstSettings':
      return [...commonFields, 'companyName', 'companyGstin'];
    case 'invoices':
      return [...commonFields, 'invoiceNumber', 'date', 'partyId', 'items', 'total'];
    case 'ledger_accounts':
      return [...commonFields, 'name', 'type'];
    case 'orders':
      return [...commonFields, 'orderNumber', 'date', 'partyId', 'items'];
    case 'parties':
      return [...commonFields, 'name'];
    case 'permissionTemplates':
      return [...commonFields, 'name', 'permissions'];
    case 'products':
      return [...commonFields, 'name', 'price'];
    case 'purchase_invoices':
      return [...commonFields, 'invoiceNumber', 'date', 'supplierId', 'items', 'total'];
    case 'settings':
      return [...commonFields, 'key', 'value'];
    case 'suppliers':
      return [...commonFields, 'name'];
    case 'transactions':
      return [...commonFields, 'amount', 'type', 'date'];
    case 'users':
      return [...commonFields, 'email'];
    default:
      return commonFields;
  }
}

/**
 * Generate a validation report
 */
export function generateValidationReport(validation: ValidationResult): string {
  const lines: string[] = [];
  
  lines.push('=== BACKUP VALIDATION REPORT ===\n');
  
  // Summary
  lines.push(`Status: ${validation.isValid ? '✅ VALID' : '❌ INVALID'}`);
  lines.push(`Total Collections: ${validation.summary.totalCollections}`);
  lines.push(`Total Documents: ${validation.summary.totalDocuments}`);
  lines.push('');
  
  // Errors
  if (validation.errors.length > 0) {
    lines.push('🚨 ERRORS:');
    validation.errors.forEach(error => lines.push(`  - ${error}`));
    lines.push('');
  }
  
  // Warnings
  if (validation.warnings.length > 0) {
    lines.push('⚠️  WARNINGS:');
    validation.warnings.forEach(warning => lines.push(`  - ${warning}`));
    lines.push('');
  }
  
  // Missing collections
  if (validation.summary.missingCollections.length > 0) {
    lines.push('📋 MISSING COLLECTIONS:');
    validation.summary.missingCollections.forEach(col => lines.push(`  - ${col}`));
    lines.push('');
  }
  
  // Extra collections
  if (validation.summary.extraCollections.length > 0) {
    lines.push('➕ EXTRA COLLECTIONS:');
    validation.summary.extraCollections.forEach(col => lines.push(`  - ${col}`));
    lines.push('');
  }
  
  // Empty collections
  if (validation.summary.emptyCollections.length > 0) {
    lines.push('📭 EMPTY COLLECTIONS:');
    validation.summary.emptyCollections.forEach(col => lines.push(`  - ${col}`));
    lines.push('');
  }
  
  lines.push('=== END REPORT ===');
  
  return lines.join('\n');
}

/**
 * Check backup compatibility with current system
 */
export function checkBackupCompatibility(backupData: BackupData): {
  isCompatible: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check version compatibility
  const backupVersion = backupData.metadata?.version;
  const currentVersion = '1.0.0'; // This should come from your app config
  
  if (backupVersion && backupVersion !== currentVersion) {
    issues.push(`Version mismatch: backup is ${backupVersion}, current system is ${currentVersion}`);
    recommendations.push('Consider updating the system or creating a new backup');
  }
  
  // Check age of backup
  const backupDate = new Date(backupData.metadata?.createdAt || '');
  const daysSinceBackup = Math.floor((Date.now() - backupDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceBackup > 30) {
    issues.push(`Backup is ${daysSinceBackup} days old`);
    recommendations.push('Consider creating a fresh backup for better data integrity');
  }
  
  // Check for critical collections
  const criticalCollections = ['users', 'gstSettings', 'parties'];
  const missingCritical = criticalCollections.filter(col => 
    !backupData.data[col as BackupCollection] || 
    backupData.data[col as BackupCollection].length === 0
  );
  
  if (missingCritical.length > 0) {
    issues.push(`Missing critical collections: ${missingCritical.join(', ')}`);
    recommendations.push('Ensure all critical data is included in the backup');
  }
  
  return {
    isCompatible: issues.length === 0,
    issues,
    recommendations
  };
}

/**
 * Sanitize backup data before restore
 */
export function sanitizeBackupData(backupData: BackupData): BackupData {
  const sanitized = JSON.parse(JSON.stringify(backupData)); // Deep clone
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'key'];
  
  Object.keys(sanitized.data).forEach(collectionName => {
    const collection = sanitized.data[collectionName as BackupCollection];
    if (Array.isArray(collection)) {
      collection.forEach(doc => {
        sensitiveFields.forEach(field => {
          if (field in doc) {
            delete doc[field];
          }
        });
      });
    }
  });
  
  return sanitized;
}