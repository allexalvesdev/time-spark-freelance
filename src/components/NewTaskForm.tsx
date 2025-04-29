
import React, { useEffect, useState } from 'react';
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
import { TagInput } from '@/components/ui/tag-input';
import { PrioritySelector } from '@/components/ui/priority-selector';
import { Tag, TaskPriority } from '@/types';

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
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
});

type FormValues = z.infer<typeof formSchema>;

interface NewTaskFormProps {
  projectId: string;
  onSuccess?: () => void;
}

const NewTaskForm: React.FC<NewTaskFormProps> = ({ projectId, onSuccess }) => {
  const { addTask, addTag, getTags, addTaskTag, state } = useAppContext();
  const { toast } = useToast();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  
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
      priority: 'Medium',
    },
  });
  
  useEffect(() => {
    const loadTags = async () => {
      setIsLoadingTags(true);
      try {
        const tags = await getTags();
        setTagSuggestions(tags.map(tag => tag.name));
      } catch (error) {
        console.error("Error loading tags:", error);
      } finally {
        setIsLoadingTags(false);
      }
    };
    
    loadTags();
  }, [getTags]);
  
  const handleCreateTag = async (tagName: string) => {
    try {
      await addTag(tagName);
    } catch (error) {
      console.error("Error creating tag:", error);
    }
  };
  
  const onSubmit = async (data: FormValues) => {
    const totalMinutes = (Number(data.estimatedHours) * 60) + Number(data.estimatedMinutes);
    const estimatedTime = totalMinutes; // Store in minutes for database
    
    try {
      // First add the task
      const task = await addTask({
        projectId,
        name: data.name,
        description: data.description || '',
        estimatedTime,
        scheduledStartTime: new Date(data.scheduledStartTime),
        priority: data.priority,
      });
      
      // Then add tags to the task
      if (selectedTags.length > 0) {
        // Get or create each tag and associate with task
        for (const tagName of selectedTags) {
          try {
            const tag = await addTag(tagName);
            await addTaskTag(task.id, tag.id);
          } catch (error) {
            console.error(`Error adding tag ${tagName} to task:`, error);
          }
        }
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
        priority: 'Medium',
      });
      
      setSelectedTags([]);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a tarefa. Tente novamente.',
        variant: 'destructive',
      });
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
                <PrioritySelector 
                  value={field.value} 
                  onChange={field.onChange} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
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
        
        <div className="space-y-2">
          <FormLabel>Tags</FormLabel>
          <TagInput
            tags={selectedTags}
            setTags={setSelectedTags}
            suggestions={tagSuggestions}
            placeholder="Adicione tags..."
            onCreateTag={handleCreateTag}
          />
          <p className="text-xs text-muted-foreground">
            Digite para adicionar novas tags ou selecione das existentes
          </p>
        </div>
        
        <div className="flex justify-end pt-4">
          <Button type="submit">Adicionar Tarefa</Button>
        </div>
      </form>
    </Form>
  );
};

export default NewTaskForm;
