
import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/types';

export const taskService = {
  async loadTasks() {
    const { data: tasksData, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const tasks = tasksData?.map(task => ({
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
    
    return { tasks };
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
};
