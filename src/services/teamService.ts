import { supabase } from '@/integrations/supabase/client';
import { Team, TeamMember } from '@/types';

export const teamService = {
  /**
   * Carrega todas as equipes de um usuário
   */
  async loadTeams(userId: string): Promise<{ teams: Team[] }> {
    try {
      // Busca as equipes onde o usuário é o criador
      const { data: createdTeams, error: createdError } = await supabase
        .from('teams')
        .select('*')
        .eq('owner_id', userId);
        
      if (createdError) {
        console.error('Erro ao carregar equipes criadas:', createdError);
        return { teams: [] };
      }
      
      // Busca as equipes onde o usuário é membro
      const { data: memberTeams, error: memberError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId)
        .eq('invitation_status', 'accepted');
        
      if (memberError) {
        console.error('Erro ao carregar equipes como membro:', memberError);
        return { teams: [] };
      }
      
      // Extrai os IDs das equipes onde o usuário é membro
      const teamIds = memberTeams?.map(member => member.team_id) || [];
      
      let teamsDetails = [];
      if (teamIds.length > 0) {
        // Busca os detalhes das equipes onde o usuário é membro
        const { data: teamData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .in('id', teamIds);
          
        if (teamsError) {
          console.error('Erro ao carregar detalhes das equipes:', teamsError);
        } else {
          teamsDetails = teamData || [];
        }
      }
      
      // Combina as equipes criadas e as equipes como membro
      const allTeams = [...(createdTeams || []), ...teamsDetails];
      
      // Remove duplicatas
      const uniqueTeams = Array.from(new Map(allTeams.map(team => [team.id, team])).values());
      
      // Converte para o tipo Team
      return { 
        teams: uniqueTeams.map(team => ({
          id: team.id,
          name: team.name,
          description: team.description,
          ownerId: team.owner_id,
          createdAt: new Date(team.created_at),
        }))
      };
    } catch (error) {
      console.error('Erro em loadTeams:', error);
      return { teams: [] };
    }
  },
  
  /**
   * Cria uma nova equipe
   * @param team Dados da equipe a ser criada
   */
  async createTeam(team: Omit<Team, 'id' | 'createdAt'>): Promise<Team | null> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([{
          name: team.name,
          description: team.description,
          owner_id: team.ownerId,
        }])
        .select('*')
        .single();
        
      if (error) {
        console.error('Erro ao criar equipe:', error);
        return null;
      }
      
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        ownerId: data.owner_id,
        createdAt: new Date(data.created_at),
      };
    } catch (error) {
      console.error('Erro em createTeam:', error);
      return null;
    }
  },
  
  /**
   * Atualiza uma equipe existente
   * @param team Dados da equipe a ser atualizada
   */
  async updateTeam(team: Team): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          name: team.name,
          description: team.description,
        })
        .eq('id', team.id);
        
      if (error) {
        console.error('Erro ao atualizar equipe:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro em updateTeam:', error);
      return false;
    }
  },
  
  /**
   * Deleta uma equipe
   * @param teamId ID da equipe a ser deletada
   */
  async deleteTeam(teamId: string): Promise<boolean> {
    try {
      // Primeiro, deletar todos os membros da equipe
      const { error: membersError } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId);
        
      if (membersError) {
        console.error('Erro ao deletar membros da equipe:', membersError);
        return false;
      }
      
      // Em seguida, deletar a equipe
      const { error: teamError } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);
        
      if (teamError) {
        console.error('Erro ao deletar equipe:', teamError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro em deleteTeam:', error);
      return false;
    }
  },
  
  /**
   * Adiciona um membro a uma equipe
   * @param member Dados do membro a ser adicionado
   */
  async addTeamMember(member: { teamId: string; name: string; userEmail: string; role: string }): Promise<TeamMember> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert([{
          team_id: member.teamId,
          name: member.name,
          user_email: member.userEmail,
          role: member.role,
          invitation_status: 'pending',
        }])
        .select('*')
        .single();
        
      if (error) {
        console.error('Erro ao adicionar membro à equipe:', error);
        throw error;
      }
      
      return {
        id: data.id,
        teamId: data.team_id,
        name: data.name,
        role: data.role,
        userEmail: data.user_email,
        userId: data.user_id,
        invitationStatus: data.invitation_status,
        createdAt: new Date(data.created_at),
      };
    } catch (error) {
      console.error('Erro em addTeamMember:', error);
      throw error;
    }
  },
  
  /**
   * Atualiza um membro de equipe existente
   * @param member Dados do membro a ser atualizado
   */
  async updateTeamMember(member: TeamMember): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          name: member.name,
          role: member.role,
          user_id: member.userId,
          invitation_status: member.invitationStatus,
          user_email: member.userEmail,
        })
        .eq('id', member.id);
        
      if (error) {
        console.error('Erro ao atualizar membro da equipe:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro em updateTeamMember:', error);
      return false;
    }
  },
  
  /**
   * Deleta um membro de uma equipe
   * @param memberId ID do membro a ser deletado
   */
  async deleteTeamMember(memberId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);
        
      if (error) {
        console.error('Erro ao deletar membro da equipe:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro em deleteTeamMember:', error);
      return false;
    }
  },
  
  /**
   * Busca os membros de uma equipe
   * @param teamId ID da equipe
   */
  async getTeamMembers(teamId: string): Promise<{ members: TeamMember[] }> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId);
        
      if (error) {
        console.error('Erro ao buscar membros da equipe:', error);
        return { members: [] };
      }
      
      return { 
        members: data.map(member => ({
          id: member.id,
          teamId: member.team_id,
          name: member.name,
          role: member.role,
          userEmail: member.user_email,
          userId: member.user_id,
          invitationStatus: member.invitation_status,
          createdAt: new Date(member.created_at),
        }))
      };
    } catch (error) {
      console.error('Erro em getTeamMembers:', error);
      return { members: [] };
    }
  },

  /**
   * Busca um membro de equipe pelo email
   * @param email Email do membro
   */
  async getMemberByEmail(email: string): Promise<TeamMember | null> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_email', email)
        .single();
        
      if (error) {
        console.error('Erro ao buscar membro por email:', error);
        return null;
      }
      
      if (data) {
        return {
          id: data.id,
          teamId: data.team_id,
          name: data.name,
          role: data.role,
          userEmail: data.user_email,
          userId: data.user_id,
          invitationStatus: data.invitation_status,
          createdAt: new Date(data.created_at),
        };
      }
      
      return null;
    } catch (error) {
      console.error('Erro em getMemberByEmail:', error);
      return null;
    }
  },
  
  /**
   * Atualiza um membro de equipe
   * @param member Dados do membro a ser atualizado
   */
  async updateTeamMember(member: TeamMember): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          name: member.name,
          role: member.role,
          user_id: member.userId,
          invitation_status: member.invitationStatus,
          user_email: member.userEmail,
        })
        .eq('id', member.id);
        
      if (error) {
        console.error('Erro ao atualizar membro:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro em updateTeamMember:', error);
      return false;
    }
  }
};
