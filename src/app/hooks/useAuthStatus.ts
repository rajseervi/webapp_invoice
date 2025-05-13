import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { safelyParseJson } from '@/utils/apiHelpers';

export function useAuthStatus() {
  const { currentUser } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuthStatus() {
      try {
        setIsLoading(true);
        
        // First check if we have a currentUser from Firebase
        if (currentUser) {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
        
        // If not, verify with the server if we have a valid session
        const response = await fetch('/api/auth/verify');
        const data = await safelyParseJson(response, 'Auth verification error:');
        
        if (data) {
          setIsAuthenticated(data.authenticated);
        } else {
          setIsAuthenticated(false);
          setError('Authentication service unavailable');
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        setError('Failed to verify authentication status');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAuthStatus();
  }, [currentUser]);

  return { isAuthenticated, isLoading, error };
}