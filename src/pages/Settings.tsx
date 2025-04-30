
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PlanSubscription from '@/components/PlanSubscription';

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { currentPlan } = usePlan();

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Perfil</h2>
            <div className="grid gap-4 max-w-md">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={user?.email || ''} disabled />
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="plans" className="space-y-6">
          <PlanSubscription />
        </TabsContent>
        
        <TabsContent value="security" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Segurança</h2>
            <div className="flex gap-4">
              <Button onClick={handlePasswordReset}>
                Alterar Senha
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
