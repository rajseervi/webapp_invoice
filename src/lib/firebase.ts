import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBE0uxsvAU3sl4v7uYYkI0Hrld2TIMknv0",
  authDomain: "einvoicegen.firebaseapp.com",
  projectId: "einvoicegen",
  storageBucket: "einvoicegen.firebasestorage.app",
  messagingSenderId: "432088259",
  appId: "1:432088259:web:8671dbceba243c69916e76"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);