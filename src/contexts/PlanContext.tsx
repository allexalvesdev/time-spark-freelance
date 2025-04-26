
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type PlanType = 'free' | 'pro' | 'enterprise';

interface PlanLimits {
  maxProjects: number;
}

interface PlanContextType {
  currentPlan: PlanType;
  planLimits: PlanLimits;
  canCreateProject: (currentProjectCount: number) => boolean;
  upgradePlan: (newPlan: PlanType) => void;
}

const planLimitsMap: Record<PlanType, PlanLimits> = {
  free: { maxProjects: 1 },
  pro: { maxProjects: 10 },
  enterprise: { maxProjects: Infinity },
};

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPlan, setCurrentPlan] = useState<PlanType>('free');
  const [planLimits, setPlanLimits] = useState<PlanLimits>(planLimitsMap.free);

  useEffect(() => {
    if (user) {
      // Aqui você pode carregar o plano do usuário do banco de dados
      // Por enquanto, vamos assumir que todos começam no plano gratuito
      setCurrentPlan('free');
      setPlanLimits(planLimitsMap.free);
    }
  }, [user]);

  const canCreateProject = (currentProjectCount: number): boolean => {
    return currentProjectCount < planLimits.maxProjects;
  };

  const upgradePlan = (newPlan: PlanType) => {
    // Aqui você implementaria a lógica para atualizar o plano no banco de dados
    setCurrentPlan(newPlan);
    setPlanLimits(planLimitsMap[newPlan]);
    toast({
      title: 'Plano atualizado',
      description: `Seu plano foi atualizado para ${newPlan.toUpperCase()}.`,
    });
  };

  return (
    <PlanContext.Provider value={{ currentPlan, planLimits, canCreateProject, upgradePlan }}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = (): PlanContextType => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan deve ser usado dentro de um PlanProvider');
  }
  return context;
};
