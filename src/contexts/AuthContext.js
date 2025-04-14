import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Helper function to handle API responses
async function handleApiResponse(response, errorMessage) {
  if (!response.ok) {
    const responseText = await response.text();
    // Check if the response is HTML (likely an error page)
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      console.error('Received HTML response instead of JSON. Server might be returning an error page.');
      console.error('Response text (first 200 chars):', responseText.substring(0, 200) + '...');
    } else {
      console.error(errorMessage, responseText);
    }
    return false;
  }
  return true;
}

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  async function login(email, password) {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Set persistence to LOCAL to persist the user's session
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (!userCredential.user) {
        throw new Error('No user data received after authentication');
      }

      // Get the ID token
      const idToken = await userCredential.user.getIdToken();

      // Get or create user document
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      let role = 'user';
      if (!userDoc.exists()) {
        // Create new user document with default role
        const userData = {
          email: userCredential.user.email,
          role: 'user',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          loginMethod: 'email',
          loginCount: 1
        };
        try {
          await setDoc(userDocRef, userData);
        } catch (docError) {
          console.error('Error creating user document:', docError);
          // Continue with login even if document creation fails
        }
      } else {
        role = userDoc.data()?.role || 'user';
        // Update login information
        try {
          const userData = userDoc.data();
          await setDoc(userDocRef, {
            lastLogin: new Date().toISOString(),
            loginMethod: 'email',
            loginCount: (userData.loginCount || 0) + 1
          }, { merge: true });
        } catch (updateError) {
          console.error('Error updating login stats:', updateError);
          // Continue with login even if update fails
        }
      }
      
      // Set the session cookie via API
      try {
        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: idToken,
            role: role,
            expiresIn: 60 * 60 * 24 * 5 // 5 days
          }),
        });
        
        if (!response.ok) {
          console.error('Failed to set session cookie:', await response.text());
        }
      } catch (cookieError) {
        console.error('Error setting session cookie:', cookieError);
        // Continue with login even if cookie setting fails
      }
      
      // Update current user and role states
      setCurrentUser(userCredential.user);
      setUserRole(role);
      return role;
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found') {
        throw new Error('No user found with this email');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Invalid password');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email format');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many login attempts. Please try again later');
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('This account has been disabled. Please contact support.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('An error occurred during login');
      }
    }
  }
  
  async function loginWithGoogle() {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      // Add scopes for additional profile information
      provider.addScope('profile');
      provider.addScope('email');
      
      const userCredential = await signInWithPopup(auth, provider);
      
      // Get the ID token
      const idToken = await userCredential.user.getIdToken();
      
      // Check if user exists in Firestore
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      let role = 'user';
      
      // If not, create a new user document
      if (!userDoc.exists()) {
        const userData = {
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          role: 'user',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          loginMethod: 'google',
          loginCount: 1
        };
        await setDoc(userDocRef, userData);
      } else {
        role = userDoc.data()?.role || 'user';
        // Update last login time
        await setDoc(userDocRef, {
          lastLogin: new Date().toISOString(),
          loginMethod: 'google',
          loginCount: (userDoc.data().loginCount || 0) + 1
        }, { merge: true });
      }
      
      // Set the session cookie via API
      try {
        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: idToken,
            role: role,
            expiresIn: 60 * 60 * 24 * 5 // 5 days
          }),
        });
        
        if (!response.ok) {
          console.error('Failed to set session cookie:', await response.text());
        }
      } catch (cookieError) {
        console.error('Error setting session cookie:', cookieError);
        // Continue with login even if cookie setting fails
      }
      
      // Update current user and role states
      setCurrentUser(userCredential.user);
      setUserRole(role);
      
      return role;
    } catch (error) {
      console.error('Google login error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Login canceled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Login popup was blocked. Please allow popups for this site.');
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('An error occurred during Google login');
      }
    }
  }

  async function logout() {
    try {
      // Clear the session cookie via API
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Clear local state
      setCurrentUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Failed to log out');
    }
  }

  async function getUserRole(uid) {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.data()?.role;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get the user's role
          const role = await getUserRole(user.uid);
          setUserRole(role);
          
          // Get the ID token
          const idToken = await user.getIdToken();
          
          // Set the session cookie via API
          const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: idToken,
              role: role,
              expiresIn: 60 * 60 * 24 * 5 // 5 days
            }),
          });
          
          if (!response.ok) {
            console.error('Failed to set session cookie on auth state change:', await response.text());
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
        }
      } else {
        setUserRole(null);
        // Clear the session cookie on logout
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
          });
        } catch (error) {
          console.error('Error clearing session cookie:', error);
        }
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    login,
    loginWithGoogle,
    logout,
    getUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}