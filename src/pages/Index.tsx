import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();
  
  // If user is authenticated, redirect to dashboard
  // Otherwise, redirect to the landing page
  return user ? <Navigate to="/dashboard" /> : <Navigate to="/" />;
};

export default Index;
