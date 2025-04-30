
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export type PlanType = 'free' | 'pro' | 'enterprise';

interface PlanLimits {
  maxProjects: number;
}

interface PlanContextType {
  currentPlan: PlanType;
  planLimits: PlanLimits;
  canCreateProject: (currentProjectCount: number) => boolean;
  upgradePlan: (newPlan: PlanType) => Promise<void>;
  loadUserPlan: () => Promise<void>;
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
      loadUserPlan();
    }
  }, [user]);

  const loadUserPlan = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_plan, pending_plan')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      const plan = (profile?.user_plan || 'free') as PlanType;
      setCurrentPlan(plan);
      setPlanLimits(planLimitsMap[plan]);
      
      // Limpar o pending_plan caso exista
      if (profile?.pending_plan) {
        await supabase
          .from('profiles')
          .update({ pending_plan: null })
          .eq('id', user?.id);
      }
    } catch (error) {
      console.error('Error loading user plan:', error);
      // Fallback to free plan if there's an error
      setCurrentPlan('free');
      setPlanLimits(planLimitsMap.free);
    }
  };

  const canCreateProject = (currentProjectCount: number): boolean => {
    return currentProjectCount < planLimits.maxProjects;
  };

  const upgradePlan = async (newPlan: PlanType) => {
    try {
      // Apenas registramos o pending_plan, mas não alteramos o plano atual
      // O plano será alterado somente após confirmação do pagamento
      const { error } = await supabase
        .from('profiles')
        .update({ pending_plan: newPlan })
        .eq('id', user?.id);

      if (error) throw error;
      
      toast({
        title: 'Solicitação de atualização registrada',
        description: `Aguardando confirmação do pagamento para o plano ${newPlan.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Error updating pending plan:', error);
      toast({
        title: 'Erro ao registrar solicitação',
        description: 'Não foi possível registrar sua solicitação de atualização. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <PlanContext.Provider value={{ currentPlan, planLimits, canCreateProject, upgradePlan, loadUserPlan }}>
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
