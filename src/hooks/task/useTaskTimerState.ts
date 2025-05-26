
import { useState, useEffect } from 'react';
import { Task } from '@/types';
import { useDatabaseTimer } from '@/hooks/useDatabaseTimer';

interface UseTaskTimerStateOptions {
  task: Task;
}

export const useTaskTimerState = ({ task }: UseTaskTimerStateOptions) => {
  const { activeTimer, realTimeSeconds } = useDatabaseTimer();
  const [displaySeconds, setDisplaySeconds] = useState(0);
  
  // Check if this task has the active timer
  const isTimerRunning = activeTimer?.taskId === task.id;
  const isTimerPaused = isTimerRunning && activeTimer?.isPaused;
  
  // Update display seconds based on timer state
  useEffect(() => {
    if (isTimerRunning && activeTimer) {
      if (activeTimer.isPaused) {
        // When paused, show the exact elapsed seconds from database and NEVER update
        setDisplaySeconds(activeTimer.elapsedSeconds);
      } else {
        // When running, show real-time seconds that update every second
        setDisplaySeconds(realTimeSeconds);
      }
    } else {
      // If not the active timer, show stored elapsed time
      setDisplaySeconds(task.elapsedTime || 0);
    }
  }, [isTimerRunning, realTimeSeconds, task.elapsedTime, activeTimer?.elapsedSeconds, activeTimer?.isPaused]);

  return {
    displaySeconds,
    setDisplaySeconds,
    isTimerRunning,
    isTimerPaused
  };
};
