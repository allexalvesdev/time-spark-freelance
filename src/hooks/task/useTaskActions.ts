
import { Task } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { useDatabaseTimer } from '@/hooks/useDatabaseTimer';

interface UseTaskActionsOptions {
  task: Task;
  projectId: string;
  isTimerRunning: boolean;
}

export const useTaskActions = ({ 
  task, 
  projectId, 
  isTimerRunning
}: UseTaskActionsOptions) => {
  const { deleteTask } = useAppContext();
  const { startTimer, pauseTimer, resumeTimer, stopTimer } = useDatabaseTimer();

  const handleStartTimer = async () => {
    try {
      console.log('[TaskActions] Starting timer for task:', task.id);
      await startTimer(task.id, projectId);
    } catch (error) {
      console.error('[TaskActions] Error starting timer:', error);
    }
  };
  
  const handlePauseTimer = async () => {
    try {
      console.log('[TaskActions] Pausing timer for task:', task.id);
      await pauseTimer();
    } catch (error) {
      console.error('[TaskActions] Error pausing timer:', error);
    }
  };
  
  const handleResumeTimer = async () => {
    try {
      console.log('[TaskActions] Resuming timer for task:', task.id);
      await resumeTimer();
    } catch (error) {
      console.error('[TaskActions] Error resuming timer:', error);
    }
  };
  
  const handleStopTimer = async () => {
    try {
      console.log('[TaskActions] Stopping timer for task:', task.id);
      await stopTimer(true);
    } catch (error) {
      console.error('[TaskActions] Error stopping timer:', error);
    }
  };
  
  const handleDeleteTask = async () => {
    try {
      if (isTimerRunning) {
        console.log('[TaskActions] Stopping timer before deleting task:', task.id);
        await stopTimer(false);
      }
      if (task.id && deleteTask) {
        await deleteTask(task.id);
      }
    } catch (error) {
      console.error('[TaskActions] Error deleting task:', error);
    }
  };

  return {
    handleStartTimer,
    handlePauseTimer,
    handleResumeTimer,
    handleStopTimer,
    handleDeleteTask
  };
};
