
import React, { useState } from 'react';
import { Team } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import TeamForm from './TeamForm';

interface TeamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  team?: Team;
}

const TeamDialog: React.FC<TeamDialogProps> = ({ isOpen, onClose, team }) => {
  const { createTeam, updateTeam } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: { name: string; description?: string }) => {
    setIsSubmitting(true);
    try {
      if (team) {
        await updateTeam({
          ...team,
          name: values.name,
          description: values.description || '',
        });
      } else {
        await createTeam({
          name: values.name,
          description: values.description || '',
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving team:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {team ? 'Editar Equipe' : 'Nova Equipe'}
          </DialogTitle>
        </DialogHeader>
        <TeamForm
          team={team}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};

export default TeamDialog;
