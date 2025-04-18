import { collection, getDocs, query, limit, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Ensures that the quickLinks collection exists and has at least one document
 */
export const ensureQuickLinksCollection = async (): Promise<void> => {
  try {
    // Check if the collection has any documents
    const quickLinksRef = collection(db, 'quickLinks');
    const q = query(quickLinksRef, limit(1));
    const snapshot = await getDocs(q);
    
    // If no documents exist, add a sample quick link
    if (snapshot.empty) {
      console.log('Initializing quickLinks collection with a sample document');
      await addDoc(quickLinksRef, {
        title: 'Mastermind Dashboard',
        url: 'https://mastermind-dashboard.com',
        category: 'Dashboard',
        order: 1,
        createdAt: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error ensuring quickLinks collection:', error);
  }
};

/**
 * Initialize all required collections
 */
export const initializeCollections = async (): Promise<void> => {
  await ensureQuickLinksCollection();
  // Add other collection initializations here as needed
};