
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
      console.log('[useTimerManagement] Starting timer for task:', taskId);
      const newTimeEntry = await startTimeEntry(taskId, projectId);
      return newTimeEntry;
    } catch (error) {
      console.error('[useTimerManagement] Error starting timer:', error);
      throw error;
    }
  }, [startTimeEntry]);
  
  // Enhanced stop timer that handles task completion
  const stopTimer = useCallback(async (completeTaskFlag: boolean = false) => {
    try {
      console.log('[useTimerManagement] Stopping timer with completeTaskFlag:', completeTaskFlag);
      
      // Important: save relevant information before stopping
      const entryBeforeStop = activeTimeEntry ? {...activeTimeEntry} : null;
      
      // Stop the timer and get the completed entry
      const stoppedEntry = await stopTimeEntry();
      
      // If we want to complete the task and have a valid entry
      if (stoppedEntry && completeTaskFlag) {
        console.log('[useTimerManagement] Completing task after stopping timer:', { 
          taskId: stoppedEntry.taskId, 
          duration: stoppedEntry.duration 
        });
        
        // Complete the task passing the time entry
        await completeTask(stoppedEntry);
      } 
      // If the timer was stopped without a returned entry, but we have the previous active entry
      else if (!stoppedEntry && entryBeforeStop && completeTaskFlag) {
        console.log('[useTimerManagement] Using previous entry to complete task:', {
          taskId: entryBeforeStop.taskId
        });
        
        const now = new Date();
        const duration = Math.floor((now.getTime() - new Date(entryBeforeStop.startTime).getTime()) / 1000);
        
        // Try to complete the task with the entry we had before
        await completeTask({
          ...entryBeforeStop,
          endTime: now,
          isRunning: false,
          duration: duration
        });
      }
      
      return stoppedEntry;
    } catch (error) {
      console.error('[useTimerManagement] Error stopping timer:', error);
      throw error;
    }
  }, [stopTimeEntry, completeTask, activeTimeEntry]);
  
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
