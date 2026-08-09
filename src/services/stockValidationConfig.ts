/**
 * Stock Validation Configuration Service
 * 
 * This service provides centralized configuration for stock validation behavior
 * across all invoice creation forms in the application.
 */

export interface StockValidationConfig {
  validateStock: boolean;
  updateStock: boolean;
  allowZeroStock: boolean;
  allowNegativeStock: boolean;
  strictMode: boolean;
  showWarnings: boolean;
  enforcementLevel: 'strict' | 'standard' | 'lenient';
}

export class StockValidationConfigService {
  /**
   * DEFAULT CONFIGURATION - ALLOWS ZERO STOCK SALES
   * 
   * This configuration allows creating invoices with zero stock items,
   * but still tracks inventory and shows warnings to users.
   */
  private static readonly DEFAULT_CONFIG: StockValidationConfig = {
    validateStock: true,        // Still validate to show warnings
    updateStock: true,          // Update inventory after sales
    allowZeroStock: true,       // ✅ ALLOW zero stock sales
    allowNegativeStock: true,   // ✅ ALLOW negative stock
    strictMode: false,          // Don't treat warnings as errors
    showWarnings: true,         // Show stock warnings to users
    enforcementLevel: 'lenient' // Lenient enforcement
  };

  /**
   * STRICT CONFIGURATION - BLOCKS ZERO STOCK SALES
   * 
   * Use this configuration if you want to prevent zero stock sales
   */
  private static readonly STRICT_CONFIG: StockValidationConfig = {
    validateStock: true,
    updateStock: true,
    allowZeroStock: false,      // ❌ BLOCK zero stock sales
    allowNegativeStock: false,  // ❌ BLOCK negative stock
    strictMode: true,           // Treat warnings as errors
    showWarnings: true,
    enforcementLevel: 'strict'
  };

  /**
   * NO VALIDATION CONFIGURATION - BYPASS ALL CHECKS
   * 
   * Use this configuration to completely bypass stock validation
   */
  private static readonly NO_VALIDATION_CONFIG: StockValidationConfig = {
    validateStock: false,       // No validation at all
    updateStock: true,          // Still update inventory
    allowZeroStock: true,
    allowNegativeStock: true,
    strictMode: false,
    showWarnings: false,
    enforcementLevel: 'lenient'
  };

  /**
   * Get the current stock validation configuration
   * 
   * You can modify this method to return different configurations
   * based on user roles, settings, or business requirements.
   */
  static getConfig(): StockValidationConfig {
    // Return the default configuration (allows zero stock)
    return { ...this.DEFAULT_CONFIG };
    
    // Uncomment the line below to use strict validation instead:
    // return { ...this.STRICT_CONFIG };
    
    // Uncomment the line below to bypass all validation:
    // return { ...this.NO_VALIDATION_CONFIG };
  }

  /**
   * Get configuration for specific invoice types
   */
  static getConfigForInvoiceType(invoiceType: 'sales' | 'purchase' | 'return'): StockValidationConfig {
    const baseConfig = this.getConfig();

    switch (invoiceType) {
      case 'sales':
        // For sales invoices, use the standard configuration
        return baseConfig;
        
      case 'purchase':
        // For purchase invoices, we typically don't need strict validation
        return {
          ...baseConfig,
          allowZeroStock: true,
          allowNegativeStock: true,
          strictMode: false
        };
        
      case 'return':
        // For return invoices, we might want different rules
        return {
          ...baseConfig,
          allowZeroStock: true,
          allowNegativeStock: true,
          strictMode: false
        };
        
      default:
        return baseConfig;
    }
  }

  /**
   * Get configuration based on user role
   */
  static getConfigForUserRole(userRole: 'admin' | 'manager' | 'user'): StockValidationConfig {
    const baseConfig = this.getConfig();

    switch (userRole) {
      case 'admin':
        // Admins can bypass validation if needed
        return {
          ...baseConfig,
          allowZeroStock: true,
          allowNegativeStock: true,
          strictMode: false
        };
        
      case 'manager':
        // Managers get warnings but can proceed
        return {
          ...baseConfig,
          allowZeroStock: true,
          allowNegativeStock: true,
          strictMode: false,
          showWarnings: true
        };
        
      case 'user':
        // Regular users follow standard rules
        return baseConfig;
        
      default:
        return baseConfig;
    }
  }

  /**
   * Check if zero stock sales are allowed
   */
  static isZeroStockAllowed(): boolean {
    return this.getConfig().allowZeroStock;
  }

  /**
   * Check if negative stock is allowed
   */
  static isNegativeStockAllowed(): boolean {
    return this.getConfig().allowNegativeStock;
  }

  /**
   * Check if stock validation is enabled
   */
  static isStockValidationEnabled(): boolean {
    return this.getConfig().validateStock;
  }

  /**
   * Get user-friendly description of current configuration
   */
  static getConfigDescription(): string {
    const config = this.getConfig();
    
    if (!config.validateStock) {
      return "🔓 Stock validation is DISABLED - All invoices will be created without stock checks";
    }
    
    if (config.allowZeroStock && config.allowNegativeStock) {
      return "✅ LENIENT MODE - Zero stock and negative stock sales are ALLOWED with warnings";
    }
    
    if (!config.allowZeroStock && !config.allowNegativeStock) {
      return "🚫 STRICT MODE - Zero stock and negative stock sales are BLOCKED";
    }
    
    if (config.allowZeroStock && !config.allowNegativeStock) {
      return "⚠️ MIXED MODE - Zero stock allowed, but negative stock is blocked";
    }
    
    return "📊 STANDARD MODE - Stock validation with custom rules";
  }

  /**
   * Update configuration at runtime (for admin settings)
   */
  static updateConfig(newConfig: Partial<StockValidationConfig>): void {
    // In a real application, you might want to save this to a database
    // or configuration file. For now, we'll just log the change.
    console.log('🔧 Stock validation configuration updated:', newConfig);
    
    // You could implement persistence here:
    // await saveConfigToDatabase(newConfig);
    // localStorage.setItem('stockValidationConfig', JSON.stringify(newConfig));
  }
}

export default StockValidationConfigService;