
import { useCallback } from 'react';
import { Task } from '@/types';

type TaskServicesProps = {
  addStoredTask: (task: Omit<Task, 'id' | 'completed' | 'actualStartTime' | 'actualEndTime' | 'elapsedTime' | 'userId' | 'tags'>) => Promise<Task>;
  updateStoredTask: (task: Task) => Promise<void>;
  completeStoredTask: (taskId: string) => Promise<void>;
  deleteStoredTask: (taskId: string) => Promise<void>;
  tasks: Task[];
};

export const useTaskServices = ({
  addStoredTask,
  updateStoredTask,
  completeStoredTask,
  deleteStoredTask,
  tasks,
}: TaskServicesProps) => {
  
  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'completed' | 'actualStartTime' | 'actualEndTime' | 'elapsedTime' | 'userId' | 'tags'>) => {
    try {
      return await addStoredTask(taskData);
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }, [addStoredTask]);
  
  const updateTask = useCallback(async (task: Task) => {
    try {
      await updateStoredTask(task);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }, [updateStoredTask]);
  
  const completeTask = useCallback(async (taskId: string) => {
    try {
      await completeStoredTask(taskId);
      
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const event = new CustomEvent('task-completed', {
          detail: { taskId: task.id, updatedTask: task },
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  }, [completeStoredTask, tasks]);
  
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await deleteStoredTask(taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }, [deleteStoredTask]);
  
  return {
    addTask,
    updateTask,
    completeTask,
    deleteTask,
  };
};
