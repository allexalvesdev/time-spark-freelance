
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
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { toast } = useToast();
  const { signIn, signUp, forgotPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await forgotPassword(email);
        if (error) throw error;
        
        toast({
          title: "Email enviado",
          description: "Se um usuário com este email existir, você receberá um link para redefinir sua senha.",
        });
        setIsForgotPassword(false);
      } else if (isSignUp) {
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

  const renderForgotPasswordForm = () => (
    <>
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
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Button type="submit" className="w-full bg-primary text-white" disabled={isLoading}>
          {isLoading ? 'Enviando...' : 'Enviar email de recuperação'}
        </Button>
        <Button
          type="button"
          variant="link"
          className="w-full text-primary"
          onClick={() => setIsForgotPassword(false)}
        >
          Voltar para login
        </Button>
      </CardFooter>
    </>
  );

  const renderAuthForm = () => (
    <>
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
            className="bg-white/5 border-white/10 text-white"
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
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Button type="submit" className="w-full bg-primary text-white" disabled={isLoading}>
          {isLoading ? 'Carregando...' : isSignUp ? 'Criar conta' : 'Entrar'}
        </Button>
        <Button
          type="button"
          variant="link"
          className="w-full text-primary"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? 'Já tem uma conta? Entre' : 'Não tem uma conta? Crie uma'}
        </Button>
        {!isSignUp && (
          <Button
            type="button"
            variant="link"
            className="w-full text-primary"
            onClick={() => setIsForgotPassword(true)}
          >
            Esqueceu sua senha?
          </Button>
        )}
      </CardFooter>
    </>
  );

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md bg-black/90 border-white/10 text-white">
        <CardHeader>
          <Link to="/" className="flex justify-center mb-6">
            <h1 className="text-2xl font-archivo-black">
              Focusly<span className="text-primary">.</span>
            </h1>
          </Link>
          <h1 className="text-2xl font-bold text-center">
            {isForgotPassword 
              ? 'Recuperar Senha'
              : isSignUp ? 'Criar conta' : 'Entrar'}
          </h1>
          {isSignUp && (
            <p className="text-center text-muted-foreground">
              Comece com 14 dias de teste grátis
            </p>
          )}
          {isForgotPassword && (
            <p className="text-center text-muted-foreground">
              Digite seu email para receber um link de recuperação de senha
            </p>
          )}
        </CardHeader>
        <form onSubmit={handleSubmit}>
          {isForgotPassword ? renderForgotPasswordForm() : renderAuthForm()}
        </form>
      </Card>
    </div>
  );
};

export default Auth;
