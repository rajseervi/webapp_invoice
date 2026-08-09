// Script to create an admin user directly in Firebase
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');

// Your Firebase config from src/firebase/config.js
const firebaseConfig = {
  apiKey: "AIzaSyC3L0RThSlzlevakOmpOyf66_bZJ-Pkrco",
  authDomain: "anutecdmindia.firebaseapp.com",
  projectId: "anutecdmindia",
  storageBucket: "anutecdmindia.firebasestorage.app",
  messagingSenderId: "490380975464",
  appId: "1:490380975464:web:405bd931a3d63876828add"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin user details - CHANGE THESE VALUES
const adminEmail = "admin@master.com";
const adminPassword = "Master@123";
const adminFirstName = "Admin";
const adminLastName = "Mas";

async function createAdminUser() {
  try {
    console.log(`Creating admin user with email: ${adminEmail}`);
    
    // Create user with Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      adminEmail,
      adminPassword
    );
    
    const userId = userCredential.user.uid;
    console.log(`User created with ID: ${userId}`);
    
    // Create user document in Firestore with admin role and active status
    await setDoc(doc(db, 'users', userId), {
      firstName: adminFirstName,
      lastName: adminLastName,
      name: `${adminFirstName} ${adminLastName}`,
      email: adminEmail,
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      approvalStatus: {
        isApproved: true,
        approvedBy: 'system',
        approvedAt: new Date().toISOString(),
        notes: 'Initial admin user'
      },
      subscription: {
        isActive: true,
        startDate: new Date().toISOString(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        plan: 'admin'
      }
    });
    
    console.log('Admin user created successfully!');
    console.log('You can now log in with these credentials.');
  } catch (error) {
    console.error('Error creating admin user:', error);
    if (error.code === 'auth/email-already-in-use') {
      console.log('An account with this email already exists. Try a different email or use the Firebase console to update an existing user to admin role.');
    }
  }
}

createAdminUser();