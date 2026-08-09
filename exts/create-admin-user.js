const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = {
  // You'll need to get these from your Firebase project settings
  // Go to Project Settings > Service Accounts > Generate new private key
  "type": "service_account",
  "project_id": "inventory-app-1a59d",
  // Add your service account key details here
};

// For now, let's use a simpler approach with the regular Firebase SDK
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, connectFirestoreEmulator } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
   apiKey: "AIzaSyC3L0RThSlzlevakOmpOyf66_bZJ-Pkrco",
  authDomain: "anutecdmindia.firebaseapp.com",
  projectId: "anutecdmindia",
  storageBucket: "anutecdmindia.firebasestorage.app",
  messagingSenderId: "490380975464",
  appId: "1:490380975464:web:405bd931a3d63876828add"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function createAdminUser() {
  try {
    console.log('🚀 Creating admin user...');
    
    // First, let's try to sign in with existing credentials
    console.log('Please provide your login credentials:');
    
    // For security, we'll create a default admin user document
    // You can modify this with your actual user ID
    const adminUserId = 'admin-user-default'; // Change this to your actual Firebase Auth UID
    
    const adminUserData = {
      email: 'admin@example.com', // Change this to your actual email
      displayName: 'Admin User',
      role: 'admin',
      status: 'active',
      isActive: true,
      createdAt: new Date().toISOString(),
      permissions: {
        pages: {
          dashboard: true,
          invoices: true,
          products: true,
          parties: true,
          reports: true,
          settings: true
        },
        features: {
          create: true,
          edit: true,
          delete: true,
          export: true,
          import: true
        }
      }
    };
    
    // This will fail due to security rules, but let's try anyway
    await setDoc(doc(db, 'users', adminUserId), adminUserData);
    
    console.log('✅ Admin user created successfully!');
    console.log('📝 User ID:', adminUserId);
    console.log('📧 Email:', adminUserData.email);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 SOLUTION: Since we can\'t create the user due to security rules,');
      console.log('   please follow these steps:');
      console.log('\n1. 📱 Open your app in the browser');
      console.log('2. 🔐 Log in with your existing account');
      console.log('3. 🛠️ Open browser console (F12)');
      console.log('4. 📋 Copy and paste the browser-console-fix.js script');
      console.log('5. ▶️ Press Enter to run it');
      console.log('6. 🔄 Refresh the page');
      console.log('\nAlternatively, you can use the AuthDebugger component that was added to your dashboard.');
    }
  }
}

createAdminUser();