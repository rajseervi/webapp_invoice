import { useState, useEffect } from 'react';

/**
 * User role type
 */
export type UserRole = 'admin' | 'manager' | 'user' | null;

/**
 * Hook to get the current user information from localStorage
 * This is a temporary solution until a proper auth system is implemented
 */
export function useCurrentUser() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== 'undefined') {
      // Try to get the user ID from localStorage
      const storedUser = localStorage.getItem('authUser');
      const storedRole = localStorage.getItem('userRole');
      
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          // Use uid for Firebase auth users, or fallback to email-based ID
          if (userData.uid) {
            setUserId(userData.uid);
          } else if (userData.email) {
            // Create a consistent ID from email
            setUserId(userData.email.replace(/[^a-zA-Z0-9]/g, '-'));
          } else {
            console.warn('No uid or email found in user data, using default');
            setUserId('default-user');
          }
        } catch (error) {
          console.error('Error parsing user data from localStorage:', error);
          setUserId('default-user');
        }
      } else {
        // If no user is found, use a default user ID
        console.warn('No user data found in localStorage, using default');
        setUserId('default-user');
      }
      
      // Set user role
      if (storedRole) {
        try {
          setUserRole(storedRole as UserRole);
        } catch (error) {
          console.error('Error parsing user role from localStorage:', error);
          setUserRole('user'); // Default to regular user
        }
      } else {
        // If no role is found, default to regular user
        setUserRole('user');
      }
      
      setLoading(false);
    }
  }, []);

  // Helper function to check if user is admin
  const isAdmin = (): boolean => userRole === 'admin';
  
  // Helper function to check if user is manager
  const isManager = (): boolean => userRole === 'manager';
  
  // Helper function to check if user can view all data (admin only)
  const canViewAllData = (): boolean => isAdmin();

  return { 
    userId, 
    userRole, 
    loading, 
    isAdmin, 
    isManager, 
    canViewAllData 
  };
}