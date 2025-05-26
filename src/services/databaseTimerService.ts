
import { supabase } from '@/integrations/supabase/client';
import { Timer } from '@/types/timer';

export interface ActiveTimer {
  id: string;
  taskId: string;
  projectId: string;
  startTime: Date;
  isPaused: boolean;
  pausedTime: number;
  elapsedSeconds: number;
}

export const databaseTimerService = {
  /**
   * Start a new timer - only database operation
   */
  async startTimer(taskId: string, projectId: string, userId: string): Promise<string> {
    // First stop any existing active timer
    await this.stopActiveTimer(userId);
    
    const { data, error } = await supabase
      .from('time_entries')
      .insert({
        task_id: taskId,
        project_id: projectId,
        user_id: userId,
        start_time: new Date().toISOString(),
        is_running: true,
        is_active: true,
        is_paused: false,
        paused_time: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  },

  /**
   * Get the currently active timer with calculated elapsed time
   */
  async getActiveTimer(userId: string): Promise<ActiveTimer | null> {
    const { data, error } = await supabase
      .rpc('get_active_timer', { user_uuid: userId });

    if (error) throw error;
    if (!data || data.length === 0) return null;

    const timer = data[0];
    return {
      id: timer.id,
      taskId: timer.task_id,
      projectId: timer.project_id,
      startTime: new Date(timer.start_time),
      isPaused: timer.is_paused,
      pausedTime: timer.paused_time,
      elapsedSeconds: Math.max(0, timer.elapsed_seconds)
    };
  },

  /**
   * Pause the active timer
   */
  async pauseTimer(userId: string): Promise<void> {
    const activeTimer = await this.getActiveTimer(userId);
    if (!activeTimer) return;

    const { error } = await supabase
      .from('time_entries')
      .update({
        is_paused: true,
        paused_time: activeTimer.elapsedSeconds
      })
      .eq('id', activeTimer.id);

    if (error) throw error;
  },

  /**
   * Resume the paused timer
   */
  async resumeTimer(userId: string): Promise<void> {
    const activeTimer = await this.getActiveTimer(userId);
    if (!activeTimer) return;

    // Reset start time to now minus already elapsed time
    const newStartTime = new Date(Date.now() - (activeTimer.elapsedSeconds * 1000));

    const { error } = await supabase
      .from('time_entries')
      .update({
        is_paused: false,
        start_time: newStartTime.toISOString(),
        paused_time: 0
      })
      .eq('id', activeTimer.id);

    if (error) throw error;
  },

  /**
   * Stop the active timer and calculate final duration
   */
  async stopTimer(userId: string, completeTask: boolean = false): Promise<number> {
    const activeTimer = await this.getActiveTimer(userId);
    if (!activeTimer) return 0;

    const finalDuration = activeTimer.elapsedSeconds;
    const now = new Date();

    const { error } = await supabase
      .from('time_entries')
      .update({
        end_time: now.toISOString(),
        duration: finalDuration,
        is_running: false,
        is_active: false
      })
      .eq('id', activeTimer.id);

    if (error) throw error;

    // Update task elapsed time
    if (finalDuration > 0) {
      const { data: task } = await supabase
        .from('tasks')
        .select('elapsed_time')
        .eq('id', activeTimer.taskId)
        .single();

      const currentElapsed = task?.elapsed_time || 0;
      const newElapsed = currentElapsed + finalDuration;

      await supabase
        .from('tasks')
        .update({
          elapsed_time: newElapsed,
          completed: completeTask,
          actual_end_time: completeTask ? now.toISOString() : undefined
        })
        .eq('id', activeTimer.taskId);
    }

    return finalDuration;
  },

  /**
   * Stop any existing active timer without completing task
   */
  async stopActiveTimer(userId: string): Promise<void> {
    const { error } = await supabase
      .from('time_entries')
      .update({
        end_time: new Date().toISOString(),
        is_running: false,
        is_active: false
      })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;
  }
};

// New exported functions to match expected interface
export const startTimer = async (taskId: string): Promise<Timer | null> => {
  try {
    // This would need user ID - for now return null
    return null;
  } catch (error) {
    console.error('Error starting timer:', error);
    return null;
  }
};

export const pauseTimer = async (timerId: string): Promise<Timer | null> => {
  try {
    // This would need user ID - for now return null
    return null;
  } catch (error) {
    console.error('Error pausing timer:', error);
    return null;
  }
};

export const resumeTimer = async (timerId: string): Promise<Timer | null> => {
  try {
    // This would need user ID - for now return null
    return null;
  } catch (error) {
    console.error('Error resuming timer:', error);
    return null;
  }
};

export const stopTimer = async (timerId: string): Promise<void> => {
  try {
    // This would need user ID - for now do nothing
  } catch (error) {
    console.error('Error stopping timer:', error);
  }
};
