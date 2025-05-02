
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export type PlanType = 'basic' | 'pro' | 'enterprise';

interface PlanLimits {
  maxProjects: number;
}

interface PlanContextType {
  currentPlan: PlanType;
  planLimits: PlanLimits;
  isTrialActive: boolean;
  isAccountBlocked: boolean;
  trialEndsAt: Date | null;
  canCreateProject: (currentProjectCount: number) => boolean;
  upgradePlan: (newPlan: PlanType) => Promise<void>;
  loadUserPlan: () => Promise<void>;
  daysLeftInTrial: number;
}

const planLimitsMap: Record<PlanType, PlanLimits> = {
  basic: { maxProjects: 5 },
  pro: { maxProjects: 10 },
  enterprise: { maxProjects: Infinity },
};

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPlan, setCurrentPlan] = useState<PlanType>('basic');
  const [planLimits, setPlanLimits] = useState<PlanLimits>(planLimitsMap.basic);
  const [isTrialActive, setIsTrialActive] = useState<boolean>(false);
  const [isAccountBlocked, setIsAccountBlocked] = useState<boolean>(false);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [daysLeftInTrial, setDaysLeftInTrial] = useState<number>(0);

  useEffect(() => {
    if (user) {
      loadUserPlan();
    }
  }, [user]);

  // Calculate days left in trial whenever trialEndsAt changes
  useEffect(() => {
    if (trialEndsAt) {
      const now = new Date();
      const diffTime = trialEndsAt.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysLeftInTrial(Math.max(0, diffDays));
    } else {
      setDaysLeftInTrial(0);
    }
  }, [trialEndsAt]);

  const loadUserPlan = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_plan, pending_plan, is_trial, trial_end_date, is_blocked')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      // Set plan type and limits
      const plan = (profile?.user_plan || 'basic') as PlanType;
      setCurrentPlan(plan);
      setPlanLimits(planLimitsMap[plan]);
      
      // Set trial status
      setIsTrialActive(profile?.is_trial || false);
      setTrialEndsAt(profile?.trial_end_date ? new Date(profile.trial_end_date) : null);
      
      // Set blocked status
      setIsAccountBlocked(profile?.is_blocked || false);
      
      // Limpar o pending_plan caso exista
      if (profile?.pending_plan) {
        await supabase
          .from('profiles')
          .update({ pending_plan: null })
          .eq('id', user?.id);
      }
    } catch (error) {
      console.error('Error loading user plan:', error);
      // Fallback to basic plan if there's an error
      setCurrentPlan('basic');
      setPlanLimits(planLimitsMap.basic);
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
    <PlanContext.Provider value={{ 
      currentPlan, 
      planLimits, 
      isTrialActive, 
      isAccountBlocked, 
      trialEndsAt,
      daysLeftInTrial, 
      canCreateProject, 
      upgradePlan, 
      loadUserPlan 
    }}>
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
