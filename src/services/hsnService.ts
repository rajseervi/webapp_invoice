// HSN/SAC Code Service for GST Compliance

export interface HSNCode {
  code: string;
  description: string;
  gstRate: number;
  category: string;
  isService: boolean;
}

// Comprehensive HSN codes database
export const HSN_CODES: HSNCode[] = [
  // Food Products
  { code: '1001', description: 'Wheat', gstRate: 0, category: 'Food', isService: false },
  { code: '1006', description: 'Rice', gstRate: 0, category: 'Food', isService: false },
  { code: '1701', description: 'Cane or beet sugar', gstRate: 0, category: 'Food', isService: false },
  { code: '1901', description: 'Malt extract; food preparations of flour', gstRate: 18, category: 'Food', isService: false },
  { code: '2201', description: 'Waters, including natural or artificial mineral waters', gstRate: 18, category: 'Beverages', isService: false },
  { code: '2202', description: 'Waters, including mineral waters and aerated waters', gstRate: 28, category: 'Beverages', isService: false },

  // Textiles
  { code: '5208', description: 'Woven fabrics of cotton', gstRate: 5, category: 'Textiles', isService: false },
  { code: '6109', description: 'T-shirts, singlets and other vests', gstRate: 12, category: 'Textiles', isService: false },
  { code: '6203', description: 'Men\'s or boys\' suits, ensembles, jackets', gstRate: 12, category: 'Textiles', isService: false },
  { code: '6204', description: 'Women\'s or girls\' suits, ensembles, jackets', gstRate: 12, category: 'Textiles', isService: false },

  // Electronics
  { code: '8471', description: 'Automatic data processing machines and units', gstRate: 18, category: 'Electronics', isService: false },
  { code: '8517', description: 'Telephone sets, including smartphones', gstRate: 12, category: 'Electronics', isService: false },
  { code: '8528', description: 'Monitors and projectors', gstRate: 18, category: 'Electronics', isService: false },
  { code: '8544', description: 'Insulated wire, cable and other electric conductors', gstRate: 18, category: 'Electronics', isService: false },

  // Furniture
  { code: '9403', description: 'Other furniture and parts thereof', gstRate: 18, category: 'Furniture', isService: false },
  { code: '9404', description: 'Mattress supports; articles of bedding', gstRate: 18, category: 'Furniture', isService: false },

  // Pharmaceuticals
  { code: '3004', description: 'Medicaments', gstRate: 12, category: 'Pharmaceuticals', isService: false },
  { code: '3005', description: 'Wadding, gauze, bandages', gstRate: 12, category: 'Pharmaceuticals', isService: false },

  // Books and Paper
  { code: '4901', description: 'Printed books, brochures, leaflets', gstRate: 12, category: 'Books', isService: false },
  { code: '4902', description: 'Newspapers, journals and periodicals', gstRate: 5, category: 'Books', isService: false },

  // Automotive
  { code: '8703', description: 'Motor cars and other motor vehicles', gstRate: 28, category: 'Automotive', isService: false },
  { code: '8711', description: 'Motorcycles and cycles', gstRate: 28, category: 'Automotive', isService: false },

  // Construction Materials
  { code: '2523', description: 'Portland cement, aluminous cement', gstRate: 28, category: 'Construction', isService: false },
  { code: '6901', description: 'Bricks, blocks, tiles and other ceramic goods', gstRate: 18, category: 'Construction', isService: false },

  // Cosmetics
  { code: '3304', description: 'Beauty or make-up preparations', gstRate: 18, category: 'Cosmetics', isService: false },
  { code: '3401', description: 'Soap; organic surface-active products', gstRate: 18, category: 'Cosmetics', isService: false },
];

