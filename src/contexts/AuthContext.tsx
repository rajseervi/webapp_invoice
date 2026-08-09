'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { auth, db } from '@/firebase/config';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail,
  updatePassword,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, DocumentData } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  userRole: string | null;
  userStatus: string | null;
  subscriptionActive: boolean;
  subscriptionData: DocumentData | null;
  loading: boolean;
  login: (email, password) => Promise<string | null>;
  loginWithGoogle: () => Promise<string | null>;
  logout: (redirectUrl?: string) => Promise<string>;
  getUserRole: (uid: string) => Promise<string | undefined>;
  resetPassword: (email: string) => Promise<boolean>;
  hasPermission: (type: string, id: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  const hasPermission = (type: string, id: string) => {
    if (userRole === 'admin') {
      return true;
    }
    // Assuming permissions are stored in currentUser
    const permissions = (currentUser as any)?.permissions;
    if (type === 'page') {
      return permissions?.pages?.[id] === true;
    } else if (type === 'feature') {
      return permissions?.features?.[id] === true;
    }
    return false;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const role = userData?.role || 'user';
          const status = userData?.status || 'active';
          const subscription = userData?.subscription || { isActive: false };

          setCurrentUser(user);
          setUserRole(role);
          setUserStatus(status);
          setSubscriptionData(subscription);
          setSubscriptionActive(subscription.isActive && (!subscription.endDate || new Date(subscription.endDate) > new Date()));

          localStorage.setItem('authUser', JSON.stringify(user));
          localStorage.setItem('userRole', role);
          localStorage.setItem('userStatus', status);
          
          // Set cookies for middleware
          document.cookie = `session=${user.uid}; path=/; max-age=86400; SameSite=Lax`;
          document.cookie = `userRole=${role}; path=/; max-age=86400; SameSite=Lax`;
          document.cookie = `userStatus=${status}; path=/; max-age=86400; SameSite=Lax`;
        } else {
          // Handle case where user exists in auth but not in firestore
          setUserRole('user');
          setUserStatus('pending');
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setUserStatus(null);
        setSubscriptionActive(false);
        setSubscriptionData(null);
        localStorage.removeItem('authUser');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userStatus');
        
        // Clear cookies
        document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        document.cookie = 'userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        document.cookie = 'userStatus=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      throw new Error("User data not found in database.");
    }
    const userData = userDoc.data();
    if (userData.status !== 'active') {
      throw new Error("User account is not active.");
    }
    setUserRole(userData.role);
    setUserStatus(userData.status);
    
    // Set cookies immediately for middleware
    document.cookie = `session=${user.uid}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `userRole=${userData.role}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `userStatus=${userData.status}; path=/; max-age=86400; SameSite=Lax`;
    
    return userData.role;
  };

  const loginWithGoogle = async () => {
    await setPersistence(auth, browserLocalPersistence);
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      // Create new user
      const newUser = {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'user',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, newUser);
      throw new Error("Your account has been created and is pending approval.");
    }
    const userData = userDoc.data();
    if (userData.status !== 'active') {
      throw new Error("User account is not active.");
    }
    setUserRole(userData.role);
    setUserStatus(userData.status);
    
    // Set cookies immediately for middleware
    document.cookie = `session=${user.uid}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `userRole=${userData.role}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `userStatus=${userData.status}; path=/; max-age=86400; SameSite=Lax`;
    
    return userData.role;
  };

  const logout = async (redirectUrl = '/login') => {
    await signOut(auth);
    return redirectUrl;
  };

  const getUserRole = async (uid: string) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.data()?.role;
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
    return true;
  };

  const value: AuthContextType = {
    currentUser,
    userRole,
    userStatus,
    subscriptionActive,
    subscriptionData,
    loading,
    login,
    loginWithGoogle,
    logout,
    getUserRole,
    resetPassword,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;