
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatform } from '@/hooks/use-platform';

const Index = () => {
  const { user } = useAuth();
  const { isNative } = usePlatform();
  
  // Para aplicativos móveis, sempre redirecionar para autenticação (login) se não estiver autenticado
  // ou para dashboard se estiver autenticado
  if (isNative) {
    return <Navigate to={user ? "/dashboard" : "/auth"} />;
  }
  
  // Comportamento web padrão - mantém landing page para web
  return user ? <Navigate to="/dashboard" /> : <Navigate to="/" />;
};

export default Index;
