
import { supabase } from '@/integrations/supabase/client';
import { generateToken } from '@/utils/tokenUtils';
import { TeamInvitation } from '@/types';

export const invitationService = {
  /**
   * Cria um convite para um membro entrar em uma equipe
   * @param teamId ID da equipe
   * @param email Email do membro a ser convidado
   * @param expirationDays Dias para expiração do convite (padrão: 7)
   */
  async createInvitation(teamId: string, email: string, expirationDays: number = 7): Promise<TeamInvitation | null> {
    try {
      const token = generateToken(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);
      
      const { data, error } = await supabase
        .from('team_invitations')
        .insert({
          team_id: teamId,
          email,
          token,
          expires_at: expiresAt.toISOString(),
          used: false
        })
        .select('*')
        .single();
        
      if (error) {
        console.error('Error creating invitation:', error);
        return null;
      }
      
      return data as TeamInvitation;
    } catch (error) {
      console.error('Error in createInvitation:', error);
      return null;
    }
  },
  
  /**
   * Verifica se um convite é válido
   * @param token Token do convite
   */
  async validateInvitation(token: string): Promise<TeamInvitation | null> {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*, teams(name)')
        .eq('token', token)
        .gt('expires_at', now)
        .eq('used', false)
        .single();
        
      if (error) {
        console.error('Error validating invitation:', error);
        return null;
      }
      
      return data as unknown as TeamInvitation;
    } catch (error) {
      console.error('Error in validateInvitation:', error);
      return null;
    }
  },
  
  /**
   * Marca um convite como usado
   * @param token Token do convite
   */
  async markInvitationAsUsed(token: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_invitations')
        .update({ used: true })
        .eq('token', token);
        
      if (error) {
        console.error('Error marking invitation as used:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in markInvitationAsUsed:', error);
      return false;
    }
  }
};
