
import { useState } from 'react';
import { TimeEntry, Task } from '@/types';
import { useDatabaseTimer } from './useDatabaseTimer';

export const useTimerManagement = (userId: string, tasks: Task[] = []) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activeTimeEntry, setActiveTimeEntry] = useState<TimeEntry | null>(null);

  // Use the unified database timer system
  const { 
    activeTimer, 
    startTimer: dbStartTimer, 
    pauseTimer: dbPauseTimer, 
    resumeTimer: dbResumeTimer, 
    stopTimer: dbStopTimer 
  } = useDatabaseTimer();

  // Wrapper functions to maintain compatibility
  const startTimer = async (taskId: string, projectId: string) => {
    return await dbStartTimer(taskId, projectId);
  };

  const pauseTimer = async () => {
    return await dbPauseTimer();
  };

  const resumeTimer = async () => {
    return await dbResumeTimer();
  };

  const stopTimer = async (completeTask: boolean = false) => {
    return await dbStopTimer(completeTask);
  };

  // Function to get the name of the currently active task
  const getActiveTaskName = (): string | null => {
    if (!activeTimer) return null;
    
    const taskId = activeTimer.taskId;
    const task = tasks.find(t => t.id === taskId);
    return task ? task.name : null;
  };

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
