
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
      hourlyRate: project.hourly_rate,
      createdAt: new Date(project.created_at),
      userId: project.user_id,
    })) || [];
  },

  async createProject(project: Omit<Project, 'id' | 'createdAt'>) {
    const { data, error } = await supabase
      .from('projects')
      .insert([{ 
        name: project.name,
        hourly_rate: project.hourlyRate,
        user_id: project.userId 
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
    };
  },

  async updateProject(project: Project) {
    const { error } = await supabase
      .from('projects')
      .update({ 
        name: project.name,
        hourly_rate: project.hourlyRate 
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
