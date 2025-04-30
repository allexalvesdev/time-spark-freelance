
import { useCallback } from 'react';
import { TimeEntry } from '@/types';

type TimeServicesProps = {
  startStoredTimeEntry: (taskId: string, projectId: string) => Promise<TimeEntry>;
  stopStoredTimeEntry: (completeTaskFlag: boolean) => Promise<TimeEntry | null>;
  tasks: any[];
};

/**
 * Hook for time-related services that integrates with the global timer system
 */
export const useTimeServices = ({
  startStoredTimeEntry,
  stopStoredTimeEntry,
  tasks,
}: TimeServicesProps) => {
  
  const startTimer = useCallback(async (taskId: string, projectId: string) => {
    try {
      // Start the time entry in the database
      const timeEntry = await startStoredTimeEntry(taskId, projectId);
      
      console.log('Timer started for task:', taskId);
      return timeEntry;
    } catch (error) {
      console.error('Error starting timer:', error);
      throw error;
    }
  }, [startStoredTimeEntry]);
  
  const stopTimer = useCallback(async (completeTaskFlag: boolean = false) => {
    try {
      console.log('Stopping timer, completeTask flag:', completeTaskFlag);
      
      // Stop the time entry and optionally complete the task
      const stoppedEntry = await stopStoredTimeEntry(completeTaskFlag);
      
      if (stoppedEntry) {
        console.log('Timer stopped for task:', stoppedEntry.taskId, 
          'Duration:', stoppedEntry.duration, 
          'Complete task:', completeTaskFlag);
      }
      
      return stoppedEntry;
    } catch (error) {
      console.error('Error stopping timer:', error);
      throw error;
    }
  }, [stopStoredTimeEntry]);
  
  const getActiveTaskName = useCallback((activeTimeEntry: TimeEntry | null): string | null => {
    if (!activeTimeEntry) return null;
    
    const taskId = activeTimeEntry.taskId;
    const task = tasks.find(task => task.id === taskId);
    return task ? task.name : null;
  }, [tasks]);
  
  return {
    startTimer,
    stopTimer,
    getActiveTaskName,
  };
};
