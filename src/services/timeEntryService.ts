
import { supabase } from '@/integrations/supabase/client';
import { TimeEntry } from '@/types';

export const timeEntryService = {
  async loadTimeEntries() {
    const { data: entriesData, error } = await supabase
      .from('time_entries')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const timeEntries = entriesData?.map(entry => ({
      id: entry.id,
      taskId: entry.task_id,
      projectId: entry.project_id,
      startTime: new Date(entry.start_time),
      endTime: entry.end_time ? new Date(entry.end_time) : undefined,
      duration: entry.duration,
      isRunning: entry.is_running,
      userId: entry.user_id
    } as TimeEntry)) || [];
    
    return { timeEntries };
  },

  async createTimeEntry(timeEntry: Omit<TimeEntry, 'id'>) {
    const { data, error } = await supabase
      .from('time_entries')
      .insert([{
        task_id: timeEntry.taskId,
        project_id: timeEntry.projectId,
        start_time: timeEntry.startTime.toISOString(),
        is_running: timeEntry.isRunning,
        user_id: timeEntry.userId
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
      userId: data.user_id
    } as TimeEntry;
  },

  async updateTimeEntry(timeEntry: TimeEntry) {
    const { error } = await supabase
      .from('time_entries')
      .update({
        end_time: timeEntry.endTime?.toISOString(),
        duration: timeEntry.duration,
        is_running: timeEntry.isRunning
      })
      .eq('id', timeEntry.id);

    if (error) throw error;
    
    return timeEntry;
  }
};
