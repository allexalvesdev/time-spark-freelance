
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
        
        // Garante que estamos usando a duração do timeEntry quando disponível ou calculamos
        const duration = timeEntry.duration || Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        
        // Acumula o tempo total da tarefa corretamente
        const updatedTask: Task = {
          ...task,
          completed: true,
          actualEndTime: endTime,
          // Garante que temos um tempo de início
          actualStartTime: task.actualStartTime || startTime,
          // Importante: Somamos o tempo atual com o que já existia anteriormente
          elapsedTime: (task.elapsedTime || 0) + duration,
        };
        
        console.log('Completando tarefa:', {
          taskId,
          duração: duration,
          tempoAnterior: task.elapsedTime || 0,
          tempoTotal: updatedTask.elapsedTime,
          início: updatedTask.actualStartTime,
          fim: updatedTask.actualEndTime
        });
        
        // Dispara evento para outros componentes saberem que a tarefa foi concluída
        window.dispatchEvent(new CustomEvent('task-completed', { 
          detail: { taskId, updatedTask } 
        }));
        
        // Persiste no banco de dados
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
