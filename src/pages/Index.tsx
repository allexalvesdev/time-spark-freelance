import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatform } from '@/hooks/use-platform';

const Index = () => {
  const { user } = useAuth();
  const { isNative } = usePlatform();
  
  // If in native app, always redirect to the dashboard if authenticated
  // Otherwise, for web, redirect to the landing page
  if (isNative) {
    return user ? <Navigate to="/dashboard" /> : <Navigate to="/auth" />;
  }
  
  // Standard web behavior
  return user ? <Navigate to="/dashboard" /> : <Navigate to="/" />;
};

export default Index;
