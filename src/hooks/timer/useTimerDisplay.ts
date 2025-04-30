
import { useCallback } from 'react';
import { Task, TimeEntry } from '@/types';

/**
 * Hook for timer display-related functionality
 */
export const useTimerDisplay = (tasks: Task[] = []) => {
  const getActiveTaskName = useCallback((activeTimeEntry: TimeEntry | null): string | null => {
    if (!activeTimeEntry) return null;
    
    const taskId = activeTimeEntry.taskId;
    const task = tasks.find(t => t.id === taskId);
    return task ? task.name : null;
  }, [tasks]);

  return { getActiveTaskName };
};
