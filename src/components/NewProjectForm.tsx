
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '@/contexts/AppContext';
import { usePlan } from '@/contexts/PlanContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Dialog } from '@/components/ui/dialog';
import { CreditCard } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(3, 'O nome do projeto deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  hourlyRate: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0, 'A taxa horária deve ser um número positivo')
  ),
});

type FormValues = z.infer<typeof formSchema>;

const NewProjectForm: React.FC = () => {
  const { addProject, state } = useAppContext();
  const { projects } = state;
  const { canCreateProject, currentPlan, upgradePlan } = usePlan();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showUpgradeDialog, setShowUpgradeDialog] = React.useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      hourlyRate: 0,
    },
  });
  
  const onSubmit = async (data: FormValues) => {
    // Verificar se o usuário pode criar mais projetos
    if (!canCreateProject(projects.length)) {
      setShowUpgradeDialog(true);
      return;
    }
    
    try {
      await addProject({
        name: data.name,
        description: data.description,
        hourlyRate: data.hourlyRate,
      });
      
      toast({
        title: 'Projeto criado',
        description: `O projeto "${data.name}" foi criado com sucesso.`,
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
    }
  };
  
  const handleUpgrade = () => {
    // Simulando upgrade para o plano Pro
    upgradePlan('pro');
    setShowUpgradeDialog(false);
    
    // Redirecionar para configurações ou outra página relevante
    navigate('/configuracoes');
  };
  
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Projeto</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Website para Cliente X" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição do Projeto</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descreva os detalhes, requisitos e especificações do projeto" 
                    className="min-h-32"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="hourlyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor por Hora (R$)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    placeholder="Ex: 50.00" 
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end gap-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
            >
              Cancelar
            </Button>
            <Button type="submit">Criar Projeto</Button>
          </div>
        </form>
      </Form>
      
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limite de projetos atingido</DialogTitle>
            <DialogDescription>
              Seu plano atual ({currentPlan.toUpperCase()}) permite apenas {currentPlan === 'free' ? '1 projeto' : '10 projetos'}.
              Faça upgrade para criar mais projetos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">Plano PRO</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Até 10 projetos</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Relatórios avançados</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Suporte prioritário</span>
                </li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpgrade} className="gap-2">
              <CreditCard size={16} />
              <span>Fazer Upgrade</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NewProjectForm;
