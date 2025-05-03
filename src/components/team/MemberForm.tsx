
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TeamMember } from '@/types';

const formSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  userEmail: z.string().email('Insira um email válido'),
  role: z.string().min(1, 'Selecione uma função'),
});

type FormValues = z.infer<typeof formSchema>;

interface MemberFormProps {
  teamId: string;
  member?: TeamMember;
  onSubmit: (values: FormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const MemberForm: React.FC<MemberFormProps> = ({
  teamId,
  member,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: member?.name || '',
      userEmail: member?.userEmail || '',
      role: member?.role || 'member',
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
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Nome do membro" 
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
          name="userEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  placeholder="email@exemplo.com" 
                  type="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Função</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="leader">Líder</SelectItem>
                  <SelectItem value="developer">Desenvolvedor</SelectItem>
                  <SelectItem value="designer">Designer</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                </SelectContent>
              </Select>
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
              : member
              ? 'Atualizar Membro'
              : 'Adicionar Membro'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default MemberForm;
