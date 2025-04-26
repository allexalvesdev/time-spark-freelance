
import { supabase } from '@/integrations/supabase/client';
import { Project, Task, TimeEntry } from '@/types';

export const databaseService = {
  // Project operations
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
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  },

  // Task operations
  async loadTasks() {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return tasks?.map(task => ({
      id: task.id,
      name: task.name,
      description: task.description || '',
      projectId: task.project_id,
      estimatedTime: task.estimated_time,
      scheduledStartTime: task.scheduled_start_time ? new Date(task.scheduled_start_time) : undefined,
      actualStartTime: task.actual_start_time ? new Date(task.actual_start_time) : undefined,
      actualEndTime: task.actual_end_time ? new Date(task.actual_end_time) : undefined,
      elapsedTime: task.elapsed_time,
      completed: task.completed,
      userId: task.user_id,
    })) || [];
  },

  async createTask(task: Omit<Task, 'id' | 'completed' | 'actualStartTime' | 'actualEndTime' | 'elapsedTime'>) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        name: task.name,
        description: task.description,
        project_id: task.projectId,
        estimated_time: task.estimatedTime,
        scheduled_start_time: task.scheduledStartTime.toISOString(),
        user_id: task.userId,
        completed: false,
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      projectId: data.project_id,
      estimatedTime: data.estimated_time,
      scheduledStartTime: data.scheduled_start_time ? new Date(data.scheduled_start_time) : undefined,
      actualStartTime: undefined,
      actualEndTime: undefined,
      elapsedTime: 0,
      completed: false,
      userId: data.user_id,
    };
  },

  async updateTask(task: Task) {
    const { error } = await supabase
      .from('tasks')
      .update({
        name: task.name,
        description: task.description,
        project_id: task.projectId,
        estimated_time: task.estimatedTime,
        scheduled_start_time: task.scheduledStartTime ? task.scheduledStartTime.toISOString() : null,
        actual_start_time: task.actualStartTime ? task.actualStartTime.toISOString() : null,
        actual_end_time: task.actualEndTime ? task.actualEndTime.toISOString() : null,
        elapsed_time: task.elapsedTime,
        completed: task.completed,
      })
      .eq('id', task.id);

    if (error) throw error;
  },

  async deleteTask(taskId: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  },

  // Time entries operations
  async loadTimeEntries() {
    const { data: timeEntries, error } = await supabase
      .from('time_entries')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return timeEntries?.map(entry => ({
      id: entry.id,
      taskId: entry.task_id,
      projectId: entry.project_id,
      startTime: new Date(entry.start_time),
      endTime: entry.end_time ? new Date(entry.end_time) : undefined,
      duration: entry.duration,
      isRunning: entry.is_running,
      userId: entry.user_id,
    })) || [];
  },

  async createTimeEntry(entry: Omit<TimeEntry, 'id' | 'endTime' | 'duration'>) {
    const { data, error } = await supabase
      .from('time_entries')
      .insert([{
        task_id: entry.taskId,
        project_id: entry.projectId,
        start_time: entry.startTime.toISOString(),
        is_running: entry.isRunning,
        user_id: entry.userId,
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      taskId: data.task_id,
      projectId: data.project_id,
      startTime: new Date(data.start_time),
      endTime: data.end_time ? new Date(data.end_time) : undefined,
      duration: data.duration,
      isRunning: data.is_running,
      userId: data.user_id,
    };
  },

  async updateTimeEntry(entry: TimeEntry) {
    const { error } = await supabase
      .from('time_entries')
      .update({
        end_time: entry.endTime ? entry.endTime.toISOString() : null,
        duration: entry.duration,
        is_running: entry.isRunning,
      })
      .eq('id', entry.id);

    if (error) throw error;
  },
};
