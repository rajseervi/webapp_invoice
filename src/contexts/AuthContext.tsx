"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define user type
interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Define auth context type
interface AuthContextType {
  currentUser: User | null;
  userRole: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  hasPermission: (type: string, permission: string) => boolean;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Create auth provider
export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data
      const mockUser: User = {
        uid: '123456',
        email: email,
        displayName: 'Demo User',
        photoURL: null,
      };
      
      setCurrentUser(mockUser);
      setUserRole('admin');
      
      // Save to localStorage for persistence
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('userRole', 'admin');
      
      setLoading(false);
    } catch (err) {
      setError('Failed to login. Please check your credentials.');
      setLoading(false);
      throw err;
    }
  };
  
  // Mock logout function
  const logout = async () => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCurrentUser(null);
      setUserRole(null);
      
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      
      setLoading(false);
    } catch (err) {
      setError('Failed to logout.');
      setLoading(false);
      throw err;
    }
  };
  
  // Mock signup function
  const signup = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock user data
      const mockUser: User = {
        uid: '123456',
        email: email,
        displayName: displayName,
        photoURL: null,
      };
      
      setCurrentUser(mockUser);
      setUserRole('user');
      
      // Save to localStorage for persistence
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('userRole', 'user');
      
      setLoading(false);
    } catch (err) {
      setError('Failed to create account.');
      setLoading(false);
      throw err;
    }
  };
  
  // Mock reset password function
  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLoading(false);
    } catch (err) {
      setError('Failed to reset password.');
      setLoading(false);
      throw err;
    }
  };
  
  // Mock update profile function
  const updateProfile = async (data: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          ...data,
        };
        
        setCurrentUser(updatedUser);
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      setLoading(false);
    } catch (err) {
      setError('Failed to update profile.');
      setLoading(false);
      throw err;
    }
  };
  
  // Mock permission check
  const hasPermission = (type: string, permission: string) => {
    // For demo purposes, admin has all permissions
    if (userRole === 'admin') {
      return true;
    }
    
    // For demo purposes, users have limited permissions
    if (userRole === 'user') {
      const userPermissions = [
        'invoices',
        'products',
        'categories',
      ];
      
      return userPermissions.includes(permission);
    }
    
    return false;
  };
  
  // Load user from localStorage on initial render
  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser = localStorage.getItem('user');
        const savedUserRole = localStorage.getItem('userRole');
        
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser));
        }
        
        if (savedUserRole) {
          setUserRole(savedUserRole);
        }
      } catch (err) {
        console.error('Failed to load user from localStorage:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);
  
  const value = {
    currentUser,
    userRole,
    loading,
    error,
    login,
    logout,
    signup,
    resetPassword,
    updateProfile,
    hasPermission,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}