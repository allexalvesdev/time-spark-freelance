
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';

export const projectService = {
  async loadProjects() {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return projects?.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      hourlyRate: project.hourly_rate,
      createdAt: new Date(project.created_at),
      userId: project.user_id,
    })) || [];
  },

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'userId'>) {
    const { data, error } = await supabase
      .from('projects')
      .insert([{ 
        name: project.name,
        description: project.description,
        hourly_rate: project.hourlyRate,
        user_id: project.userId 
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      hourlyRate: data.hourly_rate,
      createdAt: new Date(data.created_at),
      userId: data.user_id,
    };
  },

  async updateProject(project: Project) {
    const { error } = await supabase
      .from('projects')
      .update({ 
        name: project.name,
        description: project.description,
        hourly_rate: project.hourlyRate 
      })
      .eq('id', project.id);

    if (error) throw error;
  },

  async deleteProject(projectId: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  },
};
