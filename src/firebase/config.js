import { getApps, initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBE0uxsvAU3sl4v7uYYkI0Hrld2TIMknv0",
  authDomain: "einvoicegen.firebaseapp.com",
  projectId: "einvoicegen",
  storageBucket: "einvoicegen.firebasestorage.app",
  messagingSenderId: "432088259",
  appId: "1:432088259:web:8671dbceba243c69916e76"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore and Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

// Enable offline persistence for Firestore with better error handling
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db, { synchronizeTabs: true })
    .then(() => {
      console.log('Offline persistence enabled successfully');
    })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser does not support persistence.');
      } else {
        console.error('Error enabling offline persistence:', err);
      }
    });
}