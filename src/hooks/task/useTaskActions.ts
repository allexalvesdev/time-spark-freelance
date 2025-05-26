
import { Task } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { useDatabaseTimer } from '@/hooks/useDatabaseTimer';

interface UseTaskActionsOptions {
  task: Task;
  projectId: string;
  isTimerRunning: boolean;
  activeTimer: any;
  setDisplaySeconds: (seconds: number) => void;
}

export const useTaskActions = ({ 
  task, 
  projectId, 
  isTimerRunning, 
  activeTimer,
  setDisplaySeconds 
}: UseTaskActionsOptions) => {
  const { deleteTask } = useAppContext();
  const { startTimer, pauseTimer, resumeTimer, stopTimer } = useDatabaseTimer();

  const handleStartTimer = async () => {
    try {
      await startTimer(task.id, projectId);
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };
  
  const handlePauseTimer = async () => {
    try {
      // Immediately freeze display at current elapsed time for instant feedback
      if (activeTimer) {
        console.log(`Task ${task.id} - Immediate pause, freezing at:`, activeTimer.elapsedSeconds);
        setDisplaySeconds(activeTimer.elapsedSeconds);
      }
      await pauseTimer();
    } catch (error) {
      console.error('Error pausing timer:', error);
    }
  };
  
  const handleResumeTimer = async () => {
    try {
      await resumeTimer();
    } catch (error) {
      console.error('Error resuming timer:', error);
    }
  };
  
  const handleStopTimer = async () => {
    try {
      await stopTimer(true);
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  };
  
  const handleDeleteTask = async () => {
    try {
      if (isTimerRunning) {
        await stopTimer(false);
      }
      if (task.id && deleteTask) {
        await deleteTask(task.id);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
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
