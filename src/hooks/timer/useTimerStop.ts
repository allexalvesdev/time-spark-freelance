
import { TimeEntry, Task } from '@/types';
import { timeEntryService, taskService } from '@/services';
import { useToast } from '@/hooks/use-toast';
import { getSafeInteger } from '@/utils/timer/safeInteger';
import { calculateDuration, calculateAdditionalPausedTime } from '@/utils/timer/durationCalculator';
import { clearTimerStorage } from '@/utils/timer/localStorage';
import { formatDuration } from '@/utils/dateUtils';

interface UseTimerStopOptions {
  timeEntries: TimeEntry[];
  setTimeEntries: React.Dispatch<React.SetStateAction<TimeEntry[]>>;
  activeTimeEntry: TimeEntry | null;
  setActiveTimeEntry: React.Dispatch<React.SetStateAction<TimeEntry | null>>;
  tasks: Task[];
}

export const useTimerStop = ({
  timeEntries,
  setTimeEntries,
  activeTimeEntry,
  setActiveTimeEntry,
  tasks
}: UseTimerStopOptions) => {
  const { toast } = useToast();

  const stopTimer = async (completeTask: boolean = true) => {
    try {
      if (!activeTimeEntry) return;

      const endTime = new Date();
      const startTime = new Date(activeTimeEntry.startTime);
      let duration = getSafeInteger(Math.floor((endTime.getTime() - startTime.getTime()) / 1000));
      
      // Subtract paused time from the total duration
      if (activeTimeEntry.pausedTime) {
        duration = getSafeInteger(duration - activeTimeEntry.pausedTime);
      }
      
      // If currently paused, calculate additional paused time
      if (activeTimeEntry.isPaused) {
        const pausedAt = parseInt(localStorage.getItem(`timerPausedAt-global-timer-${activeTimeEntry.taskId}`) || '0', 10);
        if (pausedAt > 0) {
          const additionalPausedTime = calculateAdditionalPausedTime(pausedAt);
          duration = getSafeInteger(duration - additionalPausedTime);
        }
      }

      const updatedTimeEntry: TimeEntry = {
        ...activeTimeEntry,
        endTime,
        duration,
        isRunning: false,
        isPaused: false,
      };

      await timeEntryService.updateTimeEntry(updatedTimeEntry);

      setTimeEntries(prev => Array.isArray(prev) 
        ? prev.map(entry => entry.id === activeTimeEntry.id ? updatedTimeEntry : entry)
        : [updatedTimeEntry]
      );
      
      // If completeTask is true, mark the task as completed
      if (completeTask) {
        await handleTaskCompletion(activeTimeEntry.taskId, endTime, duration);
      }

      setActiveTimeEntry(null);
      
      // Clear all timer-related localStorage entries
      clearTimerStorage(activeTimeEntry.taskId);
      
    } catch (error: any) {
      console.error('Error stopping timer:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível parar o cronômetro. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };
  
  const handleTaskCompletion = async (taskId: string, endTime: Date, duration: number) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      
      if (task) {
        // Use scheduledStartTime as fallback if actualStartTime is not available
        const taskStartTime = task.actualStartTime || task.scheduledStartTime;
        
        // Update the task with completed status - ensure elapsed time is safe
        const updatedTask: Task = {
          ...task,
          completed: true,
          actualEndTime: endTime,
          actualStartTime: taskStartTime, // Use the determined start time
          elapsedTime: getSafeInteger((task.elapsedTime || 0) + duration),
        };
        
        // Update the server first
        await taskService.updateTask(updatedTask);
        
        // After server update, dispatch event to update UI across the app
        window.dispatchEvent(new CustomEvent('task-completed', { 
          detail: { taskId, updatedTask } 
        }));
        
        const timeFormatted = formatDuration(updatedTask.elapsedTime);
        toast({
          title: 'Tarefa concluída',
          description: `Tempo registrado: ${timeFormatted}`,
        });
      }
    } catch (taskError) {
      console.error('Error completing task:', taskError);
      toast({
        title: 'Aviso',
        description: 'O timer foi parado mas não foi possível finalizar a tarefa automaticamente.',
        variant: 'default',
      });
    }
  };

  return { stopTimer };
};
