
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
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState(0);
  const { toast } = useToast();

  // Initialize by fetching active timer from server with rate limiting
  const fetchActiveTimer = useCallback(async () => {
    try {
      // Add rate limiting to avoid excessive calls
      const now = Date.now();
      if (now - lastFetchTimestamp < 2000) { // 2 second minimum between fetches
        return;
      }
      
      setLastFetchTimestamp(now);
      const response = await activeTimerService.getActiveTimer();
      if (response && response.timeEntry) {
        setActiveTimeEntry(response.timeEntry);
      }
    } catch (error) {
      console.error("Error fetching active timer:", error);
    }
  }, [lastFetchTimestamp]);

  // Properly debounced version that returns a Promise
  const debouncedFetchActiveTimer = useCallback(
    async (): Promise<void> => {
      return new Promise<void>((resolve) => {
        debounce(() => {
          fetchActiveTimer()
            .then(() => resolve())
            .catch((error) => {
              console.error("Error in debouncedFetchActiveTimer:", error);
              resolve(); // Resolve even on error to ensure Promise completion
            });
        }, 2000)();
      });
    },
    [fetchActiveTimer]
  );

  // Use the timer events hook with optimized event handlers
  useTimerEvents({
    fetchActiveTimer: debouncedFetchActiveTimer,
    setActiveTimeEntry
  });

  // Optimize initialization by limiting session-related fetches
  useEffect(() => {
    let isMounted = true;
    
    const initializeTimerState = async () => {
      if (!userId || !isMounted) return;
      
      setIsInitializing(true);
      try {
        await fetchActiveTimer();
        
        // Force a timer sync event to update all timer components
        // But limit frequency with a small delay
        setTimeout(() => {
          if (isMounted) {
            window.dispatchEvent(new CustomEvent('force-timer-sync'));
          }
        }, 100);
      } catch (error) {
        console.error("Error initializing timer:", error);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };
    
    initializeTimerState();
    
    return () => {
      isMounted = false;
    };
  }, [userId, fetchActiveTimer]);

  // Loading all time entries with optimized query frequency
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const loadTimeEntries = async () => {
      if (!userId || !isMounted) return;
      
      try {
        const { data: entries, error } = await supabase
          .from('time_entries')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!isMounted) return;

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

    // Load time entries once on mount and when userId changes (not on every re-render)
    loadTimeEntries();
    
    // Set up periodic refresh with a reasonable interval (30 seconds)
    timeoutId = setInterval(loadTimeEntries, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(timeoutId);
    };
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
