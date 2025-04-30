
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
      
      if (task) {
        const startTime = new Date(timeEntry.startTime);
        const endTime = new Date(timeEntry.endTime || new Date());
        const duration = timeEntry.duration || Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        
        const updatedTask: Task = {
          ...task,
          completed: true,
          actualEndTime: endTime,
          actualStartTime: task.actualStartTime || startTime,
          elapsedTime: (task.elapsedTime || 0) + duration,
        };
        
        window.dispatchEvent(new CustomEvent('task-completed', { 
          detail: { taskId, updatedTask } 
        }));
        
        await taskService.updateTask(updatedTask);
        
        const timeFormatted = formatDuration(updatedTask.elapsedTime);
        toast({
          title: 'Tarefa concluída',
          description: `Tempo registrado: ${timeFormatted}`,
        });
        
        return updatedTask;
      }
      return null;
    } catch (taskError) {
      console.error('Failed to complete task:', taskError);
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
