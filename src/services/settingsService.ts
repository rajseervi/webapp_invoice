import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { CompanyInfo, UserPreferences, StatisticsSettings } from '@/types/company';

/**
 * Get company information from Firestore
 * @returns Promise with company information
 */
export const getCompanyInfo = async (): Promise<CompanyInfo | null> => {
  try {
    const companyDocRef = doc(db, 'settings', 'company');
    const companyDoc = await getDoc(companyDocRef);
    
    if (companyDoc.exists()) {
      return companyDoc.data() as CompanyInfo;
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
        updatedAt: now
      });
    } else {
      // Create new document
      await setDoc(companyDocRef, {
        ...companyInfo,
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
      return userPrefDoc.data() as UserPreferences;
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