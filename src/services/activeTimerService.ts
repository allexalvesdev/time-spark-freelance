import { supabase } from '@/integrations/supabase/client';
import { TimeEntry } from '@/types';
import { toast } from '@/hooks/use-toast';

interface ActiveTimerResponse {
  timeEntry: TimeEntry | null;
  serverTime: number; // UTC timestamp in milliseconds
}

export const activeTimerService = {
  /**
   * Fetches the currently active timer from the server
   */
  async getActiveTimer(): Promise<ActiveTimerResponse | null> {
    try {
      // Get the current server time first to ensure accuracy
      const { data: timeData, error: timeError } = await supabase.rpc('get_server_time');
      
      if (timeError) {
        console.error('Error fetching server time:', timeError);
        return null;
      }
      
      const serverTime = new Date(timeData).getTime();
      
      // Fetch the active time entry
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('is_running', true)
        .is('end_time', null)
        .order('start_time', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Error fetching active timer:', error);
        return null;
      }
      
      if (!data || data.length === 0) {
        return { timeEntry: null, serverTime };
      }
      
      const activeEntry: TimeEntry = {
        id: data[0].id,
        taskId: data[0].task_id,
        projectId: data[0].project_id,
        startTime: new Date(data[0].start_time),
        isRunning: data[0].is_running,
        isPaused: data[0].is_paused || false,
        pausedTime: data[0].paused_time || 0,
        userId: data[0].user_id,
      };
      
      return {
        timeEntry: activeEntry,
        serverTime
      };
    } catch (error) {
      console.error('Unexpected error fetching active timer:', error);
      return null;
    }
  },
  
  /**
   * Start a new timer
   */
  async startTimer(taskId: string, projectId: string, userId: string): Promise<TimeEntry | null> {
    try {
      // First, ensure any existing timer is stopped
      await this.stopActiveTimer(false);
      
      const now = new Date();
      
      // Create new time entry in UTC
      const { data, error } = await supabase
        .from('time_entries')
        .insert([{
          task_id: taskId,
          project_id: projectId,
          start_time: now.toISOString(), // Store in ISO format (UTC)
          is_running: true,
          is_paused: false,
          paused_time: 0,
          user_id: userId,
        }])
        .select()
        .single();
      
      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível iniciar o timer. Tente novamente.',
          variant: 'destructive',
        });
        throw error;
      }
      
      const newEntry: TimeEntry = {
        id: data.id,
        taskId: data.task_id,
        projectId: data.project_id,
        startTime: new Date(data.start_time),
        isRunning: data.is_running,
        isPaused: data.is_paused || false,
        pausedTime: data.paused_time || 0,
        userId: data.user_id,
      };
      
      window.dispatchEvent(new CustomEvent('timer-started', { 
        detail: { timeEntry: newEntry } 
      }));
      
      return newEntry;
    } catch (error) {
      console.error('Failed to start timer:', error);
      return null;
    }
  },
  
  /**
   * Pause the current active timer
   */
  async pauseTimer(): Promise<TimeEntry | null> {
    try {
      const activeTimerResponse = await this.getActiveTimer();
      if (!activeTimerResponse || !activeTimerResponse.timeEntry) {
        return null;
      }
      
      const { timeEntry, serverTime } = activeTimerResponse;
      
      // Calculate current elapsed time in seconds
      const startTimeMs = timeEntry.startTime.getTime();
      const elapsedSeconds = Math.floor((serverTime - startTimeMs) / 1000);
      const totalPausedTime = (timeEntry.pausedTime || 0);
      
      // Update the entry to be paused
      const { data, error } = await supabase
        .from('time_entries')
        .update({
          is_paused: true,
          paused_time: totalPausedTime,
          is_running: true // still considered running, just paused
        })
        .eq('id', timeEntry.id)
        .select()
        .single();
      
      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível pausar o timer. Tente novamente.',
          variant: 'destructive',
        });
        throw error;
      }
      
      const updatedEntry: TimeEntry = {
        id: data.id,
        taskId: data.task_id,
        projectId: data.project_id,
        startTime: new Date(data.start_time),
        isRunning: data.is_running,
        isPaused: data.is_paused,
        pausedTime: data.paused_time,
        userId: data.user_id,
      };
      
      // Store the pause start time locally for UI updates
      localStorage.setItem('timerPausedAt', serverTime.toString());
      localStorage.setItem(`timerPausedAt-global-timer-${timeEntry.taskId}`, serverTime.toString());
      
      window.dispatchEvent(new CustomEvent('timer-paused', { 
        detail: { 
          timeEntry: updatedEntry,
          pausedAt: serverTime
        } 
      }));
      
      return updatedEntry;
    } catch (error) {
      console.error('Failed to pause timer:', error);
      return null;
    }
  },
  
  /**
   * Resume a paused timer
   */
  async resumeTimer(): Promise<TimeEntry | null> {
    try {
      const activeTimerResponse = await this.getActiveTimer();
      if (!activeTimerResponse || !activeTimerResponse.timeEntry || !activeTimerResponse.timeEntry.isPaused) {
        return null;
      }
      
      const { timeEntry, serverTime } = activeTimerResponse;
      
      // Calculate additional paused time
      let additionalPausedTime = 0;
      const pausedAtStr = localStorage.getItem(`timerPausedAt-global-timer-${timeEntry.taskId}`);
      
      if (pausedAtStr) {
        const pausedAt = parseInt(pausedAtStr, 10);
        if (!isNaN(pausedAt) && pausedAt > 0) {
          additionalPausedTime = Math.floor((serverTime - pausedAt) / 1000);
          if (additionalPausedTime < 0) additionalPausedTime = 0;
        }
      }
      
      // Calculate total paused time
      const totalPausedTime = (timeEntry.pausedTime || 0) + additionalPausedTime;
      
      // Update the entry to be resumed
      const { data, error } = await supabase
        .from('time_entries')
        .update({
          is_paused: false,
          paused_time: totalPausedTime,
          is_running: true
        })
        .eq('id', timeEntry.id)
        .select()
        .single();
      
      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível retomar o timer. Tente novamente.',
          variant: 'destructive',
        });
        throw error;
      }
      
      const updatedEntry: TimeEntry = {
        id: data.id,
        taskId: data.task_id,
        projectId: data.project_id,
        startTime: new Date(data.start_time),
        isRunning: data.is_running,
        isPaused: data.is_paused,
        pausedTime: data.paused_time,
        userId: data.user_id,
      };
      
      // Clear pause timestamps
      localStorage.removeItem('timerPausedAt');
      localStorage.removeItem(`timerPausedAt-global-timer-${timeEntry.taskId}`);
      
      window.dispatchEvent(new CustomEvent('timer-resumed', { 
        detail: { 
          timeEntry: updatedEntry,
          newPausedTime: totalPausedTime
        } 
      }));
      
      return updatedEntry;
    } catch (error) {
      console.error('Failed to resume timer:', error);
      return null;
    }
  },
  
  /**
   * Stop the current active timer
   */
  async stopActiveTimer(completeTask: boolean = true): Promise<TimeEntry | null> {
    try {
      const activeTimerResponse = await this.getActiveTimer();
      if (!activeTimerResponse || !activeTimerResponse.timeEntry) {
        return null;
      }
      
      const { timeEntry, serverTime } = activeTimerResponse;
      const startTimeMs = timeEntry.startTime.getTime();
      
      // Calculate duration properly, accounting for paused time
      let totalDuration = Math.floor((serverTime - startTimeMs) / 1000);
      if (totalDuration < 0) totalDuration = 0;
      
      // Subtract the already recorded paused time
      let finalDuration = totalDuration - (timeEntry.pausedTime || 0);
      if (finalDuration < 0) finalDuration = 0;
      
      // If the timer is currently paused, add the additional pause time
      if (timeEntry.isPaused) {
        const pausedAtStr = localStorage.getItem(`timerPausedAt-global-timer-${timeEntry.taskId}`);
        if (pausedAtStr) {
          const pausedAt = parseInt(pausedAtStr, 10);
          if (!isNaN(pausedAt) && pausedAt > 0) {
            const additionalPausedTime = Math.floor((serverTime - pausedAt) / 1000);
            if (additionalPausedTime > 0) {
              finalDuration -= additionalPausedTime;
              if (finalDuration < 0) finalDuration = 0;
            }
          }
        }
      }
      
      // Update the time entry to mark it as stopped
      const { data, error } = await supabase
        .from('time_entries')
        .update({
          end_time: new Date(serverTime).toISOString(),
          duration: finalDuration,
          is_running: false,
          is_paused: false
        })
        .eq('id', timeEntry.id)
        .select()
        .single();
      
      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível parar o timer. Tente novamente.',
          variant: 'destructive',
        });
        throw error;
      }
      
      const stoppedEntry: TimeEntry = {
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
      
      // Clear all timer-related localStorage entries
      localStorage.removeItem('activeTimeEntryId');
      localStorage.removeItem('activeTaskId');
      localStorage.removeItem('timerStartTime');
      localStorage.removeItem('timerIsPaused');
      localStorage.removeItem('timerPausedTime');
      localStorage.removeItem(`timerPausedAt-global-timer-${timeEntry.taskId}`);
      localStorage.removeItem(`timerIsPaused-global-timer-${timeEntry.taskId}`);
      localStorage.removeItem(`timerPausedTime-global-timer-${timeEntry.taskId}`);
      
      window.dispatchEvent(new CustomEvent('timer-stopped', { 
        detail: { 
          timeEntry: stoppedEntry,
          taskId: timeEntry.taskId,
          elapsedTime: finalDuration,
          completeTask
        } 
      }));
      
      // If completeTask is true, dispatch a task completion event
      if (completeTask) {
        window.dispatchEvent(new CustomEvent('complete-task', { 
          detail: { 
            taskId: timeEntry.taskId,
            duration: finalDuration
          } 
        }));
      }
      
      return stoppedEntry;
    } catch (error) {
      console.error('Failed to stop timer:', error);
      return null;
    }
  },
  
  /**
   * Calculate the current elapsed time based on a time entry and current server time
   */
  calculateElapsedTime(timeEntry: TimeEntry, serverTime: number): number {
    if (!timeEntry.isRunning) {
      return timeEntry.duration || 0;
    }
    
    const startTimeMs = timeEntry.startTime.getTime();
    let elapsedSeconds = Math.floor((serverTime - startTimeMs) / 1000);
    
    // Subtract paused time
    if (timeEntry.pausedTime && timeEntry.pausedTime > 0) {
      elapsedSeconds -= timeEntry.pausedTime;
    }
    
    // If currently paused, subtract additional pause time
    if (timeEntry.isPaused) {
      const pausedAtStr = localStorage.getItem(`timerPausedAt-global-timer-${timeEntry.taskId}`);
      if (pausedAtStr) {
        const pausedAt = parseInt(pausedAtStr, 10);
        if (!isNaN(pausedAt) && pausedAt > 0) {
          const additionalPausedTime = Math.floor((serverTime - pausedAt) / 1000);
          if (additionalPausedTime > 0) {
            elapsedSeconds -= additionalPausedTime;
          }
        }
      }
    }
    
    return elapsedSeconds > 0 ? elapsedSeconds : 0;
  }
};
