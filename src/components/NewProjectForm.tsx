
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
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const formSchema = z.object({
  name: z.string().min(3, 'O nome do projeto deve ter pelo menos 3 caracteres'),
  hourlyRate: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0, 'A taxa horária deve ser um número positivo')
  ),
});

type FormValues = z.infer<typeof formSchema>;

const NewProjectForm: React.FC = () => {
  const { addProject } = useAppContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      hourlyRate: 0,
    },
  });
  
  const onSubmit = (data: FormValues) => {
    addProject({
      name: data.name,
      hourlyRate: data.hourlyRate,
    });
    
    toast({
      title: 'Projeto criado',
      description: `O projeto "${data.name}" foi criado com sucesso.`,
    });
    
    navigate('/');
  };
  
  return (
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
            onClick={() => navigate('/')}
          >
            Cancelar
          </Button>
          <Button type="submit">Criar Projeto</Button>
        </div>
      </form>
    </Form>
  );
};

export default NewProjectForm;
