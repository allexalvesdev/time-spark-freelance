
import { Task } from '@/types';
import { useUnifiedTimerState } from '@/hooks/timer/useUnifiedTimerState';

interface UseTaskTimerStateOptions {
  task: Task;
}

export const useTaskTimerState = ({ task }: UseTaskTimerStateOptions) => {
  const { 
    displaySeconds, 
    setDisplaySeconds, 
    isTimerRunning: isUnifiedTimerRunning,
    isTimerPaused: isUnifiedTimerPaused,
    activeTimer 
  } = useUnifiedTimerState({ taskId: task.id });
  
  // Check if this specific task has the active timer
  const isTimerRunning = activeTimer?.taskId === task.id;
  const isTimerPaused = isTimerRunning && activeTimer?.isPaused;
  
  // If this task doesn't have the active timer, show stored elapsed time
  const finalDisplaySeconds = isTimerRunning ? displaySeconds : (task.elapsedTime || 0);
  
  return {
    displaySeconds: finalDisplaySeconds,
    setDisplaySeconds,
    isTimerRunning,
    isTimerPaused
  };
};
