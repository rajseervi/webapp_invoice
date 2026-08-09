import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { CompanyInfo, UserPreferences, StatisticsSettings, PrintingPreferences } from '@/types/company';

/**
 * Default printing preferences with 2 copies as default
 */
export const DEFAULT_PRINTING_PREFERENCES: PrintingPreferences = {
  defaultCopies: 2,
  paperSize: 'A4',
  orientation: 'portrait',
  colorMode: 'color',
  includeHeader: true,
  includeFooter: true,
  showWatermark: false,
  template: 'modern'
};

/**
 * Get company information from Firestore
 * @returns Promise with company information
 */
export const getCompanyInfo = async (): Promise<CompanyInfo | null> => {
  try {
    const companyDocRef = doc(db, 'settings', 'company');
    const companyDoc = await getDoc(companyDocRef);
    
    if (companyDoc.exists()) {
      const data = companyDoc.data() as CompanyInfo;
      return {
        ...data,
        bankDetails: data.bankDetails || {}
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting company info:', error);
    throw error;
  }
};

/**
 * Save company information to Firestore
 * @param companyInfo Company information to save
 * @returns Promise that resolves when the operation is complete
 */
export const saveCompanyInfo = async (companyInfo: CompanyInfo): Promise<void> => {
  try {
    const companyDocRef = doc(db, 'settings', 'company');
    const now = new Date().toISOString();
    
    // Check if document exists
    const docSnap = await getDoc(companyDocRef);
    
    if (docSnap.exists()) {
      // Update existing document
      await updateDoc(companyDocRef, {
        ...companyInfo,
        bankDetails: companyInfo.bankDetails || {},
        updatedAt: now
      });
    } else {
      // Create new document
      await setDoc(companyDocRef, {
        ...companyInfo,
        bankDetails: companyInfo.bankDetails || {},
        createdAt: now,
        updatedAt: now
      });
    }
  } catch (error) {
    console.error('Error saving company info:', error);
    throw error;
  }
};

/**
 * Get user preferences from Firestore
 * @param userId User ID
 * @returns Promise with user preferences
 */
export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  try {
    const userPrefDocRef = doc(db, 'users', userId, 'preferences', 'general');
    const userPrefDoc = await getDoc(userPrefDocRef);
    
    if (userPrefDoc.exists()) {
      const preferences = userPrefDoc.data() as UserPreferences;
      // Ensure printing preferences exist with defaults
      if (!preferences.printing) {
        preferences.printing = DEFAULT_PRINTING_PREFERENCES;
      }
      return preferences;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user preferences:', error);
    throw error;
  }
};

/**
 * Save user preferences to Firestore
 * @param userId User ID
 * @param preferences User preferences to save
 * @returns Promise that resolves when the operation is complete
 */
export const saveUserPreferences = async (userId: string, preferences: UserPreferences): Promise<void> => {
  try {
    const userPrefDocRef = doc(db, 'users', userId, 'preferences', 'general');
    await setDoc(userPrefDocRef, preferences, { merge: true });
  } catch (error) {
    console.error('Error saving user preferences:', error);
    throw error;
  }
};

/**
 * Get statistics settings from Firestore
 * @param userId User ID
 * @returns Promise with statistics settings
 */
export const getStatisticsSettings = async (userId: string): Promise<StatisticsSettings | null> => {
  try {
    const statsDocRef = doc(db, 'users', userId, 'preferences', 'statistics');
    const statsDoc = await getDoc(statsDocRef);
    
    if (statsDoc.exists()) {
      return statsDoc.data() as StatisticsSettings;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting statistics settings:', error);
    throw error;
  }
};

/**
 * Save statistics settings to Firestore
 * @param userId User ID
 * @param settings Statistics settings to save
 * @returns Promise that resolves when the operation is complete
 */
export const saveStatisticsSettings = async (userId: string, settings: StatisticsSettings): Promise<void> => {
  try {
    const statsDocRef = doc(db, 'users', userId, 'preferences', 'statistics');
    await setDoc(statsDocRef, settings, { merge: true });
  } catch (error) {
    console.error('Error saving statistics settings:', error);
    throw error;
  }
};

/**
 * Get printing preferences from Firestore
 * @param userId User ID
 * @returns Promise with printing preferences
 */
export const getPrintingPreferences = async (userId: string): Promise<PrintingPreferences> => {
  try {
    const userPref = await getUserPreferences(userId);
    return userPref?.printing || DEFAULT_PRINTING_PREFERENCES;
  } catch (error) {
    console.error('Error getting printing preferences:', error);
    return DEFAULT_PRINTING_PREFERENCES;
  }
};

/**
 * Save printing preferences to Firestore
 * @param userId User ID
 * @param printingPrefs Printing preferences to save
 * @returns Promise that resolves when the operation is complete
 */
export const savePrintingPreferences = async (userId: string, printingPrefs: PrintingPreferences): Promise<void> => {
  try {
    const userPrefDocRef = doc(db, 'users', userId, 'preferences', 'general');
    
    // Get existing preferences first
    const existingPrefs = await getUserPreferences(userId);
    const updatedPrefs = {
      ...existingPrefs,
      printing: printingPrefs
    };
    
    await setDoc(userPrefDocRef, updatedPrefs, { merge: true });
  } catch (error) {
    console.error('Error saving printing preferences:', error);
    throw error;
  }
};

/**
 * Update specific printing setting
 * @param userId User ID
 * @param key The key to update in printing preferences
 * @param value The value to set
 * @returns Promise that resolves when the operation is complete
 */
export const updatePrintingSetting = async <K extends keyof PrintingPreferences>(
  userId: string,
  key: K,
  value: PrintingPreferences[K]
): Promise<void> => {
  try {
    const currentPrefs = await getPrintingPreferences(userId);
    const updatedPrefs = {
      ...currentPrefs,
      [key]: value
    };
    
    await savePrintingPreferences(userId, updatedPrefs);
  } catch (error) {
    console.error('Error updating printing setting:', error);
    throw error;
  }
};