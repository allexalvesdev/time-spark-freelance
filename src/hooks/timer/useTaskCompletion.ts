
import { useCallback } from 'react';
import { Task, TimeEntry } from '@/types';
import { taskService } from '@/services';
import { useToast } from '@/hooks/use-toast';
import { formatDuration } from '@/utils/dateUtils';

/**
 * Hook for handling task completion functionality
 */
export const useTaskCompletion = (tasks: Task[]) => {
  const { toast } = useToast();

  const completeTask = useCallback(async (timeEntry: TimeEntry) => {
    try {
      const taskId = timeEntry.taskId;
      const { tasks: currentTasks } = await taskService.loadTasks();
      const task = currentTasks.find(t => t.id === taskId);
      
      if (!task) {
        console.error(`[useTaskCompletion] Task not found with id: ${taskId}`);
        return null;
      }
      
      // Get the timing information from the time entry
      const startTime = new Date(timeEntry.startTime);
      const endTime = timeEntry.endTime || new Date();
      
      // Use the duration from the time entry when available or calculate it
      const duration = timeEntry.duration || 
                       Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      console.log('[useTaskCompletion] Time accumulated in entry:', {
        duration,
        previousTime: task.elapsedTime || 0,
        timeEntryId: timeEntry.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });
      
      // Calculate the accumulated time correctly
      const newElapsedTime = (task.elapsedTime || 0) + duration;
      
      console.log('[useTaskCompletion] Completing task with new elapsed time:', newElapsedTime);
      
      // Update the task as complete with the accumulated time
      const updatedTask: Task = {
        ...task,
        completed: true,
        actualEndTime: endTime,
        // Ensure we have a start time
        actualStartTime: task.actualStartTime || startTime,
        // Important: Add the current time to what already existed previously
        elapsedTime: newElapsedTime,
      };
      
      console.log('[useTaskCompletion] Completing task:', {
        taskId,
        duration,
        previousTime: task.elapsedTime || 0,
        totalTime: updatedTask.elapsedTime,
        start: updatedTask.actualStartTime,
        end: updatedTask.actualEndTime
      });
      
      // Persist to database before dispatching event
      await taskService.updateTask(updatedTask);
      
      // Dispatch event for other components to know the task was completed
      window.dispatchEvent(new CustomEvent('task-completed', { 
        detail: { taskId, updatedTask } 
      }));
      
      const timeFormatted = formatDuration(updatedTask.elapsedTime);
      toast({
        title: 'Tarefa concluída',
        description: `Tempo registrado: ${timeFormatted}`,
      });
      
      return updatedTask;
    } catch (taskError) {
      console.error('[useTaskCompletion] Failed to complete task:', taskError);
      toast({
        title: 'Aviso',
        description: 'O timer foi parado mas não foi possível finalizar a tarefa automaticamente.',
        variant: 'default',
      });
      return null;
    }
  }, [tasks, toast]);

  return { completeTask };
};
