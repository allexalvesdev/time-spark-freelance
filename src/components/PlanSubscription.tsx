
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, ExternalLink, AlertCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SubscriptionStatus {
  user_plan: string;
  status: 'active' | 'no_subscription' | 'trial';
  pending_plan: string | null;
  is_trial: boolean;
  trial_end_date: string | null;
  is_blocked: boolean;
  subscription?: {
    id: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
  };
  error?: string;
}

const PlanSubscription = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentPlan, loadUserPlan, isTrialActive, trialEndsAt, daysLeftInTrial } = usePlan();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
      checkPendingPlan();
    }
    
    // Verificar parâmetros de URL para sucesso/falha no pagamento
    const url = new URL(window.location.href);
    const paymentStatus = url.searchParams.get('payment');
    const planFromUrl = url.searchParams.get('plan');
    
    if (paymentStatus === 'success') {
      toast({
        title: 'Pagamento confirmado',
        description: 'Sua assinatura foi atualizada com sucesso.',
      });
      setTimeout(() => {
        loadUserPlan();
        checkSubscriptionStatus();
      }, 2000);
    } else if (paymentStatus === 'canceled' && planFromUrl) {
      toast({
        title: 'Pagamento cancelado',
        description: 'Você pode tentar novamente a qualquer momento.',
        variant: 'destructive',
      });
      // Limpar o pending_plan quando o pagamento for cancelado
      clearPendingPlan();
    }
    
    // Limpar URL
    if (paymentStatus) {
      url.searchParams.delete('payment');
      url.searchParams.delete('plan');
      window.history.replaceState({}, '', url.toString());
    }
  }, [user]);

  const checkPendingPlan = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('pending_plan')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data && data.pending_plan) {
        setPendingPlan(data.pending_plan);
      } else {
        setPendingPlan(null);
      }
    } catch (error) {
      console.error('Erro ao verificar plano pendente:', error);
    }
  };

  const clearPendingPlan = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ pending_plan: null })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setPendingPlan(null);
    } catch (error) {
      console.error('Erro ao limpar plano pendente:', error);
    }
  };
  
  const checkSubscriptionStatus = async () => {
    if (!user) return;
    
    try {
      setErrorMessage(null);
      setCheckingStatus(true);
      
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Erro ao verificar status da assinatura:', error);
        setErrorMessage(`Erro ao verificar status da assinatura: ${error.message || 'Erro desconhecido'}`);
        return;
      }
      
      setSubscriptionStatus(data);
      
      // Recarregar o plano do usuário do contexto se necessário
      if (data.user_plan !== currentPlan) {
        loadUserPlan();
      }

      await checkPendingPlan();
    } catch (error) {
      console.error('Erro ao verificar status da assinatura:', error);
      setErrorMessage('Não foi possível verificar o status da sua assinatura. Tente novamente.');
      toast({
        title: 'Erro',
        description: 'Não foi possível verificar o status da sua assinatura.',
        variant: 'destructive',
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSubscribe = async (plan: string) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan },
      });
      
      if (error) {
        console.error('Erro ao criar sessão de checkout:', error);
        setErrorMessage(`Erro ao criar sessão de checkout: ${error.message || 'Erro desconhecido'}`);
        throw error;
      }
      
      if (!data?.sessionUrl) {
        throw new Error('URL de checkout não retornada');
      }
      
      // Redirecionar para o Stripe Checkout
      window.location.href = data.sessionUrl;
    } catch (error) {
      console.error('Erro ao criar sessão de checkout:', error);
      setErrorMessage('Não foi possível iniciar o processo de assinatura. Tente novamente.');
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar o processo de assinatura. Tente novamente.',
        variant: 'destructive',
      });
      setLoading(false);
      await clearPendingPlan();
    }
  };
  
  const openCustomerPortal = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        console.error('Erro ao abrir portal do cliente:', error);
        setErrorMessage(`Erro ao abrir portal do cliente: ${error.message || 'Erro desconhecido'}`);
        throw error;
      }
      
      if (!data?.url) {
        throw new Error('URL do portal não retornada');
      }
      
      // Se houver uma mensagem de aviso, mostrar antes de redirecionar
      if (data.message) {
        toast({
          title: 'Aviso',
          description: data.message,
        });
        // Dar tempo para o usuário ler a mensagem
        setTimeout(() => {
          window.location.href = data.url;
        }, 2000);
      } else {
        // Redirecionar para o portal do cliente Stripe
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Erro ao abrir portal do cliente:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível abrir o portal de gerenciamento da assinatura. Tente novamente.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const isPlanActive = (planName: string) => {
    return currentPlan === planName;
  };
  
  const isPlanPending = (planName: string) => {
    return pendingPlan === planName;
  };

  // Renderizar características do plano Básico
  const renderBasicPlanFeatures = () => (
    <>
      <li className="flex items-center gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span>Até 5 projetos</span>
      </li>
      <li className="flex items-center gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span>Controle de tempo</span>
      </li>
      <li className="flex items-center gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span>Relatórios simples</span>
      </li>
    </>
  );

  // Renderizar características do plano Pro
  const renderProPlanFeatures = () => (
    <>
      <li className="flex items-center gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span>Até 10 projetos</span>
      </li>
      <li className="flex items-center gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span>Relatórios avançados</span>
      </li>
      <li className="flex items-center gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span>Importação de dados</span>
      </li>
      <li className="flex items-center gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span>Suporte prioritário</span>
      </li>
      <li className="flex items-center gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span>Exportação de dados</span>
      </li>
    </>
  );

  // Renderizar características do plano Enterprise
  const renderEnterprisePlanFeatures = () => (
    <>
      <li className="flex items-center gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span>Projetos ilimitados</span>
      </li>
      <li className="flex items-center gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span>API personalizada</span>
      </li>
      <li className="flex items-center gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span>Importação de dados</span>
      </li>
      <li className="flex items-center gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span>Suporte 24/7</span>
      </li>
      <li className="flex items-center gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span>Gerenciamento de equipe</span>
      </li>
      <li className="flex items-center gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span>Customização total</span>
      </li>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold">Planos de assinatura</h2>
          <p className="text-muted-foreground">
            Escolha o plano que melhor se adapta às suas necessidades
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {subscriptionStatus?.status === 'active' && (
            <Button 
              variant="outline" 
              onClick={openCustomerPortal}
              disabled={loading || checkingStatus}
              className="flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              Gerenciar assinatura
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            onClick={checkSubscriptionStatus}
            disabled={checkingStatus}
          >
            {checkingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar status"}
          </Button>
        </div>
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {isTrialActive && trialEndsAt && (
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium">
            <Clock className="h-5 w-5" />
            <span>
              {daysLeftInTrial > 0 
                ? `Você está no período de teste. Restam ${daysLeftInTrial} dia${daysLeftInTrial !== 1 ? 's' : ''}.`
                : 'Seu período de teste termina hoje. Escolha um plano para continuar usando o sistema.'}
            </span>
          </div>
        </div>
      )}

      {subscriptionStatus?.status === 'active' && subscriptionStatus.subscription && (
        <div className="bg-muted p-4 rounded-lg mb-6">
          <p className="font-medium">
            Sua assinatura está ativa até {formatDate(subscriptionStatus.subscription.current_period_end)}
            {subscriptionStatus.subscription.cancel_at_period_end && " (não será renovada)"}
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Plano Básico */}
        <Card className={`${isPlanActive('basic') ? 'border-primary' : ''} h-full flex flex-col`}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Básico</CardTitle>
              {isPlanActive('basic') && <Badge>Atual</Badge>}
            </div>
            <CardDescription>Para uso pessoal</CardDescription>
            <div className="mt-2">
              <span className="text-3xl font-bold">R$ 19,90</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-2 mb-6">
              {renderBasicPlanFeatures()}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              variant={isPlanActive('basic') ? 'outline' : 'default'}
              disabled={isPlanActive('basic') || loading}
              onClick={() => handleSubscribe('basic')}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isPlanActive('basic') ? 'Plano atual' : 'Assinar'}
            </Button>
          </CardFooter>
        </Card>

        {/* Plano Pro */}
        <Card className={`${isPlanActive('pro') ? 'border-primary' : ''} h-full flex flex-col relative`}>
          {isPlanPending('pro') && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-white text-xs uppercase font-bold py-1 px-3 rounded-full">
              Pagamento Pendente
            </div>
          )}
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Profissional</CardTitle>
              {isPlanActive('pro') && <Badge>Atual</Badge>}
            </div>
            <CardDescription>Para profissionais e freelancers</CardDescription>
            <div className="mt-2">
              <span className="text-3xl font-bold">R$ 29,90</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-2 mb-6">
              {renderProPlanFeatures()}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              disabled={isPlanActive('pro') || loading || isPlanPending('pro')}
              onClick={() => handleSubscribe('pro')}
            >
              {loading ? 
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 
                null
              }
              {isPlanActive('pro') ? 'Plano atual' : isPlanPending('pro') ? 'Pagamento pendente' : 'Assinar'}
            </Button>
          </CardFooter>
        </Card>

        {/* Plano Enterprise */}
        <Card className={`${isPlanActive('enterprise') ? 'border-primary' : ''} h-full flex flex-col relative`}>
          {isPlanPending('enterprise') && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-white text-xs uppercase font-bold py-1 px-3 rounded-full">
              Pagamento Pendente
            </div>
          )}
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Enterprise</CardTitle>
              {isPlanActive('enterprise') && <Badge>Atual</Badge>}
            </div>
            <CardDescription>Para equipes e empresas</CardDescription>
            <div className="mt-2">
              <span className="text-3xl font-bold">R$ 59,90</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-2 mb-6">
              {renderEnterprisePlanFeatures()}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              disabled={isPlanActive('enterprise') || loading || isPlanPending('enterprise')}
              onClick={() => handleSubscribe('enterprise')}
            >
              {loading ? 
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 
                null
              }
              {isPlanActive('enterprise') ? 'Plano atual' : isPlanPending('enterprise') ? 'Pagamento pendente' : 'Assinar'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default PlanSubscription;
