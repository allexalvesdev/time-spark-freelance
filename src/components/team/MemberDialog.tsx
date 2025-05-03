
import React, { useState } from 'react';
import { TeamMember } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { invitationService } from '@/services';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MemberForm from './MemberForm';

interface MemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  member?: TeamMember;
}

const MemberDialog: React.FC<MemberDialogProps> = ({
  isOpen,
  onClose,
  teamId,
  member,
}) => {
  const { addTeamMember, updateTeamMember } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (values: {
    name: string;
    userEmail: string;
    role: string;
    sendInvite: boolean;
  }) => {
    setIsSubmitting(true);
    try {
      if (member) {
        await updateTeamMember({
          ...member,
          name: values.name,
          userEmail: values.userEmail,
          role: values.role,
        });
      } else {
        const newMember = await addTeamMember({
          teamId,
          name: values.name,
          userEmail: values.userEmail,
          role: values.role,
        });
        
        // Enviar convite por email se solicitado
        if (values.sendInvite) {
          try {
            const invitation = await invitationService.createInvitation(
              teamId, 
              values.userEmail
            );
            
            // Aqui você pode implementar o envio de email
            // Este é um exemplo simulado:
            console.log(`Enviando convite para ${values.userEmail} com token ${invitation.token}`);
            
            const inviteLink = `${window.location.origin}/convite?token=${invitation.token}`;
            
            toast({
              title: 'Convite criado',
              description: `Link de convite: ${inviteLink}`,
            });
          } catch (error) {
            console.error('Erro ao criar convite:', error);
            toast({
              title: 'Erro ao criar convite',
              description: 'O membro foi adicionado, mas não foi possível criar o convite.',
              variant: 'destructive',
            });
          }
        }
      }
      onClose();
    } catch (error) {
      console.error('Error saving team member:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o membro da equipe.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {member ? 'Editar Membro' : 'Novo Membro'}
          </DialogTitle>
        </DialogHeader>
        <MemberForm
          teamId={teamId}
          member={member}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};

export default MemberDialog;
