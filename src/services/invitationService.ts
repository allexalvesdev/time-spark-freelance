
import { supabase } from '@/integrations/supabase/client';
import { TeamInvitation } from '@/types';
import { generateToken } from '@/utils/tokenUtils';

export const invitationService = {
  async createInvitation(teamId: string, email: string): Promise<TeamInvitation> {
    // Gerar um token único para o convite
    const token = generateToken(32);
    
    // Define a expiração para 7 dias a partir de agora
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const { data, error } = await supabase
      .from('team_invitations')
      .insert([{
        team_id: teamId,
        email: email,
        token: token,
        expires_at: expiresAt.toISOString(),
        used: false
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      teamId: data.team_id,
      email: data.email,
      token: data.token,
      expiresAt: new Date(data.expires_at),
      createdAt: new Date(data.created_at),
      used: data.used
    };
  },
  
  async getInvitationByToken(token: string): Promise<TeamInvitation | null> {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single();
    
    if (error) {
      console.error('Erro ao buscar convite:', error);
      return null;
    }
    
    if (!data) return null;
    
    // Verificar se o convite expirou
    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    
    if (now > expiresAt) {
      console.log('Convite expirado');
      return null;
    }
    
    return {
      id: data.id,
      teamId: data.team_id,
      email: data.email,
      token: data.token,
      expiresAt: new Date(data.expires_at),
      createdAt: new Date(data.created_at),
      used: data.used
    };
  },
  
  async markInvitationAsUsed(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from('team_invitations')
      .update({ used: true })
      .eq('id', invitationId);
    
    if (error) throw error;
  },
  
  async deleteInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from('team_invitations')
      .delete()
      .eq('id', invitationId);
    
    if (error) throw error;
  }
};
