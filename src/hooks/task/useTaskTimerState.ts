
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
  
  // Check if this specific task has the active timer
  const isTimerRunning = activeTimer?.taskId === task.id;
  const isTimerPaused = isTimerRunning && activeTimer?.isPaused;
  
  // If this task has the active timer, show real-time seconds when running, elapsed when paused
  // Otherwise, show stored elapsed time from task
  const displaySeconds = isTimerRunning 
    ? (activeTimer.isPaused ? activeTimer.elapsedSeconds : realTimeSeconds)
    : (task.elapsedTime || 0);
  
  console.log('[TaskTimerState] 📊 Timer state for task:', {
    taskId: task.id.slice(0, 8),
    isTimerRunning,
    isTimerPaused,
    displaySeconds,
    realTimeSeconds,
    taskElapsedTime: task.elapsedTime,
    activeTimerElapsed: activeTimer?.elapsedSeconds,
    'USING_DATABASE_TIMER_ONLY': true
  });
  
  return {
    displaySeconds,
    isTimerRunning,
    isTimerPaused
  };
};
