import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBE0uxsvAU3sl4v7uYYkI0Hrld2TIMknv0",
  authDomain: "einvoicegen.firebaseapp.com",
  projectId: "einvoicegen",
  storageBucket: "einvoicegen.firebasestorage.app",
  messagingSenderId: "432088259",
  appId: "1:432088259:web:8671dbceba243c69916e76"
};

const app = initializeApp(firebaseConfig);
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