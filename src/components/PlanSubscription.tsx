
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionStatus {
  user_plan: string;
  status: 'active' | 'no_subscription';
  pending_plan: string | null;
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
  const { currentPlan, loadUserPlan } = usePlan();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    checkSubscriptionStatus();
    
    // Verificar parâmetros de URL para sucesso/falha no pagamento
    const url = new URL(window.location.href);
    const paymentStatus = url.searchParams.get('payment');
    
    if (paymentStatus === 'success') {
      toast({
        title: 'Pagamento iniciado com sucesso',
        description: 'Estamos verificando seu pagamento...',
      });
      checkSubscriptionStatus();
    } else if (paymentStatus === 'canceled') {
      toast({
        title: 'Pagamento cancelado',
        description: 'Você pode tentar novamente a qualquer momento.',
        variant: 'destructive',
      });
    }
    
    // Limpar URL
    if (paymentStatus) {
      url.searchParams.delete('payment');
      url.searchParams.delete('plan');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);
  
  const checkSubscriptionStatus = async () => {
    if (!user) return;
    
    try {
      setCheckingStatus(true);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      
      setSubscriptionStatus(data);
      
      // Recarregar o plano do usuário do contexto se necessário
      if (data.user_plan !== currentPlan) {
        loadUserPlan();
      }
    } catch (error) {
      console.error('Erro ao verificar status da assinatura:', error);
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
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan },
      });
      
      if (error) throw error;
      
      // Redirecionar para o Stripe Checkout
      window.location.href = data.sessionUrl;
    } catch (error) {
      console.error('Erro ao criar sessão de checkout:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar o processo de assinatura. Tente novamente.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };
  
  const openCustomerPortal = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      // Redirecionar para o portal do cliente Stripe
      window.location.href = data.url;
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
    return subscriptionStatus?.pending_plan === planName;
  };

  // Renderizar características do plano Free
  const renderFreePlanFeatures = () => (
    <>
      <li className="flex items-center gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span>Até 1 projeto</span>
      </li>
      <li className="flex items-center gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span>Relatórios básicos</span>
      </li>
      <li className="flex items-center gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span>Suporte por email</span>
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

      {subscriptionStatus?.status === 'active' && subscriptionStatus.subscription && (
        <div className="bg-muted p-4 rounded-lg mb-6">
          <p className="font-medium">
            Sua assinatura está ativa até {formatDate(subscriptionStatus.subscription.current_period_end)}
            {subscriptionStatus.subscription.cancel_at_period_end && " (não será renovada)"}
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Plano Free */}
        <Card className={`${isPlanActive('free') ? 'border-primary' : ''} h-full flex flex-col`}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Free</CardTitle>
              {isPlanActive('free') && <Badge>Atual</Badge>}
            </div>
            <CardDescription>Para uso pessoal</CardDescription>
            <div className="mt-2">
              <span className="text-3xl font-bold">Grátis</span>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-2 mb-6">
              {renderFreePlanFeatures()}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              variant={isPlanActive('free') ? 'outline' : 'default'}
              disabled={isPlanActive('free') || loading}
            >
              {isPlanActive('free') ? 'Plano atual' : 'Plano base'}
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
              disabled={isPlanActive('pro') || loading}
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
              disabled={isPlanActive('enterprise') || loading}
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
