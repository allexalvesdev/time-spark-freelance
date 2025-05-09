
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const projectService = {
  loadProjects: async (): Promise<Project[]> => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(project => ({
        ...project,
        createdAt: new Date(project.created_at),
      })) as Project[];
    } catch (error: any) {
      console.error('Error loading projects:', error.message);
      throw error;
    }
  },

  getProject: async (projectId: string): Promise<Project> => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      
      return {
        ...data,
        createdAt: new Date(data.created_at),
      } as Project;
    } catch (error: any) {
      console.error(`Error loading project ${projectId}:`, error.message);
      throw error;
    }
  },

  createProject: async (project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> => {
    try {
      const newProject = {
        id: uuidv4(),
        ...project,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([{
          id: newProject.id,
          name: project.name,
          hourly_rate: project.hourlyRate,
          user_id: project.userId,
          team_id: project.teamId,
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        hourlyRate: data.hourly_rate,
        userId: data.user_id,
        teamId: data.team_id,
        createdAt: new Date(data.created_at),
      } as Project;
    } catch (error: any) {
      console.error('Error creating project:', error.message);
      throw error;
    }
  },

  updateProject: async (project: Project): Promise<Project> => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          name: project.name,
          hourly_rate: project.hourlyRate,
          team_id: project.teamId,
        })
        .eq('id', project.id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        hourlyRate: data.hourly_rate,
        userId: data.user_id,
        teamId: data.team_id,
        createdAt: new Date(data.created_at),
      } as Project;
    } catch (error: any) {
      console.error(`Error updating project ${project.id}:`, error.message);
      throw error;
    }
  },

  deleteProject: async (projectId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
    } catch (error: any) {
      console.error(`Error deleting project ${projectId}:`, error.message);
      throw error;
    }
  },
};
