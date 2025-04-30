
import { supabase } from '@/integrations/supabase/client';
import { TimeEntry } from '@/types';

export const timeEntryService = {
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
    console.log('Creating new time entry:', entry);
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
    console.log('Updating time entry in database:', {
      id: entry.id,
      endTime: entry.endTime?.toISOString() || null,
      duration: entry.duration,
      isRunning: entry.isRunning
    });
    
    const updateData = {
      end_time: entry.endTime ? entry.endTime.toISOString() : null,
      duration: entry.duration || 0,
      is_running: entry.isRunning,
    };
    
    console.log('Update payload:', updateData);
    
    const { error, data } = await supabase
      .from('time_entries')
      .update(updateData)
      .eq('id', entry.id)
      .select();

    if (error) {
      console.error('Error updating time entry:', error);
      throw error;
    }
    
    console.log('Time entry updated successfully:', data);
    
    if (data && data.length > 0) {
      return {
        id: data[0].id,
        taskId: data[0].task_id,
        projectId: data[0].project_id,
        startTime: new Date(data[0].start_time),
        endTime: data[0].end_time ? new Date(data[0].end_time) : undefined,
        duration: data[0].duration,
        isRunning: data[0].is_running,
        userId: data[0].user_id,
      };
    }
    
    return null;
  },
};
