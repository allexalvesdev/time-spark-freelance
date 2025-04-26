
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Check } from 'lucide-react';

const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { currentPlan, planLimits, upgradePlan } = usePlan();

  const handleLogout = async () => {
    try {
      await signOut();
      // Redirect is handled by the auth context
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível fazer logout. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handlePasswordReset = async () => {
    try {
      if (!user?.email) throw new Error('Email não encontrado');
      
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      
      if (error) throw error;
      
      toast({
        title: 'Email enviado',
        description: 'Verifique seu email para alterar a senha.',
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o email de reset. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const renderPlanFeatures = () => {
    switch (currentPlan) {
      case 'free':
        return [
          'Até 1 projeto',
          'Relatórios básicos',
          'Suporte por email'
        ];
      case 'pro':
        return [
          'Até 10 projetos',
          'Relatórios avançados',
          'Suporte prioritário',
          'Exportação de dados'
        ];
      case 'enterprise':
        return [
          'Projetos ilimitados',
          'API personalizada',
          'Suporte 24/7',
          'Gerenciamento de equipe',
          'Customização total'
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Perfil</h2>
          <div className="grid gap-4 max-w-md">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={user?.email || ''} disabled />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Plano atual</h2>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{currentPlan === 'free' ? 'Gratuito' : currentPlan === 'pro' ? 'Profissional' : 'Empresarial'}</CardTitle>
                  <CardDescription>
                    {currentPlan === 'free' 
                      ? 'Para uso pessoal e pequenos projetos' 
                      : currentPlan === 'pro' 
                        ? 'Para profissionais e freelancers' 
                        : 'Para equipes e empresas'}
                  </CardDescription>
                </div>
                <Badge variant={currentPlan === 'free' ? 'outline' : currentPlan === 'pro' ? 'secondary' : 'default'}>
                  {currentPlan.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {renderPlanFeatures().map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            {currentPlan === 'free' && (
              <CardFooter>
                <Button 
                  className="w-full flex items-center gap-2" 
                  onClick={() => upgradePlan('pro')}
                >
                  <CreditCard size={16} />
                  <span>Fazer upgrade para PRO</span>
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Segurança</h2>
          <div className="flex gap-4">
            <Button onClick={handlePasswordReset}>
              Alterar Senha
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
