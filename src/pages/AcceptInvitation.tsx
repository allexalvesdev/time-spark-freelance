import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { invitationService, teamService } from '@/services';
import { TeamInvitation } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const AcceptInvitation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [invitation, setInvitation] = useState<TeamInvitation | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingInvitation, setIsCheckingInvitation] = useState(true);
  const [invitationValid, setInvitationValid] = useState<boolean | null>(null);
  
  // Verificar o token do convite
  useEffect(() => {
    const checkInvitation = async () => {
      if (!token) {
        setInvitationValid(false);
        setIsCheckingInvitation(false);
        return;
      }
      
      try {
        // Use validateInvitation instead of getInvitationByToken
        const invitation = await invitationService.validateInvitation(token);
        
        if (invitation) {
          setInvitation(invitation);
          setEmail(invitation.email); // Pré-preencher o email do convite
          setInvitationValid(true);
        } else {
          setInvitationValid(false);
        }
      } catch (error) {
        console.error('Erro ao verificar convite:', error);
        setInvitationValid(false);
      } finally {
        setIsCheckingInvitation(false);
      }
    };
    
    checkInvitation();
  }, [token]);
  
  // Se já estiver autenticado
  useEffect(() => {
    const handleAcceptInvitation = async () => {
      if (user && invitation) {
        try {
          setIsLoading(true);
          
          // Busca o membro pelo email
          const member = await teamService.getMemberByEmail(invitation.email);
          
          if (member) {
            // Atualiza o membro com o ID do usuário e status aceito
            await teamService.updateMemberStatus(member.id, user.id, 'accepted');
            
            // Marca o convite como usado
            await invitationService.markInvitationAsUsed(invitation.token);
            
            toast({
              title: 'Convite aceito!',
              description: 'Você agora é um membro da equipe.',
            });
            
            // Redireciona para o dashboard
            navigate('/dashboard');
          } else {
            toast({
              title: 'Erro',
              description: 'Não encontramos o seu registro como membro da equipe.',
              variant: 'destructive',
            });
          }
        } catch (error) {
          console.error('Erro ao aceitar convite:', error);
          toast({
            title: 'Erro',
            description: 'Não foi possível aceitar o convite. Tente novamente.',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    if (user && invitation) {
      handleAcceptInvitation();
    }
  }, [user, invitation, navigate, toast]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitation) return;
    
    setIsLoading(true);
    
    try {
      // Verificar se o usuário já existe
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        console.log('Usuário não existe, criando conta...');
        // Usuário não existe, criar nova conta
        const { error: signUpError } = await signUp(email, password);
        
        if (signUpError) {
          throw new Error(signUpError.message);
        }
        
        toast({
          title: 'Conta criada',
          description: 'Sua conta foi criada com sucesso! Verifique seu email para confirmar.',
        });
      }
      
      // O usuário será logado e o useEffect acima cuidará do resto
    } catch (error: any) {
      console.error('Erro no processo de login/cadastro:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível processar sua solicitação',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isCheckingInvitation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/40">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Verificando convite...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  if (invitationValid === false) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/40">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Convite inválido</CardTitle>
            <CardDescription className="text-center">
              Este convite é inválido ou expirou. Por favor, solicite um novo convite.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={() => navigate('/')}
            >
              Voltar para a página inicial
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Aceitar convite</CardTitle>
          <CardDescription className="text-center">
            Entre com sua conta ou crie uma nova para aceitar o convite.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!!invitation} // Email fixo se vier de um convite
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Informe sua senha"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Processando...' : 'Entrar / Cadastrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitation;
