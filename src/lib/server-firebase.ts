import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Server-side Firebase configuration
const firebaseConfig = {
apiKey: "AIzaSyDSu1ErMkJneofYcnDZsewCOI076YPtaaQ",
authDomain: "hanuman-marketing-kothur.firebaseapp.com",
projectId: "hanuman-marketing-kothur",
 storageBucket: "hanuman-marketing-kothur.firebasestorage.app",
 messagingSenderId: "979647959745",
 appId: "1:979647959745:web:64960d0af04bcc2e95ba40"
};

// Initialize Firebase app for server-side use
let serverApp;
let serverDb;

try {
  // Check if app is already initialized
  const existingApps = getApps();
  if (existingApps.length === 0) {
    serverApp = initializeApp(firebaseConfig, 'server-app');
  } else {
    serverApp = existingApps.find(app => app.name === 'server-app') || existingApps[0];
  }

  serverDb = getFirestore(serverApp);

  // Connect to emulator in development if needed
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    try {
      connectFirestoreEmulator(serverDb, 'localhost', 8080);
      console.log('Server Firebase connected to emulator');
    } catch (error) {
      // Emulator might already be connected
      console.log('Server Firebase emulator connection skipped (already connected)');
    }
  }
} catch (error) {
  console.error('Failed to initialize server Firebase:', error);
  // Fallback to default app
  if (getApps().length > 0) {
    serverApp = getApps()[0];
    serverDb = getFirestore(serverApp);
  }
}

export { serverDb };
export default serverApp;