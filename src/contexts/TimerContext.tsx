
import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { TimeEntry, Task } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { activeTimerService } from '@/services/activeTimerService';
import { timeEntryService } from '@/services';
import { useToast } from '@/hooks/use-toast';
import { debounce } from '@/utils/debounce';
import { taskService } from '@/services';

interface TimerContextType {
  timeEntries: TimeEntry[];
  setTimeEntries: React.Dispatch<React.SetStateAction<TimeEntry[]>>;
  activeTimeEntry: TimeEntry | null;
  setActiveTimeEntry: React.Dispatch<React.SetStateAction<TimeEntry | null>>;
  isInitializing: boolean;
  startTimer: (taskId: string, projectId: string) => Promise<TimeEntry | null>;
  pauseTimer: () => Promise<TimeEntry | null>;
  resumeTimer: () => Promise<TimeEntry | null>;
  stopTimer: (completeTask?: boolean) => Promise<TimeEntry | null>;
  getActiveTaskName: () => string | null;
  fetchActiveTimer: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: ReactNode; userId: string }> = ({ 
  children, 
  userId 
}) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activeTimeEntry, setActiveTimeEntry] = useState<TimeEntry | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
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

  // Initialize by fetching active timer from server
  useEffect(() => {
    const initializeTimerState = async () => {
      setIsInitializing(true);
      try {
        await fetchActiveTimer();
        
        // Set up event listeners for timer events
        const handleTimerStarted = (e: CustomEvent) => {
          const { timeEntry } = e.detail;
          console.log("Timer started event received:", timeEntry);
          setActiveTimeEntry(timeEntry);
        };
        
        const handleTimerPaused = (e: CustomEvent) => {
          const { timeEntry } = e.detail;
          console.log("Timer paused event received:", timeEntry);
          setActiveTimeEntry(timeEntry);
        };
        
        const handleTimerResumed = (e: CustomEvent) => {
          const { timeEntry } = e.detail;
          console.log("Timer resumed event received:", timeEntry);
          setActiveTimeEntry(timeEntry);
        };
        
        const handleTimerStopped = (e: CustomEvent) => {
          console.log("Timer stopped event received");
          setActiveTimeEntry(null);
        };
        
        window.addEventListener('timer-started', handleTimerStarted as EventListener);
        window.addEventListener('timer-paused', handleTimerPaused as EventListener);
        window.addEventListener('timer-resumed', handleTimerResumed as EventListener);
        window.addEventListener('timer-stopped', handleTimerStopped as EventListener);
        
        // Force a timer sync event to update all timer components
        window.dispatchEvent(new CustomEvent('force-timer-sync'));
      } catch (error) {
        console.error("Error initializing timer:", error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeTimerState();
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('timer-started', fetchActiveTimer as EventListener);
      window.removeEventListener('timer-paused', fetchActiveTimer as EventListener);
      window.removeEventListener('timer-resumed', fetchActiveTimer as EventListener);
      window.removeEventListener('timer-stopped', fetchActiveTimer as EventListener);
    };
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

  // Loading all tasks to provide task name lookup
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const { tasks: loadedTasks } = await taskService.loadTasks();
        setTasks(loadedTasks);
      } catch (error) {
        console.error('Error loading tasks for timer context:', error);
      }
    };
    
    if (userId) {
      loadTasks();
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

  // Function to get active task name
  const getActiveTaskName = () => {
    if (!activeTimeEntry) return null;
    const task = tasks.find(t => t.id === activeTimeEntry.taskId);
    return task ? task.name : null;
  };

  return (
    <TimerContext.Provider value={{
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
    }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimerContext = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimerContext must be used within a TimerProvider');
  }
  return context;
};
