
import React, { useState } from 'react';
import { TeamMember } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

  const handleSubmit = async (values: {
    name: string;
    userEmail: string;
    role: string;
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
        await addTeamMember({
          teamId,
          name: values.name,
          userEmail: values.userEmail,
          role: values.role,
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving team member:', error);
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
