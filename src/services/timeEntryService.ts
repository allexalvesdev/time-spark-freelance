
import { supabase } from '@/integrations/supabase/client';
import { TimeEntry } from '@/types';

export const timeEntryService = {
  loadTimeEntries: async (userId: string): Promise<TimeEntry[]> => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (error) throw error;

      return data.map(entry => ({
        id: entry.id,
        taskId: entry.task_id,
        projectId: entry.project_id,
        startTime: new Date(entry.start_time),
        endTime: entry.end_time ? new Date(entry.end_time) : undefined,
        duration: entry.duration,
        isRunning: entry.is_running,
        userId: entry.user_id,
      })) as TimeEntry[];
    } catch (error: any) {
      console.error('Error loading time entries:', error.message);
      throw error;
    }
  },

  createTimeEntry: async (timeEntry: Omit<TimeEntry, 'id'>): Promise<TimeEntry> => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .insert([{
          task_id: timeEntry.taskId,
          project_id: timeEntry.projectId,
          start_time: timeEntry.startTime.toISOString(),
          is_running: timeEntry.isRunning,
          user_id: timeEntry.userId,
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
      } as TimeEntry;
    } catch (error: any) {
      console.error('Error creating time entry:', error.message);
      throw error;
    }
  },

  updateTimeEntry: async (timeEntry: TimeEntry): Promise<TimeEntry> => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .update({
          end_time: timeEntry.endTime?.toISOString(),
          duration: timeEntry.duration,
          is_running: timeEntry.isRunning,
        })
        .eq('id', timeEntry.id)
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
      } as TimeEntry;
    } catch (error: any) {
      console.error(`Error updating time entry ${timeEntry.id}:`, error.message);
      throw error;
    }
  },

  deleteTimeEntry: async (timeEntryId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', timeEntryId);

      if (error) throw error;
    } catch (error: any) {
      console.error(`Error deleting time entry ${timeEntryId}:`, error.message);
      throw error;
    }
  },

  getRunningTimeEntry: async (userId: string): Promise<TimeEntry | null> => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('is_running', true)
        .order('start_time', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // If no running time entry is found, return null
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return {
        id: data.id,
        taskId: data.task_id,
        projectId: data.project_id,
        startTime: new Date(data.start_time),
        endTime: data.end_time ? new Date(data.end_time) : undefined,
        duration: data.duration,
        isRunning: data.is_running,
        userId: data.user_id,
      } as TimeEntry;
    } catch (error: any) {
      console.error('Error getting running time entry:', error.message);
      return null;
    }
  },
};
