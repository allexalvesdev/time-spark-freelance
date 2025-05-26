import { useMemo } from 'react';
import { Task } from '@/types';
import { useDatabaseTimer } from '@/hooks/useDatabaseTimer';

interface UseTaskTimerStateOptions {
  task: Task;
}

export const useTaskTimerState = ({ task }: UseTaskTimerStateOptions) => {
  const { 
    realTimeSeconds, 
    activeTimer 
  } = useDatabaseTimer();
  
  // Memoize calculations to prevent unnecessary re-renders
  const timerState = useMemo(() => {
    // Check if this specific task has the active timer
    const isTimerRunning = activeTimer?.taskId === task.id;
    const isTimerPaused = isTimerRunning && activeTimer?.isPaused;
    
    // If this task has the active timer, show real-time seconds when running, elapsed when paused
    // Otherwise, show stored elapsed time from task
    const displaySeconds = isTimerRunning 
      ? (activeTimer.isPaused ? activeTimer.elapsedSeconds : realTimeSeconds)
      : (task.elapsedTime || 0);
    
    return {
      displaySeconds,
      isTimerRunning,
      isTimerPaused
    };
  }, [task.id, task.elapsedTime, activeTimer?.taskId, activeTimer?.isPaused, activeTimer?.elapsedSeconds, realTimeSeconds]);
  
  return timerState;
};
