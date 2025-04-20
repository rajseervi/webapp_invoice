import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail,
  updatePassword
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
  const context = useContext(AuthContext);
  
  // Add a helper function to check permissions
  const hasPermission = (type, id) => {
    // If user is admin, they have all permissions
    if (context.userRole === 'admin') {
      return true;
    }
    
    // Check if user has specific permission
    if (type === 'page') {
      return context.currentUser?.permissions?.pages?.[id] === true;
    } else if (type === 'feature') {
      return context.currentUser?.permissions?.features?.[id] === true;
    }
    
    return false;
  };
  
  return {
    ...context,
    hasPermission
  };
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
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
      let status = 'active';
      let subscription = { isActive: false, startDate: null, endDate: null, plan: null };
      let approvalStatus = { isApproved: true, approvedBy: null, approvedAt: null, notes: null };
      
      if (!userDoc.exists()) {
        // Create new user document with default role and pending status
        const userData = {
          email: userCredential.user.email,
          role: 'user',
          status: 'pending',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          loginMethod: 'email',
          loginCount: 1,
          approvalStatus: {
            isApproved: false,
            approvedBy: null,
            approvedAt: null,
            notes: null
          },
          subscription: {
            isActive: false,
            startDate: null,
            endDate: null,
            plan: null
          }
        };
        try {
          await setDoc(userDocRef, userData);
          status = 'pending';
          approvalStatus = userData.approvalStatus;
        } catch (docError) {
          console.error('Error creating user document:', docError);
          // Continue with login even if document creation fails
        }
      } else {
        const userData = userDoc.data();
        role = userData?.role || 'user';
        status = userData?.status || 'active';
        subscription = userData?.subscription || { isActive: false, startDate: null, endDate: null, plan: null };
        approvalStatus = userData?.approvalStatus || { isApproved: true, approvedBy: null, approvedAt: null, notes: null };
        
        // Check if user is approved
        if (status === 'pending' || (approvalStatus && !approvalStatus.isApproved)) {
          await signOut(auth);
          throw new Error('Your account is pending approval by an administrator.');
        }
        
        // Check if user is inactive
        if (status === 'inactive') {
          await signOut(auth);
          throw new Error('Your account has been deactivated. Please contact an administrator.');
        }
        
        // Check subscription status if it exists
        if (subscription && subscription.isActive && subscription.endDate) {
          const endDate = new Date(subscription.endDate);
          if (endDate < new Date()) {
            // Subscription has expired
            subscription.isActive = false;
            await setDoc(userDocRef, {
              subscription: {
                ...subscription,
                isActive: false
              }
            }, { merge: true });
            
            // If subscription is required, prevent login
            if (role !== 'admin') {
              await signOut(auth);
              throw new Error('Your subscription has expired. Please renew your subscription to continue.');
            }
          }
        }
        
        // Update login information
        try {
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
      let status = 'active';
      let subscription = { isActive: false, startDate: null, endDate: null, plan: null };
      let approvalStatus = { isApproved: true, approvedBy: null, approvedAt: null, notes: null };
      
      // If not, create a new user document with pending status
      if (!userDoc.exists()) {
        const userData = {
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          role: 'user',
          status: 'pending',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          loginMethod: 'google',
          loginCount: 1,
          approvalStatus: {
            isApproved: false,
            approvedBy: null,
            approvedAt: null,
            notes: null
          },
          subscription: {
            isActive: false,
            startDate: null,
            endDate: null,
            plan: null
          }
        };
        await setDoc(userDocRef, userData);
        status = 'pending';
        approvalStatus = userData.approvalStatus;
        
        // For new users with pending approval, sign out and throw error
        await signOut(auth);
        throw new Error('Your account has been created and is pending approval by an administrator.');
      } else {
        const userData = userDoc.data();
        role = userData?.role || 'user';
        status = userData?.status || 'active';
        subscription = userData?.subscription || { isActive: false, startDate: null, endDate: null, plan: null };
        approvalStatus = userData?.approvalStatus || { isApproved: true, approvedBy: null, approvedAt: null, notes: null };
        
        // Check if user is approved
        if (status === 'pending' || (approvalStatus && !approvalStatus.isApproved)) {
          await signOut(auth);
          throw new Error('Your account is pending approval by an administrator.');
        }
        
        // Check if user is inactive
        if (status === 'inactive') {
          await signOut(auth);
          throw new Error('Your account has been deactivated. Please contact an administrator.');
        }
        
        // Check subscription status if it exists
        if (subscription && subscription.isActive && subscription.endDate) {
          const endDate = new Date(subscription.endDate);
          if (endDate < new Date()) {
            // Subscription has expired
            subscription.isActive = false;
            await setDoc(userDocRef, {
              subscription: {
                ...subscription,
                isActive: false
              }
            }, { merge: true });
            
            // If subscription is required, prevent login
            if (role !== 'admin') {
              await signOut(auth);
              throw new Error('Your subscription has expired. Please renew your subscription to continue.');
            }
          }
        }
        
        // Update last login time
        await setDoc(userDocRef, {
          lastLogin: new Date().toISOString(),
          loginMethod: 'google',
          loginCount: (userData.loginCount || 0) + 1
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

  async function logout(redirectUrl = '/login') {
    try {
      // Clear all local storage items related to authentication
      localStorage.removeItem('loginAttempts');
      localStorage.removeItem('loginLockout');
      
      // Clear any application-specific state
      setCurrentUser(null);
      setUserRole(null);
      setUserStatus(null);
      setSubscriptionActive(false);
      setSubscriptionData(null);
      
      // Clear the session cookies via API
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include' // Include cookies in the request
        });
        
        if (!response.ok) {
          console.warn('Session cookie clearing may have failed:', await response.text());
        }
      } catch (cookieError) {
        console.warn('Error clearing session cookies:', cookieError);
        // Continue with logout even if cookie clearing fails
      }
      
      // Sign out from Firebase
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.warn('Firebase sign out error:', signOutError);
        // Continue with logout even if Firebase sign out fails
      }
      
      // Return the redirect URL for the calling component to use
      return redirectUrl;
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, try to clear as much as possible
      setCurrentUser(null);
      setUserRole(null);
      setUserStatus(null);
      setSubscriptionActive(false);
      setSubscriptionData(null);
      
      // Still return the redirect URL so the UI can navigate away
      return redirectUrl;
    }
  }

  async function getUserRole(uid) {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.data()?.role;
  }
  
  async function resetPassword(email) {
    if (!email) {
      throw new Error('Email is required');
    }
    
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      if (error.code === 'auth/user-not-found') {
        throw new Error('No user found with this email');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email format');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many requests. Please try again later');
      } else {
        throw new Error('An error occurred during password reset');
      }
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get the user document
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Set user role
            const role = userData?.role || 'user';
            setUserRole(role);
            
            // Set user status
            const status = userData?.status || 'active';
            setUserStatus(status);
            
            // Set subscription data
            const subscription = userData?.subscription || { isActive: false, startDate: null, endDate: null, plan: null };
            setSubscriptionData(subscription);
            
            // Check if subscription is active
            let isSubscriptionActive = subscription.isActive;
            if (isSubscriptionActive && subscription.endDate) {
              const endDate = new Date(subscription.endDate);
              if (endDate < new Date()) {
                isSubscriptionActive = false;
                // Update subscription status in Firestore
                await setDoc(userDocRef, {
                  subscription: {
                    ...subscription,
                    isActive: false
                  }
                }, { merge: true });
              }
            }
            setSubscriptionActive(isSubscriptionActive);
            
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
                status: status,
                subscriptionActive: isSubscriptionActive,
                expiresIn: 60 * 60 * 24 * 5 // 5 days
              }),
            });
            
            if (!response.ok) {
              console.error('Failed to set session cookie on auth state change:', await response.text());
            }
          } else {
            // If user document doesn't exist, set default values
            setUserRole('user');
            setUserStatus('pending');
            setSubscriptionActive(false);
            setSubscriptionData({ isActive: false, startDate: null, endDate: null, plan: null });
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          // Set default values in case of error
          setUserRole('user');
          setUserStatus('active');
          setSubscriptionActive(false);
          setSubscriptionData(null);
        }
      } else {
        // Reset all state variables on logout
        setUserRole(null);
        setUserStatus(null);
        setSubscriptionActive(false);
        setSubscriptionData(null);
        
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
    userStatus,
    subscriptionActive,
    subscriptionData,
    login,
    loginWithGoogle,
    logout,
    getUserRole,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Export the AuthProvider as default for compatibility with imports
export default AuthProvider;