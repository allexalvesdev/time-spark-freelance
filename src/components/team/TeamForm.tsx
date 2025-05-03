
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Team } from '@/types';

const formSchema = z.object({
  name: z.string().min(3, 'O nome da equipe deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TeamFormProps {
  team?: Team;
  onSubmit: (values: FormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const TeamForm: React.FC<TeamFormProps> = ({
  team,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: team?.name || '',
      description: team?.description || '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Equipe</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: Equipe de Design" 
                  {...field}
                  autoFocus
                />
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
                  placeholder="Descrição da equipe (opcional)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Salvando...'
              : team
              ? 'Atualizar Equipe'
              : 'Criar Equipe'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TeamForm;
