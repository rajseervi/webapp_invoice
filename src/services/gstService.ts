import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

// Indian state codes and names mapping
export const INDIAN_STATES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman and Diu',
  '26': 'Dadra and Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh'
};

// GST calculation result interface
export interface GstCalculationResult {
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  totalAmount: number;
  isInterState: boolean;
}

// Invoice GST calculation result interface
export interface InvoiceGstCalculationResult {
  items: Array<{
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalTaxAmount: number;
    totalAmount: number;
  }>;
  totals: {
    totalTaxableAmount: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalTaxAmount: number;
    totalFinalAmount: number;
    isInterState: boolean;
  };
}

// GST Settings interface
export interface GstSettings {
  enableGst: boolean;
  companyName: string;
  companyAddress: string;
  companyGstin: string;
  companyStateCode: string;
  companyStateName: string;
  defaultGstRate: number;
  userId?: string;
}

// GST Calculator class
export class GstCalculator {
  /**
   * Validate GSTIN format
   */
  static validateGstin(gstin: string): boolean {
    if (!gstin || typeof gstin !== 'string') return false;
    
    // Remove spaces and convert to uppercase
    const cleanGstin = gstin.replace(/\s/g, '').toUpperCase();
    
    // GSTIN format: 15 characters
    // First 2: State code (01-37)
    // Next 10: PAN of the taxpayer
    // 13th: Entity code (1-9, A-Z)
    // 14th: Check digit (0-9, A-Z)
    // 15th: Default 'Z'
    
    const gstinRegex = /^[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z][1-9A-Z][Z][0-9A-Z]$/;
    
    if (!gstinRegex.test(cleanGstin)) return false;
    
    // Validate state code
    const stateCode = cleanGstin.substring(0, 2);
    return INDIAN_STATES.hasOwnProperty(stateCode);
  }

  /**
   * Extract state code from GSTIN
   */
  static extractStateCodeFromGstin(gstin: string): string | null {
    if (!this.validateGstin(gstin)) return null;
    
    const cleanGstin = gstin.replace(/\s/g, '').toUpperCase();
    return cleanGstin.substring(0, 2);
  }

  /**
   * Get state name from state code
   */
  static getStateName(stateCode: string): string {
    return INDIAN_STATES[stateCode] || 'Unknown State';
  }

  /**
   * Check if transaction is inter-state
   */
  static isInterState(companyStateCode: string, partyStateCode: string): boolean {
    return companyStateCode !== partyStateCode;
  }

  /**
   * Calculate GST for a single item
   */
  static calculateGst(
    taxableAmount: number,
    gstRate: number,
    isInterState: boolean
  ): GstCalculationResult {
    const totalTaxAmount = (taxableAmount * gstRate) / 100;
    
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    
    if (isInterState) {
      igstAmount = totalTaxAmount;
    } else {
      cgstAmount = totalTaxAmount / 2;
      sgstAmount = totalTaxAmount / 2;
    }
    
    return {
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTaxAmount,
      totalAmount: taxableAmount + totalTaxAmount,
      isInterState
    };
  }

  /**
   * Calculate GST with discount
   */
  static calculateGstWithDiscount(
    baseAmount: number,
    discountPercentage: number,
    gstRate: number,
    isInterState: boolean
  ): GstCalculationResult {
    const discountAmount = (baseAmount * discountPercentage) / 100;
    const taxableAmount = baseAmount - discountAmount;
    
    return this.calculateGst(taxableAmount, gstRate, isInterState);
  }
}

// Invoice GST Calculator class
export class InvoiceGstCalculator {
  /**
   * Calculate GST for entire invoice
   */
  static calculateInvoiceGst(
    items: Array<{ taxableAmount: number; gstRate: number }>,
    companyStateCode: string,
    partyStateCode: string
  ): InvoiceGstCalculationResult {
    const isInterState = GstCalculator.isInterState(companyStateCode, partyStateCode);
    
    const calculatedItems = items.map(item => {
      const gstResult = GstCalculator.calculateGst(
        item.taxableAmount,
        item.gstRate,
        isInterState
      );
      
      return {
        taxableAmount: gstResult.taxableAmount,
        cgstAmount: gstResult.cgstAmount,
        sgstAmount: gstResult.sgstAmount,
        igstAmount: gstResult.igstAmount,
        totalTaxAmount: gstResult.totalTaxAmount,
        totalAmount: gstResult.totalAmount
      };
    });
    
    // Calculate totals
    const totals = calculatedItems.reduce(
      (acc, item) => ({
        totalTaxableAmount: acc.totalTaxableAmount + item.taxableAmount,
        totalCgst: acc.totalCgst + item.cgstAmount,
        totalSgst: acc.totalSgst + item.sgstAmount,
        totalIgst: acc.totalIgst + item.igstAmount,
        totalTaxAmount: acc.totalTaxAmount + item.totalTaxAmount,
        totalFinalAmount: acc.totalFinalAmount + item.totalAmount,
        isInterState
      }),
      {
        totalTaxableAmount: 0,
        totalCgst: 0,
        totalSgst: 0,
        totalIgst: 0,
        totalTaxAmount: 0,
        totalFinalAmount: 0,
        isInterState
      }
    );
    
    return {
      items: calculatedItems,
      totals
    };
  }
}

// GST Settings Service class
export class GstSettingsService {
  private static readonly COLLECTION_NAME = 'gstSettings';
  
  /**
   * Get GST settings for current user
   */
  static async getGstSettings(userId?: string): Promise<GstSettings | null> {
    try {
      // For now, return default settings if no userId provided
      // In a real app, you'd get this from user context
      const settingsId = userId || 'default';
      const docRef = doc(db, this.COLLECTION_NAME, settingsId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as GstSettings;
      }
      
      // Return default settings if none exist
      return {
        enableGst: true,
        companyName: 'Your Company Name',
        companyAddress: 'Your Company Address',
        companyGstin: '',
        companyStateCode: '27', // Maharashtra as default
        companyStateName: 'Maharashtra',
        defaultGstRate: 18,
        userId: settingsId
      };
    } catch (error) {
      console.error('Error fetching GST settings:', error);
      return null;
    }
  }
  
  /**
   * Save GST settings
   */
  static async saveGstSettings(settings: GstSettings, userId?: string): Promise<void> {
    try {
      const settingsId = userId || settings.userId || 'default';
      const docRef = doc(db, this.COLLECTION_NAME, settingsId);
      
      const settingsData = {
        ...settings,
        userId: settingsId,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(docRef, settingsData, { merge: true });
    } catch (error) {
      console.error('Error saving GST settings:', error);
      throw error;
    }
  }
  
  /**
   * Update GST settings
   */
  static async updateGstSettings(
    updates: Partial<GstSettings>, 
    userId?: string
  ): Promise<void> {
    try {
      const settingsId = userId || 'default';
      const docRef = doc(db, this.COLLECTION_NAME, settingsId);
      
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating GST settings:', error);
      throw error;
    }
  }
}

// Export default for backward compatibility
export default {
  GstCalculator,
  InvoiceGstCalculator,
  GstSettingsService,
  INDIAN_STATES
};