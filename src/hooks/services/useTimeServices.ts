
import { useCallback } from 'react';
import { TimeEntry } from '@/types';

type TimeServicesProps = {
  startStoredTimeEntry: (taskId: string, projectId: string) => Promise<TimeEntry>;
  stopStoredTimeEntry: (completeTaskFlag: boolean) => Promise<TimeEntry | null>;
  tasks: any[];
};

export const useTimeServices = ({
  startStoredTimeEntry,
  stopStoredTimeEntry,
  tasks,
}: TimeServicesProps) => {
  
  const startTimer = useCallback(async (taskId: string, projectId: string) => {
    try {
      await startStoredTimeEntry(taskId, projectId);
    } catch (error) {
      console.error('Error starting timer:', error);
      throw error;
    }
  }, [startStoredTimeEntry]);
  
  const stopTimer = useCallback(async (completeTaskFlag: boolean = false) => {
    try {
      console.log('Stopping timer, completeTask flag:', completeTaskFlag);
      const stoppedEntry = await stopStoredTimeEntry(completeTaskFlag);
      
      // Make sure we complete the task if requested
      if (completeTaskFlag && stoppedEntry) {
        const taskId = stoppedEntry.taskId;
        console.log('Completing task after timer stop:', taskId);
      }
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
