
import { supabase } from '@/integrations/supabase/client';
import { Team, TeamMember } from '@/types';

export const teamService = {
  async loadTeams(userId: string) {
    const { data: teamsData, error } = await supabase
      .from('teams')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const teams = teamsData?.map(team => ({
      id: team.id,
      name: team.name,
      description: team.description || '',
      ownerId: team.owner_id,
      createdAt: new Date(team.created_at)
    } as Team)) || [];
    
    return { teams };
  },

  async createTeam(team: Omit<Team, 'id' | 'ownerId' | 'createdAt'>, userId: string): Promise<Team> {
    const { data, error } = await supabase
      .from('teams')
      .insert([{
        name: team.name,
        description: team.description,
        owner_id: userId
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      ownerId: data.owner_id,
      createdAt: new Date(data.created_at)
    };
  },

  async updateTeam(team: Team): Promise<void> {
    const { error } = await supabase
      .from('teams')
      .update({
        name: team.name,
        description: team.description
      })
      .eq('id', team.id);
    
    if (error) throw error;
  },

  async deleteTeam(teamId: string): Promise<void> {
    // Note: team_members will be automatically deleted due to ON DELETE CASCADE
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);
    
    if (error) throw error;
  },

  async loadTeamMembers(teamId: string) {
    const { data: membersData, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const members = membersData?.map(member => ({
      id: member.id,
      teamId: member.team_id,
      userEmail: member.user_email,
      name: member.name,
      role: member.role,
      createdAt: new Date(member.created_at),
      userId: member.user_id || undefined,
      invitationStatus: member.invitation_status || 'pending'
    } as TeamMember)) || [];
    
    return { members };
  },

  async addTeamMember(member: Omit<TeamMember, 'id' | 'createdAt' | 'userId' | 'invitationStatus'>): Promise<TeamMember> {
    const { data, error } = await supabase
      .from('team_members')
      .insert([{
        team_id: member.teamId,
        user_email: member.userEmail,
        name: member.name,
        role: member.role,
        invitation_status: 'pending'
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      teamId: data.team_id,
      userEmail: data.user_email,
      name: data.name,
      role: data.role,
      createdAt: new Date(data.created_at),
      invitationStatus: data.invitation_status
    };
  },

  async updateTeamMember(member: TeamMember): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .update({
        name: member.name,
        user_email: member.userEmail,
        role: member.role,
        invitation_status: member.invitationStatus,
        user_id: member.userId
      })
      .eq('id', member.id);
    
    if (error) throw error;
  },

  async updateMemberStatus(memberId: string, userId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .update({
        user_id: userId,
        invitation_status: status
      })
      .eq('id', memberId);
    
    if (error) throw error;
  },

  async getMemberByEmail(email: string): Promise<TeamMember | null> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('user_email', email)
      .maybeSingle();
    
    if (error) throw error;
    
    if (!data) return null;
    
    return {
      id: data.id,
      teamId: data.team_id,
      userEmail: data.user_email,
      name: data.name,
      role: data.role,
      createdAt: new Date(data.created_at),
      userId: data.user_id || undefined,
      invitationStatus: data.invitation_status
    };
  },

  async deleteTeamMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);
    
    if (error) throw error;
  }
};
