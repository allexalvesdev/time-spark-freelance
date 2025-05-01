
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatform } from '@/hooks/use-platform';

const Index = () => {
  const { user } = useAuth();
  const { isNative } = usePlatform();
  
  // For mobile app, always navigate to auth (login) if not authenticated
  // or dashboard if authenticated
  if (isNative) {
    return user ? <Navigate to="/dashboard" /> : <Navigate to="/auth" />;
  }
  
  // Standard web behavior
  return user ? <Navigate to="/dashboard" /> : <Navigate to="/" />;
};

export default Index;
