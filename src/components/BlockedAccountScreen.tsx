
import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { usePlan } from '@/contexts/PlanContext';

const BlockedAccountScreen = () => {
  const { isTrialActive, trialEndsAt } = usePlan();
  const location = useLocation();
  const isSettingsPage = location.pathname === '/configuracoes';

  // If user is already on settings page, don't show blocking screen
  if (isSettingsPage) return null;

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <CardTitle>Conta com Acesso Restrito</CardTitle>
          </div>
          <CardDescription>
            {isTrialActive && trialEndsAt
              ? 'Seu período de teste terminou.'
              : 'É necessário escolher um plano para continuar.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-900 dark:text-amber-100 dark:border-amber-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Acesso limitado</AlertTitle>
            <AlertDescription>
              Para continuar utilizando o Focusly com todas as funcionalidades, 
              escolha um dos nossos planos de assinatura.
            </AlertDescription>
          </Alert>
          <p className="text-muted-foreground">
            Você será redirecionado para a página de configurações onde poderá escolher um plano
            que melhor atenda suas necessidades.
          </p>
        </CardContent>
        <CardFooter>
          <Link to="/configuracoes" className="w-full">
            <Button className="w-full">Escolher um plano</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BlockedAccountScreen;
