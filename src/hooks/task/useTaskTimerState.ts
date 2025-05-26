
import { useMemo, useState } from 'react';
import { Task } from '@/types';
import { useDatabaseTimer } from '@/hooks/useDatabaseTimer';

interface UseTaskTimerStateOptions {
  task: Task;
}

export const useTaskTimerState = ({ task }: UseTaskTimerStateOptions) => {
  const { displaySeconds, isPaused, isActive, timerId } = useDatabaseTimer();
  const [localDisplaySeconds, setLocalDisplaySeconds] = useState(0);
  
  // Use useMemo to prevent unnecessary recalculations
  const timerState = useMemo(() => {
    // Check if this specific task has the active timer
    const isTimerRunning = timerId === task.id;
    const isTimerPaused = isTimerRunning && isPaused;
    
    // If this task doesn't have the active timer, show stored elapsed time
    const finalDisplaySeconds = isTimerRunning ? displaySeconds : (task.elapsedTime || 0);
    
    return {
      displaySeconds: finalDisplaySeconds,
      isTimerRunning,
      isTimerPaused
    };
  }, [displaySeconds, isPaused, isActive, timerId, task.id, task.elapsedTime]);
  
  return {
    ...timerState,
    setDisplaySeconds: setLocalDisplaySeconds
  };
};
