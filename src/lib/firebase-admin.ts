import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
let adminApp;

try {
  // Check if admin app is already initialized
  if (getApps().length === 0) {
    // For development, we'll use a simplified approach
    // In production, you should use proper service account credentials
    if (process.env.NODE_ENV === 'development') {
      // Use the Firebase project ID for development
      adminApp = initializeApp({
        projectId: 'inventory-app-1a59d',
        // Note: In development, we'll bypass admin auth for simplicity
        // In production, you should use proper service account credentials
      });
    } else {
      // Production configuration with service account
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };

      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }
  } else {
    adminApp = getApps()[0];
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
  // Fallback initialization
  adminApp = initializeApp({
    projectId: 'inventory-app-1a59d',
  });
}

// Get Firestore and Auth instances
const adminDb = getFirestore(adminApp);
const adminAuth = getAuth(adminApp);

// Helper function to bypass security rules in development
export const getAdminDb = () => {
  if (process.env.NODE_ENV === 'development') {
    // In development, we'll use the regular client SDK but with relaxed rules
    // This is a temporary solution for development
    return adminDb;
  }
  return adminDb;
};

export { adminDb, adminAuth };
export default adminApp;