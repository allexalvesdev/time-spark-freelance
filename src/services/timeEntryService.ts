
import { supabase } from '@/integrations/supabase/client';
import { TimeEntry } from '@/types';

// PostgreSQL integer max value
const PG_INTEGER_MAX = 2147483647;

export const timeEntryService = {
  async loadTimeEntries() {
    const { data: timeEntries, error } = await supabase
      .from('time_entries')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const formattedEntries = timeEntries?.map(entry => ({
      id: entry.id,
      taskId: entry.task_id,
      projectId: entry.project_id,
      startTime: new Date(entry.start_time),
      endTime: entry.end_time ? new Date(entry.end_time) : undefined,
      duration: entry.duration,
      isRunning: entry.is_running,
      isPaused: entry.is_paused || false,
      pausedTime: entry.paused_time || 0,
      userId: entry.user_id,
    })) || [];
    
    return formattedEntries;
  },

  async createTimeEntry(entry: Omit<TimeEntry, 'id' | 'endTime' | 'duration'>) {
    const { data, error } = await supabase
      .from('time_entries')
      .insert([{
        task_id: entry.taskId,
        project_id: entry.projectId,
        start_time: entry.startTime.toISOString(),
        is_running: entry.isRunning,
        is_paused: entry.isPaused || false,
        paused_time: Math.min(entry.pausedTime || 0, PG_INTEGER_MAX),
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
      isPaused: data.is_paused || false,
      pausedTime: data.paused_time || 0,
      userId: data.user_id,
    };
  },

  async updateTimeEntry(entry: TimeEntry) {
    // Ensure pausedTime and duration are within PostgreSQL integer limits
    const safeEntry = {
      ...entry,
      pausedTime: Math.min(entry.pausedTime || 0, PG_INTEGER_MAX),
      duration: Math.min(entry.duration || 0, PG_INTEGER_MAX)
    };

    const { error } = await supabase
      .from('time_entries')
      .update({
        end_time: safeEntry.endTime ? safeEntry.endTime.toISOString() : null,
        duration: safeEntry.duration,
        is_running: safeEntry.isRunning,
        is_paused: safeEntry.isPaused,
        paused_time: safeEntry.pausedTime,
      })
      .eq('id', entry.id);

    if (error) throw error;
  },

  async pauseTimeEntry(entryId: string, pausedTime: number) {
    // Ensure pausedTime is within PostgreSQL integer limits
    const safePausedTime = Math.min(pausedTime, PG_INTEGER_MAX);
    
    const { error } = await supabase
      .from('time_entries')
      .update({
        is_paused: true,
        is_running: true, // Still considered running, just paused
        paused_time: safePausedTime,
      })
      .eq('id', entryId);

    if (error) throw error;
  },

  async resumeTimeEntry(entryId: string, pausedTime: number) {
    // Ensure pausedTime is within PostgreSQL integer limits
    const safePausedTime = Math.min(pausedTime, PG_INTEGER_MAX);
    
    const { error } = await supabase
      .from('time_entries')
      .update({
        is_paused: false,
        is_running: true,
        paused_time: safePausedTime,
      })
      .eq('id', entryId);

    if (error) throw error;
  },
};
