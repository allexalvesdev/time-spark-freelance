
import { useCallback } from 'react';
import { Task, TimeEntry } from '@/types';
import { useTimerCore } from './timer/useTimerCore';
import { useTaskCompletion } from './timer/useTaskCompletion';
import { useTimerDisplay } from './timer/useTimerDisplay';

/**
 * Primary hook for timer management functionality
 * Acts as a composition layer for more specific timer-related hooks
 */
export const useTimerManagement = (userId: string, tasks: Task[] = []) => {
  const {
    timeEntries,
    setTimeEntries,
    activeTimeEntry,
    setActiveTimeEntry,
    startTimeEntry,
    stopTimeEntry
  } = useTimerCore(userId);

  const { completeTask } = useTaskCompletion(tasks);
  const { getActiveTaskName: getTaskNameInternal } = useTimerDisplay(tasks);
  
  // Enhanced start timer that integrates with the timer state system
  const startTimer = useCallback(async (taskId: string, projectId: string) => {
    try {
      const newTimeEntry = await startTimeEntry(taskId, projectId);
      return newTimeEntry;
    } catch (error) {
      console.error('Error starting timer:', error);
      throw error;
    }
  }, [startTimeEntry]);
  
  // Enhanced stop timer that handles task completion
  const stopTimer = useCallback(async (completeTaskFlag: boolean = false) => {
    try {
      const stoppedEntry = await stopTimeEntry(false);
      
      if (stoppedEntry && completeTaskFlag) {
        await completeTask(stoppedEntry);
      }
      
      return stoppedEntry;
    } catch (error) {
      console.error('Error stopping timer:', error);
      throw error;
    }
  }, [stopTimeEntry, completeTask]);
  
  // Get active task name wrapper
  const getActiveTaskName = useCallback(() => {
    return getTaskNameInternal(activeTimeEntry);
  }, [getTaskNameInternal, activeTimeEntry]);

  return {
    timeEntries,
    setTimeEntries,
    activeTimeEntry,
    setActiveTimeEntry,
    startTimer,
    stopTimer,
    getActiveTaskName,
  };
};

export default useTimerManagement;
