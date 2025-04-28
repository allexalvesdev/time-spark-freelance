
import { useState } from 'react';
import { TimeEntry, Task } from '@/types';
import { timeEntryService, taskService } from '@/services';
import { useToast } from '@/hooks/use-toast';

export const useTimerManagement = (userId: string, tasks: Task[] = []) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activeTimeEntry, setActiveTimeEntry] = useState<TimeEntry | null>(null);
  const { toast } = useToast();

  const startTimer = async (taskId: string, projectId: string) => {
    try {
      if (activeTimeEntry) {
        await stopTimer(false);
      }

      const newTimeEntry = await timeEntryService.createTimeEntry({
        taskId,
        projectId,
        userId,
        startTime: new Date(),
        isRunning: true,
      });

      setTimeEntries(prev => [newTimeEntry, ...prev]);
      setActiveTimeEntry(newTimeEntry);
      
      // Store the active time entry ID globally for persistence
      localStorage.setItem('activeTimeEntryId', newTimeEntry.id);
      localStorage.setItem('activeTaskId', taskId);
      localStorage.setItem('timerStartTime', new Date().getTime().toString());
    } catch (error: any) {
      console.error('Error starting timer:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar o cronômetro. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const stopTimer = async (completeTask: boolean = true) => {
    try {
      if (!activeTimeEntry) return;

      const endTime = new Date();
      const startTime = new Date(activeTimeEntry.startTime);
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      const updatedTimeEntry: TimeEntry = {
        ...activeTimeEntry,
        endTime,
        duration,
        isRunning: false,
      };

      await timeEntryService.updateTimeEntry(updatedTimeEntry);

      setTimeEntries(prev => prev.map(entry => 
        entry.id === activeTimeEntry.id ? updatedTimeEntry : entry
      ));
      
      // If completeTask is true, also mark the task as completed
      if (completeTask) {
        try {
          const taskId = activeTimeEntry.taskId;
          
          // First, get the current task data
          const { tasks } = await taskService.loadTasks();
          const task = tasks.find(t => t.id === taskId);
          
          if (task) {
            const updatedTask: Task = {
              ...task,
              completed: true,
              actualEndTime: endTime,
              elapsedTime: (task.elapsedTime || 0) + duration,
            };
            
            // If task had no actual start time, set it to the time entry start time
            if (!updatedTask.actualStartTime) {
              updatedTask.actualStartTime = startTime;
            }
            
            await taskService.updateTask(updatedTask);
            
            toast({
              title: 'Tarefa concluída',
              description: `A tarefa foi marcada como concluída com ${duration} segundos registrados.`,
            });
          }
        } catch (taskError) {
          console.error('Failed to complete task:', taskError);
          toast({
            title: 'Aviso',
            description: 'O timer foi parado mas não foi possível finalizar a tarefa automaticamente.',
            variant: 'default',
          });
        }
      }

      setActiveTimeEntry(null);
      
      // Clear the storage when timer stops
      localStorage.removeItem('activeTimeEntryId');
      localStorage.removeItem('activeTaskId');
      localStorage.removeItem('timerStartTime');
      
      // Remove global timer key
      const taskId = activeTimeEntry.taskId;
      localStorage.removeItem(`timerIsRunning-global-timer-${taskId}`);
      localStorage.removeItem(`timerStartTime-global-timer-${taskId}`);
      localStorage.removeItem(`timerElapsedTime-global-timer-${taskId}`);
      
      // Also remove task-specific timer
      localStorage.removeItem(`timerIsRunning-task-${taskId}`);
      localStorage.removeItem(`timerStartTime-task-${taskId}`);
      localStorage.removeItem(`timerElapsedTime-task-${taskId}`);
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
  
  // Function to get the name of the currently active task
  const getActiveTaskName = (): string | null => {
    if (!activeTimeEntry) return null;
    
    const taskId = activeTimeEntry.taskId;
    const task = tasks.find(t => t.id === taskId);
    return task ? task.name : null;
  };

  return {
    timeEntries,
    setTimeEntries,
    activeTimeEntry,
    setActiveTimeEntry,
    startTimer,
    stopTimer,
    getActiveTaskName,
  };
};
