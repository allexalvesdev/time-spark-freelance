
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';

export const projectService = {
  async loadProjects() {
    try {
      // Obter o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('Nenhum usuário logado ao tentar carregar projetos');
        return [];
      }
      
      // Buscar projetos onde o usuário é o proprietário
      const { data: ownProjects, error: ownError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (ownError) {
        console.error('Erro ao carregar projetos próprios:', ownError);
        return [];
      }

      // Buscar projetos onde o usuário é membro da equipe
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('invitation_status', 'accepted');

      let teamProjects = [];
      
      if (!teamError && teamMembers && teamMembers.length > 0) {
        const teamIds = teamMembers.map(member => member.team_id);
        
        // Buscar projetos associados às equipes do usuário
        const { data: projectsFromTeams, error: projError } = await supabase
          .from('projects')
          .select('*')
          .in('team_id', teamIds)
          .order('created_at', { ascending: false });
        
        if (!projError) {
          teamProjects = projectsFromTeams || [];
        } else {
          console.error('Erro ao carregar projetos de equipes:', projError);
        }
      }
      
      // Combinar projetos próprios e de equipes
      const allProjects = [...(ownProjects || []), ...teamProjects];
      
      // Usar um Map para remover possíveis duplicatas
      const uniqueProjectsMap = new Map();
      allProjects.forEach(project => uniqueProjectsMap.set(project.id, project));
      const uniqueProjects = Array.from(uniqueProjectsMap.values());
      
      return uniqueProjects.map(project => ({
        id: project.id,
        name: project.name,
        hourlyRate: project.hourly_rate,
        createdAt: new Date(project.created_at),
        userId: project.user_id,
        teamId: project.team_id || null,
      }));
    } catch (error) {
      console.error('Erro inesperado ao carregar projetos:', error);
      return [];
    }
  },

  async createProject(project: Omit<Project, 'id' | 'createdAt'>) {
    const { data, error } = await supabase
      .from('projects')
      .insert([{ 
        name: project.name,
        hourly_rate: project.hourlyRate,
        user_id: project.userId,
        team_id: project.teamId || null
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      hourlyRate: data.hourly_rate,
      createdAt: new Date(data.created_at),
      userId: data.user_id,
      teamId: data.team_id || null,
    };
  },

  async updateProject(project: Project) {
    const { error } = await supabase
      .from('projects')
      .update({ 
        name: project.name,
        hourly_rate: project.hourlyRate,
        team_id: project.teamId || null
      })
      .eq('id', project.id);

    if (error) throw error;
  },

  async deleteProject(projectId: string) {
    // First, delete all task tags associated with tasks in this project
    const { data: projectTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id')
      .eq('project_id', projectId);
    
    if (tasksError) throw tasksError;
    
    if (projectTasks && projectTasks.length > 0) {
      const taskIds = projectTasks.map(task => task.id);
      
      // Delete all task tags
      const { error: taskTagsError } = await supabase
        .from('task_tags')
        .delete()
        .in('task_id', taskIds);
      
      if (taskTagsError) throw taskTagsError;
      
      // Delete all time entries related to the tasks
      const { error: timeEntriesError } = await supabase
        .from('time_entries')
        .delete()
        .in('task_id', taskIds);
      
      if (timeEntriesError) throw timeEntriesError;
    }
    
    // Delete all tasks associated with this project
    const { error: deleteTasksError } = await supabase
      .from('tasks')
      .delete()
      .eq('project_id', projectId);

    if (deleteTasksError) throw deleteTasksError;
    
    // Delete all time entries directly associated with the project
    const { error: deleteProjectTimeEntriesError } = await supabase
      .from('time_entries')
      .delete()
      .eq('project_id', projectId);

    if (deleteProjectTimeEntriesError) throw deleteProjectTimeEntriesError;
    
    // Finally delete the project itself
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  },
};
