import { getApps, initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
 apiKey: "AIzaSyC3L0RThSlzlevakOmpOyf66_bZJ-Pkrco",
  authDomain: "anutecdmindia.firebaseapp.com",
  projectId: "anutecdmindia",
  storageBucket: "anutecdmindia.firebasestorage.app",
  messagingSenderId: "490380975464",
  appId: "1:490380975464:web:405bd931a3d63876828add"
};

// Reuse existing app instance if already initialized by firebase/config.ts
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Connect to emulators in development environment
if (process.env.NODE_ENV === 'development') {
  try {
    // Use emulators if available
    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectAuthEmulator(auth, 'http://localhost:9099');
      console.log('Connected to Firebase emulators');
    }
  } catch (error) {
    console.error('Failed to connect to Firebase emulators:', error);
  }
}

export { db, auth };