// SAC codes for services
export const SAC_CODES: HSNCode[] = [
  // Professional Services
  { code: '998311', description: 'Accounting and bookkeeping services', gstRate: 18, category: 'Professional', isService: true },
  { code: '998312', description: 'Auditing services', gstRate: 18, category: 'Professional', isService: true },
  { code: '998313', description: 'Tax consultancy and preparation services', gstRate: 18, category: 'Professional', isService: true },
  { code: '998314', description: 'Insolvency and receivership services', gstRate: 18, category: 'Professional', isService: true },
  { code: '998321', description: 'Business and management consultancy services', gstRate: 18, category: 'Professional', isService: true },

  // IT Services
  { code: '997212', description: 'Software design and development services', gstRate: 18, category: 'IT', isService: true },
  { code: '997213', description: 'Web design and development services', gstRate: 18, category: 'IT', isService: true },
  { code: '997214', description: 'Software consultancy services', gstRate: 18, category: 'IT', isService: true },

  // Education and Training
  { code: '996511', description: 'Training services', gstRate: 18, category: 'Education', isService: true },
  { code: '996512', description: 'Educational support services', gstRate: 18, category: 'Education', isService: true },

  // Marketing and Advertising
  { code: '996411', description: 'Advertising services', gstRate: 18, category: 'Marketing', isService: true },
  { code: '996412', description: 'Market research and public opinion polling services', gstRate: 18, category: 'Marketing', isService: true },

  // Engineering Services
  { code: '997331', description: 'Engineering services', gstRate: 18, category: 'Engineering', isService: true },
  { code: '997332', description: 'Architectural services', gstRate: 18, category: 'Engineering', isService: true },

  // Transportation
  { code: '996411', description: 'Freight transport services', gstRate: 5, category: 'Transportation', isService: true },
  { code: '996412', description: 'Passenger transport services', gstRate: 5, category: 'Transportation', isService: true },

  // Financial Services
  { code: '997111', description: 'Banking and other financial services', gstRate: 18, category: 'Financial', isService: true },
  { code: '997112', description: 'Insurance services', gstRate: 18, category: 'Financial', isService: true },

  // Healthcare Services
  { code: '996211', description: 'Medical and dental services', gstRate: 0, category: 'Healthcare', isService: true },
  { code: '996212', description: 'Veterinary services', gstRate: 18, category: 'Healthcare', isService: true },

  // Hospitality
  { code: '996311', description: 'Hotel and restaurant services', gstRate: 18, category: 'Hospitality', isService: true },
  { code: '996312', description: 'Catering services', gstRate: 18, category: 'Hospitality', isService: true },
];

export class HSNService {
  // Get all HSN/SAC codes
  static getAllCodes(isService: boolean = false): HSNCode[] {
    return isService ? SAC_CODES : HSN_CODES;
  }

  // Search codes by query (alias for searchHSN for backward compatibility)
  static searchCodes(query: string, isService: boolean = false): HSNCode[] {
    return this.searchHSN(query, isService);
  }

