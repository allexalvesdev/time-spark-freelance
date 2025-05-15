import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import PrioritySelect from '@/components/task/PrioritySelect';
import TagsInput from '@/components/task/TagsInput';

const formSchema = z.object({
  name: z.string().min(3, 'O nome da tarefa deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  estimatedHours: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0, 'As horas devem ser um número positivo')
  ),
  estimatedMinutes: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0, 'Os minutos devem ser um número positivo').max(59, 'Os minutos devem ser menor que 60')
  ),
  scheduledStartTime: z.string().refine(val => !!val, {
    message: 'Selecione uma data e hora de início',
  }),
  priority: z.enum(['Baixa', 'Média', 'Alta', 'Urgente']).default('Média'),
});

type FormValues = z.infer<typeof formSchema>;

interface NewTaskFormProps {
  projectId: string;
  onSuccess?: () => void;
}

const NewTaskForm: React.FC<NewTaskFormProps> = ({ projectId, onSuccess }) => {
  const { addTask, addTagToTask } = useAppContext();
  const { toast } = useToast();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get current date in Brazil timezone
  const now = new Date();
  const brasilDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      estimatedHours: 0,
      estimatedMinutes: 0,
      scheduledStartTime: brasilDate,
      priority: 'Média',
    },
  });
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const totalMinutes = (Number(data.estimatedHours) * 60) + Number(data.estimatedMinutes);
      
      const newTask = await addTask({
        projectId,
        name: data.name,
        description: data.description || '',
        estimatedTime: totalMinutes,
        scheduledStartTime: new Date(data.scheduledStartTime),
        priority: data.priority,
        completed: false
      });
      
      // Adicionar tags à tarefa
      if (selectedTagIds.length > 0 && newTask) {
        await Promise.all(selectedTagIds.map(tagId => addTagToTask(newTask.id, tagId)));
      }
      
      toast({
        title: 'Tarefa criada',
        description: `A tarefa "${data.name}" foi criada com sucesso.`,
      });
      
      form.reset({
        name: '',
        description: '',
        estimatedHours: 0,
        estimatedMinutes: 0,
        scheduledStartTime: brasilDate,
        priority: 'Média',
      });
      
      setSelectedTagIds([]);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Tarefa</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Criar wireframes" {...field} />
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
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva os detalhes da tarefa" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prioridade</FormLabel>
              <FormControl>
                <PrioritySelect 
                  value={field.value} 
                  onChange={field.onChange} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Tags</FormLabel>
          <TagsInput 
            taskId=""
            selectedTagIds={selectedTagIds}
            onTagsChange={setSelectedTagIds}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="estimatedHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horas Estimadas</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="estimatedMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minutos Estimados</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    max="59"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="scheduledStartTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data e Hora de Início</FormLabel>
                <FormControl>
                  <Input 
                    type="datetime-local"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adicionando...' : 'Adicionar Tarefa'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default NewTaskForm;
