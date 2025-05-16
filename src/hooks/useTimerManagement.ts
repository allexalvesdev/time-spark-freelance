
import { useState, useEffect, useCallback } from 'react';
import { TimeEntry, Task } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { activeTimerService } from '@/services/activeTimerService';
import { useToast } from '@/hooks/use-toast';

// Import the activeTaskName hook
import { useActiveTaskName } from './timer/useActiveTaskName';

// Import useTimerEvents hook
import { useTimerEvents } from './timer/useTimerEvents';

// Add debounce to prevent excessive calls
import { debounce } from '@/utils/debounce';

export const useTimerManagement = (userId: string, tasks: Task[] = []) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activeTimeEntry, setActiveTimeEntry] = useState<TimeEntry | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const { toast } = useToast();

  // Initialize by fetching active timer from server
  const fetchActiveTimer = useCallback(async () => {
    try {
      const response = await activeTimerService.getActiveTimer();
      if (response && response.timeEntry) {
        setActiveTimeEntry(response.timeEntry);
      }
    } catch (error) {
      console.error("Error fetching active timer:", error);
    }
  }, []);

  // Debounced version to prevent excessive API calls
  const debouncedFetchActiveTimer = useCallback(
    debounce(fetchActiveTimer, 1000),
    [fetchActiveTimer]
  );

  // Use the timer events hook
  useTimerEvents({
    fetchActiveTimer: debouncedFetchActiveTimer,
    setActiveTimeEntry
  });

  // Initialize by fetching active timer from server
  useEffect(() => {
    const initializeTimerState = async () => {
      setIsInitializing(true);
      try {
        await fetchActiveTimer();
        
        // Force a timer sync event to update all timer components
        window.dispatchEvent(new CustomEvent('force-timer-sync'));
      } catch (error) {
        console.error("Error initializing timer:", error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeTimerState();
  }, [userId, fetchActiveTimer]);

  // Loading all time entries
  useEffect(() => {
    const loadTimeEntries = async () => {
      try {
        const { data: entries, error } = await supabase
          .from('time_entries')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedEntries: TimeEntry[] = entries.map(entry => ({
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
        }));

        setTimeEntries(formattedEntries);
      } catch (error) {
        console.error('Error loading time entries:', error);
      }
    };

    if (userId) {
      loadTimeEntries();
    }
  }, [userId]);

  // Start a new timer
  const startTimer = async (taskId: string, projectId: string) => {
    try {
      console.log("Starting timer for task:", taskId);
      const result = await activeTimerService.startTimer(taskId, projectId, userId);
      
      // Force a timer sync event to update all timer components
      window.dispatchEvent(new CustomEvent('force-timer-sync'));
      
      return result;
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar o timer. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Pause the current timer
  const pauseTimer = async () => {
    try {
      const result = await activeTimerService.pauseTimer();
      
      // Force a timer sync event to update all timer components
      window.dispatchEvent(new CustomEvent('force-timer-sync'));
      
      return result;
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível pausar o timer. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Resume a paused timer
  const resumeTimer = async () => {
    try {
      const result = await activeTimerService.resumeTimer();
      
      // Force a timer sync event to update all timer components
      window.dispatchEvent(new CustomEvent('force-timer-sync'));
      
      return result;
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível retomar o timer. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Stop the current timer
  const stopTimer = async (completeTask: boolean = true) => {
    try {
      const result = await activeTimerService.stopActiveTimer(completeTask);
      
      // Force a timer sync event to update all timer components
      window.dispatchEvent(new CustomEvent('force-timer-sync'));
      
      return result;
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível parar o timer. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Get active task name
  const { getActiveTaskName } = useActiveTaskName({
    activeTimeEntry,
    tasks
  });

  return {
    timeEntries,
    setTimeEntries,
    activeTimeEntry,
    setActiveTimeEntry,
    isInitializing,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    getActiveTaskName,
    fetchActiveTimer: debouncedFetchActiveTimer,
  };
};
