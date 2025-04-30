
import { useState } from 'react';
import { Task, TaskPriority } from '@/types';
import { taskService } from '@/services';
import { useToast } from '@/hooks/use-toast';
import { calculateElapsedTime } from '@/utils/dateUtils';

export const useTasks = (userId: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const { toast } = useToast();

  const addTask = async (taskData: Omit<Task, 'id' | 'completed' | 'actualStartTime' | 'actualEndTime' | 'elapsedTime' | 'userId' | 'tags'>) => {
    try {
      const newTask = await taskService.createTask({ 
        ...taskData, 
        userId 
      });
      setTasks(prev => [newTask, ...prev]);
      setCurrentTask(newTask);
      return newTask;
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a tarefa. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateTask = async (task: Task) => {
    try {
      console.log('Updating task:', task);
      await taskService.updateTask(task);
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
      setCurrentTask(prev => prev?.id === task.id ? task : prev);
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a tarefa. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const completeTask = async (taskId: string) => {
    try {
      console.log('Completing task:', taskId);
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        console.error('Task not found for completion:', taskId);
        return;
      }

      const now = new Date();
      const updatedTask: Task = {
        ...task,
        completed: true,
        actualEndTime: now,
        actualStartTime: task.actualStartTime || task.scheduledStartTime,
        elapsedTime: task.actualStartTime 
          ? calculateElapsedTime(task.actualStartTime, now)
          : (task.elapsedTime || 0)
      };

      console.log('Updated task for completion:', updatedTask);
      await updateTask(updatedTask);
      
      // Dispatch event for task completion
      const event = new CustomEvent('task-completed', {
        detail: { taskId, updatedTask }
      });
      window.dispatchEvent(event);
      
      toast({
        title: 'Tarefa concluída',
        description: 'A tarefa foi finalizada com sucesso.',
      });
    } catch (error: any) {
      console.error('Error completing task:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível concluir a tarefa. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setCurrentTask(prev => prev?.id === taskId ? null : prev);
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a tarefa. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    tasks,
    setTasks,
    currentTask,
    setCurrentTask,
    addTask,
    updateTask,
    completeTask,
    deleteTask,
  };
};
