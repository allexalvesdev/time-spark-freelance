
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client'; 

// Helper function to calculate trial end date (14 days from now)
const getTrialEndDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date;
};

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const result = await signUp(email, password);
        if (result.error) throw result.error;
        
        // If sign up is successful and we have a user
        if (result.data && result.data.user) {
          const trialEndDate = getTrialEndDate();
          
          // Update the user's profile with trial information
          await supabase
            .from('profiles')
            .update({
              is_trial: true,
              trial_end_date: trialEndDate.toISOString(),
              user_plan: 'basic'
            })
            .eq('id', result.data.user.id);
            
          toast({
            title: "Conta criada com sucesso!",
            description: "Você iniciou seu período de teste de 14 dias. Aproveite todas as funcionalidades!",
          });
          setIsSignUp(false); // Switch to login view
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        // Redirect is handled by the auth context
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link to="/" className="flex justify-center mb-6">
            <h1 className="text-2xl font-bold">
              Workly<span className="text-timespark-accent">.</span>
            </h1>
          </Link>
          <h1 className="text-2xl font-bold text-center">
            {isSignUp ? 'Criar conta' : 'Entrar'}
          </h1>
          {isSignUp && (
            <p className="text-center text-muted-foreground">
              Comece com 14 dias de teste grátis
            </p>
          )}
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Carregando...' : isSignUp ? 'Criar conta' : 'Entrar'}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Já tem uma conta? Entre' : 'Não tem uma conta? Crie uma'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Auth;
