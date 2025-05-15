
import { useState, useEffect } from 'react';
import { TimeEntry, Task } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { activeTimerService } from '@/services/activeTimerService';
import { useToast } from '@/hooks/use-toast';

// Import the activeTaskName hook
import { useActiveTaskName } from './timer/useActiveTaskName';

export const useTimerManagement = (userId: string, tasks: Task[] = []) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activeTimeEntry, setActiveTimeEntry] = useState<TimeEntry | null>(null);
  const { toast } = useToast();

  // Initialize by fetching active timer from server
  useEffect(() => {
    const fetchActiveTimer = async () => {
      try {
        const response = await activeTimerService.getActiveTimer();
        if (response && response.timeEntry) {
          setActiveTimeEntry(response.timeEntry);
        }
      } catch (error) {
        console.error("Error fetching active timer:", error);
      }
    };

    fetchActiveTimer();
    
    // Set up event listeners for timer events
    const handleTimerStarted = (e: CustomEvent) => {
      const { timeEntry } = e.detail;
      setActiveTimeEntry(timeEntry);
    };
    
    const handleTimerPaused = (e: CustomEvent) => {
      const { timeEntry } = e.detail;
      setActiveTimeEntry(timeEntry);
    };
    
    const handleTimerResumed = (e: CustomEvent) => {
      const { timeEntry } = e.detail;
      setActiveTimeEntry(timeEntry);
    };
    
    const handleTimerStopped = (e: CustomEvent) => {
      setActiveTimeEntry(null);
    };
    
    window.addEventListener('timer-started', handleTimerStarted as EventListener);
    window.addEventListener('timer-paused', handleTimerPaused as EventListener);
    window.addEventListener('timer-resumed', handleTimerResumed as EventListener);
    window.addEventListener('timer-stopped', handleTimerStopped as EventListener);
    
    return () => {
      window.removeEventListener('timer-started', handleTimerStarted as EventListener);
      window.removeEventListener('timer-paused', handleTimerPaused as EventListener);
      window.removeEventListener('timer-resumed', handleTimerResumed as EventListener);
      window.removeEventListener('timer-stopped', handleTimerStopped as EventListener);
    };
  }, [userId]);

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
      return await activeTimerService.startTimer(taskId, projectId, userId);
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
      return await activeTimerService.pauseTimer();
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
      return await activeTimerService.resumeTimer();
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
      return await activeTimerService.stopActiveTimer(completeTask);
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
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    getActiveTaskName,
  };
};
