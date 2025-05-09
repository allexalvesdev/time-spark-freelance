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
      priority: (task.priority === 'Baixa' || task.priority === 'Média' || task.priority === 'Alta' || task.priority === 'Urgente') 
        ? task.priority 
        : 'Média'
    } as Task)) || [];
    
    return { tasks };
  },

  async createTask(task: Omit<Task, 'id'>) {
    console.log('Creating task in database:', task);
    
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        name: task.name,
        description: task.description,
        project_id: task.projectId,
        estimated_time: task.estimatedTime,
        scheduled_start_time: task.scheduledStartTime ? task.scheduledStartTime.toISOString() : null,
        actual_start_time: task.actualStartTime ? task.actualStartTime.toISOString() : null,
        actual_end_time: task.actualEndTime ? task.actualEndTime.toISOString() : null,
        elapsed_time: task.elapsedTime,
        user_id: task.userId,
        completed: task.completed || false,
        priority: task.priority || 'Média',
      }])
      .select()
      .single();

    if (error) throw error;

    console.log('Task created in database:', data);
    
    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      projectId: data.project_id,
      estimatedTime: data.estimated_time,
      scheduledStartTime: data.scheduled_start_time ? new Date(data.scheduled_start_time) : undefined,
      actualStartTime: data.actual_start_time ? new Date(data.actual_start_time) : undefined,
      actualEndTime: data.actual_end_time ? new Date(data.actual_end_time) : undefined,
      elapsedTime: data.elapsed_time,
      completed: data.completed,
      userId: data.user_id,
      priority: (data.priority === 'Baixa' || data.priority === 'Média' || data.priority === 'Alta' || data.priority === 'Urgente') 
        ? data.priority 
        : 'Média'
    } as Task;
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
        priority: task.priority || 'Média',
      })
      .eq('id', task.id);

    if (error) throw error;
  },
  
  async bulkImportTasks(tasks: Omit<Task, 'id'>[]): Promise<Task[]> {
    const transformedTasks = tasks.map(task => ({
      name: task.name,
      description: task.description || '',
      project_id: task.projectId,
      estimated_time: task.estimatedTime || 0,
      scheduled_start_time: task.scheduledStartTime ? task.scheduledStartTime.toISOString() : null,
      actual_start_time: task.actualStartTime ? task.actualStartTime.toISOString() : null,
      actual_end_time: task.actualEndTime ? task.actualEndTime.toISOString() : null,
      elapsed_time: task.elapsedTime || 0,
      user_id: task.userId,
      completed: task.completed || false,
      priority: task.priority || 'Média',
    }));
    
    const { data, error } = await supabase
      .from('tasks')
      .insert(transformedTasks)
      .select();
    
    if (error) throw error;
    
    // Transform the returned data back to our application's Task type
    return data.map(task => ({
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
      priority: (task.priority === 'Baixa' || task.priority === 'Média' || task.priority === 'Alta' || task.priority === 'Urgente') 
        ? task.priority 
        : 'Média'
    } as Task));
  },

  async deleteTask(taskId: string) {
    // First, delete all time entries associated with this task
    const { error: timeEntriesError } = await supabase
      .from('time_entries')
      .delete()
      .eq('task_id', taskId);

    if (timeEntriesError) throw timeEntriesError;

    // Delete task tags
    const { error: taskTagsError } = await supabase
      .from('task_tags')
      .delete()
      .eq('task_id', taskId);

    if (taskTagsError) throw taskTagsError;

    // Now delete the task itself
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  },
};
