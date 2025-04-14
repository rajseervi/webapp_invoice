'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

type ProtectedClientRouteProps = {
  children: React.ReactNode;
  allowedRoles?: string[];
};

export default function ProtectedClientRoute({ 
  children, 
  allowedRoles 
}: ProtectedClientRouteProps) {
  const { currentUser, userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until auth state is determined
    if (loading) return;
    
    // If no user is logged in, redirect to login
    if (!currentUser) {
      router.push('/login');
      return;
    }

    // If roles are specified and user doesn't have permission
    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
      router.push('/unauthorized');
      return;
    }
  }, [currentUser, userRole, loading, router, allowedRoles]);

  // Show nothing while loading or redirecting
  if (loading || !currentUser || (allowedRoles && !allowedRoles.includes(userRole || ''))) {
    return null;
  }

  // If all checks pass, render the children
  return <>{children}</>;
}