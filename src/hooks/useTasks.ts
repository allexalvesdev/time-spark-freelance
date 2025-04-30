
import { useState } from 'react';
import { Task } from '@/types';
import { taskService } from '@/services';
import { useToast } from '@/hooks/use-toast';
import { calculateElapsedTime } from '@/utils/dateUtils';

export const useTasks = (userId: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const { toast } = useToast();

  const addTask = async (taskData: Omit<Task, 'id' | 'completed' | 'actualStartTime' | 'actualEndTime' | 'elapsedTime' | 'userId'>) => {
    try {
      const newTask = await taskService.createTask({ 
        ...taskData, 
        userId 
      });
      
      // Garantir que a prioridade seja um valor válido
      const typedTask: Task = {
        ...newTask,
        priority: newTask.priority as 'Baixa' | 'Média' | 'Alta' | 'Urgente'
      };
      
      setTasks(prev => [typedTask, ...prev]);
      setCurrentTask(typedTask);
      return typedTask;
    } catch (error: any) {
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
      await taskService.updateTask(task);
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
      setCurrentTask(prev => prev?.id === task.id ? task : prev);
    } catch (error: any) {
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
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const updatedTask: Task = {
        ...task,
        completed: true,
        actualEndTime: new Date(),
        elapsedTime: task.actualStartTime 
          ? calculateElapsedTime(task.actualStartTime, new Date())
          : 0
      };

      await updateTask(updatedTask);
    } catch (error: any) {
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
