
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Task } from '@/types';
import { taskService } from '@/services';
import { useToast } from '@/hooks/use-toast';
import { calculateElapsedTime } from '@/utils/dateUtils';

interface TasksContextType {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  currentTask: Task | null;
  setCurrentTask: (task: Task | null) => void;
  addTask: (task: Omit<Task, 'id' | 'userId' | 'completed'>) => Promise<Task>;
  updateTask: (task: Task) => Promise<void>;
  completeTask: (taskId: string, duration?: number) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const TasksProvider: React.FC<{ children: ReactNode; userId: string }> = ({ 
  children, 
  userId 
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const { toast } = useToast();

  // Listen for task-completed events to update global task list
  useEffect(() => {
    const handleTaskCompleted = (event: CustomEvent) => {
      const { taskId, updatedTask } = event.detail;
      
      // Update tasks state with the completed task
      setTasks(currentTasks => 
        currentTasks.map(t => t.id === taskId ? updatedTask : t)
      );
    };
    
    window.addEventListener('task-completed', handleTaskCompleted as EventListener);
    
    return () => {
      window.removeEventListener('task-completed', handleTaskCompleted as EventListener);
    };
  }, [setTasks]);

  // Load tasks when the component mounts
  useEffect(() => {
    if (!userId) return;

    const loadTasks = async () => {
      try {
        const { tasks: tasksData } = await taskService.loadTasks();
        setTasks(tasksData);
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    };

    loadTasks();
  }, [userId]);

  const addTask = async (taskData: Omit<Task, 'id' | 'userId'>) => {
    try {
      console.log('Adding task with data:', taskData);
      
      // Create the task with the right completion status and timing data
      const taskToCreate = {
        ...taskData,
        userId
      };
      
      // If task has end time and is marked as completed, ensure all timing data is set
      if (taskData.completed && taskData.actualEndTime) {
        if (!taskData.actualStartTime) {
          taskToCreate.actualStartTime = taskData.scheduledStartTime;
        }
        
        if (!taskData.elapsedTime && taskData.actualStartTime) {
          taskToCreate.elapsedTime = calculateElapsedTime(
            taskData.actualStartTime, 
            taskData.actualEndTime
          );
        }
      }
      
      const newTask = await taskService.createTask(taskToCreate);
      
      // Ensure that the priority is a valid value
      const typedTask: Task = {
        ...newTask,
        priority: newTask.priority as 'Baixa' | 'Média' | 'Alta' | 'Urgente'
      };
      
      setTasks(prev => [typedTask, ...prev]);
      setCurrentTask(typedTask);
      return typedTask;
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

      // Use scheduledStartTime as fallback when actualStartTime is not set
      const startTime = task.actualStartTime || task.scheduledStartTime;
      const endTime = new Date();
      
      const updatedTask: Task = {
        ...task,
        completed: true,
        actualEndTime: endTime,
        actualStartTime: startTime, // Use the determined start time
        elapsedTime: startTime 
          ? calculateElapsedTime(startTime, endTime)
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

  return (
    <TasksContext.Provider value={{
      tasks,
      setTasks,
      currentTask,
      setCurrentTask,
      addTask,
      updateTask,
      completeTask,
      deleteTask
    }}>
      {children}
    </TasksContext.Provider>
  );
};

export const useTasksContext = () => {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error('useTasksContext must be used within a TasksProvider');
  }
  return context;
};