  // Search HSN codes by query
  static searchHSN(query: string, isService: boolean = false): HSNCode[] {
    const codes = isService ? SAC_CODES : HSN_CODES;
    const searchTerm = query.toLowerCase();
    
    return codes.filter(item =>
      item.code.includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm) ||
      item.category.toLowerCase().includes(searchTerm)
    ).slice(0, 10); // Limit to 10 results
  }

  // Get HSN code by exact code
  static getByCode(code: string, isService: boolean = false): HSNCode | null {
    const codes = isService ? SAC_CODES : HSN_CODES;
    return codes.find(item => item.code === code) || null;
  }

  // Get all codes by category
  static getByCategory(category: string, isService: boolean = false): HSNCode[] {
    const codes = isService ? SAC_CODES : HSN_CODES;
    return codes.filter(item => 
      item.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Get suggested GST rate for a code
  static getSuggestedGSTRate(code: string, isService: boolean = false): number {
    const hsnCode = this.getByCode(code, isService);
    return hsnCode ? hsnCode.gstRate : 18; // Default to 18% if not found
  }

  // Validate HSN/SAC code format
  static validateCode(code: string, isService: boolean = false): boolean {
    if (isService) {
      // SAC codes are typically 6 digits
      return /^\d{6}$/.test(code);
    } else {
      // HSN codes are typically 4, 6, or 8 digits
      return /^\d{4,8}$/.test(code);
    }
  }

  // Get all categories
  static getCategories(isService: boolean = false): string[] {
    const codes = isService ? SAC_CODES : HSN_CODES;
    const categories = [...new Set(codes.map(item => item.category))];
    return categories.sort();
  }

  // Get popular codes (most commonly used)
  static getPopularCodes(isService: boolean = false, limit: number = 20): HSNCode[] {
    const codes = isService ? SAC_CODES : HSN_CODES;
    // Return first 'limit' codes as popular ones
    return codes.slice(0, limit);
  }

  // Auto-suggest codes based on product name
  static suggestCodesForProduct(productName: string, isService: boolean = false): HSNCode[] {
    const searchTerms = productName.toLowerCase().split(' ');
    const codes = isService ? SAC_CODES : HSN_CODES;
    
    const suggestions = codes.filter(item => {
      const description = item.description.toLowerCase();
      return searchTerms.some(term => 
        description.includes(term) && term.length > 2
      );
    });

    return suggestions.slice(0, 5); // Top 5 suggestions
  }

  // Get GST rate distribution
  static getGSTRateDistribution(isService: boolean = false): Record<number, number> {
    const codes = isService ? SAC_CODES : HSN_CODES;
    const distribution: Record<number, number> = {};
    
    codes.forEach(item => {
      distribution[item.gstRate] = (distribution[item.gstRate] || 0) + 1;
    });

    return distribution;
  }

  // Get HSN code info with enhanced details
  static getHSNInfo(code: string, isService: boolean = false): HSNCode & { 
    relatedCodes: HSNCode[]; 
    commonProducts: string[];
    taxImplications: string[];
  } | null {
    const hsnCode = this.getByCode(code, isService);
    if (!hsnCode) return null;

    const relatedCodes = this.getByCategory(hsnCode.category, isService).filter(c => c.code !== code);
    
    return {
      ...hsnCode,
      relatedCodes: relatedCodes.slice(0, 5),
      commonProducts: this.getCommonProductsForHSN(code),
      taxImplications: this.getTaxImplications(hsnCode.gstRate)
    };
  }

  // Get common products for HSN code
  private static getCommonProductsForHSN(code: string): string[] {
    const productMap: Record<string, string[]> = {
      '1001': ['Wheat flour', 'Whole wheat', 'Wheat grain'],
      '1006': ['Basmati rice', 'Non-basmati rice', 'Rice flour'],
      '8471': ['Desktop computers', 'Laptops', 'Tablets', 'Computer peripherals'],
      '8517': ['Mobile phones', 'Landline phones', 'Telecommunication equipment'],
      '6109': ['Cotton t-shirts', 'Polo shirts', 'Tank tops'],
      '9403': ['Office furniture', 'Dining tables', 'Chairs', 'Wardrobes']
    };
    return productMap[code] || [];
  }

  // Get tax implications for GST rate
  private static getTaxImplications(gstRate: number): string[] {
    const implications: Record<number, string[]> = {
      0: ['Exempt from GST', 'No input tax credit available', 'Essential goods category'],
      5: ['Low GST rate', 'Input tax credit available', 'Basic necessity items'],
      12: ['Standard rate for most goods', 'Full input tax credit', 'Common consumer items'],
      18: ['Standard service rate', 'Full input tax credit', 'Most services and products'],
      28: ['Luxury goods rate', 'Full input tax credit', 'High-end products and services']
    };
    return implications[gstRate] || ['Standard GST rate applies'];
  }

  // Validate and fix HSN codes in bulk
  static validateBulkHSNCodes(codes: string[]): Array<{
    originalCode: string;
    isValid: boolean;
    suggestedCode?: string;
    reason?: string;
  }> {
    return codes.map(code => {
      const isValid = this.validateCode(code);
      if (isValid) {
        return { originalCode: code, isValid: true };
      }

      // Try to find similar codes
      const similarCodes = this.searchHSN(code.substring(0, 4));
      return {
        originalCode: code,
        isValid: false,
        suggestedCode: similarCodes[0]?.code,
        reason: 'Invalid format or code not found'
      };
    });
  }

  // Get HSN mapping for category
  static getHSNMappingForCategory(category: string): Array<{
    hsnCode: string;
    description: string;
    gstRate: number;
    usage: string;
  }> {
    const codes = this.getByCategory(category);
    return codes.map(code => ({
      hsnCode: code.code,
      description: code.description,
      gstRate: code.gstRate,
      usage: this.getUsageGuideline(code.code)
    }));
  }

  // Get usage guideline for HSN code
  private static getUsageGuideline(code: string): string {
    const guidelines: Record<string, string> = {
      '1001': 'Use for all wheat and wheat products',
      '1006': 'Use for rice in all forms including flour',
      '8471': 'Use for computers and data processing equipment',
      '8517': 'Use for telecommunication equipment including mobile phones',
      '6109': 'Use for knitted t-shirts and similar garments',
      '9403': 'Use for furniture items excluding specialized furniture'
    };
    return guidelines[code] || 'Refer to GST tariff for detailed usage';
  }
}

export default HSNService;