
import { useState, useCallback } from 'react';
import { Team, TeamMember, TeamInvitation } from '@/types';
import { teamService, invitationService } from '@/services';
import { useToast } from '@/hooks/use-toast';

export const useTeams = (userId: string) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadTeams = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const { teams: loadedTeams } = await teamService.loadTeams(userId);
      setTeams(loadedTeams);

      // Load members for each team
      const allMembers: TeamMember[] = [];
      for (const team of loadedTeams) {
        const { members } = await teamService.getTeamMembers(team.id);
        allMembers.push(...members);
      }
      setTeamMembers(allMembers);
      
    } catch (error) {
      console.error('Error loading teams:', error);
      toast({
        title: 'Erro ao carregar equipes',
        description: 'Não foi possível carregar suas equipes. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  const createTeam = useCallback(
    async (team: Omit<Team, 'id' | 'ownerId' | 'createdAt'>): Promise<Team> => {
      try {
        const newTeam = await teamService.createTeam({
          ...team,
          ownerId: userId
        });
        
        if (!newTeam) {
          throw new Error('Failed to create team');
        }
        
        setTeams((prevTeams) => [newTeam, ...prevTeams]);
        
        toast({
          title: 'Equipe criada',
          description: `A equipe "${team.name}" foi criada com sucesso.`,
        });
        
        return newTeam;
      } catch (error) {
        console.error('Error creating team:', error);
        toast({
          title: 'Erro ao criar equipe',
          description: 'Não foi possível criar a equipe. Tente novamente.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [userId, toast]
  );

  const updateTeam = useCallback(
    async (team: Team): Promise<void> => {
      try {
        await teamService.updateTeam(team);
        setTeams((prevTeams) =>
          prevTeams.map((p) => (p.id === team.id ? team : p))
        );
        
        toast({
          title: 'Equipe atualizada',
          description: `A equipe "${team.name}" foi atualizada com sucesso.`,
        });
      } catch (error) {
        console.error('Error updating team:', error);
        toast({
          title: 'Erro ao atualizar equipe',
          description: 'Não foi possível atualizar a equipe. Tente novamente.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  const deleteTeam = useCallback(
    async (teamId: string): Promise<void> => {
      try {
        await teamService.deleteTeam(teamId);
        setTeams((prevTeams) => prevTeams.filter((p) => p.id !== teamId));
        // Also remove all team members
        setTeamMembers((prevMembers) => 
          prevMembers.filter((m) => m.teamId !== teamId)
        );
        
        toast({
          title: 'Equipe excluída',
          description: 'A equipe foi excluída com sucesso.',
        });
      } catch (error) {
        console.error('Error deleting team:', error);
        toast({
          title: 'Erro ao excluir equipe',
          description: 'Não foi possível excluir a equipe. Tente novamente.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  const addTeamMember = useCallback(
    async (member: { teamId: string; name: string; userEmail: string; role: string }): Promise<TeamMember> => {
      try {
        const newMember = await teamService.addTeamMember(member);
        setTeamMembers((prevMembers) => [newMember, ...prevMembers]);
        
        toast({
          title: 'Membro adicionado',
          description: `${member.name} foi adicionado(a) à equipe com sucesso.`,
        });
        
        return newMember;
      } catch (error) {
        console.error('Error adding team member:', error);
        toast({
          title: 'Erro ao adicionar membro',
          description: 'Não foi possível adicionar o membro à equipe. Tente novamente.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  const updateTeamMember = useCallback(
    async (member: TeamMember): Promise<void> => {
      try {
        await teamService.updateTeamMember(member);
        setTeamMembers((prevMembers) =>
          prevMembers.map((m) => (m.id === member.id ? member : m))
        );
        
        toast({
          title: 'Membro atualizado',
          description: `As informações de ${member.name} foram atualizadas com sucesso.`,
        });
      } catch (error) {
        console.error('Error updating team member:', error);
        toast({
          title: 'Erro ao atualizar membro',
          description: 'Não foi possível atualizar as informações do membro. Tente novamente.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  const deleteTeamMember = useCallback(
    async (memberId: string): Promise<void> => {
      try {
        await teamService.deleteTeamMember(memberId);
        setTeamMembers((prevMembers) => 
          prevMembers.filter((m) => m.id !== memberId)
        );
        
        toast({
          title: 'Membro removido',
          description: 'O membro foi removido da equipe com sucesso.',
        });
      } catch (error) {
        console.error('Error deleting team member:', error);
        toast({
          title: 'Erro ao remover membro',
          description: 'Não foi possível remover o membro da equipe. Tente novamente.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  const getTeamMembers = useCallback(
    (teamId: string): TeamMember[] => {
      return teamMembers.filter(member => member.teamId === teamId);
    },
    [teamMembers]
  );

  const createAndSendInvitation = useCallback(
    async (teamId: string, email: string): Promise<TeamInvitation> => {
      try {
        const invitation = await invitationService.createInvitation(teamId, email);
        
        if (!invitation) {
          throw new Error('Failed to create invitation');
        }
        
        // Aqui você implementaria o envio real de email
        const inviteLink = `${window.location.origin}/convite?token=${invitation.token}`;
        console.log(`Convite criado: ${inviteLink}`);
        
        toast({
          title: 'Convite enviado',
          description: `Um convite foi enviado para ${email}`,
        });
        
        return invitation;
      } catch (error) {
        console.error('Error creating invitation:', error);
        toast({
          title: 'Erro ao criar convite',
          description: 'Não foi possível criar o convite. Tente novamente.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  return {
    teams,
    teamMembers,
    isLoading,
    loadTeams,
    createTeam,
    updateTeam: useCallback(async (team: Team) => {
      try {
        await teamService.updateTeam(team);
        setTeams(prevTeams => prevTeams.map(p => p.id === team.id ? team : p));
        
        toast({
          title: 'Equipe atualizada',
          description: `A equipe "${team.name}" foi atualizada com sucesso.`,
        });
      } catch (error) {
        console.error('Error updating team:', error);
        toast({
          title: 'Erro ao atualizar equipe',
          description: 'Não foi possível atualizar a equipe. Tente novamente.',
          variant: 'destructive',
        });
        throw error;
      }
    }, [toast]),
    deleteTeam: useCallback(async (teamId: string) => {
      try {
        await teamService.deleteTeam(teamId);
        setTeams(prevTeams => prevTeams.filter(p => p.id !== teamId));
        setTeamMembers(prevMembers => prevMembers.filter(m => m.teamId !== teamId));
        
        toast({
          title: 'Equipe excluída',
          description: 'A equipe foi excluída com sucesso.',
        });
      } catch (error) {
        console.error('Error deleting team:', error);
        toast({
          title: 'Erro ao excluir equipe',
          description: 'Não foi possível excluir a equipe. Tente novamente.',
          variant: 'destructive',
        });
        throw error;
      }
    }, [toast]),
    addTeamMember,
    updateTeamMember: useCallback(async (member: TeamMember) => {
      try {
        await teamService.updateTeamMember(member);
        setTeamMembers(prevMembers => prevMembers.map(m => m.id === member.id ? member : m));
        
        toast({
          title: 'Membro atualizado',
          description: `As informações de ${member.name} foram atualizadas com sucesso.`,
        });
      } catch (error) {
        console.error('Error updating team member:', error);
        toast({
          title: 'Erro ao atualizar membro',
          description: 'Não foi possível atualizar as informações do membro. Tente novamente.',
          variant: 'destructive',
        });
        throw error;
      }
    }, [toast]),
    deleteTeamMember: useCallback(async (memberId: string) => {
      try {
        await teamService.deleteTeamMember(memberId);
        setTeamMembers(prevMembers => prevMembers.filter(m => m.id !== memberId));
        
        toast({
          title: 'Membro removido',
          description: 'O membro foi removido da equipe com sucesso.',
        });
      } catch (error) {
        console.error('Error deleting team member:', error);
        toast({
          title: 'Erro ao remover membro',
          description: 'Não foi possível remover o membro da equipe. Tente novamente.',
          variant: 'destructive',
        });
        throw error;
      }
    }, [toast]),
    getTeamMembers,
    createAndSendInvitation,
  };
};

